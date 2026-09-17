import Link from "next/link";
import { ArrowIcon, Emblem } from "@/components/public/icons";
import { SectionHeading } from "@/components/public/section-heading";
import { OriginExperience } from "@/components/three/origin-experience";
import { NewsList } from "@/components/news-list";
import { LeaderList } from "@/components/public/leader-list";
import { ArticleList } from "@/components/public/article-list";
import type { ConstitutionArticle, NewsItem } from "@/lib/supabase/types";
import type { PublicLeader } from "@/lib/content";
import { INITIAL_SITE_NAME } from "@/lib/presentation";

type HomeProps = {
  identity: { name: string; description: string; email: string };
  news: NewsItem[];
  leaders: PublicLeader[];
  articles: ConstitutionArticle[];
};

export function HomeExperience({ identity, news, leaders, articles }: HomeProps) {
  return <div className="oc-home">
    <OriginExperience />
    <section className="oc-hero" aria-labelledby="hero-title">
      <div className="oc-hero-grid" aria-hidden="true"><span /><span /><span /></div>
      <div className="oc-hero-copy">
        <p className="oc-eyebrow"><span className="oc-live-dot" /> BEYOND THE ORIGIN</p>
        <h1 id="hero-title">{identity.name === INITIAL_SITE_NAME ? <>おっぱい<span>共同体<span className="oc-title-period">.</span></span></> : identity.name}</h1>
        <p className="oc-hero-description">{identity.description}</p>
        <div className="oc-hero-actions"><a href="#philosophy" className="oc-button oc-button-light">共同体を知る<ArrowIcon /></a>
          <Link href="/constitution" className="oc-text-link">憲章を読む<ArrowIcon diagonal /></Link></div>
      </div>
      <div className="oc-art-caption" aria-hidden="true"><span className="oc-crosshair">+</span><div>FIG. 01 — THE ORIGIN<small>DUALITY. UNITY. INFINITY.</small></div></div>
      <div className="oc-hero-bottom"><a href="#philosophy" className="oc-scroll-cue"><span />SCROLL TO EXPLORE</a><span>自由な探究、その先へ。</span><span className="oc-hero-coordinate">EXPLORE THE UNKNOWN &nbsp; / &nbsp; ∞</span></div>
      <span className="oc-hero-ghost" aria-hidden="true">ORIGIN</span>
    </section>
    <div className="oc-manifesto-strip"><span>QUESTION THE ORIGIN.</span><Emblem /><span>EMBRACE THE UNKNOWN.</span><Emblem /><span>PROGRESS FREELY.</span></div>
    <section className="oc-section oc-philosophy" id="philosophy" aria-labelledby="philosophy-title">
      <div className="oc-philosophy-symbol" aria-hidden="true"><div /><div /><span>OC / 01</span></div>
      <div className="oc-philosophy-copy"><p className="oc-eyebrow"><span>01</span>OUR PHILOSOPHY</p>
        <h2 id="philosophy-title">起源を問う。<br />自由を信じる。<br /><em>その先で、つながる。</em></h2>
        <p>あたりまえの向こう側に、まだ知らない世界がある。<br />私たちは、ひとつの問いから始まる共同体です。</p>
        <p>起源を探る好奇心。自分の道を選ぶ自由。<br />そして、異なる考えが出会うことで生まれる、新しい可能性。</p>
        <Link href="/constitution" className="oc-text-link">私たちの憲章<ArrowIcon diagonal /></Link>
      </div>
      <div className="oc-principles">{[
        ["01", "ORIGIN", "起源への探究", "問い続けることが、すべての始まり。"],
        ["02", "FREEDOM", "自由な進行", "ひとりひとりの意志で、その先へ。"],
        ["03", "COMMUNITY", "共に在ること", "違いを重ねて、新しい可能性を。"],
      ].map(([index, label, title, detail]) => <div key={index}><span className="oc-eyebrow">{index} / {label}</span><h3>{title}</h3><p>{detail}</p></div>)}</div>
    </section>
    <section className="oc-section oc-leaders-section" id="leadership">
      <SectionHeading index="02" label="THE PEOPLE" title="共同体を導く人々。"><Link href="/leaders" className="oc-text-link">指導者一覧<ArrowIcon diagonal /></Link></SectionHeading>
      <LeaderList leaders={leaders.slice(0, 3)} />
    </section>
    <section className="oc-section oc-charter-section" id="charter">
      <div className="oc-charter-intro"><p className="oc-eyebrow"><span>03</span>OUR CONSTITUTION</p><h2>自由にも、<br /><em>よりどころを。</em></h2>
        <p>共同体の理念と、共に歩むための指針。<br />私たちの意思を、ここに記す。</p><Link href="/constitution" className="oc-button oc-button-outline">共同体憲章を読む<ArrowIcon diagonal /></Link>
        <span className="oc-charter-seal" aria-hidden="true"><Emblem />THE OC CONSTITUTION</span></div>
      <div className="oc-charter-glass"><span className="oc-glass-label">THE LIVING PRINCIPLES <span>↗</span></span><ArticleList articles={articles.slice(0, 3)} compact /></div>
    </section>
    <section className="oc-section oc-news-section" id="latest">
      <SectionHeading index="04" label="LATEST DISPATCHES" title="共同体からのお知らせ。"><Link href="/news" className="oc-text-link">すべてのニュース<ArrowIcon diagonal /></Link></SectionHeading>
      <NewsList items={news.slice(0, 3)} />
    </section>
    <section className="oc-archive" aria-label="公開情報の件数"><div><p className="oc-eyebrow">OPEN ARCHIVE</p><h2>歩みを、ひらく。</h2></div><dl>{[
      [leaders.length, "公開中の指導者", "PEOPLE"], [articles.length, "公開中の憲章条文", "ARTICLES"], [news.length, "公開中のニュース", "DISPATCHES"],
    ].map(([count, label, english]) => <div key={english}><dt>{label}<span>{english}</span></dt><dd>{String(count).padStart(2, "0")}<span>↗</span></dd></div>)}</dl></section>
    <section className="oc-join" id="join" aria-labelledby="join-title"><div className="oc-join-orbit" aria-hidden="true" />
      <p className="oc-eyebrow"><span className="oc-live-dot" />THE NEXT CHAPTER</p>
      <h2 id="join-title">その好奇心が、<br />はじまりになる。</h2><p>まだ見ぬ起源へ。あなたの問いを、私たちと。</p>
      <a href={`mailto:${identity.email}`} className="oc-button oc-button-light">共同体に問い合わせる<ArrowIcon diagonal /></a>
      <small>YOUR JOURNEY BEGINS WITH A QUESTION.</small>
    </section>
  </div>;
}
