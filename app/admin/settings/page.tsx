import { AdminPageHeader } from "@/components/admin/page-header";
import { updateSiteSettings } from "@/app/admin/actions";
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
    </>
  );
}
