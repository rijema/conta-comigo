import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { LearnerScoped } from '../users/guards/learner-access.guard';
import { LearningAnalyticsMetricsService } from './learning-analytics-metrics.service';

@ApiTags('learning-analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('learning-analytics/metrics')
export class LearningAnalyticsMetricsController {
  constructor(private readonly metricsService: LearningAnalyticsMetricsService) {}

  @Get('students/:studentId')
  @LearnerScoped('studentId')
  @ApiOperation({ summary: 'Calculate deterministic metrics for one student' })
  getForStudent(@Param('studentId') studentId: string) {
    return this.metricsService.getForStudent(studentId);
  }

  @Get('sessions/:sessionId')
  // Aggregates across every child, regardless of clinic.
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Calculate deterministic metrics for one session' })
  getForSession(@Param('sessionId') sessionId: string) {
    return this.metricsService.getForSession(sessionId);
  }

  @Get('bncc-skills/:bnccSkillId')
  // Aggregates across every child, regardless of clinic.
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Calculate deterministic metrics for one BNCC skill' })
  getForBnccSkill(@Param('bnccSkillId') bnccSkillId: string) {
    return this.metricsService.getForBnccSkill(bnccSkillId);
  }

  @Get('activity-types/:activityType')
  // Aggregates across every child, regardless of clinic.
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Calculate deterministic metrics for one activity type' })
  getForActivityType(@Param('activityType') activityType: string) {
    return this.metricsService.getForActivityType(activityType);
  }
}
