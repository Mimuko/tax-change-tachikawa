import type { DashboardData } from "../types/dashboard";
import raw from "../../data/processed/tachikawa/care/dashboard.json";
import municipality from "../../config/municipalities/tachikawa.json";
import care from "../../config/topics/care.json";
import story from "../../config/stories/tachikawa-care.json";

export type StoryContext = {
  municipality: typeof municipality;
  topic: { id: string; label: string; metrics: Record<string, { label: string; unit: string; definition: string; comparison: string }> };
  story: { id: string; municipality: string; topic: string; renderer: string; opening: { metricId: string; seriesKey: string; shortLabel: string; color: string }[] };
  href: string;
  dataHref: string;
  data: DashboardData;
};
// Register only audited combinations, never all municipality × topic pairs.
export const stories: StoryContext[] = [{ municipality, topic: care, story,
  href: `/${municipality.id}/${care.id}/`, dataHref: `/${municipality.id}/${care.id}/data/`,
  data: raw as DashboardData,
}];
export const defaultStory = stories[0];
for (const context of stories) {
  if (context.story.municipality !== context.municipality.id || context.story.topic !== context.topic.id ||
      context.data.place.municipalityCode !== context.municipality.municipalityCode) {
    throw new Error(`Story/dataset identity mismatch: ${context.story.id}`);
  }
  for (const step of context.story.opening) {
    if (!context.topic.metrics[step.metricId] || !(step.seriesKey in context.data.series)) {
      throw new Error(`Unresolved metric: ${context.story.id}/${step.metricId}`);
    }
  }
}
export function getStory(municipality: string, topic: string) {
  return stories.find((entry) => entry.municipality.id === municipality && entry.topic.id === topic);
}
export function storyParams() {
  return stories.map(({ municipality, topic }) => ({ municipality: municipality.id, topic: topic.id }));
}
