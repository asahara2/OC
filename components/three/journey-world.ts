import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { Quality } from "./origin-experience";

// A single world, measured in world units. Scene anchors are deliberately not
// evenly spaced: the camera passes the core, rises into the temple, then descends.
const CAMERA_POINTS = [[0, 0.8, 18], [-5, 1.6, 1], [1, 7, -23], [3, 3, -63], [-2, 1, -105], [2, 6, -150], [0, 4, -205]];
const GAZE_POINTS = [[0, 0, -8], [2, 0, -10], [0, 4, -43], [-1, 1, -84], [1, 1, -125], [0, 0, -171], [0, 3, -229]];
export const cameraPath = new THREE.CatmullRomCurve3(CAMERA_POINTS.map((point) => new THREE.Vector3(...point)), false, "centripetal");
export const gazePath = new THREE.CatmullRomCurve3(GAZE_POINTS.map((point) => new THREE.Vector3(...point)), false, "centripetal");

export function createJourneyWorld(renderer: THREE.WebGLRenderer, quality: Quality) {
  const scene = new THREE.Scene();
  const fog = new THREE.FogExp2(0x050509, 0.019); scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(42, 1, 0.15, 100);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const instances = new Set<THREE.InstancedMesh>();
  const high = quality === "high", low = quality === "low";
  const segments = high ? 64 : low ? 20 : 36;
  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D = scene) {
    geometries.add(geometry); materials.add(material);
    const item = new THREE.Mesh(geometry, material); parent.add(item); return item;
  }
  function group(x: number, y: number, z: number) { const item = new THREE.Group(); item.position.set(x, y, z); scene.add(item); return item; }
  function wire(color: number, opacity: number) { return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }); }
  function ring(radius: number, thickness: number, material: THREE.Material, parent: THREE.Object3D) {
    return mesh(new THREE.TorusGeometry(radius, thickness, low ? 5 : 8, high ? 160 : low ? 64 : 100), material, parent);
  }
  function glow(color: string, opacity: number, width: number, height: number, parent: THREE.Object3D) {
    const material = new THREE.ShaderMaterial({
      uniforms: { tint: { value: new THREE.Color(color) }, strength: { value: opacity } },
      vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: "varying vec2 vUv; uniform vec3 tint; uniform float strength; void main(){float r=length((vUv-.5)*2.);float a=pow(max(0.,1.-r),3.)*strength;gl_FragColor=vec4(tint,a);}",
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    return mesh(new THREE.PlaneGeometry(width, height), material, parent);
  }
  let environmentTarget: THREE.WebGLRenderTarget | undefined;
  if (!low) {
    const environment = new RoomEnvironment();
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(6, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.25, 1.2), side: THREE.DoubleSide }));
    panel.position.set(-5, 1, 0); panel.rotation.y = Math.PI / 2; environment.add(panel);
    const pmrem = new THREE.PMREMGenerator(renderer);
    // Lower the reflection texture resolution on medium devices.
    environmentTarget = pmrem.fromScene(environment, 0.08, 0.1, 100, { size: high ? 256 : 128 });
    scene.environment = environmentTarget.texture;
    environment.traverse((object) => { if (object instanceof THREE.InstancedMesh) object.dispose(); });
    environment.dispose(); pmrem.dispose();
  }

  const core = group(4.4, 0, -5);
  const glass = new THREE.MeshPhysicalMaterial({ color: low ? 0x67495f : 0xb394a9, metalness: low ? 0.1 : 0.1, roughness: low ? 0.38 : 0.065, transmission: low ? 0 : 0.94, thickness: 1.4, ior: 1.55, clearcoat: low ? 0 : 0.8, attenuationColor: new THREE.Color(0xe2aaca), attenuationDistance: 6, envMapIntensity: high ? 0.85 : 0.65, iridescence: high ? 0.15 : 0 });
  const coreGeometry = new THREE.SphereGeometry(1.75, segments, segments);
  const interactive: THREE.Mesh[] = [];
  [-1, 1].forEach((side) => {
    const orb = mesh(coreGeometry, glass, core); interactive.push(orb);
    orb.position.set(side * 1.4, side * 0.18, 0); orb.scale.y = 1.15;
    const meridian = ring(1.8, 0.008, wire(0xf8dbe7, 0.38), core);
    meridian.position.copy(orb.position); meridian.rotation.set(0.5, side * 0.7, side * 0.3); meridian.scale.y = 1.15;
  });
  const orbit = new THREE.Group(); core.add(orbit); orbit.rotation.set(0.95, -0.2, -0.3);
  const orbitMaterial = new THREE.MeshStandardMaterial({ color: 0xf7dce7, metalness: low ? 0 : 0.7, roughness: 0.2, emissive: 0xf2a4c4, emissiveIntensity: 1.7 });
  ring(4.2, 0.018, orbitMaterial, orbit).scale.y = 0.84;
  const outerOrbit = ring(4.6, 0.006, wire(0xe7b3d0, 0.25), core); outerOrbit.rotation.set(0.7, 0.1, -0.3);
  const coreHalo = glow("#b73078", 0.34, 23, 23, core); coreHalo.position.z = -3;
  glow("#ffe3f1", 0.65, 2, 2, core).position.set(2.7, 1.05, 0.8);
  const threshold = group(0, 0, -19);
  ring(13, 0.07, wire(0xa58ca4, 0.22), threshold);
  ring(13.5, 0.012, wire(0xebcce2, 0.15), threshold);
  const temple = group(0, 4, -45);
  ring(10.8, 0.14, new THREE.MeshStandardMaterial({ color: 0x746376, roughness: 0.26, metalness: low ? 0 : 0.8, emissive: 0x624152, emissiveIntensity: 0.45 }), temple);
  ring(10.3, 0.025, wire(0xf3e3e6, 0.68), temple);
  ring(13, 0.04, wire(0xd09dc5, 0.22), temple).position.z = -4;
  ring(17, 0.12, wire(0x827385, 0.13), temple).position.z = -9;
  const templeBeam = glow("#f0dbed", 0.38, 9, 42, temple); templeBeam.position.set(0, 9, 2);
  const templeHalo = glow("#98667e", 0.3, 38, 34, temple); templeHalo.position.z = -2;
  const columnGeometry = new THREE.BoxGeometry(0.22, 22, 0.4);
  const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x282331, metalness: low ? 0 : 0.5, roughness: 0.4 });
  for (const side of [-1, 1]) for (let i = 0; i < (low ? 3 : 6); i++) {
    mesh(columnGeometry, columnMaterial, temple).position.set(side * (12 + i * 1.7), -4, 5 - i * 3);
  }

  const archive = group(0, 0, -78);
  const panelGeometry = new THREE.PlaneGeometry(6, 9);
  const panelMaterial = new THREE.MeshBasicMaterial({ color: 0x2b1f32, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false });
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xa38ca9, transparent: true, opacity: 0.3 }); materials.add(edgeMaterial);
  const edges = new THREE.EdgesGeometry(panelGeometry); geometries.add(edges);
  for (let i = 0; i < (low ? 6 : 12); i++) {
    const panel = mesh(panelGeometry, panelMaterial, archive);
    panel.position.set((i % 2 ? 1 : -1) * (6 + i * 0.08), 1 + (i % 3) * 0.6, -Math.floor(i / 2) * 5);
    panel.rotation.y = (i % 2 ? -1 : 1) * 0.28;
    panel.add(new THREE.LineSegments(edges, edgeMaterial));
    // Abstract filing marks, not duplicated/inaccessible body text.
    const ruleMaterial = wire(0xb39cac, 0.22);
    for (let line = 0; line < 4; line++) mesh(new THREE.PlaneGeometry(line === 0 ? 1.6 : 4, 0.012), ruleMaterial, panel).position.set(line === 0 ? -1.2 : 0, 2.5 - line * 0.75, 0.015);
  }
  const archiveBeam = glow("#9a83c2", 0.22, 32, 26, archive); archiveBeam.position.z = -13;

  let seed = 728;
  const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
  const network = group(0, 2, -128);
  const nodes = high ? 100 : low ? 28 : 60;
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < nodes; i++) {
    const theta = random() * Math.PI * 2, phi = Math.acos(2 * random() - 1), radius = 10 + random() * 9;
    positions.push(new THREE.Vector3(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi) * 0.7, radius * Math.sin(phi) * Math.sin(theta)));
  }
  const nodeGeometry = new THREE.SphereGeometry(0.032, 8, 6); geometries.add(nodeGeometry);
  const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xffd8ed }); materials.add(nodeMaterial);
  const nodeMesh = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, nodes); instances.add(nodeMesh);
  const dummy = new THREE.Object3D();
  positions.forEach((position, i) => { dummy.position.copy(position); dummy.scale.setScalar(i % 7 === 0 ? 1.6 : 1); dummy.updateMatrix(); nodeMesh.setMatrixAt(i, dummy.matrix); });
  network.add(nodeMesh);
  const lines: number[] = [];
  positions.forEach((position, i) => {
    let links = 0;
    for (let j = i + 1; j < positions.length && links < 3; j++) if (position.distanceToSquared(positions[j]) < 95) { lines.push(...position.toArray(), ...positions[j].toArray()); links++; }
  });
  const networkGeometry = new THREE.BufferGeometry(); networkGeometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3)); geometries.add(networkGeometry);
  const networkMaterial = new THREE.LineBasicMaterial({ color: 0xbf85ac, opacity: 0.23, transparent: true, depthWrite: false }); materials.add(networkMaterial);
  network.add(new THREE.LineSegments(networkGeometry, networkMaterial));
  glow("#572b77", 0.22, 52, 40, network).position.z = -10;

  const assembly = group(0, -2, -171);
  for (let i = 0; i < 4; i++) {
    const circle = ring(7 + i * 3.4, i === 0 ? 0.065 : 0.03, wire(i === 0 ? 0xefccdc : 0xa68baa, 0.55 - i * 0.1), assembly);
    circle.rotation.x = Math.PI / 2; circle.position.y = -i * 0.8;
  }
  const seatGeometry = new THREE.BoxGeometry(0.3, 0.12, 0.6); geometries.add(seatGeometry);
  const seatMaterial = new THREE.MeshBasicMaterial({ color: 0x8c7087, transparent: true, opacity: 0.45 }); materials.add(seatMaterial);
  const seatCount = low ? 32 : 80;
  const seats = new THREE.InstancedMesh(seatGeometry, seatMaterial, seatCount); instances.add(seats);
  for (let i = 0; i < seatCount; i++) { const angle = i / seatCount * Math.PI * 2; dummy.position.set(Math.cos(angle) * 13, -0.5, Math.sin(angle) * 13); dummy.rotation.y = -angle; dummy.scale.setScalar(1); dummy.updateMatrix(); seats.setMatrixAt(i, dummy.matrix); }
  assembly.add(seats);
  const assemblyBeam = glow("#d99bba", 0.28, 6, 35, assembly); assemblyBeam.position.set(0, 12, 0);
  const assemblyHalo = glow("#aa426e", 0.14, 44, 30, assembly); assemblyHalo.position.set(0, 5, -7);

  // Depth-of-field suggestion without a costly fullscreen blur pass: translucent
  // radial shapes cross close to the lens, with much sharper midground geometry.
  const foreground = group(0, 0, 0);
  const nearVeil = glow("#b080a1", 0.07, 14, 22, foreground); nearVeil.position.set(-12, 0, -4); nearVeil.rotation.z = 0.3;
  const nearVeil2 = glow("#79426e", 0.055, 12, 18, foreground); nearVeil2.position.set(12, -5, -6);
  const dustCount = high ? 330 : low ? 45 : 140;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) { dustPositions[i * 3] = (random() - 0.5) * 55; dustPositions[i * 3 + 1] = (random() - 0.5) * 36; dustPositions[i * 3 + 2] = -random() * 52 - 4; }
  const dustGeometry = new THREE.BufferGeometry(); dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3)); geometries.add(dustGeometry);
  const dustMaterial = new THREE.PointsMaterial({ color: 0xe4cfde, size: 0.035, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }); materials.add(dustMaterial);
  const dust = new THREE.Points(dustGeometry, dustMaterial); foreground.add(dust);
  scene.add(new THREE.AmbientLight(0xcdb5d0, low ? 0.65 : 0.38));
  const keyLight = new THREE.PointLight(0xfff1ee, 220, 42, 2); scene.add(keyLight);
  const pinkLight = new THREE.PointLight(0xed81b4, 150, 35, 2); scene.add(pinkLight);
  const rim = new THREE.PointLight(0xa89bcc, 95, 32, 2); scene.add(rim);
  const chambers = [core, threshold, temple, archive, network, assembly];

  return { scene, camera, fog, core, orbit, orbitMaterial, interactive, temple, network, assembly, foreground, nearVeil, dust, keyLight, pinkLight, rim, chambers,
    dispose() {
      scene.environment = null; environmentTarget?.dispose();
      instances.forEach((instance) => instance.dispose());
      geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material.dispose()); scene.clear();
    },
  };
}
