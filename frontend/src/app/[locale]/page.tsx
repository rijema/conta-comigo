"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";

export default function HomePage() {
  const locale = useLocale();
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🌍</span>
          <span className="text-xl font-extrabold text-indigo-700">MathASD</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAbout(true)}
            className="text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            ℹ️ Sobre
          </button>
          <Link
            href={`/${locale}/auth/login`}
            className="text-sm font-semibold text-indigo-600 border-2 border-indigo-200 px-4 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            Entrar
          </Link>
          <Link
            href={`/${locale}/auth/register`}
            className="text-sm font-bold bg-indigo-600 text-white px-4 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Cadastrar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="text-7xl mb-6 animate-bounce">🌟</div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 leading-tight">
          Aprendendo Matemática<br />
          <span className="text-indigo-600">do jeito certo para cada criança</span>
        </h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
          MathASD é uma plataforma adaptativa de ensino de matemática desenvolvida especialmente para crianças com Transtorno do Espectro Autista (TEA), usando Inteligência Artificial e ontologia LASDONT para personalizar cada atividade.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href={`/${locale}/auth/register`}
            className="px-8 py-4 bg-indigo-600 text-white font-bold text-lg rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            🚀 Começar Gratuitamente
          </Link>
          <button
            onClick={() => setShowAbout(true)}
            className="px-8 py-4 border-2 border-indigo-200 text-indigo-700 font-bold text-lg rounded-2xl hover:bg-indigo-50 transition-colors"
          >
            Saiba Mais
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "🧠", title: "IA Adaptativa", desc: "A inteligência artificial analisa o perfil da criança e escolhe as melhores atividades em tempo real." },
            { icon: "🌳", title: "Ontologia LASDONT", desc: "Baseada em pesquisa científica, a ontologia mapeia forças e dificuldades para um aprendizado personalizado." },
            { icon: "📊", title: "Para Responsáveis e Profissionais", desc: "Dashboards completos para acompanhar o progresso, configurar perfis e gerar relatórios detalhados." },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
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