import { createPublicClient } from "@/lib/supabase/server";
import type { CommunityMessage, ConstitutionArticle, Leader, NewsItem, Poll, PollOption, Role } from "@/lib/supabase/types";

export type PublicSettings = {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  constitutionPreamble: string;
  backgroundUrl: string;
  backgroundExpiresAt: string | null;
  heroImageUrl: string;
  activeEffect: "cracker" | "emoji" | null;
  effectExpiresAt: string | null;
  siteMode: "classic" | "immersive";
};

const defaults: PublicSettings = {
  siteName: "Organization",
  siteDescription: "Official website",
  contactEmail: "",
  constitutionPreamble: "",
  backgroundUrl: "",
  backgroundExpiresAt: null,
  heroImageUrl: "",
  activeEffect: null,
  effectExpiresAt: null,
  siteMode: "classic",
};

function settingString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

export async function getPublicSettings(): Promise<PublicSettings> {
  let data: { key: string; value: unknown }[] | null = null;
  try {
    const result = await createPublicClient().from("site_settings").select("key, value").eq("is_public", true);
    if (result.error) return { ...defaults };
    data = result.data;
  } catch {
    // Keep the public shell available while deployment configuration or the
    // database connection is recovering. Administrative routes still error.
    return { ...defaults };
  }

  const values = new Map((data ?? []).map((setting) => [setting.key, setting.value]));
  const backgroundExpiresAt = settingString(values.get("background_expires_at"), "") || null;
  const effectExpiresAt = settingString(values.get("effect_expires_at"), "") || null;
  const now = Date.now();
  const backgroundUrl = backgroundExpiresAt && new Date(backgroundExpiresAt).getTime() > now ? settingString(values.get("background_url"), "") : "";
  const effect = effectExpiresAt && new Date(effectExpiresAt).getTime() > now ? settingString(values.get("active_effect"), "") : "";
  const siteMode = settingString(values.get("site_mode"), defaults.siteMode) === "classic" ? "classic" : "immersive";
  return {
    siteName: settingString(values.get("site_name"), defaults.siteName),
    siteDescription: settingString(values.get("site_description"), defaults.siteDescription),
    contactEmail: settingString(values.get("contact_email"), defaults.contactEmail),
    constitutionPreamble: settingString(values.get("constitution_preamble"), defaults.constitutionPreamble),
    backgroundUrl, backgroundExpiresAt: backgroundUrl ? backgroundExpiresAt : null,
    heroImageUrl: settingString(values.get("hero_image_url"), defaults.heroImageUrl),
    activeEffect: effect === "cracker" || effect === "emoji" ? effect : null,
    effectExpiresAt: effect ? effectExpiresAt : null,
    siteMode,
  };
}

export async function listPublishedNews(limit?: number): Promise<NewsItem[]> {
  try {
    const supabase = createPublicClient();
    let query = supabase.from("news").select("*").eq("is_published", true).order("published_at", { ascending: false });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    return error ? [] : data ?? [];
  } catch { return []; }
}

export async function getPublishedNewsBySlug(slug: string): Promise<NewsItem | null> {
  try {
    const { data, error } = await createPublicClient()
      .from("news")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    return error ? null : data;
  } catch { return null; }
}

export type PublicLeader = Leader & { role: Pick<Role, "name" | "slug"> | null };

export async function listPublicLeaders(): Promise<PublicLeader[]> {
  try {
    const { data, error } = await createPublicClient()
      .from("leaders")
      .select("*, role:roles(name, slug)")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) return [];
    return (data ?? []).filter((leader) => leader.role?.slug !== "mod" || leader.mod_leader_approved) as PublicLeader[];
  } catch { return []; }
}

export async function listPublishedConstitution(): Promise<ConstitutionArticle[]> {
  try {
    const { data, error } = await createPublicClient()
      .from("constitution_articles")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("article_number", { ascending: true });
    return error ? [] : data ?? [];
  } catch { return []; }
}

export type PublicPoll = Poll & { options: PollOption[] };

/** Public polls never require Supabase Auth. A browser cookie is used only to prevent repeat votes. */
export async function listPublicPolls(): Promise<PublicPoll[]> {
  try {
    const supabase = createPublicClient();
    const { data: polls, error } = await supabase
      .from("polls")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    // Optional feature: a site can deploy before the poll migration is applied.
    // Keep the public homepage available and show the waiting state in that case.
    if (error) return [];
    const pollIds = (polls ?? []).map((poll) => poll.id);
    if (pollIds.length === 0) return [];
    const { data: options, error: optionError } = await supabase.from("poll_options").select("*").in("poll_id", pollIds).order("display_order");
    if (optionError) return [];
    return (polls ?? []).map((poll) => ({
      ...poll,
      options: (options ?? []).filter((option) => option.poll_id === poll.id),
    }));
  } catch { return []; }
}

export async function listPublicMessages(): Promise<CommunityMessage[]> {
  try {
    const { data, error } = await createPublicClient().from("community_messages").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(50);
    // This is a progressive enhancement; do not take the entire public site down
    // while a database migration is still being applied.
    return error ? [] : data ?? [];
  } catch { return []; }
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "long", timeZone: "Asia/Tokyo" }).format(new Date(value));
}
