# 🧩 MathASD — Adaptive Math Platform for ASD

A web-based adaptive educational platform for teaching mathematics to children
(ages 6–10) with Autism Spectrum Disorder (ASD), aligned with the Brazilian
BNCC curriculum and grounded in ontology-based user modeling and Learning Analytics.

## 🏗️ Architecture
mathasd/
├── backend/          # NestJS (Node.js + TypeScript)
├── frontend/         # Next.js 14 (React + TypeScript)
├── ml-service/       # FastAPI (Python) — BKT + Engagement ML
├── docker-compose.yml
└── README.md
## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker + Docker Compose (recommended)
- PostgreSQL 15 (or use Docker)

### Option A: Docker Compose (Recommended)

```bash
# Clone the repo
git clone https://github.com/your-org/mathasd.git
cd mathasd

cp backend/.env.example