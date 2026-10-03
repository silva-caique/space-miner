import { Planet } from './Planet.js';
// Planetas e catálogo vêm de config/planets.json. Para criar um planeta novo, acrescente uma entrada em "planets" com suas camadas.
export const PLANET_INFO = [];
export const PlanetManager = class {
  constructor(g) { this.g = g; this.reg = {}; }
  load(cfg) {
    PLANET_INFO.length = 0; PLANET_INFO.push(...cfg.catalog);
    for (const p of cfg.planets) this.register(new Planet(p));
  }
  register(p) { this.reg[p.id] = p; }
  get(id) { return this.reg[id]; }
  playable(id) { return !!this.reg[id]; }
  unlocked(id) { return this.g.state.planets.includes(id); }
};
