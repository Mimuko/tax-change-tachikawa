const change = (points: {year: number; value: number}[]) => ((points.at(-1)!.value - points[0].value) / points[0].value) * 100;
const changeDirection = (delta: number) => {
  if (Math.abs(delta) < 2) return "ほぼ横ばい";
  return delta >= 0 ? "増えた" : "減った";
};

type CareOpeningStep = { metricId: string; periodKind?: string };

export function buildCareStepCopy(
  series: { id: string; points: {year: number; value: number}[] }[],
  municipalityLabel: string,
  opening: CareOpeningStep[] = [],
) {
  const points = (id: string) => {
    const metric = series.find((entry) => entry.id === id);
    if (!metric) throw new Error(`Missing care narrative metric: ${id}`);
    return metric.points;
  };
  const insuredDelta = change(points("ltc_first_insured_persons"));
  const certifiedDelta = change(points("care_certified_persons"));
  const benefitsDelta = change(points("ltc_benefit_total_yen"));

  const insuredTitle =
    Math.abs(insuredDelta) < 2
      ? "高齢者の加入者数は、大きく変わらなかった"
      : insuredDelta >= 0
        ? "高齢者の加入者数は、増えた"
        : "高齢者の加入者数は、減った";

  const certifiedTitle =
    Math.abs(certifiedDelta) < 2
      ? "介護を必要とする人は、ほぼ横ばい"
      : certifiedDelta >= 0
        ? "介護を必要とする人は、増えた"
        : "介護を必要とする人は、減った";

  const benefitsTitle =
    benefitsDelta > certifiedDelta && benefitsDelta >= 2
      ? "給付費は、認定者より大きく伸びた"
      : changeDirection(benefitsDelta) === "ほぼ横ばい"
        ? "給付費は、ほぼ横ばい"
        : benefitsDelta >= 0
          ? "給付費は、増えた"
          : "給付費は、減った";

  const copy = [
    {
      eyebrow: `01 — ${municipalityLabel}・第1号被保険者数`,
      title: insuredTitle,
      body: "65歳以上の第1号被保険者数です。5年間で大きな変動はなく、ほぼ同じ水準で推移しています。",
    },
    {
      eyebrow: `02 — ${municipalityLabel}・要支援・要介護認定者数`,
      title: certifiedTitle,
      body:
        opening.find((step) => step.metricId === "care_certified_persons")?.periodKind === "september_end"
          ? "各年9月末現在の要支援・要介護認定者総数です。第1号被保険者数（各年度末）とは基準日が異なるため、ここでは比率は示しません。"
          : "要支援・要介護の認定者総数です。第2号被保険者も含むため、加入者数との比率はここでは示しません。",
    },
    {
      eyebrow: `03 — ${municipalityLabel}・介護保険給付総額`,
      title: benefitsTitle,
      body:
        benefitsDelta > certifiedDelta && benefitsDelta >= 2
          ? "居宅・施設・地域密着型サービスを合わせた給付総額です。認定者の伸びよりも大きく、同じ5年間で増えています。"
          : "居宅・施設・地域密着型サービスを合わせた給付総額です。5年間の推移を、他の指標と並べて見ています。",
    },
  ];
  const ids = ["ltc_first_insured_persons", "care_certified_persons", "ltc_benefit_total_yen"];
  return series.map((metric, index) => {
    const step = copy[ids.indexOf(metric.id)];
    if (!step) throw new Error(`Missing care copy: ${metric.id}`);
    return { ...step, eyebrow: step.eyebrow.replace(/^\d+/, String(index + 1).padStart(2, "0")) };
  });
}
