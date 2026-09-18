import careEvents from "../../config/events/tachikawa-care.json";
import educationEvents from "../../config/events/tachikawa-education.json";
import type { TimelineEventCatalog } from "../types/timeline-event";
import { validateTimelineEventCatalog } from "./timeline-events-core";

const catalogs: Record<string, TimelineEventCatalog> = {
  "tachikawa/care": careEvents as TimelineEventCatalog,
  "tachikawa/education": educationEvents as TimelineEventCatalog,
};

for (const catalog of Object.values(catalogs)) {
  validateTimelineEventCatalog(catalog);
}

export function getTimelineEventCatalog(municipalityId: string, topicId: string): TimelineEventCatalog | null {
  return catalogs[`${municipalityId}/${topicId}`] ?? null;
}

export {
  defaultTimelineEventVisibility,
  filterTimelineEvents,
  hasOptionalTimelineEvents,
  resolveChartEvents,
  validateTimelineEventCatalog,
} from "./timeline-events-core";

export type {
  TimelineEvent,
  TimelineEventBinding,
  TimelineEventCatalog,
  TimelineEventScope,
} from "../types/timeline-event";
