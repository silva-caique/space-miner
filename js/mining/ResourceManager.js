import * as THREE from '../lib/three/build/three.module.js';
import { Toon } from '../core/Toon.js';
import { fmt } from '../core/Util.js';
import { RARITY_ORDER, RESOURCES, Resource } from './Resource.js';
export const ResourceManager = class {
  constructor(game) { this.g = game; this.list = []; this.queue = []; this.veins = []; this.vq = []; this.group = null; }
  spawn(layer, group, planet) {
    this.group = group; this.planet = planet; this.layer = layer; this.list = []; this.queue = []; this.veins = []; this.vq = [];
    for (let i = 0, n = 60 + layer * 4; i < n; i++) this.spawnOne(false);
    for (let i = 0, n = 14 + layer * 2; i < n; i++) this.spawnOne(true); // enterrados: só o scanner revela
    for (let i = 0, n = 1 + (layer >= 2 ? 1 : 0); i < n; i++) this.spawnVein();
  }
  pick(bias) {
    const arr = Object.values(RESOURCES).filter(r => r.minDepth <= this.layer);
    const ws = arr.map(r => r.w * Math.pow(r.mul, this.layer) * (bias ? Math.pow(RARITY_ORDER.indexOf(r.rarity) + 1, 1.6) : 1));
    let roll = Math.random() * ws.reduce((a, b) => a + b, 0);
    for (let i = 0; i < arr.length; i++) { roll -= ws[i]; if (roll <= 0) return arr[i]; }
    return arr[0];
  }
  randPos() {
    let x, z, tries = 0;
    do { const a = Math.random() * 6.283, d = 10 + Math.random() * 62; x = Math.cos(a) * d; z = Math.sin(a) * d; } while (this.planet.blocked(x, z) && ++tries < 25);
    return { x, z };
  }
  place(res, x, z) {
    res.mesh.position.set(x, this.planet.heightAt(x, z), z); res.mesh.rotation.y = Math.random() * 6;
    this.group.add(res.mesh); Toon.shadows(res.mesh); this.list.push(res); return res;
  }
  spawnOne(hidden) { const p = this.randPos(); return this.place(new Resource(this.pick(hidden), hidden), p.x, p.z); }
  // Veio rico: aglomerado do mesmo minério sob um farol dourado; esgotar rende bônus
  spawnVein() {
    const arr = Object.values(RESOURCES).filter(r => r.minDepth <= this.layer && ['uncommon', 'rare', 'epic'].includes(r.rarity));
    const W = { uncommon: 3, rare: 5, epic: 2 }, ws = arr.map(r => W[r.rarity]); let roll = Math.random() * ws.reduce((a, b) => a + b, 0), def = arr[0];
    for (let i = 0; i < arr.length; i++) { roll -= ws[i]; if (roll <= 0) { def = arr[i]; break; } }
    const c = this.randPos(), n = 5 + Math.floor(Math.random() * 3), vein = { x: c.x, z: c.z, left: n, total: n, def, value: 0 };
    vein.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 46, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    vein.beam.position.set(c.x, this.planet.heightAt(c.x, c.z) + 23, c.z); this.group.add(vein.beam);
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283 + Math.random() * 0.5, d = 1.6 + Math.random() * 2.4, r = new Resource(def, false); r.vein = vein; vein.value += def.value;
      this.place(r, c.x + Math.cos(a) * d, c.z + Math.sin(a) * d);
    }
    this.veins.push(vein); return vein;
  }
  veinDone(v) {
    const g = this.g, bonus = Math.round(v.value * 0.5); g.state.credits += bonus; g.state.stats.veins++;
    g.ui.banner('💎 VEIO ESGOTADO!', '#ffd54a'); g.ui.toast(`+${fmt(bonus)} 💰 de bônus do veio`, 'legendary'); g.audio.play('legend');
    this.group.remove(v.beam); v.beam.geometry.dispose(); this.veins.splice(this.veins.indexOf(v), 1); this.vq.push(90); g.save();
  }
  find(pos, range, pred) {
    let best = null, bd = range * range;
    for (const r of this.list) {
      if (!pred(r)) continue;
      const dx = r.mesh.position.x - pos.x, dz = r.mesh.position.z - pos.z, d2 = dx * dx + dz * dz;
      if (d2 < bd) { bd = d2; best = r; }
    }
    return best;
  }
  nearest(pos, range) { return this.find(pos, range, r => r.minable); }
  remove(res) {
    this.group.remove(res.mesh);
    res.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    const i = this.list.indexOf(res); if (i >= 0) this.list.splice(i, 1);
    if (!res.vein) this.queue.push({ t: 20 + Math.random() * 20, hidden: res.hidden || Math.random() < 0.18 });
  }
  take(res) { this.remove(res); const v = res.vein; if (v && --v.left <= 0) this.veinDone(v); }
  update(dt, t) {
    for (const r of this.list) r.update(dt, t);
    for (let i = this.queue.length - 1; i >= 0; i--) { const q = this.queue[i]; q.t -= dt; if (q.t <= 0) { this.queue.splice(i, 1); this.spawnOne(q.hidden); } }
    for (let i = this.vq.length - 1; i >= 0; i--) { this.vq[i] -= dt; if (this.vq[i] <= 0) { this.vq.splice(i, 1); this.spawnVein(); this.g.ui.toast('💎 Um novo veio rico surgiu! Veja o minimapa.', 'discover'); } }
  }
};
