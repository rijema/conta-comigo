import { NextRequest, NextResponse } from 'next/server';

interface ApiKeyword { keyword?: string; meaning?: string }
interface ApiPictogram { _id?: number; keywords?: ApiKeyword[] }

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length < 2 || query.length > 50 || !/^[A-Za-zÀ-ÿ0-9\s-]+$/.test(query)) {
    return NextResponse.json({ error: 'Invalid search term' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.arasaac.org/v1/pictograms/pt/search/${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`ARASAAC returned ${response.status}`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error('Invalid ARASAAC response');
    const results = (payload as ApiPictogram[]).slice(0, 36).flatMap((pictogram) => {
      if (!Number.isSafeInteger(pictogram._id) || (pictogram._id ?? 0) <= 0) return [];
      const keyword = pictogram.keywords?.find((entry) => typeof entry.keyword === 'string' && normalize(entry.keyword) === normalize(query))
        ?? pictogram.keywords?.find((entry) => typeof entry.keyword === 'string' && entry.keyword.trim());
      if (!keyword) return [];
      return [{ id: pictogram._id, label: keyword.keyword!.trim(), description: keyword.meaning?.trim() || '' }];
    });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'ARASAAC temporarily unavailable' }, { status: 503 });
  }
}
