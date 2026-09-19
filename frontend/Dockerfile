FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm install --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_AUTBOT_URL
ARG NEXT_PUBLIC_ENABLE_VOICE_COMMANDS=false
ARG NEXT_PUBLIC_ENABLE_NEURAL_TTS=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AUTBOT_URL=$NEXT_PUBLIC_AUTBOT_URL
ENV NEXT_PUBLIC_ENABLE_VOICE_COMMANDS=$NEXT_PUBLIC_ENABLE_VOICE_COMMANDS
ENV NEXT_PUBLIC_ENABLE_NEURAL_TTS=$NEXT_PUBLIC_ENABLE_NEURAL_TTS
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
