import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import Providers from "@/components/auth/Providers";
import QueryProvider from "@/lib/query-provider";
import I18nProvider from "@/lib/i18n/I18nProvider";
import "./globals.css";

const materialSymbolsUrl =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Retaila",
    default: "Retaila | لوحة التحكم التنفيذية",
  },
  description: "Retaila Fintech Intelligence — منصة إدارة متعددة المتاجر للتجزئة الحديثة",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <head>
        <link href={materialSymbolsUrl} rel="stylesheet" />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} font-body-md text-body-md overflow-x-hidden`}
      >
        <QueryProvider><I18nProvider><Providers>{children}</Providers></I18nProvider></QueryProvider>
      </body>
    </html>
  );
}
