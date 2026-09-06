import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LearningAnalyticsMetricsService } from './learning-analytics-metrics.service';

@ApiTags('learning-analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('learning-analytics/metrics')
export class LearningAnalyticsMetricsController {
  constructor(private readonly metricsService: LearningAnalyticsMetricsService) {}

  @Get('students/:studentId')
  @ApiOperation({ summary: 'Calculate deterministic metrics for one student' })
  getForStudent(@Param('studentId') studentId: string) {
    return this.metricsService.getForStudent(studentId);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Calculate deterministic metrics for one session' })
  getForSession(@Param('sessionId') sessionId: string) {
    return this.metricsService.getForSession(sessionId);
  }

  @Get('bncc-skills/:bnccSkillId')
  @ApiOperation({ summary: 'Calculate deterministic metrics for one BNCC skill' })
  getForBnccSkill(@Param('bnccSkillId') bnccSkillId: string) {
    return this.metricsService.getForBnccSkill(bnccSkillId);
  }

  @Get('activity-types/:activityType')
  @ApiOperation({ summary: 'Calculate deterministic metrics for one activity type' })
  getForActivityType(@Param('activityType') activityType: string) {
    return this.metricsService.getForActivityType(activityType);
  }
}
