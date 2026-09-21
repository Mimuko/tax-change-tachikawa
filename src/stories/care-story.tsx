import type { DashboardData } from "../types/dashboard";
import type { StoryContext } from "../lib/story-registry";
import { buildShareUrl } from "../lib/site-url";
import { resolveTimelineEvents } from "../lib/timeline-events";
import { buildCareStepCopy } from "./care-copy";
import ActSupportSection from "../components/act-support-section";
import DetailAccordion, { type DetailItem } from "../components/detail-accordion";
import GeographyChip from "../components/geography-chip";
import PremiumStandardSection from "../components/premium-standard-section";
import ChartWithTimelineEvents from "../components/timeline-events-panel";
import SiteFooter from "../components/site-footer";
import SiteTopbar from "../components/site-topbar";
import StoryAct from "../components/story-act";
import StoryExperience from "../components/story-experience";
import StoryInterlude from "../components/story-interlude";
import StoryRecap, { type RecapGroup } from "../components/story-recap";
import {
  comparableReferenceMetrics,
  resolveSupportAvailability,
} from "../lib/support-availability";
import type { DataPoint, ReferenceMetric } from "../types/dashboard";

const formatPeople = (value: number) => `${value.toLocaleString("ja-JP")}人`;
const formatBillions = (value: number) =>
  `${(value / 100_000_000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}億円`;
const changePct = (points: { year: number; value: number }[]) =>
  ((points.at(-1)!.value - points[0].value) / points[0].value) * 100;

function formatMetricRecap(
  metric: { label: string; unit: string; points: DataPoint[] },
  suffix = "",
) {
  const points = metric.points.filter((point) => point.value !== null) as { year: number; value: number }[];
  if (points.length < 2) return `${metric.label}${suffix}`;
  const delta = changePct(points);
  const first = points[0];
  const last = points.at(-1)!;
  const formatted =
    metric.unit === "円"
      ? `${first.value.toLocaleString("ja-JP")}円 → ${last.value.toLocaleString("ja-JP")}円`
      : `${first.value.toLocaleString("ja-JP")} → ${last.value.toLocaleString("ja-JP")}${metric.unit}`;
  return `${metric.label} ${formatted}（${first.year}→${last.year} ${delta >= 0 ? "↑" : "↓"}${Math.abs(delta).toFixed(1)}%）${suffix}`;
}

function buildSupportRecapItems(input: {
  localSalary?: DataPoint[];
  localWorkforce?: DataPoint[];
  prefectureReference: ReferenceMetric[];
  prefectureLabel: string;
  localSupportAvailable: boolean;
}): string[] {
  if (input.localSupportAvailable) {
    const items: string[] = [];
    if (input.localWorkforce?.length) {
      items.push(formatMetricRecap({ label: "介護職員数", unit: "人", points: input.localWorkforce }));
    }
    if (input.localSalary?.length) {
      items.push(formatMetricRecap({ label: "介護職員の所定内給与", unit: "円", points: input.localSalary }));
    }
    return items.length ? items : ["市区町村の支える人・待遇指標は、今回は掲載していません。"];
  }

  const reference = comparableReferenceMetrics(input.prefectureReference);
  if (reference.length) {
    return reference.map((metric) =>
      formatMetricRecap(metric, `（${input.prefectureLabel}参考）`),
    );
  }
  return [`${input.prefectureLabel}参考の支える人・待遇指標は、今回は掲載していません。`];
}

export default function CareStory({ data, context }: { data: DashboardData; context: StoryContext }) {
  const { place } = data;
  const prefectureReference = data.reference.prefecture ?? [];
  const premiumStandard = data.premiumStandard;
  const availability = resolveSupportAvailability({
    localSalary: data.series.careWorkerSalary,
    localWorkforce: data.series.careWorkerWorkforce,
    prefectureReference,
  });

  const act1Series = context.story.opening.map((step) => {
    const definition = context.topic.metrics[step.metricId];
    const points = data.series[step.seriesKey as keyof DashboardData["series"]];
    if (!definition || !points?.length) throw new Error(`Invalid story metric: ${step.metricId}`);
    return { id: step.metricId, label: definition.label, unit: definition.unit,
      shortLabel: step.shortLabel, color: step.color, points };
  });

  const serviceUnitCount = data.series.serviceUnitCount;
  const serviceUnitDelta = serviceUnitCount?.length ? changePct(serviceUnitCount) : null;

  const capacityDetail: DetailItem = serviceUnitCount?.length
    ? {
        id: "capacity",
        title: "サービスの受け皿",
        kind: "metrics",
        metrics: [
          {
            label: "提供されているサービス数",
            unit: "単位",
            points: serviceUnitCount,
            provenance: data.provenance.serviceUnitCount ?? {
              title: "提供されているサービス数",
              definition: `サービスコード×事業所番号の一意組合せ数（${place.municipalityLabel}）`,
              unit: "establishments",
            },
          },
        ],
      }
    : {
        id: "capacity",
        title: "サービスの受け皿",
        kind: "unavailable",
        note: `${place.municipalityLabel}の提供されているサービス数は本編 Act 2 を参照してください。同一定義の時系列が揃い次第、ここにも年度別の値を追加します。`,
      };

  const workforceDetail: DetailItem = availability.localWorkforceAvailable && data.series.careWorkerWorkforce
    ? {
        id: "workforce",
        title: "支える人",
        kind: "metrics",
        metrics: [
          {
            label: data.provenance.careWorkerWorkforce?.title ?? "介護職員数",
            unit: "人",
            points: data.series.careWorkerWorkforce,
            provenance: data.provenance.careWorkerWorkforce!,
          },
        ],
      }
    : {
        id: "workforce",
        title: "支える人",
        kind: "unavailable",
        note: availability.referenceWorkforceAvailable
          ? `${place.municipalityLabel}単位で継続比較できる公開データは確認できていません。${place.prefectureLabel}の参考値は本編 Act 3 を参照してください。`
          : `${place.municipalityLabel}単位で継続比較できる公開データは確認できていません。`,
      };

  const wageDetail: DetailItem = availability.localWageAvailable && data.series.careWorkerSalary
    ? {
        id: "wage",
        title: "待遇",
        kind: "metrics",
        metrics: [
          {
            label: data.provenance.careWorkerSalary?.title ?? "介護職員の所定内給与",
            unit: "円",
            points: data.series.careWorkerSalary,
            provenance: data.provenance.careWorkerSalary!,
          },
        ],
      }
    : {
        id: "wage",
        title: "待遇",
        kind: "unavailable",
        note: availability.referenceWageAvailable
          ? `${place.municipalityLabel}だけの賃金の年次推移を確認できるデータはありません。${place.prefectureLabel}参考の賃金指標は本編 Act 3 を参照してください。`
          : `${place.municipalityLabel}だけの賃金の年次推移を確認できるデータはありません。`,
      };

  const detailItems: DetailItem[] = [
    {
      id: "demand",
      title: "介護を必要とする人",
      kind: "metrics",
      metrics: [
        {
          label: "介護保険第1号被保険者数",
          unit: "人",
          points: data.series.insured,
          provenance: data.provenance.insured,
        },
        {
          label: "要支援・要介護認定者数",
          unit: "人",
          points: data.series.certified,
          provenance: data.provenance.certified,
        },
      ],
    },
    capacityDetail,
    workforceDetail,
    wageDetail,
    {
      id: "benefits",
      title: "行政支出",
      kind: "metrics",
      metrics: [
        {
          label: "介護保険給付総額",
          unit: "円",
          points: data.series.benefits,
          provenance: data.provenance.benefits,
        },
      ],
    },
    {
      id: "premium",
      title: "保険料",
      kind: "premium",
      premiumStandard: premiumStandard,
      metrics: [
        {
          label: "介護保険料（現年分）収入額",
          unit: "円",
          points: data.series.premiumRevenue,
          provenance: data.provenance.premiumRevenue,
        },
      ],
    },
    {
      id: "source",
      title: "データの出典",
      kind: "source",
      sourcePage: data.sourcePage,
    },
  ];

  const shareUrl = buildShareUrl({
    text: `${place.municipalityLabel}の介護、この5年で何が変わった？ #税金で何が変わった`,
    path: context.href,
  });

  const recapGroups: RecapGroup[] = [
    {
      scope: "municipality",
      chipLabel: place.municipalityLabel,
      title: "需要と受け皿",
      items: [
        `第1号被保険者 ${formatPeople(data.series.insured[0].value)} → ${formatPeople(data.series.insured.at(-1)!.value)}（5年 ${changePct(data.series.insured) >= 0 ? "↑" : "↓"}${Math.abs(changePct(data.series.insured)).toFixed(1)}%）`,
        `認定者 ${formatPeople(data.series.certified[0].value)} → ${formatPeople(data.series.certified.at(-1)!.value)}（5年 ${changePct(data.series.certified) >= 0 ? "↑" : "↓"}${Math.abs(changePct(data.series.certified)).toFixed(1)}%）`,
        `給付総額 ${formatBillions(data.series.benefits[0].value)} → ${formatBillions(data.series.benefits.at(-1)!.value)}（5年 ${changePct(data.series.benefits) >= 0 ? "↑" : "↓"}${Math.abs(changePct(data.series.benefits)).toFixed(1)}%）`,
        serviceUnitCount?.length
          ? `提供されているサービス数 ${serviceUnitCount[0].value.toLocaleString("ja-JP")} → ${serviceUnitCount.at(-1)!.value.toLocaleString("ja-JP")}（${serviceUnitCount[0].year}→${serviceUnitCount.at(-1)!.year}）`
          : "提供されているサービス数は、今回は掲載していません。",
      ],
    },
    ...(availability.showSupportAct
      ? [
          {
            scope: availability.localSupportAvailable ? "municipality" : "prefecture-ref",
            chipLabel: availability.localSupportAvailable
              ? place.municipalityLabel
              : `${place.prefectureLabel}参考`,
            title: availability.localSupportAvailable
              ? "支える人と待遇"
              : `支える人と待遇（${place.prefectureLabel}参考）`,
            items: buildSupportRecapItems({
              localSalary: data.series.careWorkerSalary,
              localWorkforce: data.series.careWorkerWorkforce,
              prefectureReference,
              prefectureLabel: place.prefectureLabel,
              localSupportAvailable: availability.localSupportAvailable,
            }),
          } satisfies RecapGroup,
        ]
      : []),
    {
      scope: "municipality-policy",
      chipLabel: place.municipalityLabel,
      title: "介護保険料基準月額",
      items: premiumStandard.periods.map(
        (period) => `${period.label}（${period.range}）基準月額 ${period.value.toLocaleString("ja-JP")}円`,
      ),
    },
  ];

  const seriesColors = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"];
  const eventContext = {
    municipalityId: context.municipality.id,
    topicId: context.topic.id,
  };
  const openingEvents = resolveTimelineEvents({
    ...eventContext,
    chartId: "opening",
    series: act1Series,
  });
  const serviceUnitEvents = resolveTimelineEvents({
    ...eventContext,
    chartId: "act2-service-units",
    series: serviceUnitCount?.length ? [{ points: serviceUnitCount }] : [],
  });

  return (
    <>
      <SiteTopbar variant="story" active="home" context={context} />
      <main id="main" tabIndex={-1}>
        <header className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow"><span className="dot" />{place.municipalityLabel} · 介護 · 直近5年</p>
            <h1>自分の街は、<br /><em>どう変わった？</em></h1>
            <p>{place.municipalityLabel}の介護に関する主要な数字が、5年間でどう変わったかをたどります。</p>
          </div>
          <div className="hero-bottom">
            <div><span>対象</span><strong>{place.municipalityLabel} / 介護 / 直近5年間</strong></div>
            <a className="circle-button" href="#story">変化<br />を見る <b aria-hidden="true">↓</b></a>
          </div>
          <div className="hero-mark" aria-hidden="true">05<span>YEARS</span></div>
        </header>

        <StoryExperience
          series={act1Series}
          copy={buildCareStepCopy(act1Series, place.municipalityLabel)}
          label={`${place.municipalityLabel}の${context.topic.label}に関する変化`}
          events={openingEvents}
        />

        <StoryInterlude
          variant="pause"
          eyebrow="Act 1 のまとめ"
          title={
            <>
              介護を必要とする人も、
              <br />
              使われるお金も増えた。
            </>
          }
        >
          <p>では、支える側は？</p>
        </StoryInterlude>

        <StoryAct
          id="act-2"
          eyebrow={`Act 2 — ${place.municipalityLabel}`}
          title="市内で提供される介護サービスの量も、増えた"
          chip={<GeographyChip scope="municipality" label={place.municipalityLabel} />}
        >
          {serviceUnitCount?.length ? (
            <>
              <ChartWithTimelineEvents
                series={[
                  {
                    label: "提供されているサービス数",
                    shortLabel: "サービス数",
                    unit: "単位",
                    color: "var(--series-4)",
                    points: serviceUnitCount,
                  },
                ]}
                events={serviceUnitEvents}
                kicker={place.municipalityLabel}
                heading="介護サービスの提供単位数の推移"
                note="※1つの事業所が複数のサービスを提供する場合、それぞれ1つとして数えています。"
                indexMode={false}
              />
              {serviceUnitCount.length >= 2 ? (
                <p className="act-note">
                  {serviceUnitCount[0].year}年 {serviceUnitCount[0].value.toLocaleString("ja-JP")} →{" "}
                  {serviceUnitCount.at(-1)!.year}年 {serviceUnitCount.at(-1)!.value.toLocaleString("ja-JP")}（
                  {serviceUnitDelta! >= 0 ? "↑" : "↓"}
                  {Math.abs(serviceUnitDelta!).toFixed(1)}%）
                </p>
              ) : null}
            </>
          ) : (
            <p className="act-note act-pending">
              {place.municipalityLabel}の提供されているサービス数は、同一定義の時系列が揃い次第ここへ掲載します。
            </p>
          )}
        </StoryAct>

        <ActSupportSection
          place={place}
          localSalary={data.series.careWorkerSalary}
          localWorkforce={data.series.careWorkerWorkforce}
          prefectureReference={prefectureReference}
          seriesColors={seriesColors}
        />

        <StoryAct
          id="act-4"
          eyebrow={`Act 4 — ${place.municipalityLabel}・介護保険料基準月額`}
          title="介護保険料の基準額も、上がった"
          chip={<GeographyChip scope="municipality-policy" label={`${place.municipalityLabel}の制度値`} />}
        >
          <PremiumStandardSection
            periods={premiumStandard.periods}
            definition={premiumStandard.definition}
            sourceUrl={premiumStandard.sourceUrl}
          />
        </StoryAct>

        <StoryRecap groups={recapGroups} shareUrl={shareUrl} />

        <DetailAccordion items={detailItems} />
      </main>
      <SiteFooter data={data} context={context} />
    </>
  );
}
