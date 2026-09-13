import type { DataPoint, ReferenceMetric } from "../types/dashboard";

const WAGE_METRIC_IDS = new Set(["care_worker_scheduled_salary_tokyo", "care_worker_scheduled_salary"]);
const WORKFORCE_METRIC_IDS = new Set(["care_worker_fte", "care_worker_headcount"]);

export function hasComparablePoints(points: DataPoint[] | undefined | null): boolean {
  if (!points?.length) return false;
  const valid = points.filter((point) => point.value !== null && Number.isFinite(point.value));
  return valid.length >= 2;
}

export function isWageMetric(metric: ReferenceMetric): boolean {
  return WAGE_METRIC_IDS.has(metric.metricId) || metric.unit === "円" || metric.provenance?.unit === "yen_per_month";
}

export function isWorkforceMetric(metric: ReferenceMetric): boolean {
  return WORKFORCE_METRIC_IDS.has(metric.metricId);
}

export function comparableReferenceMetrics(metrics: ReferenceMetric[] | undefined): ReferenceMetric[] {
  return (metrics ?? []).filter(
    (metric) => metric.referenceOnly === true && hasComparablePoints(metric.points),
  );
}

export type SupportAvailability = {
  localWageAvailable: boolean;
  localWorkforceAvailable: boolean;
  referenceWageAvailable: boolean;
  referenceWorkforceAvailable: boolean;
  localSupportAvailable: boolean;
  referenceSupportAvailable: boolean;
  showDataGap: boolean;
  showSupportAct: boolean;
};

export function resolveSupportAvailability(input: {
  localSalary?: DataPoint[] | null;
  localWorkforce?: DataPoint[] | null;
  prefectureReference?: ReferenceMetric[] | null;
}): SupportAvailability {
  const reference = comparableReferenceMetrics(input.prefectureReference ?? undefined);
  const referenceWageAvailable = reference.some(isWageMetric);
  const referenceWorkforceAvailable = reference.some(isWorkforceMetric);
  const localWageAvailable = hasComparablePoints(input.localSalary);
  const localWorkforceAvailable = hasComparablePoints(input.localWorkforce);
  const localSupportAvailable = localWageAvailable || localWorkforceAvailable;
  const referenceSupportAvailable = referenceWageAvailable || referenceWorkforceAvailable;

  return {
    localWageAvailable,
    localWorkforceAvailable,
    referenceWageAvailable,
    referenceWorkforceAvailable,
    localSupportAvailable,
    referenceSupportAvailable,
    showDataGap: !localSupportAvailable && referenceSupportAvailable,
    showSupportAct: localSupportAvailable || referenceSupportAvailable,
  };
}
