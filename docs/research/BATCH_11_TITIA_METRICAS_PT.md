# TitiA, rastros de interação e conclusão

## Estado implementado

- [DECISÃO DE ENGENHARIA] A TitiA já aparece na conclusão e nos tutoriais. A leitura das instruções e dos pictogramas usa o serviço de fala existente, condicionado pelas preferências profissionais de som, voz, volume e estímulos.
- [DECISÃO DE ENGENHARIA] O registro de tentativa agora reúne identificadores de criança, sessão, atividade e recomendação (nas colunas existentes), além de BNCC principal e secundárias, formato, dificuldade, resposta matemática estruturada, tempos até primeira interação/última resposta/total, pistas, domínio antes/depois e dificuldade seguinte no campo `researchTrace`.
- [DECISÃO DE ENGENHARIA] Respostas textuais livres e objetos arbitrários não são armazenados no novo rastro. Nesses casos, `answer` é nulo; a avaliação e o registro de acerto continuam disponíveis. Não são armazenados áudio, transcrição, vídeo ou dados biométricos.
- [DECISÃO DE ENGENHARIA] Eventos existentes registram apresentação, início, tentativa, pista, tutorial, repetição de instrução, pictograma, fala e pedido de outra atividade. Foram acrescentados início/fim da rodada e abandono ao sair. Uma tentativa incorreta deixa de gerar `ACTIVITY_COMPLETED`.
- [DECISÃO DE ENGENHARIA] O vínculo com a explicação e as alternativas da recomendação continua em `ade_decisions` e na explicação de pesquisa já existente; `recommendationId` permite a junção, sem duplicar a fórmula.
- [DECISÃO DE ENGENHARIA] O carregamento do mapa não usa mais movimento repetitivo; a espera da conversa com TitiA usa texto em vez de indicador técnico giratório. Os comandos principais do exercício usam cantos e sombras consistentes. A transição de fundo obedece à redução de movimento e ao modo de baixa estimulação.

## Interpretação e limites

- [LITERATURA] Nenhuma afirmação de eficácia ou limiar foi acrescentada sem fonte nesta etapa; os efeitos pedagógicos e de acessibilidade permanecem para avaliação empírica.
- [PARÂMETRO EXPERIMENTAL] Os tempos são medidos no navegador com relógio local. `firstInteractionMs` começa na apresentação da atividade e termina na primeira ação de ponteiro ou teclado; `responseTimeMs` termina no envio da tentativa e reinicia após cada tentativa; `totalTimeMs` é o tempo da apresentação até o envio atual.
- [HIPÓTESE A VALIDAR] Esses tempos podem indicar necessidade de reforço, mas latência de dispositivo, pausa, uso assistido e acessibilidade influenciam a medida. Nenhum limiar científico novo foi definido aqui.
- [DECISÃO DE ENGENHARIA] `SESSION_COMPLETED` indica dez acertos na rodada; `ACTIVITY_ABANDONED` indica saída pelo comando da atividade. Fechar a aba sem sincronização não é observado como abandono.
- [DECISÃO DE ENGENHARIA] `masteryBefore` e `masteryAfter` vêm da atualização BKT existente, para a habilidade principal. Não representam medida clínica nem o domínio simultâneo de todas as BNCCs secundárias.
- [HIPÓTESE A VALIDAR] A apresentação visual reduzida e o controle profissional podem melhorar conforto e compreensão; isso exige avaliação com participantes e profissionais.

## Texto potencial para a dissertação

### Metodologia

[PROPOSTA CONTA COMIGO] Associar tentativas, eventos de interação e decisões ADE por criança, sessão, atividade e recomendação, distinguindo resposta correta, tentativa incorreta, troca de atividade e saída.

### Decisão de projeto

[DECISÃO DE ENGENHARIA] Preservar o recomendador e suas explicações; acrescentar rastros estruturados e corrigir a semântica de conclusão, com eventos de fala e pictogramas somente quando usados.

### Limitações

[HIPÓTESE A VALIDAR] O primeiro contato e o tempo de resposta são aproximações no cliente; ausência de evento pode significar falha de rede. A resposta textual livre é omitida no rastro estruturado.

### Evidência necessária no experimento

[PROPOSTA CONTA COMIGO] Verificar completude dos vínculos entre eventos, tentativas e decisões; comparar tempos e pistas com observação supervisionada; registrar preferências configuradas e testar compreensão da celebração e do carregamento reduzido.
