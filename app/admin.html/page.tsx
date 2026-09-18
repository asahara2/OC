import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ScriptAdminPage() {
  return <main className="admin-content">
    <h1>Script Admin Console</h1>
    <p className="muted">運営スクリプト専用の入口です。公開サイトには表示されません。</p>
    <div className="admin-grid">
      <Link className="card" href="/admin/news"><h2>ニュース操作</h2><p>公式発表・添削・メディア投稿</p></Link>
      <Link className="card" href="/admin/constitution"><h2>憲章操作</h2><p>条文の追加・編集・公開</p></Link>
      <Link className="card" href="/admin"><h2>運営パネル</h2><p>役職・権限・投票管理</p></Link>
    </div>
  </main>;
}
