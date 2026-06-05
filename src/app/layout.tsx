import type { Metadata } from "next";
import { Abril_Fatface, Karla } from "next/font/google";
import "./globals.css";

// Retro badge display — matches the school logo's energy perfectly
const abrilFatface = Abril_Fatface({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-abril",
  display: "swap",
});

// Body — clean, warm, readable
const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
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
    <html lang="pt-BR" className={`${abrilFatface.variable} ${karla.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
