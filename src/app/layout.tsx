import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import FloralDecor from "@/components/FloralDecor";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Fille ou Garçon ? — Révélation Bébé",
  description:
    "Votez Team Fille ou Team Garçon et suivez la tendance en temps réel avant la grande révélation !",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf6f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <div className="bg-mesh" aria-hidden="true" />
        <FloralDecor />
        <main className="relative z-[1] mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-6 sm:px-6 sm:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
