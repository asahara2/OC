import type { Metadata } from "next";

import { NewsList } from "@/components/news-list";
import { listPublishedNews } from "@/lib/content";

export const metadata: Metadata = { title: "ニュース" };
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const news = await listPublishedNews();
  return <div className="oc-document"><header className="oc-document-heading"><p className="oc-eyebrow">04 / LATEST DISPATCHES</p><h1>ニュース</h1><p>共同体のいま、そしてこれから。</p></header><NewsList items={news} /></div>;
}
