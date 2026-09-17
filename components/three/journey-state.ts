import { useEffect, useRef } from "react";

// Stops follow real document flow, including long DB text and the footer.
// Wheel, touch, keyboard scrolling and browser restoration stay native.
export const JOURNEY_STOPS = [
  { id: "origin", label: "THE ORIGIN", title: "起源" },
  { id: "philosophy", label: "ORIGIN CORE", title: "理念" },
  { id: "leadership", label: "THE LEADER", title: "指導者" },
  { id: "charter", label: "THE ARCHIVE", title: "憲章" },
  { id: "latest", label: "THE NETWORK", title: "ニュース" },
  { id: "assembly", label: "THE ASSEMBLY", title: "総会" },
  { id: "final-void", label: "FINAL VOID", title: "終着点" },
] as const;
export type JourneyState = { progress: number; pointerX: number; pointerY: number; pointerActive: boolean; inspecting: boolean };
export const INSPECT_CORE = "oc:inspect-core";

export function journeyProgress(scroll: number, stops: number[]) {
  if (scroll <= stops[0]) return 0;
  for (let i = 0; i < stops.length - 1; i++) {
    if (scroll <= stops[i + 1]) return (i + (scroll - stops[i]) / Math.max(1, stops[i + 1] - stops[i])) / (stops.length - 1);
  }
  return 1;
}

export function useJourney(motion: boolean) {
  const state = useRef<JourneyState>({ progress: 0, pointerX: 0, pointerY: 0, pointerActive: false, inspecting: false });
  useEffect(() => {
    const home = document.querySelector<HTMLElement>(".oc-home");
    const site = home?.closest<HTMLElement>(".public-site");
    if (!home || !site) return;
    const sections = JOURNEY_STOPS.map(({ id }) => document.getElementById(id));
    const panels = Array.from(home.querySelectorAll<HTMLElement>("[data-spatial-panel]"));
    const links = Array.from(home.querySelectorAll<HTMLAnchorElement>(".oc-journey-map a"));
    let offsets: number[] = [], panelOffsets: number[] = [], frame = 0;
    function update() {
      frame = 0;
      const scroll = window.scrollY;
      state.current.progress = journeyProgress(scroll, offsets);
      const index = Math.min(6, Math.floor(state.current.progress * 6 + 0.35));
      home!.dataset.journeyScene = JOURNEY_STOPS[index].id;
      site!.style.setProperty("--journey-progress", state.current.progress.toFixed(4));
      links.forEach((link, i) => { if (i === index) link.setAttribute("aria-current", "step"); else link.removeAttribute("aria-current"); });
      panels.forEach((panel, i) => {
        const distance = Math.max(-1, Math.min(1, (panelOffsets[i] - scroll - window.innerHeight * 0.5) / window.innerHeight));
        panel.style.setProperty("--spatial-offset", motion ? distance.toFixed(3) : "0");
      });
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    function measure() {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      offsets = sections.map((section, i) => i === 0 ? 0 : i === 6 ? max : Math.min(max, Math.max(0, (section?.getBoundingClientRect().top ?? 0) + window.scrollY - window.innerHeight * 0.15)));
      panelOffsets = panels.map((panel) => {
        let top = panel.offsetHeight / 2;
        for (let item: HTMLElement | null = panel; item; item = item.offsetParent as HTMLElement | null) top += item.offsetTop;
        return top;
      });
      schedule();
    }
    function pointer(event: PointerEvent) {
      const weight = event.pointerType === "mouse" ? 1 : 0.16;
      state.current.pointerX = (event.clientX / window.innerWidth - 0.5) * 2 * weight;
      state.current.pointerY = -(event.clientY / window.innerHeight - 0.5) * 2 * weight;
      state.current.pointerActive = event.pointerType === "mouse";
    }
    const leave = () => { state.current.pointerX = 0; state.current.pointerY = 0; state.current.pointerActive = false; };
    const observer = new ResizeObserver(measure); observer.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("pointerdown", pointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    measure();
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", pointer); window.removeEventListener("pointerdown", pointer);
      document.documentElement.removeEventListener("pointerleave", leave);
      site.style.removeProperty("--journey-progress");
    };
  }, [motion]);
  return state;
}
