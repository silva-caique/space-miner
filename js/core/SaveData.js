export const SaveData = class {
  static defaults() {
    return { credits: 0, xp: 0, level: 1, inventory: {},
      upgrades: { drill: 0, backpack: 0, suit: 0, battery: 0, ship: 0, scanner: 0, shield: 0 },
      codex: { minerals: [], creatures: [], planets: ['mars'] },
      missions: {}, planets: ['mars'],
      stats: { collected: 0, earned: 0, kills: 0, maxDepth: 0, bought: 0, bosses: 0, deaths: 0, recalls: 0, storms: 0, top: 0, bestCombo: 0, chests: 0, veins: 0, scans: 0, petFinds: 0, shots: 0, hits: 0, blocks: 0 }, achievements: {}, comboBonus: 0, pet: { level: 1, xp: 0 },
      settings: { volume: 0.8, music: 0.5, sfx: 0.7, quality: 'high', shadows: true, bloom: true, particles: 1, drawDist: 1, pixelRatio: 1.5, sensitivity: 1 }, buffs: { turbo: 0 }, weapons: { owned: ['blaster'], levels: { blaster: 1 }, current: 'blaster' }, playtime: 0 };
  }
  constructor() { this.reset(); }
  reset() { Object.assign(this, SaveData.defaults()); }
  load(d) {
    this.reset();
    if (!d || typeof d !== 'object') return;
    const def = SaveData.defaults();
    for (const k in def) {
      if (d[k] === undefined) continue;
      if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k])) this[k] = Object.assign(def[k], d[k]);
      else this[k] = d[k];
    }
  }
  toJSON() { const o = {}; for (const k in SaveData.defaults()) o[k] = this[k]; return o; }
};
