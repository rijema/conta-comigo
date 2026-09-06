# Batch 02E — Semântica de Atividades e Evidências de Learning Analytics

## 1. Objetivo

[PROPOSTA CONTA COMIGO] Este lote conclui a modelagem ontológica conectando atividade, habilidade BNCC e conceito matemático, além de definir a fronteira pela qual agregações de Learning Analytics poderão produzir evidências semânticas no lote B2.3.

[DECISÃO DE ENGENHARIA] Não foram alterados runtime, banco, seeds, recomendação ou BKT. Os perfis de família são descrições parciais da implementação inspecionada, não dados aprendidos nem validação clínica.

## 2. Papel da camada de atividades

[DECISÃO DE ENGENHARIA] `Activity` é a raiz semântica de atividades concretas e perfis reutilizáveis. `LearningActivity` representa uma atividade educacional materializada; `ActivityFamilyProfile` resume capacidades encontradas em uma família de implementação. `ActivityType`, `Representation`, `InteractionType`, `DifficultyProfile` e `ActivityAffordance` permanecem sob `ActivityCharacteristic`.

A separação permite representar:

`Activity → addressesBNCCSkill → BNCCSkill → addressesMathematicalConcept → MathematicalConcept`

e também um vínculo direto, auditável, `Activity → developsMathematicalConcept`, necessário para detectar quando o conteúdo efetivo diverge do código curricular declarado.

### 2.1 Estado encontrado

- [DECISÃO DE ENGENHARIA] Tipos persistidos: visual puzzle, quiz, video question, yes/no, counting e drag-and-drop.
- [DECISÃO DE ENGENHARIA] Componentes adicionais: Multiple Choice e Number Line, ausentes do enum/backend.
- [DECISÃO DE ENGENHARIA] Quiz e Multiple Choice compartilham o mesmo renderer; Counting com opções também é renderizado como Multiple Choice.
- [DECISÃO DE ENGENHARIA] Visual Puzzle, Video Question e Yes/No não têm renderer dedicado nem seed atual e caem no fallback genérico.
- [LIMITAÇÃO] Não existia mapping atividade → conceito matemático nem metadado multidimensional normalizado.

## 3. Modelo semântico

### 3.1 Classes

| Classe | Função |
|---|---|
| `Activity` | raiz independente de currículo, matemática e learner model |
| `LearningActivity` | atividade concreta a ser materializada pelo runtime |
| `ActivityFamilyProfile` | resumo parcial de uma família implementada |
| `ActivityType` | tipo técnico/educacional da atividade |
| `Representation` | forma pictórica, simbólica, textual ou reta numérica |
| `InteractionType` | seleção, contagem repetida, arrastar/posicionar ou controle de faixa |
| `DifficultyProfile` | dimensões internas, separadas do rótulo legado |
| `ActivityAffordance` | capacidade de interação ou acessibilidade disponível |

### 3.2 Relações

[PROPOSTA CONTA COMIGO] Foram definidas `addressesBNCCSkill`, `hasActivityType`, `hasRepresentation`, `hasInteractionType`, `hasDifficultyProfile` e `hasActivityAffordance`. A relação existente `developsMathematicalConcept` foi generalizada para `Activity`. `addressesBNCCSkill` especializa `addressesCurriculumSkill`.

[DECISÃO DE ENGENHARIA] O perfil de família registra a união de capacidades observadas na implementação atual; ele não autoriza copiar todas essas capacidades para cada atividade concreta. B2.3 deve materializar propriedades por atividade.

## 4. Activity Affordances

[LITERATURA] WCAG 2.2 determina que funcionalidade baseada em arrastar ofereça alternativa por ponteiro simples, salvo exceções ([W3C WCAG 2.2, 2.5.7](https://www.w3.org/TR/wcag/#dragging-movements)).

[DECISÃO DE ENGENHARIA] A ontologia contém affordances para pictogramas, dragging, alternativa por teclado, seleção por ponteiro, apresentação de áudio e requisito de leitura. `requiresDragging`, `requiresReading`, `usesAudio` e `usesPictograms` suportam anotações por atividade.

O componente Drag and Drop atual oferece arraste, toque para selecionar/posicionar e `KeyboardSensor`. Por isso `DraggingAffordance` está presente, mas `requiresDragging=false`: nenhuma atividade deve ser classificada como obrigatoriamente arrastável enquanto a alternativa funcionar.

[LIMITAÇÃO] `requiresReading` depende do conteúdo, da mediação e de eventual narração; não foi atribuído silenciosamente no perfil de família. Audio Presentation e Reading Requirement foram definidos para materialização futura, mas não atribuídos a seeds sem evidência.

## 5. Dificuldade multidimensional

[DECISÃO DE ENGENHARIA] Easy/medium/hard permanece disponível em `legacyDifficultyLabel`. O perfil interno adiciona:

- `conceptualComplexity`;
- `numericalMagnitude`;
- `abstractionLevel`;
- `stepCount`;
- `distractorSimilarity`;
- `languageLoad`;
- `motorDemand`;
- `sensoryLoad`;
- `scaffoldingLevel`.

[PARÂMETRO EXPERIMENTAL] LOW, MEDIUM e combinações usadas nos perfis são anotações de inspeção do desenvolvedor, não limiares científicos. `annotationProvenance=DEVELOPER_INSPECTION` torna essa origem explícita. Magnitude e quantidade de etapas foram marcadas como dimensões não anotadas nos perfis porque dependem de cada conteúdo.

| Família | Motor | Sensorial | Linguagem | Observação |
|---|---|---|---|---|
| Counting | LOW | LOW_IN_CURRENT_SEEDS | LOW_TO_MEDIUM | itens e quantidade variam |
| Multiple Choice | LOW | CONTENT_DEPENDENT | CONTENT_DEPENDENT | componente, não tipo persistido |
| Quiz | LOW | LOW_TO_MEDIUM_IN_CURRENT_SEEDS | MEDIUM | distratores e abstração variam |
| Drag and Drop | MEDIUM_WITH_LOW_MOTOR_ALTERNATIVE | LOW_IN_CURRENT_SEEDS | LOW_TO_MEDIUM | toque/teclado reduzem a exigência de arrastar |
| Number Line | MEDIUM_WITH_KEYBOARD_ALTERNATIVE | UNANNOTATED | LOW | sem seed ou tipo backend |

[PROPOSTA CONTA COMIGO] A dificuldade matemática não deve ser derivada de nível de suporte TEA. Complexidade conceitual e magnitude pertencem ao conteúdo; motor, linguagem e sensorial descrevem exigências de interação.

## 6. Activity → BNCC → MathematicalConcept

### 6.1 Mapeamento das famílias atuais

| Família | Interação | Representação | BNCC declarado no recorte | Conceitos desenvolvidos observados | Status |
|---|---|---|---|---|---|
| Counting | seleção repetida e/ou seleção de opção | pictórica, simbólica | EF01MA01, EF01MA06 | Number, Counting, Addition | PARTIAL |
| Multiple Choice | seleção de opção | textual, pictórica, simbólica | dependente do conteúdo; não persistido como tipo | dependente do conteúdo | INCOMPLETE |
| Quiz | seleção de opção | textual, pictórica, simbólica | EF01MA03, EF01MA06, EF01MA07 | Comparison, Addition, Subtraction, Basic Geometry | NEEDS_REVIEW |
| Drag and Drop | arraste ou posicionamento alternativo | pictórica, simbólica | EF01MA01, EF01MA03, EF01MA06 | Number, Comparison, Addition, Sequence/Pattern | NEEDS_REVIEW |
| Number Line | seleção em range | reta numérica, simbólica | nenhum seed atual | Number, Comparison | INCOMPLETE |
| Visual Puzzle | desconhecida | não anotada | nenhum seed atual | não anotado | INCOMPLETE |
| Video Question | desconhecida | não anotada | nenhum seed atual | não anotado | INCOMPLETE |
| Yes/No | fallback Multiple Choice | não inferida do nome | nenhum seed atual | não anotado | INCOMPLETE |

[DECISÃO DE ENGENHARIA] Os três últimos são valores reais do enum, não novas famílias. Nenhuma propriedade de vídeo, áudio ou visual foi deduzida apenas do nome.

### 6.2 Inconsistências preservadas

- Quiz desenvolve Subtraction em duas atividades que declaram EF01MA07, embora EF01MA07 mapeie oficialmente para Number/Addition.
- Quiz desenvolve Basic Geometry em atividades que declaram EF01MA15, código ainda ausente da população ontológica.
- Drag and Drop inclui sequência numérica por EF02MA01, fora do recorte BNCC atual.
- Multiple Choice recebe Quiz e Counting no renderer, mas não existe como valor persistido.
- Number Line existe como componente sem enum, seed ou mapping curricular.

[LIMITAÇÃO] Os perfis tornam a inconsistência consultável; não corrigem ou legitimam os códigos atuais.

## 7. Ponte com Learning Analytics

[PROPOSTA CONTA COMIGO] O fluxo futuro é:

`LearningEvent(s) → Analytics Aggregation → InteractionEvidence → ObservedLearnerCharacteristic`.

Foram especializadas evidências semânticas:

| Evidência semântica | Eventos que podem contribuir | Interpretação permitida |
|---|---|---|
| `ActivityPerformanceEvidence` | ANSWER_SUBMITTED, ACTIVITY_COMPLETED | desempenho agregado e contextual |
| `AssistanceUsageEvidence` | HINT_REQUESTED, TUTORIAL_OPENED, INSTRUCTION_REPLAYED | uso agregado de assistência |
| `ActivityLifecycleEvidence` | PRESENTED, STARTED, COMPLETED, SKIPPED | transições agregadas do ciclo |
| `ResponseTimingEvidence` | ANSWER_SUBMITTED | tempo contextual agregado |
| `ActivitySkipHistoryEvidence` | ACTIVITY_SKIPPED | histórico observacional de skips |
| `RecommendationHistoryEvidence` | RECOMMENDATION_GENERATED/PRESENTED/COMPLETED | histórico de exposição/conclusão |

[DECISÃO DE ENGENHARIA] `analyticsSourceEventType` registra apenas proveniência potencial. Não é regra que transforma um único evento em característica do aprendiz. Skip não significa desengajamento/rejeição; tempo não significa dificuldade; dica não significa incapacidade.

## 8. Banco vs ontologia

| Permanece no banco/Analytics | Pode ser materializado semanticamente |
|---|---|
| `LearningEvent` bruto e imutável | `InteractionEvidence` agregado |
| `ActivityAttempt` | `ActivityPerformanceEvidence` contextual |
| resposta correta, tempo, tentativa | `LearningEvidence` com janela/proveniência |
| hints, tutorial, replay | `AssistanceUsageEvidence` |
| skip e conclusão | `ActivityLifecycleEvidence` / `ActivitySkipHistoryEvidence` |
| `StudentSkillState` e probabilidade BKT | referência `LearnerSkillState`, sem recalcular mastery |
| UUIDs e sessões operacionais | indivíduos dinâmicos versionados em B2.3 |

[LITERATURA] O uso de rastros digitais educacionais exige cuidado com validade, integridade, privacidade e governança, especialmente para crianças ([Hakimi, Eynon e Murphy](https://doi.org/10.3102/00346543211020116)).

## 9. Contrato de materialização

[DECISÃO DE ENGENHARIA] B2.3 deverá materializar dinamicamente, sem inserir crianças ou sessões reais no OWL estático:

1. `LearningActivity_{activityId}` como `LearningActivity`;
2. tipo, representação, interação, affordances e perfil de dificuldade derivados de metadados explícitos da atividade;
3. `addressesBNCCSkill` somente para códigos resolvidos/validados;
4. `developsMathematicalConcept` a partir de mapping curricular verificado ou anotação direta revisada;
5. evidência com learner, atividade, tipo, modalidade, skill, sessão e `EvidenceWindow`;
6. característica observada versionada ligada por `derivedFromEvidence` e `hasEvidenceAssessment`;
7. `InsufficientEvidence` quando a política configurável não sustentar uma interpretação.

Exemplo conceitual, não instância estática:

```text
Activity_{id} addressesBNCCSkill BNCC_EF01MA08
Activity_{id} developsMathematicalConcept AdditionConcept
Activity_{id} hasInteractionType DragAndDropInteraction

Learner_{id} hasObservedCharacteristic ObservedVisualStrength_{version}
ObservedVisualStrength_{version} derivedFromEvidence VisualInteractionEvidence_{aggregate}
VisualInteractionEvidence_{aggregate} wasGeneratedBySession LearningSession_{id}
```

[LIMITAÇÃO] Estratégia de armazenamento RDF, expiração, atualização/versionamento e consulta ainda pertence ao desenho de B2.3.

## 10. Preparação para recommender híbrido

[PROPOSTA CONTA COMIGO] A ontologia passa a fornecer o contrato sem calcular escores:

- `learningNeed` ← BKT / `StudentSkillState`;
- `challengeFit` ← mastery + perfil multidimensional da atividade;
- `interactionFit` ← evidência do aprendiz + affordances/demandas da atividade;
- `semanticFit` ← BNCC + conceitos + restrições didáticas validadas;
- `novelty` ← histórico de atividades;
- `rejectionRisk` ← histórico contextual de apresentação, skip e rejeição, sem equiparar skip a rejeição.

[DECISÃO DE ENGENHARIA] Nenhuma fórmula, peso, threshold ou ranking foi implementado.

## 11. Generalização

[PROPOSTA CONTA COMIGO] O modelo separa família de implementação e atividade concreta. Assim, novos conteúdos podem reutilizar `Representation`, `InteractionType` e `ActivityAffordance` sem criar uma classe ontológica por jogo.

[DECISÃO DE ENGENHARIA] Este é o último sublote de modelagem ontológica planejado. Novas classes maiores só devem ser introduzidas quando um problema concreto de materialização/runtime demonstrar necessidade.

[LIMITAÇÃO] Perfis agregados não substituem anotação por atividade. Um Quiz pode ser simbólico ou pictórico, ter baixa ou alta carga linguística e desenvolver conceitos diferentes.

## 12. Competency Questions

| CQ | Resposta atual |
|---|---|
| CQ-ACT-1 — famílias que abordam EF01MA06 | Counting, Quiz e Drag and Drop. |
| CQ-ACT-2 — famílias que desenvolvem Addition | Counting, Quiz e Drag and Drop. |
| CQ-ACT-3 — mesmo conceito com interações diferentes | Addition ocorre por seleção repetida/opção e por drag/posicionamento alternativo. |
| CQ-ACT-4 — menor demanda motora | Counting, Multiple Choice e Quiz têm anotação LOW; valores são de engenharia. |
| CQ-ACT-5 — representação pictórica | Counting, Multiple Choice, Quiz e Drag and Drop. |
| CQ-ACT-6 — requer dragging | Nenhuma família: Drag and Drop oferece alternativas de toque/teclado e registra `requiresDragging=false`. |
| CQ-ACT-7 — mappings incompletos | Multiple Choice, Number Line, Visual Puzzle, Video Question e Yes/No são INCOMPLETE; Quiz/Drag and Drop precisam revisão; Counting é parcial. |
| CQ-LA-1 — características deriváveis de InteractionEvidence | `ObservedStrength`, `ObservedPreference` e `SupportNeed`; suficiência é avaliada separadamente. |
| CQ-LA-2 — fatos brutos fora da ontologia | eventos, tentativas, respostas, tempo, dicas, skips, conclusão e mastery BKT. |
| CQ-LA-3 — fatos para B2.3 | atividades/affordances concretas, evidências agregadas, janelas, proveniência, avaliações de suficiência e características versionadas. |

[DECISÃO DE ENGENHARIA] Os testes consultam perfis e relações do RDF/XML e verificam que exemplos operacionais do contrato não foram inseridos como indivíduos reais.

## 13. Decisões de engenharia

- [DECISÃO DE ENGENHARIA] Manter `LearningActivity` e adicionar `Activity` como raiz, evitando misturá-la com habilidade ou conceito.
- [DECISÃO DE ENGENHARIA] Modelar implementações existentes, inclusive placeholders do enum, sem criar novos jogos.
- [DECISÃO DE ENGENHARIA] Usar strings controladas nos perfis parciais e números apenas quando atividade concreta fornecer magnitude/etapas.
- [DECISÃO DE ENGENHARIA] Não atribuir áudio, leitura ou representação a famílias sem evidência no código/seed.
- [DECISÃO DE ENGENHARIA] Preservar easy/medium/hard como compatibilidade, sem confundi-lo com o perfil interno.
- [DECISÃO DE ENGENHARIA] Manter todos os dados de criança/sessão fora do OWL estático.

## 14. Hipóteses

- [HIPÓTESE A VALIDAR] Dificuldade multidimensional melhora `challengeFit` em relação ao rótulo único.
- [HIPÓTESE A VALIDAR] Affordances explícitas reduzem recomendações incompatíveis com necessidades motoras/sensoriais.
- [HIPÓTESE A VALIDAR] Comparar mapping direto da atividade com a cadeia BNCC → conceito detecta erros curriculares úteis.
- [HIPÓTESE A VALIDAR] Evidências agregadas e temporais produzem adaptações mais explicáveis sem cristalizar perfil do aprendiz.

[PARÂMETRO EXPERIMENTAL] Escalas, políticas de agregação, janelas, suficiência, expiração e eventual peso no recommender ainda precisam de configuração e validação.

## 15. Limitações

- [LIMITAÇÃO] Perfis de família são parciais e baseados em inspeção do código e dos seeds.
- [LIMITAÇÃO] Não houve avaliação profissional das dimensões de dificuldade.
- [LIMITAÇÃO] Mappings curriculares suspeitos continuam no runtime.
- [LIMITAÇÃO] Nenhuma atividade concreta foi materializada no OWL estático.
- [LIMITAÇÃO] Visual Puzzle, Video Question e Yes/No carecem de implementação dedicada e metadados verificáveis.
- [LIMITAÇÃO] Multiple Choice e Number Line não têm correspondência completa no enum/backend.
- [LIMITAÇÃO] O modelo não prova eficácia educacional, adequação clínica ou causalidade.

## 16. Relação com dissertação

[PROPOSTA CONTA COMIGO] A contribuição desta etapa é uma cadeia semântica auditável entre intervenção, currículo e conhecimento matemático, acompanhada de uma fronteira explícita entre rastros operacionais e interpretações do learner model. A modelagem permite explicar qual conteúdo, interação e evidência sustentaram uma futura adaptação.

## 17. Referências

- Brasil. Ministério da Educação. *Base Nacional Comum Curricular*. [Documento oficial](https://basenacionalcomum.mec.gov.br/images/BNCC_EI_EF_110518_versaofinal_site.pdf).
- Hakimi, L.; Eynon, R.; Murphy, V. A. *The Ethics of Using Digital Trace Data in Education: A Thematic Review of the Research Landscape*. [DOI](https://doi.org/10.3102/00346543211020116).
- OntoMathEdu. [Repositório consultado](https://github.com/CLLKazan/OntoMathEdu).
- W3C. *PROV-O: The PROV Ontology*. [https://www.w3.org/TR/prov-o/](https://www.w3.org/TR/prov-o/).
- W3C. *Web Content Accessibility Guidelines 2.2*. [https://www.w3.org/TR/wcag/](https://www.w3.org/TR/wcag/).

## Texto potencial para a dissertação

### Metodologia

Foram inspecionados modelo de atividade, DTO, seeds, renderers, eventos analíticos, tentativas e metadados de decisão. As famílias foram descritas por tipo, representação, interação, affordances, dificuldade parcial, habilidades declaradas e conceitos observados. O contrato de evidência preserva eventos no banco e restringe a ontologia a estados semânticos derivados e rastreáveis.

### Decisão de projeto

A atividade foi mantida separada de habilidade curricular, conceito matemático e característica do aprendiz. Perfis de família registram capacidades observadas, enquanto B2.3 deverá materializar valores específicos por atividade e evidência. Easy/medium/hard permanece apenas por compatibilidade.

### Limitações

As anotações são de engenharia, incompletas e não clinicamente validadas. Não foram corrigidos mappings suspeitos, criadas regras automáticas ou calculados escores. Evidências semânticas ainda não existem como dados runtime.

### Evidência necessária no experimento

Será necessário validar anotações com especialistas, concordância entre avaliadores, capacidade das dimensões de explicar dificuldade, acessibilidade das interações, precisão dos mappings atividade–conceito e utilidade das evidências materializadas para recomendação, preservando privacidade e possibilidade de revisão.
