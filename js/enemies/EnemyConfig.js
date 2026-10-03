// Combina o tipo da criatura (enemies.json) com a dificuldade da camada (planets.json) nos números finais.
export const DEFAULT_DIFF = { hp: 1, speed: 4.9, damage: 1, detect: 10, scale: 1, alert: 0.6, memory: 6, attackRate: 1.3 };
export function layerStats(def, lay, idx) {
  const d = { ...DEFAULT_DIFF, ...((lay && lay.difficulty) || {}) }, boss = !!def.boss;
  const size = boss ? (def.scale || 1) : (def.scale || 1) * d.scale * (0.94 + Math.random() * 0.12);
  return {
    maxHp: Math.round(def.hp * d.hp), speed: d.speed * (def.speedMul || 1), damage: def.dmg * d.damage * (def.damageScale || 1), projDamage: (def.projDmg || 10) * d.damage,
    detect: d.detect * (def.perceive || 1), size, alert: d.alert, memory: d.memory, attackRate: d.attackRate,
    reach: (def.attackRange || 2) * (boss ? 1 : Math.max(1, size * 0.8)), hostile: !!def.hostile || (def.hostileFrom !== undefined && idx >= def.hostileFrom)
  };
}
