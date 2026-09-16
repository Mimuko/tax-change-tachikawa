import { notFound } from "next/navigation";
import SourcePage from "../../../../stories/source-page";
import { buildStoryDataMetadata } from "../../../../lib/story-metadata";
import { getStory, storyParams } from "../../../../lib/story-registry";
export const dynamicParams = false;
export const generateStaticParams = storyParams;
export async function generateMetadata({ params }: { params: Promise<{ municipality: string; topic: string }> }) {
  const { municipality, topic } = await params;
  const context = getStory(municipality, topic);
  if (!context) notFound();
  return buildStoryDataMetadata(context);
}
export default async function Page({ params }: { params: Promise<{ municipality: string; topic: string }> }) {
  const { municipality, topic } = await params;
  const context = getStory(municipality, topic);
  if (!context) notFound();
  return <SourcePage context={context} />;
}
