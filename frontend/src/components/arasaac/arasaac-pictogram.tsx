"use client";

import { useEffect, useState } from "react";
import { pictogramRegistry, type PictogramConcept } from "@/lib/pictograms";

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
  const imageUrl = pictogramRegistry.getImageUrl(conceptId);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [conceptId, imageUrl]);

  const label = entry?.labelPt ?? "pictograma indisponível";
  const accessibleAlt = alt ?? entry?.altPt ?? "Pictograma indisponível";

  return (
    <span className={`inline-flex flex-col items-center justify-center gap-1 ${className}`}>
      {imageUrl && !imageFailed ? (
        // ARASAAC images are remote public assets; the URL is resolved only by the registry.
        // eslint-disable-next-line @next/next/no-img-element
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
