import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { VoiceCommandInterpreter } from './voice-command-interpreter';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';

@Module({ imports: [HttpModule], controllers: [VoiceController], providers: [VoiceService, VoiceCommandInterpreter] })
export class VoiceModule {}
