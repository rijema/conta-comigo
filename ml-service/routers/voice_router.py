import base64
import os
import logging
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field
from services.speech_to_text_provider import get_stt_provider
from services.neural_tts_provider import get_tts_provider

router = APIRouter()
logger = logging.getLogger(__name__)
MAX_AUDIO_BYTES = int(os.getenv("VOICE_MAX_AUDIO_BYTES", "2000000"))


class TranscriptionRequest(BaseModel):
    audioBase64: str = Field(min_length=1)
    language: str = Field(default="pt", pattern=r"^pt(?:-BR)?$")


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    language: str = Field(default="pt-BR", pattern=r"^pt-BR$")
    rate: float = Field(default=0.85, ge=0.5, le=2.0)


@router.post("/transcribe")
def transcribe(body: TranscriptionRequest):
    try:
        audio = base64.b64decode(body.audioBase64, validate=True)
    except ValueError as error:
        raise HTTPException(400, "Invalid audio encoding") from error
    if len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(413, "Audio buffer exceeds the configured limit")
    try:
        return get_stt_provider().transcribe(audio, body.language.split("-")[0])
    finally:
        audio = b""


@router.post("/synthesize")
def synthesize(body: SpeechRequest):
    provider = get_tts_provider()
    if not provider.available:
        raise HTTPException(503, "Neural TTS is not configured")
    try:
        audio = provider.synthesize(body.text, "titia-pt-br", body.language, body.rate, "piper-1")
    except Exception as error:
        logger.exception("TitiA neural synthesis failed")
        raise HTTPException(503, "Neural TTS synthesis failed") from error
    return Response(audio, media_type="audio/wav", headers={"Cache-Control": "private, max-age=86400"})


@router.get("/status")
def voice_status():
    provider = get_tts_provider()
    return {
        "sttConfigured": True,
        "neuralTtsConfigured": provider.available,
        "neuralTtsModel": os.path.basename(provider.model_path) if provider.model_path else None,
    }
