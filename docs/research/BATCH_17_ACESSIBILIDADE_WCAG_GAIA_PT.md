# Acessibilidade: conformidade WCAG 2.2 (níveis A e AA) e GAIA

## Escopo

[PROPOSTA CONTA COMIGO]

Este documento registra como a interface do Conta Comigo foi avaliada e corrigida para atender aos critérios de sucesso de nível A e AA das WCAG 2.2 e às 28 recomendações do GAIA (G01–G28). O documento também descreve o método de teste: ferramentas automáticas (axe-core via Playwright e WAVE), verificações complementares escritas para este projeto e inspeção manual. As correções alteram cores, foco, títulos, marcação e um comportamento de foco em modais. Elas não modificam conteúdo pedagógico, regras adaptativas nem coleta de dados.

[LITERATURA]

As WCAG 2.2 são a recomendação do W3C para acessibilidade de conteúdo web; a conformidade de nível AA exige satisfazer todos os critérios de nível A e AA (W3C, 2023). No critério 4.1.1 (Análise), as WCAG 2.2 o tornam obsoleto, sempre satisfeito. O GAIA reúne 28 recomendações de acessibilidade de interfaces web com foco em pessoas autistas, organizadas em dez categorias (PAGANI, s.d.). O site do GAIA não informa ano nem formato de citação; a referência abaixo deve ser conferida com a dissertação de origem antes da versão final.

## Situação antes das correções

[PROPOSTA CONTA COMIGO]

Primeira rodada da extensão WAVE (WebAIM) em produção, em 20/11/2026:

| Tela | Erros | Erros de contraste | Alertas | AIM score |
|---|---|---|---|---|
| Exercício (quiz) | 0 | 0 | 1 (nível de título pulado) | 10 |
| Exercício com sugestão de pausa | 0 | 1 | 0 | 9,7 |
| Exercício com “Hora da pausa” | 0 | 1 | 0 | 9,7 |
| Mapa de ilhas (`/learn/menu`) | 0 | 13 | 2 | 7,6 |
| Painel do profissional | 0 | 18 | 1 | 5,5 |
| Painel do profissional com a TitiA aberta | 0 | 18 | 1 | 5,5 |

[DECISÃO DE ENGENHARIA]

Causas encontradas:

- textos em tons claros da paleta Tailwind (`slate-400`, `green-500`, `red-500` e similares), com contraste entre 2,3:1 e 3,8:1;
- botões com gradiente e texto branco sem cor sólida de reserva. O WAVE mede o texto contra a cor de fundo sólida mais próxima e ignora o gradiente; a WCAG pede essa cor de reserva quando há imagem de fundo;
- exercícios concluídos esmaecidos com `opacity-60` e botões de pausa em `teal-600` (3,7:1);
- título `h3` logo após o `h1` na tela de exercício, texto alternativo “TitIA” repetido ao lado do mesmo texto e uma faixa animada sem fim.

## Correções aplicadas

[DECISÃO DE ENGENHARIA]

| Problema | Correção | Critério |
|---|---|---|
| Texto com contraste abaixo de 4,5:1 | Codemod que sobe cada classe de cor ao primeiro tom da paleta Tailwind com pelo menos 4,5:1 sobre `slate-100`, por exemplo `slate-400` → `slate-600` | 1.4.3 |
| Texto branco sobre gradiente | Toda classe `bg-gradient-*` ganhou cor sólida de reserva (`bg-*`); paradas de gradiente sob texto branco usam tons com pelo menos 4,5:1 | 1.4.3 |
| Indicador de foco | Anéis `ring-*-200/300` passaram ao primeiro tom com pelo menos 3:1; contorno branco em botões sobre cabeçalhos escuros | 2.4.7, 1.4.11 |
| Borda de campos de formulário | `slate-200/300` → `slate-500` | 1.4.11 |
| Foco escapando de modal | `useModalFocus` devolve o foco ao diálogo quando ele está fora (por exemplo, depois de um clique no fundo) | 2.4.3, 2.4.11 |
| Fundo do login como `role="button"` envolvendo o formulário | Fundo sem papel interativo; Escape fecha a partir de qualquer controle do diálogo | 4.1.2, 2.1.2 |
| Mesmo título “Conta Comigo” em todas as páginas | Título por rota, como “Painel do profissional · Conta Comigo” | 2.4.2 |
| Faixa animada sem fim no mapa | Uma única passada de 5 s, desligada com `prefers-reduced-motion` | 2.2.2 |
| `h3` sem `h2` | “TitiA explica para você” passou a `h2` | 1.3.1 |
| Campo nome sem finalidade | `autocomplete="name"` | 1.3.5 |
| Texto em caixa-alta com letras espaçadas | Removidos `uppercase` e `tracking-wide*` | GAIA G03 |
| Links externos sem aviso | Ícone ↗ visível e texto “(abre em nova aba)” para leitor de tela | GAIA G22 |
| Toque acidental em “Quero outro” descartava o exercício e registrava um pulo | Segurar 0,6 s com barra de progresso; toque curto mostra “Segure o botão um pouquinho”; teclado ativa na hora; o profissional pode desligar | GAIA G28, WCAG 2.1.1 |
| Toque duplo em “Confirmar” podia registrar duas tentativas | Uma resposta por vez enquanto a anterior é enviada | GAIA G28, G21 |
| “Encerrar atendimento” com um toque | Confirmação em duas etapas na própria barra | GAIA G20 |
| Sem personalização da tela pela criança | Engrenagem “Ajustes”: figuras, botões e textos, letra, cores, figura/palavra nos botões, modo leitura | GAIA G05, G06, G08, G17 |
| Profissional não podia simplificar a tela | Aba “Ajustar tela da criança”: prévia com exercício de exemplo, toque para ocultar e mostrar controles, confirmar | GAIA G07, G10 |

## Como testamos

[PROPOSTA CONTA COMIGO]

A avaliação combina quatro fontes de evidência, porque nenhuma ferramenta automática cobre todos os critérios WCAG:

1. **axe-core 4.12 (Deque) via Playwright 1.58**, script `frontend/e2e/a11y/audit.js`. O script abre cada tela no Chromium a 1280 × 900 px com `prefers-reduced-motion: reduce`. A API é simulada com dados fixos derivados das seeds do backend (`generate-data.sh`), então as telas logadas de criança, responsável e profissional renderizam sem banco de dados. O axe roda com as tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` e `wcag22aa`.
2. **Verificações complementares no mesmo script**, para critérios que o axe não automatiza ou deixa “para revisão”:
   - contraste no modelo do WAVE: texto contra a cor sólida de fundo mais próxima, com opacidade composta, ignorando gradientes;
   - fronteira dos campos de formulário com pelo menos 3:1 (1.4.11);
   - navegação real por `Tab` em até 60 controles por tela, conferindo contorno ou anel de foco com pelo menos 3:1 (2.4.7, 1.4.11) e foco não encoberto (2.4.11). Os controles desabilitados ficam de fora, como no axe e no WAVE;
   - espaçamento de texto do critério 1.4.12 injetado (altura de linha 1,5; letras 0,12 em; palavras 0,16 em; parágrafo 2 em), reportando o texto que passa a ser cortado;
   - título específico por rota (2.4.2);
   - nas telas da criança, linhas de até 80 caracteres (GAIA G03).
3. **WAVE (WebAIM)**, extensão de navegador, aplicada em produção antes e depois das correções. As capturas de tela estão nos anexos.
4. **Inspeção manual e do código** para os critérios que dependem de julgamento: sentido das imagens, linguagem, consistência, alternativas a gestos, mídia.

Cobertura: 39 telas — página inicial, diálogo de entrada, entrar, cadastro, mapa de ilhas, exercício, menu de ajuda, sugestão de pausa, “Hora da pausa”, um exercício de cada um dos 8 formatos (`drag_drop`, `quiz`, `representation_matching`, `counting`, `contextual_problem_solving`, `missing_number`, `error_detection`, `pattern_completion`), configurações, painel do responsável e as abas do painel do profissional (incluindo o relatório e “Ajustar tela da criança” com controles ocultados), além das variações da engrenagem: diálogo de ajustes, modo leitura, temas creme, calmo e alto contraste combinados com as letras Atkinson e Lexend e ampliação de 1,5× a 2×, botões só com figura e só com palavra, controles ocultados pelo profissional e o “segurar para trocar” (dica do toque curto e ativação após 0,6 s).

Para reproduzir:

```bash
cd frontend
./e2e/a11y/generate-data.sh
npx next dev -p 3124            # outro terminal
npm run test:a11y               # código de saída 0 = nenhuma violação
```

Resultado em 20/11/2026: **39 de 39 telas sem violações** no axe e nas verificações complementares. As capturas de cada tela ficam em `frontend/e2e/a11y/shots/`, que é ignorado pelo git.

[PARÂMETRO EXPERIMENTAL]

Limiares usados: 4,5:1 para texto normal e 3:1 para texto grande (≥ 24 px, ou ≥ 18,66 px em negrito), para indicadores de foco e para fronteiras de campos; alvo de toque de 44 px (`min-h-11`) nos controles principais; animação decorativa com no máximo 5 s; “segurar para trocar” de 600 ms, cancelado se o dedo se mover mais de 10 px; ampliação de pictogramas em 1×, 1,25×, 1,5× e 2× e de botões e textos em 1×, 1,15× e 1,3×; linhas de até 80 caracteres (GAIA G03).

## Tabela WCAG 2.2 — níveis A e AA

[PROPOSTA CONTA COMIGO]

Legenda do método: **axe** = regra automática do axe-core; **script** = verificação complementar de `audit.js`; **WAVE** = extensão WebAIM; **inspeção** = revisão manual ou de código.

| Critério | Nível | Situação | Método | Evidência no Conta Comigo |
|---|---|---|---|---|
| 1.1.1 Conteúdo não textual | A | Atende | axe, WAVE, inspeção | Pictogramas ARASAAC com `alt`; imagens decorativas com `alt=""`; ícones com `aria-hidden` |
| 1.2.1 Somente áudio e somente vídeo (pré-gravado) | A | Não se aplica | inspeção | Não há áudio ou vídeo pré-gravado; a fala da TitiA lê texto já exibido |
| 1.2.2 Legendas (pré-gravado) | A | Não se aplica | inspeção | Sem vídeo |
| 1.2.3 Audiodescrição ou mídia alternativa | A | Não se aplica | inspeção | Sem vídeo |
| 1.3.1 Informações e relações | A | Atende | axe, WAVE | Landmarks `header`/`main`/`aside`, hierarquia de títulos, `fieldset`/`legend`, `role="group"`, rótulos associados |
| 1.3.2 Sequência com significado | A | Atende | inspeção, script (Tab) | Ordem do DOM igual à ordem visual |
| 1.3.3 Características sensoriais | A | Atende | inspeção | Instruções em texto, pictograma e voz; nada depende só de forma ou posição |
| 1.4.1 Uso de cor | A | Atende | inspeção | “Concluído” com texto e ícone; seleção com `aria-pressed` e borda |
| 1.4.2 Controle de áudio | A | Atende | inspeção | Botão “Desligar música” na pausa; som, efeitos e voz configuráveis |
| 2.1.1 Teclado | A | Atende | script (Tab), inspeção | Controles são `<button>`; arrastar tem alternativa por toque ou clique |
| 2.1.2 Sem armadilha de teclado | A | Atende | script (Tab) | Modais prendem o foco, mas fecham com Escape ou botão |
| 2.1.4 Atalhos de teclado por caractere | A | Não se aplica | inspeção (código) | Não há atalhos de uma tecla; só Enter e Espaço no controle focado |
| 2.2.1 Tempo ajustável | A | Atende | inspeção | Sem limite de tempo; atraso da ajuda configurável pelo profissional |
| 2.2.2 Pausar, parar, ocultar | A | Atende | inspeção | Animação decorativa com no máximo 5 s; respeita `prefers-reduced-motion` e o modo de baixa estimulação |
| 2.3.1 Três flashes ou abaixo do limite | A | Atende | inspeção | Sem conteúdo piscante |
| 2.4.1 Ignorar blocos | A | Atende | axe | Landmark `main` em todas as telas; link “Pular para o conteúdo” na página inicial |
| 2.4.2 Página com título | A | Atende | axe, script | Título por rota, como “Meu mapa de aventuras · Conta Comigo” |
| 2.4.3 Ordem do foco | A | Atende | script (Tab) | Foco gerenciado em modais e devolvido ao fechar |
| 2.4.4 Finalidade do link (em contexto) | A | Atende | axe, inspeção | Nomes como “Começar: <título do exercício>” |
| 2.5.1 Gestos de ponteiro | A | Atende | inspeção, E2E | Toque simples substitui o arrastar (`e2e/progression`) |
| 2.5.2 Cancelamento de ponteiro | A | Atende | inspeção | Ações em `click`, ao soltar o ponteiro |
| 2.5.3 Rótulo no nome acessível | A | Atende | axe, inspeção | O nome acessível contém o texto visível, como “Confirmar resposta” |
| 2.5.4 Atuação por movimento | A | Não se aplica | inspeção | Não usa sensores de movimento |
| 3.1.1 Idioma da página | A | Atende | axe | `<html lang="pt">` |
| 3.2.1 Em foco | A | Atende | script (Tab) | Receber foco não muda o contexto |
| 3.2.2 Em entrada | A | Atende | inspeção | Escolher uma opção só seleciona; envio com “Confirmar” |
| 3.2.6 Ajuda consistente | A | Atende | inspeção | Botões “Ajuda” e TitiA sempre na mesma posição |
| 3.3.1 Identificação de erro | A | Atende | inspeção | Mensagens em `role="alert"` |
| 3.3.2 Rótulos ou instruções | A | Atende | axe | Todos os campos têm rótulo |
| 3.3.7 Entrada redundante | A | Atende | inspeção | Cadastro em duas etapas mantém os dados já digitados |
| 4.1.1 Análise | A | Obsoleto na 2.2 | — | Sempre satisfeito (W3C, 2023) |
| 4.1.2 Nome, função, valor | A | Atende | axe, WAVE | `aria-pressed`, `aria-modal`, `aria-labelledby`; aninhamento interativo corrigido |
| 1.2.4 Legendas (ao vivo) | AA | Não se aplica | inspeção | Sem mídia ao vivo |
| 1.2.5 Audiodescrição (pré-gravado) | AA | Não se aplica | inspeção | Sem vídeo |
| 1.3.4 Orientação | AA | Atende | inspeção | Layout responsivo sem trava de orientação |
| 1.3.5 Identificar a finalidade da entrada | AA | Atende | inspeção | `autocomplete` com `name`, `email`, `current-password`, `new-password` |
| 1.4.3 Contraste (mínimo) | AA | Atende | axe, script (modelo WAVE), WAVE | 0 ocorrências nas 39 telas, inclusive nos temas creme, calmo e alto contraste |
| 1.4.4 Redimensionar texto | AA | Atende | inspeção | Tamanhos em `rem`; zoom não bloqueado no viewport |
| 1.4.5 Imagens de texto | AA | Atende | inspeção | Só o logotipo, que é exceção |
| 1.4.10 Refluxo | AA | Atende | E2E | Exercícios em 360 px sem rolagem horizontal (`e2e/progression`) |
| 1.4.11 Contraste não textual | AA | Atende | script | Fronteira de campos e indicador de foco com pelo menos 3:1 |
| 1.4.12 Espaçamento de texto | AA | Atende | script | Nenhum texto cortado com o espaçamento do critério |
| 1.4.13 Conteúdo em foco ou passagem do cursor | AA | Atende | inspeção | Só `title` nativo, sem conteúdo adicional |
| 2.4.5 Várias formas | AA | Atende | inspeção | Criança: mapa com todas as ilhas e exercícios, botão “Jogar” (próximo recomendado) e TitiA. Profissional: lista de alunos e abas |
| 2.4.6 Cabeçalhos e rótulos | AA | Atende | axe, inspeção | Títulos descrevem cada seção |
| 2.4.7 Foco visível | AA | Atende | script (Tab) | Contorno de 3 px com pelo menos 3:1 em todos os controles percorridos |
| 2.4.11 Foco não encoberto (mínimo) | AA | Atende | script (Tab) | Nenhum controle focado fica totalmente coberto |
| 2.5.7 Movimentos de arrastar | AA | Atende | E2E | Arrastar → tocar a peça e tocar o destino |
| 2.5.8 Tamanho do alvo (mínimo) | AA | Atende | inspeção | Controles principais com 44 px (`min-h-11`) ou mais |
| 3.1.2 Idioma das partes | AA | Não se aplica | inspeção | Conteúdo só em português |
| 3.2.3 Navegação consistente | AA | Atende | inspeção | Mesmo cabeçalho e controles em todas as telas do perfil |
| 3.2.4 Identificação consistente | AA | Atende | inspeção | Mesmo pictograma e nome para a mesma função |
| 3.3.3 Sugestão de erro | AA | Atende | inspeção | “N caracteres faltam”; conta já existente orienta a entrar |
| 3.3.4 Prevenção de erros (legais, financeiros, dados) | AA | Atende | inspeção | Termo LGPD confirmado explicitamente; “Sair da atividade?” pede confirmação |
| 3.3.8 Autenticação acessível (mínimo) | AA | Atende | inspeção | Gerenciador de senhas liberado (`autocomplete`), “Mostrar senha”, login com Google |
| 4.1.3 Mensagens de status | AA | Atende | inspeção | `role="status"` e `aria-live="polite"` nas mensagens |

## Tabela GAIA (G01–G28)

[LITERATURA]

Títulos e exigências conforme as páginas de gaia.wiki.br, lidas em 20/11/2026.

[PROPOSTA CONTA COMIGO]

| ID | Recomendação | Categoria | Situação | Evidência no Conta Comigo |
|---|---|---|---|---|
| G01 | Cores | Vocabulário visual e textual | Atende | Cor nunca é o único sinal; contraste validado (1.4.3, 1.4.11) |
| G02 | Textos | Vocabulário visual e textual | Atende | Frases curtas e diretas na área da criança. Siglas técnicas (BNCC, BKT, ADE) só no painel do profissional |
| G03 | Legibilidade | Vocabulário visual e textual | Atende | Fonte sem serifa (Inter, ou Atkinson Hyperlegible e Lexend na engrenagem); sem caixa-alta nem letras espaçadas; linhas de até 80 caracteres medidas automaticamente nas telas da criança |
| G04 | Compatibilidade com mundo real | Vocabulário visual e textual | Atende | Pictogramas ARASAAC de objetos e ações concretas; toque como gesto natural |
| G05 | Customização visual | Customização | Atende | Engrenagem “Ajustes” na tela de exercício: tamanho das figuras, tamanho de botões e textos, letra (padrão, Atkinson Hyperlegible, Lexend) e cores (colorido, creme, calmo, alto contraste); som, voz, volume e velocidade da fala pelo profissional |
| G06 | Customização informacional | Customização | Atende | Botões com figura e palavra, só figura ou só palavra (o nome acessível não muda); informação em texto, pictograma e voz; som e música opcionais |
| G07 | Interfaces flexíveis | Customização | Atende | Profissional define quantidade de elementos simultâneos e tipos de exercício indisponíveis; progresso salvo; ilha escolhida livremente |
| G08 | Modo de leitura | Customização | Atende | “Modo leitura” na engrenagem: só o enunciado e as opções, em letra grande e cores calmas, com botão “Ouvir”; relatório do profissional imprimível |
| G09 | Eliminar distrações | Engajamento | Atende | Animações desligáveis, `prefers-reduced-motion`, modo de baixa estimulação; animação decorativa com no máximo 5 s |
| G10 | Interface minimalista | Engajamento | Atende | Um exercício por tela, uma ação por vez |
| G11 | Organização visual | Engajamento | Atende | Cartões espaçados; elementos relacionados agrupados |
| G12 | Forneça instruções | Engajamento | Atende | “TitiA explica para você” em cada exercício; menu “Ajuda / Como jogar” |
| G13 | Múltiplos formatos | Representações redundantes | Atende | Enunciado em texto, pictograma e voz |
| G14 | Equivalentes textuais | Representações redundantes | Atende | Pictogramas com rótulo visível e `alt` |
| G15 | Legendas | Representações redundantes | Atende | TitiA lê instruções e opções em voz alta, sempre com o texto na tela |
| G16 | Múltiplas mídias | Multimídia | Atende | Avatar TitiA; ícone, palavra e som juntos |
| G17 | Ampliação de imagens | Multimídia | Atende | Pictogramas ampliáveis até 2× na engrenagem, com refluxo do layout (CSS `zoom`); pictogramas ARASAAC em alta resolução |
| G18 | Evite sons perturbadores | Multimídia | Atende | Tons curtos e de volume baixo; música calma opcional; efeitos desligáveis |
| G19 | Instruções de interação | Visibilidade do estado do sistema | Atende | Erros imediatos em linguagem simples; “Confirmar” desabilitado até haver escolha |
| G20 | Reverter ações | Visibilidade do estado do sistema | Atende | “Sair da atividade?” com confirmação; voltar ao mapa; “Quero outro” |
| G21 | Número de tentativas | Visibilidade do estado do sistema | Atende | Resposta revelada a partir da 5ª tentativa errada, com opção de tentar de novo (`activities.service.ts`) |
| G22 | Consistência | Reconhecimento e previsibilidade | Atende | Mesmos controles e comportamentos em todas as telas; links para nova aba sinalizados |
| G23 | Aparência clicável | Reconhecimento e previsibilidade | Atende | Botões grandes (44 px ou mais) com borda ou sombra |
| G24 | Feedback de interação | Reconhecimento e previsibilidade | Atende | Feedback imediato ao lado do elemento; estado `disabled` visível |
| G25 | Navegação simples | Navegabilidade | Atende | Navegação consistente; “Atividade X de Y” e barras de progresso; sair, mapa e ajuda sempre disponíveis |
| G26 | Evitar redirecionamentos | Navegabilidade | Atende | Sem redirecionamento automático nem limite de tempo nas tarefas |
| G27 | Confirmação de ações | Resposta às ações | Atende | Feedback imediato em texto, som e imagem, sem imagens de emoção negativa |
| G28 | Sensibilidade adequada | Interação com tela sensível ao toque | Atende | Resposta só vale após “Confirmar”; “Quero outro” exige segurar 0,6 s (configurável pelo profissional; teclado ativa na hora); toque duplo não envia a resposta duas vezes; `touch-action: manipulation`; “Encerrar atendimento” pede confirmação |

## Referências

[LITERATURA]

- W3C. *Web Content Accessibility Guidelines (WCAG) 2.2*. W3C Recommendation, 5 out. 2023. Disponível em: https://www.w3.org/TR/WCAG22/.
- W3C. *Understanding WCAG 2.2*. Disponível em: https://www.w3.org/WAI/WCAG22/Understanding/.
- PAGANI, T. *GAIA: Guia de Acessibilidade de Interfaces Web com foco em aspectos do Autismo*. Disponível em: https://gaia.wiki.br/. Acesso em: 20 nov. 2026. (Conferir ano e dados da dissertação de origem.)
- DEQUE SYSTEMS. *axe-core* 4.12. Disponível em: https://github.com/dequelabs/axe-core.
- WEBAIM. *WAVE Web Accessibility Evaluation Tools*. Disponível em: https://wave.webaim.org/.

## Texto potencial para a dissertação

### Metodologia

A acessibilidade do Conta Comigo foi avaliada em relação aos critérios de nível A e AA das WCAG 2.2 (W3C, 2023) e às 28 recomendações do GAIA. A avaliação combinou quatro fontes de evidência. A primeira foi a execução automatizada do axe-core 4.12 por meio do Playwright em 39 estados de tela da aplicação, cobrindo os perfis criança, responsável e profissional, os modais e os oito formatos de exercício, com dados simulados derivados das seeds do sistema. A segunda foram verificações complementares implementadas no mesmo script para critérios que o axe não automatiza: contraste no modelo do WAVE, fronteira de campos, indicador e visibilidade do foco por navegação real com Tab, espaçamento de texto e título por página. A terceira foi a extensão WAVE da WebAIM, aplicada em produção antes e depois das correções. A quarta foi a inspeção manual para critérios que dependem de julgamento.

### Decisão de projeto

As correções foram aplicadas de forma sistemática, e não pontual. Um codemod elevou cada classe de cor ao primeiro tom da paleta que satisfaz a razão de contraste exigida. Todo gradiente passou a ter uma cor sólida de reserva, que é a cor usada por ferramentas como o WAVE e exigida pela WCAG quando há imagem de fundo. O script de auditoria foi mantido no repositório para que qualquer alteração futura da interface possa ser verificada novamente com um único comando.

### Limitações

Ferramentas automáticas detectam apenas parte das barreiras de acessibilidade. Os critérios marcados como verificados por inspeção dependem do julgamento do avaliador. A auditoria automatizada usa dados simulados e uma única resolução de desktop (1280 × 900 px); o refluxo foi verificado em 360 px nos testes de exercícios, e não nos 320 px de referência do critério 1.4.10. O conteúdo da TitiA carregado em iframe é uma aplicação separada e não foi avaliado. As preferências de exibição escolhidas pela criança na engrenagem ficam salvas no aparelho, e não no perfil; em outro dispositivo elas precisam ser escolhidas de novo. Não houve avaliação com pessoas autistas nem com usuários de leitores de tela.

### Evidência necessária no experimento

- Capturas do WAVE em produção, depois do deploy, para cada tela da tabela inicial, com erros, erros de contraste, alertas e AIM score.
- Saída de `npm run test:a11y` com 39 de 39 telas sem violações, anexada com a data e o commit.
- Teste com leitor de tela (NVDA ou VoiceOver) e navegação somente por teclado em uma sessão completa de exercício.
- Observação de uso com crianças autistas e profissionais para os itens do GAIA que dependem de percepção, como G09, G11 e G18.

[HIPÓTESE A VALIDAR]

Uma interface que satisfaz os critérios WCAG 2.2 AA e as recomendações do GAIA reduz barreiras de uso para crianças autistas. Essa hipótese depende da observação de uso descrita acima e não decorre apenas da conformidade técnica.
