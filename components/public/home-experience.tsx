import Link from "next/link";
import { ArrowIcon, Emblem } from "@/components/public/icons";
import { OriginExperience } from "@/components/three/origin-experience";
import { NewsList } from "@/components/news-list";
import { CoreInspection } from "./core-inspection";
import { AssemblyExhibit } from "./assembly-exhibit";
import type { ConstitutionArticle, NewsItem } from "@/lib/supabase/types";
import type { PublicLeader, PublicPoll } from "@/lib/content";
import { INITIAL_SITE_NAME } from "@/lib/presentation";

type HomeProps = {
  identity: { name: string; description: string; email: string };
  news: NewsItem[];
  leaders: PublicLeader[];
  articles: ConstitutionArticle[];
  polls: PublicPoll[];
};

export function HomeExperience({ identity, news, leaders, articles, polls }: HomeProps) {
  // Respect the existing public order; do not invent a new hierarchy or role.
  const leader = leaders[0];
  return <div className="oc-home oc-journey">
    <OriginExperience />
    <div className="oc-entry" aria-hidden="true"><span>OC</span><small>ENTER THE UNKNOWN</small></div>
    <section className="oc-hero" id="origin" aria-labelledby="hero-title">
      <div className="oc-hero-copy" data-spatial-panel>
        <p className="oc-eyebrow"><span className="oc-live-dot" /> AN INQUIRY INTO EXISTENCE</p>
        <h1 id="hero-title">{identity.name === INITIAL_SITE_NAME ? <>おっぱい<span>共同体</span></> : identity.name}</h1>
        <p className="oc-hero-description">{identity.description}</p>
        <div className="oc-hero-actions"><a href="#philosophy" className="oc-button oc-button-light">共同体を知る<ArrowIcon /></a><Link href="/constitution" className="oc-text-link">憲章を読む<ArrowIcon diagonal /></Link></div>
      </div>
      <div className="oc-art-caption" aria-hidden="true"><span className="oc-crosshair">+</span><div>ORIGIN CORE<small>EVERYTHING BEGINS WITH A QUESTION.</small></div></div>
      <div className="oc-hero-bottom"><a href="#philosophy" className="oc-scroll-cue"><span />SCROLL TO ENTER</a><span>この先に、まだ知らない世界。</span><span>01 / THE ORIGIN</span></div>
      <span className="oc-world-word" aria-hidden="true">ORIGIN</span>
    </section>
    <section className="oc-chamber oc-core-chamber" id="philosophy" aria-labelledby="philosophy-title">
      <div className="oc-chamber-heading" data-spatial-panel><p className="oc-eyebrow"><span>02 /</span> ORIGIN CORE</p><h2 id="philosophy-title">起源を問う。<br /><em>共に、在る。</em></h2><p className="oc-chamber-description">ひとつの答えではなく、問い続ける自由を。<br />異なる存在が、同じ空間で出会う。</p><CoreInspection /></div>
      <div className="oc-spatial-principles">{[["FREEDOM", "自由", "自ら問い、自ら選ぶ。"], ["EQUALITY", "平等", "異なる声が、等しく在る。"], ["PEACE", "平和", "対話から、共に歩む。"]].map(([en, title, text], i) => <div key={en} data-spatial-panel><span className="oc-eyebrow">0{i + 1} — {en}</span><h3>{title}</h3><p>{text}</p></div>)}</div>
      <Link href="/constitution" className="oc-text-link oc-chamber-exit">私たちの憲章<ArrowIcon diagonal /></Link>
    </section>
    <section className="oc-chamber oc-temple" id="leadership" aria-labelledby="leader-title">
      <div className="oc-temple-heading"><p className="oc-eyebrow"><span>03 /</span> THE LEADER</p><h2 id="leader-title">意思を、灯す。</h2></div>
      <div className="oc-leader-exhibition">
        <div className="oc-exhibition-portrait" data-spatial-panel>
          {leader?.image_url ?
            // Keep the existing DB image URL and native lazy loading.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={leader.image_url} alt={`${leader.name}の肖像`} loading="lazy" decoding="async" />
            : <div className="oc-vacant-portrait" aria-hidden="true"><Emblem /><span>{leader ? "OC / LEADERSHIP" : "AWAITING A PRESENCE"}</span></div>}
          <span className="oc-exhibition-coordinate" aria-hidden="true">ARCHIVE / L—01</span>
        </div>
        <div className="oc-exhibition-copy" data-spatial-panel>{leader ? <><p className="oc-eyebrow">{leader.role?.name ?? "COMMUNITY"}</p><h3>{leader.name}</h3><p className="oc-leader-bio">{leader.biography}</p></> : <><p className="oc-eyebrow">LEADERSHIP ARCHIVE</p><h3>ここに、意思が宿る。</h3><p className="oc-chamber-description">現在、公開中の指導者はいません。</p></>}
          <Link href="/leaders" className="oc-text-link">指導者一覧<ArrowIcon diagonal /></Link>
        </div>
      </div>
      {leaders.length > 1 ? <div className="oc-leader-register" aria-label="その他の指導者">{leaders.slice(1, 3).map((person) => <div key={person.id}><span>{person.role?.name ?? "COMMUNITY"}</span><h3>{person.name}</h3></div>)}</div> : null}
    </section>
    <section className="oc-chamber oc-digital-archive" id="charter" aria-labelledby="charter-title">
      <div className="oc-archive-heading"><p className="oc-eyebrow"><span>04 /</span> CONSTITUTION ARCHIVE</p><h2 id="charter-title">意思は、<br /><em>ここに記される。</em></h2><p className="oc-chamber-description">共に歩むための指針。<br />未来へと続く、共同体の記録。</p><Link href="/constitution" className="oc-text-link">共同体憲章を読む<ArrowIcon diagonal /></Link></div>
      <div className="oc-document-corridor">{articles.length ? articles.slice(0, 3).map((article) => <article key={article.id} className="oc-archive-panel" data-spatial-panel>
        <div className="oc-document-index"><span>ARTICLE {String(article.article_number).padStart(2, "0")}</span><Emblem /></div><p className="oc-eyebrow">第 {article.article_number} 条</p><h3>{article.title}</h3><p className="prose">{article.content}</p><span className="oc-document-bottom" aria-hidden="true">OC / CONSTITUTION ARCHIVE</span>
      </article>) : <div className="oc-archive-panel oc-archive-awaiting" data-spatial-panel><div className="oc-document-index"><span>ARCHIVE / OPEN</span><Emblem /></div><h3>まだ、白紙の先へ。</h3><p>現在、公開中の条文はありません。</p></div>}</div>
    </section>
    <section className="oc-chamber oc-network" id="latest" aria-labelledby="network-title">
      <div className="oc-network-heading" data-spatial-panel><p className="oc-eyebrow"><span>05 /</span> THE NETWORK</p><h2 id="network-title">ひとつの問いが、<br /><em>つながっていく。</em></h2><p className="oc-chamber-description">点から、線へ。線から、共同体へ。</p></div>
      <div className="oc-real-stats"><p className="oc-eyebrow">PUBLIC RECORDS / 公開情報の件数</p><dl>{[[leaders.length, "公開中の指導者", "PEOPLE"], [articles.length, "公開中の憲章条文", "ARTICLES"], [news.length, "公開中のニュース", "DISPATCHES"]].map(([count, label, en]) => <div key={en}><dt>{label}<span>{en}</span></dt><dd>{String(count).padStart(2, "0")}</dd></div>)}</dl><small>取得した公開レコード数です。背景のノードは空間演出であり、会員や実際のつながりを表しません。</small></div>
      <div className="oc-network-dispatches"><div className="oc-dispatch-heading"><h3>共同体からのお知らせ</h3><Link href="/news" className="oc-text-link">すべてのニュース<ArrowIcon diagonal /></Link></div><NewsList items={news.slice(0, 3)} /></div>
    </section>
    <section className="oc-chamber oc-assembly" id="assembly" aria-labelledby="assembly-title">
      <div className="oc-assembly-heading"><p className="oc-eyebrow"><span>06 /</span> THE ASSEMBLY</p><h2 id="assembly-title">声が集まり、<br /><em>未来をかたどる。</em></h2><p className="oc-chamber-description">共同体総会</p></div>
      <AssemblyExhibit poll={polls[0]} />
      <div className="oc-assembly-invitation" id="join"><p>あなたの問いを、この空間へ。</p><a href={`mailto:${identity.email}`} className="oc-button oc-button-outline">共同体に問い合わせる<ArrowIcon diagonal /></a></div>
    </section>
  </div>;
}
