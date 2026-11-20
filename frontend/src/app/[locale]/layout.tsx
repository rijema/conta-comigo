import type { Metadata, Viewport } from "next";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { ConsentGate } from "@/components/lgpd/consent-gate";
import { TouchDragPolyfill } from "@/components/touch-drag-polyfill";
import Head from "next/head";
import { Atkinson_Hyperlegible, Lexend } from "next/font/google";

// Optional reading fonts the child can pick in the exercise settings (gear).
// Atkinson Hyperlegible (Braille Institute) maximises letter distinction;
// Lexend was designed to reduce visual stress while reading.
const atkinson = Atkinson_Hyperlegible({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-atkinson", display: "swap" });
const lexend = Lexend({ subsets: ["latin", "latin-ext"], variable: "--font-lexend", display: "swap" });

export const metadata: Metadata = {
  // Each route sets its own title (WCAG 2.4.2), e.g. "Painel do profissional · Conta Comigo".
  title: { default: "Conta Comigo", template: "%s · Conta Comigo" },
  description:
    "Plataforma adaptativa de ensino de matemática para crianças com TEA, alinhada à BNCC.",
  authors: [{ name: "Conta Comigo" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${atkinson.variable} ${lexend.variable}`}>
      <Head>
        <link rel="preload" as="image" href="/assets/correctanswer.png" />
        <link rel="preload" as="image" href="/assets/tryagain.png" />
        <link rel="preload" as="image" href="/assets/mainiconfirstpage.png" />
        <link rel="preload" as="image" href="/assets/wildcard.png" />
        <link rel="preload" as="image" href="/assets/answeryeymotion.png" />
        <link rel="preload" as="image" href="/assets/severalreactionstitia.png" />
        <link rel="preload" as="image" href="/assets/senseofmotion.png" />
        <link rel="preload" as="image" href="/assets/rainbowGiff.gif" />
      </Head>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TouchDragPolyfill />
          <AccessibilityProvider>
            {children}
            <ConsentGate />
          </AccessibilityProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
