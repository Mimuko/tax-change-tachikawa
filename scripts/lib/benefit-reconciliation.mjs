/**
 * 練馬区給付費の監査記録（benefit-reconciliation.json）を検証する。
 * 合計値の再掲比較だけではセル割当ミスを検知できないため、
 * 年度集合・構成要素・手計算合計を必須とする。
 *
 * 監査要件（正式）:
 * - 2020–2024 の完全年集合（コード固定。JSON 側で縮小不可）
 * - 年度別構成要素と手計算合計の自己整合
 * - パーサー出力との構成要素一致
 * - 立川 CSV との横断突合は対象外（auditScope.crossMunicipalityReconciliation === false）
 */

/** MVP 公開範囲。監査記録・パーサー双方がこの集合と一致しなければならない。 */
export const REQUIRED_BENEFIT_YEARS = [2020, 2021, 2022, 2023, 2024];

const COMPONENT_KEYS = [
  "homeServices",
  "facilityServices",
  "communityServices",
  "highCostServices",
  "reviewFee",
  "specificAdmission",
];

const PARSER_COMPONENT_KEYS = [
  "homeServicesThousandYen",
  "facilityServicesThousandYen",
  "communityServicesThousandYen",
  "highCostServicesThousandYen",
  "reviewFeeThousandYen",
  "specificAdmissionThousandYen",
];

function sameYearSet(actual, expected) {
  if (actual.length !== expected.length) return false;
  return actual.every((year, i) => year === expected[i]);
}

export function assertBenefitReconciliation(reconciliation, parsedBenefits) {
  if (!reconciliation?.years?.length) {
    throw new Error("benefit-reconciliation.json: years[] is required");
  }
  for (const field of ["source", "auditedAt", "sumDefinition", "note"]) {
    if (typeof reconciliation[field] !== "string" || !reconciliation[field].trim()) {
      throw new Error(`benefit-reconciliation.json: ${field} is required`);
    }
  }
  if (reconciliation.auditScope?.crossMunicipalityReconciliation !== false) {
    throw new Error(
      "benefit-reconciliation.json: auditScope.crossMunicipalityReconciliation must be false (立川CSV横断突合は対象外)",
    );
  }
  if (typeof reconciliation.auditScope?.rationale !== "string" || !reconciliation.auditScope.rationale.trim()) {
    throw new Error("benefit-reconciliation.json: auditScope.rationale is required");
  }

  const declaredYears = reconciliation.auditScope?.yearsRequired;
  if (!Array.isArray(declaredYears)) {
    throw new Error("benefit-reconciliation.json: auditScope.yearsRequired is required");
  }
  const sortedDeclared = [...declaredYears].sort((a, b) => a - b);
  if (!sameYearSet(sortedDeclared, REQUIRED_BENEFIT_YEARS)) {
    throw new Error(
      `benefit-reconciliation.json: auditScope.yearsRequired must be exactly [${REQUIRED_BENEFIT_YEARS.join(",")}]; got [${sortedDeclared.join(",")}]`,
    );
  }

  const expectedYears = REQUIRED_BENEFIT_YEARS;
  const recordedYears = reconciliation.years.map((row) => row.year);
  const uniqueYears = new Set(recordedYears);
  if (uniqueYears.size !== recordedYears.length) {
    throw new Error(`benefit-reconciliation.json: duplicate years in years[]: ${recordedYears.join(",")}`);
  }

  const sortedRecorded = [...recordedYears].sort((a, b) => a - b);
  if (!sameYearSet(sortedRecorded, expectedYears)) {
    throw new Error(
      `benefit-reconciliation.json: years must be exactly [${expectedYears.join(",")}]; got [${sortedRecorded.join(",")}]`,
    );
  }

  const parsedByYear = new Map(parsedBenefits.map((row) => [row.year, row]));
  const parsedYears = [...parsedByYear.keys()].sort((a, b) => a - b);
  if (!sameYearSet(parsedYears, expectedYears)) {
    throw new Error(
      `benefits parser years must be exactly [${expectedYears.join(",")}]; got [${parsedYears.join(",")}]`,
    );
  }

  for (const row of reconciliation.years) {
    const components = row.componentsThousandYen;
    if (!components) {
      throw new Error(`benefit-reconciliation.json: ${row.year} missing componentsThousandYen`);
    }
    for (const key of COMPONENT_KEYS) {
      if (!Number.isFinite(components[key])) {
        throw new Error(`benefit-reconciliation.json: ${row.year}.${key} must be a finite number`);
      }
    }

    const handSum = COMPONENT_KEYS.reduce((sum, key) => sum + components[key], 0);
    if (handSum !== row.handSumThousandYen) {
      throw new Error(
        `benefit-reconciliation.json: ${row.year} handSumThousandYen ${row.handSumThousandYen} != component sum ${handSum}`,
      );
    }
    if (row.valueYen !== row.handSumThousandYen * 1000) {
      throw new Error(
        `benefit-reconciliation.json: ${row.year} valueYen ${row.valueYen} != handSumThousandYen*1000 ${row.handSumThousandYen * 1000}`,
      );
    }

    const actual = parsedByYear.get(row.year);
    if (!actual) {
      throw new Error(`benefits reconciliation failed for ${row.year}: parser row missing`);
    }
    if (actual.value !== row.valueYen) {
      throw new Error(
        `benefits reconciliation failed for ${row.year}: expected ${row.valueYen}, got ${actual.value}`,
      );
    }
    for (let i = 0; i < COMPONENT_KEYS.length; i++) {
      const expected = components[COMPONENT_KEYS[i]];
      const got = actual.components?.[PARSER_COMPONENT_KEYS[i]];
      if (got !== expected) {
        throw new Error(
          `benefits component mismatch for ${row.year}.${COMPONENT_KEYS[i]}: expected ${expected}, got ${got ?? "missing"}`,
        );
      }
    }
  }

  return reconciliation.years.map(({ year, valueYen }) => ({ year, valueYen }));
}
