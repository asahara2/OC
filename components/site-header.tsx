import Link from "next/link";

type SiteHeaderProps = { siteName: string };

export function SiteHeader({ siteName }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="site-title">{siteName}</Link>
        <nav aria-label="メインナビゲーション">
          <Link href="/news">ニュース</Link>
          <Link href="/constitution">憲章</Link>
          <Link href="/leaders">指導者</Link>
        </nav>
      </div>
    </header>
  );
}
