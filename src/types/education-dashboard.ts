import type { DataGap, DataPoint, PlaceInfo, Provenance } from "./dashboard";

export type EducationProvenance = Provenance & {
  periodKind?: "as_of" | "annual_cumulative" | "fiscal_year" | "plan_period";
  asOfRule?: string;
  sourceUrl?: string;
};

export type EducationDataGap = DataGap;

export type EducationDashboardData = {
  generatedAt: string;
  latestFiscalYear: number;
  sourcePage: string;
  place: PlaceInfo & {
    links?: PlaceInfo["links"] & {
      tokyoEducationExpenseSurvey?: string;
      mextSchoolRefusalSurvey?: string;
    };
  };
  series: {
    elemStudents: DataPoint[];
    junStudents: DataPoint[];
    elemClasses: DataPoint[];
    elemSpecialSupportClasses: DataPoint[];
    junClasses?: DataPoint[];
    elemStaff: DataPoint[];
    junStaff: DataPoint[];
    educationConsultationCases: DataPoint[];
    elemPerStudentCost?: DataPoint[];
    junPerStudentCost?: DataPoint[];
  };
  provenance: {
    elemStudents: EducationProvenance;
    junStudents: EducationProvenance;
    elemClasses: EducationProvenance;
    elemSpecialSupportClasses: EducationProvenance;
    junClasses?: EducationProvenance;
    elemStaff: EducationProvenance;
    junStaff: EducationProvenance;
    educationConsultationCases: EducationProvenance;
    elemPerStudentCost?: EducationProvenance;
    junPerStudentCost?: EducationProvenance;
  };
  gaps?: EducationDataGap[];
};
