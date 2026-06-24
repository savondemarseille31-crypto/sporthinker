import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Deltavyn — L'outil d'aide à la décision pour vos paris sportifs",
    template: "%s · Deltavyn",
  },
  description:
    "Signaux quotidiens, value bets et calculateur de mise basés sur des modèles statistiques. Track record 100 % public et vérifiable. 18+ — jeu responsable.",
  applicationName: "Deltavyn",
  openGraph: {
    title: "Deltavyn — L'outil d'aide à la décision pour vos paris sportifs",
    description:
      "Signaux quotidiens, value bets et calculateur. Track record 100 % public et vérifiable.",
    siteName: "Deltavyn",
    locale: "fr_FR",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}<Footer /></body>
    </html>
  );
}
