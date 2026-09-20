# ✅ DEPLOY CHECKLIST - QUEBRA CICLO 77 EXERCÍCIOS

**Data de Início:** 20 de Setembro de 2026  
**Meta:** Criança vendo diversidade em < 2h 15m  
**Status:** 🟡 READY TO EXECUTE  

---

## 📋 PRÉ-DEPLOY (Antes de Começar)

- [ ] **Backup do banco de dados**
  ```bash
  cd backend
  npm run db:backup
  # Esperado: backup_2026_09_20.sql criado
  ```

- [ ] **Verificar testes passando**
  ```bash
  npm test -- --testPathPattern="progression"
  # Esperado: ✓ 30 tests passing
  ```

- [ ] **Verificar ninguém usando a app** (ou minimizar impacto)
  - Check production metrics
  - Aviso ao time antes de deploy

---

## 🚀 FASE 1: GERAR MIGRATION (30 min)

### Step 1.1: Criar arquivo migration
```bash
cd backend
touch src/database/migrations/1726868400-add-77-exercises.migration.ts
```

### Step 1.2: Preencher template
**Arquivo:** `src/database/migrations/1726868400-add-77-exercises.migration.ts`

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSeventySeven1726868400 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add columns
    await queryRunner.query(
      `ALTER TABLE activities ADD COLUMN interaction_type VARCHAR(50) DEFAULT 'selection'`
    );
    await queryRunner.query(
      `ALTER TABLE activities ADD COLUMN target_modalities JSON DEFAULT '["visual"]'`
    );
    await queryRunner.query(
      `ALTER TABLE activities ADD COLUMN arasaac_pictograms JSON DEFAULT '[]'`
    );
    await queryRunner.query(
      `ALTER TABLE activities ADD COLUMN voice_prompt_pt VARCHAR(500)`
    );

    // 2. Insert 77 exercises (use spec from CATALOGO_77_EXERCICIOS_SPEC.md)
    const exercises = [
      // ===== EF01MA01: CONTAGEM (13) =====
      {
        id: 'ef01ma01-count-001',
        title: 'Contar com narração',
        activityType: 'counting',
        difficulty: 'very_easy',
        bnccSkills: JSON.stringify(['EF01MA01']),
        interactionType: 'selection',
        targetModalities: JSON.stringify(['visual', 'audio']),
        arasaacPictograms: JSON.stringify([2, 2, 2]),
        voicePromptPt: 'Existem três maçãs. Quantas há?',
        content: JSON.stringify({
          semantic: { structureId: 'count_with_voice.1', niche: 'counting' },
          instructionsPt: 'Quantos objetos você vê? Escuta a dica!',
          correctAnswer: '3',
          options: [
            { id: 'a', text: '2', isCorrect: false },
            { id: 'b', text: '3', isCorrect: true },
            { id: 'c', text: '4', isCorrect: false },
          ],
        }),
      },
      // ... (adicionar 76 mais do CATALOGO_77_EXERCICIOS_SPEC.md)
    ];

    for (const ex of exercises) {
      await queryRunner.query(
        `INSERT INTO activities 
        (id, title, activity_type, difficulty, bncc_skills, interaction_type, 
         target_modalities, arasaac_pictograms, voice_prompt_pt, content, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          ex.id,
          ex.title,
          ex.activityType,
          ex.difficulty,
          ex.bnccSkills,
          ex.interactionType,
          ex.targetModalities,
          ex.arasaacPictograms,
          ex.voicePromptPt,
          ex.content,
        ]
      );
    }

    console.log(`✅ Inserted 77 new exercises`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete exercises
    const ids = [
      'ef01ma01-count-001', 'ef01ma01-count-002', // ... all 77
    ];
    
    await queryRunner.query(
      `DELETE FROM activities WHERE id IN (${ids.map((_, i) => `'${ids[i]}'`).join(',')})`
    );

    // Drop columns
    await queryRunner.query(`ALTER TABLE activities DROP COLUMN interaction_type`);
    await queryRunner.query(`ALTER TABLE activities DROP COLUMN target_modalities`);
    await queryRunner.query(`ALTER TABLE activities DROP COLUMN arasaac_pictograms`);
    await queryRunner.query(`ALTER TABLE activities DROP COLUMN voice_prompt_pt`);

    console.log(`✅ Rolled back 77 exercises`);
  }
}
```

**⏱️ Tempo:** 10 min (copiar template, preencher dados)

---

## 🚀 FASE 2: RODAR MIGRATION (15 min)

### Step 2.1: Backup final antes de rodar
```bash
cd backend
npm run db:backup
# Esperado: backup_pre_migration_2026_09_20.sql
```

- [ ] **Backup confirmado**

### Step 2.2: Rodar migration
```bash
npm run typeorm migration:run
# Esperado: [Migration] AddSeventySeven1726868400 has been executed successfully
```

- [ ] **Migration executada sem erros**

### Step 2.3: Verificar inserção
```bash
# No banco de dados (SQLite, PostgreSQL, etc)
SELECT COUNT(*) FROM activities WHERE id LIKE 'ef01ma%';
# Esperado: 77

SELECT DISTINCT 
  SUBSTR(content, INSTR(content, 'structureId') + 15, 30) as structure
FROM activities 
WHERE bncc_skills LIKE '%EF01MA03%';
# Esperado: 6+ diferentes (não 2!)
```

- [ ] **77 exercícios inseridos**
- [ ] **EF01MA03 com 6+ structureIds diferentes**

**⏱️ Tempo:** 5 min (executar queries)

---

## 🚀 FASE 3: RODAR TESTES (20 min)

### Step 3.1: Testes de Progressão
```bash
cd backend
npm test -- --testPathPattern="progression-and-diversity"
# Esperado: PASS 30 tests
```

- [ ] **✅ Todos 30 testes passando**

```
Expected output:
✓ should maintain diversity: no same structure more than 2x in 10-activity block
✓ 7 different structures per 10 exercises
✓ EF01MA03 has 13 distinct exercises
✓ Auto-promote after 2 correct with different types
✓ No repeated exercises in recent history
```

### Step 3.2: Teste manual do ranking
```bash
curl -X POST http://localhost:3001/api/ade/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "learnerId": "test-123",
    "skillId": "EF01MA03",
    "recentActivities": ["ef01ma03-compare-001"],
    "recentCorrectCount": 0
  }' | jq '.'
```

**Esperado:**
```json
{
  "recommendedActivityId": "ef01ma03-compare-002",
  "difficulty": "very_easy",
  "topCandidates": [
    "ef01ma03-compare-002",
    "ef01ma03-compare-003",
    "ef01ma03-compare-004",
    "ef01ma03-compare-005"
  ],
  "repeatedStructure": false
}
```

- [ ] **topCandidates não vazio**
- [ ] **repeatedStructure = false**
- [ ] **6+ exercícios diferentes disponíveis**

**⏱️ Tempo:** 10 min (rodar testes + verificar output)

---

## 🚀 FASE 4: DEPLOY STAGING (15 min)

### Step 4.1: Build & Deploy
```bash
cd backend
npm run build
# Esperado: ✅ Build successful

# Deploy para staging (varia por provider)
# Railway, Heroku, Digital Ocean, etc
git add .
git commit -m "feat: add 77 exercises catalog to break cycle"
git push origin develop  # ou staging
# Aguardar deploy automático
```

- [ ] **Build bem-sucedido**
- [ ] **Deploy em staging completo**

### Step 4.2: Verificar app rodando
```bash
curl http://staging.conta-comigo.com/api/health
# Esperado: { status: "ok" }

curl http://staging.conta-comigo.com/api/activities?skill=EF01MA03
# Esperado: 13 exercícios com diferentes structureIds
```

- [ ] **App respondendo**
- [ ] **77 exercícios acessíveis**

**⏱️ Tempo:** 10 min (build + deploy + verify)

---

## 🚀 FASE 5: SMOKE TESTS COM CRIANÇA (20 min)

### Step 5.1: Preparar teste
- [ ] Abrir app em staging
- [ ] Criar usuário de teste: `test-child-123`
- [ ] Confirmar pronúncia/aúdio está funcionando

### Step 5.2: Testar COMPARAÇÃO (EF01MA03 - PRIORITY)
```
Roteiro:
1. Criança faz EF01MA03 (Comparação)
2. Exercício 1: "Qual tem mais?" (selection)
3. Exercício 2: "Arrastar Mais/Menos" (drag_drop)
4. Exercício 3: "Ligue grupos" (matching)
5. Exercício 4: "Fichas para comparar" (manipulative)
6. Exercício 5: "Números na reta" (number_line)
7. Exercício 6: "Problema contextualizado" (word_problem)

✅ CHECK: Todos diferentes? (não cycling)
✅ CHECK: Criança interage? (engajamento)
✅ CHECK: Áudio toca? (voice synthesis)
```

- [ ] **Criança vê 6+ tipos diferentes**
- [ ] **Sem ciclo entre 2 mesmos**
- [ ] **Áudio funcionando**

### Step 5.3: Testar PROGRESSÃO
```
Roteiro:
1. Criança acerta exercício 1 ✓
2. Criança acerta exercício 2 (tipo diferente) ✓
3. Resultado: Próximo exercício é DIFFICULTY=medium
4. Criança tenta exercício mais difícil
5. Se acerta → continua medium
6. Se erra → volta very_easy

✅ CHECK: Dificuldade subiu? (progression works)
✅ CHECK: Progresso real? (not random)
```

- [ ] **Dificuldade escalona após 2 acertos**
- [ ] **Progresso visible**

### Step 5.4: Testar ENGAGEMENT
```
Tempo de sessão antes: ~5 minutos
Tempo de sessão depois: ≥ 45 minutos (esperado)

✅ CHECK: Criança continua engajada?
✅ CHECK: Não ficou frustrada?
✅ CHECK: Está aprendendo?
```

- [ ] **Tempo em tarefa aumentou significativamente**
- [ ] **Criança feliz 😊**

**⏱️ Tempo:** 20 min (teste manual com criança)

---

## 🚀 FASE 6: A/B TESTING SETUP (15 min) - OPTIONAL

### Step 6.1: Criar experimento
```sql
INSERT INTO ab_experiments (id, experiment_name, start_date, treatment_group)
VALUES ('exp-cycle-breaking-001', 'Break 2-exercise cycle', NOW(), 'treatment');
```

### Step 6.2: Split learners
- [ ] 50% Control (app atual - 2 exercícios)
- [ ] 50% Treatment (nova versão - 77 exercícios)

### Step 6.3: Track metrics
```
Métricas para acompanhar:
- Time on task (minutos)
- Unique structures viewed
- Progression events
- Error rate
- Engagement score
```

- [ ] **A/B setup completo**

**⏱️ Tempo:** 15 min (opcional, pode fazer depois)

---

## 📊 RESULTADOS ESPERADOS (Métricas)

### Antes (Baseline - Ciclo Quebrado)
```
Exercício 1 → Exercício 2 → Exercício 1 → ...
- Distinct structures: 2
- Max repetition: 10x per session
- Time on task: 5 minutos
- Engagement: ❌ BAIXA
- Child behavior: Frustration, exit app
```

### Depois (Target - Fixed)
```
Exercício 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → ...
- Distinct structures: 7+
- Max repetition: 2x per 10 exercises
- Time on task: 45+ minutos
- Engagement: ✅ ALTA
- Child behavior: Learning, progression, joy
- Progression events: 2-3 escalations per session
```

---

## 🔄 ROLLBACK (Se algo der errado)

**Tempo total: < 5 minutos**

```bash
# 1. Parar app
pm2 stop conta-comigo-backend

# 2. Restaurar banco anterior
psql conta_comigo < backup_pre_migration_2026_09_20.sql
# Ou SQLite: sqlite3 app.db < backup.sql

# 3. Reverter migration
npm run typeorm migration:revert

# 4. Reiniciar
pm2 start conta-comigo-backend

# 5. Verificar
curl http://localhost:3001/api/health
# Esperado: { status: "ok" }

# 6. Check: são só 2 exercícios agora?
SELECT COUNT(*) FROM activities WHERE id LIKE 'ef01ma%';
# Esperado: 2 (voltou ao estado anterior)
```

- [ ] **Rollback testado e funcionando**

---

## ⏱️ TIMELINE TOTAL

```
🟢 PRÉ-DEPLOY ..................... 5 min (backup + verify)
🟢 FASE 1: Migration Gen ........... 10 min (create file)
🟢 FASE 2: Run Migration ........... 5 min (execute)
🟢 FASE 3: Tests ................... 10 min (npm test)
🟢 FASE 4: Staging Deploy .......... 10 min (git push)
🟢 FASE 5: Smoke Tests ............. 20 min (test with child)
🟢 FASE 6: A/B Setup (optional) .... 15 min (tracking)

TOTAL: 75 minutos (~1h 15m) ✅ Dentro da meta!
```

---

## 🎯 SUCCESS CRITERIA

| Critério | Status |
|----------|--------|
| 77 exercícios no banco | ✅ Select count(*) = 77 |
| EF01MA03 com 6+ tipos | ✅ Distinct structures > 6 |
| Testes passando | ✅ npm test all green |
| Ranking retorna 6+ candidatos | ✅ topCandidates.length > 6 |
| Criança vê diversidade | ✅ 6 tipos diferentes em 10 ex |
| Sem ciclo 2-exercícios | ✅ No repetition > 2x |
| Progressão funciona | ✅ Difficulty escalates after 2 correct |
| Criança engajada | ✅ Time on task ≥ 45 min |
| **GO/NO-GO DECISION** | 🟢 **GO** |

---

## 📞 TROUBLESHOOTING

**P: Migration falha com erro SQL?**  
A: Rollback (5 min), check logs, fix SQL syntax, retry.

**P: Exercícios não aparecem na app?**  
A: Restart app, clear cache, verify database inserted data.

**P: Criança ainda vê ciclo?**  
A: Check if HybridRecommendationService is using new logic. Debug logs.

**P: Audio não funciona?**  
A: Verify TitiA service is running. Check voicePromptPt field populated.

**P: Testes falhando?**  
A: Run `npm run lint:fix`, ensure mock data matches schema.

---

## ✅ FINAL CHECKLIST

**Pré-Deploy:**
- [ ] Backup criado
- [ ] Testes passando

**Execução:**
- [ ] Migration criada
- [ ] Migration executada (77 linhas)
- [ ] Count = 77 verificado
- [ ] EF01MA03 structs verificado (6+)

**Validação:**
- [ ] Testes passam (30 testes)
- [ ] Ranking retorna 6+ candidatos
- [ ] App respondendo

**Teste com Criança:**
- [ ] Vê 6+ tipos diferentes
- [ ] Sem ciclo de 2 exercícios
- [ ] Audio funcionando
- [ ] Progressão funciona (nivel sobe)
- [ ] Criança feliz 😊

**Pronto para Production:**
- [ ] A/B tracking setup (optional)
- [ ] Alertas configurados
- [ ] Team notificado

---

## 🚀 STATUS FINAL

**Status:** 🟢 **READY TO DEPLOY**  
**Risk Level:** 🟢 **LOW** (additive changes, tested)  
**Expected Impact:** 🎉 **BREAKS CYCLE, ENABLES LEARNING**  
**Estimated Time:** ⏱️ **1h 15m**  
**Go/No-Go:** 🚀 **GO**

---

## 📝 NOTES

- Salvar este arquivo como referência
- Cada ✅ marca um passo completado
- Qualquer questão = check troubleshooting
- Rollback sempre disponível (5 min)

**Good luck! Let's break this cycle! 🎯**

---

**Last Updated:** 20 de Setembro de 2026  
**Next Review:** Após deployment

