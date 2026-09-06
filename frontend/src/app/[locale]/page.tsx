"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { AuthDialog, type AuthView } from "@/components/home/auth-dialog";
import { ArasaacSection } from "@/components/arasaac/arasaac-section";

export default function HomePage() {
  const locale = useLocale();
  const [compact, setCompact] = useState(false);
  const [auth, setAuth] = useState<AuthView | null>(null);
  const [showArasaac, setShowArasaac] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const closeAuth = useCallback(() => setAuth(null), []);

  useEffect(() => {
    const update = () => setCompact(window.scrollY > 36);
    update(); window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(145deg,#fff7ed_0%,#fdf2f8_38%,#eef2ff_72%,#ecfeff_100%)] text-slate-900">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:font-bold">Pular para o conteúdo</a>
      <div className="fixed inset-x-0 top-0 z-50 h-1.5 bg-[linear-gradient(90deg,#7c3aed,#ec4899,#fb923c,#facc15,#34d399,#38bdf8)]" />

      <header className={`fixed inset-x-0 top-1.5 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl transition-all ${compact ? "shadow-md" : ""}`}>
        <nav aria-label="Navegação principal" className={`mx-auto flex max-w-6xl items-center justify-between px-4 transition-all sm:px-6 ${compact ? "h-16" : "h-20"}`}>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 text-left" aria-label="Conta Comigo, voltar ao início">
            <Image src="/assets/iconbrowser.png" width={compact ? 42 : 52} height={compact ? 42 : 52} alt="" className="rounded-full" priority />
            <span><strong className={`${compact ? "text-xl" : "text-2xl"} block font-black leading-none text-indigo-950`}>Conta Comigo</strong><span className={`font-semibold text-violet-700 ${compact ? "hidden" : "hidden sm:block text-xs"}`}>Matemática que aprende com cada criança.</span></span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowArasaac((value) => !value)} aria-expanded={showArasaac} aria-controls="arasaac-details" className="hidden rounded-xl px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-50 sm:block">ARASAAC</button>
            <button onClick={() => setAuth("login")} className="rounded-xl border-2 border-violet-200 bg-white px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-50">Entrar</button>
            <button onClick={() => setAuth("register")} className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-black text-white shadow-md hover:-translate-y-0.5">Cadastrar</button>
          </div>
        </nav>
      </header>

      <main id="conteudo" className="pt-24">
        <section className="relative mx-auto grid min-h-[calc(100svh-6rem)] max-w-6xl items-center gap-4 px-5 py-6 lg:grid-cols-[1fr_1.05fr] lg:px-6">
          <div className="relative z-10 text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/75 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm"><span aria-hidden>🦋</span> Aprender juntos sempre faz sentido</div>
            <h1 className="text-5xl font-black leading-[.95] tracking-tight text-indigo-950 sm:text-6xl lg:text-7xl">Conta<br className="hidden lg:block" /> Comigo</h1>
            <p className="mt-4 text-xl font-extrabold text-violet-700 sm:text-2xl">Matemática que aprende com cada criança.</p>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 lg:mx-0">Uma jornada adaptativa, acolhedora e visual para crianças com TEA, acompanhada pela TitiA em cada descoberta.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
              <button onClick={() => setAuth("register")} className="rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 px-7 py-4 text-lg font-black text-white shadow-xl hover:-translate-y-1 focus:ring-4 focus:ring-violet-200">Começar agora</button>
              <button onClick={() => setShowAbout(true)} className="rounded-2xl border-2 border-violet-200 bg-white/80 px-7 py-4 text-lg font-bold text-violet-800 hover:bg-white">Conheça a TitiA</button>
            </div>
            <ul className="mt-7 flex flex-wrap justify-center gap-2 text-sm font-semibold text-slate-700 lg:justify-start" aria-label="Destaques">
              {["Acolhe sem pressionar", "Celebra conquistas", "Respeita cada ritmo"].map((text) => <li key={text} className="rounded-full bg-white/70 px-3 py-1.5 shadow-sm">✓ {text}</li>)}
            </ul>
          </div>

          <div className="relative mx-auto h-[48svh] min-h-[360px] w-full max-w-2xl lg:h-[72svh]">
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-yellow-200 via-pink-200 to-violet-300 blur-3xl opacity-60" />
            <Image src="/assets/rainbowGiff.gif" width={480} height={480} alt="" unoptimized className="absolute right-0 top-2 h-28 w-28 opacity-80 sm:h-36 sm:w-36" />
            <Image src="/assets/mainiconfirstpage.png" alt="TitiA sorrindo e dando boas-vindas" fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain object-bottom drop-shadow-2xl" />
            <div className="absolute bottom-3 left-1/2 w-[92%] -translate-x-1/2 rounded-3xl border border-white/80 bg-white/80 p-4 text-center shadow-xl backdrop-blur sm:w-auto sm:min-w-80">
              <p className="text-lg font-black text-indigo-950">Olá! Eu sou a TitiA.</p><p className="text-sm text-slate-600">Estou aqui para aprender com você.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-10 sm:px-6" aria-labelledby="recursos-title">
          <h2 id="recursos-title" className="sr-only">Recursos da plataforma</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[{ image: "/assets/senseofmotion.png", title: "Adaptação com sentido", text: "Atividades escolhidas conforme o momento e o perfil de aprendizagem." },{ image: "/assets/answeryeymotion.png", title: "Incentivo sem pressão", text: "Feedback positivo, claro e respeitoso a cada tentativa." },{ image: "/assets/severalreactionstitia.png", title: "TitiA sempre presente", text: "Expressões e orientações que tornam a jornada mais humana." }].map((item) => <article key={item.title} className="overflow-hidden rounded-3xl border border-white bg-white/75 shadow-sm"><div className="relative h-32"><Image src={item.image} alt="" fill sizes="33vw" className="object-contain" /></div><div className="p-5 pt-2"><h3 className="font-black text-indigo-950">{item.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{item.text}</p></div></article>)}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-12 text-center sm:px-6">
          <button type="button" onClick={() => setShowArasaac((value) => !value)} aria-expanded={showArasaac} aria-controls="arasaac-details" className="group inline-flex items-center gap-4 rounded-3xl border-2 border-orange-200 bg-white px-5 py-3 text-left shadow-md hover:border-orange-400 focus:ring-4 focus:ring-orange-100">
            <Image src="/assets/arasaac.png" width={190} height={45} alt="ARASAAC" className="h-10 w-auto object-contain" />
            <span><strong className="block text-slate-800">Pictogramas que apoiam a compreensão</strong><span className="text-sm text-slate-500">{showArasaac ? "Recolher detalhes" : "Saiba como usamos ARASAAC"}</span></span><span aria-hidden className="text-xl text-orange-600">{showArasaac ? "−" : "+"}</span>
          </button>
          {showArasaac && <div id="arasaac-details" className="mt-5 rounded-[2rem] bg-white/70 text-left shadow-sm"><ArasaacSection locale={locale} /></div>}
        </section>
      </main>

      <footer className="border-t border-white/80 bg-indigo-950 px-5 py-6 text-center text-sm text-indigo-100"><strong className="text-white">Conta Comigo</strong> · Matemática que aprende com cada criança. · Pesquisa acadêmica</footer>

      {showAbout && <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/55 p-4 backdrop-blur" onMouseDown={(e) => e.target === e.currentTarget && setShowAbout(false)}><section role="dialog" aria-modal="true" aria-labelledby="about-title" className="relative grid max-h-[90vh] max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl md:grid-cols-2"><div className="relative min-h-64 bg-violet-50"><Image src="/assets/wildcard.png" alt="TitiA apresentando o Conta Comigo" fill className="object-contain object-bottom" /></div><div className="overflow-y-auto p-7"><button onClick={() => setShowAbout(false)} aria-label="Fechar" className="float-right text-2xl text-slate-500">×</button><h2 id="about-title" className="text-3xl font-black text-indigo-950">Prazer, TitiA!</h2><p className="mt-4 leading-relaxed text-slate-600">Sou a companheira de aprendizagem do Conta Comigo. Acolho, oriento, incentivo e celebro cada conquista sem apressar ninguém.</p><ul className="mt-5 space-y-3 text-sm font-semibold text-slate-700"><li>💜 Escuta com empatia</li><li>⭐ Incentiva sem pressionar</li><li>🌱 Respeita o tempo de cada criança</li><li>🧩 Celebra todas as conquistas</li></ul><button onClick={() => { setShowAbout(false); setAuth("register"); }} className="mt-7 w-full rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Começar com a TitiA</button></div></section></div>}
      <AuthDialog open={auth !== null} initialView={auth ?? "login"} onClose={closeAuth} />
    </div>
  );
}
