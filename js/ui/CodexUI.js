import { fmt } from '../core/Util.js';
import { ENEMIES } from '../enemies/Enemy.js';
import { RARITY, RESOURCES } from '../mining/Resource.js';
import { ACHIEVEMENTS } from '../missions/Achievements.js';
import { MISSIONS } from '../missions/MissionSystem.js';
import { PLANET_INFO } from '../planets/PlanetManager.js';
export const CodexUI = class {
  constructor(g) { this.g = g; this.title = '📖 Codex'; this.tabs = [{ id: 'min', label: 'Minerais' }, { id: 'cre', label: 'Criaturas' }, { id: 'pla', label: 'Planetas' }, { id: 'mis', label: 'Missões' }, { id: 'ach', label: '🏆 Conquistas' }]; }
  render(tab) {
    const g = this.g, cx = g.codex;
    if (tab === 'min') { const l = Object.values(RESOURCES); const n = l.filter(r => cx.has('minerals', r.id)).length;
      return `<p class="muted">${n}/${l.length} descobertos</p>` + l.map(r => cx.has('minerals', r.id) ? `<div class="row">☑ <b style="color:${RARITY[r.rarity].css}">${r.name}</b><small>${RARITY[r.rarity].name} · 💰 ${fmt(r.value)}</small></div>` : `<div class="row dim">☐ ???<small>Ainda não descoberto</small></div>`).join(''); }
    if (tab === 'cre') { const l = Object.values(ENEMIES);
      return `<p class="muted">${l.filter(r => cx.has('creatures', r.id)).length}/${l.length} descobertas</p>` + l.map(r => cx.has('creatures', r.id) ? `<div class="row">☑ <b>${r.name}</b><small>${r.desc}</small></div>` : `<div class="row dim">☐ ???<small>Explore para encontrar</small></div>`).join(''); }
    if (tab === 'pla') return PLANET_INFO.map(p => { const ok = cx.has('planets', p.id); return `<div class="row ${ok ? '' : 'dim'}">${ok ? '☑' : '☐'} <b style="color:${ok ? p.color : 'inherit'}">${p.name}</b><small>${ok ? p.desc : 'Bloqueado'}</small></div>`; }).join('');
    if (tab === 'ach') return `<p class="muted">${g.achievements.count()}/${ACHIEVEMENTS.length} conquistas</p>` + ACHIEVEMENTS.map(a => { const v = Math.min(a.goal, a.val(g)), done = !!g.state.achievements[a.id]; return `<div class="row ${done ? 'done' : ''}">${done ? '🏆' : a.icon} <b>${a.name}</b><small>${a.desc} · Recompensa 💰 ${fmt(a.reward)} · ${fmt(v)}/${fmt(a.goal)}</small><div class="mb"><i style="width:${Math.floor(v / a.goal * 100)}%"></i></div></div>`; }).join('');
    return MISSIONS.map(m => { const s = g.missions.get(m.id), pc = Math.floor(s.p / m.goal * 100);
      return `<div class="row ${s.done ? 'done' : ''}">${s.done ? '✅' : '🎯'} <b>${m.name}</b><small>${m.desc} · Recompensa 💰 ${fmt(m.reward)}</small><div class="mb"><i style="width:${pc}%"></i></div></div>`; }).join('');
  }
  act() {}
};
