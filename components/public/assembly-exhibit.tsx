"use client";

import { useState } from "react";
import type { PublicPoll } from "@/lib/content";

export function AssemblyExhibit({ poll }: { poll?: PublicPoll | null }) {
  const [counts, setCounts] = useState(() => Object.fromEntries((poll?.options ?? []).map((option) => [option.id, option.vote_count])));
  const [voted, setVoted] = useState<string | null>(null);
  const [error, setError] = useState("");
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  async function vote(optionId: string) {
    if (!poll || voted) return;
    setError("");
    const response = await fetch(`/api/polls/${poll.id}/vote`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ optionId }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setError(data.error ?? "投票できませんでした。"); return; }
    setVoted(optionId); setCounts((current) => ({ ...current, [optionId]: (current[optionId] ?? 0) + 1 }));
  }
  return <div className="oc-assembly-exhibit" data-voting-connected={Boolean(poll)}>
    <div className="oc-assembly-axis" aria-hidden="true"><span /><span /><span /></div>
    <div className="oc-assembly-agenda" data-spatial-panel>
      <p className="oc-eyebrow">{poll ? "LIVE COMMUNITY POLL" : "AWAITING AN AGENDA"}</p>
      <h3>{poll?.title ?? "次の問いを、この場所で。"}</h3>
      <p>{poll?.description ?? "共同体の意思が集まる、対話の空間。"}</p>
      {!poll ? <small>現在、公開中の投票はありません。</small> : null}
      {voted ? <small>投票を受け付けました。</small> : null}
      {error ? <small className="oc-vote-error" role="alert">{error}</small> : null}
    </div>
    {poll ? <div className="oc-vote-display" aria-label="投票状況">{poll.options.map((option) => { const count = counts[option.id] ?? 0; const percentage = total ? Math.round((count / total) * 100) : 0; return <button key={option.id} type="button" onClick={() => vote(option.id)} disabled={!poll.is_open || Boolean(voted)}><span>{option.label}<small>{poll.results_public || voted ? `${percentage}%` : "投票する"}</small></span><strong>{poll.results_public || voted ? count.toLocaleString("ja-JP") : "—"}<small>{poll.results_public || voted ? "票" : ""}</small></strong></button>; })}</div> : <div className="oc-vote-display" aria-label="投票状況"><div><span>投票準備中</span><strong>—</strong></div></div>}
  </div>;
}
