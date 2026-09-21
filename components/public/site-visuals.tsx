"use client";

import { useEffect, useState } from "react";
import type { PublicSettings } from "@/lib/content";

const emoji = ["🎉", "✨", "🎊", "💫", "🌸", "⭐"];

export function SiteVisuals({ settings }: { settings: PublicSettings }) {
  const [current, setCurrent] = useState(settings);
  useEffect(() => {
    const refresh = async () => { const response = await fetch("/api/site-settings", { cache: "no-store" }); if (response.ok) { const payload = await response.json() as { data?: PublicSettings }; if (payload.data) setCurrent(payload.data); } };
    const timer = window.setInterval(refresh, 5_000); return () => window.clearInterval(timer);
  }, []);
  const particles = Array.from({ length: 28 }, (_, index) => <span key={index} style={{ left: `${(index * 37) % 100}%`, animationDuration: `${2.5 + (index % 5) * .35}s`, animationDelay: `${(index % 7) * .12}s` }}>{current.activeEffect === "emoji" ? emoji[index % emoji.length] : "▰"}</span>);
  return <>{current.backgroundUrl ? <div className="oc-expiring-background" style={{ backgroundImage: `linear-gradient(#05040788,#05040788),url(${current.backgroundUrl})` }} aria-hidden="true" /> : null}{current.activeEffect ? <div className={`oc-site-effect oc-site-effect-${current.activeEffect}`} aria-hidden="true">{particles}</div> : null}</>;
}
