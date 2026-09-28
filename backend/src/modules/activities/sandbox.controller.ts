import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { validateActivityAnswer } from './activity-answer-validator';

/**
 * Dev-only sandbox controller — no authentication required.
 * URL is kept secret; there is no link to it from the application.
 * All endpoints are read-only or stateless (no DB writes).
 */
@ApiTags('sandbox')
@Controller('dev/k7x9-sandbox')
export class SandboxController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('activities')
  @ApiOperation({ summary: 'List all active activities for sandbox testing' })
  async listAll() {
    const activities = await this.activitiesService.findAll();
    return activities.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      difficulty: a.difficulty,
      bnccSkills: a.bnccSkills,
      content: a.content,
      targetModalities: a.targetModalities,
    }));
  }

  @Get('activities/:id')
  @ApiOperation({ summary: 'Get a single activity by id' })
  async findOne(@Param('id') id: string) {
    return this.activitiesService.findById(id);
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate an answer locally — no DB write' })
  async evaluate(@Body() body: { activityId: string; answer: unknown }) {
    const activity = await this.activitiesService.findById(body.activityId);
    const isCorrect = validateActivityAnswer(activity.content, body.answer);
    return { isCorrect };
  }
}
