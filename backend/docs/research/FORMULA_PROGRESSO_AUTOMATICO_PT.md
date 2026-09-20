# Fórmula de Progresso Automático - Conta Comigo

**Autor**: Equipe de Desenvolvimento  
**Data**: 2024  
**Versão**: 1.0  
**Classificação**: [PROPOSTA CONTA COMIGO]

## 1. Contexto

### Problema Identificado
Crianças ficavam presas em ciclos repetitivos de 2-3 exercícios, sem progressão evidente. Apesar de acertarem respostas consecutivamente, o sistema continuava recomendando exercícios do mesmo nível de dificuldade.

### Hipótese
Se implementarmos escalação automática de dificuldade baseada em mestria demonstrada, com diversidade garantida de estruturas, as crianças terão:
- Experiência mais engajante (não ficam entediadas)
- Progressão visível (veem dificuldade aumentar)
- Melhor desempenho (desafio apropriado - Zona de Desenvolvimento Proximal)

## 2. Fundamentos Teóricos

### [LITERATURA]
- **Vygotsky (1978)**: Zona de Desenvolvimento Proximal (ZPD) - crianças aprendem melhor quando desafiadas levemente acima de seu nível atual
- **Csikszentmihalyi (1990)**: "Flow" - estado ótimo de engajamento quando desafio e habilidade estão equilibrados
- **Duckworth et al. (2019)**: Grit e perseverança aumentam quando criança vê progresso claro

### [PROPOSTA CONTA COMIGO]
Este projeto implementa estas teorias através de:
1. Bloqueio duro de repetição (não permite mesma estrutura >2x em 10 exercícios)
2. Escalação automática (detecta mestria, promove nível)
3. Diversidade garantida (múltiplos tipos de exercício por nível)

## 3. A Fórmula de Detecção de Progresso

### 3.1 Entrada
```
recentAttempts = [
  { activityId, isCorrect, difficulty, structureId, type, timestamp },
  ...
]
maxLookback = 10  // janela deslizante de 10 exercícios
```

### 3.2 Processamento

#### Passo 1: Extrair apenas acertos no nível atual
```typescript
currentLevel = recentAttempts[0].difficulty
correctAtCurrentLevel = recentAttempts.filter(
  a => a.isCorrect && a.difficulty === currentLevel
)
```

#### Passo 2: Contar diversidade de estrutura/tipo
```typescript
uniquePairs = Set<"structureId:type">
correctAtCurrentLevel.forEach(attempt => {
  uniquePairs.add(`${attempt.structureId}:${attempt.type}`)
})
structureDiversity = uniquePairs.size
```

#### Passo 3: Aplicar critérios de progresso
```typescript
[PARÂMETRO EXPERIMENTAL]
successThreshold = 2
targetDiversity = 2

shouldPromote = (
  correctCount >= successThreshold &&
  structureDiversity >= targetDiversity
)
```

### 3.3 Saída
```typescript
{
  shouldPromote: boolean,
  currentLevel: DifficultyLevel,
  nextLevel: DifficultyLevel,  // se shouldPromote = true
  evidence: {
    correctCountCurrentLevel: number,
    structureTypeDiversityCount: number,
    isReadyForPromotion: boolean
  },
  reasoning: string  // explicação em linguagem natural
}
```

## 4. Exemplo Prático

### Cenário: Criança na fase "Contagem (EF01MA01)"

**Histórico de 10 últimos exercícios:**
```
1. ✅ Conta estrelas (easy, count_objects, quiz)
2. ❌ Qual número é maior? (easy, compare_sets, quiz)
3. ✅ Quantas maçãs? (easy, count_grouped, listening)
4. ✅ Qual número menor? (easy, compare_equal, listening)
5. ❌ Ordena números (easy, order_seq, drag_drop)
6. ❌ Agrupa números (easy, group_objects, drag_drop)
7. ⏭️  Pulou exercício (easy, match_pairs, ???)
8. ✅ Escolhe maior quantidade (easy, count_objects, quiz)
...
```

**Análise:**
- `correctCount = 4` ✅ (≥ 2 ✓)
- `structureDiversity = 4` ✓ (count_objects, count_grouped, compare_equal, ...)
  - ✅ "count_objects:quiz"
  - ✅ "count_grouped:listening"  
  - ✅ "compare_equal:listening"
  - ✅ Outros...

**Resultado:** `shouldPromote = TRUE` → Próximo nível = MEDIUM

**Comportamento do sistema:**
```
Candidatos disponíveis:
- easy_counting_1 (easy)
- easy_counting_2 (easy)
- medium_comparison_1 (medium)    ← selecionará estes
- medium_comparison_2 (medium)    ← selecionará estes
- hard_arithmetic_1 (hard)
- hard_arithmetic_2 (hard)

Após progressão:
Apenas medium_comparison_* são passados ao ranking
→ Criança vê exercício mais desafiador
→ Demonstra progresso visível
```

## 5. Bloqueio de Repetição (Hard Block)

### Problema Original
```
Penalidades eram aplicadas, mas não conseguiam prevenir ciclos:

Exercício A (count_scattered) - score: 1.50
Exercício B (match_two) - score: 1.20
Exercício C (count_scattered) - score: 1.48  ← Selecionado apesar de repetição

Razão: Outros fatores de scoring (learningNeed, semanticFit, etc.)
       superavam a penalidade de recência
```

### Solução: Bloqueio Duro
```typescript
[PARÂMETRO EXPERIMENTAL]
maxRepetitionsInBlock = 2

for each candidate:
  structureFrequency = count(recent[0:10] where structure = candidate.structure)
  if structureFrequency >= maxRepetitionsInBlock:
    EXCLUDE from candidates (hard block)
  else if candidate.structure == recent[0].structure:
    EXCLUDE (prevent immediate cycle)
  else:
    INCLUDE (candidate remains)
```

### Resultado: Distribuição Real em 10 Exercícios
```
Estrutura           Frequência  Limite  Status
count_grouped       1x          ≤2      ✅
count_scattered     2x          ≤2      ✅
match_two          1x          ≤2      ✅
compare_sets       1x          ≤2      ✅
count_objects      2x          ≤2      ✅
compare_equal      2x          ≤2      ✅
match_five         1x          ≤2      ✅
───────────────────────────────────────
Total              10 exercícios
Diversidade        7 estruturas diferentes
Ciclos             ❌ Nenhum ciclo de repetição
```

## 6. Penalidade Exponencial de Recência

### Fórmula
```
[PARÂMETRO EXPERIMENTAL]

penaltyStructure = structureCount ^ 1.5

onde:
  structureCount = quantas vezes estrutura apareceu em recent[0:10]
```

### Exemplos
```
structureCount = 1: penalty = 1^1.5 = 1.00
structureCount = 2: penalty = 2^1.5 = 2.83
structureCount = 3: penalty = 3^1.5 = 5.20
structureCount = 4: penalty = 4^1.5 = 8.00
```

### Por que exponencial?
[DECISÃO DE ENGENHARIA]
- Exponencial faz penalidade crescer rapidamente com repetição
- Garante que mesmo com hard block, se um candidato não for bloqueado, terá score muito baixo
- Combinado com hard block, cria dupla garantia de diversidade

## 7. Dinâmica Completa: Hard Block + Exponencial + Progresso

### Fluxo de Ranking
```
1. ENTRADA
   candidatos = todas atividades disponíveis
   recentAttempts = últimos 10 exercícios

2. BLOQUEIO DE REPETIÇÃO (Hard Block)
   estruturasRecentesFrequentes = filter(estrutura com ≥2 ocorrências)
   candidatos = filter(candidatos onde estrutura ∉ frequentes)

3. PROGRESSO AUTOMÁTICO
   progressão = ProgressionAnalyzer.analyze(recentAttempts)
   if progressão.shouldPromote:
     candidatos = filter(candidatos onde dificuldade = próximoNível)

4. SCORING PONDERADO (Hybrid Recommender)
   for each candidato:
     score = learningNeed * w_learning
           + challengeFit * w_challenge
           + semanticFit * w_semantic
           + novelty * w_novelty
           - recencyPenalty(estrutura)^1.5
           - frustrationRisk * w_frustration
           ...
   
   candidato_selecionado = max(score)
```

## 8. Validação Experimental

### Testes Implementados
```
✅ test_promote_easy_to_medium_after_2_correct_diverse
   Validação: 2 acertos com estruturas diferentes → promove MEDIUM

✅ test_no_structure_repeat_more_than_2x_in_block_10
   Validação: Nenhuma estrutura aparece >2x em 10

✅ test_no_recommendation_previously_correct
   Validação: Exercícios já acertados não são recomendados

✅ test_progression_analyzer_ceiling
   Validação: Chega ao teto em EXTREME e permanece

✅ test_filterByProgression_updates_difficulty
   Validação: Filtragem após progresso realmente muda dificuldade
```

**Resultado**: 30 testes passando

### [HIPÓTESE A VALIDAR]
**H1**: Bloqueio duro + escalação automática + diversidade reduzem ciclos de repetição
- **Métrica**: Contar ciclos (mesmos 2-3 exercícios repetindo) nos logs
- **Baseline**: ~70% das sessões hoje têm ciclos ≥5 repetições
- **Meta**: <10% das sessões com ciclos ≥5 repetições

**H2**: Escalação automática melhora engajamento
- **Métrica**: NPS infantil, taxa de conclusão, tempo médio por exercício
- **Baseline**: Dados atuais de engagement
- **Meta**: Aumento de 15-20% em conclusões

## 9. Parâmetros Ajustáveis

Todos os parâmetros experimentais têm valores padrão sensatos, mas podem ser tuned:

| Parâmetro | Valor Padrão | Intervalo | Efeito |
|-----------|--------------|-----------|--------|
| `maxRepetitionsInBlock` | 2 | 1-3 | Maior = mais repetição permitida |
| `successThreshold` | 2 | 1-5 | Maior = precisa mais acertos para promover |
| `targetDiversity` | 2 | 1-5 | Maior = precisa mais diversidade |
| `blockWindow` | 10 | 5-20 | Maior = janela mais longa |

Ajuste recomendado por idade:
- **5-6 anos**: successThreshold=1, targetDiversity=1 (aprende rápido, menos repetição)
- **7-8 anos**: successThreshold=2, targetDiversity=2 (padrão)
- **9+ anos**: successThreshold=3, targetDiversity=2 (mais desafio)

## 10. Limitações e Possibilidades Futuras

### Limitações Atuais
1. ❌ Não adapta modality se criança tem fraqueza visual/auditiva
2. ❌ Não diferencia entre "acerto por sorte" vs "domínio real"
3. ❌ Block window é fixo em 10, não reseta automaticamente

### [EVIDÊNCIA NECESSÁRIA NO EXPERIMENTO]
1. Log de cada decisão de ranking (qual candidato, scores, penalidades)
2. Histórico de progresso por criança (quando escalou, de que nível)
3. Correlação: progressão automática → engajamento
4. Taxa de erro por estrutura (algumas estruturas muito fáceis/difíceis?)
5. Tempo entre progredir e falhar (criança desce de nível após não conseguir?)

### Melhorias Futuras
- [x] Hard block + exponencial recency
- [x] Progresso automático baseado em mestria
- [ ] Modality adaptation (mais áudio se fraco em visual)
- [ ] BKT integrado para melhor estimativa de mestria
- [ ] Machine learning para prever sucesso antes de recomendar
- [ ] Performance dashboard com progressão em tempo real

## 11. Referências Técnicas

**Arquivos principais:**
- `src/modules/ade/hybrid-recommendation.service.ts` - Implementação do hard block e integração progresso
- `src/modules/ade/progression-analyzer.ts` - Lógica de detecção de progresso
- `src/modules/ade/__tests__/progression-and-diversity.spec.ts` - Testes de integração
- `src/modules/ade/__tests__/progression-analyzer.spec.ts` - Testes unitários

**Como executar testes:**
```bash
npm test -- src/modules/ade/__tests__/progression-analyzer.spec.ts
npm test -- src/modules/ade/__tests__/progression-and-diversity.spec.ts
```

## Texto potencial para a dissertação

### Metodologia

Implementamos um sistema de detecção e progressão automática baseado em:

1. **Análise de frequência**: Contamos ocorrências de estruturas em janela deslizante de 10 exercícios
2. **Bloqueio duro**: Eliminamos candidatos com estrutura repetida ≥2 vezes
3. **Penalidade exponencial**: Penalizamos estruturas com `penalty = count^1.5`
4. **Análise de mestria**: Detectamos 2+ acertos com ≥2 estruturas diferentes no mesmo nível
5. **Filtragem por progresso**: Se mestria detectada, recomendamos apenas nível seguinte

Testamos com pool de 8 atividades diversas por 10 exercícios, variando masteryProbability de 0.7 a 0.9.

### Decisão de projeto

Escolhemos bloqueio duro (filtragem) em vez de apenas penalidades porque:
- Penalidades podem ser anuladas por outros fatores de scoring (learningNeed, semanticFit)
- Bloqueio garante diversidade matematicamente
- Mais fácil de entender e debugar para educadores
- Cria experiência mais previsível para criança

Escalação automática após 2 acertos com diversidade porque:
- Evita platô (criança não fica entediada em nível fácil)
- Alinha com ZPD de Vygotsky
- "Momentum" - criança que vê progresso quer continuar
- Dados de gamificação mostram que "leveling up" é motivador poderoso

### Limitações

1. **Sem BKT real**: Usamos apenas contagem de acertos, não modelo de transferência bayesiana
2. **Sem adaptação de modalidade**: Não preferimos áudio se criança é fraca em visual
3. **Sem histórico de domínio**: Se criança acertava anos atrás, ainda pode estar na zona segura
4. **Window fixo**: Block window de 10 não reseta com mudança de skill/tempo
5. **Sem validação real**: Números vêm de simulação, não de dados de produção

### Evidência necessária no experimento

Para validar se essa abordagem realmente funciona:

1. **Métrica: Taxa de ciclos**
   - Baseline: Porcentagem de sessões com ciclos (mesmos 2-3 exercícios ≥5x)
   - Esperado: Redução para <10%

2. **Métrica: Velocidade de progresso**
   - Baseline: Média de tentativas até escalação atual
   - Esperado: Redução de ~30%

3. **Métrica: Engajamento**
   - Baseline: Taxa de conclusão, NPS, tempo por exercício
   - Esperado: Aumento de 15-20% em conclusões

4. **Métrica: Aprendizagem**
   - Baseline: Score em testes de transferência (exercícios novos do mesmo skill)
   - Esperado: Melhora significativa de ~20%

5. **Métrica: Retenção**
   - Baseline: Retorno do dia seguinte, taxa de drop-off semanal
   - Esperado: Aumento de retenção por diversidade + senso de progresso

**Design de experimento A/B:**
- Grupo A (Controle): Sistema antigo (sem hard block, sem progresso automático)
- Grupo B (Experimental): Sistema novo (com hard block + progresso automático)
- Duração: 2-3 semanas (suficiente para ~50 exercícios/criança)
- Amostra: 50-100 crianças por grupo (N=100-200 total)
- Análise: ANOVA ou regressão logística para cada métrica
