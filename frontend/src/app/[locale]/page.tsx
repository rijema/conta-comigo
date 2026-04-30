"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";
import { ArasaacSection } from "@/components/arasaac/arasaac-section";

export default function HomePage() {
  const locale = useLocale();
  const [showAbout, setShowAbout] = useState(false);

  /* Preview pictogram IDs (verified) */
  const previewPictos = [2627, 2628, 2629, 2630, 2631, 4603, 4616, 5868, 5841, 23392, 37810, 36405];
  const PICTO_CDN = "https://static.arasaac.org/pictograms";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(155deg,#fef9c3 0%,#fce7f3 45%,#dbeafe 100%)" }}>

      {/* ── Rainbow top stripe ── */}
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#818cf8,#a855f7,#ec4899,#f43f5e,#f97316,#eab308,#22c55e,#06b6d4,#3b82f6)" }} />

      {/* ── Nav ── */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl shadow-sm">🌟</div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">MathASD</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/arasaac`}
            className="text-sm font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-xl transition-colors">
            🗣️ Pictogramas
          </Link>
          <button onClick={() => setShowAbout(true)}
            className="text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-xl hover:bg-white/60 transition-colors hidden sm:block">
            ℹ️ Sobre
          </button>
          <Link href={`/${locale}/auth/login`}
            className="text-sm font-semibold text-indigo-600 border-2 border-indigo-200 bg-white/70 px-4 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors">
            Entrar
          </Link>
          <Link href={`/${locale}/auth/register`}
            className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm">
            Cadastrar
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-6 pt-10 pb-14 text-center">
        <div className="text-7xl mb-4" style={{ animation: "bounce 1.5s infinite" }}>🌟</div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 leading-tight">
          Matemática para cada criança<br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            do jeito certo!
          </span>
        </h1>
        <p className="text-base md:text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          MathASD é uma plataforma adaptativa desenvolvida para crianças com TEA — com IA personalizada, pictogramas ARASAAC e uma assistente chamada <strong>TitIA</strong> que acompanha cada passo da jornada!
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href={`/${locale}/auth/register`}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-xl">
            🚀 Começar Gratuitamente
          </Link>
          <button onClick={() => setShowAbout(true)}
            className="px-8 py-4 border-2 border-indigo-200 bg-white/70 text-indigo-700 font-bold text-lg rounded-2xl hover:bg-white transition-colors">
            Saiba Mais
          </button>
        </div>
      </section>

      {/* ── TitIA Banner ── */}
      <section className="max-w-5xl mx-auto px-6 mb-12">
        <div className="relative overflow-hidden rounded-3xl shadow-xl" style={{ background: "linear-gradient(120deg,#7c3aed,#a855f7,#ec4899,#f43f5e)" }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/10 translate-y-8 -translate-x-8" />
          <div className="relative flex flex-col sm:flex-row items-center gap-5 px-8 py-7">
            <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center text-5xl flex-shrink-0 shadow-inner">🦋</div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-2xl font-extrabold text-white mb-1">Conheça a TitIA! ✨</p>
              <p className="text-white/85 text-sm leading-relaxed max-w-xl">
                A TitIA é a assistente de IA da plataforma que <strong className="text-white">acompanha cada criança</strong> na sua jornada de aprendizado. Ela responde dúvidas, celebra conquistas e escolhe as atividades certas para cada momento. Como uma tia cuidadosa e sempre presente!
              </p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {["💬 Responde dúvidas","🎯 Personaliza atividades","🏆 Celebra conquistas","🧩 Usa pictogramas"].map(t => (
                  <span key={t} className="text-xs bg-white/20 text-white font-bold px-3 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
            <Link href={`/${locale}/auth/register`}
              className="flex-shrink-0 bg-white text-purple-700 font-extrabold px-6 py-3 rounded-2xl hover:bg-purple-50 transition-colors shadow-md text-sm whitespace-nowrap">
              Conhecer a TitIA →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-6 py-4 mb-10">
        <h2 className="text-2xl font-extrabold text-slate-800 text-center mb-6">Por que o MathASD? 🌈</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: "🧠", grad: "from-indigo-400 to-blue-400",   title: "IA Adaptativa",               desc: "A inteligência artificial analisa o perfil de cada criança e escolhe as melhores atividades em tempo real." },
            { icon: "🌳", grad: "from-green-400 to-emerald-400", title: "Ontologia LASDONT",            desc: "Baseada em pesquisa científica, mapeia forças e dificuldades para personalizar cada aprendizado." },
            { icon: "📊", grad: "from-purple-400 to-pink-400",   title: "Acompanhe o Progresso",       desc: "Dashboards completos para responsáveis e educadores acompanharem a evolução com gráficos e relatórios." },
          ].map((f) => (
            <div key={f.title} className="bg-white/80 rounded-3xl shadow-sm p-6 border border-white hover:shadow-lg transition-shadow">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.grad} flex items-center justify-center text-2xl text-white shadow-sm mb-4`}>{f.icon}</div>
              <h3 className="text-base font-extrabold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ARASAAC pictogram preview strip ── */}
      <section className="max-w-5xl mx-auto px-6 mb-12">
        <div className="bg-white/80 rounded-3xl border border-orange-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-xl text-white shadow-sm">🗣️</div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Aprendizado com Pictogramas ARASAAC</h3>
              <p className="text-xs text-slate-500">Todas as atividades usam pictogramas visuais para facilitar a compreensão</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mb-4">
            {previewPictos.map((id) => (
              <div key={id} className="w-14 h-14 rounded-2xl bg-white border-2 border-orange-100 flex items-center justify-center overflow-hidden shadow-sm hover:scale-110 transition-transform">
                <img src={`${PICTO_CDN}/${id}/${id}_500.png`} alt="" className="w-full h-full object-contain p-1" loading="lazy" />
              </div>
            ))}
          </div>
          <Link href={`/${locale}/arasaac`}
            className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-4 py-2 rounded-xl transition-colors">
            🗣️ Ver todos os pictogramas →
          </Link>
        </div>
      </section>

      {/* ARASAAC Section component */}
      <ArasaacSection locale={locale} />

      {/* ── Footer ── */}
      <footer className="text-center py-8 text-sm text-slate-400 border-t border-slate-100 mt-8">
        <p>MathASD © 2024 — Pesquisa de Mestrado</p>
        <button onClick={() => setShowAbout(true)} className="underline hover:text-slate-600 mt-1 block mx-auto">
          Sobre o projeto
        </button>
      </footer>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-4 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Sobre o MathASD</h2>
                <button onClick={() => setShowAbout(false)} className="text-white/70 hover:text-white text-2xl">✕</button>
              </div>
              <p className="text-indigo-200 text-sm mt-1">Plataforma Adaptativa de Ensino de Matemática para TEA</p>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-2">🎯 Objetivo</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  O MathASD é um sistema educacional adaptativo desenvolvido como pesquisa de mestrado, com o objetivo de apoiar o aprendizado de matemática para crianças com Transtorno do Espectro Autista (TEA) nos anos iniciais do Ensino Fundamental, alinhado à Base Nacional Comum Curricular (BNCC).
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-2">👨‍💻 Desenvolvedor</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Desenvolvido por <strong>Richard Jeremias</strong>, mestrando em Ciência da Computação. O sistema integra técnicas de Inteligência Artificial, ontologia OWL (LASDONT) e gamificação adaptativa para criar uma experiência de aprendizado personalizada e inclusiva.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-2">🏫 Orientação</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Pesquisa orientada por professores do programa de pós-graduação, com foco em tecnologia assistiva, educação inclusiva e sistemas inteligentes de tutoria.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-2">🔬 Metodologia</h3>
                <ul className="text-slate-600 text-sm space-y-1 list-disc list-inside">
                  <li>Ontologia LASDONT (OWL) para raciocínio sobre perfis de aprendizagem</li>
                  <li>Motor de regras para adaptação de dificuldade</li>
                  <li>Machine Learning para predição de maestria (BKT)</li>
                  <li>XAI (Explicabilidade) para transparência das decisões da IA</li>
                  <li>Atividades alinhadas à BNCC (EF01MA01 a EF05MA)</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-2">⚖️ Princípios Éticos</h3>
                <ul className="text-slate-600 text-sm space-y-1 list-disc list-inside">
                  <li>Conformidade com a LGPD (Lei 13.709/2018)</li>
                  <li>Dados de crianças protegidos com consentimento explícito dos responsáveis</li>
                  <li>Transparência das decisões algorítmicas (XAI)</li>
                  <li>Sem publicidade ou monetização de dados de usuários</li>
                  <li>Acessibilidade e inclusão como valores centrais</li>
                  <li>Pesquisa submetida ao CEP (Comitê de Ética em Pesquisa)</li>
                </ul>
              </section>

              <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-amber-800 mb-1">📌 Uso Acadêmico</h3>
                <p className="text-amber-700 text-xs leading-relaxed">
                  Esta plataforma é um protótipo de pesquisa acadêmica. Os dados coletados são utilizados exclusivamente para fins científicos, com anonimização e em conformidade com normas éticas de pesquisa com seres humanos.
                </p>
              </section>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setShowAbout(false)}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}