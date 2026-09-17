import type { Metadata } from "next";

import { listPublicLeaders } from "@/lib/content";

export const metadata: Metadata = { title: "指導者" };
export const dynamic = "force-dynamic";

export default async function LeadersPage() {
  const leaders = await listPublicLeaders();
  return (
    <><h1>指導者</h1>
      {leaders.length === 0 ? <p className="muted">現在公開中の指導者はいません。</p> : (
        <div className="stack">
          {leaders.map((leader) => <article className="card" key={leader.id}>
            <h2>{leader.name}</h2>
            {leader.role ? <p className="eyebrow">{leader.role.name}</p> : null}
            <div className="prose">{leader.biography}</div>
          </article>)}
        </div>
      )}
    </>
  );
}
