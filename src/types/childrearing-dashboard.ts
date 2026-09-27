import type { DataGap, DataPoint, PlaceInfo, Provenance } from "./dashboard";
import type { SupportConnectionData } from "./support-connection";

export type ChildrearingProvenance = Provenance & {
  periodKind?: "as_of" | "annual_cumulative" | "fiscal_year" | "plan_period";
  asOfRule?: string;
  sourceUrl?: string;
};

export type ChildrearingDashboardData = {
  generatedAt: string;
  latestFiscalYear: number;
  sourcePage: string;
  place: PlaceInfo & {
    links?: PlaceInfo["links"] & {
      healthOpenData?: string;
      welfareOpenData?: string;
    };
  };
  series: {
    pregnancyNotifications: DataPoint[];
    maternityHandbookDeliveries: DataPoint[];
    nurseryChildren: DataPoint[];
    nurseryCapacityTotal: DataPoint[];
    nurseryStaffCount: DataPoint[];
    afterschoolRegistrations: DataPoint[];
    childrearingConsultationCases: DataPoint[];
  };
  provenance: {
    pregnancyNotifications: ChildrearingProvenance;
    maternityHandbookDeliveries: ChildrearingProvenance;
    nurseryChildren: ChildrearingProvenance;
    nurseryCapacityTotal: ChildrearingProvenance;
    nurseryStaffCount: ChildrearingProvenance;
    afterschoolRegistrations: ChildrearingProvenance;
    childrearingConsultationCases: ChildrearingProvenance;
  };
  gaps?: DataGap[];
  supportConnection?: SupportConnectionData;
};
