import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function datasetContext(root, args = process.argv.slice(2)) {
  const [municipality = "tachikawa", topic = "care"] = args;
  // Only implemented source adapters may run; reject unknown input before writes.
  if (args.length > 2 || municipality !== "tachikawa" || topic !== "care") {
    throw new Error(`Unsupported dataset: ${municipality}/${topic}`);
  }
  const read = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
  const place = await read(`config/municipalities/${municipality}.json`);
  const source = await read(`config/data-sources/${municipality}/${topic}.json`);
  return {
    config: { ...place, ...source },
    rawPath: `data/raw/${municipality}/${topic}`,
    curatedPath: `data/curated/${municipality}/${topic}`,
    outputPath: `data/processed/${municipality}/${topic}/dashboard.json`,
  };
}
