export const ARASAAC_PICTOGRAM_BASE_URL = "https://static.arasaac.org/pictograms";

export type PictogramCategory = "NAVIGATION" | "STATE" | "MATHEMATICS" |
  "ACTIVITY_ACTION" | "COMMUNICATION" | "NUMBER" | "LEARNING_LIBRARY";

export type PictogramConcept =
  | `navigation.${"back" | "next" | "home" | "start" | "finish" | "help" | "repeat" | "listen" | "pause" | "try_again" | "change_activity"}`
  | `state.${"yes" | "no" | "ok" | "confirm" | "correct" | "incorrect" | "great" | "done" | "wait"}`
  | `mathematics.${"numbers" | "addition" | "subtraction" | "equal" | "more" | "less" | "count" | "compare" | "order" | "sequence" | "pattern" | "shape" | "color" | "size"}`
  | `activity.${"drag" | "choose" | "touch" | "listen" | "look" | "match" | "complete" | "move" | "point"}`
  | `communication.${"i_dont_understand" | "another_activity" | "listen_again" | "help_me"}`
  | `number.${number}` | `library.${string}`
  | `arasaac.${number}`
  // Legacy exercise identifiers remain valid while activity seeds migrate.
  | "action.yes" | "action.no" | "character.titia" | "math.addition"
  | "math.number_line" | "math.part" | "math.whole" | "object.apple"
  | "shape.circle" | "shape.square" | "shape.triangle";

export interface PictogramDefinition {
  conceptId: PictogramConcept;
  category: PictogramCategory;
  labelPt: string;
  altPt: string;
  symbol: string;
  arasaacId: number | null;
}

const definition = (conceptId: PictogramConcept, category: PictogramCategory,
  labelPt: string, symbol: string, arasaacId: number | null = null): PictogramDefinition => ({
  conceptId, category, labelPt, altPt: `Pictograma de ${labelPt}`, symbol, arasaacId,
});

const definitions: PictogramDefinition[] = [
  definition("navigation.back", "NAVIGATION", "voltar", "←", 6630),
  definition("navigation.next", "NAVIGATION", "próximo", "→"),
  definition("navigation.home", "NAVIGATION", "início", "🏠", 6964),
  definition("navigation.start", "NAVIGATION", "começar", "▶️", 5431),
  definition("navigation.finish", "NAVIGATION", "terminar", "🏁", 5358),
  definition("navigation.help", "NAVIGATION", "ajuda", "💡", 12252),
  definition("navigation.repeat", "NAVIGATION", "repetir", "🔁", 11752),
  definition("navigation.listen", "NAVIGATION", "ouvir", "🔊", 6572),
  definition("navigation.pause", "NAVIGATION", "pausar", "⏸️", 38213),
  definition("navigation.try_again", "NAVIGATION", "tentar novamente", "🔄"),
  definition("navigation.change_activity", "NAVIGATION", "mudar atividade", "🎮"),
  definition("state.yes", "STATE", "sim", "✅", 5584),
  definition("state.no", "STATE", "não", "❌", 5526),
  definition("state.ok", "STATE", "ok", "👌"),
  definition("state.confirm", "STATE", "confirmar", "👍"),
  definition("state.correct", "STATE", "correto", "✅"),
  definition("state.incorrect", "STATE", "incorreto", "❌"),
  definition("state.great", "STATE", "muito bem", "🌟"),
  definition("state.done", "STATE", "concluído", "🏁"),
  definition("state.wait", "STATE", "espere", "⏳", 36914),
  definition("mathematics.numbers", "MATHEMATICS", "números", "🔢", 6198),
  definition("mathematics.addition", "MATHEMATICS", "adição", "➕", 5868),
  definition("mathematics.subtraction", "MATHEMATICS", "subtração", "➖", 5841),
  definition("mathematics.equal", "MATHEMATICS", "igual", "🟰", 3423),
  definition("mathematics.more", "MATHEMATICS", "mais", "➕", 3220),
  definition("mathematics.less", "MATHEMATICS", "menos", "➖", 3200),
  definition("mathematics.count", "MATHEMATICS", "contar", "🔢", 2714),
  definition("mathematics.compare", "MATHEMATICS", "comparar", "⚖️"),
  definition("mathematics.order", "MATHEMATICS", "ordenar", "↕️", 2872),
  definition("mathematics.sequence", "MATHEMATICS", "sequência", "🔢", 19548),
  definition("mathematics.pattern", "MATHEMATICS", "padrão", "🔷"),
  definition("mathematics.shape", "MATHEMATICS", "forma", "🔷"),
  definition("mathematics.color", "MATHEMATICS", "cor", "🎨", 7075),
  definition("mathematics.size", "MATHEMATICS", "tamanho", "📏", 8704),
  definition("activity.drag", "ACTIVITY_ACTION", "arrastar", "🖐️"),
  definition("activity.choose", "ACTIVITY_ACTION", "escolher", "👉", 30510),
  definition("activity.touch", "ACTIVITY_ACTION", "tocar", "👆", 3293),
  definition("activity.listen", "ACTIVITY_ACTION", "ouvir", "🔊"),
  definition("activity.look", "ACTIVITY_ACTION", "olhar", "👀", 6564),
  definition("activity.match", "ACTIVITY_ACTION", "combinar", "🧩"),
  definition("activity.complete", "ACTIVITY_ACTION", "completar", "✅", 13078),
  definition("activity.move", "ACTIVITY_ACTION", "mover", "↔️", 7167),
  definition("activity.point", "ACTIVITY_ACTION", "apontar", "👉", 6612),
  definition("communication.i_dont_understand", "COMMUNICATION", "não entendi", "❓"),
  definition("communication.another_activity", "COMMUNICATION", "outra atividade", "🎮"),
  definition("communication.listen_again", "COMMUNICATION", "ouvir novamente", "🔊"),
  definition("communication.help_me", "COMMUNICATION", "me ajude", "🙋"),
  ...[2626, 2627, 2628, 2629, 2630, 2631, 2632, 2633, 2634, 2635, 7025,
    29260, 29262, 29264, 29266, 29268, 29270, 29272, 29274, 29276, 29550]
    .map((arasaacId, value) => definition(`number.${value}`, "NUMBER", String(value), String(value), arasaacId)),
  definition("library.math", "LEARNING_LIBRARY", "matemática", "🔢", 32554),
  definition("library.circle", "LEARNING_LIBRARY", "círculo", "⭕", 4603),
  definition("library.square", "LEARNING_LIBRARY", "quadrado", "⬜", 4616),
  definition("library.rectangle", "LEARNING_LIBRARY", "retângulo", "▭", 4731),
  definition("library.diamond", "LEARNING_LIBRARY", "losango", "🔶", 4734),
  definition("library.star", "LEARNING_LIBRARY", "estrela", "⭐", 4644),
  definition("library.cube", "LEARNING_LIBRARY", "cubo", "🧊", 8308),
  definition("library.cylinder", "LEARNING_LIBRARY", "cilindro", "🥫", 9111),
  definition("library.cone", "LEARNING_LIBRARY", "cone", "🔺", 9112),
  definition("library.red", "LEARNING_LIBRARY", "vermelho", "🔴", 2808),
  definition("library.blue", "LEARNING_LIBRARY", "azul", "🔵", 4869),
  definition("library.learn", "LEARNING_LIBRARY", "aprender", "📚", 37810),
  definition("library.study", "LEARNING_LIBRARY", "estudar", "📖", 8029),
  definition("library.understand", "LEARNING_LIBRARY", "compreender", "💡", 26636),
  definition("library.first", "LEARNING_LIBRARY", "primeiro", "1️⃣", 32129),
  definition("library.next", "LEARNING_LIBRARY", "seguinte", "➡️", 27331),
  definition("library.last", "LEARNING_LIBRARY", "último", "🏁", 32069),
  definition("library.now", "LEARNING_LIBRARY", "agora", "⏱️", 32747),
  definition("library.after", "LEARNING_LIBRARY", "depois", "➡️", 32749),
  definition("library.play", "LEARNING_LIBRARY", "jogar", "🎮", 23392),
  definition("library.board_game", "LEARNING_LIBRARY", "jogo de mesa", "🎲", 9810),
  definition("library.learning_game", "LEARNING_LIBRARY", "jogo educativo", "🧩", 36405),
  definition("library.die", "LEARNING_LIBRARY", "dado", "🎲", 2731),
  definition("library.domino", "LEARNING_LIBRARY", "dominó", "🁣", 3095),
  definition("library.tablet_game", "LEARNING_LIBRARY", "jogar no tablet", "📱", 29151),
  definition('action.yes', "STATE", "sim", "✅"),
  definition('action.no', "STATE", "não", "❌"),
  definition('character.titia', "LEARNING_LIBRARY", "TitiA", "🦋"),
  definition('math.addition', "MATHEMATICS", "adição", "➕", 5868),
  definition('math.number_line', "MATHEMATICS", "reta numérica", "🔢"),
  definition('math.part', "MATHEMATICS", "parte", "🧩"),
  definition('math.whole', "MATHEMATICS", "todo", "🔵"),
  definition('object.apple', "LEARNING_LIBRARY", "maçã", "🍎"),
  definition('shape.circle', "MATHEMATICS", "círculo", "⭕", 4603),
  definition('shape.square', "MATHEMATICS", "quadrado", "⬜", 4616),
  definition('shape.triangle', "MATHEMATICS", "triângulo", "🔺"),
];

export class PictogramRegistry {
  private readonly entries = new Map(definitions.map((entry) => [entry.conceptId, entry]));
  get(conceptId: string): PictogramDefinition | null {
    if (/^arasaac\.[1-9]\d*$/.test(conceptId)) {
      const arasaacId = Number(conceptId.slice('arasaac.'.length));
      return definition(conceptId as PictogramConcept, 'LEARNING_LIBRARY', 'pictograma ARASAAC', '□', arasaacId);
    }
    return this.entries.get(conceptId as PictogramConcept) ?? null;
  }
  getImageUrl(conceptId: string, size = 500): string | null {
    const entry = this.get(conceptId);
    return entry?.arasaacId == null ? null :
      `${ARASAAC_PICTOGRAM_BASE_URL}/${entry.arasaacId}/${entry.arasaacId}_${size}.png`;
  }
  list(category?: PictogramCategory): PictogramDefinition[] {
    const values = Array.from(this.entries.values());
    return category ? values.filter((entry) => entry.category === category) : values;
  }
}

export const pictogramRegistry = new PictogramRegistry();
export const PICTOGRAM_REGISTRY = Object.fromEntries(
  pictogramRegistry.list().map((entry) => [entry.conceptId, entry]),
) as Record<string, PictogramDefinition>;
export const resolvePictogram = (conceptId: string) => pictogramRegistry.get(conceptId);
