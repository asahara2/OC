import { AdminPageHeader } from "@/components/admin/page-header";
import { createLeader, deleteLeader, updateLeader } from "@/app/admin/actions";
import { requireStaffPermission } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function RoleOptions({ roles, selectedId }: { roles: { id: string; name: string }[]; selectedId?: string | null }) {
  return <select name="role_id" defaultValue={selectedId ?? ""}><option value="">役職なし</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>;
}

export default async function LeadersPage() {
  await requireStaffPermission("leader_manage");
  const client = createAdminClient();
  const [{ data: leaders, error: leaderError }, { data: roles, error: roleError }] = await Promise.all([
    client.from("leaders").select("*").order("display_order").order("name"),
    client.from("roles").select("id, name, slug").in("slug", ["kyoso", "admin", "mod"]).order("display_order").order("name"),
  ]);
  if (leaderError || roleError) throw new Error(`指導者情報を読み込めませんでした: ${leaderError?.message ?? roleError?.message}`);
  const roleOptions = roles ?? [];

  return (
    <>
      <AdminPageHeader title="指導者" />
      <section className="admin-section">
        <h2>指導者を追加</h2>
        <form action={createLeader} encType="multipart/form-data">
          <div className="form-grid">
            <label>氏名<input name="name" required maxLength={160} /></label>
            <label>Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} /></label>
            <label>役職<RoleOptions roles={roleOptions} /></label>
            <label>表示順<input name="display_order" type="number" defaultValue="0" required /></label>
            <label className="full">画像 URL<input name="image_url" type="url" inputMode="url" maxLength={2048} /></label>
            <label className="full">端末から画像を選択（URLより優先）<input name="image_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
            <label className="full">略歴<textarea name="biography" maxLength={20000} /></label>
            <label className="checkbox"><input name="is_active" type="checkbox" defaultChecked />公開する</label>
            <label className="checkbox"><input name="mod_leader_approved" type="checkbox" />MODを指導者として公開許可</label>
          </div>
          <div className="form-actions"><button type="submit">追加</button></div>
        </form>
      </section>
      <section className="admin-section">
        <h2>既存の指導者</h2>
        <div className="admin-list">
          {(leaders ?? []).map((leader) => <div className="admin-item" key={leader.id}>
            <form action={updateLeader} encType="multipart/form-data">
              <input type="hidden" name="id" value={leader.id} />
              <div className="form-grid">
                <label>氏名<input name="name" required maxLength={160} defaultValue={leader.name} /></label>
                <label>Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} defaultValue={leader.slug} /></label>
                <label>役職<RoleOptions roles={roleOptions} selectedId={leader.role_id} /></label>
                <label>表示順<input name="display_order" type="number" required defaultValue={leader.display_order} /></label>
                <label className="full">画像 URL<input name="image_url" type="url" inputMode="url" maxLength={2048} defaultValue={leader.image_url ?? ""} /></label>
                <label className="full">端末から画像を選択（選んだ場合はURLより優先）<input name="image_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
                <label className="full">略歴<textarea name="biography" maxLength={20000} defaultValue={leader.biography} /></label>
                <label className="checkbox"><input name="is_active" type="checkbox" defaultChecked={leader.is_active} />公開する</label>
                <label className="checkbox"><input name="mod_leader_approved" type="checkbox" defaultChecked={leader.mod_leader_approved} />MODを指導者として公開許可</label>
              </div>
              <div className="form-actions"><button type="submit">更新</button></div>
            </form>
            <form action={deleteLeader} className="row-actions"><input type="hidden" name="id" value={leader.id} /><button type="submit" className="danger">削除</button></form>
          </div>)}
          {leaders?.length === 0 ? <p className="muted">指導者はまだありません。</p> : null}
        </div>
      </section>
    </>
  );
}
