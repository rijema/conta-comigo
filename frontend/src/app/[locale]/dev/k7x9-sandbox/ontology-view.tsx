"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Files copied by ontology/release/publish-site.sh.
const BASE = "/dev/k7x9-ontology";

type Summary = {
  title: string;
  version: string;
  versionIRI: string;
  date: string;
  sha256: string;
  license: string;
  tools: Record<string, string>;
  metrics: {
    axioms: number; logicalAxioms: number; classes: number; objectProperties: number;
    dataProperties: number; individuals: number; owl2dl: boolean;
  };
  consistent: Record<string, boolean>;
  unsatisfiable: Record<string, number>;
  classification: Record<string, number>;
  prerequisites: { from: string; to: string; direct: boolean }[];
  mutations: { code: string; error: string; detected: boolean }[];
  integrity: { code: string; check: string; rows: number }[];
  competencyQuestions: { code: string; question: string; sparql: string; columns: string[]; rows: string[][] }[];
};

const YEARS = ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano"];
const UNITS = ["Números", "Álgebra", "Geometria", "Grandezas e medidas", "Probabilidade e estatística"];

export function OntologyView({ locale }: { locale: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/summary.json`)
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then(setSummary)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    document.title = "Ontologia ContaComigo";
  }, []);

  if (error) {
    return <p role="alert" className="p-8 text-slate-800">Não foi possível carregar os dados da ontologia.</p>;
  }
  if (!summary) {
    return <p role="status" className="p-8 text-slate-700">Carregando…</p>;
  }

  const date = new Date(`${summary.date}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  const downloads = [
    { href: `${BASE}/contacomigo.owl`, label: "Ontologia (RDF/XML)", file: "contacomigo.owl" },
    { href: `${BASE}/contacomigo.ttl`, label: "Ontologia (Turtle)", file: "contacomigo.ttl" },
    { href: `${BASE}/verificacao-v${summary.version}.pdf`, label: "Relatório de verificação (PDF)", file: `verificacao-v${summary.version}.pdf` },
    { href: `${BASE}/contacomigo-ontology-v${summary.version}.zip`, label: "Pacote completo (ZIP)", file: `contacomigo-ontology-v${summary.version}.zip` },
  ];
  const detected = summary.mutations.filter((m) => m.detected).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-purple-700 px-3 py-1 text-xs font-extrabold tracking-widest text-white">SANDBOX</span>
          <Link href={`/${locale}/dev/k7x9-sandbox`} className="rounded-xl bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-800 hover:bg-slate-200 focus-visible:ring-4 focus-visible:ring-purple-500">
            ← Exercícios
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-4 py-8">
        <section>
          <h1 className="text-3xl font-black">Ontologia ContaComigo</h1>
          <p className="mt-1 text-slate-700">
            Versão {summary.version}, {date} · Licença {summary.license}
          </p>
          <p className="mt-4 max-w-3xl leading-relaxed text-slate-800">
            Ontologia de domínio OWL 2 DL para o ensino de matemática do 1º ao 5º ano a crianças com Transtorno do
            Espectro Autista. Representa as 126 habilidades de Matemática da BNCC dessa etapa, os conceitos matemáticos
            que elas mobilizam, relações de pré-requisito fundamentadas no texto da BNCC e as características das
            atividades do sistema. Não contém dados de estudantes.
          </p>
        </section>

        <section aria-labelledby="downloads">
          <h2 id="downloads" className="text-xl font-bold">Arquivos</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {downloads.map((item) => (
              <li key={item.href}>
                <a href={item.href} download={item.file}
                  className="flex h-full flex-col rounded-2xl border-2 border-slate-300 bg-white p-4 hover:border-purple-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500">
                  <span className="font-bold text-purple-800">{item.label}</span>
                  <span className="mt-1 font-mono text-xs text-slate-700">{item.file}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 break-all font-mono text-xs text-slate-700">SHA-256 do OWL: {summary.sha256}</p>
        </section>

        <section aria-labelledby="verificacao">
          <h2 id="verificacao" className="text-xl font-bold">Verificação</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Axiomas", summary.metrics.axioms],
              ["Classes", summary.metrics.classes],
              ["Indivíduos", summary.metrics.individuals],
              ["Propriedades", summary.metrics.objectProperties + summary.metrics.dataProperties],
              ["Perfil OWL 2 DL", summary.metrics.owl2dl ? "atendido" : "não atendido"],
              ["HermiT", summary.consistent.HermiT ? "consistente" : "inconsistente"],
              ["JFact", summary.consistent.JFact ? "consistente" : "inconsistente"],
              ["Testes de mutação", `${detected} de ${summary.mutations.length}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
                <dt className="text-sm text-slate-700">{label}</dt>
                <dd className="text-lg font-bold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-slate-700">
            {Object.entries(summary.tools).map(([tool, version]) => `${tool} ${version}`).join(" · ")}
          </p>
        </section>

        <section aria-labelledby="classificacao">
          <h2 id="classificacao" className="text-xl font-bold">Habilidades classificadas pelo raciocinador</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {[["Por ano", YEARS], ["Por unidade temática", UNITS]].map(([caption, keys]) => (
              <table key={caption as string} className="w-full rounded-2xl bg-white text-sm shadow-sm">
                <caption className="pb-2 text-left font-semibold">{caption as string}</caption>
                <tbody>
                  {(keys as string[]).map((key) => (
                    <tr key={key} className="border-t border-slate-100">
                      <th scope="row" className="px-4 py-2 text-left font-normal">{key}</th>
                      <td className="px-4 py-2 text-right font-bold">{summary.classification[key] ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        </section>

        <section aria-labelledby="prerequisitos">
          <h2 id="prerequisitos" className="text-xl font-bold">Pré-requisitos entre conceitos</h2>
          <p className="mt-1 text-sm text-slate-700">
            {summary.prerequisites.filter((p) => p.direct).length} relações diretas e{" "}
            {summary.prerequisites.filter((p) => !p.direct).length} inferidas por transitividade.
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500" tabIndex={0} role="region" aria-labelledby="prerequisitos">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th scope="col" className="px-4 py-2">Conceito anterior</th>
                  <th scope="col" className="px-4 py-2">Conceito dependente</th>
                  <th scope="col" className="px-4 py-2">Relação</th>
                </tr>
              </thead>
              <tbody>
                {summary.prerequisites.map((p) => (
                  <tr key={`${p.from}-${p.to}`} className="border-t border-slate-100">
                    <td className="px-4 py-2">{p.from}</td>
                    <td className="px-4 py-2">{p.to}</td>
                    <td className="px-4 py-2">{p.direct ? "direta" : "indireta"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="questoes">
          <h2 id="questoes" className="text-xl font-bold">Questões de competência</h2>
          <div className="mt-3 space-y-3">
            {summary.competencyQuestions.map((cq) => (
              <details key={cq.code} className="rounded-2xl bg-white p-4 shadow-sm">
                <summary className="cursor-pointer font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500">
                  {cq.code}. {cq.question}{" "}
                  <span className="font-normal text-slate-700">({cq.rows.length} {cq.rows.length === 1 ? "linha" : "linhas"})</span>
                </summary>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500" tabIndex={0} aria-label={`Consulta SPARQL da ${cq.code}`}>{cq.sparql}</pre>
                <div className="mt-3 overflow-x-auto focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500" tabIndex={0} role="region" aria-label={`Resposta à ${cq.code}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        {cq.columns.map((column) => <th key={column} scope="col" className="px-3 py-2">{column}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {cq.rows.map((row, index) => (
                        <tr key={index} className="border-t border-slate-100 align-top">
                          {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2">{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="integridade">
          <h2 id="integridade" className="text-xl font-bold">Testes</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <table className="w-full rounded-2xl bg-white text-sm shadow-sm">
              <caption className="pb-2 text-left font-semibold">Testes de mutação</caption>
              <tbody>
                {summary.mutations.map((m) => (
                  <tr key={m.code} className="border-t border-slate-100">
                    <th scope="row" className="px-4 py-2 text-left font-normal">{m.error}</th>
                    <td className="px-4 py-2 text-right font-semibold">{m.detected ? "detectado" : "não detectado"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-full rounded-2xl bg-white text-sm shadow-sm">
              <caption className="pb-2 text-left font-semibold">Consultas de integridade</caption>
              <tbody>
                {summary.integrity.map((check) => (
                  <tr key={check.code} className="border-t border-slate-100">
                    <th scope="row" className="px-4 py-2 text-left font-normal">{check.check}</th>
                    <td className="px-4 py-2 text-right font-semibold">{check.rows === 0 ? "aprovada" : `${check.rows} linhas`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
