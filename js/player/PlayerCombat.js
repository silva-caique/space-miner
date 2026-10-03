import * as THREE from '../lib/three/build/three.module.js';
// Defesa do jogador: escudo de energia (V) e esquiva com invulnerabilidade (Z). O ataque fica em combat/CombatManager.
export const PlayerCombat = class {
  constructor(g) {
    this.g = g; this.shieldT = 0; this.shieldCd = 0; this.dashT = 0; this.dashCd = 0; this.iframes = 0; this.flash = 0; this.warn = 0; this.t = 0; this.dashDir = new THREE.Vector3();
    this.bubble = new THREE.Mesh(new THREE.SphereGeometry(2.3, 28, 20), new THREE.MeshBasicMaterial({ color: 0x5fe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    this.bubble.visible = false; g.scene.add(this.bubble);
  }
  get shieldDur() { return this.g.upgrades.value('shield'); }
  note(msg) { const n = performance.now(); if (n > this.warn) { this.warn = n + 2000; this.g.ui.toast(msg, 'warn'); } }
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
    const g = this.g, P = g.player.pos; this.t += dt; this.iframes -= dt;
    this.shieldCd = Math.max(0, this.shieldCd - dt); this.dashCd = Math.max(0, this.dashCd - dt); this.flash = Math.max(0, this.flash - dt * 3);
    if (this.dashT > 0) { this.dashT -= dt; g.particles.burst(new THREE.Vector3(P.x, P.y + 1, P.z), 0x9fe8ff, 2, 2); }
    if (this.shieldT > 0) {
      this.shieldT -= dt; this.bubble.visible = true; this.bubble.position.set(P.x, P.y + 1.6, P.z);
      const low = this.shieldT < 1 ? (Math.sin(this.t * 30) > 0 ? 0.4 : 1) : 1;
      this.bubble.material.opacity = (0.14 + 0.05 * Math.sin(this.t * 8) + this.flash * 0.5) * low; this.bubble.rotation.y += dt;
      if (this.shieldT <= 0) g.ui.toast('🛡️ Escudo desligado', '');
    } else this.bubble.visible = false;
  }
  clear() { this.shieldT = 0; this.dashT = 0; this.iframes = 0; this.bubble.visible = false; }
};
