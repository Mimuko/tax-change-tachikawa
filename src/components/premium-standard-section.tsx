type PremiumPeriod = {
  label: string;
  range: string;
  value: number;
};

type PremiumStandardSectionProps = {
  periods: PremiumPeriod[];
  definition: string;
  sourceUrl: string;
};

export default function PremiumStandardSection({ periods, definition, sourceUrl }: PremiumStandardSectionProps) {
  return (
    <div className="premium-standard">
      <ol className="premium-periods">
        {periods.map((period) => (
          <li key={period.label} className="premium-period">
            <span className="premium-period-label">{period.label}</span>
            <span className="premium-period-range">{period.range}</span>
            <strong className="premium-period-value">{period.value.toLocaleString("ja-JP")}円/月</strong>
          </li>
        ))}
      </ol>
      <p className="act-note">{definition}</p>
      <p className="act-note">
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" aria-label="基準月額の原典を開く（外部サイト）">
          基準月額の原典を開く ↗
        </a>
      </p>
    </div>
  );
}
