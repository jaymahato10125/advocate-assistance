import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Advocate Contracts — AI contract review",
    template: "%s · Advocate Contracts",
  },
  description:
    "Upload PDF or TXT contracts, extract their text, and analyze them with Google Gemini — key clauses, severity-tagged risk flags, an overall risk level, and recommendations.",
  applicationName: "Advocate Contracts",
  keywords: [
    "contract analysis",
    "legal tech",
    "Gemini",
    "risk flags",
    "clause extraction",
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-svh flex-col bg-background font-sans text-foreground antialiased">
        <ClerkProvider>
          <Providers>
            <SiteHeader />
            <main className="flex flex-1 flex-col">{children}</main>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
