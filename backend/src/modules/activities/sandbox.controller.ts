import { Controller, Get, Post, Patch, Body, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivitiesService } from './activities.service';
import { Activity } from './entities/activity.entity';
import { validateActivityAnswer } from './activity-answer-validator';

/**
 * Dev-only sandbox controller — no authentication required.
 * URL is kept secret; there is no link to it from the application.
 */
@ApiTags('sandbox')
@Controller('dev/k7x9-sandbox')
export class SandboxController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
  ) {}

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

  /**
   * Replace a pictogram conceptId inside an activity's content (deep replace).
   * Walks the entire content JSON and substitutes every occurrence of `oldConceptId`
   * with `newConceptId`, then persists the change to the database.
   *
   * [DECISÃO DE ENGENHARIA] Deep string replace on the JSON blob is simpler
   * than trying to patch individual fields, since pictogram IDs appear in many
   * different content shapes (items, options, visualGroups, etc.).
   */
  @Patch('activities/:id/pictogram')
  @ApiOperation({ summary: 'Replace a pictogram conceptId in an activity content (sandbox only)' })
  async replacePictogram(
    @Param('id') id: string,
    @Body() body: { oldConceptId: string; newConceptId: string },
  ) {
    if (!body.oldConceptId || !body.newConceptId) {
      throw new BadRequestException('oldConceptId and newConceptId are required');
    }

    const activity = await this.activitiesService.findById(id);

    // Deep replace via JSON serialization — handles all content shapes
    const contentJson = JSON.stringify(activity.content);
    const replaced = contentJson.split(JSON.stringify(body.oldConceptId).slice(1, -1)).join(
      JSON.stringify(body.newConceptId).slice(1, -1),
    );
    const newContent = JSON.parse(replaced);

    await this.activityRepo.update(id, { content: newContent });

    return {
      success: true,
      activityId: id,
      oldConceptId: body.oldConceptId,
      newConceptId: body.newConceptId,
      content: newContent,
    };
  }
}
