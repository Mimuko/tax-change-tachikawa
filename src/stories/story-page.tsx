import CareStory from "./care-story";
import EducationStory from "./education-story";
import type { StoryContext } from "../lib/story-registry";
import type { DashboardData } from "../types/dashboard";
import type { EducationDashboardData } from "../types/education-dashboard";

export default function StoryPage({ context }: { context: StoryContext }) {
  // New themes choose their own composition of shared story primitives.
  switch (context.story.renderer) {
    case "tachikawa-care":
    case "nerima-care":
      return <CareStory data={context.data as DashboardData} context={context} />;
    case "tachikawa-education":
      return <EducationStory data={context.data as EducationDashboardData} context={context} />;
    default:
      throw new Error(`Unknown story renderer: ${context.story.renderer}`);
  }
}
