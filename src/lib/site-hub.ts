import { stories, type StoryContext } from "./story-registry";

export type HubMunicipality = {
  id: string;
  label: string;
  prefectureLabel: string;
  stories: StoryContext[];
};

export type HubTopic = {
  id: string;
  label: string;
  stories: StoryContext[];
};

export function groupStoriesByMunicipality(): HubMunicipality[] {
  const map = new Map<string, HubMunicipality>();

  for (const story of stories) {
    const existing = map.get(story.municipality.id);
    if (existing) {
      existing.stories.push(story);
      continue;
    }

    map.set(story.municipality.id, {
      id: story.municipality.id,
      label: story.municipality.municipalityLabel,
      prefectureLabel: story.municipality.prefectureLabel,
      stories: [story],
    });
  }

  return Array.from(map.values());
}

export function groupStoriesByTopic(): HubTopic[] {
  const map = new Map<string, HubTopic>();

  for (const story of stories) {
    const existing = map.get(story.topic.id);
    if (existing) {
      existing.stories.push(story);
      continue;
    }

    map.set(story.topic.id, {
      id: story.topic.id,
      label: story.topic.label,
      stories: [story],
    });
  }

  return Array.from(map.values());
}

export function getSiblingStories(context: StoryContext): StoryContext[] {
  return stories.filter((entry) => entry.story.id !== context.story.id);
}

export function formatStoryTitle(context: StoryContext): string {
  return `${context.municipality.municipalityLabel}×${context.topic.label}`;
}
