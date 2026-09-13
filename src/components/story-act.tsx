import type { ReactNode } from "react";

type StoryActProps = {
  id: string;
  eyebrow: string;
  title: string;
  chip?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function StoryAct({ id, eyebrow, title, chip, className, children }: StoryActProps) {
  return (
    <section id={id} className={["story-act", className].filter(Boolean).join(" ")}>
      <div className="story-act-inner">
        <p className="eyebrow">{eyebrow}</p>
        {chip}
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}
