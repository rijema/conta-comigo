import { BadGatewayException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { VoiceService } from './voice.service';

describe('VoiceService', () => {
  const config = {
    get: jest.fn((key: string, fallback?: unknown) => ({
      ENABLE_NEURAL_TTS: 'true', ENABLE_VOICE_COMMANDS: 'true',
      ML_SERVICE_URL: 'http://ml.internal:8000', VOICE_PROCESSING_TIMEOUT_MS: 30000,
    } as Record<string, unknown>)[key] ?? fallback),
    getOrThrow: jest.fn(() => 'http://ml.internal:8000/'),
  };
  const interpreter = { interpret: jest.fn(() => 'REQUEST_HELP') };

  it('proxies neural synthesis as transient base64 audio', async () => {
    const http = { post: jest.fn(() => of({ data: Buffer.from('wav') })) };
    const service = new VoiceService(http as any, config as any, interpreter as any);
    await expect(service.synthesize('Olá', 'pt-BR', 0.9)).resolves.toBe(Buffer.from('wav').toString('base64'));
    expect(http.post).toHaveBeenCalledWith('http://ml.internal:8000/voice/synthesize',
      { text: 'Olá', language: 'pt-BR', rate: 0.9 }, { responseType: 'arraybuffer' });
  });

  it('reports an unavailable ML provider as a gateway failure', async () => {
    const error = Object.assign(new Error('refused'), { isAxiosError: true, code: 'ECONNREFUSED' });
    const http = { post: jest.fn(() => throwError(() => error)) };
    const service = new VoiceService(http as any, config as any, interpreter as any);
    await expect(service.synthesize('Olá')).rejects.toBeInstanceOf(BadGatewayException);
  });
});
