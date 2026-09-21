import { AdminPageHeader } from "@/components/admin/page-header";
import { triggerSiteEffect, updateSiteBackground, updateSiteSettings } from "@/app/admin/actions";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default async function SettingsPage() {
  const { data, error } = await createAdminClient().from("site_settings").select("key, value");
  if (error) throw new Error(`サイト設定を読み込めませんでした: ${error.message}`);
  const settings = new Map((data ?? []).map((row) => [row.key, stringValue(row.value)]));

  return (
    <>
      <AdminPageHeader title="サイト設定" />
      <section className="admin-section">
        <form action={updateSiteSettings}>
          <div className="form-grid">
            <label>サイト名<input name="site_name" required maxLength={200} defaultValue={settings.get("site_name")} /></label>
            <label>お問い合わせメール<input name="contact_email" type="email" maxLength={2000} defaultValue={settings.get("contact_email")} /></label>
            <label className="full">サイト説明<textarea name="site_description" maxLength={2000} defaultValue={settings.get("site_description")} /></label>
            <label className="full">憲章 前文<textarea name="constitution_preamble" maxLength={8000} rows={10} defaultValue={settings.get("constitution_preamble")} /></label>
          </div>
          <div className="form-actions"><button type="submit">保存</button></div>
        </form>
      </section>
      <section className="admin-section"><h2>期限付き背景</h2><p className="muted">教祖は最大1時間、ADMINは最大6時間です。</p><form action={updateSiteBackground} encType="multipart/form-data"><div className="form-grid"><label>背景画像<input name="background_file" type="file" accept="image/jpeg,image/png,image/webp" required /></label><label>表示時間（分）<input name="duration_minutes" type="number" min="1" max="360" defaultValue="60" /></label></div><div className="form-actions"><button type="submit">背景を設定</button></div></form></section>
      <section className="admin-section"><h2>特別演出</h2><p className="muted">教祖とADMINのみ実行できます。クラッカーまたは絵文字が画面上に降ります。</p><form action={triggerSiteEffect}><div className="form-grid"><label>演出<select name="effect" defaultValue="cracker"><option value="cracker">クラッカー</option><option value="emoji">絵文字</option></select></label><label>表示秒数（教祖最大60秒）<input name="duration_seconds" type="number" min="1" max="360" defaultValue="10" /></label></div><div className="form-actions"><button type="submit">演出開始</button></div></form></section>
    </>
  );
}
