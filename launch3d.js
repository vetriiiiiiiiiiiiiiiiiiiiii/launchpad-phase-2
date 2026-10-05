/* LAUNCHPAD — the three reveals.
   A real cloth (Verlet simulation) settles over a hidden object on stage.
   The object itself is never rendered: only the fabric describes it.
   When product imagery exists, set data-product-src on the .product-slot
   and this module steps aside. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js';

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
    bg: 0x052a21, fog: [0x052a21, 6, 13], alpha: true,
    cloth: { size: 2.5, y: 1.5, color: 0x0e4535, sheen: 0xc9a45c, sheenRough: .38, rough: .94, emissive: 0x03271e },
    frame: 1.55,
    sdf: (x, y, z) => sdRoundBox(x, y, z, 0, .62, 0, .3, .62, .3, .06),
    top: 1.24,
    plinth: null,
    floor: { color: 0x0a3a2d, rough: .9, emissive: 0x032a20 },
    cam: { from: v(0, 1.25, 7.2), to: v(0, 1.0, 5.6), look: v(0, .78, 0), fov: 30 },
  },
  // 02 — a low form in a white room, a sun crossing the sky
  two: {
    bg: null, alpha: true,
    cloth: { size: 3.3, y: 1.35, color: 0xf1ebe0, sheen: 0xffffff, sheenRough: .7, rough: .86 },
    frame: 1.9,
    sdf: (x, y, z) => Math.min(
      sdRoundBox(x, y, z, 0, .2, 0, 1.0, .2, .6, .015),
      sdRoundBox(x, y, z, 0, .63, 0, .6, .23, .34, .1)),
    top: .86,
    plinth: { hx: 1.0, hy: .2, hz: .6, color: 0xe2dbce },
    floor: { shadowOnly: true },
    cam: { from: v(0, 1.55, 6.6), to: v(.25, 1.35, 5.8), look: v(0, .55, 0), fov: 30 },
  },
  // 03 — the final object, under a single beam
  three: {
    bg: 0x0a1f3d, fog: [0x0a1f3d, 6, 12], alpha: true,
    cloth: { size: 2.3, y: 1.5, color: 0x173460, sheen: 0xe0c27e, sheenRough: .34, rough: .92, emissive: 0x081d3c },
    frame: 1.5,
    sdf: (x, y, z) => Math.min(
      sdRoundBox(x, y, z, 0, .13, 0, .55, .13, .55, .02),
      sdCappedCone(x, y, z, 0, .74, 0, .48, .36, .15) - .03),
    top: 1.25,
    plinth: { hx: .55, hy: .13, hz: .55, color: 0x1d3d6b },
    floor: { color: 0x0f2a52, rough: .82, emissive: 0x08203f },
    cam: { from: v(0, 1.1, 7.6), to: v(0, 1.25, 5.4), look: v(0, .85, 0), fov: 30 },
  },
};

/* ---------- cloth ---------- */
class Cloth {
  constructor(n, size, y, sdf) {
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
      const x = -size / 2 + i * step, z = -size / 2 + j * step;
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
        } else if (d > .04) held[p] = 0;
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
export function mountStage(host, key, { mobile = false } = {}) {
  const S = STAGES[key];
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.8));
  renderer.setClearColor(0x052a21, 0);
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
    ? new THREE.ShadowMaterial({ opacity: .26, color: 0x0b3a2e })
    : new THREE.MeshStandardMaterial({ color: S.floor.color, roughness: S.floor.rough, metalness: 0, emissive: S.floor.emissive || 0x052a21 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);

  if (S.plinth) {
    const p = S.plinth;
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(p.hx * 2, p.hy * 2, p.hz * 2),
      new THREE.MeshStandardMaterial({ color: p.color, roughness: .55, metalness: 0 }));
    plinth.position.y = p.hy; plinth.castShadow = plinth.receiveShadow = true;
    scene.add(plinth);
  }

  // cloth
  const N = mobile ? 38 : 54;
  const cloth = new Cloth(N, S.cloth.size, S.cloth.y, S.sdf);
  const geo = new THREE.PlaneGeometry(1, 1, N, N);
  geo.setAttribute('position', new THREE.BufferAttribute(cloth.pos, 3));
  const mat = new THREE.MeshPhysicalMaterial({
    color: S.cloth.color, roughness: S.cloth.rough, metalness: 0,
    sheen: 1, sheenColor: new THREE.Color(S.cloth.sheen), sheenRoughness: S.cloth.sheenRough,
    emissive: S.cloth.emissive || 0xf1ebe0, emissiveIntensity: S.cloth.emissive ? 1 : .04, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  scene.add(mesh);

  // light
  const L = {};
  if (key === 'one') {
    L.key = new THREE.SpotLight(0xffe6c8, 0, 14, .32, .85, 1.4);
    L.key.position.set(.4, 5.2, 2.2); L.key.target.position.set(0, .6, 0);
    L.rim = new THREE.SpotLight(0xc9a27a, 0, 12, .45, 1, 1.4);
    L.rim.position.set(-1.2, 3.4, -3.4); L.rim.target.position.set(0, .8, 0);
    L.amb = new THREE.HemisphereLight(0x3fa07e, 0x0a1f3d, .35);
    scene.add(L.key, L.key.target, L.rim, L.rim.target, L.amb);
  } else if (key === 'two') {
    L.hemi = new THREE.HemisphereLight(0xfffaf1, 0xc9c0b2, 1.15);
    L.sun = new THREE.DirectionalLight(0xfff3e2, 2.6);
    L.sun.target.position.set(0, .4, 0);
    scene.add(L.hemi, L.sun, L.sun.target);
    L.key = L.sun;
  } else {
    L.key = new THREE.SpotLight(0xfff1dc, 0, 16, .2, .45, 1.2);
    L.key.position.set(0, 7, .5); L.key.target.position.set(0, .6, 0);
    L.amb = new THREE.HemisphereLight(0x4a78b8, 0x052a21, .32);
    L.fill = new THREE.PointLight(0xc9a45c, 0, 6, 2);
    L.fill.position.set(0, .3, 1.6);
    scene.add(L.key, L.key.target, L.amb, L.fill);
    const len = 6.6;
    L.beam = new THREE.Mesh(new THREE.CylinderGeometry(.05, 1.35, len, 48, 1, true), beamMaterial(0xf3dcaa));
    L.beam.position.set(0, 7 - len / 2, .35);
    L.beam.material.uniforms.uLen.value = len;
    scene.add(L.beam);
  }
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
    if (settled >= SETTLE) { geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); }
    return settled >= SETTLE;
  };

  let w = 1, h = 1, p = 0, running = false, raf = 0, last = 0;
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

  const apply = () => {
    const cp = ease(clamp(p));
    camera.position.lerpVectors(S.cam.from, S.cam.to, cp);
    camera.lookAt(S.cam.look);
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
      L.key.intensity = 70 * lit;
      L.key.angle = .12 + .1 * ease(ramp(p, .34, .66));
      L.beam.material.uniforms.uStrength.value = lit;
      L.beam.scale.set(.6 + .45 * ease(ramp(p, .34, .66)), 1, .6 + .45 * ease(ramp(p, .34, .66)));
      L.fill.intensity = 1.2 * ease(ramp(p, .7, .9));
      cloth.lift = .55 * ease(ramp(p, .8, 1));
    }
  };

  const frame = (t) => {
    raf = running ? requestAnimationFrame(frame) : 0;
    if (!settle(40)) return;
    const dt = Math.min((t - last) / 1000, 1 / 30) || 1 / 60; last = t;
    cloth.step(Math.min(dt, 1 / 60), key === 'two' ? .25 : .35);
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    apply();
    renderer.render(scene, camera);
  };

  onResize();
  apply();

  return {
    setProgress(x) { p = x; },
    /* screen-space y (px from top of host) of the object's highest point */
    topY() { apply(); const q = topV.clone().project(camera); return (1 - (q.y * .5 + .5)) * h; },
    resize: onResize,
    warm(budget = 60) { return settle(budget); },
    start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    get ready() { return settled >= SETTLE; },
  };
}
