"""Optional Piper synthesis with an in-memory cache for generated TitiA audio only."""
import io
import os
import wave
from functools import lru_cache


class PiperNeuralTTSProvider:
    def __init__(self, voice=None):
        self._voice = voice
        self.model_path = os.getenv("PIPER_MODEL_PATH")

    @property
    def available(self) -> bool:
        return self._voice is not None or bool(self.model_path and os.path.isfile(self.model_path))

    @property
    def voice(self):
        if self._voice is None:
            if not self.available:
                raise RuntimeError("PIPER_MODEL_PATH is not configured")
            from piper.voice import PiperVoice
            self._voice = PiperVoice.load(self.model_path)
        return self._voice

    @lru_cache(maxsize=128)
    def synthesize(self, text: str, voice_id: str, language: str, rate: float, version: str) -> bytes:
        output = io.BytesIO()
        with wave.open(output, "wb") as wav_file:
            self.voice.synthesize_wav(text, wav_file)
        return output.getvalue()


@lru_cache(maxsize=1)
def get_tts_provider() -> PiperNeuralTTSProvider:
    return PiperNeuralTTSProvider()
