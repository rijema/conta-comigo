# THIRD-PARTY NOTICES

Este arquivo identifica recursos de terceiros usados pelo Conta Comigo. Não constitui uma licença global do código-fonte ou um inventário exaustivo de todas as dependências. O código do Conta Comigo é proprietário e a ontologia é distribuída sob CC BY 4.0 (ver `LICENSE`); os materiais abaixo não são de titularidade do autor e seguem as licenças de seus titulares.

## Pictogramas ARASAAC

- **Autor dos pictogramas:** Sergio Palao.
- **Origem:** [ARASAAC](https://arasaac.org).
- **Proprietário:** Governo de Aragão, Espanha.
- **Licença dos pictogramas:** Creative Commons Attribution-NonCommercial-ShareAlike (CC BY-NC-SA), conforme [termos oficiais do ARASAAC](https://arasaac.org/terms-of-use).

O aplicativo utiliza identificadores semânticos e URLs do ARASAAC para acessar imagens pictográficas sob demanda. Os direitos autorais dos pictogramas permanecem com os respectivos titulares; seu carregamento remoto não elimina a necessidade de cumprir a licença. O uso comercial dos pictogramas depende de autorização específica ou da substituição por materiais com licença apropriada. A condição de compartilhamento pela mesma licença deve ser observada quando houver distribuição de materiais derivados, sem presumir automaticamente que todo o código da aplicação seja material derivado dos pictogramas.

A atribuição está apresentada na biblioteca ARASAAC, na página pública `/[locale]/creditos` e no rodapé da página inicial. Uma página de créditos não dispensa outros avisos que se mostrem necessários conforme a forma concreta de distribuição e exibição dos pictogramas.

Os arquivos `assets/arasaac.png` e `frontend/public/assets/arasaac.png` são o logotipo do ARASAAC, usado apenas para identificar a origem dos pictogramas, e pertencem ao Governo de Aragão.

O ARASAAC e o Governo de Aragão não são declarados parceiros ou endossantes do Conta Comigo por este aviso.

## Base Nacional Comum Curricular (BNCC)

Os códigos e textos das habilidades de Matemática do 1º ao 5º ano presentes na ontologia (`ontology/contacomigo/contacomigo.owl`) foram transcritos da BNCC, publicada pelo Ministério da Educação (https://basenacionalcomum.mec.gov.br). Por serem textos oficiais, não são protegidos por direito autoral (Lei nº 9.610/1998, art. 8º, IV); a fonte é citada em cada indivíduo por `dcterms:source`.

## Ontologias referenciadas

- **OntoMathEdu** (https://github.com/CLLKazan/OntoMathEdu): a ontologia do Conta Comigo apenas referencia IRIs da OntoMathEdu em anotações de alinhamento; não a importa nem a redistribui.
- **PROV-O**, **Dublin Core** e **SKOS** (W3C e DCMI): termos referenciados por IRI.
- **LASDONT** (`ontology/lasdont/LASDONT-v1.owx`): ontologia anterior usada como fonte de rastreabilidade histórica.

## Outros componentes

Outras dependências e conteúdos, incluindo bibliotecas de software e recursos de síntese de voz, possuem licenças próprias. Seus termos devem ser consultados em suas respectivas fontes; esta nota não substitui uma auditoria de propriedade intelectual. As licenças das dependências npm e Python podem ser listadas com:

```bash
npx license-checker --production --summary   # em frontend/ e backend/
pip-licenses                                 # em ml-service/
```
