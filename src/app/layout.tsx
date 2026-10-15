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

/**
 * Site-wide defaults, including how a link looks when somebody pastes it into
 * Slack. metadataBase is what makes the relative OG image resolve to an
 * absolute URL — without it the card unfurls with the text and a grey box.
 *
 * The title template leaves the home page its own full title and gives every
 * other page the brand after an en dash.
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://hfp-app.vercel.app"),
  title: {
    default: "Prescriptr — Weight loss, prescribed properly.",
    template: "%s — Prescriptr",
  },
  description:
    "Clinically-led Wegovy and Mounjaro, prescribed by real UK doctors and delivered cold-chain to your door. Protocol-checked, never rubber-stamped — and nothing to pay until you're approved.",
  openGraph: {
    type: "website",
    siteName: "Prescriptr",
    locale: "en_GB",
    url: "/",
    title: "Prescriptr — Weight loss, prescribed properly.",
    description:
      "Clinically-led Wegovy and Mounjaro, prescribed by real UK doctors and delivered cold-chain to your door. Protocol-checked, never rubber-stamped — and nothing to pay until you're approved.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prescriptr — Weight loss, prescribed properly.",
    description:
      "Wegovy and Mounjaro from real UK doctors, delivered to your door. Protocol-checked, never rubber-stamped — and nothing to pay until you're approved.",
  },
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
