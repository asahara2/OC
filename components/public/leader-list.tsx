import { Emblem } from "@/components/public/icons";
import type { PublicLeader } from "@/lib/content";

export function LeaderList({ leaders }: { leaders: PublicLeader[] }) {
  if (!leaders.length) return <div className="oc-empty"><Emblem /><p>指導者の情報は、ここに記されます。</p><span>現在、公開中の指導者はいません。</span></div>;
  return <div className="oc-leader-list">{leaders.map((leader, index) => <article className="oc-leader" key={leader.id}>
    <div className="oc-leader-portrait">
      {leader.image_url ?
        // External URLs remain controlled by the existing admin form.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={leader.image_url} alt={`${leader.name}の肖像`} loading="lazy" decoding="async" />
        : <div className="oc-leader-monogram" aria-hidden="true"><Emblem /></div>}
      <span className="oc-leader-index">OC — {String(index + 1).padStart(2, "0")}</span>
    </div>
    <div className="oc-leader-info"><p className="oc-eyebrow">{leader.role?.name ?? "COMMUNITY"}</p><h3>{leader.name}</h3><p className="oc-leader-bio">{leader.biography}</p></div>
  </article>)}</div>;
}
