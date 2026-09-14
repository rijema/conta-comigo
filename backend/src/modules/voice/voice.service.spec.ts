import { BadGatewayException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { VoiceService } from './voice.service';

describe('VoiceService neural speech proxy', () => {
  const http = {};
  const interpreter = { interpret: jest.fn(() => 'REQUEST_HELP') };
  const values: Record<string, unknown> = {
    ENABLE_NEURAL_TTS: 'true', ENABLE_VOICE_COMMANDS: 'true',
    ML_SERVICE_URL: 'http://ml.internal:8080/', VOICE_PROCESSING_TIMEOUT_MS: 30000,
  };
  const config = {
    get: jest.fn((key: string, fallback?: unknown) => values[key] ?? fallback),
    getOrThrow: jest.fn((key: string) => values[key]),
  };
  const originalFetch = global.fetch;
  const service = () => new VoiceService(http as any, config as any, interpreter as any);

  afterEach(() => {
    global.fetch = originalFetch;
    values.ML_SERVICE_URL = 'http://ml.internal:8080/';
    values.VOICE_PROCESSING_TIMEOUT_MS = 30000;
    jest.restoreAllMocks();
  });

  it('forwards the DTO and converts an audio/wav response to base64', async () => {
    const wav = Buffer.from('RIFF-test-wav');
    global.fetch = jest.fn().mockResolvedValue(new Response(wav, {
      status: 200, headers: { 'content-type': 'audio/wav' },
    }));
    await expect(service().synthesize('Oi, TitiA!', 'pt-BR', 0.9)).resolves.toBe(wav.toString('base64'));
    expect(global.fetch).toHaveBeenCalledWith('http://ml.internal:8080/voice/synthesize',
      expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Oi, TitiA!', language: 'pt-BR', rate: 0.9 }),
        signal: expect.any(AbortSignal) }));
  });

  it('maps a non-200 ML response to 502 without parsing WAV as JSON', async () => {
    const text = jest.fn().mockResolvedValue('provider unavailable');
    const json = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, status: 503, headers: new Headers({ 'content-type': 'application/json' }), text, json,
    });
    await expect(service().synthesize('Olá')).rejects.toBeInstanceOf(BadGatewayException);
    expect(text).toHaveBeenCalledTimes(1);
    expect(json).not.toHaveBeenCalled();
  });

  it('maps network errors to 502', async () => {
    global.fetch = jest.fn().mockRejectedValue(Object.assign(new Error('refused'), { code: 'ECONNREFUSED' }));
    await expect(service().synthesize('Olá')).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('maps its configured timeout to 502', async () => {
    values.VOICE_PROCESSING_TIMEOUT_MS = 1;
    global.fetch = jest.fn((_url, options) => new Promise((_resolve, reject) => {
      (options?.signal as AbortSignal).addEventListener('abort', () =>
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    })) as typeof fetch;
    await expect(service().synthesize('Olá')).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('rejects a successful response that is not audio/wav', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response('{}', {
      status: 200, headers: { 'content-type': 'application/json' },
    }));
    await expect(service().synthesize('Olá')).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('requires ML_SERVICE_URL to be a base URL', async () => {
    values.ML_SERVICE_URL = 'http://ml.internal:8080/health';
    await expect(service().synthesize('Olá')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('does not write raw speech text to operational logs', async () => {
    const childText = 'conteúdo infantil secreto';
    const messages: string[] = [];
    jest.spyOn(Logger.prototype, 'log').mockImplementation((message) => { messages.push(String(message)); });
    jest.spyOn(Logger.prototype, 'error').mockImplementation((message) => { messages.push(String(message)); });
    global.fetch = jest.fn().mockResolvedValue(new Response(Buffer.from('wav'), {
      status: 200, headers: { 'content-type': 'audio/wav' },
    }));
    await service().synthesize(childText);
    expect(messages.join(' ')).not.toContain(childText);
    expect(messages.join(' ')).toContain(`"textLength":${childText.length}`);
  });
});
