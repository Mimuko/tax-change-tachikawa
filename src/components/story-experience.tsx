"use client";

import { useEffect, useRef, useState } from "react";

type Point = { year: number; value: number };
type Series = { id: string; label: string; shortLabel: string; unit: string; color: string; points: Point[] };

const formatValue = (value: number, unit: string) => unit === "人" ? `${value.toLocaleString("ja-JP")}人` : `${(value / 100_000_000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}億円`;
const change = (points: Point[]) => ((points.at(-1)!.value - points[0].value) / points[0].value) * 100;

function CumulativeChart({ series, active }: { series: Series[]; active: number }) {
  const width = 720, height = 500, left = 58, right = 34, top = 70, bottom = 58;
  const visible = series.slice(0, active + 1);
  const indexed = series.flatMap((item) => item.points.map((point) => point.value / item.points[0].value * 100));
  const min = Math.floor((Math.min(...indexed) - 3) / 5) * 5;
  const max = Math.ceil((Math.max(...indexed) + 3) / 5) * 5;
  const x = (i: number) => left + i * ((width - left - right) / (series[0].points.length - 1));
  const y = (value: number) => top + (max - value) / (max - min) * (height - top - bottom);
  const ticks = Array.from({ length: 5 }, (_, i) => min + i * ((max - min) / 4));

  return <div className="chart-shell" aria-live="polite">
    <div className="chart-heading"><div><p className="chart-kicker">5年間の変化を重ねる</p><h2>2019年度を100とした変化</h2></div><span>{active + 1} / {series.length}</span></div>
    <svg className="cumulative-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="chart-title chart-desc">
      <title id="chart-title">立川市の介護に関する4指標の変化指数</title>
      <desc id="chart-desc">スクロールに合わせて系列が追加されます。現在は{visible.map((item) => item.label).join("、")}を表示しています。</desc>
      {ticks.map((tick) => <g key={tick}><line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} className="grid-line" /><text x={left - 12} y={y(tick) + 5} textAnchor="end" className="axis-label">{tick.toFixed(0)}</text></g>)}
      {series[0].points.map((point, i) => <text key={point.year} x={x(i)} y={height - 20} textAnchor="middle" className="axis-label">{String(point.year).slice(2)}</text>)}
      <text x={left} y={height - 2} className="axis-note">年度</text>
      {visible.map((item, seriesIndex) => {
        const values = item.points.map((point) => point.value / item.points[0].value * 100);
        const path = values.map((value, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(value)}`).join(" ");
        return <g key={item.id} className="chart-series" style={{ "--series-color": item.color, "--series-delay": `${seriesIndex * 90}ms` } as React.CSSProperties}>
          <path d={path} className="series-line" pathLength="1" />
          {values.map((value, i) => <circle key={item.points[i].year} cx={x(i)} cy={y(value)} r={i === values.length - 1 ? 7 : 4} />)}
          <text x={x(values.length - 1) - 8} y={y(values.at(-1)!) - 14} textAnchor="end" className="end-label">{item.shortLabel}</text>
        </g>;
      })}
    </svg>
    <div className="legend" aria-label="表示中の指標">{visible.map((item) => <div key={item.id} className="legend-item"><span className="legend-dot" style={{ background: item.color }} /><span>{item.shortLabel}</span><strong>{change(item.points) >= 0 ? "↑" : "↓"} {Math.abs(change(item.points)).toFixed(1)}%</strong></div>)}</div>
    <p className="chart-note">単位の違う指標を変化率で比べるため、最初の年度を100に揃えています。</p>
  </div>;
}

export default function StoryExperience({ series }: { series: Series[] }) {
  const [active, setActive] = useState(0);
  const steps = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(Number((visible.target as HTMLElement).dataset.step));
    }, { rootMargin: "-30% 0px -45%", threshold: [0, .25, .5, .75] });
    steps.current.forEach((step) => step && observer.observe(step));
    return () => observer.disconnect();
  }, []);

  const copy = [
    { eyebrow: "01 — 介護を必要とする人", title: "高齢者の加入者は、ほぼ同じ規模で推移", body: "第1号被保険者、つまり65歳以上の加入者数です。大きく跳ねるのではなく、5年間を通して緩やかに変化しています。" },
    { eyebrow: "02 — 認定を受けた人", title: "同じ間に、認定者は増えました", body: "要支援・要介護の認定者総数を重ねます。40〜64歳の第2号被保険者も含むため、加入者数との比率をここでは断定しません。" },
    { eyebrow: "03 — 行政支出", title: "給付総額の線を重ねる", body: "居宅・施設・地域密着型サービスを合わせた給付総額です。認定者と同じ方向に動いていても、因果関係や政策評価を示すものではありません。" },
    { eyebrow: "04 — 市民負担との接点", title: "最後に、保険料収入を見る", body: "現年分の保険料収入を追加します。4本の線は金額や人数そのものではなく、それぞれが2019年度からどの程度変わったかを示しています。" },
  ];

  return <section className="scrolly" id="story">
    <div className="narrative">{copy.map((step, index) => {
      const item = series[index], delta = change(item.points), latest = item.points.at(-1)!;
      return <article key={item.id} ref={(node) => { steps.current[index] = node; }} data-step={index} className={`story-step ${active === index ? "is-active" : ""}`}>
        <p className="step-eyebrow">{step.eyebrow}</p><h2>{step.title}</h2><p>{step.body}</p>
        <div className="step-stat"><span>{item.points[0].year} → {latest.year}</span><strong>{delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%</strong><small>最新値 {formatValue(latest.value, item.unit)}</small></div>
        <details><summary>年度別の値と定義を見る</summary><table><caption>{item.label}</caption><thead><tr><th>年度</th><th>値</th></tr></thead><tbody>{item.points.map((point) => <tr key={point.year}><th>{point.year}</th><td>{formatValue(point.value, item.unit)}</td></tr>)}</tbody></table></details>
      </article>;
    })}</div>
    <aside className="visual-stage"><CumulativeChart series={series} active={active} /></aside>
  </section>;
}
