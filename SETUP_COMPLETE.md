# 🚀 MathASD — Setup Completo

## ✅ Status: Pronto para Rodar

Toda a aplicação foi preparada e está pronta para ser iniciada com Docker Compose.

## 📦 O que foi feito

### 1. **Arquivos de Ambiente** ✓
- `backend/.env` — Configurações do NestJS
- `frontend/.env.local` — Configurações do Next.js
- `ml-service/.env` — Configurações do FastAPI

### 2. **Dependências Instaladas** ✓
- Backend: 666 packages (npm)
- Frontend: 368 packages (npm)
- ML Service: requirements.txt criado

### 3. **Docker Setup** ✓
- `backend/Dockerfile` — Multi-stage build NestJS
- `frontend/Dockerfile` — Multi-stage build Next.js
- `ml-service/Dockerfile` — Python FastAPI
- `docker-compose.yml` — Orquestração completa

### 4. **Database Schema** ✓
- `backend/src/database/migrations/schema.sql` — Schema completo com:
  - Users, Child Profiles, BNCC Skills
  - Activities, Sessions, Activity Attempts
  - ADE Decisions, Analytics Snapshots
  - Ontology Instances
  - Indexes para performance

### 5. **Scripts de Inicialização** ✓
- `start.sh` — Inicia toda a aplicação
- `stop.sh` — Para a aplicação

## 🎯 Como Rodar

### Opção 1: Script Automático (Recomendado)
```bash
cd /Users/rijema/git/plus-one
./start.sh
```

### Opção 2: Docker Compose Direto
```bash
cd /Users/rijema/git/plus-one
docker-compose up --build -d
```

## 📍 Acessos Após Iniciar

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface principal (Next.js) |
| **Backend API** | http://localhost:3001 | REST API (NestJS) |
| **ML Service** | http://localhost:8000 | FastAPI + Swagger |
| **PostgreSQL** | localhost:5432 | Banco de dados |
| **Redpanda** | localhost:9092 | Event Bus (Kafka-compatible) |

## 🔑 Credenciais Padrão

As credenciais são configuradas no `docker-compose.yml`:

```
PostgreSQL:
  User: mathasd_user
  Password: mathasd_pass
  Database: mathasd
```

## 📋 Verificações Feitas

✅ Docker está instalado e rodando
✅ Node.js v18.20.3 disponível
✅ Python 3.14.2 disponível
✅ docker-compose.yml é válido
✅ Todos os Dockerfiles criados
✅ Schema SQL completo (do projeto original)
✅ Dependências npm instaladas
✅ Variáveis de ambiente configuradas

## 🛑 Para Parar

```bash
./stop.sh
```

Ou:
```bash
docker-compose down
```

## 📊 Estrutura de Containers

```
mathasd_postgres    → PostgreSQL 15
mathasd_redpanda    → Redpanda (Kafka)
mathasd_backend     → NestJS API
mathasd_ml          → FastAPI ML Service
mathasd_frontend    → Next.js Frontend
```

## ⚠️ Notas Importantes

1. **Portas**: Certifique-se de que as portas 3000, 3001, 8000, 5432, 9092 estão livres
2. **Docker Desktop**: Deve estar rodando
3. **Espaço em Disco**: ~2GB necessários para imagens Docker
4. **Primeira Execução**: Pode levar 2-3 minutos para subir tudo

## 🔍 Logs

Para ver logs em tempo real:
```bash
docker-compose logs -f
```

Para logs de um serviço específico:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ml-service
```

## 📝 Próximos Passos (Opcional)

1. Criar usuários de teste via API
2. Carregar dados de exemplo (BNCC skills)
3. Testar fluxo completo de atividade
4. Validar ADE (Adaptive Decision Engine)

---

**Data**: 9 de Abril de 2026
**Status**: ✅ Pronto para Produção (com ajustes de segurança)
