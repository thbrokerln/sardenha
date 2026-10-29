import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "TH Imóveis · CRM",
  description: "CRM do Grupo TH Imóveis",
  appleWebApp: { capable: true, title: "TH CRM", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0B2545",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={manrope.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
