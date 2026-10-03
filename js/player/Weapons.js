// Sistema de defesa: blaster com mira automática (X, segure), escudo de energia (V) e esquiva (Z).
SM.Weapons = class {
  constructor(g) {
    this.g = g; this.bolts = []; this.cd = 0; this.aim = null; this.shieldT = 0; this.shieldCd = 0; this.dashT = 0; this.dashCd = 0; this.iframes = 0; this.flash = 0; this.warn = 0; this.t = 0;
    this.dashDir = new THREE.Vector3(); this.geo = new THREE.SphereGeometry(0.26, 10, 8);
    const M = c => SM.Toon.mat(c, { emissive: c, emissiveIntensity: 4 });
    this.mats = { cyan: M(0x7fefff), gold: M(0xffd54a), crit: M(0xff9a3a) };
    this.bubble = new THREE.Mesh(new THREE.SphereGeometry(2.3, 28, 20), new THREE.MeshBasicMaterial({ color: 0x5fe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    this.bubble.visible = false; g.scene.add(this.bubble);
  }
  get dmg() { return this.g.upgrades.value('blaster'); }
  get rate() { return Math.max(0.14, 0.3 - this.g.upgrades.level('blaster') * 0.03); }
  get shieldDur() { return this.g.upgrades.value('shield'); }
  note(msg) { const n = performance.now(); if (n > this.warn) { this.warn = n + 2000; this.g.ui.toast(msg, 'warn'); } }
  aimPoint(e) { const p = e.mesh.position; return new THREE.Vector3(p.x, p.y + (e.def.boss ? 3 : e.def.fly ? 0.2 : 1.1), p.z); }
  target() {
    const P = this.g.player.pos; let best = null, bd = 900;
    for (const e of this.g.enemies.list) { const dx = e.mesh.position.x - P.x, dz = e.mesh.position.z - P.z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = e; } }
    return best;
  }
  spawn(from, to, dmg, kind) {
    const m = new THREE.Mesh(this.geo, this.mats[kind] || this.mats.cyan); m.position.copy(from); this.g.scene.add(m);
    this.bolts.push({ m, v: to.clone().sub(from).normalize().multiplyScalar(38), life: 1.1, dmg, kind });
  }
  fire(e) {
    const g = this.g, P = g.player, from = P.tip();
    const to = e ? this.aimPoint(e) : new THREE.Vector3(from.x + Math.sin(P.yaw) * 20, from.y, from.z + Math.cos(P.yaw) * 20);
    g.stats.energy -= 1.5; this.cd = this.rate; g.state.stats.shots++;
    const crit = Math.random() < 0.12; this.spawn(from, to, this.dmg * (crit ? 2 : 1), crit ? 'crit' : 'cyan');
    g.audio.play('shot'); g.particles.burst(from, crit ? 0xff9a3a : 0x7fefff, 3, 3);
  }
  shield() {
    const g = this.g; if (!g.canPlay() || this.shieldT > 0) return;
    if (this.shieldCd > 0) { this.note(`🛡️ Escudo recarregando (${Math.ceil(this.shieldCd)}s)`); return; }
    if (g.stats.energy < 20) { this.note('⚡ O escudo precisa de 20 de energia.'); return; }
    g.stats.energy -= 20; this.shieldT = this.shieldDur; this.shieldCd = this.shieldDur + 9; g.audio.play('shield');
    const p = g.player.pos; g.particles.burst(new THREE.Vector3(p.x, p.y + 1.4, p.z), 0x5fe8ff, 26, 7);
  }
  dash() {
    const g = this.g; if (!g.canPlay() || this.dashCd > 0) return;
    if (g.stats.energy < 8) { this.note('⚡ A esquiva precisa de 8 de energia.'); return; }
    g.stats.energy -= 8; this.dashCd = 3; this.dashT = 0.22; this.iframes = 0.4;
    const d = g.controller.inDir, yaw = g.player.yaw;
    if (d) this.dashDir.set(d[0], 0, d[1]); else this.dashDir.set(Math.sin(yaw), 0, Math.cos(yaw));
    g.audio.play('dash');
  }
  // Chamado por PlayerStats.hurt: devolve true se o golpe foi bloqueado
  block() {
    const g = this.g, P = g.player.pos;
    if (this.iframes > 0) { g.state.stats.blocks++; return true; }
    if (this.shieldT > 0) { this.flash = 1; g.state.stats.blocks++; g.audio.play('shield'); g.particles.burst(new THREE.Vector3(P.x, P.y + 1.6, P.z), 0x5fe8ff, 10, 6); return true; }
    return false;
  }
  update(dt) {
    const g = this.g, P = g.player.pos; this.t += dt; this.cd -= dt; this.iframes -= dt; this.aim = null;
    this.shieldCd = Math.max(0, this.shieldCd - dt); this.dashCd = Math.max(0, this.dashCd - dt); this.flash = Math.max(0, this.flash - dt * 3);
    if (this.dashT > 0) { this.dashT -= dt; g.particles.burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0x9fe8ff, 2, 2); }
    if (g.controller.keys.KeyX) {
      const e = this.target(); if (e) this.aim = Math.atan2(e.mesh.position.x - P.x, e.mesh.position.z - P.z);
      if (this.cd <= 0) { if (g.stats.energy >= 1.5) this.fire(e); else this.note('⚡ Sem energia para atirar.'); }
    }
    if (this.shieldT > 0) {
      this.shieldT -= dt; this.bubble.visible = true; this.bubble.position.set(P.x, P.y + 1.6, P.z);
      const low = this.shieldT < 1 ? (Math.sin(this.t * 30) > 0 ? 0.4 : 1) : 1;
      this.bubble.material.opacity = (0.14 + 0.05 * Math.sin(this.t * 8) + this.flash * 0.5) * low; this.bubble.rotation.y += dt;
      if (this.shieldT <= 0) g.ui.toast('🛡️ Escudo desligado', '');
    } else this.bubble.visible = false;
    const steps = Math.max(1, Math.ceil(dt * 38 / 0.7)), h = dt / steps;
    for (let s = 0; s < steps; s++) this.moveBolts(h);
    for (const b of this.bolts) b.life -= dt;
    for (let i = this.bolts.length - 1; i >= 0; i--) if (this.bolts[i].life <= 0) this.drop(i);
  }
  drop(i) { const b = this.bolts[i]; this.g.scene.remove(b.m); this.bolts.splice(i, 1); }
  moveBolts(dt) {
    const g = this.g;
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i], p = b.m.position; p.addScaledVector(b.v, dt);
      if (p.y < g.planet.heightAt(p.x, p.z)) { g.particles.burst(p, 0x7fefff, 4, 3); this.drop(i); continue; }
      for (const e of g.enemies.list) {
        if (p.distanceTo(this.aimPoint(e)) < (e.def.boss ? 3.4 : e.def.id === 'rock' ? 1.9 : 1.5)) {
          if (b.kind !== 'gold') g.state.stats.hits++;
          g.particles.burst(p, b.kind === 'crit' ? 0xff9a3a : 0xffffff, b.kind === 'crit' ? 14 : 6, 5); g.audio.play('hit');
          g.enemies.damage(e, b.dmg, p); this.drop(i); break;
        }
      }
    }
  }
  clear() { for (const b of this.bolts) this.g.scene.remove(b.m); this.bolts = []; this.shieldT = 0; this.dashT = 0; this.iframes = 0; this.bubble.visible = false; }
};
