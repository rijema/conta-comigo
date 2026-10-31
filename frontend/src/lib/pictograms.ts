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
  definition("mathematics.numbers", "MATHEMATICS", "números", "🔢", 2879), // 6198 showed an X-ray (checked out/2026)
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
  // ── Island themes, activity-type icons and feedback ──
  // Audit (out/2026): the numeric IDs previously listed here were checked
  // against static.arasaac.org and NONE of them exist (HTTP 404), so every
  // one of these icons was already falling back to its emoji. Where an
  // equivalent pictogram was found AND visually checked, the ID was replaced;
  // otherwise arasaacId is null and the (unchanged) emoji fallback is shown
  // directly, without a failing network request. Concept IDs are kept so no
  // seed, migration or attempt history needs to change.
  definition("arasaac.14494", "LEARNING_LIBRARY", "girassol", "🌻"),       // Island theme: counting
  definition("arasaac.16590", "LEARNING_LIBRARY", "onda", "🌊"),           // Island theme: sea/addition
  definition("arasaac.16165", "LEARNING_LIBRARY", "planta", "🌿", 3143),   // Island theme (16165 showed a person at a door; 3143 checked)
  definition("arasaac.17784", "LEARNING_LIBRARY", "flor", "🌸", 3102),     // Island theme: flowers/comparison (checked)
  definition("arasaac.15195", "LEARNING_LIBRARY", "maçã", "🍎", 2462),     // Island theme: apples/shapes (checked)
  definition("arasaac.20951", "LEARNING_LIBRARY", "tartaruga", "🐢"),      // Island theme: animals/measures
  definition("arasaac.17331", "LEARNING_LIBRARY", "unicórnio", "🦄"),      // Island theme: magic/sequences
  definition("arasaac.15971", "LEARNING_LIBRARY", "laço", "🎀"),           // Island theme: bow/ordering

  // Activity type icons
  definition("arasaac.14456", "LEARNING_LIBRARY", "alvo", "🎯"),           // Multiple choice: target
  definition("arasaac.14379", "COMMUNICATION", "o que?", "❓"),            // Quiz: what?
  definition("arasaac.15953", "ACTIVITY_ACTION", "mão", "🖐️"),             // Drag: hand
  definition("arasaac.15851", "MATHEMATICS", "régua", "📏", 2815),         // Measures: ruler (checked)

  // Dialog & feedback
  definition("arasaac.15532", "LEARNING_LIBRARY", "borboleta", "🦋", 2465), // TitiA character: butterfly (checked)

  // Exercise support: sizes, colors, comparisons
  definition("arasaac.15813", "LEARNING_LIBRARY", "grande", "📏", 4658),   // Big/Large (checked: arrow on the biggest square)
  definition("arasaac.15814", "LEARNING_LIBRARY", "pequeno", "📍", 4716),  // Small (checked: arrow on the smallest square)
  definition("arasaac.14560", "LEARNING_LIBRARY", "verde", "🟢"),          // Green color
  // arasaac.15358 was declared twice ("lâmpada" and "amarelo"); the Map keeps
  // the last one, so only "amarelo" was ever reachable. Kept as-is.
  definition("arasaac.15358", "LEARNING_LIBRARY", "amarelo", "🟡"),

  // Approximations (semantic, use with intent)
  definition("arasaac.14120", "ACTIVITY_ACTION", "forte", "💪"),           // Improvement prompts: strong/effort
  definition("arasaac.44702", "LEARNING_LIBRARY", "festa", "🎉"),          // Celebration: party
  definition("arasaac.15811", "LEARNING_LIBRARY", "estrela", "🌟", 4644),  // Excellent/great (checked)
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
  // Concrete, kid-familiar items (used instead of abstract shapes in
  // matching/counting exercises — easier for TEA children to anchor to).
  definition("library.dog", "LEARNING_LIBRARY", "cachorro", "🐶", 34041),
  definition("library.cat", "LEARNING_LIBRARY", "gato", "🐱", 7114),
  definition("library.ball", "LEARNING_LIBRARY", "bola", "⚽", 3241),
  definition('action.yes', "STATE", "sim", "✅"),
  definition('action.no', "STATE", "não", "❌"),
  definition('character.titia', "LEARNING_LIBRARY", "TitiA", "🦋"),
  definition('math.addition', "MATHEMATICS", "adição", "➕", 5868),
  definition('math.number_line', "MATHEMATICS", "reta numérica", "🔢"),
  definition('math.part', "MATHEMATICS", "parte", "🧩"),
  definition('math.whole', "MATHEMATICS", "todo", "🔵"),
  definition('object.apple', "LEARNING_LIBRARY", "maçã", "🍎", 2462),
  definition('shape.circle', "MATHEMATICS", "círculo", "⭕", 4603),
  definition('shape.square', "MATHEMATICS", "quadrado", "⬜", 4616),
  // Pinned: the runtime label search for "triângulo" returns the musical
  // instrument (2604) first; 4763 is the geometric shape (checked).
  definition('shape.triangle', "MATHEMATICS", "triângulo", "🔺", 4763),
  // Pictograms authored for specific exercises below (symbol-only fallback;
  // no arasaacId since we can't verify numeric IDs without the live catalog,
  // and showing the wrong image would be worse than a clear emoji fallback).
  definition('library.coin', "LEARNING_LIBRARY", "moeda", "🪙"),
  definition('library.grid', "LEARNING_LIBRARY", "malha quadriculada", "▦"),
  // arasaac.23190 is reused across ~14 seed exercises as a generic "números"
  // support icon. Without this curated entry it fell through to the
  // uncurated-ID fallback and displayed the literal placeholder label
  // "pictograma ARASAAC" on screen instead of a real description.
  // 23190 does not exist on static.arasaac.org (404): emoji fallback only.
  definition('arasaac.23190', "MATHEMATICS", "números", "🔢", 2879),
  // Seed-only IDs that do not exist on ARASAAC (404) but have ONE meaning in
  // every exercise that uses them, so they can safely point to a checked
  // pictogram. IDs used with different meanings in different exercises
  // (17331, 16590, 23191, 13186, 26968, 14098, 17629, 16591) are left alone.
  definition('arasaac.17333', "LEARNING_LIBRARY", "biscoito", "🍪", 8312), // "Tirando biscoitos", "Divida os Biscoitos"
  definition('arasaac.23189', "LEARNING_LIBRARY", "maçã", "🍎", 2462),     // apple counting/addition exercises
  definition('arasaac.61042', "LEARNING_LIBRARY", "cesta", "🧺", 3012),    // "maçã, cesta" exercise
  // Directional/position concepts used to enrich answer options for
  // spatial-position exercises (e.g. "esquerda"/"direita"/"em cima").
  definition('library.left', "LEARNING_LIBRARY", "esquerda", "⬅️"),
  definition('library.right', "LEARNING_LIBRARY", "direita", "➡️"),
  definition('library.up', "LEARNING_LIBRARY", "em cima", "⬆️"),
  definition('library.down', "LEARNING_LIBRARY", "embaixo", "⬇️"),
  definition('library.sun', "LEARNING_LIBRARY", "sol", "☀️"),
  definition('library.moon', "LEARNING_LIBRARY", "lua", "🌙"),
  // Calm-break pictograms (IDs checked against the ARASAAC catalog).
  definition('library.breathe', "LEARNING_LIBRARY", "respirar fundo", "🌬️", 34377),
  definition('library.stretch', "LEARNING_LIBRARY", "espreguiçar", "🙆", 8989),
  definition('library.drink_water', "LEARNING_LIBRARY", "beber água", "💧", 2276),
  definition('library.rest', "LEARNING_LIBRARY", "descansar", "🛋️", 16643),
  definition('library.calm', "LEARNING_LIBRARY", "ficar tranquilo", "😌", 37828),
  // ── Curriculum progression exercises (2º–5º ano) ──
  // Every ID below was looked up on api.arasaac.org and its image was
  // visually checked (out/2026) before use. Euro coin/banknote pictograms
  // were deliberately NOT used: amounts in reais are shown as text.
  definition('library.triangle', "LEARNING_LIBRARY", "triângulo", "🔺", 4763),
  definition('library.pentagon', "LEARNING_LIBRARY", "pentágono", "⬟", 4715),
  definition('library.hexagon', "LEARNING_LIBRARY", "hexágono", "⬢", 4663),
  // ARASAAC keyword is "trapézio", but the drawing is a parallelogram
  // (two pairs of parallel sides), so it is only used as a parallelogram.
  definition('library.parallelogram', "LEARNING_LIBRARY", "paralelogramo", "▱", 4761),
  definition('library.sphere', "LEARNING_LIBRARY", "esfera", "⚪", 9113),
  definition('library.pyramid', "LEARNING_LIBRARY", "pirâmide", "🔺", 9110),
  definition('library.pyramid_square', "LEARNING_LIBRARY", "pirâmide de base quadrada", "🔺", 8190),
  definition('library.prism', "LEARNING_LIBRARY", "prisma", "🔷", 9114),
  definition('library.set_square', "LEARNING_LIBRARY", "esquadro", "📐", 7088),
  definition('library.mirror', "LEARNING_LIBRARY", "espelho", "🪞", 8573),
  definition('library.butterfly', "LEARNING_LIBRARY", "borboleta", "🦋", 2465),
  definition('library.giraffe', "LEARNING_LIBRARY", "girafa", "🦒", 2437),
  definition('library.treasure_map', "LEARNING_LIBRARY", "mapa do tesouro", "🗺️", 8625),
  definition('library.fraction_quarters', "LEARNING_LIBRARY", "círculo dividido em quatro partes", "◔", 9877),
  definition('library.half', "LEARNING_LIBRARY", "metade: duas de quatro partes pintadas", "◑", 5516),
  definition('library.percent', "LEARNING_LIBRARY", "porcentagem", "%", 5093),
  definition('library.ruler', "LEARNING_LIBRARY", "régua", "📏", 2815),
  definition('library.measuring_tape', "LEARNING_LIBRARY", "fita métrica", "📏", 2913),
  definition('library.bottle_liter', "LEARNING_LIBRARY", "garrafa de um litro", "🍾", 7145),
  definition('library.thermometer', "LEARNING_LIBRARY", "termômetro", "🌡️", 37478),
  // Shows a fixed time (23:50): used only as metadata icon, never in a question.
  definition('library.digital_clock', "LEARNING_LIBRARY", "relógio digital", "⏰", 23408),
  definition('library.calendar', "LEARNING_LIBRARY", "calendário", "📅", 3071),
  definition('library.week', "LEARNING_LIBRARY", "calendário da semana", "📅", 7244),
  definition('library.piggy_bank', "LEARNING_LIBRARY", "cofrinho", "🐷", 4666),
  definition('library.vote', "LEARNING_LIBRARY", "votação", "🗳️", 6631),
  definition('library.rain', "LEARNING_LIBRARY", "chuva", "🌧️", 3123),
  definition('library.tree', "LEARNING_LIBRARY", "árvore", "🌳", 3057),
  definition('library.strawberry', "LEARNING_LIBRARY", "morango", "🍓", 2400),
  definition('library.banana', "LEARNING_LIBRARY", "banana", "🍌", 2530),
  definition('library.cookie', "LEARNING_LIBRARY", "biscoito", "🍪", 8312),
  definition('library.egg', "LEARNING_LIBRARY", "ovo", "🥚", 2427),
  definition('library.bread', "LEARNING_LIBRARY", "pão", "🍞", 2494),
  definition('library.sandwich', "LEARNING_LIBRARY", "sanduíche", "🥪", 3383),
  definition('library.juice', "LEARNING_LIBRARY", "suco", "🧃", 11461),
  definition('library.pizza', "LEARNING_LIBRARY", "pizza", "🍕", 2527),
  definition('library.ice_cream', "LEARNING_LIBRARY", "sorvete", "🍨", 35209),
  definition('library.ice_cream_cone', "LEARNING_LIBRARY", "casquinha de sorvete", "🍦", 2420),
  definition('library.balloon', "LEARNING_LIBRARY", "balão", "🎈", 2408),
  definition('library.book', "LEARNING_LIBRARY", "livro", "📖", 25191),
  definition('library.pencil', "LEARNING_LIBRARY", "lápis", "✏️", 2440),
  definition('library.backpack', "LEARNING_LIBRARY", "mochila", "🎒", 2475),
  definition('library.box', "LEARNING_LIBRARY", "caixa", "📦", 5935),
  definition('library.bus', "LEARNING_LIBRARY", "ônibus", "🚌", 2262),
  definition('library.tshirt', "LEARNING_LIBRARY", "camiseta", "👕", 2309),
  definition('library.pants', "LEARNING_LIBRARY", "calça", "👖", 2565),
  // Island map themes (checked out/2026)
  definition('library.elephant', "LEARNING_LIBRARY", "elefante", "🐘", 2372),
  definition('library.ant', "LEARNING_LIBRARY", "formiga", "🐜", 2425),
  definition('library.plate', "LEARNING_LIBRARY", "prato", "🍽️", 2532),
  definition('library.rainbow', "LEARNING_LIBRARY", "arco-íris", "🌈", 2986),
  definition('library.castle', "LEARNING_LIBRARY", "castelo", "🏰", 5950),
  definition('library.wheel', "LEARNING_LIBRARY", "roda", "🛞", 6209),
  definition('library.car', "LEARNING_LIBRARY", "carro", "🚗", 2339),
];

export class PictogramRegistry {
  private readonly entries = new Map(definitions.map((entry) => [entry.conceptId, entry]));
  get(conceptId: string): PictogramDefinition | null {
    // IMPORTANT: check curated entries FIRST. Previously the `arasaac.N` /
    // pure-digit regex checks ran before this lookup, so ANY curated
    // definition using an `arasaac.NNNN` conceptId (girassol, onda, planta,
    // alvo, régua, etc. — dozens of entries above) was unreachable and
    // ALWAYS fell back to the generic "pictograma ARASAAC" placeholder
    // label/symbol, regardless of having a real curated label. This made
    // real pictograms silently show the literal text "pictograma ARASAAC"
    // instead of their actual Portuguese label across many exercises.
    const curated = this.entries.get(conceptId as PictogramConcept);
    if (curated) return curated;
    if (/^\d+$/.test(String(conceptId).trim())) {
      const arasaacId = Number(conceptId);
      return definition(`arasaac.${arasaacId}` as PictogramConcept, 'LEARNING_LIBRARY', 'pictograma ARASAAC', '□', arasaacId);
    }
    if (/^arasaac\.[1-9]\d*$/.test(conceptId)) {
      const arasaacId = Number(conceptId.slice('arasaac.'.length));
      return definition(conceptId as PictogramConcept, 'LEARNING_LIBRARY', 'pictograma ARASAAC', '□', arasaacId);
    }
    return null;
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
