import StoryPage from "../stories/story-page";
import { defaultStory } from "../lib/story-registry";
export default function Home() {
  return <StoryPage context={defaultStory} />;
}
