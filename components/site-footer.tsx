import Link from "next/link";
import { ArrowIcon, Emblem } from "@/components/public/icons";
import { CONTACT_EMAIL } from "@/lib/presentation";

export function SiteFooter({ siteName, contactEmail }: { siteName: string; contactEmail: string }) {
  return <footer className="oc-footer">
    <div className="oc-footer-horizon" aria-hidden="true" />
    <div className="oc-footer-top">
      <div><Emblem /><p className="oc-footer-name">{siteName}</p><p className="oc-caption">OC新興宗教団体</p></div>
      <div className="oc-footer-contact"><span className="oc-eyebrow">START A CONVERSATION</span>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}<ArrowIcon diagonal /></a>
        {contactEmail && contactEmail !== CONTACT_EMAIL ? <a className="oc-extra-contact" href={`mailto:${contactEmail}`}>{contactEmail}</a> : null}
      </div>
      <div className="oc-footer-links"><Link href="/constitution">共同体憲章</Link><Link href="/news">ニュース</Link><a href="#top">ページの先頭へ ↑</a></div>
    </div>
    <div className="oc-footer-bottom"><small>© {new Date().getFullYear()} OPPAI COMMUNITY</small><small>サイトデザイナー：<span>素晴らしい尊師</span></small><span className="oc-footer-end">THE ORIGIN IS ONLY THE BEGINNING.</span></div>
  </footer>;
}
