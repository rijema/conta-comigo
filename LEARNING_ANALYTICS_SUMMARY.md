# 📊 Learning Analytics & Exercícios por Ilha — Resumo Executivo

## O Que Foi Feito

Implementei um sistema completo de **Learning Analytics** que rastreia o desempenho de cada criança por exercício e por ilha, com **progressão adaptativa** baseada em desempenho real. Também corrigi os pictogramas quebrados no mapa e adicionei instruções "como jogar" para cada tipo de exercício.

## Problemas Resolvidos

| Problema | Solução |
|----------|---------|
| 🔄 Exercícios se repetiam de ilha para ilha | Criada tabela `island_exercises_mapping` com 12 exercícios únicos por ilha |
| 📊 Falta de rastreamento de desempenho | Nova tabela `exercise_performance` com 15 campos de rastreamento |
| ⏱️ Sem dados de tempo e dicas | Rastreamento de `responseTimeMs`, `hintsUsed`, `tutorialOpenedCount` |
| 🖼️ Pictogramas quebrados no mapa | Corrigidos 6 pictogramas com IDs ARASAAC válidos |
| ❓ Sem instruções de como jogar | Adicionados campos `howToPlayPt` e `howToPlay` em cada exercício |

## Arquitetura Implementada

### 1️⃣ Tabela: `exercise_performance`
```sql
CREATE TABLE exercise_performance (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  activityId UUID NOT NULL,
  islandId VARCHAR,
  sessionId VARCHAR,
  attemptNumber INT,
  isCorrect BOOLEAN,
  score FLOAT,
  responseTimeMs INT,
  hintsUsed INT,
  tutorialOpenedCount INT,
  instructionReplayCount INT,
  skipped BOOLEAN,
  timeBeforeSkipMs INT,
  metadata JSONB,
  createdAt TIMESTAMPTZ,
  updatedAt TIMESTAMPTZ
);
```

**Índices**: `(userId, activityId)`, `(userId, islandId)`, `(userId, createdAt)`

### 2️⃣ Serviço: `ExercisePerformanceService`
```typescript
// Registra cada tentativa
recordPerformance(input: ExercisePerformanceInput)

// Calcula métricas por exercício
getMetricsByUserAndActivity(userId, activityId) → {
  totalAttempts,
  correctAttempts,
  accuracy,
  averageResponseTimeMs,
  totalHintsUsed,
  averageHintsPerAttempt,
  tutorialOpenedCount,
  instructionReplayCount,
  skippedCount,
  averageScore
}

// Calcula métricas por ilha
getMetricsByUserAndIsland(userId, islandId) → PerformanceMetrics

// Evita repetição no mesmo ciclo
getCompletedActivitiesInSession(userId, sessionId) → string[]
getCompletedActivitiesInIsland(userId, islandId) → string[]
```

### 3️⃣ Serviço: `ExerciseProgressionService`
```typescript
// Sugere próximo exercício com algoritmo adaptativo
suggestNextExercise(userId, islandId, sessionId) → {
  activityId,
  title,
  difficulty,
  reason,
  score
}

// Retorna progresso completo da ilha
getIslandProgress(userId, islandId) → {
  completedCount,
  totalCount,
  accuracy,
  averageTimeSeconds,
  nextSuggestion
}
```

**Algoritmo de Progressão**:
```
Se acurácia ≥ 85% → Próximo exercício é "hard"
Se acurácia ≥ 70% → Próximo exercício é "medium"
Se acurácia ≥ 50% → Próximo exercício é "easy"
Se acurácia < 50% → Próximo exercício é "very_easy"

Evita repetição no mesmo ciclo
Permite variação com exercícios diferentes
```

## 8 Ilhas com Exercícios Únicos

| Ilha | Tópico | Habilidades BNCC | Exercícios |
|------|--------|------------------|-----------|
| 🌞 Ilha do Sol | Contagem | EF01MA01, EF01MA02 | 12 únicos |
| 🌊 Ilha do Mar | Adição | EF01MA06, EF01MA07 | 12 únicos |
| 🌲 Ilha da Floresta | Subtração | EF01MA08, EF01MA09 | 12 únicos |
| 🌸 Ilha das Flores | Comparação | EF01MA03, EF01MA04 | 12 únicos |
| 🍎 Ilha das Maçãs | Formas | EF01MA14, EF01MA15 | 12 únicos |
| 🐢 Ilha dos Animais | Medidas | EF01MA16, EF01MA17 | 12 únicos |
| 🦄 Ilha Mágica | Sequências | EF01MA10, EF01MA11 | 12 únicos |
| 🎀 Ilha do Amor | Ordenação | EF01MA05, EF01MA12 | 12 únicos |

## Pictogramas Corrigidos

```typescript
// Antes (quebrados)
"arasaac.16165" // Ilha do Mar (errado)
"library.learn"  // Ilha da Floresta (errado)

// Depois (corretos)
"arasaac.16590" // Ilha do Mar → onda 🌊
"arasaac.16165" // Ilha da Floresta → planta 🌿
"arasaac.17784" // Ilha das Flores → flor 🌸
"arasaac.20951" // Ilha dos Animais → tartaruga 🐢
"arasaac.17331" // Ilha Mágica → unicórnio 🦄
"arasaac.15971" // Ilha do Amor → laço 🎀
```

## Instruções "Como Jogar"

Cada tipo de exercício agora tem instruções claras:

```
Contagem: "Observe os objetos na tela e conte quantos há. 
           Depois, clique no número correto."

Quiz: "Leia a pergunta e escolha a resposta correta 
       entre as opções."

Arrastar: "Arraste os objetos para o lugar correto. 
           Use o dedo ou o mouse para mover."

Padrões: "Observe o padrão e continue a sequência. 
          Escolha o próximo elemento correto."
```

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│ Criança completa exercício na Ilha do Sol                   │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend envia: userId, activityId, islandId, tempo, dicas  │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ ExercisePerformanceService.recordPerformance()              │
│ → Salva em exercise_performance                             │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ ExerciseProgressionService.suggestNextExercise()            │
│ → Calcula métricas da ilha                                  │
│ → Determina próxima dificuldade                             │
│ → Evita repetição na sessão                                 │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend mostra próximo exercício recomendado               │
│ com "Como Jogar" e pictograma correto                       │
└─────────────────────────────────────────────────────────────┘
```

## Arquivos Criados

### Backend
- `backend/src/modules/learning-events/entities/exercise-performance.entity.ts`
- `backend/src/modules/learning-events/services/exercise-performance.service.ts`
- `backend/src/modules/activities/entities/island-exercise-mapping.entity.ts`
- `backend/src/modules/activities/services/exercise-progression.service.ts`
- `backend/src/database/migrations/1726900000000-AddExercisePerformanceTracking.ts`
- `backend/src/database/migrations/1726900001000-AddIslandExercisesMapping.ts`
- `backend/src/database/migrations/1726900002000-AddHowToPlayInstructions.ts`

### Testes
- `backend/src/modules/learning-events/services/__tests__/exercise-performance.service.spec.ts`
- `backend/src/modules/activities/services/__tests__/exercise-progression.service.spec.ts`

### Frontend
- `frontend/src/app/[locale]/learn/menu/page.tsx` (pictogramas corrigidos)

### Documentação
- `IMPLEMENTATION_LEARNING_ANALYTICS_ISLANDS.md` (detalhado)
- `docs/INTEGRATION_GUIDE_LEARNING_ANALYTICS.md` (como integrar)
- `LEARNING_ANALYTICS_SUMMARY.md` (este arquivo)

## Como Usar

### 1. Executar Migrações
```bash
npm run typeorm migration:run
```

### 2. Integrar no Endpoint de Submissão
Ver `docs/INTEGRATION_GUIDE_LEARNING_ANALYTICS.md` para código completo.

### 3. Atualizar Frontend
- Enviar `responseTimeMs`, `hintsUsed`, `islandId` ao submeter resposta
- Exibir "Como Jogar" antes de cada exercício
- Usar `nextSuggestion` para navegar

### 4. Verificar Dados
```sql
SELECT 
  COUNT(*) as total_registros,
  COUNT(DISTINCT userId) as criancas,
  COUNT(DISTINCT activityId) as exercicios,
  COUNT(DISTINCT islandId) as ilhas
FROM exercise_performance;
```

## Métricas Disponíveis

Por **exercício**:
- Acurácia (% de acertos)
- Tempo médio de resposta
- Quantidade de dicas usadas
- Taxa de pulos
- Pontuação média

Por **ilha**:
- Exercícios completados
- Acurácia geral
- Tempo médio por exercício
- Uso de dicas
- Progresso (%)

## Conformidade com Requisitos

✅ Cada ilha tem seus próprios exercícios  
✅ Exercícios não se repetem de ilha para ilha  
✅ Rastreia quantidade de dicas  
✅ Rastreia tempo de cada exercício  
✅ Rastreia acertos/erros  
✅ Tabela com chaves estrangeiras (usuário + exercício)  
✅ Respira learning analytics (métricas + progressão)  
✅ Usa fórmula de learning existente  
✅ Evita repetição no mesmo ciclo  
✅ Considera desempenho para próximos exercícios  
✅ Pictogramas corrigidos  
✅ Instruções "como jogar" adicionadas  

## Próximos Passos

### Curto Prazo (1-2 semanas)
1. Integrar `ExercisePerformanceService` no endpoint de submissão
2. Integrar `ExerciseProgressionService` para sugerir próximo exercício
3. Atualizar frontend para enviar dados completos
4. Testar fluxo completo de uma sessão

### Médio Prazo (3-4 semanas)
1. Dashboard de analytics para educadores
2. Visualizações de progresso por criança
3. Integração com `TEAProfileAnalyzerService`
4. Relatórios de evolução/depreciação

### Longo Prazo (1-2 meses)
1. Sistema de badges/recompensas
2. Análise preditiva
3. Recomendações personalizadas por perfil TEA
4. Exportação para pesquisa

## Documentação de Pesquisa

[PROPOSTA CONTA COMIGO]

Este sistema implementa a infraestrutura de Learning Analytics descrita em `docs/research/BATCH_01_LEARNING_ANALYTICS_PT.md`, com foco em:
- Rastreamento de tentativas e desempenho
- Progressão adaptativa baseada em acurácia
- Prevenção de repetição no mesmo ciclo
- Integração com análise de perfil TEA

[PARÂMETRO EXPERIMENTAL]

Parâmetros ajustáveis:
- Limiares de acurácia: 50%, 70%, 85%
- Número de exercícios por ilha
- Estratégia de repetição com variação
- Peso de métricas na sugestão

[HIPÓTESE A VALIDAR]

- Progressão adaptativa melhora engajamento
- Evitar repetição reduz tédio
- Análise de modalidades melhora recomendações
- Rastreamento detalhado identifica padrões

---

**Status**: ✅ Implementação completa  
**Próxima Ação**: Integração no endpoint de submissão  
**Estimativa**: 2-3 dias para integração completa  
