import type {
  TimelineEvent,
  TimelineEventCatalog,
  TimelineEventScope,
  TimelineEventVisibility,
} from "../types/timeline-event";

const scopeOrder: Record<TimelineEventScope, number> = {
  municipality: 0,
  policy: 1,
  societal: 2,
};

const timelineEventScopes = new Set<TimelineEventScope>(["municipality", "policy", "societal"]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

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
  visibility: TimelineEventVisibility,
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

export function validateTimelineEventCatalog(catalog: unknown): asserts catalog is TimelineEventCatalog {
  if (!isRecord(catalog) || !Array.isArray(catalog.events) || !Array.isArray(catalog.bindings)) {
    throw new Error("Timeline event catalog must contain events and bindings arrays");
  }

  const ids = new Set<string>();
  for (const event of catalog.events) {
    if (!isRecord(event) || !isNonEmptyString(event.id)) {
      throw new Error("Timeline event must have a non-empty id");
    }
    if (ids.has(event.id)) throw new Error(`Duplicate timeline event id: ${event.id}`);
    ids.add(event.id);
    if (!Number.isInteger(event.year)) {
      throw new Error(`Timeline event year must be an integer: ${event.id}`);
    }
    if (!timelineEventScopes.has(event.scope as TimelineEventScope)) {
      throw new Error(`Unknown timeline event scope: ${event.id}`);
    }
    if (![event.category, event.title, event.description].every(isNonEmptyString)) {
      throw new Error(`Timeline event text fields are required: ${event.id}`);
    }
    if (
      !isRecord(event.source)
      || !isNonEmptyString(event.source.label)
      || !isNonEmptyString(event.source.url)
      || !event.source.url.startsWith("https://")
    ) {
      throw new Error(`Timeline event source must be https: ${event.id}`);
    }
  }

  const chartIds = new Set<string>();
  for (const binding of catalog.bindings) {
    if (!isRecord(binding) || !isNonEmptyString(binding.chartId) || !Array.isArray(binding.eventIds)) {
      throw new Error("Timeline event binding must have a chartId and eventIds array");
    }
    if (chartIds.has(binding.chartId)) {
      throw new Error(`Duplicate timeline event chart binding: ${binding.chartId}`);
    }
    chartIds.add(binding.chartId);

    const bindingEventIds = new Set<string>();
    for (const eventId of binding.eventIds) {
      if (!isNonEmptyString(eventId)) {
        throw new Error(`Invalid timeline event id in binding ${binding.chartId}`);
      }
      if (bindingEventIds.has(eventId)) {
        throw new Error(`Duplicate timeline event in binding ${binding.chartId}: ${eventId}`);
      }
      bindingEventIds.add(eventId);
      if (!ids.has(eventId)) {
        throw new Error(`Unknown timeline event in binding ${binding.chartId}: ${eventId}`);
      }
    }
  }
}
