# Batch 03.2 — Novas famílias parametrizáveis de atividades matemáticas

## 1. Objetivo

[PROPOSTA CONTA COMIGO] Este lote amplia a diversidade cognitiva e de interação disponível ao recomendador com seis famílias reutilizáveis: Composition Decomposition, Missing Number, Pattern Completion, Representation Matching, Error Detection e Contextual Problem Solving.

[DECISÃO DE ENGENHARIA] As famílias compartilham um único renderer parametrizável e um validador configurável. Perguntas, opções, justificativas, representações, scaffolds e respostas corretas são dados do conteúdo; não foi criado um componente específico para cada exercício.

## 2. Diagnóstico de cobertura utilizado

[DECISÃO DE ENGENHARIA] A matriz do Batch 02D foi usada como baseline anterior às novas instâncias:

| Habilidade | Cobertura anterior | Prioridade aplicada |
|---|---|---|
| EF01MA08 | `NOT_COVERED` | primeira: problema contextual de adição |
| EF01MA14 | `NOT_COVERED` | primeira: correspondência entre figura e nome |
| EF01MA01 | `PARTIALLY_COVERED` | nenhuma nova instância neste lote |
| EF01MA06 | `PARTIALLY_COVERED` | número ausente e detecção de erro, com interações distintas dos quizzes existentes |
| EF01MA03 | `NEEDS_REVIEW` | nenhuma nova instância enquanto o mapping de conjuntos/numerais não for revisto |
| EF01MA07 | `NEEDS_REVIEW` | composição/decomposição coerente com a descrição oficial; atividades legadas incorretas foram preservadas |

[DECISÃO DE ENGENHARIA] Após o lote, EF01MA08 e EF01MA14 possuem uma instância cada e passam a `PARTIALLY_COVERED`; EF01MA06 passa de quatro para seis claims; EF01MA07 passa de dois para três, mas permanece `NEEDS_REVIEW` porque as duas atividades antigas continuam sendo subtrações indevidamente classificadas.

## 3. Famílias implementadas

| Família | Interação parametrizada | Uso inicial | Estado de instância |
|---|---|---|---|
| `composition_decomposition` | `composition_building` | formar 7 como 4 + ? | EF01MA07 |
| `missing_number` | `missing_value_entry` | completar 5 + ? = 8 por entrada numérica | EF01MA06 |
| `pattern_completion` | `pattern_completion` | sequências de valores/objetos configuráveis | sem seed curricular |
| `representation_matching` | `representation_matching` | relacionar quadrado à sua denominação | EF01MA14 |
| `error_detection` | `error_evaluation` | avaliar afirmação da TitiA e justificar | EF01MA06 |
| `contextual_problem_solving` | `contextual_response` | situação de juntar maçãs | EF01MA08 |

[DECISÃO DE ENGENHARIA] Todas as famílias aceitam `bnccSkills`, `semantic.mathematicalConcepts`, `semantic.representation`, `semantic.interactionType`, `semantic.difficultyProfile`, `scaffolding`, `validation` e identificadores conceituais de pictogramas.

[LIMITAÇÃO] O repositório informa apenas que EF01MA10 é candidata para `SequencePatternConcept`; sua descrição oficial não está disponível na documentação carregada e o mapping requer revisão. Portanto, Pattern Completion foi implementada e testada como família, mas não recebeu uma instância BNCC de produção inventada.

## 4. Contrato parametrizável

[DECISÃO DE ENGENHARIA] O conteúdo de uma atividade pode declarar:

- pergunta e instruções;
- opções simples ou uma segunda etapa de justificativa;
- resposta correta;
- estratégia de validação;
- conceitos matemáticos e status do mapping;
- uma ou mais representações;
- interação;
- nove dimensões de dificuldade;
- scaffolds como dicas, exemplo resolvido e manipuláveis permitidos;
- identificadores conceituais de pictogramas.

As estratégias de validação são `exact`, `numeric`, `boolean`, `sequence`, `set` e `compound`. A validação continua no backend; o frontend não determina o resultado persistido.

[DECISÃO DE ENGENHARIA] As regras legadas foram mantidas. Drag and Drop continua comparando sequência, strings continuam insensíveis a caixa/espaços nas extremidades e números continuam aceitando representação numérica equivalente.

## 5. Error Detection e raciocínio

[PROPOSTA CONTA COMIGO] A instância inicial apresenta: “TitiA pensa que 3 + 2 = 6. Ela está certa?”. A criança seleciona o veredito e uma justificativa. A resposta só é correta quando ambos correspondem ao fato matemático configurado.

[DECISÃO DE ENGENHARIA] O validador `compound` compara o objeto `{ value, reason }` de forma determinística e independente da ordem das chaves. A justificativa é uma opção estruturada; não é coletado texto livre da criança.

[HIPÓTESE A VALIDAR] Exigir veredito e justificativa pode produzir evidência mais informativa de avaliação de raciocínio do que reconhecer isoladamente o resultado correto. Esta hipótese ainda precisa de validação pedagógica e experimental.

## 6. Generalização entre representações

[PROPOSTA CONTA COMIGO] O mesmo conceito pode aparecer como `pictorial`, `symbolic`, `contextual` e `object_based`. No recorte inicial, Addition aparece:

- simbolicamente em Missing Number;
- pictórica e baseada em objetos em Composition Decomposition;
- contextual e simbólica em Error Detection;
- contextual, pictórica e baseada em objetos em Contextual Problem Solving.

[DECISÃO DE ENGENHARIA] Representação é uma lista explícita por instância e não é deduzida do nível de suporte de TEA. Nenhum `GeneralizationScore` foi implementado.

[HIPÓTESE A VALIDAR] Alternar representações para o mesmo conceito pode apoiar avaliação futura de transferência/generalização. O efeito não é assumido neste lote.

## 7. Dificuldade e scaffolding

[DECISÃO DE ENGENHARIA] Cada seed novo fornece as nove propriedades do `ActivityDifficultyProfile`. Valores sem evidência suficiente permanecem `null`; magnitude, quantidade de etapas, demanda motora, carga sensorial e disponibilidade de scaffolding são anotadas a partir do conteúdo e da interação implementada.

[PARÂMETRO EXPERIMENTAL] Os rótulos `LOW` e `OPTIONAL` são anotações de engenharia, não thresholds científicos. Pesos, normalização e influência no ranking continuam indefinidos e deverão ser configuráveis.

[DECISÃO DE ENGENHARIA] O renderer mostra dicas progressivamente. Cada solicitação chama `requestHint`, que produz somente `HINT_REQUESTED`; abrir o tutorial continua sendo uma ação separada. Exemplos resolvidos e manipuláveis são capacidades declarativas para evolução futura; não são mostrados automaticamente quando não há implementação correspondente.

## 8. Pictogramas e preparação para ARASAAC

[DECISÃO DE ENGENHARIA] Exercícios armazenam identificadores estáveis como `shape.square`, `object.apple` e `math.addition`, nunca caminhos de assets. O registro central `pictograms.ts` resolve o identificador para rótulo e símbolo atual e reserva `arasaacId=null` para integração futura.

[LIMITAÇÃO] Nenhum catálogo ARASAAC foi baixado, nenhum ID foi inventado e os símbolos temporários não são declarados equivalentes a pictogramas ARASAAC. A adequação semântica e cultural dos símbolos precisa ser revisada.

## 9. Learning Analytics

[DECISÃO DE ENGENHARIA] As seis famílias usam o mesmo `onAnswer → submitAnswer → /activities/attempts` das atividades existentes. O backend calcula correção, preserva `ActivityAttempt` e emite `ANSWER_SUBMITTED` e `ACTIVITY_COMPLETED`. Apresentação e início permanecem rastreados pelo lifecycle de sessão; dicas internas reutilizam `HINT_REQUESTED`.

[DECISÃO DE ENGENHARIA] Resposta composta e justificativa não são copiadas para metadata de Learning Analytics. Os eventos continuam contendo somente correção, tentativa, tempo, atividade, skill e dicas previstos no modelo append-only.

## 10. Migration e seed incremental

[DECISÃO DE ENGENHARIA] A migration `1700000003000-AddParametricActivityFamilies` amplia os valores permitidos de `activities.type` tanto para schema baseado em `VARCHAR/CHECK` quanto para instalações antigas baseadas em enum PostgreSQL. O rollback recusa prosseguir quando existem atividades usando os novos tipos e não tenta remover labels de enum de forma destrutiva.

[DECISÃO DE ENGENHARIA] O seed deixou de abortar quando encontra qualquer atividade. Ele passa a inserir somente títulos ainda ausentes, permitindo que instalações existentes recebam as cinco instâncias novas sem duplicar o catálogo atual.

[LIMITAÇÃO] Título é a identidade incremental disponível no schema atual e não substitui um futuro identificador estável de conteúdo. Execuções concorrentes do seed não possuem garantia de unicidade por título no banco.

## 11. Cobertura após o lote

| Habilidade | Novas famílias | Quantidade total declarada | Estado atual |
|---|---|---:|---|
| EF01MA01 | — | 3 | `PARTIALLY_COVERED` |
| EF01MA03 | — | 4 | `NEEDS_REVIEW` |
| EF01MA06 | Missing Number; Error Detection | 6 | `PARTIALLY_COVERED` |
| EF01MA07 | Composition Decomposition | 3 | `NEEDS_REVIEW` |
| EF01MA08 | Contextual Problem Solving | 1 | `PARTIALLY_COVERED` |
| EF01MA14 | Representation Matching | 1 | `PARTIALLY_COVERED` |

[LIMITAÇÃO] Uma instância reduz ausência de formato, mas não demonstra cobertura integral da habilidade. EF01MA08 ainda não cobre subtração, elaboração de problemas ou todos os significados previstos. EF01MA14 cobre apenas quadrado no novo mapping direto.

## 12. Testes

[DECISÃO DE ENGENHARIA] Foram adicionados testes para:

- seis estratégias/famílias de validação e regressão das regras antigas;
- contrato semântico completo nas seis famílias;
- veredito e justificativa de Error Detection;
- emissão dos eventos analíticos para cada família sem copiar resposta bruta;
- migration em schema `VARCHAR/CHECK`, enum e rollback protegido;
- roteamento das seis famílias ao renderer comum;
- scaffolding e ligação de dicas ao tracking;
- identificadores centralizados de pictogramas;
- ausência intencional de seed Pattern Completion sem BNCC verificada;
- atualização do snapshot de cobertura ontológica.

## 13. Limitações

- [LIMITAÇÃO] Pattern Completion não possui instância curricular até EF01MA10 ser verificada.
- [LIMITAÇÃO] Há somente uma instância para EF01MA08 e EF01MA14; ambas continuam parcialmente cobertas.
- [LIMITAÇÃO] As instâncias antigas EF01MA03, EF01MA07 e EF01MA15 não foram silenciosamente corrigidas.
- [LIMITAÇÃO] Scaffolds não foram avaliados por especialista.
- [LIMITAÇÃO] Não existe Generalization Score.
- [LIMITAÇÃO] O recomendador recebe alternativas novas, mas sua fórmula/ranking não foi alterada.
- [LIMITAÇÃO] Não foi feita integração com o catálogo ARASAAC.

## 14. Referências

[LITERATURA] Este lote não adiciona nova citação. As descrições curriculares e mappings utilizados já estavam registrados em `BATCH_02_BNCC_CURRICULUM_PT.md` e `contacomigo.owl`. Nenhum conceito curricular externo foi criado sem fonte disponível no repositório.

- Documentação interna: `BATCH_02_BNCC_CURRICULUM_PT.md`.
- Documentação interna: `BATCH_02_ACTIVITY_LA_SEMANTICS_PT.md`.
- Documentação interna: `BATCH_03_ACTIVITY_FRAMEWORK_PT.md`.
- Artefato interno: `ontology/contacomigo/contacomigo.owl`.

## Texto potencial para a dissertação

### Metodologia

A expansão foi guiada pela matriz de cobertura curricular anterior. Foram priorizadas habilidades sem atividade, seguidas de habilidades parcialmente cobertas e conceitos limitados a poucos formatos. As famílias foram implementadas por configuração de conteúdo, contrato semântico e estratégia de validação compartilhada, com testes de regressão e rastreabilidade analítica.

### Decisão de projeto

Seis tipos reutilizáveis substituem a alternativa de criar componentes específicos por exercício. A representação matemática, a interação, o perfil de dificuldade, o scaffolding e os pictogramas são metadados explícitos. A detecção de erro exige uma decisão e uma justificativa estruturada, enquanto o backend permanece responsável pela correção.

### Limitações

A cobertura nova ainda é pequena, a família de padrões não possui mapping curricular verificado e os scaffolds não foram validados profissionalmente. Símbolos locais apenas preparam a integração futura de pictogramas e não representam o catálogo ARASAAC.

### Evidência necessária no experimento

Será necessário avaliar validade das anotações, compreensão das instruções e pictogramas, adequação das justificativas, diferenças de desempenho entre representações, uso de scaffolding e efeito das novas alternativas na recomendação, sem inferir capacidade ou perfil a partir de diagnóstico.
