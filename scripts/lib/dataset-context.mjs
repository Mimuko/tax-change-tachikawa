import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const SUPPORTED = new Set(["tachikawa/care", "nerima/care"]);

export async function datasetContext(root, args = process.argv.slice(2)) {
  const [municipality = "tachikawa", topic = "care"] = args;
  const key = `${municipality}/${topic}`;
  if (args.length > 2 || !SUPPORTED.has(key)) {
    throw new Error(`Unsupported dataset: ${municipality}/${topic}`);
  }
  const read = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
  const place = await read(`config/municipalities/${municipality}.json`);
  const source = await read(`config/data-sources/${municipality}/${topic}.json`);
  return {
    key,
    config: { ...place, ...source },
    rawPath: `data/raw/${municipality}/${topic}`,
    curatedPath: `data/curated/${municipality}/${topic}`,
    outputPath: `data/processed/${municipality}/${topic}/dashboard.json`,
  };
}
