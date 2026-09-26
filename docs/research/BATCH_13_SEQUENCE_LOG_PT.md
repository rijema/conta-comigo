# Batch 13 — Log de sequência de exercícios

[PROPOSTA CONTA COMIGO] Este lote define um formato de registro simples para observar repetição de exercícios, alternância de estruturas e variedade de modalidade dentro de uma mesma sessão. O objetivo é permitir que a criança realize a atividade normalmente enquanto o sistema registra a sequência observada para análise posterior.

[LITERATURA] Pellicano, E., Crane, L. (2021). "Understanding Autism". Oxford University Press.

## O que registrar

[DECISÃO DE ENGENHARIA]

Para cada exercício, registrar:

- `position`: ordem na sessão;
- `activity_id`: identificador da atividade;
- `structure_id`: estrutura cognitiva;
- `niche`: nicho pedagógico;
- `modality`: visual, auditive, kinesthetic, video;
- `difficulty`: nível da atividade;
- `mastery_before` e `mastery_after`;
- `correct`: se houve acerto;
- `response_time_ms`;
- `skipped`: se a atividade foi pulada;
- `repetition_flag`: se repetiu estrutura, nicho ou formato de maneira indesejada.

## Interpretação

[DECISÃO DE ENGENHARIA]

Se `repetition_flag` aparecer em sequência, o caso sugere que a seleção está repetindo atividades de maneira excessiva dentro do bloco. O log não diagnostica aprendizagem nem engajamento; ele apenas torna visível a sequência técnica das recomendações.

[PARÂMETRO EXPERIMENTAL] Limiar de repetição: máximo 3 ocorrências da mesma estrutura por bloco de 10 atividades.

[HIPÓTESE A VALIDAR] A variação de estruturas, nichos e modalidades dentro de uma sessão melhora o engajamento e reduz a fadiga cognitiva em crianças com TEA.

## Como usar na análise

[PROPOSTA CONTA COMIGO]

Preencher um bloco com 10 exercícios por vez e revisar:

1. quantas vezes a mesma `structure_id` apareceu;
2. quantas vezes o mesmo `niche` apareceu;
3. quantas vezes a mesma `modality` apareceu;
4. se houve alternância entre difícil, médio e fácil;
5. se o progresso parece subir, estabilizar ou cair.

## Texto potencial para a dissertação

### Metodologia

O sistema passa a registrar a sequência de atividades por bloco, com atributos de estrutura, nicho, modalidade, dificuldade e desempenho observado, permitindo inspeção manual e análise quantitativa da repetição.

### Decisão de projeto

A análise da sequência é separada da apresentação da atividade, para que o comportamento do recomendador possa ser observado sem modificar a experiência principal da criança.

### Limitações

O log não substitui avaliação pedagógica nem prova melhoria; ele apenas documenta a repetição técnica e a diversidade observada.

### Evidência necessária no experimento

São necessários blocos com sequências reais de exercícios para comparar repetição, alternância e progressão antes e depois dos ajustes do ranking.
