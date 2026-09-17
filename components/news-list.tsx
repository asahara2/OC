import Link from "next/link";

import { formatDate } from "@/lib/content";
import type { NewsItem } from "@/lib/supabase/types";

export function NewsList({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return <p className="muted">公開中のお知らせはありません。</p>;

  return (
    <div className="stack">
      {items.map((item) => (
        <article className="card" key={item.id}>
          <p className="eyebrow">{formatDate(item.published_at)}</p>
          <h2><Link href={`/news/${item.slug}`}>{item.title}</Link></h2>
          {item.excerpt ? <p>{item.excerpt}</p> : null}
        </article>
      ))}
    </div>
  );
}
