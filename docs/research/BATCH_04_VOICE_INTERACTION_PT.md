# Batch 04 — Interação por voz

## 1. Arquitetura

[DECISÃO DE ENGENHARIA] O frontend captura áudio somente após toque explícito. O backend autenticado encaminha o buffer em memória ao `ml-service`, recebe uma transcrição temporária, converte-a em comando controlado e devolve apenas intenção, idioma e tempo de processamento.

## 2. Decisão push-to-talk

[PROPOSTA CONTA COMIGO] O estado percorre `ocioso → ouvindo → processando → resultado`. Não existe escuta contínua e todos os controles visuais permanecem disponíveis.

## 3. Provedor STT

[LITERATURA] [Faster-Whisper](https://github.com/SYSTRAN/faster-whisper) é uma implementação MIT de Whisper baseada em CTranslate2. [DECISÃO DE ENGENHARIA] A configuração inicial usa processamento local `small/int8`, ajustável por ambiente. A probabilidade de idioma não é tratada como confiança do comando.

## 4. Provedor TTS

[LITERATURA] O [model card da voz Piper `pt_BR/edresson`](https://huggingface.co/rhasspy/piper-voices/blob/v1.0.0/pt/pt_BR/edresson/low/MODEL_CARD) declara licença CC BY 4.0. [DECISÃO DE ENGENHARIA] A imagem do `ml-service` incorpora somente essa versão fixada, seu JSON e o model card — não o catálogo — e configura `PIPER_MODEL_PATH`. Falha do modelo aciona `BrowserSpeechEngine`.

[PARÂMETRO EXPERIMENTAL] Modelo STT, velocidade, limite de áudio e timeout são configuráveis. A qualidade e adequação infantil da voz precisam de validação profissional antes de ativação geral.

## 5. Privacidade

[DECISÃO DE ENGENHARIA] Áudio infantil existe apenas em buffers temporários. Não é escrito em banco, arquivo, cache, object storage, evento ou log. O cache em memória contém exclusivamente áudio sintetizado da TitiA. A transcrição bruta não é devolvida nem persistida.

## 6. Eventos semânticos retidos

[DECISÃO DE ENGENHARIA] São retidos início, comando reconhecido/desconhecido, ajuda, repetição e troca, com `interactionSource=VOICE`, intenção normalizada, sucesso e tempo. A ação também percorre o mesmo fluxo canônico usado pelo toque.

## 7. Papel em Learning Analytics

[PROPOSTA CONTA COMIGO] Os eventos permitem derivar contagem, taxa de reconhecimento, ajuda, repetição, troca, desconhecimento e tempo de STT. Não existe escore genérico de engajamento por voz.

## 8. Limitações científicas

[LIMITAÇÃO]

[HIPÓTESE A VALIDAR] Reconhecimento correto em fala infantil e adequação da voz neural em português brasileiro precisam ser avaliados. Um pedido por voz é comportamento contextual e não evidencia emoção, diagnóstico, preferência auditiva, dificuldade linguística ou capacidade.

## 9. Síntese para a dissertação

A interação por voz foi implementada como modalidade opcional push-to-talk, com reconhecimento local substituível, vocabulário conservador e reutilização das ações existentes. A minimização mantém apenas intenções semânticas, descartando áudio e transcrição após o processamento.

## Texto potencial para a dissertação

### Metodologia

Foi implementado um fluxo acionado explicitamente, processado em memória e limitado a comandos predefinidos em português.

### Decisão de projeto

A separação entre captura, STT, interpretação e ação permite substituir provedores sem duplicar os fluxos adaptativos.

### Limitações

Os modelos não foram validados com a população-alvo e o custo de memória/latência depende da infraestrutura de implantação.

### Evidência necessária no experimento

Devem ser avaliados reconhecimento por comando, latência, falhas, preferência de uso, clareza da voz e manutenção das alternativas não vocais, sem inferências clínicas.
