import CareStory from "./care-story";
import type { StoryContext } from "../lib/story-registry";
export default function StoryPage({ context }: { context: StoryContext }) {
  // New themes choose their own composition of shared story primitives.
  switch (context.story.renderer) {
    case "tachikawa-care": return <CareStory data={context.data} context={context} />;
    default: throw new Error(`Unknown story renderer: ${context.story.renderer}`);
  }
}
