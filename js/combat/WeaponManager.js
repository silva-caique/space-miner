import { Weapon } from './Weapon.js';
// Preenchidos por core/Config.js a partir de config/weapons.json
export const WEAPONS = [];
export const CRIT = { chance: 0.1, mult: 2 };
export class WeaponManager {
  constructor(g) { this.g = g; this.map = {}; this.version = 0; for (const def of WEAPONS) this.map[def.id] = new Weapon(def); this.sync(); }
  get data() { return this.g.state.weapons; }
  get list() { return WEAPONS; }
  get current() { return this.map[this.data.current] || this.map[WEAPONS[0].id]; }
  sync() { for (const id in this.map) this.map[id].level = this.data.levels[id] || 1; this.version++; }
  owns(id) { return this.data.owned.includes(id); }
  level(id) { return this.data.levels[id] || 1; }
  select(id) { if (!this.owns(id) || this.data.current === id) return false; this.data.current = id; this.version++; this.g.audio.play('click'); return true; }
  selectSlot(i) {
    const d = WEAPONS[i]; if (!d) return;
    if (!this.owns(d.id)) { this.g.ui.toast(`🔒 ${d.name} ainda não foi adquirida (compre na nave).`, 'warn'); return; }
    if (this.select(d.id)) this.g.ui.toast(`${d.icon} ${d.name}`, '');
  }
  checkBuy(id) {
    const d = this.map[id].def, s = this.g.state;
    if (this.owns(id)) return { ok: false, msg: 'Já adquirida' };
    if (s.level < d.requires.level) return { ok: false, msg: `Requer Nível ${d.requires.level}` };
    if (s.stats.maxDepth < d.requires.depth) return { ok: false, msg: `Alcance a camada ${d.requires.depth}` };
    if (s.credits < d.price) return { ok: false, msg: 'Créditos insuficientes' };
    return { ok: true, msg: '' };
  }
  buy(id) {
    const c = this.checkBuy(id); if (!c.ok) return c; const d = this.map[id].def, s = this.g.state;
    s.credits -= d.price; this.data.owned.push(id); this.data.levels[id] = 1; this.data.current = id; this.sync(); return { ok: true, msg: `${d.name} adquirida!` };
  }
  checkUpgrade(id) {
    const d = this.map[id].def, s = this.g.state, lv = this.level(id), nx = d.levels[lv];
    if (!this.owns(id)) return { ok: false, msg: 'Adquira primeiro' };
    if (!nx) return { ok: false, msg: 'Nível máximo' };
    if (s.level < lv + 1) return { ok: false, msg: `Requer Nível ${lv + 1}` };
    if (s.credits < nx.cost) return { ok: false, msg: 'Créditos insuficientes' };
    return { ok: true, msg: '' };
  }
  upgrade(id) {
    const c = this.checkUpgrade(id); if (!c.ok) return c; const d = this.map[id].def, s = this.g.state;
    s.credits -= d.levels[this.level(id)].cost; this.data.levels[id] = this.level(id) + 1; s.stats.bought++; this.g.missions.notify('upgrade', 0, 1); this.sync();
    return { ok: true, msg: `${d.name} nível ${this.level(id)}!` };
  }
}
