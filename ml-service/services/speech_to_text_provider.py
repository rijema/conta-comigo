"""In-memory speech transcription. Child audio is never persisted or logged."""
import io
import os
import time
from functools import lru_cache
from typing import Protocol


class SpeechToTextProvider(Protocol):
    def transcribe(self, audio: bytes, language: str = "pt") -> dict: ...


class FasterWhisperSpeechToTextProvider:
    def __init__(self, model=None):
        self._model = model

    @property
    def model(self):
        if self._model is None:
            from faster_whisper import WhisperModel
            self._model = WhisperModel(
                os.getenv("WHISPER_MODEL", "small"),
                device=os.getenv("WHISPER_DEVICE", "cpu"),
                compute_type=os.getenv("WHISPER_COMPUTE_TYPE", "int8"),
            )
        return self._model

    def transcribe(self, audio: bytes, language: str = "pt") -> dict:
        started = time.perf_counter()
        stream = io.BytesIO(audio)
        try:
            segments, info = self.model.transcribe(stream, language=language, vad_filter=True)
            transcript = " ".join(segment.text.strip() for segment in segments).strip()
            return {
                "transcript": transcript,
                "language": info.language,
                "processingTimeMs": round((time.perf_counter() - started) * 1000),
            }
        finally:
            stream.close()
            audio = b""  # Drop the local reference immediately; no file is created.


@lru_cache(maxsize=1)
def get_stt_provider() -> FasterWhisperSpeechToTextProvider:
    return FasterWhisperSpeechToTextProvider()
