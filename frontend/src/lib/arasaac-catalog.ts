import { pictogramRegistry } from './pictograms';

export interface CatalogEntry {
  conceptId: string;
  label: string;
  description: string;
}

export interface CatalogCategory {
  name: string;
  emoji: string;
  searches: string[];
  concepts: string[];
}

export const ARASAAC_CATEGORIES: CatalogCategory[] = [
  { name: 'Números', emoji: '🔢', searches: ['número', 'quantidade'], concepts: Array.from({ length: 21 }, (_, value) => `number.${value}`) },
  { name: 'Pessoas', emoji: '👨‍👩‍👧', searches: ['criança', 'família', 'professor'], concepts: [] },
  { name: 'Animais', emoji: '🐢', searches: ['cachorro', 'gato', 'pássaro'], concepts: [] },
  { name: 'Alimentos', emoji: '🍎', searches: ['maçã', 'banana', 'pão'], concepts: [] },
  { name: 'Objetos', emoji: '🧸', searches: ['lápis', 'livro', 'bola'], concepts: ['library.die', 'library.domino'] },
  { name: 'Ações', emoji: '👆', searches: ['olhar', 'escolher', 'arrastar'], concepts: ['activity.look', 'activity.choose', 'activity.touch', 'activity.complete'] },
  { name: 'Emoções', emoji: '😊', searches: ['feliz', 'triste', 'calmo'], concepts: [] },
  { name: 'Lugares', emoji: '🏫', searches: ['escola', 'casa', 'parque'], concepts: [] },
  { name: 'Matemática', emoji: '➕', searches: ['somar', 'subtrair', 'contar'], concepts: ['mathematics.addition', 'mathematics.subtraction', 'mathematics.equal', 'mathematics.count', 'mathematics.more', 'mathematics.less', 'mathematics.order', 'mathematics.sequence'] },
  { name: 'Símbolos', emoji: '🔣', searches: ['símbolo', 'seta', 'igual'], concepts: ['mathematics.equal', 'navigation.back', 'mathematics.more', 'mathematics.less'] },
  { name: 'Formas', emoji: '🔷', searches: ['triângulo', 'círculo', 'quadrado'], concepts: ['library.circle', 'library.square', 'library.rectangle', 'library.diamond', 'library.cube', 'library.cylinder', 'library.cone'] },
  { name: 'Cores', emoji: '🎨', searches: ['vermelho', 'azul', 'amarelo'], concepts: ['library.red', 'library.blue'] },
  { name: 'Cotidiano', emoji: '🏠', searches: ['comer', 'dormir', 'comprar'], concepts: ['library.now', 'library.after'] },
  { name: 'Aprender', emoji: '📚', searches: ['aprender', 'estudar', 'ler'], concepts: ['library.learn', 'library.study', 'library.understand'] },
  { name: 'Educação', emoji: '🏫', searches: ['aula', 'professor', 'escola'], concepts: ['library.learn', 'library.study'] },
  { name: 'Jogos', emoji: '🎲', searches: ['jogar', 'brincar', 'jogo'], concepts: ['library.play', 'library.board_game', 'library.learning_game', 'library.tablet_game'] },
  { name: 'Software', emoji: '📱', searches: ['computador', 'tablet', 'teclado'], concepts: ['library.tablet_game'] },
];

export const ARASAAC_CATALOG_IS_ADAPTIVE = false;

const searchCache = new Map<string, Promise<CatalogEntry[]>>();
const missingExerciseConcepts = new Set([
  'object.apple', 'shape.triangle', 'math.number_line', 'math.part', 'math.whole',
]);
const normalizeLabel = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();

export const arasaacCatalog = {
  category(name: string): CatalogCategory | undefined {
    return ARASAAC_CATEGORIES.find((category) => category.name === name);
  },
  curated(concepts: string[]): CatalogEntry[] {
    return concepts.flatMap((conceptId) => {
      const entry = pictogramRegistry.get(conceptId);
      return entry?.arasaacId ? [{ conceptId, label: entry.labelPt, description: entry.altPt }] : [];
    });
  },
  imageUrl(conceptId: string): string | null {
    return pictogramRegistry.getImageUrl(conceptId);
  },
  search(term: string): Promise<CatalogEntry[]> {
    const query = term.trim().toLocaleLowerCase('pt-BR');
    if (query.length < 2) return Promise.resolve([]);
    if (!searchCache.has(query)) {
      const pending = fetch(`/api/arasaac/search?q=${encodeURIComponent(query)}`)
        .then(async (response) => {
          if (!response.ok) throw new Error('Catalog unavailable');
          const data = await response.json() as { results: Array<{ id: number; label: string; description: string }> };
          return data.results.map((entry) => ({ conceptId: `arasaac.${entry.id}`, label: entry.label, description: entry.description }));
        }).catch((error) => { searchCache.delete(query); throw error; });
      searchCache.set(query, pending);
    }
    return searchCache.get(query)!;
  },
  async resolveMissing(conceptId: string): Promise<string | null> {
    if (!missingExerciseConcepts.has(conceptId)) return null;
    const entry = pictogramRegistry.get(conceptId);
    if (!entry || entry.arasaacId !== null) return null;
    const matches = await this.search(entry.labelPt);
    return matches.find((match) => normalizeLabel(match.label) === normalizeLabel(entry.labelPt))?.conceptId ?? null;
  },
  async list(category: CatalogCategory): Promise<CatalogEntry[]> {
    const searches = await Promise.allSettled(category.searches.map((term) => this.search(term)));
    if (searches.every((result) => result.status === 'rejected')) throw new Error('Catalog unavailable');
    const entries = [...this.curated(category.concepts), ...searches.flatMap((result) => result.status === 'fulfilled' ? result.value : [])];
    return Array.from(new Map(entries.map((entry) => [this.imageUrl(entry.conceptId), entry])).values())
      .filter((entry) => this.imageUrl(entry.conceptId));
  },
};
