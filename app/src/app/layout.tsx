import type { Metadata } from "next";
import { EB_Garamond, Noto_Serif_TC, Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/auth/SessionProviderWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui-en",
  display: "swap",
});

const notoSerifTC = Noto_Serif_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-ui-zh",
  display: "swap",
});

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
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
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
try {
  var _oDP = Object.defineProperty;
  Object.defineProperty = function(obj, prop, desc) {
    if (prop === 'isOffscreenCanvasSupported') {
      var d = Object.assign({}, desc);
      delete d.get; delete d.set;
      d.value = false; d.writable = true; d.configurable = true;
      return _oDP.call(Object, obj, prop, d);
    }
    return _oDP.call(Object, obj, prop, desc);
  };
} catch(e) {}
` }} />
      </head>
      <body>
        <SessionProviderWrapper>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
