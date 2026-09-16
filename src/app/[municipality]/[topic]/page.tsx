import { notFound } from "next/navigation";
import StoryPage from "../../../stories/story-page";
import { buildStoryMetadata } from "../../../lib/story-metadata";
import { getStory, storyParams } from "../../../lib/story-registry";
export const dynamicParams = false;
export const generateStaticParams = storyParams;
type Props = { params: Promise<{ municipality: string; topic: string }> };
export async function generateMetadata({ params }: Props) {
  const { municipality, topic } = await params;
  const context = getStory(municipality, topic);
  if (!context) notFound();
  return buildStoryMetadata(context);
}
export default async function Page({ params }: Props) {
  const { municipality, topic } = await params;
  const context = getStory(municipality, topic);
  if (!context) notFound();
  return <StoryPage context={context} />;
}
