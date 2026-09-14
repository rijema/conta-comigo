import { HttpService } from '@nestjs/axios';
import { BadGatewayException, GatewayTimeoutException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { VoiceCommandInterpreter } from './voice-command-interpreter';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  constructor(private readonly http: HttpService, private readonly config: ConfigService,
    private readonly interpreter: VoiceCommandInterpreter) {}

  async status() {
    let provider = { reachable: false, sttConfigured: false, neuralTtsConfigured: false };
    try {
      const response = await firstValueFrom(this.http.get(
        `${this.config.get<string>('ML_SERVICE_URL')}/voice/status`,
      ).pipe(timeout(5000)));
      provider = { reachable: true, sttConfigured: response.data?.sttConfigured === true,
        neuralTtsConfigured: response.data?.neuralTtsConfigured === true };
    } catch { /* Status remains explicitly unavailable. */ }
    return {
      voiceCommandsEnabled: this.config.get<string>('ENABLE_VOICE_COMMANDS', 'false') === 'true',
      neuralTtsEnabled: this.config.get<string>('ENABLE_NEURAL_TTS', 'false') === 'true',
      provider,
    };
  }

  async transcribe(audioBase64: string, language = 'pt-BR') {
    if (this.config.get<string>('ENABLE_VOICE_COMMANDS', 'false') !== 'true') {
      throw new ServiceUnavailableException('Voice commands are disabled');
    }
    const started = Date.now();
    const response = await this.callMlService('transcription', () => firstValueFrom(this.http.post(
      `${this.mlServiceBaseUrl()}/voice/transcribe`, { audioBase64, language },
    ).pipe(timeout(this.config.get<number>('VOICE_PROCESSING_TIMEOUT_MS', 30000)))));
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
    const response = await this.callMlService('synthesis', () => firstValueFrom(this.http.post(
      `${this.mlServiceBaseUrl()}/voice/synthesize`, { text, language, rate },
      { responseType: 'arraybuffer' },
    ).pipe(timeout(this.config.get<number>('VOICE_PROCESSING_TIMEOUT_MS', 30000)))));
    return Buffer.from(response.data).toString('base64');
  }

  private mlServiceBaseUrl(): string {
    return this.config.getOrThrow<string>('ML_SERVICE_URL').replace(/\/+$/, '');
  }

  private async callMlService<T>(operation: string, request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      const code = isAxiosError(error) ? error.code : undefined;
      this.logger.error(`ML voice ${operation} failed (status=${status ?? 'unavailable'}, code=${code ?? 'unknown'})`);
      if (code === 'ECONNABORTED' || (error as { name?: string })?.name === 'TimeoutError') {
        throw new GatewayTimeoutException(`Neural voice ${operation} timed out`);
      }
      throw new BadGatewayException(`Neural voice ${operation} is unavailable`);
    }
  }
}
