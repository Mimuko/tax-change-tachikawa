import type { DashboardData } from "../types/dashboard";
import type { EducationDashboardData } from "../types/education-dashboard";
import careRaw from "../../data/processed/tachikawa/care/dashboard.json";
import educationRaw from "../../data/processed/tachikawa/education/dashboard.json";
import municipality from "../../config/municipalities/tachikawa.json";
import care from "../../config/topics/care.json";
import education from "../../config/topics/education.json";
import careStory from "../../config/stories/tachikawa-care.json";
import educationStory from "../../config/stories/tachikawa-education.json";

type TopicMetrics = Record<
  string,
  { label: string; unit: string; definition: string; comparison: string; periodKind?: string }
>;

type StoryOpening = {
  metricId: string;
  seriesKey: string;
  shortLabel: string;
  color: string;
};

type StoryDefinition = {
  id: string;
  municipality: string;
  topic: string;
  renderer: string;
  opening: StoryOpening[];
  status?: string;
  note?: string;
  acts?: unknown[];
};

export type StoryData = DashboardData | EducationDashboardData;

export type StoryContext = {
  municipality: typeof municipality;
  topic: { id: string; label: string; metrics: TopicMetrics };
  story: StoryDefinition;
  href: string;
  dataHref: string;
  data: StoryData;
};

// Register only audited combinations, never all municipality × topic pairs.
export const stories: StoryContext[] = [
  {
    municipality,
    topic: care,
    story: careStory,
    href: `/${municipality.id}/${care.id}/`,
    dataHref: `/${municipality.id}/${care.id}/data/`,
    data: careRaw as DashboardData,
  },
  {
    municipality,
    topic: education as StoryContext["topic"],
    story: educationStory as StoryDefinition,
    href: `/${municipality.id}/${education.id}/`,
    dataHref: `/${municipality.id}/${education.id}/data/`,
    data: educationRaw as EducationDashboardData,
  },
];

export const defaultStory = stories[0];

for (const context of stories) {
  if (
    context.story.municipality !== context.municipality.id ||
    context.story.topic !== context.topic.id ||
    context.data.place.municipalityCode !== context.municipality.municipalityCode
  ) {
    throw new Error(`Story/dataset identity mismatch: ${context.story.id}`);
  }
  for (const step of context.story.opening) {
    if (!context.topic.metrics[step.metricId]) {
      throw new Error(`Unresolved metric: ${context.story.id}/${step.metricId}`);
    }
    const series = context.data.series as Record<string, unknown>;
    if (!(step.seriesKey in series) || !Array.isArray(series[step.seriesKey])) {
      throw new Error(`Unresolved series: ${context.story.id}/${step.seriesKey}`);
    }
  }
}

export function getStory(municipalityId: string, topicId: string) {
  return stories.find(
    (entry) => entry.municipality.id === municipalityId && entry.topic.id === topicId,
  );
}

export function storyParams() {
  return stories.map(({ municipality: m, topic }) => ({
    municipality: m.id,
    topic: topic.id,
  }));
}
