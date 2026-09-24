/* eslint-disable @next/next/no-img-element -- leader portraits are administrator-supplied URLs. */
import Link from "next/link";

import type { PublicLeader, PublicPoll } from "@/lib/content";
import type { ConstitutionArticle, NewsItem } from "@/lib/supabase/types";
import { formatDate } from "@/lib/content";

type ClassicHomeProps = {
  identity: { name: string; description: string; email: string };
  heroImageUrl: string;
  news: NewsItem[];
  leaders: PublicLeader[];
  articles: ConstitutionArticle[];
  polls: PublicPoll[];
};

const menuCards = [
  ["共同体について", "おっぱい共同体の理念と歩み", "/constitution"],
  ["思想と文化", "自由・平等・平和・ユーモア", "/constitution"],
  ["参加する", "投票や日々の活動に参加する", "/polls"],
  ["活動する", "ニュースと共同体の記録", "/news"],
  ["よくある質問", "はじめての方はこちら", "#faq"],
] as const;

export function ClassicHomeExperience({ identity, heroImageUrl, news, leaders, articles, polls }: ClassicHomeProps) {
  const lead = leaders[0];
  return <div className="classic-home">
    <section className="classic-hero"><div className="classic-container classic-hero-inner"><div><p className="classic-kicker">おっぱい共同体</p><h1>{identity.name}</h1><p>{identity.description}</p><div className="classic-hero-actions"><Link href="/constitution">共同体について</Link><Link href="/polls">投票に参加する</Link></div></div><div className="classic-hero-media">{heroImageUrl ? <img src={heroImageUrl} alt="共同体のヘッダー画像" /> : <div className="classic-seal" aria-hidden="true">OC<span>共同体</span></div>}</div></div></section>
    <section className="classic-container classic-alerts"><div className="classic-section-title"><span>重要なお知らせ</span><Link href="/news">一覧を見る</Link></div>{news.slice(0, 3).map((item) => <Link className="classic-alert" href={`/news/${item.slug}`} key={item.id}><time dateTime={item.published_at ?? undefined}>{formatDate(item.published_at)}</time><strong>{item.title}</strong><span>›</span></Link>)}{news.length === 0 ? <p className="classic-muted">現在、お知らせはありません。</p> : null}</section>
    <section className="classic-container classic-intro"><p className="classic-kicker">共同体のご案内</p><h2>くだらないものを、<br />本気で。</h2><p>おっぱい共同体は、自由・平等・平和・ユーモアを基本に、創作、議論、技術、娯楽を楽しむ自主的な共同体です。小さな発想を大切にし、誰もが自分の問いを持ち寄れる場所を目指しています。</p><Link className="classic-more" href="/constitution">憲章を読む　›</Link></section>
    <section className="classic-container classic-menu"><div className="classic-section-title"><span>共同体メニュー</span></div><div className="classic-card-grid">{menuCards.map(([title, text, href]) => <Link className="classic-card" href={href} key={href}><span className="classic-card-mark">●</span><h3>{title}</h3><p>{text}</p><span className="classic-more">詳しく見る　›</span></Link>)}</div></section>
    <section className="classic-records"><div className="classic-container"><div className="classic-section-title"><span>活動と記録</span><Link href="/news">ニュース一覧</Link></div><div className="classic-record-grid">{news.slice(0, 3).map((item, index) => <Link className="classic-record-card" href={`/news/${item.slug}`} key={item.id}><div className="classic-record-image">{item.image_url ? <img src={item.image_url} alt="" loading="lazy" /> : heroImageUrl && index === 0 ? <img src={heroImageUrl} alt="" loading="lazy" /> : <span aria-hidden="true">OC</span>}</div><div className="classic-record-body"><time dateTime={item.published_at ?? undefined}>{formatDate(item.published_at)}</time><h3>{item.title}</h3><span>記事を読む　›</span></div></Link>)}{news.length === 0 ? <p className="classic-muted">公開中の活動記録はありません。</p> : null}</div></div></section>
    <section className="classic-band"><div className="classic-container classic-columns"><div><p className="classic-kicker">指導者</p><h2>共同体を導く人々</h2><p>それぞれの視点から、共同体の問いと活動を支えます。</p><Link className="classic-more" href="/leaders">指導者を見る　›</Link></div><div className="classic-leader-card">{lead?.image_url ? <img src={lead.image_url} alt="" /> : <div className="classic-leader-placeholder">OC</div>}<div><p>{lead?.role?.name ?? "共同体"}</p><h3>{lead?.name ?? "現在、公開中の指導者はいません"}</h3></div></div></div></section>
    <section className="classic-container classic-poll"><div><p className="classic-kicker">共同体の声</p><h2>現在の投票</h2>{polls[0] ? <><h3>{polls[0].title}</h3><p>{polls[0].description}</p></> : <p className="classic-muted">現在、公開中の投票はありません。</p>}</div><Link className="classic-outline" href="/polls">投票ページへ　›</Link></section>
    <section className="classic-container classic-constitution"><div className="classic-section-title"><span>憲章から</span><Link href="/constitution">全文を見る</Link></div>{articles.slice(0, 3).map((article) => <article key={article.id}><span>第{article.article_number}条</span><h3>{article.title}</h3><p>{article.content}</p></article>)}</section>
    <section className="classic-container classic-faq" id="faq"><p className="classic-kicker">よくある質問</p><h2>はじめての方へ</h2><details><summary>おっぱい共同体とは何ですか？</summary><p>自由に考え、語り、創造するためのインターネット上の自主的な共同体です。</p></details><details><summary>参加に費用はかかりますか？</summary><p>参加を理由に不合理な金銭の提供を求めることはありません。</p></details></section>
    <section className="classic-contact" id="contact"><div className="classic-container"><p className="classic-kicker">お問い合わせ</p><h2>共同体について、<br />お気軽にご連絡ください。</h2><a href={`mailto:${identity.email}`}>{identity.email}　›</a></div></section>
  </div>;
}
