import * as THREE from '../lib/three/build/three.module.js';
import { Tex } from '../core/Tex.js';
import { Toon, mergeMeshes } from '../core/Toon.js';
// Preenchidos a partir de config/resources.json (ver core/Config.js)
export const RARITY = {};
export const RARITY_ORDER = [];
export const RESOURCES = {};
export const glowTexture = (() => {
  let t;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (t = new THREE.CanvasTexture(c));
  };
})();
// Farol de sinal (scanner): visível através do terreno
export const makeBeacon = color => {
  const g = new THREE.Group(), s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false }));
  s.scale.set(3.2, 3.2, 1); s.position.y = 2.4; s.renderOrder = 15;
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 16, 6, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  b.position.y = 8; g.add(s, b); g.visible = false; return g;
};
export const Resource = class {
  constructor(def, hidden = false) {
    this.def = def; this.progress = 0; this.t = Math.random() * 10; this.hidden = hidden; this.ping = 0; this.vein = null; this.claimed = false; this.beacon = null;
    this.mesh = new THREE.Group(); this.body = new THREE.Group(); this.mesh.add(this.body); this.build(); if (hidden) this.setShown(false);
  }
  get minable() { return !this.hidden || this.ping > 0; }
  setShown(v) { this.body.visible = v; if (this.glow) this.glow.visible = v; if (this.beamG) this.beamG.visible = v; }
  build() {
    const d = this.def, r = RARITY[d.rarity], b = this.body, rock = d.shape === 'rock';
    const mat = rock ? Tex.rockMat(d.color, { emissive: d.color, emissiveIntensity: 0.05 }) : Toon.mat(d.color, { emissive: d.color, emissiveIntensity: 1.8, roughness: 0.12, metalness: 0.25 });
    if (rock) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), mat);
      m.scale.set(1.25, 0.8, 1); m.position.y = 0.55; m.rotation.set(Math.random() * 3, Math.random() * 3, 0); b.add(Toon.outline(m));
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), mat); s.position.set(0.9, 0.3, 0.3); b.add(Toon.outline(s));
    } else if (d.shape === 'core') {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), mat); m.position.y = 1.6; b.add(Toon.outline(m)); this.spin = m; this.rings = [];
      for (let i = 0; i < 2; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.06, 6, 32), new THREE.MeshBasicMaterial({ color: r.color }));
        ring.position.y = 1.6; ring.rotation.x = i ? 1.2 : 0.4; ring.userData.s = i ? 1.5 : -1; b.add(ring); this.rings.push(ring);
      }
    } else {
      const n = d.shape === 'star' ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), mat), h = (d.shape === 'star' ? 2.2 : 1.6) + Math.random() * 0.9, o = i ? 1 : 0;
        m.scale.set(0.75, h, 0.75); m.position.set((Math.random() - 0.5) * 1.2 * o, h * 0.45, (Math.random() - 0.5) * 1.2 * o);
        m.rotation.z = (Math.random() - 0.5) * 0.5 * o; m.rotation.y = Math.random() * 3; b.add(Toon.outline(m, 0.1));
      }
    }
    if (d.shape !== 'core') mergeMeshes(b);
    if (r.glow > 0) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: r.color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.85 }));
      this.gk = 1.5 + r.glow * 1.3; s.scale.set(this.gk, this.gk, 1); s.position.y = 1.2; this.mesh.add(s); this.glow = s;
    }
    if (d.rarity === 'legendary' || d.rarity === 'mythic') {
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 60, 8, 1, true), new THREE.MeshBasicMaterial({ color: r.color, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      beam.position.y = 30; this.mesh.add(beam); this.beamG = beam;
    }
  }
  update(dt) {
    this.t += dt; this.body.scale.setScalar(1 - 0.35 * this.progress);
    if (this.spin) { this.spin.rotation.y += dt; this.spin.rotation.x += dt * 0.6; }
    if (this.rings) for (const r of this.rings) r.rotation.z += dt * r.userData.s;
    if (this.glow) { const p = 1 + 0.15 * Math.sin(this.t * 3); this.glow.scale.set(this.gk * p, this.gk * p, 1); }
    if (this.def.shape !== 'rock') this.body.position.y = Math.sin(this.t * 2) * 0.12;
    if (this.ping > 0) {
      this.ping -= dt;
      if (!this.beacon) { this.beacon = makeBeacon(this.hidden ? 0x7fefff : RARITY[this.def.rarity].color); this.mesh.add(this.beacon); }
      this.beacon.visible = true; this.beacon.children[0].scale.setScalar(3 + 0.5 * Math.sin(this.t * 6)); this.setShown(true);
    } else { if (this.beacon) this.beacon.visible = false; if (this.hidden) this.setShown(false); }
  }
};
