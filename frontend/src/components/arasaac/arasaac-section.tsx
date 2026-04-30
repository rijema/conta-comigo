"use client";

import Link from "next/link";

/* ── ARASAAC pictograms via public CDN ────────────────────────────
   Base URL: https://static.arasaac.org/pictograms/{id}/{id}_500.png
   IDs below are real ARASAAC pictogram IDs for math/school concepts ── */
const PICTO_CDN = "https://static.arasaac.org/pictograms";

const MATH_PICTOS = [
  { id: 2822,  label: "Contar" },
  { id: 6200,  label: "Somar" },
  { id: 6201,  label: "Subtrair" },
  { id: 6198,  label: "Número" },
  { id: 6199,  label: "Matemática" },
  { id: 4686,  label: "Escola" },
  { id: 9812,  label: "Aprender" },
  { id: 38228, label: "Jogar" },
];

const COLORS = [
  "bg-yellow-100 border-yellow-300",
  "bg-blue-100 border-blue-300",
  "bg-green-100 border-green-300",
  "bg-pink-100 border-pink-300",
  "bg-purple-100 border-purple-300",
  "bg-orange-100 border-orange-300",
  "bg-teal-100 border-teal-300",
  "bg-red-100 border-red-300",
];

interface Props {
  locale: string;
}

export function ArasaacSection({ locale }: Props) {
  return (
    <section className="max-w-5xl mx-auto px-6 py-14">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
          🗣️ Comunicação Aumentativa e Alternativa (CAA)
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 mb-3">
          MathASD usa <span className="text-orange-500">ARASAAC</span>
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
          O método ARASAAC (Sistema de Comunicação por Pictogramas) é adotado mundialmente para suporte à comunicação de crianças com autismo, dificuldades de linguagem e outras necessidades de comunicação. Os pictogramas transformam conceitos abstratos em imagens claras, reduzindo a sobrecarga sensorial e facilitando a compreensão.
        </p>
      </div>

      {/* Pictogram grid */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-10">
        {MATH_PICTOS.map((p, i) => (
          <div
            key={p.id}
            className={`rounded-2xl border-2 p-2 flex flex-col items-center gap-1 ${COLORS[i % COLORS.length]}`}
          >
            <div className="w-full aspect-square rounded-xl bg-white flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${PICTO_CDN}/${p.id}/${p.id}_500.png`}
                alt={p.label}
                className="w-full h-full object-contain p-1"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <span className="text-xs font-bold text-slate-600 text-center leading-tight">{p.label}</span>
          </div>
        ))}
      </div>

      {/* Info cards */}
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        {[
          {
            emoji: "🧩",
            title: "O que é CAA?",
            bg: "bg-blue-50 border-blue-200",
            titleColor: "text-blue-800",
            desc: "Comunicação Aumentativa e Alternativa (CAA) engloba recursos que complementam ou substituem a fala quando esta não é suficiente para garantir uma comunicação eficaz. Inclui pictogramas, pranchas de comunicação, aplicativos e gestos.",
          },
          {
            emoji: "🌍",
            title: "ARASAAC",
            bg: "bg-orange-50 border-orange-200",
            titleColor: "text-orange-800",
            desc: "O ARASAAC (Centro Aragonês para a Comunicação Aumentativa e Alternativa) disponibiliza mais de 25.000 pictogramas gratuitos em múltiplos idiomas. É amplamente utilizado por terapeutas, educadores e famílias em mais de 100 países.",
          },
          {
            emoji: "📚",
            title: "Na plataforma",
            bg: "bg-green-50 border-green-200",
            titleColor: "text-green-800",
            desc: "O MathASD utiliza pictogramas ARASAAC para ilustrar enunciados, opções de resposta e instruções de atividades. Isso reduz a dependência de leitura e torna as atividades mais acessíveis para crianças não-verbais ou com dificuldades de leitura.",
          },
        ].map((c) => (
          <div key={c.title} className={`rounded-2xl border-2 p-5 ${c.bg}`}>
            <div className="text-3xl mb-2">{c.emoji}</div>
            <h3 className={`font-bold text-base mb-2 ${c.titleColor}`}>{c.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Benefits banner */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-6 text-white text-center">
        <h3 className="text-xl font-extrabold mb-3">Por que pictogramas fazem diferença para crianças com TEA?</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { icon: "🎨", text: "Processamento visual mais natural" },
            { icon: "🔇", text: "Menor sobrecarga auditiva" },
            { icon: "⚡", text: "Respostas mais rápidas" },
            { icon: "😊", text: "Menos ansiedade e frustração" },
          ].map((b) => (
            <div key={b.text} className="bg-white/20 rounded-2xl p-3">
              <div className="text-2xl mb-1">{b.icon}</div>
              <p className="font-semibold">{b.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-white/80 text-xs">
          Pictogramas fornecidos gratuitamente pelo{" "}
          <a
            href="https://arasaac.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white font-semibold"
          >
            Portal ARASAAC
          </a>{" "}
          sob licença Creative Commons BY-NC-SA · © Governo de Aragão (Espanha)
        </p>
      </div>
    </section>
  );
}
