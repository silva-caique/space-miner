import * as THREE from '../lib/three/build/three.module.js';
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
// Estados: IDLE, PATROL, ALERT, CHASE, ATTACK, HURT, RETREAT, DEAD
export class EnemyAI {
  constructor(e) {
    this.e = e; this.state = 'IDLE'; this.t = 1 + Math.random() * 2; this.thinkT = Math.random() * 0.2; this.seen = false; this.lost = 0; this.last = new THREE.Vector3(); this.wp = new THREE.Vector3();
    this.cool = 0; this.specialCd = 2 + Math.random() * 3; this.provoked = false; this.atk = null; this.phase = ''; this.retreatMode = 'home'; this.dashDir = new THREE.Vector3(); this.dashT = 0; this.dashMul = 1; this.dashHit = false; this.fled = false;
  }
  get aware() { return this.state === 'ALERT' || this.state === 'CHASE' || this.state === 'ATTACK' || this.state === 'HURT' || (this.state === 'RETREAT' && this.retreatMode !== 'home'); }
  get hostile() { return this.e.hostile || this.provoked; }
  set(state, t = 0) { this.state = state; this.t = t; this.phase = ''; this.e.onState(state); }
  // ---- percepção: distância, direção (cone de visão), ruído e linha de visão contra o terreno
  perceive(g, dist) {
    const e = this.e, p = e.mesh.position, P = g.player.pos; let range = e.detect * g.enemies.noise;
    if (this.aware) range *= 1.6;
    if (dist > range) return false;
    if (!this.aware && dist > range * 0.35 && (e.def.fov || 140) < 359 && g.combat.recent < 2.0) {
      const a = wrap(Math.atan2(P.x - p.x, P.z - p.z) - e.mesh.rotation.y); if (Math.abs(a) > ((e.def.fov || 140) * Math.PI / 360)) return false;
    }
    return this.hasLOS(g, p, P, dist, e.eye);
  }
  hasLOS(g, a, b, dist, eye) {
    const n = Math.max(1, Math.ceil(dist / 2.5));
    for (let i = 1; i < n; i++) { const t = i / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, y = (a.y + eye) + ((b.y + 1.4) - (a.y + eye)) * t; if (y < g.planet.heightAt(x, z) + 0.2) return false; }
    return true;
  }
  tick(dt, g) {
    const e = this.e, p = e.mesh.position, P = g.player.pos; this.cool -= dt; this.specialCd -= dt; this.t -= dt; this.thinkT -= dt;
    const dist = Math.hypot(P.x - p.x, P.z - p.z);
    if (this.thinkT <= 0) { this.thinkT = 0.12 + Math.random() * 0.1; this.seen = this.perceive(g, dist); if (this.seen) { this.last.set(P.x, P.y, P.z); this.lost = 0; } }
    if (!this.seen) this.lost += dt;
    switch (this.state) {
      case 'IDLE': this.idle(dt, g); break; case 'PATROL': this.patrol(dt, g); break; case 'ALERT': this.alert(dt, g); break; case 'CHASE': this.chase(dt, g, dist); break;
      case 'ATTACK': this.attack(dt, g, dist); break; case 'HURT': this.hurt(dt, g); break; case 'RETREAT': this.retreatTick(dt, g, dist); break;
    }
  }
  idle(dt, g) {
    const e = this.e; e.mesh.rotation.y += Math.sin(e.t * 0.7 + e.seed) * 0.6 * dt;
    if (this.seen && this.hostile) return this.set('ALERT', e.alertT + Math.random() * 0.15);
    if (this.t <= 0) { const a = Math.random() * 6.283, r = 4 + Math.random() * 9; this.wp.set(e.home.x + Math.cos(a) * r, 0, e.home.z + Math.sin(a) * r); this.set('PATROL', 3 + Math.random() * 4); }
  }
  patrol(dt, g) {
    const e = this.e, p = e.mesh.position;
    if (this.seen && this.hostile) return this.set('ALERT', e.alertT + Math.random() * 0.15);
    if (Math.hypot(this.wp.x - p.x, this.wp.z - p.z) < 1.2 || this.t <= 0) return this.set('IDLE', 1.5 + Math.random() * 2);
    e.moveTo(this.wp.x, this.wp.z, e.speed * 0.4, dt);
  }
  alert(dt, g) {
    const e = this.e; e.faceToward(g.player.pos, dt * 1.6);
    if (this.t <= 0) { if (this.seen || this.lost < 1.5) this.set('CHASE', 0); else this.set('PATROL', 3); }
  }
  chase(dt, g, dist) {
    const e = this.e, p = e.mesh.position, P = g.player.pos, role = e.def.role || 'melee', tx = this.seen ? P.x : this.last.x, tz = this.seen ? P.z : this.last.z;
    if ((!this.seen && this.lost > e.memory) || Math.hypot(p.x - e.home.x, p.z - e.home.z) > 75) return this.retreat('home');
    if (role === 'ranged') {
      if (this.seen && dist < 9) return this.retreat('reposition', 1.2);
      if (this.seen && dist <= e.reach) { e.faceToward(P, dt); if (this.cool <= 0) this.startAttack('shoot'); return; }
      e.moveTo(tx, tz, e.speed, dt); return;
    }
    if (this.seen) {
      const sp = e.special;
      if (sp && this.specialCd <= 0) { if (sp.type === 'lunge' && dist > 5 && dist < 12) return this.startAttack('lunge'); if (sp.type === 'slam' && dist < sp.radius * 0.95) return this.startAttack('slam'); }
      if (role === 'swooper' && dist < 9 && this.cool <= 0) return this.startAttack('dive');
      if (role !== 'swooper' && dist <= e.reach && this.cool <= 0 && Math.abs(P.y - p.y) < 4) return this.startAttack('melee');
    }
    const d = this.seen ? dist : Math.hypot(this.last.x - p.x, this.last.z - p.z);
    if (d > e.reach * 0.8) e.moveTo(tx, tz, e.speed, dt); else e.faceToward(P, dt);
  }
  startAttack(kind) {
    const e = this.e, sp = e.special; let w = Math.max(0.16, (e.def.windup || 0.4) - 0.03 * e.layerIdx);
    if (kind === 'lunge') w = 0.5; else if (kind === 'shoot') w = 0.35; else if (kind === 'dive') w = 0.22; else if (kind === 'slam') { w = sp.windup || 0.9; e.showRing(sp.radius); }
    this.set('ATTACK', w); this.atk = kind; this.phase = 'wind'; this.dashHit = false; e.m.growl(e);
  }
  attack(dt, g) {
    const e = this.e, p = e.mesh.position, P = g.player.pos, kind = this.atk;
    if (this.phase === 'wind') { if (kind !== 'slam') e.faceToward(P, dt * 2); if (this.t <= 0) this.strike(g, kind); return; }
    if (this.phase === 'dash') {
      e.step(this.dashDir.x * e.speed * this.dashMul * dt, this.dashDir.z * e.speed * this.dashMul * dt); e.moving = true;
      if (!this.dashHit && Math.hypot(P.x - p.x, P.z - p.z) <= e.reach * 1.1 + 0.6) { this.dashHit = true; e.m.hitPlayer(e, e.damage * (kind === 'lunge' ? 1.3 : 1)); }
      this.dashT -= dt; if (this.dashT <= 0) this.endAttack(); return;
    }
    if (this.t <= 0) this.endAttack();
  }
  strike(g, kind) {
    const e = this.e, p = e.mesh.position, P = g.player.pos, m = e.m, d = Math.hypot(P.x - p.x, P.z - p.z);
    if (kind === 'melee') { if (d <= e.reach * 1.35 && Math.abs(P.y - p.y) < 4) m.hitPlayer(e, e.damage); this.cool = e.attackRate; this.recover(0.25); }
    else if (kind === 'lunge' || kind === 'dive') { const l = d || 1; this.dashDir.set((P.x - p.x) / l, 0, (P.z - p.z) / l); this.dashMul = kind === 'lunge' ? 2.6 : 2.2; this.dashT = 0.36; this.phase = 'dash'; this.cool = e.attackRate + 0.4; if (kind === 'lunge') this.specialCd = e.special.cooldown; }
    else if (kind === 'shoot') { const burst = e.special && e.special.type === 'burst' && this.specialCd <= 0 ? 3 : 1; for (let i = 0; i < burst; i++) m.fireAt(e, (i - (burst - 1) / 2) * 0.16); if (burst > 1) this.specialCd = e.special.cooldown; this.cool = e.attackRate * 1.6; this.recover(0.3); }
    else if (kind === 'slam') { m.slam(e, e.special); this.specialCd = e.special.cooldown; this.cool = e.attackRate; this.recover(0.4); e.hideRing(); }
  }
  recover(t) { this.phase = 'recover'; this.t = t; }
  endAttack() { if (this.atk === 'dive') this.retreat('reposition', 1.1 + Math.random() * 0.5); else this.set('CHASE', 0); }
  hurt(dt) { if (this.t <= 0) this.set('CHASE', 0); }
  retreat(mode, dur = 0) { this.retreatMode = mode; this.set('RETREAT', dur); }
  retreatTick(dt, g, dist) {
    const e = this.e, p = e.mesh.position, P = g.player.pos;
    if (this.retreatMode === 'home') {
      if (this.seen && this.hostile && dist < e.detect * 0.9) return this.set('ALERT', e.alertT);
      e.moveTo(e.home.x, e.home.z, e.speed * 0.7, dt); if (Math.hypot(p.x - e.home.x, p.z - e.home.z) < 3) this.set('IDLE', 2); return;
    }
    const ax = p.x - P.x, az = p.z - P.z, l = Math.hypot(ax, az) || 1;
    e.moveTo(p.x + ax / l * 10, p.z + az / l * 10, e.speed * (this.retreatMode === 'flee' ? 1 : 0.9), dt);
    if (this.t <= 0) this.set('CHASE', 0);
  }
  // Chamado quando o inimigo leva dano
  onHit(g) {
    const e = this.e; this.provoked = true; this.last.copy(g.player.pos); this.lost = 0;
    if (this.state === 'ATTACK' && e.size >= 1.5) return; // criaturas grandes não se desestabilizam durante o golpe
    if (e.def.poise) { if (!this.aware) this.set('CHASE', 0); return; }
    if (e.def.flee && !this.fled && e.hp / e.maxHp < 0.25) { this.fled = true; this.retreat('flee', 3); return; }
    this.set('HURT', 0.18 / Math.sqrt(Math.max(1, e.size)));
  }
}
