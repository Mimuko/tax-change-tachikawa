import type { DataGap, DataPoint, PlaceInfo, Provenance } from "./dashboard";

export type ChildcareDashboardData = {
  generatedAt: string;
  latestFiscalYear: number;
  sourcePage: string;
  place: PlaceInfo;
  series: Record<"capacity" | "enrolled" | "staff" | "consultations", DataPoint[]>;
  provenance: Record<"capacity" | "enrolled" | "staff" | "consultations", Provenance & { sourceUrl: string; retrievedAt: string }>;
  gaps: DataGap[];
};
