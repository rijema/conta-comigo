"use client";

import Link from "next/link";
import { ArasaacAttribution } from "./arasaac-attribution";
import { ArasaacPictogram } from "./arasaac-pictogram";

const MATH_PICTOS = [
  "mathematics.count", "mathematics.addition", "mathematics.subtraction",
  "mathematics.numbers", "library.math", "library.learn", "library.play", "activity.choose",
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
          Conta Comigo usa <span className="text-orange-500">ARASAAC</span>
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
          O Conta Comigo oferece pictogramas ARASAAC como apoio visual, sempre acompanhados por texto legível e alternativa acessível.
        </p>
      </div>

      {/* Pictogram grid */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-10">
        {MATH_PICTOS.map((conceptId, i) => (
          <div
            key={conceptId}
            className={`rounded-2xl border-2 p-2 flex flex-col items-center gap-1 ${COLORS[i % COLORS.length]}`}
          >
            <ArasaacPictogram conceptId={conceptId} className="w-full" imageClassName="w-full aspect-square" />
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
            desc: "O ARASAAC disponibiliza recursos de Comunicação Aumentativa e Alternativa. O Conta Comigo usa uma seleção pequena e registrada de pictogramas, sem copiar o catálogo inteiro.",
          },
          {
            emoji: "📚",
            title: "Na plataforma",
            bg: "bg-green-50 border-green-200",
            titleColor: "text-green-800",
            desc: "O Conta Comigo usa pictogramas em ações, conceitos e atividades quando há correspondência semântica, mantendo texto e descrição alternativa.",
          },
        ].map((c) => (
          <div key={c.title} className={`rounded-2xl border-2 p-5 ${c.bg}`}>
            <div className="text-3xl mb-2">{c.emoji}</div>
            <h3 className={`font-bold text-base mb-2 ${c.titleColor}`}>{c.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 text-center">
        <Link href={`/${locale}/arasaac`}
          className="inline-flex items-center gap-3 rounded-2xl bg-orange-100 border-2 border-orange-300 px-5 py-3 font-extrabold text-orange-800 hover:bg-orange-200">
          <ArasaacPictogram conceptId="library.learn" showLabel={false} imageClassName="w-10 h-10" />
          <span>Abrir “Aprender com a TitiA”</span>
        </Link>
      </div>

      {/* Benefits banner */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-6 text-white text-center">
        <h3 className="text-xl font-extrabold mb-3">Como oferecemos apoio visual</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { icon: "🎨", text: "Imagem com texto" },
            { icon: "🔇", text: "Alternativa à instrução falada" },
            { icon: "🔊", text: "Fala opcional" },
            { icon: "✅", text: "Fallback acessível" },
          ].map((b) => (
            <div key={b.text} className="bg-white/20 rounded-2xl p-3">
              <div className="text-2xl mb-1">{b.icon}</div>
              <p className="font-semibold">{b.text}</p>
            </div>
          ))}
        </div>
        <ArasaacAttribution className="mt-4 text-white/80" />
      </div>
    </section>
  );
}
