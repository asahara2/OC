"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { Quality } from "./origin-experience";
import { INSPECT_CORE, type JourneyState } from "./journey-state";
import { cameraPath, gazePath, createJourneyWorld } from "./journey-world";

type Props = { quality: Quality; motion: boolean; reduced: boolean; journey: RefObject<JourneyState>; onFailure: () => void; onReady: () => void };

export default function OriginCanvas({ quality, motion, reduced, journey, onFailure, onReady }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const motionRef = useRef(motion);
  const reducedRef = useRef(reduced);
  const wake = useRef<() => void>(() => {});
  useEffect(() => { motionRef.current = motion; wake.current(); }, [motion]);
  useEffect(() => { reducedRef.current = reduced; wake.current(); }, [reduced]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: element, alpha: true, antialias: quality !== "low", powerPreference: quality === "low" ? "low-power" : "high-performance", stencil: false }); }
    catch { onFailure(); return; }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x040406, 0);
    let world: ReturnType<typeof createJourneyWorld>;
    try { world = createJourneyWorld(renderer, quality); }
    catch { renderer.dispose(); renderer.forceContextLoss(); onFailure(); return; }
    const { scene, camera, fog, core, orbit, orbitMaterial, keyLight, pinkLight, rim, foreground } = world;
    const position = new THREE.Vector3(), gaze = new THREE.Vector3(), projected = new THREE.Vector3();
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
    let width = 1, height = 1, mobile = false, pixelRatio = 1;
    let frame = 0, stillFrame = 0, disposed = false, previous = 0, elapsed = 0, sampleTime = 0, samples = 0, ready = false, stillStop = -1;
    let progress = journey.current.progress, hover = 0, pointerDown: { x: number; y: number; scroll: number } | null = null;
    const maxDpr = quality === "high" ? 1.75 : quality === "medium" ? 1.25 : 1;
    const frameInterval = quality === "high" ? 1000 / 60 : 1000 / 30;
    const home = element.closest<HTMLElement>(".oc-home");

    function intersects(x: number, y: number) {
      if (!core.visible || progress > 0.28) return false;
      pointer.set(x / width * 2 - 1, -(y / height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(world.interactive, false).length > 0;
    }
    function render(timestamp: number, force = false) {
      if (disposed || document.hidden) return;
      if (!force && timestamp - previous < frameInterval - 1) return;
      const delta = previous ? Math.min((timestamp - previous) / 1000, 0.1) : 1 / 60;
      previous = timestamp;
      const moving = motionRef.current;
      if (moving) elapsed += delta;
      // Pausing freezes the camera where it is, not back at the hero. Reduced
      // motion starts with a single still frame, retaining the complete HTML.
      if (moving || !ready) progress = force || !ready ? journey.current.progress : THREE.MathUtils.damp(progress, journey.current.progress, 5, delta);
      if (reducedRef.current) { stillStop = Math.min(6, Math.floor(journey.current.progress * 6 + 0.35)); progress = stillStop / 6; }
      const p = THREE.MathUtils.clamp(progress, 0, 1);
      cameraPath.getPoint(p, position); gazePath.getPoint(p, gaze);
      const intro = Math.max(0, 1 - p * 6);
      if (mobile) { position.z += intro * 8; position.y += intro * 2.8; gaze.y -= intro * 1.5; }
      if (moving) {
        position.x += journey.current.pointerX * 0.18;
        position.y += journey.current.pointerY * 0.1;
        gaze.x += journey.current.pointerX * 0.3; gaze.y += journey.current.pointerY * 0.18;
        position.z += Math.exp(-elapsed * 0.9) * 0.65 * intro;
      }
      camera.position.copy(position); camera.lookAt(gaze);
      const fov = (mobile ? 48 : 42) + Math.sin(p * Math.PI * 2) * 2.5;
      if (Math.abs(camera.fov - fov) > 0.02) { camera.fov = fov; camera.updateProjectionMatrix(); }
      core.position.set(mobile ? 0 : 4.4, mobile ? -3 : 0, -5);
      core.rotation.set(0.08, -0.16 + Math.sin(elapsed * 0.07) * 0.12, -0.14);
      core.scale.setScalar(mobile ? 1.05 : 1.22);
      const active = moving && journey.current.pointerActive && intersects((journey.current.pointerX + 1) * width / 2, (1 - journey.current.pointerY) * height / 2);
      hover = THREE.MathUtils.damp(hover, active ? 1 : 0, 3, delta);
      element!.dataset.coreHover = active ? "true" : "false";
      orbit.rotation.z = -0.3 + elapsed * 0.012 + hover * 0.19;
      orbitMaterial.emissiveIntensity = 1.7 + hover * 1.4;
      world.network.rotation.y = Math.sin(elapsed * 0.025) * 0.035;
      world.dust.rotation.y = elapsed * 0.002;
      world.dust.scale.setScalar(1 - hover * 0.045);
      foreground.position.copy(camera.position); foreground.quaternion.copy(camera.quaternion);
      world.nearVeil.position.x = -13 + Math.sin(p * Math.PI * 7) * 7;
      foreground.children.forEach((child) => { if (child !== world.dust) child.visible = p < 0.94; });
      keyLight.position.set(position.x + 3, position.y + 7, position.z - 7);
      pinkLight.position.set(gaze.x - 5, gaze.y, gaze.z + 6);
      rim.position.set(gaze.x + 4, gaze.y + 5, gaze.z - 5);
      pinkLight.intensity = (120 + Math.sin(p * Math.PI * 4) * 45 + hover * 100) * (1 - THREE.MathUtils.smoothstep(p, 0.87, 1));
      fog.density = 0.016 + Math.sin(p * Math.PI * 3) ** 2 * 0.005 + THREE.MathUtils.smoothstep(p, 0.85, 1) * 0.04;
      world.chambers.forEach((chamber) => { chamber.visible = Math.abs(chamber.position.z - camera.position.z) < 85 && p < 0.98; });
      scene.updateMatrixWorld(); camera.updateMatrixWorld();
      core.getWorldPosition(projected); projected.project(camera);
      // Tiny observational diagnostics also make scroll/path regression tests
      // possible without exposing the renderer or mutable scene globally.
      element!.dataset.progress = p.toFixed(4);
      element!.dataset.camera = `${position.x.toFixed(2)},${position.y.toFixed(2)},${position.z.toFixed(2)}`;
      element!.dataset.coreScreen = `${((projected.x + 1) * width / 2).toFixed(0)},${((1 - projected.y) * height / 2).toFixed(0)}`;
      element!.dataset.visibleChambers = String(world.chambers.filter((chamber) => chamber.visible).length);
      renderer.render(scene, camera);
      if (!ready) { ready = true; onReady(); }
      if (moving && !force && samples < 180) {
        samples++; sampleTime += delta;
        if (samples === 180 && sampleTime / samples > (quality === "high" ? 0.03 : 0.047) && pixelRatio > 0.8) {
          pixelRatio = Math.max(0.8, pixelRatio * 0.72); renderer.setPixelRatio(pixelRatio); renderer.setSize(width, height, false); element!.dataset.adaptiveDpr = pixelRatio.toFixed(2);
        }
      }
    }
    function safeRender(time: number, force = false) {
      try { render(time, force); } catch { disposed = true; onFailure(); }
    }
    function tick(time: number) {
      frame = 0; safeRender(time);
      if (motionRef.current && !document.hidden && !disposed) frame = requestAnimationFrame(tick);
    }
    function start() {
      if (disposed) return;
      cancelAnimationFrame(frame); frame = 0; previous = 0;
      safeRender(performance.now(), true);
      if (motionRef.current && !document.hidden && !disposed) frame = requestAnimationFrame(tick);
    }
    wake.current = start;
    function resize() {
      const nextWidth = element!.clientWidth, nextHeight = element!.clientHeight;
      if (!nextWidth || !nextHeight) return;
      width = nextWidth; height = nextHeight; mobile = width <= 900;
      camera.aspect = width / height; camera.updateProjectionMatrix();
      pixelRatio = Math.min(window.devicePixelRatio || 1, maxDpr, Math.sqrt(2600000 / (width * height)));
      renderer.setPixelRatio(pixelRatio); renderer.setSize(width, height, false); start();
    }
    const down = (event: PointerEvent) => { pointerDown = { x: event.clientX, y: event.clientY, scroll: window.scrollY }; };
    const up = (event: PointerEvent) => {
      if (!pointerDown || event.button !== 0 || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 7 || Math.abs(window.scrollY - pointerDown.scroll) > 4) return;
      pointerDown = null;
      if ((event.target as Element).closest("a, button, input, textarea, select, dialog, nav") || window.getSelection()?.toString()) return;
      if (intersects(event.clientX, event.clientY)) window.dispatchEvent(new Event(INSPECT_CORE));
    };
    const cancel = () => { pointerDown = null; };
    // Reduced-motion users get discrete still tableaux at chapter changes, not
    // camera travel or a continuous render loop. Manual pause remains a freeze.
    const stillScroll = () => {
      if (!reducedRef.current || stillFrame) return;
      stillFrame = requestAnimationFrame(() => {
        // The DOM controller may have been re-subscribed after a preference
        // change. Read after its measurement frame regardless of listener order.
        stillFrame = requestAnimationFrame(() => {
          stillFrame = 0;
          if (Math.min(6, Math.floor(journey.current.progress * 6 + 0.35)) !== stillStop) start();
        });
      });
    };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else start(); };
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    const observer = new ResizeObserver(resize); observer.observe(element);
    home?.addEventListener("pointerdown", down, { passive: true }); home?.addEventListener("pointerup", up, { passive: true }); home?.addEventListener("pointercancel", cancel);
    document.addEventListener("visibilitychange", visibility); element.addEventListener("webglcontextlost", lost);
    window.addEventListener("scroll", stillScroll, { passive: true });
    resize();
    return () => {
      disposed = true; cancelAnimationFrame(frame); cancelAnimationFrame(stillFrame); observer.disconnect(); wake.current = () => {};
      home?.removeEventListener("pointerdown", down); home?.removeEventListener("pointerup", up); home?.removeEventListener("pointercancel", cancel);
      document.removeEventListener("visibilitychange", visibility); element.removeEventListener("webglcontextlost", lost);
      window.removeEventListener("scroll", stillScroll);
      world.dispose(); renderer.renderLists.dispose(); renderer.dispose(); renderer.forceContextLoss();
    };
  }, [quality, journey, onFailure, onReady]);
  return <canvas ref={canvas} className="oc-origin-canvas" data-origin-canvas="true" />;
}
