"use client";

import { useEffect, useState } from "react";

export function AutoScrollToggle() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => window.scrollBy({ top: 1, behavior: "auto" }), 45);
    return () => window.clearInterval(timer);
  }, [enabled]);
  return <button className="oc-auto-scroll" type="button" aria-pressed={enabled} onClick={() => setEnabled((value) => !value)}>{enabled ? "自動スクロール停止" : "自動スクロール"}</button>;
}
