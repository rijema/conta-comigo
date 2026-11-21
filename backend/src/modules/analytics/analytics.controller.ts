import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LearnerScoped } from '../users/guards/learner-access.guard';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('users/:userId')
  @LearnerScoped('userId')
  getUserAnalytics(@Param('userId') userId: string) {
    return this.analyticsService.getUserAnalytics(userId);
  }

  @Get('users/:userId/latest')
  @LearnerScoped('userId')
  getLatest(@Param('userId') userId: string) {
    return this.analyticsService.getLatestSnapshot(userId);
  }

  @Get('progress/:userId')
  @LearnerScoped('userId')
  getProgress(@Param('userId') userId: string) {
    return this.analyticsService.getProgress(userId);
  }
}
