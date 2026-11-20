import type { Metadata } from "next";

// Page title for this route (WCAG 2.4.2); the root layout appends " · Conta Comigo".
export const metadata: Metadata = { title: "Decisões da IA (ADE)" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
