import * as THREE from '../lib/three/build/three.module.js';
// Scanner (tecla Q): onda de sonar que revela minérios enterrados, baús e sinais raros.
export const Scanner = class {
  constructor(g) { this.g = g; this.cd = 0; this.waves = []; }
  get lvl() { return this.g.upgrades.level('scanner'); }
  get range() { return this.g.upgrades.value('scanner'); }
  get cooldown() { return Math.max(5, 14 - this.lvl * 1.5); }
  get duration() { return 20 + this.lvl * 4; }
  use() {
    const g = this.g; if (!g.canPlay()) return;
    if (this.cd > 0) { g.ui.toast(`📡 Scanner recarregando (${Math.ceil(this.cd)}s)`, 'warn'); return; }
    if (g.stats.energy < 15) { g.ui.toast('⚡ O scanner precisa de 15 de energia.', 'warn'); return; }
    g.stats.energy -= 15; this.cd = this.cooldown; g.state.stats.scans++;
    const n = this.ping(g.player.pos, this.range, this.duration); this.wave(g.player.pos, this.range);
    g.audio.play('scan'); g.ui.toast(n ? `📡 ${n} sinais detectados` : '📡 Nenhum sinal por perto', n ? 'discover' : '');
  }
  ping(pos, range, dur) {
    const g = this.g; let n = 0; const inR = m => Math.hypot(m.x - pos.x, m.z - pos.z) <= range;
    for (const r of g.resources.list) if (inR(r.mesh.position)) { r.ping = dur; n++; }
    for (const c of g.chests.list) if (!c.opened && inR(c.group.position)) { c.ping = dur; n++; }
    return n;
  }
  wave(pos, range) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.965, 1, 72), new THREE.MeshBasicMaterial({ color: 0x7fefff, transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthTest: false, depthWrite: false, fog: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(pos.x, pos.y + 0.6, pos.z); m.renderOrder = 20; this.g.world.add(m); this.waves.push({ m, t: 0, range });
  }
  update(dt) {
    this.cd = Math.max(0, this.cd - dt);
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i]; w.t += dt; const s = w.t / 1.4;
      if (s >= 1) { if (w.m.parent) w.m.parent.remove(w.m); this.waves.splice(i, 1); continue; }
      w.m.scale.setScalar(Math.max(0.01, w.range * s)); w.m.material.opacity = 0.9 * (1 - s);
    }
  }
};
