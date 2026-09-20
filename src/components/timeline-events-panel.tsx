"use client";

import SimpleSeriesChart, { type SimpleSeries } from "./simple-series-chart";
import {
  TimelineEventLayerControls,
  useTimelineEventLayer,
} from "./timeline-event-overlay";
import type { TimelineEvent } from "../types/timeline-event";

export default function ChartWithTimelineEvents({
  series,
  events,
  kicker,
  heading,
  note,
  indexMode = true,
}: {
  series: SimpleSeries[];
  events: TimelineEvent[];
  kicker?: string;
  heading?: string;
  note?: string;
  indexMode?: boolean;
}) {
  const {
    visibility,
    visibleEvents,
    onToggle,
    selectedEventId,
    hoveredEventId,
    activeEvent,
    onSelectEvent,
    onHoverEvent,
    clearSelection,
  } = useTimelineEventLayer(events);

  return (
    <div className="timeline-events-chart">
      <TimelineEventLayerControls events={events} visibility={visibility} onToggle={onToggle} />
      <SimpleSeriesChart
        series={series}
        events={visibleEvents}
        eventLayerAvailable={events.length > 0}
        selectedEventId={selectedEventId}
        hoveredEventId={hoveredEventId}
        activeEvent={activeEvent}
        onSelectEvent={onSelectEvent}
        onHoverEvent={onHoverEvent}
        onCloseEvent={clearSelection}
        kicker={kicker}
        heading={heading}
        note={note}
        indexMode={indexMode}
      />
    </div>
  );
}
