/**
 * Exercícios de progressão curricular (2º ao 5º ano).
 *
 * Por que existe: em out/2026, 173 de 194 exercícios ativos eram de 1º ano, e
 * as crianças (6–10 anos, 1º ao 5º ano) relataram que muitos eram "bobos para
 * a idade". Este arquivo SOMENTE ACRESCENTA exercícios; nenhum exercício,
 * tentativa ou histórico existente é alterado.
 *
 * Fundamentação de cada exercício (ver docs/research/BATCH_15_PROGRESSAO_CURRICULAR_PT.md):
 *  - `bnccSkills[0]`: habilidade da BNCC cujo texto oficial (MEC, 2018,
 *    BNCC_EI_EF_110518_versaofinal_site.pdf) descreve exatamente a tarefa.
 *  - `content.semantic.designBasis`: princípio de desenho com respaldo na
 *    literatura (chaves explicadas em DESIGN_BASIS abaixo).
 *
 * Restrições de interface (para renderizar o conteúdo real, e não um minigame
 * genérico): só usamos `quiz` com opções, `drag_drop` com `correctOrder` e
 * `representation_matching` com `interaction: 'categorize'` + `bins`.
 * Nenhum `semantic.niche` é 'comparison' e nenhum `structureId` contém
 * 'pattern', 'numberline' ou 'ordering.two_digit' (ver activity-renderer.tsx).
 *
 * Pictogramas: todos os `library.*` usados aqui foram conferidos visualmente
 * na API oficial do ARASAAC (out/2026) e registrados em
 * frontend/src/lib/pictograms.ts. Valores em reais são mostrados em texto,
 * porque os pictogramas de dinheiro do ARASAAC representam euros.
 */

export const DESIGN_BASIS = {
  /** Representações concretas/pictóricas antes da simbólica (CRA). Witzel, Mercer & Miller (2003); Fuchs et al. (2021, IES/WWC, recomendação 3). */
  CRA: 'concrete_representational_abstract',
  /** Problemas com estrutura explícita (juntar, separar, comparar, grupos iguais). Root et al. (2017); Fuchs et al. (2021, recomendação 4). */
  SCHEMA: 'schema_based_word_problem',
  /** Reta numérica como representação de magnitude, inclusive frações. Siegler et al. (2010, IES); Fuchs et al. (2021, recomendação 5). */
  NUMBER_LINE: 'number_line_magnitude',
  /** Suporte visual (pictogramas) — prática baseada em evidência para autismo. Steinbrenner et al. (2020, NCAEP). */
  VISUAL_SUPPORT: 'visual_support',
  /** Disposição retangular e grupos iguais para multiplicação (texto da BNCC EF03MA07/EF04MA06). */
  ARRAY: 'rectangular_array',
  /** Trajetórias de aprendizagem: comparação direta antes da medida com unidade. Clements & Sarama (2014). */
  TRAJECTORY: 'learning_trajectory',
} as const;

type Difficulty = 'easy' | 'medium' | 'hard';
type Basis = (typeof DESIGN_BASIS)[keyof typeof DESIGN_BASIS];

interface Option {
  text: string;
  /** Texto que a TitiA fala (sem símbolos como "/", "×", "R$" ou "°C"). */
  spoken?: string;
  pictogramConceptId?: string;
}

interface Group { label?: string; pictogramConceptIds: string[] }

interface BaseSpec {
  key: string;
  skill: string;
  title: string;
  difficulty: Difficulty;
  question: string;
  spokenQuestion?: string;
  steps: string[];
  hint: string;
  success: string;
  retry?: string;
  icon: string;
  basis: Basis[];
}

interface ChoiceSpec extends BaseSpec {
  kind: 'choice';
  groups?: Group[];
  options: Option[];
  correct: string;
}

interface OrderSpec extends BaseSpec {
  kind: 'order';
  items: Array<{ id: string; label: string; spoken?: string; pictogramConceptId?: string }>;
  correctOrder: string[];
  slotLabels: string[];
}

interface SortSpec extends BaseSpec {
  kind: 'sort';
  items: Array<{ id: string; label: string; pictogramConceptId: string }>;
  bins: Array<{ id: string; label: string; pictogramConceptId: string }>;
  correctOrder: string[];
}

type Spec = ChoiceSpec | OrderSpec | SortSpec;

const repeat = (count: number, conceptId: string): string[] => Array(count).fill(conceptId);

const POINTS: Record<Difficulty, number> = { easy: 20, medium: 25, hard: 35 };

// ─────────────────────────────────────────────────────────────────────────────
// 2º ANO — ponte entre o 1º ano e os anos seguintes
// ─────────────────────────────────────────────────────────────────────────────
const YEAR_2: Spec[] = [
  {
    kind: 'order', key: 'ef02ma01.ordem_centenas', skill: 'EF02MA01', difficulty: 'medium',
    title: 'Ordenar números com centenas',
    question: 'Coloque os números do menor para o maior.',
    steps: ['Olhe primeiro as centenas.', 'Se as centenas forem iguais, olhe as dezenas.', 'Coloque o menor no primeiro espaço.'],
    hint: 'Compare primeiro o algarismo das centenas.',
    success: 'Muito bem! Trezentos e cinco, trezentos e cinquenta, quinhentos e três.',
    icon: 'mathematics.order', basis: [DESIGN_BASIS.NUMBER_LINE],
    items: [
      { id: 'a', label: '503', spoken: 'quinhentos e três' },
      { id: 'b', label: '305', spoken: 'trezentos e cinco' },
      { id: 'c', label: '350', spoken: 'trezentos e cinquenta' },
    ],
    correctOrder: ['b', 'c', 'a'], slotLabels: ['menor', 'meio', 'maior'],
  },
  {
    kind: 'choice', key: 'ef02ma04.decompor_247', skill: 'EF02MA04', difficulty: 'easy',
    title: 'Decompor um número de três algarismos',
    question: 'Qual soma forma o número 247?',
    spokenQuestion: 'Qual soma forma o número duzentos e quarenta e sete?',
    steps: ['O 2 vale duzentos.', 'O 4 vale quarenta.', 'O 7 vale sete.', 'Escolha a soma certa.'],
    hint: 'Cada algarismo tem um valor diferente pela posição.',
    success: 'Isso! Duzentos mais quarenta mais sete é duzentos e quarenta e sete.',
    icon: 'mathematics.numbers', basis: [DESIGN_BASIS.CRA],
    options: [
      { text: '200 + 40 + 7', spoken: 'duzentos mais quarenta mais sete' },
      { text: '2 + 4 + 7', spoken: 'dois mais quatro mais sete' },
      { text: '200 + 4 + 7', spoken: 'duzentos mais quatro mais sete' },
    ],
    correct: '200 + 40 + 7',
  },
  {
    kind: 'choice', key: 'ef02ma03.quantos_a_mais', skill: 'EF02MA03', difficulty: 'easy',
    title: 'Descobrir quantas bolas a mais',
    question: 'Ana tem 8 bolas. Léo tem 5 bolas. Quantas bolas Ana tem a mais?',
    steps: ['Conte as bolas de Ana.', 'Conte as bolas de Léo.', 'Faça pares: uma de Ana com uma de Léo.', 'Quantas bolas de Ana ficaram sem par?'],
    hint: 'Faça pares, um a um. Conte as que sobram sem par.',
    success: 'Muito bem! Ana tem 3 bolas a mais.',
    icon: 'library.ball', basis: [DESIGN_BASIS.CRA, DESIGN_BASIS.SCHEMA],
    groups: [
      { label: 'Ana', pictogramConceptIds: repeat(8, 'library.ball') },
      { label: 'Léo', pictogramConceptIds: repeat(5, 'library.ball') },
    ],
    options: [{ text: '3' }, { text: '5' }, { text: '13' }],
    correct: '3',
  },
  {
    kind: 'choice', key: 'ef02ma18.dias_semana', skill: 'EF02MA18', difficulty: 'medium',
    title: 'Contar dias no calendário',
    question: 'Hoje é segunda-feira. A festa será daqui a 3 dias. Em que dia será a festa?',
    steps: ['Comece na segunda-feira.', 'Conte um dia: terça.', 'Dois dias: quarta.', 'Três dias: qual é?'],
    hint: 'Conte os dias da semana a partir de segunda-feira.',
    success: 'Isso! Três dias depois de segunda-feira é quinta-feira.',
    icon: 'library.calendar', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    groups: [{ pictogramConceptIds: ['library.week'] }],
    options: [{ text: 'quarta-feira' }, { text: 'quinta-feira' }, { text: 'sexta-feira' }],
    correct: 'quinta-feira',
  },
  {
    kind: 'choice', key: 'ef02ma07.grupos_iguais_morangos', skill: 'EF02MA07', difficulty: 'easy',
    title: 'Somar grupos iguais de morangos',
    question: 'Há 3 pratos com 4 morangos em cada um. Quantos morangos há ao todo?',
    steps: ['Cada prato tem 4 morangos.', 'São 3 pratos.', 'Quatro mais quatro mais quatro.', 'Escolha o total.'],
    hint: 'Some 4 + 4 + 4.',
    success: 'Muito bem! Três grupos de quatro são doze morangos.',
    icon: 'library.strawberry', basis: [DESIGN_BASIS.CRA, DESIGN_BASIS.SCHEMA],
    groups: [
      { label: 'prato 1', pictogramConceptIds: repeat(4, 'library.strawberry') },
      { label: 'prato 2', pictogramConceptIds: repeat(4, 'library.strawberry') },
      { label: 'prato 3', pictogramConceptIds: repeat(4, 'library.strawberry') },
    ],
    options: [{ text: '7' }, { text: '12' }, { text: '16' }],
    correct: '12',
  },
  {
    kind: 'choice', key: 'ef02ma08.triplo_baloes', skill: 'EF02MA08', difficulty: 'medium',
    title: 'Descobrir o triplo de balões',
    question: 'Rui tem 5 balões. Bia tem o triplo. Quantos balões Bia tem?',
    steps: ['Triplo é três vezes a mesma quantidade.', 'Cinco mais cinco mais cinco.', 'Escolha o total.'],
    hint: 'Triplo é 3 vezes: 5 + 5 + 5.',
    success: 'Isso! O triplo de cinco é quinze.',
    icon: 'library.balloon', basis: [DESIGN_BASIS.CRA],
    groups: [{ label: 'Rui', pictogramConceptIds: repeat(5, 'library.balloon') }],
    options: [{ text: '8' }, { text: '10' }, { text: '15' }],
    correct: '15',
  },
  {
    kind: 'choice', key: 'ef02ma06.livros_estante', skill: 'EF02MA06', difficulty: 'medium',
    title: 'Livros que sobraram na estante',
    question: 'Na estante havia 135 livros. Foram retirados 20 livros. Quantos livros sobraram?',
    spokenQuestion: 'Na estante havia cento e trinta e cinco livros. Foram retirados vinte livros. Quantos livros sobraram?',
    steps: ['Comece com cento e trinta e cinco.', 'Tire vinte: tire duas dezenas.', 'Escolha quantos sobraram.'],
    hint: 'Tirar 20 é tirar 2 dezenas. As unidades não mudam.',
    success: 'Muito bem! Sobraram cento e quinze livros.',
    icon: 'library.book', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: '115' }, { text: '133' }, { text: '155' }],
    correct: '115',
  },
  {
    kind: 'choice', key: 'ef02ma06.figurinhas_restaram', skill: 'EF02MA06', difficulty: 'hard',
    title: 'Figurinhas que restaram',
    question: 'Lia tinha 48 figurinhas. Ela deu 15 para o irmão. Quantas figurinhas restaram?',
    steps: ['Comece com quarenta e oito.', 'Tire uma dezena: trinta e oito.', 'Tire mais cinco.', 'Escolha quantas restaram.'],
    hint: 'Tire primeiro 10, depois tire 5.',
    success: 'Isso! Restaram trinta e três figurinhas.',
    icon: 'library.book', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: '23' }, { text: '33' }, { text: '63' }],
    correct: '33',
  },
  {
    kind: 'choice', key: 'ef02ma09.de_5_em_5', skill: 'EF02MA09', difficulty: 'easy',
    title: 'Continuar contando de 5 em 5',
    question: 'Continue contando de 5 em 5: 15, 20, 25, ...',
    spokenQuestion: 'Continue contando de cinco em cinco: quinze, vinte, vinte e cinco. Qual vem depois?',
    steps: ['Os números aumentam cinco de cada vez.', 'Vinte e cinco mais cinco.', 'Escolha o próximo número.'],
    hint: 'Some 5 ao último número.',
    success: 'Muito bem! Depois de vinte e cinco vem trinta.',
    icon: 'mathematics.sequence', basis: [DESIGN_BASIS.NUMBER_LINE],
    options: [{ text: '26' }, { text: '30' }, { text: '35' }],
    correct: '30',
  },
  {
    kind: 'choice', key: 'ef02ma11.faltante_decrescente', skill: 'EF02MA11', difficulty: 'medium',
    title: 'Encontrar o número que falta descendo',
    question: 'Qual número está faltando? 40, 38, 36, __, 32',
    spokenQuestion: 'Qual número está faltando? Quarenta, trinta e oito, trinta e seis, espaço vazio, trinta e dois.',
    steps: ['Os números diminuem.', 'De quarenta para trinta e oito, tirou dois.', 'Tire dois de trinta e seis.'],
    hint: 'A sequência diminui de 2 em 2.',
    success: 'Isso! O número que falta é trinta e quatro.',
    icon: 'mathematics.sequence', basis: [DESIGN_BASIS.NUMBER_LINE],
    options: [{ text: '33' }, { text: '34' }, { text: '35' }],
    correct: '34',
  },
  {
    kind: 'choice', key: 'ef02ma14.bola_esfera', skill: 'EF02MA14', difficulty: 'easy',
    title: 'A bola parece com qual figura',
    question: 'A bola parece com qual figura geométrica espacial?',
    steps: ['Olhe a bola.', 'Ela é redonda por todos os lados.', 'Escolha a figura parecida.'],
    hint: 'Procure a figura redonda de todos os lados.',
    success: 'Muito bem! A bola parece uma esfera.',
    icon: 'library.sphere', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    groups: [{ pictogramConceptIds: ['library.ball'] }],
    options: [
      { text: 'esfera', pictogramConceptId: 'library.sphere' },
      { text: 'cubo', pictogramConceptId: 'library.cube' },
      { text: 'cone', pictogramConceptId: 'library.cone' },
    ],
    correct: 'esfera',
  },
  {
    kind: 'choice', key: 'ef02ma15.tres_lados', skill: 'EF02MA15', difficulty: 'easy',
    title: 'Qual figura tem três lados',
    question: 'Qual figura plana tem 3 lados?',
    steps: ['Conte os lados de cada figura.', 'Escolha a que tem três lados.'],
    hint: 'Passe o dedo em cada lado e conte.',
    success: 'Isso! O triângulo tem três lados.',
    icon: 'library.triangle', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    options: [
      { text: 'triângulo', pictogramConceptId: 'library.triangle' },
      { text: 'quadrado', pictogramConceptId: 'library.square' },
      { text: 'círculo', pictogramConceptId: 'library.circle' },
    ],
    correct: 'triângulo',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3º ANO
// ─────────────────────────────────────────────────────────────────────────────
const YEAR_3: Spec[] = [
  // Ilha das Estrelinhas (números)
  {
    kind: 'choice', key: 'ef03ma01.escrever_milhar', skill: 'EF03MA01', difficulty: 'easy',
    title: 'Escrever mil duzentos e cinco',
    question: 'Como se escreve "mil duzentos e cinco" com algarismos?',
    steps: ['Mil tem quatro algarismos.', 'Duzentos fica na casa das centenas.', 'Não há dezenas: use zero.', 'Cinco fica nas unidades.'],
    hint: 'Não tem dezena. O zero guarda o lugar das dezenas.',
    success: 'Muito bem! Mil duzentos e cinco se escreve um, dois, zero, cinco.',
    icon: 'mathematics.numbers', basis: [DESIGN_BASIS.CRA],
    options: [
      { text: '1.205', spoken: 'um, dois, zero, cinco' },
      { text: '1.250', spoken: 'um, dois, cinco, zero' },
      { text: '125', spoken: 'um, dois, cinco' },
    ],
    correct: '1.205',
  },
  {
    kind: 'choice', key: 'ef03ma02.valor_posicional_4', skill: 'EF03MA02', difficulty: 'medium',
    title: 'Valor do algarismo pela posição',
    question: 'No número 3.482, quanto vale o algarismo 4?',
    spokenQuestion: 'No número três mil quatrocentos e oitenta e dois, quanto vale o algarismo quatro?',
    steps: ['Da direita para a esquerda: unidades, dezenas, centenas, milhar.', 'O quatro está na casa das centenas.', 'Escolha o valor.'],
    hint: 'O 4 está na terceira casa, contando da direita.',
    success: 'Isso! O quatro vale quatrocentos.',
    icon: 'mathematics.numbers', basis: [DESIGN_BASIS.CRA],
    options: [{ text: '4' }, { text: '40' }, { text: '400', spoken: 'quatrocentos' }, { text: '4.000', spoken: 'quatro mil' }],
    correct: '400',
  },
  {
    kind: 'choice', key: 'ef03ma04.reta_centenas', skill: 'EF03MA04', difficulty: 'easy',
    title: 'Número escondido na reta',
    question: 'Na reta numérica os números vão de 100 em 100: 100, 200, __, 400. Qual número falta?',
    spokenQuestion: 'Na reta numérica os números vão de cem em cem: cem, duzentos, espaço vazio, quatrocentos. Qual número falta?',
    steps: ['Cada salto na reta é de cem.', 'Duzentos mais cem.', 'Escolha o número.'],
    hint: 'Ande 100 para a direita a partir do 200.',
    success: 'Muito bem! O número que falta é trezentos.',
    icon: 'math.number_line', basis: [DESIGN_BASIS.NUMBER_LINE],
    options: [{ text: '250' }, { text: '300' }, { text: '500' }],
    correct: '300',
  },
  {
    kind: 'order', key: 'ef03ma01.ordenar_milhar', skill: 'EF03MA01', difficulty: 'hard',
    title: 'Ordenar números parecidos com milhar',
    question: 'Coloque os números do menor para o maior.',
    steps: ['Todos começam com mil.', 'Compare as centenas.', 'Se forem iguais, compare as dezenas.'],
    hint: 'Os três têm 1 milhar. Compare o algarismo das centenas.',
    success: 'Excelente! Mil e noventa e nove, mil novecentos e nove, mil novecentos e noventa.',
    icon: 'mathematics.order', basis: [DESIGN_BASIS.NUMBER_LINE],
    items: [
      { id: 'a', label: '1.990', spoken: 'mil novecentos e noventa' },
      { id: 'b', label: '1.099', spoken: 'mil e noventa e nove' },
      { id: 'c', label: '1.909', spoken: 'mil novecentos e nove' },
    ],
    correctOrder: ['b', 'c', 'a'], slotLabels: ['menor', 'meio', 'maior'],
  },
  // Ilha dos Gigantes e Formiguinhas (comparar e medir)
  {
    kind: 'choice', key: 'ef03ma18.unidade_centimetro', skill: 'EF03MA18', difficulty: 'easy',
    title: 'Escolher o que medir em centímetros',
    question: 'O que é melhor medir com centímetros?',
    steps: ['Centímetro é uma medida pequena.', 'Pense em algo pequeno que cabe na régua.', 'Escolha.'],
    hint: 'Uma régua escolar mede em centímetros.',
    success: 'Muito bem! O lápis é pequeno, medimos em centímetros.',
    icon: 'library.ruler', basis: [DESIGN_BASIS.TRAJECTORY],
    options: [
      { text: 'o lápis', pictogramConceptId: 'library.pencil' },
      { text: 'a viagem de ônibus', pictogramConceptId: 'library.bus' },
      { text: 'o caminho até a escola', pictogramConceptId: 'library.backpack' },
    ],
    correct: 'o lápis',
  },
  {
    kind: 'choice', key: 'ef03ma23.ler_hora_digital', skill: 'EF03MA23', difficulty: 'easy',
    title: 'Ler a hora no relógio digital',
    question: 'O relógio digital mostra 08:30. Que horas são?',
    spokenQuestion: 'O relógio digital mostra oito, dois pontos, trinta. Que horas são?',
    steps: ['O número antes dos dois pontos é a hora.', 'O número depois é dos minutos.', 'Trinta minutos é meia hora.'],
    hint: '30 minutos é meia hora.',
    success: 'Isso! São oito e meia.',
    icon: 'library.digital_clock', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    groups: [{ label: '08:30', pictogramConceptIds: [] }],
    options: [{ text: 'oito e meia' }, { text: 'oito horas' }, { text: 'três e oito' }],
    correct: 'oito e meia',
  },
  {
    kind: 'choice', key: 'ef03ma22.duracao_recreio', skill: 'EF03MA22', difficulty: 'medium',
    title: 'Quanto tempo durou o recreio',
    question: 'O recreio começou às 10:00 e terminou às 10:20. Quanto tempo durou?',
    spokenQuestion: 'O recreio começou às dez horas e terminou às dez e vinte. Quanto tempo durou?',
    steps: ['A hora é a mesma: dez.', 'Os minutos foram de zero até vinte.', 'Escolha a duração.'],
    hint: 'Olhe só os minutos: de 0 até 20.',
    success: 'Muito bem! O recreio durou vinte minutos.',
    icon: 'library.digital_clock', basis: [DESIGN_BASIS.SCHEMA],
    groups: [{ label: 'início 10:00', pictogramConceptIds: [] }, { label: 'fim 10:20', pictogramConceptIds: [] }],
    options: [{ text: '10 minutos' }, { text: '20 minutos' }, { text: '1 hora' }],
    correct: '20 minutos',
  },
  {
    kind: 'choice', key: 'ef03ma24.dupla_dez_reais', skill: 'EF03MA24', difficulty: 'hard',
    title: 'Comprar o lanche com dez reais',
    question: 'Sanduíche R$ 7, suco R$ 4, maçã R$ 3. Qual dupla custa exatamente R$ 10?',
    spokenQuestion: 'O sanduíche custa sete reais, o suco quatro reais e a maçã três reais. Qual dupla custa exatamente dez reais?',
    steps: ['Some os preços de cada dupla.', 'Sanduíche e maçã: sete mais três.', 'Suco e maçã: quatro mais três.', 'Escolha a dupla que dá dez.'],
    hint: 'Some os preços de cada dupla e compare com 10.',
    success: 'Excelente! Sanduíche e maçã custam dez reais.',
    icon: 'library.piggy_bank', basis: [DESIGN_BASIS.SCHEMA, DESIGN_BASIS.VISUAL_SUPPORT],
    groups: [
      { label: 'R$ 7', pictogramConceptIds: ['library.sandwich'] },
      { label: 'R$ 4', pictogramConceptIds: ['library.juice'] },
      { label: 'R$ 3', pictogramConceptIds: ['object.apple'] },
    ],
    options: [{ text: 'sanduíche e maçã' }, { text: 'suco e maçã' }, { text: 'sanduíche e suco' }],
    correct: 'sanduíche e maçã',
  },
  // Ilha do Pomar (somar e multiplicar)
  {
    kind: 'choice', key: 'ef03ma07.pomar_fileiras', skill: 'EF03MA07', difficulty: 'easy',
    title: 'Contar árvores em fileiras',
    question: 'O pomar tem 3 fileiras com 5 árvores em cada uma. Quantas árvores há?',
    steps: ['Cada fileira tem cinco árvores.', 'São três fileiras.', 'Três vezes cinco.'],
    hint: 'Conte de 5 em 5: 5, 10, ...',
    success: 'Muito bem! Três fileiras de cinco são quinze árvores.',
    icon: 'library.tree', basis: [DESIGN_BASIS.ARRAY, DESIGN_BASIS.CRA],
    groups: [
      { pictogramConceptIds: repeat(5, 'library.tree') },
      { pictogramConceptIds: repeat(5, 'library.tree') },
      { pictogramConceptIds: repeat(5, 'library.tree') },
    ],
    options: [{ text: '8' }, { text: '15' }, { text: '20' }],
    correct: '15',
  },
  {
    kind: 'choice', key: 'ef03ma07.caixas_de_10', skill: 'EF03MA07', difficulty: 'medium',
    title: 'Lápis em caixas de dez',
    question: 'Cada caixa tem 10 lápis. Quantos lápis há em 4 caixas?',
    steps: ['Cada caixa tem dez.', 'São quatro caixas.', 'Conte de dez em dez quatro vezes.'],
    hint: 'Conte de 10 em 10: 10, 20, 30, ...',
    success: 'Isso! Quatro caixas de dez são quarenta lápis.',
    icon: 'library.pencil', basis: [DESIGN_BASIS.SCHEMA],
    groups: [{ pictogramConceptIds: repeat(4, 'library.box') }],
    options: [{ text: '14' }, { text: '40' }, { text: '104' }],
    correct: '40',
  },
  {
    kind: 'choice', key: 'ef03ma03.dobrar_fato', skill: 'EF03MA03', difficulty: 'hard',
    title: 'Usar uma conta conhecida',
    question: 'Se 5 × 4 = 20, quanto é 5 × 8?',
    spokenQuestion: 'Se cinco vezes quatro é vinte, quanto é cinco vezes oito?',
    steps: ['Oito é o dobro de quatro.', 'Então o resultado também dobra.', 'Qual é o dobro de vinte?'],
    hint: '8 é o dobro de 4. Dobre o 20.',
    success: 'Excelente! Cinco vezes oito é quarenta.',
    icon: 'mathematics.numbers', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: '24' }, { text: '28' }, { text: '40' }],
    correct: '40',
  },
  {
    kind: 'choice', key: 'ef03ma06.livros_ao_todo', skill: 'EF03MA06', difficulty: 'medium',
    title: 'Livros recebidos ao todo',
    question: 'A escola recebeu 245 livros em março e 130 livros em abril. Quantos livros recebeu ao todo?',
    spokenQuestion: 'A escola recebeu duzentos e quarenta e cinco livros em março e cento e trinta livros em abril. Quantos livros recebeu ao todo?',
    steps: ['Junte as centenas: duzentos mais cem.', 'Junte as dezenas: quarenta mais trinta.', 'Junte as unidades.'],
    hint: 'Some centenas com centenas e dezenas com dezenas.',
    success: 'Muito bem! Ao todo foram trezentos e setenta e cinco livros.',
    icon: 'library.book', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: '375' }, { text: '275' }, { text: '115' }],
    correct: '375',
  },
  // Ilha dos Biscoitos (tirar e repartir)
  {
    kind: 'choice', key: 'ef03ma08.resto_biscoitos', skill: 'EF03MA08', difficulty: 'medium',
    title: 'Biscoitos que sobram na divisão',
    question: '14 biscoitos serão divididos igualmente entre 4 amigos. Quantos biscoitos sobram?',
    spokenQuestion: 'Catorze biscoitos serão divididos igualmente entre quatro amigos. Quantos biscoitos sobram?',
    steps: ['Dê um biscoito para cada amigo, várias vezes.', 'Cada amigo recebe três.', 'Quatro vezes três é doze.', 'Quantos sobram dos catorze?'],
    hint: 'Cada amigo recebe 3. Veja quantos ficam sem dono.',
    success: 'Isso! Cada amigo recebe três e sobram dois biscoitos.',
    icon: 'library.cookie', basis: [DESIGN_BASIS.CRA, DESIGN_BASIS.SCHEMA],
    groups: [{ pictogramConceptIds: repeat(14, 'library.cookie') }],
    options: [{ text: '0' }, { text: '2' }, { text: '3' }],
    correct: '2',
  },
  {
    kind: 'choice', key: 'ef03ma08.caixas_de_ovos', skill: 'EF03MA08', difficulty: 'easy',
    title: 'Quantas caixas de ovos enchemos',
    question: 'Temos 20 ovos. Cada caixa leva 5 ovos. Quantas caixas enchemos?',
    steps: ['Encha uma caixa com cinco ovos.', 'Continue até acabar os ovos.', 'Conte as caixas.'],
    hint: 'Conte de 5 em 5 até chegar em 20.',
    success: 'Muito bem! Enchemos quatro caixas.',
    icon: 'library.egg', basis: [DESIGN_BASIS.CRA],
    groups: [{ pictogramConceptIds: repeat(20, 'library.egg') }],
    options: [{ text: '4' }, { text: '5' }, { text: '15' }],
    correct: '4',
  },
  {
    kind: 'choice', key: 'ef03ma09.terca_parte', skill: 'EF03MA09', difficulty: 'medium',
    title: 'A terça parte das maçãs',
    question: 'Qual é a terça parte de 12 maçãs?',
    steps: ['Terça parte é dividir em três grupos iguais.', 'Separe as doze maçãs em três grupos.', 'Quantas ficam em cada grupo?'],
    hint: 'Divida 12 em 3 grupos iguais.',
    success: 'Isso! A terça parte de doze é quatro.',
    icon: 'object.apple', basis: [DESIGN_BASIS.CRA],
    groups: [{ pictogramConceptIds: repeat(12, 'object.apple') }],
    options: [{ text: '3' }, { text: '4' }, { text: '6' }],
    correct: '4',
  },
  {
    kind: 'choice', key: 'ef03ma06.lugares_faltam', skill: 'EF03MA06', difficulty: 'hard',
    title: 'Lugares que faltam no ônibus',
    question: 'Um ônibus tem 40 lugares. Já sentaram 26 pessoas. Quantos lugares faltam ocupar?',
    spokenQuestion: 'Um ônibus tem quarenta lugares. Já sentaram vinte e seis pessoas. Quantos lugares faltam ocupar?',
    steps: ['Comece do vinte e seis.', 'Até trinta faltam quatro.', 'De trinta até quarenta faltam dez.', 'Junte os dois.'],
    hint: 'Complete de 26 até 40.',
    success: 'Excelente! Faltam catorze lugares.',
    icon: 'library.bus', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: '14' }, { text: '16' }, { text: '66' }],
    correct: '14',
  },
  // Ilha do Arco-Íris (padrões e igualdades)
  {
    kind: 'choice', key: 'ef03ma10.regra_mais_4', skill: 'EF03MA10', difficulty: 'easy',
    title: 'Descobrir a regra da sequência',
    question: 'Qual é a regra da sequência 7, 11, 15, 19?',
    spokenQuestion: 'Qual é a regra da sequência sete, onze, quinze, dezenove?',
    steps: ['Veja quanto aumenta de um número para o outro.', 'De sete para onze aumenta quanto?', 'Confira nos outros.'],
    hint: 'Calcule 11 menos 7.',
    success: 'Muito bem! A regra é somar quatro.',
    icon: 'mathematics.sequence', basis: [DESIGN_BASIS.NUMBER_LINE],
    options: [{ text: 'somar 3' }, { text: 'somar 4' }, { text: 'somar 7' }],
    correct: 'somar 4',
  },
  {
    kind: 'choice', key: 'ef03ma10.descendo_de_6', skill: 'EF03MA10', difficulty: 'medium',
    title: 'Próximo número descendo de 6 em 6',
    question: 'Qual número vem a seguir? 60, 54, 48, 42, ...',
    spokenQuestion: 'Qual número vem a seguir? Sessenta, cinquenta e quatro, quarenta e oito, quarenta e dois.',
    steps: ['Os números diminuem.', 'De sessenta para cinquenta e quatro, tirou seis.', 'Tire seis de quarenta e dois.'],
    hint: 'A sequência diminui de 6 em 6.',
    success: 'Isso! Depois de quarenta e dois vem trinta e seis.',
    icon: 'mathematics.sequence', basis: [DESIGN_BASIS.NUMBER_LINE],
    options: [{ text: '36' }, { text: '38' }, { text: '40' }],
    correct: '36',
  },
  {
    kind: 'choice', key: 'ef03ma11.mesma_soma', skill: 'EF03MA11', difficulty: 'medium',
    title: 'Duas contas com o mesmo resultado',
    question: 'Qual conta tem o mesmo resultado que 9 + 6?',
    spokenQuestion: 'Qual conta tem o mesmo resultado que nove mais seis?',
    steps: ['Nove mais seis é quinze.', 'Calcule cada opção.', 'Escolha a que também dá quinze.'],
    hint: 'Calcule 9 + 6 primeiro.',
    success: 'Muito bem! Dez mais cinco também é quinze.',
    icon: 'mathematics.equal', basis: [DESIGN_BASIS.SCHEMA],
    options: [
      { text: '10 + 5', spoken: 'dez mais cinco' },
      { text: '9 + 5', spoken: 'nove mais cinco' },
      { text: '10 + 6', spoken: 'dez mais seis' },
    ],
    correct: '10 + 5',
  },
  {
    kind: 'choice', key: 'ef03ma11.equilibrar_igualdade', skill: 'EF03MA11', difficulty: 'hard',
    title: 'Completar a igualdade',
    question: 'Complete para os dois lados ficarem iguais: 12 + 8 = 15 + __',
    spokenQuestion: 'Complete para os dois lados ficarem iguais: doze mais oito é igual a quinze mais quanto?',
    steps: ['Doze mais oito é vinte.', 'O outro lado também precisa dar vinte.', 'Quinze mais quanto dá vinte?'],
    hint: 'Os dois lados precisam dar 20.',
    success: 'Excelente! Quinze mais cinco é vinte.',
    icon: 'mathematics.equal', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: '5' }, { text: '8' }, { text: '20' }],
    correct: '5',
  },
  // Ilha do Castelo das Formas
  {
    kind: 'choice', key: 'ef03ma13.caixa_bloco', skill: 'EF03MA13', difficulty: 'easy',
    title: 'A caixa parece com qual figura',
    question: 'Uma caixa de sapato parece com qual figura geométrica espacial?',
    steps: ['Olhe a caixa.', 'Ela tem faces retangulares.', 'Escolha a figura parecida.'],
    hint: 'Procure a figura com faces retangulares.',
    success: 'Muito bem! A caixa parece um bloco retangular.',
    icon: 'library.box', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    groups: [{ pictogramConceptIds: ['library.box'] }],
    // Sem pictogramas nas opções: o ARASAAC não tem "bloco retangular", e
    // mostrar um cubo na resposta certa seria impreciso.
    options: [{ text: 'bloco retangular' }, { text: 'pirâmide' }, { text: 'esfera' }],
    correct: 'bloco retangular',
  },
  {
    kind: 'choice', key: 'ef03ma13.objeto_cone', skill: 'EF03MA13', difficulty: 'easy',
    title: 'Qual objeto tem forma de cone',
    question: 'Qual objeto tem a forma de um cone?',
    steps: ['O cone tem uma ponta e uma base redonda.', 'Olhe cada objeto.', 'Escolha o que parece um cone.'],
    hint: 'O cone tem uma ponta de um lado e é redondo do outro.',
    success: 'Isso! A casquinha de sorvete parece um cone.',
    icon: 'library.cone', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    options: [
      { text: 'casquinha de sorvete', pictogramConceptId: 'library.ice_cream_cone' },
      { text: 'bola', pictogramConceptId: 'library.ball' },
      { text: 'dado', pictogramConceptId: 'library.die' },
    ],
    correct: 'casquinha de sorvete',
  },
  {
    kind: 'choice', key: 'ef03ma14.ponta_base_redonda', skill: 'EF03MA14', difficulty: 'medium',
    title: 'Figura com ponta e base redonda',
    question: 'Qual figura espacial tem uma ponta (vértice) e uma base redonda?',
    steps: ['Olhe cada figura.', 'Procure uma ponta.', 'Procure uma base redonda.'],
    hint: 'O cilindro tem duas bases redondas e nenhuma ponta.',
    success: 'Muito bem! O cone tem uma ponta e uma base redonda.',
    icon: 'library.cone', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    options: [
      { text: 'cone', pictogramConceptId: 'library.cone' },
      { text: 'cilindro', pictogramConceptId: 'library.cylinder' },
      { text: 'cubo', pictogramConceptId: 'library.cube' },
    ],
    correct: 'cone',
  },
  {
    kind: 'sort', key: 'ef03ma15.separar_por_lados', skill: 'EF03MA15', difficulty: 'medium',
    title: 'Separar figuras pelo número de lados',
    question: 'Separe as figuras: 3 lados ou 4 lados.',
    steps: ['Toque em uma figura.', 'Conte os lados dela.', 'Depois toque no grupo certo.'],
    hint: 'Conte os lados passando o dedo em cada um.',
    success: 'Excelente! O triângulo tem três lados. As outras figuras têm quatro.',
    icon: 'library.triangle', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    items: [
      { id: 'a', label: 'triângulo', pictogramConceptId: 'library.triangle' },
      { id: 'b', label: 'quadrado', pictogramConceptId: 'library.square' },
      { id: 'c', label: 'retângulo', pictogramConceptId: 'library.rectangle' },
      { id: 'd', label: 'losango', pictogramConceptId: 'library.diamond' },
    ],
    bins: [
      { id: 'three', label: '3 lados', pictogramConceptId: 'library.triangle' },
      { id: 'four', label: '4 lados', pictogramConceptId: 'library.square' },
    ],
    correctOrder: ['three', 'four', 'four', 'four'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4º ANO
// ─────────────────────────────────────────────────────────────────────────────
const YEAR_4: Spec[] = [
  // Números
  {
    kind: 'choice', key: 'ef04ma01.escrever_dezena_milhar', skill: 'EF04MA01', difficulty: 'easy',
    title: 'Escrever vinte e três mil e quarenta',
    question: 'Como se escreve "vinte e três mil e quarenta" com algarismos?',
    steps: ['Vinte e três mil ocupa as casas do milhar.', 'Não há centenas: use zero.', 'Quarenta é quatro dezenas.', 'Não há unidades: use zero.'],
    hint: 'Não tem centena nem unidade. Use zeros.',
    success: 'Muito bem! Vinte e três mil e quarenta: dois, três, zero, quatro, zero.',
    icon: 'mathematics.numbers', basis: [DESIGN_BASIS.CRA],
    options: [
      { text: '23.040', spoken: 'dois, três, zero, quatro, zero' },
      { text: '23.400', spoken: 'dois, três, quatro, zero, zero' },
      { text: '2.340', spoken: 'dois, três, quatro, zero' },
    ],
    correct: '23.040',
  },
  {
    kind: 'choice', key: 'ef04ma02.decompor_potencias', skill: 'EF04MA02', difficulty: 'hard',
    title: 'Decompor com potências de dez',
    question: 'Qual decomposição forma 40.508?',
    spokenQuestion: 'Qual decomposição forma quarenta mil quinhentos e oito?',
    steps: ['O quatro vale quatro dezenas de milhar.', 'O cinco vale cinco centenas.', 'O oito vale oito unidades.', 'Os zeros não somam nada.'],
    hint: 'O 4 está na casa das dezenas de milhar.',
    success: 'Excelente! Quatro vezes dez mil, mais cinco vezes cem, mais oito.',
    icon: 'mathematics.numbers', basis: [DESIGN_BASIS.CRA],
    options: [
      { text: '4 × 10.000 + 5 × 100 + 8', spoken: 'quatro vezes dez mil, mais cinco vezes cem, mais oito' },
      { text: '4 × 1.000 + 5 × 100 + 8', spoken: 'quatro vezes mil, mais cinco vezes cem, mais oito' },
      { text: '4 × 10.000 + 5 × 10 + 8', spoken: 'quatro vezes dez mil, mais cinco vezes dez, mais oito' },
    ],
    correct: '4 × 10.000 + 5 × 100 + 8',
  },
  {
    kind: 'order', key: 'ef04ma01.ordem_decrescente', skill: 'EF04MA01', difficulty: 'medium',
    title: 'Ordenar do maior para o menor',
    question: 'Coloque os números do maior para o menor.',
    steps: ['Compare as dezenas de milhar.', 'Depois compare os milhares.', 'Depois as centenas.', 'Coloque o maior primeiro.'],
    hint: 'Compare da esquerda para a direita, casa por casa.',
    success: 'Muito bem! Vinte e um mil quatrocentos e cinco é o maior.',
    icon: 'mathematics.order', basis: [DESIGN_BASIS.NUMBER_LINE],
    items: [
      { id: 'a', label: '12.045', spoken: 'doze mil e quarenta e cinco' },
      { id: 'b', label: '21.405', spoken: 'vinte e um mil quatrocentos e cinco' },
      { id: 'c', label: '12.450', spoken: 'doze mil quatrocentos e cinquenta' },
    ],
    correctOrder: ['b', 'c', 'a'], slotLabels: ['maior', 'meio', 'menor'],
  },
  {
    kind: 'choice', key: 'ef04ma10.reais_centavos', skill: 'EF04MA10', difficulty: 'easy',
    title: 'Reais e centavos',
    question: 'R$ 2,50 é o mesmo que:',
    spokenQuestion: 'Dois reais e cinquenta centavos é o mesmo que:',
    steps: ['O número antes da vírgula são os reais.', 'Depois da vírgula são os centavos.', 'Escolha a resposta.'],
    hint: 'Antes da vírgula: reais. Depois da vírgula: centavos.',
    success: 'Isso! São dois reais e cinquenta centavos.',
    icon: 'library.piggy_bank', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: '2 reais e 50 centavos' }, { text: '25 reais' }, { text: '2 reais e 5 centavos' }],
    correct: '2 reais e 50 centavos',
  },
  // Comparar e medir
  {
    kind: 'choice', key: 'ef04ma20.perimetro_quadrado', skill: 'EF04MA20', difficulty: 'medium',
    title: 'Perímetro do quadrado',
    question: 'Um quadrado tem lados de 5 cm. Qual é o perímetro (a volta toda)?',
    spokenQuestion: 'Um quadrado tem lados de cinco centímetros. Qual é o perímetro, a volta toda?',
    steps: ['O quadrado tem quatro lados iguais.', 'Cada lado mede cinco centímetros.', 'Some os quatro lados.'],
    hint: 'Some 5 + 5 + 5 + 5.',
    success: 'Muito bem! O perímetro é vinte centímetros.',
    icon: 'library.ruler', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    groups: [{ label: 'lado = 5 cm', pictogramConceptIds: ['library.square'] }],
    options: [
      { text: '10 cm', spoken: 'dez centímetros' },
      { text: '20 cm', spoken: 'vinte centímetros' },
      { text: '25 cm', spoken: 'vinte e cinco centímetros' },
    ],
    correct: '20 cm',
  },
  {
    kind: 'choice', key: 'ef04ma22.fim_do_filme', skill: 'EF04MA22', difficulty: 'hard',
    title: 'A que horas o filme terminou',
    question: 'O filme começou às 14:15 e durou 1 hora e 30 minutos. A que horas terminou?',
    spokenQuestion: 'O filme começou às catorze e quinze e durou uma hora e trinta minutos. A que horas terminou?',
    steps: ['Some uma hora: quinze e quinze.', 'Some trinta minutos.', 'Quinze minutos mais trinta minutos.'],
    hint: 'Some primeiro a hora, depois os minutos.',
    success: 'Excelente! O filme terminou às quinze e quarenta e cinco.',
    icon: 'library.digital_clock', basis: [DESIGN_BASIS.SCHEMA],
    options: [
      { text: '15:45', spoken: 'quinze e quarenta e cinco' },
      { text: '15:30', spoken: 'quinze e trinta' },
      { text: '16:45', spoken: 'dezesseis e quarenta e cinco' },
    ],
    correct: '15:45',
  },
  {
    kind: 'choice', key: 'ef04ma23.diferenca_temperatura', skill: 'EF04MA23', difficulty: 'medium',
    title: 'Diferença de temperatura entre cidades',
    question: 'Em Porto Alegre fez 12 °C. Em Manaus fez 31 °C. Quantos graus Manaus estava mais quente?',
    spokenQuestion: 'Em Porto Alegre fez doze graus. Em Manaus fez trinta e um graus. Quantos graus Manaus estava mais quente?',
    steps: ['Compare as duas temperaturas.', 'Comece do doze e conte até trinta e um.', 'Escolha a diferença.'],
    hint: 'Calcule 31 menos 12.',
    success: 'Muito bem! Manaus estava dezenove graus mais quente.',
    icon: 'library.thermometer', basis: [DESIGN_BASIS.SCHEMA],
    groups: [
      { label: 'Porto Alegre 12 °C', pictogramConceptIds: ['library.thermometer'] },
      { label: 'Manaus 31 °C', pictogramConceptIds: ['library.thermometer'] },
    ],
    options: [
      { text: '19 °C', spoken: 'dezenove graus' },
      { text: '21 °C', spoken: 'vinte e um graus' },
      { text: '43 °C', spoken: 'quarenta e três graus' },
    ],
    correct: '19 °C',
  },
  {
    kind: 'choice', key: 'ef04ma27.grafico_pictorico', skill: 'EF04MA27', difficulty: 'hard',
    title: 'Ler um gráfico de figuras',
    question: 'Fruta preferida da turma. Cada figura vale 2 votos. Quantos votos teve o morango?',
    spokenQuestion: 'Fruta preferida da turma. Cada figura vale dois votos. Quantos votos teve o morango?',
    steps: ['Conte as figuras do morango.', 'Cada figura vale dois votos.', 'Conte de dois em dois.'],
    hint: 'O morango tem 5 figuras. Conte de 2 em 2.',
    success: 'Excelente! O morango teve dez votos.',
    icon: 'library.vote', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    groups: [
      { label: 'banana', pictogramConceptIds: repeat(4, 'library.banana') },
      { label: 'maçã', pictogramConceptIds: repeat(3, 'object.apple') },
      { label: 'morango', pictogramConceptIds: repeat(5, 'library.strawberry') },
    ],
    options: [{ text: '5' }, { text: '7' }, { text: '10' }],
    correct: '10',
  },
  {
    kind: 'choice', key: 'ef04ma21.area_quadradinhos', skill: 'EF04MA21', difficulty: 'easy',
    title: 'Área contando quadradinhos',
    question: 'A figura tem 3 fileiras com 4 quadradinhos. Qual é a área em quadradinhos?',
    steps: ['A área é quantos quadradinhos cabem na figura.', 'Cada fileira tem quatro.', 'Conte as três fileiras.'],
    hint: 'Conte todos os quadradinhos: 4 + 4 + 4.',
    success: 'Muito bem! A área é doze quadradinhos.',
    icon: 'library.square', basis: [DESIGN_BASIS.ARRAY, DESIGN_BASIS.CRA],
    groups: [
      { pictogramConceptIds: repeat(4, 'library.square') },
      { pictogramConceptIds: repeat(4, 'library.square') },
      { pictogramConceptIds: repeat(4, 'library.square') },
    ],
    options: [{ text: '7' }, { text: '12' }, { text: '14' }],
    correct: '12',
  },
  // Somar e multiplicar
  {
    kind: 'choice', key: 'ef04ma06.pacotes_de_pao', skill: 'EF04MA06', difficulty: 'easy',
    title: 'Pães em vários pacotes',
    question: 'Um pacote tem 6 pães. Quantos pães há em 7 pacotes?',
    steps: ['Cada pacote tem seis pães.', 'São sete pacotes.', 'Sete vezes seis.'],
    hint: 'Calcule 7 × 6.',
    success: 'Muito bem! Sete pacotes têm quarenta e dois pães.',
    icon: 'library.bread', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: '13' }, { text: '36' }, { text: '42' }],
    correct: '42',
  },
  {
    kind: 'choice', key: 'ef04ma08.combinar_roupas', skill: 'EF04MA08', difficulty: 'medium',
    title: 'Combinar camisetas e calças',
    question: 'Tenho 3 camisetas e 2 calças. Quantas roupas diferentes posso montar com uma camiseta e uma calça?',
    steps: ['Escolha a primeira camiseta: ela combina com duas calças.', 'Cada camiseta combina com duas calças.', 'Três camisetas vezes duas calças.'],
    hint: 'Cada camiseta forma 2 roupas. São 3 camisetas.',
    success: 'Excelente! São seis roupas diferentes.',
    icon: 'library.tshirt', basis: [DESIGN_BASIS.VISUAL_SUPPORT, DESIGN_BASIS.SCHEMA],
    groups: [
      { label: 'camisetas', pictogramConceptIds: repeat(3, 'library.tshirt') },
      { label: 'calças', pictogramConceptIds: repeat(2, 'library.pants') },
    ],
    options: [{ text: '5' }, { text: '6' }, { text: '9' }],
    correct: '6',
  },
  {
    kind: 'choice', key: 'ef04ma06.cadeiras_fileiras', skill: 'EF04MA06', difficulty: 'hard',
    title: 'Cadeiras organizadas em fileiras',
    question: 'No teatro há 8 fileiras com 12 cadeiras em cada uma. Quantas cadeiras há?',
    spokenQuestion: 'No teatro há oito fileiras com doze cadeiras em cada uma. Quantas cadeiras há?',
    steps: ['Oito vezes doze.', 'Oito vezes dez é oitenta.', 'Oito vezes dois é dezesseis.', 'Junte os dois resultados.'],
    hint: 'Faça 8 × 10 e 8 × 2. Depois some.',
    success: 'Excelente! São noventa e seis cadeiras.',
    icon: 'mathematics.numbers', basis: [DESIGN_BASIS.ARRAY],
    options: [{ text: '20' }, { text: '86' }, { text: '96' }],
    correct: '96',
  },
  {
    kind: 'choice', key: 'ef04ma03.sorvetes_ao_todo', skill: 'EF04MA03', difficulty: 'medium',
    title: 'Sorvetes vendidos ao todo',
    question: 'Uma sorveteria vendeu 1.250 sorvetes em janeiro e 980 em fevereiro. Quantos sorvetes vendeu ao todo?',
    spokenQuestion: 'Uma sorveteria vendeu mil duzentos e cinquenta sorvetes em janeiro e novecentos e oitenta em fevereiro. Quantos sorvetes vendeu ao todo?',
    steps: ['Estime primeiro: mais ou menos mil e mais ou menos mil.', 'Agora some com cuidado.', 'Escolha o total.'],
    hint: 'Estime: perto de 1.000 + 1.000 = 2.000.',
    success: 'Muito bem! Ao todo foram dois mil duzentos e trinta sorvetes.',
    icon: 'library.ice_cream', basis: [DESIGN_BASIS.SCHEMA],
    options: [
      { text: '2.230', spoken: 'dois mil duzentos e trinta' },
      { text: '2.130', spoken: 'dois mil cento e trinta' },
      { text: '270', spoken: 'duzentos e setenta' },
    ],
    correct: '2.230',
  },
  // Tirar e repartir
  {
    kind: 'choice', key: 'ef04ma07.onibus_passeio', skill: 'EF04MA07', difficulty: 'medium',
    title: 'Ônibus para o passeio',
    question: '96 alunos vão ao passeio. Cada ônibus leva 32 alunos. Quantos ônibus são necessários?',
    spokenQuestion: 'Noventa e seis alunos vão ao passeio. Cada ônibus leva trinta e dois alunos. Quantos ônibus são necessários?',
    steps: ['Um ônibus leva trinta e dois.', 'Dois ônibus levam sessenta e quatro.', 'Três ônibus levam quanto?'],
    hint: 'Some 32 até chegar em 96.',
    success: 'Muito bem! São necessários três ônibus.',
    icon: 'library.bus', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: '2' }, { text: '3' }, { text: '4' }],
    correct: '3',
  },
  {
    kind: 'choice', key: 'ef04ma09.pizza_quartos', skill: 'EF04MA09', difficulty: 'easy',
    title: 'Que fração é cada pedaço',
    question: 'Uma pizza foi dividida em 4 partes iguais. Cada parte é que fração da pizza?',
    spokenQuestion: 'Uma pizza foi dividida em quatro partes iguais. Cada parte é que fração da pizza?',
    steps: ['A pizza inteira foi dividida em quatro partes iguais.', 'Uma parte de quatro.', 'Isso se chama um quarto.'],
    hint: '1 parte de 4 partes iguais.',
    success: 'Isso! Cada parte é um quarto da pizza.',
    icon: 'library.pizza', basis: [DESIGN_BASIS.CRA, DESIGN_BASIS.NUMBER_LINE],
    groups: [{ pictogramConceptIds: ['library.fraction_quarters'] }],
    options: [
      { text: '1/4', spoken: 'um quarto' },
      { text: '1/2', spoken: 'um meio' },
      { text: '4/1', spoken: 'quatro inteiros' },
    ],
    correct: '1/4',
  },
  {
    kind: 'choice', key: 'ef04ma25.troco_lanche', skill: 'EF04MA25', difficulty: 'easy',
    title: 'Calcular o troco do lanche',
    question: 'O lanche custa R$ 13. Paguei com uma nota de R$ 20. Quanto recebi de troco?',
    spokenQuestion: 'O lanche custa treze reais. Paguei com uma nota de vinte reais. Quanto recebi de troco?',
    steps: ['Troco é o que sobra do dinheiro.', 'Comece do treze e conte até vinte.', 'Escolha o troco.'],
    hint: 'Conte de 13 até 20.',
    success: 'Muito bem! O troco é sete reais.',
    icon: 'library.sandwich', basis: [DESIGN_BASIS.SCHEMA],
    options: [
      { text: 'R$ 7', spoken: 'sete reais' },
      { text: 'R$ 13', spoken: 'treze reais' },
      { text: 'R$ 33', spoken: 'trinta e três reais' },
    ],
    correct: 'R$ 7',
  },
  {
    kind: 'choice', key: 'ef04ma09.menor_fracao_unitaria', skill: 'EF04MA09', difficulty: 'hard',
    title: 'Qual pedaço é o menor',
    question: 'Qual destas frações é a menor: 1/2, 1/4 ou 1/10?',
    spokenQuestion: 'Qual destas frações é a menor: um meio, um quarto ou um décimo?',
    steps: ['Pense em uma pizza do mesmo tamanho.', 'Dividir em mais partes deixa cada pedaço menor.', 'Escolha o menor pedaço.'],
    hint: 'Quanto mais partes, menor fica cada pedaço.',
    success: 'Excelente! Um décimo é o menor pedaço.',
    icon: 'library.fraction_quarters', basis: [DESIGN_BASIS.NUMBER_LINE],
    options: [
      { text: '1/2', spoken: 'um meio' },
      { text: '1/4', spoken: 'um quarto' },
      { text: '1/10', spoken: 'um décimo' },
    ],
    correct: '1/10',
  },
  // Padrões e igualdades
  {
    kind: 'choice', key: 'ef04ma11.multiplos_de_6', skill: 'EF04MA11', difficulty: 'easy',
    title: 'Continuar os múltiplos de 6',
    question: 'Continue os múltiplos de 6: 6, 12, 18, 24, ...',
    spokenQuestion: 'Continue os múltiplos de seis: seis, doze, dezoito, vinte e quatro.',
    steps: ['Cada número é seis a mais que o anterior.', 'Vinte e quatro mais seis.'],
    hint: 'Some 6 ao último número.',
    success: 'Muito bem! Depois de vinte e quatro vem trinta.',
    icon: 'mathematics.sequence', basis: [DESIGN_BASIS.NUMBER_LINE],
    options: [{ text: '28' }, { text: '30' }, { text: '36' }],
    correct: '30',
  },
  {
    kind: 'choice', key: 'ef04ma15.numero_desconhecido', skill: 'EF04MA15', difficulty: 'medium',
    title: 'Descobrir o número escondido',
    question: 'Qual número deixa a igualdade verdadeira? __ × 7 = 56',
    spokenQuestion: 'Qual número deixa a igualdade verdadeira? Quanto vezes sete é igual a cinquenta e seis?',
    steps: ['Procure na tabuada do sete.', 'Sete, catorze, vinte e um... até cinquenta e seis.', 'Conte quantas vezes.'],
    hint: 'Conte de 7 em 7 até 56.',
    success: 'Isso! Oito vezes sete é cinquenta e seis.',
    icon: 'mathematics.equal', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: '6' }, { text: '8' }, { text: '9' }],
    correct: '8',
  },
  {
    kind: 'choice', key: 'ef04ma14.somar_dos_dois_lados', skill: 'EF04MA14', difficulty: 'medium',
    title: 'Somar nos dois lados da igualdade',
    question: '15 + 5 = 20. Se somarmos 3 do lado esquerdo, quanto precisamos somar do lado direito para continuar igual?',
    spokenQuestion: 'Quinze mais cinco é igual a vinte. Se somarmos três do lado esquerdo, quanto precisamos somar do lado direito para continuar igual?',
    steps: ['Os dois lados valem vinte.', 'Somamos três de um lado.', 'O outro lado precisa receber o mesmo.'],
    hint: 'Uma igualdade é como uma balança: some o mesmo dos dois lados.',
    success: 'Muito bem! Somamos três dos dois lados e continua igual.',
    icon: 'mathematics.equal', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: '3' }, { text: '5' }, { text: '23' }],
    correct: '3',
  },
  {
    kind: 'choice', key: 'ef04ma12.mesmo_resto', skill: 'EF04MA12', difficulty: 'hard',
    title: 'Números com o mesmo resto',
    question: 'Quais números deixam resto 1 quando divididos por 3?',
    spokenQuestion: 'Quais números deixam resto um quando divididos por três?',
    steps: ['Divida cada número por três.', 'Quatro dividido por três: sobra um.', 'Confira os outros números do grupo.'],
    hint: '4 = 3 + 1. Procure o grupo que sempre sobra 1.',
    success: 'Excelente! Quatro, sete e dez deixam resto um.',
    icon: 'mathematics.sequence', basis: [DESIGN_BASIS.NUMBER_LINE],
    options: [
      { text: '4, 7 e 10', spoken: 'quatro, sete e dez' },
      { text: '3, 6 e 9', spoken: 'três, seis e nove' },
      { text: '5, 8 e 11', spoken: 'cinco, oito e onze' },
    ],
    correct: '4, 7 e 10',
  },
  // Formas e posições
  {
    kind: 'choice', key: 'ef04ma18.quatro_angulos_retos', skill: 'EF04MA18', difficulty: 'medium',
    title: 'Figura com quatro cantos retos',
    question: 'Qual figura tem 4 ângulos retos (cantos como o do esquadro)?',
    steps: ['Um ângulo reto é um canto igual ao do esquadro.', 'Olhe os cantos de cada figura.', 'Escolha a que tem quatro cantos retos.'],
    hint: 'O canto do retângulo encaixa no canto do esquadro.',
    success: 'Muito bem! O retângulo tem quatro ângulos retos.',
    icon: 'library.set_square', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    groups: [{ label: 'ângulo reto', pictogramConceptIds: ['library.set_square'] }],
    options: [
      { text: 'retângulo', pictogramConceptId: 'library.rectangle' },
      { text: 'losango', pictogramConceptId: 'library.diamond' },
      { text: 'paralelogramo', pictogramConceptId: 'library.parallelogram' },
    ],
    correct: 'retângulo',
  },
  {
    kind: 'choice', key: 'ef04ma19.simetria_borboleta', skill: 'EF04MA19', difficulty: 'easy',
    title: 'Encontrar a figura simétrica',
    question: 'Qual figura tem simetria? (os dois lados são iguais, como no espelho)',
    spokenQuestion: 'Qual figura tem simetria? Os dois lados são iguais, como no espelho.',
    steps: ['Imagine uma linha no meio da figura.', 'Os dois lados são iguais?', 'Escolha a figura simétrica.'],
    hint: 'Imagine um espelho no meio da figura.',
    success: 'Isso! A borboleta tem os dois lados iguais.',
    icon: 'library.mirror', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    options: [
      { text: 'borboleta', pictogramConceptId: 'library.butterfly' },
      { text: 'banana', pictogramConceptId: 'library.banana' },
      { text: 'girafa', pictogramConceptId: 'library.giraffe' },
    ],
    correct: 'borboleta',
  },
  {
    kind: 'choice', key: 'ef04ma17.faces_cubo', skill: 'EF04MA17', difficulty: 'easy',
    title: 'Quantas faces tem o cubo',
    question: 'Quantas faces (lados planos) tem um cubo?',
    steps: ['Pense em um dado.', 'Ele tem uma face para cada número.', 'Conte as faces.'],
    hint: 'Um dado tem os números de 1 a 6, um em cada face.',
    success: 'Muito bem! O cubo tem seis faces.',
    icon: 'library.cube', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    groups: [{ pictogramConceptIds: ['library.cube', 'library.die'] }],
    options: [{ text: '4' }, { text: '6' }, { text: '8' }],
    correct: '6',
  },
  {
    kind: 'choice', key: 'ef04ma17.base_triangular', skill: 'EF04MA17', difficulty: 'hard',
    title: 'Prisma ou pirâmide',
    question: 'Qual figura tem duas bases triangulares e faces laterais retangulares?',
    steps: ['A pirâmide tem uma ponta em cima.', 'O prisma tem duas bases iguais.', 'Procure duas bases triangulares.'],
    hint: 'O prisma tem a mesma base em cima e embaixo.',
    success: 'Excelente! É o prisma de base triangular.',
    icon: 'library.prism', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    options: [
      { text: 'prisma', pictogramConceptId: 'library.prism' },
      { text: 'pirâmide', pictogramConceptId: 'library.pyramid' },
      { text: 'cubo', pictogramConceptId: 'library.cube' },
    ],
    correct: 'prisma',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 5º ANO
// ─────────────────────────────────────────────────────────────────────────────
const YEAR_5: Spec[] = [
  // Números
  {
    kind: 'choice', key: 'ef05ma01.maior_centena_milhar', skill: 'EF05MA01', difficulty: 'medium',
    title: 'Maior número com centenas de milhar',
    question: 'Qual é o maior número?',
    steps: ['Todos começam com quatro centenas de milhar.', 'Compare as dezenas de milhar.', 'Escolha o maior.'],
    hint: 'Compare o segundo algarismo de cada número.',
    success: 'Muito bem! Quatrocentos e cinquenta mil e trinta é o maior.',
    icon: 'mathematics.compare', basis: [DESIGN_BASIS.NUMBER_LINE],
    options: [
      { text: '405.300', spoken: 'quatrocentos e cinco mil e trezentos' },
      { text: '450.030', spoken: 'quatrocentos e cinquenta mil e trinta' },
      { text: '405.030', spoken: 'quatrocentos e cinco mil e trinta' },
    ],
    correct: '450.030',
  },
  {
    kind: 'choice', key: 'ef05ma02.decimal_entre', skill: 'EF05MA02', difficulty: 'easy',
    title: 'Decimal entre dois números',
    question: 'Qual número decimal está entre 2,3 e 2,5?',
    spokenQuestion: 'Qual número decimal está entre dois vírgula três e dois vírgula cinco?',
    steps: ['Pense na reta numérica.', 'Depois de dois vírgula três vem dois vírgula quatro.', 'Escolha o número do meio.'],
    hint: 'Conte de décimo em décimo: 2,3 ... 2,5.',
    success: 'Isso! Dois vírgula quatro está no meio.',
    icon: 'math.number_line', basis: [DESIGN_BASIS.NUMBER_LINE],
    options: [
      { text: '2,4', spoken: 'dois vírgula quatro' },
      { text: '2,6', spoken: 'dois vírgula seis' },
      { text: '3,4', spoken: 'três vírgula quatro' },
    ],
    correct: '2,4',
  },
  {
    kind: 'order', key: 'ef05ma02.ordenar_decimais', skill: 'EF05MA02', difficulty: 'hard',
    title: 'Ordenar números decimais',
    question: 'Coloque os números do menor para o maior.',
    steps: ['Escreva todos com duas casas: zero vírgula cinquenta.', 'Compare vinte e cinco, cinquenta e setenta e cinco centésimos.', 'Coloque o menor primeiro.'],
    hint: '0,5 é o mesmo que 0,50.',
    success: 'Excelente! Zero vírgula vinte e cinco, zero vírgula cinco, zero vírgula setenta e cinco.',
    icon: 'mathematics.order', basis: [DESIGN_BASIS.NUMBER_LINE],
    items: [
      { id: 'a', label: '0,5', spoken: 'zero vírgula cinco' },
      { id: 'b', label: '0,75', spoken: 'zero vírgula setenta e cinco' },
      { id: 'c', label: '0,25', spoken: 'zero vírgula vinte e cinco' },
    ],
    correctOrder: ['c', 'a', 'b'], slotLabels: ['menor', 'meio', 'maior'],
  },
  {
    kind: 'choice', key: 'ef05ma05.decimal_ou_fracao', skill: 'EF05MA05', difficulty: 'hard',
    title: 'Comparar decimal e fração',
    question: 'O que é maior: 0,7 ou 3/4?',
    spokenQuestion: 'O que é maior: zero vírgula sete ou três quartos?',
    steps: ['Três quartos é o mesmo que zero vírgula setenta e cinco.', 'Zero vírgula sete é zero vírgula setenta.', 'Compare setenta e setenta e cinco.'],
    hint: '3/4 = 0,75.',
    success: 'Excelente! Três quartos é maior.',
    icon: 'mathematics.compare', basis: [DESIGN_BASIS.NUMBER_LINE],
    options: [
      { text: '0,7', spoken: 'zero vírgula sete' },
      { text: '3/4', spoken: 'três quartos' },
      { text: 'são iguais' },
    ],
    correct: '3/4',
  },
  // Comparar e medir
  {
    kind: 'choice', key: 'ef05ma19.metros_em_cm', skill: 'EF05MA19', difficulty: 'medium',
    title: 'Metros em centímetros',
    question: 'Quantos centímetros há em 2,5 metros?',
    spokenQuestion: 'Quantos centímetros há em dois metros e meio?',
    steps: ['Um metro tem cem centímetros.', 'Dois metros têm duzentos.', 'Meio metro tem cinquenta.', 'Junte.'],
    hint: '1 metro = 100 centímetros.',
    success: 'Muito bem! Dois metros e meio são duzentos e cinquenta centímetros.',
    icon: 'library.measuring_tape', basis: [DESIGN_BASIS.TRAJECTORY],
    options: [
      { text: '25 cm', spoken: 'vinte e cinco centímetros' },
      { text: '205 cm', spoken: 'duzentos e cinco centímetros' },
      { text: '250 cm', spoken: 'duzentos e cinquenta centímetros' },
    ],
    correct: '250 cm',
  },
  {
    kind: 'choice', key: 'ef05ma19.litros_em_ml', skill: 'EF05MA19', difficulty: 'easy',
    title: 'Litros em mililitros',
    question: 'Uma garrafa tem 1,5 litro. Quantos mililitros são?',
    spokenQuestion: 'Uma garrafa tem um litro e meio. Quantos mililitros são?',
    steps: ['Um litro tem mil mililitros.', 'Meio litro tem quinhentos.', 'Junte.'],
    hint: '1 litro = 1.000 mililitros.',
    success: 'Isso! Um litro e meio são mil e quinhentos mililitros.',
    icon: 'library.bottle_liter', basis: [DESIGN_BASIS.TRAJECTORY],
    groups: [{ pictogramConceptIds: ['library.bottle_liter'] }],
    options: [
      { text: '150 mL', spoken: 'cento e cinquenta mililitros' },
      { text: '1.500 mL', spoken: 'mil e quinhentos mililitros' },
      { text: '15 mL', spoken: 'quinze mililitros' },
    ],
    correct: '1.500 mL',
  },
  {
    kind: 'choice', key: 'ef05ma24.dias_de_chuva', skill: 'EF05MA24', difficulty: 'medium',
    title: 'Interpretar a tabela de chuva',
    question: 'Dias de chuva: março 15, abril 9, maio 4. Quantos dias choveu a mais em março do que em maio?',
    spokenQuestion: 'Dias de chuva: março quinze, abril nove, maio quatro. Quantos dias choveu a mais em março do que em maio?',
    steps: ['Encontre março: quinze dias.', 'Encontre maio: quatro dias.', 'Calcule a diferença.'],
    hint: 'Calcule 15 menos 4.',
    success: 'Muito bem! Choveu onze dias a mais em março.',
    icon: 'library.rain', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    groups: [
      { label: 'março: 15', pictogramConceptIds: ['library.rain'] },
      { label: 'abril: 9', pictogramConceptIds: ['library.rain'] },
      { label: 'maio: 4', pictogramConceptIds: ['library.rain'] },
    ],
    options: [{ text: '6' }, { text: '11' }, { text: '19' }],
    correct: '11',
  },
  {
    kind: 'choice', key: 'ef05ma20.mesmo_perimetro', skill: 'EF05MA20', difficulty: 'hard',
    title: 'Mesmo perímetro, áreas diferentes',
    question: 'Um retângulo de 6 por 2 e um quadrado de 4 por 4 têm o mesmo perímetro. Qual tem a maior área?',
    spokenQuestion: 'Um retângulo de seis por dois e um quadrado de quatro por quatro têm o mesmo perímetro. Qual tem a maior área?',
    steps: ['Área do retângulo: seis vezes dois.', 'Área do quadrado: quatro vezes quatro.', 'Compare as duas áreas.'],
    hint: 'Calcule 6 × 2 e 4 × 4.',
    success: 'Excelente! O quadrado tem área dezesseis e o retângulo, doze.',
    icon: 'library.rectangle', basis: [DESIGN_BASIS.ARRAY],
    options: [
      { text: 'o quadrado', pictogramConceptId: 'library.square' },
      { text: 'o retângulo', pictogramConceptId: 'library.rectangle' },
      { text: 'as áreas são iguais' },
    ],
    correct: 'o quadrado',
  },
  // Somar e multiplicar
  {
    kind: 'choice', key: 'ef05ma08.cadernos_decimal', skill: 'EF05MA08', difficulty: 'medium',
    title: 'Preço de três cadernos',
    question: 'Um caderno custa R$ 4,50. Quanto custam 3 cadernos?',
    spokenQuestion: 'Um caderno custa quatro reais e cinquenta centavos. Quanto custam três cadernos?',
    steps: ['Três vezes quatro reais: doze reais.', 'Três vezes cinquenta centavos: um real e cinquenta.', 'Junte.'],
    hint: 'Calcule 3 × 4 reais e 3 × 50 centavos.',
    success: 'Muito bem! Três cadernos custam treze reais e cinquenta centavos.',
    icon: 'library.book', basis: [DESIGN_BASIS.SCHEMA],
    options: [
      { text: 'R$ 12,50', spoken: 'doze reais e cinquenta centavos' },
      { text: 'R$ 13,50', spoken: 'treze reais e cinquenta centavos' },
      { text: 'R$ 7,50', spoken: 'sete reais e cinquenta centavos' },
    ],
    correct: 'R$ 13,50',
  },
  {
    kind: 'choice', key: 'ef05ma09.combinar_lanche', skill: 'EF05MA09', difficulty: 'easy',
    title: 'Combinações de lanche',
    question: 'Há 4 tipos de sanduíche e 3 tipos de suco. Quantos lanches diferentes com 1 sanduíche e 1 suco?',
    spokenQuestion: 'Há quatro tipos de sanduíche e três tipos de suco. Quantos lanches diferentes com um sanduíche e um suco?',
    steps: ['Cada sanduíche combina com três sucos.', 'São quatro sanduíches.', 'Quatro vezes três.'],
    hint: 'Desenhe uma árvore: cada sanduíche abre 3 caminhos.',
    success: 'Muito bem! São doze lanches diferentes.',
    icon: 'library.sandwich', basis: [DESIGN_BASIS.VISUAL_SUPPORT, DESIGN_BASIS.SCHEMA],
    groups: [
      { label: 'sanduíches', pictogramConceptIds: repeat(4, 'library.sandwich') },
      { label: 'sucos', pictogramConceptIds: repeat(3, 'library.juice') },
    ],
    options: [{ text: '7' }, { text: '12' }, { text: '43' }],
    correct: '12',
  },
  {
    kind: 'choice', key: 'ef05ma12.receita_ovos', skill: 'EF05MA12', difficulty: 'hard',
    title: 'Ovos para mais bolos',
    question: 'Para 2 bolos usamos 3 ovos. Quantos ovos precisamos para 6 bolos?',
    spokenQuestion: 'Para dois bolos usamos três ovos. Quantos ovos precisamos para seis bolos?',
    steps: ['Seis bolos é três vezes dois bolos.', 'Então os ovos também triplicam.', 'Três vezes três ovos.'],
    hint: '6 bolos = 3 vezes 2 bolos.',
    success: 'Excelente! Para seis bolos precisamos de nove ovos.',
    icon: 'library.egg', basis: [DESIGN_BASIS.SCHEMA],
    groups: [{ label: '2 bolos', pictogramConceptIds: repeat(3, 'library.egg') }],
    options: [{ text: '6' }, { text: '9' }, { text: '18' }],
    correct: '9',
  },
  {
    kind: 'choice', key: 'ef05ma07.lanche_decimais', skill: 'EF05MA07', difficulty: 'medium',
    title: 'Preço do suco e do pão juntos',
    question: 'Um suco custa R$ 3,75 e um pão custa R$ 2,50. Quanto custam os dois juntos?',
    spokenQuestion: 'Um suco custa três reais e setenta e cinco centavos e um pão custa dois reais e cinquenta centavos. Quanto custam os dois juntos?',
    steps: ['Junte os reais: três mais dois.', 'Junte os centavos: setenta e cinco mais cinquenta.', 'Cem centavos são um real.'],
    hint: '75 centavos + 50 centavos = 1 real e 25 centavos.',
    success: 'Muito bem! Os dois juntos custam seis reais e vinte e cinco centavos.',
    icon: 'library.juice', basis: [DESIGN_BASIS.SCHEMA],
    options: [
      { text: 'R$ 6,25', spoken: 'seis reais e vinte e cinco centavos' },
      { text: 'R$ 5,25', spoken: 'cinco reais e vinte e cinco centavos' },
      { text: 'R$ 6,125', spoken: 'seis vírgula cento e vinte e cinco' },
    ],
    correct: 'R$ 6,25',
  },
  // Tirar e repartir
  {
    kind: 'choice', key: 'ef05ma06.desconto_25', skill: 'EF05MA06', difficulty: 'medium',
    title: 'Desconto de vinte e cinco por cento',
    question: 'Uma camiseta custa R$ 40 e tem 25% de desconto. De quanto é o desconto?',
    spokenQuestion: 'Uma camiseta custa quarenta reais e tem vinte e cinco por cento de desconto. De quanto é o desconto?',
    steps: ['Vinte e cinco por cento é a quarta parte.', 'Divida quarenta em quatro partes iguais.'],
    hint: '25% é a quarta parte: 40 dividido por 4.',
    success: 'Muito bem! O desconto é de dez reais.',
    icon: 'library.percent', basis: [DESIGN_BASIS.CRA],
    groups: [{ pictogramConceptIds: ['library.tshirt'] }],
    options: [
      { text: 'R$ 10', spoken: 'dez reais' },
      { text: 'R$ 25', spoken: 'vinte e cinco reais' },
      { text: 'R$ 15', spoken: 'quinze reais' },
    ],
    correct: 'R$ 10',
  },
  {
    kind: 'choice', key: 'ef05ma03.pizzas_divididas', skill: 'EF05MA03', difficulty: 'hard',
    title: 'Dividir três pizzas entre quatro',
    question: '3 pizzas iguais serão divididas igualmente entre 4 crianças. Quanto cada criança recebe?',
    spokenQuestion: 'Três pizzas iguais serão divididas igualmente entre quatro crianças. Quanto cada criança recebe?',
    steps: ['Corte cada pizza em quatro pedaços.', 'Cada criança pega um pedaço de cada pizza.', 'São três pedaços de um quarto.'],
    hint: 'Cada pizza vira 4 pedaços. Cada criança ganha 1 pedaço de cada pizza.',
    success: 'Excelente! Cada criança recebe três quartos de pizza.',
    icon: 'library.pizza', basis: [DESIGN_BASIS.CRA],
    groups: [{ pictogramConceptIds: repeat(3, 'library.pizza') }],
    options: [
      { text: '3/4 de pizza', spoken: 'três quartos de pizza' },
      { text: '4/3 de pizza', spoken: 'quatro terços de pizza' },
      { text: '1/4 de pizza', spoken: 'um quarto de pizza' },
    ],
    correct: '3/4 de pizza',
  },
  {
    kind: 'choice', key: 'ef05ma04.equivalente_metade', skill: 'EF05MA04', difficulty: 'easy',
    title: 'Fração equivalente à metade',
    question: 'Qual fração é igual a 1/2 (metade)?',
    spokenQuestion: 'Qual fração é igual a um meio, a metade?',
    steps: ['Olhe o círculo dividido em quatro partes.', 'Duas partes pintadas.', 'Duas de quatro é metade.'],
    hint: 'Veja o círculo: 2 de 4 partes estão pintadas.',
    success: 'Muito bem! Dois quartos é o mesmo que a metade.',
    icon: 'library.half', basis: [DESIGN_BASIS.CRA],
    groups: [{ pictogramConceptIds: ['library.half'] }],
    options: [
      { text: '2/4', spoken: 'dois quartos' },
      { text: '1/4', spoken: 'um quarto' },
      { text: '2/3', spoken: 'dois terços' },
    ],
    correct: '2/4',
  },
  {
    kind: 'choice', key: 'ef05ma13.partilha_dobro', skill: 'EF05MA13', difficulty: 'hard',
    title: 'Repartir quando um recebe o dobro',
    question: 'Ana e Bia vão repartir 18 biscoitos. Bia recebe o dobro de Ana. Quantos biscoitos Ana recebe?',
    spokenQuestion: 'Ana e Bia vão repartir dezoito biscoitos. Bia recebe o dobro de Ana. Quantos biscoitos Ana recebe?',
    steps: ['Ana recebe uma parte. Bia recebe duas partes.', 'São três partes iguais ao todo.', 'Dezoito dividido por três.'],
    hint: 'Divida 18 em 3 partes: 1 parte para Ana, 2 para Bia.',
    success: 'Excelente! Ana recebe seis biscoitos e Bia doze.',
    icon: 'library.cookie', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: '6' }, { text: '9' }, { text: '12' }],
    correct: '6',
  },
  // Padrões e igualdades
  {
    kind: 'choice', key: 'ef05ma11.divisao_desconhecida', skill: 'EF05MA11', difficulty: 'easy',
    title: 'Descobrir o divisor escondido',
    question: 'Qual número falta? 48 ÷ __ = 6',
    spokenQuestion: 'Qual número falta? Quarenta e oito dividido por quanto é igual a seis?',
    steps: ['Pense na multiplicação.', 'Seis vezes quanto dá quarenta e oito?'],
    hint: '6 × ? = 48.',
    success: 'Muito bem! Quarenta e oito dividido por oito é seis.',
    icon: 'mathematics.equal', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: '6' }, { text: '7' }, { text: '8' }],
    correct: '8',
  },
  {
    kind: 'choice', key: 'ef05ma11.numero_pensado', skill: 'EF05MA11', difficulty: 'medium',
    title: 'Descobrir o número pensado',
    question: 'Ana pensou em um número. Somou 15 e obteve 42. Em que número ela pensou?',
    spokenQuestion: 'Ana pensou em um número. Somou quinze e obteve quarenta e dois. Em que número ela pensou?',
    steps: ['Faça o caminho de volta.', 'Se somou quinze, agora tire quinze.', 'Quarenta e dois menos quinze.'],
    hint: 'Desfaça a soma: 42 − 15.',
    success: 'Isso! Ana pensou no vinte e sete.',
    icon: 'mathematics.equal', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: '27' }, { text: '37' }, { text: '57' }],
    correct: '27',
  },
  {
    kind: 'choice', key: 'ef05ma10.multiplicar_dois_lados', skill: 'EF05MA10', difficulty: 'hard',
    title: 'Multiplicar os dois lados da igualdade',
    question: '3 × 4 = 12. Se multiplicarmos os dois lados por 2, qual igualdade continua verdadeira?',
    spokenQuestion: 'Três vezes quatro é igual a doze. Se multiplicarmos os dois lados por dois, qual igualdade continua verdadeira?',
    steps: ['Do lado direito: doze vezes dois é vinte e quatro.', 'Do lado esquerdo: o resultado também precisa dobrar.', 'Qual conta dá vinte e quatro?'],
    hint: 'Os dois lados precisam dar 24.',
    success: 'Excelente! Seis vezes quatro é vinte e quatro.',
    icon: 'mathematics.equal', basis: [DESIGN_BASIS.SCHEMA],
    options: [
      { text: '6 × 4 = 24', spoken: 'seis vezes quatro igual a vinte e quatro' },
      { text: '3 × 4 = 24', spoken: 'três vezes quatro igual a vinte e quatro' },
      { text: '6 × 8 = 24', spoken: 'seis vezes oito igual a vinte e quatro' },
    ],
    correct: '6 × 4 = 24',
  },
  {
    kind: 'choice', key: 'ef05ma10.tirar_dos_dois_lados', skill: 'EF05MA10', difficulty: 'medium',
    title: 'Tirar o mesmo dos dois lados',
    question: '5 + 7 = 12. Se tirarmos 3 dos dois lados, a igualdade continua verdadeira?',
    spokenQuestion: 'Cinco mais sete é igual a doze. Se tirarmos três dos dois lados, a igualdade continua verdadeira?',
    steps: ['Lado esquerdo: doze menos três é nove.', 'Lado direito: doze menos três é nove.', 'Nove é igual a nove?'],
    hint: 'Calcule 12 − 3 dos dois lados.',
    success: 'Muito bem! Continua verdadeira: nove é igual a nove.',
    icon: 'mathematics.equal', basis: [DESIGN_BASIS.SCHEMA],
    options: [{ text: 'sim, 9 = 9', spoken: 'sim, nove é igual a nove' }, { text: 'não, fica diferente' }],
    correct: 'sim, 9 = 9',
  },
  // Formas e posições
  {
    kind: 'choice', key: 'ef05ma15.coordenadas_direita', skill: 'EF05MA15', difficulty: 'medium',
    title: 'Andar no mapa do tesouro',
    question: 'No mapa, você está no ponto (1, 2) e o tesouro está no ponto (4, 2). Quantas casas você anda para a direita?',
    spokenQuestion: 'No mapa, você está no ponto um, dois e o tesouro está no ponto quatro, dois. Quantas casas você anda para a direita?',
    steps: ['O primeiro número diz quantas casas para a direita.', 'Você está no um e vai para o quatro.', 'O segundo número não muda.'],
    hint: 'Compare o primeiro número: de 1 até 4.',
    success: 'Muito bem! Você anda três casas para a direita.',
    icon: 'library.treasure_map', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    groups: [{ pictogramConceptIds: ['library.treasure_map'] }],
    options: [{ text: '2' }, { text: '3' }, { text: '5' }],
    correct: '3',
  },
  {
    kind: 'choice', key: 'ef05ma16.planificacao_piramide', skill: 'EF05MA16', difficulty: 'hard',
    title: 'Montar a figura pela planificação',
    question: 'Uma planificação tem 1 quadrado e 4 triângulos. Que figura espacial ela forma?',
    steps: ['O quadrado será a base.', 'Os quatro triângulos se encontram em uma ponta.', 'Escolha a figura.'],
    hint: 'Os triângulos se juntam em uma ponta no alto.',
    success: 'Excelente! Forma uma pirâmide de base quadrada.',
    icon: 'library.pyramid_square', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    groups: [{ pictogramConceptIds: ['library.square', ...repeat(4, 'library.triangle')] }],
    options: [
      { text: 'pirâmide', pictogramConceptId: 'library.pyramid_square' },
      { text: 'prisma', pictogramConceptId: 'library.prism' },
      { text: 'cubo', pictogramConceptId: 'library.cube' },
    ],
    correct: 'pirâmide',
  },
  {
    kind: 'choice', key: 'ef05ma17.lados_vertices_hexagono', skill: 'EF05MA17', difficulty: 'easy',
    title: 'Lados e vértices do hexágono',
    question: 'Quantos lados e quantos vértices tem um hexágono?',
    steps: ['Conte os lados do hexágono.', 'Conte as pontas, os vértices.', 'Escolha a resposta.'],
    hint: 'Em um polígono, o número de lados é igual ao de vértices.',
    success: 'Muito bem! O hexágono tem seis lados e seis vértices.',
    icon: 'library.hexagon', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    groups: [{ pictogramConceptIds: ['library.hexagon'] }],
    options: [{ text: '6 lados e 6 vértices' }, { text: '6 lados e 5 vértices' }, { text: '8 lados e 8 vértices' }],
    correct: '6 lados e 6 vértices',
  },
  {
    kind: 'sort', key: 'ef05ma17.angulo_reto_ou_nao', skill: 'EF05MA17', difficulty: 'medium',
    title: 'Separar figuras com ângulo reto',
    question: 'Separe os polígonos: tem ângulo reto ou não tem ângulo reto.',
    steps: ['Toque em uma figura.', 'Veja se algum canto é igual ao canto do esquadro.', 'Depois toque no grupo certo.'],
    hint: 'Compare os cantos com o canto do esquadro.',
    success: 'Excelente! Quadrado e retângulo têm ângulos retos.',
    icon: 'library.set_square', basis: [DESIGN_BASIS.VISUAL_SUPPORT],
    items: [
      { id: 'a', label: 'quadrado', pictogramConceptId: 'library.square' },
      { id: 'b', label: 'losango', pictogramConceptId: 'library.diamond' },
      { id: 'c', label: 'retângulo', pictogramConceptId: 'library.rectangle' },
      { id: 'd', label: 'paralelogramo', pictogramConceptId: 'library.parallelogram' },
    ],
    bins: [
      { id: 'right', label: 'tem ângulo reto', pictogramConceptId: 'library.set_square' },
      { id: 'none', label: 'não tem ângulo reto', pictogramConceptId: 'library.diamond' },
    ],
    correctOrder: ['right', 'none', 'right', 'none'],
  },
];

export const CURRICULUM_PROGRESSION_SPECS: Spec[] = [...YEAR_2, ...YEAR_3, ...YEAR_4, ...YEAR_5];

const DEFAULT_RETRY = 'Tudo bem. Vamos pensar juntos de novo, com calma.';

function toActivity(spec: Spec): Record<string, unknown> {
  const year = Number(spec.skill.slice(3, 4));
  const semantic = {
    structureId: `bncc_progression.${spec.key}`,
    niche: `bncc_${spec.skill.toLowerCase()}`,
    formatId: spec.kind,
    designBasis: spec.basis,
    bnccSource: 'BNCC (MEC, 2018), texto oficial da habilidade',
    reviewStatus: 'needs_professional_review',
  };
  const speech = {
    spokenIntroduction: 'Vamos lá! A TitiA vai ler com você.',
    spokenQuestion: spec.spokenQuestion ?? spec.question,
    spokenSteps: spec.steps,
    spokenHint: spec.hint,
    spokenSuccessFeedback: spec.success,
    spokenRetryFeedback: spec.retry ?? DEFAULT_RETRY,
  };
  const base = {
    title: spec.title,
    description: `BNCC ${spec.skill} · ${year}º ano`,
    difficulty: spec.difficulty,
    bnccSkills: [spec.skill],
    skillWeights: [{ code: spec.skill, role: 'primary', weight: 1 }],
    targetModalities: ['visual', 'logical'],
    pointsReward: POINTS[spec.difficulty],
    isActive: true,
    isNew: true,
    accessibility: { hasVisual: true, hasAudio: true, usesPictograms: true, sensoryLoad: 'low' },
  };
  const common = {
    question: spec.question,
    instructionsPt: spec.question,
    instructions: spec.question,
    howToPlayPt: spec.steps.join(' '),
    pictogramConceptIds: [spec.icon],
    ...speech,
    semantic,
  };

  if (spec.kind === 'choice') {
    return {
      ...base,
      type: 'quiz',
      content: {
        ...common,
        ...(spec.groups ? { visualGroups: spec.groups } : {}),
        options: spec.options.map((option, index) => ({
          id: String.fromCharCode(97 + index),
          text: option.text,
          ...(option.spoken ? { spokenText: option.spoken } : {}),
          ...(option.pictogramConceptId ? { pictogramConceptId: option.pictogramConceptId } : {}),
          isCorrect: option.text === spec.correct,
        })),
        correctAnswer: spec.correct,
        validation: { kind: 'exact' },
      },
    };
  }
  if (spec.kind === 'order') {
    return {
      ...base,
      type: 'drag_drop',
      content: {
        ...common,
        items: spec.items.map((item) => ({
          id: item.id,
          label: item.label,
          ...(item.spoken ? { spokenText: item.spoken } : {}),
          ...(item.pictogramConceptId ? { pictogramConceptId: item.pictogramConceptId } : {}),
        })),
        correctOrder: spec.correctOrder,
        slotCount: spec.correctOrder.length,
        slotLabels: spec.slotLabels,
        validation: { kind: 'sequence' },
      },
    };
  }
  return {
    ...base,
    type: 'representation_matching',
    content: {
      ...common,
      interaction: 'categorize',
      items: spec.items,
      bins: spec.bins,
      correctOrder: spec.correctOrder,
      validation: { kind: 'sequence' },
    },
  };
}

export function curriculumProgressionActivities(): Record<string, unknown>[] {
  return CURRICULUM_PROGRESSION_SPECS.map(toActivity);
}
