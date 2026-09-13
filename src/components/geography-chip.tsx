type GeographyScope = "municipality" | "prefecture-ref" | "municipality-policy";

const scopeClass: Record<GeographyScope, string> = {
  municipality: "",
  "prefecture-ref": "geography-chip--tokyo",
  "municipality-policy": "geography-chip--policy",
};

export default function GeographyChip({
  scope,
  label,
}: {
  scope: GeographyScope;
  label: string;
}) {
  const className = ["geography-chip", scopeClass[scope]].filter(Boolean).join(" ");
  return <span className={className}>{label}</span>;
}
