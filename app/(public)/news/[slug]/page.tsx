import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowIcon } from "@/components/public/icons";

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
    <div className="oc-document"><article className="oc-reading">
      <header className="oc-document-heading"><p className="oc-eyebrow">NEWS / <time dateTime={item.published_at ?? undefined}>{formatDate(item.published_at)}</time></p>
        <h1>{item.title}</h1>{item.excerpt ? <p>{item.excerpt}</p> : null}</header>
      <div className="oc-reading-body prose">{item.content}</div>
      <Link href="/news" className="oc-text-link">すべてのニュース<ArrowIcon /></Link>
    </article></div>
  );
}
