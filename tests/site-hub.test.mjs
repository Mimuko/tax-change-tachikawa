import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const json = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));

test("公開ストーリーは story-registry 相当の監査済み組み合わせだけを含む", async () => {
  const careStory = await json("config/stories/tachikawa-care.json");
  const educationStory = await json("config/stories/tachikawa-education.json");
  const tachikawa = await json("config/municipalities/tachikawa.json");
  const care = await json("config/topics/care.json");
  const education = await json("config/topics/education.json");

  const stories = [
    { municipality: tachikawa, topic: care, story: careStory },
    { municipality: tachikawa, topic: education, story: educationStory },
  ];

  const municipalities = new Map();
  const topics = new Map();

  for (const entry of stories) {
    const municipalityStories = municipalities.get(entry.municipality.id) ?? [];
    municipalityStories.push(entry);
    municipalities.set(entry.municipality.id, municipalityStories);

    const topicStories = topics.get(entry.topic.id) ?? [];
    topicStories.push(entry);
    topics.set(entry.topic.id, topicStories);
  }

  assert.equal(municipalities.size, 1);
  assert.equal(municipalities.get("tachikawa").length, 2);
  assert.deepEqual([...topics.keys()].sort(), ["care", "education"]);

  const siblings = stories.filter((entry) => entry.story.id !== careStory.id);
  assert.equal(siblings.length, 1);
  assert.equal(siblings[0].topic.id, "education");
});
