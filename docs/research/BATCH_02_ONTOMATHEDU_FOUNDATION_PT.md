# Batch 02 — Fundação matemática educacional baseada na OntoMathEdu

## 1. Por que OntoMathEdu foi selecionada

[LITERATURA]

A OntoMathEdu foi apresentada como uma ontologia educacional de matemática escolar, destinada a funcionar como núcleo Linked Open Data, recurso linguístico e base de referência educacional. Seu desenho diferencia a conceituação da matemática escolar da matemática profissional e inclui relações didáticas independentes das relações lógico-matemáticas. Essas características são pertinentes a um sistema que precisa relacionar conceitos, currículo e ordem de aprendizagem. Fontes primárias consultadas: [repositório oficial da OntoMathEdu](https://github.com/CLLKazan/OntoMathEdu) e o artigo [OntoMathEdu: Towards an Educational Mathematical Ontology](https://ceur-ws.org/Vol-2634/WiP1.pdf).

[DECISÃO DE ENGENHARIA]

A OntoMathEdu foi selecionada como referência principal da camada matemática educacional, não como pacote a ser copiado integralmente. A seleção orienta princípios de modelagem — matemática escolar, relações didáticas, níveis educacionais e proveniência — sem declarar que o ContaComigo importa ou executa a ontologia externa.

## 2. Estrutura original da OntoMathEdu

[LITERATURA]

O artigo descreve três camadas: fundacional, de domínio matemático e linguística. A camada de domínio é organizada em hierarquias de tipos, papéis, relações reificadas e uma rede de pontos de vista. A edição distribuída no repositório usa OWL 2 Manchester Syntax, IRI-base `http://ontomathpro.org/ontomathedu#`, rótulos multilíngues e IRIs opacas para grande parte das classes. O [README oficial](https://github.com/CLLKazan/OntoMathEdu#readme) identifica o arquivo como a segunda release e informa que ela cobre geometria plana.

[LITERATURA]

No artefato `ontomathedu.omn` inspecionado foram encontrados 916 blocos `Class`, sete propriedades de objeto e vinte propriedades de anotação. Existem `EducationalLevel`, `EducationSystem`, `belongsToEducationalLevel`, `hasEducationalLevelPrerequisite` e `hasPrerequisite`. Esta última é uma propriedade de anotação; nas anotações de conceitos, seus valores são frequentemente literais textuais, e não ligações OWL entre duas classes. A distribuição oficial pode ser consultada no [arquivo Manchester OWL](https://github.com/CLLKazan/OntoMathEdu/blob/master/ontomathedu.omn).

[LITERATURA]

O artigo de estrutura descreve relações matemáticas reificadas e propriedades como parte–todo, determinação, dependência ontológica, relações entre teorema e figura e expressão por fórmula. O artigo [Prerequisite Relationships of the OntoMathEdu Educational Mathematical Ontology](https://ceur-ws.org/Vol-2784/spaper07.pdf) descreve abordagens direta e indireta para pré-requisitos e projeções para sistemas educacionais. Essas descrições foram tratadas separadamente daquilo que é diretamente consultável no artefato.

### Disponível no artefato versus literatura ou trabalho futuro

| Elemento investigado | Artefato distribuído | Literatura ou planejamento | Decisão neste lote |
| --- | --- | --- | --- |
| Classe nomeada `MathematicalConcept` | não encontrada | a camada de domínio é descrita como conjunto de conceitos matemáticos escolares | criar classe local `MathematicalConcept` com relação `adapted`, sem equivalência |
| Conceitos de domínio | classes de geometria plana confirmadas | expansão para currículo mais amplo é discutida | alinhar apenas conceitos geométricos com IRI confirmada |
| Níveis educacionais | `EducationalLevel`, níveis russos e britânicos e relações entre níveis | projeções educacionais são discutidas | adaptar `CurriculumLevel`; não reutilizar os níveis como níveis BNCC |
| Relações didáticas | `hasPrerequisite` como anotação e pré-requisito entre níveis como propriedade de objeto | relações didáticas/pré-requisitos são parte central do modelo descrito | criar relação didática reificada local e registrar adaptação |
| Aritmética inicial | não há classes nomeadas para número elementar, contagem ou subtração; ocorrências de “addition” e “arithmetic” são específicas de vetores, segmentos ou geometria | módulos como Arithmetic são descritos na arquitetura planejada | criar vocabulário local de matemática inicial, sem atribuí-lo à OntoMathEdu |
| Avaliação e recomendação | não foram identificadas classes centrais de avaliação/recomendação | teste automático e recomendação são apresentados como objetivos da plataforma/ecossistema | manter semântica operacional do ContaComigo fora da hierarquia importada |

## 3. Conceitos efetivamente reutilizados

[DECISÃO DE ENGENHARIA]

Nenhuma entidade foi importada e nenhuma equivalência foi declarada. O reuso efetivo neste lote limita-se a IRIs confirmadas usadas como alvos de proveniência para alinhamentos conservadores:

| Entidade local | Fonte | IRI fonte | Relação | Justificativa |
| --- | --- | --- | --- | --- |
| `PointConcept` | OntoMathEdu | `http://ontomathpro.org/ontomathedu#R71GKMyesTQoOWWvX1M74EE` | related | a classe fonte possui rótulo inglês `Point`; a semântica local ainda precisa de validação curricular |
| `AngleConcept` | OntoMathEdu | `http://ontomathpro.org/ontomathedu#R9lMyAYbMeEYN0OdD7cbwZ6` | related | a classe fonte possui rótulo inglês `Angle` |
| `SquareConcept` | OntoMathEdu | `http://ontomathpro.org/ontomathedu#R81puoDaG8DotyXihsGWNY6` | related | a classe fonte possui rótulos `Square` e `Regular quadrilateral` |
| `RectangleConcept` | OntoMathEdu | `http://ontomathpro.org/ontomathedu#R9x3QFCyHrHe0SoE3ZCZr94` | related | a classe fonte possui rótulo inglês `Rectangle` |

[LIMITAÇÃO]

O uso de `related` é deliberado. A igualdade lexical não demonstra equivalência semântica entre a conceituação de geometria plana da OntoMathEdu e o recorte de geometria dos anos iniciais no Brasil.

## 4. Conceitos apenas alinhados

[DECISÃO DE ENGENHARIA]

Os demais alinhamentos são adaptações explícitas, e não cópias:

| Entidade local | Fonte/IRI | Relação | Natureza da adaptação |
| --- | --- | --- | --- |
| `MathematicalConcept` | ontologia `http://ontomathpro.org/ontomathedu#` | adapted | materializa localmente a ideia de conceito da camada de domínio; a classe com esse nome não existe na distribuição |
| `DidacticRelation` | OntoMathEdu `#hasPrerequisite` e artigo de estrutura | adapted | reifica a dimensão didática para permitir identidade, proveniência e participantes |
| `PrerequisiteRelation` | OntoMathEdu `#hasPrerequisite` | adapted | representa pré-requisito com IRIs de conceitos; não equivale à propriedade de anotação textual externa |
| `CurriculumLevel` | OntoMathEdu `#EducationalLevel` | adapted | permite níveis curriculares brasileiros sem igualá-los aos níveis russos ou britânicos |
| `prerequisiteConcept` | OntoMathEdu `#hasPrerequisite` | adapted | identifica o participante pré-requisito de uma relação reificada local |

[DECISÃO DE ENGENHARIA]

Cada entidade alinhada contém `sourceOntology`, `sourceIRI`, `alignmentRelation` e, quando necessário, `alignmentNote`. Os tipos permitidos pelo projeto são `imported`, `equivalent`, `narrower`, `broader`, `related` e `adapted`; esta versão usa apenas `related` e `adapted`.

## 5. Limitações da versão disponível da OntoMathEdu

[LIMITAÇÃO]

A release disponível é concentrada em geometria plana e majoritariamente associada a níveis do ensino russo e britânico. Não fornece o recorte de aritmética dos anos iniciais necessário ao ContaComigo. Também não contém uma classe nomeada `MathematicalConcept` nem classes confirmadas com os nomes elementares `Counting`, `Subtraction`, `Sequence` ou `Pattern`.

[LIMITAÇÃO]

O artigo inicial apresenta Arithmetic e Algebra como módulos do desenho global, mas o repositório declara que a release distribuída cobre geometria plana. Portanto, esses módulos não foram tratados como conteúdo disponível. Ocorrências lexicais de “number”, “addition” e “arithmetic” no arquivo estão contextualizadas em geometria, vetores ou médias de segmentos e não sustentam equivalência com número e operações nos anos iniciais.

[LIMITAÇÃO]

`hasPrerequisite` é uma propriedade de anotação no arquivo e muitos valores são strings em russo. Isso limita consultas por identidade semântica, validação de caminhos e inferência de pré-requisitos. O ContaComigo não reproduz essa representação textual.

## 6. Escopo matemático do ContaComigo

[PROPOSTA CONTA COMIGO]

A camada matemática inicial define conceitos locais para número, contagem, comparação, adição, subtração, sequências/padrões, geometria básica e resolução inicial de problemas. Eles são subclasses de `MathematicalConcept`, mas não recebem IRI OntoMathEdu quando a classe correspondente não foi confirmada no artefato.

[PROPOSTA CONTA COMIGO]

O recorte geométrico inicial inclui alinhamentos conservadores para ponto, ângulo, quadrado e retângulo. Triângulo, polígono e círculo também foram confirmados na fonte e poderão ser adicionados quando atividades ou habilidades BNCC exigirem essas classes; não foram copiados preventivamente nesta versão.

## 7. Relação OntoMathEdu → ContaComigo

[DECISÃO DE ENGENHARIA]

O arquivo `contacomigo.owl` é uma ontologia independente. Não contém `owl:imports`. A OntoMathEdu funciona como fundação bibliográfica e fonte de alinhamentos registrados, enquanto a ontologia local acrescenta dimensões específicas de currículo BNCC, estudante, atividade e evidência analítica.

[DECISÃO DE ENGENHARIA]

As cinco partições de conhecimento são:

- `MathematicalKnowledge`: conceitos e relações didáticas;
- `CurricularKnowledge`: habilidades e níveis curriculares;
- `LearnerKnowledge`: estados do estudante, inicialmente `LearnerSkillState`;
- `ActivityKnowledge`: descrição semântica de atividades;
- `LearningAnalyticsEvidence`: evidências observacionais produzidas pelo fluxo de eventos.

Essas partições não afirmam disjunção. Uma decisão posterior poderá formalizar restrições após a validação das consultas de competência.

## 8. Papel histórico da LASDONT

[DECISÃO DE ENGENHARIA]

A LASDONT 1.0 permanece preservada, sem modificação, como fonte histórica para uma futura especialização do modelo do estudante. Ela não define conceitos matemáticos, habilidades curriculares ou relações didáticas da nova ontologia. `Strengths`, `Weaknesses` e `Treatments_Class` não foram incorporados à hierarquia matemática.

[PROPOSTA CONTA COMIGO]

Conceitos históricos potencialmente úteis serão avaliados em lote posterior de extensão do estudante, com revisão da terminologia, proveniência e implicações de privacidade. Nenhum vínculo entre força/fraqueza e conteúdo matemático foi criado nesta etapa.

## 9. Competency Questions

[PROPOSTA CONTA COMIGO]

- **CQ1.** Quais conceitos matemáticos são pré-requisitos para um conceito determinado?
- **CQ2.** Quais conceitos estão relacionados por relações didáticas?
- **CQ3.** Quais conceitos matemáticos são abordados por uma habilidade BNCC?
- **CQ4.** Quais atividades desenvolvem um conceito matemático determinado?
- **CQ5.** Quais atividades podem ser selecionadas quando o conhecimento pré-requisito está satisfeito?
- **CQ6.** Qual evidência de Learning Analytics se refere a um conceito matemático?
- **CQ7 (pendente).** Quais características ou necessidades de suporte do estudante são relevantes para uma atividade? Esta pergunta depende do futuro lote de extensão do estudante.

[DECISÃO DE ENGENHARIA]

As propriedades `hasDidacticRelation`, `prerequisiteConcept`, `dependentConcept`, `addressesMathematicalConcept`, `developsMathematicalConcept`, `requiresPrerequisite` e `providesEvidenceFor` estabelecem o vocabulário mínimo para responder às perguntas. Este lote não popula instâncias nem executa consultas SPARQL.

## 10. Decisões de modelagem

[DECISÃO DE ENGENHARIA]

- Foi adotada uma IRI própria para evitar a falsa impressão de extensão direta ou importação da OntoMathEdu.
- `PrerequisiteRelation` é uma entidade reificada, permitindo registrar contexto curricular e proveniência em evolução futura.
- Habilidades BNCC são conhecimento curricular e se ligam a conceitos matemáticos; não são subclasses desses conceitos.
- Atividades desenvolvem conceitos, mas não são “tratamentos”.
- Evidências analíticas são observações e não são domínio, diagnóstico ou característica permanente do estudante.
- Não foram usados `owl:equivalentClass`, `owl:equivalentProperty` ou `owl:imports`.

[PARÂMETRO EXPERIMENTAL]

Este lote não define limiares, pesos ou parâmetros experimentais. Critérios futuros para considerar pré-requisitos “satisfeitos” deverão ser configuráveis e validados; não foram codificados na ontologia.

## 11. Limitações

[LIMITAÇÃO]

- A ontologia local é uma fundação mínima e ainda não contém indivíduos de habilidades, conceitos, atividades ou relações.
- Os conceitos de aritmética inicial são propostas locais por ausência de classes confirmadas na release consultada.
- Os alinhamentos geométricos usam `related`, não equivalência.
- Não houve execução de reasoner OWL, publicação de namespace ou integração com o runtime.
- A ontologia não representa ainda contexto completo de uma relação didática, versão curricular ou proveniência por asserção.
- A seleção de conceitos iniciais precisa ser validada contra habilidades BNCC e materiais pedagógicos autorizados em lote posterior.

[HIPÓTESE A VALIDAR]

Uma camada matemática separada do currículo, do estado do estudante e das evidências pode melhorar a explicabilidade e a portabilidade das recomendações. A hipótese exige avaliação com consultas de competência, especialistas e dados do experimento.

## 12. Relação com a dissertação

[PROPOSTA CONTA COMIGO]

Esta fundação fornece um artefato rastreável para descrever como conhecimento matemático escolar, currículo, atividades e evidências serão separados no sistema. As alegações sobre benefício pedagógico ou desempenho permanecem hipóteses até validação experimental.

## Texto potencial para a dissertação

### Metodologia

A estrutura da OntoMathEdu e sua release pública em Manchester OWL foram inspecionadas antes da modelagem. Conceitos com IRIs confirmadas foram alinhados conservadoramente, e elementos descritos apenas na literatura ou ausentes da distribuição foram distinguidos de conceitos locais do ContaComigo. A ontologia resultante separa conhecimento matemático, curricular, do estudante, de atividades e evidências analíticas.

### Decisão de projeto

A OntoMathEdu foi adotada como referência educacional matemática primária sem importação automática. O ContaComigo mantém namespace e classes próprias para matemática inicial e registra proveniência para cada alinhamento. A LASDONT permanece somente como baseline histórico do futuro modelo do estudante.

### Limitações

A versão pública consultada concentra-se em geometria plana e não cobre de forma utilizável o recorte aritmético inicial. A ontologia criada ainda não foi integrada ao runtime, populada com a BNCC ou validada por especialistas.

### Evidência necessária no experimento

Serão necessários validação das consultas de competência, revisão por especialistas em educação matemática, alinhamento verificável com habilidades BNCC, testes de consistência e auditoria da influência dos conceitos nas recomendações.
