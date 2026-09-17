import Link from "next/link";

import { NewsList } from "@/components/news-list";
import { getPublicSettings, listPublishedNews } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, news] = await Promise.all([getPublicSettings(), listPublishedNews(3)]);

  return (
    <>
      <section className="card">
        <p className="eyebrow">公式サイト</p>
        <h1>{settings.siteName}</h1>
        <p>{settings.siteDescription}</p>
      </section>
      <section style={{ marginTop: "2rem" }}>
        <div className="page-heading"><h2>最新ニュース</h2><Link href="/news">すべて見る</Link></div>
        <NewsList items={news} />
      </section>
    </>
  );
}
