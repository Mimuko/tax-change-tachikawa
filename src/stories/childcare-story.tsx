import type { ChildcareDashboardData } from "../types/childcare-dashboard";
import type { DataPoint } from "../types/dashboard";
import type { StoryContext } from "../lib/story-registry";
import { buildShareUrl } from "../lib/site-url";
import { resolveTimelineEvents } from "../lib/timeline-events";
import ChartWithTimelineEvents from "../components/timeline-events-panel";
import DetailAccordion, { type DetailItem } from "../components/detail-accordion";
import SiteFooter from "../components/site-footer";
import SiteTopbar from "../components/site-topbar";
import StoryAct from "../components/story-act";
import StoryExperience from "../components/story-experience";
import StoryInterlude from "../components/story-interlude";
import StoryRecap, { type RecapGroup } from "../components/story-recap";

function summary(label: string, unit: string, points: DataPoint[]) {
  const first = points[0], last = points.at(-1)!;
  const rate = ((last.value - first.value) / first.value) * 100;
  return `${label}: ${first.year}年 ${first.value.toLocaleString("ja-JP")} → ${last.year}年 ${last.value.toLocaleString("ja-JP")}${unit}（${rate >= 0 ? "↑" : "↓"}${Math.abs(rate).toFixed(1)}%）`;
}

export default function ChildcareStory({ data, context }: { data: ChildcareDashboardData; context: StoryContext }) {
  const { place, series, provenance } = data;
  const opening = context.story.opening.map((step) => {
    const key = step.seriesKey as keyof typeof series;
    const metric = context.topic.metrics[step.metricId];
    return { id: step.metricId, label: metric.label, shortLabel: step.shortLabel, unit: metric.unit, color: step.color, points: series[key] };
  });
  const eventContext = { municipalityId: context.municipality.id, topicId: context.topic.id };
  const details: DetailItem[] = [
    { id: "nursery", title: "保育の受け皿と利用", kind: "metrics", metrics: [
      { label: "保育園の定員総数", unit: "人", points: series.capacity, provenance: provenance.capacity },
      { label: "保育の実施児童数", unit: "人", points: series.enrolled, provenance: provenance.enrolled },
      { label: "保育園の職員数", unit: "人", points: series.staff, provenance: provenance.staff },
    ] },
    { id: "consultation", title: "子育て相談", kind: "metrics", metrics: [
      { label: "子育て相談件数", unit: "件", points: series.consultations, provenance: provenance.consultations },
    ] },
    { id: "waitlist", title: "待機児童数", kind: "unavailable", note: "この原表には待機児童の年次系列がありません。定員と実施児童数の差は待機児童数として扱いません。" },
    { id: "reach", title: "相談の到達率", kind: "unavailable", note: "相談件数は延べ件数です。支援を必要とする家庭の総数が分からないため、相談へ到達した割合は算出していません。" },
    { id: "source", title: "データの出典", kind: "source", sourcePage: data.sourcePage },
  ];
  const recap: RecapGroup[] = [
    { scope: "municipality", chipLabel: place.municipalityLabel, title: "保育園の受け皿と利用（各年の公表値）", items: [summary("定員", "人", series.capacity), summary("実施児童", "人", series.enrolled), summary("職員", "人", series.staff)] },
    { scope: "municipality", chipLabel: place.municipalityLabel, title: "子育て相談（年度内の延べ件数）", items: [summary("相談", "件", series.consultations)] },
  ];
  return <>
    <SiteTopbar active="home" context={context} />
    <main id="main" tabIndex={-1}>
      <header className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="dot" aria-hidden="true" />{place.municipalityLabel} · 保育と子育て相談</p>
          <h1>自分の街は、<br /><em>どう変わった？</em></h1>
          <p>保育園の定員と実施児童数、その後に職員数と子育て相談の推移を見ます。相談件数は年度内の延べ件数として分けて示します。</p>
        </div>
        <div className="hero-bottom"><div><span>対象</span><strong>{place.municipalityLabel} / 保育と子育て相談 / 2019–2023</strong></div><a className="circle-button" href="#story">変化<br />を見る <b aria-hidden="true">↓</b></a></div>
        <div className="hero-mark" aria-hidden="true">05<span>YEARS</span></div>
      </header>
      <StoryExperience
        series={opening}
        copy={[
          { eyebrow: "受け皿 · 定員", title: "保育園の定員は、ほぼ横ばい", body: "2019年から2023年まで、全園の定員総数はわずかに増えています。" },
          { eyebrow: "利用 · 実施児童", title: "実施児童数は、減っている", body: "同じ期間の実施児童数を重ねます。定員との差は待機児童数を意味しません。" },
        ]}
        label={`${place.municipalityLabel}の保育園の定員と実施児童数`}
        events={resolveTimelineEvents({ ...eventContext, chartId: "opening", series: opening })}
      />
      <StoryInterlude variant="pause" eyebrow="次の問い" title="受け皿を支える人は、どう動いたか">
        <p>定員と利用の数字だけでは、保育の状況全体は分かりません。職員数も同じ原表で確認します。</p>
      </StoryInterlude>
      <StoryAct id="staff" eyebrow={`${place.municipalityLabel}・保育園の職員`} title="職員数は、2019年より少ない">
        <ChartWithTimelineEvents series={[{ label: "保育園の職員数", shortLabel: "職員", unit: "人", color: "var(--series-3)", points: series.staff }]} events={resolveTimelineEvents({ ...eventContext, chartId: "staff", series: [{ points: series.staff }] })} kicker={`${place.municipalityLabel} · 各年の公表値`} heading="保育園の職員数の推移" note="※全園の人数です。常勤換算ではなく、保育の質を示す値でもありません。" indexMode={false} />
        <p className="act-note">{summary("職員", "人", series.staff)}</p>
      </StoryAct>
      <StoryAct id="consultation" eyebrow={`${place.municipalityLabel}・子ども家庭支援センター`} title="子育て相談の延べ件数は、増えている">
        <ChartWithTimelineEvents series={[{ label: "子育て相談件数", shortLabel: "相談", unit: "件", color: "var(--series-4)", points: series.consultations }]} events={resolveTimelineEvents({ ...eventContext, chartId: "consultation", series: [{ points: series.consultations }] })} kicker={`${place.municipalityLabel} · 年度内の延べ件数`} heading="子育て相談事業の相談件数" note="※相談した人数・世帯数ではありません。保育園の年次値とは期間種別が異なります。" indexMode={false} />
        <p className="act-note">{summary("相談", "件", series.consultations)}</p>
        <p className="act-note">相談件数から、支援を必要とする家庭に届いた割合は分かりません。保育の実施児童数や定員を分母にして接続率を作ることはしていません。</p>
      </StoryAct>
      <StoryInterlude variant="gap" eyebrow="データのすきま" title="待機児童の変化は、この原表からは分からない">
        <p>{data.gaps[0].reason}</p>
      </StoryInterlude>
      <StoryRecap groups={recap} shareUrl={buildShareUrl({ text: `${place.municipalityLabel}の子育て、この数年で何が変わった？ #税金で何が変わった`, path: context.href })} />
      <DetailAccordion items={details} />
    </main>
    <SiteFooter data={data} context={context} />
  </>;
}
