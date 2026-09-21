import Link from "next/link";
import type { StaffPermission } from "@/lib/staff-auth";

const links = [
  ["概要", "/admin", null],
  ["サイト設定", "/admin/settings", "media_manage"],
  ["ニュース", "/admin/news", "news_write"],
  ["憲章", "/admin/constitution", "constitution_write"],
  ["リアルタイム投票", "/admin/polls", "poll_manage"],
  ["メッセージ", "/admin/messages", "message_publish"],
  ["指導者", "/admin/leaders", "leader_manage"],
  ["役職", "/admin/roles", null],
  ["役職アカウント", "/admin/staff", null],
] as const;

export function AdminNav({ staffPermissions }: { staffPermissions?: StaffPermission[] }) {
  return (
    <aside className="admin-nav">
      <h1>管理画面</h1>
      <nav aria-label="管理メニュー">
        {links.filter(([, , permission]) => !staffPermissions || (permission && staffPermissions.includes(permission))).map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <p><Link href="/">公開サイトを見る</Link></p>
    </aside>
  );
}
