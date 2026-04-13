# 🧩 MathASD

### Plataforma Adaptativa de Matemática para Crianças com TEA

**Uma plataforma educacional web adaptativa para o ensino de matemática a
crianças (6–10 anos) com Transtorno do Espectro Autista (TEA), alinhada à BNCC
brasileira, fundamentada em modelagem ontológica de usuário e Learning Analytics.**

[🇧🇷 Leia em Português](#-documentação-em-português) · 
[📖 Docs](#-documentação) · 
[🚀 Quick Start](#-quick-start) · 
[🌐 Deploy](#-deployment) · 
[🔬 Research](#-valor-acadêmico)

</div>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Quick Start — Local](#-quick-start)
- [Variáveis de Ambiente & Chaves de API](#-variáveis-de-ambiente--chaves-de-api)
- [Deployment (Produção)](#-deployment)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Reference](#-api-reference)
- [Valor Acadêmico](#-valor-acadêmico)
- [Contribuição](#-contribuição)
- [Licença](#-licença)
- [Documentação em Português](#-documentação-em-português)

---

## 🎯 Visão Geral

O **MathASD** é um sistema de aprendizagem adaptativa desenvolvido como
dissertação de mestrado. Ele combina:

| Componente | Tecnologia | Função |
|---|---|---|
| **ADE** — Motor de Decisão Adaptativa | NestJS + Ontologia JSON-LD | Decide próxima atividade, dificuldade, modalidade |
| **LAE** — Motor de Learning Analytics | Python + FastAPI + BKT | Rastreia maestria de habilidades, índice de engajamento |
| **Modelagem Ontológica** | LASDONT (OWL/JSON-LD) | Perfil do aprendiz, forças, fraquezas, nível de suporte TEA |
| **Alinhamento BNCC** | Habilidades EF01–EF05MA | Garante cobertura curricular brasileira |
| **Interface Adaptativa** | Next.js 14 + Framer Motion | UI gamificada, controle sensorial, WCAG 2.1 AA |
| **Privacidade** | JWT + LGPD | Consentimento, pseudonimização, papéis |

### Por que MathASD?

- 🧠 **IA Real** — BKT (Bayesian Knowledge Tracing) + XGBoost para engajamento
- 🗺️ **Ontologia Real** — Derivada de LASDONT (OWL), mapeada para JSON-LD e PostgreSQL
- 📚 **BNCC Real** — 127+ habilidades matemáticas (1º ao 5º ano) catalogadas
- ♿ **Acessibilidade Real** — Modo baixo estímulo, controle de contraste, áudio
- 🔍 **XAI** — Cada decisão do ADE é registrada com rastreio de justificativa

---

## 🏗️ Arquitetura
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION TIER                      │
│                     Vercel (Free)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Learner UI   │  │ Guardian UI  │  │ Educator Dash │  │
│  │ Next.js 14   │  │ Next.js 14   │  │ Next.js 14    │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼────────────────┼──────────────────┼───────────┘
│   HTTPS/REST + WebSocket           │
┌─────────▼────────────────▼──────────────────▼───────────┐
│               APPLICATION TIER (Railway/Render)          │
│  ┌───────────────────────────────────────────────────┐   │
│  │           NestJS Backend (TypeScript)             │   │
│  │  Auth │ Users │ Activities │ Analytics │ ADE      │   │
│  │           ↓ ADE Core (Never Mocked)               │   │
│  │  OntologyReasoner + RuleEngine + MLEngine         │   │
│  └───────────────────┬───────────────────────────────┘   │
│                      │ HTTP                               │
│  ┌───────────────────▼───────────────────────────────┐   │
│  │           FastAPI ML Service (Python)             │   │
│  │           BKT + XGBoost Engagement                │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
│ SQL                    │ Events
┌─────────▼──────────┐  ┌─────────▼──────────────────────┐
│  DATA TIER         │  │  EVENT BUS                      │
│  Supabase/Postgres │  │  Redis Streams (Railway)        │
│  + JSONB           │  │  Kafka-compatible topics        │
└────────────────────┘  └────────────────────────────────┘
Copy
### Fluxo de Requisição Completo

Criança interage com atividade (frontend)
Frontend → POST /api/activities/attempt
Backend publica evento → Redis topic: platform.activity.events
Analytics consumer processa → atualiza BKT
ADE é acionado:
a. Carrega ontologia do aprendiz (JSON-LD do PostgreSQL)
b. Aplica regras SWRL-equiv (TypeScript)
c. Chama ML Service → GET /predict/next-activity
d. Sintetiza decisão + log XAI
Backend responde ao frontend com:

next_activity_id
difficulty_adjustment
modality (visual/auditory/kinesthetic)
feedback_message


Decisão + métricas persistidas no PostgreSQL
Frontend atualiza UI adaptativamente

Copy
---

## 🚀 Quick Start

### Pré-requisitos

| Ferramenta | Versão | Verificar |
|---|---|---|
| Node.js | 20+ | `node --version` |
| Python | 3.11+ | `python --version` |
| Docker Desktop | Qualquer | `docker --version` |
| Git | Qualquer | `git --version` |
| pnpm (opcional) | 8+ | `pnpm --version` |

---

### ⚡ Opção A — Docker Compose (Recomendado — mais rápido)

> Sobe tudo com um comando. Ideal para ver o sistema rodando em < 5 minutos.

```bash
# 1. Clone o repositório
git clone https://github.com/your-org/mathasd.git
cd mathasd

# 2. Copie os arquivos de ambiente
cp backend/.env.example    backend/.env
cp frontend/.env.example   frontend/.env.local
cp ml-service/.env.example ml-service/.env

# 3. Preencha as variáveis mínimas (veja a seção abaixo)
#    Edite backend/.env com seu editor favorito
nano backend/.env   # ou: code backend/.env

# 4. Suba todos os serviços
docker compose up --build

# 5. Em outro terminal, rode as migrations
docker compose exec backend pnpm run migration:run

# 6. (Opcional) Seed com dados de exemplo
docker compose exec backend pnpm run seed

# 7. Acesse o sistema
open http://localhost:3000   # Frontend
open http://localhost:3001   # Backend API
open http://localhost:8000   # ML Service / Swagger
open http://localhost:8000/docs  # FastAPI Swagger UI

Credenciais padrão (seed):

Criança: child@demo.com / Demo123!
Responsável: guardian@demo.com / Demo123!
Educador: educator@demo.com / Demo123!



🛠️ Opção B — Execução Manual (Desenvolvimento)
1. Banco de Dados (PostgreSQL)
bashCopy# Opção B1: Docker apenas para o banco
docker run --name mathasd-db \
  -e POSTGRES_DB=mathasd \
  -e POSTGRES_USER=mathasd_user \
  -e POSTGRES_PASSWORD=mathasd_pass \
  -p 5432:5432 \
  -d postgres:15-alpine

# Opção B2: PostgreSQL local já instalado
# Crie o banco manualmente:
psql -U postgres -c "CREATE DATABASE mathasd;"
psql -U postgres -c "CREATE USER mathasd_user WITH PASSWORD 'mathasd_pass';"
psql -U postgres -c "GRANT ALL ON DATABASE mathasd TO mathasd_user;"
2. Redis (para eventos)
bashCopydocker run --name mathasd-redis \
  -p 6379:6379 \
  -d redis:7-alpine
3. Backend (NestJS)
bashCopycd backend
cp .env.example .env
# Edite .env conforme necessário

npm install   # ou: pnpm install

# Rodar migrations
npm run migration:run

# Seed (opcional)
npm run seed

# Iniciar em modo desenvolvimento
npm run start:dev

# Backend disponível em: http://localhost:3001
# Swagger UI em:         http://localhost:3001/api/docs
4. ML Service (FastAPI)
bashCopycd ml-service
cp .env.example .env

# Criar ambiente virtual Python
python -m venv venv

# Ativar ambiente virtual
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Iniciar servidor
uvicorn main:app --reload --port 8000

# ML Service disponível em: http://localhost:8000
# Swagger UI em:            http://localhost:8000/docs
5. Frontend (Next.js)
bashCopycd frontend
cp .env.example .env.local
# Edite .env.local conforme necessário

npm install   # ou: pnpm install

# Iniciar em modo desenvolvimento
npm run dev

# Frontend disponível em: http://localhost:3000

🔑 Variáveis de Ambiente & Chaves de API
Como obter cada chave
JWT_SECRET
bashCopy# Gere um segredo forte (nunca use o padrão em produção):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copie o output e cole em JWT_SECRET=
DATABASE_URL — Supabase (Gratuito)

Acesse supabase.com → New Project
Aguarde o provisionamento (~2 min)
Vá em Project Settings → Database → Connection string
Copie a URI no formato: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
Troque [PASSWORD] pela senha definida na criação do projeto
Cole em DATABASE_URL=

REDIS_URL — Railway (Gratuito via GitHub Student Pack)

Acesse railway.app → New Project → Add Redis
Clique no serviço Redis → Variables → copie REDIS_URL
Cole em REDIS_URL=

ML_SERVICE_URL

Local: http://localhost:8000
Railway: URL gerada após deploy (ver seção Deployment)
Render: https://mathasd-ml.onrender.com (exemplo)

NEXT_PUBLIC_API_URL

Local: http://localhost:3001
Produção: URL do seu backend deployado


backend/.env — Referência Completa
bashCopy# ============================================================
# MathASD Backend — Environment Variables
# ============================================================
# Copie este arquivo para .env e preencha os valores
# NUNCA commite o .env com valores reais no Git
# ============================================================

# --- App ---
NODE_ENV=development
PORT=3001
APP_NAME=MathASD
APP_VERSION=1.0.0

# --- Database (PostgreSQL / Supabase) ---
# Formato: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
# Supabase: veja Project Settings > Database > Connection string
DATABASE_URL=postgresql://mathasd_user:mathasd_pass@localhost:5432/mathasd

# --- JWT Authentication ---
# Gere com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=CHANGE_ME_GENERATE_STRONG_SECRET_64_BYTES
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=CHANGE_ME_DIFFERENT_FROM_JWT_SECRET
JWT_REFRESH_EXPIRES_IN=30d

# --- Redis (Event Bus) ---
# Railway Redis: veja Variables > REDIS_URL
# Local: redis://localhost:6379
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# --- ML Service ---
# Local: http://localhost:8000
# Railway/Render: https://mathasd-ml.railway.app
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_TIMEOUT_MS=5000

# --- CORS ---
# Adicione múltiplas origens separadas por vírgula
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# --- Rate Limiting ---
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# --- Logging ---
LOG_LEVEL=debug
LOG_FORMAT=json

# --- LGPD ---
# Dias até expiração do consentimento (LGPD requer renovação periódica)
CONSENT_EXPIRY_DAYS=365
DATA_RETENTION_DAYS=1825

# --- Feature Flags ---
ENABLE_EVENT_BUS=true
ENABLE_ML_SERVICE=true
ENABLE_ONTOLOGY=true

frontend/.env.local — Referência Completa
bashCopy# ============================================================
# MathASD Frontend — Environment Variables
# ============================================================

# --- API ---
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# --- App ---
NEXT_PUBLIC_APP_NAME=MathASD
NEXT_PUBLIC_APP_VERSION=1.0.0

# --- Analytics (opcional) ---
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# --- Feature Flags ---
NEXT_PUBLIC_ENABLE_LOW_STIMULATION=true
NEXT_PUBLIC_ENABLE_AUDIO=true

ml-service/.env — Referência Completa
bashCopy# ============================================================
# MathASD ML Service — Environment Variables
# ============================================================

# --- App ---
ENVIRONMENT=development
LOG_LEVEL=debug

# --- Database (mesma instância do backend) ---
DATABASE_URL=postgresql://mathasd_user:mathasd_pass@localhost:5432/mathasd

# --- Model Config ---
BKT_LEARNING_RATE=0.3
BKT_GUESS_RATE=0.25
BKT_SLIP_RATE=0.1
BKT_PRIOR_KNOWLEDGE=0.1

# --- CORS (aceitar requisições do backend NestJS) ---
ALLOWED_ORIGINS=http://localhost:3001

🌐 Deployment
Estratégia de Deploy Gratuito (GitHub Student Pack)
CopyFrontend  → Vercel         (gratuito, CI/CD automático)
Backend   → Railway        (gratuito $5/mês via Student Pack)
ML Svc    → Railway        (segundo serviço no mesmo projeto)
Database  → Supabase       (gratuito 500MB)
Redis     → Railway        (plugin Redis gratuito)

1. Frontend → Vercel
bashCopy# Instale a CLI da Vercel
npm install -g vercel

# Na pasta frontend/:
cd frontend
vercel login   # autenticação via GitHub

# Deploy de produção
vercel --prod

# Configure as variáveis de ambiente no painel Vercel:
# vercel.com > Seu Projeto > Settings > Environment Variables
# Adicione:
#   NEXT_PUBLIC_API_URL     = https://mathasd-backend.railway.app
#   NEXT_PUBLIC_WS_URL      = wss://mathasd-backend.railway.app
#   NEXT_PUBLIC_APP_NAME    = MathASD
Configuração de CI/CD automático:

Vercel Dashboard → Import Git Repository
Selecione seu repo → Set Root Directory para frontend/
Todo git push main → deploy automático ✅


2. Backend → Railway
bashCopy# Instale a CLI do Railway
npm install -g @railway/cli

# Login
railway login

# Crie o projeto
railway init

# Dentro da pasta backend/:
cd backend
railway up

# Configure variáveis de ambiente:
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="seu_jwt_secret"
railway variables set REDIS_URL="${{Redis.REDIS_URL}}"    # Railway injeta automaticamente
railway variables set ML_SERVICE_URL="https://mathasd-ml.railway.app"
railway variables set NODE_ENV="production"
railway variables set ALLOWED_ORIGINS="https://mathasd.vercel.app"

# Ver URL gerada:
railway status
# Output: https://mathasd-backend-production.up.railway.app
Via painel web (alternativa):

railway.app → New Project → Deploy from GitHub repo
Selecione seu repo → Set root directory: backend/
Railway detecta package.json automaticamente
Vá em Variables → adicione todas as variáveis acima
Vá em Settings → Custom Start Command: node dist/main.js
Adicione um serviço Redis: + New → Database → Redis


3. ML Service → Railway
bashCopy# No mesmo projeto Railway, adicione um novo serviço:
# Dashboard → + New Service → GitHub Repo → Root: ml-service/

# Variáveis necessárias:
railway variables set DATABASE_URL="postgresql://..."
railway variables set ENVIRONMENT="production"
railway variables set ALLOWED_ORIGINS="https://mathasd-backend.railway.app"

# Railway detecta requirements.txt e usa Python buildpack automaticamente

4. Render (Alternativa Gratuita ao Railway)
yamlCopy# render.yaml (coloque na raiz do projeto)
services:
  - type: web
    name: mathasd-backend
    env: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: mathasd-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true

  - type: web
    name: mathasd-ml
    env: python
    rootDir: ml-service
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT

databases:
  - name: mathasd-db
    databaseName: mathasd
    user: mathasd_user
bashCopy# Deploy via CLI do Render:
npm install -g @render-cli/cli
render deploy

5. Banco de Dados → Supabase

Acesse supabase.com → New Project
Dê um nome: mathasd-production
Escolha uma senha forte (salve em lugar seguro)
Região: South America (São Paulo) — menor latência no Brasil
Aguarde ~2 min para provisionamento
Project Settings → Database → copie Connection string (URI)
Use como DATABASE_URL em todos os serviços

Executar migrations no Supabase:
bashCopy# Via CLI do projeto local:
cd backend
DATABASE_URL="postgresql://postgres:SUA_SENHA@db.xxxx.supabase.co:5432/postgres" \
  npm run migration:run

Checklist de Deploy ✅
Copy[ ] Supabase: projeto criado, DATABASE_URL copiada
[ ] Railway: projeto criado, Redis adicionado
[ ] Backend: deploy OK, migration executada
[ ] ML Service: deploy OK, /health retorna 200
[ ] Frontend: deploy Vercel OK
[ ] Variáveis: todas configuradas em todos os serviços
[ ] CORS: ALLOWED_ORIGINS aponta para domínios corretos
[ ] JWT_SECRET: diferente em produção e desenvolvimento
[ ] Seed: dados iniciais (BNCC skills) carregados
[ ] Teste: login, atividade, decisão ADE funcionando end-to-end

📁 Estrutura do Projeto
Copymathasd/
│
├── 📄 README.md                    ← Este arquivo
├── 📄 README.pt.md                 ← Versão em Português
├── 🐳 docker-compose.yml           ← Orquestração local completa
├── 🐳 docker-compose.prod.yml      ← Configuração de produção
├── 📄 .gitignore
├── 📄 render.yaml                  ← Deploy no Render (alternativa)
│
├── 🔧 backend/                     ← NestJS (Node.js + TypeScript)
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   └── app.config.ts
│   │   ├── modules/
│   │   │   ├── auth/               ← JWT, Guards, LGPD
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   └── dto/
│   │   │   ├── users/              ← child_profiles, guardians, educators
│   │   │   ├── activities/         ← BNCC-aligned activity CRUD + attempts
│   │   │   ├── analytics/          ← LAE: BKT updates, engagement
│   │   │   ├── ade/                ← ADE Core (NEVER MOCKED)
│   │   │   │   ├── ade.module.ts
│   │   │   │   ├── ade.service.ts
│   │   │   │   ├── ade.controller.ts
│   │   │   │   ├── engines/
│   │   │   │   │   ├── ontology.reasoner.ts
│   │   │   │   │   ├── rule.engine.ts
│   │   │   │   │   └── ml.engine.ts
│   │   │   │   └── dto/
│   │   │   └── events/             ← Redis Streams producer/consumer
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── filters/
│   │   └── database/
│   │       ├── migrations/
│   │       └── seeds/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── 🎨 frontend/                    ← Next.js 14 (React + TypeScript)
│   ├── app/                        ← App Router
│   │   ├── (learner)/              ← Portal da criança
│   │   ├── (guardian)/             ← Portal do responsável
│   │   ├── (educator)/             ← Dashboard do educador
│   │   └── (auth)/                 ← Login, registro
│   ├── components/
│   │   ├── activity/               ← Renderizadores de atividade
│   │   ├── accessibility/          ← Controles sensoriais, contraste
│   │   ├── dashboard/              ← Gráficos, progresso
│   │   └── ui/                     ← Design system
│   ├── lib/
│   │   ├── api/                    ← Cliente HTTP tipado
│   │   └── i18n/                   ← PT/EN translations
│   ├── public/
│   │   └── sounds/                 ← Áudios acessíveis
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
│
├── 🤖 ml-service/                  ← FastAPI (Python 3.11)
│   ├── main.py                     ← Entrypoint + routers
│   ├── models/
│   │   ├── bkt.py                  ← Bayesian Knowledge Tracing
│   │   ├── engagement.py           ← XGBoost engagement classifier
│   │   └── modality.py             ← Modality recommender
│   ├── routers/
│   │   ├── predict.py
│   │   └── health.py
│   ├── schemas/
│   ├── .env.example
│   ├── requirements.txt
│   └── Dockerfile
│
└── 📊 docs/
    ├── architecture.md
    ├── ontology.md
    ├── api.md
    └── research.md

📡 API Reference
Endpoints Principais
httpCopy# Auth
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
DELETE /api/auth/logout

# Users
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/child-profile/:id

# Activities
GET    /api/activities                    ?bnccSkill=EF01MA01&difficulty=easy
GET    /api/activities/:id
POST   /api/activities/:id/attempt        ← Dispara evento → ADE
GET    /api/activities/next/:learnerId    ← Retorna decisão do ADE

# Analytics
GET    /api/analytics/learner/:id/skills
GET    /api/analytics/learner/:id/engagement
GET    /api/analytics/learner/:id/bncc-coverage
GET    /api/analytics/sessions

# ADE
POST   /api/ade/decide                    ← Invoca motor de decisão
GET    /api/ade/decisions/:learnerId      ← Histórico de decisões (XAI)
ML Service Endpoints
httpCopyGET    /health
POST   /predict/mastery           ← BKT: P(mastery|attempts)
POST   /predict/engagement        ← XGBoost: engagement score
POST   /predict/next-activity     ← Recomendação integrada
GET    /docs                      ← Swagger UI

🔬 Valor Acadêmico
Como este sistema suporta validação experimental
Este sistema foi projetado para suportar pesquisa em aprendizagem adaptativa para TEA:
1. Reprodutibilidade

Docker garante ambiente idêntico em qualquer máquina
Seeds determinísticos para dados de teste consistentes
Logs estruturados (JSON) para análise offline

2. Rastreabilidade (XAI)

Cada decisão do ADE registra: input do aprendiz, regras disparadas, saída do ML, justificativa
Tabela ade_decisions com campo xai_trace JSONB completo

3. Learning Analytics

BKT atualizado em tempo real por tentativa
Índice de engajamento calculado a cada sessão
Snapshots históricos para análise longitudinal

4. Alinhamento Curricular

127+ habilidades BNCC mapeadas (EF01–EF05MA)
Cobertura por competência rastreada por aprendiz

5. Ontologia

Derivada de LASDONT (OWL) — publicada em literatura acadêmica
Suporte a três níveis TEA (Leve, Moderado, Intenso)
Forças/fraquezas mapeadas: visual, auditivo, motor, sensorial, lógico


🤝 Contribuição
bashCopy# 1. Fork + clone
git clone https://github.com/SEU_USUARIO/mathasd.git

# 2. Crie uma branch descritiva
git checkout -b feature/ade-rule-geometry

# 3. Desenvolva + teste
npm run test
npm run test:e2e

# 4. Commit com Conventional Commits
git commit -m "feat(ade): add geometry rule for BKT mastery threshold"

# 5. Push + Pull Request
git push origin feature/ade-rule-geometry

📜 Licença
MIT License — veja LICENSE

🙏 Referências Acadêmicas

BNCC (2018) — Base Nacional Comum Curricular, MEC Brasil
LASDONT — Jeremias, R. (2024) — Ontologia para TEA em ambientes de aprendizagem
Corbett-Davies & Goel (2016) — Bayesian Knowledge Tracing
DSM-5 (2013) — Diagnostic and Statistical Manual of Mental Disorders



🇧🇷 Documentação em Português

🧩 MathASD — Documentação Completa (PT-BR)
O que é o MathASD?
O MathASD é uma plataforma educacional adaptativa para o ensino de matemática
a crianças de 6 a 10 anos com Transtorno do Espectro Autista (TEA). O sistema
combina Inteligência Artificial, Learning Analytics, ontologia de domínio
e alinhamento curricular BNCC para personalizar a experiência de aprendizagem
de cada criança.

🚀 Iniciando Localmente (Passo a Passo Detalhado)
Passo 1 — Clone o Repositório
bashCopygit clone https://github.com/seu-usuario/mathasd.git
cd mathasd
Passo 2 — Copie os Arquivos de Configuração
bashCopycp backend/.env.example    backend/.env
cp frontend/.env.example   frontend/.env.local
cp ml-service/.env.example ml-service/.env
Passo 3 — Configure as Variáveis Mínimas
Edite o arquivo backend/.env com as seguintes variáveis mínimas para rodar localmente:
bashCopy# Para uso local, estas configurações já funcionam sem alteração:
DATABASE_URL=postgresql://mathasd_user:mathasd_pass@localhost:5432/mathasd
REDIS_URL=redis://localhost:6379
ML_SERVICE_URL=http://localhost:8000

# ESTA DEVE SER ALTERADA — gere um valor único:
JWT_SECRET=mude_para_um_segredo_forte_de_64_bytes_aqui

# Gere automaticamente com:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
Passo 4 — Suba com Docker Compose
bashCopydocker compose up --build
Aguarde todos os serviços iniciarem (~2-3 minutos na primeira vez).
Passo 5 — Execute as Migrations do Banco
bashCopydocker compose exec backend npm run migration:run
Passo 6 — (Opcional) Carregue Dados de Exemplo
bashCopydocker compose exec backend npm run seed
Passo 7 — Acesse o Sistema
ServiçoURLDescriçãoFrontendhttp://localhost:3000Interface principalBackend APIhttp://localhost:3001/apiREST APISwaggerhttp://localhost:3001/api/docsDocumentação interativaML Servicehttp://localhost:8000/docsFastAPI SwaggerBancolocalhost:5432PostgreSQL (user: mathasd_user)

🔑 Como Obter as Chaves Necessárias
Para uso Local
Nenhuma chave externa é necessária. O Docker Compose sobe PostgreSQL e Redis localmente.
Para Deploy em Produção
1. Supabase (Banco de Dados — Gratuito)
Copy1. Acesse: https://supabase.com
2. Clique em "Start your project" → faça login com GitHub
3. Clique em "New project"
4. Nome: mathasd-prod
5. Senha do banco: escolha uma senha forte e guarde-a
6. Região: South America (São Paulo)
7. Clique em "Create new project" → aguarde ~2 minutos
8. Vá em: Settings (⚙️) → Database → Connection string → URI
9. Copie a URI — este é seu DATABASE_URL
   Formato: postgresql://postgres:[SUA_SENHA]@db.[ID].supabase.co:5432/postgres
2. Railway (Backend + ML + Redis — Gratuito com Student Pack)
Copy1. Acesse: https://railway.app
2. Faça login com GitHub
3. Clique em "New Project" → "Deploy from GitHub repo"
4. Selecione o repositório mathasd
5. Configure o Root Directory como "backend/"
6. Clique no serviço → aba "Variables"
7. Adicione cada variável do backend/.env.example
8. Para adicionar Redis: clique em "+ New" → "Database" → "Add Redis"
9. O Railway injeta REDIS_URL automaticamente com: ${{Redis.REDIS_URL}}
10. Para ver a URL pública do backend: aba "Settings" → "Domain"
3. Vercel (Frontend — Gratuito)
Copy1. Acesse: https://vercel.com
2. Faça login com GitHub
3. Clique em "Add New..." → "Project"
4. Importe o repositório mathasd
5. Configure:
   - Root Directory: frontend/
   - Framework Preset: Next.js (detectado automaticamente)
6. Em "Environment Variables", adicione:
   - NEXT_PUBLIC_API_URL: https://seu-backend.railway.app
   - NEXT_PUBLIC_WS_URL: wss://seu-backend.railway.app
7. Clique em "Deploy"
8. Sua URL será: https://mathasd.vercel.app (ou similar)

🏫 Estrutura Pedagógica
O MathASD implementa as 5 unidades temáticas da BNCC para o Ensino Fundamental - Anos Iniciais:
Unidade TemáticaHabilidades CobertasAnosNúmerosEF01MA01–EF05MA091º–5ºÁlgebraEF01MA09–EF05MA131º–5ºGeometriaEF01MA11–EF05MA181º–5ºGrandezas e MedidasEF01MA15–EF05MA211º–5ºProbabilidade e EstatísticaEF01MA20–EF05MA251º–5º

🤖 Como o Motor de IA Funciona
Copy1. ONTOLOGIA DO APRENDIZ
   └── Carrega perfil do aprendiz (forças, fraquezas, nível TEA)
   └── Fonte: LASDONT — ontologia OWL, armazenada em JSONB no PostgreSQL

2. BKT (Bayesian Knowledge Tracing)
   └── Para cada habilidade BNCC: P(domínio|tentativas)
   └── Atualizado após cada atividade completada

3. MOTOR DE REGRAS (TypeScript)
   └── "SE BKT(EF01MA01) > 0.85 E engajamento > 0.7
       ENTÃO avança para EF01MA06"
   └── 50+ regras pedagógicas codificadas

4. MOTOR ML (Python/FastAPI)
   └── XGBoost: prediz índice de engajamento
   └── Entrada: tempo na atividade, tentativas, acertos, hora do dia
   └── Saída: score 0.0–1.0

5. SÍNTESE E DECISÃO
   └── Combina ontologia + regras + ML
   └── Produz: próxima_atividade, ajuste_dificuldade, modalidade, feedback
   └── Registra decisão com trace XAI para auditoria

♿ Recursos de Acessibilidade
O MathASD segue WCAG 2.1 AA com recursos específicos para TEA:
RecursoControleDescriçãoModo Baixo EstímuloToggle na UIRemove animações, reduz coresControle de ContrasteSlider5 níveis de contrasteTamanho de FonteBotões +/-3 tamanhosÁudioToggleLiga/desliga todos os sonsTempo ExtraConfiguração do perfilAjusta timers das atividadesCursor GrandeToggleFacilita navegação motora

🔒 Privacidade e LGPD
O MathASD implementa a Lei Geral de Proteção de Dados (Lei 13.709/2018):

Consentimento: Termo de consentimento obrigatório no cadastro do responsável
Pseudonimização: IDs internos desvinculados do nome real
Anonimização: Dados de analytics sem informações pessoais identificáveis
Direito de exclusão: Endpoint para exclusão completa de dados (DELETE /api/users/:id/data)
Retenção: Dados de sessão expiram após 5 anos (configurável)
Acesso: Responsável pode baixar todos os dados da criança em qualquer momento


📊 Monitoramento
bashCopy# Ver logs do backend em tempo real
docker compose logs -f backend

# Ver logs do ML Service
docker compose logs -f ml-service

# Verificar saúde dos serviços
curl http://localhost:3001/api/health    # Backend
curl http://localhost:8000/health       # ML Service

# Métricas básicas (Prometheus-compatible endpoint)
curl http://localhost:3001/api/metrics

🐛 Solução de Problemas Comuns
Erro: connection refused no banco de dados
bashCopy# Verifique se o PostgreSQL está rodando:
docker compose ps
# Se não estiver: docker compose up db -d
# Aguarde 30 segundos e tente novamente
Erro: JWT secret must be at least 32 characters
bashCopy# Gere um JWT_SECRET válido:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Cole o resultado em backend/.env JWT_SECRET=
Erro: ML service timeout
bashCopy# Verifique se o ML service está rodando:
curl http://localhost:8000/health
# Se não: cd ml-service && uvicorn main:app --reload --port 8000
Erro: Migration failed
bashCopy# Verifique se o banco existe:
docker compose exec db psql -U mathasd_user -c "\l"
# Se necessário, recrie:
docker compose down -v
docker compose up --build
docker compose exec backend npm run migration:run
Frontend não conecta no backend (CORS)
bashCopy# Verifique ALLOWED_ORIGINS no backend/.env:
ALLOWED_ORIGINS=http://localhost:3000
# Reinicie o backend após alterar

📖 Glossário Técnico
TermoSignificadoADEAdaptive Decision Engine — Motor de Decisão AdaptativaLAELearning Analytics Engine — Motor de Learning AnalyticsBKTBayesian Knowledge Tracing — rastreamento de domínio de habilidadesBNCCBase Nacional Comum CurricularTEATranstorno do Espectro AutistaLASDONTLearning ASD Ontology — ontologia desenvolvida para o projetoXAIExplainable AI — IA explicável (registros de justificativa)LGPDLei Geral de Proteção de Dados (Lei 13.709/2018)WCAGWeb Content Accessibility GuidelinesJSONBJSON Binary — formato de armazenamento JSON no PostgreSQL

MathASD — Desenvolvido como dissertação de Mestrado em Engenharia da Computação
Alinhado à BNCC | Baseado em LASDONT | LGPD Compliant | WCAG 2.1 AA

Copy
---

# FILE: README.pt.md

```markdown
# 🧩 MathASD — Documentação Completa em Português

> **Este arquivo é a versão completa em português do README.
> Para a versão em inglês, veja [README.md](./README.md)**

---

## 📋 O que é o MathASD?

O **MathASD** é uma plataforma educacional web adaptativa para ensino de
matemática a crianças de **6 a 10 anos com Transtorno do Espectro Autista (TEA)**.

O sistema é desenvolvido como **dissertação de Mestrado em Engenharia da Computação**
e combina as seguintes tecnologias e abordagens:

- 🧠 **Inteligência Artificial Real** — BKT + XGBoost (não simulados)
- 🗺️ **Ontologia de Domínio** — LASDONT (derivada de OWL, armazenada em JSON-LD)
- 📚 **Alinhamento BNCC** — 127+ habilidades EF01MA–EF05MA mapeadas
- ♿ **Acessibilidade** — WCAG 2.1 AA + recursos específicos para TEA
- 🔒 **Privacidade** — Conformidade total com LGPD

---

## 🏗️ Visão Geral da Arquitetura

O sistema é composto por 4 camadas principais:
APRESENTAÇÃO (Vercel)
└── Portal da Criança    → Interface gamificada adaptativa
└── Portal do Responsável → Acompanhamento de progresso
└── Dashboard do Educador → Analytics e log de decisões ADE
APLICAÇÃO (Railway/Render)
└── Backend NestJS        → API REST + WebSocket + ADE
└── ML Service FastAPI    → BKT + Engajamento XGBoost
DADOS (Supabase)
└── PostgreSQL + JSONB    → Dados relacionais + ontologia
EVENTOS (Railway Redis)
└── Redis Streams         → Bus de eventos assíncrono
Copy
---

## 🚀 Rodando Localmente

### Requisitos

Você precisa ter instalado:

| Ferramenta | Como instalar |
|---|---|
| **Node.js 20+** | https://nodejs.org ou `nvm install 20` |
| **Python 3.11+** | https://python.org ou `pyenv install 3.11` |
| **Docker Desktop** | https://docker.com/get-started |
| **Git** | https://git-scm.com |

---

### Método Mais Rápido (Docker — recomendado)

```bash
# Clone o projeto
git clone https://github.com/seu-usuario/mathasd.git
cd mathasd

# Copie as configurações
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp ml-service/.env.example ml-service/.env

# IMPORTANTE: Gere um JWT_SECRET seguro
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
# Copie o output e adicione ao backend/.env

# Suba tudo
docker compose up --build

# Em outro terminal, configure o banco
docker compose exec backend npm run migration:run
docker compose exec backend npm run seed   # dados de exemplo (opcional)
Pronto! Acesse:

🌐 http://localhost:3000 — Sistema principal
📖 http://localhost:3001/api/docs — Documentação da API


Sem Docker (Desenvolvimento Manual)
<details>
<summary>Clique para expandir as instruções detalhadas</summary>
Banco de Dados
bashCopy# Inicie apenas o PostgreSQL via Docker
docker run --name mathasd-postgres \
  -e POSTGRES_DB=mathasd \
  -e POSTGRES_USER=mathasd_user \
  -e POSTGRES_PASSWORD=mathasd_pass \
  -p 5432:5432 -d postgres:15-alpine

# Inicie o Redis
docker run --name mathasd-redis \
  -p 6379:6379 -d redis:7-alpine
Backend
bashCopycd backend
cp .env.example .env
# Edite .env — pelo menos JWT_SECRET deve ser alterado

npm install
npm run migration:run
npm run seed         # opcional
npm run start:dev
# Disponível em: http://localhost:3001
ML Service
bashCopycd ml-service
cp .env.example .env
python -m venv venv
source venv/bin/activate    # Linux/Mac
# venv\Scripts\activate     # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Disponível em: http://localhost:8000
Frontend
bashCopycd frontend
cp .env.example .env.local
npm install
npm run dev
# Disponível em: http://localhost:3000
</details>

🔑 Guia Completo de Chaves e Configurações
Variáveis por Serviço
backend/.env — Variáveis Obrigatórias
VariávelComo ObterExemploDATABASE_URLSupabase → Settings → Databasepostgresql://postgres:...JWT_SECRETnode -e "..." (ver abaixo)String de 64+ bytesREDIS_URLRailway → Redis pluginredis://...ML_SERVICE_URLURL do ML Service deployadohttps://ml.railway.app
Gerar JWT_SECRET:
bashCopynode -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Output: 7a3f2b1c4d... (copie este valor)
frontend/.env.local — Variáveis Obrigatórias
VariávelValor LocalValor ProduçãoNEXT_PUBLIC_API_URLhttp://localhost:3001https://backend.railway.appNEXT_PUBLIC_WS_URLws://localhost:3001wss://backend.railway.app

🌐 Deploy em Produção (Gratuito)
Visão Geral dos Serviços
Copy┌─────────────────────────────────────────────────────────┐
│  SERVIÇO          PLATAFORMA      CUSTO    LINK          │
├─────────────────────────────────────────────────────────┤
│  Frontend         Vercel          Grátis   vercel.com    │
│  Backend          Railway         $5/mês*  railway.app   │
│  ML Service       Railway         incluso  railway.app   │
│  PostgreSQL       Supabase        Grátis** supabase.com  │
│  Redis            Railway         incluso  railway.app   │
└─────────────────────────────────────────────────────────┘
* Grátis com GitHub Student Developer Pack
** 500MB gratuitos — suficiente para dezenas de alunos
1. Deploy do Banco (Supabase)
Copy1. Acesse https://supabase.com → "Start your project"
2. Faça login com sua conta GitHub
3. Clique em "New project"
4. Preencha:
   - Name: mathasd-producao
   - Database Password: [escolha uma senha forte]
   - Region: South America (São Paulo)  ← importante para latência no Brasil
5. Clique em "Create new project"
6. Aguarde 2-3 minutos
7. Vá em: ícone ⚙️ Settings → Database → Connection string
8. Clique em "URI" e copie o endereço
   Exemplo: postgresql://postgres:SuaSenha@db.abcdef.supabase.co:5432/postgres
9. Guarde esta URL — será usada como DATABASE_URL
2. Deploy do Backend (Railway)
Copy1. Acesse https://railway.app
2. Faça login com GitHub
3. Clique em "New Project" → "Deploy from GitHub repo"
4. Autorize o Railway a acessar seus repositórios
5. Selecione o repositório mathasd
6. Na configuração:
   - Root Directory: backend/
   - Build Command: npm install && npm run build   (detectado automaticamente)
   - Start Command: node dist/main.js
7. Clique no serviço criado → aba "Variables"
8. Adicione cada variável:
   DATABASE_URL     = [sua URL do Supabase]
   JWT_SECRET       = [seu segredo gerado]
   NODE_ENV         = production
   PORT             = 3001
   ALLOWED_ORIGINS  = https://mathasd.vercel.app
9. Adicione Redis: "+ New" → "Database" → "Add Redis"
   O Railway configura REDIS_URL automaticamente
10. Vá em "Settings" → "Domain" → copie a URL pública
    Exemplo: https://mathasd-backend.up.railway.app
11. Execute a migration:
    No terminal: railway run npm run migration:run
3. Deploy do ML Service (Railway)
Copy1. No mesmo projeto Railway: "+ New Service" → "GitHub Repo"
2. Selecione mathasd, Root Directory: ml-service/
3. Variables:
   DATABASE_URL     = [mesmo Supabase]
   ENVIRONMENT      = production
   ALLOWED_ORIGINS  = https://mathasd-backend.up.railway.app
4. Railway detecta requirements.txt automaticamente (Python buildpack)
5. Copie a URL pública → use como ML_SERVICE_URL no backend
4. Deploy do Frontend (Vercel)
Copy1. Acesse https://vercel.com
2. Faça login com GitHub
3. "Add New..." → "Project"
4. Importe o repositório mathasd
5. Configure:
   - Root Directory: frontend/
   - Framework: Next.js (detectado automaticamente)
6. Em "Environment Variables":
   NEXT_PUBLIC_API_URL  = https://mathasd-backend.up.railway.app
   NEXT_PUBLIC_WS_URL   = wss://mathasd-backend.up.railway.app
   NEXT_PUBLIC_APP_NAME = MathASD
7. Clique em "Deploy"
8. Sua URL será algo como: https://mathasd-xyz.vercel.app
9. IMPORTANTE: volte ao Railway backend e atualize:
   ALLOWED_ORIGINS = https://mathasd-xyz.vercel.app

🧪 Testando o Sistema
Smoke Test Rápido
bashCopy# 1. Verifica se o backend está respondendo
curl https://SEU_BACKEND.railway.app/api/health
# Esperado: {"status":"ok","timestamp":"..."}

# 2. Verifica se o ML service está ativo
curl https://SEU_ML.railway.app/health
# Esperado: {"status":"healthy","models":{"bkt":"loaded","engagement":"loaded"}}

# 3. Testa login
curl -X POST https://SEU_BACKEND.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"educator@demo.com","password":"Demo123!"}'
# Esperado: {"access_token":"...","user":{...}}
Usuários de Demo (após npm run seed)
PapelEmailSenhaCriançachild@demo.comDemo123!Responsávelguardian@demo.comDemo123!Educadoreducator@demo.comDemo123!Adminadmin@demo.comAdmin123!

🐛 Problemas Frequentes
"Cannot connect to database"
bashCopy# Verifique se o DATABASE_URL está correto:
# Deve ter este formato: postgresql://USER:SENHA@HOST:5432/DB
# No Supabase, certifique-se de trocar [YOUR-PASSWORD] pela senha real
"JWT must be provided" / "Unauthorized"
bashCopy# O JWT_SECRET no .env deve ter pelo menos 32 caracteres
# Gere novamente: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
"ML Service unreachable"
bashCopy# Verifique se o ML_SERVICE_URL está correto no backend/.env
# Para teste local: http://localhost:8000
# Para produção: https://sua-ml-url.railway.app (sem barra final)
Frontend mostra "Network Error"
bashCopy# Verifique NEXT_PUBLIC_API_URL no frontend/.env.local
# Deve apontar para onde o backend está rodando
# Verifique também CORS: ALLOWED_ORIGINS no backend deve incluir a URL do frontend
Docker Compose falha ao iniciar
bashCopy# Limpe volumes e reconstrua:
docker compose down -v --remove-orphans
docker compose up --build --force-recreate

📊 Entendendo o Motor Adaptativo
Como o ADE Decide a Próxima Atividade
CopyEntrada do ADE:
├── perfil_ontologico:
│   ├── nivel_tea: "leve" | "moderado" | "intenso"
│   ├── forcas: ["visual", "logico"]
│   ├── fraquezas: ["auditivo", "motor"]
│   └── preferencias: {ritmo, contraste, audio}
├── estado_bkt:
│   └── {"EF01MA01": 0.82, "EF01MA06": 0.45, ...}
├── engajamento_atual: 0.73
└── contexto_bncc:
    └── unidade: "Números", ano: "1º"

Processo:
1. OntologyReasoner → infere estado do aprendiz
2. RuleEngine → aplica 50+ regras pedagógicas
3. MLEngine → chama FastAPI → predição de engajamento
4. DecisionSynthesizer → combina tudo

Saída:
├── proxima_atividade_id: "ativ_ef01ma06_visual_01"
├── ajuste_dificuldade: "aumentar"
├── modalidade: "visual"
├── mensagem_feedback: "Muito bem! Você aprendeu a contar!"
└── xai_trace: {regras_disparadas: [...], confianca: 0.87}

📚 Referências

BNCC — Base Nacional Comum Curricular. MEC, 2018.
LASDONT — Jeremias, R. Uma ontologia voltada ao processo de aprendizagem da
criança com TEA. Mestrado em Engenharia da Computação, 2024.
BKT — Corbett, A. T., & Anderson, J. R. Knowledge tracing. 1994.
DSM-5 — Diagnostic and Statistical Manual of Mental Disorders, 5th ed. APA, 2013.
WCAG 2.1 — Web Content Accessibility Guidelines. W3C, 2018.
LGPD — Lei nº 13.709, de 14 de agosto de 2018.


MathASD — Dissertação de Mestrado em Engenharia da Computação
BNCC Alinhado | LASDONT Integrado | LGPD Compliant | WCAG 2.1 AA