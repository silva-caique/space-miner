// Carrega config/*.json (recursos, melhorias, inimigos, planetas) e preenche as tabelas usadas pelo jogo.
import { RARITY, RARITY_ORDER, RESOURCES } from '../mining/Resource.js';
import { ENEMIES } from '../enemies/Enemy.js';
import { UPGRADES } from '../upgrades/UpgradeSystem.js';
import { WEAPONS, CRIT } from '../combat/WeaponManager.js';

const COLOR_KEYS = new Set(['color', 'ground', 'ground2', 'rock', 'rock2', 'accent', 'sky', 'horizon', 'fog', 'emissive', 'sun', 'hemi']);
const isHex = s => typeof s === 'string' && /^#[0-9a-f]{6}$/i.test(s);
const conv = (v, key) => {
  if (Array.isArray(v)) return v.map(x => conv(x, key));
  if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = conv(v[k], k); return o; }
  return isHex(v) && COLOR_KEYS.has(key) ? parseInt(v.slice(1), 16) : v;
};
const hexStr = n => '#' + ('000000' + n.toString(16)).slice(-6);
const wipe = o => { for (const k of Object.keys(o)) delete o[k]; };

export const Config = {
  NAMES: ['resources', 'upgrades', 'enemies', 'planets', 'weapons'],
  loaded: false, planets: null,
  async fetchJson(name) {
    const r = await fetch(`config/${name}.json`);
    if (!r.ok) throw new Error(`config/${name}.json (${r.status})`);
    return r.json();
  },
  async loadAll(onStep) {
    const data = {};
    for (const n of this.NAMES) { data[n] = await this.fetchJson(n); if (onStep) onStep(n); }
    this.apply(data); this.loaded = true; return this;
  },
  apply(d) {
    const res = conv(d.resources);
    wipe(RARITY); for (const k in res.rarity) RARITY[k] = { ...res.rarity[k], css: hexStr(res.rarity[k].color) };
    RARITY_ORDER.length = 0; RARITY_ORDER.push(...res.rarityOrder);
    wipe(RESOURCES); Object.assign(RESOURCES, res.resources);
    wipe(UPGRADES); for (const k in d.upgrades) UPGRADES[k] = { ...d.upgrades[k] };
    wipe(ENEMIES); Object.assign(ENEMIES, conv(d.enemies).types);
    WEAPONS.length = 0; WEAPONS.push(...conv(d.weapons).weapons); Object.assign(CRIT, d.weapons.crit);
    this.planets = { catalog: d.planets.catalog, planets: conv(d.planets.planets) };
    this.validate();
  },
  validate() {
    if (!Object.keys(RESOURCES).length) throw new Error('resources.json sem recursos');
    for (const r of Object.values(RESOURCES)) if (!RARITY[r.rarity]) throw new Error(`Recurso "${r.id}" com raridade desconhecida`);
    for (const e of Object.values(ENEMIES)) for (const l of (e.loot || [])) if (!RESOURCES[l.id]) throw new Error(`Loot inválido em enemies.json: ${e.id} -> ${l.id}`);
    for (const L of this.planets.planets[0].layers) if (!L.difficulty) throw new Error('planets.json: camada sem "difficulty"');
    if (!WEAPONS.length) throw new Error('weapons.json sem armas');
    if (!this.planets.planets.length || !this.planets.planets[0].layers.length) throw new Error('planets.json sem camadas');
  }
};
