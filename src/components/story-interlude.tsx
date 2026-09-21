import type { ReactNode } from "react";

type StoryInterludeProps = {
  variant: "pause" | "gap";
  eyebrow?: string;
  title: ReactNode;
  children: ReactNode;
};

type DataGapInterludeProps = {
  placeLabel: string;
  subject: string;
  reason: string;
  followUp?: string;
  children?: ReactNode;
};

export default function StoryInterlude({ variant, eyebrow, title, children }: StoryInterludeProps) {
  const className = variant === "pause" ? "pause-section story-interlude" : "gap-interlude story-interlude";

  return (
    <section className={className}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {children}
      {variant === "pause" ? <span aria-hidden="true">↓</span> : null}
    </section>
  );
}

export function DataGapInterlude({
  placeLabel,
  subject,
  reason,
  followUp,
  children,
}: DataGapInterludeProps) {
  return (
    <StoryInterlude
      variant="gap"
      eyebrow="データのすきま"
      title={`${placeLabel}だけでは、${subject}を確認できるデータはありません。`}
    >
      <p>
        {reason}
        {followUp ? (
          <>
            <br />
            {followUp}
          </>
        ) : null}
      </p>
      {children}
    </StoryInterlude>
  );
}
