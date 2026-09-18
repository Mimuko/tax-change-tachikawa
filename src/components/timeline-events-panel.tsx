"use client";

import { useMemo, useState } from "react";
import SimpleSeriesChart, { type SimpleSeries } from "./simple-series-chart";
import {
  defaultTimelineEventVisibility,
  filterTimelineEvents,
  hasOptionalTimelineEvents,
} from "../lib/timeline-events-core";
import type { TimelineEvent, TimelineEventScope } from "../types/timeline-event";

const scopeLabels: Record<TimelineEventScope, string> = {
  municipality: "自治体",
  policy: "国・制度",
  societal: "広域・社会",
};

function TimelineEventsPanelBody({
  events,
  visibility,
  onToggle,
}: {
  events: TimelineEvent[];
  visibility: { municipality: boolean; policy: boolean; societal: boolean };
  onToggle: (scope: "policy" | "societal", value: boolean) => void;
}) {
  const visibleEvents = useMemo(
    () => filterTimelineEvents(events, visibility),
    [events, visibility],
  );
  const optionalEvents = hasOptionalTimelineEvents(events);

  if (!events.length) return null;

  return (
    <aside className="timeline-events-panel" aria-label="この時期に起きたこと">
      <div className="timeline-events-panel-head">
        <h3 className="timeline-events-title">この時期に起きたこと</h3>
        <p className="timeline-events-disclaimer">
          同時期に起きた出来事の参考情報です。数値の変化の原因を示すものではありません。
        </p>
      </div>
      {optionalEvents ? (
        <div className="timeline-events-toggles" role="group" aria-label="表示する出来事の種類">
          {(["policy", "societal"] as const).map((scope) => (
            <label key={scope} className="timeline-events-toggle">
              <input
                type="checkbox"
                checked={visibility[scope]}
                onChange={(event) => onToggle(scope, event.target.checked)}
              />
              <span>{scopeLabels[scope]}の出来事を表示</span>
            </label>
          ))}
        </div>
      ) : null}
      {visibleEvents.length ? (
        <ol className="timeline-events-list">
          {visibleEvents.map((event) => (
            <li key={event.id} className={`timeline-event timeline-event--${event.scope}`}>
              <div className="timeline-event-meta">
                <span className="timeline-event-year">{event.year}年</span>
                <span className="timeline-event-scope">{scopeLabels[event.scope]}</span>
                <span className="timeline-event-category">{event.category}</span>
              </div>
              <p className="timeline-event-title">{event.title}</p>
              <p className="timeline-event-description">{event.description}</p>
              <p className="timeline-event-source">
                出典:{" "}
                <a href={event.source.url} target="_blank" rel="noopener noreferrer">
                  {event.source.label} ↗
                </a>
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="timeline-events-empty">
          表示できる出来事はありません。上の切替で国・制度や広域・社会の出来事を表示できます。
        </p>
      )}
    </aside>
  );
}

export function TimelineEventsPanel({
  events,
  visibility,
  onToggle,
}: {
  events: TimelineEvent[];
  visibility: { municipality: boolean; policy: boolean; societal: boolean };
  onToggle: (scope: "policy" | "societal", value: boolean) => void;
}) {
  return <TimelineEventsPanelBody events={events} visibility={visibility} onToggle={onToggle} />;
}

export function useTimelineEventVisibility(events: TimelineEvent[]) {
  const [visibility, setVisibility] = useState(() => defaultTimelineEventVisibility(events));
  const visibleEvents = useMemo(
    () => filterTimelineEvents(events, visibility),
    [events, visibility],
  );
  const onToggle = (scope: "policy" | "societal", value: boolean) => {
    setVisibility((current) => ({ ...current, [scope]: value }));
  };

  return { visibility, visibleEvents, onToggle };
}

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
  const { visibility, visibleEvents, onToggle } = useTimelineEventVisibility(events);

  return (
    <div className="timeline-events-chart">
      <SimpleSeriesChart
        series={series}
        events={visibleEvents}
        kicker={kicker}
        heading={heading}
        note={note}
        indexMode={indexMode}
      />
      <TimelineEventsPanelBody events={events} visibility={visibility} onToggle={onToggle} />
    </div>
  );
}
