import { createPoll, deletePoll, updatePollStatus } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PollsAdminPage() {
  const client = createAdminClient();
  const { data: polls, error } = await client.from("polls").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`投票を読み込めませんでした: ${error.message}`);
  const pollIds = (polls ?? []).map((poll) => poll.id);
  const { data: allOptions, error: optionError } = pollIds.length ? await client.from("poll_options").select("*").in("poll_id", pollIds).order("display_order") : { data: [], error: null };
  if (optionError) throw new Error(`選択肢を読み込めませんでした: ${optionError.message}`);

  return <>
    <AdminPageHeader title="リアルタイム投票" />
    <section className="admin-section">
      <h2>投票を作成</h2><p className="muted">サイト閲覧者はログインなしで、ブラウザごとに各投票へ1回だけ投票できます。</p>
      <form action={createPoll}><div className="form-grid">
        <label>質問<input name="title" required maxLength={200} /></label>
        <label className="full">説明（任意）<textarea name="description" maxLength={5000} /></label>
        <label className="full">選択肢（1行に1件、2〜20件）<textarea name="options" required maxLength={5000} placeholder={"はい\nいいえ"} /></label>
        <label className="checkbox"><input name="is_published" type="checkbox" defaultChecked />公開する</label>
        <label className="checkbox"><input name="is_open" type="checkbox" defaultChecked />受付を開始する</label>
        <label className="checkbox"><input name="results_public" type="checkbox" defaultChecked />結果を公開する</label>
      </div><div className="form-actions"><button type="submit">投票を作成</button></div></form>
    </section>
    <section className="admin-section"><h2>既存の投票</h2><div className="admin-list">
      {(polls ?? []).map((poll) => <div className="admin-item" key={poll.id}>
        <h3>{poll.title}</h3><p className="muted">{poll.description}</p>
        <p>{(allOptions ?? []).filter((option) => option.poll_id === poll.id).map((option) => `${option.label}（${option.vote_count}票）`).join(" / ")}</p>
        <form action={updatePollStatus} className="row-actions"><input type="hidden" name="id" value={poll.id} />
          <label className="checkbox"><input name="is_published" type="checkbox" defaultChecked={poll.is_published} />公開</label>
          <label className="checkbox"><input name="is_open" type="checkbox" defaultChecked={poll.is_open} />受付中</label>
          <label className="checkbox"><input name="results_public" type="checkbox" defaultChecked={poll.results_public} />結果公開</label>
          <button type="submit">状態を更新</button>
        </form>
        <form action={deletePoll} className="row-actions"><input type="hidden" name="id" value={poll.id} /><button className="danger" type="submit">削除</button></form>
      </div>)}
      {polls?.length === 0 ? <p className="muted">投票はまだありません。</p> : null}
    </div></section>
  </>;
}
