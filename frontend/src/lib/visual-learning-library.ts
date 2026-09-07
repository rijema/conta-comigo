import type { PictogramConcept } from "./pictograms";

export interface VisualLearningItem {
  conceptId: PictogramConcept;
  label: string;
  alt: string;
  example?: string;
}

export interface VisualLearningCategory {
  name: "Números" | "Operações Matemáticas" | "Formas Geométricas" | "Cores" |
    "Verbos de Aprender" | "Jogos e Atividades";
  emoji: string;
  gradient: string;
  items: VisualLearningItem[];
}

const numberNames = ["Zero", "Um", "Dois", "Três", "Quatro", "Cinco", "Seis",
  "Sete", "Oito", "Nove", "Dez", "Onze", "Doze", "Treze", "Catorze", "Quinze",
  "Dezesseis", "Dezessete", "Dezoito", "Dezenove", "Vinte"];

const item = (conceptId: PictogramConcept, label: string, example?: string): VisualLearningItem => ({
  conceptId,
  label,
  alt: `Pictograma ARASAAC que representa ${label.toLocaleLowerCase("pt-BR")}`,
  example,
});

export const VISUAL_LEARNING_LIBRARY: VisualLearningCategory[] = [
  {
    name: "Números", emoji: "🔢", gradient: "from-blue-500 to-cyan-400",
    items: numberNames.map((label, value) => item(`number.${value}`, label, `${label} representa o número ${value}.`)),
  },
  {
    name: "Operações Matemáticas", emoji: "➕", gradient: "from-green-500 to-emerald-400",
    items: [
      item("mathematics.addition", "Adição", "Adicionar é juntar quantidades."),
      item("mathematics.subtraction", "Subtração", "Subtrair é retirar uma quantidade."),
      item("mathematics.equal", "Igual", "O sinal de igual compara dois valores."),
      item("mathematics.more", "Mais"), item("mathematics.less", "Menos"),
      item("mathematics.count", "Contar"), item("mathematics.compare", "Comparar"),
    ],
  },
  {
    name: "Formas Geométricas", emoji: "🔷", gradient: "from-purple-500 to-pink-400",
    items: [item("library.circle", "Círculo"), item("library.square", "Quadrado"),
      item("shape.triangle", "Triângulo"), item("library.rectangle", "Retângulo"),
      item("library.diamond", "Losango"), item("library.star", "Estrela"),
      item("library.cube", "Cubo"), item("library.cylinder", "Cilindro"), item("library.cone", "Cone")],
  },
  {
    name: "Cores", emoji: "🎨", gradient: "from-pink-500 to-rose-400",
    items: [item("library.red", "Vermelho"), item("library.blue", "Azul"), item("mathematics.color", "Cores")],
  },
  {
    name: "Verbos de Aprender", emoji: "📚", gradient: "from-orange-500 to-amber-400",
    items: [item("library.learn", "Aprender"), item("library.study", "Estudar"),
      item("library.understand", "Compreender"), item("library.first", "Primeiro"),
      item("library.next", "Seguinte"), item("library.last", "Último"),
      item("library.now", "Agora"), item("library.after", "Depois")],
  },
  {
    name: "Jogos e Atividades", emoji: "🎮", gradient: "from-teal-500 to-sky-400",
    items: [item("library.play", "Jogar"), item("library.board_game", "Jogo de mesa"),
      item("library.learning_game", "Jogo educativo"), item("library.die", "Dado"),
      item("library.domino", "Dominó"), item("library.tablet_game", "Jogar no tablet")],
  },
];

// This catalog is an exploratory library and is not an adaptive activity definition.
export const VISUAL_LIBRARY_IS_ADAPTIVE = false;
