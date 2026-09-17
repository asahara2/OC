"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowIcon, Emblem } from "@/components/public/icons";
import { ShareSiteButton } from "@/components/public/share-site-button";

const links = [["理念", "/#philosophy"], ["指導者", "/leaders"], ["共同体憲章", "/constitution"], ["ニュース", "/news"]] as const;

export function SiteHeader({ siteName }: { siteName: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    const outside = (event: PointerEvent) => { if (!header.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", escape); document.removeEventListener("pointerdown", outside); };
  }, [open]);
  return <header ref={header} className="oc-header" data-scrolled={scrolled} data-open={open}>
    <Link href="/" className="oc-wordmark" aria-label={`${siteName} トップページ`} onClick={() => setOpen(false)}>
      <Emblem /><span>{siteName}<small>OPPAI COMMUNITY</small></span>
    </Link>
    <button ref={toggle} className="oc-menu-toggle" aria-controls="public-navigation" aria-expanded={open}
      aria-label={open ? "メニューを閉じる" : "メニューを開く"} onClick={() => setOpen(!open)}><span /><span /></button>
    <nav id="public-navigation" className="oc-navigation" aria-label="メインナビゲーション">
      {links.map(([label, href], index) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}><small>0{index + 1}</small>{label}</Link>)}
      <ShareSiteButton />
      <Link href="/#join" className="oc-nav-join" onClick={() => setOpen(false)}>共同体への扉<ArrowIcon diagonal /></Link>
    </nav>
  </header>;
}
