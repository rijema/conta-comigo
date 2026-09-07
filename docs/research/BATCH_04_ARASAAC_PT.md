# Batch 04 — Comunicação visual ARASAAC

## 1. Objetivo

[PROPOSTA CONTA COMIGO] Esta etapa padroniza a comunicação visual voltada à criança sem redesenhar a experiência. O resultado combina texto legível, pictograma quando há correspondência semântica e descrição alternativa. A seção exploratória anterior foi restaurada com o nome **Aprender com a TitiA**.

## 2. Fundamentação e limites da evidência

[LITERATURA] Os termos oficiais do ARASAAC informam que os símbolos pictográficos pertencem ao Governo de Aragão, foram criados por Sergio Palao e são distribuídos sob CC BY-NC-SA. A atribuição indicada pelo próprio portal identifica autor, origem, licença e proprietário: [ARASAAC — Terms of use](https://arasaac.org/terms-of-use).

[HIPÓTESE A VALIDAR] A combinação texto + pictograma + fala opcional pode apoiar a compreensão de ações e conceitos para parte das crianças. Esta hipótese não implica benefício uniforme, não substitui avaliação de acessibilidade com usuários e não permite concluir que uma preferência visual decorra de diagnóstico ou nível de suporte.

## 3. Categorias e vocabulário

[DECISÃO DE ENGENHARIA] `PictogramConcept` usa identificadores semânticos estáveis. `PictogramRegistry` é a única fonte de IDs e URLs ARASAAC. O registro contém:

- navegação: voltar, próximo, início, começar, terminar, ajuda, repetir, ouvir, pausar, tentar novamente e mudar atividade;
- estado: sim, não, ok, correto, incorreto, muito bem, concluído e esperar;
- matemática: números, adição, subtração, igual, mais, menos, contar, comparar, ordenar, sequência, padrão, forma, cor e tamanho;
- ações: arrastar, escolher, tocar, ouvir, olhar, combinar, completar, mover e apontar;
- comunicação: não entendi, outra atividade, ouvir novamente e me ajude;
- números: valores de 0 a 20, por meio de geração extensível do registro.

[DECISÃO DE ENGENHARIA] Identificadores legados introduzidos no Batch 03 continuam resolvidos pelo mesmo registro para não invalidar conteúdos existentes.

## 4. Sistema de design

[DECISÃO DE ENGENHARIA] `ArasaacPictogram` resolve imagem, rótulo e alternativa pelo registro. O componente mostra texto por padrão e possui fallback simbólico quando não existe ID ou quando a imagem remota falha. Componentes React não armazenam IDs numéricos nem montam URLs da CDN.

[PROPOSTA CONTA COMIGO] A regra de comunicação infantil é:

1. manter um rótulo textual visível;
2. acrescentar pictograma quando semanticamente adequado;
3. oferecer ação de fala opcional;
4. manter texto alternativo e fallback para pessoas não leitoras ou quando a imagem não estiver disponível.

## 5. Acessibilidade

[DECISÃO DE ENGENHARIA] A imagem usa `alt` específico, o fallback expõe nome acessível e botões preservam rótulos. A síntese de fala usa `pt-BR` quando a API do navegador está disponível; a indisponibilidade dessa API não impede navegação ou leitura textual.

[LIMITAÇÃO] A presença de um pictograma não garante compreensão. Alt, símbolo, fala e rótulo precisam de avaliação com crianças, famílias e profissionais. Não foi implementada personalização automática por diagnóstico, perfil sensorial ou nível de suporte.

## 6. Atribuição e licença

[LITERATURA] A aplicação apresenta a atribuição: “Autor dos pictogramas: Sergio Palao. Origem: ARASAAC. Licença: CC BY-NC-SA. Proprietário: Governo de Aragão (Espanha).” Essa forma segue a orientação publicada nos [termos oficiais](https://arasaac.org/terms-of-use).

[DECISÃO DE ENGENHARIA] Apenas IDs selecionados são registrados e carregados sob demanda da CDN pública. O catálogo completo não é baixado nem incorporado ao repositório.

## 7. Uso em exercícios

[PROPOSTA CONTA COMIGO] O renderizador das famílias paramétricas usa `ArasaacPictogram` para opções, pistas e apoios visuais. O conteúdo continua referenciando apenas `pictogramConceptId`, preservando a separação entre semântica do exercício e endereço do recurso visual.

[LIMITAÇÃO] Nem todo conceito tem um pictograma selecionado. Nesses casos, o fallback é deliberado; uma associação nova deve passar por revisão semântica, e não ser escolhida apenas por semelhança de palavra.

## 8. Biblioteca visual “Aprender com a TitiA”

[PROPOSTA CONTA COMIGO] A biblioteca contém Números, Operações Matemáticas, Formas Geométricas, Cores, Verbos de Aprender e Jogos e Atividades. Cada item inclui conceito registrado, rótulo, alternativa acessível, fala e exemplo opcional.

[DECISÃO DE ENGENHARIA] A constante `VISUAL_LIBRARY_IS_ADAPTIVE` é falsa. Abrir ou explorar essa tela não equivale a receber, iniciar ou concluir uma recomendação adaptativa.

## 9. Learning Analytics e privacidade

[DECISÃO DE ENGENHARIA] Foram acrescentados três tipos de evento append-only: `pictogram_opened`, `visual_library_opened` e `visual_library_item_selected`. O cliente reutiliza um `sessionId` guardado em `sessionStorage`, envia sem bloquear a interação e registra falhas no console. O backend deriva `studentId` do token autenticado.

[DECISÃO DE ENGENHARIA] Os metadados aceitos são somente identificador semântico do pictograma e categoria. Não são enviados texto livre da criança, texto falado, resposta de atividade nem conteúdo do item.

[LIMITAÇÃO] Esses eventos medem interações observáveis. Eles não demonstram compreensão, preferência, aprendizagem, engajamento psicológico ou eficácia do pictograma. Retenção, acesso e uso analítico devem seguir as regras de privacidade do projeto e a minimização de dados.

## 10. Parâmetros e decisões experimentais

[PARÂMETRO EXPERIMENTAL] Nenhum limiar adaptativo foi criado. A taxa de fala `0,85` preserva o comportamento já empregado pela interface e deve ser tratada como configuração de apresentação sujeita a validação, não como parâmetro clínico.

[HIPÓTESE A VALIDAR] Futuras avaliações podem comparar compreensão de comandos, necessidade de repetição e preferência individual com e sem apoio pictográfico. Os eventos deste batch, isoladamente, não validam essa hipótese.

## 11. Limitações

[LIMITAÇÃO] O lote não integra a API de busca do ARASAAC em tempo de execução, não implementa catálogo completo, cache offline, gravações humanas, personalização de pictogramas, painel analítico ou recomendação baseada no uso da biblioteca. Alguns conceitos usam fallback até que um pictograma adequado seja revisado.

## Texto potencial para a dissertação

### Metodologia

Foi criado um vocabulário central de conceitos pictográficos e uma camada única de apresentação. A biblioteca visual e os componentes de atividade passaram a resolver recursos por identificadores semânticos, enquanto interações selecionadas foram registradas como eventos append-only com metadados minimizados.

### Decisão de projeto

O sistema preserva texto junto ao pictograma, mantém fallback acessível, carrega somente recursos selecionados e separa a biblioteca exploratória do mecanismo de recomendação adaptativa.

### Limitações

A implementação técnica não constitui evidência de benefício educacional. A adequação semântica dos pictogramas, a fala sintetizada e a compreensão das crianças exigem validação contextual e profissional.

### Evidência necessária no experimento

São necessários testes de usabilidade e acessibilidade com perfis diversos, medidas de compreensão de comandos, registros de solicitações de repetição e avaliação profissional das associações entre conceito, rótulo e pictograma.
