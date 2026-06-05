import type { Metadata } from "next";
import { Bebas_Neue, Nunito, Inter } from "next/font/google";
import "./globals.css";

// Display / títulos — estilo escola de surf, esportivo
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

// Headings de seção — arredondado e jovial
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

// Corpo — máxima legibilidade
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ivan Silva Surf School",
  description: "Agende sua aula de surf em Maracaipe e Praia do Borete.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${bebasNeue.variable} ${nunito.variable} ${inter.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
