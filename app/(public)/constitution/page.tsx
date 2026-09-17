import type { Metadata } from "next";

import { getPublicSettings, listPublishedConstitution } from "@/lib/content";
import { ArticleList } from "@/components/public/article-list";

export const metadata: Metadata = { title: "憲章" };
export const dynamic = "force-dynamic";

export default async function ConstitutionPage() {
  const [settings, articles] = await Promise.all([getPublicSettings(), listPublishedConstitution()]);
  return (
    <div className="oc-document"><header className="oc-document-heading"><p className="oc-eyebrow">03 / OUR CONSTITUTION</p><h1>共同体憲章</h1><p>共に歩むための意思と、自由のよりどころ。</p></header>
      {settings.constitutionPreamble && <section className="oc-constitution-preamble" aria-labelledby="constitution-preamble-title"><p className="oc-eyebrow">PREAMBLE / 前文</p><h2 id="constitution-preamble-title">前文</h2><p className="prose">{settings.constitutionPreamble}</p></section>}
      <ArticleList articles={articles} />
    </div>
  );
}
