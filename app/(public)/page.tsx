import type { Metadata } from "next";
import { getPublicSettings, listPublishedConstitution, listPublishedNews, listPublicLeaders, listPublicPolls } from "@/lib/content";
import { publicIdentity } from "@/lib/presentation";
import { HomeExperience } from "@/components/public/home-experience";
import { ClassicHomeExperience } from "@/components/public/classic-home-experience";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const identity = publicIdentity(await getPublicSettings());
  return { title: { absolute: identity.name }, description: identity.description };
}

export default async function HomePage() {
  const [settings, news, leaders, articles, polls] = await Promise.all([
    getPublicSettings(), listPublishedNews(), listPublicLeaders(), listPublishedConstitution(), listPublicPolls(),
  ]);
  const props = { identity: publicIdentity(settings), heroImageUrl: settings.heroImageUrl, news, leaders, articles, polls };
  return settings.siteMode === "classic" ? <ClassicHomeExperience {...props} /> : <HomeExperience {...props} />;
}
