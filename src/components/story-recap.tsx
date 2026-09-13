import GeographyChip from "./geography-chip";

type RecapGroup = {
  variant: "tachikawa" | "tokyo-ref" | "tachikawa-policy";
  title: string;
  items: string[];
};

export default function StoryRecap({ groups, shareUrl }: { groups: RecapGroup[]; shareUrl: string }) {
  return (
    <section className="story-recap" id="recap">
      <div className="story-recap-inner">
        <p className="eyebrow">Act 5 — 振り返り</p>
        <h2>
          あなたは、<br />
          <em>何が気になりましたか？</em>
        </h2>
        <p>本編で見た内容を、地域のまとまりごとに振り返ります。</p>
        <div className="story-recap-grid">
          {groups.map((group) => (
            <article key={group.variant} className="story-recap-group">
              <GeographyChip variant={group.variant} />
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <a
          className="button-primary"
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="気づきを共有する（外部サイト、X）"
        >
          気づきを共有する ↗
        </a>
      </div>
    </section>
  );
}
