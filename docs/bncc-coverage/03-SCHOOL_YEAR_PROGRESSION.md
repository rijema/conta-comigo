# Consideração de Ano Escolar na Fórmula de Progressão

## Visão Geral

Implementamos a consideração do **ano escolar (schoolYear)** na fórmula de sugestão de próximo exercício. Se o ano escolar não foi preenchido no perfil do aluno, o fator é removido da fórmula (valor = 0), mantendo o comportamento original.

## Implementação

### 1. Campo schoolYear
- **Entidade**: `ChildProfile`
- **Tipo**: `number` (1-5 para Anos Iniciais)
- **Nullable**: Sim
- **Padrão**: Se não preenchido, é tratado como 0 na fórmula

### 2. Fórmula de Progressão Ajustada

#### A. Cálculo de Dificuldade Próxima (`calculateNextDifficulty`)

```typescript
const yearFactor = schoolYear && schoolYear > 0 ? (schoolYear - 1) * 0.05 : 0;

// Thresholds ajustados:
const hardThreshold = 0.85 + yearFactor;      // 1º ano: 0.85, 2º: 0.90, 3º: 0.95, etc.
const mediumThreshold = 0.7 + yearFactor;     // 1º ano: 0.70, 2º: 0.75, 3º: 0.80, etc.
const easyThreshold = 0.5 + yearFactor;       // 1º ano: 0.50, 2º: 0.55, 3º: 0.60, etc.
```

**Lógica:**
- Se `schoolYear` não foi preenchido (0 ou undefined): usa thresholds originais
- Se `schoolYear` foi preenchido: aumenta os thresholds em 5% por ano
  - **1º ano**: Thresholds originais (0.85, 0.7, 0.5)
  - **2º ano**: +5% (0.90, 0.75, 0.55)
  - **3º ano**: +10% (0.95, 0.80, 0.60)
  - **4º ano**: +15% (1.00, 0.85, 0.65)
  - **5º ano**: +20% (1.05, 0.90, 0.70)

**Interpretação:**
- Anos mais avançados exigem **acurácia maior** para avançar de dificuldade
- Exemplo: Uma criança do 3º ano precisa de 95% de acurácia para exercícios "hard", enquanto uma do 1º ano precisa de 85%

#### B. Cálculo de Fit Score (`calculateFitScore`)

```typescript
let score = 0.5; // Base

if (accuracy > 0.7) {
  score += 0.2;  // Bonus por acurácia
}

if (averageHintsPerAttempt < 1) {
  score += 0.15; // Bonus por independência
}

if (activity.difficulty === 'medium') {
  score += 0.15; // Bonus por dificuldade média
}

// NOVO: Bonus por alinhamento ao ano escolar
if (schoolYear && schoolYear > 0 && activity.bnccSkills.length > 0) {
  const skillYear = parseInt(activity.bnccSkills[0].substring(2, 4), 10);
  if (skillYear === schoolYear) {
    score += 0.1; // Bonus de 10%
  }
}
```

**Interpretação:**
- Exercícios alinhados ao ano escolar recebem **bonus de 10%**
- Exemplo: Uma criança do 2º ano recebe bonus ao fazer exercícios EF02MA*
- Se não preenchido: não há bonus, apenas critérios originais

#### C. Filtro de Atividades por Ano (`getActivitiesByIsland`)

```typescript
if (schoolYear && schoolYear > 0) {
  const yearPrefix = `EF0${schoolYear}MA`;
  skills = skills.filter((skill) => skill.startsWith(yearPrefix));
  
  // Se não encontrar, volta aos skills da ilha
  if (skills.length === 0) {
    skills = islandTopicMap[islandId] || [];
  }
}
```

**Interpretação:**
- Prioriza exercícios do ano escolar correto
- Se não houver exercícios do ano, volta aos exercícios da ilha
- Garante que sempre há opções disponíveis

## Exemplos de Comportamento

### Cenário 1: Sem ano escolar preenchido (schoolYear = 0 ou undefined)

```
Métrica: accuracy = 0.75

calculateNextDifficulty(metrics, undefined):
  yearFactor = 0
  hardThreshold = 0.85 + 0 = 0.85
  mediumThreshold = 0.7 + 0 = 0.7
  
  0.75 >= 0.7? SIM
  0.75 >= 0.85? NÃO
  
  Resultado: "medium"
```

### Cenário 2: 1º ano (schoolYear = 1)

```
Métrica: accuracy = 0.75

calculateNextDifficulty(metrics, 1):
  yearFactor = (1 - 1) * 0.05 = 0
  hardThreshold = 0.85 + 0 = 0.85
  mediumThreshold = 0.7 + 0 = 0.7
  
  0.75 >= 0.7? SIM
  0.75 >= 0.85? NÃO
  
  Resultado: "medium"
```

### Cenário 3: 3º ano (schoolYear = 3)

```
Métrica: accuracy = 0.75

calculateNextDifficulty(metrics, 3):
  yearFactor = (3 - 1) * 0.05 = 0.10
  hardThreshold = 0.85 + 0.10 = 0.95
  mediumThreshold = 0.7 + 0.10 = 0.80
  
  0.75 >= 0.80? NÃO
  0.75 >= 0.50? SIM
  
  Resultado: "easy"
```

**Interpretação:** A mesma criança com 75% de acurácia recebe exercícios "medium" no 1º ano, mas "easy" no 3º ano, porque esperamos maior domínio em anos mais avançados.

## Integração com Controllers/Services

### Exemplo de Uso

```typescript
// No controller de atividades
async suggestNextExercise(userId: string, islandId: string) {
  // Busca o perfil da criança
  const profile = await this.childProfileService.getProfile(userId);
  
  // Passa o schoolYear para a sugestão
  const suggestion = await this.progressionService.suggestNextExercise(
    userId,
    islandId,
    sessionId,
    profile.schoolYear // 0, 1, 2, 3, 4, ou 5
  );
  
  return suggestion;
}
```

## Comportamento Padrão

Se `schoolYear` não for preenchido:
- ✅ Fórmula funciona normalmente (sem ajustes)
- ✅ Sem bonus de alinhamento ao ano
- ✅ Sem filtro de skills por ano
- ✅ Comportamento idêntico ao anterior

## Próximos Passos

1. **Atualizar Controllers**: Passar `schoolYear` ao chamar `suggestNextExercise`
2. **Testes**: Validar comportamento com diferentes anos escolares
3. **Dashboard**: Mostrar ano escolar na interface de progressão
4. **Documentação**: Instruir educadores a preencherem o ano escolar no perfil

## Referências

- Entidade: `ChildProfile` (schoolYear: number)
- Serviço: `ExerciseProgressionService`
- Métodos atualizados:
  - `suggestNextExercise(userId, islandId, sessionId, schoolYear?)`
  - `calculateNextDifficulty(metrics, schoolYear?)`
  - `calculateFitScore(metrics, activity, schoolYear?)`
  - `suggestRepeatWithVariation(userId, islandId, availableActivities, metrics, schoolYear?)`
  - `getActivitiesByIsland(islandId, schoolYear?)`
  - `getIslandProgress(userId, islandId, schoolYear?)`

---

## 📚 Próximo Documento

Leia **04-NEW_EXERCISES.md** para ver detalhes de cada um dos 12 exercícios novos.
