import type { Metadata } from "next";
import { EB_Garamond, Noto_Serif_TC, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-content-en",
  display: "swap",
});

// Noto CJK fonts: only latin subset is needed here;
// the actual CJK glyphs are served by Google Fonts via unicode-range
const notoSerifTC = Noto_Serif_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-content-zh",
  display: "swap",
});

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Scholarly — Academic PDF Reader",
  description: "Read, highlight, and annotate academic papers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${ebGaramond.variable} ${notoSerifTC.variable} ${notoSansTC.variable}`}>
      <body style={{ fontFamily: "var(--font-ui, 'Noto Sans TC', system-ui, sans-serif)" }}>
        {children}
      </body>
    </html>
  );
}
