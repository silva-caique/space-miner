// Preenchido a partir de config/upgrades.json
export const UPGRADES = {};
export const UpgradeSystem = class {
  constructor(g) { this.g = g; }
  level(id) { return this.g.state.upgrades[id] || 0; }
  value(id) { return UPGRADES[id].levels[this.level(id)][1]; }
  check(id) {
    const def = UPGRADES[id], lv = this.level(id), nx = def.levels[lv + 1];
    if (!nx) return { ok: false, msg: 'Nível máximo' };
    if (this.g.state.level < lv + 1) return { ok: false, msg: `Requer Nível ${lv + 1}` };
    if (this.g.state.credits < nx[2]) return { ok: false, msg: 'Créditos insuficientes' };
    return { ok: true, msg: '' };
  }
  buy(id) {
    const c = this.check(id); if (!c.ok) return c;
    const s = this.g.state, nx = UPGRADES[id].levels[this.level(id) + 1];
    s.credits -= nx[2]; s.upgrades[id]++; s.stats.bought++;
    this.g.stats.hp = this.g.stats.maxHp; this.g.stats.energy = Math.max(this.g.stats.energy, 0);
    this.g.missions.notify('upgrade', 0, 1);
    return { ok: true, msg: `${nx[0]} instalado!` };
  }
};
