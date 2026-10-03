// Combo: coletas seguidas multiplicam o valor (pago na venda) e o XP. Pausa enquanto você minera.
export const COMBO_TIERS = [[0, 1], [3, 1.25], [6, 1.5], [10, 2], [15, 2.5], [20, 3]];
export const Combo = class {
  constructor(g) { this.g = g; this.count = 0; this.t = 0; this.max = 8; }
  get mult() { let m = 1; for (const [n, v] of COMBO_TIERS) if (this.count >= n) m = v; return m; }
  get next() { return COMBO_TIERS.find(([n]) => n > this.count) || null; }
  hit() {
    const g = this.g, prev = this.mult; this.count++; this.t = this.max; const m = this.mult;
    if (this.count > g.state.stats.bestCombo) g.state.stats.bestCombo = this.count;
    if (m > prev) { g.ui.toast(`🔥 COMBO x${m}!`, 'combo'); g.audio.play('combo', 24); } else g.audio.play('combo', this.count);
    return m;
  }
  drop() { if (this.count > 0) { this.count = Math.floor(this.count / 2); if (!this.count) this.t = 0; } }
  reset() { this.count = 0; this.t = 0; }
  update(dt, mining) {
    if (!this.count) return;
    if (!mining) this.t -= dt;
    if (this.t <= 0) { if (this.count >= 5) this.g.ui.toast(`Combo encerrado: ${this.count} itens`, ''); this.count = 0; }
  }
};
