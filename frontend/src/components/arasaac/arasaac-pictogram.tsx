"use client";

import { useEffect, useState } from "react";
import { pictogramRegistry, type PictogramConcept } from "@/lib/pictograms";
import { arasaacCatalog } from "@/lib/arasaac-catalog";

interface ArasaacPictogramProps {
  conceptId: PictogramConcept | string;
  alt?: string;
  showLabel?: boolean;
  className?: string;
  imageClassName?: string;
}

export function ArasaacPictogram({
  conceptId,
  alt,
  showLabel = true,
  className = "",
  imageClassName = "w-16 h-16",
}: ArasaacPictogramProps) {
  const entry = pictogramRegistry.get(conceptId);
  const [searchedConceptId, setSearchedConceptId] = useState<string | null>(null);
  const imageUrl = pictogramRegistry.getImageUrl(searchedConceptId ?? conceptId);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setSearchedConceptId(null);
    if (!entry || entry.arasaacId !== null) return;
    let active = true;
    arasaacCatalog.resolveMissing(conceptId).then((resolved) => {
      if (active && resolved) setSearchedConceptId(resolved);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [conceptId, entry]);

  useEffect(() => setImageFailed(false), [conceptId, imageUrl]);

  const label = entry?.labelPt ?? "pictograma indisponível";
  const accessibleAlt = alt ?? entry?.altPt ?? "Pictograma indisponível";

  return (
    <span className={`inline-flex flex-col items-center justify-center gap-1 ${className}`}>
      {imageUrl && !imageFailed ? (
        // ARASAAC images are remote public assets; the URL is resolved only by the registry.
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/no-noninteractive-element-interactions
        <img
          src={imageUrl}
          alt={accessibleAlt}
          className={`${imageClassName} object-contain`}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span
          role="img"
          aria-label={accessibleAlt}
          className={`${imageClassName} inline-flex items-center justify-center text-4xl`}
          data-pictogram-fallback="true"
        >
          {entry?.symbol ?? "□"}
        </span>
      )}
      {showLabel && <span className="text-center font-bold leading-tight">{label}</span>}
    </span>
  );
}
