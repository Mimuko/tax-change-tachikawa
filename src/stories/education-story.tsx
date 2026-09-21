import type { EducationDashboardData } from "../types/education-dashboard";
import type { StoryContext } from "../lib/story-registry";
import { formatDataGapPublicText, resolveDataGapCopy } from "../lib/data-gap-copy";
import { buildShareUrl } from "../lib/site-url";
import { resolveTimelineEvents } from "../lib/timeline-events";
import { buildEducationStepCopy } from "./education-copy";
import DetailAccordion, { type DetailItem } from "../components/detail-accordion";
import GeographyChip from "../components/geography-chip";
import ChartWithTimelineEvents from "../components/timeline-events-panel";
import SimpleSeriesChart from "../components/simple-series-chart";
import SiteFooter from "../components/site-footer";
import SiteTopbar from "../components/site-topbar";
import StoryAct from "../components/story-act";
import StoryExperience from "../components/story-experience";
import StoryInterlude from "../components/story-interlude";
import StoryRecap, { type RecapGroup } from "../components/story-recap";
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

export default function EducationStory({
  data,
  context,
}: {
  data: EducationDashboardData;
  context: StoryContext;
}) {
  const { place } = data;
  const refusalGap = data.gaps?.find((gap) => gap.id === "non_attendance_school_refusal");
  const costGap = data.gaps?.find((gap) => gap.id === "per_student_education_cost");
  const refusalCopy = refusalGap
    ? resolveDataGapCopy(refusalGap, { place: place.municipalityLabel, label: "不登校" })
    : null;
  const costCopy = costGap
    ? resolveDataGapCopy(costGap, { place: place.municipalityLabel, label: "1人あたりの教育費" })
    : null;

  const act1Series = context.story.opening.map((step) => {
    const definition = context.topic.metrics[step.metricId];
    const points = data.series[step.seriesKey as keyof EducationDashboardData["series"]];
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
      id: "students",
      title: "児童・生徒",
      kind: "metrics",
      metrics: [
        {
          label: "市立小学校児童数",
          unit: "人",
          points: data.series.elemStudents,
          provenance: data.provenance.elemStudents,
        },
        {
          label: "市立中学校生徒数",
          unit: "人",
          points: data.series.junStudents,
          provenance: data.provenance.junStudents,
        },
      ],
    },
    {
      id: "classes",
      title: "学級",
      kind: "metrics",
      metrics: [
        {
          label: "市立小学校通常学級数",
          unit: "学級",
          points: data.series.elemClasses,
          provenance: data.provenance.elemClasses,
        },
        {
          label: "市立小学校特別支援学級数",
          unit: "学級",
          points: data.series.elemSpecialSupportClasses,
          provenance: data.provenance.elemSpecialSupportClasses,
        },
      ],
    },
    {
      id: "staff",
      title: "教職員",
      kind: "metrics",
      metrics: [
        {
          label: "市立小学校教職員数",
          unit: "人",
          points: data.series.elemStaff,
          provenance: data.provenance.elemStaff,
        },
        {
          label: "市立中学校教職員数",
          unit: "人",
          points: data.series.junStaff,
          provenance: data.provenance.junStaff,
        },
      ],
    },
    {
      id: "consultation",
      title: "教育相談",
      kind: "metrics",
      metrics: [
        {
          label: "教育相談件数",
          unit: "件",
          points: data.series.educationConsultationCases,
          provenance: data.provenance.educationConsultationCases,
        },
      ],
    },
    {
      id: "cost",
      title: "1人あたり教育費",
      kind: "unavailable",
      note:
        (costCopy && formatDataGapPublicText(costCopy)) ??
        "立川市の教育費データはありますが、複数年を同じ条件で比較できるか確認中のため、今回は推移には掲載していません。公表値は会計年度の実績です。児童生徒数から独自に1人あたりの金額を計算することはしていません。",
    },
    {
      id: "refusal",
      title: "不登校",
      kind: "unavailable",
      note:
        (refusalCopy && formatDataGapPublicText(refusalCopy)) ??
        "立川市だけの不登校の年次推移を確認できるデータはありません。文部科学省の調査は都道府県・指定都市単位で公表されています。東京都全体の値は、立川市の実績としては扱っていません。",
    },
    {
      id: "source",
      title: "データの出典",
      kind: "source",
      sourcePage: data.sourcePage,
    },
  ];

  const shareUrl = buildShareUrl({
    text: `${place.municipalityLabel}の教育、この数年で何が変わった？ #税金で何が変わった`,
    path: context.href,
  });

  const recapGroups: RecapGroup[] = [
    {
      scope: "municipality",
      chipLabel: place.municipalityLabel,
      title: "児童・生徒（5月1日現在）",
      items: [
        formatMetricRecap({ label: "小学校児童数", unit: "人", points: data.series.elemStudents }),
        formatMetricRecap({ label: "中学校生徒数", unit: "人", points: data.series.junStudents }),
      ],
    },
    {
      scope: "municipality",
      chipLabel: place.municipalityLabel,
      title: "学級（5月1日現在）",
      items: [
        formatMetricRecap({ label: "小学校/通常学級", unit: "学級", points: data.series.elemClasses }),
        formatMetricRecap({
          label: "小学校/特別支援学級",
          unit: "学級",
          points: data.series.elemSpecialSupportClasses,
        }),
      ],
    },
    {
      scope: "municipality",
      chipLabel: place.municipalityLabel,
      title: "教職員（5月1日現在）",
      items: [
        formatMetricRecap({ label: "小学校教職員", unit: "人", points: data.series.elemStaff }),
        formatMetricRecap({ label: "中学校教職員", unit: "人", points: data.series.junStaff }),
      ],
    },
    {
      scope: "municipality",
      chipLabel: place.municipalityLabel,
      title: "教育相談（年度内件数）",
      items: [
        formatMetricRecap({
          label: "相談件数",
          unit: "件",
          points: data.series.educationConsultationCases,
        }),
      ],
    },
    {
      scope: "municipality",
      chipLabel: place.municipalityLabel,
      title: "年次推移として掲載していないもの",
      items: [
        "不登校：立川市だけの年次データがないため、掲載していません。",
        "1人あたり教育費：複数年を同じ条件で比較できるか確認中のため、掲載していません。",
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
  const classEvents = resolveTimelineEvents({
    ...eventContext,
    chartId: "act-classes",
    series: [
      { points: data.series.elemClasses },
      { points: data.series.elemSpecialSupportClasses },
    ],
  });
  const consultationEvents = resolveTimelineEvents({
    ...eventContext,
    chartId: "act3-consultation",
    series: [{ points: data.series.educationConsultationCases }],
  });

  return (
    <>
      <SiteTopbar variant="story" active="home" context={context} />
      <main id="main" tabIndex={-1}>
        <header className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="dot" />
              {place.municipalityLabel} · 教育 · 市立小中
            </p>
            <h1>
              自分の街は、
              <br />
              <em>どう変わった？</em>
            </h1>
            <p>
              {place.municipalityLabel}
              の市立小中学校に関する公開データが、数年でどう変わったかをたどります。時点値と年間累計は分けて示します。
            </p>
          </div>
          <div className="hero-bottom">
            <div>
              <span>対象</span>
              <strong>
                {place.municipalityLabel} / 教育 / {data.series.elemStudents[0]?.year}–
                {data.latestFiscalYear}
              </strong>
            </div>
            <a className="circle-button" href="#story">
              変化
              <br />
              を見る <b aria-hidden="true">↓</b>
            </a>
          </div>
          <div className="hero-mark" aria-hidden="true">
            {String(data.latestFiscalYear - data.series.elemStudents[0]!.year + 1).padStart(2, "0")}
            <span>YEARS</span>
          </div>
        </header>

        <StoryExperience
          series={act1Series}
          copy={buildEducationStepCopy(act1Series, place.municipalityLabel)}
          label={`${place.municipalityLabel}の${context.topic.label}に関する変化`}
          events={openingEvents}
        />

        <StoryInterlude
          variant="pause"
          eyebrow="Act 1 のまとめ"
          title="児童・生徒の数は、大きな変化はない"
        >
          <p>では、学級の数と支援の形は？</p>
        </StoryInterlude>

        <StoryAct
          id="act-classes"
          eyebrow={`Interlude — ${place.municipalityLabel}`}
          title="児童の数より、クラスの数と支援の形が変わっている"
          chip={<GeographyChip scope="municipality" label={place.municipalityLabel} />}
        >
          <ChartWithTimelineEvents
            series={[
              {
                label: "市立小学校通常学級数",
                shortLabel: "小学校/通常学級",
                unit: "学級",
                color: "var(--series-3)",
                points: data.series.elemClasses,
              },
              {
                label: "市立小学校特別支援学級数",
                shortLabel: "小学校/特別支援学級",
                unit: "学級",
                color: "var(--series-4)",
                points: data.series.elemSpecialSupportClasses,
              },
            ]}
            events={classEvents}
            kicker={`${place.municipalityLabel} · 各年5月1日現在`}
            heading="市立小学校の学級数の推移"
            note="※通常学級と特別支援学級は別系列です。合算しません。"
            indexMode={false}
          />
          {seriesNote(data.series.elemSpecialSupportClasses, "学級")}
        </StoryAct>

        <StoryAct
          id="act-2"
          eyebrow={`Act 2 — ${place.municipalityLabel}`}
          title="支える側の人数は、増えている"
          chip={<GeographyChip scope="municipality" label={place.municipalityLabel} />}
        >
          <SimpleSeriesChart
            series={[
              {
                label: "市立小学校教職員数",
                shortLabel: "小学校教職員",
                unit: "人",
                color: "var(--series-1)",
                points: data.series.elemStaff,
              },
              {
                label: "市立中学校教職員数",
                shortLabel: "中学校教職員",
                unit: "人",
                color: "var(--series-2)",
                points: data.series.junStaff,
              },
            ]}
            kicker={`${place.municipalityLabel} · 各年5月1日現在`}
            heading="市立小中の教職員数の推移"
            note="※小学校と中学校は別系列です、合算はしていません。教員以外の教職員を含んでいます。"
            indexMode={false}
          />
          {seriesNote(data.series.elemStaff, "人")}
          {seriesNote(data.series.junStaff, "人")}
        </StoryAct>

        <StoryInterlude
          variant="gap"
          eyebrow="データのすきま"
          title={
            <>
              立川市だけの不登校の年次推移を
              <br />
              確認できるデータはありません。
            </>
          }
        >
          <p>
            {refusalGap?.reason ??
              "文部科学省の調査は都道府県・指定都市単位で公表されています。東京都全体の値は、立川市の実績としては扱っていません。"}
            <br />
            {refusalGap?.note ??
              "また、市が公表している『不就学』は『不登校』とは定義が異なるため、代替指標としては使用していません。"}
          </p>
          {place.links?.mextSchoolRefusalSurvey ? (
            <p>
              <a href={place.links.mextSchoolRefusalSurvey} target="_blank" rel="noopener noreferrer">
                文科省・不登校等調査（e-Stat）を見る ↗
              </a>
            </p>
          ) : null}
        </StoryInterlude>

        <StoryAct
          id="act-3"
          eyebrow={`Act 3 — ${place.municipalityLabel}・教育相談`}
          title="教育相談の件数は、増えている"
          chip={<GeographyChip scope="municipality" label={place.municipalityLabel} />}
        >
          <ChartWithTimelineEvents
            series={[
              {
                label: "教育相談件数",
                shortLabel: "相談件数",
                unit: "件",
                color: "var(--series-3)",
                points: data.series.educationConsultationCases,
              },
            ]}
            events={consultationEvents}
            kicker={`${place.municipalityLabel} · 年度内の累計件数`}
            heading="教育相談件数の推移"
            note="※年間累計です。5月1日時点の児童生徒数とは期間種別が異なります。2014年度以降の系列を使用しています。"
            indexMode={false}
          />
          {seriesNote(data.series.educationConsultationCases, "件")}
        </StoryAct>

        <StoryAct
          id="act-4"
          eyebrow={`Act 4 — ${place.municipalityLabel}・教育費`}
          title="1人あたりの公費支出は、どう変わったか"
          chip={<GeographyChip scope="municipality" label={place.municipalityLabel} />}
        >
          {data.series.elemPerStudentCost?.length && data.series.junPerStudentCost?.length ? (
            <SimpleSeriesChart
              series={[
                {
                  label: "小学校 児童1人あたり学校教育費",
                  shortLabel: "小・1人あたり",
                  unit: "円",
                  color: "var(--series-1)",
                  points: data.series.elemPerStudentCost,
                },
                {
                  label: "中学校 生徒1人あたり学校教育費",
                  shortLabel: "中・1人あたり",
                  unit: "円",
                  color: "var(--series-2)",
                  points: data.series.junPerStudentCost,
                },
              ]}
              kicker={`${place.municipalityLabel} · 会計年度実績`}
              heading="児童生徒1人あたり学校教育費"
              note="※東京都地方教育費調査の公表値です。5月1日児童数を分母に再計算していません。"
              indexMode={false}
            />
          ) : (
            <p className="act-note act-pending">
              {(costCopy && formatDataGapPublicText(costCopy)) ??
                "立川市の教育費データはありますが、複数年を同じ条件で比較できるか確認中のため、今回は推移には掲載していません。公表値は会計年度の実績です。児童生徒数から独自に1人あたりの金額を計算することはしていません。"}
              {place.links?.tokyoEducationExpenseSurvey ? (
                <>
                  {" "}
                  <a
                    href={place.links.tokyoEducationExpenseSurvey}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    地方教育費調査を見る ↗
                  </a>
                </>
              ) : null}
            </p>
          )}
        </StoryAct>

        <StoryRecap groups={recapGroups} shareUrl={shareUrl} />
        <DetailAccordion items={detailItems} />
      </main>
      <SiteFooter data={data} context={context} />
    </>
  );
}
