"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  defaultTimelineEventVisibility,
  filterTimelineEvents,
} from "../lib/timeline-events-core";
import type {
  TimelineEvent,
  TimelineEventScope,
  TimelineEventVisibility,
} from "../types/timeline-event";

export const scopeLabels: Record<TimelineEventScope, string> = {
  municipality: "自治体",
  policy: "国・制度",
  societal: "広域・社会",
};

const scopeOrder: TimelineEventScope[] = ["municipality", "policy", "societal"];

export function availableTimelineEventScopes(events: TimelineEvent[]): TimelineEventScope[] {
  return scopeOrder.filter((scope) => events.some((event) => event.scope === scope));
}

export function TimelineEventLayerControls({
  events,
  visibility,
  onToggle,
}: {
  events: TimelineEvent[];
  visibility: TimelineEventVisibility;
  onToggle: (scope: TimelineEventScope, value: boolean) => void;
}) {
  const scopes = availableTimelineEventScopes(events);
  if (!events.length || !scopes.length) return null;

  return (
    <div className="timeline-event-layer" aria-label="出来事レイヤー">
      <span className="timeline-event-layer-label">出来事を表示</span>
      <div className="timeline-events-toggles" role="group" aria-label="表示する出来事の種類">
        {scopes.map((scope) => (
          <label key={scope} className="timeline-events-toggle">
            <input
              type="checkbox"
              checked={visibility[scope]}
              onChange={(event) => onToggle(scope, event.target.checked)}
            />
            <span>{scopeLabels[scope]}</span>
          </label>
        ))}
      </div>
      <details className="timeline-events-info">
        <summary>
          <span aria-hidden="true">ⓘ</span>
          <span className="timeline-events-info-label">出来事の見方</span>
        </summary>
        <p>
          表示される出来事は、数値変化の原因を示すものではなく、同時期に起きた事実を確認するための参考情報です。
        </p>
      </details>
    </div>
  );
}

export function TimelineEventPopover({
  event,
  onClose,
  style,
  onMouseEnter,
  onMouseLeave,
}: {
  event: TimelineEvent;
  onClose: () => void;
  style?: CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <aside
      className={`timeline-event-popover timeline-event-popover--${event.scope}`}
      style={style}
      aria-label={`${event.year}年 ${event.title}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button type="button" className="timeline-event-popover-close" onClick={onClose} aria-label="閉じる">
        ×
      </button>
      <div className="timeline-event-detail-meta">
        <span className="timeline-event-year">{event.year}年</span>
        <span className="timeline-event-scope">{scopeLabels[event.scope]}</span>
        <span className="timeline-event-category">{event.category}</span>
      </div>
      <h4 className="timeline-event-title">{event.title}</h4>
      <p className="timeline-event-description">{event.description}</p>
      <p className="timeline-event-source">
        <a href={event.source.url} target="_blank" rel="noopener noreferrer">
          出典: {event.source.label} ↗
        </a>
      </p>
    </aside>
  );
}

export function useTimelineEventLayer(events: TimelineEvent[]) {
  const [visibilityOverrides, setVisibilityOverrides] = useState<Partial<TimelineEventVisibility>>({});
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const visibility = useMemo(
    () => ({ ...defaultTimelineEventVisibility(events), ...visibilityOverrides }),
    [events, visibilityOverrides],
  );
  const visibleEvents = useMemo(
    () => filterTimelineEvents(events, visibility),
    [events, visibility],
  );
  const onToggle = (scope: TimelineEventScope, value: boolean) => {
    setVisibilityOverrides((current) => ({ ...current, [scope]: value }));
    if (!value) {
      if (events.find((event) => event.id === selectedEventId)?.scope === scope) {
        setSelectedEventId(null);
      }
      if (events.find((event) => event.id === hoveredEventId)?.scope === scope) {
        setHoveredEventId(null);
      }
    }
  };
  const visibleEventIds = useMemo(
    () => new Set(visibleEvents.map((event) => event.id)),
    [visibleEvents],
  );
  const selectedEventIdActive =
    selectedEventId && visibleEventIds.has(selectedEventId) ? selectedEventId : null;
  const hoveredEventIdActive =
    hoveredEventId && visibleEventIds.has(hoveredEventId) ? hoveredEventId : null;
  const activeEventId = selectedEventIdActive ?? hoveredEventIdActive;
  const activeEvent = activeEventId
    ? visibleEvents.find((event) => event.id === activeEventId)
    : undefined;

  return {
    visibility,
    visibleEvents,
    onToggle,
    selectedEventId: selectedEventIdActive,
    hoveredEventId: hoveredEventIdActive,
    activeEvent,
    onSelectEvent: setSelectedEventId,
    onHoverEvent: setHoveredEventId,
    clearSelection: () => {
      setSelectedEventId(null);
      setHoveredEventId(null);
    },
  };
}
