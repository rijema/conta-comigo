# Implementação de Ilhas de Aprendizado - ContaComigo

## Visão Geral

[PROPOSTA CONTA COMIGO] Este documento descreve a implementação de um sistema de ilhas temáticas para organizar exercícios matemáticos de forma progressiva e contextualizada, com foco em crianças com Transtorno do Espectro Autista (TEA).

## Problema Identificado

[HIPÓTESE A VALIDAR] O sistema anterior apresentava:
- Exercícios desorganizados sem contexto temático
- Falta de progressão clara dentro de temas
- Repetição descontrolada de exercícios
- Desequilíbrio na quantidade de exercícios por tema
- Descrições genéricas que não correspondiam ao conteúdo real

## Solução Implementada

### 1. Estrutura de Ilhas (3 iniciais)

#### Ilha dos Números
- **Tema**: Contagem, sequência, operações matemáticas básicas
- **Pictogramas ARASAAC**: 23190, 23191, 23192
- **BNCC Skills**: EF01MA01, EF01MA02, EF01MA03, EF01MA06, EF01MA08
- **Progressão**: 10 exercícios (very_easy → extreme)

#### Ilha das Cores
- **Tema**: Reconhecimento de cores, padrões, classificação
- **Pictogramas ARASAAC**: 61042, 61043, 61044
- **BNCC Skills**: EF01MA14, EF01MA03
- **Progressão**: 10 exercícios (very_easy → extreme)

#### Ilha da Praia
- **Tema**: Itens praianos, contexto natural, aprendizado lúdico
- **Pictogramas ARASAAC**: 23189, 23190, 23191
- **BNCC Skills**: EF01MA01, EF01MA02, EF01MA03, EF01MA06
- **Progressão**: 10 exercícios (very_easy → extreme)

### 2. Tabelas de Banco de Dados

#### `islands`
```sql
CREATE TABLE islands (
  id UUID PRIMARY KEY,
  islandId VARCHAR(50) UNIQUE,
  name VARCHAR(100),
  description TEXT,
  theme VARCHAR(100),
  arasaacPictogramIds JSONB,
  bnccSkills JSONB,
  sequenceOrder INTEGER,
  isActive BOOLEAN,
  createdAt TIMESTAMPTZ,
  updatedAt TIMESTAMPTZ
);
```

#### `island_activity_mappings`
```sql
CREATE TABLE island_activity_mappings (
  id UUID PRIMARY KEY,
  islandId VARCHAR(50) REFERENCES islands(islandId),
  activityId UUID REFERENCES activities(id),
  sequenceInIsland INTEGER,
  difficulty VARCHAR(20),
  modality VARCHAR(50),
  customTitle VARCHAR(255),
  customInstructions TEXT,
  scaffolding JSONB,
  isActive BOOLEAN,
  createdAt TIMESTAMPTZ,
  updatedAt TIMESTAMPTZ,
  UNIQUE(islandId, activityId)
);
```

### 3. Diversidade de Exercícios por Ilha

Cada ilha contém 10 exercícios com:

| Dificuldade | Qtd | Modalidade | Exemplo |
|---|---|---|---|
| Very Easy | 1-2 | Visual | Identificar 1 item |
| Easy | 2-3 | Visual + Auditivo | Contar 2-3 itens |
| Medium | 2-3 | Cognitivo | Sequência, padrão |
| Hard | 1-2 | Sensorial + Cognitivo | Problema com 2 passos |
| Extreme | 1 | Cognitivo Puro | Problema complexo |

### 4. Progressão de Dificuldade

[PARÂMETRO EXPERIMENTAL] A progressão numérica aumenta conforme a ilha:

```
Ilha 1 (Números):      3 + 4 = 7
Ilha 2 (Cores):        Padrão com 2 cores
Ilha 3 (Praia):        10 + 2 = 12
```

### 5. Scaffolding (Como Fazer)

Cada exercício inclui:
- **Hints**: Dicas progressivas
- **Worked Examples**: Exemplos resolvidos
- **Instructions**: Instruções claras em português

Exemplo:
```json
{
  "hints": ["Comece do 1", "Conte em ordem"],
  "workedExample": "1, 2, 3, 4",
  "instructions": "Qual número falta na sequência?"
}
```

## Correção do Bug da Titia

[DECISÃO DE ENGENHARIA] Identificado e corrigido bug onde respostas corretas eram marcadas como erradas.

### Problema
A função `normalizeSubmittedAnswer` não extraía corretamente respostas encapsuladas em objetos:
```javascript
// Antes: Falhava com { selectedOption: 'option-b' }
// Depois: Extrai corretamente qualquer formato
```

### Solução
Atualizado `activity-answer-validator.ts`:
```typescript
function normalizeSubmittedAnswer(answer: unknown): unknown {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return answer;
  const record = answer as Record<string, unknown>;
  return record.value ?? record.selectedText ?? record.selectedOption ?? 
         record.count ?? record.arrangement ?? record.answer ?? answer;
}
```

### Teste Adicionado
```typescript
it('handles quiz answers with option IDs (Titia bug fix)', () => {
  // Valida múltiplos formatos de resposta
  expect(evaluateAnswer(quizActivity, 'option-b')).toBe(true);
  expect(evaluateAnswer(quizActivity, { selectedOption: 'option-b' })).toBe(true);
  expect(evaluateAnswer(quizActivity, { value: 'option-b' })).toBe(true);
});
```

## Remoção de Identificadores "TEA Mode"

[DECISÃO DE ENGENHARIA] Removidas referências explícitas a "TEA" das descrições de exercícios para promover inclusão:

**Antes:**
- "Suporta crianças TEA com timing lento"
- "Ótimo para crianças TEA!"
- "TEA-friendly!"

**Depois:**
- "Tempo extra para pensar e responder"
- "Movimento lento e controlado"
- "Interface clara e acessível"

## Próximas Etapas

### 8. Atualizar ADE (Adaptive Difficulty Engine)

O ADE será atualizado para considerar:
1. **Contexto de Ilha**: Manter aluno na mesma ilha até completar
2. **Sequência**: Respeitar ordem de progressão dentro da ilha
3. **Tempo desde última tentativa**: Evitar repetição recente
4. **Taxa de sucesso por tipo**: Priorizar tipos que o aluno domina

### Implementação Futura

```typescript
// ADE Decision com contexto de ilha
const adeDecision = {
  recommendedIsland: 'island-numbers',
  sequencePosition: 5,  // Próximo exercício na sequência
  difficulty: 'medium',
  modality: 'cognitive',
  timeSinceLastAttempt: 3600000, // 1 hora
  successRateByType: { quiz: 0.85, drag_drop: 0.60 }
};
```

## Métricas de Sucesso

[HIPÓTESE A VALIDAR] Esperamos validar:
- ✅ Redução de repetição de exercícios (< 10% de repetição)
- ✅ Aumento de progressão clara (100% dos alunos avançam de ilhas)
- ✅ Melhoria na sensação de progresso (feedback qualitativo)
- ✅ Balanceamento de dificuldade (distribuição uniforme)

## Arquivos Modificados

1. **Migrations**:
   - `1726950006000-CreateIslandsAndActivityMappings.ts` (Nova)

2. **Seeds**:
   - `map-activities-to-islands.sql` (Nova)
   - `exercises-77-breaking-cycle.seed.ts` (Atualizado)

3. **Validação**:
   - `activity-answer-validator.ts` (Corrigido)
   - `activities.service.spec.ts` (Teste adicionado)

## Limitações Conhecidas

[LIMITAÇÕES] 
- Apenas 3 ilhas iniciais (Números, Cores, Praia)
- Mapeamento manual de exercícios existentes
- ADE ainda não considera contexto de ilha (próxima fase)
- Pictogramas ARASAAC são referências (implementação visual pendente)

## Evidência Necessária no Experimento

Para validar esta implementação, precisamos:
1. Logs de navegação de alunos entre ilhas
2. Taxa de repetição de exercícios antes/depois
3. Feedback qualitativo sobre sensação de progresso
4. Análise de distribuição de dificuldade
5. Comparação de desempenho por tipo de modalidade

---

**Data**: Setembro 2026
**Responsável**: Devin AI
**Status**: ✅ Implementação Completa (Fase 1-7)
