import type { Metadata } from "next";
import { getPublicSettings, listPublishedConstitution, listPublishedNews, listPublicLeaders, listPublicPolls } from "@/lib/content";
import { publicIdentity } from "@/lib/presentation";
import { HomeExperience } from "@/components/public/home-experience";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const identity = publicIdentity(await getPublicSettings());
  return { title: { absolute: identity.name }, description: identity.description };
}

export default async function HomePage() {
  const [settings, news, leaders, articles, polls] = await Promise.all([
    getPublicSettings(), listPublishedNews(), listPublicLeaders(), listPublishedConstitution(), listPublicPolls(),
  ]);
  return <HomeExperience identity={publicIdentity(settings)} news={news} leaders={leaders} articles={articles} polls={polls} />;
}
