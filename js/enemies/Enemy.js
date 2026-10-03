import * as THREE from '../lib/three/build/three.module.js';
import { Toon, mergeMeshes } from '../core/Toon.js';
import { glowTexture } from '../mining/Resource.js';
import { EnemyAI } from './EnemyAI.js';
import { layerStats } from './EnemyConfig.js';
// Preenchido a partir de config/enemies.json
export const ENEMIES = {};
export const Enemy = class {
  constructor(def, x, z, planet, manager) {
    this.def = def; this.m = manager; this.planet = planet; this.layerIdx = planet.layer;
    const st = layerStats(def, planet.layers[planet.layer], planet.layer);
    this.maxHp = st.maxHp; this.hp = st.maxHp; this.speed = st.speed; this.damage = st.damage; this.projDamage = st.projDamage; this.detect = st.detect; this.size = st.size; this.alertT = st.alert; this.memory = st.memory; this.attackRate = st.attackRate; this.reach = st.reach; this.hostile = st.hostile;
    this.special = def.special && planet.layer >= (def.special.fromLayer || 0) ? def.special : null;
    this.marked = 0; this.hit = 0; this.t = Math.random() * 9; this.seed = Math.random() * 9; this.acc = 0; this.moving = false; this.ring = null;
    this.home = new THREE.Vector3(x, 0, z); this.vel = new THREE.Vector3();
    this.mesh = new THREE.Group(); this.mesh.position.set(x, planet.heightAt(x, z), z); this.mesh.rotation.y = Math.random() * 6.28; this.body = new THREE.Group(); this.mesh.add(this.body);
    this.mats = []; this.build(); if (this.fistL) { this.fistL.userData.keep = true; this.fistR.userData.keep = true; } mergeMeshes(this.body); this.addMenace(); this.mesh.scale.setScalar(this.size); this.ai = new EnemyAI(this);
  }
  build() {
    const d = this.def, b = this.body, T = Toon;
    const M = (c, o) => { const m = T.mat(c, o); this.mats.push(m); return m; };
    const mat = M(d.color, { emissive: d.color, emissiveIntensity: 0.12 });
    const add = (geo, m, x, y, z, p, ol = 0.07) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); (p || b).add(ol ? T.outline(o, ol) : o); return o; };
    const white = T.mat(0xffffff), black = T.mat(0x181020);
    const eye = (x, y, z, r) => { add(new THREE.SphereGeometry(r, 10, 8), white, x, y, z, null, 0.08); add(new THREE.SphereGeometry(r * 0.5, 8, 6), black, x, y - r * 0.05, z + r * 0.72, null, 0); };
    if (d.id === 'slime') {
      const s = add(new THREE.SphereGeometry(0.95, 16, 12), mat, 0, 0.75, 0); s.scale.set(1, 0.82, 1);
      eye(-0.32, 1.05, 0.72, 0.28); eye(0.32, 1.05, 0.72, 0.28);
      add(new THREE.SphereGeometry(0.16, 8, 6), white, -0.4, 1.7, 0.2, null, 0);
    } else if (d.id === 'crab') {
      add(new THREE.SphereGeometry(0.95, 14, 10), mat, 0, 0.75, 0).scale.set(1.3, 0.6, 1);
      for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.4, 10, 8), mat, s * 1.45, 0.95, 0.7).scale.set(1, 0.7, 1.3); eye(s * 0.35, 1.45, 0.45, 0.22); for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(0.8, 0.12, 0.12), mat, s * 1.1, 0.35, -0.4 + i * 0.4, null, 0.15); }
    } else if (d.id === 'rock') {
      add(new THREE.DodecahedronGeometry(1.35), mat, 0, 1.6, 0); add(new THREE.DodecahedronGeometry(0.65), mat, 0, 2.95, 0.1);
      const ey = new THREE.MeshBasicMaterial({ color: 0xffdd33 }); add(new THREE.SphereGeometry(0.16), ey, -0.25, 3.02, 0.62, null, 0); add(new THREE.SphereGeometry(0.16), ey, 0.25, 3.02, 0.62, null, 0);
      add(new THREE.BoxGeometry(0.75, 1.7, 0.75), mat, -1.7, 1.6, 0); add(new THREE.BoxGeometry(0.75, 1.7, 0.75), mat, 1.7, 1.6, 0);
    } else if (d.id === 'bat') {
      add(new THREE.SphereGeometry(0.5, 12, 10), mat, 0, 0, 0); eye(-0.18, 0.12, 0.38, 0.15); eye(0.18, 0.12, 0.38, 0.15);
      this.wings = []; for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 0.4, 0.1, 0); b.add(w); add(new THREE.BoxGeometry(1.5, 0.08, 0.9), M(0x7a3ad8), s * 0.75, 0, 0, w, 0.12); w.userData.s = s; this.wings.push(w); }
    } else if (d.id === 'spitter') {
      add(new THREE.CylinderGeometry(0.4, 0.65, 1.2, 10), mat, 0, 0.6, 0); const h = add(new THREE.SphereGeometry(0.85, 14, 10), mat, 0, 1.7, 0);
      add(new THREE.CylinderGeometry(0.4, 0.4, 0.15, 12), black, 0, 1.6, 0.8, null, 0).rotation.x = Math.PI / 2; eye(-0.35, 2.15, 0.55, 0.2); eye(0.35, 2.15, 0.55, 0.2);
      for (let i = 0; i < 5; i++) { const a = i * 1.257; add(new THREE.ConeGeometry(0.14, 0.5, 6), M(0xff8a2a), Math.cos(a) * 0.7, 2.4, Math.sin(a) * 0.7 - 0.1, null, 0.1); }
    } else {
      const lava = M(0x8a2a1a, { emissive: 0xff4a10, emissiveIntensity: 0.55 }), dark = M(0x3a1410);
      add(new THREE.DodecahedronGeometry(1.5), dark, 0, 1.9, 0); const core = add(new THREE.DodecahedronGeometry(0.75), lava, 0, 2.0, 0.85, null, 0.1);
      add(new THREE.DodecahedronGeometry(0.85), dark, 0, 3.6, 0.1);
      const ey = new THREE.MeshBasicMaterial({ color: 0xffdd33 }); add(new THREE.SphereGeometry(0.2), ey, -0.32, 3.7, 0.85, null, 0); add(new THREE.SphereGeometry(0.2), ey, 0.32, 3.7, 0.85, null, 0);
      for (const s of [-1, 1]) { add(new THREE.ConeGeometry(0.25, 1.1, 6), lava, s * 0.6, 4.4, 0, null, 0.1).rotation.z = -s * 0.4; this['fist' + (s > 0 ? 'R' : 'L')] = add(new THREE.DodecahedronGeometry(0.75), dark, s * 2.3, 1.6, 0.4); }
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff6a20, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); gl.scale.set(3.5, 3.5, 1); gl.position.set(0, 2.0, 1.1); b.add(gl);
    }
  }
  // Quanto mais fundo, mais ameaçadora: tom avermelhado, espinhos nas costas e aura pulsante
  addMenace() {
    const L = this.layerIdx, d = this.def, boss = !!d.boss; if (L < 1 && !boss) return; const k = boss ? 1 : Math.min(1, L / 5), H = (d.center || 1);
    this.mats[0].emissive.lerp(new THREE.Color(0xff1a2a), 0.2 + 0.55 * k);
    const spike = Toon.mat(0x1c0f22, { roughness: 0.5 }), n = 3 + Math.round(k * 7), sg = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.12 + 0.04 * k, 0.5 + Math.random() * 0.5 + 0.4 * k, 6), spike), u = n > 1 ? i / (n - 1) - 0.5 : 0;
      c.position.set(u * 1.5, H * 1.9 + 0.1 - Math.abs(u) * 0.5, -0.35); c.rotation.x = -0.6; c.rotation.z = -u * 0.8; sg.add(c);
    }
    mergeMeshes(sg); this.body.add(sg);
    this.aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff2a3a, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.2 }));
    this.aura.scale.set(3.4 + 1.2 * k, 3.4 + 1.2 * k, 1); this.aura.position.y = H * 1.1; this.mesh.add(this.aura); this.auraBase = 0.16 + 0.12 * k;
  }
  get eye() { return (this.def.center || 1) * this.size; }
  center(out) { const p = this.mesh.position; return out.set(p.x, p.y + (this.def.center || 1) * this.size, p.z); }
  get radius() { return (this.def.hitRadius || 1.3) * this.size; }
  onState(s) {
    if (s === 'ALERT') {
      if (!this.exS) { this.exS = new THREE.Sprite(new THREE.SpriteMaterial({ map: exTexture(), transparent: true, depthTest: false })); this.exS.scale.set(1.2, 1.2, 1); this.exS.position.y = (this.def.center || 1) * 1.7 + 1.6; this.mesh.add(this.exS); }
      this.exS.visible = true; this.m.growl(this); this.m.callAllies(this, 14);
    } else if (this.exS) this.exS.visible = false;
  }
  showRing(radius) {
    if (!this.ring) { this.ring = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 56), new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })); this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.3; this.mesh.add(this.ring); }
    this.ring.scale.setScalar(radius / this.size); this.ring.visible = true;
  }
  hideRing() { if (this.ring) this.ring.visible = false; }
  step(dx, dz) { const p = this.mesh.position; let nx = p.x + dx, nz = p.z + dz; const r = Math.hypot(nx, nz); if (r > 75) { nx *= 75 / r; nz *= 75 / r; } p.x = nx; p.z = nz; }
  face(angle, dt, rate = 7) { const m = this.mesh; m.rotation.y += Math.atan2(Math.sin(angle - m.rotation.y), Math.cos(angle - m.rotation.y)) * Math.min(1, dt * rate); }
  faceToward(P, dt) { const p = this.mesh.position; this.face(Math.atan2(P.x - p.x, P.z - p.z), dt, 8); }
  moveTo(x, z, speed, dt) {
    const p = this.mesh.position; let dx = x - p.x, dz = z - p.z; const l = Math.hypot(dx, dz); if (l < 0.01) return;
    dx /= l; dz /= l; const sep = this.m.separation(this); dx += sep.x * 0.8; dz += sep.z * 0.8; const l2 = Math.hypot(dx, dz) || 1; dx /= l2; dz /= l2;
    const s = Math.min(speed * dt, l); this.step(dx * s, dz * s); this.face(Math.atan2(dx, dz), dt, 6 + this.layerIdx); this.moving = true;
  }
  update(dt, g) {
    this.t += dt; this.hit -= dt;
    if (this.vel.lengthSq() > 0.01) { this.step(this.vel.x * dt, this.vel.z * dt); this.vel.multiplyScalar(Math.max(0, 1 - dt * 5)); }
    if (this.marked > 0) {
      this.marked -= dt;
      if (!this.markS) { this.markS = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff3355, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false })); this.markS.scale.set(1.4, 1.4, 1); this.markS.position.y = (this.def.center || 1) * 1.7 + 1.4; this.mesh.add(this.markS); }
      this.markS.visible = this.marked > 0;
    } else if (this.markS) this.markS.visible = false;
    this.moving = false; this.ai.tick(dt, g);
    const p = this.mesh.position; p.y = this.planet.heightAt(p.x, p.z) + (this.def.fly ? (2.6 + Math.sin(this.t * 3) * 0.7) * Math.max(1, this.size * 0.6) : 0);
    this.animate();
  }
  animate() {
    const d = this.def, st = this.ai.state, t = this.t, wind = st === 'ATTACK' && this.ai.phase === 'wind', run = this.moving ? 1 : 0.3, aggr = st === 'CHASE' || st === 'ATTACK';
    if (d.id === 'slime') this.body.scale.y = 0.85 + 0.15 * Math.sin(t * (6 + run * 6));
    else if (d.id === 'crab') this.body.rotation.z = Math.sin(t * (14 + run * 10)) * 0.05 * (1 + run);
    else if (d.id === 'bat') for (const w of this.wings) w.rotation.z = w.userData.s * Math.sin(t * (22 + (aggr ? 12 : 0))) * 0.7;
    else if (d.id === 'spitter') this.body.scale.y = 0.95 + 0.06 * Math.sin(t * 5);
    else if (d.boss) { this.body.position.y = Math.abs(Math.sin(t * 2)) * 0.25; this.fistL.position.y = 1.6 + Math.sin(t * 3) * 0.3 + (wind ? 1.2 : 0); this.fistR.position.y = 1.6 + Math.cos(t * 3) * 0.3 + (wind ? 1.2 : 0); }
    else this.body.position.y = Math.abs(Math.sin(t * 3)) * 0.2 * (0.5 + run);
    this.body.position.z = wind ? -0.3 : 0;
    this.mats[0].emissiveIntensity = this.hit > 0 ? 1.2 : wind ? 0.9 : 0.12;
    if (this.aura) this.aura.material.opacity = this.auraBase * (this.ai.aware ? 1.7 : 1) * (0.8 + 0.2 * Math.sin(t * 3));
    if (this.ring && this.ring.visible) this.ring.material.opacity = 0.35 + 0.3 * Math.sin(t * 30);
  }
  takeHit(dmg, from) {
    this.hp -= dmg; this.hit = 0.2; const dead = this.hp <= 0;
    if (!dead) {
      const p = this.mesh.position, dx = p.x - from.x, dz = p.z - from.z, l = Math.hypot(dx, dz) || 1, k = (this.def.boss ? 2 : 11) / Math.max(1, this.size * 0.8);
      this.vel.set(dx / l * k, 0, dz / l * k); this.ai.onHit(this.m.g);
    }
    return dead;
  }
};
let _ex = null;
function exTexture() {
  if (_ex) return _ex; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#ffd54a'; x.strokeStyle = '#1a0d2e'; x.lineWidth = 6; x.font = 'bold 52px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.strokeText('!', 32, 34); x.fillText('!', 32, 34);
  return (_ex = new THREE.CanvasTexture(c));
}
