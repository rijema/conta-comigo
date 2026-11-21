# Ontologia ContaComigo

Ontologia de domínio para o ensino de matemática nos anos iniciais do Ensino Fundamental (1º ao 5º ano) a crianças com Transtorno do Espectro Autista, desenvolvida no sistema ContaComigo.

A ontologia representa:

- as 126 habilidades de Matemática da BNCC do 1º ao 5º ano, com código, texto oficial, objeto de conhecimento, ano e unidade temática;
- 33 conceitos matemáticos locais e o vínculo de cada habilidade com os conceitos que mobiliza;
- 14 relações de pré-requisito entre conceitos, fundamentadas em trechos da BNCC, e a relação transitiva derivada delas;
- as características das famílias de atividade do sistema (tipo, representação, interação, dificuldade e recursos de acessibilidade);
- o vocabulário de evidências de interação usado pelo sistema.

Ela não contém dados de estudantes.

## Conteúdo do pacote

| Caminho | Descrição |
|---|---|
| `contacomigo.owl` | Ontologia em RDF/XML (arquivo de referência) |
| `contacomigo.ttl` | A mesma ontologia em Turtle |
| `competency-questions/` | Questões de competência (CQ01–CQ10) e consultas de integridade (V01–V04) em SPARQL |
| `reasoning/` | Scripts de verificação (`reason.sh`, `mutation-tests.sh`) e geração do relatório |
| `verificacao-v0.7.0.pdf` | Relatório de verificação: métricas, raciocínio, testes de mutação e respostas às questões de competência |
| `CITATION.cff` | Metadados de citação |

## Verificação

A ontologia está no perfil OWL 2 DL e foi verificada com HermiT 1.4.5.456 e JFact 4.0.4 por meio do ROBOT 1.9.8 (OWL API 4.5.29). O relatório em PDF traz os resultados.

Os scripts usam os caminhos do repositório de origem. Para executá-los a partir deste pacote, com Java 11 ou superior e Python 3, recrie essa estrutura:

```bash
mkdir -p ontology/contacomigo ontology/reasoning
cp contacomigo.owl ontology/contacomigo/
cp -R competency-questions ontology/
cp reasoning/* ontology/reasoning/
PRIOR_REF=none bash ontology/reasoning/reason.sh
```

A comparação com a versão anterior exige o histórico git do repositório de origem e é omitida nesse caso.

## Alinhamentos

A ontologia não importa ontologias externas. Os alinhamentos com a OntoMathEdu e a LASDONT são anotações de proveniência (`cc:sourceOntology`, `cc:sourceIRI`, `cc:alignmentRelation`), sem declaração de equivalência. Termos do PROV-O, do Dublin Core e do SKOS são usados por IRI.

## Licença

Creative Commons Atribuição 4.0 Internacional (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/. Os textos das habilidades são transcrições da Base Nacional Comum Curricular (Ministério da Educação), texto oficial.
