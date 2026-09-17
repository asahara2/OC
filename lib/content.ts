import { createPublicClient } from "@/lib/supabase/server";
import type { ConstitutionArticle, Leader, NewsItem, Role } from "@/lib/supabase/types";

export type PublicSettings = {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  constitutionPreamble: string;
};

const defaults: PublicSettings = {
  siteName: "Organization",
  siteDescription: "Official website",
  contactEmail: "",
  constitutionPreamble: "",
};

function settingString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("site_settings").select("key, value").eq("is_public", true);
  if (error) throw new Error(`Unable to load site settings: ${error.message}`);

  const values = new Map((data ?? []).map((setting) => [setting.key, setting.value]));
  return {
    siteName: settingString(values.get("site_name"), defaults.siteName),
    siteDescription: settingString(values.get("site_description"), defaults.siteDescription),
    contactEmail: settingString(values.get("contact_email"), defaults.contactEmail),
    constitutionPreamble: settingString(values.get("constitution_preamble"), defaults.constitutionPreamble),
  };
}

export async function listPublishedNews(limit?: number): Promise<NewsItem[]> {
  const supabase = createPublicClient();
  let query = supabase.from("news").select("*").eq("is_published", true).order("published_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load news: ${error.message}`);
  return data ?? [];
}

export async function getPublishedNewsBySlug(slug: string): Promise<NewsItem | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(`Unable to load news item: ${error.message}`);
  return data;
}

export type PublicLeader = Leader & { role: Pick<Role, "name" | "slug"> | null };

export async function listPublicLeaders(): Promise<PublicLeader[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("leaders")
    .select("*, role:roles(name, slug)")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(`Unable to load leaders: ${error.message}`);
  return (data ?? []) as PublicLeader[];
}

export async function listPublishedConstitution(): Promise<ConstitutionArticle[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("constitution_articles")
    .select("*")
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("article_number", { ascending: true });
  if (error) throw new Error(`Unable to load constitution: ${error.message}`);
  return data ?? [];
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "long", timeZone: "Asia/Tokyo" }).format(new Date(value));
}
