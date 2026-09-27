const change = (points: { year: number; value: number }[]) =>
  ((points.at(-1)!.value - points[0].value) / points[0].value) * 100;

export function buildChildrearingStepCopy(
  series: { id: string; points: { year: number; value: number }[] }[],
  municipalityLabel: string,
) {
  const points = (id: string) => {
    const metric = series.find((entry) => entry.id === id);
    if (!metric) throw new Error(`Missing childrearing narrative metric: ${id}`);
    return metric.points;
  };

  const pregnancyDelta = change(points("pregnancy_notifications"));
  const nurseryDelta = change(points("nursery_children_count"));

  const pregnancyTitle =
    Math.abs(pregnancyDelta) < 3
      ? "妊娠届出者数は、大きくは変わっていない"
      : pregnancyDelta >= 0
        ? "妊娠届出者数は、増えた"
        : "妊娠届出者数は、減った";

  const nurseryTitle =
    Math.abs(nurseryDelta) < 3
      ? "保育園児数も、大きくは変わっていない"
      : nurseryDelta >= 0
        ? "保育園児数は、増えた"
        : "保育園児数は、減った";

  const copy = [
    {
      eyebrow: `01 — ${municipalityLabel}・妊娠届出者数`,
      title: pregnancyTitle,
      body: "各年度の妊娠届出者数です。出生数そのものではなく、届出に基づく公表値です。",
    },
    {
      eyebrow: `02 — ${municipalityLabel}・保育園児数`,
      title: nurseryTitle,
      body: "各年4月1日現在の保育園児数（原因別表・年齢=全て）です。学童登録児童とは別系列です。",
    },
  ];

  const ids = ["pregnancy_notifications", "nursery_children_count"];
  return series.map((metric, index) => {
    const step = copy[ids.indexOf(metric.id)];
    if (!step) throw new Error(`Missing childrearing copy: ${metric.id}`);
    return { ...step, eyebrow: step.eyebrow.replace(/^\d+/, String(index + 1).padStart(2, "0")) };
  });
}
