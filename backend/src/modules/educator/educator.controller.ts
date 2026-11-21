import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EducatorService } from './educator.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateProfessionalFeedbackDto } from './dto/create-professional-feedback.dto';
import { LearnerScoped } from '../users/guards/learner-access.guard';
import { Requester } from '../users/services/learner-access.service';

export class UpdateSkillLevelsDto {
  @IsOptional()
  @IsObject()
  strengths?: Record<string, boolean>;

  @IsOptional()
  @IsObject()
  weaknesses?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  asdSupportLevel?: string;

  @IsOptional()
  @IsObject()
  uiPreferences?: Record<string, any>;
}

@ApiTags('educator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
@Controller('educator')
export class EducatorController {
  constructor(private readonly educatorService: EducatorService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get educator dashboard stats with learner profiles' })
  getStats(@CurrentUser() requester: Requester) {
    return this.educatorService.getStats(requester);
  }

  @Get('learners')
  @ApiOperation({ summary: 'Get the child learners of the professional\'s clinic' })
  getLearners(@CurrentUser() requester: Requester) {
    return this.educatorService.getAllLearners(requester);
  }

  @Delete('learners/:learnerId/clinic')
  @HttpCode(HttpStatus.NO_CONTENT)
  @LearnerScoped('learnerId')
  @ApiOperation({ summary: 'Remove a child from the professional\'s clinic (no data is deleted)' })
  removeFromClinic(
    @CurrentUser() requester: Requester,
    @Param('learnerId') learnerId: string,
  ) {
    return this.educatorService.removeLearnerFromClinic(requester, learnerId);
  }

  @Get('learners/:learnerId/profile')
  @LearnerScoped('learnerId')
  @ApiOperation({ summary: 'Get detailed learner profile with ADE history' })
  getLearnerProfile(@Param('learnerId') learnerId: string) {
    return this.educatorService.getLearnerProfile(learnerId);
  }

  @Get('learners/:learnerId/longitudinal-analytics')
  @LearnerScoped('learnerId')
  @ApiOperation({ summary: 'Get longitudinal observed data and model estimates for a learner' })
  getLongitudinalAnalytics(@Param('learnerId') learnerId: string) {
    return this.educatorService.getLongitudinalAnalytics(learnerId);
  }

  @Put('learners/:learnerId/skills')
  @LearnerScoped('learnerId')
  @ApiOperation({ summary: 'Update child skill levels and ASD support configuration' })
  updateSkillLevels(
    @Param('learnerId') learnerId: string,
    @Body() dto: UpdateSkillLevelsDto,
  ) {
    return this.educatorService.updateSkillLevels(learnerId, dto);
  }

  @Get('learners/:learnerId/ade-history')
  @LearnerScoped('learnerId')
  @ApiOperation({ summary: 'Get ADE decision history for a learner' })
  getAdeHistory(@Param('learnerId') learnerId: string) {
    return this.educatorService.getAdeHistory(learnerId);
  }

  @Get('learners/:learnerId/ade-history/:decisionId/research-explanation')
  @LearnerScoped('learnerId')
  @ApiOperation({ summary: 'Get an authorized technical recommendation trace' })
  getResearchExplanation(
    @Param('learnerId') learnerId: string,
    @Param('decisionId') decisionId: string,
  ) {
    return this.educatorService.getResearchExplanation(learnerId, decisionId);
  }

  @Get('learners/:learnerId/adaptations')
  @LearnerScoped('learnerId')
  @ApiOperation({ summary: 'Get post-session adaptive events for optional professional review' })
  getAdaptations(@Param('learnerId') learnerId: string) {
    return this.educatorService.getAdaptations(learnerId);
  }

  @Post('adaptations/:transitionId/feedback')
  @ApiOperation({ summary: 'Record optional professional adaptation feedback' })
  createAdaptationFeedback(
    @CurrentUser() requester: Requester,
    @Param('transitionId') transitionId: string,
    @Body() dto: CreateProfessionalFeedbackDto,
  ) {
    return this.educatorService.createAdaptationFeedback(transitionId, requester, dto);
  }

  @Get('learners/:learnerId/attempts')
  @LearnerScoped('learnerId')
  @ApiOperation({ summary: 'Get activity attempt history for a learner' })
  getAttemptHistory(@Param('learnerId') learnerId: string) {
    return this.educatorService.getAttemptHistory(learnerId);
  }

  @Get('learners/:learnerId/report')
  @LearnerScoped('learnerId')
  @ApiOperation({ summary: 'Get full printable report for a learner' })
  getReport(@Param('learnerId') learnerId: string) {
    return this.educatorService.getFullReport(learnerId);
  }

  @Post('learners/:learnerId/attendance/start')
  @LearnerScoped('learnerId')
  @ApiOperation({ summary: 'Start (or resume) a live attendance session as the child, without their credentials' })
  startAttendance(
    @CurrentUser('userId') professionalId: string,
    @Param('learnerId') learnerId: string,
  ) {
    return this.educatorService.startAttendance(professionalId, learnerId);
  }

  @Post('attendance/:attendanceId/end')
  @ApiOperation({ summary: 'End a live attendance session' })
  endAttendance(
    @CurrentUser('userId') professionalId: string,
    @Param('attendanceId') attendanceId: string,
  ) {
    return this.educatorService.endAttendance(professionalId, attendanceId);
  }

  @Get('attendance/active')
  @ApiOperation({ summary: 'List this professional\'s attendances left active (e.g. tab closed abruptly)' })
  getActiveAttendances(@CurrentUser('userId') professionalId: string) {
    return this.educatorService.getActiveAttendances(professionalId);
  }
}
