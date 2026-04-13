interface BNCCBadgeProps {
  skillCode?: string;
}

export function BNCCBadge({ skillCode }: BNCCBadgeProps) {
  if (!skillCode) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 
                 text-purple-700 text-xs font-mono rounded border border-purple-200"
      title={`Habilidade BNCC: ${skillCode}`}
    >
      📚 {skillCode}
    </span>
  );
}