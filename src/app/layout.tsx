import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "machinohenka｜自分の街はどう変わった？",
  description: "自治体の公開行政データから、街の変化をたどります。",
  openGraph: { title: "自分の街はどう変わった？", description: "街の変化を、公開行政データから読み解く。", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={notoSansJp.variable}>
      <body>
        <a className="skip-link" href="#main">本文へスキップ</a>
        {children}
      </body>
    </html>
  );
}
