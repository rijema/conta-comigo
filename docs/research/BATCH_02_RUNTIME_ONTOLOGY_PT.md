# Batch 02.3 — Ontologia formal no runtime

## Estado anterior

[DECISÃO DE ENGENHARIA] O runtime possuía dois mecanismos procedurais inspirados na LASDONT: `OntologyService`, com um grafo JSON que não participava da seleção, e `OntologyReasonerService`, usado pelo ADE para sugerir modalidade. A escolha final filtrava dificuldade/modalidade e selecionava aleatoriamente. O arquivo formal `contacomigo.owl` era validado por testes, mas não era carregado em produção.

[LIMITAÇÃO] O serviço Python ainda contém um endpoint de recomendação marcado como deprecated e referências históricas à LASDONT. O fluxo NestJS inspecionado chama o Python para predições, mas a filtragem formal implementada neste batch ocorre no backend NestJS; o código Python legado não foi apresentado como inferência do novo OWL.

## Fluxo em runtime

[PROPOSTA CONTA COMIGO] Na inicialização do módulo NestJS, `OntologyService` localiza, lê e valida o RDF/XML uma única vez. Habilidades BNCC, relações com conceitos matemáticos, versão e relações de pré-requisito efetivamente declaradas são materializadas em memória. Em cada recomendação, o fluxo é:

`AdeService → ActivitiesService → RuntimeSemanticAdapter → OntologyService.getValidActivityCandidates → seleção sem ranking`.

O traço semântico é anexado ao `xaiLog` da mesma `AdeDecision`, com candidatos incluídos/excluídos, motivos, relações consultadas e versões.

## Materialização

[DECISÃO DE ENGENHARIA] O adaptador cria fatos efêmeros com estudante, habilidade-alvo, domínio proveniente de `StudentSkillState`, precisão recente agregada, tipos de evidência observada, restrições explícitas e metadados semânticos das atividades. Nenhum dado de criança ou sessão é escrito no OWL estático.

## O que a ontologia decide

[PROPOSTA CONTA COMIGO] A camada formal verifica se a habilidade-alvo existe, recupera os conceitos matemáticos ligados a ela e exclui atividades que não declaram a habilidade, não compartilham conceito matemático, não têm mapeamento semântico ou violam uma restrição explícita. Relações de pré-requisito somente são usadas quando estiverem efetivamente representadas como indivíduos válidos no OWL.

## O que a ontologia não decide

[DECISÃO DE ENGENHARIA] A camada não ranqueia candidatos, não calcula score híbrido, não atualiza BKT, não cria características do estudante e não converte ordem numérica BNCC em pré-requisito. A seleção entre candidatos já filtrados continua compatível com o comportamento existente.

## Fallback legado

[DECISÃO DE ENGENHARIA] Habilidade ausente ou conjunto formal vazio ativa o filtro legado de dificuldade/modalidade. O traço registra `fallbackUsed=true` e o motivo. Sinais procedurais LASDONT foram separados de `ontologyInferences`; somente relações extraídas do OWL formal são registradas como inferências semânticas.

## Limitações

[LIMITAÇÃO] O carregador materializa o subconjunto RDF/XML necessário à filtragem e não é um reasoner OWL-DL completo. A versão atual do OWL contém seis habilidades BNCC e nenhuma instância validada de `PrerequisiteRelation`; portanto, não há exclusão por pré-requisito nesta versão. Parte dos perfis de atividade continua marcada como parcial ou pendente de revisão.

[PARÂMETRO EXPERIMENTAL] Restrições duras futuras somente poderão ser ativadas a partir de evidência/configuração explícita; nenhum limiar foi introduzido neste batch.

[HIPÓTESE A VALIDAR] A utilidade pedagógica da filtragem formal e a cobertura dos mapeamentos deverão ser avaliadas com atividades e sessões reais antes de qualquer expansão para ranqueamento.

## Relação com a literatura

[LITERATURA] Este batch não acrescenta afirmações científicas nem novas referências; reutiliza exclusivamente a modelagem e as fontes já documentadas nos batches B2.2.

## Texto potencial para a dissertação

### Metodologia

A ontologia formal foi carregada e validada na inicialização do backend, com materialização em memória das relações curriculares necessárias. Estados dinâmicos foram convertidos em fatos efêmeros e confrontados com esse conhecimento durante a filtragem de atividades.

### Decisão de projeto

A integração foi inserida no serviço NestJS existente, antes da escolha final da atividade, sem criar microserviço ou alterar a fonte BKT de domínio. Cada operação produz um traço versionado e distingue execução formal de fallback procedural.

### Limitações

O mecanismo implementado não executa inferência OWL-DL geral e depende da cobertura dos mapeamentos formais e dos metadados das atividades. Ranqueamento e score híbrido permanecem fora deste batch.

### Evidência necessária no experimento

Devem ser medidos cobertura formal, frequência de fallback, motivos de exclusão e adequação pedagógica dos conjuntos candidatos produzidos.
