import { createStaffAccount, updateStaffPermissions } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { staffPermissions } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const labels: Record<(typeof staffPermissions)[number], string> = { news_write: "ニュース添削・公開", constitution_write: "憲章編集", poll_manage: "アンケート実施", message_publish: "教祖メッセージ", troll_publish: "トロール", leader_manage: "指導者管理", media_manage: "メディア管理" };

export default async function StaffAdminPage() {
  const client = createAdminClient();
  const [{ data: accounts, error }, { data: permissions, error: permissionError }] = await Promise.all([client.from("staff_accounts").select("*").order("created_at"), client.from("staff_permissions").select("*")]);
  if (error || permissionError) throw new Error(`スタッフ情報を読み込めませんでした: ${error?.message ?? permissionError?.message}`);
  return <><AdminPageHeader title="役職アカウント" /><section className="admin-section"><h2>スタッフIDを発行</h2><p className="muted">MODを3名、KYOSOを1名作成する場合は、役職を選んで4回登録してください。パスワードはこの画面で設定したものだけが有効です。</p><form action={createStaffAccount}><div className="form-grid"><label>ID<input name="username" required minLength={3} maxLength={64} pattern="[a-z0-9][a-z0-9_-]{2,63}" /></label><label>初期パスワード<input name="password" type="password" required minLength={12} maxLength={256} /></label><label>役職<select name="role_slug" defaultValue="mod"><option value="kyoso">教祖 / KYOSO</option><option value="mod">MOD</option><option value="admin">ADMIN</option><option value="taisho">大将</option><option value="daihyo">代表</option></select></label><label className="checkbox"><input name="is_active" type="checkbox" defaultChecked />有効にする</label></div><div className="form-actions"><button type="submit">IDを発行</button></div></form></section>
  <section className="admin-section"><h2>権限の管理</h2><div className="admin-list">{(accounts ?? []).map((account) => { const granted = new Set((permissions ?? []).filter((item) => item.staff_id === account.id && item.granted).map((item) => item.permission)); return <div className="admin-item" key={account.id}><h3>{account.username} <small>({account.role_slug})</small></h3><form action={updateStaffPermissions}><input type="hidden" name="staff_id" value={account.id} /><div className="form-grid">{staffPermissions.map((permission) => <label className="checkbox" key={permission}><input name={permission} type="checkbox" defaultChecked={granted.has(permission)} />{labels[permission]}</label>)}</div><div className="form-actions"><button type="submit">権限を保存</button></div></form></div>; })}{accounts?.length === 0 ? <p className="muted">まだスタッフIDはありません。</p> : null}</div></section></>;
}
