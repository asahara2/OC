import type { Metadata } from "next";

import { listPublicLeaders } from "@/lib/content";
import { LeaderList } from "@/components/public/leader-list";

export const metadata: Metadata = { title: "指導者" };
export const dynamic = "force-dynamic";

export default async function LeadersPage() {
  const leaders = await listPublicLeaders();
  return (
    <div className="oc-document"><header className="oc-document-heading"><p className="oc-eyebrow">02 / THE PEOPLE</p><h1>共同体を導く人々。</h1><p>ひとつの問いを、それぞれの視点から。</p></header><LeaderList leaders={leaders} /></div>
  );
}
