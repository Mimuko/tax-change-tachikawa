import type { DataGap } from "./dashboard";

/**
 * SupportConnection は、必要な人が相談・制度・サービス等へ到達したかを扱う。
 * 支援へ到達した後に状態が改善したか、満足したか等の Outcome は対象外とし、
 * 同じ指標や connectionState へ混在させない。
 */
export type SupportConnectionDimension =
  | "consultation"
  | "service_access"
  | "unmet_need"
  | "navigation";

/** dimension と直交し、どの支援網への到達を測るかを示す。 */
export type SupportNetwork =
  | "public_or_professional"
  | "informal"
  | "mixed"
  | "none"
  | "unknown";

export type SupportConnectionState =
  | "connected"
  | "partially_connected"
  | "not_connected"
  | "unknown";

export type SupportConnectionObservation = {
  periodLabel: string;
  year?: number;
  value: number;
  unit: "persons" | "households" | "cases" | "percent";
  numerator?: number;
  denominator?: number;
  sampleSize?: number;
};

export type SupportConnectionIndicator = {
  metricId: string;
  label: string;
  dimension: SupportConnectionDimension;
  supportNetwork: SupportNetwork;
  connectionState: SupportConnectionState;
  observations: SupportConnectionObservation[];
  population: string;
  sourceQuestion?: string;
  multipleResponse?: boolean;
  geography: string;
  referenceOnly: boolean;
  provenance: {
    title: string;
    sourceUrl: string;
    definition: string;
    retrievedAt?: string;
  };
  caveat?: string;
};

export type SupportConnectionData = {
  indicators: SupportConnectionIndicator[];
  gaps: DataGap[];
};
