import careEvents from "../../config/events/tachikawa-care.json";
import educationEvents from "../../config/events/tachikawa-education.json";
import type { TimelineEvent, TimelineEventCatalog } from "../types/timeline-event";
import {
  resolveChartEvents as resolveCatalogChartEvents,
  validateTimelineEventCatalog,
} from "./timeline-events-core";

const defineTimelineEventCatalog = (catalog: unknown): TimelineEventCatalog => {
  validateTimelineEventCatalog(catalog);
  return catalog;
};

const catalogs: Record<string, TimelineEventCatalog> = {
  "tachikawa/care": defineTimelineEventCatalog(careEvents),
  "tachikawa/education": defineTimelineEventCatalog(educationEvents),
};

const catalogKey = (municipalityId: string, topicId: string) => `${municipalityId}/${topicId}`;

function getTimelineEventCatalog(municipalityId: string, topicId: string): TimelineEventCatalog | null {
  return catalogs[catalogKey(municipalityId, topicId)] ?? null;
}

type TimelineEventSeries = {
  points: readonly { year: number }[];
};

/** 自治体×テーマ×グラフと、その系列年度から表示対象の出来事を解決する共通入口。 */
export function resolveTimelineEvents(input: {
  municipalityId: string;
  topicId: string;
  chartId: string;
  series: readonly TimelineEventSeries[];
}): TimelineEvent[] {
  const catalog = getTimelineEventCatalog(input.municipalityId, input.topicId);
  if (!catalog) return [];

  // Charts use the first series as their horizontal-axis source of truth.
  const chartYears = input.series[0]?.points.map((point) => point.year) ?? [];

  return resolveCatalogChartEvents({
    catalog,
    chartId: input.chartId,
    chartYears,
  });
}

export {
  defaultTimelineEventVisibility,
  filterTimelineEvents,
  resolveChartEvents,
  validateTimelineEventCatalog,
} from "./timeline-events-core";

export type {
  TimelineEvent,
  TimelineEventBinding,
  TimelineEventCatalog,
  TimelineEventScope,
  TimelineEventVisibility,
} from "../types/timeline-event";
