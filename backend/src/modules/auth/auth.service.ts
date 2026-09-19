import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const { childProfile, lgpdConsent, consentTimestamp, childPassword, ...userFields } = dto;
    const hashedPassword = await bcrypt.hash(userFields.password, 12);
    const user = await this.usersService.create({
      ...userFields,
      password: hashedPassword,
    });

    if (lgpdConsent) {
      await this.usersService.grantLgpdConsent(user.id);
    }

    if (childProfile && dto.role === 'guardian') {
      if (dto.childPassword) {
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
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    this.logger.log(`User logged in: ${user.email}`);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshToken(userId: string, email: string, role: string) {
    return this.generateTokens(userId, email, role);
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