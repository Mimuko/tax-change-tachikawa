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

export type TokyoReferenceMetric = {
  metricId: string;
  label: string;
  unit: string;
  referenceOnly: boolean;
  geography: string;
  points: DataPoint[];
  provenance?: Provenance;
};

export type DashboardData = {
  generatedAt: string;
  latestFiscalYear: number;
  sourcePage: string;
  series: {
    insured: DataPoint[];
    certified: CertifiedPoint[];
    benefits: DataPoint[];
    premiumRevenue: DataPoint[];
    serviceUnitCount?: DataPoint[];
  };
  provenance: {
    insured: Provenance;
    certified: Provenance;
    benefits: Provenance;
    premiumRevenue: Provenance;
    serviceUnitCount?: Provenance;
  };
  premiumStandard: {
    metricId: string;
    sourceUrl: string;
    definition: string;
    periods: PremiumPeriod[];
  };
  reference: {
    tokyo: TokyoReferenceMetric[];
  };
};
