import type { Metadata } from "next";

import { listPublishedConstitution } from "@/lib/content";
import { ArticleList } from "@/components/public/article-list";

export const metadata: Metadata = { title: "憲章" };
export const dynamic = "force-dynamic";

export default async function ConstitutionPage() {
  const articles = await listPublishedConstitution();
  return (
    <div className="oc-document"><header className="oc-document-heading"><p className="oc-eyebrow">03 / OUR CONSTITUTION</p><h1>共同体憲章</h1><p>共に歩むための意思と、自由のよりどころ。</p></header><ArticleList articles={articles} /></div>
  );
}
