import Link from "next/link";

import type { StoryContext } from "../lib/story-registry";
type Props = { active?: "home" | "data"; context: StoryContext };

export default function SiteTopbar({ active, context }: Props) {
  return (
    <nav className="topbar" aria-label="サイト内のページ">
      <Link className="wordmark" href="/">
        machinohenka / {context.municipality.municipalityLabel}・{context.topic.label}
      </Link>
      <ul className="topbar-nav">
        <li>
          <Link
            href={context.href}
            className="topbar-nav-link"
            aria-current={active === "home" ? "page" : undefined}
          >
            物語を読む
          </Link>
        </li>
        <li>
          <Link
            href={context.dataHref}
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
