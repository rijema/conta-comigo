import {
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