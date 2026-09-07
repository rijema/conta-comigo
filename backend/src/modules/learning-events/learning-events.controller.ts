import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrackVisualCommunicationEventDto } from './dto/track-visual-communication-event.dto';
import { LearningEventService } from './learning-event.service';
import { TrackSpeechEventDto } from './dto/track-speech-event.dto';

@ApiTags('learning-events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('learning-events')
export class LearningEventsController {
  constructor(private readonly learningEventService: LearningEventService) {}

  @Post('visual-communication')
  @ApiOperation({ summary: 'Append a sanitized child-facing visual communication event' })
  async trackVisualCommunication(
    @CurrentUser('userId') studentId: string,
    @Body() dto: TrackVisualCommunicationEventDto,
  ) {
    const event = await this.learningEventService.track({
      studentId,
      sessionId: dto.sessionId,
      eventType: dto.eventType,
      timestamp: new Date(),
      metadata: {
        ...(dto.pictogramConceptId ? { pictogramConceptId: dto.pictogramConceptId } : {}),
        ...(dto.category ? { category: dto.category } : {}),
      },
    });
    return { tracked: event !== null };
  }

  @Post('speech')
  @ApiOperation({ summary: 'Append a sanitized optional-speech interaction event' })
  async trackSpeech(
    @CurrentUser('userId') studentId: string,
    @Body() dto: TrackSpeechEventDto,
  ) {
    const event = await this.learningEventService.track({
      studentId,
      sessionId: dto.sessionId,
      eventType: dto.eventType,
      timestamp: new Date(),
      activityId: dto.activityId ?? null,
      metadata: {
        ...(dto.pictogramConceptId ? { pictogramConceptId: dto.pictogramConceptId } : {}),
        ...(dto.stepCount ? { stepCount: dto.stepCount } : {}),
      },
    });
    return { tracked: event !== null };
  }
}
