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

[PARÂMETRO EXPERIMENTAL]

Janelas temporais, regras de associação entre eventos, tratamento de duplicatas, limites de latência, critérios de sessão abandonada e fórmulas de agregação ainda não foram definidos. Esses valores devem ser configuráveis e registrados no protocolo experimental.

[HIPÓTESE A VALIDAR]

A preservação da sequência bruta pode permitir reconstruir métricas e auditar decisões adaptativas com maior rastreabilidade do que o uso exclusivo de snapshots. Essa hipótese exige validação com dados controlados e critérios definidos previamente.

## Limitações

- O lote não instrumenta todas as interações do frontend e, isoladamente, não produz cobertura completa.
- `timestamp` é fornecido pelo produtor; sincronização de relógio, atraso e ordem de chegada podem afetar sequências.
- O esquema não define deduplicação nem chave de idempotência.
- `metadata` permite evolução, mas exige governança para não se tornar um depósito de dados sem contrato.
- Falhas são registradas e contidas; sem uma fila transacional ou mecanismo de repetição, um evento pode ser perdido.
- O modelo registra observações técnicas e não comprova engajamento, aprendizagem, causalidade ou eficácia pedagógica.

## Implicações de privacidade

[DECISÃO DE ENGENHARIA]

Eventos formam um histórico comportamental associado a um identificador de estudante. Devem ser aplicados minimização, controle de acesso, finalidade explícita, prazo de retenção e proteção dos logs. `metadata` não deve receber texto livre, conteúdo sensível, biometria, imagem, áudio ou vídeo. Identificadores técnicos devem ser preferidos a dados diretamente identificáveis.

O bloqueio de atualização e exclusão protege a integridade analítica, mas pode entrar em tensão com solicitações legítimas de eliminação. Antes de produção, é necessário definir uma operação privilegiada, auditável e separada da aplicação para cumprir a política de retenção e os direitos aplicáveis sem permitir mutação cotidiana do histórico.

TODO(referência): verificar e documentar a base legal, os prazos de retenção e os requisitos aplicáveis ao tratamento de dados educacionais de crianças.

## Texto potencial para a dissertação

### Metodologia

Foi introduzido um modelo de eventos de aprendizagem no qual cada observação é registrada como uma nova linha contendo estudante, sessão, tipo, instante e contexto opcional. O banco impede atualização e exclusão pela aplicação, enquanto tentativas, decisões adaptativas e snapshots preexistentes são preservados.

### Decisão de projeto

A separação entre eventos brutos e representações derivadas permite recalcular agregações e rastrear a origem técnica de métricas. A indisponibilidade da persistência analítica é contida e registrada para não invalidar a interação principal.

### Limitações

Este lote cria a infraestrutura, mas não oferece instrumentação integral, garantia de entrega, deduplicação ou interpretação científica das métricas. O desenho de retenção e eliminação privilegiada ainda precisa ser definido antes da coleta em produção.

### Evidência necessária no experimento

O experimento deverá registrar completude, duplicação, perda, atraso e ordenação dos eventos, além de comparar métricas reconstruídas com os resultados operacionais. Definições, janelas, fórmulas e critérios de qualidade deverão ser pré-especificados. Referências científicas e requisitos de privacidade deverão ser verificados antes de sua inclusão no protocolo.
