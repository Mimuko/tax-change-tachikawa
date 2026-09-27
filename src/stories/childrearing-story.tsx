import type { ChildrearingDashboardData } from "../types/childrearing-dashboard";
import type { StoryContext } from "../lib/story-registry";
import { formatDataGapPublicText, resolveDataGapCopy } from "../lib/data-gap-copy";
import { buildShareUrl } from "../lib/site-url";
import { resolveTimelineEvents } from "../lib/timeline-events";
import { buildChildrearingStepCopy } from "./childrearing-copy";
import DetailAccordion, { type DetailItem } from "../components/detail-accordion";
import ChartWithTimelineEvents from "../components/timeline-events-panel";
import SimpleSeriesChart from "../components/simple-series-chart";
import SiteFooter from "../components/site-footer";
import SiteTopbar from "../components/site-topbar";
import StoryAct from "../components/story-act";
import StoryExperience from "../components/story-experience";
import StoryInterlude, { DataGapInterlude } from "../components/story-interlude";
import StoryRecap, { type RecapGroup } from "../components/story-recap";
import SupportConnectionSection from "../components/support-connection-section";
import { formatSupportConnectionRecapItems } from "../lib/support-connection-recap";
import { buildSupportConnectionDetailItem } from "../lib/support-connection-detail";
import type { DataPoint } from "../types/dashboard";

const changePct = (points: { year: number; value: number }[]) =>
  ((points.at(-1)!.value - points[0].value) / points[0].value) * 100;

function formatMetricRecap(metric: { label: string; unit: string; points: DataPoint[] }, suffix = "") {
  const points = metric.points.filter((point) => point.value !== null) as { year: number; value: number }[];
  if (points.length < 2) return `${metric.label}${suffix}`;
  const delta = changePct(points);
  const first = points[0];
  const last = points.at(-1)!;
  return `${metric.label} ${first.value.toLocaleString("ja-JP")} → ${last.value.toLocaleString("ja-JP")}${metric.unit}（${first.year}→${last.year} ${delta >= 0 ? "↑" : "↓"}${Math.abs(delta).toFixed(1)}%）${suffix}`;
}

function seriesNote(points: DataPoint[] | undefined, label: string) {
  if (!points || points.length < 2) return null;
  const delta = changePct(points);
  return (
    <p className="act-note">
      {points[0].year}年 {points[0].value.toLocaleString("ja-JP")} → {points.at(-1)!.year}年{" "}
      {points.at(-1)!.value.toLocaleString("ja-JP")}
      {label}（{delta >= 0 ? "↑" : "↓"}
      {Math.abs(delta).toFixed(1)}%）
    </p>
  );
}

export default function ChildrearingStory({
  data,
  context,
}: {
  data: ChildrearingDashboardData;
  context: StoryContext;
}) {
  const { place } = data;
  const waitingGap = data.gaps?.find((gap) => gap.id === "nursery_waiting_children");
  const allowanceGap = data.gaps?.find((gap) => gap.id === "child_allowance_unified_trend");
  const waitingCopy = waitingGap
    ? resolveDataGapCopy(waitingGap, { place: place.municipalityLabel, label: "待機児童" })
    : null;
  const allowanceCopy = allowanceGap
    ? resolveDataGapCopy(allowanceGap, { place: place.municipalityLabel, label: "児童手当" })
    : null;
  const supportConnectionDetail = buildSupportConnectionDetailItem(
    data.supportConnection,
    place.municipalityLabel,
  );

  const act1Series = context.story.opening.map((step) => {
    const definition = context.topic.metrics[step.metricId];
    const points = data.series[step.seriesKey as keyof ChildrearingDashboardData["series"]];
    if (!definition || !points?.length) throw new Error(`Invalid story metric: ${step.metricId}`);
    return {
      id: step.metricId,
      label: definition.label,
      unit: definition.unit,
      shortLabel: step.shortLabel,
      color: step.color,
      points,
    };
  });

  const detailItems: DetailItem[] = [
    {
      id: "pregnancy",
      title: "妊娠・手帳",
      kind: "metrics",
      metrics: [
        {
          label: "妊娠届出者数",
          unit: "人",
          points: data.series.pregnancyNotifications,
          provenance: data.provenance.pregnancyNotifications,
        },
        {
          label: "母子健康手帳交付数",
          unit: "件",
          points: data.series.maternityHandbookDeliveries,
          provenance: data.provenance.maternityHandbookDeliveries,
        },
      ],
    },
    {
      id: "nursery",
      title: "保育",
      kind: "metrics",
      metrics: [
        {
          label: "保育園児数",
          unit: "人",
          points: data.series.nurseryChildren,
          provenance: data.provenance.nurseryChildren,
        },
        {
          label: "保育所等定員",
          unit: "人",
          points: data.series.nurseryCapacityTotal,
          provenance: data.provenance.nurseryCapacityTotal,
        },
        {
          label: "保育職員数",
          unit: "人",
          points: data.series.nurseryStaffCount,
          provenance: data.provenance.nurseryStaffCount,
        },
      ],
    },
    {
      id: "afterschool",
      title: "学童",
      kind: "metrics",
      metrics: [
        {
          label: "学童保育登録児童数",
          unit: "人",
          points: data.series.afterschoolRegistrations,
          provenance: data.provenance.afterschoolRegistrations,
        },
      ],
    },
    {
      id: "consultation",
      title: "子育て相談",
      kind: "metrics",
      metrics: [
        {
          label: "子育て相談件数",
          unit: "件",
          points: data.series.childrearingConsultationCases,
          provenance: data.provenance.childrearingConsultationCases,
        },
      ],
    },
    {
      id: "allowance",
      title: "児童手当",
      kind: "unavailable",
      note:
        (allowanceCopy && formatDataGapPublicText(allowanceCopy)) ??
        "児童手当の支給額を、制度改定前後でつないだ単一系列として掲載していません。",
    },
    {
      id: "waiting",
      title: "待機児童",
      kind: "unavailable",
      note:
        (waitingCopy && formatDataGapPublicText(waitingCopy)) ??
        "待機児童数の年次推移を、単一の市区町村系列として確認できていません。",
    },
    ...(supportConnectionDetail ? [supportConnectionDetail] : []),
    {
      id: "source",
      title: "データの出典",
      kind: "source",
      sourcePage: data.sourcePage,
    },
  ];

  const shareUrl = buildShareUrl({
    text: `${place.municipalityLabel}の子育て、この数年で何が変わった？ #税金で何が変わった`,
    path: context.href,
  });

  const recapGroups: RecapGroup[] = [
    {
      scope: "municipality",
      chipLabel: place.municipalityLabel,
      title: "妊娠届出（各年度）",
      items: [
        formatMetricRecap({
          label: "妊娠届出者数",
          unit: "人",
          points: data.series.pregnancyNotifications,
        }),
      ],
    },
    {
      scope: "municipality",
      chipLabel: place.municipalityLabel,
      title: "保育（4月1日現在）",
      items: [
        formatMetricRecap({ label: "保育園児数", unit: "人", points: data.series.nurseryChildren }),
        formatMetricRecap({ label: "定員", unit: "人", points: data.series.nurseryCapacityTotal }),
        formatMetricRecap({ label: "職員", unit: "人", points: data.series.nurseryStaffCount }),
      ],
    },
    {
      scope: "municipality",
      chipLabel: place.municipalityLabel,
      title: "学童（各年度）",
      items: [
        formatMetricRecap({
          label: "登録児童数",
          unit: "人",
          points: data.series.afterschoolRegistrations,
        }),
      ],
    },
    {
      scope: "municipality",
      chipLabel: place.municipalityLabel,
      title: "子育て相談（年度内件数）",
      items: [
        formatMetricRecap({
          label: "相談件数",
          unit: "件",
          points: data.series.childrearingConsultationCases,
        }),
      ],
    },
    ...(data.supportConnection?.indicators.length
      ? [
          {
            scope: "municipality",
            chipLabel: place.municipalityLabel,
            title: "支援への接続",
            items: formatSupportConnectionRecapItems(data.supportConnection),
          } satisfies RecapGroup,
        ]
      : []),
    {
      scope: "municipality",
      chipLabel: place.municipalityLabel,
      title: "年次推移として掲載していないもの",
      items: [
        "待機児童：単純な年次 CSV を PoC 時点で未確認のため、掲載していません。",
        "児童手当：制度改定前後を単一系列として接続していません。",
      ],
    },
  ];

  const eventContext = {
    municipalityId: context.municipality.id,
    topicId: context.topic.id,
  };
  const openingEvents = resolveTimelineEvents({
    ...eventContext,
    chartId: "opening",
    series: act1Series,
  });
  const capacityEvents = resolveTimelineEvents({
    ...eventContext,
    chartId: "act-capacity",
    series: [
      { points: data.series.nurseryCapacityTotal },
      { points: data.series.nurseryStaffCount },
    ],
  });
  const consultationEvents = resolveTimelineEvents({
    ...eventContext,
    chartId: "act-consultation",
    series: [{ points: data.series.childrearingConsultationCases }],
  });

  const startYear = data.series.pregnancyNotifications[0]?.year ?? data.latestFiscalYear;

  return (
    <>
      <SiteTopbar active="home" context={context} />
      <main id="main" tabIndex={-1}>
        <header className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="dot" />
              {place.municipalityLabel} · 子育て · 乳幼児と受け皿
            </p>
            <h1>
              自分の街は、
              <br />
              <em>どう変わった？</em>
            </h1>
            <p>
              {place.municipalityLabel}
              の子育てに関する公開データが、数年でどう変わったかをたどります。年度累計と4月1日時点は分けて示します。
            </p>
          </div>
          <div className="hero-bottom">
            <div>
              <span>対象</span>
              <strong>
                {place.municipalityLabel} / 子育て / {startYear}–{data.latestFiscalYear}
              </strong>
            </div>
            <a className="circle-button" href="#story">
              変化
              <br />
              を見る <b aria-hidden="true">↓</b>
            </a>
          </div>
          <div className="hero-mark" aria-hidden="true">
            {String(data.latestFiscalYear - startYear + 1).padStart(2, "0")}
            <span>YEARS</span>
          </div>
        </header>

        <StoryExperience
          series={act1Series}
          copy={buildChildrearingStepCopy(act1Series, place.municipalityLabel)}
          label={`${place.municipalityLabel}の${context.topic.label}に関する変化`}
          events={openingEvents}
        />

        <StoryInterlude variant="pause" eyebrow="まとめ" title="届出と保育園児の数は、同じ方向とは限らない">
          <p>では、定員・職員・学童は？</p>
        </StoryInterlude>

        <StoryAct
          id="act-capacity"
          eyebrow={`${place.municipalityLabel}・保育と学童`}
          title="受け皿の定員と職員、学童の登録は動いている"
        >
          <ChartWithTimelineEvents
            series={[
              {
                label: "保育所等定員",
                shortLabel: "保育定員",
                unit: "人",
                color: "var(--series-3)",
                points: data.series.nurseryCapacityTotal,
              },
              {
                label: "保育職員数",
                shortLabel: "保育職員",
                unit: "人",
                color: "var(--series-4)",
                points: data.series.nurseryStaffCount,
              },
            ]}
            events={capacityEvents}
            kicker={`${place.municipalityLabel} · 各年4月1日現在（2016–）`}
            heading="保育の定員と職員数の推移"
            note="※全園合計です。2016年以降の園別 CSV から集計しています。"
            indexMode={false}
          />
          {seriesNote(data.series.nurseryCapacityTotal, "人")}
          {seriesNote(data.series.nurseryStaffCount, "人")}
          <SimpleSeriesChart
            series={[
              {
                label: "学童保育登録児童数",
                shortLabel: "学童登録",
                unit: "人",
                color: "var(--series-1)",
                points: data.series.afterschoolRegistrations,
              },
            ]}
            kicker={`${place.municipalityLabel} · 各年度`}
            heading="学童保育登録児童数の推移"
            note="※年度ごとの登録児童数です。4月1日時点の保育園児数とは期間種別が異なります。"
            indexMode={false}
          />
          {seriesNote(data.series.afterschoolRegistrations, "人")}
        </StoryAct>

        <DataGapInterlude
          placeLabel={place.municipalityLabel}
          subject="待機児童の年次推移"
          reason={
            waitingGap?.reason ??
            "PoC 時点では立川市オープンデータで、待機児童の単純な推移 CSV を確認できませんでした。"
          }
          followUp={
            waitingGap?.note ??
            "保育園児数や定員から待機数を推計することはしていません。"
          }
        />

        <StoryAct
          id="act-consultation"
          eyebrow={`${place.municipalityLabel}・子育て相談件数`}
          title="子育て相談の件数は、増えている"
        >
          <ChartWithTimelineEvents
            series={[
              {
                label: "子育て相談件数",
                shortLabel: "相談件数",
                unit: "件",
                color: "var(--series-2)",
                points: data.series.childrearingConsultationCases,
              },
            ]}
            events={consultationEvents}
            kicker={`${place.municipalityLabel} · 各年度末現在の年間件数`}
            heading="子ども家庭支援センター相談件数の推移"
            note="※相談の受付件数です。相談した世帯数や人数ではありません。"
            indexMode={false}
          />
          {seriesNote(data.series.childrearingConsultationCases, "件")}
        </StoryAct>

        {data.supportConnection ? (
          <SupportConnectionSection
            data={data.supportConnection}
            place={place.municipalityLabel}
            id="act-connection"
            eyebrow={`${place.municipalityLabel}・支援への接続`}
            title="相談窓口はある。必要な家庭に、届いているか。"
            lead={`${place.municipalityLabel}には保育・学童・子育て相談の窓口があり、本編で見たとおり規模は動いています。けれど「窓口があること」と「支援が必要な家庭に届いていること」は、同じではありません。`}
            framing={{
              existence: {
                label: "窓口・サービスはある",
                body: "保育定員・職員、学童登録、子育て相談件数は本編のとおり変化しています。",
              },
              delivery: {
                label: "届いているかは、別の問い",
                body: "相談件数の増減だけでは、相談に至らない家庭の有無は分かりません。",
              },
            }}
            readingNote="子育て相談の「件数」は延べの相談数であり、支援が届いた世帯数を示すものではありません。"
          />
        ) : null}

        <StoryRecap groups={recapGroups} shareUrl={shareUrl} />
        <DetailAccordion items={detailItems} />
      </main>
      <SiteFooter data={data} context={context} />
    </>
  );
}
