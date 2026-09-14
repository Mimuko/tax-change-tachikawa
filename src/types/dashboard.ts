export type DataPoint = { year: number; value: number };

export type CertifiedPoint = DataPoint & { secondInsured?: number };

export type Provenance = {
  title: string;
  definition: string;
  unit: string;
  sha256?: string;
  note?: string;
};

export type PremiumPeriod = {
  label: string;
  range: string;
  value: number;
};

/** Prefecture-level reference metric (never treated as municipal proxy). */
export type ReferenceMetric = {
  metricId: string;
  label: string;
  unit: string;
  referenceOnly: boolean;
  geography: string;
  points: DataPoint[];
  provenance?: Provenance;
};

export type PlaceInfo = {
  municipalityCode: string;
  municipalityLabel: string;
  prefectureLabel: string;
  links?: {
    wageStructureSurvey?: string;
  };
};

export type DashboardData = {
  generatedAt: string;
  latestFiscalYear: number;
  sourcePage: string;
  place: PlaceInfo;
  series: {
    insured: DataPoint[];
    certified: CertifiedPoint[];
    benefits: DataPoint[];
    premiumRevenue: DataPoint[];
    serviceUnitCount?: DataPoint[];
    /** Municipal care-worker salary when comparable public data exists. */
    careWorkerSalary?: DataPoint[];
    /** Municipal care-worker headcount / FTE when comparable public data exists. */
    careWorkerWorkforce?: DataPoint[];
  };
  provenance: {
    insured: Provenance;
    certified: Provenance;
    benefits: Provenance;
    premiumRevenue: Provenance;
    serviceUnitCount?: Provenance;
    careWorkerSalary?: Provenance;
    careWorkerWorkforce?: Provenance;
  };
  premiumStandard: {
    metricId: string;
    sourceUrl: string;
    definition: string;
    periods: PremiumPeriod[];
  };
  reference: {
    /** Prefecture reference metrics (`referenceOnly: true`). */
    prefecture: ReferenceMetric[];
  };
};

export type DataGapKind =
  | "not_published"
  | "wrong_geography"
  | "single_point_only"
  | "definition_break"
  | "not_equivalent"
  | "incompatible_period"
  | "unavailable_for_comparison";

export type DataGap = {
  id: string;
  kind: DataGapKind;
  metricId?: string;
  title?: string;
  reason?: string;
  note?: string;
  sourceUrl?: string;
  sourceLabel?: string;
};
