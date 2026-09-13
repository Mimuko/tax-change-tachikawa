import data from "../lib/dashboard-data";
import DetailAccordion, { type DetailItem } from "../components/detail-accordion";
import GeographyChip from "../components/geography-chip";
import PremiumStandardSection from "../components/premium-standard-section";
import SimpleSeriesChart from "../components/simple-series-chart";
import SiteFooter from "../components/site-footer";
import SiteTopbar from "../components/site-topbar";
import StoryAct from "../components/story-act";
import StoryExperience from "../components/story-experience";
import StoryInterlude from "../components/story-interlude";
import StoryRecap from "../components/story-recap";

const formatPeople = (value: number) => `${value.toLocaleString("ja-JP")}人`;
const formatBillions = (value: number) =>
  `${(value / 100_000_000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}億円`;
const changePct = (points: { year: number; value: number }[]) =>
  ((points.at(-1)!.value - points[0].value) / points[0].value) * 100;

export default function Home() {
  const act1Series = [
    { id: "insured", label: "介護保険第1号被保険者数", shortLabel: "加入者", unit: "人", color: "var(--series-1)", points: data.series.insured },
    { id: "certified", label: "要支援・要介護認定者数", shortLabel: "認定者", unit: "人", color: "var(--series-2)", points: data.series.certified },
    { id: "benefits", label: "介護保険給付総額", shortLabel: "給付総額", unit: "円", color: "var(--series-3)", points: data.series.benefits },
  ];

  const serviceUnitCount = data.series.serviceUnitCount;
  const tokyoMetrics = data.reference?.tokyo ?? [];
  const premiumStandard = data.premiumStandard;

  const capacityDetail: DetailItem = serviceUnitCount?.length
    ? {
        id: "capacity",
        title: "サービスの受け皿",
        kind: "metrics",
        metrics: [
          {
            label: "介護サービスの提供単位数",
            unit: "単位",
            points: serviceUnitCount,
            provenance: data.provenance.serviceUnitCount ?? {
              title: "介護サービスの提供単位数",
              definition: "サービスコード×事業所番号の一意組合せ数（立川市）",
              unit: "establishments",
            },
          },
        ],
      }
    : {
        id: "capacity",
        title: "サービスの受け皿",
        kind: "unavailable",
        note: "立川市の提供単位数は本編 Act 2 を参照してください。同一定義の時系列が揃い次第、ここにも年度別の値を追加します。",
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
    {
      id: "workforce",
      title: "支える人",
      kind: "unavailable",
      note: "立川市単位で継続比較できる公開データは確認できていません。東京都の参考値は本編 Act 3 を参照してください。",
    },
    {
      id: "wage",
      title: "待遇",
      kind: "unavailable",
      note: "立川市値として扱える賃金時系列は未確定です。東京都参考の賃金指標は本編 Act 3 を参照してください。",
    },
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

  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent("立川市の介護、この5年で何が変わった？ #税金で何が変わった")}`;

  const recapGroups = [
    {
      variant: "tachikawa" as const,
      title: "需要と受け皿",
      items: [
        `第1号被保険者 ${formatPeople(data.series.insured[0].value)} → ${formatPeople(data.series.insured.at(-1)!.value)}（5年 ${changePct(data.series.insured) >= 0 ? "↑" : "↓"}${Math.abs(changePct(data.series.insured)).toFixed(1)}%）`,
        `認定者 ${formatPeople(data.series.certified[0].value)} → ${formatPeople(data.series.certified.at(-1)!.value)}（5年 ${changePct(data.series.certified) >= 0 ? "↑" : "↓"}${Math.abs(changePct(data.series.certified)).toFixed(1)}%）`,
        `給付総額 ${formatBillions(data.series.benefits[0].value)} → ${formatBillions(data.series.benefits.at(-1)!.value)}`,
        serviceUnitCount?.length
          ? `提供単位数 ${serviceUnitCount[0].value.toLocaleString("ja-JP")} → ${serviceUnitCount.at(-1)!.value.toLocaleString("ja-JP")}単位（${serviceUnitCount[0].year}→${serviceUnitCount.at(-1)!.year}）`
          : "提供単位数はパイプライン接続後に表示予定",
      ],
    },
    {
      variant: "tokyo-ref" as const,
      title: "支える人と待遇（参考）",
      items: tokyoMetrics.length
        ? tokyoMetrics.map((metric) => `${metric.label}（${metric.unit}）の参考推移`)
        : ["東京都参考の指標はパイプライン接続後に表示予定"],
    },
    {
      variant: "tachikawa-policy" as const,
      title: "市民との接点",
      items: premiumStandard.periods.map(
        (period) => `${period.label}（${period.range}）基準月額 ${period.value.toLocaleString("ja-JP")}円`,
      ),
    },
  ];

  const seriesColors = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"];

  return (
    <>
      <SiteTopbar active="home" />
      <main id="main" tabIndex={-1}>
        <header className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow"><span className="dot" />立川市の変化をたどる</p>
            <h1>自分の街は、<br /><em>どう変わった？</em></h1>
            <p>数字を覚えるためではなく、変化に気づくための5年間です。</p>
          </div>
          <div className="hero-bottom">
            <div><span>対象</span><strong>立川市 / 介護 / 直近5年間</strong></div>
            <a className="circle-button" href="#story">変化<br />を見る <b aria-hidden="true">↓</b></a>
          </div>
          <div className="hero-mark" aria-hidden="true">05<span>YEARS</span></div>
        </header>

        <StoryExperience series={act1Series} />

        <StoryInterlude variant="pause" eyebrow="気づきのための間" title="人の変化と、お金の変化。">
          <p>では、それを支える側は？</p>
        </StoryInterlude>

        <StoryAct id="act-2" eyebrow="Act 2 — 受け皿" title="サービスの受け皿は、どう見える？" chip={<GeographyChip variant="tachikawa" />}>
          {serviceUnitCount?.length ? (
            <>
              <SimpleSeriesChart
                series={[
                  {
                    label: "介護サービスの提供単位数",
                    shortLabel: "提供単位数",
                    unit: "単位",
                    color: "var(--series-4)",
                    points: serviceUnitCount,
                  },
                ]}
                kicker="立川市"
                note="介護サービスの提供単位数"
                indexMode={false}
              />
              {data.provenance.serviceUnitCount?.definition ? (
                <p className="act-note">{data.provenance.serviceUnitCount.definition}</p>
              ) : null}
            </>
          ) : (
            <p className="act-note act-pending">
              立川市の提供単位数は、同一定義の時系列データをパイプライン接続後にここへ表示します。
            </p>
          )}
        </StoryAct>

        <StoryInterlude variant="gap" title="立川市単位で、継続比較できる公開データを確認できず">
          <p>
            支える人・待遇について、立川市単位で継続比較できる公開データは、今回の調査範囲では確認できませんでした。
            次の章では、比較の参考として東京都の指標を示します。立川市の実態を直接示すものではありません。
          </p>
        </StoryInterlude>

        <StoryAct
          id="act-3"
          eyebrow="Act 3 — 支える人と待遇"
          title="支える人と、待遇の参考値"
          chip={<GeographyChip variant="tokyo-ref" />}
          className="act-tokyo"
        >
          {tokyoMetrics.length ? (
            <div className="tokyo-metric-stack">
              {tokyoMetrics.map((metric, index) => {
                const points = metric.points.filter((point) => point.value !== null) as { year: number; value: number }[];
                return (
                  <div key={metric.metricId} className="tokyo-metric-block">
                    {points.length >= 2 ? (
                      <SimpleSeriesChart
                        series={[
                          {
                            label: metric.label,
                            shortLabel: metric.label,
                            unit: metric.unit,
                            color: seriesColors[index % seriesColors.length],
                            points,
                          },
                        ]}
                        kicker="東京都参考"
                        note="市区町村値ではなく、東京都の参考指標です。"
                      />
                    ) : null}
                    <p className="act-note">
                      <strong>{metric.label}</strong>（{metric.metricId}）: {metric.provenance?.definition ?? "定義は原典を参照"}
                      {metric.provenance?.note ? ` ${metric.provenance.note}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="act-note act-pending">
              東京都参考の指標（care_worker_fte / care_worker_headcount / care_worker_scheduled_salary_tokyo）は、docs/metrics.md の確定 ID を curated 接続後にここへ表示します。UI側で系列の独自選定はしません。
            </p>
          )}
        </StoryAct>

        <StoryAct
          id="act-4"
          eyebrow="Act 4 — 市民との接点"
          title="保険料の基準月額は、期ごとに決まる"
          chip={<GeographyChip variant="tachikawa-policy" />}
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
      <SiteFooter />
    </>
  );
}
