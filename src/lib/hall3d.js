/* LAUNCHPAD — the hall.
   What the curtain opens onto: an emerald auditorium, built rather than
   photographed. Curved, raked rows of velvet seats; a stage; and on it the
   three veiled launch objects (the same cloth simulation as the launches),
   each in its own spotlight, light falling through haze. As the curtain
   parts the house lights dim and the stage lights rise; scrolling carries
   the camera down the aisle toward the stage. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Cloth, STAGES, beamMaterial } from './launch3d.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

function seatGeometry() {
  const cushion = new THREE.BoxGeometry(0.52, 0.12, 0.5); cushion.translate(0, 0.42, 0);
  const back = new THREE.BoxGeometry(0.52, 0.66, 0.1); back.rotateX(-0.16); back.translate(0, 0.8, 0.24);
  const armL = new THREE.BoxGeometry(0.06, 0.24, 0.46); armL.translate(-0.29, 0.56, 0.02);
  const armR = armL.clone(); armR.translate(0.58, 0, 0);
  const base = new THREE.BoxGeometry(0.14, 0.38, 0.14); base.translate(0, 0.19, 0.06);
  return mergeGeometries([cushion, back, armL, armR, base]);
}

export function mountHall(host, { mobile = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.4 : 1.6));
  renderer.setClearColor(0x022e22, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'hall3d';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x02332a, 0.02);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);

  const STAGE_Z = -10, STAGE_TOP = 1.1;

  // ---------- architecture ----------
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x053d2e, roughness: 0.9, emissive: 0x01261c });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x033529, roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  // raked floor under the seats
  const rake = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), new THREE.MeshStandardMaterial({ color: 0x043b2e, roughness: 0.9 }));
  rake.rotation.x = -Math.PI / 2 - 0.31; rake.position.set(0, 1.2, 1.2);   // rises toward the back rake.receiveShadow = true; scene.add(rake);
  // stage
  const stage = new THREE.Mesh(new THREE.BoxGeometry(16, STAGE_TOP, 6.5), new THREE.MeshPhysicalMaterial({ color: 0x064a37, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.18, emissive: 0x022a1f }));
  stage.position.set(0, STAGE_TOP / 2, STAGE_Z); stage.receiveShadow = stage.castShadow = true; scene.add(stage);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.06, 0.1), new THREE.MeshBasicMaterial({ color: 0x7fe0b5 }));
  lip.position.set(0, STAGE_TOP + 0.01, STAGE_Z + 3.26); scene.add(lip);
  // back wall and side walls with vertical fins
  const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), wallMat);
  back.position.set(0, 8, STAGE_Z - 3.4); scene.add(back);
  // the name, projected softly on the back wall, like a launch set
  const wordTex = (() => {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 400;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '600 220px Archivo, "Helvetica Neue", Arial, sans-serif';
    if ('letterSpacing' in g) g.letterSpacing = '70px';
    g.fillText('LAUNCHPAD', 1024 + 35, 200);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const wordMat = new THREE.MeshBasicMaterial({ map: wordTex, color: 0x7fe0b5, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const word = new THREE.Mesh(new THREE.PlaneGeometry(13, 13 * 400 / 2048), wordMat);
  word.position.set(0, 4.15, STAGE_Z - 3.3); scene.add(word);
  // a soft halo behind the name
  const haloMat = new THREE.MeshBasicMaterial({ color: 0x1fae78, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    map: (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })() });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(22, 9), haloMat);
  halo.position.set(0, 4.1, STAGE_Z - 3.35); scene.add(halo);
  // two moving heads, sweeping slowly across the room
  const movers = [-1, 1].map((side) => {
    const len = 16;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 1.1, len, 32, 1, true), beamMaterial(0x9ff0c9));
    m.material.uniforms.uLen.value = len;
    m.geometry.translate(0, -len / 2, 0);
    m.position.set(side * 7.2, 10.8, STAGE_Z + 2.6);
    scene.add(m);
    return { m, side };
  });
  const finGeo = new THREE.BoxGeometry(0.25, 14, 0.6);
  const fins = new THREE.InstancedMesh(finGeo, wallMat, 48);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 24; i++) for (const side of [-1, 1]) {
    m4.makeTranslation(side * 13.5, 7, STAGE_Z + 2 + i * 1.3);
    fins.setMatrixAt(i * 2 + (side > 0 ? 1 : 0), m4);
  }
  scene.add(fins);
  // proscenium frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x044533, roughness: 0.7 });
  for (const side of [-1, 1]) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 1), frameMat);
    col.position.set(side * 8.6, 5, STAGE_Z + 3.4); scene.add(col);
  }
  const header = new THREE.Mesh(new THREE.BoxGeometry(18.4, 1.6, 1), frameMat);
  header.position.set(0, 9.6, STAGE_Z + 3.4); scene.add(header);

  // ---------- seats: curved, raked rows facing the stage ----------
  const rows = mobile ? 9 : 12;
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x07503b, roughness: 0.75, emissive: 0x011f17 });
  const placements = [];
  const focus = new THREE.Vector3(0, 0, STAGE_Z - 2);
  for (let r = 0; r < rows; r++) {
    const R = 8.2 + r * 0.92;
    const span = 0.7 - r * 0.014;
    const n = Math.round((R * span * 2) / 0.62);
    for (let s = 0; s < n; s++) {
      const a = -span + (s / (n - 1)) * span * 2;
      if (Math.abs(a) < 0.035) continue;            // the centre aisle
      const x = focus.x + Math.sin(a) * R;
      const z = focus.z + Math.cos(a) * R;
      placements.push([x, r * 0.3 + 0.05, z, a]);
    }
  }
  const seats = new THREE.InstancedMesh(seatGeometry(), seatMat, placements.length);
  const q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  placements.forEach(([x, y, z, a], i) => {
    q.setFromAxisAngle(up, a + Math.PI);
    m4.compose(p.set(x, y, z), q, sc);
    seats.setMatrixAt(i, m4);
  });
  seats.castShadow = !mobile; seats.receiveShadow = true;
  scene.add(seats);

  // ---------- light ----------
  const house = new THREE.HemisphereLight(0x6fe3b2, 0x02301f, 1.5);     // house lights
  scene.add(house);
  const wash = new THREE.PointLight(0x2fbf86, 30, 30, 1.6);              // wall wash
  wash.position.set(0, 9, 4); scene.add(wash);
  const backGlow = new THREE.PointLight(0x3ddc9c, 6, 18, 1.4);       // a glow on the back wall, behind the objects
  backGlow.position.set(0, 2.4, STAGE_Z - 1.6); scene.add(backGlow);
  // ceiling: a field of small lamps
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0xd9ffee }), 140);
  for (let i = 0; i < 140; i++) {
    m4.makeTranslation((Math.random() - 0.5) * 24, 13 + Math.random() * 0.6, STAGE_Z + 3 + Math.random() * 26);
    dots.setMatrixAt(i, m4);
  }
  scene.add(dots);

  // ---------- the three veiled objects, each in its spotlight ----------
  const xs = [-4.2, 0, 4.2];
  const keys = ['one', 'two', 'three'];
  const N = mobile ? 24 : 30;
  const objects = keys.map((key, idx) => {
    const S = STAGES[key];
    const cloth = new Cloth(N, S.cloth.size, S.cloth.y, S.sdf);
    const geo = new THREE.PlaneGeometry(1, 1, N, N);
    const shown = new Float32Array(cloth.pos.length);
    geo.setAttribute('position', new THREE.BufferAttribute(shown, 3));
    const mat = new THREE.MeshPhysicalMaterial({
      color: S.cloth.color, roughness: S.cloth.rough, sheen: 1, sheenColor: new THREE.Color(S.cloth.sheen),
      sheenRoughness: S.cloth.sheenRough, side: THREE.DoubleSide,
      emissive: S.cloth.emissive || 0xf7f6f0, emissiveIntensity: S.cloth.emissiveIntensity ?? (S.cloth.emissive ? 1 : 0.04),
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = !mobile; mesh.frustumCulled = false;
    const group = new THREE.Group();
    group.add(mesh);
    if (S.plinth) {
      const pl = S.plinth;
      const box = new THREE.Mesh(new THREE.BoxGeometry(pl.hx * 2, pl.hy * 2, pl.hz * 2), new THREE.MeshStandardMaterial({ color: pl.color, roughness: 0.55, emissive: 0x05543e, emissiveIntensity: 0.6 }));
      box.position.y = pl.hy; box.castShadow = !mobile; group.add(box);
    }
    group.position.set(xs[idx], STAGE_TOP, STAGE_Z - 0.4);
    group.scale.setScalar(1.15);
    scene.add(group);
    const spot = new THREE.SpotLight(0xf4fff8, 0, 26, 0.26, 0.6, 1.2);
    spot.position.set(xs[idx], 12, STAGE_Z + 1.5);
    spot.target.position.set(xs[idx], STAGE_TOP, STAGE_Z - 0.4);
    if (!mobile) { spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0005; }
    scene.add(spot, spot.target);
    const len = 11;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 1.7, len, 40, 1, true), beamMaterial(0xe8fff2));
    beam.position.set(xs[idx], 12 - len / 2, STAGE_Z + 1.0);
    beam.lookAt(xs[idx], STAGE_TOP, STAGE_Z - 0.4); beam.rotateX(Math.PI / 2);
    beam.material.uniforms.uLen.value = len;
    scene.add(beam);
    return { cloth, geo, shown, spot, beam, settled: 0 };
  });

  // ---------- state ----------
  let open = 0, scroll = 0, mx = 0, my = 0, t = 0, openedAt = 0;
  const SETTLE = 380;
  const warm = (budget = 30) => {
    let done = true;
    objects.forEach((o) => {
      const end = Math.min(SETTLE, o.settled + budget);
      for (; o.settled < end; o.settled++) o.cloth.step(1 / 60, 0);
      if (o.settled < SETTLE) done = false;
      o.cloth.smoothInto(o.shown, 3); o.geo.attributes.position.needsUpdate = true; o.geo.computeVertexNormals();
    });
    return done;
  };

  const CAM = { back: new THREE.Vector3(0, 7.6, 14.5), mid: new THREE.Vector3(0, 5.9, 7.6), near: new THREE.Vector3(0, 3.9, 0.5) };
  const look = new THREE.Vector3(0, 0.45, STAGE_Z);
  const onResize = () => {
    const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 84 : camera.aspect < 1.2 ? 52 : 38;
    camera.updateProjectionMatrix();
  };
  const onMove = (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('resize', onResize);
  onResize();

  let running = false, raf = 0, last = 0;
  const pos = new THREE.Vector3();
  const frame = (now) => {
    raf = running ? requestAnimationFrame(frame) : 0;
    const dt = Math.min((now - last) / 1000, 1 / 30) || 1 / 60; last = now; t += dt;
    // the room settles in once the curtain has gone
    const settleIn = openedAt ? ease(clamp((now - openedAt) / 7000)) : 0;
    pos.lerpVectors(CAM.back, CAM.mid, settleIn);
    pos.lerp(CAM.near, ease(scroll));
    pos.x += mx * 1.4; pos.y -= my * 0.6;
    camera.position.lerp(pos, 0.08);
    camera.lookAt(look);
    // house lights down, stage lights up
    house.intensity = lerp(1.5, 0.22, open);
    wash.intensity = lerp(40, 6, open);
    backGlow.intensity = lerp(4, 14, open);
    const lit = ease(clamp(open * 1.3 - 0.3));
    wordMat.opacity = 0.55 * lit * (0.92 + 0.08 * Math.sin(t * 1.3));
    haloMat.opacity = 0.22 * lit;
    movers.forEach(({ m, side }, i) => {
      m.rotation.z = side * (0.35 + 0.28 * Math.sin(t * 0.32 + i * 1.7));
      m.rotation.x = 0.55 + 0.12 * Math.sin(t * 0.21 + i);
      m.material.uniforms.uStrength.value = 0.55 * lit;
    });
    objects.forEach((o, i) => {
      const k = ease(clamp(open * 1.6 - i * 0.22));
      o.spot.intensity = 420 * k;
      o.beam.material.uniforms.uStrength.value = k * 1.2;
      if (o.settled >= SETTLE) {
        o.cloth.step(1 / 60, 0.25);
        o.cloth.smoothInto(o.shown, 3);
        o.geo.attributes.position.needsUpdate = true; o.geo.computeVertexNormals();
      }
    });
    renderer.render(scene, camera);
  };
  camera.position.copy(CAM.back); camera.lookAt(look);

  return {
    warm,
    setOpen(v) { if (v > 0 && !openedAt) openedAt = performance.now(); open = v; },
    animateOpen(ms = 2600) {
      openedAt = performance.now();
      const t0 = performance.now();
      const tick = () => { const k = clamp((performance.now() - t0) / ms); open = ease(k); if (k < 1) requestAnimationFrame(tick); };
      tick();
    },
    setScroll(v) { scroll = clamp(v); },
    start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    renderOnce() { renderer.render(scene, camera); },
    dispose() {
      running = false; cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove); removeEventListener('resize', onResize);
      scene.traverse((o) => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); });
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
