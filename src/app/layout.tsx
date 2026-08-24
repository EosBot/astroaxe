import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { getSiteUrl, serializeJsonLd } from "@/lib/site-metadata";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: "AstroAxe",
  title: { default: "AstroAxe — Observatório Ritual", template: "%s — AstroAxe" },
  description: "Astrologia calculada, leituras rastreáveis e cultura contextualizada.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "AstroAxe",
    title: "AstroAxe — Observatório Ritual",
    description: "Entenda seu céu de hoje, saiba de onde a leitura veio e escolha como caminhar.",
    url: "/",
  },
};

export const viewport: Viewport = { themeColor: "#070a10" };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AstroAxe",
    url: getSiteUrl().href,
    inLanguage: "pt-BR",
    description: "Astrologia calculada, leituras rastreáveis e cultura contextualizada.",
  };
  return (
    <html lang="pt-BR">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteSchema) }}
        />
        <a className="skip-link" href="#conteudo-principal">
          Ir para o conteúdo principal
        </a>
        <div className="site-frame">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
