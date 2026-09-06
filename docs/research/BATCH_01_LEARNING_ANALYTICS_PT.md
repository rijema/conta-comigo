# Batch 01 — Eventos de Learning Analytics

## Objetivo e escopo

[PROPOSTA CONTA COMIGO]

Este lote introduz um registro cronológico de eventos de aprendizagem sem remover `activity_attempts`, `analytics_snapshots` ou `ade_decisions`. A instrumentação completa das interações do frontend permanece fora deste lote.

[LITERATURA]

Não foram identificadas, na documentação atual do repositório, referências bibliográficas verificáveis sobre modelos de eventos de Learning Analytics. Portanto, este documento não atribui afirmações a fontes externas.

TODO(referência): selecionar e verificar literatura sobre Learning Analytics, event sourcing educacional e governança de dados antes de usar essas relações como fundamentação científica.

## Por que preservar eventos brutos

[DECISÃO DE ENGENHARIA]

Eventos brutos preservam a sequência observada antes de agregações. Assim, uma correção futura na definição de uma métrica pode ser reaplicada sobre o histórico, e snapshots derivados podem ser auditados em relação às entradas disponíveis. O registro é append-only: a aplicação apenas insere eventos e o banco rejeita `UPDATE` e `DELETE` na tabela. Essa imutabilidade técnica não equivale a retenção ilimitada; políticas de privacidade e obrigações legais ainda devem definir um procedimento administrativo controlado para expurgo quando necessário.

Os eventos não substituem os modelos existentes:

- `LearningEvent` representa observações atômicas ordenadas no tempo;
- `ActivityAttempt` representa o resultado consolidado de uma tentativa;
- `ADEDecision` registra uma decisão adaptativa e sua explicação;
- `AnalyticsSnapshot` representa métricas derivadas em um ponto do tempo.

## Esquema do evento

[DECISÃO DE ENGENHARIA]

| Campo | Tipo | Nulável | Finalidade |
| --- | --- | --- | --- |
| `id` | UUID | não | Identificador do evento |
| `studentId` | UUID | não | Identificador do estudante |
| `sessionId` | varchar | não | Correlação com a sessão de aprendizagem |
| `eventType` | enum | não | Natureza do evento |
| `timestamp` | timestamptz | não | Instante atribuído ao evento |
| `activityId` | UUID | sim | Atividade relacionada |
| `bnccSkillId` | UUID | sim | Habilidade BNCC relacionada |
| `attempt` | integer | sim | Número ordinal da tentativa |
| `responseTimeMs` | integer | sim | Tempo de resposta em milissegundos |
| `correct` | boolean | sim | Correção da resposta, quando aplicável |
| `hintsUsed` | integer | sim | Quantidade de dicas utilizadas |
| `recommendationId` | varchar | sim | Correlação com uma recomendação |
| `metadata` | jsonb | sim | Extensão controlada para dados específicos do evento |

Os tipos iniciais são: `SESSION_STARTED`, `SESSION_COMPLETED`, `ACTIVITY_PRESENTED`, `ACTIVITY_STARTED`, `ANSWER_SUBMITTED`, `ACTIVITY_COMPLETED`, `ACTIVITY_SKIPPED`, `HINT_REQUESTED`, `TUTORIAL_OPENED`, `INSTRUCTION_REPLAYED`, `RECOMMENDATION_GENERATED`, `RECOMMENDATION_PRESENTED`, `RECOMMENDATION_COMPLETED`, `DIFFICULTY_ADJUSTED` e `TITIA_INTERACTION`.

## Relação com Learning Analytics

[PROPOSTA CONTA COMIGO]

O log fornece a camada de observação para análises posteriores. Processadores podem ler eventos e produzir snapshots, relatórios ou entradas para o ADE sem alterar o histórico. O fluxo atual de filas Bull/Redis e snapshots continua existindo em paralelo; integrar todos os produtores e consumidores ao novo modelo será realizado em lotes posteriores.

O método `LearningEventService.track()` contém erros de persistência, registra a falha no log e devolve `null`. Isso impede que indisponibilidade analítica transforme uma interação de aprendizagem em erro funcional. A aplicação chamadora ainda deve tratar o evento como telemetria auxiliar, não como condição para concluir a atividade.

## Fluxo de Eventos Implementado

[DECISÃO DE ENGENHARIA]

O ciclo de atividade atualmente ativo foi instrumentado sem redesenhar seus componentes. A sessão criada por `useSession` mantém o mesmo `sessionId` até ser encerrada. Quando uma atividade é recebida, o frontend envia `ACTIVITY_PRESENTED`; depois que ela é renderizada, envia `ACTIVITY_STARTED`. Uma chave composta por sessão, atividade e tipo, mantida fora do estado de renderização, evita novas emissões causadas por re-renderizações React.

Ao submeter uma resposta, o comportamento existente de `ActivityAttempt` permanece como registro operacional. Depois de salvá-lo, o backend inicia em paralelo e sem espera na resposta HTTP a criação de `ANSWER_SUBMITTED` e `ACTIVITY_COMPLETED`. `ANSWER_SUBMITTED` contém o resultado calculado no servidor, o ordinal da tentativa, o tempo em milissegundos, o UUID da atividade e o UUID da primeira habilidade BNCC associada, quando resolvida.

O conteúdo da resposta não é copiado para o evento nem para `metadata`. As chamadas de apresentação e início também enviam apenas sessão, tipo e identificador da atividade; o UUID da habilidade BNCC é resolvido no backend. Falhas de rede, resolução da habilidade ou persistência são registradas e não interrompem a atividade.

Fluxo implementado: `ACTIVITY_PRESENTED` → `ACTIVITY_STARTED` → `ANSWER_SUBMITTED` → `ACTIVITY_COMPLETED`. Uma resposta incorreta conclui a tentativa observada, embora a interface possa manter a mesma atividade para outra tentativa.

Também foram instrumentadas ações explícitas de assistência e navegação. Ao acionar “Como resolver?”, são emitidos `HINT_REQUESTED` e `TUTORIAL_OPENED`. Se o tutorial for aberto novamente para a mesma atividade, a reapresentação das instruções também produz `INSTRUCTION_REPLAYED`. Ao sair da atividade atual pelo botão “Mapa”, é emitido `ACTIVITY_SKIPPED` antes da navegação.

Quando disponíveis no cliente, `ACTIVITY_SKIPPED` inclui em `metadata` o tempo observado desde o início da atividade (`timeBeforeSkipMs`), a quantidade de submissões iniciadas (`attemptsBeforeSkip`) e a quantidade de solicitações de ajuda (`hintsBeforeSkip`). Esses campos não incluem o texto da resposta nem o conteúdo apresentado à criança.

[PROPOSTA CONTA COMIGO]

`HINT_REQUESTED`, `TUTORIAL_OPENED`, `INSTRUCTION_REPLAYED` e `ACTIVITY_SKIPPED` são indicadores observacionais de interação. Em particular, `ACTIVITY_SKIPPED` não é classificado como desengajamento. Isoladamente ou em conjunto, esses eventos não constituem diagnóstico clínico, psicológico, comportamental ou de qualquer condição da pessoa participante. Qualquer interpretação sobre necessidade de apoio, experiência ou aprendizagem permanece como hipótese a validar com protocolo e evidência apropriados.

## Métricas deriváveis

[PROPOSTA CONTA COMIGO]

Sem fixar interpretações científicas, a sequência pode fornecer insumos para calcular:

- quantidade de sessões iniciadas e concluídas;
- quantidade de atividades apresentadas, iniciadas, concluídas ou puladas;
- tempo observado entre apresentação, início, resposta e conclusão;
- proporção de respostas marcadas como corretas por atividade ou habilidade;
- uso de dicas, tutoriais e repetição de instruções;
- funil entre recomendação gerada, apresentada e concluída;
- frequência de ajustes de dificuldade e interações com a TitiA.

## Agregações determinísticas implementadas

[DECISÃO DE ENGENHARIA]

As métricas são calculadas diretamente de `LearningEvent`, sem usar o índice de engajamento dos snapshots. Uma instância de atividade é identificada pela combinação `studentId + sessionId + activityId`. Contagens de atividades usam instâncias distintas, de modo que eventos duplicados ou várias respostas à mesma atividade não dupliquem apresentações, inícios, conclusões, pulos ou solicitações de ajuda. Eventos que não possuem `activityId` são ignorados nas métricas que dependem de uma instância de atividade.

As fórmulas exatas são:

- `accuracy = quantidade de ANSWER_SUBMITTED com correct = true / quantidade total de ANSWER_SUBMITTED`;
- `completionRate = quantidade de instâncias distintas com ACTIVITY_COMPLETED / quantidade de instâncias distintas com ACTIVITY_STARTED`;
- `skipRate = quantidade de instâncias distintas com ACTIVITY_SKIPPED / quantidade de instâncias distintas com ACTIVITY_PRESENTED`;
- `averageAttempts = quantidade de ANSWER_SUBMITTED associados a uma instância / quantidade de instâncias distintas com ao menos um ANSWER_SUBMITTED`;
- `averageResponseTimeMs = soma de responseTimeMs disponíveis em ANSWER_SUBMITTED / quantidade de ANSWER_SUBMITTED com responseTimeMs disponível`;
- `hintRate = quantidade de instâncias distintas com ao menos um HINT_REQUESTED / quantidade de instâncias distintas com ACTIVITY_STARTED`;
- `instructionReplayRate = quantidade de instâncias distintas com ao menos um INSTRUCTION_REPLAYED / quantidade de instâncias distintas com ACTIVITY_STARTED`;
- `activitiesCompleted = quantidade de instâncias distintas com ACTIVITY_COMPLETED`;
- `activitiesPresented = quantidade de instâncias distintas com ACTIVITY_PRESENTED`.

Quando o denominador de qualquer fórmula é zero, o resultado definido é `0`. Um `ANSWER_SUBMITTED` sem `correct = true` permanece no denominador de `accuracy`, mas somente `correct = true` entra no numerador. Tempos ausentes não entram na soma nem no denominador de `averageResponseTimeMs`.

O mesmo cálculo pode ser filtrado por estudante, sessão, UUID de habilidade BNCC ou tipo de atividade. O recorte por tipo consulta somente a associação técnica entre `LearningEvent.activityId` e `Activity.type`. Nenhuma dessas métricas é combinada em um escore único de engajamento.

[PARÂMETRO EXPERIMENTAL]

Janelas temporais, limites de latência, critérios de sessão abandonada e interpretações pedagógicas ainda não foram definidos. Esses valores devem ser configuráveis e registrados no protocolo experimental. As fórmulas técnicas deste lote estão fixadas acima para permitir reprodução dos resultados.

[HIPÓTESE A VALIDAR]

A preservação da sequência bruta pode permitir reconstruir métricas e auditar decisões adaptativas com maior rastreabilidade do que o uso exclusivo de snapshots. Essa hipótese exige validação com dados controlados e critérios definidos previamente.

## Limitações

- O lote não instrumenta todas as interações do frontend e, isoladamente, não produz cobertura completa.
- `timestamp` é fornecido pelo produtor; sincronização de relógio, atraso e ordem de chegada podem afetar sequências.
- O esquema não define deduplicação nem chave de idempotência.
- `metadata` permite evolução, mas exige governança para não se tornar um depósito de dados sem contrato.
- Falhas são registradas e contidas; sem uma fila transacional ou mecanismo de repetição, um evento pode ser perdido.
- O modelo registra observações técnicas e não comprova engajamento, aprendizagem, causalidade ou eficácia pedagógica.
- Solicitar ajuda, reabrir instruções ou pular uma atividade pode ter múltiplas razões; os eventos não determinam motivação, atenção ou estado psicológico.

## Implicações de privacidade

[DECISÃO DE ENGENHARIA]

Eventos formam um histórico comportamental associado a um identificador de estudante. Devem ser aplicados minimização, controle de acesso, finalidade explícita, prazo de retenção e proteção dos logs. `metadata` não deve receber texto livre, conteúdo sensível, biometria, imagem, áudio ou vídeo. Identificadores técnicos devem ser preferidos a dados diretamente identificáveis.

O bloqueio de atualização e exclusão protege a integridade analítica, mas pode entrar em tensão com solicitações legítimas de eliminação. Antes de produção, é necessário definir uma operação privilegiada, auditável e separada da aplicação para cumprir a política de retenção e os direitos aplicáveis sem permitir mutação cotidiana do histórico.

TODO(referência): verificar e documentar a base legal, os prazos de retenção e os requisitos aplicáveis ao tratamento de dados educacionais de crianças.

## Correção de metadados PostgreSQL

[DECISÃO DE ENGENHARIA]

`recommendationId` é declarado explicitamente como `varchar` na entidade TypeORM. A anotação explícita evita que o compilador de metadados infira `Object` para a propriedade anulável, tipo que não é suportado pelo driver PostgreSQL. A migração e o `schema.sql` já utilizavam `VARCHAR`, portanto a correção alinha o modelo de runtime ao esquema existente e não exige migração de dados.

## Texto potencial para a dissertação

### Metodologia

Foi introduzido um modelo de eventos de aprendizagem no qual cada observação é registrada como uma nova linha contendo estudante, sessão, tipo, instante e contexto opcional. O banco impede atualização e exclusão pela aplicação, enquanto tentativas, decisões adaptativas e snapshots preexistentes são preservados.

### Decisão de projeto

A separação entre eventos brutos e representações derivadas permite recalcular agregações e rastrear a origem técnica de métricas. A indisponibilidade da persistência analítica é contida e registrada para não invalidar a interação principal.

### Limitações

Este lote cria a infraestrutura, mas não oferece instrumentação integral, garantia de entrega, deduplicação ou interpretação científica das métricas. O desenho de retenção e eliminação privilegiada ainda precisa ser definido antes da coleta em produção.

### Evidência necessária no experimento

O experimento deverá registrar completude, duplicação, perda, atraso e ordenação dos eventos, além de comparar métricas reconstruídas com os resultados operacionais. Definições, janelas, fórmulas e critérios de qualidade deverão ser pré-especificados. Referências científicas e requisitos de privacidade deverão ser verificados antes de sua inclusão no protocolo.
