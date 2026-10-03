import * as THREE from '../lib/three/build/three.module.js';
import { RARITY, RARITY_ORDER } from './Resource.js';
export const MiningSystem = class {
  constructor(g) { this.g = g; this.target = null; this.tick = 0; this.warnAt = 0; }
  notice(msg) { const n = performance.now(); if (n > this.warnAt) { this.warnAt = n + 2500; this.g.ui.toast(msg, 'warn'); } }
  update(dt) {
    const g = this.g, P = g.player, st = g.stats;
    P.mining = false; let tgt = null;
    if (g.controller.mining) tgt = g.resources.nearest(P.pos, 5);
    if (this.target && this.target !== tgt) this.target.progress = this.target.progress; // progresso parcial é mantido
    this.target = tgt;
    if (!tgt) { P.setBeam(null); g.hud.mineProgress(0); return; }
    P.target = tgt.mesh.position;
    if (g.inventory.free <= 0) { this.notice('🎒 Mochila cheia! Volte à nave para vender.'); P.setBeam(null); g.hud.mineProgress(0); return; }
    if (st.energy <= 0.01) { this.notice('⚡ Sem energia! Volte à nave.'); P.setBeam(null); g.hud.mineProgress(0); return; }
    const def = tgt.def; P.mining = true; if (tgt.hidden && tgt.progress > 0) tgt.hidden = false;
    st.energy = Math.max(0, st.energy - 4 * dt);
    tgt.progress += dt * st.drillSpeed / def.hardness;
    const tp = new THREE.Vector3(tgt.mesh.position.x, tgt.mesh.position.y + 0.9, tgt.mesh.position.z);
    P.setBeam(tp);
    this.tick -= dt;
    if (this.tick <= 0) { this.tick = 0.12; g.particles.burst(tp, def.color, 4, 4); g.audio.play('mine'); }
    g.hud.mineProgress(Math.min(1, tgt.progress), def);
    if (tgt.progress >= 1) this.collect(tgt);
  }
  // Efeitos compartilhados de qualquer coleta (jogador ou mascote)
  award(d, m = 1) {
    const g = this.g, rank = RARITY_ORDER.indexOf(d.rarity);
    g.state.stats.collected++; if (rank >= 4) g.state.stats.top++;
    if (g.codex.discoverMineral(d.id)) { g.ui.toast(`📖 Nova descoberta: ${d.name}!`, 'discover'); g.audio.play('discover'); }
    g.stats.addXP(Math.round(d.xp * m)); g.pet.addXP(rank + 1); g.missions.notify('collect', d.id, 1);
  }
  collect(r) {
    const g = this.g, d = r.def, rar = RARITY[d.rarity], rank = RARITY_ORDER.indexOf(d.rarity);
    if (!g.inventory.add(d.id, 1)) return;
    const p = r.mesh.position.clone(); p.y += 1;
    g.particles.burst(p, rar.color, 12 + rank * 12, 5 + rank);
    g.resources.take(r); this.target = null; g.player.setBeam(null); g.hud.mineProgress(0);
    const m = g.combo.hit(); g.state.comboBonus += Math.round(d.value * (m - 1));
    g.ui.toast(`+1 ${d.name}${m > 1 ? ` · x${m}` : ''}`, d.rarity);
    g.audio.play('collect');
    if (rank >= 2) g.pet.cheer();
    if (rank >= 4) { g.ui.banner(`✨ ${rar.name.toUpperCase()}! ${d.name}`, rar.css); g.audio.play('legend'); g.shake = 0.6; g.crazy.happytime(); }
    this.award(d, m); g.save();
  }
};
