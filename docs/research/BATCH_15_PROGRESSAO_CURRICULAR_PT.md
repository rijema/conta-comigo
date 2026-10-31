# Batch 15 — Progressão curricular do 2º ao 5º ano (exercícios, BNCC e pictogramas)

## Problema observado

[PROPOSTA CONTA COMIGO]

Em outubro de 2026 a fonoaudióloga parceira relatou que as crianças (6 a 10 anos, 1º ao 5º ano, com TEA) achavam muitos exercícios "bobos para a idade" e repetitivos. A contagem do catálogo confirmou o relato: 173 de 194 exercícios ativos (89%) eram de 1º ano; 75 deles só em EF01MA01–EF01MA03. Havia 6 exercícios de 2º ano, 10 de 3º, 3 de 4º e 2 de 5º.

## O que foi feito

[DECISÃO DE ENGENHARIA]

Tudo é **aditivo**: nenhum exercício, tentativa, ciclo ou histórico foi apagado. Os registros existentes continuam identificados por título ou `semantic.structureId`.

| Item | Antes | Depois |
|---|---|---|
| Exercícios 2º–5º ano | 21 | 106 (85 novos) |
| Ilhas com exercícios de 3º, 4º e 5º ano | parcial | todas, com ≥ 4 por ano |
| Habilidades BNCC na ontologia | 6 | 75 |
| Pré-requisitos formais | 0 | 11 |

Distribuição final (exercícios ativos por ilha e ano):

| Ilha | 1º | 2º | 3º | 4º | 5º |
|---|---|---|---|---|---|
| Estrelinhas (números) | 45 | 5 | 5 | 5 | 5 |
| Gigantes e Formiguinhas (comparar e medir) | 45 | 2 | 4 | 5 | 4 |
| Pomar (somar e multiplicar) | 19 | 4 | 6 | 5 | 4 |
| Biscoitos (tirar e repartir) | 17 | 2 | 5 | 5 | 5 |
| Arco-Íris (padrões e igualdades) | 11 | 2 | 4 | 4 | 4 |
| Castelo das Formas (formas e posições) | 36 | 3 | 10 | 4 | 4 |

O 1º ano continua numeroso porque nada foi removido; quem equilibra o que a criança vê é o motor (ver Batch 16).

## Fundamentação de cada exercício

[LITERATURA]

1. **Currículo.** Cada exercício declara uma única habilidade em `bnccSkills[0]`, cujo texto oficial descreve a tarefa. O texto foi extraído do documento oficial (BRASIL, 2018, p. 280–299) e está versionado em `backend/src/database/seeds/data/bncc-matematica-anos-iniciais.json` (126 habilidades, 1º ao 5º ano). Não há descrição escrita "de memória".
2. **Princípios de desenho** (`content.semantic.designBasis`), cada um com respaldo na literatura:
   - `concrete_representational_abstract`: sequência concreto → pictórico → simbólico (WITZEL; MERCER; MILLER, 2003; FUCHS et al., 2021, recomendação 3).
   - `schema_based_word_problem`: problemas com estrutura explícita (juntar, separar, comparar, grupos iguais), com evidência específica para estudantes com autismo (ROOT et al., 2017; FUCHS et al., 2021, recomendação 4).
   - `number_line_magnitude`: reta numérica como representação de magnitude, inclusive para frações (SIEGLER et al., 2010; FUCHS et al., 2021, recomendação 5).
   - `visual_support`: suporte visual, prática baseada em evidência para autismo (STEINBRENNER et al., 2020).
   - `rectangular_array`: disposição retangular e grupos iguais para multiplicação, que é o próprio texto da BNCC (EF03MA07, EF04MA06).
   - `learning_trajectory`: comparação direta antes da medida com unidade (CLEMENTS; SARAMA, 2014).

[DECISÃO DE ENGENHARIA]

- **Formatos.** Só formatos que renderizam o conteúdo real: `quiz` com opções, `drag_drop` com `correctOrder` (ordenação) e `categorize` com grupos. Outros tipos podem cair em minigames genéricos que ignoram o conteúdo (ver `activity-renderer.tsx`).
- **Voz da TitiA.** Cada exercício traz `spokenQuestion`, `spokenSteps`, `spokenHint` e falas de acerto e de nova tentativa, sem símbolos que sintetizadores leem mal ("1/4" vira "um quarto", "R$ 7" vira "sete reais").
- **Dificuldade.** Cada ano mistura `easy`, `medium` e `hard`; o motor sobe e desce de nível pelas regras D1–D3.

## Pictogramas ARASAAC

[DECISÃO DE ENGENHARIA]

Todos os IDs foram verificados em `static.arasaac.org` e inspecionados visualmente antes do uso. A auditoria encontrou:

- **28 IDs inexistentes** (HTTP 404) já em uso, entre eles a borboleta da TitiA (15532), "estrela" (17331) e "números" (23190), além dos ícones das ilhas gravados no banco ("23190", "61042", "2000"), que apareciam como "□" no mapa;
- **2 IDs com imagem errada**: "números" 6198 (um raio-X) e "planta" 16165 (uma pessoa junto a uma porta);
- **IDs reaproveitados com sentidos diferentes** (17331 para "estrelas" e para "quadrado"; 23191 para "cubo" e para "cone"), corrigidos exercício a exercício;
- moedas e cédulas do ARASAAC representam **euros**: valores em reais são mostrados em texto;
- o ID 4761 tem palavra-chave "trapézio", mas o desenho é um **paralelogramo**, e só é usado como paralelogramo;
- a busca automática por "triângulo" retornava o instrumento musical (2604); o conceito foi fixado na forma geométrica (4763).

Testes impedem a volta desses problemas (`frontend/tests/arasaac-verified-ids.test.mjs`).

## Acessibilidade (WCAG 2.2)

[DECISÃO DE ENGENHARIA]

- Arrastar sempre tem alternativa de toque e de teclado (2.5.7); alvos com no mínimo 24 px (2.5.8).
- Agrupar: os grupos ficam focáveis (`aria-disabled` em vez de `disabled`), têm nome acessível, e uma região `aria-live` anuncia cada colocação (2.1.1, 4.1.2, 4.1.3); foco visível (2.4.7).
- Mapa das ilhas: texto branco sobre tons 700 (contraste ≥ 4,5:1, 1.4.3); pictogramas decorativos com `aria-hidden`; botões "Começar" nomeados pelo exercício (2.4.6). Os códigos BNCC saíram da tela da criança (cada ilha passou a cobrir mais de 20 códigos) e continuam no painel do profissional.
- Verificação automatizada em navegador real (Playwright, `frontend/e2e/progression`): os 85 exercícios em celular (360 px) e tablet (820 px) com toque, e no desktop com arrasto real do mouse. Resultado: 196 renderizações sem rolagem horizontal, sem imagem quebrada e com a resposta que o backend aceita.

## Revisão profissional

[HIPÓTESE A VALIDAR]

Os exercícios estão marcados `reviewStatus: needs_professional_review`. A revisão pode ser feita na sandbox com o link `/pt/dev/k7x9-sandbox?set=progressao` (filtrável por ano com `&ano=3`, `&ano=4` etc.).

## Referências

[LITERATURA]

- BRASIL. Ministério da Educação. *Base Nacional Comum Curricular*. Brasília: MEC, 2018.
- CLEMENTS, D. H.; SARAMA, J. *Learning and Teaching Early Math: The Learning Trajectories Approach*. 2. ed. New York: Routledge, 2014.
- FUCHS, L. S. et al. *Assisting Students Struggling with Mathematics: Intervention in the Elementary Grades* (WWC 2021006). Washington, DC: Institute of Education Sciences, 2021.
- ROOT, J. R.; BROWDER, D. M.; SAUNDERS, A. F.; LO, Y. Schema-based instruction with concrete and virtual manipulatives to teach problem solving to students with autism. *Remedial and Special Education*, v. 38, n. 1, p. 42–52, 2017.
- SIEGLER, R. et al. *Developing Effective Fractions Instruction for Kindergarten Through 8th Grade* (NCEE 2010-4039). Washington, DC: Institute of Education Sciences, 2010.
- STEINBRENNER, J. R. et al. *Evidence-Based Practices for Children, Youth, and Young Adults with Autism*. Chapel Hill: FPG Child Development Institute, UNC, 2020.
- WITZEL, B. S.; MERCER, C. D.; MILLER, M. D. Teaching algebra to students with learning difficulties: an investigation of an explicit instruction model. *Learning Disabilities Research & Practice*, v. 18, n. 2, p. 121–131, 2003.

## Texto potencial para a dissertação

### Metodologia

Para equilibrar o catálogo, foram autorados 85 exercícios de 2º a 5º ano, cada um vinculado a uma habilidade da BNCC cujo texto oficial foi extraído do documento do MEC e versionado no repositório. O desenho de cada exercício declara princípios com evidência na literatura de intervenção matemática e de autismo (CRA, instrução baseada em esquemas, reta numérica e suportes visuais). Os pictogramas ARASAAC foram verificados no servidor oficial e inspecionados visualmente; a renderização foi verificada automaticamente em navegador real em três tamanhos de tela.

### Decisão de projeto

A mudança foi aditiva para preservar a rastreabilidade longitudinal: nenhum exercício ou tentativa foi removido, e a exposição da criança ao conteúdo passou a ser regulada pelo motor de recomendação, e não pela exclusão de itens.

### Limitações

Os exercícios ainda não foram revisados por profissionais nem testados com crianças. Os princípios de desenho foram aplicados por autoria e não verificados empiricamente neste contexto. O catálogo continua com mais itens de 1º ano.

### Evidência necessária no experimento

Registrar, por ano escolar e ilha, a taxa de acerto, de pulo e de abandono dos novos exercícios; comparar a percepção de adequação à idade antes e depois (relato dos profissionais); e coletar a revisão profissional de cada exercício.
