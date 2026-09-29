# 🔍 DEBUG ANALYSIS - Por que sempre 3 exercícios?

## LOGS OBSERVADOS

```
Ciclo detectado:
  49b64479-daca-422c-9979-017785dae614 (more_less.0)
  5d774303-9fa0-4202-8acb-555a5a502bcc (greater_less_equal.0)
  ee3200a4-3963-4a19-bbb4-baa2203fdece (compare_sets)

topCandidates: [] SEMPRE
repeatedStructure: false
repeatedType: false
```

---

## 🎯 CAUSA RAIZ IDENTIFICADA

### 1. O Hard Block Está Funcionando
```typescript
// backend/src/modules/ade/hybrid-recommendation.service.ts:210-226
const filteredCandidates = input.candidates.filter((candidate) => {
  const structureId = candidate.content?.semantic?.structureId ?? null;
  if (frequency >= maxRepetitionsInBlock) {
    return false;  // ✅ Bloqueia repetição
  }
  if (structureId === lastRecentStructure) {
    return false;  // ✅ Evita ciclo imediato
  }
  return true;
});
```

### 2. MAS SE FILTRAR TUDO, VOLTA AOS 3
```typescript
// Linha 229-236: Fallback problema!
if (filteredCandidates.length === 0 && input.candidates.length > 0) {
  filteredCandidates = input.candidates.filter((candidate) => {
    const frequency = structureFrequency.get(structureId) ?? 0;
    return frequency < maxRepetitionsInBlock;  // ← VOLTA AOS MESMOS 3!
  });
}
```

### 3. **O PROBLEMA REAL**
`input.candidates` só tem 3 exercícios!

```
input.candidates = [
  { id: '49b64479-daca...', structureId: 'more_less.0' },
  { id: '5d774303-9fa0...', structureId: 'greater_less_equal.0' },
  { id: 'ee3200a4-3963...', structureId: 'compare_sets' }
]

// Esperado: 77 exercícios mapeados
// Observado: 3 exercícios
```

---

## 🐛 DIAGNÓSTICO

### Cenário 1: Migration NÃO rodou
```bash
# Verificar
cd backend
npm run db:migrate

# Query para validar
SELECT COUNT(*) FROM activities WHERE bnccSkills LIKE '%EF01MA03%';
# Esperado: 13 (novos) + X (antigos)
# Observado: Provavelmente <5
```

### Cenário 2: Candidatos Sendo Filtrados no RANKING
```typescript
// Analisar: por que rank() só retorna 3 do pool total?

// Possível razão 1:
rank(input: {
  candidates: activities.filter(a => a.bnccSkills.includes('EF01MA03'))
  // ← Se só retorna 3 da seed, problema é no pool
})

// Possível razão 2:
// Semantic filtering está rejeitando os 77 novos
// porque não têm semantic metadata correto
```

### Cenário 3: Seed Data vs Migration Data
```
Seed carrega: activities.seed.ts (apenas 2-3 MA03)
Migration deveria adicionar: 77 exercícios
Obs: Mas se seed roda DEPOIS da migration, sobrescreve!
```

---

## 🔧 COMO DEBUGAR

### Step 1: Verificar COUNT
```bash
npm run db:migrate:show
# Ver qual migration está faltando

# Rodar manualmente
npm run typeorm migration:run -- --name Add77ExercisesBreakingCycle
```

### Step 2: Verificar Seed Order
```bash
# Em backend/.env ou ormconfig.ts
# Ver ordem de execução: migrations ANTES ou DEPOIS de seeds?

# Se seed roda depois, apaga os 77!
```

### Step 3: Verificar Semantic Metadata
```sql
SELECT 
  id, 
  title,
  content->>'semantic' as semantic,
  COUNT(*) OVER(PARTITION BY content->>'semantic') as freq
FROM activities
WHERE "bnccSkills"::text LIKE '%EF01MA03%'
ORDER BY semantic;
```

### Step 4: Check Ranking Input
```typescript
// Adicionar log em hybrid-recommendation.service.ts:180
console.log('INPUT CANDIDATES COUNT:', input.candidates.length);
console.log('INPUT SKILLS:', input.semanticTrace.targetSkill);
console.log('CANDIDATE IDS:', input.candidates.map(c => c.id));

// Se só aparecer 3, problema é ANTES do ranking
```

---

## 📊 RAIZ DO PROBLEMA (Hipóteses)

| Cenário | Probabilidade | Solução |
|---------|---------------|---------|
| Migration não rodou | 🔴 ALTA | `npm run db:migrate` |
| Seed sobrescreve migration | 🔴 ALTA | Reorder scripts ou skip seed |
| Semantic metadata inválida | 🟡 MÉDIA | Validar JSON structure |
| Pool filtering na ADE layer | 🟡 MÉDIA | Check recommendationEngine pool |
| Cache ainda com dados antigos | 🟢 BAIXA | Clear cache + restart |

---

## ✅ SOLUÇÃO PASSO-A-PASSO

### Passo 1: Confirm Database State
```bash
cd backend
npm run typeorm query "SELECT COUNT(*) as ma03_count FROM activities WHERE bnccSkills LIKE '%EF01MA03%'"
# Se < 10: migration não rodou ou foi sobrescrita
```

### Passo 2: Check if Migration Exists
```bash
ls -lh src/database/migrations/1726868400000*
# Deve ter o arquivo Add77ExercisesBreakingCycle.ts
```

### Passo 3: Rodar Migration Manualmente
```bash
npm run build
npm run typeorm migration:run -- --name Add77ExercisesBreakingCycle
```

### Passo 4: Validate Insertion
```bash
npm run typeorm query "SELECT id, title, type FROM activities WHERE id LIKE '%ef01ma03%' LIMIT 5"
# Deve retornar 77 novos exercícios com IDs ef01ma03-*
```

### Passo 5: Restart App & Test
```bash
npm run start:dev
# Testa novamente com criança
# Deve ver 7+ tipos diferentes
```

---

## 🎯 SE AINDA NÃO FUNCIONAR

### Check 1: Ranking Pipeline
```typescript
// Adicionar log em modules/ade/ade.service.ts ou controller
const ranking = await this.hybridRecommendationService.rank({
  candidates: await this.findCandidates(skill),  // ← AQUI! Quantos?
  ...otherParams
});
console.log(`Candidates for ${skill}: ${ranking.candidateIds.length}`);
```

### Check 2: Pool Filtering
```typescript
// findCandidates() pode estar filtrando muito
// Verificar se algo como:
activities.filter(a => 
  a.bnccSkills.includes(skill) &&
  a.difficulty === currentDifficulty  // ← Demasiado restritivo?
)
```

### Check 3: Semantic Validation
```typescript
// Se exercícios novos não têm 'content.semantic.structureId',
// hard block filtering não consegue rastrear
// Validar: todos os 77 têm .semantic.structureId preenchido
```

---

## 📋 CHECKLIST FINAL

- [ ] Migration 1726868400000-Add77Exercises está criada
- [ ] Arquivo está em `backend/src/database/migrations/`
- [ ] Rodou `npm run db:migrate` com sucesso
- [ ] Query retorna 77+ exercícios para EF01MA03
- [ ] Cada exercício tem `content.semantic.structureId`
- [ ] Ranking input.candidates > 10 (não só 3)
- [ ] Criança vê 7+ tipos diferentes
- [ ] Ciclo quebrado! 🎉

---

## 🚨 SE TUDO FALHAR

### Nuclear Option: Reset & Start Fresh
```bash
# 1. Drop database
npm run typeorm schema:drop -- --synchronize

# 2. Create from migrations
npm run typeorm migration:run

# 3. DON'T run seed (or run BEFORE migrations)

# 4. Insert 77 manually via migration only
npm run db:migrate
```

---

**Status:** 🔍 Investigação em andamento
**Next:** Execute Passo 1 acima e report resultados

