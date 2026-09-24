import { DataSource } from 'typeorm';

export interface IslandExerciseMapping {
  islandId: string;
  islandName: string;
  topic: string;
  bnccSkills: string[];
  exerciseCount: number;
  exerciseTitles: string[];
}

export const ISLAND_MAPPINGS: IslandExerciseMapping[] = [
  {
    islandId: 'island-sun',
    islandName: 'Ilha do Sol',
    topic: 'Contagem',
    bnccSkills: ['EF01MA01', 'EF01MA02'],
    exerciseCount: 12,
    exerciseTitles: [
      'Conta as estrelas!',
      'Contar grupos de figuras',
      'Contar apenas os triângulos',
      'Somar os lápis das caixas',
      'Descobrir quantos livros faltam',
      'Ligar a quantidade ao número',
      'Contar os dedos da mão',
      'Contar os dedos das duas mãos',
      'Ler marcas e descobrir o número',
      'Juntar dezena e unidades',
      'Quantas maçãs?',
      'Contar frutas da feira',
    ],
  },
  {
    islandId: 'island-sea',
    islandName: 'Ilha do Mar',
    topic: 'Adição',
    bnccSkills: ['EF01MA06', 'EF01MA07'],
    exerciseCount: 12,
    exerciseTitles: [
      'Juntar bolas e contar',
      'Somar nos dedos',
      'Completar a conta de adição',
      'Formar o número dez',
      'Somar copos na mesa',
      'Comparar duas cestas de frutas',
      'Compre 4 pães e depois mais 3',
      'Uma cesta tem 7 maçãs e recebe 5 peras',
      'Junte 1 bola e 2 bolas',
      'Mostre 3 dedos e mais 2',
      'Na mesa havia 8 copos; chegaram mais 5',
      'Adicionar números em contexto',
    ],
  },
  {
    islandId: 'island-forest',
    islandName: 'Ilha da Floresta',
    topic: 'Subtração',
    bnccSkills: ['EF01MA08', 'EF01MA09'],
    exerciseCount: 12,
    exerciseTitles: [
      'Tirar um lápis e contar',
      'Abaixar dedos e contar',
      'Completar a conta de subtração',
      'Descobrir quantas figurinhas sobraram',
      'Descobrir quantos livros foram retirados',
      'Você tinha 7 moedas e gastou 2',
      'De 12 figurinhas, 5 foram dadas',
      'Há 3 lápis. Tire 1. Quantos restam?',
      'Mostre 5 dedos e abaixe 2',
      'Complete: 9 - __ = 6',
      'Subtrair em contexto de compras',
      'Remover objetos e contar',
    ],
  },
  {
    islandId: 'island-flowers',
    islandName: 'Ilha das Flores',
    topic: 'Comparação',
    bnccSkills: ['EF01MA03', 'EF01MA04'],
    exerciseCount: 12,
    exerciseTitles: [
      'Comparar dois grupos',
      'Descobrir se as quantidades são iguais',
      'Perceber qual pote tem menos',
      'Calcular quantos a mais',
      'Comparar resultados da coleta',
      'Qual grupo tem mais: três círculos ou dois triângulos?',
      'Há 4 bolas azuis e 4 vermelhas',
      'Qual pote parece ter menos',
      'Uma fila tem 9 crianças e outra tem 6',
      'Uma turma recolheu 14 papéis e outra 11',
      'Um saco tem 5 laranjas e outro 3',
      'Comparar quantidades em contexto',
    ],
  },
  {
    islandId: 'island-apples',
    islandName: 'Ilha das Maçãs',
    topic: 'Formas',
    bnccSkills: ['EF01MA14', 'EF01MA15'],
    exerciseCount: 12,
    exerciseTitles: [
      'Reconhecer o círculo',
      'Reconhecer o triângulo',
      'Encontrar a forma da porta',
      'Perceber a forma mesmo girada',
      'Comparar figuras com quatro lados',
      'Separar figuras sem pontas',
      'Encontrar a figura com três pontas',
      'Encontrar a figura com quatro lados',
      'Descobrir o que duas figuras têm em comum',
      'Encontrar a figura diferente do grupo',
      'Qual forma não tem lados retos?',
      'Um quadrado girado continua sendo qual forma?',
    ],
  },
  {
    islandId: 'island-animals',
    islandName: 'Ilha dos Animais',
    topic: 'Medidas',
    bnccSkills: ['EF01MA16', 'EF01MA17'],
    exerciseCount: 12,
    exerciseTitles: [
      'Comparar fitas',
      'Descobrir o pacote mais pesado',
      'Descobrir se as cordas têm o mesmo tamanho',
      'Calcular a diferença de comprimento',
      'Encontrar a medida do meio',
      'Uma fita mede 2 passos e outra 4',
      'Um pacote pesa 1 kg e outro 3 kg',
      'Duas cordas medem 5 palmos cada',
      'Uma fita mede 9 cm e outra 6 cm',
      'Qual medida fica entre 12 cm e 16 cm?',
      'Medir comprimentos',
      'Comparar pesos e tamanhos',
    ],
  },
  {
    islandId: 'island-magic',
    islandName: 'Ilha Mágica',
    topic: 'Sequências',
    bnccSkills: ['EF01MA10', 'EF01MA11'],
    exerciseCount: 12,
    exerciseTitles: [
      'Completar a contagem',
      'Descobrir o número anterior',
      'Descobrir o número que fica no meio',
      'Contar de dois em dois',
      'Completar a reta numérica',
      'Continue: azul, vermelho, azul, __',
      'Continue a sequência de formas',
      'Continue: 1 palito, 2 palitos, 3 palitos, __',
      'Continue: sol, lua, estrela, sol, lua, __',
      'Na sequência 2, 4, 6, 8, o próximo número é:',
      'Complete: 1, 2, __',
      'Descobrir padrões e sequências',
    ],
  },
  {
    islandId: 'island-love',
    islandName: 'Ilha do Amor',
    topic: 'Ordenação',
    bnccSkills: ['EF01MA05', 'EF01MA12'],
    exerciseCount: 12,
    exerciseTitles: [
      'Descobrir o que está em cima',
      'Descobrir o que está embaixo',
      'Descobrir quem está no meio',
      'Descobrir quem vem primeiro',
      'Descobrir esquerda e direita',
      'O livro está em cima da mesa',
      'A bola está debaixo da cadeira',
      'Ana está entre Bia e Caio',
      'Numa fila, Leo vem depois de Lia',
      'O copo está à esquerda do prato',
      'Ordenar objetos espacialmente',
      'Compreender posições relativas',
    ],
  },
];

export async function IslandExercisesMappingSeed(dataSource: DataSource) {
  const repo = dataSource.getRepository('island_exercises_mapping');

  const mappings = ISLAND_MAPPINGS.map((mapping) => ({
    islandId: mapping.islandId,
    islandName: mapping.islandName,
    topic: mapping.topic,
    bnccSkills: mapping.bnccSkills,
    exerciseCount: mapping.exerciseCount,
    exerciseTitles: mapping.exerciseTitles,
  }));

  for (const mapping of mappings) {
    const existing = await repo.findOne({
      where: { islandId: mapping.islandId },
    });
    if (!existing) {
      await repo.save(mapping);
    }
  }
}
