"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { Quality } from "./origin-experience";

type Props = { quality: Quality; motion: boolean; onFailure: () => void; onReady: () => void };

// Geometry, lighting and environment are procedural: no remote textures, models,
// tracking requests, or asset loaders. Only this lazy home-page chunk imports Three.
export default function OriginCanvas({ quality, motion, onFailure, onReady }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const motionRef = useRef(motion);
  const wake = useRef<() => void>(() => {});
  useEffect(() => { motionRef.current = motion; wake.current(); }, [motion]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: element, alpha: true, antialias: quality !== "low", powerPreference: quality === "low" ? "low-power" : "high-performance", stencil: false });
    } catch { onFailure(); return; }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.setClearColor(0x050507, 0);
    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2(0x060509, 0.026);
    scene.fog = fog;
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 70);
    camera.position.set(0, 0.3, 12);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D = scene) {
      geometries.add(geometry); materials.add(material);
      const item = new THREE.Mesh(geometry, material); parent.add(item); return item;
    }
    const environment = new RoomEnvironment();
    const panelGeometry = new THREE.PlaneGeometry(6, 12);
    const panelMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.3, 1.3), side: THREE.DoubleSide });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(-5, 1, 0); panel.rotation.y = Math.PI / 2; environment.add(panel);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environmentTarget = pmrem.fromScene(environment, 0.08);
    scene.environment = environmentTarget.texture;
    environment.traverse((object) => { if (object instanceof THREE.InstancedMesh) object.dispose(); });
    environment.dispose();
    pmrem.dispose();

    const sculpture = new THREE.Group(); scene.add(sculpture);
    const segments = quality === "high" ? 64 : quality === "medium" ? 40 : 24;
    const sphereGeometry = new THREE.SphereGeometry(1.22, segments, segments);
    const glass = new THREE.MeshPhysicalMaterial({
      color: quality === "low" ? 0x422236 : 0x977388, metalness: quality === "low" ? 0.9 : 0.12, roughness: 0.065, transmission: quality === "low" ? 0 : 1,
      thickness: 0.7, ior: 1.65, clearcoat: 0.65, clearcoatRoughness: 0.05,
      attenuationColor: new THREE.Color(0xe3b4d1), attenuationDistance: 5,
      envMapIntensity: 0.7, iridescence: quality === "high" ? 0.18 : 0,
    });
    [-1, 1].forEach((side) => {
      const orb = mesh(sphereGeometry, glass, sculpture);
      orb.position.set(side * 0.99, side * 0.13, 0); orb.scale.set(1, 1.14, 1);
      const meridian = mesh(new THREE.TorusGeometry(1.27, 0.009, 6, segments * 2), new THREE.MeshBasicMaterial({ color: 0xcbb5c4, transparent: true, opacity: 0.36 }), sculpture);
      meridian.position.copy(orb.position); meridian.rotation.set(0.5, side * 0.7, side * 0.25); meridian.scale.y = 1.14;
    });
    const orbit = new THREE.Group(); sculpture.add(orbit); orbit.rotation.set(0.9, -0.22, -0.34);
    const orbitGeometry = new THREE.TorusGeometry(2.95, 0.016, 8, 160);
    const orbitMaterial = new THREE.MeshStandardMaterial({ color: 0xf7dce7, metalness: 0.7, roughness: 0.19, emissive: 0xf290b8, emissiveIntensity: 2.1 });
    mesh(orbitGeometry, orbitMaterial, orbit).scale.set(1, 0.82, 1);
    const secondOrbit = mesh(new THREE.TorusGeometry(3.12, 0.006, 6, 144), new THREE.MeshBasicMaterial({ color: 0xbc779c, transparent: true, opacity: 0.3 }), sculpture);
    secondOrbit.rotation.set(0.72, 0.15, -0.31); secondOrbit.scale.y = 0.86;
    const satellite = mesh(new THREE.SphereGeometry(0.075, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffdceb }), orbit);
    satellite.position.set(2.95, 0, 0);

    const glowMaterial = (color: string, opacity: number) => new THREE.ShaderMaterial({
      uniforms: { tint: { value: new THREE.Color(color) }, strength: { value: opacity } },
      vertexShader: "varying vec2 uvPosition; void main(){uvPosition=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: "varying vec2 uvPosition; uniform vec3 tint; uniform float strength; void main(){float r=length((uvPosition-.5)*2.0);float a=pow(max(0.0,1.0-r),3.8)*strength;gl_FragColor=vec4(tint,a);}",
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const glow = mesh(new THREE.PlaneGeometry(15, 15), glowMaterial("#af175e", 0.34), sculpture);
    glow.position.set(0, -0.1, -3.2);
    const glint = mesh(new THREE.PlaneGeometry(1.8, 1.8), glowMaterial("#ffe6f3", 0.6), sculpture);
    glint.position.set(1.85, 0.76, 0.5);
    const distant = new THREE.Group(); scene.add(distant);
    const portal = mesh(new THREE.TorusGeometry(6.2, 0.035, 8, 160), new THREE.MeshBasicMaterial({ color: 0x714a72, transparent: true, opacity: 0.14 }), distant);
    portal.position.set(-2, 1.5, -13); portal.rotation.set(0.3, -0.55, 0);
    const portal2 = mesh(new THREE.TorusGeometry(7.2, 0.016, 6, 160), new THREE.MeshBasicMaterial({ color: 0x786784, transparent: true, opacity: 0.11 }), distant);
    portal2.position.set(3, -2, -19); portal2.rotation.y = 0.4;

    // A shallow, diffused shaft of light in the far layer, not a fullscreen effect.
    const beam = mesh(new THREE.PlaneGeometry(4, 25), glowMaterial("#d4b5d4", 0.09), distant);
    beam.position.set(0, 4, -10); beam.rotation.z = -0.4;
    const foreground = new THREE.Group(); scene.add(foreground);
    const nearGlow = mesh(new THREE.PlaneGeometry(9, 9), glowMaterial("#69264c", 0.07), foreground);
    nearGlow.position.set(-7, -3, 4);

    let seed = 728;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const count = quality === "high" ? 380 : quality === "medium" ? 180 : 65;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { positions[i * 3] = (random() - 0.5) * 32; positions[i * 3 + 1] = (random() - 0.5) * 22; positions[i * 3 + 2] = -random() * 25 - 1; }
    const dustGeometry = new THREE.BufferGeometry(); dustGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3)); geometries.add(dustGeometry);
    const dustMaterial = new THREE.PointsMaterial({ color: 0xf3dce8, size: 0.023, transparent: true, opacity: 0.43, depthWrite: false, blending: THREE.AdditiveBlending }); materials.add(dustMaterial);
    const dust = new THREE.Points(dustGeometry, dustMaterial); scene.add(dust);

    scene.add(new THREE.AmbientLight(0xcfb4d1, 0.35));
    const pinkLight = new THREE.PointLight(0xf36bad, 65, 25, 2); pinkLight.position.set(0, -1, 5); scene.add(pinkLight);
    const keyLight = new THREE.PointLight(0xfff4ed, 115, 25, 2); keyLight.position.set(3, 6, 4); scene.add(keyLight);
    const rim = new THREE.PointLight(0xc290ff, 40, 20, 2); rim.position.set(-4, 2, -2); scene.add(rim);

    let width = 1, height = 1, pageHeight = 1, mobile = false;
    let scroll = window.scrollY, targetX = 0, targetY = 0;
    let frame = 0, disposed = false, previous = 0, elapsed = 0, sampleTime = 0, samples = 0;
    let pixelRatio = 1;
    const target = new THREE.Vector3();
    const maxDpr = quality === "high" ? 1.75 : quality === "medium" ? 1.25 : 1;
    const frameInterval = quality === "high" ? 1000 / 60 : 1000 / 30;

    function render(timestamp: number, force = false) {
      if (disposed || document.hidden) return;
      const delta = previous ? Math.min((timestamp - previous) / 1000, 0.1) : 1 / 60;
      if (!force && timestamp - previous < frameInterval - 1) return;
      previous = timestamp;
      const moving = motionRef.current;
      if (moving) elapsed += delta;
      const progress = moving ? Math.min(scroll / Math.max(pageHeight - height, 1), 1) : 0;
      const intro = moving ? Math.min(scroll / height, 1) : 0;
      const artX = mobile ? 0 : 2.85;
      const artY = mobile ? -1.65 : 0.25;
      const stageX = Math.sin(progress * Math.PI * 3) * (mobile ? 0.35 : 2.5);
      target.set(artX * (1 - intro) + stageX * intro, artY * (1 - intro) + Math.sin(progress * 8) * 0.65 * intro, -progress * 3.5);
      sculpture.position.lerp(target, force ? 1 : 1 - Math.exp(-delta * 2));
      sculpture.scale.setScalar(mobile && width < 760 ? 0.75 : 1);
      sculpture.rotation.set(0.08 + Math.sin(elapsed * 0.09) * 0.045, -0.16 + Math.sin(elapsed * 0.07) * 0.15 + progress * 1.2, -0.16 + Math.sin(elapsed * 0.085) * 0.055);
      orbit.rotation.z = -0.34 + elapsed * 0.022;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, moving ? targetX * 0.18 : 0, 2, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.3 + (moving ? targetY * 0.12 : 0), 2, delta);
      camera.position.z = 12 - progress * 3;
      camera.lookAt(0, 0, -progress);
      foreground.position.x = moving ? -targetX * 0.32 : 0;
      foreground.position.y = moving ? -targetY * 0.22 : 0;
      distant.position.x = moving ? targetX * 0.025 : 0;
      dust.rotation.y = elapsed * 0.004;
      pinkLight.intensity = 65 + Math.sin(progress * Math.PI) * 20;
      fog.density = 0.026 + progress * 0.023;
      renderer.render(scene, camera);
      // Sustained slow frames reduce only pixel density, without React rerenders.
      if (moving && !force && samples < 240) {
        samples++; sampleTime += delta;
        if (samples === 240 && sampleTime / samples > (quality === "high" ? 0.03 : 0.047) && pixelRatio > 0.8) {
          pixelRatio = Math.max(0.8, pixelRatio * 0.72); renderer.setPixelRatio(pixelRatio); renderer.setSize(width, height, false);
          element!.dataset.adaptiveDpr = pixelRatio.toFixed(2);
        }
      }
    }
    function tick(time: number) {
      frame = 0;
      render(time);
      if (motionRef.current && !document.hidden && !disposed) frame = requestAnimationFrame(tick);
    }
    function start() {
      if (disposed) return;
      if (frame) cancelAnimationFrame(frame);
      frame = 0; previous = 0;
      render(performance.now(), true);
      if (motionRef.current && !document.hidden) frame = requestAnimationFrame(tick);
    }
    wake.current = start;
    function resize() {
      width = element!.clientWidth; height = element!.clientHeight;
      if (!width || !height) return;
      mobile = width <= 900;
      camera.aspect = width / height; camera.fov = mobile ? 46 : 38; camera.updateProjectionMatrix();
      pixelRatio = Math.min(window.devicePixelRatio || 1, maxDpr, Math.sqrt(2600000 / (width * height)));
      renderer.setPixelRatio(pixelRatio); renderer.setSize(width, height, false);
      pageHeight = document.documentElement.scrollHeight;
      start();
    }
    const observer = new ResizeObserver(resize); observer.observe(element); observer.observe(document.body);
    const pointer = (event: PointerEvent) => { if (event.pointerType !== "mouse") return; targetX = (event.clientX / width - 0.5) * 2; targetY = -(event.clientY / height - 0.5) * 2; };
    const onScroll = () => { scroll = window.scrollY; };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else start(); };
    const contextLost = (event: Event) => { event.preventDefault(); onFailure(); };
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    element.addEventListener("webglcontextlost", contextLost);
    resize(); onReady();

    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); wake.current = () => {};
      window.removeEventListener("pointermove", pointer); window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", visibility); element.removeEventListener("webglcontextlost", contextLost);
      scene.environment = null; environmentTarget.dispose();
      geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material.dispose());
      scene.clear(); renderer.renderLists.dispose(); renderer.dispose(); renderer.forceContextLoss();
    };
  }, [quality, onFailure, onReady]);
  return <canvas ref={canvas} className="oc-origin-canvas" data-origin-canvas="true" />;
}
