"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

const PICTO_CDN = "https://static.arasaac.org/pictograms";

/* ── All IDs verified via api.arasaac.org/v1/pictograms/pt/search ── */
const CATEGORIES = [
  {
    name: "Números",
    emoji: "🔢",
    grad: "from-blue-500 to-cyan-400",
    pictos: [
      { id: 2627,  label: "Um",     desc: "Um é o número 1 — um objeto só!" },
      { id: 2628,  label: "Dois",   desc: "Dois é o número 2 — dois objetos juntos." },
      { id: 2629,  label: "Três",   desc: "Três é o número 3." },
      { id: 2630,  label: "Quatro", desc: "Quatro é o número 4." },
      { id: 2631,  label: "Cinco",  desc: "Cinco é o número 5 — os dedos de uma mão!" },
      { id: 2632,  label: "Seis",   desc: "Seis é o número 6." },
      { id: 2633,  label: "Sete",   desc: "Sete é o número 7." },
      { id: 2634,  label: "Oito",   desc: "Oito é o número 8." },
      { id: 29254, label: "Dez",    desc: "Dez é o número 10 — todos os dedos das mãos!" },
    ],
  },
  {
    name: "Operações Matemáticas",
    emoji: "➕",
    grad: "from-green-500 to-emerald-400",
    pictos: [
      { id: 5868,  label: "Somar",      desc: "Somar é juntar quantidades para achar o total." },
      { id: 5841,  label: "Subtrair",   desc: "Subtrair é tirar uma quantidade de outra." },
      { id: 5798,  label: "Multiplicar",desc: "Multiplicar é somar o mesmo número várias vezes." },
      { id: 5707,  label: "Dividir",    desc: "Dividir é separar em partes iguais." },
      { id: 2714,  label: "Contar",     desc: "Contar é descobrir quantos objetos existem." },
      { id: 8518,  label: "Calcular",   desc: "Calcular é fazer uma operação matemática." },
      { id: 32554, label: "Matemática", desc: "Matemática é a ciência dos números e formas." },
      { id: 3220,  label: "Mais (+)",   desc: "O sinal + significa somar, juntar." },
      { id: 3200,  label: "Menos (−)",  desc: "O sinal − significa subtrair, tirar." },
      { id: 3423,  label: "Igual (=)",  desc: "O sinal = mostra que dois lados têm o mesmo valor." },
      { id: 24731, label: "Quantos?",   desc: "Perguntamos 'quantos?' para saber a quantidade." },
      { id: 32802, label: "Resultado",  desc: "Resultado é a resposta de uma operação matemática." },
    ],
  },
  {
    name: "Formas Geométricas",
    emoji: "🔷",
    grad: "from-purple-500 to-pink-400",
    pictos: [
      { id: 4603,  label: "Círculo",    desc: "O círculo é redondo, como uma bola ou o sol!" },
      { id: 4616,  label: "Quadrado",   desc: "O quadrado tem 4 lados iguais." },
      { id: 4731,  label: "Retângulo", desc: "O retângulo tem 4 lados, dois a dois iguais." },
      { id: 4734,  label: "Losango",    desc: "O losango tem 4 lados iguais, mas é inclinado." },
      { id: 4644,  label: "Estrela",    desc: "A estrela tem pontas e brilha no céu!" },
      { id: 9109,  label: "Sólidos",    desc: "Sólidos geométricos têm comprimento, largura e altura." },
      { id: 8308,  label: "Cubo",       desc: "O cubo tem 6 faces quadradas iguais." },
      { id: 9111,  label: "Cilindro",   desc: "O cilindro é como uma lata ou um rolo." },
      { id: 9112,  label: "Cone",       desc: "O cone tem base circular e termina numa ponta." },
    ],
  },
  {
    name: "Cores",
    emoji: "🎨",
    grad: "from-pink-500 to-rose-400",
    pictos: [
      { id: 2808,  label: "Vermelho", desc: "Vermelho é a cor do fogo e das maçãs maduras!" },
      { id: 4869,  label: "Azul",     desc: "Azul é a cor do céu e do mar." },
      { id: 4628,  label: "Diferente",desc: "Diferente significa que as coisas não são iguais." },
      { id: 4667,  label: "Igual",    desc: "Igual significa que as coisas são as mesmas." },
      { id: 26176, label: "Cheio",    desc: "Cheio significa que não cabe mais nada." },
      { id: 26527, label: "Vazio",    desc: "Vazio significa que não tem nada dentro." },
      { id: 26162, label: "Comprido", desc: "Comprido é o que tem muito comprimento." },
      { id: 26002, label: "Curto",    desc: "Curto é o que tem pouco comprimento." },
      { id: 25782, label: "Alto",     desc: "Alto é o que fica muito longe do chão." },
    ],
  },
  {
    name: "Verbos de Aprender",
    emoji: "📚",
    grad: "from-orange-500 to-amber-400",
    pictos: [
      { id: 37810, label: "Aprender",  desc: "Aprender é adquirir conhecimento novo!" },
      { id: 8029,  label: "Estudar",   desc: "Estudar é dedicar tempo a aprender algo." },
      { id: 26636, label: "Compreender",desc: "Compreender é entender o que foi aprendido." },
      { id: 32129, label: "Primeiro",  desc: "Primeiro é o que vem antes de todos." },
      { id: 27319, label: "Anterior",  desc: "Anterior é o que veio antes." },
      { id: 27331, label: "Seguinte",  desc: "Seguinte é o que vem depois." },
      { id: 32069, label: "Último",    desc: "Último é o que vem depois de todos." },
      { id: 32747, label: "Agora",     desc: "Agora significa neste momento." },
      { id: 32749, label: "Depois",    desc: "Depois significa mais tarde." },
    ],
  },
  {
    name: "Jogos e Atividades",
    emoji: "🎮",
    grad: "from-teal-500 to-sky-400",
    pictos: [
      { id: 23392, label: "Jogar",          desc: "Jogar é aprender se divertindo!" },
      { id: 9810,  label: "Jogo de Mesa",   desc: "Jogos de mesa como damas, xadrez e dominó." },
      { id: 36405, label: "Jogos Didáticos",desc: "Jogos que ensinam enquanto divertem." },
      { id: 3421,  label: "Jogo da Glória", desc: "Jogo de tabuleiro clássico com dados." },
      { id: 7284,  label: "Três em Linha",  desc: "Jogo do galo — três símbolos em linha ganha!" },
      { id: 2731,  label: "Dado",           desc: "O dado tem 6 faces com pontos de 1 a 6." },
      { id: 3095,  label: "Dominó",         desc: "Dominó tem peças com pontos para combinar." },
      { id: 3054,  label: "Xadrez",         desc: "Xadrez é um jogo de estratégia com peças." },
      { id: 29151, label: "Jogar no Tablet",desc: "Jogar no tablet é divertido e educativo!" },
    ],
  },
];

type Picto = { id: number; label: string; desc: string };

export default function ArasaacPage() {
  const router = useRouter();
  const locale = useLocale();
  const [selected, setSelected] = useState<Picto | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "pt-BR"; utt.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    }
  };

  const handlePicto = (p: Picto) => { setSelected(p); speak(p.label); };

  const cat = CATEGORIES[activeTab];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(155deg,#fef9c3 0%,#fce7f3 40%,#dbeafe 100%)" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/${locale}`)}
              className="w-10 h-10 bg-white rounded-2xl border-2 border-slate-200 flex items-center justify-center text-lg hover:bg-slate-50 transition-colors">
              ←
            </button>
            <div>
              <h1 className="text-base font-extrabold text-slate-800">🗣️ Aprender com Pictogramas</h1>
              <p className="text-xs text-slate-500">Toque em qualquer figura para ouvir o nome!</p>
            </div>
          </div>
          <a href="https://arasaac.org" target="_blank" rel="noopener noreferrer"
            className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-xl font-bold hover:bg-orange-200 transition-colors hidden sm:block">
            Portal ARASAAC ↗
          </a>
        </div>

        {/* Category tabs */}
        <div className="max-w-5xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((c, i) => (
            <button key={i} onClick={() => { setActiveTab(i); setSelected(null); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-extrabold transition-all ${
                activeTab === i
                  ? `bg-gradient-to-r ${c.grad} text-white shadow-md scale-105`
                  : "bg-white/70 text-slate-600 hover:bg-white border border-slate-200"
              }`}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 pb-16 space-y-4">

        {/* Selected picto detail panel */}
        {selected && (
          <div className="bg-white/90 border-2 border-purple-200 rounded-3xl p-4 flex items-center gap-4 shadow-md">
            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-purple-100 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
              <img src={`${PICTO_CDN}/${selected.id}/${selected.id}_500.png`} alt={selected.label}
                className="w-full h-full object-contain p-1.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-extrabold text-purple-800">{selected.label}</p>
              <p className="text-sm text-slate-600 mt-0.5 leading-snug">{selected.desc}</p>
            </div>
            <button onClick={() => speak(selected.label)}
              className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl text-2xl flex items-center justify-center shadow-md hover:opacity-90 flex-shrink-0">
              🔊
            </button>
          </div>
        )}

        {/* Category title */}
        <div className="flex items-center gap-3">
          <div className={`bg-gradient-to-r ${cat.grad} w-12 h-12 rounded-2xl flex items-center justify-center text-2xl text-white shadow-md`}>
            {cat.emoji}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">{cat.name}</h2>
            <p className="text-xs text-slate-500">{cat.pictos.length} pictogramas · toque para ouvir</p>
          </div>
        </div>

        {/* Pictogram grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {cat.pictos.map((p) => (
            <button key={p.id} onClick={() => handlePicto(p)}
              className={`rounded-2xl border-2 p-2 flex flex-col items-center gap-1.5 transition-all active:scale-95 hover:shadow-lg bg-white/80 ${
                selected?.id === p.id
                  ? "border-purple-400 ring-4 ring-purple-200 scale-105 bg-purple-50"
                  : "border-white hover:border-purple-200"
              }`}
              aria-label={`Pictograma: ${p.label}`}>
              <div className="w-full aspect-square rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm border border-slate-100">
                <img src={`${PICTO_CDN}/${p.id}/${p.id}_500.png`} alt={p.label}
                  className="w-full h-full object-contain p-1" loading="lazy" />
              </div>
              <span className="text-xs font-extrabold text-slate-700 text-center leading-tight">{p.label}</span>
            </button>
          ))}
        </div>

        {/* Credits */}
        <div className="bg-white/70 border border-orange-100 rounded-2xl p-3 text-center">
          <p className="text-xs text-orange-700">
            Pictogramas © <strong>Sergio Palao</strong> para{" "}
            <a href="https://arasaac.org" target="_blank" rel="noopener noreferrer" className="underline font-bold">ARASAAC</a>
            {" "}— Licença Creative Commons BY-NC-SA · Governo de Aragão, Espanha.
          </p>
        </div>
      </main>
    </div>
  );
}
