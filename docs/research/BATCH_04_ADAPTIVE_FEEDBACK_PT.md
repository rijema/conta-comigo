# Batch 04.4 — Ciclo de feedback adaptativo

## 1. “Quero outro” e resposta incorreta

[PROPOSTA CONTA COMIGO] “Quero outro” é uma solicitação explícita de mudança de atividade. Ela não equivale a erro matemático, desengajamento, incapacidade, dificuldade motora, sensorial ou frustração.

## 2. Dificuldade matemática e dificuldade de interação

[DECISÃO DE ENGENHARIA] O domínio matemático permanece em `StudentSkillState`/BKT. Formato, representação, demanda motora, carga sensorial, linguagem e scaffolding descrevem a interação contextual e são comparados separadamente.

## 3. Fluxo adaptativo

[PROPOSTA CONTA COMIGO] A ação registra `ACTIVITY_SKIPPED`, atualiza o outcome, cria evidência e transição, executa novamente filtro semântico e ranking híbrido, liga a substituição e registra sua apresentação sem encerrar a sessão.

## 4. Preservação do objetivo pedagógico

[DECISÃO DE ENGENHARIA] O código BNCC atual é passado como alvo preferido e a atividade rejeitada é excluída. A validade final continua dependente do filtro semântico e dos fallbacks explícitos; não se fabrica equivalência de conceitos.

## 5. InteractionEvidence contextual

[LITERATURA] Nenhuma nova referência verificável foi adicionada neste batch. [PROPOSTA CONTA COMIGO] O evento preserva contexto e não cria automaticamente preferência, força, fraqueza ou necessidade de suporte permanente. Skip não modifica BKT.

## 6. Comparação rejeitada → substituta

[DECISÃO DE ENGENHARIA] `AdaptationTransition` registra decisões, atividades, evento disparador, manutenção de habilidade/conceito e diferenças de interação, representação, demandas, scaffolding e dificuldade. Um delta negativo indica menor nível na escala ordinal de engenharia quando ambos os valores são reconhecidos.

## 7. Avaliação profissional pós-sessão

[PROPOSTA CONTA COMIGO] A área profissional lista adaptações após a sessão e aceita avaliação opcional `ADEQUATE`, `PARTIALLY_ADEQUATE` ou `INADEQUATE`. “Pular avaliação” não persiste julgamento. O feedback não altera decisões históricas, BKT, ontologia, pesos ou perfil.

## 8. Métricas habilitadas

[DECISÃO DE ENGENHARIA] Os registros permitem derivar taxas de solicitação de troca, manutenção de habilidade/conceito, conclusão/skip da substituição, mudança de formato/representação, avaliações profissionais e cobertura de feedback. Nenhum resultado é calculado ou apresentado como achado clínico neste batch.

## 9. Hipóteses a validar

[HIPÓTESE A VALIDAR] Manter o objetivo pedagógico e variar o formato pode produzir outcomes distintos; uma transição individual não demonstra causalidade.

## 10. Limitações

[LIMITAÇÃO] As escalas de delta são ordinais de engenharia, a cobertura semântica permanece parcial e critérios de evidência repetida ainda não foram definidos.

[PARÂMETRO EXPERIMENTAL] A penalidade temporária de rejeição e os pesos continuam os parâmetros configuráveis documentados na B2.4; nenhum peso novo foi introduzido.

## Texto potencial para a dissertação

### Metodologia

O ciclo registra a solicitação de mudança, rerexecuta a recomendação e associa outcomes anterior e substituto por uma transição persistida, permitindo avaliação profissional assíncrona.

### Decisão de projeto

A evidência de uma troca permanece contextual e separada tanto do domínio matemático quanto de características permanentes do estudante.

### Limitações

As diferenças observadas entre outcomes não estabelecem causalidade e dependem da cobertura das atividades e dos metadados.

### Evidência necessária no experimento

São necessárias sequências reais de adaptações, outcomes e avaliações profissionais para analisar adequação, cobertura e discordância.
