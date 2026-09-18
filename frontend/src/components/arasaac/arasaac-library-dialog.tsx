"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useModalFocus } from '@/hooks/use-modal-focus';
import { useTitiaSpeech } from '@/hooks/use-titia-speech';
import { useVisualCommunicationAnalytics } from '@/hooks/use-visual-communication-analytics';
import { api } from '@/lib/api-client';
import { authService } from '@/lib/auth';
import { ARASAAC_CATEGORIES, arasaacCatalog, type CatalogEntry } from '@/lib/arasaac-catalog';
import { ArasaacAttribution } from './arasaac-attribution';
import { ArasaacPictogram } from './arasaac-pictogram';

export function ArasaacLibraryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const locale = useLocale();
  const { user } = useAuth();
  const speech = useTitiaSpeech();
  const track = useVisualCommunicationAnalytics();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useModalFocus<HTMLElement>(open, onClose, closeRef);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<CatalogEntry[]>([]);
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [professionalVoiceEnabled, setProfessionalVoiceEnabled] = useState(false);
  const category = ARASAAC_CATEGORIES[categoryIndex];

  useEffect(() => {
    if (!open) return;
    track('visual_library_opened');
  }, [open, track]);

  useEffect(() => {
    if (!open || user?.role !== 'child') return;
    let active = true;
    const token = authService.getStoredToken();
    if (!token) return;
    setProfessionalVoiceEnabled(false);
    api.get<{ uiPreferences?: { voiceEnabled?: boolean } }>(`/users/${user.id}/child-profile`, token)
      .then((profile) => { if (active) setProfessionalVoiceEnabled(profile.uiPreferences?.voiceEnabled === true); })
      .catch(() => { if (active) setProfessionalVoiceEnabled(false); });
    return () => { active = false; };
  }, [open, user?.id, user?.role]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError(false);
    setSelected(null);
    setItems(arasaacCatalog.curated(category.concepts));
    arasaacCatalog.list(category).then((results) => {
      if (active) { setItems(results); setError(results.length === 0); }
    }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, category]);

  const hasSession = Boolean(authService.getStoredToken());
  const voiceAllowed = speech.settings.voiceEnabled && (!hasSession || (Boolean(user) && (user?.role !== 'child' || professionalVoiceEnabled)));

  const select = useCallback((item: CatalogEntry) => {
    setSelected(item);
    track('visual_library_item_selected', { pictogramConceptId: item.conceptId, category: category.name });
    track('pictogram_opened', { pictogramConceptId: item.conceptId, category: category.name });
    if (voiceAllowed) speech.speakPictogram(item.label, item.conceptId);
  }, [category.name, speech, track, voiceAllowed]);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    if (term.length < 2) return;
    setLoading(true);
    setError(false);
    setSelected(null);
    try {
      const results = await arasaacCatalog.search(term);
      setItems(results);
      setError(results.length === 0);
    } catch { setItems([]); setError(true); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section id="arasaac-library-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="arasaac-library-title" tabIndex={-1}
      className="flex max-h-[95dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl">
      <header className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-3 text-white sm:px-6">
        <ArasaacPictogram conceptId="library.learn" showLabel={false} imageClassName="h-10 w-10" />
        <div className="flex-1"><h2 id="arasaac-library-title" className="text-xl font-black">Aprender com a TitiA</h2><p className="text-sm">Biblioteca ARASAAC com palavra escrita e descrição</p></div>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Fechar biblioteca" className="rounded-xl bg-white/20 px-3 py-2 text-xl font-bold">×</button>
      </header>
      <nav aria-label="Seções de pictogramas" className="flex shrink-0 gap-2 overflow-x-auto border-b p-3">
        {ARASAAC_CATEGORIES.map((section, index) => <button key={section.name} type="button"
          onClick={() => { setCategoryIndex(index); setQuery(''); }} aria-current={categoryIndex === index ? 'page' : undefined}
          className={`shrink-0 rounded-xl px-3 py-2 text-sm font-bold ${categoryIndex === index ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-900'}`}>
          <span aria-hidden="true">{section.emoji}</span> {section.name}
        </button>)}
      </nav>
      <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
        <form onSubmit={search} className="mb-4 flex gap-2">
          <label htmlFor="arasaac-search" className="sr-only">Buscar pictogramas</label>
          <input id="arasaac-search" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={50}
            placeholder="Buscar palavra no ARASAAC" className="min-w-0 flex-1 rounded-xl border-2 border-orange-200 px-3 py-2" />
          <button type="submit" className="rounded-xl bg-orange-500 px-4 py-2 font-bold text-white">Buscar</button>
        </form>
        {selected && <div className="mb-4 flex items-center gap-4 rounded-2xl border-2 border-purple-200 bg-purple-50 p-3">
          <ArasaacPictogram conceptId={selected.conceptId} alt={`Pictograma: ${selected.label}`} showLabel={false} imageClassName="h-20 w-20" />
          <div className="min-w-0 flex-1"><p className="text-lg font-black text-purple-900">{selected.label}</p><p className="text-sm text-slate-700">{selected.description || `Palavra associada no catálogo ARASAAC: ${selected.label}.`}</p></div>
          {voiceAllowed && <button type="button" onClick={() => speech.speakPictogram(selected.label, selected.conceptId)} aria-label={`Ouvir ${selected.label}`}
            className="rounded-xl bg-purple-600 px-3 py-2 font-bold text-white"><ArasaacPictogram conceptId="navigation.listen" showLabel={false} imageClassName="h-7 w-7" /> Ouvir</button>}
        </div>}
        {!voiceAllowed && <p className="mb-3 text-sm text-slate-600">Leitura em voz alta desativada nas preferências de voz{user?.role === 'child' ? ' ou no perfil definido pelo profissional' : ''}.</p>}
        {loading && <p role="status" className="mb-3 text-sm text-slate-600">Buscando pictogramas...</p>}
        {error && <p role="status" className="mb-3 text-sm text-amber-800">O catálogo não respondeu ou não encontrou pictogramas. Tente outra palavra.</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {items.map((item) => <button key={item.conceptId} type="button" onClick={() => select(item)}
            aria-label={`Abrir ${item.label}`} className="flex min-h-36 flex-col items-center justify-center rounded-2xl border-2 border-orange-100 bg-white p-2 hover:border-orange-400 focus:ring-4 focus:ring-orange-200">
            <ArasaacPictogram conceptId={item.conceptId} alt={`Pictograma: ${item.label}`} showLabel={false} imageClassName="h-20 w-20" />
            <span className="mt-1 text-center text-sm font-bold text-slate-800">{item.label}</span>
          </button>)}
        </div>
        {user?.role === 'child' && <div className="mt-5 rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-blue-900">Continue com estes conceitos nas <Link href={`/${locale}/learn/menu`} onClick={onClose} className="underline">ilhas de atividades</Link>.</div>}
        <ArasaacAttribution className="mt-5 text-slate-600" />
      </div>
    </section>
  </div>;
}
