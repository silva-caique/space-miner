export const Codex = class {
  constructor(g) { this.g = g; }
  discover(list, id) { const l = this.g.state.codex[list]; if (l.includes(id)) return false; l.push(id); this.g.save(); return true; }
  discoverMineral(id) { return this.discover('minerals', id); }
  discoverCreature(id) { return this.discover('creatures', id); }
  has(list, id) { return this.g.state.codex[list].includes(id); }
};
