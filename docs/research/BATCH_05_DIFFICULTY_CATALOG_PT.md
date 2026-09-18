# Progressão de dificuldade e ampliação do catálogo

[LITERATURA] Este lote não introduz alegações de eficácia baseadas em literatura. Os parâmetros e vínculos curriculares descritos abaixo precisam de validação independente.

[DECISÃO DE ENGENHARIA] A aplicação preserva o serviço ADE, o BKT, o ranqueamento híbrido, as tentativas, os eventos de aprendizagem e a trilha de recomendações existentes. Os níveis `very_easy`, `easy`, `medium`, `hard` e `extreme` são uma ordenação interna de desafios. Os registros anteriores continuam com seus níveis originais.

[PARÂMETRO EXPERIMENTAL] A promoção exige ao menos três respostas corretas independentes, sem dicas nem repetição da mesma atividade, no nível atual, com domínio estimado de pelo menos 0,5, acurácia recente de pelo menos 0,75 e engajamento de pelo menos 0,35. O limite de tempo usa o parâmetro configurável já empregado pelo ADE (`ADE_BREAK_TIME_SECONDS_THRESHOLD`, padrão 120 segundos). Duas dificuldades recorrentes, dois skips recentes ou acurácia recente inferior a 0,4 após duas tentativas reduzem um nível. Esses valores são regras experimentais e não representam limites científicos validados.

[PARÂMETRO EXPERIMENTAL] A persistência é representada pela sequência de tentativas recentes: um erro isolado seguido de três êxitos independentes ainda permite avanço quando a acurácia da janela satisfaz o limite. Repetir a mesma questão até acertar não conta como três êxitos independentes. Skips são contados somente a partir da tentativa mais antiga na janela recente.

[PARÂMETRO EXPERIMENTAL] A janela e os mínimos são configuráveis por `ADE_DIFFICULTY_HISTORY_WINDOW` (padrão 5), `ADE_PROMOTION_MIN_SUCCESSES` (3), `ADE_DIFFICULTY_MIN_STRUGGLES` (2) e `ADE_DIFFICULTY_MIN_SKIPS` (2), além dos limites existentes de domínio, acurácia, engajamento, dicas e tempo.

[DECISÃO DE ENGENHARIA] As decisões de dificuldade consideram tentativas da habilidade BNCC alvo. O algoritmo de seleção aplica cooldown a IDs recentes, estrutura, itens e formato, usando tentativas e eventos de skip de sessões anteriores. Quando o catálogo não oferece alternativas, relaxa as restrições gradualmente. O ranqueamento e sua persistência continuam após o filtro.

[PROPOSTA CONTA COMIGO] O catálogo inclui 60 questões adicionais em contagem, número e quantidade, comparação, sequência, adição, subtração, formas, classificação, padrões, grandezas, posição espacial e problemas cotidianos. Cada nicho tem cinco níveis com estruturas distintas. Os metadados `structureId`, `niche`, `context` e `sensoryProfile` permitem analisar variedade real. O exemplo de compras usa habilidades principal e secundárias com pesos que somam 1; os demais exemplos com mais de uma habilidade seguem a mesma representação.

[DECISÃO DE ENGENHARIA] A coluna `skillWeights` é opcional. `bnccSkills` permanece para compatibilidade com análises, BKT e recomendações anteriores. O peso da habilidade alvo ajusta o termo semântico do ranqueamento híbrido. O BKT continua atualizando apenas a habilidade principal; pesos secundários ainda não ponderam a atualização probabilística.

[HIPÓTESE A VALIDAR] A alternância de estrutura e formato poderá reduzir rejeição e repetição percebida sem piorar acurácia ou tempo de resposta. A calibração dos níveis e pesos depende de dados de uso e avaliação pedagógica.

[DECISÃO DE ENGENHARIA] Os nichos de padrões, grandezas e posição espacial ficam sem associação BNCC de produção enquanto não houver mapeamento curricular validado no projeto. Eles podem aparecer por fallback do seletor; uma futura associação requer revisão curricular. As relações dos demais exemplos também precisam de revisão especializada antes de uso como evidência curricular formal.

## Texto potencial para a dissertação

### Metodologia

[PROPOSTA CONTA COMIGO] Comparar sequências de tentativas antes e depois da aplicação das regras de progressão e do cooldown, estratificando por habilidade e nível.

### Decisão de projeto

[DECISÃO DE ENGENHARIA] A progressão ocorre em passos de um nível e exige evidência recente consistente; o catálogo preserva a arquitetura de atividades já utilizada.

### Limitações

[HIPÓTESE A VALIDAR] Limiares, pesos e equivalência pedagógica entre questões ainda não foram validados empiricamente. A ausência de mapeamento BNCC para três nichos restringe seu uso curricular.

### Evidência necessária no experimento

[PARÂMETRO EXPERIMENTAL] Medir taxa de acertos, erros, dicas, skips, tempo de resposta, repetições de estrutura, persistência e mudanças de domínio estimado por habilidade ao longo de sessões.
