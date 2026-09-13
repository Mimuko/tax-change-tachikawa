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
  title: "自分の街はどう変わった？｜立川市の介護",
  description: "立川市の公開データから、介護を必要とする人と支出の変化をたどります。",
  openGraph: { title: "自分の街はどう変わった？", description: "立川市の介護の変化を、公開行政データから読み解く。", type: "website" },
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
