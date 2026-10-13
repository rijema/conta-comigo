import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../users/enums/user-role.enum';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // Validate password format
    if (dto.password.length < 8) {
      const charsNeeded = 8 - dto.password.length;
      throw new BadRequestException(
        `A senha deve ter pelo menos 8 caracteres. Você precisa de mais ${charsNeeded} caractere(s).`
      );
    }

    if (dto.registrationNonce) {
      const existingByNonce = await this.usersService.findByRegistrationNonce(dto.registrationNonce);
      if (existingByNonce) {
        this.logger.warn(`Duplicate registration request detected for nonce ${dto.registrationNonce}; returning existing user`);
        const tokens = await this.generateTokens(existingByNonce.id, existingByNonce.email, existingByNonce.role);
        return { user: this.sanitizeUser(existingByNonce), ...tokens };
      }
    }

    const existing = await this.usersService.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException(
        `O e-mail ${normalizedEmail} já está cadastrado. Faça login ou use outro e-mail para criar uma nova conta.`
      );
    }

    const { childProfile, lgpdConsent, consentTimestamp, childPassword, registrationNonce, ...userFields } = dto;
    const hashedPassword = await bcrypt.hash(userFields.password, 12);
    const user = await this.usersService.create({
      ...userFields,
      email: normalizedEmail,
      password: hashedPassword,
      registrationNonce,
    });

    if (lgpdConsent) {
      await this.usersService.grantLgpdConsent(user.id);
    }

    if (childProfile && dto.role === 'guardian') {
      if (dto.childPassword) {
        if (dto.childPassword.length < 4) {
          throw new BadRequestException(
            `A senha da criança deve ter pelo menos 4 caracteres. Você precisa de mais ${4 - dto.childPassword.length} caractere(s).`
          );
        }
        const childHash = await bcrypt.hash(dto.childPassword, 12);
        const childUser = await this.usersService.createChildAccount(
          user.id,
          childProfile.name,
          childHash,
          childProfile.age,
        );
        this.logger.log(`Child account created: ${childUser.email} linked to guardian ${user.email}`);
      } else {
        await this.usersService.updateChildProfile(user.id, childProfile);
      }
    }

    this.logger.log(`New user registered: ${user.email} [${user.role}]`);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    let user = dto.email
      ? await this.usersService.findByEmail(dto.email)
      : null;

    if (!user && dto.childName && dto.guardianEmail) {
      user = await this.usersService.findChildByNameAndGuardianEmail(
        dto.childName,
        dto.guardianEmail,
      );
    }

    if (!user) {
      if (dto.email) {
        throw new UnauthorizedException(
          `Não encontramos uma conta com o e-mail ${dto.email}. Verifique se o e-mail está correto ou crie uma nova conta.`
        );
      } else {
        throw new UnauthorizedException(
          `Nenhuma criança encontrada com esse nome e e-mail do responsável. Verifique os dados e tente novamente.`
        );
      }
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException(
        `A senha está incorreta. Verifique sua senha e tente novamente. Se esqueceu a senha, use a opção "Recuperar senha".`
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Sua conta foi desativada. Entre em contato com o suporte (privacidade@contacomigo.com) para mais informações.'
      );
    }

    this.logger.log(`User logged in: ${user.email}`);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshToken(userId: string, email: string, role: string) {
    return this.generateTokens(userId, email, role);
  }

  buildGoogleAuthUrl() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      throw new BadRequestException('Google login is not configured');
    }

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    return url.toString();
  }

  getFrontendAuthRedirectUrl() {
    return this.configService.get<string>('FRONTEND_AUTH_CALLBACK_URL', 'http://localhost:3000/pt/dashboard');
  }

  async loginWithGoogleCode(code: string) {
    if (!code) {
      throw new BadRequestException('Google authorization code is required');
    }

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Google login is not configured');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Google login failed during token exchange');
    }

    const tokenData: any = await tokenResponse.json();
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new UnauthorizedException('Google login failed while loading profile');
    }

    const profile: any = await profileResponse.json();
    const email = profile.email;
    const googleId = profile.sub;
    const name = profile.name || profile.given_name || 'Usuário Google';

    if (!email || !googleId) {
      throw new UnauthorizedException('Google profile did not return the expected identifiers');
    }

    let user = await this.usersService.findByExternalAuthId(googleId);
    if (!user) {
      user = await this.usersService.findByEmail(email);
    }

    if (!user) {
      user = await this.usersService.create({
        name,
        email,
        password: await bcrypt.hash(randomUUID(), 12),
        role: UserRole.GUARDIAN,
      });
      // Do NOT auto-grant LGPD consent here: the user has not seen or
      // accepted the Consent Term yet. The frontend must block usage and
      // present the term after this redirect, calling
      // POST /users/:id/lgpd-consent once the user explicitly accepts.
      user = await this.usersService.attachExternalAuth(user.id, 'google', googleId);
    } else if (!user.externalAuthId) {
      user = await this.usersService.attachExternalAuth(user.id, 'google', googleId);
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // GET /auth/me needs the full user record (including lgpdConsentGiven)
  // so the frontend can detect accounts that still need to accept the
  // Consent Term (e.g. right after a Google OAuth signup). The JWT payload
  // itself only carries {userId, email, role}, so we look the user up again.
  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async createAutbotBridgeToken(userId: string, childId?: string) {
    const requester = await this.usersService.findById(userId);
    if (!requester || !requester.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    let subjectUser = requester;

    if (childId) {
      if (requester.role !== UserRole.GUARDIAN) {
        throw new UnauthorizedException('Only guardians can bridge as a child');
      }

      const child = await this.usersService.findById(childId);
      if (!child || child.role !== UserRole.CHILD) {
        throw new UnauthorizedException('Child not found');
      }

      const childProfile = await this.usersService.getChildProfile(child.id);
      if (childProfile.guardianId !== requester.id) {
        throw new UnauthorizedException('Child does not belong to this guardian');
      }

      subjectUser = child;
    }

    const bridgeSecret = this.configService.get<string>('AUTBOT_BRIDGE_SECRET');
    if (!bridgeSecret) {
      throw new UnauthorizedException('AutBot bridge secret is not configured');
    }

    const displayName = subjectUser.name;
    const externalAuthId = `${requester.id}:${subjectUser.id}`;
    const token = await this.jwtService.signAsync(
      {
        sub: externalAuthId,
        contaComigoUserId: requester.id,
        contaComigoSubjectUserId: subjectUser.id,
        email: subjectUser.email,
        name: displayName,
        role: subjectUser.role,
      },
      {
        secret: bridgeSecret,
        expiresIn: this.configService.get('AUTBOT_BRIDGE_EXPIRES_IN', '5m'),
      },
    );

    return { token };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '1h'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { password, ...rest } = user;
    return rest;
  }
}