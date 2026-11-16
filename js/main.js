// СИГНАЛ — 3D-история о том, как ИИ вошёл в жизнь людей.
// Everything is procedural: geometry, textures, light, sound.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Sound } from './audio.js';

// ---------------------------------------------------------------- config
const ISLAND_R = 62;
const EXHIBIT_R = 24.0;
const PLAYER_R = 0.42;
const params = new URLSearchParams(location.search);
const SHOT = params.get('shot') === '1';
const HIDE_UI = params.get('ui') === '0';

const DATA = [
  { year: '1997', title: 'ДОМ', color: 0xffb066,
    text: 'Компьютер впервые обыграл человека в шахматы. Мы назвали это игрой.' },
  { year: '2007', title: 'КАРМАН', color: 0x6ee7ff,
    text: 'Телефон перестал быть телефоном — он начал отвечать.' },
  { year: '2012', title: 'УЛИЦА', color: 0x7fd4ff,
    text: 'Камеры научились узнавать лица. Город открыл глаза.' },
  { year: '2016', title: 'ДОРОГА', color: 0xffc46b,
    text: 'Навигатор перестал спрашивать дорогу — он её уже знал.' },
  { year: '2022', title: 'РАБОТА', color: 0xb493ff,
    text: 'Машина научилась говорить, писать и рисовать. Мы попросили её придумать.' },
  { year: '2025', title: 'ВЕЗДЕ', color: 0xffe1a8,
    text: 'ИИ перестал быть кнопкой. Он стал воздухом.' },
];

// ---------------------------------------------------------------- renderer
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const NIGHT = new THREE.Color(0x05070f);
scene.background = NIGHT.clone();
scene.fog = new THREE.FogExp2(NIGHT.getHex(), 0.0135);

const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 800);
camera.position.set(0, 6, 48);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.78, 0.62, 0.58);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------- lights
scene.add(new THREE.HemisphereLight(0x33587f, 0x06090f, 0.75));
const moon = new THREE.DirectionalLight(0x9fc4ff, 0.75);
moon.position.set(35, 70, 25);
scene.add(moon);
const fill = new THREE.DirectionalLight(0x3a6ea8, 0.25);
fill.position.set(-40, 20, -30);
scene.add(fill);

// ---------------------------------------------------------------- utils
function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function makeWindowTexture(seed = 0) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#05080e';
  g.fillRect(0, 0, 128, 256);
  const cols = 8, rows = 22;
  const warm = ['#ffcf9a', '#ffb877', '#ffd9b0'];
  const cool = ['#9fe8ff', '#7fd4ff', '#c9f2ff'];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const lit = Math.random() < 0.42;
      if (!lit) continue;
      const col = Math.random() < 0.62 ? pick(warm) : pick(cool);
      g.globalAlpha = rand(0.30, 0.95);
      g.fillStyle = col;
      g.fillRect(5 + x * 16, 6 + y * 11, 8, 5);
    }
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

const WINDOW_TEX = Array.from({ length: 8 }, (_, i) => makeWindowTexture(i));

function makeLabel(text, colorHex) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 128);
  g.font = '300 40px "Segoe UI", system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#dfeaf7';
  g.shadowColor = 'rgba(150,220,255,0.55)';
  g.shadowBlur = 14;
  g.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.85 });
  const s = new THREE.Sprite(mat);
  s.scale.set(4.2, 1.05, 1);
  return s;
}

// ---------------------------------------------------------------- world
const world = new THREE.Group();
scene.add(world);

// ground
function makeGroundTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(512, 512, 40, 512, 512, 512);
  grd.addColorStop(0, '#16232e');
  grd.addColorStop(0.45, '#0c141c');
  grd.addColorStop(1, '#05080e');
  g.fillStyle = grd;
  g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = 'rgba(90,170,210,0.06)';
  g.lineWidth = 2;
  for (let r = 90; r < 512; r += 90) {
    g.beginPath(); g.arc(512, 512, r, 0, Math.PI * 2); g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const groundMat = new THREE.MeshStandardMaterial({
  map: makeGroundTexture(), color: 0xffffff, roughness: 0.84, metalness: 0.35,
  emissive: 0x102232, emissiveIntensity: 0.9,
});
const ground = new THREE.Mesh(new THREE.CircleGeometry(ISLAND_R + 6, 128), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
world.add(ground);

// concentric rings (subtle)
for (let r = 10; r <= 50; r += 10) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(r - 0.035, r + 0.035, 160),
    new THREE.MeshBasicMaterial({ color: 0x2e6f8f, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.012;
  world.add(ring);
}

// buildings
const buildings = [];
for (let i = 0; i < 58; i++) {
  const a = (i / 58) * Math.PI * 2 + rand(-0.04, 0.04);
  const r = rand(48, 60);
  const w = rand(3, 7.5);
  const d = rand(3, 7.5);
  const h = rand(5, 22) * (r > 48 ? 1.15 : 1);
  const tex = pick(WINDOW_TEX).clone();
  tex.needsUpdate = true;
  tex.repeat.set(1, Math.max(1, Math.round(h / 9)));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const mat = new THREE.MeshStandardMaterial({
    map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.32,
    color: 0x0b141f, roughness: 0.85, metalness: 0.15,
  });
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  b.position.set(Math.sin(a) * r, h / 2, Math.cos(a) * r);
  b.lookAt(0, h / 2, 0);
  b.rotation.y += Math.PI / 2;
  b.userData.r = Math.max(w, d) * 0.64;
  world.add(b);
  buildings.push(b);
}

// trees
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x161b22, roughness: 1 });
const leafMat = new THREE.MeshStandardMaterial({ color: 0x0d2a2a, roughness: 1, metalness: 0 });
for (let i = 0; i < 30; i++) {
  const a = rand(0, Math.PI * 2);
  const r = rand(37, 43);
  const tx = Math.sin(a) * r, tz = Math.cos(a) * r;
  if (Math.abs(tx) < 11 && tz > 26) continue;
  const g = new THREE.Group();
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.6, 5), trunkMat);
  tr.position.y = 0.8; g.add(tr);
  const cr = new THREE.Mesh(new THREE.ConeGeometry(rand(0.9, 1.4), rand(2.2, 3.4), 6), leafMat);
  cr.position.y = 2.6; g.add(cr);
  g.position.set(tx, 0, tz);
  g.rotation.y = rand(0, 6.28);
  world.add(g);
}

// soft light pools
const POOL_TEX = (() => {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 4, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,220,170,0.55)');
  grd.addColorStop(0.4, 'rgba(255,190,120,0.18)');
  grd.addColorStop(1, 'rgba(255,180,110,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
})();

function addPool(x, z, colorHex, size, opacity) {
  const mat = new THREE.MeshBasicMaterial({
    map: POOL_TEX, color: colorHex, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.03, z);
  world.add(m);
}

// street lamps
for (let i = 0; i < 14; i++) {
  const a = (i / 14) * Math.PI * 2 + 0.15;
  const r = 32.0;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 4.2, 6),
    new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.8 })
  );
  pole.position.set(Math.sin(a) * r, 2.1, Math.cos(a) * r);
  world.add(pole);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd7a0 })
  );
  bulb.position.set(pole.position.x, 4.25, pole.position.z);
  world.add(bulb);
  if (i % 2 === 0) {
    addPool(pole.position.x, pole.position.z, 0xffb877, 11, 0.30);
  }
}

// ---------------- central tower ----------------
const tower = new THREE.Group();
world.add(tower);

const base = new THREE.Mesh(
  new THREE.CylinderGeometry(5.2, 5.8, 1.1, 48),
  new THREE.MeshStandardMaterial({ color: 0x0a141d, roughness: 0.55, metalness: 0.6 })
);
base.position.y = 0.55;
tower.add(base);

const shaft = new THREE.Mesh(
  new THREE.CylinderGeometry(0.52, 1.9, 12.2, 6, 1, true),
  new THREE.MeshStandardMaterial({
    color: 0x0a1a26, roughness: 0.35, metalness: 0.7,
    emissive: 0x1d7d9e, emissiveIntensity: 0.55, side: THREE.DoubleSide,
  })
);
shaft.position.y = 7.1;
tower.add(shaft);

const rings = [];
for (let i = 0; i < 3; i++) {
  const rr = 4.7 - i * 1.05;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(rr, 0.055, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0x63d8ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 3.2 + i * 2.7;
  tower.add(ring);
  rings.push(ring);
}

const crystalMat = new THREE.MeshStandardMaterial({
  color: 0x0a2030, emissive: 0x63d8ff, emissiveIntensity: 1.6, roughness: 0.15, metalness: 0.2,
});
const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.45, 0), crystalMat);
crystal.position.y = 13.9;
tower.add(crystal);

const towerLight = new THREE.PointLight(0x63d8ff, 26, 60, 2);
towerLight.position.set(0, 12.8, 0);
tower.add(towerLight);

const halo = new THREE.Mesh(
  new THREE.SphereGeometry(3.4, 24, 16),
  new THREE.MeshBasicMaterial({ color: 0x2aa8d8, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false })
);
halo.position.y = 13.9;
tower.add(halo);

// light column
const column = new THREE.Mesh(
  new THREE.CylinderGeometry(0.45, 1.15, 32, 16, 1, true),
  new THREE.MeshBasicMaterial({ color: 0x2a94c0, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
);
column.position.y = 22;
tower.add(column);

// ---------------- exhibits ----------------
function buildObject(kind) {
  const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x111a24, roughness: 0.55, metalness: 0.55 });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0x0c141c, emissive: 0x2a7a9a, emissiveIntensity: 1.15, roughness: 0.4, metalness: 0.3,
  });

  if (kind === 'computer') {
    const mon = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.25, 0.18), dark);
    mon.position.y = 1.35; g.add(mon);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.66, 1.0), lightMat);
    scr.position.set(0, 1.35, 0.1); g.add(scr);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.5, 8), dark);
    stand.position.y = 0.55; g.add(stand);
    const kb = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.5), dark);
    kb.position.set(0, 0.28, 0.45); g.add(kb);
  } else if (kind === 'phone') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.6, 0.12), dark);
    body.position.y = 1.5; body.rotation.z = 0.06; g.add(body);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.44), lightMat);
    scr.position.set(0, 1.5, 0.07); scr.rotation.z = 0.06; g.add(scr);
    const home = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12), lightMat);
    home.rotation.x = Math.PI / 2; home.position.set(0, 0.86, 0.08); g.add(home);
  } else if (kind === 'camera') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.2, 8), dark);
    pole.position.y = 1.6; g.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.9), dark);
    arm.position.set(0, 3.1, 0.35); g.add(arm);
    const cam = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 0.75), dark);
    cam.position.set(0, 3.05, 0.85); g.add(cam);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.28, 14), lightMat);
    lens.rotation.x = Math.PI / 2; lens.position.set(0, 3.05, 1.28); g.add(lens);
  } else if (kind === 'car') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.62, 1.35), dark);
    body.position.y = 0.72; g.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.55, 1.2), lightMat);
    cabin.position.set(-0.1, 1.25, 0); g.add(cabin);
    for (const [x, z] of [[-1.0, 0.68], [1.0, 0.68], [-1.0, -0.68], [1.0, -0.68]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 14), dark);
      w.rotation.x = Math.PI / 2; w.position.set(x, 0.36, z); g.add(w);
    }
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lightMat);
    head.position.set(1.5, 0.78, 0.42); g.add(head.clone());
    const head2 = head.clone(); head2.position.z = -0.42; g.add(head2);
  } else if (kind === 'robot') {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.4, 12), dark);
    b.position.y = 0.2; g.add(b);
    const a1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.0, 0.32), dark);
    a1.position.y = 1.35; a1.rotation.z = -0.22; g.add(a1);
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), lightMat);
    joint.position.set(0.2, 2.3, 0); g.add(joint);
    const a2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.6, 0.24), lightMat);
    a2.position.set(0.95, 2.85, 0); a2.rotation.z = 1.05; g.add(a2);
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.42, 8), dark);
    claw.position.set(1.72, 3.1, 0); claw.rotation.z = -1.4; g.add(claw);
  } else if (kind === 'network') {
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), new THREE.MeshBasicMaterial({
      color: 0xbfefff, wireframe: true, transparent: true, opacity: 0.9,
    }));
    core.position.y = 1.9; g.add(core);
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, 0), new THREE.MeshBasicMaterial({
      color: 0x4fc8ff, wireframe: true, transparent: true, opacity: 0.25,
    }));
    shell.position.y = 1.9; g.add(shell);
    for (let i = 0; i < 24; i++) {
      const a = rand(0, Math.PI * 2), b = rand(-1, 1);
      const r = 1.7;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), new THREE.MeshBasicMaterial({ color: 0xa8ecff }));
      dot.position.set(Math.cos(a) * Math.sqrt(1 - b * b) * r, 1.9 + b * r, Math.sin(a) * Math.sqrt(1 - b * b) * r);
      g.add(dot);
    }
  }
  return g;
}

const exhibits = [];
const kinds = ['computer', 'phone', 'camera', 'car', 'robot', 'network'];

for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
  const x = Math.sin(a) * EXHIBIT_R;
  const z = Math.cos(a) * EXHIBIT_R;
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.lookAt(0, 0, 0);
  world.add(g);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(2.3, 2.55, 0.35, 40),
    new THREE.MeshStandardMaterial({ color: 0x0b131b, roughness: 0.6, metalness: 0.5 })
  );
  plinth.position.y = 0.175;
  g.add(plinth);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x2d5f74, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.035, 6, 120), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.36;
  g.add(ring);

  const obj = buildObject(kinds[i]);
  obj.position.y = 0.35;
  g.add(obj);

  const beaconMat = new THREE.MeshBasicMaterial({
    color: DATA[i].color, transparent: true, opacity: 0.09,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.10, 4.4, 8, 1, true), beaconMat);
  beacon.position.y = 2.6;
  g.add(beacon);

  const label = makeLabel(`${DATA[i].year} · ${DATA[i].title}`, DATA[i].color);
  label.position.y = 4.5;
  g.add(label);

  const marker = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.16, 0),
    new THREE.MeshBasicMaterial({ color: DATA[i].color, transparent: true, opacity: 0.9 })
  );
  marker.position.y = 3.35;
  g.add(marker);

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: POOL_TEX, color: DATA[i].color, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  glow.scale.set(6.5, 6.5, 1);
  glow.position.y = 1.7;
  g.add(glow);

  // path to the tower
  const path = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.012, EXHIBIT_R),
    new THREE.MeshBasicMaterial({ color: 0x2a6f8a, transparent: true, opacity: 0.30, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  path.position.set(x * 0.5, 0.02, z * 0.5);
  path.lookAt(0, 0.02, 0);
  world.add(path);

  exhibits.push({
    id: i, group: g, obj, ring, ringMat, beacon, beaconMat, label, glow, path, marker,
    pos: new THREE.Vector3(x, 0, z), data: DATA[i], activated: false, bob: rand(0, 6.28),
  });
}

addPool(0, 0, 0x66d8ff, 26, 0.22);

// ---------------- stars ----------------
{
  const n = 1600;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random(), v = Math.random();
    const th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1);
    const r = 260 + Math.random() * 120;
    pos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
    pos[i * 3 + 1] = Math.abs(Math.cos(ph)) * r * 0.55 + 8;
    pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xa9c8e8, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false });
  scene.add(new THREE.Points(geo, mat));
}

// ---------------- dust ----------------
const dust = (() => {
  const n = 700;
  const pos = new Float32Array(n * 3);
  const spd = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 48;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.random() * 22;
    pos[i * 3 + 2] = Math.sin(a) * r;
    spd[i] = 0.15 + Math.random() * 0.5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0x7fb8e0, size: 0.09, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return { pts, spd, pos };
})();

// ---------------------------------------------------------------- player
const player = new THREE.Group();
scene.add(player);

const bodyMat = new THREE.MeshStandardMaterial({
  color: 0x9fc4d8, emissive: 0x1e5a78, emissiveIntensity: 0.55, roughness: 0.45, metalness: 0.55,
});
const body = new THREE.Mesh(new THREE.CapsuleGeometry(PLAYER_R, 0.85, 6, 16), bodyMat);
body.position.y = 1.02;
player.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.27, 18, 16),
  new THREE.MeshStandardMaterial({ color: 0x131e29, emissive: 0x0d3346, emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.6 })
);
head.position.y = 1.66;
player.add(head);
const visor = new THREE.Mesh(
  new THREE.BoxGeometry(0.32, 0.075, 0.07),
  new THREE.MeshBasicMaterial({ color: 0xa8f2ff })
);
visor.position.set(0, 1.66, 0.23);
player.add(visor);
const spine = new THREE.Mesh(
  new THREE.BoxGeometry(0.05, 0.62, 0.02),
  new THREE.MeshBasicMaterial({ color: 0x9ff0ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })
);
spine.position.set(0, 1.06, -0.42);
player.add(spine);

const shoulder = new THREE.Mesh(
  new THREE.TorusGeometry(0.40, 0.022, 6, 40),
  new THREE.MeshBasicMaterial({ color: 0x5fd6f5, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })
);
shoulder.rotation.x = Math.PI / 2;
shoulder.position.y = 1.44;
player.add(shoulder);

const core = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 12, 12),
  new THREE.MeshBasicMaterial({ color: 0xd8f7ff })
);
core.position.y = 1.12;
player.add(core);

const footRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.62, 0.02, 6, 60),
  new THREE.MeshBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })
);
footRing.rotation.x = Math.PI / 2;
footRing.position.y = 0.06;
player.add(footRing);

const playerLight = new THREE.PointLight(0x8fe6ff, 7, 16, 2);
playerLight.position.y = 1.3;
player.add(playerLight);

player.position.set(0, 0, 34);

// ---------------------------------------------------------------- state
const state = {
  started: false, progress: 0, near: null, finale: false, finaleT: 0,
  time: 0, yaw: 0, pitch: 0.36, dist: 13.0,
  camPos: new THREE.Vector3(0, 6, 45), look: new THREE.Vector3(0, 2.0, 34),
  vel: new THREE.Vector3(), dragging: false, px: 0, py: 0,
};
const sound = new Sound();
const bursts = [];
const beams = [];
const pulses = [];
let shockwave = null;

// ---------------------------------------------------------------- UI
const $ = (id) => document.getElementById(id);
const ui = {
  start: $('start'), end: $('end'), hud: $('hud'), caption: $('caption'),
  capYear: $('cap-year'), capTitle: $('cap-title'), capText: $('cap-text'),
  count: $('pcount'), dots: $('dots'), prompt: $('prompt'), loading: $('loading'),
};
for (let i = 0; i < 6; i++) {
  const d = document.createElement('div');
  d.className = 'dot';
  ui.dots.appendChild(d);
}
if (HIDE_UI) {
  document.querySelectorAll('.hud,.hint,.prompt,.caption,.vignette').forEach(e => e.style.display = 'none');
}

let captionTimer = 0;
function showCaption(ex) {
  ui.capYear.textContent = ex.data.year;
  ui.capTitle.textContent = ex.data.title;
  ui.capText.textContent = ex.data.text;
  ui.caption.classList.add('show');
  clearTimeout(captionTimer);
  captionTimer = setTimeout(() => ui.caption.classList.remove('show'), 7200);
}

function updateHUD() {
  ui.count.textContent = String(state.progress);
  [...ui.dots.children].forEach((d, i) => d.classList.toggle('on', i < state.progress));
}

// ---------------------------------------------------------------- effects
function makeBeam(from, to, color) {
  const dir = to.clone().sub(from);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(0.055, 0.055, len, 8, 1, true);
  geo.translate(0, len / 2, 0);
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(from);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  scene.add(mesh);
  beams.push({ mesh, life: 0 });
}

function makePulse(pos, color) {
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.12, 64), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(pos.x, 0.08, pos.z);
  scene.add(mesh);
  pulses.push({ mesh, life: 0 });
}

function makeBurst(pos, color) {
  const n = 110;
  const geo = new THREE.BufferGeometry();
  const arr = new Float32Array(n * 3);
  const vel = [];
  for (let i = 0; i < n; i++) {
    arr[i * 3] = pos.x + rand(-0.3, 0.3);
    arr[i * 3 + 1] = pos.y + rand(0.4, 1.6);
    arr[i * 3 + 2] = pos.z + rand(-0.3, 0.3);
    const a = rand(0, Math.PI * 2), up = rand(1.2, 5.5), sp = rand(0.4, 2.4);
    vel.push(new THREE.Vector3(Math.cos(a) * sp, up, Math.sin(a) * sp));
  }
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const mat = new THREE.PointsMaterial({
    color, size: 0.14, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  bursts.push({ pts, vel, life: 0 });
}

// ---------------------------------------------------------------- activation
function activate(ex) {
  if (ex.activated || state.finale) return;
  ex.activated = true;
  state.progress++;
  updateHUD();
  sound.chime(state.progress - 1);
  sound.thud();

  ex.ringMat.color.setHex(ex.data.color);
  ex.ringMat.opacity = 1.0;
  ex.beaconMat.opacity = 0.62;
  ex.beacon.scale.set(1.6, 1, 1.6);
  ex.glow.material.opacity = 0.32;
  ex.label.material.opacity = 0.25;

  ex.obj.traverse((m) => {
    if (m.isMesh && m.material) {
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mm) => {
        if (mm.emissive) { mm.emissive.setHex(ex.data.color); mm.emissiveIntensity = 1.5; }
      });
    }
  });

  const from = new THREE.Vector3(ex.pos.x * 0.82, 2.2, ex.pos.z * 0.82);
  makeBeam(from, new THREE.Vector3(0, 13.7, 0), ex.data.color);
  makePulse(ex.pos, ex.data.color);
  makeBurst(new THREE.Vector3(ex.pos.x, 1.2, ex.pos.z), ex.data.color);
  ex.path.material.opacity = 0.85;
  ex.path.material.color.setHex(0x8ef0ff);

  showCaption(ex);
  updateTower();

  if (state.progress === 6) {
    setTimeout(startFinale, 1400);
  }
}

function updateTower() {
  const p = state.progress;
  crystalMat.emissiveIntensity = 1.5 + p * 0.55;
  towerLight.intensity = 26 + p * 14;
  rings.forEach((r, i) => { r.material.opacity = 0.55 + p * 0.07; });
  const c = new THREE.Color(0x63d8ff).lerp(new THREE.Color(0xffd27a), p / 6);
  crystalMat.emissive.copy(c);
  towerLight.color.copy(c);
  rings.forEach(r => r.material.color.copy(c));
}

// ---------------------------------------------------------------- finale
function startFinale() {
  if (state.finale) return;
  state.finale = true;
  sound.finale();

  const sw = new THREE.Mesh(
    new THREE.RingGeometry(1, 1.25, 128),
    new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  sw.rotation.x = -Math.PI / 2;
  sw.position.y = 0.1;
  scene.add(sw);
  shockwave = { mesh: sw, life: 0 };

  buildings.forEach((b, i) => {
    b.userData.lightUp = 2.2 + Math.random() * 1.6;
  });

  setTimeout(() => {
    if (!HIDE_UI) ui.end.classList.remove('hidden');
    document.body.classList.remove('playing');
  }, 5200);
}

// ---------------------------------------------------------------- input
const keys = {};
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyE' && state.near && state.started && !state.finale) activate(state.near);
});
addEventListener('keyup', (e) => { keys[e.code] = false; });

canvas.addEventListener('pointerdown', (e) => {
  state.dragging = true; state.px = e.clientX; state.py = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!state.dragging) return;
  const dx = e.clientX - state.px, dy = e.clientY - state.py;
  state.px = e.clientX; state.py = e.clientY;
  state.yaw -= dx * 0.0045;
  state.pitch = THREE.MathUtils.clamp(state.pitch - dy * 0.0032, 0.06, 1.12);
});
canvas.addEventListener('pointerup', (e) => { state.dragging = false; });

canvas.addEventListener('wheel', (e) => {
  state.dist = THREE.MathUtils.clamp(state.dist + e.deltaY * 0.012, 5.5, 20);
  e.preventDefault();
}, { passive: false });

ui.prompt.addEventListener('click', () => {
  if (state.near) activate(state.near);
});

const stickEl = document.getElementById('stick');
const knobEl = document.getElementById('knob');
const touchMove = { x: 0, y: 0, active: false };
function setStick(e) {
  const r = stickEl.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = (e.clientX - cx) / (r.width / 2);
  let dy = (e.clientY - cy) / (r.height / 2);
  const l = Math.hypot(dx, dy);
  if (l > 1) { dx /= l; dy /= l; }
  touchMove.x = dx; touchMove.y = dy;
  knobEl.style.transform = 'translate(calc(-50% + ' + (dx * 30) + 'px), calc(-50% + ' + (dy * 30) + 'px))';
}
if (stickEl) {
  stickEl.addEventListener('pointerdown', (e) => {
    touchMove.active = true;
    stickEl.setPointerCapture(e.pointerId);
    setStick(e);
  });
  stickEl.addEventListener('pointermove', (e) => { if (touchMove.active) setStick(e); });
  const release = () => {
    touchMove.active = false; touchMove.x = 0; touchMove.y = 0;
    knobEl.style.transform = 'translate(-50%, -50%)';
  };
  stickEl.addEventListener('pointerup', release);
  stickEl.addEventListener('pointercancel', release);
}
const actBtn = document.getElementById('act');
if (actBtn) actBtn.addEventListener('click', () => { if (state.near) activate(state.near); });

// ---------------------------------------------------------------- start
function begin() {
  sound.init();
  sound.resume();
  sound.startDrone();
  ui.start.classList.add('hidden');
  document.body.classList.add('playing');
  state.started = true;
  state.yaw = 0; state.pitch = 0.30; state.dist = 13.0;
}

$('btn-start').addEventListener('click', begin);
$('btn-again').addEventListener('click', () => location.reload());

// ---------------------------------------------------------------- debug / screenshots
if (SHOT) {
  ui.start.classList.add('hidden');
  ui.loading.classList.add('hide');
  document.body.classList.add('playing');
  state.started = true;
  const act = parseInt(params.get('act') || '0', 10);
  for (let i = 0; i < act; i++) {
    const ex = exhibits[i];
    ex.activated = true;
    ex.ringMat.color.setHex(ex.data.color);
    ex.ringMat.opacity = 1;
    ex.beaconMat.opacity = 0.62;
    ex.glow.material.opacity = 0.32;
    ex.path.material.opacity = 0.85;
    ex.obj.traverse((m) => {
      if (m.isMesh && m.material && m.material.emissive) {
        m.material.emissive.setHex(ex.data.color);
        m.material.emissiveIntensity = 1.5;
      }
    });
  }
  const anim = params.get('anim');
  if (anim !== null) {
    const ai = parseInt(anim, 10) || 0;
    setTimeout(() => activate(exhibits[ai]), 900);
  }
  state.progress = act;
  updateHUD();
  updateTower();
  if (params.get('finale') === '1') { state.progress = 6; updateHUD(); updateTower(); startFinale(); }
  const p = params.get('p');
  if (p) {
    const [x, y, z] = p.split(',').map(Number);
    player.position.set(x, 0, z);
  }
  const cam = params.get('cam');
  if (cam) {
    const [x, y, z] = cam.split(',').map(Number);
    state.camPos.set(x, y, z);
    state.fixedCam = true;
  }
  const look = params.get('look');
  if (look) {
    const [x, y, z] = look.split(',').map(Number);
    state.look.set(x, y, z);
    state.fixedLook = true;
  }
}

// ---------------------------------------------------------------- loop
const clock = new THREE.Clock();
const tmpV = new THREE.Vector3();
const fwd = new THREE.Vector3();
const right = new THREE.Vector3();

function updatePlayer(dt) {
  const speed = keys['ShiftLeft'] || keys['ShiftRight'] ? 13.5 : 8.6;
  fwd.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
  right.set(Math.cos(state.yaw), 0, -Math.sin(state.yaw));

  const wish = new THREE.Vector3();
  if (keys['KeyW'] || keys['ArrowUp']) wish.add(fwd);
  if (keys['KeyS'] || keys['ArrowDown']) wish.sub(fwd);
  if (keys['KeyD'] || keys['ArrowRight']) wish.add(right);
  if (keys['KeyA'] || keys['ArrowLeft']) wish.sub(right);

  if (touchMove.active) {
    wish.addScaledVector(fwd, -touchMove.y * 1.3);
    wish.addScaledVector(right, touchMove.x * 1.3);
  }

  if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed);
  const accel = 12;
  state.vel.x += (wish.x - state.vel.x) * Math.min(1, accel * dt);
  state.vel.z += (wish.z - state.vel.z) * Math.min(1, accel * dt);

  player.position.x += state.vel.x * dt;
  player.position.z += state.vel.z * dt;

  // island bounds
  const r = Math.hypot(player.position.x, player.position.z);
  if (r > ISLAND_R - 3) {
    const k = (ISLAND_R - 3) / r;
    player.position.x *= k; player.position.z *= k;
  }
  // tower
  if (r < 6.6) {
    const k = 6.6 / Math.max(r, 0.001);
    player.position.x *= k; player.position.z *= k;
  }
  // exhibits
  for (const ex of exhibits) {
    const dx = player.position.x - ex.pos.x, dz = player.position.z - ex.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 3.0) {
      const k = 3.0 / Math.max(d, 0.001);
      player.position.x = ex.pos.x + dx * k;
      player.position.z = ex.pos.z + dz * k;
    }
  }

  // facing
  if (wish.lengthSq() > 0.01) {
    const target = Math.atan2(wish.x, wish.z);
    let cur = player.rotation.y;
    let diff = ((target - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    player.rotation.y = cur + diff * Math.min(1, 10 * dt);
  }

  const bob = Math.sin(state.time * 8) * 0.04 * Math.min(1, state.vel.length() / 4);
  body.position.y = 1.02 + bob;

  // proximity
  let near = null, best = 4.8;
  for (const ex of exhibits) {
    if (ex.activated) continue;
    const d = Math.hypot(player.position.x - ex.pos.x, player.position.z - ex.pos.z);
    if (d < best) { best = d; near = ex; }
  }
  if (near !== state.near) {
    state.near = near;
    document.body.classList.toggle('near', !!near);
    if (near) ui.prompt.querySelector('.prompt-text').textContent = `включить «${near.data.title.toLowerCase()}»`;
  }
}

function blockedAt(x, z) {
  if (Math.hypot(x, z) > ISLAND_R - 1.5) return true;
  for (const b of buildings) {
    const dx = x - b.position.x, dz = z - b.position.z;
    const rr = (b.userData.r || 3) + 0.9;
    if (dx * dx + dz * dz < rr * rr) return true;
  }
  return false;
}

function updateCamera(dt) {
  const lookTarget = tmpV.set(player.position.x, 4.6, player.position.z);
  state.look.lerp(lookTarget, Math.min(1, 8 * dt));

  if (state.fixedCam) return;

  let dist = state.dist, pitch = state.pitch;
  if (state.finale) {
    state.finaleT += dt;
    const k = Math.min(1, state.finaleT / 5.0);
    const e = k * k * (3 - 2 * k);
    dist = THREE.MathUtils.lerp(state.dist, 34, e);
    pitch = THREE.MathUtils.lerp(state.pitch, 0.95, e);
  }
  const cp = Math.cos(pitch);
  const desired = new THREE.Vector3(
    player.position.x + Math.sin(state.yaw) * dist * cp,
    1.4 + Math.sin(pitch) * dist,
    player.position.z + Math.cos(state.yaw) * dist * cp
  );

  // keep the camera out of the buildings
  const dir = desired.clone().sub(state.look);
  const len = dir.length();
  dir.normalize();
  let allowed = len;
  for (let s = 1; s <= 16; s++) {
    const t = (len * s) / 16;
    if (blockedAt(state.look.x + dir.x * t, state.look.z + dir.z * t)) {
      allowed = Math.max(2.8, t - 1.6);
      break;
    }
  }
  const target = state.look.clone().addScaledVector(dir, allowed);
  state.camPos.lerp(target, Math.min(1, (state.finale ? 2.2 : 7) * dt));
  camera.position.copy(state.camPos);
  camera.lookAt(state.look);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  state.time += dt;

  if (state.started) updatePlayer(dt);
  updateCamera(dt);

  // exhibits idle
  exhibits.forEach((ex, i) => {
    ex.obj.position.y = 0.35 + Math.sin(state.time * 1.1 + ex.bob) * 0.045;
    ex.marker.position.y = 3.35 + Math.sin(state.time * 1.6 + ex.bob) * 0.12;
    ex.marker.rotation.y += 0.02;
    ex.marker.material.opacity = ex.activated ? 0.0 : 0.85;
    const ld = Math.hypot(player.position.x - ex.pos.x, player.position.z - ex.pos.z);
    const lfade = THREE.MathUtils.clamp((34 - ld) / 14, 0, 1);
    if (!ex.activated) {
      ex.ringMat.opacity = 0.42 + 0.16 * Math.sin(state.time * 1.6 + i);
      ex.obj.rotation.y = Math.sin(state.time * 0.45 + i) * 0.12;
      ex.label.material.opacity = (0.80 + 0.1 * Math.sin(state.time * 1.3 + i)) * lfade;
    } else {
      ex.glow.material.opacity = 0.30 + Math.sin(state.time * 2.2 + i) * 0.05;
      ex.obj.rotation.y = Math.sin(state.time * 0.3 + i) * 0.04;
      ex.label.material.opacity = 0.22;
      ex.beaconMat.opacity = 0.5 + 0.1 * Math.sin(state.time * 2 + i);
    }
  });

  // tower
  const spin = 0.12 + state.progress * 0.09 + (state.finale ? 0.5 : 0);
  rings.forEach((r, i) => {
    r.rotation.z += dt * spin * (i % 2 ? -1 : 1) * (1 + i * 0.3);
  });
  crystal.rotation.y += dt * (0.3 + state.progress * 0.1);
  crystal.rotation.x += dt * 0.12;
  const pulse = 1 + Math.sin(state.time * 1.8) * 0.04;
  halo.scale.setScalar(pulse * (1 + state.progress * 0.06));
  column.material.opacity = 0.04 + state.progress * 0.012 + (state.finale ? 0.10 : 0);

  // dust
  const dp = dust.pts.geometry.attributes.position.array;
  for (let i = 0; i < dust.spd.length; i++) {
    dp[i * 3 + 1] += dust.spd[i] * dt;
    if (dp[i * 3 + 1] > 24) dp[i * 3 + 1] = 0.3;
    dp[i * 3] += Math.sin(state.time * 0.4 + i) * dt * 0.15;
  }
  dust.pts.geometry.attributes.position.needsUpdate = true;

  // effects
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.life += dt;
    const arr = b.pts.geometry.attributes.position.array;
    for (let j = 0; j < b.vel.length; j++) {
      b.vel[j].y -= 1.6 * dt;
      arr[j * 3] += b.vel[j].x * dt;
      arr[j * 3 + 1] += b.vel[j].y * dt;
      arr[j * 3 + 2] += b.vel[j].z * dt;
    }
    b.pts.geometry.attributes.position.needsUpdate = true;
    b.pts.material.opacity = Math.max(0, 1 - b.life / 1.8);
    if (b.life > 1.8) { scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); bursts.splice(i, 1); }
  }
  for (let i = beams.length - 1; i >= 0; i--) {
    const b = beams[i];
    b.life += dt;
    const a = b.life < 0.25 ? b.life / 0.25 : Math.max(0, 1 - (b.life - 0.25) / 2.0);
    b.mesh.material.opacity = a * 0.85;
    if (b.life > 2.3) { scene.remove(b.mesh); b.mesh.geometry.dispose(); b.mesh.material.dispose(); beams.splice(i, 1); }
  }
  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i];
    p.life += dt;
    const s = 1 + p.life * 4.2;
    p.mesh.scale.set(s, s, s);
    p.mesh.material.opacity = Math.max(0, 0.85 * (1 - p.life / 1.3));
    if (p.life > 1.3) { scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); pulses.splice(i, 1); }
  }
  if (shockwave) {
    shockwave.life += dt;
    const s = 1 + shockwave.life * 22;
    shockwave.mesh.scale.set(s, s, s);
    shockwave.mesh.material.opacity = Math.max(0, 0.9 * (1 - shockwave.life / 3.4));
    if (shockwave.life > 3.4) { scene.remove(shockwave.mesh); shockwave = null; }
  }

  // finale: the city wakes up
  if (state.finale) {
    const k = Math.min(1, state.finaleT / 4.0);
    buildings.forEach((b) => {
      const target = b.userData.lightUp || 1.6;
      b.material.emissiveIntensity += (target - b.material.emissiveIntensity) * Math.min(1, dt * 1.2);
    });
    scene.fog.density = THREE.MathUtils.lerp(0.0135, 0.008, k);
    scene.background.lerp(new THREE.Color(0x0a1330), Math.min(1, dt * 0.6));
  }

  composer.render();
}

// ---------------------------------------------------------------- resize
addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------- boot
updateHUD();
renderer.compile(scene, camera);
setTimeout(() => ui.loading.classList.add('hide'), 300);
animate();

// expose for debugging in console
window.__signal = { scene, state, exhibits, activate, startFinale };
