import type { Metadata } from "next";

import { listPublishedConstitution } from "@/lib/content";

export const metadata: Metadata = { title: "憲章" };
export const dynamic = "force-dynamic";

export default async function ConstitutionPage() {
  const articles = await listPublishedConstitution();
  return (
    <><h1>憲章</h1>
      {articles.length === 0 ? <p className="muted">公開中の条文はありません。</p> : (
        <div className="stack">
          {articles.map((article) => <article className="card" key={article.id}>
            <p className="eyebrow">第 {article.article_number} 条</p>
            <h2>{article.title}</h2>
            <div className="prose">{article.content}</div>
          </article>)}
        </div>
      )}
    </>
  );
}
