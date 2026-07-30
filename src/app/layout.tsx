import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Primary UI / typography family — Geist (variable, upright + italic).
const geist = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    {
      path: "../fonts/Geist/Geist-VariableFont_wght.ttf",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../fonts/Geist/Geist-Italic-VariableFont_wght.ttf",
      weight: "100 900",
      style: "italic",
    },
  ],
});

// Monospace — Inconsolata (code, data, dosages, numeric tables).
const inconsolata = localFont({
  variable: "--font-mono",
  display: "swap",
  src: [
    {
      path: "../fonts/Inconsolata/Inconsolata-VariableFont.ttf",
      weight: "200 900",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "Prescriptr — Health Finder Pro",
  description: "AI-assisted, SOP-grounded prescribing platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${inconsolata.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
