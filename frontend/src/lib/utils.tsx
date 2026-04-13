import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string, locale = "pt-BR"): string {
  return new Date(dateString).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}min ${secs > 0 ? secs + "s" : ""}`.trim();
}

export function scoreToLabel(score: number): string {
  if (score >= 0.8) return "Excelente";
  if (score >= 0.6) return "Bom";
  if (score >= 0.4) return "Regular";
  return "Precisa de apoio";
}

export function masteryToPercent(mastery: number): string {
  return `${(mastery * 100).toFixed(0)}%`;
}