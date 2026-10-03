import * as THREE from '../lib/three/build/three.module.js';
import { Tex } from '../core/Tex.js';
import { Toon, mergeMeshes } from '../core/Toon.js';
import { glowTexture } from '../mining/Resource.js';
export const Planet = class {
  constructor(cfg) { Object.assign(this, cfg); this.layer = 0; this.craters = []; this.portalDown = null; this.portalUp = null; this.anim = []; }
  rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  heightAt(x, z) {
    const s = this.seed + this.layer;
    let h = 2.2 * Math.sin(x * 0.05 + s) * Math.cos(z * 0.06) + 1.2 * Math.sin(x * 0.13 + z * 0.09) + 0.6 * Math.sin(z * 0.21 - x * 0.17);
    for (const c of this.craters) {
      const d = Math.hypot(x - c.x, z - c.z);
      if (d < c.r * 1.6) { const u = d / c.r; if (u < 1) h -= c.d * (1 - u * u); h += c.d * 0.4 * Math.exp(-Math.pow((d - c.r) / (c.r * 0.22), 2)); }
    }
    h += 1.1 * (1 - Math.abs(Math.sin(x * 0.07 + Math.sin(z * 0.045) * 2 + s))); // cristas de duna
    const k = Math.min(1, Math.max(0, (Math.hypot(x, z) - 6) / 8));
    return h * k * k * (3 - 2 * k);
  }
  blocked(x, z) {
    if (this.layer === 0 && Math.hypot(x, z) < 10) return true;
    for (const p of [this.portalDown, this.portalUp]) if (p && Math.hypot(x - p.x, z - p.z) < 6) return true;
    return false;
  }
  build(group, layer) {
    this.layer = layer; this.anim = []; const L = this.layers[layer], rnd = this.rng(this.seed * 100 + layer + 7), R = 240, T = Toon;
    this.craters = [];
    for (let i = 0; i < 12; i++) { const a = rnd() * 6.283, d = 20 + rnd() * 50; this.craters.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, r: 5 + rnd() * 9, d: 1 + rnd() * 2.2 }); }
    // terreno com faixas de cor (dunas cartoon)
    const geo = new THREE.PlaneGeometry(R, R, 120, 120); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c1 = new THREE.Color(L.ground), c2 = new THREE.Color(L.ground2), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), h = this.heightAt(x, z); pos.setY(i, h);
      const t = Math.min(1, Math.max(0, (h + 2) / 7 + Tex.fbm((x + 200) / 400, (z + 200) / 400, 4, 3) * 0.35 - 0.15));
      tmp.copy(c1).lerp(c2, t).convertSRGBToLinear(); col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const sandy = layer <= 1, tm = Tex.tiled(sandy ? 'sand' : 'rock', 55, 55), tb = Tex.tiled(sandy ? 'sandB' : 'rockB', 55, 55);
    const terrain = new THREE.Mesh(geo, T.mat(0xffffff, { vertexColors: true, map: tm, bumpMap: tb, bumpScale: 1.6, roughness: 1, metalness: 0, emissive: L.emissive || 0x000000, emissiveIntensity: L.emissive ? 0.5 : 0 }));
    terrain.receiveShadow = true; group.add(terrain);
    // pedras (laranja e cinza) instanciadas com contorno
    const N = 110, rg = new THREE.IcosahedronGeometry(1, 1), rp = rg.attributes.position;
    for (let i = 0; i < rp.count; i++) { const px = rp.getX(i), py = rp.getY(i), pz = rp.getZ(i), k = 1 + 0.28 * Math.sin(px * 3.1 + py * 2.3) * Math.cos(pz * 2.7 + px * 1.7) + 0.1 * Math.sin(py * 7 + pz * 5); rp.setXYZ(i, px * k, py * k, pz * k); }
    rg.computeVertexNormals();
    const rocks = new THREE.InstancedMesh(rg, Tex.rockMat(0xffffff), N);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3(), cc = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const a = rnd() * 6.283, d = 8 + rnd() * 85, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.5 + rnd() * rnd() * 3;
      p.set(x, this.heightAt(x, z) + s * 0.25, z); e.set(rnd() * 3, rnd() * 3, rnd() * 3); q.setFromEuler(e); sc.set(s, s * (0.55 + rnd() * 0.4), s);
      m4.compose(p, q, sc); rocks.setMatrixAt(i, m4); rocks.setColorAt(i, cc.set(rnd() < 0.7 ? L.rock : L.rock2).convertSRGBToLinear());
    }
    group.add(rocks);
    // cristais decorativos brilhantes
    const M = 46, dec = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.5), T.mat(L.accent, { emissive: L.accent, emissiveIntensity: 2, roughness: 0.15, metalness: 0.2 }), M);
    for (let i = 0; i < M; i++) {
      const a = rnd() * 6.283, d = 12 + rnd() * 80, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.4 + rnd() * 1.0;
      p.set(x, this.heightAt(x, z) + s * 0.8, z); e.set(0, rnd() * 3, (rnd() - 0.5) * 0.5); q.setFromEuler(e); sc.set(s * 0.55, s * 2.4, s * 0.55);
      m4.compose(p, q, sc); dec.setMatrixAt(i, m4);
    }
    group.add(dec);
    // arcos de caverna
    const arcMat = Tex.rockMat(L.rock);
    for (let i = 0, n = layer === 0 ? 0 : 4 + layer; i < n; i++) {
      const a = rnd() * 6.283, d = 18 + rnd() * 50, x = Math.cos(a) * d, z = Math.sin(a) * d;
      const arc = new THREE.Mesh(new THREE.TorusGeometry(4, 1.3, 6, 12), arcMat); arc.position.set(x, this.heightAt(x, z), z); arc.rotation.y = rnd() * 3; group.add(T.outline(arc, 0.05));
    }
    if (layer === 0) this.buildSurface(group);
    this.portalDown = layer < this.layers.length - 1 ? { x: 36, z: -26 } : null;
    this.portalUp = layer > 0 ? { x: -12, z: 10 } : null;
    if (this.portalDown) group.add(this.makePortal(this.portalDown, 0x35d0ff));
    if (this.portalUp) group.add(this.makePortal(this.portalUp, 0xffb02e));
  }
  makePortal(pt, color) {
    const g = new THREE.Group(), ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.35, 8, 24), Toon.mat(color, { emissive: color, emissiveIntensity: 1 }));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.1, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    glow.scale.set(9, 9, 1); g.add(Toon.outline(ring, 0.08), disc, glow);
    g.position.set(pt.x, this.heightAt(pt.x, pt.z) + 2.6, pt.z); g.rotation.y = 0.8;
    this.anim.push(t => { ring.rotation.z = t; disc.material.opacity = 0.3 + 0.12 * Math.sin(t * 4); });
    return g;
  }
  buildSurface(group) {
    const T = Toon, X = Tex, ship = new THREE.Group();
    const add = (geo, mat, x, y, z, p = ship) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); p.add(m); return m; };
    const _s = X.metalMat(0x9aa3ae), _b = X.metalMat(0xb8794a, { roughness: 0.5 }), steel = () => _s, bronze = () => _b, ledM = T.mat(0x35d0ff, { emissive: 0x35d0ff, emissiveIntensity: 3 });
    const plat = X.metalMat(0x6d7480); plat.map = X.tiled('metal', 6, 6); plat.bumpMap = X.tiled('metalB', 6, 6);
    add(new THREE.CylinderGeometry(8.4, 8.8, 1.2, 48), plat, 0, -0.1, 0);
    add(new THREE.CylinderGeometry(6, 6, 1.3, 48), X.metalMat(0x808894), 0, -0.05, 0);
    add(new THREE.CylinderGeometry(3.6, 3.6, 1.35, 32), X.metalMat(0x5d6470), 0, 0, 0);
    for (let i = 0; i < 12; i++) { const a = i * 0.5236; add(new THREE.SphereGeometry(0.22, 8, 6), ledM, Math.cos(a) * 7.3, 0.6, Math.sin(a) * 7.3); }
    const r = new THREE.Group(); r.position.y = 1.4; ship.add(r);
    add(new THREE.CylinderGeometry(1.5, 2, 5.5, 24), steel(), 0, 3, 0, r);
    add(new THREE.ConeGeometry(1.5, 2.8, 24), bronze(), 0, 7.1, 0, r);
    add(new THREE.TorusGeometry(1.7, 0.12, 8, 24), bronze(), 0, 5.6, 0, r).rotation.x = Math.PI / 2;
    const win = add(new THREE.SphereGeometry(0.75, 16, 12), T.mat(0x35c8ff, { emissive: 0x1a90d8, emissiveIntensity: 2.2, roughness: 0.1 }), 0, 3.6, 1.55, r); win.scale.z = 0.5;
    add(new THREE.TorusGeometry(0.78, 0.1, 8, 20), bronze(), 0, 3.6, 1.62, r);
    for (let i = 0; i < 3; i++) { const a = i * 2.094, f = add(new THREE.BoxGeometry(0.4, 2.6, 1.8), bronze(), Math.cos(a) * 2, 1.3, Math.sin(a) * 2, r); f.rotation.y = -a; }
    const fl = add(new THREE.ConeGeometry(1, 2.4, 12), new THREE.MeshBasicMaterial({ color: 0xffc23a }), 0, -0.4, 0, r); fl.rotation.x = Math.PI;
    const pad = new THREE.Mesh(new THREE.RingGeometry(9.2, 10.2, 48), new THREE.MeshBasicMaterial({ color: 0x35d0ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    pad.rotation.x = -Math.PI / 2; pad.position.y = 0.3; ship.add(pad);
    mergeMeshes(r); mergeMeshes(ship);
    group.add(ship); this.anim.push(t => { pad.material.opacity = 0.35 + 0.2 * Math.sin(t * 2); fl.scale.y = 0.85 + 0.25 * Math.sin(t * 25); });
    for (let i = 0; i < 6; i++) { // torres de metal com tubo de energia ciano
      const a = i * 1.047 + 0.3, x = Math.cos(a) * 32, z = Math.sin(a) * 32, g = new THREE.Group();
      add(new THREE.CylinderGeometry(0.55, 0.55, 4.6, 14), T.mat(0x5ff0ff, { emissive: 0x28c8e0, emissiveIntensity: 2.2, roughness: 0.15 }), 0, 2.8, 0, g);
      add(new THREE.CylinderGeometry(0.95, 1.1, 0.8, 12), steel(), 0, 0.4, 0, g); add(new THREE.CylinderGeometry(0.85, 0.85, 0.6, 12), steel(), 0, 5.3, 0, g);
      for (let k = 0; k < 3; k++) { const b = add(new THREE.BoxGeometry(0.12, 5.2, 0.12), steel(), Math.cos(k * 2.094) * 0.85, 2.8, Math.sin(k * 2.094) * 0.85, g); }
      mergeMeshes(g); g.position.set(x, this.heightAt(x, z), z); group.add(g);
    }
  }
  update(t) { for (const f of this.anim) f(t); }
};
