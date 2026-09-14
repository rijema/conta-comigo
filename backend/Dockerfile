FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY backend/package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY backend .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/migrations/schema.sql ./dist/database/migrations/schema.sql
COPY --from=builder /app/package.json ./
COPY ontology/contacomigo /ontology/contacomigo
ENV CONTACOMIGO_ONTOLOGY_PATH=/ontology/contacomigo/contacomigo.owl

EXPOSE 3001
CMD ["npm", "start"]
