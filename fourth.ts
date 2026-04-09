Status Answer + Remaining Files

📍 WHERE ARE WE IN THE PRODUCT?
We are still in the backend + ML service layer — approximately 60-70% done with the full system. Here's the breakdown:
LayerStatusNestJS Backend (Auth, Users, Activities, Analytics, ADE core)~70% generatedPython ML Service (BKT, Engagement)~80% generatedPostgreSQL Schema + Kafka events~90% generatedNext.js Frontend0% — not yet startedDocker / Deployment configs~40%i18n, LGPD, Observability wiring~30%
💰 Cost Estimate
This is a large system. Remaining interactions needed:

Message 3 (this one): Remaining backend files + ML service completion
Message 4: Full Next.js frontend (learner portal, guardian, educator)
Message 5: Deployment, Docker, env vars, README, academic documentation

Recommendation: I'll be dense and complete in each message to minimize total count. Let's proceed.

MESSAGE 3 — Remaining Backend + ML Service Files

Copy📁 FILE: backend/src/modules/auth/strategies/jwt.strategy.ts
typescriptCopyimport { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}

Copy📁 FILE: backend/src/modules/auth/guards/roles.guard.ts
typescriptCopyimport {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const hasRole = requiredRoles.includes(user?.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

Copy📁 FILE: backend/src/modules/auth/decorators/roles.decorator.ts
typescriptCopyimport { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/enums/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

Copy📁 FILE: backend/src/modules/auth/decorators/current-user.decorator.ts
typescriptCopyimport { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

Copy📁 FILE: backend/src/modules/auth/auth.service.ts
typescriptCopyimport {
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

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    this.logger.log(`New user registered: ${user.email} [${user.role}]`);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
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

Copy📁 FILE: backend/src/modules/auth/dto/register.dto.ts
typescriptCopyimport {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/enums/user-role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'joao@escola.edu.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senhaSegura123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.GUARDIAN })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  language?: string;
}

Copy📁 FILE: backend/src/modules/auth/dto/login.dto.ts
typescriptCopyimport { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'joao@escola.edu.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senhaSegura123' })
  @IsString()
  password: string;
}

Copy📁 FILE: backend/src/modules/auth/auth.controller.ts
typescriptCopyimport {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login and receive JWT tokens' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: any) {
    return user;
  }
}

Copy📁 FILE: backend/src/modules/auth/guards/jwt-auth.guard.ts
typescriptCopyimport { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

Copy📁 FILE: backend/src/modules/auth/auth.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

Copy📁 FILE: backend/src/modules/users/enums/user-role.enum.ts
typescriptCopyexport enum UserRole {
  CHILD = 'child',
  GUARDIAN = 'guardian',
  PROFESSIONAL = 'professional',
  ADMIN = 'admin',
}

Copy📁 FILE: backend/src/modules/users/entities/user.entity.ts
typescriptCopyimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { ChildProfile } from './child-profile.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.GUARDIAN })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  lgpdConsentGiven: boolean;

  @Column({ nullable: true })
  lgpdConsentDate: Date;

  @Column({ default: 'pt-BR' })
  language: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @OneToOne(() => ChildProfile, (profile) => profile.user, {
    cascade: true,
    nullable: true,
  })
  childProfile?: ChildProfile;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

Copy📁 FILE: backend/src/modules/users/entities/child-profile.entity.ts
typescriptCopyimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('child_profiles')
export class ChildProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.childProfile)
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  schoolYear: number; // 1-5 (Anos Iniciais)

  @Column({ nullable: true })
  asdSupportLevel: string; // mild, moderate, strong

  // Ontology-derived fields (LASDONT)
  @Column({ type: 'jsonb', nullable: true })
  strengths: {
    visual?: boolean;
    auditive?: boolean;
    logical?: boolean;
    motor?: boolean;
    sensory?: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  weaknesses: {
    visual?: boolean;
    auditive?: boolean;
    logical?: boolean;
    motor?: boolean;
    sensory?: boolean;
  };

  // Sensory / UI preferences
  @Column({ type: 'jsonb', nullable: true })
  uiPreferences: {
    lowStimulation?: boolean;
    highContrast?: boolean;
    fontSize?: 'small' | 'medium' | 'large';
    animationsEnabled?: boolean;
    soundEnabled?: boolean;
    preferredModality?: 'visual' | 'auditive' | 'mixed';
  };

  // BKT skill mastery map: { skillCode: masteryProbability }
  @Column({ type: 'jsonb', nullable: true })
  skillMastery: Record<string, number>;

  // BNCC progress
  @Column({ type: 'jsonb', nullable: true })
  bnccProgress: Record<string, {
    attempted: number;
    mastered: boolean;
    lastAttempt: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  ontologyInstanceData: Record<string, any>;

  @Column({ default: 0 })
  totalPoints: number;

  @Column({ default: 1 })
  currentLevel: number;

  @Column({ default: 0 })
  currentStreak: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

Copy📁 FILE: backend/src/modules/users/users.service.ts
typescriptCopyimport { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ChildProfile } from './entities/child-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateChildProfileDto } from './dto/update-child-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ChildProfile)
    private readonly childProfileRepo: Repository<ChildProfile>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepo.create(dto);
    return this.userRepo.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['childProfile'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({ relations: ['childProfile'] });
  }

  async getChildProfile(userId: string): Promise<ChildProfile> {
    const profile = await this.childProfileRepo.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException(`Child profile not found for user ${userId}`);
    }
    return profile;
  }

  async updateChildProfile(
    userId: string,
    dto: UpdateChildProfileDto,
  ): Promise<ChildProfile> {
    let profile = await this.childProfileRepo.findOne({ where: { userId } });

    if (!profile) {
      profile = this.childProfileRepo.create({ userId, ...dto });
    } else {
      Object.assign(profile, dto);
    }

    return this.childProfileRepo.save(profile);
  }

  async updateSkillMastery(
    userId: string,
    skillCode: string,
    masteryProbability: number,
  ): Promise<void> {
    const profile = await this.childProfileRepo.findOne({ where: { userId } });
    if (!profile) return;

    const current = profile.skillMastery || {};
    current[skillCode] = masteryProbability;
    profile.skillMastery = current;

    await this.childProfileRepo.save(profile);
  }

  async updateBnccProgress(
    userId: string,
    skillCode: string,
    mastered: boolean,
  ): Promise<void> {
    const profile = await this.childProfileRepo.findOne({ where: { userId } });
    if (!profile) return;

    const current = profile.bnccProgress || {};
    const existing = current[skillCode] || { attempted: 0, mastered: false };

    current[skillCode] = {
      attempted: existing.attempted + 1,
      mastered,
      lastAttempt: new Date().toISOString(),
    };

    profile.bnccProgress = current;
    await this.childProfileRepo.save(profile);
  }

  async grantLgpdConsent(userId: string): Promise<void> {
    await this.userRepo.update(userId, {
      lgpdConsentGiven: true,
      lgpdConsentDate: new Date(),
    });
    this.logger.log(`LGPD consent granted for user ${userId}`);
  }

  async anonymizeUser(userId: string): Promise<void> {
    const anonymized = `anon_${userId.substring(0, 8)}`;
    await this.userRepo.update(userId, {
      name: anonymized,
      email: `${anonymized}@deleted.invalid`,
      isActive: false,
    });
    this.logger.warn(`User ${userId} anonymized (LGPD request)`);
  }
}

Copy📁 FILE: backend/src/modules/users/dto/create-user.dto.ts
typescriptCopyimport { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  language?: string;
}

Copy📁 FILE: backend/src/modules/users/dto/update-child-profile.dto.ts
typescriptCopyimport { IsOptional, IsNumber, IsString, IsObject, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateChildProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  schoolYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  asdSupportLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  strengths?: Record<string, boolean>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  weaknesses?: Record<string, boolean>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  uiPreferences?: Record<string, any>;
}

Copy📁 FILE: backend/src/modules/users/users.controller.ts
typescriptCopyimport {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateChildProfileDto } from './dto/update-child-profile.dto';
import { UserRole } from './enums/user-role.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PROFESSIONAL)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id/child-profile')
  getChildProfile(@Param('id') id: string) {
    return this.usersService.getChildProfile(id);
  }

  @Put(':id/child-profile')
  updateChildProfile(
    @Param('id') id: string,
    @Body() dto: UpdateChildProfileDto,
  ) {
    return this.usersService.updateChildProfile(id, dto);
  }

  @Post(':id/lgpd-consent')
  @HttpCode(HttpStatus.NO_CONTENT)
  async grantConsent(@Param('id') id: string) {
    return this.usersService.grantLgpdConsent(id);
  }

  @Post(':id/anonymize')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async anonymize(@Param('id') id: string) {
    return this.usersService.anonymizeUser(id);
  }
}

Copy📁 FILE: backend/src/modules/users/users.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ChildProfile } from './entities/child-profile.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, ChildProfile])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

Copy📁 FILE: backend/src/modules/activities/entities/activity.entity.ts
typescriptCopyimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ActivityAttempt } from './activity-attempt.entity';

export enum ActivityType {
  VISUAL_PUZZLE = 'visual_puzzle',
  QUIZ = 'quiz',
  VIDEO_QUESTION = 'video_question',
  YES_NO = 'yes_no',
  COUNTING = 'counting',
  DRAG_DROP = 'drag_drop',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ActivityType })
  type: ActivityType;

  @Column({ type: 'enum', enum: DifficultyLevel, default: DifficultyLevel.EASY })
  difficulty: DifficultyLevel;

  // BNCC skill codes e.g. "EF01MA01", "EF02MA05"
  @Column({ type: 'jsonb', default: [] })
  bnccSkills: string[];

  // Which ontology modalities this activity targets
  @Column({ type: 'jsonb', default: [] })
  targetModalities: string[]; // ['visual', 'logical', 'sensory']

  // The actual content: questions, options, correct answers
  @Column({ type: 'jsonb' })
  content: {
    instructions: string;
    instructionsPt: string;
    items?: any[];
    imageUrl?: string;
    audioUrl?: string;
    videoUrl?: string;
    correctAnswer?: any;
    options?: any[];
    timeLimit?: number; // seconds
  };

  // Accessibility metadata
  @Column({ type: 'jsonb', nullable: true })
  accessibility: {
    hasAudio?: boolean;
    hasVisual?: boolean;
    hasAnimation?: boolean;
    sensoryLoad?: 'low' | 'medium' | 'high';
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  pointsReward: number;

  @Column({ nullable: true })
  prerequisiteSkillCode: string;

  @OneToMany(() => ActivityAttempt, (a) => a.activity)
  attempts: ActivityAttempt[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

Copy📁 FILE: backend/src/modules/activities/entities/activity-attempt.entity.ts
typescriptCopyimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Activity } from './activity.entity';

@Entity('activity_attempts')
export class ActivityAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => Activity, (a) => a.attempts, { eager: true })
  @JoinColumn()
  activity: Activity;

  @Column()
  activityId: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ type: 'float', default: 0 })
  score: number; // 0..1

  @Column({ nullable: true })
  timeSpentSeconds: number;

  @Column({ nullable: true })
  hintsUsed: number;

  // Raw interaction signals for ML
  @Column({ type: 'jsonb', nullable: true })
  interactionSignals: {
    clickCount?: number;
    backtrackCount?: number;
    pauseCount?: number;
    totalFocusTime?: number;
    answerChanges?: number;
    firstAnswerTime?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  adeDecisionContext: {
    decisionId?: string;
    recommendedModality?: string;
    recommendedDifficulty?: string;
  };

  @CreateDateColumn()
  createdAt: Date;
}

Copy📁 FILE: backend/src/modules/activities/activities.service.ts
typescriptCopyimport { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, DifficultyLevel, ActivityType } from './entities/activity.entity';
import { ActivityAttempt } from './entities/activity-attempt.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { AdeService } from '../ade/ade.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivityAttempt)
    private readonly attemptRepo: Repository<ActivityAttempt>,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly adeService: AdeService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateActivityDto): Promise<Activity> {
    const activity = this.activityRepo.create(dto);
    return this.activityRepo.save(activity);
  }

  async findAll(filters?: {
    difficulty?: DifficultyLevel;
    type?: ActivityType;
    bnccSkill?: string;
  }): Promise<Activity[]> {
    const query = this.activityRepo.createQueryBuilder('activity')
      .where('activity.isActive = true');

    if (filters?.difficulty) {
      query.andWhere('activity.difficulty = :difficulty', {
        difficulty: filters.difficulty,
      });
    }

    if (filters?.type) {
      query.andWhere('activity.type = :type', { type: filters.type });
    }

    if (filters?.bnccSkill) {
      query.andWhere(':skill = ANY(activity.bnccSkills)', {
        skill: filters.bnccSkill,
      });
    }

    return query.getMany();
  }

  async findById(id: string): Promise<Activity> {
    const activity = await this.activityRepo.findOne({ where: { id } });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  async getNextActivity(userId: string): Promise<{
    activity: Activity;
    adeDecision: any;
  }> {
    // 1. Load learner profile
    const profile = await this.usersService.getChildProfile(userId);

    // 2. Call ADE to decide
    const adeDecision = await this.adeService.decide({
      userId,
      profile,
      recentAttempts: await this.getRecentAttempts(userId, 5),
    });

    // 3. Find matching activity
    const activity = await this.findMatchingActivity(adeDecision);

    this.logger.log(
      `Next activity for user ${userId}: ${activity.id} (ADE decision: ${adeDecision.id})`,
    );

    return { activity, adeDecision };
  }

  async submitAttempt(userId: string, dto: SubmitAttemptDto): Promise<{
    attempt: ActivityAttempt;
    feedback: any;
    nextActivity?: Activity;
    adeDecision?: any;
  }> {
    const activity = await this.findById(dto.activityId);

    // Calculate score
    const isCorrect = this.evaluateAnswer(activity, dto.answer);
    const score = isCorrect ? 1.0 : 0.0;

    // Save attempt
    const attempt = this.attemptRepo.create({
      userId,
      activityId: dto.activityId,
      sessionId: dto.sessionId,
      isCorrect,
      score,
      timeSpentSeconds: dto.timeSpentSeconds,
      hintsUsed: dto.hintsUsed || 0,
      interactionSignals: dto.interactionSignals,
      adeDecisionContext: dto.adeDecisionContext,
    });

    await this.attemptRepo.save(attempt);

    // Publish Kafka event (async, non-blocking)
    this.kafkaProducer.publish('platform.activity.events', {
      type: 'ACTIVITY_COMPLETED',
      userId,
      activityId: dto.activityId,
      sessionId: dto.sessionId,
      isCorrect,
      score,
      timeSpentSeconds: dto.timeSpentSeconds,
      interactionSignals: dto.interactionSignals,
      bnccSkills: activity.bnccSkills,
      timestamp: new Date().toISOString(),
    }).catch((err) => this.logger.error('Kafka publish failed', err));

    // Generate feedback
    const feedback = this.generateFeedback(isCorrect, activity, dto.hintsUsed);

    return { attempt, feedback };
  }

  async getRecentAttempts(userId: string, limit = 10): Promise<ActivityAttempt[]> {
    return this.attemptRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUserAttemptHistory(userId: string): Promise<ActivityAttempt[]> {
    return this.attemptRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  private evaluateAnswer(activity: Activity, answer: any): boolean {
    const correct = activity.content.correctAnswer;
    if (correct === null || correct === undefined) return false;

    if (typeof correct === 'string') {
      return String(answer).toLowerCase().trim() === correct.toLowerCase().trim();
    }

    if (typeof correct === 'number') {
      return Number(answer) === correct;
    }

    if (Array.isArray(correct)) {
      return JSON.stringify(answer) === JSON.stringify(correct);
    }

    return answer === correct;
  }

  private generateFeedback(
    isCorrect: boolean,
    activity: Activity,
    hintsUsed: number,
  ) {
    return {
      isCorrect,
      message: isCorrect
        ? 'Muito bem! Você acertou! 🌟'
        : 'Tente novamente! Você consegue! 💪',
      messageEn: isCorrect ? 'Well done! You got it! 🌟' : 'Try again! You can do it! 💪',
      pointsEarned: isCorrect ? Math.max(activity.pointsReward - hintsUsed * 5, 0) : 0,
      encouragement: true,
    };
  }

  private async findMatchingActivity(adeDecision: any): Promise<Activity> {
    const query = this.activityRepo.createQueryBuilder('activity')
      .where('activity.isActive = true');

    if (adeDecision.recommendedDifficulty) {
      query.andWhere('activity.difficulty = :diff', {
        diff: adeDecision.recommendedDifficulty,
      });
    }

    if (adeDecision.recommendedModality) {
      query.andWhere(':modality = ANY(activity.targetModalities)', {
        modality: adeDecision.recommendedModality,
      });
    }

    const activities = await query.getMany();

    if (activities.length === 0) {
      // Fallback: return any easy activity
      return this.activityRepo.findOne({
        where: { difficulty: DifficultyLevel.EASY, isActive: true },
      });
    }

    // Random selection from candidates (simple exploration)
    return activities[Math.floor(Math.random() * activities.length)];
  }
}

Copy📁 FILE: backend/src/modules/activities/dto/submit-attempt.dto.ts
typescriptCopyimport {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitAttemptDto {
  @ApiProperty()
  @IsString()
  activityId: string;

  @ApiProperty()
  answer: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeSpentSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hintsUsed?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  interactionSignals?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  adeDecisionContext?: Record<string, any>;
}

Copy📁 FILE: backend/src/modules/activities/dto/create-activity.dto.ts
typescriptCopyimport {
  IsString,
  IsEnum,
  IsArray,
  IsObject,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ActivityType, DifficultyLevel } from '../entities/activity.entity';

export class CreateActivityDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @IsArray()
  bnccSkills: string[];

  @IsArray()
  targetModalities: string[];

  @IsObject()
  content: Record<string, any>;

  @IsOptional()
  @IsObject()
  accessibility?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  pointsReward?: number;

  @IsOptional()
  @IsString()
  prerequisiteSkillCode?: string;
}

Copy📁 FILE: backend/src/modules/activities/activities.controller.ts
typescriptCopyimport {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateActivityDto } from './dto/create-activity.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PROFESSIONAL)
  @ApiOperation({ summary: 'Create a new activity' })
  create(@Body() dto: CreateActivityDto) {
    return this.activitiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List activities with optional filters' })
  findAll(
    @Query('difficulty') difficulty?: string,
    @Query('type') type?: string,
    @Query('bnccSkill') bnccSkill?: string,
  ) {
    return this.activitiesService.findAll({ difficulty, type, bnccSkill } as any);
  }

  @Get('next')
  @Roles(UserRole.CHILD)
  @ApiOperation({ summary: 'Get next recommended activity for current child' })
  getNext(@CurrentUser('userId') userId: string) {
    return this.activitiesService.getNextActivity(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findById(id);
  }

  @Post('attempts')
  @Roles(UserRole.CHILD)
  @ApiOperation({ summary: 'Submit an activity attempt' })
  submitAttempt(
    @CurrentUser('userId') userId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.activitiesService.submitAttempt(userId, dto);
  }

  @Get('attempts/history')
  @ApiOperation({ summary: 'Get attempt history for current user' })
  getHistory(@CurrentUser('userId') userId: string) {
    return this.activitiesService.getUserAttemptHistory(userId);
  }
}

Copy📁 FILE: backend/src/modules/activities/activities.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityAttempt } from './entities/activity-attempt.entity';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { KafkaModule } from '../kafka/kafka.module';
import { AdeModule } from '../ade/ade.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, ActivityAttempt]),
    KafkaModule,
    AdeModule,
    UsersModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}

Copy📁 FILE: backend/src/modules/ade/ade.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AdeService } from './ade.service';
import { AdeDecision } from './entities/ade-decision.entity';
import { OntologyReasonerService } from './ontology/ontology-reasoner.service';
import { RuleEngineService } from './rules/rule-engine.service';
import { MlEngineService } from './ml/ml-engine.service';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdeDecision]),
    HttpModule,
    KafkaModule,
  ],
  providers: [
    AdeService,
    OntologyReasonerService,
    RuleEngineService,
    MlEngineService,
  ],
  exports: [AdeService],
})
export class AdeModule {}

Copy📁 FILE: backend/src/modules/ade/entities/ade-decision.entity.ts
typescriptCopyimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('ade_decisions')
export class AdeDecision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column()
  recommendedDifficulty: string;

  @Column()
  recommendedModality: string;

  @Column({ nullable: true })
  recommendedActivityType: string;

  @Column({ nullable: true })
  recommendedBnccSkill: string;

  // XAI: explainability record
  @Column({ type: 'jsonb' })
  xaiLog: {
    ontologyInferences: string[];
    rulesFired: string[];
    mlPredictions: Record<string, any>;
    finalReason: string;
    confidence: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  inputSnapshot: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

Copy📁 FILE: backend/src/modules/ade/ontology/ontology-reasoner.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';

/**
 * OntologyReasonerService
 *
 * Implements a JSON-based reasoning engine inspired by the LASDONT OWL ontology.
 * The ontology defines:
 *   - Strengths: Visual, Auditive, Logical, Motor, Sensory
 *   - Weaknesses: same axes
 *   - Treatments: Visual_Puzzles, Textual_Quizzes, Videos, IA_Sandbox_DIY, etc.
 *   - Rules: if hasStrength(Visual) AND hasStrength(Sensory) → recommend IA_Sandbox_DIY
 *
 * Ontology source: LASDONT (LasdOnt.owl) - Richard Jeremias, 2024
 */
@Injectable()
export class OntologyReasonerService {
  private readonly logger = new Logger(OntologyReasonerService.name);

  /**
   * Infer recommended treatment modalities based on learner strengths/weaknesses.
   * Mirrors the OWL SubClassOf restrictions from LASDONT.
   */
  inferRecommendedModalities(
    strengths: Record<string, boolean>,
    weaknesses: Record<string, boolean>,
  ): { modalities: string[]; inferences: string[] } {
    const modalities: string[] = [];
    const inferences: string[] = [];

    // Rule 1: IA_Sandbox_DIY — requires Visual + Sensory strength
    // Source: OWL SubClassOf restriction on IA_Sandbox_DIY
    if (strengths?.visual && strengths?.sensory) {
      modalities.push('visual'); // IA_Sandbox maps to visual modality
      inferences.push(
        'LASDONT:IA_Sandbox_DIY — hasStrength(Visual) AND hasStrength(Sensory)',
      );
    }

    // Rule 2: Visual_Puzzles — requires Logical + Sensory + Visual strength
    if (strengths?.logical && strengths?.sensory && strengths?.visual) {
      modalities.push('visual');
      inferences.push(
        'LASDONT:Visual_Puzzles — hasStrength(Logical) AND hasStrength(Sensory) AND hasStrength(Visual)',
      );
    }

    // Rule 3: Textual_Quizzes — requires Logical strength
    if (strengths?.logical && !weaknesses?.logical) {
      modalities.push('text');
      inferences.push(
        'LASDONT:Textual_Quizzes — hasStrength(Logical)',
      );
    }

    // Rule 4: Question_Videos — Visual strength OR (Visual strength AND Motor weakness)
    if (strengths?.visual || (strengths?.visual && weaknesses?.motor)) {
      modalities.push('auditive');
      inferences.push(
        'LASDONT:Question_Videos — hasStrength(Visual) OR (hasStrength(Visual) AND hasWeakness(Motor))',
      );
    }

    // Rule 5: Yes_No_Videos — Logical weakness OR Motor weakness
    if (weaknesses?.logical || weaknesses?.motor) {
      modalities.push('auditive');
      inferences.push(
        'LASDONT:Yes_No_Videos — hasWeakness(Logical) OR hasWeakness(Motor)',
      );
    }

    // Default fallback
    if (modalities.length === 0) {
      modalities.push('visual');
      inferences.push('FALLBACK: Default visual modality (no specific constraints matched)');
    }

    // Deduplicate
    const uniqueModalities = [...new Set(modalities)];

    this.logger.debug(
      `Ontology inferences: ${inferences.join(' | ')} → modalities: ${uniqueModalities.join(', ')}`,
    );

    return { modalities: uniqueModalities, inferences };
  }

  /**
   * Infer support level from ASD profile.
   * Maps to LASDONT:Mild_Percentage, Moderated_Percentage, Strong_Percentage
   */
  inferSupportLevel(asdSupportLevel: string): {
    level: 'mild' | 'moderate' | 'strong';
    inference: string;
  } {
    const map: Record<string, 'mild' | 'moderate' | 'strong'> = {
      mild: 'mild',
      moderate: 'moderate',
      strong: 'strong',
    };

    const level = map[asdSupportLevel] || 'moderate';
    return {
      level,
      inference: `LASDONT:${level.charAt(0).toUpperCase() + level.slice(1)}_Percentage`,
    };
  }
}

Copy📁 FILE: backend/src/modules/ade/rules/rule-engine.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';
import { DifficultyLevel } from '../../activities/entities/activity.entity';

export interface RuleContext {
  recentAccuracy: number;        // 0..1
  averageTimeSeconds: number;
  hintsUsed: number;
  currentSkillMastery: number;   // BKT output 0..1
  asdSupportLevel: string;
  streakCount: number;
  engagementScore: number;       // ML output 0..1
}

export interface RuleResult {
  recommendedDifficulty: DifficultyLevel;
  shouldReduceStimulation: boolean;
  shouldAddBreak: boolean;
  rulesFired: string[];
}

/**
 * SWRL-equivalent rule engine implemented in TypeScript.
 * Rules are pedagogically grounded and aligned with ASD support research.
 */
@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  evaluate(ctx: RuleContext): RuleResult {
    const rulesFired: string[] = [];
    let difficulty = DifficultyLevel.EASY;
    let shouldReduceStimulation = false;
    let shouldAddBreak = false;

    // === DIFFICULTY RULES ===

    // Rule D1: High mastery → increase difficulty
    if (ctx.currentSkillMastery > 0.8 && ctx.recentAccuracy > 0.75) {
      difficulty = DifficultyLevel.HARD;
      rulesFired.push('D1: mastery>0.8 AND accuracy>0.75 → HARD');
    }
    // Rule D2: Good performance → medium difficulty
    else if (ctx.currentSkillMastery > 0.5 && ctx.recentAccuracy > 0.6) {
      difficulty = DifficultyLevel.MEDIUM;
      rulesFired.push('D2: mastery>0.5 AND accuracy>0.6 → MEDIUM');
    }
    // Rule D3: Struggling → easy difficulty
    else if (ctx.recentAccuracy < 0.4 || ctx.currentSkillMastery < 0.3) {
      difficulty = DifficultyLevel.EASY;
      rulesFired.push('D3: accuracy<0.4 OR mastery<0.3 → EASY');
    }
    // Rule D4: Strong support level → cap at MEDIUM
    else if (ctx.asdSupportLevel === 'strong' && difficulty === DifficultyLevel.HARD) {
      difficulty = DifficultyLevel.MEDIUM;
      rulesFired.push('D4: strong_support_level → cap_at_MEDIUM');
    }

    // === ENGAGEMENT / WELLBEING RULES ===

    // Rule E1: Low engagement → reduce stimulation
    if (ctx.engagementScore < 0.35) {
      shouldReduceStimulation = true;
      rulesFired.push('E1: engagement<0.35 → reduce_stimulation');
    }

    // Rule E2: High time spent + many hints → add break suggestion
    if (ctx.averageTimeSeconds > 120 && ctx.hintsUsed > 3) {
      shouldAddBreak = true;
      rulesFired.push('E2: time>120s AND hints>3 → suggest_break');
    }

    // Rule E3: Long streak → prevent frustration by alternating easy
    if (ctx.streakCount > 5 && difficulty === DifficultyLevel.EASY) {
      difficulty = DifficultyLevel.MEDIUM;
      rulesFired.push('E3: streak>5 AND easy → promote_to_MEDIUM');
    }

    // Rule E4: BNCC gate — strong support should always start easy
    if (ctx.asdSupportLevel === 'strong' && ctx.currentSkillMastery < 0.5) {
      difficulty = DifficultyLevel.EASY;
      rulesFired.push('E4: BNCC_gate — strong_support AND low_mastery → EASY');
    }

    this.logger.debug(
      `Rules fired: [${rulesFired.join(' | ')}] → difficulty: ${difficulty}`,
    );

    return {
      recommendedDifficulty: difficulty,
      shouldReduceStimulation,
      shouldAddBreak,
      rulesFired,
    };
  }
}

Copy📁 FILE: backend/src/modules/ade/ml/ml-engine.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface MlPredictions {
  masteryProbability: number;
  engagementScore: number;
  modalityRecommendation: string;
  confidence: number;
  fallback?: boolean;
}

@Injectable()
export class MlEngineService {
  private readonly logger = new Logger(MlEngineService.name);
  private readonly mlServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.mlServiceUrl = this.configService.get<string>(
      'ML_SERVICE_URL',
      'http://localhost:8001',
    );
  }

  async predict(input: {
    userId: string;
    recentAttempts: Array<{
      isCorrect: boolean;
      timeSpentSeconds: number;
      hintsUsed: number;
      interactionSignals: any;
    }>;
    currentSkillCode: string;
    bnccSkills: string[];
    asdSupportLevel: string;
    strengths: Record<string, boolean>;
    weaknesses: Record<string, boolean>;
  }): Promise<MlPredictions> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .post(`${this.mlServiceUrl}/predict`, input)
          .pipe(
            timeout(5000), // 5s timeout — never block ADE
            catchError((err) => {
              this.logger.warn(`ML service unavailable: ${err.message}. Using fallback.`);
              return of({ data: this.getFallbackPredictions(input) });
            }),
          ),
      );

      return response.data;
    } catch (err) {
      this.logger.error(`ML Engine error: ${err.message}`);
      return this.getFallbackPredictions(input);
    }
  }

  /**
   * Fallback predictions using simple heuristics when ML service is unavailable.
   * Ensures ADE never blocks on ML failures.
   */
  private getFallbackPredictions(input: any): MlPredictions {
    const attempts = input.recentAttempts || [];
    const correct = attempts.filter((a: any) => a.isCorrect).length;
    const accuracy = attempts.length > 0 ? correct / attempts.length : 0.5;

    // Simple BKT fallback: accuracy approximation
    const masteryProbability = Math.min(0.9, 0.3 + accuracy * 0.6);
    const engagementScore = accuracy > 0.6 ? 0.7 : 0.4;

    return {
      masteryProbability,
      engagementScore,
      modalityRecommendation: 'visual',
      confidence: 0.3,
      fallback: true,
    };
  }
}

Copy📁 FILE: backend/src/modules/ade/ade.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdeDecision } from './entities/ade-decision.entity';
import { OntologyReasonerService } from './ontology/ontology-reasoner.service';
import { RuleEngineService } from './rules/rule-engine.service';
import { MlEngineService } from './ml/ml-engine.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { ChildProfile } from '../users/entities/child-profile.entity';
import { ActivityAttempt } from '../activities/entities/activity-attempt.entity';

export interface AdeInput {
  userId: string;
  profile: ChildProfile;
  recentAttempts: ActivityAttempt[];
  sessionId?: string;
}

@Injectable()
export class AdeService {
  private readonly logger = new Logger(AdeService.name);

  constructor(
    @InjectRepository(AdeDecision)
    private readonly decisionRepo: Repository<AdeDecision>,
    private readonly ontologyReasoner: OntologyReasonerService,
    private readonly ruleEngine: RuleEngineService,
    private readonly mlEngine: MlEngineService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  /**
   * Core ADE pipeline:
   * 1. Ontology reasoning → infer modalities
   * 2. ML service → skill mastery + engagement
   * 3. Rule engine → difficulty + wellbeing
   * 4. Synthesize decision
   * 5. Persist + publish Kafka event
   */
  async decide(input: AdeInput): Promise<AdeDecision> {
    this.logger.log(`ADE decision for user ${input.userId}`);

    const { profile, recentAttempts } = input;
    const strengths = profile.strengths || {};
    const weaknesses = profile.weaknesses || {};
    const skillMastery = profile.skillMastery || {};

    // === STEP 1: Ontology Reasoning ===
    const ontologyResult = this.ontologyReasoner.inferRecommendedModalities(
      strengths,
      weaknesses,
    );
    const supportLevelResult = this.ontologyReasoner.inferSupportLevel(
      profile.asdSupportLevel || 'moderate',
    );

    // === STEP 2: ML Predictions ===
    const currentSkillCode = this.pickCurrentSkillCode(profile, recentAttempts);
    const currentMastery = skillMastery[currentSkillCode] || 0.3;

    const mlPredictions = await this.mlEngine.predict({
      userId: input.userId,
      recentAttempts: recentAttempts.map((a) => ({
        isCorrect: a.isCorrect,
        timeSpentSeconds: a.timeSpentSeconds || 0,
        hintsUsed: a.hintsUsed || 0,
        interactionSignals: a.interactionSignals || {},
      })),
      currentSkillCode,
      bnccSkills: Object.keys(profile.bnccProgress || {}),
      asdSupportLevel: profile.asdSupportLevel || 'moderate',
      strengths,
      weaknesses,
    });

    // === STEP 3: Rule Engine ===
    const recentAccuracy = this.calculateAccuracy(recentAttempts);
    const avgTime = this.calculateAvgTime(recentAttempts);
    const totalHints = recentAttempts.reduce((s, a) => s + (a.hintsUsed || 0), 0);

    const ruleResult = this.ruleEngine.evaluate({
      recentAccuracy,
      averageTimeSeconds: avgTime,
      hintsUsed: totalHints,
      currentSkillMastery: mlPredictions.masteryProbability,
      asdSupportLevel: profile.asdSupportLevel || 'moderate',
      streakCount: profile.currentStreak || 0,
      engagementScore: mlPredictions.engagementScore,
    });

    // === STEP 4: Synthesize Decision ===
    const primaryModality =
      mlPredictions.modalityRecommendation ||
      ontologyResult.modalities[0] ||
      'visual';

    const xaiLog = {
      ontologyInferences: ontologyResult.inferences,
      rulesFired: ruleResult.rulesFired,
      mlPredictions: {
        masteryProbability: mlPredictions.masteryProbability,
        engagementScore: mlPredictions.engagementScore,
        confidence: mlPredictions.confidence,
        fallback: mlPredictions.fallback || false,
      },
      finalReason: `Ontology(${ontologyResult.inferences.length} inferences) + Rules(${ruleResult.rulesFired.length} fired) + ML(mastery=${mlPredictions.masteryProbability.toFixed(2)})`,
      confidence: mlPredictions.confidence,
    };

    // === STEP 5: Persist ===
    const decision = this.decisionRepo.create({
      userId: input.userId,
      sessionId: input.sessionId,
      recommendedDifficulty: ruleResult.recommendedDifficulty,
      recommendedModality: primaryModality,
      recommendedActivityType: this.mapModalityToActivityType(primaryModality),
      recommendedBnccSkill: currentSkillCode,
      xaiLog,
      inputSnapshot: {
        strengths,
        weaknesses,
        recentAccuracy,
        currentMastery,
        supportLevel: profile.asdSupportLevel,
        shouldReduceStimulation: ruleResult.shouldReduceStimulation,
        shouldAddBreak: ruleResult.shouldAddBreak,
      },
    });

    const saved = await this.decisionRepo.save(decision);

    // Publish async
    this.kafkaProducer
      .publish('platform.ade.decisions', {
        type: 'ADE_DECISION_MADE',
        decisionId: saved.id,
        userId: input.userId,
        recommendedDifficulty: ruleResult.recommendedDifficulty,
        recommendedModality: primaryModality,
        xaiSummary: xaiLog.finalReason,
        timestamp: new Date().toISOString(),
      })
      .catch((err) => this.logger.error('Kafka ADE publish failed', err));

    this.logger.log(
      `ADE decision ${saved.id}: difficulty=${ruleResult.recommendedDifficulty}, modality=${primaryModality}`,
    );

    return saved;
  }

  async getDecisionsByUser(userId: string): Promise<AdeDecision[]> {
    return this.decisionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  private pickCurrentSkillCode(
    profile: ChildProfile,
    attempts: ActivityAttempt[],
  ): string {
    if (attempts.length > 0 && attempts[0].activity?.bnccSkills?.length > 0) {
      return attempts[0].activity.bnccSkills[0];
    }
    // Default based on school year
    const year = profile.schoolYear || 1;
    return `EF0${year}MA01`;
  }

  private calculateAccuracy(attempts: ActivityAttempt[]): number {
    if (!attempts || attempts.length === 0) return 0.5;
    const correct = attempts.filter((a) => a.isCorrect).length;
    return correct / attempts.length;
  }

  private calculateAvgTime(attempts: ActivityAttempt[]): number {
    if (!attempts || attempts.length === 0) return 60;
    const total = attempts.reduce((s, a) => s + (a.timeSpentSeconds || 60), 0);
    return total / attempts.length;
  }

  private mapModalityToActivityType(modality: string): string {
    const map: Record<string, string> = {
      visual: 'visual_puzzle',
      auditive: 'video_question',
      text: 'quiz',
      mixed: 'drag_drop',
    };
    return map[modality] || 'quiz';
  }
}

Copy📁 FILE: backend/src/modules/analytics/entities/analytics-snapshot.entity.ts
typescriptCopyimport {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('analytics_snapshots')
export class AnalyticsSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ type: 'float', default: 0 })
  overallAccuracy: number;

  @Column({ type: 'float', default: 0 })
  engagementIndex: number;

  @Column({ type: 'float', default: 0 })
  averageTimePerActivity: number;

  @Column({ default: 0 })
  totalActivitiesCompleted: number;

  @Column({ default: 0 })
  totalCorrect: number;

  @Column({ type: 'jsonb', nullable: true })
  skillMasterySnapshot: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  bnccCoverage: Record<string, boolean>;

  @Column({ type: 'jsonb', nullable: true })
  behavioralPatterns: {
    avgHintsPerActivity?: number;
    avgClicksPerActivity?: number;
    pauseFrequency?: number;
    preferredTimeOfDay?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  rawEventData: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

Copy📁 FILE: backend/src/modules/analytics/analytics.service.ts
typescriptCopyimport { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsSnapshot } from './entities/analytics-snapshot.entity';
import { UsersService } from '../users/users.service';

export interface ActivityEvent {
  type: string;
  userId: string;
  activityId: string;
  sessionId?: string;
  isCorrect: boolean;
  score: number;
  timeSpentSeconds: number;
  interactionSignals: any;
  bnccSkills: string[];
  timestamp: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsSnapshot)
    private readonly snapshotRepo: Repository<AnalyticsSnapshot>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Process a Kafka activity event.
   * Called by the Kafka consumer after every activity completion.
   */
  async processActivityEvent(event: ActivityEvent): Promise<void> {
    this.logger.log(
      `Processing activity event for user ${event.userId}: correct=${event.isCorrect}`,
    );

    // Compute engagement index using behavioral signals
    const engagementIndex = this.calculateEngagementIndex(event);

    // Get or compute cumulative metrics
    const existing = await this.getLatestSnapshot(event.userId);
    const total = (existing?.totalActivitiesCompleted || 0) + 1;
    const totalCorrect = (existing?.totalCorrect || 0) + (event.isCorrect ? 1 : 0);
    const overallAccuracy = totalCorrect / total;

    // Update BNCC coverage
    const bnccCoverage = { ...(existing?.bnccCoverage || {}) };
    for (const skill of event.bnccSkills || []) {
      if (event.isCorrect) {
        bnccCoverage[skill] = true;
      } else {
        bnccCoverage[skill] = bnccCoverage[skill] || false;
      }
    }

    // Update skill mastery (simplified BKT update — full BKT is in ML service)
    const skillMastery = { ...(existing?.skillMasterySnapshot || {}) };
    for (const skill of event.bnccSkills || []) {
      const current = skillMastery[skill] || 0.3;
      // Bayesian update approximation
      const updated = event.isCorrect
        ? current + (1 - current) * 0.3
        : current * 0.7;
      skillMastery[skill] = Math.min(0.99, Math.max(0.01, updated));
    }

    // Save snapshot
    const snapshot = this.snapshotRepo.create({
      userId: event.userId,
      sessionId: event.sessionId,
      overallAccuracy,
      engagementIndex,
      averageTimePerActivity: event.timeSpentSeconds,
      totalActivitiesCompleted: total,
      totalCorrect,
      skillMasterySnapshot: skillMastery,
      bnccCoverage,
      behavioralPatterns: this.extractPatterns(event),
      rawEventData: event,
    });

    await this.snapshotRepo.save(snapshot);

    // Update user's skill mastery in profile
    for (const skill of event.bnccSkills || []) {
      await this.usersService
        .updateSkillMastery(event.userId, skill, skillMastery[skill])
        .catch((err) => this.logger.error('Failed to update skill mastery', err));

      await this.usersService
        .updateBnccProgress(event.userId, skill, event.isCorrect)
        .catch((err) => this.logger.error('Failed to update BNCC progress', err));
    }

    this.logger.log(
      `Analytics snapshot saved for ${event.userId}: accuracy=${overallAccuracy.toFixed(2)}, engagement=${engagementIndex.toFixed(2)}`,
    );
  }

  async getLatestSnapshot(userId: string): Promise<AnalyticsSnapshot | null> {
    return this.snapshotRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserAnalytics(userId: string): Promise<{
    latest: AnalyticsSnapshot;
    history: AnalyticsSnapshot[];
    summary: any;
  }> {
    const [latest, history] = await Promise.all([
      this.getLatestSnapshot(userId),
      this.snapshotRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
    ]);

    const summary = latest
      ? {
          totalActivities: latest.totalActivitiesCompleted,
          overallAccuracy: latest.overallAccuracy,
          engagementIndex: latest.engagementIndex,
          masteredSkills: Object.values(latest.bnccCoverage || {}).filter(
            Boolean,
          ).length,
          totalSkillsAttempted: Object.keys(latest.bnccCoverage || {}).length,
        }
      : null;

    return { latest, history, summary };
  }

  private calculateEngagementIndex(event: ActivityEvent): number {
    const signals = event.interactionSignals || {};
    let score = 0.5; // base

    // Penalize high backtracking
    if (signals.backtrackCount > 5) score -= 0.1;

    // Penalize high pause count
    if (signals.pauseCount > 3) score -= 0.1;

    // Reward fast first answer
    if (signals.firstAnswerTime < 10) score += 0.1;

    // Penalize excessive time
    if (event.timeSpentSeconds > 180) score -= 0.15;

    // Reward correct answers
    if (event.isCorrect) score += 0.2;

    return Math.min(1.0, Math.max(0.0, score));
  }

  private extractPatterns(event: ActivityEvent) {
    const signals = event.interactionSignals || {};
    return {
      avgHintsPerActivity: event.timeSpentSeconds > 60 ? 1 : 0,
      avgClicksPerActivity: signals.clickCount || 0,
      pauseFrequency: signals.pauseCount || 0,
    };
  }
}

Copy📁 FILE: backend/src/modules/analytics/analytics.controller.ts
typescriptCopyimport { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('users/:userId')
  getUserAnalytics(@Param('userId') userId: string) {
    return this.analyticsService.getUserAnalytics(userId);
  }

  @Get('users/:userId/latest')
  getLatest(@Param('userId') userId: string) {
    return this.analyticsService.getLatestSnapshot(userId);
  }
}

Copy📁 FILE: backend/src/modules/analytics/analytics.module.ts
typescriptCopyimport { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsSnapshot } from './entities/analytics-snapshot.entity';
import