import type {
  TimelineEvent,
  TimelineEventCatalog,
  TimelineEventScope,
} from "../types/timeline-event";

const scopeOrder: Record<TimelineEventScope, number> = {
  municipality: 0,
  policy: 1,
  societal: 2,
};

export function resolveChartEvents(input: {
  catalog: TimelineEventCatalog;
  chartId: string;
  chartYears: number[];
}): TimelineEvent[] {
  const binding = input.catalog.bindings.find((item) => item.chartId === input.chartId);
  if (!binding) return [];

  const byId = new Map(input.catalog.events.map((event) => [event.id, event]));
  const yearSet = new Set(input.chartYears);

  return binding.eventIds
    .map((id) => byId.get(id))
    .filter((event): event is TimelineEvent => Boolean(event && yearSet.has(event.year)))
    .sort((a, b) => a.year - b.year || scopeOrder[a.scope] - scopeOrder[b.scope]);
}

export function filterTimelineEvents(
  events: TimelineEvent[],
  visibility: { municipality: boolean; policy: boolean; societal: boolean },
): TimelineEvent[] {
  return events.filter((event) => {
    if (event.scope === "municipality") return visibility.municipality;
    if (event.scope === "policy") return visibility.policy;
    return visibility.societal;
  });
}

export function defaultTimelineEventVisibility(events: TimelineEvent[]) {
  return {
    municipality: events.some((event) => event.scope === "municipality"),
    policy: false,
    societal: false,
  };
}

export function hasOptionalTimelineEvents(events: TimelineEvent[]) {
  return events.some((event) => event.scope === "policy" || event.scope === "societal");
}

export function validateTimelineEventCatalog(catalog: TimelineEventCatalog) {
  const ids = new Set<string>();
  for (const event of catalog.events) {
    if (ids.has(event.id)) throw new Error(`Duplicate timeline event id: ${event.id}`);
    ids.add(event.id);
    if (!event.source.url.startsWith("https://")) {
      throw new Error(`Timeline event source must be https: ${event.id}`);
    }
  }

  for (const binding of catalog.bindings) {
    for (const eventId of binding.eventIds) {
      if (!ids.has(eventId)) {
        throw new Error(`Unknown timeline event in binding ${binding.chartId}: ${eventId}`);
      }
    }
  }
}
