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
    const baseUrl = this.mlServiceBaseUrl();
    const url = `${baseUrl}/voice/synthesize`;
    const timeoutMs = this.config.get<number>('VOICE_PROCESSING_TIMEOUT_MS', 30000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    this.logProxy('request started', { textLength: text.length, language, rate, timeoutMs });
    this.logProxy('ML URL resolved', { origin: new URL(baseUrl).origin, path: '/voice/synthesize' });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, rate }),
        signal: controller.signal,
      });
      const contentType = response.headers.get('content-type') ?? '';
      this.logProxy('ML status', { status: response.status });
      this.logProxy('ML content-type', { contentType });

      if (!response.ok) {
        await response.text().catch(() => '');
        this.logger.error(`[TitiA Speech Proxy] upstream error ${JSON.stringify({ status: response.status })}`);
        throw new BadGatewayException('Neural voice synthesis is unavailable');
      }
      if (!contentType.toLowerCase().startsWith('audio/wav')) {
        this.logger.error(`[TitiA Speech Proxy] unexpected content-type ${JSON.stringify({ contentType })}`);
        throw new BadGatewayException('Neural voice synthesis returned an invalid response');
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      this.logProxy('bytes received', { bytes: bytes.length });
      if (bytes.length === 0) {
        throw new BadGatewayException('Neural voice synthesis returned empty audio');
      }
      return bytes.toString('base64');
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      if (controller.signal.aborted) {
        this.logger.error(`[TitiA Speech Proxy] timeout ${JSON.stringify({ timeoutMs })}`);
      } else {
        const code = (error as { code?: string; cause?: { code?: string } })?.code ??
          (error as { cause?: { code?: string } })?.cause?.code ?? 'unknown';
        this.logger.error(`[TitiA Speech Proxy] network error ${JSON.stringify({ code })}`);
      }
      throw new BadGatewayException('Neural voice synthesis is unavailable');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private mlServiceBaseUrl(): string {
    const baseUrl = this.config.getOrThrow<string>('ML_SERVICE_URL').replace(/\/+$/, '');
    const parsed = new URL(baseUrl);
    if (parsed.pathname !== '' && parsed.pathname !== '/') {
      throw new ServiceUnavailableException('ML_SERVICE_URL must be a base URL without a path');
    }
    return baseUrl;
  }

  private logProxy(event: string, details: Record<string, string | number>) {
    this.logger.log(`[TitiA Speech Proxy] ${event} ${JSON.stringify(details)}`);
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
