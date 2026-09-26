# Island/Cycle Design Decision

## Contexto

Durante a implementação da validação de contexto de ilha/ciclo para o sistema de revisão longitudinal, foi necessário determinar se ciclos são um conceito pedagógico ou uma abstração de UX.

## Investigação

### Infraestrutura Existente

1. **IslandExerciseMapping**: Mapeia ilhas para habilidades BNCC
   - Armazenado no banco de dados
   - Validável e autoritativo
   - Usado por ExerciseProgressionService

2. **ExerciseProgressionService**: Determina próximo exercício
   - Baseado em dificuldade (very_easy → easy → medium → hard → extreme)
   - Baseado em métricas de desempenho (acurácia, dicas, tempo de resposta)
   - Baseado em BKT (probabilidade de maestria)
   - NÃO usa conceito de ciclo

3. **Conceito de Ciclo**
   - Não existe mapeamento no banco de dados
   - Não existe entidade ou serviço que rastreie ciclos
   - Não é usado pela lógica de progressão pedagógica
   - Aparece apenas no frontend como abstração de UX

## Decisão

[DECISÃO DE ENGENHARIA]: **Ciclos são abstrações de UX, não unidades pedagógicas.**

### Justificativa

1. **Modelo Pedagógico Real**: A progressão é baseada em:
   - Dificuldade do exercício
   - Desempenho do aluno (BKT)
   - Métricas de interação (tempo, dicas, acertos)
   - Não em sequências de ciclo

2. **Arquitetura Existente**: 
   - ExerciseProgressionService não usa ciclos
   - IslandExerciseMapping não mapeia ciclos
   - Nenhum serviço rastreia ciclos

3. **Risco de Fabricação**:
   - Criar mapeamento de ciclo seria artificialmente forçar um conceito
   - Violaria o princípio de não inventar dados científicos
   - Criaria falsa evidência de progressão sequencial

## Implementação

### Validação de Ilha (VERIFICADA)
```
islandId → IslandExerciseMapping → Verifica se atividade pertence à ilha
```

### Armazenamento de Ciclo (NÃO VERIFICADO)
```
cycleNumber → Armazenado em ActivityAttempt.researchTrace
             → Usado para continuidade de UX no frontend
             → NÃO usado para escopo de checkpoint
```

### Escopo de Checkpoint (VERIFICADO)
```
Checkpoint usa: studentId + sessionId + islandId
Checkpoint NÃO usa: cycleNumber (unverificado)
```

## Implicações para Revisão Longitudinal

### O que é Verificado
- Atividade pertence à ilha (via IslandExerciseMapping)
- Atividade foi completada na sessão atual
- Limite de checkpoint atingido na mesma ilha

### O que é Armazenado mas Não Verificado
- Número do ciclo (para continuidade de UX)
- Contexto de ciclo (para análise de pesquisa)

### O que NÃO é Usado para Checkpoint
- Ciclos como unidade de progressão
- Ciclos como escopo de revisão
- Ciclos como evidência pedagógica

## Evidência Necessária no Experimento

Se no futuro for necessário validar ciclos como unidade pedagógica:

1. Criar IslandCycleMapping (atividade → ciclo)
2. Estender ExerciseProgressionService para usar ciclos
3. Validar que ciclos melhoram a progressão pedagógica
4. Atualizar checkpoint para usar ciclos verificados

## Limitações Documentadas

- Ciclos não são unidades pedagógicas no modelo atual
- Ciclos são abstrações de UX apenas
- Checkpoint usa apenas contexto verificado (ilha + sessão)
- Ciclos preservados para pesquisa e continuidade de UX

## Conclusão

A decisão de manter ciclos como contexto não verificado é:
- ✅ Honesta sobre o modelo pedagógico real
- ✅ Consistente com a arquitetura existente
- ✅ Segura para evidência de pesquisa
- ✅ Flexível para extensões futuras
