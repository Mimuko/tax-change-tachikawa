const { spawnSync } = require("child_process");

const requiredNode = "22.22.3";
const result = spawnSync(
  "volta",
  ["run", "--node", requiredNode, "npx", "next", "dev"],
  { stdio: "inherit" },
);

if (result.error) {
  console.error(
    `Volta が見つかりません。Node.js ${requiredNode} 以上を有効にしてから npm run dev を実行してください。`,
  );
  process.exit(1);
}

process.exit(result.status == null ? 1 : result.status);
