# Batch 02C — Modelo Neuroinclusivo do Aprendiz

## 1. Objetivo

[PROPOSTA CONTA COMIGO] Este lote estende a ontologia do ContaComigo com um modelo de aprendiz contextual, longitudinal e baseado em evidências. O modelo representa evidências de interação, forças e preferências observadas, necessidades de suporte, suficiência da evidência, janelas temporais e proveniência. Ele não transforma diagnóstico de TEA em características individuais e não classifica uma criança por um evento isolado.

[DECISÃO DE ENGENHARIA] A alteração é exclusivamente semântica e documental. Não muda entidades do banco, serviços de recomendação, telas, fórmulas, nem o artefato histórico `LASDONT-v1.owx`.

## 2. Relação com a OntoMathEdu

[LITERATURA] A OntoMathEdu organiza conhecimento matemático e relações educacionais/didáticas. A análise do artefato distribuído e dos artigos associados, registrada no lote B2.2B, não encontrou nela um modelo individual e longitudinal de características do aprendiz adequado a este objetivo ([repositório OntoMathEdu](https://github.com/CLLKazan/OntoMathEdu), [artigo de apresentação](https://ceur-ws.org/Vol-2634/WiP1.pdf)).

[DECISÃO DE ENGENHARIA] A OntoMathEdu continua fundamentando a camada matemática. `MathematicalConcept` e relações didáticas permanecem separados de `LearnerCharacteristic`, `ActivityCharacteristic` e `LearningAnalyticsEvidence`. Esta extensão não declara `owl:imports` nem `owl:equivalentClass` com OntoMathEdu.

## 3. Origem histórica na LASDONT

[LITERATURA] A LASDONT é tratada aqui como fonte histórica interna, não como evidência científica contemporânea. Seu artefato descreve pares de força/fraqueza nas dimensões visual, auditiva, lógica, motora e sensorial, além de tratamentos/atividades associados.

[DECISÃO DE ENGENHARIA] Preservou-se a pergunta útil — como diferenças individuais podem orientar a interação — e abandonou-se a representação binária e permanente. As classes LASDONT não foram importadas nem recriadas no namespace ativo. A rastreabilidade usa anotações `historicalSourceOntology`, `historicalSourceConcept` e `historicalMappingType`.

### 3.1 Situação encontrada antes da alteração

[DECISÃO DE ENGENHARIA] A inspeção do repositório encontrou:

- os cinco pares históricos reproduzidos como booleanos JSON `strengths` e `weaknesses` em `ChildProfile`, além de `preferredModality`, `asdSupportLevel` e preferências de interface;
- classes históricas de Strength/Weakness e Treatment somente no OWL LASDONT; o runtime atual não carrega esse arquivo;
- conceitos atuais inexistentes na LASDONT, entre eles competências BNCC, `StudentSkillState`/BKT, `LearningEvent`, métricas determinísticas, dificuldade de atividade, sessões, pontuação explicável do ADE e estado semântico do estudante;
- nenhum campo literalmente chamado “learning style”, embora os booleanos permanentes e `preferredModality` possam produzir comportamento semanticamente semelhante a estilo fixo;
- forças, fraquezas, nível de suporte e preferências editáveis manualmente no fluxo do educador; métricas derivadas de eventos; mastery atualizado por BKT; e valores de fallback visual/TEA definidos no código;
- consumo efetivo de `strengths`, `weaknesses`, `asdSupportLevel`, tentativas e mastery pelo ADE/reasoner; `targetModalities` e acessibilidade pertencem às atividades;
- conflito entre os booleanos sem tempo, origem ou confiança e o modelo proposto; ausência de marcação não se distingue de evidência insuficiente; sinais como tempo, dicas e skip podem chegar a heurísticas compostas; e defaults visuais associados ao TEA não constituem evidência individual.

[LIMITAÇÃO] Esses campos legados permanecem intactos para compatibilidade. Esta ontologia ainda não os converte nem altera sua influência no runtime.

## 4. Problema com estilos de aprendizagem fixos

[LITERATURA] A revisão de Pashler et al. não encontrou base adequada para justificar a prática de combinar instrução com “estilos de aprendizagem” fixos ([DOI](https://doi.org/10.1111/j.1539-6053.2009.01038.x)). As diretrizes UDL enfatizam variabilidade do aprendiz e múltiplos meios de envolvimento, representação e ação/expressão, em vez de tipos permanentes ([CAST UDL 3.0](https://udlguidelines.cast.org/)).

[PROPOSTA CONTA COMIGO] “Preferência visual observada” significa preferência contextual registrada em uma janela de evidência. Ela não significa “aprendiz visual”, nem garante melhor aprendizagem. Força observada, preferência e necessidade de suporte são categorias diferentes e revisáveis.

[LIMITAÇÃO] Preferências declaradas ou observadas podem ser úteis para conforto e acesso, mas sua relação causal com aprendizagem no ContaComigo ainda não foi demonstrada.

## 5. Fundamentação teórica

### 5.1 Evidência de interação visual e auditiva

[LITERATURA] UDL sustenta oferecer múltiplas formas de representação e de acesso à informação. Isso apoia descrever características do formato, não rotular o aprendiz ([CAST UDL 3.0](https://udlguidelines.cast.org/)). A revisão de estilos de aprendizagem não sustenta inferir benefício pedagógico pela simples correspondência entre uma preferência e uma modalidade ([Pashler et al.](https://doi.org/10.1111/j.1539-6053.2009.01038.x)).

[PROPOSTA CONTA COMIGO] `VisualInteractionEvidence` e `AuditoryInteractionEvidence` contextualizam observações. `ObservedVisualStrength`/`ObservedAuditoryStrength` exigem resultados comparativos acumulados; `ObservedVisualPreference`/`ObservedAuditoryPreference` representam escolha ou aceitação, sem alegar ganho de aprendizagem.

### 5.2 Necessidades de suporte sensorial

[LITERATURA] A literatura relata heterogeneidade pronunciada de características sensoriais no espectro autista e recomenda abordagens dimensionais e longitudinais, o que impede deduzir uma característica individual apenas do diagnóstico ([registro PubMed PMID 28266796](https://pubmed.ncbi.nlm.nih.gov/28266796/)).

[PROPOSTA CONTA COMIGO] `SensoryInteractionEvidence`, `SensorySupportNeed` e `SensoryLoadTolerance` descrevem interação com a experiência digital. Não diagnosticam condição de processamento sensorial.

### 5.3 Necessidades motoras de interação e acessibilidade

[LITERATURA] Uma revisão sistemática registra variabilidade e dificuldades motoras em parte das crianças autistas, mas esse resultado populacional não autoriza inferência individual pelo diagnóstico ([registro PubMed PMID 36949273](https://pubmed.ncbi.nlm.nih.gov/36949273/)). WCAG 2.2 exige alternativa a movimentos de arrastar quando essa ação é essencial, mostrando que demanda motora é também uma propriedade da interface ([WCAG 2.2, critério 2.5.7](https://www.w3.org/TR/wcag/#dragging-movements)).

[PROPOSTA CONTA COMIGO] `MotorInteractionEvidence`, `MotorSupportNeed`, `MotorInteractionPreference` e `MotorDemandCompatibility` permitem registrar que uma criança pode compreender a matemática e, ainda assim, precisar de alternativa ao drag-and-drop.

### 5.4 Evidência de raciocínio matemático/lógico

[DECISÃO DE ENGENHARIA] `LogicalReasoningEvidence` é vinculável a competências e atividades de padrões, ordenação, comparação, resolução de problemas, composição/decomposição, generalização e raciocínio. `MathematicalDifficultyEvidence` é separado de `InteractionDifficultyEvidence`.

[HIPÓTESE A VALIDAR] Uma janela de desempenho em tarefas adequadamente desenhadas pode sustentar `ObservedLogicalReasoningStrength` ou `ReasoningSupportNeed`. A validade do construto, das tarefas e das regras de derivação deve ser demonstrada experimentalmente; diagnóstico de TEA nunca é entrada suficiente.

### 5.5 Forças e necessidades como características individuais/contextuais

[LITERATURA] Abordagens de neurodiversidade questionam modelos exclusivamente deficitários e pedem atenção ao contexto e às perspectivas das pessoas autistas ([Pellicano e den Houting](https://doi.org/10.1111/jcpp.13534)). Um modelo baseado em forças para autismo descreve perfis heterogêneos e explicita a necessidade de validação futura ([Cherewick e Matergia](https://doi.org/10.1007/s41252-023-00348-z)).

[PROPOSTA CONTA COMIGO] Uma característica é uma interpretação revisável de evidências situadas, com período de validade. “Sem evidência de força” não equivale a “fraqueza” ou “necessidade de suporte”.

### 5.6 Learning Analytics como fonte de evidência dinâmica

[LITERATURA] A revisão ética de rastros digitais educacionais identifica riscos de validade, integridade, privacidade e governança, com lacunas particulares para crianças ([Hakimi, Eynon e Murphy](https://doi.org/10.3102/00346543211020116)).

[PROPOSTA CONTA COMIGO] O encadeamento conceitual é:

`LearningEvent(s) → agregação analítica → InteractionEvidence → ObservedLearnerCharacteristic`.

[DECISÃO DE ENGENHARIA] Eventos brutos continuam no banco de Learning Analytics. OWL contém somente vocabulário e estado semântico derivado quando necessário. Skip, tempo de resposta e uso de dicas são sinais observacionais: isoladamente não significam desengajamento, incapacidade, dificuldade clínica ou necessidade de suporte.

## 6. Modelo ontológico proposto

### 6.1 Classes e origem

Todas as classes do modelo do aprendiz introduzidas ou retidas nesta versão têm `conceptOrigin`:

| Origem | Classes |
|---|---|
| aligned ontology concept | `InteractionEvidence`, `Observation`, `LearningSession` (alinhadas de forma mais estreita a `prov:Entity`/`prov:Activity`) |
| literature-grounded ContaComigo concept | `LearnerCharacteristic`, `ObservedLearnerCharacteristic`, `ObservedStrength`, `ObservedPreference`, `SupportNeed`, `VisualInteractionEvidence`, `ObservedVisualStrength`, `ObservedVisualPreference`, `AuditoryInteractionEvidence`, `ObservedAuditoryStrength`, `ObservedAuditoryPreference`, `MotorInteractionEvidence`, `MotorSupportNeed`, `MotorInteractionPreference`, `SensoryInteractionEvidence`, `SensorySupportNeed` |
| engineering concept | `Learner`, `LearningEvidence`, `EvidenceWindow`, `ActivityCharacteristic`, `ActivityType`, `Modality`, `LogicalReasoningEvidence`, `MathematicalDifficultyEvidence`, `InteractionDifficultyEvidence`, `LearnerSkillState`, `LearningEventEvidence` |
| experimental construct | `EvidenceSufficiencyAssessment`, `InsufficientEvidence`, `InteractionCompatibilityAssessment`, `MotorDemandCompatibility`, `SensoryLoadTolerance`, `ObservedLogicalReasoningStrength`, `ReasoningSupportNeed` |

[DECISÃO DE ENGENHARIA] Nenhuma classe ativa tem origem “historical LASDONT concept”: a origem histórica aparece apenas nas anotações das reinterpretações. Também não se declara conceito externo como diretamente reutilizado; PROV-O é referenciado em superclasses/subpropriedades e classificado como alinhamento conservador.

### 6.2 Hierarquias separadas

- `LearnerCharacteristic` pertence a `LearnerKnowledge`.
- `ActivityCharacteristic`, `ActivityType` e `Modality` pertencem a `ActivityKnowledge`.
- `InteractionEvidence`, `LearningEvidence`, `Observation` e `LearningEventEvidence` pertencem a `LearningAnalyticsEvidence`.
- `MathematicalConcept` permanece em `MathematicalKnowledge` e `CurriculumSkill` em `CurricularKnowledge`.
- `InsufficientEvidence` é resultado de `EvidenceSufficiencyAssessment`, não subtipo de fraqueza ou de necessidade.

### 6.3 Relações e propriedades

[PROPOSTA CONTA COMIGO] As relações centrais são `hasObservedCharacteristic`, `hasInteractionEvidence`, `derivedFromEvidence`, `wasGeneratedBySession`, `concernsLearner`, `concernsActivity`, `concernsActivityType`, `concernsModality`, `concernsSkill`, `observedDuring`, `hasEvidenceWindow`, `supportsCharacteristic`, `contradictsCharacteristic` e `hasEvidenceAssessment`.

[DECISÃO DE ENGENHARIA] `observationCount`, `evidenceConfidence`, `observedAt`, `validFrom`, `validUntil` e `evidenceReason` descrevem evidência e validade. O OWL não define corte numérico, fórmula, indivíduo de sessão ou evento real.

## 7. Mapeamento LASDONT → ContaComigo

| Conceito histórico | Novo conceito | Tipo de mapeamento | Razão da mudança | Fonte científica | Uso no runtime deste lote |
|---|---|---|---|---|---|
| `Visual_Strength` | `ObservedVisualStrength` / `ObservedVisualPreference` | adapted from | Separa desempenho de preferência e exige contexto temporal | CAST UDL; Cherewick e Matergia; Pashler et al. | Nenhum |
| `Visual_Weakness` | `VisualInteractionEvidence` + eventual `SupportNeed` ou `InsufficientEvidence` | deprecated historical concept | Um rótulo binário não distingue barreira, falta de teste e resultado contextual | CAST UDL; Pashler et al. | Legado preservado, sem nova inferência |
| `Auditive_Strength` | `ObservedAuditoryStrength` / `ObservedAuditoryPreference` | adapted from | Separa resultado observado de preferência auditiva | CAST UDL; Pashler et al. | Nenhum |
| `Auditive_Weakness` | `AuditoryInteractionEvidence` + eventual `SupportNeed` ou `InsufficientEvidence` | deprecated historical concept | Não há justificativa para fraqueza permanente por ausência/baixa amostra | Pashler et al.; Hakimi et al. | Legado preservado, sem nova inferência |
| `Motor_Strength` | `MotorInteractionPreference` | adapted from | A interação motora não é estilo de aprendizagem | WCAG 2.2 | Nenhum |
| `Motor_Weakness` | `MotorSupportNeed` | adapted from | Reformula déficit como necessidade contextual de acesso | WCAG 2.2; revisão motor/TEA | Nenhum |
| `Sensory_Strength` | `SensoryLoadTolerance` | narrower than | Limita o significado à experiência digital observada | revisão de heterogeneidade sensorial | Nenhum |
| `Sensory_Weakness` | `SensorySupportNeed` | adapted from | Evita diagnóstico e representa suporte observável | revisão de heterogeneidade sensorial; CAST UDL | Nenhum |
| `Logical_Strength` | `ObservedLogicalReasoningStrength` | narrower than | Exige evidência em tarefas matemáticas identificadas | OntoMathEdu para domínio; validação ContaComigo pendente | Nenhum |
| `Logical_Weakness` | `ReasoningSupportNeed` | adapted from | Substitui déficit essencial por necessidade contextual | proposta a validar em tarefas matemáticas | Nenhum |
| `Treatments_Class` e subclasses | `LearningActivity` + características/relações didáticas | related to / no longer used | “Tratamento” não descreve adequadamente seleção pedagógica do runtime atual | arquitetura atual; OntoMathEdu | Nenhum |

[DECISÃO DE ENGENHARIA] Os nomes históricos são literais de proveniência, pois o artefato usa IRIs legados inconsistentes. Nenhum mapeamento é `owl:equivalentClass`.

## 8. Modelo de evidência

[PROPOSTA CONTA COMIGO] `InteractionEvidence` representa interpretação semântica derivada de registros ou agregações. `Observation` registra uma observação contextual, inclusive uma avaliação humana com fonte explicitada. `EvidenceWindow` limita período e contexto. `observationCount` descreve quantidade; `evidenceConfidence`, quando calculada, registra confiança; `InsufficientEvidence` registra falta, antiguidade, escassez, contexto não testado ou conflito.

[PARÂMETRO EXPERIMENTAL] Tamanho mínimo da amostra, duração/recência da janela, tratamento de evidências contraditórias e cortes de confiança pertencem à camada de Analytics/raciocínio, devem ser configuráveis e não estão definidos neste OWL.

[HIPÓTESE A VALIDAR] Múltiplas observações em modalidades e tipos de atividade comparáveis podem gerar uma característica útil para adaptação. É necessário validar confiabilidade, sensibilidade à janela, confundidores de conteúdo/dificuldade e estabilidade ao longo do tempo.

## 9. Separação entre mastery e learner characteristics

[DECISÃO DE ENGENHARIA] `LearnerSkillState` referencia semanticamente o estado matemático cuja fonte de verdade continua sendo `StudentSkillState`, atualizado exclusivamente pelo BKT. Uma probabilidade de mastery para EF01MA08 não é força visual, preferência, necessidade motora ou evidência de raciocínio geral.

[LIMITAÇÃO] A ontologia pode futuramente consumir uma categoria/estado de mastery para consulta semântica, mas não calcula, replica ou corrige a equação BKT.

## 10. Proveniência

[LITERATURA] PROV-O oferece `prov:Entity`, `prov:Activity`, `prov:wasDerivedFrom` e `prov:wasGeneratedBy` para representar derivação e geração ([W3C PROV-O](https://www.w3.org/TR/prov-o/)).

[DECISÃO DE ENGENHARIA] Não há `owl:imports` de PROV-O. `InteractionEvidence` e `Observation` são subclasses locais de `prov:Entity`; `LearningSession`, de `prov:Activity`. `derivedFromEvidence` e `wasGeneratedBySession` são subpropriedades locais das relações PROV correspondentes e guardam `sourceOntology`, `sourceIRI` e `alignmentRelation=narrower`.

[PROPOSTA CONTA COMIGO] Uma explicação poderá percorrer característica → `derivedFromEvidence` → evidência → `wasGeneratedBySession`/eventos persistidos, acrescentando atividade, tipo, modalidade, competência e janela.

## 11. Competency Questions

| CQ | Pergunta | Resultado nesta versão |
|---|---|---|
| CQ1 | Quais características observadas têm evidência suficiente atualmente? | Modelável por `hasEvidenceAssessment`; requer instâncias e política externa para responder com dados. |
| CQ2 | Quais características têm evidência insuficiente? | Modelável por `InsufficientEvidence`; sem indivíduos estáticos no OWL. |
| CQ3 | De quais evidências derivou uma `ObservedVisualStrength`? | Respondível estruturalmente via `derivedFromEvidence`. |
| CQ4 | Há evidência atual de `MotorSupportNeed`? | Requer instância, janela válida e evidência de suporte; diagnóstico não responde. |
| CQ5 | Quais formatos tiveram alta conclusão e alto uso de suporte? | Métricas são calculadas fora de OWL e podem gerar `InteractionEvidence` ligada a `ActivityType`/`Modality`. “Alto” continua configurável. |
| CQ6 | Quais características ocorreram somente em uma janela? | Respondível por `hasEvidenceWindow`, `observedDuring`, `validFrom` e `validUntil`. |
| CQ7 | Quais conceitos LASDONT correspondem aos atuais? | Respondível pelas três anotações históricas e pela tabela da seção 7. |
| CQ8 | Quais características influenciam interaction fit, mas não mastery? | Preferências observadas e necessidades/compatibilidades motora e sensorial; BKT permanece separado. |
| CQ9 | Quais características de raciocínio vêm de Analytics e não do diagnóstico? | `ObservedLogicalReasoningStrength` e `ReasoningSupportNeed` devem derivar de `LogicalReasoningEvidence`. |
| CQ10 | Por que uma característica está como evidência insuficiente? | `hasEvidenceAssessment` + `evidenceReason` explicam escassez, ausência, antiguidade, contexto não testado ou conflito. |

[LIMITAÇÃO] Os testes deste lote demonstram a capacidade estrutural do vocabulário, não respostas com crianças/sessões reais, deliberadamente ausentes da ontologia estática.

## 12. Decisões de engenharia

- [DECISÃO DE ENGENHARIA] Estender o mesmo arquivo OntoMathEdu-grounded, mantendo as cinco camadas já existentes.
- [DECISÃO DE ENGENHARIA] Usar IRIs estáveis `https://contacomigo.org/ontology#...`, identificadores/comentários em inglês e rótulos em português quando úteis.
- [DECISÃO DE ENGENHARIA] Não importar LASDONT nem PROV-O e não alegar equivalência forte.
- [DECISÃO DE ENGENHARIA] Representar estado semântico derivado, não copiar cada métrica/evento para OWL.
- [DECISÃO DE ENGENHARIA] Não criar indivíduos operacionais, axiomas de diagnóstico, restrições numéricas ou regras automáticas.
- [DECISÃO DE ENGENHARIA] Manter os campos legados e a recomendação atual inalterados até uma migração explícita e testada.
- [DECISÃO DE ENGENHARIA] Não coletar câmera, face, olhar, biometria ou gravação de áudio/vídeo.

## 13. Hipóteses a validar

- [HIPÓTESE A VALIDAR] Evidência contextual agregada identifica preferências/forças suficientemente estáveis para melhorar a interação sem cristalizar rótulos.
- [HIPÓTESE A VALIDAR] Separar dificuldade matemática de dificuldade de interação reduz recomendações inadequadas.
- [HIPÓTESE A VALIDAR] Necessidades motoras e sensoriais derivadas com explicação melhoram acesso, conclusão e conforto.
- [HIPÓTESE A VALIDAR] Evidência insuficiente usada como estado explícito reduz inferências prematuras.
- [HIPÓTESE A VALIDAR] `interactionFit` acrescentará valor aos componentes existentes de recomendação sem degradar aprendizagem ou diversidade de atividades.

[PARÂMETRO EXPERIMENTAL] Janelas, amostra mínima, confiança, critérios de comparação, validade e expiração ainda precisam de protocolo, configuração e análise de sensibilidade.

## 14. Limitações

- [LIMITAÇÃO] O experimento previsto terá amostra clínica pequena; tamanho e poder estatístico ainda precisam ser documentados no protocolo, portanto os achados serão exploratórios.
- [LIMITAÇÃO] Características inferidas são interpretações educacionais/contextuais, não diagnósticos psicológicos ou clínicos.
- [LIMITAÇÃO] Nenhum limiar foi clinicamente validado; o OWL deliberadamente não contém cortes.
- [LIMITAÇÃO] Eventos podem refletir conteúdo, dificuldade, interface, contexto, assistência externa ou falhas técnicas, e não uma característica isolada.
- [LIMITAÇÃO] Não se coletam dados biométricos, vídeo, rosto, olhar, emoção ou gravações ambientais; isso limita algumas observações e reduz riscos de vigilância.
- [LIMITAÇÃO] Avaliações profissionais/de responsáveis ainda não têm esquema operacional de identidade, consentimento e validade no runtime.
- [LIMITAÇÃO] O modelo é vocabulário estrutural; não há materialização de instâncias nem motor de regras neste lote.
- [LIMITAÇÃO] Privacidade infantil requer minimização, finalidade, acesso restrito, retenção e auditoria antes de persistir novos derivados.

## 15. Relação com a recomendação adaptativa

[PROPOSTA CONTA COMIGO] Uma etapa futura poderá transformar evidência recente de modalidade, compatibilidade motora, compatibilidade sensorial e status de insuficiência em features explicáveis de `interactionFit`.

[DECISÃO DE ENGENHARIA] Este lote não implementa a fórmula. `interactionFit` será complementar e não substituirá `learningNeed`, `challengeFit`, `semanticFit`, `novelty` ou `rejectionRisk`. Evidência insuficiente deve preservar exploração segura, não produzir penalidade automática.

[HIPÓTESE A VALIDAR] O uso dessas features melhora adequação de interação sem limitar indevidamente exposição, currículo ou desafio matemático.

## 16. Relação com a dissertação

[PROPOSTA CONTA COMIGO] A contribuição científica é uma evolução rastreável de um modelo histórico binário para um modelo neuroinclusivo, temporal, explicável e separado do domínio matemático e do mastery BKT. A ontologia explicita quais conceitos vêm da literatura, quais são decisões de software e quais permanecem construtos experimentais.

[LIMITAÇÃO] A contribuição atual é de modelagem. Evidência de validade, utilidade adaptativa e impacto educacional depende do estudo empírico posterior.

## 17. Referências

- CAST. *Universal Design for Learning Guidelines 3.0*. [https://udlguidelines.cast.org/](https://udlguidelines.cast.org/).
- Cherewick, M.; Matergia, M. *Neurodiversity in Practice: a Conceptual Model of Autistic Strengths and Potential Mechanisms of Change to Support Positive Mental Health and Wellbeing in Autistic Children and Adolescents*. [https://doi.org/10.1007/s41252-023-00348-z](https://doi.org/10.1007/s41252-023-00348-z).
- Hakimi, L.; Eynon, R.; Murphy, V. A. *The Ethics of Using Digital Trace Data in Education: A Thematic Review of the Research Landscape*. [https://doi.org/10.3102/00346543211020116](https://doi.org/10.3102/00346543211020116).
- OntoMathEdu. Repositório e artigo consultados: [GitHub](https://github.com/CLLKazan/OntoMathEdu) e [CEUR-WS](https://ceur-ws.org/Vol-2634/WiP1.pdf).
- Pashler, H. et al. *Learning Styles: Concepts and Evidence*. [https://doi.org/10.1111/j.1539-6053.2009.01038.x](https://doi.org/10.1111/j.1539-6053.2009.01038.x).
- Pellicano, E.; den Houting, J. *Annual Research Review: Shifting from ‘normal science’ to neurodiversity in autism science*. [https://doi.org/10.1111/jcpp.13534](https://doi.org/10.1111/jcpp.13534).
- PubMed PMID 28266796. *Heterogeneity of sensory features in autism spectrum disorder: Challenges and perspectives for future research*. [https://pubmed.ncbi.nlm.nih.gov/28266796/](https://pubmed.ncbi.nlm.nih.gov/28266796/).
- PubMed PMID 36949273. Revisão sistemática sobre habilidades motoras em crianças autistas. [https://pubmed.ncbi.nlm.nih.gov/36949273/](https://pubmed.ncbi.nlm.nih.gov/36949273/).
- W3C. *PROV-O: The PROV Ontology*. [https://www.w3.org/TR/prov-o/](https://www.w3.org/TR/prov-o/).
- W3C. *Web Content Accessibility Guidelines (WCAG) 2.2*. [https://www.w3.org/TR/wcag/](https://www.w3.org/TR/wcag/).

## Texto potencial para a dissertação

### Metodologia

Foi realizada análise comparativa entre o artefato histórico LASDONT, o modelo corrente do ContaComigo, a fundação OntoMathEdu e literatura sobre estilos de aprendizagem, neurodiversidade, forças, variabilidade sensorial, interação motora, UDL, acessibilidade, proveniência e ética de rastros digitais. Os conceitos históricos foram mantidos somente quando puderam ser reinterpretados com escopo contextual e proveniência explícita.

### Decisão de projeto

O modelo separa conhecimento matemático, currículo, características do aprendiz, características da atividade e evidência analítica. Força, preferência, necessidade de suporte e insuficiência de evidência são categorias distintas. Mastery continua sob responsabilidade exclusiva do BKT, enquanto o OWL descreve os vínculos semânticos e a origem das evidências.

### Limitações

O modelo ainda não possui regras validadas para derivação, limiares clínicos, instâncias operacionais ou avaliação de impacto. A amostra prevista é pequena e os construtos são exploratórios. Nenhum resultado deve ser interpretado como diagnóstico, traço essencial ou causalidade.

### Evidência necessária no experimento

Será necessário avaliar validade dos construtos, confiabilidade temporal, efeito da janela e dos confundidores, desempenho por modalidade/tipo/dificuldade/competência, ocorrência de falsos rótulos, utilidade das explicações, impacto de `interactionFit`, equidade entre perfis e percepção de crianças, responsáveis e profissionais, com governança de dados e consentimento apropriados.
