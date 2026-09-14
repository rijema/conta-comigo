import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TranscribeVoiceDto } from './dto/transcribe-voice.dto';
import { NeuralSpeechDto } from './dto/neural-speech.dto';
import { VoiceService } from './voice.service';

@UseGuards(JwtAuthGuard)
@Controller('voice')
export class VoiceController {
  constructor(private readonly voice: VoiceService) {}
  @Post('command')
  command(@Body() dto: TranscribeVoiceDto) {
    return this.voice.transcribe(dto.audioBase64, dto.language);
  }
  @Post('speech')
  async speech(@Body() dto: NeuralSpeechDto) {
    return { audioBase64: await this.voice.synthesize(dto.text, dto.language, dto.rate) };
  }
}
