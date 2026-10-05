import { DataSource } from 'typeorm';

export const BnccSkillsSeed = async (dataSource: DataSource): Promise<void> => {
  const skills = [
    // 1º ANO
    { code: 'EF01MA01', year: 1, thematicUnit: 'Numeros', knowledgeObject: 'Números como indicador de quantidade ou ordem', description: 'Utilizar números naturais como indicador de quantidade ou de ordem em diferentes situações cotidianas.' },
    { code: 'EF01MA02', year: 1, thematicUnit: 'Numeros', knowledgeObject: 'Contar exata ou aproximadamente', description: 'Contar de maneira exata ou aproximada, utilizando diferentes estratégias.' },
    { code: 'EF01MA03', year: 1, thematicUnit: 'Numeros', knowledgeObject: 'Estimar e comparar quantidades', description: 'Estimar e comparar quantidades de objetos de dois conjuntos.' },
    { code: 'EF01MA06', year: 1, thematicUnit: 'Numeros', knowledgeObject: 'Fatos básicos da adição', description: 'Construir fatos básicos da adição e utilizá-los em procedimentos de cálculo.' },
    { code: 'EF01MA04', year: 1, thematicUnit: 'Numeros', knowledgeObject: 'Contagem de coleções até 100 unidades', description: 'Contar a quantidade de objetos de coleções até 100 unidades e apresentar o resultado por registros verbais e simbólicos, em situações de seu interesse, como jogos, brincadeiras, materiais da sala de aula, entre outros.' },
    { code: 'EF01MA05', year: 1, thematicUnit: 'Numeros', knowledgeObject: 'Comparação de números naturais', description: 'Comparar números naturais de até duas ordens em situações cotidianas, com e sem suporte da reta numérica.' },
    { code: 'EF01MA07', year: 1, thematicUnit: 'Numeros', knowledgeObject: 'Composição e decomposição de números naturais', description: 'Compor e decompor número de até duas ordens, por meio de diferentes adições, com o suporte de material manipulável, contribuindo para a compreensão de características do sistema de numeração decimal e o desenvolvimento de estratégias de cálculo.' },
    { code: 'EF01MA08', year: 1, thematicUnit: 'Numeros', knowledgeObject: 'Adição e subtração', description: 'Resolver e elaborar problemas de adição e de subtração, envolvendo números de até dois algarismos.' },
    { code: 'EF01MA09', year: 1, thematicUnit: 'Algebra', knowledgeObject: 'Organização e ordenação por atributos', description: 'Organizar e ordenar objetos familiares ou representações por meio de atributos, tais como tamanho, peso, cor, forma.' },
    { code: 'EF01MA10', year: 1, thematicUnit: 'Algebra', knowledgeObject: 'Padrões em sequências recursivas', description: 'Descrever, após o reconhecimento e a explicitação de um padrão (ou regularidade), os elementos ausentes em sequências recursivas de números naturais, objetos ou figuras.' },
    { code: 'EF01MA11', year: 1, thematicUnit: 'Geometria', knowledgeObject: 'Localização espacial - referencial próprio', description: 'Descrever a localização de pessoas e de objetos no espaço em relação à sua própria posição, utilizando termos como à direita, à esquerda, em frente, atrás.' },
    { code: 'EF01MA12', year: 1, thematicUnit: 'Geometria', knowledgeObject: 'Localização espacial - referencial externo', description: 'Descrever a localização de pessoas e de objetos no espaço segundo um dado ponto de referência, compreendendo que, para a utilização de termos que se referem à posição, como direita, esquerda, em cima, em baixo, é necessário explicitar-se o referencial.' },
    { code: 'EF01MA14', year: 1, thematicUnit: 'Geometria', knowledgeObject: 'Figuras geométricas planas', description: 'Identificar e nomear figuras planas (círculo, quadrado, retângulo e triângulo) em desenhos apresentados em diferentes disposições ou em contornos de faces de sólidos geométricos.' },
    { code: 'EF01MA15', year: 1, thematicUnit: 'Geometria', knowledgeObject: 'Classificação de figuras por atributo', description: 'Classificar objetos e figuras planas de acordo com um atributo (forma, tamanho, cor), dado ou identificado pelo próprio aluno.' },
    { code: 'EF01MA16', year: 1, thematicUnit: 'Geometria', knowledgeObject: 'Produção e reconhecimento de figuras planas', description: 'Produzir desenhos, pinturas, recortes e colagens para reconhecer e nomear figuras planas (círculo, quadrado, retângulo e triângulo) em diferentes disposições.' },
    { code: 'EF01MA17', year: 1, thematicUnit: 'Grandezas e Medidas', knowledgeObject: 'Comparação direta de grandezas', description: 'Produzir, interpretar e descrever informações relativas a comparações de grandezas, utilizando a linguagem comum e, progressivamente, modos de registro próprios.' },
    // 2º ANO
    { code: 'EF02MA01', year: 2, thematicUnit: 'Numeros', knowledgeObject: 'Comparar e ordenar naturais até centenas', description: 'Comparar e ordenar números naturais até a ordem de centenas.' },
    { code: 'EF02MA04', year: 2, thematicUnit: 'Numeros', knowledgeObject: 'Composição e decomposição de números naturais (3 ordens)', description: 'Compor e decompor números naturais de até três ordens, com suporte de material manipulável, por meio de diferentes adições.' },
    { code: 'EF02MA05', year: 2, thematicUnit: 'Numeros', knowledgeObject: 'Fatos básicos adição e subtração', description: 'Construir fatos básicos da adição e subtração.' },
    { code: 'EF02MA07', year: 2, thematicUnit: 'Numeros', knowledgeObject: 'Multiplicação por 2,3,4,5', description: 'Resolver e elaborar problemas de multiplicação por 2, 3, 4 e 5.' },
    // 3º ANO
    { code: 'EF03MA01', year: 3, thematicUnit: 'Numeros', knowledgeObject: 'Números naturais até milhar', description: 'Ler, escrever e comparar números naturais de até a ordem de unidade de milhar.' },
    { code: 'EF03MA02', year: 3, thematicUnit: 'Numeros', knowledgeObject: 'Composição e decomposição de números naturais (4 ordens)', description: 'Compor e decompor números naturais de até quatro ordens, com base em sua decomposição em unidades de milhar, centena, dezena e unidade, por meio de adições e multiplicações por potências de dez.' },
    { code: 'EF03MA07', year: 3, thematicUnit: 'Numeros', knowledgeObject: 'Multiplicação por 2,3,4,5,10', description: 'Resolver e elaborar problemas de multiplicação por 2, 3, 4, 5 e 10.' },
    { code: 'EF03MA08', year: 3, thematicUnit: 'Numeros', knowledgeObject: 'Divisão com resto zero e não zero', description: 'Resolver e elaborar problemas de divisão de um número natural por outro (até 10).' },
    // 4º ANO
    { code: 'EF04MA01', year: 4, thematicUnit: 'Numeros', knowledgeObject: 'Números até dezenas de milhar', description: 'Ler, escrever e ordenar números naturais até a ordem de dezenas de milhar.' },
    { code: 'EF04MA02', year: 4, thematicUnit: 'Numeros', knowledgeObject: 'Composição e decomposição por potências de dez', description: 'Mostrar, por decomposição e composição, que todo número natural pode ser escrito por meio de adições e multiplicações por potências de dez, para compreender o sistema de numeração decimal e desenvolver estratégias de cálculo.' },
    { code: 'EF04MA06', year: 4, thematicUnit: 'Numeros', knowledgeObject: 'Multiplicação significados', description: 'Resolver e elaborar problemas envolvendo diferentes significados da multiplicação.' },
    { code: 'EF04MA09', year: 4, thematicUnit: 'Numeros', knowledgeObject: 'Frações unitárias usuais', description: 'Reconhecer as frações unitárias mais usuais (1/2, 1/3, 1/4, 1/5, 1/10 e 1/100).' },
    // 5º ANO
    { code: 'EF05MA01', year: 5, thematicUnit: 'Numeros', knowledgeObject: 'Números até centenas de milhar', description: 'Ler, escrever e ordenar números naturais até a ordem das centenas de milhar.' },
    { code: 'EF05MA06', year: 5, thematicUnit: 'Numeros', knowledgeObject: 'Porcentagens 10% 25% 50% 75% 100%', description: 'Associar representações 10%, 25%, 50%, 75% e 100% para calcular porcentagens.' },
    // GEOMETRIA
    { code: 'EF01MA13', year: 1, thematicUnit: 'Geometria', knowledgeObject: 'Figuras geométricas espaciais', description: 'Relacionar figuras geométricas espaciais a objetos familiares do mundo físico.' },
    { code: 'EF02MA14', year: 2, thematicUnit: 'Geometria', knowledgeObject: 'Reconhecer figuras espaciais', description: 'Reconhecer, nomear e comparar figuras geométricas espaciais.' },
    { code: 'EF03MA15', year: 3, thematicUnit: 'Geometria', knowledgeObject: 'Classificar figuras planas', description: 'Classificar e comparar figuras planas em relação a lados e vértices.' },
  ];

  for (const skill of skills) {
    await dataSource.query(
      `INSERT INTO bncc_skills (code, year, thematic_unit, knowledge_object, description)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (code) DO NOTHING`,
      [skill.code, skill.year, skill.thematicUnit, skill.knowledgeObject, skill.description],
    );
  }

  console.log(`✅ BNCC Skills seeded: ${skills.length} records`);
};
