import Link from "next/link";

type Props = { active?: "home" | "data" };

export default function SiteTopbar({ active }: Props) {
  return (
    <nav className="topbar" aria-label="サイト内のページ">
      <Link className="wordmark" href="/">
        TACHIKAWA / 介護の5年間
      </Link>
      <ul className="topbar-nav">
        <li>
          <Link
            href="/"
            className="topbar-nav-link"
            aria-current={active === "home" ? "page" : undefined}
          >
            物語を読む
          </Link>
        </li>
        <li>
          <Link
            href="/data/"
            className="topbar-nav-link"
            aria-current={active === "data" ? "page" : undefined}
          >
            データと出典
          </Link>
        </li>
      </ul>
    </nav>
  );
}
