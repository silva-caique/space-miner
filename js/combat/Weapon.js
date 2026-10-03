// Estado em tempo de execução de uma arma (o nível vem do save; os números vêm de config/weapons.json)
export class Weapon {
  constructor(def) { this.def = def; this.cd = 0; this.level = 1; }
  get lv() { return this.def.levels[Math.max(0, Math.min(this.level, this.def.levels.length) - 1)]; }
  get interval() { return 1 / this.lv.rate; }
  tick(dt) { if (this.cd > 0) this.cd -= dt; }
  trigger() { this.cd = this.interval; }
}
