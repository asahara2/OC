"use client";

import type { PublicSettings } from "@/lib/content";

const emoji = ["🎉", "✨", "🎊", "💫", "🌸", "⭐"];

export function SiteVisuals({ settings }: { settings: PublicSettings }) {
  const particles = Array.from({ length: 28 }, (_, index) => <span key={index} style={{ left: `${(index * 37) % 100}%`, animationDuration: `${2.5 + (index % 5) * .35}s`, animationDelay: `${(index % 7) * .12}s` }}>{settings.activeEffect === "emoji" ? emoji[index % emoji.length] : "▰"}</span>);
  return <>{settings.backgroundUrl ? <div className="oc-expiring-background" style={{ backgroundImage: `linear-gradient(#05040788,#05040788),url(${settings.backgroundUrl})` }} aria-hidden="true" /> : null}{settings.activeEffect ? <div className={`oc-site-effect oc-site-effect-${settings.activeEffect}`} aria-hidden="true">{particles}</div> : null}</>;
}
