"use client";

import { useMemo, type KeyboardEvent, type ReactNode } from "react";
import type { TimelineEvent, TimelineEventScope } from "../types/timeline-event";

export type ChartEventMarker = { event: TimelineEvent; index: number };

const eventMarkerClass: Record<TimelineEventScope, string> = {
  municipality: "timeline-event-marker--municipality",
  policy: "timeline-event-marker--policy",
  societal: "timeline-event-marker--societal",
};

const shortEventLabel = (title: string, maxLength = 8) =>
  title.length > maxLength ? `${title.slice(0, maxLength)}…` : title;

export function resolveChartEventMarkers(events: TimelineEvent[], years: number[]): ChartEventMarker[] {
  const yearIndex = new Map(years.map((year, index) => [year, index]));
  return events
    .map((event) => ({ event, index: yearIndex.get(event.year) }))
    .filter((item): item is ChartEventMarker => item.index !== undefined);
}

export function getTimelineEventPopoverLeft(
  event: TimelineEvent | undefined,
  years: number[],
  x: (index: number) => number,
  width: number,
) {
  if (!event) return undefined;
  const index = years.indexOf(event.year);
  if (index < 0) return undefined;
  return `${Math.min(82, Math.max(18, (x(index) / width) * 100))}%`;
}

export function TimelineEventChartLayer({
  chartEvents,
  x,
  width,
  height,
  top,
  bottomHeight,
  selectedEventId,
  hoveredEventId,
  onSelectEvent,
  onHoverEvent,
  children,
}: {
  chartEvents: ChartEventMarker[];
  x: (index: number) => number;
  width: number;
  height: number;
  top: number;
  bottomHeight: number;
  selectedEventId?: string | null;
  hoveredEventId?: string | null;
  onSelectEvent?: (id: string | null) => void;
  onHoverEvent?: (id: string | null) => void;
  children?: ReactNode;
}) {
  const yearOffsets = useMemo(() => {
    const counts = new Map<number, number>();
    const offsets = new Map<string, number>();
    for (const { event } of chartEvents) {
      const seen = counts.get(event.year) ?? 0;
      offsets.set(event.id, seen);
      counts.set(event.year, seen + 1);
    }
    return offsets;
  }, [chartEvents]);

  const toggleEvent = (id: string) => {
    if (!onSelectEvent) return;
    onSelectEvent(selectedEventId === id ? null : id);
  };

  const onMarkerKeyDown = (event: KeyboardEvent<SVGGElement>, id: string) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleEvent(id);
  };

  if (!chartEvents.length) return <>{children}</>;

  return (
    <>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        className="timeline-event-focus-layer"
        pointerEvents="none"
        aria-hidden="true"
      />
      {children}
      {chartEvents.map(({ event, index }) => {
        const markerX = x(index) + (yearOffsets.get(event.id) ?? 0) * 14;
        const isSelected = selectedEventId === event.id;
        const isHovered = hoveredEventId === event.id;
        const interactive = Boolean(onSelectEvent);
        const diamondY = top - 12;

        return (
          <g
            key={event.id}
            className={`timeline-event-marker ${eventMarkerClass[event.scope]}${isSelected || isHovered ? " is-active" : ""}`}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-pressed={interactive ? isSelected : undefined}
            aria-label={interactive ? `${event.year}年 ${event.title}` : undefined}
            onClick={interactive ? () => toggleEvent(event.id) : undefined}
            onKeyDown={interactive ? (keyboardEvent) => onMarkerKeyDown(keyboardEvent, event.id) : undefined}
            onMouseEnter={onHoverEvent ? () => onHoverEvent(event.id) : undefined}
            onMouseLeave={onHoverEvent ? () => onHoverEvent(null) : undefined}
          >
            <rect
              x={markerX - 16}
              y={top - 36}
              width={32}
              height={bottomHeight - top + 48}
              className="timeline-event-marker-hit"
              fill="transparent"
              pointerEvents={interactive ? "all" : "none"}
            />
            <line
              x1={markerX}
              x2={markerX}
              y1={top}
              y2={bottomHeight}
              className="timeline-event-marker-line"
              pointerEvents="none"
            />
            <polygon
              points={`${markerX},${diamondY - 5} ${markerX + 5},${diamondY} ${markerX},${diamondY + 5} ${markerX - 5},${diamondY}`}
              className="timeline-event-marker-tick"
              pointerEvents="none"
            />
            <text x={markerX + 7} y={top - 22} className="timeline-event-marker-year" pointerEvents="none">
              {event.year}
            </text>
            <text x={markerX + 7} y={top - 10} className="timeline-event-marker-label" pointerEvents="none">
              {shortEventLabel(event.title)}
            </text>
          </g>
        );
      })}
    </>
  );
}
