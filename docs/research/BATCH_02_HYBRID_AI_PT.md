# Batch 02 — IA híbrida e rastreamento de conhecimento

## Objetivo

[PROPOSTA CONTA COMIGO]

Este lote consolida o estado corrente de domínio de cada estudante e habilidade em `StudentSkillState`. O serviço NestJS `KnowledgeTracingService` é o único componente autorizado a persistir `masteryProbability`; o cálculo numérico é delegado ao `BKTService` existente no serviço Python.

[LITERATURA]

O repositório associa o modelo BKT a Corbett e Anderson (1994), mas a referência bibliográfica completa e a correspondência entre a fonte e os parâmetros numéricos ainda não foram verificadas neste lote.

TODO(referência): verificar a publicação original citada no repositório e selecionar fontes revisadas sobre BKT antes de usar esta seção como fundamentação científica.

## Modelo conceitual BKT

[PROPOSTA CONTA COMIGO]

O BKT mantém, para cada par estudante–habilidade, uma probabilidade latente de domínio `P(L)`. Cada resposta correta ou incorreta é uma observação. O modelo considera quatro parâmetros: probabilidade inicial `P(L0)`, transição de aprendizagem `P(T)`, acerto por tentativa sem domínio `P(G)` e erro apesar do domínio `P(S)`.

O modelo persistido contém `studentId`, `skillId`, `masteryProbability`, `observations` e `lastUpdatedAt`. A restrição única por estudante e habilidade impede dois estados correntes para o mesmo par. Atualizações são serializadas com transação e bloqueio da linha.

## Entrada e saída

[DECISÃO DE ENGENHARIA]

A entrada do atualizador é `studentId`, UUID da habilidade, código BNCC da habilidade e resultado booleano validado da tentativa. O `KnowledgeTracingService` lê a probabilidade corrente, chama `POST /predict/bkt` e persiste a probabilidade devolvida com o contador de observações incrementado.

A saída persistida é o novo `StudentSkillState`. Dashboards recebem mapas de código BNCC para probabilidade derivados dessa tabela. O ADE consulta a mesma tabela antes de aplicar regras de recomendação. Os campos legados `ChildProfile.skillMastery` e `AnalyticsSnapshot.skillMasterySnapshot` foram preservados e marcados como deprecated para compatibilidade; eles não são a fonte corrente de domínio.

## Equação implementada

[DECISÃO DE ENGENHARIA]

Se a observação `y` for correta:

`P(L | y=1) = [P(L) × (1 − P(S))] / [P(L) × (1 − P(S)) + (1 − P(L)) × P(G)]`

Se a observação `y` for incorreta:

`P(L | y=0) = [P(L) × P(S)] / [P(L) × P(S) + (1 − P(L)) × (1 − P(G))]`

Depois da evidência, aplica-se a transição de aprendizagem:

`P(L seguinte) = P(L | y) + [1 − P(L | y)] × P(T)`

O resultado é limitado ao intervalo `[0, 1]`. Quando o denominador bayesiano é numericamente inferior a `1e-10`, a implementação preserva a probabilidade anterior antes da transição. Esse valor é uma proteção numérica da implementação, não um limiar pedagógico.

## Parâmetros iniciais

[PARÂMETRO EXPERIMENTAL]

Os valores iniciais canônicos são:

| Parâmetro | Variável | Valor padrão |
| --- | --- | --- |
| `P(L0)` | `BKT_PRIOR_KNOWLEDGE` | `0,10` |
| `P(T)` | `BKT_LEARNING_RATE` | `0,20` |
| `P(G)` | `BKT_GUESS_RATE` | `0,25` |
| `P(S)` | `BKT_SLIP_RATE` | `0,10` |
| limiar descritivo de domínio | `BKT_MASTERY_THRESHOLD` | `0,80` |
| início da dificuldade média | `BKT_MEDIUM_DIFFICULTY_THRESHOLD` | `0,50` |
| início da dificuldade alta | `BKT_HARD_DIFFICULTY_THRESHOLD` | `0,80` |

Todos esses valores são parâmetros experimentais e configuráveis; não constituem resultados validados para a população do projeto. Os parâmetros antigos específicos por habilidade permanecem no código apenas para compatibilidade, estão marcados como deprecated e ficam desativados por padrão por `BKT_USE_LEGACY_SKILL_PARAMS=false`.

[HIPÓTESE A VALIDAR]

A manutenção de um único estado BKT por estudante e habilidade pode aumentar a consistência entre atualização, visualização analítica e recomendação. Essa hipótese exige comparação experimental e auditoria dos eventos e estados persistidos.

## Limitações

- Os valores padrão não foram estimados com dados do estudo e precisam ser calibrados ou avaliados.
- O BKT assume um estado latente simplificado e não representa sozinho todos os fatores envolvidos na aprendizagem.
- A atualização depende da disponibilidade do serviço Python; falhas são registradas e não são substituídas por uma heurística de domínio.
- A primeira versão usa uma habilidade principal por atividade quando várias habilidades estão associadas.
- Registros legados continuam disponíveis para compatibilidade e podem divergir do estado canônico até uma migração explícita futura.
- A probabilidade de domínio não é diagnóstico, nota escolar nem medida clínica ou psicológica.

## Texto potencial para a dissertação

### Metodologia

O estado de conhecimento foi representado por uma probabilidade de domínio para cada par estudante–habilidade. Após cada tentativa validada, uma atualização bayesiana incorpora a evidência correta ou incorreta e aplica uma transição de aprendizagem. O novo estado e o número de observações são persistidos de forma transacional.

### Decisão de projeto

Foi selecionada a implementação BKT existente no serviço Python como cálculo canônico. O backend NestJS centraliza leitura e escrita persistente por meio de `KnowledgeTracingService`, e os consumidores analíticos e adaptativos consultam `StudentSkillState`.

### Limitações

Os parâmetros são experimentais, a relação atividade–habilidade considera inicialmente apenas a primeira habilidade e a atualização depende de comunicação entre serviços. Os estados legados foram mantidos e não devem ser interpretados como fonte corrente.

### Evidência necessária no experimento

Devem ser registrados parâmetros por execução, sequência de observações, probabilidades anteriores e posteriores, falhas de atualização e concordância entre eventos e estados. A calibração e a avaliação preditiva precisam ser definidas antes da análise, com referência bibliográfica verificada.
