import * as THREE from '../lib/three/build/three.module.js';
import { Tex } from '../core/Tex.js';
import { Toon } from '../core/Toon.js';
import { fmt } from '../core/Util.js';
import { glowTexture, makeBeacon } from './Resource.js';
// Baús escondidos: 3 raridades, os melhores são guardados por criaturas. Abra com E.
export const CHEST_TIERS = [
  { id: 'common', name: 'Baú de Suprimentos', color: 0x8f99a6, glow: 0x35d0ff, mult: 1, w: 60, guards: 0, css: '#9fe8ff' },
  { id: 'rare', name: 'Baú Reforçado', color: 0x3f66d8, glow: 0x4aa8ff, mult: 2.5, w: 30, guards: 1, css: '#4aa8ff' },
  { id: 'epic', name: 'Baú Arcano', color: 0x8a3ad8, glow: 0xb85cff, mult: 6, w: 10, guards: 2, css: '#b85cff' }
];
export const Chest = class {
  constructor(tier, x, z, planet) {
    this.tier = tier; this.opened = false; this.ping = 0; this.t = Math.random() * 6;
    const g = this.group = new THREE.Group(); g.position.set(x, planet.heightAt(x, z), z); g.rotation.y = Math.random() * 6.28;
    const X = Tex, add = (geo, mat, px, py, pz, p = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); p.add(m); return m; };
    add(new THREE.BoxGeometry(1.7, 1, 1.15), X.metalMat(tier.color, { roughness: 0.45 }), 0, 0.5, 0);
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.14, 1.04, 1.2), X.metalMat(0x2a2f3a), s * 0.6, 0.5, 0);
    this.lid = new THREE.Group(); this.lid.position.set(0, 1, -0.575); g.add(this.lid);
    add(new THREE.BoxGeometry(1.74, 0.34, 1.19), X.metalMat(tier.color, { roughness: 0.4 }), 0, 0.17, 0.575, this.lid);
    this.latch = add(new THREE.BoxGeometry(0.3, 0.3, 0.12), Toon.mat(tier.glow, { emissive: tier.glow, emissiveIntensity: 3 }), 0, 0.95, 0.6);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: tier.glow, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7 }));
    this.glow.scale.set(3.4, 3.4, 1); this.glow.position.y = 1.1; g.add(this.glow);
    this.beacon = makeBeacon(tier.glow); g.add(this.beacon); Toon.shadows(g);
  }
  update(dt) {
    this.t += dt; this.glow.material.opacity = this.opened ? 0.15 : 0.5 + 0.25 * Math.sin(this.t * 3);
    this.lid.rotation.x += ((this.opened ? -1.9 : 0) - this.lid.rotation.x) * Math.min(1, dt * 6);
    if (this.ping > 0) this.ping -= dt; this.beacon.visible = this.ping > 0 && !this.opened;
  }
};
export const ChestManager = class {
  constructor(g) { this.g = g; this.list = []; }
  spawn(layer, group, planet) {
    this.list = []; this.group = group; const n = layer === 0 ? 1 : 2 + (layer >= 3 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const ws = CHEST_TIERS.map(t => t.w * (t.id === 'epic' ? 1 + layer * 0.4 : t.id === 'rare' ? 1 + layer * 0.15 : 1)); let roll = Math.random() * ws.reduce((a, b) => a + b, 0), tier = CHEST_TIERS[0];
      for (let k = 0; k < ws.length; k++) { roll -= ws[k]; if (roll <= 0) { tier = CHEST_TIERS[k]; break; } }
      let x, z, tries = 0; do { const a = Math.random() * 6.283, d = 22 + Math.random() * 50; x = Math.cos(a) * d; z = Math.sin(a) * d; } while (planet.blocked(x, z) && ++tries < 25);
      const c = new Chest(tier, x, z, planet); group.add(c.group); this.list.push(c);
      const pool = planet.layers[layer].enemies.filter(e => e.t !== 'slime' && e.t !== 'guardian'); 
      for (let k = 0; k < tier.guards && pool.length; k++) this.g.enemies.spawnNear(pool[Math.floor(Math.random() * pool.length)].t, x, z);
    }
  }
  nearest(pos, r) { let best = null, bd = r * r; for (const c of this.list) { if (c.opened) continue; const dx = c.group.position.x - pos.x, dz = c.group.position.z - pos.z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = c; } } return best; }
  update(dt) { for (const c of this.list) c.update(dt); }
  open(c) {
    const g = this.g, t = c.tier, L = g.layer; if (c.opened) return; c.opened = true;
    const credits = Math.round((120 + Math.pow(L + 1, 1.7) * 90) * t.mult * (0.8 + Math.random() * 0.5));
    const items = 1 + Math.floor(Math.random() * 2) + (t.id === 'epic' ? 2 : t.id === 'rare' ? 1 : 0); let got = 0, sold = 0;
    for (let i = 0; i < items; i++) { const d = g.resources.pick(true); if (g.inventory.add(d.id, 1)) { got++; g.codex.discoverMineral(d.id); } else sold += d.value; }
    g.state.credits += credits + sold; g.state.stats.chests++; g.stats.addXP(Math.round(30 * t.mult * (L + 1))); g.pet.addXP(3 + Math.round(t.mult));
    const p = c.group.position.clone(); p.y += 1.2; g.particles.burst(p, t.glow, 30 + t.mult * 6, 8); g.audio.play('chest'); g.shake = 0.25;
    g.ui.toast(`📦 ${t.name}: +${fmt(credits + sold)} 💰${got ? ` e ${got} ite${got > 1 ? 'ns' : 'm'}` : ''}`, t.id === 'common' ? 'discover' : 'legendary');
    if (t.id === 'epic') g.ui.banner('✨ BAÚ ARCANO!', t.css); g.save();
  }
};
