"use client";

import Link from "next/link";
import { useId, useState } from "react";

type Point = { year: number; value: number };
type Provenance = { title: string; definition: string; unit: string; sha256?: string; note?: string };

type MetricSeries = {
  label: string;
  unit: string;
  points: Point[];
  provenance: Provenance;
};

type PremiumStandard = {
  definition: string;
  sourceUrl: string;
  periods: { label: string; range: string; value: number }[];
};

export type DetailItem =
  | {
      id: string;
      title: string;
      kind: "metrics";
      metrics: MetricSeries[];
    }
  | {
      id: string;
      title: string;
      kind: "premium";
      premiumStandard: PremiumStandard;
      metrics: MetricSeries[];
    }
  | {
      id: string;
      title: string;
      kind: "unavailable";
      note: string;
    }
  | {
      id: string;
      title: string;
      kind: "source";
      sourcePage: string;
    };

const formatValue = (value: number, unit: string) => {
  if (unit === "人") return `${value.toLocaleString("ja-JP")}人`;
  if (unit === "単位" || unit === "establishments") return `${value.toLocaleString("ja-JP")}単位`;
  if (unit === "fte" || unit === "常勤換算") return `${value.toLocaleString("ja-JP")}（常勤換算）`;
  if (unit === "円" || unit.includes("円")) {
    if (value >= 100_000_000) {
      return `${(value / 100_000_000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}億円`;
    }
    return `${value.toLocaleString("ja-JP")}円`;
  }
  return value.toLocaleString("ja-JP");
};

const changePct = (points: Point[]) => ((points.at(-1)!.value - points[0].value) / points[0].value) * 100;
const yoyPct = (points: Point[]) => {
  const latest = points.at(-1)!;
  const prev = points.at(-2);
  if (!prev) return null;
  return ((latest.value - prev.value) / prev.value) * 100;
};

function MetricBlock({ metric }: { metric: MetricSeries }) {
  const points = metric.points;
  const first = points[0];
  const latest = points.at(-1)!;
  const fiveYear = changePct(points);
  const yoy = yoyPct(points);

  return (
    <div className="detail-metric">
      <p className="detail-metric-name">{metric.label}</p>
      <dl className="detail-stats">
        <div>
          <dt>最新値（{latest.year}年度）</dt>
          <dd>{formatValue(latest.value, metric.unit)}</dd>
        </div>
        <div>
          <dt>5年前比（{first.year}→{latest.year}）</dt>
          <dd>{fiveYear >= 0 ? "↑" : "↓"} {Math.abs(fiveYear).toFixed(1)}%</dd>
        </div>
        <div>
          <dt>前年比</dt>
          <dd>{yoy == null ? "比較不可（前年値なし）" : `${yoy >= 0 ? "↑" : "↓"} ${Math.abs(yoy).toFixed(1)}%`}</dd>
        </div>
      </dl>
      <table>
        <caption>{metric.label}（年度別）</caption>
        <thead>
          <tr>
            <th scope="col">年度</th>
            <th scope="col">値</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.year}>
              <th scope="row">{point.year}</th>
              <td>{formatValue(point.value, metric.unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><strong>定義:</strong> {metric.provenance.definition}</p>
      <p><strong>単位:</strong> {metric.provenance.unit}</p>
      <p><strong>出典名:</strong> {metric.provenance.title}</p>
    </div>
  );
}

function PremiumStandardBlock({ premiumStandard }: { premiumStandard: PremiumStandard }) {
  return (
    <div className="detail-metric">
      <p className="detail-metric-name">介護保険料基準月額（制度値）</p>
      <table>
        <caption>期ごとの基準月額</caption>
        <thead>
          <tr>
            <th scope="col">期</th>
            <th scope="col">対象年度</th>
            <th scope="col">基準月額</th>
          </tr>
        </thead>
        <tbody>
          {premiumStandard.periods.map((period) => (
            <tr key={period.label}>
              <th scope="row">{period.label}</th>
              <td>{period.range}</td>
              <td>{period.value.toLocaleString("ja-JP")}円/月</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><strong>定義:</strong> {premiumStandard.definition}</p>
      <p>
        <a href={premiumStandard.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label="基準月額の原典を開く（外部サイト）">
          基準月額の原典を開く ↗
        </a>
      </p>
    </div>
  );
}

function DetailBody({ item }: { item: DetailItem }) {
  if (item.kind === "unavailable") {
    return (
      <div className="detail-body">
        <p><strong>状態:</strong> 立川市単位で継続比較できる公開データを、今回の調査範囲では確認できていません</p>
        <p>{item.note}</p>
      </div>
    );
  }

  if (item.kind === "source") {
    return (
      <div className="detail-body">
        <p>立川市オープンデータ「統計年報・社会福祉」を Shift_JIS の CSV として読み取り、最新5年度を抽出しています。欠損記号「-」は0ではなく欠損として扱います。</p>
        <p>
          <a href={item.sourcePage} target="_blank" rel="noopener noreferrer" aria-label="原典の掲載ページを開く（外部サイト）">
            原典の掲載ページを開く ↗
          </a>
        </p>
        <p><Link href="/data/">定義・加工方法・照合情報を見る →</Link></p>
      </div>
    );
  }

  if (item.kind === "premium") {
    return (
      <div className="detail-body">
        <PremiumStandardBlock premiumStandard={item.premiumStandard} />
        {item.metrics.map((metric) => (
          <MetricBlock key={metric.label} metric={metric} />
        ))}
      </div>
    );
  }

  return (
    <div className="detail-body">
      {item.metrics.map((metric) => (
        <MetricBlock key={metric.label} metric={metric} />
      ))}
    </div>
  );
}

export default function DetailAccordion({ items }: { items: DetailItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const baseId = useId();

  return (
    <section className="detail-section" aria-labelledby={`${baseId}-heading`}>
      <div className="detail-inner">
        <p className="eyebrow">詳細データ</p>
        <h2 id={`${baseId}-heading`}>
          気になったところから、<br className="mobile-only-break" />詳しく見る
        </h2>
        <p>気になったテーマから、具体値・定義・出典を確認できます。</p>
        <div className="detail-list">
          {items.map((item, index) => {
            const isOpen = openId === item.id;
            const panelId = `${baseId}-panel-${item.id}`;
            const buttonId = `${baseId}-btn-${item.id}`;
            return (
              <div key={item.id} className={`detail-item${isOpen ? " is-open" : ""}`}>
                <button
                  type="button"
                  id={buttonId}
                  className="detail-row"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                >
                  <span className="detail-num">0{index + 1}</span>
                  <span className="detail-title">{item.title}</span>
                  <span className="detail-plus" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="detail-popover"
                  inert={!isOpen}
                >
                  <div className="detail-popover-inner">
                    <DetailBody item={item} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
