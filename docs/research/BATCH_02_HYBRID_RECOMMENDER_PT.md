# Batch 02.4 — Recomendação híbrida

## Arquitetura híbrida

[PROPOSTA CONTA COMIGO] A ontologia elimina candidatos semanticamente inválidos. O `HybridRecommendationService` ordena somente os candidatos aceitos e o primeiro colocado é selecionado deterministicamente. BKT/`StudentSkillState` continua sendo a única fonte de domínio matemático.

## Seis fatores e suas fontes

- `learningNeed`: `1 - masteryProbability`, usando exclusivamente BKT.
- `challengeFit`: ajuste gaussiano entre sucesso previsto e probabilidade-alvo, considerando domínio e perfil de dificuldade da atividade.
- `interactionFit`: evidência explícita de representação, suporte motor/auditivo e affordances; ausência de evidência produz contribuição neutra e marcador de insuficiência.
- `semanticFit`: proporção relativa de conceitos matemáticos correspondentes entre candidatos já validados pela ontologia.
- `novelty`: recência da atividade no histórico de tentativas.
- `rejectionRisk`: recência de `ACTIVITY_SKIPPED` para a atividade exata. Skip permanece um sinal observacional, não diagnóstico ou desengajamento.

## Fórmula

[DECISÃO DE ENGENHARIA]

`score = wLearning × learningNeed + wChallenge × challengeFit + wInteraction × interactionFit + wSemantic × semanticFit + wNovelty × novelty - wRejection × rejectionRisk`

`challengeFit = exp(-((predictedSuccess - targetSuccessProbability)²) / (2 × challengeSigma²))`

## Parâmetros configuráveis

[PARÂMETRO EXPERIMENTAL] Pesos, probabilidade-alvo, sigma, janelas de novidade/rejeição, magnitudes máximas e versão da configuração vêm de variáveis de ambiente. Os valores padrão são iniciais de engenharia, não valores aprendidos, clínicos ou pedagogicamente ótimos.

## Predição e decisão

[DECISÃO DE ENGENHARIA] `predictedSuccess` é uma transformação determinística usada no fator de desafio; `finalScore` é uma decisão de ordenação. Nenhum deles substitui a probabilidade de domínio armazenada por BKT.

## Fallback

[PROPOSTA CONTA COMIGO] Seleção aleatória permanece somente quando a geração semântica falha, nenhum candidato válido pode ser ranqueado ou serviços necessários estão indisponíveis. O registro usa `LEGACY_FALLBACK`, motivo explícito e nunca o apresenta como IA híbrida.

## Limitações

[DECISÃO DE ENGENHARIA] Os pesos não foram aprendidos nem validados experimentalmente. A evidência de interação reconhecida é restrita ao vocabulário disponível. O risco de rejeição considera somente skips explicitamente persistidos e não generaliza permanentemente para famílias.

## Relação com a literatura

[LITERATURA] Nenhuma nova referência verificável foi adicionada neste batch; referências científicas para calibração devem ser incorporadas após revisão documental.

[HIPÓTESE A VALIDAR] A ordenação híbrida poderá reduzir repetição inadequada preservando relevância curricular; isso exige avaliação experimental.

## Rastreabilidade da recomendação

[PROPOSTA CONTA COMIGO] `RecommendationDecision → RecommendationOutcome → AdaptationTransition` forma a cadeia persistida. A decisão identifica a atividade selecionada; o outcome resume apresentação, início, tentativas, ajuda e término; uma transição registra um skip e pode receber posteriormente a decisão substituta.

[DECISÃO DE ENGENHARIA] `LearningEvent` permanece a fonte append-only de eventos brutos. `RecommendationOutcome` é uma visão operacional resumida e idempotente, sem duplicar payloads. `InteractionEvidence` preserva apenas contexto semântico sanitizado da interação e não cria preferência, força, fraqueza ou necessidade permanente.

[LITERATURA] Nenhuma relação clínica ou psicológica é inferida desses sinais. Um skip é uma observação contextual e não altera domínio matemático; somente BKT atualiza `StudentSkillState` a partir das observações de resposta previstas em seu fluxo.

[PARÂMETRO EXPERIMENTAL] Critérios futuros de suficiência para agregar evidências ainda não foram definidos.

[HIPÓTESE A VALIDAR] Sequências de outcomes e transições poderão apoiar análise das adaptações, condicionada a validação experimental e profissional.

## Texto potencial para a dissertação

### Metodologia

O sistema filtra atividades por validade semântica e aplica uma função determinística de seis fatores exclusivamente ao conjunto válido, registrando entradas, contribuições, penalidades, versões e fallback.

### Decisão de projeto

A separação entre restrição ontológica e ordenação numérica impede que um score compense uma incompatibilidade semântica ou de acessibilidade.

### Limitações

Os parâmetros são experimentais e a cobertura semântica e observacional ainda é parcial.

### Evidência necessária no experimento

São necessários estudos comparando resultados, repetição, skips e estabilidade das recomendações sob configurações versionadas.
