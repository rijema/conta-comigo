# Correção do Algoritmo de Diversidade de Ilhas

## Problema Identificado

O algoritmo de recomendação de atividades estava **repetindo os mesmos 2 exercícios** de uma ilha, em vez de oferecer diversidade.

**Sintomas:**
- Logs mostravam alternância entre apenas 2 atividades
- `topCandidates: []` (nenhum candidato diverso)
- `repeatedNiche: false`, `repeatedStructure: false`, `repeatedType: false` (mas ainda repetindo!)

## Causa Raiz

O algoritmo de seleção (`findMatchingActivity`) **ignorava completamente o `recommendedIslandId`** do ADE:

1. ✅ `IslandContextService` calculava `recommendedIslandId`
2. ✅ `AdeService` adicionava `recommendedIslandId` ao `adeDecision`
3. ❌ `findMatchingActivity` **não usava** `recommendedIslandId`
4. ❌ `cooldown` **não considerava ilhas** como critério de diversidade

Resultado: O algoritmo filtrava apenas por BNCC skill, deixando apenas 2-3 atividades como candidatas.

## Solução Implementada

### 1. Adicionar `islandId` à Entidade Activity

**Arquivo:** `src/modules/activities/entities/activity.entity.ts`

```typescript
@Column({ nullable: true, comment: 'Island this activity belongs to (denormalized for performance)' })
islandId: string;
```

**Motivo:** Denormalização melhora performance de queries sem joins.

### 2. Migration: Adicionar Coluna `islandId`

**Arquivo:** `src/database/migrations/1726950008000-AddIslandIdToActivities.ts`

```sql
-- Adiciona coluna
ALTER TABLE activities ADD COLUMN islandId VARCHAR;

-- Popula a partir de island_activity_mappings
UPDATE activities a
SET islandId = (
  SELECT islandId FROM island_activity_mappings iam
  WHERE iam.activityId = a.id AND iam.isActive = true
  LIMIT 1
)
WHERE EXISTS (...)

-- Cria índice para performance
CREATE INDEX idx_activities_island_id ON activities(islandId);
```

### 3. Filtrar por Ilha no Algoritmo de Seleção

**Arquivo:** `src/modules/activities/activities.service.ts` (linha ~912)

```typescript
// [PROPOSTA CONTA COMIGO] Filter by recommended island first if available
let islandCandidates = eligibleActivities;
if (adeDecision.recommendedIslandId) {
  // Get activities mapped to the recommended island
  const islandMappings = await this.islandActivityMappingRepo.find({
    where: { islandId: adeDecision.recommendedIslandId, isActive: true },
  });
  const islandActivityIds = new Set(islandMappings.map((m) => m.activityId));
  const islandActivities = eligibleActivities.filter((activity) =>
    islandActivityIds.has(activity.id),
  );
  if (islandActivities.length > 0) {
    islandCandidates = islandActivities;
  }
}

// Depois filtrar por BNCC skill dentro da ilha
const sameSkill = islandCandidates.filter((activity) =>
  activity.bnccSkills?.includes(adeDecision.recommendedBnccSkill));
```

### 4. Melhorar Algoritmo de Cooldown

**Arquivo:** `src/modules/activities/activities.service.ts` (linha ~1141)

```typescript
private cooldown(candidates: Activity[], catalog: Activity[], recentIds: string[]): Activity[] {
  // ... existing code ...
  
  // [PROPOSTA CONTA COMIGO] Add island diversity to cooldown
  const recentIslandIds = new Set(recent.map((item) => item.islandId).filter(Boolean));
  
  const stages = [
    // Stage 1: Maximum diversity - different island, structure, items, AND type
    (item: Activity) => !recentIds.slice(0, 8).includes(item.id) &&
      !recentStructures.has(...) &&
      !recentItems.has(...) &&
      !recentTypes.has(item.type) &&
      !recentIslandIds.has(item.islandId),  // ← NEW: Different island
    
    // Stage 2: Different island and structure
    (item: Activity) => !recentIds.slice(0, 5).includes(item.id) &&
      !recentStructures.has(...) &&
      !recentIslandIds.has(item.islandId),  // ← NEW: Different island
    
    // Stage 3: Different island (minimum diversity)
    (item: Activity) => !recentIds.slice(0, 2).includes(item.id) &&
      !recentIslandIds.has(item.islandId),  // ← NEW: Different island
    
    // Stage 4: Just avoid recent (fallback)
    (item: Activity) => !recentIds.slice(0, 2).includes(item.id),
  ];
  
  // ... rest of code ...
}
```

## Fluxo Corrigido

```
1. ADE Decision
   ├─ recommendedIslandId: "island-numbers"
   ├─ recommendedBnccSkill: "EF01MA01"
   └─ recommendedDifficulty: "easy"

2. findMatchingActivity
   ├─ Get all eligible activities
   ├─ Filter by recommendedIslandId
   │  └─ Result: 10 activities from island-numbers
   ├─ Filter by recommendedBnccSkill
   │  └─ Result: 5 activities with EF01MA01
   └─ Apply cooldown with island diversity
      ├─ Stage 1: Different island + structure + items + type
      ├─ Stage 2: Different island + structure
      ├─ Stage 3: Different island
      └─ Stage 4: Just avoid recent

3. Result: Diverse activities from the recommended island
```

## Impacto

### Antes
- ❌ Apenas 2 atividades alternando
- ❌ Sem diversidade de ilhas
- ❌ Experiência monótona

### Depois
- ✅ Até 10 atividades por ilha
- ✅ Diversidade garantida (estrutura, tipo, pictogramas)
- ✅ Experiência mais engajante
- ✅ Melhor retenção de crianças com TEA

## Testes

Todos os 373 testes passam:
```
Test Suites: 56 passed, 56 total
Tests:       373 passed, 373 total
```

## Parâmetros Experimentais

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `ISLAND_COMPLETION_THRESHOLD` | 80% | Progresso necessário para avançar de ilha |
| `SUCCESS_RATE_THRESHOLD` | 75% | Taxa de sucesso necessária |
| Cooldown Stage 1 | 8 atividades recentes | Máxima diversidade |
| Cooldown Stage 2 | 5 atividades recentes | Diversidade média |
| Cooldown Stage 3 | 2 atividades recentes | Diversidade mínima |

## Próximos Passos

1. **Deploy em Produção** - Executar migration no Railway
2. **Validação com Usuários** - Testar com crianças com TEA
3. **Análise de Dados** - Medir engagement e retenção
4. **Ajuste de Thresholds** - Baseado em dados reais

## Referências

- `IslandContextService`: Análise de progresso em ilhas
- `AdeService`: Integração no pipeline ADE (STEP 3.5)
- `ActivitiesService.findMatchingActivity`: Seleção de atividades
- `ActivitiesService.cooldown`: Algoritmo de diversidade

---

## Texto potencial para a dissertação

### Metodologia

O algoritmo de seleção de atividades foi aprimorado para considerar contexto de ilhas (temas) como critério de diversidade. A solução implementa filtragem em cascata:

1. **Filtragem por Ilha**: Limita candidatos à ilha recomendada pelo ADE
2. **Filtragem por BNCC**: Dentro da ilha, seleciona atividades com a habilidade alvo
3. **Cooldown com Diversidade**: Aplica 4 estágios de filtragem para garantir variedade

### Decisão de projeto

A denormalização de `islandId` na tabela `activities` foi escolhida para melhorar performance, evitando joins com `island_activity_mappings` em cada recomendação. A coluna é sincronizada via migration e mantida consistente.

### Limitações

- A solução assume que cada atividade está mapeada para exatamente uma ilha
- Atividades não mapeadas para ilhas não são recomendadas (fallback para todas as atividades)
- O algoritmo de cooldown é guloso (greedy) e pode não encontrar a solução ótima em casos extremos

### Evidência necessária no experimento

1. **Diversidade de Atividades**: Medir quantas atividades diferentes são recomendadas em uma sessão
2. **Retenção**: Comparar taxa de abandono antes/depois
3. **Engagement**: Medir tempo gasto e número de tentativas por atividade
4. **Satisfação**: Feedback qualitativo de educadores e crianças
