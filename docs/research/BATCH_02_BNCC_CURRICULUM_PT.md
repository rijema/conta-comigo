# Batch 02D — Camada Curricular BNCC

## 1. Objetivo

[PROPOSTA CONTA COMIGO] Este lote representa um recorte verificável de habilidades de Matemática do 1º ano da Base Nacional Comum Curricular (BNCC) e o conecta aos conceitos matemáticos já presentes na ontologia ContaComigo. A finalidade é permitir consultas sobre conceitos abordados, cobertura de atividades e lacunas, sem transformar ordem numérica dos códigos em progressão pedagógica.

[DECISÃO DE ENGENHARIA] A mudança é ontológica, documental e de testes. Não altera seeds, banco, atividades, BKT, recomendação ou interfaces.

## 2. Papel da BNCC na arquitetura semântica

[BNCC OFICIAL] [LITERATURA] A BNCC é o documento normativo nacional que define aprendizagens essenciais e orienta currículos e propostas pedagógicas ([MEC — A Base](https://basenacionalcomum.mec.gov.br/a-base)).

[DECISÃO DE ENGENHARIA] As responsabilidades permanecem separadas:

- OntoMathEdu/camada matemática: o que matematicamente está sendo aprendido;
- BNCC/camada curricular: qual habilidade curricular deve ser desenvolvida;
- learner model: evidências e estado contextual do aprendiz;
- activity model: qual intervenção educacional aborda habilidades e conceitos.

Uma `BNCCSkill` é uma `CurriculumSkill`, não uma `MathematicalConcept`. Ano escolar tampouco implica capacidade, mastery ou perfil do estudante.

## 3. Escopo curricular

[DECISÃO DE ENGENHARIA] Foram representadas EF01MA01, EF01MA03, EF01MA06, EF01MA07, EF01MA08 e EF01MA14. EF01MA01/03/06/07 são alegadas pelos seeds atuais. EF01MA08 e EF01MA14 foram incluídas porque suas descrições oficiais correspondem, respectivamente, aos conteúdos de subtração e figuras planas que hoje aparecem com códigos suspeitos.

[BNCC OFICIAL] EF01MA01–EF01MA08 pertencem à unidade temática Números e EF01MA14 pertence à Geometria no quadro oficial consultado. O recorte não equivale ao currículo completo do 1º ano.

### 3.1 Habilidades inspecionadas e não incluídas

| Código | Resultado da inspeção |
|---|---|
| EF01MA02 | Domínio de contagem potencialmente relevante, mas sem atividade que declare o código; revisar junto de EF01MA01/04. |
| EF01MA04 | Potencial correspondência com atividades atuais de contagem, hoje marcadas EF01MA01; não remapeada sem revisão. |
| EF01MA05 | Potencial correspondência com comparação de numerais, hoje marcada EF01MA03; não remapeada sem revisão. |
| EF01MA09 | Exige conceito mais específico para ordenação por atributos e não possui atividade declarada. |
| EF01MA10 | `SequencePatternConcept` é candidato, mas a atividade de sequência existente declara EF02MA01; requer revisão. |
| EF01MA11–12 | Localização e referência espacial não possuem conceitos/atividades específicos no escopo atual. |
| EF01MA13 | Existe no seed curricular, mas faltam atividades e conceitos de figuras espaciais suficientemente específicos. |

[LIMITAÇÃO] “Não incluída” significa fora desta primeira população verificável, não irrelevante ou removida da BNCC.

## 4. Habilidades oficiais

As descrições abaixo são transcritas do documento oficial do MEC, página 279 ([BNCC Educação Infantil e Ensino Fundamental](https://basenacionalcomum.mec.gov.br/images/BNCC_EI_EF_110518_versaofinal_site.pdf)).

| Código | Descrição oficial | Ano | Unidade temática | Suporte ContaComigo atual |
|---|---|---:|---|---|
| EF01MA01 | [BNCC OFICIAL] Utilizar números naturais como indicador de quantidade ou de ordem em diferentes situações cotidianas e reconhecer situações em que os números não indicam contagem nem ordem, mas sim código de identificação. | 1º | Números | Parcial; três atividades declaram o código. |
| EF01MA03 | [BNCC OFICIAL] Estimar e comparar quantidades de objetos de dois conjuntos (em torno de 20 elementos), por estimativa e/ou por correspondência (um a um, dois a dois) para indicar “tem mais”, “tem menos” ou “tem a mesma quantidade”. | 1º | Números | Precisa revisão; quatro atividades declaram o código, mas operam principalmente sobre numerais. |
| EF01MA06 | [BNCC OFICIAL] Construir fatos básicos da adição e utilizá-los em procedimentos de cálculo para resolver problemas. | 1º | Números | Parcial; quatro atividades declaram o código. |
| EF01MA07 | [BNCC OFICIAL] Compor e decompor número de até duas ordens, por meio de diferentes adições, com o suporte de material manipulável, contribuindo para a compreensão de características do sistema de numeração decimal e o desenvolvimento de estratégias de cálculo. | 1º | Números | Precisa revisão; as duas atividades declaradas são de subtração. |
| EF01MA08 | [BNCC OFICIAL] Resolver e elaborar problemas de adição e de subtração, envolvendo números de até dois algarismos, com os significados de juntar, acrescentar, separar e retirar, com o suporte de imagens e/ou material manipulável, utilizando estratégias e formas de registro pessoais. | 1º | Números | Sem atividade que declare o código. |
| EF01MA14 | [BNCC OFICIAL] Identificar e nomear figuras planas (círculo, quadrado, retângulo e triângulo) em desenhos apresentados em diferentes disposições ou em contornos de faces de sólidos geométricos. | 1º | Geometria | Sem atividade que declare o código; há duas atividades de figuras marcadas EF01MA15. |

## 5. BNCC → Mathematical Concept mapping

[ANÁLISE SEMÂNTICA CONTA COMIGO] Os vínculos abaixo são interpretações do ContaComigo baseadas no texto oficial. A BNCC não declara esses IRIs nem os alinhamentos OntoMathEdu.

| Habilidade | Conceito matemático | Justificativa do mapeamento | Fonte |
|---|---|---|---|
| EF01MA01 | `NumberConcept` | Números naturais usados como quantidade, ordem ou identificação. | [ANÁLISE SEMÂNTICA CONTA COMIGO] baseada na descrição oficial |
| EF01MA03 | `CountingConcept`; `ComparisonConcept` | Comparação de cardinalidade de conjuntos por estimativa/correspondência. | [ANÁLISE SEMÂNTICA CONTA COMIGO] baseada na descrição oficial |
| EF01MA06 | `AdditionConcept`; `EarlyProblemSolvingConcept` | Fatos básicos de adição usados em cálculo e resolução de problemas. | [ANÁLISE SEMÂNTICA CONTA COMIGO] baseada na descrição oficial |
| EF01MA07 | `NumberConcept`; `AdditionConcept` | Composição/decomposição numérica mediante diferentes adições. | [ANÁLISE SEMÂNTICA CONTA COMIGO] baseada na descrição oficial |
| EF01MA08 | `AdditionConcept`; `SubtractionConcept`; `EarlyProblemSolvingConcept` | O texto explicita problemas de adição/subtração e seus significados. | [ANÁLISE SEMÂNTICA CONTA COMIGO] baseada na descrição oficial |
| EF01MA14 | `BasicGeometryConcept`; `SquareConcept`; `RectangleConcept` | Figuras planas são o domínio geral; quadrado e retângulo já possuem classes verificadas. Mapeamento parcial porque círculo e triângulo ainda não estão modelados. | [ANÁLISE SEMÂNTICA CONTA COMIGO] baseada na descrição oficial |

[DECISÃO DE ENGENHARIA] Cada afirmação `addressesMathematicalConcept` possui anotação `mappingOrigin=ContaComigo semantic analysis`. Não foi declarada equivalência entre habilidade e conceito.

## 6. Relações didáticas e pré-requisitos

[BNCC OFICIAL] Os códigos identificam etapa, ano, componente e posição da habilidade no conjunto, mas sua sequência numérica não foi tomada como declaração formal de pré-requisito.

[DECISÃO DE ENGENHARIA] Nenhuma relação `BNCCSkill → prerequisite → BNCCSkill` foi criada. `PrerequisiteRelation` permanece reservado a relações matemáticas/didáticas explicitamente justificadas entre conceitos. Assim, uma consulta futura pode seguir habilidade → conceito abordado → relação didática validada, sem inventar uma cadeia EF01MA01 → EF01MA02.

[HIPÓTESE / VALIDAÇÃO PROFISSIONAL] Relações de pré-requisito entre `NumberConcept`, `CountingConcept`, `AdditionConcept` e outros conceitos devem ser propostas separadamente e revisadas por profissional de educação matemática antes de influenciar recomendação.

## 7. Cobertura atual de atividades

A contagem considera as 20 atividades presentes no seed e o código que cada uma declara. Quinze delas alegam uma das seis habilidades deste recorte. A contagem não mede qualidade nem cobertura completa da descrição oficial.

| Habilidade | Conceitos matemáticos | Tipos de atividade declarados | Quantidade | Status |
|---|---|---|---:|---|
| EF01MA01 | Number | counting, drag_drop | 3 | PARTIALLY_COVERED |
| EF01MA03 | Counting, Comparison | quiz, drag_drop | 4 | NEEDS_REVIEW |
| EF01MA06 | Addition, Early Problem Solving | quiz, counting, drag_drop | 4 | PARTIALLY_COVERED |
| EF01MA07 | Number, Addition | quiz | 2 | NEEDS_REVIEW |
| EF01MA08 | Addition, Subtraction, Early Problem Solving | — | 0 | NOT_COVERED |
| EF01MA14 | Basic Geometry, Square, Rectangle | — | 0 | NOT_COVERED |

[LIMITAÇÃO] EF01MA08 e EF01MA14 têm candidatos aparentes marcados com outros códigos, mas eles não foram contados como cobertura para evitar correção implícita. Nenhuma habilidade recebeu `COVERED`, pois os seeds não demonstram todas as operações e contextos pedidos pelas descrições oficiais.

## 8. Competency Questions

| CQ | Resposta verificável nesta versão |
|---|---|
| CQ-BNCC-1 — conceitos de EF01MA08 | Addition, Subtraction e Early Problem Solving. |
| CQ-BNCC-2 — habilidades que abordam Addition | EF01MA06, EF01MA07 e EF01MA08. |
| CQ-BNCC-3 — atividades que declaram EF01MA06 | “Sominha fácil!”, “2 + 3 = ?”, “Soma com bolas” e “Ordene os passos da adição!”. |
| CQ-BNCC-4 — habilidades sem cobertura declarada | EF01MA08 e EF01MA14. |
| CQ-BNCC-5 — conceitos com pré-requisitos didáticos | Nenhuma instância validada foi criada; resultado vazio é intencional. |
| CQ-BNCC-6 — habilidades de 1º ano representadas | EF01MA01, 03, 06, 07, 08 e 14. |
| CQ-BNCC-7 — atividades com claim sem mapping correspondente | Sete atividades declaram EF01MA15, EF02MA01, EF02MA05 ou EF03MA07, códigos sem mapping nesta população ontológica. EF02/EF03 estão apenas fora do recorte; EF01MA15 também está ausente do seed curricular. As claims EF01MA07 contradizem a descrição oficial. |
| CQ-BNCC-8 — mappings ambíguos | Cobertura de EF01MA03 e EF01MA07 está `NEEDS_REVIEW`; EF01MA14 tem mapping conceitual parcial. |

[DECISÃO DE ENGENHARIA] Os testes executam essas consultas como fixtures determinísticas sobre o RDF/XML e o seed, sem necessitar de dados de estudantes ou Pellet.

## 9. Decisões de modelagem

- [DECISÃO DE ENGENHARIA] `Curriculum`, `CurriculumDomain`, `CurriculumLevel`, `CurriculumSkill` e `BNCCSkill` permanecem em `CurricularKnowledge`.
- [DECISÃO DE ENGENHARIA] Habilidades são indivíduos identificados por IRIs `BNCC_EF01MAxx`, código literal oficial e descrição oficial em português.
- [DECISÃO DE ENGENHARIA] `BrazilianNationalCommonCoreCurriculum`, `BNCCElementaryYear1`, `BNCCNumbersDomain` e `BNCCGeometryDomain` fornecem contexto curricular.
- [DECISÃO DE ENGENHARIA] `addressesCurriculumSkill` e sua inversa `isAddressedByActivity` preparam ligações futuras com atividades; o OWL não duplica todas as instâncias do seed.
- [DECISÃO DE ENGENHARIA] Cobertura e quantidade são um snapshot auditável, não axiomas de adequação pedagógica.
- [PARÂMETRO EXPERIMENTAL] Não foi introduzido limiar de mastery, suficiência ou progressão neste lote.

## 10. Lacunas encontradas

- EF01MA07 e EF01MA15 aparecem em atividades, mas não no seed `bncc_skills`.
- As descrições do seed curricular são abreviadas; EF01MA01/02/03/08/13 omitem partes do texto oficial.
- Atividades EF01MA03 comparam ou ordenam numerais, não conjuntos como descrito oficialmente.
- Atividades EF01MA01 executam contagem de coleções e podem exigir revisão frente a EF01MA04; não foram remapeadas neste lote.
- Atividades EF01MA07 praticam subtração, não composição/decomposição por adições.
- Atividades EF01MA15 identificam figuras planas; a descrição oficial correspondente é EF01MA14.
- Sete atividades usam EF01MA15, EF02MA01, EF02MA05 ou EF03MA07, que não possuem mapping conceitual nesta população; os três códigos de anos posteriores estão apenas fora do recorte inicial.
- Círculo, triângulo, composição/decomposição decimal e localização espacial ainda não possuem conceitos específicos suficientes.
- O README afirma “127+ habilidades” e faixas amplas de cobertura que não correspondem aos 19 registros do seed nem às 15 atividades atuais.
- Dashboards exibem código e percentuais, mas não validam descrição, conceito ou abrangência da habilidade.

## 11. Necessidade de validação profissional

[HIPÓTESE / VALIDAÇÃO PROFISSIONAL] Um profissional deve revisar: granularidade de `NumberConcept`; suficiência de `EarlyProblemSolvingConcept`; mapeamento parcial de EF01MA14; destino correto de cada atividade EF01MA01/03/07/15; e qualquer futura relação de pré-requisito.

[HIPÓTESE A VALIDAR] A cobertura por conceito, além do código BNCC, poderá reduzir claims curriculares imprecisas e melhorar explicabilidade. Isso ainda não foi avaliado empiricamente.

## 12. Relação com OntoMathEdu

[LITERATURA] A OntoMathEdu fornece a referência para organização do domínio matemático e relações didáticas, conforme análise do lote B2.2B ([repositório](https://github.com/CLLKazan/OntoMathEdu), [artigo](https://ceur-ws.org/Vol-2634/WiP1.pdf)).

[DECISÃO DE ENGENHARIA] A BNCC determina a identidade e o texto da habilidade; os vínculos aos conceitos locais são análise do ContaComigo. Nenhum conceito BNCC é apresentado como conceito OntoMathEdu e não existe `owl:equivalentClass`.

## 13. Relação com o learner model

[DECISÃO DE ENGENHARIA] Habilidades curriculares não pertencem à hierarquia de `LearnerCharacteristic`. Uma criança estar no 1º ano não implica mastery, força, preferência ou necessidade de suporte. Learning Analytics pode relacionar evidência a uma habilidade, enquanto BKT mantém o estado individual de mastery.

## 14. Relação com a recomendação adaptativa

[PROPOSTA CONTA COMIGO] Futuramente, a recomendação poderá consultar habilidades, conceitos abordados, pré-requisitos conceituais validados e disponibilidade de atividades.

[DECISÃO DE ENGENHARIA] Este lote não altera o ADE. O grafo hard-coded `BNCC_PREREQ_GRAPH` e `_get_next_skill()` estão em pipelines deprecated e receberam TODOs explícitos para não serem reativados sem substituição semântica validada. `OntologyService.validateBnccAlignment()` usa o ano codificado com tolerância ±1; isso deve permanecer apenas como compatibilidade técnica até revisão, nunca como evidência de capacidade.

## 15. Limitações

- [LIMITAÇÃO] O recorte contém seis habilidades, não toda a BNCC nem todo o 1º ano.
- [LIMITAÇÃO] Status de cobertura são baseados no seed, não em observação pedagógica ou banco de produção.
- [LIMITAÇÃO] O mapping EF01MA14 é parcial porque círculo e triângulo não estão modelados.
- [LIMITAÇÃO] Não existem pré-requisitos didáticos validados nesta versão.
- [LIMITAÇÃO] A ontologia não corrige os códigos inconsistentes do runtime.
- [LIMITAÇÃO] Mastery continua no BKT; nenhuma probabilidade pode ser inferida da série ou da cobertura.

## 16. Relação com a dissertação

[PROPOSTA CONTA COMIGO] A contribuição deste lote é explicitar uma ponte rastreável entre currículo oficial, conceitos matemáticos e intervenções digitais. A separação entre conteúdo oficial e análise semântica local torna as decisões auditáveis e evita apresentar ordenação técnica de códigos como teoria pedagógica.

## 17. Referências

- Brasil. Ministério da Educação. *Base Nacional Comum Curricular — Educação é a Base*. [Documento oficial](https://basenacionalcomum.mec.gov.br/images/BNCC_EI_EF_110518_versaofinal_site.pdf).
- Ministério da Educação. *A Base*. [Portal oficial da BNCC](https://basenacionalcomum.mec.gov.br/a-base).
- OntoMathEdu. [Repositório oficial consultado](https://github.com/CLLKazan/OntoMathEdu).
- Nevzorova, O. et al. *OntoMathEdu: Towards an Educational Mathematical Ontology*. [CEUR-WS](https://ceur-ws.org/Vol-2634/WiP1.pdf).

## Texto potencial para a dissertação

### Metodologia

O recorte curricular foi definido pela interseção entre habilidades alegadas pelo runtime, conceitos matemáticos previamente modelados e descrições verificadas no documento oficial da BNCC. Cada vínculo habilidade–conceito foi classificado como análise semântica do ContaComigo, e a cobertura foi calculada diretamente sobre os seeds sem corrigir inconsistências.

### Decisão de projeto

A BNCC foi representada como camada curricular separada da ontologia matemática, do learner model e das atividades. Códigos e descrições têm origem oficial; mappings conceituais são interpretações locais. Não foram criadas equivalências ou progressões por ordem numérica.

### Limitações

A população inicial é parcial, mappings requerem revisão profissional e o snapshot de cobertura não comprova adequação ou completude pedagógica. Códigos suspeitos continuam no runtime por compatibilidade e devem ser migrados em lote próprio.

### Evidência necessária no experimento

São necessárias revisão por especialistas, validação de conteúdo das atividades, concordância entre avaliadores para os mappings, testes das consultas com dados reais e análise de como lacunas curriculares e relações conceituais afetam recomendações sem substituir o mastery BKT.
