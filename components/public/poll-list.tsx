"use client";

import { useState } from "react";

import type { PublicPoll } from "@/lib/content";

export function PollList({ polls }: { polls: PublicPoll[] }) {
  const [voted, setVoted] = useState<Record<string, string>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);

  async function vote(pollId: string, optionId: string) {
    setPending(pollId); setError((current) => ({ ...current, [pollId]: "" }));
    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ optionId }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "投票できませんでした。");
      setVoted((current) => ({ ...current, [pollId]: optionId }));
    } catch (reason) { setError((current) => ({ ...current, [pollId]: reason instanceof Error ? reason.message : "投票できませんでした。" })); }
    finally { setPending(null); }
  }

  if (polls.length === 0) return <div className="oc-empty"><p>現在、公開中の投票はありません。</p></div>;
  return <div className="oc-poll-list">{polls.map((poll) => {
    const total = poll.options.reduce((sum, option) => sum + option.vote_count, 0);
    const closed = !poll.is_open;
    return <article className="oc-poll" key={poll.id}><p className="oc-eyebrow">COMMUNITY POLL</p><h2>{poll.title}</h2>{poll.description ? <p>{poll.description}</p> : null}
      <div className="oc-poll-options">{poll.options.map((option) => {
        const percentage = total ? Math.round((option.vote_count / total) * 100) : 0;
        return <button type="button" key={option.id} disabled={closed || pending === poll.id || Boolean(voted[poll.id])} onClick={() => vote(poll.id, option.id)}>
          <span>{option.label}</span>{poll.results_public || voted[poll.id] ? <small>{option.vote_count}票・{percentage}%</small> : null}
        </button>;
      })}</div>
      {voted[poll.id] ? <p className="oc-poll-status">投票を受け付けました。ありがとうございました。</p> : null}
      {closed ? <p className="oc-poll-status">この投票は受付を終了しました。</p> : null}
      {error[poll.id] ? <p className="oc-poll-error" role="alert">{error[poll.id]}</p> : null}
    </article>;
  })}</div>;
}
