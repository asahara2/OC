import { AdminPageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";
export default async function StaffAdminPage() {
  return <><AdminPageHeader title="役職アカウント" /><section className="admin-section"><h2>環境変数で管理</h2><p className="muted">スタッフのIDとパスワードはDBに保存せず、デプロイ先の環境変数で管理します。変更後は再デプロイしてください。</p><pre className="prose">{`KYOSO_USERNAME=kyoso-01\nKYOSO_PASSWORD=教祖専用の長いパスワード\nMOD_01_USERNAME=mod-01\nMOD_01_PASSWORD=MOD1専用の長いパスワード\nMOD_02_USERNAME=mod-02\nMOD_02_PASSWORD=MOD2専用の長いパスワード\nMOD_03_USERNAME=mod-03\nMOD_03_PASSWORD=MOD3専用の長いパスワード`}</pre><p>MODの追加権限は任意で <code>MOD_01_PERMISSIONS=message_publish,troll_publish</code> のように設定できます。</p></section></>;
}
