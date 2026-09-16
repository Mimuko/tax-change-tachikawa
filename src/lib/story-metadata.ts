import type { Metadata } from "next";

import type { StoryContext } from "./story-registry";

const DEFAULT_DESCRIPTION =
  "自治体の公開行政データから、街の変化をたどります。政策の採点ではなく、観測された変化と根拠を示します。";

export function buildStoryMetadata(context: StoryContext): Metadata {
  const { municipality, topic } = context;
  const title = `${municipality.municipalityLabel}の${topic.label} | machinohenka`;
  const description = `${municipality.municipalityLabel}の${topic.label}に関する公開行政データから、直近の変化をたどります。`;

  return {
    title,
    description,
    alternates: { canonical: context.href },
    openGraph: {
      title: `${municipality.municipalityLabel}の${topic.label}｜自分の街はどう変わった？`,
      description,
      type: "website",
      url: context.href,
      siteName: "machinohenka",
      locale: "ja_JP",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export function buildStoryDataMetadata(context: StoryContext): Metadata {
  const { municipality, topic } = context;
  const title = `${municipality.municipalityLabel}の${topic.label}｜定義と加工方法 | machinohenka`;
  const description = `${municipality.municipalityLabel}の${topic.label}データの定義、加工方法、出典を確認できます。`;

  return {
    title,
    description,
    alternates: { canonical: context.dataHref },
    openGraph: {
      title,
      description,
      type: "website",
      url: context.dataHref,
      siteName: "machinohenka",
      locale: "ja_JP",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export const rootSiteDescription = DEFAULT_DESCRIPTION;
