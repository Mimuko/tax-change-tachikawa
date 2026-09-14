"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Point = { year: number; value: number };
type Series = { id: string; label: string; shortLabel: string; unit: string; color: string; points: Point[] };

const formatValue = (value: number, unit: string) => unit === "人" ? `${value.toLocaleString("ja-JP")}人` : unit === "円" ? `${(value / 100_000_000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}億円` : `${value.toLocaleString("ja-JP")}${unit}`;
const change = (points: Point[]) => ((points.at(-1)!.value - points[0].value) / points[0].value) * 100;

function CumulativeChart({ series, active, enteringId }: { series: Series[]; active: number; enteringId: string | null }) {
  const width = 720, height = 500, left = 58, right = 34, top = 70, bottom = 58;
  const visible = series.slice(0, active + 1);
  const indexed = series.flatMap((item) => item.points.map((point) => point.value / item.points[0].value * 100));
  const min = Math.floor((Math.min(...indexed) - 3) / 5) * 5;
  const max = Math.ceil((Math.max(...indexed) + 3) / 5) * 5;
  const x = (i: number) => left + i * ((width - left - right) / (series[0].points.length - 1));
  const y = (value: number) => top + (max - value) / (max - min) * (height - top - bottom);
  const ticks = Array.from({ length: 5 }, (_, i) => min + i * ((max - min) / 4));

  return (
    <div className="chart-shell">
      <div className="chart-heading">
        <div>
          <p className="chart-kicker">5年間の変化を重ねる</p>
          <p className="ui-label">{series[0].points[0].year}年度を100とした変化</p>
        </div>
        <span className="chart-progress" aria-live="polite" aria-atomic="true">表示中 {active + 1} / {series.length}</span>
      </div>
      <svg className="cumulative-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="chart-title chart-desc">
        <title id="chart-title">表示指標の変化指数</title>
        <desc id="chart-desc">スクロールに合わせて系列が追加されます。現在は{visible.map((item) => item.label).join("、")}を表示しています。</desc>
        {ticks.map((tick) => <g key={tick}><line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} className="grid-line" /><text x={left - 12} y={y(tick) + 5} textAnchor="end" className="axis-label">{tick.toFixed(0)}</text></g>)}
        {series[0].points.map((point, i) => <text key={point.year} x={x(i)} y={height - 20} textAnchor="middle" className="axis-label">{String(point.year).slice(2)}</text>)}
        <text x={left} y={height - 2} className="axis-note">年度</text>
        {visible.map((item) => {
          const values = item.points.map((point) => point.value / item.points[0].value * 100);
          const path = values.map((value, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(value)}`).join(" ");
          const isEntering = enteringId === item.id;
          return (
            <g key={item.id} className="chart-series" style={{ "--series-color": item.color } as React.CSSProperties}>
              <path d={path} className={`series-line${isEntering ? " is-entering" : ""}`} pathLength="1" />
              {values.map((value, i) => <circle key={item.points[i].year} cx={x(i)} cy={y(value)} r={i === values.length - 1 ? 7 : 4} />)}
              <text x={x(values.length - 1) - 8} y={y(values.at(-1)!) - 14} textAnchor="end" className="end-label">{item.shortLabel}</text>
            </g>
          );
        })}
      </svg>
      <div className="legend" aria-label="表示中の指標">
        {visible.map((item) => (
          <div key={item.id} className="legend-item">
            <span className="legend-dot" style={{ background: item.color }} />
            <span>{item.shortLabel}</span>
            <strong>{change(item.points) >= 0 ? "↑" : "↓"} {Math.abs(change(item.points)).toFixed(1)}%</strong>
          </div>
        ))}
      </div>
      <p className="chart-note">単位の違う指標を変化率で比べるため、最初の年度を100に揃えています。</p>
    </div>
  );
}

function StepDetails({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`step-details${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="step-details-summary"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{label}</span>
        <span className="step-details-plus" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <div className="step-details-panel" inert={!open}>
        <div className="step-details-panel-inner">{children}</div>
      </div>
    </div>
  );
}

export default function StoryExperience({ series, copy, label }: { series: Series[]; copy: { eyebrow: string; title: string; body: string }[]; label: string }) {
  const [active, setActive] = useState(0);
  const [enteringId, setEnteringId] = useState<string | null>(series[0]?.id ?? null);
  const steps = useRef<(HTMLElement | null)[]>([]);
  const activeRef = useRef(0);
  const drawnMaxRef = useRef(0);

  const applyActive = useCallback((index: number) => {
    if (index === activeRef.current) return;
    const prev = activeRef.current;
    activeRef.current = index;
    setActive(index);
    if (index > prev && index > drawnMaxRef.current) {
      drawnMaxRef.current = index;
      setEnteringId(series[index]?.id ?? null);
    } else {
      setEnteringId(null);
    }
  }, [series]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.25)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      applyActive(Number((visible.target as HTMLElement).dataset.step));
    }, { rootMargin: "-35% 0px -40%", threshold: [0.25, 0.5, 0.75] });
    steps.current.forEach((step) => step && observer.observe(step));
    return () => observer.disconnect();
  }, [applyActive]);


  return (
    <section className="scrolly" id="story" aria-label={label}>
      <div className="narrative">
        {copy.map((step, index) => {
          const item = series[index], delta = change(item.points), latest = item.points.at(-1)!;
          return (
            <article
              key={item.id}
              id={`story-step-${index}`}
              ref={(node) => { steps.current[index] = node; }}
              data-step={index}
              className={`story-step ${active === index ? "is-active" : ""}`}
              aria-current={active === index ? "step" : undefined}
            >
              <p className="step-eyebrow">{step.eyebrow}</p>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
              <div className="step-stat">
                <span>{item.points[0].year} → {latest.year}</span>
                <strong>{delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%</strong>
                <small>最新値 {formatValue(latest.value, item.unit)}</small>
              </div>
              <StepDetails label="年度別の値と定義を見る">
                <table>
                  <caption>{item.label}</caption>
                  <thead><tr><th scope="col">年度</th><th scope="col">値</th></tr></thead>
                  <tbody>{item.points.map((point) => <tr key={point.year}><th scope="row">{point.year}</th><td>{formatValue(point.value, item.unit)}</td></tr>)}</tbody>
                </table>
              </StepDetails>
            </article>
          );
        })}
      </div>
      <aside className="visual-stage" aria-label="変化を重ねたグラフ"><CumulativeChart series={series} active={active} enteringId={enteringId} /></aside>
    </section>
  );
}
