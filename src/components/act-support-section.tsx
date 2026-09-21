import type { DataPoint, PlaceInfo, ReferenceMetric } from "../types/dashboard";
import {
  comparableReferenceMetrics,
  hasComparablePoints,
  isWageMetric,
  resolveSupportAvailability,
} from "../lib/support-availability";
import SimpleSeriesChart from "./simple-series-chart";
import StoryAct from "./story-act";
import { DataGapInterlude } from "./story-interlude";

type ActSupportSectionProps = {
  place: PlaceInfo;
  localSalary?: DataPoint[];
  localWorkforce?: DataPoint[];
  prefectureReference?: ReferenceMetric[];
  seriesColors: string[];
  /** Optional copy overrides; defaults interpolate place labels. */
  copy?: {
    gapSubject?: string;
    gapReason?: string;
    gapFollowUp?: string;
    localActEyebrow?: string;
    localActTitle?: string;
    referenceActEyebrow?: string;
    referenceActTitle?: string;
  };
};

function wageNote({
  place,
  metric,
  mode,
}: {
  place: PlaceInfo;
  metric: ReferenceMetric | { label: string };
  mode: "local" | "reference";
}) {
  const sourceHref = place.links?.wageStructureSurvey ?? "https://www.mhlw.go.jp/toukei/list/chinginkouzou_a.html";
  if (mode === "local") {
    return (
      <div className="act-note">
        <p>
          <strong>{metric.label}</strong>
        </p>
        <p>
          {place.municipalityLabel}内の介護職員の、残業代などを除いた所定内給与額です。一般労働者・企業規模10人以上・男女計のデータを使用しています。
        </p>
        <p>
          出典：
          <a
            href={sourceHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="厚生労働省「賃金構造基本統計調査」を開く（外部サイト）"
          >
            厚生労働省「賃金構造基本統計調査」
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="act-note">
      <p>
        <strong>{metric.label}</strong>
      </p>
      <p>
        {place.prefectureLabel}内の介護職員（医療・福祉施設等）の、残業代などを除いた所定内給与額です。一般労働者・企業規模10人以上・男女計のデータを使用しています。
        {place.municipalityLabel}単位で継続比較できる公開データが確認できないため、{place.prefectureLabel}の値を参考として掲載しています。
      </p>
      <p>
        出典：
        <a
          href={sourceHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="厚生労働省「賃金構造基本統計調査」を開く（外部サイト）"
        >
          厚生労働省「賃金構造基本統計調査」
        </a>
      </p>
    </div>
  );
}

function MetricCharts({
  metrics,
  place,
  seriesColors,
  mode,
}: {
  metrics: Array<{ id: string; label: string; unit: string; points: DataPoint[]; metric?: ReferenceMetric }>;
  place: PlaceInfo;
  seriesColors: string[];
  mode: "local" | "reference";
}) {
  const kicker = mode === "local" ? place.municipalityLabel : `${place.prefectureLabel}参考`;
  const chartNote =
    mode === "local"
      ? `${place.municipalityLabel}の公開データに基づく指標です。`
      : `市区町村値ではなく、${place.prefectureLabel}の参考指標です。`;

  return (
    <div className="support-metric-stack">
      {metrics.map((item, index) => (
        <div key={item.id} className="support-metric-block">
          {item.points.length >= 2 ? (
            <SimpleSeriesChart
              series={[
                {
                  label: item.label,
                  shortLabel: item.label,
                  unit: item.unit,
                  color: seriesColors[index % seriesColors.length],
                  points: item.points,
                },
              ]}
              kicker={kicker}
              note={chartNote}
            />
          ) : null}
          {item.metric && isWageMetric(item.metric)
            ? wageNote({ place, metric: item.metric, mode })
            : item.unit === "円" && mode === "local"
              ? wageNote({ place, metric: { label: item.label }, mode })
              : (
                <p className="act-note">
                  <strong>{item.label}</strong>
                  {mode === "reference"
                    ? `（${place.prefectureLabel}参考。${place.municipalityLabel}の値ではありません）`
                    : null}
                </p>
              )}
        </div>
      ))}
    </div>
  );
}

export default function ActSupportSection({
  place,
  localSalary,
  localWorkforce,
  prefectureReference = [],
  seriesColors,
  copy = {},
}: ActSupportSectionProps) {
  const availability = resolveSupportAvailability({
    localSalary,
    localWorkforce,
    prefectureReference,
  });

  if (!availability.showSupportAct) return null;

  const referenceMetrics = comparableReferenceMetrics(prefectureReference);
  if (availability.localSupportAvailable) {
    const localMetrics: Array<{ id: string; label: string; unit: string; points: DataPoint[] }> = [];
    if (hasComparablePoints(localWorkforce)) {
      localMetrics.push({
        id: "local-workforce",
        label: "介護職員数",
        unit: "人",
        points: localWorkforce!,
      });
    }
    if (hasComparablePoints(localSalary)) {
      localMetrics.push({
        id: "local-salary",
        label: "介護職員の所定内給与",
        unit: "円",
        points: localSalary!,
      });
    }

    return (
      <StoryAct
        id="act-3"
        eyebrow={
          copy.localActEyebrow ??
          `${place.municipalityLabel}・${[
            hasComparablePoints(localWorkforce) ? "介護職員数" : null,
            hasComparablePoints(localSalary) ? "介護職員の所定内給与" : null,
          ]
            .filter(Boolean)
            .join("・")}`
        }
        title={copy.localActTitle ?? "支える人と待遇も、変わりました"}
      >
        <MetricCharts metrics={localMetrics} place={place} seriesColors={seriesColors} mode="local" />
      </StoryAct>
    );
  }

  // Case B: no local support metrics, but prefecture reference exists
  return (
    <>
      <DataGapInterlude
        placeLabel={place.municipalityLabel}
        subject={copy.gapSubject ?? "介護職員数・賃金の年次推移"}
        reason={
          copy.gapReason ??
          `${place.municipalityLabel}単位で継続比較できる公開データは確認できませんでした。`
        }
        followUp={copy.gapFollowUp ?? `そこで、ここからは${place.prefectureLabel}全体の変化を見ます。`}
      />

      <StoryAct
        id="act-3"
        eyebrow={
          copy.referenceActEyebrow ??
          `${place.prefectureLabel}参考・${referenceMetrics
            .map((metric) => metric.label.replace(`（${place.prefectureLabel}）`, ""))
            .join("・")}`
        }
        title={copy.referenceActTitle ?? `${place.prefectureLabel}では、介護職員の給与も増えた`}
        className="act-prefecture-ref"
      >
        <MetricCharts
          metrics={referenceMetrics.map((metric) => ({
            id: metric.metricId,
            label: metric.label,
            unit: metric.unit,
            points: metric.points.filter((point) => Number.isFinite(point.value)),
            metric,
          }))}
          place={place}
          seriesColors={seriesColors}
          mode="reference"
        />
      </StoryAct>
    </>
  );
}
