# Lote 09 — Conclusão da rodada e preferências da criança

[DECISÃO DE ENGENHARIA] A rodada termina quando dez atividades são concluídas com acerto, conforme a progressão de dez pontos percentuais já existente. A última tentativa continua sendo enviada ao serviço de atividades. A atividade seguinte retornada pela API não é apresentada nem recebe evento de apresentação quando a rodada chega a 100%.

[DECISÃO DE ENGENHARIA] A tela de conclusão reutiliza a imagem da TitiA e o serviço de fala já existente. O resumo infantil mostra acertos da rodada e a descrição da última prática, sem código BNCC, porcentagem de precisão ou afirmação de domínio. Uma estrela lúdica corresponde a cada atividade concluída; os pontos de desempenho registrados pelo backend continuam separados. A tela oferece retorno imediato ao mapa e retorno automático após dez segundos.

[DECISÃO DE ENGENHARIA] As preferências editadas pelo profissional são lidas do perfil infantil autenticado, ao iniciar e ao recuperar o foco, com atualização periódica de 30 segundos. Som e voz só ficam ativos quando as preferências locais e profissionais permitem. Baixa estimulação, alto contraste e redução de movimento são aplicados ao exercício e à celebração. A preferência profissional não é gravada no armazenamento local usado por outras contas. O exercício aguarda o carregamento do perfil antes de iniciar efeitos sonoros ou fala.

[DECISÃO DE ENGENHARIA] As rotas antigas de login e cadastro encaminham ao modal já existente na página inicial. A seleção visual distingue criança, responsável e profissional; os dois tipos de adulto continuam usando o mesmo serviço de autenticação, que identifica o papel real no backend. O comando Sair no exercício conduz ao mapa atual.

[PARÂMETRO EXPERIMENTAL] Dez atividades por rodada, dez segundos de permanência na celebração e atualização das preferências em 30 segundos são parâmetros de experiência e devem ser avaliados com usuários e profissionais. O ajuste de espaçamento para tablet landscape atua somente em telas com altura até 850 px; os alvos principais conservam altura mínima de 56 px.

[HIPÓTESE A VALIDAR] Uma conclusão visual previsível, com texto curto e menos movimento quando configurado, pode tornar a transição ao mapa mais clara. Essa hipótese requer observação com crianças, responsáveis e profissionais; a implementação não demonstra benefício clínico ou pedagógico por si só.

[LITERATURA] As recomendações gerais do W3C para acessibilidade cognitiva enfatizam previsibilidade, linguagem clara e possibilidade de reduzir movimento: https://www.w3.org/WAI/people-use-web/abilities-barriers/cognitive/ e https://www.w3.org/WAI/WCAG2/supplemental/patterns/o8p01-motion/ . Elas orientam escolhas de interface, sem estabelecer um perfil universal para crianças autistas.

## Texto potencial para a dissertação

### Metodologia

[PROPOSTA CONTA COMIGO] Registrar a conclusão da rodada após dez respostas corretas, verificar a preservação das tentativas e eventos de recomendação e observar a navegação infantil para o mapa.

### Decisão de projeto

[DECISÃO DE ENGENHARIA] Reutilizar o serviço de tentativas, o contexto de acessibilidade, o modal de autenticação e o serviço de voz, com uma tela breve de conclusão e preferências profissionais aplicadas à sessão da criança.

### Limitações

[HIPÓTESE A VALIDAR] O rótulo da prática resume a última atividade, não comprova aquisição da habilidade. O intervalo automático e o tempo de atualização das preferências precisam de avaliação. A interface ainda precisa de validação visual em dispositivos tablet reais.

### Evidência necessária no experimento

[PROPOSTA CONTA COMIGO] Verificar, com observação consentida e sem coleta adicional de dados pessoais, compreensão da transição, uso do botão de retorno, conforto sensorial, comportamento com voz e som desligados e correspondência entre as preferências profissionais e a sessão infantil.
