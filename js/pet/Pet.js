import * as THREE from '../lib/three/build/three.module.js';
import { Tex } from '../core/Tex.js';
import { Toon } from '../core/Toon.js';
import { RARITY_ORDER, glowTexture } from '../mining/Resource.js';
// Bolt, o mascote robô: acompanha o jogador, evolui e ganha habilidades por nível.
export const PET_ABILITIES = [
  { lv: 1, icon: '🤖', name: 'Companheiro', desc: 'Segue você e reage às descobertas. Bônus de venda de +2% por nível.' },
  { lv: 2, icon: '⛏️', name: 'Auto-coleta', desc: 'Minera sozinho recursos comuns e incomuns por perto.' },
  { lv: 3, icon: '📡', name: 'Radar', desc: 'Marca sinais raros próximos a cada poucos segundos.' },
  { lv: 4, icon: '🎯', name: 'Marcação', desc: 'Marca a criatura mais próxima: ela recebe +15% de dano.' },
  { lv: 5, icon: '💎', name: 'Olho de joalheiro', desc: 'A auto-coleta passa a alcançar recursos raros.' },
  { lv: 6, icon: '🛡️', name: 'Escudo', desc: 'Absorve um golpe a cada 30 segundos.' },
  { lv: 8, icon: '⚡', name: 'Turbo', desc: 'A auto-coleta alcança recursos épicos, mais rápido e mais longe.' },
  { lv: 10, icon: '👑', name: 'Forma Ômega', desc: 'Evolução final dourada.' }
];
export const Pet = class {
  constructor(g) {
    this.g = g; this.mesh = new THREE.Group(); this.pos = new THREE.Vector3(); this.t = 0; this.state = 'follow'; this.timer = 6; this.task = null; this.mt = 0; this.radarT = 10; this.shieldCd = 0; this.bounce = 0; this.warn = 0; this.spark = 0; this.gt = 2;
    this.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 6), new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.beam.visible = false; g.scene.add(this.mesh, this.beam); this.build();
  }
  get data() { return this.g.state.pet; }
  get level() { return this.data.level; }
  get xpNeed() { return Math.floor(20 * Math.pow(this.level, 1.5)); }
  get sellBonus() { return this.level * 0.02; }
  get stage() { return this.level >= 10 ? 3 : this.level >= 7 ? 2 : this.level >= 4 ? 1 : 0; }
  get interval() { return Math.max(3.5, 10 - this.level * 0.6); }
  get maxRank() { return this.level >= 8 ? 3 : this.level >= 5 ? 2 : 1; }
  get reach() { return 10 + this.level * 1.5 + (this.level >= 8 ? 6 : 0); }
  addXP(n) {
    const d = this.data; if (d.level >= 10) return; d.xp += n;
    while (d.xp >= this.xpNeed && d.level < 10) {
      d.xp -= this.xpNeed; d.level++; this.g.audio.play('level'); this.g.ui.banner(`🤖 BOLT NÍVEL ${d.level}!`, '#6fd8ff');
      const ab = PET_ABILITIES.find(a => a.lv === d.level); if (ab) this.g.ui.toast(`🤖 Nova habilidade: ${ab.name}`, 'discover');
      this.build(); this.bounce = 1;
    }
    if (d.level >= 10) d.xp = 0;
  }
  build() {
    while (this.mesh.children.length) this.mesh.remove(this.mesh.children[0]);
    const st = this.stage, col = [0xc9d3e6, 0x6fd8ff, 0xc98aff, 0xffcf4a][st], eye = [0x35d0ff, 0x35ffb0, 0xff6ad5, 0xffe066][st], X = Tex, T = Toon, m = this.mesh;
    const add = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); m.add(o); return o; };
    add(new THREE.SphereGeometry(0.42, 22, 16), X.metalMat(col, { roughness: 0.28 }), 0, 0, 0);
    add(new THREE.SphereGeometry(0.3, 16, 12), T.mat(0x080a18, { roughness: 0.1, metalness: 0.6 }), 0, 0.04, 0.24).scale.set(1, 0.72, 0.6);
    for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.07, 8, 6), T.mat(eye, { emissive: eye, emissiveIntensity: 3 }), s * 0.11, 0.06, 0.4);
    add(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), X.metalMat(0x9aa3ae), 0, 0.55, 0);
    add(new THREE.SphereGeometry(0.07, 8, 6), T.mat(eye, { emissive: eye, emissiveIntensity: 3 }), 0, 0.78, 0);
    this.halo = st >= 1 ? add(new THREE.TorusGeometry(0.66, 0.03, 8, 40), T.mat(eye, { emissive: eye, emissiveIntensity: 2.5 }), 0, 0, 0) : null;
    if (this.halo) this.halo.rotation.x = Math.PI / 2.4;
    this.wings = [];
    if (st >= 2) for (const s of [-1, 1]) { const w = add(new THREE.BoxGeometry(0.8, 0.03, 0.34), X.metalMat(col, { roughness: 0.3 }), s * 0.62, 0.05, -0.1); w.userData.s = s; this.wings.push(w); }
    if (st >= 3) for (let i = 0; i < 5; i++) { const a = i * 1.2566; const c = add(new THREE.ConeGeometry(0.06, 0.2, 6), T.mat(0xffe066, { emissive: 0xffb000, emissiveIntensity: 1.5 }), Math.cos(a) * 0.22, 0.46, Math.sin(a) * 0.22); c.rotation.z = -Math.cos(a) * 0.3; c.rotation.x = Math.sin(a) * 0.3; }
    const jet = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: eye, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.8 })); jet.scale.set(1.1, 1.1, 1); jet.position.y = -0.45; m.add(jet); this.jet = jet;
    T.shadows(m);
  }
  reset() { this.pos.copy(this.g.player.pos); this.pos.y += 2.5; this.drop(); }
  valid() { return this.task && this.g.resources.list.includes(this.task); }
  drop() { if (this.task) this.task.claimed = false; this.task = null; this.state = 'follow'; this.timer = 2; this.beam.visible = false; }
  absorb() {
    if (this.level < 6 || this.shieldCd > 0) return false;
    this.shieldCd = 30; this.g.ui.toast('🛡️ Escudo do Bolt bloqueou o golpe!', 'discover');
    const p = this.g.player.pos; this.g.particles.burst(new THREE.Vector3(p.x, p.y + 1.2, p.z), 0x6fd8ff, 24, 6); return true;
  }
  cheer() { this.bounce = 0.7; }
  aim(to) { const d = this.pos.distanceTo(to); this.beam.visible = true; this.beam.position.copy(this.pos).add(to).multiplyScalar(0.5); this.beam.lookAt(to); this.beam.rotateX(Math.PI / 2); this.beam.scale.set(1, d, 1); }
  update(dt, t) {
    const g = this.g, P = g.player; this.t += dt; this.shieldCd = Math.max(0, this.shieldCd - dt); this.bounce = Math.max(0, this.bounce - dt);
    let tx, ty, tz;
    if (this.state !== 'follow' && this.task) { const m = this.task.mesh.position; tx = m.x; tz = m.z; ty = m.y + 2.6; }
    else { const c = Math.cos(P.yaw), s = Math.sin(P.yaw); tx = P.pos.x + 1.9 * c - 1.6 * s; tz = P.pos.z - 1.9 * s - 1.6 * c; ty = P.pos.y + 2.9 + Math.sin(this.t * 2.2) * 0.25; }
    const k = Math.min(1, dt * (this.state === 'go' ? 5 : 3.5)); this.pos.x += (tx - this.pos.x) * k; this.pos.y += (ty - this.pos.y) * k; this.pos.z += (tz - this.pos.z) * k;
    this.mesh.position.copy(this.pos); this.mesh.position.y += this.bounce > 0 ? Math.abs(Math.sin(this.bounce * 9)) * 0.5 : 0;
    this.mesh.rotation.y += ((this.state === 'follow' ? P.yaw : Math.atan2(tx - this.pos.x, tz - this.pos.z)) - this.mesh.rotation.y) * Math.min(1, dt * 6);
    if (this.halo) this.halo.rotation.z += dt * 2;
    for (const w of this.wings) w.rotation.z = w.userData.s * Math.sin(this.t * 14) * 0.35;
    this.jet.material.opacity = 0.6 + 0.25 * Math.sin(this.t * 20);
    if (!g.canPlay()) { this.beam.visible = false; return; }
    if (this.state === 'follow') {
      this.timer -= dt;
      if (this.level >= 2 && this.timer <= 0) {
        const r = g.resources.find(P.pos, this.reach, r => r.minable && !r.claimed && r !== g.mining.target && RARITY_ORDER.indexOf(r.def.rarity) <= this.maxRank);
        if (r) { r.claimed = true; this.task = r; this.state = 'go'; } else this.timer = 2;
      }
    } else if (this.state === 'go') {
      if (!this.valid()) { this.drop(); return; }
      if (Math.hypot(this.pos.x - tx, this.pos.z - tz) < 1.5 && Math.abs(this.pos.y - ty) < 1.5) { this.state = 'mine'; this.mt = Math.max(0.8, 1.9 - this.level * 0.09); }
    } else if (this.state === 'mine') {
      if (!this.valid()) { this.drop(); return; }
      const tp = this.task.mesh.position, to = new THREE.Vector3(tp.x, tp.y + 0.8, tp.z); this.aim(to); this.mt -= dt;
      this.spark -= dt; if (this.spark <= 0) { this.spark = 0.15; g.particles.burst(to, this.task.def.color, 3, 3); }
      if (this.mt <= 0) this.collect(this.task);
    }
    if (this.level >= 4) {
      this.gt -= dt;
      if (this.gt <= 0) {
        this.gt = 6; let e = null, bd = 22 * 22; for (const n of g.enemies.list) { const dx = n.mesh.position.x - P.pos.x, dz = n.mesh.position.z - P.pos.z, d = dx * dx + dz * dz; if (d < bd) { bd = d; e = n; } }
        if (e) { e.marked = 6; this.cheer(); }
      }
    }
    if (this.level >= 3) {
      this.radarT -= dt;
      if (this.radarT <= 0) {
        this.radarT = 18; let n = 0;
        for (const r of g.resources.list) if (RARITY_ORDER.indexOf(r.def.rarity) >= 2 && !(r.ping > 0) && Math.hypot(r.mesh.position.x - P.pos.x, r.mesh.position.z - P.pos.z) < 30 + this.level * 3) { r.ping = 14; n++; }
        if (n) { g.ui.toast(`🤖 Bolt detectou ${n} sinal${n > 1 ? 'is' : ''} raro${n > 1 ? 's' : ''}`, 'discover'); this.cheer(); }
      }
    }
  }
  collect(r) {
    const g = this.g, d = r.def;
    if (!g.inventory.add(d.id, 1)) { if (performance.now() > this.warn) { this.warn = performance.now() + 4000; g.ui.toast('🤖 Bolt: a mochila está cheia!', 'warn'); } this.drop(); this.timer = 6; return; }
    const p = r.mesh.position.clone(); p.y += 1; g.particles.burst(p, d.color, 14, 5); g.resources.take(r);
    g.mining.award(d, 1); g.state.stats.petFinds++; this.cheer(); g.audio.play('collect'); this.task = null; this.drop(); this.timer = this.interval;
  }
};
