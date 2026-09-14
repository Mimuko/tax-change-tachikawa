import { notFound } from "next/navigation";
import StoryPage from "../../../stories/story-page";
import { getStory, storyParams } from "../../../lib/story-registry";
export const dynamicParams = false;
export const generateStaticParams = storyParams;
type Props = { params: Promise<{ municipality: string; topic: string }> };
export async function generateMetadata({ params }: Props) {
  const { municipality, topic } = await params;
  const context = getStory(municipality, topic);
  if (!context) notFound();
  return { title: `${context.municipality.municipalityLabel}の${context.topic.label} | machinohenka`, alternates: { canonical: context.href } };
}
export default async function Page({ params }: Props) {
  const { municipality, topic } = await params;
  const context = getStory(municipality, topic);
  if (!context) notFound();
  return <StoryPage context={context} />;
}
