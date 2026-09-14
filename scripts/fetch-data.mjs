import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { datasetContext } from "./lib/dataset-context.mjs";

const root = resolve(import.meta.dirname, "..");
const dataset = await datasetContext(root);
const config = dataset.config;
const destination = resolve(root, dataset.rawPath);
await mkdir(destination, { recursive: true });

const log = { fetchedAt: new Date().toISOString(), municipalityCode: config.municipalityCode, files: [] };

for (const source of config.sources) {
  const response = await fetch(source.url, {
    redirect: "follow",
    headers: { "user-agent": "tax-change-tachikawa/0.1 (+public-data-research)" },
  });
  if (!response.ok) throw new Error(`${source.file}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(resolve(destination, source.file), bytes);
  log.files.push({ file: source.file, url: source.url, bytes: bytes.byteLength, contentType: response.headers.get("content-type") });
}

await mkdir(resolve(root, "logs"), { recursive: true });
await writeFile(resolve(root, "logs/latest-fetch.json"), JSON.stringify(log, null, 2) + "\n", "utf8");
console.log(`Fetched ${log.files.length} files at ${log.fetchedAt}`);
