"use client";

import { useEffect, useRef, useState } from "react";
import type { CommunityMessage } from "@/lib/supabase/types";

const shownForMs = 10_000;

export function LiveMessageBanner({ initialMessages }: { initialMessages: CommunityMessage[] }) {
  const [active, setActive] = useState<CommunityMessage | null>(initialMessages[0] ?? null);
  const seen = useRef(new Set(initialMessages.map((message) => message.id)));
  useEffect(() => {
    if (!active) return;
    const timeout = window.setTimeout(() => setActive(null), shownForMs);
    return () => window.clearTimeout(timeout);
  }, [active]);
  useEffect(() => {
    const refresh = async () => {
      const response = await fetch("/api/messages", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json() as { data?: CommunityMessage[] };
      const next = payload.data?.find((message) => !seen.current.has(message.id));
      for (const message of payload.data ?? []) seen.current.add(message.id);
      if (next) setActive(next);
    };
    const interval = window.setInterval(refresh, 5_000);
    return () => window.clearInterval(interval);
  }, []);
  if (!active) return null;
  return <aside className={`oc-live-message oc-live-message-${active.kind}`} role="status" aria-live="polite"><span>{active.kind === "troll" ? "TROLL" : "LIVE MESSAGE"}</span><p>{active.body}</p><button type="button" onClick={() => setActive(null)} aria-label="メッセージを閉じる">×</button></aside>;
}
