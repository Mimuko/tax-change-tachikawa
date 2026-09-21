// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawnSync } = require("child_process");

const requiredNode = "20.9.0";
const currentNode = process.versions.node;

function compareVersions(left, right) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }

  return 0;
}

if (compareVersions(currentNode, requiredNode) < 0) {
  console.error(
    `Node.js ${requiredNode} 以上が必要です（現在: ${currentNode}）。`,
  );
  process.exit(1);
}

const nextBin = require.resolve("next/dist/bin/next");
const result = spawnSync(process.execPath, [nextBin, "dev"], {
  stdio: "inherit",
});

if (result.error) {
  console.error(`dev server を起動できませんでした: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status == null ? 1 : result.status);
