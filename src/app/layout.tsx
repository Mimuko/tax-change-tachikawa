import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "自分の街はどう変わった？｜立川市の介護",
  description: "立川市の公開データから、介護を必要とする人と支出の変化をたどります。",
  openGraph: { title: "自分の街はどう変わった？", description: "立川市の介護の変化を、公開行政データから読み解く。", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
