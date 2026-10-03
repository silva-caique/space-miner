import * as THREE from '../lib/three/build/three.module.js';
// Texturas procedurais (sem arquivos externos): areia, rocha e metal com bump.
export const Tex = {
  cache: {},
  hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 1274126177) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; },
  vnoise(x, y, per, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = n => ((n % per) + per) % per;
    const a = this.hash(w(xi), w(yi), s), b = this.hash(w(xi + 1), w(yi), s), c = this.hash(w(xi), w(yi + 1), s), d = this.hash(w(xi + 1), w(yi + 1), s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  },
  fbm(x, y, oct, s) { let f = 0, amp = 0.5, per = 4, tot = 0; for (let o = 0; o < oct; o++) { f += amp * this.vnoise(x * per, y * per, per, s + o); tot += amp; amp *= 0.5; per *= 2; } return f / tot; },
  make(size, fn, srgb) {
    const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'), im = x.createImageData(size, size), d = im.data;
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) { const p = fn(i / size, j / size), k = (j * size + i) * 4; d[k] = p[0]; d[k + 1] = p[1]; d[k + 2] = p[2]; d[k + 3] = 255; }
    x.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (srgb) t.encoding = THREE.sRGBEncoding; return t;
  },
  get(name) {
    if (this.cache[name]) return this.cache[name];
    const T = this, g = v => [v, v, v];
    const defs = {
      sand: () => T.make(512, (u, v) => { const n = T.fbm(u, v, 6, 1), r = Math.sin((u * 10 + n * 4) * 6.283) * 0.5 + 0.5, k = 0.72 + 0.28 * (n * 0.6 + r * 0.4); return [k * 255, k * 246, k * 232]; }, true),
      sandB: () => T.make(512, (u, v) => { const n = T.fbm(u, v, 6, 1), r = Math.sin((u * 10 + n * 4) * 6.283) * 0.5 + 0.5; return g((n * 0.5 + r * 0.5) * 255); }),
      rock: () => T.make(256, (u, v) => { const n = T.fbm(u, v, 5, 7), cr = Math.abs(T.fbm(u, v, 4, 11) - 0.5), rust = T.fbm(u, v, 3, 19) > 0.55 ? 1 : 0, k = (0.65 + 0.35 * n) * (cr < 0.02 ? 0.45 : 1); return [k * (215 + rust * 30), k * (200 - rust * 50), k * (185 - rust * 90)]; }, true),
      rockB: () => T.make(256, (u, v) => { const n = T.fbm(u, v, 5, 7), cr = Math.abs(T.fbm(u, v, 4, 11) - 0.5); return g((cr < 0.02 ? 0.1 : n) * 255); }),
      metal: () => T.make(256, (u, v) => { const n = T.fbm(u * 0.5, v * 8, 3, 23), seam = (Math.abs((u * 4) % 1 - 0.5) > 0.485 || Math.abs((v * 4) % 1 - 0.5) > 0.485) ? 0.45 : 1, rv = Math.hypot((u * 4) % 1 - 0.06, (v * 4) % 1 - 0.06) < 0.02 ? 1.2 : 1, k = (0.7 + 0.3 * n) * seam * rv; return [k * 200, k * 205, k * 215]; }, true),
      metalB: () => T.make(256, (u, v) => { const seam = (Math.abs((u * 4) % 1 - 0.5) > 0.485 || Math.abs((v * 4) % 1 - 0.5) > 0.485) ? 0.1 : 0.7; return g(seam * 255); })
    };
    return (this.cache[name] = defs[name]());
  },
  tiled(name, rx, ry) { const t = this.get(name).clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return t; },
  rockMat(color, o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(color).convertSRGBToLinear(), map: this.get('rock'), bumpMap: this.get('rockB'), bumpScale: 2, roughness: 0.92, metalness: 0.03 }, o)); },
  metalMat(color, o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(color).convertSRGBToLinear(), map: this.get('metal'), bumpMap: this.get('metalB'), bumpScale: 1, roughness: 0.5, metalness: 0.3 }, o)); }
};
