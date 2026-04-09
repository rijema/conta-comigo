import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MathASD — Plataforma Adaptativa de Matemática",
  description:
    "Plataforma adaptativa de ensino de matemática para crianças com TEA, alinhada à BNCC.",
  authors: [{ name: "MathASD Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --font-size-base: 16px;
}

/* Low stimulation mode support */
[data-stimulation="low"] {
  --color-primary: #4b5563;
  filter: saturate(0.6);
}

/* High contrast mode */
[data-contrast="high"] {
  --color-primary: #1e1b4b;
  background: #ffffff;
  color: #000000;
}

/* Focus ring for accessibility */
*:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Base accessible font sizing */
html {
  font-size: var(--font-size-base);
}

/* Smooth scroll */
html {
  scroll-behavior: smooth;
}