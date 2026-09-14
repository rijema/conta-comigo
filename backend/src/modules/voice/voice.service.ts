import { HttpService } from '@nestjs/axios';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { VoiceCommandInterpreter } from './voice-command-interpreter';

@Injectable()
export class VoiceService {
  constructor(private readonly http: HttpService, private readonly config: ConfigService,
    private readonly interpreter: VoiceCommandInterpreter) {}

  async transcribe(audioBase64: string, language = 'pt-BR') {
    if (this.config.get<string>('ENABLE_VOICE_COMMANDS', 'false') !== 'true') {
      throw new ServiceUnavailableException('Voice commands are disabled');
    }
    const started = Date.now();
    const response = await firstValueFrom(this.http.post(
      `${this.config.get<string>('ML_SERVICE_URL')}/voice/transcribe`,
      { audioBase64, language },
    ).pipe(timeout(this.config.get<number>('VOICE_PROCESSING_TIMEOUT_MS', 30000))));
    const transcript = String(response.data?.transcript ?? '');
    const command = this.interpreter.interpret(transcript);
    return {
      command,
      recognitionSucceeded: command !== 'UNKNOWN',
      language: response.data?.language ?? null,
      processingTimeMs: Number(response.data?.processingTimeMs ?? Date.now() - started),
    };
  }

  async synthesize(text: string, language = 'pt-BR', rate = 0.85) {
    if (this.config.get<string>('ENABLE_NEURAL_TTS', 'false') !== 'true') {
      throw new ServiceUnavailableException('Neural TTS is disabled');
    }
    const response = await firstValueFrom(this.http.post(
      `${this.config.get<string>('ML_SERVICE_URL')}/voice/synthesize`, { text, language, rate },
      { responseType: 'arraybuffer' },
    ).pipe(timeout(this.config.get<number>('VOICE_PROCESSING_TIMEOUT_MS', 30000))));
    return Buffer.from(response.data).toString('base64');
  }
}
