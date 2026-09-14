FROM python:3.11-slim

WORKDIR /app

COPY ml-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ml-service/ .

RUN mkdir -p /app/models
ARG PIPER_MODEL_URL=https://huggingface.co/OpenVoiceOS/pipertts_pt-BR_dii/resolve/3828118/dii_pt-BR.onnx
ARG PIPER_CONFIG_URL=https://huggingface.co/OpenVoiceOS/pipertts_pt-BR_dii/resolve/3828118/dii_pt-BR.onnx.json
RUN python -c "from urllib.request import urlretrieve; urlretrieve('${PIPER_MODEL_URL}', '/app/models/dii_pt-BR.onnx'); urlretrieve('${PIPER_CONFIG_URL}', '/app/models/dii_pt-BR.onnx.json')"

ENV PIPER_MODEL_PATH=/app/models/dii_pt-BR.onnx
ENV PIPER_CONFIG_PATH=/app/models/dii_pt-BR.onnx.json
LABEL org.opencontainers.image.titia-voice="OpenVoiceOS Dii pt-BR" \
      org.opencontainers.image.titia-voice-license="CC-BY-NC-ND-4.0" \
      org.opencontainers.image.titia-voice-attribution="TigreGotico Lda"

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
