import { createCommunityMessage, deleteCommunityMessage } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MessagesAdminPage() {
  const { data: messages, error } = await createAdminClient().from("community_messages").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`メッセージを読み込めませんでした: ${error.message}`);
  return <><AdminPageHeader title="リアルタイムメッセージ" />
    <section className="admin-section"><h2>教祖からのメッセージ / トロールを投稿</h2><form action={createCommunityMessage}><div className="form-grid">
      <label>種類<select name="kind" defaultValue="message"><option value="message">教祖からのメッセージ</option><option value="troll">トロール</option></select></label>
      <label className="checkbox"><input name="is_published" type="checkbox" defaultChecked />すぐ公開する</label>
      <label className="full">本文<textarea name="body" required maxLength={5000} /></label>
    </div><div className="form-actions"><button type="submit">投稿</button></div></form></section>
    <section className="admin-section"><h2>投稿済みメッセージ</h2><div className="admin-list">{(messages ?? []).map((message) => <div className="admin-item" key={message.id}><strong>{message.kind === "troll" ? "トロール" : "教祖からのメッセージ"}</strong><p className="prose">{message.body}</p><form action={deleteCommunityMessage} className="row-actions"><input type="hidden" name="id" value={message.id} /><button type="submit" className="danger">削除</button></form></div>)}{messages?.length === 0 ? <p className="muted">投稿はまだありません。</p> : null}</div></section>
  </>;
}
