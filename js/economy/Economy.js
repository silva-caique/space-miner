import { RESOURCES } from '../mining/Resource.js';
export const Economy = class {
  constructor(g) { this.g = g; }
  lines() {
    return Object.keys(this.g.state.inventory).filter(k => this.g.state.inventory[k] > 0 && RESOURCES[k])
      .map(k => { const d = RESOURCES[k], q = this.g.state.inventory[k]; return { def: d, qty: q, unit: d.value, total: d.value * q }; })
      .sort((a, b) => b.unit - a.unit);
  }
  breakdown(mult = 1) {
    const base = Math.round(this.lines().reduce((a, l) => a + l.total, 0) * mult), combo = base > 0 ? Math.round(this.g.state.comboBonus || 0) : 0, pet = Math.round((base + combo) * this.g.pet.sellBonus);
    return { base, combo, pet, total: base + combo + pet };
  }
  total() { return this.breakdown().total; }
  sellAll(mult = 1) {
    const b = this.breakdown(mult); if (b.base <= 0) return 0;
    const s = this.g.state; s.credits += b.total; s.stats.earned += b.total; s.comboBonus = 0;
    this.g.inventory.clear(); this.g.missions.notify('earn', 0, b.total);
    return b.total;
  }
};
