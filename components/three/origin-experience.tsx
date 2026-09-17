"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useState, type ReactNode } from "react";
import { JOURNEY_STOPS, useJourney } from "./journey-state";

export type Quality = "high" | "medium" | "low";
const OriginCanvas = dynamic(() => import("./origin-canvas"), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function OriginExperience() {
  const [quality, setQuality] = useState<Quality | null>(null);
  const [reduced, setReduced] = useState(true);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const journey = useJourney(!reduced && !paused);
  const onFailure = useCallback(() => { setFailed(true); setReady(false); }, []);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduced(preference.matches);
    syncMotion();
    preference.addEventListener("change", syncMotion);
    const probe = document.createElement("canvas");
    let supported = false;
    try {
      const context = probe.getContext("webgl2");
      supported = Boolean(context);
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch { supported = false; }
    if (!supported) setFailed(true);
    else {
      const hardware = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const low = hardware.connection?.saveData || (hardware.deviceMemory ?? 8) <= 4 || (hardware.hardwareConcurrency ?? 8) <= 4;
      setQuality(low ? "low" : coarse || window.innerWidth < 1100 ? "medium" : "high");
    }
    return () => preference.removeEventListener("change", syncMotion);
  }, []);

  return <>
    <div className="oc-scene" aria-hidden="true" data-renderer={failed ? "fallback" : ready ? "webgl" : "loading"} data-quality={quality ?? "none"} data-motion={reduced || paused ? "still" : "full"}>
      <div className="oc-scene-fallback"><div className="oc-fallback-orb" /><div className="oc-fallback-orb" /><div className="oc-fallback-orbit" /></div>
      {quality && !failed ? <SceneBoundary onFailure={onFailure}><OriginCanvas quality={quality} journey={journey} reduced={reduced} motion={!reduced && !paused} onFailure={onFailure} onReady={onReady} /></SceneBoundary> : null}
      <div className="oc-scene-vignette" />
    </div>
    <nav className="oc-journey-map" aria-label="空間の各地点へ移動">{JOURNEY_STOPS.map((stop, index) => <a href={`#${stop.id}`} key={stop.id} aria-label={`${index + 1}. ${stop.title}`}><span>{stop.label}</span><i aria-hidden="true" /></a>)}</nav>
    {ready && !reduced ? <button type="button" className="oc-motion-toggle" aria-pressed={paused} onClick={() => setPaused(!paused)}>
      <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>{paused ? "空間の動きを再開" : "空間の動きを止める"}
    </button> : null}
  </>;
}
