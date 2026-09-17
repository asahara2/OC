import { AdminPageHeader } from "@/components/admin/page-header";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function count(table: "news" | "leaders" | "roles" | "constitution_articles") {
  const { count: result, error } = await createAdminClient().from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`管理情報を読み込めませんでした: ${error.message}`);
  return result ?? 0;
}

export default async function AdminDashboardPage() {
  const [news, leaders, roles, articles] = await Promise.all([
    count("news"), count("leaders"), count("roles"), count("constitution_articles"),
  ]);
  return (
    <>
      <AdminPageHeader title="概要" />
      <p className="muted">公開コンテンツと組織情報を管理します。</p>
      <div className="admin-grid">
        <div className="stat"><strong>{news}</strong>ニュース</div>
        <div className="stat"><strong>{articles}</strong>憲章条文</div>
        <div className="stat"><strong>{leaders}</strong>指導者</div>
        <div className="stat"><strong>{roles}</strong>役職</div>
      </div>
    </>
  );
}
