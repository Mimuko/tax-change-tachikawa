import type { ReactNode } from "react";

type StoryInterludeProps = {
  variant: "pause" | "gap";
  eyebrow?: string;
  title: ReactNode;
  children: ReactNode;
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
