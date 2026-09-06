# Batch 02 — LASDONT 1.0 como linha de base histórica

## Escopo e método

[DECISÃO DE ENGENHARIA]

Esta análise compara o artefato histórico `ontology/lasdont/LASDONT-v1.owx` com o código atual do ContaComigo. A comparação foi feita por inspeção dos axiomas declarados no OWL/XML e das entidades e serviços atualmente versionados. A LASDONT 1.0 é tratada como linha de base conceitual, não como arquitetura de execução, ancestral técnico comprovado ou dependência do sistema atual.

[DECISÃO DE ENGENHARIA]

Nenhuma equivalência, herança ou regra foi atribuída quando não estava explícita no arquivo histórico ou no código. O arquivo `LASDONT.properties` fornecido junto ao artefato contém apenas chaves JDBC sem valores e não integra a ontologia nem foi incorporado. Não foram introduzidos runtime OWL, agentes, SPADE, FIPA ACL, threads ou protocolos legados.

## O que era a LASDONT

[LITERATURA]

O próprio artefato se descreve como uma ontologia de ambientes de aprendizagem baseada no nível de suporte da criança autista. Não há, no repositório, publicação ou referência bibliográfica verificada que permita ampliar essa caracterização histórica.

TODO(referência): localizar e verificar a documentação acadêmica original da LASDONT antes de atribuir objetivos, validação ou resultados além dos axiomas presentes no arquivo.

[DECISÃO DE ENGENHARIA]

A LASDONT 1.0 declara uma taxonomia de forças e fraquezas visuais, auditivas, lógicas, motoras e sensoriais; tipos de tratamento/atividade (`DIY`, quebra-cabeças, questionários e vídeos); formulários e avaliação; faixas denominadas como percentuais; e relações entre tratamentos e características. O arquivo contém IRIs da ontologia LASDONT e, para a maior parte das entidades, IRIs com o nome residual `OntoPizza01.owl`. Essa inconsistência nominal deve ser corrigida em uma ontologia futura, mas não foi alterada no artefato histórico.

[DECISÃO DE ENGENHARIA]

Os axiomas mais diretamente ligados à adaptação são restrições necessárias (`SubClassOf`), não definições equivalentes: por exemplo, `IA_Sandbox_DIY` está subordinado a possuir alguma força sensorial e alguma força visual; `Visual_Puzzles`, a forças lógica, sensorial e visual; e `Textual_Quizzes`, a força lógica. Isso não autoriza concluir a recíproca — possuir essas características não basta, em OWL, para classificar automaticamente algo como aquele tratamento.

## O que o ContaComigo atual implementa

[DECISÃO DE ENGENHARIA]

O runtime atual não carrega nem consulta OWL. `OntologyService` mantém um grafo TypeScript/JSON; `OntologyReasonerService` transforma campos booleanos de `ChildProfile.strengths` e `ChildProfile.weaknesses` em modalidades; `AdeService` combina essa saída com regras configuráveis, estado de domínio e predições do serviço ML; e `AdeDecision` registra a recomendação e sua explicação.

[DECISÃO DE ENGENHARIA]

As atividades atuais possuem tipo, dificuldade, códigos de habilidades BNCC, modalidades-alvo e metadados de acessibilidade. O domínio por habilidade é persistido em `StudentSkillState` e atualizado por `KnowledgeTracingService`. Interações são preservadas como `LearningEvent`, e `LearningAnalyticsMetricsService` deriva métricas determinísticas desses eventos. Esses elementos modernos não dependem do modelo histórico.

## Mapeamento conceitual

[DECISÃO DE ENGENHARIA]

“Equivalente atual” abaixo significa somente o elemento funcional mais próximo encontrado no código. Não afirma identidade semântica ou `owl:equivalentClass`.

| Conceito histórico LASDONT | Equivalente atual no ContaComigo | Status | Ação recomendada |
| --- | --- | --- | --- |
| `Strength_and_Weakness_Class` | Agrupamentos JSON `ChildProfile.strengths` e `weaknesses` | partially preserved | Refinar como características observadas/declaradas, com proveniência e sem convertê-las em diagnóstico. |
| `Strengths` | `ChildProfile.strengths` | partially preserved | Preservar o eixo conceitual; definir significado, origem, validade temporal e cardinalidade. |
| `Visual_Strength` / `VisualStrength` | `strengths.visual`; modalidade `visual`; `Activity.targetModalities` | preserved | Alinhar a nomenclatura e distinguir característica do estudante de propriedade do recurso. |
| `Auditive_Strength` / `AuditiveStrength` | `strengths.auditive`; modalidade `auditive` | partially preserved | Refinar a terminologia entre “auditive”, “auditory” e presença de áudio; não declarar equivalência até a definição ser fixada. |
| `Logical_Strength` / `LogicalStrength` | `strengths.logical`; modalidades e regras de questionário | preserved | Manter como característica configurável, registrando a origem da observação. |
| `Motor_Strength` / `MotorStrength` | `strengths.motor` | partially preserved | Manter no perfil sem inferir capacidade clínica; ainda não há regra atual específica comprovada para essa força. |
| `Sensory_Strength` / `SensoryStrength` | `strengths.sensory`; `accessibility.sensoryLoad`; modalidades-alvo | partially preserved | Separar característica do estudante, preferência de interface e carga sensorial da atividade. |
| `Weaknesses` e cinco subclasses | `ChildProfile.weaknesses` nos mesmos cinco eixos | partially preserved | Substituir linguagem deficitária na nova ontologia por necessidade, barreira, preferência ou suporte quando semanticamente adequado; preservar o dado legado apenas com governança. |
| Disjunção força/fraqueza em cada eixo | Objetos booleanos independentes | replaced | Não transportar a disjunção automaticamente: o runtime pode representar ausência, ambos indefinidos ou combinações que exigem validação conceitual. |
| `Treatments_Class` | `Activity`, seus tipos e modalidades recomendadas | replaced | Usar “atividade”, “recurso” ou “estratégia de suporte”; não representar atividade educacional como tratamento clínico. |
| `DIY` / `IA_Sandbox_DIY` | Modalidade `interactive` no `OntologyService`; tipos interativos como `drag_drop` | partially preserved | Preservar a ideia de recurso interativo, sem afirmar identidade entre tipos atuais e a classe histórica. |
| `Puzzles` / `Visual_Puzzles` | `ActivityType.VISUAL_PUZZLE` | preserved | Alinhar como tipo de atividade, mantendo BNCC, dificuldade e acessibilidade como dimensões separadas. |
| `Quizzes`, `Textual_Quizzes`, `Visual_Quizzes` | `ActivityType.QUIZ` e modalidades `text`/`visual` | partially preserved | Modelar tipo e modalidade separadamente; evitar subclasses combinatórias para cada variação. |
| `Videos`, `Question_Videos`, `Yes_No_Videos` | `VIDEO_QUESTION`, `YES_NO` e URLs de vídeo | partially preserved | Separar mídia, formato de resposta e tipo pedagógico. |
| `hasStrength` / `isRelatedToStrength` | Condições imperativas do `OntologyReasonerService` e `targetModalities` | replaced | Refinar relações com domínio e alcance coerentes; não copiar os axiomas atuais sem revisão lógica. |
| `hasWeakness` / `isRelatedToWeakness` | Condições imperativas baseadas em `profile.weaknesses` | replaced | Representar adequação/suporte com explicação e proveniência; evitar causalidade ou recomendação automática não validada. |
| `hasContentConnection` / `isAdaptiveContent` | Síntese de recomendação em `AdeService` | replaced | Modelar explicitamente por que uma atividade é candidata e manter a pontuação/decisão fora da ontologia quando for cálculo operacional. |
| Restrições de `IA_Sandbox_DIY`, `Visual_Puzzles`, quizzes e vídeos | Regras TypeScript em `OntologyService` e `OntologyReasonerService` | partially preserved | Auditar regra a regra; reexpressar apenas relações sustentadas. Não tratar `SubClassOf` como regra bicondicional. |
| `Percentage`, `Mild_Learning_Percentage`, `Moderated_Percentage`, `Strong_Percentage` | `asdSupportLevel`; regras de dificuldade | partially preserved | Renomear e redefinir. Não equiparar “percentual de aprendizagem”, nível de suporte e domínio BKT. |
| `Easy_Content`, `Mid_Content`, `Hard_Content` | `Activity.difficulty` (`easy`, `medium`, `hard`) | preserved | Manter dificuldade como atributo configurável da atividade e decisão, sem vínculo fixo com nível de suporte. |
| `Evaluation_Class`, formulários e `Initial_Evaluation` | Perfil da criança e tentativas de atividade | replaced | Manter fora do núcleo ontológico até haver requisitos atuais e consentimento/proveniência definidos. |
| `Activity_Feedback` / `Learned_Topic` | `ActivityAttempt`, `LearningEvent` e `StudentSkillState` | replaced | Usar observações e estado probabilístico atuais; não inferir “tópico aprendido” de um único evento. |
| Indivíduos de exemplo (`Activity_*`, `Strength_*`, `Weakness_*`) | Não há indivíduos ontológicos equivalentes | obsolete | Manter somente no arquivo histórico; criar fixtures novas apenas se uma futura ontologia exigir exemplos validados. |

Os rótulos de status seguem deliberadamente o vocabulário solicitado; `partially preserved` indica aproximação funcional, não equivalência ontológica.

## Divergências que exigem atenção

[DECISÃO DE ENGENHARIA]

O `OntologyReasonerService` descreve `Question_Videos` como força visual isolada ou força visual com fraqueza motora. O OWL/XML declara, como condição necessária, a união entre (força visual e fraqueza motora) e fraqueza lógica. Portanto, o comentário/regra atual não é uma transcrição fiel do axioma. Como esta tarefa proíbe mudanças de runtime, a divergência fica registrada para refinamento posterior.

[DECISÃO DE ENGENHARIA]

O `OntologyService` acrescenta listas `suitableFor` para níveis de suporte. O arquivo histórico contém conexões individuais entre conteúdos fácil/médio/difícil e usuários de níveis forte/moderado/leve, mas não contém essas listas de adequação por tratamento. Elas são decisões da implementação atual e não devem ser apresentadas como axiomas LASDONT.

[DECISÃO DE ENGENHARIA]

Domínios e alcances de algumas propriedades históricas parecem inverter a leitura sugerida pelos nomes. Por exemplo, `hasStrength` tem domínio `Strengths` e alcance `Treatments_Class`, enquanto as restrições são aplicadas a classes de tratamento. A nova ontologia deve revisar consistência lógica e direção das propriedades, sem copiar automaticamente esses axiomas.

## Conceitos novos no ContaComigo

| Conceito atual | Existência explícita na LASDONT 1.0 | Tratamento recomendado |
| --- | --- | --- |
| Habilidade BNCC e pré-requisito curricular | ausente | Incorporar como dimensão curricular identificável, separada de modalidade e perfil. |
| Domínio probabilístico por estudante–habilidade (`StudentSkillState`) | ausente | Preservar como estado semântico corrente produzido pelo BKT, com observações e data de atualização. |
| Eventos append-only de Learning Analytics | ausente | Preservar como evidência temporal; a ontologia pode referenciar tipos de evento, sem substituir o log. |
| Métricas de Learning Analytics | ausente | Tratar como agregações derivadas e versionadas, não como fatos históricos imutáveis. |
| Dificuldade da atividade | apenas indivíduos genéricos de conteúdo | Refinar como atributo da atividade e como decisão recomendada, distinguindo valor cadastrado e valor sugerido. |
| Pontuação e explicação da recomendação | ausente | Preservar em `AdeDecision`; modelar entradas, saída e proveniência sem converter o algoritmo em hierarquia OWL. |
| Estado semântico do estudante | apenas classes/indivíduos estáticos e formulários | Refinar como visão temporal que referencia perfil, preferências, domínio e evidências, sem fundi-los. |
| Sessão e ciclo de vida da atividade | ausente | Preservar no modelo de eventos para contextualizar observações. |

## Preservar, reimplementar e retirar

[PROPOSTA CONTA COMIGO]

Devem ser preservadas conceitualmente as dimensões de modalidade, características do estudante, tipos de atividade e relações explicáveis entre necessidade e recurso. Elas devem ser refinadas com identidade estável, proveniência, tempo, terminologia não clínica e separação entre dado observado, preferência declarada e inferência do sistema.

[DECISÃO DE ENGENHARIA]

Foram reimplementados independentemente no sistema atual: armazenamento do perfil em JSON, seleção de modalidades, decisão de dificuldade, recomendação híbrida, registro explicável, alinhamento BNCC, domínio BKT e Learning Analytics. A presença de nomes semelhantes não comprova evolução direta nem equivalência formal.

[PROPOSTA CONTA COMIGO]

Não devem ser reutilizados: arquitetura antiga de agentes ou mensagens; credenciais/conexões JDBC do protótipo; indivíduos de demonstração como dados de produção; IRIs residuais `OntoPizza01`; o termo “tratamento” para atividades educacionais; inferências clínicas a partir de sinais de interação; e axiomas de domínio, alcance ou disjunção sem nova validação.

## Conceitos a refinar na nova ontologia

[PROPOSTA CONTA COMIGO]

Uma futura ontologia deverá refinar, antes de qualquer integração de runtime:

- estudante, perfil e estado semântico temporal;
- habilidade BNCC, atividade e pré-requisito curricular;
- tipo, modalidade, mídia, dificuldade e carga/acessibilidade da atividade;
- preferência, necessidade de suporte, barreira e característica observada, com proveniência;
- observação de aprendizagem, tentativa, sessão e tipo de evento;
- domínio probabilístico por habilidade e seu número de observações;
- recomendação, candidato, pontuação, explicação e decisão apresentada;
- relações de adequação entre recursos e necessidades, sem equivalências não demonstradas.

[HIPÓTESE A VALIDAR]

Separar evidência observada, estado probabilístico, perfil declarado e decisão recomendada pode tornar a adaptação mais auditável e reduzir ambiguidades do modelo histórico. Essa hipótese deverá ser avaliada com consultas de competência, testes de consistência e análise de decisões reais.

## Limitações

[DECISÃO DE ENGENHARIA]

- A análise se limita ao arquivo OWL/XML fornecido e ao código atualmente versionado.
- Não foi executado um reasoner OWL nem criada integração de runtime.
- Não há fonte acadêmica verificada no repositório para avaliar validade científica ou histórica da LASDONT.
- Correspondências funcionais não são equivalências ontológicas.
- Campos atuais de forças, fraquezas e nível de suporte carecem de proveniência e temporalidade explícitas.
- As regras atuais podem conter decisões não expressas no artefato histórico; duas divergências concretas foram registradas acima.

[PARÂMETRO EXPERIMENTAL]

Esta análise não introduz parâmetros experimentais. Limiares e pesos já existentes no runtime permanecem fora do escopo e não foram reinterpretados como conteúdo da LASDONT.

## Texto potencial para a dissertação

### Metodologia

A LASDONT 1.0 foi analisada como linha de base histórica mediante inspeção de classes, indivíduos, propriedades, hierarquia, restrições e asserções no artefato OWL/XML. Esses elementos foram comparados aos modelos e serviços atuais de perfil, atividade, recomendação, domínio por habilidade e Learning Analytics. Correspondências foram classificadas sem pressupor identidade semântica ou continuidade arquitetural.

### Decisão de projeto

O artefato histórico foi preservado para rastreabilidade, mas não incorporado ao runtime. O ContaComigo mantém sua arquitetura atual e deverá usar uma futura ontologia apenas após revisão de terminologia, relações, proveniência e coerência lógica.

### Limitações

A comparação não demonstra eficácia das categorias históricas nem valida as regras de recomendação. O artefato possui inconsistências de IRI e relações que exigem revisão, e não há bibliografia verificada disponível no repositório.

### Evidência necessária no experimento

São necessários consultas de competência, testes automáticos de consistência, rastreamento da proveniência de cada característica, auditoria das recomendações e avaliação com dados consentidos. Também é necessária bibliografia verificada para fundamentar as categorias e relações que forem mantidas.
