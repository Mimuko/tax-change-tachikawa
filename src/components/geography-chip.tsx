type GeographyVariant = "tachikawa" | "tokyo-ref" | "tachikawa-policy";

const labels: Record<GeographyVariant, string> = {
  tachikawa: "立川市",
  "tokyo-ref": "東京都参考",
  "tachikawa-policy": "立川市の制度値",
};

export default function GeographyChip({ variant }: { variant: GeographyVariant }) {
  const className = [
    "geography-chip",
    variant === "tokyo-ref" ? "geography-chip--tokyo" : "",
    variant === "tachikawa-policy" ? "geography-chip--policy" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={className}>{labels[variant]}</span>;
}
