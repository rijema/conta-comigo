# Batch 08 — Biblioteca ARASAAC e correspondência visual

## Implementação

[DECISÃO DE ENGENHARIA] O histórico da página `/arasaac` foi consultado antes da alteração. A versão anterior tinha uma barra de seções, cartões com palavra e descrição, seleção e leitura. A página atual e o modal reduzido do mapa divergiam dessa experiência. Um componente compartilhado agora atende a página inicial, a rota `/arasaac` e o mapa de ilhas. O modal usa o mecanismo de foco e fechamento existente.

[PROPOSTA CONTA COMIGO] A biblioteca oferece seções de números, pessoas, animais, alimentos, objetos, ações, emoções, lugares, matemática, símbolos, formas, cores, cotidiano, aprendizagem, educação, jogos e software. A seção selecionada consulta termos em português no catálogo ARASAAC; a busca livre consulta o mesmo serviço. Cada resultado usa o identificador e a palavra retornados pelo catálogo, com descrição quando disponível. A interface preserva a palavra escrita, texto alternativo e atribuição ARASAAC.

[DECISÃO DE ENGENHARIA] O serviço `arasaacCatalog` concentra seções, busca, cache em memória, seleção registrada e URL por meio do registro de pictogramas existente. A rota interna consulta a API pública em português, restringe entrada e campos retornados e usa revalidação de um dia. Não armazena a busca da criança nem adiciona dados ao banco. O componente de pictograma só procura uma imagem para conceitos antigos sem ID quando a palavra retornada corresponde exatamente ao rótulo local normalizado. Na ausência de correspondência ou de acesso ao serviço, mantém o símbolo e o texto acessíveis.

[DECISÃO DE ENGENHARIA] Seleção e abertura continuam emitindo os eventos visuais existentes. A fala usa o serviço TitiA e só ocorre quando a preferência de voz local está ativa. Para criança autenticada, exige também `uiPreferences.voiceEnabled === true` no perfil, opção disponível no painel profissional. A biblioteca autenticada oferece ligação para as ilhas sem registrar uma lista nova de favoritos ou histórico individual.

## Limitações e validação

[HIPÓTESE A VALIDAR] A ampliação da biblioteca pode melhorar a compreensão visual, mas adequação semântica, legibilidade e sensibilidade sensorial dependem de avaliação com profissionais e participantes. A existência de uma imagem ou palavra no ARASAAC não valida automaticamente seu uso em uma questão específica.

[PARÂMETRO EXPERIMENTAL] Prazo de cache de 24 horas, termos iniciais por seção e número máximo de resultados são parâmetros de engenharia a revisar segundo uso e disponibilidade do serviço.

[LITERATURA] A [interface pública de busca do ARASAAC](https://arasaac.org/pictograms/search) e sua taxonomia foram usadas como referência de integração. Nenhum ID novo foi atribuído manualmente a palavras sem confirmação do catálogo.

[DECISÃO DE ENGENHARIA] A rede do ambiente de desenvolvimento não conseguiu resolver `api.arasaac.org`. A compilação, os testes e o contrato de URL foram verificados localmente, mas a resposta real do serviço e a associação visual de cada resultado ainda precisam de teste integrado com rede. Conceitos com ID fixo no registro antigo ainda requerem auditoria de rótulo e imagem item a item; a busca exata introduzida neste lote cobre apenas conceitos sem ID.

## Texto potencial para a dissertação

### Metodologia

[PROPOSTA CONTA COMIGO] Descrever a seleção exploratória de pictogramas, a busca em português, a apresentação escrita e a opção de leitura por TitiA.

### Decisão de projeto

[DECISÃO DE ENGENHARIA] Reutilizar o registro, os eventos e o TTS existentes, com um modal e um serviço de catálogo compartilhados.

### Limitações

[HIPÓTESE A VALIDAR] A correspondência lexical exata e a taxonomia do catálogo não substituem revisão pedagógica de cada imagem nos exercícios.

### Evidência necessária no experimento

[PARÂMETRO EXPERIMENTAL] Revisar pares palavra–imagem, clareza da descrição, falhas de busca e preferência de fala com profissionais e crianças, preservando a análise dos eventos já registrados.
