# Batch 04 — Consistência da experiência infantil

## Objetivo

[PROPOSTA CONTA COMIGO] Esta revisão reduz elementos concorrentes na atividade e mantém uma hierarquia única: navegação compacta, progresso, orientação da TitiA, enunciado, alternativas e confirmação.

[LITERATURA] Esta entrega não acrescenta alegações de literatura nem novas referências; sua fundamentação documental permanece limitada às fontes já registradas nos batches anteriores.

## Decisões de interface

[DECISÃO DE ENGENHARIA] O cartão passou a ocupar uma coluna central, sem imagens decorativas laterais. O indicador de dificuldade por estrelas foi removido da interface infantil porque concorria visualmente com o progresso e podia ser confundido com recompensa. A dificuldade continua disponível no modelo da atividade.

[DECISÃO DE ENGENHARIA] Alternativas recebem uma pequena ampliação no foco por ponteiro e uma redução ao pressionar. Quatro alternativas usam grade 2 × 2; três podem ocupar uma linha em telas maiores e permanecem empilhadas em telas estreitas.

[DECISÃO DE ENGENHARIA] O arraste usa uma camada visual centralizada no ponteiro ou toque e mantém a alternativa de selecionar uma peça e depois tocar no destino. Há somente uma ilustração de feedback por resposta, acompanhada por uma mudança cromática breve no plano de fundo.

[DECISÃO DE ENGENHARIA] A barra representa o progresso da sessão. Ela não representa dificuldade nem uma medida clínica. A indicação textual de nova seleção aparece apenas depois de a criança solicitar outra atividade, preservando a distinção operacional entre a recomendação inicial e o recálculo.

## Voz e ajuda

[PROPOSTA CONTA COMIGO] A instrução continua iniciando automaticamente quando a atividade abre. Ao abrir a ajuda, a TitiA inicia a sequência curta do tutorial; cada passo também pode ser acionado isoladamente. O controle “Parar” aparece somente durante fala ativa, e a escolha de uma alternativa pronuncia seu rótulo.

[DECISÃO DE ENGENHARIA] Falhas de reconhecimento de comando deixam de produzir uma mensagem persistente. A TitiA responde oralmente e o controle retorna automaticamente ao estado inicial.

## Continuidade

[DECISÃO DE ENGENHARIA] A autenticação já era persistida localmente. A sessão de aprendizagem passa a ser restaurada por até oito horas somente para o mesmo identificador de estudante. Respostas da criança não são gravadas nesse estado local. Sair remove a sessão e encaminha à página principal.

[PARÂMETRO EXPERIMENTAL] O prazo local de oito horas é uma configuração inicial de continuidade de uso, não um limiar pedagógico, e deve ser revisto após observação do uso real.

## Conteúdo matemático e formas

[DECISÃO DE ENGENHARIA] Nas questões de formas, as alternativas exibem palavras, enquanto a representação visual permanece no enunciado. A validação de sequência passa a aceitar ordens alternativas apenas quando explicitamente autoradas; a atividade de adição inclui a troca dos operandos devido à comutatividade.

[LIMITAÇÃO] Não foi introduzido um avaliador genérico de expressões, uma regra para números negativos ou uma inferência automática de precedência. Essas decisões dependem do conteúdo pedagógico autorado e devem ser validadas antes de ampliar o conjunto de exercícios.

## Acessibilidade e identidade

[DECISÃO DE ENGENHARIA] Texto continua acompanhando os pictogramas; foco visível, interação por teclado, alternativa ao arraste, redução de movimento e ampliação discreta são preservados. “Sem rolagem” é perseguido em viewport desktop típica, mas o conteúdo não é cortado em telas pequenas ou com ampliação de texto, pois acesso integral tem precedência sobre uma altura rígida.

[HIPÓTESE A VALIDAR] O efeito cromático breve, a fala imediata e a menor densidade de controles podem tornar o retorno mais compreensível sem aumentar sobrecarga sensorial. Isso requer avaliação com crianças e profissionais.

## Texto potencial para a dissertação

### Metodologia

Foi realizada uma revisão de consistência da interface infantil por inspeção dos fluxos implementados e testes automatizados de regressão sobre navegação, voz, arraste, feedback e persistência local.

### Decisão de projeto

Adotou-se uma hierarquia visual central, com progresso único, orientação multimodal opcional e microinterações discretas, preservando contratos de atividade e recomendação existentes.

### Limitações

A adequação perceptiva das transições e a capacidade de acomodar todo conteúdo sem rolagem dependem da dimensão da tela, ampliação escolhida e extensão do exercício.

### Evidência necessária no experimento

São necessários dados observacionais de compreensão dos controles, tempo de conclusão, pedidos de ajuda, erros de arraste e tolerância aos estímulos, com validação profissional e sem interpretação diagnóstica automática.
