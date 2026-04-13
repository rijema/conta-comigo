import { DataSource } from 'typeorm';

export const BnccSkillsSeed = async (dataSource: DataSource): Promise<void> => {
  const skills = [
    // 1º ANO
    { code: 'EF01MA01', year: 1, thematicUnit: 'Numeros', knowledgeObject: 'Números como indicador de quantidade ou ordem', description: 'Utilizar números naturais como indicador de quantidade ou de ordem em diferentes situações cotidianas.' },
    { code: 'EF01MA02', year: 1, thematicUnit: 'Numeros', knowledgeObject: 'Contar exata ou aproximadamente', description: 'Contar de maneira exata ou aproximada, utilizando diferentes estratégias.' },
    { code: 'EF01MA03', year: 1, thematicUnit: 'Numeros', knowledgeObject: 'Estimar e comparar quantidades', description: 'Estimar e comparar quantidades de objetos de dois conjuntos.' },
    { code: 'EF01MA06', year: 1, thematicUnit: 'Numeros', knowledgeObject: 'Fatos básicos da adição', description: 'Construir fatos básicos da adição e utilizá-los em procedimentos de cálculo.' },
    { code: 'EF01MA08', year: 1, thematicUnit: 'Numeros', knowledgeObject: 'Adição e subtração', description: 'Resolver e elaborar problemas de adição e de subtração, envolvendo números de até dois algarismos.' },
    // 2º ANO
    { code: 'EF02MA01', year: 2, thematicUnit: 'Numeros', knowledgeObject: 'Comparar e ordenar naturais até centenas', description: 'Comparar e ordenar números naturais até a ordem de centenas.' },
    { code: 'EF02MA05', year: 2, thematicUnit: 'Numeros', knowledgeObject: 'Fatos básicos adição e subtração', description: 'Construir fatos básicos da adição e subtração.' },
    { code: 'EF02MA07', year: 2, thematicUnit: 'Numeros', knowledgeObject: 'Multiplicação por 2,3,4,5', description: 'Resolver e elaborar problemas de multiplicação por 2, 3, 4 e 5.' },
    // 3º ANO
    { code: 'EF03MA01', year: 3, thematicUnit: 'Numeros', knowledgeObject: 'Números naturais até milhar', description: 'Ler, escrever e comparar números naturais de até a ordem de unidade de milhar.' },
    { code: 'EF03MA07', year: 3, thematicUnit: 'Numeros', knowledgeObject: 'Multiplicação por 2,3,4,5,10', description: 'Resolver e elaborar problemas de multiplicação por 2, 3, 4, 5 e 10.' },
    { code: 'EF03MA08', year: 3, thematicUnit: 'Numeros', knowledgeObject: 'Divisão com resto zero e não zero', description: 'Resolver e elaborar problemas de divisão de um número natural por outro (até 10).' },
    // 4º ANO
    { code: 'EF04MA01', year: 4, thematicUnit: 'Numeros', knowledgeObject: 'Números até dezenas de milhar', description: 'Ler, escrever e ordenar números naturais até a ordem de dezenas de milhar.' },
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