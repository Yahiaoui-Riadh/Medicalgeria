import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "Medicalgeria — Marketplace Pharmaceutique Algérienne",
    template: "%s | Medicalgeria",
  },
  description:
    "Plateforme digitale de santé connectant Patients, Pharmacies et Grossistes en Algérie. Trouvez vos médicaments en temps réel, gérez votre stock, passez vos commandes B2B.",
  keywords: ["pharmacie", "médicaments", "algérie", "santé", "grossiste", "ordonnance"],
  authors: [{ name: "Medicalgeria Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#050d1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
