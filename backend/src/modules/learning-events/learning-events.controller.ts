import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrackVisualCommunicationEventDto } from './dto/track-visual-communication-event.dto';
import { LearningEventService } from './learning-event.service';
import { TrackSpeechEventDto } from './dto/track-speech-event.dto';
import { TrackVoiceEventDto } from './dto/track-voice-event.dto';
import { TrackSessionEventDto } from './dto/track-session-event.dto';

@ApiTags('learning-events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('learning-events')
export class LearningEventsController {
  constructor(private readonly learningEventService: LearningEventService) {}

  @Post('session')
  @ApiOperation({ summary: 'Append a session lifecycle event' })
  async trackSession(@CurrentUser('userId') studentId: string, @Body() dto: TrackSessionEventDto) {
    const event = await this.learningEventService.track({
      studentId, sessionId: dto.sessionId, eventType: dto.eventType, timestamp: new Date(),
    });
    return { tracked: event !== null };
  }

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

  @Post('voice')
  @ApiOperation({ summary: 'Append a sanitized voice-command event without transcript or audio' })
  async trackVoice(@CurrentUser('userId') studentId: string, @Body() dto: TrackVoiceEventDto) {
    const event = await this.learningEventService.track({
      studentId, sessionId: dto.sessionId, eventType: dto.eventType, timestamp: new Date(),
      activityId: dto.activityId ?? null, recommendationId: dto.recommendationId ?? null,
      metadata: { interactionSource: 'VOICE', ...(dto.command ? { command: dto.command } : {}),
        ...(dto.processingTimeMs !== undefined ? { processingTimeMs: dto.processingTimeMs } : {}),
        ...(dto.recognitionSucceeded !== undefined ? { recognitionSucceeded: dto.recognitionSucceeded } : {}) },
    });
    if (event) await this.learningEventService.trackVoiceEvidence(
      event, dto.command, dto.processingTimeMs, dto.recognitionSucceeded,
    );
    return { tracked: event !== null };
  }
}
