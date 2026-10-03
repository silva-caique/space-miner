import * as THREE from '../lib/three/build/three.module.js';
import { Toon } from '../core/Toon.js';
import { RESOURCES, glowTexture } from './Resource.js';
// Itens largados pelas criaturas: saltam, ficam brilhando e voam até o jogador quando ele chega perto.
export class PickupManager {
  constructor(g) { this.g = g; this.list = []; this.pool = []; this.geo = new THREE.OctahedronGeometry(0.3); this.mats = {}; }
  mat(def) { return this.mats[def.id] || (this.mats[def.id] = Toon.mat(def.color, { emissive: def.color, emissiveIntensity: 2.2, roughness: 0.2 })); }
  make() {
    const m = new THREE.Mesh(this.geo, null), s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); s.scale.set(2.2, 2.2, 1); m.add(s); m.userData.glow = s; this.g.scene.add(m); return m;
  }
  spawn(id, at) {
    const def = RESOURCES[id]; if (!def) return; const m = this.pool.pop() || this.make();
    m.material = this.mat(def); m.userData.glow.material.color.set(def.color); m.position.copy(at); m.visible = true;
    this.list.push({ m, def, t: 0, life: 45, vx: (Math.random() - 0.5) * 5, vy: 5 + Math.random() * 3, vz: (Math.random() - 0.5) * 5 });
  }
  release(i) { const p = this.list[i]; p.m.visible = false; this.pool.push(p.m); this.list.splice(i, 1); }
  update(dt) {
    const g = this.g, P = g.player.pos;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i], m = p.m; p.t += dt; p.life -= dt; m.rotation.y += dt * 3;
      const dx = P.x - m.position.x, dy = P.y + 1 - m.position.y, dz = P.z - m.position.z, d = Math.hypot(dx, dy, dz);
      if (p.t > 0.55 && d < 5.5) { const s = Math.min(d, 15 * dt); m.position.x += dx / d * s; m.position.y += dy / d * s; m.position.z += dz / d * s; if (d < 1.3) { this.collect(p); this.release(i); continue; } }
      else { p.vy -= 14 * dt; m.position.x += p.vx * dt; m.position.z += p.vz * dt; m.position.y += p.vy * dt; const gy = g.planet.heightAt(m.position.x, m.position.z) + 0.6; if (m.position.y < gy) { m.position.y = gy; p.vy = 0; p.vx *= 0.8; p.vz *= 0.8; } }
      if (p.life <= 0) this.release(i);
    }
  }
  collect(p) {
    const g = this.g, d = p.def;
    if (g.inventory.add(d.id, 1)) g.ui.toast(`+1 ${d.name} (drop)`, d.rarity); else { g.state.credits += d.value; g.ui.toast(`Mochila cheia: ${d.name} vendido por ${d.value} 💰`, 'warn'); }
    g.audio.play('collect'); g.mining.award(d, 1);
  }
  clear() { for (let i = this.list.length - 1; i >= 0; i--) this.release(i); }
}
