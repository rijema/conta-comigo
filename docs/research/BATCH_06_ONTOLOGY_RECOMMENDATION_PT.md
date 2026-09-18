# Integração semântica e rastreabilidade da recomendação

[LITERATURA] Este lote reutiliza a separação de conhecimento adotada nos documentos de fundação do projeto. A OntoMathEdu orientou a modelagem local de conceitos matemáticos e relações didáticas; a LASDONT permanece como fonte histórica de regras procedurais de modalidade. Nenhuma nova relação científica ou equivalência entre ontologias foi afirmada.

[DECISÃO DE ENGENHARIA] O `OntologyService` continua filtrando atividades antes do `HybridRecommendationService`. Habilidades BNCC presentes no OWL são associadas a conceitos matemáticos. Quando duas habilidades compartilham um conceito formal, o serviço oferece uma relação operacional `relatedSkill` com origem `SHARED_CONCEPT_DERIVED`; isso não é uma asserção OWL nem prova de sequência curricular. `prerequisiteSkill` é oferecida somente quando existir uma instância formal de `PrerequisiteRelation` ligando os conceitos pertinentes. O OWL atual não contém tais instâncias.

[DECISÃO DE ENGENHARIA] `complementarySkill` e `contrastSkill` são categorias aceitas no contrato de relações, mas não são materializadas sem asserções ou critérios curriculares validados. A seleção não supõe que uma habilidade seja complementar ou contrastante apenas porque compartilha um conceito. O campo existente `prerequisiteSkillCode` da atividade é verificado contra domínio BKT quando há uma observação para a habilidade prévia; ausência de domínio observado permanece informação insuficiente e não equivale a domínio comprovado.

[PROPOSTA CONTA COMIGO] A decisão alterna entre consolidar, reforçar, revisar, desafiar e explorar. Resposta correta lenta produz reforço na mesma habilidade com cooldown da questão e da estrutura. Erros recorrentes podem levar à revisão de um pré-requisito quando a relação estiver afirmada. Três sucessos recentes independentes e domínio alto permitem explorar uma habilidade relacionada por conceito ainda não apresentada na janela recente. Sem habilidade relacionada elegível, a decisão mantém a habilidade e o desafio vigente. Uma habilidade explicitamente solicitada pela troca de atividade não é substituída pela exploração.

[PARÂMETRO EXPERIMENTAL] O tempo considerado lento é `ADE_SLOW_RESPONSE_SECONDS` (padrão 120 segundos); o limiar de exploração é `ADE_EXPLORE_MASTERY_THRESHOLD` (0,8); o limiar para um pré-requisito conhecido é `ONTOLOGY_PREREQUISITE_MASTERY_THRESHOLD` (0,5). Esses valores são configuráveis, iniciais e não constituem evidência de domínio clínico ou pedagógico.

[PARÂMETRO EXPERIMENTAL] A janela estratégica (`ADE_STRATEGY_RECENT_WINDOW`, padrão 5), o mínimo de erros para reforço (`ADE_REINFORCE_MIN_ERRORS`, 2), o mínimo de skips recentes (`ADE_REINFORCE_MIN_SKIPS`, 2) e o mínimo de êxitos independentes para exploração (`ADE_EXPLORE_MIN_INDEPENDENT_SUCCESSES`, 3) também são configuráveis. A janela de frustração do ranking e as penalidades de repetição de formato e representação têm parâmetros próprios no exemplo de ambiente.

[DECISÃO DE ENGENHARIA] A fórmula híbrida existente foi estendida e versionada como `contacomigo-hybrid-ranking/2.0.0`:

`score = wL·learningNeed + wC·challengeFit + wI·interactionFit + wS·semanticFit + wN·novelty + wSens·sensoryFit + wFmt·formatFit - wRej·rejectionRisk - wRep·repetitionRisk - wFr·frustrationRisk`

[DECISÃO DE ENGENHARIA] `semanticFit` preserva o alinhamento BNCC/conceito e o peso explícito da habilidade alvo. `challengeFit` preserva o ajuste entre BKT e dificuldade, combinando o nível declarado e o perfil da questão com `HYBRID_DIFFICULTY_LEVEL_WEIGHT` (padrão 0,5). `sensoryFit` considera `lowStimulation` declarado e carga sensorial anotada; `formatFit` usa `preferredModality` declarado. `repetitionRisk` usa estrutura, formato e representação recentes, além do cooldown preexistente. `frustrationRisk` considera erros e tempo de resposta recente da habilidade alvo em relação à dificuldade do candidato. Ausência de preferência explícita recebe valor neutro.

[DECISÃO DE ENGENHARIA] A decisão persistida registra estratégia, relação e origem, habilidade alvo, BNCCs e dificuldade dos candidatos, score final, contribuições, penalidades, evidências, alternativas e versões da ontologia e do ranking. O explicador de pesquisa expõe os fatores adicionais. Após persistir a seleção final, o fluxo existente de eventos ADE publica `ADE_SELECTION_FINALIZED` com habilidade, dificuldade, atividade, estratégia e score; o evento anterior `ADE_DECISION_MADE` continua disponível como etapa inicial. `LearningEvent`, `RecommendationOutcome` e `AdaptationTransition` continuam sendo usados para eventos e resultados; não foi criado um armazenamento paralelo nem houve migração de banco porque os campos de trilha são JSON existentes.

[HIPÓTESE A VALIDAR] Alternar reforço e exploração com apoio de conceitos formais pode reduzir repetição e preservar cobertura curricular. Pesos, limiares, adequação dos vínculos de conceito e efeito sobre aprendizagem precisam de avaliação experimental e revisão especializada.

## Texto potencial para a dissertação

### Metodologia

[PROPOSTA CONTA COMIGO] Analisar decisões registradas por estratégia, habilidade, score e evidências, comparando tempo de resposta, acurácia, skips, repetição de estrutura e domínio BKT ao longo das sessões.

### Decisão de projeto

[DECISÃO DE ENGENHARIA] A ontologia restringe a elegibilidade e identifica vínculos de conceito com proveniência; a função híbrida ordena candidatos válidos com parâmetros versionados.

### Limitações

[HIPÓTESE A VALIDAR] Não há instâncias formais atuais de pré-requisitos, complementaridade ou contraste entre habilidades. Conceito compartilhado não implica automaticamente uma progressão pedagógica. Limiares e pesos ainda não foram calibrados com dados experimentais.

### Evidência necessária no experimento

[PARÂMETRO EXPERIMENTAL] Registrar distribuição das estratégias, justificativas de fallback, tempos observados, alternativas, acurácia posterior e resultados por habilidade para avaliar a calibração de limiares e pesos.
