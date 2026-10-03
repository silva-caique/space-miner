export const PlayerStats = class {
  constructor(g) { this.g = g; this.hp = this.maxHp; this.energy = this.maxEnergy; }
  get maxHp() { return this.g.upgrades.value('suit'); }
  get maxEnergy() { return this.g.upgrades.value('battery'); }
  get capacity() { return this.g.upgrades.value('backpack') + this.g.upgrades.value('ship'); }
  get drillSpeed() { return this.g.upgrades.value('drill') * (this.g.state.buffs.turbo > 0 ? 2 : 1); }
  xpNeeded(l = this.g.state.level) { return Math.floor(80 * Math.pow(l, 1.6)); }
  addXP(n) {
    const s = this.g.state; s.xp += n;
    while (s.xp >= this.xpNeeded()) {
      s.xp -= this.xpNeeded(); s.level++; s.credits += 50 * s.level;
      this.g.ui.banner(`⭐ NÍVEL ${s.level}!`, '#ffe066'); this.g.ui.toast(`Novas melhorias disponíveis! (+${50 * s.level} 💰)`, 'discover'); this.g.audio.play('level'); if (s.level % 5 === 0) this.g.crazy.happytime();
    }
  }
  hurt(n, quiet) {
    if (!quiet && (this.g.pcombat.block() || this.g.pet.absorb())) return;
    if (!quiet) this.g.combo.drop();
    this.hp -= n; this.g.hud.damage(); this.g.cancelRecall();
    if (!quiet) this.g.audio.play('hurt');
    if (this.hp <= 0) { this.hp = 0; this.g.onDeath(); }
  }
  refill(dt) { this.hp = Math.min(this.maxHp, this.hp + 25 * dt); this.energy = Math.min(this.maxEnergy, this.energy + 45 * dt); }
};
