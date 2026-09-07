# Batch 03.1 — Consolidação do framework adaptativo de atividades

## 1. Objetivo

[PROPOSTA CONTA COMIGO] Este lote estabelece um contrato runtime comum para as famílias Counting, Multiple Choice, Quiz, Drag and Drop e Number Line. A experiência visual, a resolução das respostas e o rótulo legado `easy`/`medium`/`hard` foram preservados.

[DECISÃO DE ENGENHARIA] O contrato é calculado na leitura a partir dos campos persistidos e das anotações de família já registradas em `contacomigo.owl`. Não foi criada coluna nem tabela: os campos semânticos são transitórios e, por isso, não há migration neste lote.

## 2. Implementações inspecionadas

[DECISÃO DE ENGENHARIA] Foram inspecionados `Activity`, `CreateActivityDto`, `ActivitiesService`, os seeds, os dois renderers de atividade, os componentes Counting, Multiple Choice, Drag and Drop e Number Line, o fluxo de recomendação, tentativas, Learning Events e a camada de atividade da ontologia.

Foram encontrados os seguintes conflitos:

- o enum do backend persiste `counting`, `quiz` e `drag_drop`, mas não `multiple_choice` nem `number_line`;
- o frontend renderiza `multiple_choice` e `number_line`, e Counting com opções usa o componente Multiple Choice;
- `targetModalities`, `accessibility` e o conteúdo possuem sinais parcialmente sobrepostos;
- o vínculo atividade–conceito matemático não estava exposto no retorno runtime;
- as dimensões de dificuldade não existiam no contrato da API.

[LIMITAÇÃO] Visual Puzzle, Video Question e Yes/No continuam fora do recorte de consolidação solicitado. Nenhuma nova família foi criada.

## 3. Contrato comum

Cada atividade retornada pelo serviço passa a expor:

| Campo | Representação runtime | Origem |
|---|---|---|
| `activityType` | tipo normalizado entre as cinco famílias ou `unmapped` | renderer/tipo persistido |
| `bnccSkillId` | UUID da primeira habilidade declarada, quando resolvida | tabela `bncc_skills` |
| `mathematicalConcepts` | lista de identificadores semânticos | mappings documentados no Batch 02D |
| `representation` | lista de representações efetivamente detectadas entre as capacidades da família | conteúdo + perfil ontológico |
| `interactionType` | lista de interações suportadas | implementação atual + perfil ontológico |
| `difficultyProfile` | nove dimensões e proveniência | conteúdo explícito + inspeção de engenharia |
| `affordances` | quatro capacidades/requisitos | conteúdo e comportamento atual |
| `communication` | rótulo, pictograma, texto pronunciável e alternativas não textuais | conteúdo atual |
| `semanticAnnotation` | origem e status do mapping conceitual | documentação existente |

[DECISÃO DE ENGENHARIA] A pluralidade em `representation` e `interactionType` é necessária porque uma atividade pode combinar, por exemplo, representação pictórica e simbólica, e Drag and Drop permite arrastar ou usar posicionamento alternativo.

## 4. Perfil multidimensional de dificuldade

O objeto `ActivityDifficultyProfile` contém exatamente as dimensões:

- `conceptualComplexity`;
- `numericalMagnitude`;
- `abstractionLevel`;
- `stepCount`;
- `distractorSimilarity`;
- `languageLoad`;
- `motorDemand`;
- `sensoryLoad`;
- `scaffoldingLevel`.

[DECISÃO DE ENGENHARIA] `numericalMagnitude` é o maior valor numérico absoluto encontrado apenas em campos matemáticos conhecidos, como instrução, pergunta, resposta, limites, alvo, itens primitivos e texto/valor de opções. IDs e URLs são excluídos. `stepCount` só recebe valor quando o conteúdo declara `stepCount`. `sensoryLoad` reutiliza apenas `accessibility.sensoryLoad`. As demais dimensões reutilizam os perfis de família de B2.2E e permanecem `CONTENT_DEPENDENT`, `UNANNOTATED` ou `null` quando a atividade concreta não fornece evidência suficiente.

[DECISÃO DE ENGENHARIA] `annotationProvenance` e `unannotatedDimensions` tornam visível a diferença entre inspeção de engenharia e dado concreto. Não se atribui precisão científica a uma classificação de família.

[DECISÃO DE ENGENHARIA] O campo persistido `difficulty` continua sendo a fonte do rótulo visual `easy`/`medium`/`hard`. Ele não é convertido automaticamente no perfil multidimensional.

[PARÂMETRO EXPERIMENTAL] Não foram introduzidos pesos, thresholds, faixas de magnitude ou conversões entre as dimensões e o rótulo legado. Qualquer normalização futura deverá ser configurável e validada.

## 5. Famílias consolidadas

| Família | Tipo normalizado | Representações possíveis inspecionadas | Interações atuais |
|---|---|---|---|
| Counting | `counting` | pictórica, simbólica | seleção repetida, seleção de opção |
| Multiple Choice | `multiple_choice` | textual, pictórica, simbólica | seleção de opção |
| Quiz | `quiz` | textual, pictórica, simbólica | seleção de opção |
| Drag and Drop | `drag_drop` | pictórica, simbólica | arrastar/soltar, posicionamento alternativo |
| Number Line | `number_line` | linha numérica, simbólica | seleção em intervalo |

[DECISÃO DE ENGENHARIA] Uma atividade persistida como Counting continua com `activityType=counting`. Quando possui `content.options`, sua interação concreta é `option_selection`; sem opções, é `repeated_selection`. Assim, família e mecanismo do renderer não são confundidos.

[LIMITAÇÃO] Multiple Choice e Number Line ainda não pertencem ao enum persistido do backend. Esta consolidação torna o contrato compatível com o frontend, mas não cria seeds nem migra tipos.

## 6. Affordances

O objeto `ActivityAffordance` expõe:

- `requiresDragging`;
- `requiresReading`;
- `usesAudio`;
- `usesPictograms`.

[DECISÃO DE ENGENHARIA] `requiresDragging=false` nas famílias atuais porque o componente Drag and Drop inspecionado também oferece posicionamento por toque/teclado. `usesAudio` só é verdadeiro diante de `hasAudio=true` ou `audioUrl`. `usesPictograms` depende da presença concreta de pictograma/emoji. `requiresReading` é conservador: fica verdadeiro quando existe rótulo textual sem áudio, pois a mera presença de um pictograma em outro trecho não prova que ele substitui a instrução.

[LIMITAÇÃO] Esses booleanos descrevem capacidades e requisitos observáveis do software. Não medem adequação a uma criança, não representam diagnóstico e não devem ser derivados do nível de suporte de TEA.

## 7. BNCC e conceitos matemáticos

[DECISÃO DE ENGENHARIA] `bnccSkillId` resolve o primeiro código já declarado pela atividade. `mathematicalConcepts` reutiliza somente os mappings BNCC → conceito documentados no Batch 02D. O contrato também retorna `MAPPED`, `PARTIAL`, `NEEDS_REVIEW` ou `UNMAPPED`.

[LIMITAÇÃO] O mapping expressa a intenção curricular do código declarado; não prova que o conteúdo concreto está corretamente classificado. EF01MA03 e EF01MA07 permanecem `NEEDS_REVIEW`, e códigos fora do recorte ficam com lista vazia em vez de receber conceitos inventados.

## 8. Comunicação com a criança

[PROPOSTA CONTA COMIGO] O contrato `communication` fornece:

1. `textLabel`, rótulo textual da ação/instrução;
2. `pictogram`, somente quando detectado e semanticamente disponível no conteúdo;
3. `spokenExplanationText`, texto pronunciável para uma futura voz opcional;
4. `nonReaderAlternatives`, lista observável entre áudio, pictograma e representação simbólica.

[DECISÃO DE ENGENHARIA] Este lote não ativa síntese de voz nem integra ARASAAC. O texto pronunciável prepara o contrato sem afirmar que áudio está presente. Uma lista vazia explicita a lacuna de acessibilidade, em vez de inventar um pictograma ou declarar suporte inexistente.

[HIPÓTESE A VALIDAR] Rótulos combinados a pistas pictóricas, áudio opcional e alternativas operáveis podem tornar as ações mais compreensíveis para crianças não leitoras. A efetividade e a adequação dos símbolos exigem avaliação com profissionais e usuários.

## 9. Relação com o recomendador

[PROPOSTA CONTA COMIGO] O recomendador poderá consumir o contrato uniforme para comparar conceito, representação, interação, dificuldade e affordances. Este lote apenas disponibiliza metadados; ranking, filtragem e comportamento adaptativo não foram modificados.

[DECISÃO DE ENGENHARIA] Nenhuma dimensão usa `asdSupportLevel`, e nenhum threshold de mastery foi criado. O BKT continua responsável por mastery.

## 10. Testes

[DECISÃO DE ENGENHARIA] Os testes unitários cobrem as cinco famílias, as nove dimensões, as quatro affordances, distinção entre família Counting e sua interação por opções, conceitos conhecidos, códigos não mapeados, lacunas não anotadas, pistas de comunicação e preservação de `difficulty=easy` no retorno do serviço.

[LITERATURA] Este lote não adiciona alegação científica nem nova referência externa. A base verificável é o código e a documentação científica já existentes no repositório; os valores adicionados são explicitamente classificados como decisões de engenharia ou hipóteses.

## 11. Limitações

- [LIMITAÇÃO] Os perfis de família não substituem anotação específica e revisada de cada atividade.
- [LIMITAÇÃO] `numericalMagnitude` é uma extração sintática, não uma medida validada de dificuldade.
- [LIMITAÇÃO] A presença de emoji não garante equivalência semântica nem compreensão.
- [LIMITAÇÃO] O texto para futura fala não significa que síntese de voz esteja habilitada.
- [LIMITAÇÃO] Há códigos BNCC suspeitos e famílias somente frontend ainda não materializadas no backend.
- [LIMITAÇÃO] Nenhuma inferência sobre perfil, habilidade ou diagnóstico da criança é produzida.

## 12. Referências

- Documentação interna: `BATCH_02_BNCC_CURRICULUM_PT.md`.
- Documentação interna: `BATCH_02_ACTIVITY_LA_SEMANTICS_PT.md`.
- Artefato interno: `ontology/contacomigo/contacomigo.owl`.

## Texto potencial para a dissertação

### Metodologia

Foram inspecionados os modelos persistidos, seeds, renderers, componentes de interação, recomendação e a camada semântica de atividades. Um construtor determinístico passou a combinar conteúdo explícito com perfis de família previamente documentados, preservando valores desconhecidos e a proveniência da anotação.

### Decisão de projeto

O rótulo legado de dificuldade foi preservado para compatibilidade, enquanto um perfil multidimensional transitório foi exposto à recomendação. As cinco famílias compartilham um contrato de tipo, currículo, conceito matemático, representação, interação, dificuldade, affordance e comunicação, sem alteração do comportamento adaptativo.

### Limitações

As anotações são parciais e baseadas em inspeção de engenharia. Mappings curriculares suspeitos, ausência de áudio real, famílias não persistidas e alternativas incompletas para não leitores permanecem explícitos.

### Evidência necessária no experimento

Será necessário validar as anotações com especialistas, medir concordância entre avaliadores, avaliar a compreensão infantil das pistas de comunicação e testar se as dimensões melhoram recomendações sem discriminar por diagnóstico ou nível de suporte.
