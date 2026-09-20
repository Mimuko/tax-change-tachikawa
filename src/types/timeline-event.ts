/** イベントの地理・制度スコープ。UI と docs/timeline-events.md が正本。 */
export type TimelineEventScope = "municipality" | "policy" | "societal";

export type TimelineEventVisibility = Record<TimelineEventScope, boolean>;

export type TimelineEventSource = {
  label: string;
  url: string;
};

/** 時系列グラフに重ねる背景イベント。因果関係は示さない。 */
export type TimelineEvent = {
  id: string;
  /** グラフ横軸（年度）と揃える暦年または年度 */
  year: number;
  scope: TimelineEventScope;
  category: string;
  title: string;
  description: string;
  source: TimelineEventSource;
};

export type TimelineEventBinding = {
  chartId: string;
  eventIds: string[];
};

export type TimelineEventCatalog = {
  events: TimelineEvent[];
  bindings: TimelineEventBinding[];
};
