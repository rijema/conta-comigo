import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AutbotBridgeDto } from './dto/autbot-bridge.dto';
import { Response } from 'express';

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

  @Get('google/start')
  @ApiOperation({ summary: 'Start Google login flow' })
  async googleStart(@Res() res: Response) {
    const url = this.authService.buildGoogleAuthUrl();
    return res.redirect(url);
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Handle Google login callback' })
  async googleCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    const result = await this.authService.loginWithGoogleCode(code);
    const frontendUrl = this.authService.getFrontendAuthRedirectUrl();
    const redirectUrl = new URL(frontendUrl);
    redirectUrl.searchParams.set('accessToken', result.accessToken);
    if (result.refreshToken) {
      redirectUrl.searchParams.set('refreshToken', result.refreshToken);
    }
    return res.redirect(redirectUrl.toString());
  }

  @Post('bridge/autbot')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a trusted bootstrap token for AutBot/TitiA' })
  async createAutbotBridge(
    @CurrentUser() user: any,
    @Body() dto: AutbotBridgeDto,
  ) {
    return this.authService.createAutbotBridgeToken(user.userId, dto.childId);
  }
}