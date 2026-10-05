/* LAUNCHPAD — the stage curtain.
   Two sheets of emerald velvet, simulated (Verlet), hanging from rings on a
   rail. Opening slides the rings outward; the fabric gathers into real folds
   by itself. Once open, the drapes frame the hall, breathe, and ripple where
   the cursor brushes them. */
import * as THREE from 'three';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

class Sheet {
  /* side: -1 = left drape, +1 = right drape */
  constructor({ cols, rows, W, H, side }) {
    this.cols = cols; this.rows = rows; this.side = side;
    const half = W / 2;
    this.sheetW = half * (W / H < 1 ? 1.3 : 1.14); // overlaps the centre when closed (more on tall screens)
    this.edge = side * half * 1.04;           // outer edge, just beyond the screen
    this.gather = half * 0.24;                // how much rail the drape occupies when open
    this.top = H / 2 + H * 0.04;
    const len = H * 1.12;
    const dx = this.sheetW / (cols - 1), dy = len / (rows - 1);
    const n = cols * rows;
    this.pos = new Float32Array(n * 3);
    this.prev = new Float32Array(n * 3);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 3;
      const x = this.edge - side * i * dx;
      const z = (i % 2 ? 1 : -1) * 0.11;
      this.pos[k] = this.prev[k] = x;
      this.pos[k + 1] = this.prev[k + 1] = this.top - j * dy;
      this.pos[k + 2] = this.prev[k + 2] = z;
    }
    const c = [];
    const id = (i, j) => j * cols + i;
    const add = (a, b) => {
      const ax = this.pos[a * 3], ay = this.pos[a * 3 + 1], bx = this.pos[b * 3], by = this.pos[b * 3 + 1];
      c.push(a, b, Math.hypot(ax - bx, ay - by));
    };
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      if (i < cols - 1) add(id(i, j), id(i + 1, j));
      if (j < rows - 1) add(id(i, j), id(i, j + 1));
      if (i < cols - 1 && j < rows - 1) { add(id(i, j), id(i + 1, j + 1)); add(id(i + 1, j), id(i, j + 1)); }
      if (j < rows - 2) add(id(i, j), id(i, j + 2));
    }
    this.cons = new Float32Array(c);
    this.dx = dx;
  }

  ringX(i, open) {
    const closed = this.edge - this.side * i * this.dx;
    const gathered = this.edge - this.side * i * (this.gather / (this.cols - 1));
    return closed + (gathered - closed) * open;
  }

  step(dt, open, t, brush) {
    const { pos, prev, cons, cols, rows } = this;
    const g = -9.8 * dt * dt, damp = 0.985;
    const pleat = 0.11 + 0.15 * open;          // pleats deepen as the fabric gathers
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const p = j * cols + i, k = p * 3;
      if (j === 0) continue;
      const x = pos[k], y = pos[k + 1], z = pos[k + 2];
      let vx = (x - prev[k]) * damp, vy = (y - prev[k + 1]) * damp, vz = (z - prev[k + 2]) * damp;
      prev[k] = x; prev[k + 1] = y; prev[k + 2] = z;
      // hang under its own ring, folding in depth to keep its width
      const rx = this.ringX(i, open);
      const fall = j / (rows - 1);
      vx += (rx - x) * 0.012 * (0.35 + 0.65 * fall) * open;
      const sign = i % 2 ? 1 : -1;
      vz += (sign * pleat - z) * 0.01;
      // the room breathes
      vz += Math.sin(t * 0.6 + i * 0.35 + j * 0.08) * 0.00012 * (0.4 + fall);
      // a hand brushing velvet
      if (brush.active) {
        const ddx = x - brush.x, ddy = y - brush.y;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < brush.r2) {
          const f = 1 - Math.sqrt(d2) / brush.r;
          vz -= f * 0.02;
          vx += brush.vx * f * 0.045;
          vy += brush.vy * f * 0.012;
        }
      }
      pos[k] = x + vx; pos[k + 1] = y + vy + g; pos[k + 2] = z + vz;
    }
    // rings on the rail
    for (let i = 0; i < cols; i++) {
      const k = i * 3;
      pos[k] = prev[k] = this.ringX(i, open);
      pos[k + 1] = prev[k + 1] = this.top;
      pos[k + 2] = prev[k + 2] = (i % 2 ? 1 : -1) * pleat;
    }
    for (let it = 0; it < 5; it++) {
      for (let c = 0; c < cons.length; c += 3) {
        const a = cons[c] * 3, b = cons[c + 1] * 3, rest = cons[c + 2];
        const dx = pos[b] - pos[a], dy = pos[b + 1] - pos[a + 1], dz = pos[b + 2] - pos[a + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        const diff = (d - rest) / d * 0.5;
        const aPinned = a < cols * 3, bPinned = b < cols * 3;
        if (aPinned && bPinned) continue;
        if (aPinned) { pos[b] -= dx * diff * 2; pos[b + 1] -= dy * diff * 2; pos[b + 2] -= dz * diff * 2; continue; }
        if (bPinned) { pos[a] += dx * diff * 2; pos[a + 1] += dy * diff * 2; pos[a + 2] += dz * diff * 2; continue; }
        pos[a] += dx * diff; pos[a + 1] += dy * diff; pos[a + 2] += dz * diff;
        pos[b] -= dx * diff; pos[b + 1] -= dy * diff; pos[b + 2] -= dz * diff;
      }
    }
  }
}

export function mountCurtain(host, { mobile = false, startOpen = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.setClearColor(0x023b2c, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.className = 'curtain3d';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  scene.add(new THREE.HemisphereLight(0x5fe0ad, 0x022e22, 0.35));
  const key = new THREE.DirectionalLight(0xf2fff8, 1.6);
  key.position.set(-3, 7, 5);
  scene.add(key);
  const graze = new THREE.DirectionalLight(0xdcfff0, 3.6);   // low raking light picks out every fold
  graze.position.set(9, 1.5, 1.2);
  const graze2 = new THREE.DirectionalLight(0xbff5dc, 0.45);
  graze2.position.set(-9, 0.5, 1.2);
  scene.add(graze2);
  scene.add(graze);
  const footlight = new THREE.PointLight(0x7fe0b5, 0, 9, 1.6); // warms up as the curtain parts
  footlight.position.set(0, -2.6, 2.2);
  scene.add(footlight);

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x05503a, roughness: 0.9, metalness: 0,
    sheen: 1, sheenColor: new THREE.Color(0xd2ffe9), sheenRoughness: 0.32,
    emissive: 0x022a20, side: THREE.DoubleSide,
  });

  let W = 1, H = 1, sheets = [], meshes = [];
  let open = startOpen ? 1 : 0, openFrom = open, openTo = open, openT0 = 0, openDur = 1;
  const cols = mobile ? 22 : 32, rows = mobile ? 34 : 44;

  const build = () => {
    meshes.forEach((m) => { scene.remove(m); m.geometry.dispose(); });
    const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    H = 2 * 10 * Math.tan((30 / 2) * Math.PI / 180);
    W = H * camera.aspect;
    sheets = [-1, 1].map((side) => new Sheet({ cols, rows, W, H, side }));
    meshes = sheets.map((s) => {
      const geo = new THREE.PlaneGeometry(1, 1, s.cols - 1, s.rows - 1);
      geo.setAttribute('position', new THREE.BufferAttribute(s.pos, 3));
      const m = new THREE.Mesh(geo, mat);
      m.frustumCulled = false;
      scene.add(m);
      return m;
    });
    // let the fabric find its hang before anyone sees it
    for (let i = 0; i < 160; i++) sheets.forEach((s) => s.step(1 / 60, open, i / 60, { active: false }));
    meshes.forEach((m) => { m.geometry.attributes.position.needsUpdate = true; m.geometry.computeVertexNormals(); });
  };

  /* cursor → world, on the curtain's plane */
  const brush = { active: false, x: 0, y: 0, vx: 0, vy: 0, r: 0.75, r2: 0.5625 };
  let lastX = null, lastY = null, idleT = 0;
  const onMove = (e) => {
    const r = host.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
    const x = nx * W / 2, y = ny * H / 2;
    if (lastX !== null) { brush.vx = clamp((x - lastX) * 3, -1, 1); brush.vy = clamp((y - lastY) * 3, -1, 1); }
    lastX = x; lastY = y; brush.x = x; brush.y = y; brush.active = true; idleT = 0;
  };
  addEventListener('pointermove', onMove, { passive: true });

  let running = false, raf = 0, last = 0, t = 0;
  const frame = (now) => {
    raf = running ? requestAnimationFrame(frame) : 0;
    const dt = Math.min((now - last) / 1000, 1 / 30) || 1 / 60; last = now; t += dt;
    if (openT0) {
      const k = clamp((now - openT0) / openDur);
      open = openFrom + (openTo - openFrom) * easeInOut(k);
      if (k >= 1) openT0 = 0;
    }
    idleT += dt; if (idleT > 0.15) { brush.vx *= 0.8; brush.vy *= 0.8; if (idleT > 0.6) brush.active = false; }
    for (let sub = 0; sub < 2; sub++) sheets.forEach((s) => s.step(dt / 2, open, t, brush));
    meshes.forEach((m) => { m.geometry.attributes.position.needsUpdate = true; m.geometry.computeVertexNormals(); });
    footlight.intensity = 14 * open;
    renderer.render(scene, camera);
  };

  build();
  const onResize = () => build();
  addEventListener('resize', onResize);

  return {
    open(duration = 3.2) { openFrom = open; openTo = 1; openDur = duration * 1000; openT0 = performance.now(); },
    setOpen(v) { open = openFrom = openTo = v; openT0 = 0; },
    start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    renderOnce() { renderer.render(scene, camera); },
    dispose() {
      running = false; cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove); removeEventListener('resize', onResize);
      meshes.forEach((m) => m.geometry.dispose()); mat.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
