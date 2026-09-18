# Lote 10 — Preferências de experiência e resumo para responsáveis

[DECISÃO DE ENGENHARIA] O painel profissional passou a organizar preferências por dimensão no perfil sensorial da criança, armazenado no campo JSONB `uiPreferences` já existente. Há controles separados para som geral, fala da TitiA, efeitos, volume, velocidade da fala, movimento, intensidade visual e sonora, quantidade de elementos, feedback, celebrações, ajuda automática, troca de atividade, formatos, habilidades BNCC e dificuldade. Essas preferências descrevem uma configuração de interface e não classificam a criança em um grupo clínico fixo.

[DECISÃO DE ENGENHARIA] Som geral desliga também a fala. O volume é aplicado ao motor de fala do navegador e ao áudio neural, além dos efeitos locais do exercício; a intensidade sonora limita o volume efetivo. A baixa estimulação pausa efeitos sonoros e movimento rápido, preservando a opção de fala quando habilitada. Animações reduzidas removem movimento rápido. A previsibilidade alta mantém o fundo estável. A ajuda automática é oferecida depois do tempo escolhido e usa o evento de hint existente. A opção de trocar de atividade permanece visível, mas desabilitada quando o profissional a proíbe. Isso torna a decisão reconhecível pela criança em vez de fazer o botão desaparecer.

[DECISÃO DE ENGENHARIA] A fórmula do ranking híbrido não foi alterada. Os formatos indisponíveis e o limite de elementos restringem atividades candidatas antes do ranking. Entre as habilidades BNCC prioritárias, a menos praticada nas tentativas recentes é enviada como habilidade-alvo à decisão ADE, mantendo a proveniência da recomendação. Uma solicitação explícita para manter a habilidade na troca de atividade tem precedência. A dificuldade manual seleciona candidatas desse nível quando disponíveis, preservando pré-requisitos ontológicos. A seleção normal continua quando não existe atividade no nível manual dentro das candidatas válidas. A dificuldade adaptativa volta a usar a recomendação existente quando reativada. As alternativas e a decisão continuam no registro de recomendação existente.

[PARÂMETRO EXPERIMENTAL] Os valores de interface oferecidos para espera de ajuda (15, 30, 45 ou 60 segundos), limite de elementos (4, 6, 8, 12 ou 20), volume, velocidade da fala e frequência de celebração são opções configuráveis de engenharia. Não são limiares clínicos. A celebração final da rodada permanece disponível mesmo quando as celebrações intermediárias são reduzidas.

[DECISÃO DE ENGENHARIA] O painel dos responsáveis reutiliza tentativas, atividades, sessões identificadas, pontos e habilidades vinculadas às atividades. Mostra atividades recentes, formatos mais usados, prática de habilidades com nomes cotidianos e uma proposta simples para casa. O resumo evita inferir domínio de uma porcentagem isolada. A contagem de sessões representa IDs de sessão presentes na amostra recente de tentativas, e não uma contagem histórica vitalícia.

[DECISÃO DE ENGENHARIA] O responsável autenticado pode trocar o nome e a senha curta de uma criança vinculada a sua conta. O serviço verifica `guardianId` antes de alterar o usuário infantil e grava somente o hash da nova senha. A edição exige nome e nova senha no mesmo envio porque o nome faz parte da entrada infantil. Não há exposição da senha anterior.

[DECISÃO DE ENGENHARIA] O responsável também pode trocar a própria senha. O serviço exige a senha atual, verifica o papel de responsável e grava um novo hash; a senha atual não é devolvida pela API.

[HIPÓTESE A VALIDAR] A separação das dimensões pode facilitar ajustes individuais sem fixar um estilo de aprendizagem. A compreensão dos rótulos, o conforto da criança e a utilidade do resumo familiar exigem avaliação com profissionais e responsáveis. Os dados observados não são prova de aquisição de habilidade.

[LITERATURA] A orientação de acessibilidade cognitiva do W3C recomenda interface previsível, linguagem clara e possibilidade de personalização: https://www.w3.org/WAI/people-use-web/abilities-barriers/cognitive/ . Essa orientação geral não define limiares clínicos nem um perfil único para crianças autistas.

## Texto potencial para a dissertação

### Metodologia

[PROPOSTA CONTA COMIGO] Configurar preferências por criança, verificar propagação para a sessão infantil e comparar os conjuntos de atividades elegíveis sem modificar os pesos da fórmula existente. Observar a compreensão do resumo familiar e da edição de acesso.

### Decisão de projeto

[DECISÃO DE ENGENHARIA] Reutilizar `ChildProfile.uiPreferences`, o ranking híbrido, os eventos de aprendizagem, o serviço de fala e as tentativas já registradas. Não foi necessária migração de banco porque o perfil já utiliza JSONB e não foram adicionadas colunas.

### Limitações

[HIPÓTESE A VALIDAR] A prioridade BNCC é uma preferência de alvo da decisão ADE e pode ceder a pré-requisitos, reforço ou ausência de atividades compatíveis. A dificuldade manual é aplicada quando há candidatas válidas no nível pedido. A interface deve informar a seleção efetiva em avaliação futura. O limite de elementos é calculado pelos itens ou opções declarados na atividade e pode não representar todo o conteúdo visual de formatos complexos. O resumo de sessões e atividades usa amostras recentes. “Praticou” indica exposição registrada, não domínio. A troca de senha não revoga imediatamente sessões já autenticadas; uma política de revogação exigiria mudança adicional no serviço de autenticação.

### Evidência necessária no experimento

[PROPOSTA CONTA COMIGO] Registrar observações consentidas de facilidade de configuração, correspondência entre preferência salva e experiência infantil, disponibilidade de atividades sob restrições, compreensão de cada indicador familiar e uso das sugestões fora da plataforma. Não é necessário coletar biometria, vídeo ou novos dados pessoais.
