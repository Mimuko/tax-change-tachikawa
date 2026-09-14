const change = (points: { year: number; value: number }[]) =>
  ((points.at(-1)!.value - points[0].value) / points[0].value) * 100;

export function buildEducationStepCopy(
  series: { id: string; points: { year: number; value: number }[] }[],
  municipalityLabel: string,
) {
  const points = (id: string) => {
    const metric = series.find((entry) => entry.id === id);
    if (!metric) throw new Error(`Missing education narrative metric: ${id}`);
    return metric.points;
  };

  const elemDelta = change(points("elem_student_count"));
  const junDelta = change(points("jun_student_count"));

  const elemTitle =
    Math.abs(elemDelta) < 2
      ? "市立小学校の児童数は、大きくは変わっていない"
      : elemDelta >= 0
        ? "市立小学校の児童数は、増えた"
        : "市立小学校の児童数は、減った";

  const junTitle =
    Math.abs(junDelta) < 2
      ? "市立中学校の生徒数も、大きくは変わっていない"
      : junDelta >= 0
        ? "市立中学校の生徒数は、増えた"
        : "市立中学校の生徒数は、減った";

  const copy = [
    {
      eyebrow: `01 — ${municipalityLabel}・市立小学校児童数`,
      title: elemTitle,
      body: "各年5月1日現在の市立小学校児童数です。私立や高校は含みません。",
    },
    {
      eyebrow: `02 — ${municipalityLabel}・市立中学校生徒数`,
      title: junTitle,
      body: "各年5月1日現在の市立中学校生徒数です。小学校と同じ基準日で並べています。",
    },
  ];

  const ids = ["elem_student_count", "jun_student_count"];
  return series.map((metric, index) => {
    const step = copy[ids.indexOf(metric.id)];
    if (!step) throw new Error(`Missing education copy: ${metric.id}`);
    return { ...step, eyebrow: step.eyebrow.replace(/^\d+/, String(index + 1).padStart(2, "0")) };
  });
}
