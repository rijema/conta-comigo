import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TranscribeVoiceDto } from './dto/transcribe-voice.dto';
import { IsIn, IsNumber, IsString, MaxLength, Max, Min } from 'class-validator';
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

class NeuralSpeechDto {
  @IsString() @MaxLength(500) text: string;
  @IsIn(['pt-BR']) language: string = 'pt-BR';
  @IsNumber() @Min(0.5) @Max(2) rate: number = 0.85;
}
