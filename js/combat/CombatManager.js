import * as THREE from '../lib/three/build/three.module.js';
import { Toon } from '../core/Toon.js';
import { glowTexture } from '../mining/Resource.js';
import { Projectile } from './Projectile.js';
import { WeaponManager } from './WeaponManager.js';
import { DamageSystem } from './DamageSystem.js';
// Combate 100% manual: só atira quando o jogador aperta o botão. A mira é a retícula no centro da tela (sem mira automática).
export class CombatManager {
  constructor(g) {
    this.g = g; this.weapons = new WeaponManager(g); this.damage = new DamageSystem(g);
    this.geo = new THREE.SphereGeometry(0.26, 10, 8); this.mats = {}; this.pool = []; this.active = []; this.beams = []; this.beamPool = [];
    this.aimPoint = new THREE.Vector3(); this.aimDir = new THREE.Vector3(0, 0, -1); this.target = null; this.spread = 0; this.recent = 0; this.warn = 0; this.flashT = 0;
    this.beamGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true); this.tmpC = new THREE.Vector3();
    this.flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x9fe8ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); this.flash.visible = false; g.scene.add(this.flash);
  }
  get weapon() { return this.weapons.current; }
  mat(c) { const k = String(c); return this.mats[k] || (this.mats[k] = Toon.mat(c, { emissive: c, emissiveIntensity: 4 })); }
  note(msg) { const n = performance.now(); if (n > this.warn) { this.warn = n + 1500; this.g.ui.toast(msg, 'warn'); } }
  color(w) { return parseInt(String(w.def.color).replace('#', ''), 16); }
  // Raio que sai do centro da tela: acha o ponto mirado no terreno ou em um inimigo
  computeAim() {
    const g = this.g, cam = g.camera; cam.updateMatrixWorld(); const o = cam.position, d = this.aimDir.set(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
    let tHit = 90; this.target = null;
    for (let t = 2; t < 90; t += 1.5) { const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t; if (y < g.planet.heightAt(x, z)) { tHit = t; break; } }
    for (const e of g.enemies.list) {
      const c = e.center(this.tmpC), r = e.radius * 1.15, ox = o.x - c.x, oy = o.y - c.y, oz = o.z - c.z, b = ox * d.x + oy * d.y + oz * d.z, disc = b * b - (ox * ox + oy * oy + oz * oz - r * r);
      if (disc >= 0) { const t = -b - Math.sqrt(disc); if (t > 1 && t < tHit) { tHit = t; this.target = e; } }
    }
    this.aimPoint.copy(o).addScaledVector(d, tHit);
  }
  shotDir(from) {
    const dir = this.aimPoint.clone().sub(from);
    if (dir.lengthSq() < 4 || dir.clone().normalize().dot(this.aimDir) < 0.2) dir.copy(this.aimDir);
    return dir.normalize();
  }
  update(dt) {
    const g = this.g, inp = g.input;
    for (const id in this.weapons.map) this.weapons.map[id].tick(dt);
    this.recent = Math.max(0, this.recent - dt); this.spread = Math.max(0, this.spread - dt * 2.5);
    this.computeAim();
    const w = this.weapon, want = w.def.auto ? inp.fire : (inp.fire && inp.fireEdge);
    if (want && w.cd <= 0) this.tryFire(w);
    inp.fireEdge = false;
    this.updateProjectiles(dt); this.updateBeams(dt);
    if (this.flashT > 0) { this.flashT -= dt; if (this.flashT <= 0) this.flash.visible = false; }
    g.player.setStance(this.recent > 0 ? 'gun' : 'drill', this.color(w));
  }
  tryFire(w) {
    const g = this.g, d = w.def, L = w.lv;
    if (g.stats.energy < d.energy) { this.note(`⚡ Sem energia para a ${d.name}.`); g.audio.play('empty'); w.cd = 0.25; return; }
    g.stats.energy -= d.energy; w.trigger(); g.state.stats.shots++; this.recent = 2.5; this.spread = Math.min(1, this.spread + 0.35);
    const from = g.player.tip(), base = this.shotDir(from), col = this.color(w);
    this.flash.material.color.set(col); this.flash.position.copy(from); this.flash.scale.setScalar(1.6 + Math.random() * 0.6); this.flash.visible = true; this.flashT = 0.06;
    g.particles.burst(from, col, 3, 3); g.audio.play(d.sound); g.shake = Math.max(g.shake, d.recoil || 0.03);
    const sp = L.spread + this.spread * 0.01 + (g.player.moving ? 0.01 : 0);
    if (d.type === 'hitscan') { this.hitscan(w, from, this.jitter(base, sp)); return; }
    for (let i = 0; i < (d.pellets || 1); i++) this.spawn(w, from, this.jitter(base, sp));
  }
  jitter(dir, s) { const v = dir.clone(); v.x += (Math.random() - 0.5) * 2 * s; v.y += (Math.random() - 0.5) * 2 * s; v.z += (Math.random() - 0.5) * 2 * s; return v.normalize(); }
  spawn(w, from, dir) {
    const p = this.pool.pop() || new Projectile(this.g.scene, this.geo), d = w.def, col = this.color(w);
    p.launch(this.mat(col), col, d.size, from, dir, d.speed, w.lv.range / d.speed, w.lv.damage, w); p.origin = from.clone(); this.active.push(p);
  }
  releaseProj(i) { const p = this.active[i]; p.release(); this.pool.push(p); this.active.splice(i, 1); }
  updateProjectiles(dt) {
    const g = this.g;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i], steps = Math.max(1, Math.ceil(p.speed * dt / 0.8)), h = dt / steps; let done = false;
      for (let s = 0; s < steps && !done; s++) {
        p.mesh.position.addScaledVector(p.vel, h); const pos = p.mesh.position;
        if (pos.y < g.planet.heightAt(pos.x, pos.z)) { this.impact(p, null); done = true; break; }
        for (const e of g.enemies.list) { if (pos.distanceTo(e.center(this.tmpC)) < e.radius + p.size) { this.impact(p, e); done = true; break; } }
      }
      p.life -= dt;
      if (done || p.life <= 0) this.releaseProj(i);
    }
  }
  impact(p, e) {
    const g = this.g, w = p.weapon, L = w.lv, pos = p.mesh.position, col = this.color(w);
    if (L.splash) {
      g.particles.burst(pos, col, 40, 9); g.shake = Math.max(g.shake, 0.35); g.audio.play('rock');
      for (const t of g.enemies.list.slice()) { const d = t.center(this.tmpC).distanceTo(pos); if (d <= L.splash + t.radius) { const r = this.damage.roll(p.damage * (1 - 0.5 * Math.min(1, d / (L.splash + t.radius)))); this.damage.hit(t, r.dmg, r.crit, pos); } }
      return;
    }
    g.particles.burst(pos, col, e ? 8 : 5, 4);
    if (e) { let dmg = p.damage; if (w.def.falloff) dmg *= 1 - w.def.falloff * Math.min(1, pos.distanceTo(p.origin) / L.range); const r = this.damage.roll(dmg); this.damage.hit(e, r.dmg, r.crit, pos); }
  }
  // Armas de raio: acerto instantâneo ao longo do raio, parando no terreno
  hitscan(w, from, dir) {
    const g = this.g, L = w.lv, d = w.def; let tMax = L.range;
    for (let t = 1; t <= L.range; t += 1.5) { const x = from.x + dir.x * t, y = from.y + dir.y * t, z = from.z + dir.z * t; if (y < g.planet.heightAt(x, z)) { tMax = t; break; } }
    const hits = [];
    for (const e of g.enemies.list) {
      const c = e.center(this.tmpC), r = e.radius + 0.2, ox = from.x - c.x, oy = from.y - c.y, oz = from.z - c.z, b = ox * dir.x + oy * dir.y + oz * dir.z, disc = b * b - (ox * ox + oy * oy + oz * oz - r * r);
      if (disc >= 0) { const t = -b - Math.sqrt(disc); if (t >= 0 && t <= tMax) hits.push({ e, t }); }
    }
    hits.sort((a, b) => a.t - b.t); const n = Math.min(d.pierce || 1, hits.length); let endT = n ? hits[n - 1].t : tMax;
    for (let i = 0; i < n; i++) { const r = this.damage.roll(L.damage); this.damage.hit(hits[i].e, r.dmg, r.crit, from); }
    const end = from.clone().addScaledVector(dir, endT); g.particles.burst(end, this.color(w), n ? 10 : 4, 5); this.beam(from, end, w);
  }
  beam(a, b, w) {
    const m = this.beamPool.pop() || new THREE.Mesh(this.beamGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    m.material.color.set(this.color(w)); const len = a.distanceTo(b), r = w.def.size;
    m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b); m.rotateX(Math.PI / 2); m.scale.set(r, len, r); this.g.scene.add(m); this.beams.push({ m, t: w.def.beamTime || 0.08, t0: w.def.beamTime || 0.08 });
  }
  updateBeams(dt) {
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i]; b.t -= dt; b.m.material.opacity = 0.85 * Math.max(0, b.t / b.t0);
      if (b.t <= 0) { this.g.scene.remove(b.m); this.beamPool.push(b.m); this.beams.splice(i, 1); }
    }
  }
  clear() { for (let i = this.active.length - 1; i >= 0; i--) this.releaseProj(i); for (const b of this.beams) { this.g.scene.remove(b.m); this.beamPool.push(b.m); } this.beams = []; this.flash.visible = false; }
}
