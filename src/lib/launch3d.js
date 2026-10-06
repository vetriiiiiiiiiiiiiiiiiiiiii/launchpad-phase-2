/* LAUNCHPAD — the three reveals.
   A real cloth (Verlet simulation) settles over a hidden object on stage.
   The object itself is never rendered: only the fabric describes it.
   When product imagery exists, set data-product-src on the .product-slot
   and this module steps aside. */
import * as THREE from 'three';

const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ramp = (p, a, b) => clamp((p - a) / (b - a));
const ease = (t) => t * t * (3 - 2 * t);

/* ---------- signed distance helpers (y up) ---------- */
function sdRoundBox(px, py, pz, cx, cy, cz, hx, hy, hz, r) {
  const qx = Math.abs(px - cx) - hx + r, qy = Math.abs(py - cy) - hy + r, qz = Math.abs(pz - cz) - hz + r;
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0);
  return Math.hypot(ox, oy, oz) + Math.min(Math.max(qx, qy, qz), 0) - r;
}
function sdCappedCone(px, py, pz, cx, cy, cz, h, r1, r2) {
  const qx = Math.hypot(px - cx, pz - cz), qy = py - cy;
  const k1x = r2, k1y = h, k2x = r2 - r1, k2y = 2 * h;
  const cax = qx - Math.min(qx, qy < 0 ? r1 : r2), cay = Math.abs(qy) - h;
  const t = clamp(((k1x - qx) * k2x + (k1y - qy) * k2y) / (k2x * k2x + k2y * k2y));
  const cbx = qx - k1x + k2x * t, cby = qy - k1y + k2y * t;
  const s = cbx < 0 && cay < 0 ? -1 : 1;
  return s * Math.sqrt(Math.min(cax * cax + cay * cay, cbx * cbx + cby * cby));
}

/* ---------- the three stages ---------- */
const STAGES = {
  // 01 — a monolith in the dark
  one: {
    bg: 0x04503b, fog: [0x044a37, 5, 10], alpha: true,
    cloth: { size: 2.5, y: 1.3, color: 0x0a6a4c, sheen: 0xbff5dc, sheenRough: .4, rough: .94, emissive: 0x053a2b },
    frame: 1.55,
    sdf: (x, y, z) => sdRoundBox(x, y, z, 0, .62, 0, .3, .62, .3, .06),
    top: 1.24,
    plinth: null,
    floor: { color: 0x044a37, rough: .9, emissive: 0x033a2b },
    cam: { from: v(0, 1.25, 7.2), to: v(0, 1.0, 5.6), look: v(0, .78, 0), fov: 30 },
  },
  // 02 — a low form in a white room, a sun crossing the sky
  two: {
    bg: null, alpha: true,
    cloth: { size: 3.0, y: .74, color: 0x0e7655, sheen: 0xc9ffe6, sheenRough: .38, rough: .92, emissive: 0x05402f },
    frame: 1.9,
    sdf: (x, y, z) => sdRoundBox(x, y, z, 0, .34, 0, .78, .34, .44, .1),
    top: .68,
    plinth: null,
    floor: { shadowOnly: true },
    cam: { from: v(0, 1.6, 7.2), to: v(.3, 1.4, 6.4), look: v(0, .4, 0), fov: 30 },
  },
  // 03 — the final object, under a single beam
  three: {
    bg: 0x033f2f, fog: [0x033f2f, 5, 10], alpha: true,
    cloth: { size: 2.3, y: 1.32, color: 0x0b6247, sheen: 0xd6ffec, sheenRough: .3, rough: .9, emissive: 0x04382a },
    frame: 1.5,
    sdf: (x, y, z) => Math.min(
      sdRoundBox(x, y, z, 0, .13, 0, .55, .13, .55, .02),
      sdCappedCone(x, y, z, 0, .74, 0, .48, .36, .15) - .03),
    top: 1.25,
    plinth: { hx: .55, hy: .13, hz: .55, color: 0x087a56 },
    floor: { color: 0x05543e, rough: .82, emissive: 0x033f2f },
    cam: { from: v(0, 1.1, 7.6), to: v(0, 1.25, 5.4), look: v(0, .85, 0), fov: 30 },
  },
};

/* ---------- cloth ---------- */
class Cloth {
  constructor(n, size, y, sdf, ox = 0) {
    this.n = n; this.sdf = sdf;
    const count = (n + 1) * (n + 1);
    this.pos = new Float32Array(count * 3);
    this.prev = new Float32Array(count * 3);
    this.contact = new Uint8Array(count);
    // static friction: fabric resting on a top surface stays where it landed
    this.anchor = new Float32Array(count * 2);
    this.held = new Uint8Array(count);
    const step = size / n;
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const k = (j * (n + 1) + i) * 3;
      // start as a slightly domed sheet so it falls with natural folds
      const x = ox - size / 2 + i * step, z = -size / 2 + j * step;
      const yy = y + .04 * Math.cos((i - n / 2) * .9) * Math.cos((j - n / 2) * .7);
      this.pos[k] = this.prev[k] = x;
      this.pos[k + 1] = this.prev[k + 1] = yy;
      this.pos[k + 2] = this.prev[k + 2] = z;
    }
    const idx = (i, j) => j * (n + 1) + i;
    const c = [];
    const add = (a, b) => {
      const dx = this.pos[a * 3] - this.pos[b * 3], dy = this.pos[a * 3 + 1] - this.pos[b * 3 + 1], dz = this.pos[a * 3 + 2] - this.pos[b * 3 + 2];
      c.push(a, b, Math.hypot(dx, dy, dz));
    };
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      if (i < n) add(idx(i, j), idx(i + 1, j));
      if (j < n) add(idx(i, j), idx(i, j + 1));
      if (i < n && j < n) { add(idx(i, j), idx(i + 1, j + 1)); add(idx(i + 1, j), idx(i, j + 1)); }
      if (i < n - 1) add(idx(i, j), idx(i + 2, j));
      if (j < n - 1) add(idx(i, j), idx(i, j + 2));
    }
    this.cons = new Float32Array(c);
    this.lift = 0; this.time = 0;
  }
  /* Render a softened copy of the fabric: two Laplacian passes smooth out
     grid creases without changing how the cloth moves. */
  smoothInto(out, iters = 4) {
    const n = this.n, w = n + 1;
    if (!this._tmp) this._tmp = new Float32Array(this.pos.length);
    // ping-pong between a scratch buffer and `out`, ending in `out`
    let src = this.pos;
    for (let it = 0; it < iters; it++) {
      const dst = (iters - it) % 2 === 1 ? out : this._tmp;
      for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
        const k = (j * w + i) * 3;
        if (i === 0 || j === 0 || i === n || j === n) { dst[k] = src[k]; dst[k + 1] = src[k + 1]; dst[k + 2] = src[k + 2]; continue; }
        const l = k - 3, r = k + 3, u = k - w * 3, d = k + w * 3;
        for (let c = 0; c < 3; c++) dst[k + c] = src[k + c] * .5 + (src[l + c] + src[r + c] + src[u + c] + src[d + c]) * .125;
      }
      src = dst;
    }
    return out;
  }

  step(dt, wind = 0) {
    const { pos, prev, cons, contact, sdf, anchor, held } = this;
    const g = -9.8 * dt * dt, damp = .988, n3 = pos.length;
    this.time += dt;
    const t = this.time, n = this.n;
    for (let k = 0, p = 0; k < n3; k += 3, p++) {
      const x = pos[k], y = pos[k + 1], z = pos[k + 2];
      let vx = (x - prev[k]) * damp, vy = (y - prev[k + 1]) * damp, vz = (z - prev[k + 2]) * damp;
      prev[k] = x; prev[k + 1] = y; prev[k + 2] = z;
      let ay = g;
      // a breath of air, and (for the finale) someone's hand at the hem
      const ax = wind * dt * dt * Math.sin(t * .7 + z * 2.1 + y);
      const az = wind * dt * dt * .6 * Math.cos(t * .5 + x * 1.7);
      if (this.lift > 0) {
        const j = Math.floor(p / (n + 1));
        const front = clamp((j / n - .86) / .14);
        ay += this.lift * front * front * dt * dt * 14;
      }
      pos[k] = x + vx + ax; pos[k + 1] = y + vy + ay; pos[k + 2] = z + vz + az;
    }
    for (let it = 0; it < 4; it++) {
      for (let c = 0; c < cons.length; c += 3) {
        const a = cons[c] * 3, b = cons[c + 1] * 3, rest = cons[c + 2];
        const dx = pos[b] - pos[a], dy = pos[b + 1] - pos[a + 1], dz = pos[b + 2] - pos[a + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        const diff = (d - rest) / d * .5;
        pos[a] += dx * diff; pos[a + 1] += dy * diff; pos[a + 2] += dz * diff;
        pos[b] -= dx * diff; pos[b + 1] -= dy * diff; pos[b + 2] -= dz * diff;
      }
      // collisions: the hidden object, then the floor
      for (let k = 0, p = 0; k < n3; k += 3, p++) {
        const x = pos[k], y = pos[k + 1], z = pos[k + 2];
        const d = sdf(x, y, z) - .018;
        contact[p] = 0;
        if (d < 0) {
          const e = .002;
          let nx = sdf(x + e, y, z) - sdf(x - e, y, z);
          let ny = sdf(x, y + e, z) - sdf(x, y - e, z);
          let nz = sdf(x, y, z + e) - sdf(x, y, z - e);
          const l = Math.hypot(nx, ny, nz) || 1;
          nx /= l; ny /= l; nz /= l;
          pos[k] -= nx * d; pos[k + 1] -= ny * d; pos[k + 2] -= nz * d;
          contact[p] = 1;
          if (ny > .2 && d > -.03 && pos[k + 1] > .05) {
            if (!held[p]) { held[p] = 1; anchor[p * 2] = pos[k]; anchor[p * 2 + 1] = pos[k + 2]; }
            pos[k] = anchor[p * 2]; pos[k + 2] = anchor[p * 2 + 1];
          }
        }
        // hold on until the fabric is properly lifted away (hysteresis keeps it from creeping off)
        if (held[p]) {
          if (d > .15) held[p] = 0;
          else { pos[k] = anchor[p * 2]; pos[k + 2] = anchor[p * 2 + 1]; }
        }
        if (pos[k + 1] < .004) { pos[k + 1] = .004; contact[p] = 1; }
      }
    }
    // friction where fabric rests on something
    for (let k = 0, p = 0; k < n3; k += 3, p++) {
      if (!contact[p]) continue;
      prev[k] += (pos[k] - prev[k]) * .72;
      prev[k + 2] += (pos[k + 2] - prev[k + 2]) * .72;
    }
  }
}

/* ---------- light beam (soft volumetric cone) ---------- */
function beamMaterial(color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: 0 }, uLen: { value: 6 } },
    vertexShader: `
      varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){
        vY = position.y;
        vec4 mv = modelViewMatrix * vec4(position,1.);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uStrength; uniform float uLen;
      varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){
        float along = clamp(-vY / uLen + .5, 0., 1.);
        float edge = pow(abs(dot(vN, vV)), 2.2);
        float a = edge * (1. - along * .75) * uStrength * .16;
        gl_FragColor = vec4(uColor * a, a);
      }`,
  });
}

/* ---------- a stage ---------- */
export function mountStage(host, key, { mobile = false, interactive = null, idle = false } = {}) {
  const S = STAGES[key];
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5));
  renderer.setClearColor(0x023b2c, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'stage3d';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (S.fog) scene.fog = new THREE.Fog(S.fog[0], S.fog[1], S.fog[2]);
  const camera = new THREE.PerspectiveCamera(S.cam.fov, 1, .1, 50);

  // floor
  const floorGeo = new THREE.PlaneGeometry(40, 40);
  const floorMat = S.floor.shadowOnly
    ? new THREE.ShadowMaterial({ opacity: .26, color: 0x023b2c })
    : new THREE.MeshStandardMaterial({ color: S.floor.color, roughness: S.floor.rough, metalness: 0, emissive: S.floor.emissive || 0x0c3326 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);

  if (S.plinth) {
    const p = S.plinth;
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(p.hx * 2, p.hy * 2, p.hz * 2),
      new THREE.MeshStandardMaterial({ color: p.color, roughness: .55, metalness: 0, emissive: key === 'two' ? 0x8fb8a4 : 0x05543e, emissiveIntensity: key === 'two' ? .12 : .9 }));
    plinth.position.y = p.hy; plinth.castShadow = plinth.receiveShadow = true;
    scene.add(plinth);
  }

  // cloth
  const N = mobile ? 32 : 42;   // dense enough for soft folds, light enough to run beside everything else
  const cloth = new Cloth(N, S.cloth.size, S.cloth.y, S.sdf);
  const geo = new THREE.PlaneGeometry(1, 1, N, N);
  const shown = new Float32Array(cloth.pos.length);
  geo.setAttribute('position', new THREE.BufferAttribute(shown, 3));
  const mat = new THREE.MeshPhysicalMaterial({
    color: S.cloth.color, roughness: S.cloth.rough, metalness: 0,
    sheen: 1, sheenColor: new THREE.Color(S.cloth.sheen), sheenRoughness: S.cloth.sheenRough,
    emissive: S.cloth.emissive || 0xf7f6f0, emissiveIntensity: S.cloth.emissiveIntensity ?? (S.cloth.emissive ? 1 : .04), side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  scene.add(mesh);

  // light
  const L = {};
  if (key === 'one') {
    L.key = new THREE.SpotLight(0xf4fff8, 0, 14, .32, .85, 1.4);
    L.key.position.set(.4, 5.2, 2.2); L.key.target.position.set(0, .6, 0);
    L.rim = new THREE.SpotLight(0xd8efe2, 0, 12, .45, 1, 1.4);
    L.rim.position.set(-1.2, 3.4, -3.4); L.rim.target.position.set(0, .8, 0);
    L.amb = new THREE.HemisphereLight(0x3fd09a, 0x023b2c, .35);
    scene.add(L.key, L.key.target, L.rim, L.rim.target, L.amb);
  } else if (key === 'two') {
    L.hemi = new THREE.HemisphereLight(0xfafbf8, 0xc4e2d2, 1.15);
    L.sun = new THREE.DirectionalLight(0xfffdf6, 2.6);
    L.sun.target.position.set(0, .4, 0);
    scene.add(L.hemi, L.sun, L.sun.target);
    L.key = L.sun;
  } else {
    L.key = new THREE.SpotLight(0xffffff, 0, 16, .2, .45, 1.2);
    L.key.position.set(0, 7, .5); L.key.target.position.set(0, .6, 0);
    L.amb = new THREE.HemisphereLight(0x7fe0b5, 0x023b2c, .28);
    L.fill = new THREE.PointLight(0x7fe0b5, 0, 6, 2);
    L.fill.position.set(0, .3, 1.6);
    scene.add(L.key, L.key.target, L.amb, L.fill);
    const len = 6.6;
    L.beam = new THREE.Mesh(new THREE.CylinderGeometry(.05, 1.35, len, 48, 1, true), beamMaterial(0xeaf7ee));
    L.beam.position.set(0, 7 - len / 2, .35);
    L.beam.material.uniforms.uLen.value = len;
    scene.add(L.beam);
  }
  // a light hidden under the fabric: what spills out when you peek
  L.under = new THREE.PointLight(0xd6ffec, 0, 2.6, 1.6);
  L.under.position.set(0, .14, .2);
  scene.add(L.under);

  [L.key].forEach((l) => {
    l.castShadow = true;
    l.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    l.shadow.bias = -.0004; l.shadow.normalBias = .02;
    if (l.isDirectionalLight) {
      const c = l.shadow.camera; c.left = -3; c.right = 3; c.top = 3; c.bottom = -3; c.near = .5; c.far = 20;
    } else { l.shadow.radius = 4; }
  });

  /* settle the fabric before anyone sees it */
  let settled = 0;
  const SETTLE = 520;
  const settle = (budget) => {
    const end = Math.min(SETTLE, settled + budget);
    for (; settled < end; settled++) cloth.step(1 / 60, 0);
    if (settled >= SETTLE) { cloth.smoothInto(shown); geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); }
    return settled >= SETTLE;
  };

  let w = 1, h = 1, p = 0, running = false, raf = 0, last = 0;
  let theta = 0, thetaV = 0, peek = 0, peekTarget = 0, dragging = false, lastX = 0, clock = 0;
  if (interactive) {
    const el = interactive;
    el.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; el.setPointerCapture?.(e.pointerId); });
    el.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; thetaV = dx * .006; theta += thetaV; });
    const end = () => { dragging = false; };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  }
  const topV = v(0, S.top, 0);
  const onResize = () => {
    w = host.clientWidth; h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the object's full width in frame on tall screens
    const dist = S.cam.to.distanceTo(S.cam.look);
    const fit = 2 * Math.atan((S.frame / dist) / camera.aspect) * 180 / Math.PI;
    camera.fov = Math.max(S.cam.fov, Math.min(fit, 62));
    camera.updateProjectionMatrix();
  };

  const orbit = new THREE.Vector3();
  const apply = () => {
    const cp = ease(clamp(p));
    camera.position.lerpVectors(S.cam.from, S.cam.to, cp);
    if (theta) {
      orbit.copy(camera.position).sub(S.cam.look);
      orbit.applyAxisAngle(new THREE.Vector3(0, 1, 0), theta);
      camera.position.copy(S.cam.look).add(orbit);
    }
    camera.lookAt(S.cam.look);
    L.under.intensity = 9 * peek;
    if (key === 'one') {
      const lit = ease(ramp(p, .22, .7));
      L.key.intensity = 38 * lit;
      L.rim.intensity = 30 * ease(ramp(p, .35, .8));
      L.amb.intensity = .35 + .15 * lit;
    } else if (key === 'two') {
      // the sun crosses from left to right; the shadow swings with it
      const a = -1.15 + p * 2.3;
      L.sun.position.set(Math.sin(a) * 6, 4.2 + Math.cos(a) * 1.2, 2.6);
      L.sun.intensity = 2.1 + .8 * Math.cos(a);
    } else {
      const lit = ease(ramp(p, .34, .5));
      L.key.intensity = 42 * lit;
      L.key.angle = .12 + .1 * ease(ramp(p, .34, .66));
      L.beam.material.uniforms.uStrength.value = lit;
      L.beam.scale.set(.6 + .45 * ease(ramp(p, .34, .66)), 1, .6 + .45 * ease(ramp(p, .34, .66)));
      L.fill.intensity = 1.2 * ease(ramp(p, .7, .9));
      cloth.lift = .55 * ease(ramp(p, .8, 1));
    }
    if (peek > 0) cloth.lift = Math.max(cloth.lift, 1.25 * peek);
    else if (key !== 'three') cloth.lift = 0;
  };

  let tick = 0;
  const frame = (t) => {
    raf = running ? requestAnimationFrame(frame) : 0;
    if (!settle(40)) return;
    // the motion here is slow (drifting cloth, a moving sun): 30fps is plenty
    if (tick++ & 1) return;
    const dt = Math.min((t - last) / 1000, 1 / 15) || 1 / 30; last = t;
    clock += dt;
    if (idle) {
      // the stage breathes on its own: a slow drift, and (for 02) a sun that keeps moving
      if (!dragging) { thetaV *= .94; theta += thetaV; theta += (Math.sin(clock * .18) * .22 - theta) * .004; }
      if (key === 'two') p = .5 + Math.sin(clock * .25) * .32;
    }
    theta = clamp(theta, -1.1, 1.1);
    peek += (peekTarget - peek) * .08;
    // at rest the cloth only drifts in a faint breeze: one step per drawn frame;
    // while it's being lifted (peek / the final reveal) it gets full physics
    const busy = peek > 0.01 || peekTarget > 0 || cloth.lift > 0;
    for (let i = 0, n = busy ? 2 : 1; i < n; i++) cloth.step(1 / 60, key === 'two' ? .25 : .35);
    cloth.smoothInto(shown, 2);
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    apply();
    renderer.render(scene, camera);
  };

  onResize();
  apply();

  return {
    setProgress(x) { p = x; },
    setPeek(x) { peekTarget = x; },
    /* screen-space y (px from top of host) of the object's highest point */
    topY() { apply(); const q = topV.clone().project(camera); return (1 - (q.y * .5 + .5)) * h; },
    resize: onResize,
    warm(budget = 60) { return settle(budget); },
    start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    get ready() { return settled >= SETTLE; },
    dispose() {
      running = false; cancelAnimationFrame(raf);
      scene.traverse((o) => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); });
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}


/* ---------- the lineup: all three, side by side ---------- */
export function mountLineup(host, { mobile = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5));
  renderer.setClearColor(0x023b2c, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'stage3d';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x044a37, 8, 15);
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
  const look = v(0, .7, 0);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0x044a37, roughness: .88, emissive: 0x033a2b }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  scene.add(new THREE.HemisphereLight(0x3fd09a, 0x023b2c, .32));

  const xs = { one: -2.7, two: 0, three: 2.7 };
  const N = mobile ? 24 : 30;
  const items = [];
  ['one', 'two', 'three'].forEach((key, idx) => {
    const S = STAGES[key], ox = xs[key];
    const sdf = (x, y, z) => S.sdf(x - ox, y, z);
    if (S.plinth) {
      const pl = S.plinth;
      const m = new THREE.Mesh(new THREE.BoxGeometry(pl.hx * 2, pl.hy * 2, pl.hz * 2),
        new THREE.MeshStandardMaterial({ color: key === 'two' ? 0xe4efe8 : pl.color, roughness: .55, emissive: key === 'two' ? 0x8fb8a4 : 0x05543e, emissiveIntensity: key === 'two' ? .12 : .9 }));
      m.position.set(ox, pl.hy, 0); m.castShadow = m.receiveShadow = true; scene.add(m);
    }
    const cloth = new Cloth(N, S.cloth.size, S.cloth.y, sdf, ox);
    const geo = new THREE.PlaneGeometry(1, 1, N, N);
    const shown = new Float32Array(cloth.pos.length);
    geo.setAttribute('position', new THREE.BufferAttribute(shown, 3));
    const mat = new THREE.MeshPhysicalMaterial({
      color: S.cloth.color, roughness: S.cloth.rough, sheen: 1, sheenColor: new THREE.Color(S.cloth.sheen),
      sheenRoughness: S.cloth.sheenRough, side: THREE.DoubleSide,
      emissive: S.cloth.emissive || 0xf7f6f0, emissiveIntensity: S.cloth.emissiveIntensity ?? (S.cloth.emissive ? 1 : .04),
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; scene.add(mesh);
    const spot = new THREE.SpotLight(0xf4fff8, 0, 16, .26, .7, 1.3);
    spot.position.set(ox, 6.5, 1.6); spot.target.position.set(ox, .5, 0);
    spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -.0004; spot.shadow.radius = 4;
    scene.add(spot, spot.target);
    items.push({ cloth, geo, shown, spot, delay: idx * .55 });
  });

  let settled = 0, running = false, raf = 0, last = 0, clock = 0, w = 1, h = 1, mx = 0, my = 0;
  const SETTLE = 460;
  const settle = (budget) => {
    const end = Math.min(SETTLE, settled + budget);
    for (; settled < end; settled++) items.forEach((it) => it.cloth.step(1 / 60, 0));
    return settled >= SETTLE;
  };
  const onResize = () => {
    w = host.clientWidth; h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const fit = 2 * Math.atan((5.3 / 10) / camera.aspect) * 180 / Math.PI;
    camera.fov = Math.max(30, Math.min(fit, 78));
    // tall screens: lift the gaze so the objects sit low, above the labels
    look.y = camera.aspect < 1 ? 2.6 : 2.05;
    camera.updateProjectionMatrix();
  };
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  let tick = 0;
  const frame = (t) => {
    raf = running ? requestAnimationFrame(frame) : 0;
    if (!settle(30)) return;
    if (tick++ & 1) return;   // 30fps: slow motion only
    const dt = Math.min((t - last) / 1000, 1 / 30) || 1 / 60; last = t; clock += dt;
    items.forEach((it) => {
      it.cloth.step(1 / 60, .3);
      it.cloth.smoothInto(it.shown, 2);
      it.geo.attributes.position.needsUpdate = true; it.geo.computeVertexNormals();
      it.spot.intensity = 46 * ease(clamp((clock - it.delay) / 1.6));
    });
    camera.position.set(Math.sin(clock * .1) * .6 + mx * 1.2, 2.1 - my * .5, 10);
    camera.lookAt(look);
    renderer.render(scene, camera);
  };
  onResize();
  return {
    resize: onResize,
    warm(b = 40) { return settle(b); },
    start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    dispose() {
      running = false; cancelAnimationFrame(raf);
      scene.traverse((o) => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); });
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}

