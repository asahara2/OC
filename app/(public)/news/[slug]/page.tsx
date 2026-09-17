import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { formatDate, getPublishedNewsBySlug } from "@/lib/content";

export const dynamic = "force-dynamic";

type NewsDetailPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublishedNewsBySlug(slug);
  return item ? { title: item.title, description: item.excerpt || undefined } : {};
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const item = await getPublishedNewsBySlug(slug);
  if (!item) notFound();

  return (
    <article className="card">
      <p className="eyebrow">{formatDate(item.published_at)}</p>
      <h1>{item.title}</h1>
      {item.excerpt ? <p>{item.excerpt}</p> : null}
      <div className="prose">{item.content}</div>
    </article>
  );
}
