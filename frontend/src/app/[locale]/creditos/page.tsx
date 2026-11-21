import type { Metadata } from "next";
import Link from "next/link";
import { ArasaacAttribution } from "@/components/arasaac/arasaac-attribution";

export const metadata: Metadata = {
  title: "Créditos e licenças",
  description: "Créditos e condições de uso dos recursos de terceiros utilizados pelo Conta Comigo.",
};

export default function CreditsPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <main id="conteudo" className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Navegação da página" className="mb-6">
          <Link href={`/${locale}`} className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 font-semibold text-indigo-800 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">
            Voltar ao início
          </Link>
        </nav>
        <header className="mb-7">
          <h1 className="text-3xl font-extrabold text-indigo-950 sm:text-4xl">Créditos e licenças</h1>
          <p className="mt-3 max-w-prose leading-relaxed text-slate-700">
            O Conta Comigo combina desenvolvimento próprio e recursos disponibilizados por terceiros.
            Os créditos abaixo identificam a origem dos pictogramas e as condições para sua utilização.
          </p>
        </header>
        <section aria-labelledby="arasaac-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 id="arasaac-title" className="text-2xl font-bold text-indigo-950">Pictogramas ARASAAC</h2>
          <ArasaacAttribution className="mt-4 text-base leading-relaxed text-slate-800" />
          <p className="mt-4 leading-relaxed">
            Os pictogramas são recursos de terceiros, não criações do Conta Comigo. A licença
            CC BY-NC-SA exige atribuição da origem e estabelece condições de uso não comercial
            e de compartilhamento de adaptações dos materiais licenciados.
          </p>
          <p className="mt-3 leading-relaxed">
            As imagens pictográficas selecionadas são carregadas de serviços do ARASAAC conforme
            as funcionalidades da aplicação. O carregamento remoto não altera a licença aplicável
            a esses recursos. Este crédito não implica vínculo institucional ou endosso do ARASAAC.
          </p>
          <p className="mt-5">
            <a href="https://arasaac.org/terms-of-use" target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 font-semibold text-indigo-800 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">
              Consultar os termos oficiais do ARASAAC <span aria-hidden="true" className="ml-2">↗</span>
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </p>
        </section>
        <section aria-labelledby="software-title" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <h2 id="software-title" className="text-xl font-bold text-indigo-950">Software e demais recursos</h2>
          <p className="mt-3 leading-relaxed">
            A licença dos pictogramas não é uma declaração de licença de todo o código-fonte
            do Conta Comigo. Outros componentes, bibliotecas e recursos podem ter termos próprios,
            que devem ser observados conforme seu uso.
          </p>
        </section>
        <footer className="mt-6 text-sm text-slate-600">
          <p>Para solicitações específicas de reutilização dos pictogramas, consulte os termos e canais oficiais do ARASAAC.</p>
        </footer>
      </div>
    </main>
  );
}
