import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { datasetContext } from "./lib/dataset-context.mjs";

const root = resolve(import.meta.dirname, "..");
const dataset = await datasetContext(root, ["fuchu", "care"]);
await mkdir(resolve(root, dataset.rawPath), { recursive: true });

for (const file of dataset.config.files) {
  const response = await fetch(file.url, {
    headers: { "user-agent": "machinohenka/0.1 (+public-data-research)" },
  });
  if (!response.ok || !response.headers.get("content-type")?.includes("csv")) {
    throw new Error(`${file.url}: expected CSV, got HTTP ${response.status} ${response.headers.get("content-type")}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 100) throw new Error(`${file.url}: CSV unexpectedly short`);
  await writeFile(resolve(root, dataset.rawPath, file.file), bytes);
  console.log(`Fetched ${file.file} (${bytes.length} bytes)`);
}
