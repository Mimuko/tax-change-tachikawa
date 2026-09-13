import Link from "next/link";

type Props = { active?: "home" | "data" };

export default function SiteTopbar({ active }: Props) {
  return (
    <nav className="topbar" aria-label="サイト">
      <Link className="wordmark" href="/">TACHIKAWA / 介護の5年間</Link>
      <div>
        {active === "home" && <span>DATA STORY</span>}
        <Link href="/data/" aria-current={active === "data" ? "page" : undefined}>データと出典</Link>
      </div>
    </nav>
  );
}
