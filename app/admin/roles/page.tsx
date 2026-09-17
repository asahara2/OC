import { AdminPageHeader } from "@/components/admin/page-header";
import { createRole, deleteRole, updateRole } from "@/app/admin/actions";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const { data: roles, error } = await createAdminClient().from("roles").select("*").order("display_order").order("name");
  if (error) throw new Error(`役職を読み込めませんでした: ${error.message}`);

  return (
    <>
      <AdminPageHeader title="役職" />
      <section className="admin-section">
        <h2>役職を追加</h2>
        <form action={createRole}>
          <div className="form-grid">
            <label>名称<input name="name" required maxLength={100} /></label>
            <label>Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} /></label>
            <label>表示順<input name="display_order" type="number" defaultValue="0" required /></label>
            <label className="checkbox"> <input name="is_active" type="checkbox" defaultChecked />公開する</label>
            <label className="full">説明<textarea name="description" maxLength={5000} /></label>
          </div>
          <div className="form-actions"><button type="submit">追加</button></div>
        </form>
      </section>
      <section className="admin-section">
        <h2>既存の役職</h2>
        <div className="admin-list">
          {(roles ?? []).map((role) => <div className="admin-item" key={role.id}>
            <form action={updateRole}>
              <input type="hidden" name="id" value={role.id} />
              <div className="form-grid">
                <label>名称<input name="name" required maxLength={100} defaultValue={role.name} /></label>
                <label>Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} defaultValue={role.slug} /></label>
                <label>表示順<input name="display_order" type="number" required defaultValue={role.display_order} /></label>
                <label className="checkbox"><input name="is_active" type="checkbox" defaultChecked={role.is_active} />公開する</label>
                <label className="full">説明<textarea name="description" maxLength={5000} defaultValue={role.description} /></label>
              </div>
              <div className="form-actions"><button type="submit">更新</button></div>
            </form>
            <form action={deleteRole} className="row-actions"><input type="hidden" name="id" value={role.id} /><button type="submit" className="danger">削除</button></form>
          </div>)}
          {roles?.length === 0 ? <p className="muted">役職はまだありません。</p> : null}
        </div>
      </section>
    </>
  );
}
