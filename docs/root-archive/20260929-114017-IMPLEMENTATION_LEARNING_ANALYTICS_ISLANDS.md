# Implementação: Learning Analytics e Exercícios por Ilha

## Resumo Executivo

Implementação completa de um sistema de Learning Analytics que rastreia o desempenho de cada criança por exercício e por ilha, com progressão adaptativa baseada em desempenho. O sistema também corrige pictogramas quebrados no mapa e adiciona instruções de "como jogar" para cada tipo de exercício.

## Mudanças Implementadas

### 1. Nova Tabela: `exercise_performance` (Learning Analytics)

**Arquivo**: `backend/src/database/migrations/1726900000000-AddExercisePerformanceTracking.ts`

**Entidade**: `backend/src/modules/learning-events/entities/exercise-performance.entity.ts`

**Campos rastreados**:
- `userId` + `activityId`: Identificação do exercício realizado
- `islandId`: Qual ilha o exercício pertence
- `sessionId`: Sessão de aprendizagem
- `attemptNumber`: Número da tentativa
- `isCorrect`: Se a resposta foi correta
- `score`: Pontuação (0..1)
- `responseTimeMs`: Tempo de resposta em milissegundos
- `hintsUsed`: Quantidade de dicas utilizadas
- `tutorialOpenedCount`: Quantas vezes abriu o tutorial
- `instructionReplayCount`: Quantas vezes repetiu as instruções
- `skipped`: Se pulou o exercício
- `timeBeforeSkipMs`: Tempo antes de pular
- `metadata`: Dados adicionais (dificuldade, modalidade, conceitos)

**Índices**:
- `(userId, activityId)`: Buscar histórico de um exercício específico
- `(userId, islandId)`: Buscar histórico de uma ilha
- `(userId, createdAt)`: Análise temporal

### 2. Serviço de Performance: `ExercisePerformanceService`

**Arquivo**: `backend/src/modules/learning-events/services/exercise-performance.service.ts`

**Funcionalidades**:
- `recordPerformance()`: Registra cada tentativa
- `getPerformanceByUserAndActivity()`: Histórico de um exercício
- `getPerformanceByUserAndIsland()`: Histórico de uma ilha
- `getMetricsByUserAndActivity()`: Calcula métricas por exercício
  - Acurácia
  - Tempo médio de resposta
  - Quantidade de dicas usadas
  - Taxa de pulos
  - Pontuação média
- `getMetricsByUserAndIsland()`: Calcula métricas por ilha
- `getCompletedActivitiesInSession()`: Exercícios já feitos na sessão
- `getCompletedActivitiesInIsland()`: Exercícios já feitos na ilha

### 3. Mapeamento de Exercícios por Ilha

**Arquivo**: `backend/src/database/seeds/island-exercises-mapping.seed.ts`

**Entidade**: `backend/src/modules/activities/entities/island-exercise-mapping.entity.ts`

**Migração**: `backend/src/database/migrations/1726900001000-AddIslandExercisesMapping.ts`

**Estrutura das 8 ilhas**:

| Ilha | Tópico | Habilidades BNCC | Exercícios |
|------|--------|------------------|-----------|
| Ilha do Sol | Contagem | EF01MA01, EF01MA02 | 12 exercícios |
| Ilha do Mar | Adição | EF01MA06, EF01MA07 | 12 exercícios |
| Ilha da Floresta | Subtração | EF01MA08, EF01MA09 | 12 exercícios |
| Ilha das Flores | Comparação | EF01MA03, EF01MA04 | 12 exercícios |
| Ilha das Maçãs | Formas | EF01MA14, EF01MA15 | 12 exercícios |
| Ilha dos Animais | Medidas | EF01MA16, EF01MA17 | 12 exercícios |
| Ilha Mágica | Sequências | EF01MA10, EF01MA11 | 12 exercícios |
| Ilha do Amor | Ordenação | EF01MA05, EF01MA12 | 12 exercícios |

### 4. Serviço de Progressão Adaptativa: `ExerciseProgressionService`

**Arquivo**: `backend/src/modules/activities/services/exercise-progression.service.ts`

**Algoritmo de Progressão**:

```
1. Busca exercícios já feitos na sessão (evita repetição no mesmo ciclo)
2. Busca exercícios já feitos na ilha (para sugerir novos)
3. Calcula próxima dificuldade baseado em acurácia:
   - Acurácia ≥ 85% → Dificuldade "hard"
   - Acurácia ≥ 70% → Dificuldade "medium"
   - Acurácia ≥ 50% → Dificuldade "easy"
   - Acurácia < 50% → Dificuldade "very_easy"
4. Se todos exercícios da ilha foram feitos:
   - Repete com variação (exercícios diferentes, mesma dificuldade)
   - Usa acurácia para selecionar dificuldade de repetição
5. Retorna sugestão com score de adequação
```

**Métodos**:
- `suggestNextExercise()`: Próximo exercício recomendado
- `getIslandProgress()`: Progresso completo da ilha

### 5. Pictogramas Corrigidos no Mapa

**Arquivo**: `frontend/src/app/[locale]/learn/menu/page.tsx`

**Mudanças**:
```typescript
// Antes (pictogramas quebrados):
pictogramId: "arasaac.16165" // Ilha do Mar (errado)
pictogramId: "library.learn"  // Ilha da Floresta (errado)

// Depois (pictogramas corretos):
pictogramId: "arasaac.16590" // Ilha do Mar (onda)
pictogramId: "arasaac.16165" // Ilha da Floresta (planta)
pictogramId: "arasaac.17784" // Ilha das Flores (flor)
pictogramId: "arasaac.20951" // Ilha dos Animais (tartaruga)
pictogramId: "arasaac.17331" // Ilha Mágica (unicórnio)
pictogramId: "arasaac.15971" // Ilha do Amor (laço)
```

### 6. Instruções "Como Jogar"

**Arquivo**: `backend/src/database/migrations/1726900002000-AddHowToPlayInstructions.ts`

**Mudança na Entidade**: `backend/src/modules/activities/entities/activity.entity.ts`

**Novos campos**:
- `content.howToPlayPt`: Instruções em português
- `content.howToPlay`: Instruções em inglês

**Exemplos**:
- **Contagem**: "Observe os objetos na tela e conte quantos há. Depois, clique no número correto."
- **Quiz**: "Leia a pergunta e escolha a resposta correta entre as opções."
- **Arrastar**: "Arraste os objetos para o lugar correto. Use o dedo ou o mouse para mover."
- **Padrões**: "Observe o padrão e continue a sequência. Escolha o próximo elemento correto."

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│ Criança completa exercício na Ilha do Sol                   │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend envia: userId, activityId, islandId, resultado     │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ ExercisePerformanceService.recordPerformance()              │
│ - Salva em exercise_performance                             │
│ - Registra tempo, dicas, acertos                            │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ ExerciseProgressionService.suggestNextExercise()            │
│ - Calcula métricas da ilha                                  │
│ - Determina próxima dificuldade                             │
│ - Evita repetição na sessão                                 │
│ - Retorna sugestão com score                                │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend mostra próximo exercício recomendado               │
│ - Título e descrição                                        │
│ - Instruções "Como Jogar"                                   │
│ - Pictograma correto da ilha                                │
└─────────────────────────────────────────────────────────────┘
```

## Integração com Fórmula de Learning Existente

O sistema se integra com a fórmula de learning analytics já documentada em `FÓRMULA_ANÁLISE_VERDADE.md`:

1. **Dados brutos**: `exercise_performance` fornece observações atômicas
2. **Métricas derivadas**: `ExercisePerformanceService` calcula agregações
3. **Decisões adaptativas**: `ExerciseProgressionService` usa métricas para recomendar
4. **Perfil TEA**: Pode ser alimentado com dados de `exercise_performance` para análise de modalidades

## Próximos Passos

### Curto Prazo
1. Integrar `ExercisePerformanceService` no endpoint de submissão de respostas
2. Integrar `ExerciseProgressionService` no endpoint de recomendação
3. Atualizar frontend para exibir "Como Jogar" antes de cada exercício
4. Testar fluxo completo de uma sessão

### Médio Prazo
1. Implementar dashboard de analytics para educadores
2. Adicionar visualizações de progresso por criança
3. Integrar com `TEAProfileAnalyzerService` para análise de modalidades
4. Criar relatórios de evolução/depreciação de conhecimento

### Longo Prazo
1. Implementar sistema de badges/recompensas por progresso
2. Análise preditiva de dificuldades futuras
3. Recomendações personalizadas por perfil TEA
4. Exportação de dados para pesquisa educacional

## Documentação de Pesquisa

[PROPOSTA CONTA COMIGO]

Este sistema implementa a infraestrutura de Learning Analytics descrita em `docs/research/BATCH_01_LEARNING_ANALYTICS_PT.md`, com foco específico em:

- Rastreamento de tentativas e desempenho por exercício
- Progressão adaptativa baseada em acurácia
- Prevenção de repetição de exercícios no mesmo ciclo
- Integração com análise de perfil TEA

[PARÂMETRO EXPERIMENTAL]

Os seguintes parâmetros podem ser ajustados para pesquisa:
- Limiares de acurácia para mudança de dificuldade (atualmente: 50%, 70%, 85%)
- Número máximo de exercícios por ilha
- Estratégia de repetição com variação
- Peso de diferentes métricas na sugestão

[HIPÓTESE A VALIDAR]

- Progressão adaptativa melhora engajamento e aprendizagem
- Evitar repetição no mesmo ciclo reduz tédio
- Análise de modalidades (visual/auditivo/motor) melhora recomendações
- Rastreamento detalhado permite identificar padrões de dificuldade

## Texto Potencial para Dissertação

### Metodologia

Foi implementado um sistema de rastreamento de desempenho que registra cada tentativa de exercício com timestamp, tempo de resposta, uso de dicas e resultado. Os dados são agregados por exercício e por ilha para calcular métricas de acurácia, velocidade e engajamento.

### Decisão de Projeto

A separação entre registro bruto (`exercise_performance`) e recomendações (`ExerciseProgressionService`) permite auditoria completa e recálculo de métricas. O algoritmo de progressão usa acurácia como sinal principal, evitando repetição no mesmo ciclo mas permitindo variação com exercícios diferentes.

### Limitações

O sistema não diferencia entre tipos de erro (conceitual vs. atenção), não incorpora feedback qualitativo do educador, e assume que acurácia é proxy adequado para domínio. Análise de causalidade entre progressão e aprendizagem real requer desenho experimental.

### Evidência Necessária no Experimento

Será necessário coletar dados sobre: taxa de conclusão de ilhas, tempo médio por exercício, distribuição de acertos/erros por dificuldade, e correlação entre progressão adaptativa e desempenho em avaliações independentes.
