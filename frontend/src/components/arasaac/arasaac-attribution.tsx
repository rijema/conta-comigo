export function ArasaacAttribution({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs ${className}`} data-arasaac-attribution>
      Autor dos pictogramas: Sergio Palao. Origem:{" "}
      <a href="https://arasaac.org" target="_blank" rel="noopener noreferrer" className="underline font-bold">
        ARASAAC <span aria-hidden="true">↗</span><span className="sr-only"> (abre em nova aba)</span>
      </a>. Licença: CC BY-NC-SA. Proprietário: Governo de Aragão (Espanha).
    </p>
  );
}
