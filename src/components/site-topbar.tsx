import Link from "next/link";

import { formatStoryTitle, getSiblingStories } from "../lib/site-hub";
import type { StoryContext } from "../lib/story-registry";

type HubTopbarProps = {
  variant: "hub";
  active?: "home" | "data";
};

type StoryTopbarProps = {
  variant: "story";
  active?: "home" | "data";
  context: StoryContext;
};

type Props = HubTopbarProps | StoryTopbarProps;

export default function SiteTopbar(props: Props) {
  if (props.variant === "hub") {
    return (
      <nav className="topbar" aria-label="サイト内のページ">
        <Link className="wordmark" href="/">
          machinohenka
        </Link>
        <ul className="topbar-nav">
          <li>
            <Link
              href="/"
              className="topbar-nav-link"
              aria-current={props.active === "home" ? "page" : undefined}
            >
              TOP
            </Link>
          </li>
          <li>
            <Link
              href="/data/"
              className="topbar-nav-link"
              aria-current={props.active === "data" ? "page" : undefined}
            >
              データ方針
            </Link>
          </li>
        </ul>
      </nav>
    );
  }

  const { context, active } = props;
  const siblings = getSiblingStories(context);

  return (
    <nav className="topbar" aria-label="サイト内のページ">
      <div className="topbar-brand">
        <Link className="wordmark" href="/">
          machinohenka
        </Link>
        <span className="topbar-context">
          {context.municipality.municipalityLabel}・{context.topic.label}
        </span>
      </div>
      <ul className="topbar-nav">
        <li>
          <Link href="/" className="topbar-nav-link">
            TOP
          </Link>
        </li>
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
        {siblings.map((story) => (
          <li key={story.story.id} className="topbar-nav-sibling">
            <Link href={story.href} className="topbar-nav-link">
              {formatStoryTitle(story)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
