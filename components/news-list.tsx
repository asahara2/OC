import Link from "next/link";

import { formatDate } from "@/lib/content";
import { ArrowIcon } from "@/components/public/icons";
import type { NewsItem } from "@/lib/supabase/types";

export function NewsList({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return <div className="oc-empty"><p>次の一歩を、お待ちください。</p><span>現在、公開中のお知らせはありません。</span></div>;

  return (
    <div className="oc-news-list">
      {items.map((item) => (
        <article className="oc-news-item" key={item.id}>
          <Link href={`/news/${item.slug}`}><div className="oc-news-meta"><time dateTime={item.published_at ?? undefined}>{formatDate(item.published_at)}</time><span>NEWS</span></div>
          <div className="oc-news-copy"><h3>{item.title}</h3>{item.excerpt ? <p>{item.excerpt}</p> : null}</div><span className="oc-news-arrow"><ArrowIcon diagonal /></span></Link>
        </article>
      ))}
    </div>
  );
}
