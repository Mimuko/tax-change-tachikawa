import { notFound } from "next/navigation";
import SourcePage from "../../../../stories/source-page";
import { getStory, storyParams } from "../../../../lib/story-registry";
export const dynamicParams = false;
export const generateStaticParams = storyParams;
export default async function Page({ params }: { params: Promise<{ municipality: string; topic: string }> }) {
  const { municipality, topic } = await params;
  const context = getStory(municipality, topic);
  if (!context) notFound();
  return <SourcePage context={context} />;
}
