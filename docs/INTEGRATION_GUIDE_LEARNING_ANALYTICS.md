# Guia de Integração: Learning Analytics e Progressão Adaptativa

## Visão Geral

Este guia descreve como integrar os novos serviços de Learning Analytics e Progressão Adaptativa ao fluxo existente de atividades.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Next.js)                                          │
│ - Exibe exercício com "Como Jogar"                          │
│ - Envia resposta com tempo e dicas                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ POST /activities/submit
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend (NestJS)                                            │
│ - ActivitiesController.submitAnswer()                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─→ Salva ActivityAttempt (existente)
                       │
                       ├─→ ExercisePerformanceService.recordPerformance()
                       │   └─→ Salva em exercise_performance
                       │
                       └─→ ExerciseProgressionService.suggestNextExercise()
                           └─→ Retorna próximo exercício recomendado
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend recebe resposta com:                               │
│ - Feedback do exercício (correto/incorreto)                 │
│ - Próximo exercício recomendado                             │
│ - Progresso da ilha                                         │
└─────────────────────────────────────────────────────────────┘
```

## Passo 1: Registrar Serviços no Módulo

**Arquivo**: `backend/src/modules/activities/activities.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { IslandExerciseMapping } from './entities/island-exercise-mapping.entity';
import { ExercisePerformance } from '../learning-events/entities/exercise-performance.entity';
import { ActivitiesService } from './activities.service';
import { ExerciseProgressionService } from './services/exercise-progression.service';
import { ExercisePerformanceService } from '../learning-events/services/exercise-performance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      IslandExerciseMapping,
      ExercisePerformance,
    ]),
  ],
  providers: [
    ActivitiesService,
    ExerciseProgressionService,
    ExercisePerformanceService,
  ],
  exports: [
    ActivitiesService,
    ExerciseProgressionService,
    ExercisePerformanceService,
  ],
})
export class ActivitiesModule {}
```

## Passo 2: Integrar no Endpoint de Submissão

**Arquivo**: `backend/src/modules/activities/activities.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ExercisePerformanceService } from '../learning-events/services/exercise-performance.service';
import { ExerciseProgressionService } from './services/exercise-progression.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly performanceService: ExercisePerformanceService,
    private readonly progressionService: ExerciseProgressionService,
  ) {}

  @Post('submit')
  async submitAnswer(
    @GetUser() user: any,
    @Body() dto: SubmitAnswerDto,
  ) {
    // 1. Processar resposta (existente)
    const attempt = await this.activitiesService.submitAnswer(
      user.id,
      dto.activityId,
      dto.answer,
    );

    // 2. Registrar performance (NOVO)
    await this.performanceService.recordPerformance({
      userId: user.id,
      activityId: dto.activityId,
      islandId: dto.islandId, // Enviado pelo frontend
      sessionId: dto.sessionId,
      attemptNumber: attempt.attemptNumber,
      isCorrect: attempt.isCorrect,
      score: attempt.score,
      responseTimeMs: dto.responseTimeMs, // Tempo desde apresentação
      hintsUsed: dto.hintsUsed || 0,
      tutorialOpenedCount: dto.tutorialOpenedCount || 0,
      instructionReplayCount: dto.instructionReplayCount || 0,
      skipped: false,
      metadata: {
        difficultyAttempt: dto.difficulty,
        modality: dto.modality,
        bnccSkills: dto.bnccSkills,
      },
    });

    // 3. Sugerir próximo exercício (NOVO)
    const nextSuggestion = await this.progressionService.suggestNextExercise(
      user.id,
      dto.islandId,
      dto.sessionId,
    );

    // 4. Retornar resposta completa
    return {
      attempt,
      nextSuggestion,
      progress: await this.progressionService.getIslandProgress(
        user.id,
        dto.islandId,
      ),
    };
  }
}
```

**DTO**:

```typescript
export class SubmitAnswerDto {
  activityId: string;
  islandId: string;
  sessionId: string;
  answer: any;
  responseTimeMs: number;
  hintsUsed?: number;
  tutorialOpenedCount?: number;
  instructionReplayCount?: number;
  difficulty?: string;
  modality?: string;
  bnccSkills?: string[];
}
```

## Passo 3: Atualizar Frontend para Enviar Dados

**Arquivo**: `frontend/src/components/minigames/activity-container.tsx`

```typescript
const [startTime] = useState(Date.now());
const [hintsUsed, setHintsUsed] = useState(0);
const [tutorialOpened, setTutorialOpened] = useState(0);

const handleSubmitAnswer = async (answer: any) => {
  const responseTimeMs = Date.now() - startTime;

  const response = await api.post('/activities/submit', {
    activityId: activity.id,
    islandId: currentIsland.id, // Passar ID da ilha
    sessionId: sessionId,
    answer,
    responseTimeMs,
    hintsUsed,
    tutorialOpenedCount: tutorialOpened,
    instructionReplayCount: instructionReplayCount,
    difficulty: activity.difficulty,
    modality: activity.targetModalities?.[0],
    bnccSkills: activity.bnccSkills,
  });

  // Usar nextSuggestion para navegar
  if (response.nextSuggestion) {
    navigateToActivity(response.nextSuggestion.activityId);
  }

  // Mostrar progresso
  console.log('Progresso da ilha:', response.progress);
};

const handleOpenTutorial = () => {
  setTutorialOpened(prev => prev + 1);
};

const handleRequestHint = () => {
  setHintsUsed(prev => prev + 1);
};
```

## Passo 4: Exibir "Como Jogar"

**Arquivo**: `frontend/src/components/minigames/activity-instructions.tsx`

```typescript
interface ActivityInstructionsProps {
  activity: Activity;
  onClose: () => void;
}

export function ActivityInstructions({
  activity,
  onClose,
}: ActivityInstructionsProps) {
  const howToPlay = activity.content.howToPlayPt || activity.content.howToPlay;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-6 max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">
          Como Jogar
        </h2>

        <p className="text-gray-700 mb-6 leading-relaxed">
          {howToPlay}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-blue-500 text-white rounded-2xl py-3 font-bold hover:bg-blue-600"
          >
            Entendi! Vamos Jogar
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Passo 5: Executar Migrações

```bash
# Criar as tabelas
npm run typeorm migration:run

# Ou manualmente:
npm run typeorm migration:run -- --name AddExercisePerformanceTracking
npm run typeorm migration:run -- --name AddIslandExercisesMapping
npm run typeorm migration:run -- --name AddHowToPlayInstructions
```

## Passo 6: Testar Fluxo Completo

### Teste Unitário

```bash
npm test -- exercise-performance.service.spec.ts
npm test -- exercise-progression.service.spec.ts
```

### Teste de Integração

```typescript
// Simular uma sessão completa
describe('Complete Learning Flow', () => {
  it('should track performance and suggest next exercise', async () => {
    // 1. Criança faz exercício 1 (acerta)
    const response1 = await api.post('/activities/submit', {
      activityId: 'activity-1',
      islandId: 'island-sun',
      sessionId: 'session-123',
      answer: 'correct',
      responseTimeMs: 5000,
      hintsUsed: 0,
    });

    expect(response1.attempt.isCorrect).toBe(true);
    expect(response1.nextSuggestion).toBeDefined();

    // 2. Criança faz exercício 2 (acerta)
    const response2 = await api.post('/activities/submit', {
      activityId: 'activity-2',
      islandId: 'island-sun',
      sessionId: 'session-123',
      answer: 'correct',
      responseTimeMs: 4000,
      hintsUsed: 1,
    });

    // 3. Verificar que não sugere exercício 1 ou 2 novamente
    expect(response2.nextSuggestion.activityId).not.toBe('activity-1');
    expect(response2.nextSuggestion.activityId).not.toBe('activity-2');

    // 4. Verificar progresso
    expect(response2.progress.completedCount).toBe(2);
    expect(response2.progress.accuracy).toBeGreaterThan(0.5);
  });
});
```

## Passo 7: Monitorar Dados

### Query para Verificar Performance

```sql
-- Ver histórico de um exercício
SELECT 
  ep.userId,
  ep.activityId,
  COUNT(*) as tentativas,
  SUM(CASE WHEN ep.isCorrect THEN 1 ELSE 0 END) as acertos,
  ROUND(AVG(ep.responseTimeMs)::numeric, 0) as tempo_medio_ms,
  SUM(ep.hintsUsed) as dicas_totais
FROM exercise_performance ep
WHERE ep.userId = 'user-123'
  AND ep.activityId = 'activity-456'
GROUP BY ep.userId, ep.activityId;

-- Ver progresso por ilha
SELECT 
  ep.islandId,
  COUNT(DISTINCT ep.activityId) as exercicios_feitos,
  COUNT(*) as tentativas_totais,
  ROUND(
    (SUM(CASE WHEN ep.isCorrect THEN 1 ELSE 0 END)::numeric / COUNT(*)) * 100,
    1
  ) as acuracia_percentual
FROM exercise_performance ep
WHERE ep.userId = 'user-123'
GROUP BY ep.islandId
ORDER BY ep.islandId;
```

## Passo 8: Dashboard para Educador

**Endpoint a Implementar**: `GET /analytics/student/:studentId/island/:islandId`

```typescript
@Get('analytics/student/:studentId/island/:islandId')
async getIslandAnalytics(
  @Param('studentId') studentId: string,
  @Param('islandId') islandId: string,
) {
  const metrics = await this.performanceService.getMetricsByUserAndIsland(
    studentId,
    islandId,
  );

  const performances = await this.performanceService.getPerformanceByUserAndIsland(
    studentId,
    islandId,
  );

  return {
    metrics,
    timeline: performances.map(p => ({
      timestamp: p.createdAt,
      activityId: p.activityId,
      isCorrect: p.isCorrect,
      responseTimeMs: p.responseTimeMs,
      hintsUsed: p.hintsUsed,
    })),
    trend: this.calculateTrend(performances),
  };
}
```

## Troubleshooting

### Pictogramas não aparecem
- Verificar se `pictogramId` está definido em `pictograms.ts`
- Verificar se ARASAAC ID é válido (deve ser número)
- Verificar console do navegador para erros de carregamento

### Exercícios não são sugeridos
- Verificar se `islandId` está sendo enviado
- Verificar se existem exercícios cadastrados para a ilha
- Verificar logs de `ExerciseProgressionService`

### Performance lenta
- Adicionar índices em `exercise_performance` (já feito na migração)
- Limitar quantidade de registros em queries
- Considerar cache de métricas

## Próximos Passos

1. ✅ Implementar serviços de performance e progressão
2. ⏳ Integrar no controller de atividades
3. ⏳ Atualizar frontend para enviar dados completos
4. ⏳ Exibir "Como Jogar" antes de cada exercício
5. ⏳ Criar dashboard de analytics
6. ⏳ Implementar análise de modalidades (TEA)
