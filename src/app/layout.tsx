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
    "Wegovy and Mounjaro from GPhC-registered UK prescribers. Every order is screened against the pharmacy's clinical protocol, reviewed by a named clinician, and only charged once it's approved.",
  openGraph: {
    type: "website",
    siteName: "Prescriptr",
    locale: "en_GB",
    url: "/",
    title: "Prescriptr — Weight loss, prescribed properly.",
    description:
      "Wegovy and Mounjaro from GPhC-registered UK prescribers. Every order is screened against the pharmacy's clinical protocol, reviewed by a named clinician, and only charged once it's approved.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prescriptr — Weight loss, prescribed properly.",
    description:
      "Wegovy and Mounjaro from GPhC-registered UK prescribers. Screened against clinical protocol, reviewed by a named clinician, charged only on approval.",
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
