import type { Metadata, Viewport } from "next";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import Head from "next/head";

export const metadata: Metadata = {
  title: "Conta Comigo - Matemática que aprende com cada criança",
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
    <html lang={locale}>
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
          <AccessibilityProvider>{children}</AccessibilityProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
