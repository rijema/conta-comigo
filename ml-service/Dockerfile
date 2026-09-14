FROM python:3.11-slim

WORKDIR /app

COPY ml-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ml-service/ .

RUN mkdir -p /app/models
ARG PIPER_VOICE_BASE_URL=https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/pt/pt_BR/edresson/low
RUN python -c "from urllib.request import urlretrieve; base='${PIPER_VOICE_BASE_URL}'; files=('pt_BR-edresson-low.onnx','pt_BR-edresson-low.onnx.json','MODEL_CARD'); [urlretrieve(f'{base}/{name}', f'/app/models/{name}') for name in files]"

ENV PIPER_MODEL_PATH=/app/models/pt_BR-edresson-low.onnx
LABEL org.opencontainers.image.titia-voice="Piper pt_BR-edresson-low" \
      org.opencontainers.image.titia-voice-license="CC-BY-4.0"

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
