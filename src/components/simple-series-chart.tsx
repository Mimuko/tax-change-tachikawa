import type { CSSProperties } from "react";

type Point = { year: number; value: number };

export type SimpleSeries = {
  label: string;
  shortLabel?: string;
  unit: string;
  color: string;
  points: Point[];
};

const formatValue = (value: number, unit: string) => {
  if (unit === "人" || unit === "fte" || unit === "常勤換算") {
    return `${value.toLocaleString("ja-JP")}${unit === "人" ? "人" : unit === "fte" ? "" : unit}`;
  }
  if (unit === "単位" || unit === "establishments") {
    return `${value.toLocaleString("ja-JP")}単位`;
  }
  if (unit === "円" || unit.includes("円")) {
    if (value >= 100_000_000) {
      return `${(value / 100_000_000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}億円`;
    }
    return `${value.toLocaleString("ja-JP")}円`;
  }
  return value.toLocaleString("ja-JP");
};

const change = (points: Point[]) => ((points.at(-1)!.value - points[0].value) / points[0].value) * 100;

export default function SimpleSeriesChart({
  series,
  kicker,
  heading,
  note,
  indexMode = true,
}: {
  series: SimpleSeries[];
  kicker?: string;
  heading?: string;
  note?: string;
  indexMode?: boolean;
}) {
  const width = 640;
  const height = 320;
  const left = 52;
  const right = 28;
  const top = 48;
  const bottom = 44;

  const pointCount = series[0]?.points.length ?? 0;
  if (pointCount < 2) return null;

  const indexed = indexMode
    ? series.flatMap((item) => item.points.map((point) => (point.value / item.points[0].value) * 100))
    : series.flatMap((item) => item.points.map((point) => point.value));

  const min = indexMode ? Math.floor((Math.min(...indexed) - 3) / 5) * 5 : Math.min(...indexed) * 0.95;
  const max = indexMode ? Math.ceil((Math.max(...indexed) + 3) / 5) * 5 : Math.max(...indexed) * 1.05;
  const x = (i: number) => left + i * ((width - left - right) / (pointCount - 1));
  const y = (value: number) => top + ((max - value) / (max - min)) * (height - top - bottom);
  const ticks = Array.from({ length: 5 }, (_, i) => min + (i * (max - min)) / 4);

  return (
    <div className="simple-chart-shell">
      <div className="chart-heading">
        <div>
          {kicker ? <p className="chart-kicker">{kicker}</p> : null}
          <p className="ui-label">
            {heading ?? (indexMode ? "初年度を100とした変化" : series[0].label)}
          </p>
        </div>
      </div>
      <svg className="simple-series-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={series.map((item) => item.label).join("、")}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} className="grid-line" />
            <text x={left - 10} y={y(tick) + 4} textAnchor="end" className="axis-label">
              {indexMode ? tick.toFixed(0) : tick.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}
            </text>
          </g>
        ))}
        {series[0].points.map((point, i) => (
          <text key={point.year} x={x(i)} y={height - 16} textAnchor="middle" className="axis-label">
            {String(point.year).slice(2)}
          </text>
        ))}
        {series.map((item) => {
          const values = indexMode
            ? item.points.map((point) => (point.value / item.points[0].value) * 100)
            : item.points.map((point) => point.value);
          const path = values.map((value, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(value)}`).join(" ");
          return (
            <g key={item.label} className="chart-series" style={{ "--series-color": item.color } as CSSProperties}>
              <path d={path} className="series-line" pathLength="1" />
              {values.map((value, i) => (
                <circle key={item.points[i].year} cx={x(i)} cy={y(value)} r={i === values.length - 1 ? 6 : 3} />
              ))}
              <text x={x(values.length - 1) - 6} y={y(values.at(-1)!) - 12} textAnchor="end" className="end-label">
                {item.shortLabel ?? item.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="legend" aria-label="表示中の指標">
        {series.map((item) => {
          const delta = change(item.points);
          const latest = item.points.at(-1)!;
          return (
            <div key={item.label} className="legend-item">
              <span className="legend-dot" style={{ background: item.color }} />
              <span>{item.shortLabel ?? item.label}</span>
              <strong>
                {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%
              </strong>
              <span className="legend-latest">{formatValue(latest.value, item.unit)}</span>
            </div>
          );
        })}
      </div>
      {note ? <p className="chart-note">{note}</p> : null}
    </div>
  );
}
