import { Controller, Get, Put, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EducatorService } from './educator.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateProfessionalFeedbackDto } from './dto/create-professional-feedback.dto';

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
  getStats() {
    return this.educatorService.getStats();
  }

  @Get('learners')
  @ApiOperation({ summary: 'Get all child learners with full profiles' })
  getLearners() {
    return this.educatorService.getAllLearners();
  }

  @Get('learners/:learnerId/profile')
  @ApiOperation({ summary: 'Get detailed learner profile with ADE history' })
  getLearnerProfile(@Param('learnerId') learnerId: string) {
    return this.educatorService.getLearnerProfile(learnerId);
  }

  @Get('learners/:learnerId/longitudinal-analytics')
  @ApiOperation({ summary: 'Get longitudinal observed data and model estimates for a learner' })
  getLongitudinalAnalytics(@Param('learnerId') learnerId: string) {
    return this.educatorService.getLongitudinalAnalytics(learnerId);
  }

  @Put('learners/:learnerId/skills')
  @ApiOperation({ summary: 'Update child skill levels and ASD support configuration' })
  updateSkillLevels(
    @Param('learnerId') learnerId: string,
    @Body() dto: UpdateSkillLevelsDto,
  ) {
    return this.educatorService.updateSkillLevels(learnerId, dto);
  }

  @Get('learners/:learnerId/ade-history')
  @ApiOperation({ summary: 'Get ADE decision history for a learner' })
  getAdeHistory(@Param('learnerId') learnerId: string) {
    return this.educatorService.getAdeHistory(learnerId);
  }

  @Get('learners/:learnerId/ade-history/:decisionId/research-explanation')
  @ApiOperation({ summary: 'Get an authorized technical recommendation trace' })
  getResearchExplanation(
    @Param('learnerId') learnerId: string,
    @Param('decisionId') decisionId: string,
  ) {
    return this.educatorService.getResearchExplanation(learnerId, decisionId);
  }

  @Get('learners/:learnerId/adaptations')
  @ApiOperation({ summary: 'Get post-session adaptive events for optional professional review' })
  getAdaptations(@Param('learnerId') learnerId: string) {
    return this.educatorService.getAdaptations(learnerId);
  }

  @Post('adaptations/:transitionId/feedback')
  @ApiOperation({ summary: 'Record optional professional adaptation feedback' })
  createAdaptationFeedback(
    @CurrentUser('userId') professionalId: string,
    @Param('transitionId') transitionId: string,
    @Body() dto: CreateProfessionalFeedbackDto,
  ) {
    return this.educatorService.createAdaptationFeedback(transitionId, professionalId, dto);
  }

  @Get('learners/:learnerId/attempts')
  @ApiOperation({ summary: 'Get activity attempt history for a learner' })
  getAttemptHistory(@Param('learnerId') learnerId: string) {
    return this.educatorService.getAttemptHistory(learnerId);
  }

  @Get('learners/:learnerId/report')
  @ApiOperation({ summary: 'Get full printable report for a learner' })
  getReport(@Param('learnerId') learnerId: string) {
    return this.educatorService.getFullReport(learnerId);
  }
}
