import CareStory from "./care-story";
import EducationStory from "./education-story";
import ChildrearingStory from "./childrearing-story";
import type { StoryContext } from "../lib/story-registry";
import type { DashboardData } from "../types/dashboard";
import type { EducationDashboardData } from "../types/education-dashboard";
import type { ChildrearingDashboardData } from "../types/childrearing-dashboard";

export default function StoryPage({ context }: { context: StoryContext }) {
  // New themes choose their own composition of shared story primitives.
  switch (context.story.renderer) {
    case "tachikawa-care":
    case "nerima-care":
      return <CareStory data={context.data as DashboardData} context={context} />;
    case "tachikawa-education":
      return <EducationStory data={context.data as EducationDashboardData} context={context} />;
    case "tachikawa-childrearing":
      return (
        <ChildrearingStory data={context.data as ChildrearingDashboardData} context={context} />
      );
    default:
      throw new Error(`Unknown story renderer: ${context.story.renderer}`);
  }
}
