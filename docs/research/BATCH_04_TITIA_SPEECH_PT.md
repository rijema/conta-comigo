# Batch 04.2 — Fala da TitiA e instruções guiadas

## 1. Objetivo

[PROPOSTA CONTA COMIGO] Este batch acrescenta apoio falado opcional às interações infantis. A fala complementa texto, pictogramas e representação matemática; ela não substitui esses canais e não é ativada para toda interação automaticamente.

## 2. Implementações anteriores e consolidação

[DECISÃO DE ENGENHARIA] Antes deste batch havia chamadas diretas à Web Speech API na biblioteca visual e em um renderizador legado, além de sons produzidos por Web Audio. Essas chamadas de síntese foram consolidadas em `TitiaSpeechService`. O som de feedback permanece separado da fala, mas agora o fluxo ativo consulta `soundEnabled`.

[LITERATURA] Este batch não introduz afirmação de eficácia baseada em publicação científica. TODO: selecionar e revisar literatura sobre instruções faladas, comunicação multimodal e acessibilidade cognitiva antes de usar a funcionalidade como evidência na dissertação.

## 3. TitiaSpeechService

[DECISÃO DE ENGENHARIA] O serviço oferece `speakInstruction`, `speakHint`, `speakFeedback`, `speakPictogram`, `repeatLastInstruction` e `stopSpeech`. Antes de iniciar uma fala, ele cancela a reprodução vigente. Uma geração interna de reprodução impede que callbacks antigos continuem uma sequência cancelada.

[DECISÃO DE ENGENHARIA] A interface `TitiaSpeechEngine` separa orquestração e mecanismo de TTS. A implementação atual usa a Web Speech API do navegador; `replaceEngine` permite futura substituição por outro mecanismo sem alterar componentes infantis.

[LIMITAÇÃO] Voz, pronúncia, latência e disponibilidade dependem do navegador e do sistema operacional. Não foi selecionada uma voz específica nem foi acrescentado serviço externo de áudio.

## 4. Linguagem e instruções em etapas

[PROPOSTA CONTA COMIGO] Uma atividade pode fornecer:

- `spokenIntroduction`;
- `spokenSteps[]`;
- `spokenHint`;
- `spokenSuccessFeedback`;
- `spokenRetryFeedback`.

[DECISÃO DE ENGENHARIA] Passos explícitos são lidos na ordem declarada. Na ausência deles, a interface divide mecanicamente a instrução autoral em frases delimitadas por pontuação. Ela não usa LLM, não acrescenta operação matemática e não altera a resposta correta.

[DECISÃO DE ENGENHARIA] Duas atividades paramétricas receberam sequências explícitas curtas como exemplos de autoria: detecção de erro e problema contextual com maçãs. Os demais conteúdos continuam compatíveis e recebem o fallback baseado no texto já existente.

[LIMITAÇÃO] A divisão por pontuação não transforma necessariamente uma frase longa em uma boa sequência pedagógica. Conteúdos devem ser revisados por profissionais e, quando necessário, receber `spokenSteps` explícitos.

## 5. Controles de acessibilidade

[PROPOSTA CONTA COMIGO] A página de configurações disponibiliza:

- voz da TitiA ativada/desativada;
- velocidade da fala;
- idioma da fala;
- fala automática de instruções;
- som ativado/desativado.

[DECISÃO DE ENGENHARIA] As preferências são mantidas em `localStorage` pelo `AccessibilityProvider`, agora instalado no layout da aplicação. Assim, permanecem entre atividades e navegações no mesmo navegador. `soundEnabled` controla efeitos; `voiceEnabled` controla síntese de fala.

[LIMITAÇÃO] O modelo JSONB de `ChildProfile.uiPreferences` foi tipado para os novos campos, mas este batch não sincroniza automaticamente as preferências locais com o backend. Portanto, a persistência atual é por navegador/dispositivo, não entre dispositivos.

## 6. Parâmetros configuráveis

[PARÂMETRO EXPERIMENTAL] A taxa inicial é `0,85`. A interface permite `0,60` a `1,20`, e o serviço aplica um limite técnico de segurança entre `0,50` e `2,00`. Esses valores são configurações de apresentação e não representam parâmetros clínicos ou limiares de aprendizagem.

[DECISÃO DE ENGENHARIA] O idioma inicial é `pt-BR`, a voz inicia habilitada e a fala automática inicia habilitada para novos perfis. A criança ou responsável pode alterar essas opções. Preferências anteriormente salvas continuam preservadas.

## 7. Fala de pictogramas

[PROPOSTA CONTA COMIGO] Itens da biblioteca ARASAAC e do painel visual do menu podem falar o rótulo quando são tocados. A fala ocorre como consequência de uma ação explícita; apenas exibir ou renderizar um pictograma não dispara áudio.

[DECISÃO DE ENGENHARIA] O rótulo é resolvido pelo registro central de pictogramas. O evento analítico contém o `pictogramConceptId`, mas não replica o texto falado.

## 8. Fala automática e prevenção de duplicidade

[DECISÃO DE ENGENHARIA] Quando `automaticInstructionSpeech` está habilitado, a instrução é pronunciada uma vez por combinação de sessão e atividade. Uma marca é armazenada em `sessionStorage` somente após o mecanismo aceitar a reprodução. Isso evita duplicidade por re-renderização e remount do React.

[LIMITAÇÃO] Recarregar uma nova aba pode iniciar uma nova sessão de navegador. A deduplicação não é uma garantia distribuída entre dispositivos.

## 9. Learning Analytics

[DECISÃO DE ENGENHARIA] Foram adicionados os eventos append-only:

- `instruction_spoken`;
- `instruction_replayed`;
- `hint_spoken`;
- `pictogram_spoken`;
- `speech_disabled`.

[DECISÃO DE ENGENHARIA] `instruction_replayed` registra a reprodução efetiva feita pelo serviço de fala. Ele permanece distinto do evento legado `INSTRUCTION_REPLAYED`, usado pelo ciclo de atividade para a ação de reabrir/repetir instruções. As fórmulas determinísticas existentes não foram alteradas neste batch.

[DECISÃO DE ENGENHARIA] O frontend envia os eventos sem aguardar a persistência. O backend usa o estudante autenticado, aceita somente tipos conhecidos e limita metadados a `activityId`, `pictogramConceptId` e `stepCount`.

[PROPOSTA CONTA COMIGO] Replay é apenas uma interação observável. Não deve ser interpretado como incapacidade, dificuldade cognitiva, falta de leitura, diagnóstico ou baixa aprendizagem. Da mesma forma, desativar a fala expressa uma configuração naquele contexto, não rejeição permanente do canal auditivo.

## 10. Privacidade

[DECISÃO DE ENGENHARIA] Texto da instrução, dica, feedback, conteúdo infantil e voz sintetizada não são armazenados nos eventos. Não há gravação de microfone, voz da criança, biometria ou reconhecimento de fala.

[LIMITAÇÃO] Mesmo eventos minimizados revelam escolhas de acessibilidade e padrões de uso. Acesso, retenção e análise devem permanecer proporcionais à finalidade educacional e às regras de privacidade do projeto.

## 11. Hipóteses e limitações científicas

[HIPÓTESE A VALIDAR] Instruções curtas, sequenciais e repetíveis podem reduzir a dependência de leitura para determinados usuários. A implementação não comprova essa hipótese; são necessários estudos de compreensão, autonomia, preferência e carga percebida.

[LIMITAÇÃO] Não há personalização automática de voz por diagnóstico, nível de suporte, domínio BNCC ou BKT. Não há inferência de capacidade a partir do uso de replay, dicas ou desativação da voz.

## 12. Integração visual na atividade

[DECISÃO DE ENGENHARIA] Ao abrir uma atividade, a instrução falada usa o enunciado autoral como fonte, mas o painel da TitiA não o imprime novamente. O controle “Ouvir” foi retirado; “Repetir” reproduz a última instrução e também permite iniciar a fala manualmente quando a reprodução automática não ocorreu.

[PROPOSTA CONTA COMIGO] A ajuda geral passou a apresentar um tutorial visual curto sobre a mecânica da família de atividade, com texto, numeração e pictogramas. Ela não fornece a resposta e permanece distinta das dicas graduais do exercício.

[DECISÃO DE ENGENHARIA] A TitiA aparece ao lado do exercício em telas largas e em tamanho ampliado no feedback de acerto ou nova tentativa. O arraste usa somente a representação flutuante durante o gesto; o item de origem é ocultado temporariamente para evitar duplicação e deslocamento visual.

[HIPÓTESE A VALIDAR] A combinação de fala automática, tutorial visual e presença ampliada da personagem pode tornar a ação esperada mais compreensível e o feedback mais perceptível. Usabilidade com crianças e avaliação profissional ainda são necessárias.

## Texto potencial para a dissertação

### Metodologia

Foi implementada uma camada substituível de síntese de fala, conectada a preferências persistentes de acessibilidade e a um contrato opcional de instruções autorais em etapas. Testes com engine simulada verificaram sequência, cancelamento, repetição e estado desabilitado.

### Decisão de projeto

A fala foi tratada como apoio multimodal opcional. Chamadas de navegador foram isoladas no serviço, instruções automáticas foram deduplicadas por sessão e atividade, e a telemetria foi limitada a identificadores e contagens.

### Limitações

A qualidade da voz depende da plataforma, parte do conteúdo ainda usa decomposição por pontuação e as preferências ainda não são sincronizadas entre dispositivos.

### Evidência necessária no experimento

Devem ser avaliadas compreensão de cada passo, necessidade de replay, preferência de velocidade e idioma, autonomia na tarefa e adequação profissional do texto, sem usar os eventos isoladamente como diagnóstico ou medida de capacidade.
