/* LAUNCHPAD — the stage curtain.
   Emerald velvet, simulated (Verlet), made the way theatre drapes are made:
   - fullness: each drape holds ~1.7× more fabric than the width it covers,
     so it hangs in deep pleats from rail to floor, even when closed;
   - a weighted hem, so the folds fall straight;
   - a fixed valance across the top, like a proscenium border.
   Opening slides the rings outward; the fabric gathers into folds by itself.
   Recessed folds darken (cheap ambient occlusion through vertex colour), and a
   fine pile texture gives the surface its velvet. */
import * as THREE from 'three';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

class Drape {
  /* side: -1 hangs from the left edge, +1 from the right.
     coverage: rail width it covers when closed; gather: rail width when open. */
  constructor({ cols, rows, coverage, gather, edge, side, top, len, fullness, z0 = 0, movable = true }) {
    Object.assign(this, { cols, rows, coverage, gather, edge, side, top, z0, movable });
    this.fabricW = coverage * fullness;
    this.rest = this.fabricW / (cols - 1);           // fabric between neighbouring rings
    this.dy = len / (rows - 1);
    const n = cols * rows;
    this.pos = new Float32Array(n * 3);
    this.prev = new Float32Array(n * 3);
    this.ao = new Float32Array(n * 3);
    this.shown = new Float32Array(n * 3);
    this._tmp = new Float32Array(n * 3);
    // no two pleats are the same: a smooth random depth per fold
    const raw = Array.from({ length: cols }, () => 0.55 + Math.random() * 0.9);
    this.var = Float32Array.from(raw, (v, i) => (v + (raw[i - 1] ?? v) + (raw[i + 1] ?? v)) / 3);
    const a0 = this.amp(0);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 3;
      this.pos[k] = this.prev[k] = this.ringX(i, 0);
      this.pos[k + 1] = this.prev[k + 1] = top - j * this.dy;
      this.pos[k + 2] = this.prev[k + 2] = z0 + (i % 2 ? a0 : -a0) * this.var[i];
    }
    const c = [];
    const id = (i, j) => j * cols + i;
    const add = (a, b) => {
      const A = a * 3, B = b * 3;
      c.push(a, b, Math.hypot(this.pos[A] - this.pos[B], this.pos[A + 1] - this.pos[B + 1], this.pos[A + 2] - this.pos[B + 2]));
    };
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      if (i < cols - 1) add(id(i, j), id(i + 1, j));
      if (j < rows - 1) add(id(i, j), id(i, j + 1));
      if (i < cols - 1 && j < rows - 1) { add(id(i, j), id(i + 1, j + 1)); add(id(i + 1, j), id(i, j + 1)); }
      if (j < rows - 2) add(id(i, j), id(i, j + 2));
    }
    this.cons = new Float32Array(c);
  }

  spacing(open) { return (this.coverage + (this.gather - this.coverage) * open) / (this.cols - 1); }
  ringX(i, open) { return this.edge - this.side * i * this.spacing(open); }
  /* pleat depth that keeps the fabric's true width between two rings */
  amp(open) { const h = this.spacing(open); return Math.sqrt(Math.max(0, this.rest * this.rest - h * h)) / 2; }

  step(dt, open, t, brush) {
    const { pos, prev, cons, cols, rows, z0 } = this;
    const g = -9.8 * dt * dt, damp = 0.983;
    const a = this.amp(open);
    for (let j = 1; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 3;
      const x = pos[k], y = pos[k + 1], z = pos[k + 2];
      let vx = (x - prev[k]) * damp, vy = (y - prev[k + 1]) * damp, vz = (z - prev[k + 2]) * damp;
      prev[k] = x; prev[k + 1] = y; prev[k + 2] = z;
      const fall = j / (rows - 1);
      // each column hangs under its ring; pleats hold their shape down the length
      vx += (this.ringX(i, open) - x) * 0.006 * (0.4 + 0.6 * fall);
      vz += (z0 + (i % 2 ? a : -a) * this.var[i] * (1 - 0.35 * fall) - z) * 0.006;
      // the room breathes
      vz += Math.sin(t * 0.55 + i * 0.4 + j * 0.06) * 0.00009 * (0.3 + fall);
      // a hand brushing velvet
      if (brush.active) {
        const ddx = x - brush.x, ddy = y - brush.y, d2 = ddx * ddx + ddy * ddy;
        if (d2 < brush.r2) {
          const f = 1 - Math.sqrt(d2) / brush.r;
          vz -= f * 0.018;
          vx += brush.vx * f * 0.04;
          vy += brush.vy * f * 0.012;
        }
      }
      // a weighted hem: the last rows fall heavier
      const weight = j >= rows - 2 ? 2.6 : 1;
      pos[k] = x + vx; pos[k + 1] = y + vy + g * weight; pos[k + 2] = z + vz;
    }
    for (let i = 0; i < cols; i++) {
      const k = i * 3;
      pos[k] = prev[k] = this.ringX(i, open);
      pos[k + 1] = prev[k + 1] = this.top;
      pos[k + 2] = prev[k + 2] = z0 + (i % 2 ? a : -a) * this.var[i];
    }
    const pinned = cols * 3;
    for (let it = 0; it < 6; it++) {
      for (let c = 0; c < cons.length; c += 3) {
        const A = cons[c] * 3, B = cons[c + 1] * 3, rest = cons[c + 2];
        const dx = pos[B] - pos[A], dy = pos[B + 1] - pos[A + 1], dz = pos[B + 2] - pos[A + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        const diff = (d - rest) / d * 0.5;
        const ap = A < pinned, bp = B < pinned;
        if (ap && bp) continue;
        if (ap) { pos[B] -= dx * diff * 2; pos[B + 1] -= dy * diff * 2; pos[B + 2] -= dz * diff * 2; continue; }
        if (bp) { pos[A] += dx * diff * 2; pos[A + 1] += dy * diff * 2; pos[A + 2] += dz * diff * 2; continue; }
        pos[A] += dx * diff; pos[A + 1] += dy * diff; pos[A + 2] += dz * diff;
        pos[B] -= dx * diff; pos[B + 1] -= dy * diff; pos[B + 2] -= dz * diff;
      }
    }
  }

  /* soft crests: render a smoothed copy (the simulation is untouched) */
  smooth(iters = 2) {
    const { cols, rows } = this;
    let src = this.pos;
    for (let it = 0; it < iters; it++) {
      const dst = (iters - it) % 2 === 1 ? this.shown : this._tmp;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = (j * cols + i) * 3;
        if (i === 0 || i === cols - 1 || j === 0 || j === rows - 1) { dst[k] = src[k]; dst[k + 1] = src[k + 1]; dst[k + 2] = src[k + 2]; continue; }
        const l = k - 3, r = k + 3, u = k - cols * 3, d = k + cols * 3;
        for (let c = 0; c < 3; c++) dst[k + c] = src[k + c] * 0.5 + (src[l + c] + src[r + c]) * 0.19 + (src[u + c] + src[d + c]) * 0.06;
      }
      src = dst;
    }
  }

  /* recessed folds trap shadow; the crests catch light */
  shade(open) {
    const a = Math.max(this.amp(open), 0.02);
    const { pos, ao, z0 } = this;
    for (let k = 0; k < pos.length; k += 3) {
      const f = clamp((pos[k + 2] - z0 + a) / (2 * a));
      const v = 0.3 + 0.7 * f * f * (3 - 2 * f);
      ao[k] = ao[k + 1] = ao[k + 2] = v;
    }
  }
}

/* a fine velvet pile: vertical streaks and grain, used as a bump map */
function pileTexture() {
  const s = 256, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const img = g.createImageData(s, s);
  const col = new Float32Array(s).map(() => Math.random());
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const v = 0.5 + (col[x] - 0.5) * 0.55 + (Math.random() - 0.5) * 0.35;
    const p = (y * s + x) * 4;
    img.data[p] = img.data[p + 1] = img.data[p + 2] = clamp(v) * 255; img.data[p + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function mountCurtain(host, { mobile = false, startOpen = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.setClearColor(0x023b2c, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = 'curtain3d';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  // theatre light: a soft front spot pools on the fabric; edges fall away
  scene.add(new THREE.HemisphereLight(0x46c895, 0x021f18, 0.16));
  const spot = new THREE.SpotLight(0xf3fff8, 85, 30, 0.5, 1, 1.2);
  spot.position.set(0.6, -1.2, 9.5); spot.target.position.set(0, 0.3, 0);
  scene.add(spot, spot.target);
  const top = new THREE.DirectionalLight(0xe6fff2, 0.55);       // from the fly tower
  top.position.set(-1, 9, 3);
  scene.add(top);
  const graze = new THREE.DirectionalLight(0xd8ffee, 1.7);     // raking light across the pleats
  graze.position.set(9, 1, 1.4);
  scene.add(graze);
  const footlight = new THREE.PointLight(0x7fe0b5, 0, 9, 1.6);  // warms as the curtain parts
  footlight.position.set(0, -2.7, 2.2);
  scene.add(footlight);

  const pile = pileTexture();
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x0a6e50, roughness: 0.95, metalness: 0,
    sheen: 1, sheenColor: new THREE.Color(0xc9ffe6), sheenRoughness: 0.28,
    bumpMap: pile, bumpScale: 0.9,
    vertexColors: true, emissive: 0x01261c, side: THREE.DoubleSide,
  });
  const valMat = mat.clone();
  valMat.color = new THREE.Color(0x075a41);

  let W = 1, H = 1, drapes = [], meshes = [];
  let open = startOpen ? 1 : 0, openFrom = open, openTo = open, openT0 = 0, openDur = 1;
  const cols = innerWidth < innerHeight ? 16 : mobile ? 26 : 40, rows = mobile ? 34 : 46;

  const sync = () => {
    drapes.forEach((d, i) => {
      d.smooth(2);
      d.shade(d.movable ? open : 0);
      const geo = meshes[i].geometry;
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      geo.computeVertexNormals();
    });
  };

  const build = () => {
    meshes.forEach((m) => { scene.remove(m); m.geometry.dispose(); });
    const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    H = 2 * 10 * Math.tan((30 / 2) * Math.PI / 180);
    W = H * camera.aspect;
    const half = W / 2;
    const cover = half * (camera.aspect < 1 ? 1.3 : 1.14);
    const railTop = H / 2 + H * 0.02;
    drapes = [-1, 1].map((side) => new Drape({
      cols, rows, side, coverage: cover, gather: half * 0.22, edge: side * half * 1.04,
      top: railTop, len: H * 1.1, fullness: 2.0,
    }));
    // the valance: a fixed pleated border across the top, slightly in front
    const val = new Drape({
      cols: mobile ? 34 : 56, rows: 7, side: -1, coverage: W * 1.1, gather: W * 1.1, edge: -W * 0.55,
      top: railTop + H * 0.01, len: H * 0.13, fullness: 1.9, z0: 0.45, movable: false,
    });
    drapes.push(val);
    meshes = drapes.map((d, idx) => {
      const geo = new THREE.PlaneGeometry(1, 1, d.cols - 1, d.rows - 1);
      geo.setAttribute('position', new THREE.BufferAttribute(d.shown, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(d.ao, 3));
      const uv = geo.attributes.uv;
      for (let q = 0; q < uv.count; q++) uv.setXY(q, uv.getX(q) * (idx === 2 ? 30 : 12), uv.getY(q) * (idx === 2 ? 2 : 16));
      const m = new THREE.Mesh(geo, idx === 2 ? valMat : mat);
      m.frustumCulled = false;
      m.renderOrder = idx === 2 ? 2 : 1;
      scene.add(m);
      return m;
    });
    for (let i = 0; i < 220; i++) drapes.forEach((d) => d.step(1 / 60, d.movable ? open : 0, i / 60, { active: false }));
    sync();
  };

  const brush = { active: false, x: 0, y: 0, vx: 0, vy: 0, r: 0.8, r2: 0.64 };
  const still = { active: false };
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
    for (let sub = 0; sub < 2; sub++) drapes.forEach((d) => d.step(dt / 2, d.movable ? open : 0, t, d.movable ? brush : still));
    sync();
    footlight.intensity = 14 * open;
    spot.intensity = 85 - 35 * open;   // once open, the hall takes the light
    renderer.render(scene, camera);
  };

  build();
  const onResize = () => build();
  addEventListener('resize', onResize);

  return {
    open(duration = 3) { openFrom = open; openTo = 1; openDur = duration * 1000; openT0 = performance.now(); },
    close(duration = 1.4) { openFrom = open; openTo = 0; openDur = duration * 1000; openT0 = performance.now(); },
    setOpen(v) { open = openFrom = openTo = v; openT0 = 0; },
    start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    dispose() {
      running = false; cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove); removeEventListener('resize', onResize);
      meshes.forEach((m) => m.geometry.dispose()); mat.dispose(); valMat.dispose(); pile.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
