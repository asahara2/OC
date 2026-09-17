import type { Metadata } from "next";

import { NewsList } from "@/components/news-list";
import { listPublishedNews } from "@/lib/content";

export const metadata: Metadata = { title: "ニュース" };
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const news = await listPublishedNews();
  return <><h1>ニュース</h1><NewsList items={news} /></>;
}
