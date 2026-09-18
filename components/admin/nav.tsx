import Link from "next/link";

const links = [
  ["概要", "/admin"],
  ["サイト設定", "/admin/settings"],
  ["ニュース", "/admin/news"],
  ["憲章", "/admin/constitution"],
  ["リアルタイム投票", "/admin/polls"],
  ["メッセージ", "/admin/messages"],
  ["指導者", "/admin/leaders"],
  ["役職", "/admin/roles"],
  ["役職アカウント", "/admin/staff"],
] as const;

export function AdminNav() {
  return (
    <aside className="admin-nav">
      <h1>管理画面</h1>
      <nav aria-label="管理メニュー">
        {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <p><Link href="/">公開サイトを見る</Link></p>
    </aside>
  );
}
