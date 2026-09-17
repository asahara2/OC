import type { ConstitutionArticle } from "@/lib/supabase/types";

export function ArticleList({ articles, compact = false }: { articles: ConstitutionArticle[]; compact?: boolean }) {
  if (!articles.length) return <div className="oc-empty"><p>憲章は、ここから。</p><span>現在、公開中の条文はありません。</span></div>;
  return <div className={`oc-articles${compact ? " oc-articles-compact" : ""}`}>{articles.map((article) => <article key={article.id} className="oc-article" id={`article-${article.article_number}`}>
    <span className="oc-article-number">{String(article.article_number).padStart(2, "0")}</span><div><p className="oc-eyebrow">第 {article.article_number} 条</p><h3>{article.title}</h3><p className="prose">{article.content}</p></div>
  </article>)}</div>;
}
