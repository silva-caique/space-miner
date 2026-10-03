import * as THREE from '../lib/three/build/three.module.js';
import { BufferGeometryUtils } from '../lib/three/examples/jsm/utils/BufferGeometryUtils.js';
const mergeBufferGeometries = g => BufferGeometryUtils.mergeBufferGeometries(g);
import { Tex } from './Tex.js';
// Estilo cartoon: sombreamento em degraus + contorno escuro (casco invertido)
export const Toon = {
  _g: null,
  ol: new THREE.MeshBasicMaterial({ color: 0x1a0d2e, side: THREE.BackSide }),
  grad() {
    if (!this._g) {
      const t = new THREE.DataTexture(new Uint8Array([95, 155, 215, 255]), 4, 1, THREE.LuminanceFormat);
      t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; this._g = t;
    }
    return this._g;
  },
  mat(color, o = {}) { const m = Object.assign({ color: new THREE.Color(color).convertSRGBToLinear(), roughness: 0.75, metalness: 0.05 }, o); if (o.emissive !== undefined) m.emissive = new THREE.Color(o.emissive).convertSRGBToLinear(); return new THREE.MeshStandardMaterial(m); },
  shadows(root, cast = true) { root.traverse(o => { if ((o.isMesh || o.isInstancedMesh) && o.material && o.material.isMeshStandardMaterial) { o.castShadow = cast; o.receiveShadow = true; } }); },
  outline(mesh) { return mesh; }, // contornos desativados (visual realista)
  outlineInstanced() {},
  _unused(group, im, count, k = 1.1) {
    const o = new THREE.InstancedMesh(im.geometry, this.ol, count), m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    for (let i = 0; i < count; i++) { im.getMatrixAt(i, m); m.decompose(p, q, s); s.multiplyScalar(k); m.compose(p, q, s); o.setMatrixAt(i, m); }
    group.add(o);
  }
};
export const lin = hex => new THREE.Color(hex).convertSRGBToLinear();
export const Sky = {
  hex(n) { return '#' + ('000000' + n.toString(16)).slice(-6); },
  texture(L) {
    const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'), hz = this.hex(L.horizon || L.fog);
    const g = x.createLinearGradient(0, 0, 0, H / 2); g.addColorStop(0, this.hex(L.sky)); g.addColorStop(1, hz);
    x.fillStyle = g; x.fillRect(0, 0, W, H / 2); x.fillStyle = hz; x.fillRect(0, H / 2, W, H / 2);
    if (L.nebula) { // nebulosa por ruído fractal
      const w = 512, h = 128, n = document.createElement('canvas'); n.width = w; n.height = h; const nx = n.getContext('2d'), im = nx.createImageData(w, h), d = im.data;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const u = i / w, v = j / h, f = Tex.fbm(u, v * 0.5, 5, 31), f2 = Tex.fbm(u, v * 0.5, 4, 47), a = Math.pow(Math.max(0, f - 0.48) * 2.6, 1.5) * (1 - v * 0.6), k = (j * w + i) * 4;
        d[k] = 255 * (0.6 + 0.4 * f2); d[k + 1] = 90 + 150 * (1 - f2) * f2 * 3; d[k + 2] = 120 + 135 * f2; d[k + 3] = Math.min(255, a * 255);
      }
      nx.putImageData(im, 0, 0); x.drawImage(n, 0, 0, W, H / 2);
    }
    if (L.starry !== false) for (let i = 0; i < 700; i++) {
      const y = Math.random() * H * 0.46, b = Math.pow(Math.random(), 2); x.fillStyle = `rgba(255,255,${230 + Math.random() * 25},${0.35 + b * 0.65})`;
      const s = Math.random() < 0.05 ? 2.6 : Math.random() < 0.3 ? 1.6 : 1; x.fillRect(Math.random() * W, y, s, s);
    }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  },
  moon() {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    const im = x.createImageData(S, S), d = im.data;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const u = i / S, v = j / S, f = Tex.fbm(u, v, 6, 5), k = 0.45 + 0.75 * f, k4 = (j * S + i) * 4;
      d[k4] = k * 175; d[k4 + 1] = k * 150; d[k4 + 2] = k * 215; d[k4 + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    for (let i = 0; i < 26; i++) {
      const cx = Math.random() * S, cy = Math.random() * S, r = 4 + Math.random() * 20, g = x.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      g.addColorStop(0, 'rgba(60,35,110,0.55)'); g.addColorStop(0.8, 'rgba(60,35,110,0.35)'); g.addColorStop(0.92, 'rgba(230,205,255,0.5)'); g.addColorStop(1, 'rgba(230,205,255,0)');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 6.283); x.fill();
    }
    const sh = x.createRadialGradient(S * 0.35, S * 0.3, S * 0.1, S * 0.5, S * 0.5, S * 0.75); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(10,0,40,0.75)');
    x.fillStyle = sh; x.fillRect(0, 0, S, S);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
};

// Junta, dentro de um grupo, as malhas que usam o MESMO material numa só (menos chamadas de desenho). Malhas animadas devem ter userData.keep = true.
export function mergeMeshes(group) {
  const by = new Map();
  for (const c of [...group.children]) if (c.isMesh && !c.isInstancedMesh && !c.userData.keep && !c.children.length && c.material && !Array.isArray(c.material)) { if (!by.has(c.material)) by.set(c.material, []); by.get(c.material).push(c); }
  for (const [mat, list] of by) {
    if (list.length < 2) continue;
    const geos = list.map(m => { m.updateMatrix(); const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrix); return g; });
    const merged = mergeBufferGeometries(geos); if (!merged) continue;
    group.add(new THREE.Mesh(merged, mat)); for (const m of list) { group.remove(m); m.geometry.dispose(); } geos.forEach(g => g.dispose());
  }
}
