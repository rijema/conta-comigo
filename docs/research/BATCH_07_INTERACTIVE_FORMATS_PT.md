# Batch 07 — Interações visuais e cobertura do mapa

## Diagnóstico e implementação

[DECISÃO DE ENGENHARIA] O catálogo anterior já tinha contagem, seleção de alternativas, ordenação por arraste e seis famílias parametrizadas. Várias entradas chamadas de formatos eram perguntas textuais com o mesmo mecanismo de escolha. Este lote reutiliza o renderer, o validador de respostas, o seed idempotente, o registro ARASAAC, o fluxo de tentativas e os eventos analíticos existentes.

[PROPOSTA CONTA COMIGO] Foram adicionadas 26 famílias autorais com pelo menos dois rótulos de dificuldade por família. Elas incluem escolha com grupos de pictogramas, correspondência por arraste em duas direções, agrupamento em categorias, montagem manipulável de quantidade e cenas espaciais. O seed inclui 12 cenas para acima, abaixo, dentro, fora, esquerda e direita, com dois objetos de referência. A interação `categorize` usa a ordem dos grupos escolhidos como resposta; `quantity_builder` usa um número. Ambas são validadas no servidor.

[DECISÃO DE ENGENHARIA] As questões novas usam identificadores do registro de pictogramas com IDs ARASAAC cadastrados. O carregamento remoto pode falhar; o componente existente oferece símbolo alternativo e texto acessível. Os exercícios legados ainda contêm emojis ou conceitos sem ID ARASAAC, portanto a exigência de ARASAAC para todo o catálogo histórico continua pendente.

## Mapa de ilhas e BNCC

[DECISÃO DE ENGENHARIA] Os exercícios novos entram nas ilhas pelo mesmo `getActivityTree` usado antes. Quando não existe BNCC validada, o agrupamento aparece como exploração e o badge da atividade mostra “Sem vínculo BNCC validado”. Atividades com várias habilidades aparecem em cada ilha correspondente e mostram todos os códigos durante o exercício. Os códigos de duas questões de formas foram corrigidos para EF01MA14; duas questões de subtração contextual passaram para EF01MA08. A correção do registro existente ocorre no seed idempotente, sem alterar tentativas históricas.

[HIPÓTESE A VALIDAR] A diversidade de interação e de representação poderá reduzir repetição percebida, mas isso requer observação experimental. Dois níveis de um mesmo formato indicam progressão de conteúdo autoral e não comprovam uma escala psicométrica.

[PARÂMETRO EXPERIMENTAL] Os rótulos `very_easy` e `medium`, as quantidades de itens e os pontos são parâmetros de autoria; precisam de calibração com os dados da pesquisa.

## Limitações de cobertura

[DECISÃO DE ENGENHARIA] Há cobertura operacional inicial para contagem visual, correspondência número e quantidade nas duas direções, ordenação, sequência, antes/depois, comparação, agrupamento por quantidade, forma, tamanho aparente e cor, padrões, forma e objeto, montagem de quantidade, operações visuais, contexto simples, escolha de operação, item diferente, conjuntos equivalentes, correspondência um a um e seis posições espaciais. Grandezas inclui comparação de comprimentos por unidades visuais e recipientes vazios, parcialmente cheios e cheios. Pesado/leve ainda não tem representação pedagógica verificável. Classificação por tamanho usa uma escala visual simples que exige revisão de acessibilidade. Algumas famílias têm apenas uma estrutura cognitiva em duas magnitudes, e requerem autoria adicional antes de alegar diversidade substancial por formato.

[LITERATURA] Nenhuma inferência causal sobre aprendizagem ou validação curricular é atribuída a este lote. Os vínculos curriculares usados vêm do seed BNCC existente; padrões, posição, tamanho e cor permanecem sem código quando não existe mapeamento local validado.

## Texto potencial para a dissertação

### Metodologia

[PROPOSTA CONTA COMIGO] Descrever as famílias autorais, os níveis configurados, a validação no servidor e a exposição pelo mapa de ilhas.

### Decisão de projeto

[DECISÃO DE ENGENHARIA] Preservar o fluxo analítico e reutilizar o contrato JSON de atividades para novas interações.

### Limitações

[HIPÓTESE A VALIDAR] A cobertura inicial não demonstra adequação clínica, equivalência entre formatos nem redução efetiva de repetição.

### Evidência necessária no experimento

[PARÂMETRO EXPERIMENTAL] Medir conclusão, tentativas, dicas, tempo, skips e erros por formato e por nível; revisar pictogramas e relações BNCC com especialistas.
