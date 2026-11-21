# Batch 19 — Ontologia v0.7.0: formalização lógica, verificação com dois raciocinadores e testes de mutação

## 1. Motivação

[DECISÃO DE ENGENHARIA] Até a v0.6.0, a ontologia continha hierarquia de classes, domínio e alcance de propriedades e 220 indivíduos, mas nenhuma disjunção, restrição, classe definida ou característica de propriedade. Nessa situação o raciocinador quase não tem o que verificar: a hierarquia inferida era igual à declarada, e erros de modelagem plantados de propósito não geravam inconsistência (seção 5).

[DECISÃO DE ENGENHARIA] O BATCH_02 (OntoMathEdu) já registrava que as partições de conceitos “não afirmam disjunção” e que “uma decisão posterior poderá formalizar restrições após a validação das consultas de competência”. A v0.7.0 é essa decisão, restrita às camadas matemática, curricular e de atividades.

## 2. O que foi formalizado

[PROPOSTA CONTA COMIGO] Disjunção entre as cinco camadas de conhecimento (matemática, curricular, aprendiz, atividade e evidência), entre os elementos da estrutura curricular (habilidade, currículo, unidade temática e ano), entre atividade e característica de atividade, entre as seis dimensões de caracterização de atividades e entre conceito matemático e relação didática.

[PROPOSTA CONTA COMIGO] Propriedades funcionais para ano, unidade temática, currículo e código curricular de uma habilidade, e para os dois extremos de cada relação de pré-requisito reificada. Os cinco anos e as cinco unidades temáticas são declarados distintos (`owl:AllDifferent`); sem isso, uma habilidade ligada a dois anos levaria o raciocinador a igualar os anos em vez de apontar a inconsistência.

[PROPOSTA CONTA COMIGO] Restrições existenciais (condições necessárias): toda `BNCCSkill` pertence a um ano, a uma unidade temática, à BNCC e mobiliza ao menos um conceito matemático; toda `PrerequisiteRelation` liga um conceito anterior e um dependente.

[PROPOSTA CONTA COMIGO] Propriedade `cc:isPrerequisiteOf`, transitiva, obtida das relações reificadas pela cadeia `inverse(prerequisiteConcept) ∘ dependentConcept`. As relações reificadas continuam sendo a fonte, com proveniência e estado de revisão; a nova propriedade é a visão direta, sobre a qual o raciocinador calcula o fecho transitivo.

[LITERATURA] A transitividade da relação de precedência entre itens de conhecimento é um pressuposto da teoria dos espaços de conhecimento (Doignon e Falmagne, 1999), base de sistemas adaptativos que ordenam o ensino por pré-requisitos.

[PROPOSTA CONTA COMIGO] Dez classes definidas pela organização da BNCC: uma por ano (`BNCCYear1Skill` … `BNCCYear5Skill`) e uma por unidade temática (`BNCCNumbersSkill`, `BNCCAlgebraSkill`, `BNCCGeometrySkill`, `BNCCMeasuresSkill`, `BNCCStatisticsSkill`), definidas como `BNCCSkill` com o valor correspondente de `belongsToGrade` ou `belongsToCurriculumDomain`.

[LITERATURA] A BNCC organiza as habilidades de Matemática do Ensino Fundamental por ano e por cinco unidades temáticas: Números, Álgebra, Geometria, Grandezas e medidas e Probabilidade e estatística (Brasil, 2018).

[DECISÃO DE ENGENHARIA] Os termos externos usados sem importação (Dublin Core, SKOS e quatro termos do PROV-O) foram declarados, e o cabeçalho recebeu título, descrição, autoria, licença CC BY 4.0, `owl:versionIRI` e `owl:priorVersion`. Com isso o arquivo passou a estar no perfil OWL 2 DL.

## 3. O que deliberadamente não foi formalizado

[DECISÃO DE ENGENHARIA] Nenhum axioma sobre o aprendiz. O BATCH_02 (modelo do aprendiz) proíbe axiomas de diagnóstico, restrições numéricas e regras automáticas; os dados das crianças não entram na ontologia, e o cálculo de domínio pertence ao Bayesian Knowledge Tracing.

[DECISÃO DE ENGENHARIA] Nenhuma disjunção entre forças e necessidades de apoio, conforme o BATCH_02 (linha de base LASDONT): o runtime pode representar ausência ou combinações que exigem cautela.

[DECISÃO DE ENGENHARIA] Nenhuma disjunção entre subconceitos matemáticos: um mesmo conteúdo pode mobilizar número e medida, por exemplo.

[DECISÃO DE ENGENHARIA] Nenhuma equivalência com ontologias externas. As classes definidas usam `owl:equivalentClass` apenas sobre termos do próprio ContaComigo; os testes do repositório foram ajustados para verificar exatamente isso (nenhuma IRI externa dentro de `owl:equivalentClass`), em vez de proibir o construtor.

[DECISÃO DE ENGENHARIA] Nenhuma regra SWRL. As inferências pretendidas são expressas em OWL 2 DL (disjunção, funcionalidade, transitividade, cadeia e classes definidas), decidíveis pelo HermiT. Regras sobre dados do aprendiz exigiriam carregar esses dados na ontologia, o que contraria a decisão anterior.

[DECISÃO DE ENGENHARIA] Cobertura de atividades (`currentActivityCoverageStatus`) não virou classe definida, porque o BATCH_02 (BNCC) a trata como retrato auditável, não como axioma.

## 4. Verificação

[DECISÃO DE ENGENHARIA] A verificação é reproduzível por `ontology/reasoning/reason.sh`, que fixa o ROBOT 1.9.8 por checksum e roda HermiT 1.4.5.456 e JFact 4.0.4 (OWL API 4.5.29), o perfil OWL 2 DL, métricas, o relatório de qualidade e os testes de mutação. O resultado completo está em `ontology/reasoning/v0.7.0-verification-report.md`.

[DECISÃO DE ENGENHARIA] Resultados: a ontologia está no perfil OWL 2 DL; é consistente nos dois raciocinadores, sem classes insatisfatíveis; as 126 habilidades são classificadas nas classes por ano (22, 23, 28, 28 e 25) e por unidade temática (44, 16, 22, 27 e 17), com a mesma hierarquia nos dois raciocinadores; o HermiT infere 25 asserções `isPrerequisiteOf` (14 diretas e 11 transitivas), igual ao fecho transitivo calculado por script, sem ciclos.

[DECISÃO DE ENGENHARIA] O JFact não gera as asserções que dependem da cadeia com propriedade inversa e trata classe e indivíduo de mesma IRI (*punning*) como a mesma entidade. Consistência e classificação coincidem; o HermiT é o raciocinador de referência.

## 5. Testes de mutação

[DECISÃO DE ENGENHARIA] Seis erros de modelagem foram inseridos, um de cada vez, na v0.6.0 e na v0.7.0: habilidade com dois anos; habilidade com duas unidades temáticas; habilidade tipada também como atividade; ano apontando para outra habilidade; alcance incorreto do tipo corrigido na v0.6.0; dimensão de atividade subordinada a outra.

[DECISÃO DE ENGENHARIA] Na v0.6.0 o HermiT aceitou os seis como consistentes; na v0.7.0 detectou os seis (cinco inconsistências e uma classe insatisfatível).

[PARÂMETRO EXPERIMENTAL] O conjunto de seis mutações foi escolhido a partir de erros plausíveis de manutenção do arquivo (inclusive um erro real corrigido na v0.6.0). Ele não é exaustivo e não mede a cobertura de todos os erros possíveis.

## 6. Impacto no runtime

[DECISÃO DE ENGENHARIA] Nenhuma IRI foi removida ou renomeada. O carregador do backend (`OntologyService`) lê indivíduos `BNCCSkill` e `PrerequisiteRelation` e não foi alterado; os testes de backend e frontend da ontologia passam com a v0.7.0. O runtime ainda não consome `isPrerequisiteOf` nem as classes definidas.

[HIPÓTESE A VALIDAR] Usar o fecho transitivo de pré-requisitos na seleção de atividades pode evitar recomendar uma habilidade cujos pré-requisitos indiretos ainda não foram observados. Isso depende de avaliação com usuários.

## Referências

[LITERATURA] Brasil. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.

[LITERATURA] Doignon, J.-P.; Falmagne, J.-C. Knowledge Spaces. Berlin: Springer, 1999.

[LITERATURA] Glimm, B.; Horrocks, I.; Motik, B.; Stoilos, G.; Wang, Z. HermiT: an OWL 2 reasoner. Journal of Automated Reasoning, v. 53, n. 3, p. 245–269, 2014.

[LITERATURA] Jackson, R. C. et al. ROBOT: a tool for automating ontology workflows. BMC Bioinformatics, v. 20, 407, 2019.

## Texto potencial para a dissertação

### Metodologia

A ontologia foi verificada com dois raciocinadores OWL 2 DL independentes, HermiT 1.4.5.456 e JFact 4.0.4, executados pelo ROBOT 1.9.8 (OWL API 4.5.29). Além da consistência e da satisfatibilidade das classes, avaliou-se a capacidade de detecção de erros por testes de mutação: seis erros de modelagem plausíveis foram inseridos, um por vez, e verificou-se se o raciocinador os acusava. O procedimento é reproduzível por script versionado no repositório.

### Decisão de projeto

A formalização lógica foi restrita às camadas matemática, curricular e de atividades: disjunção entre camadas e dimensões, propriedades funcionais derivadas da estrutura da BNCC, restrições existenciais, uma relação transitiva de pré-requisito derivada das relações reificadas e dez classes definidas por ano e unidade temática. A camada do aprendiz não recebeu axiomas de diagnóstico nem limiares, e os dados das crianças não entram na ontologia; por isso não se adotaram regras SWRL.

### Limitações

As restrições existenciais são condições necessárias e, pela semântica de mundo aberto, não detectam valores ausentes; essa completude é verificada por testes do repositório. A hierarquia de conceitos matemáticos não participa do raciocínio sobre habilidades, devido ao uso de *punning*. O conjunto de mutações não é exaustivo.

### Evidência necessária no experimento

Na v0.6.0, nenhum dos seis erros plantados foi detectado; na v0.7.0, os seis foram detectados. O HermiT classificou as 126 habilidades nas dez classes definidas e inferiu 25 relações de pré-requisito, número igual ao do fecho transitivo calculado de forma independente. As relações de pré-requisito e os mapeamentos habilidade-conceito foram revisados por profissional. Falta medir se o uso do fecho transitivo melhora a seleção de atividades.
