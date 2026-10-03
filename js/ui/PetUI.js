import { fmt } from '../core/Util.js';
import { PET_ABILITIES } from '../pet/Pet.js';
export const PetUI = class {
  constructor(g) { this.g = g; this.title = '🤖 Mascote'; }
  trainCost() { return Math.floor(250 * Math.pow(this.g.pet.level, 2.1)); }
  render() {
    const g = this.g, p = g.pet, lv = p.level, max = lv >= 10, pc = max ? 100 : Math.floor(p.data.xp / p.xpNeed * 100), cost = this.trainCost();
    const names = ['Bolt Mk.I', 'Bolt Mk.II', 'Bolt Mk.III', 'Bolt Ômega'];
    return `<div class="petbox"><div class="pico">${['🤖', '🛸', '🚀', '👑'][p.stage]}</div><div class="pinfo"><b>${names[p.stage]}</b> <small>Nível ${lv}${max ? ' (máximo)' : ''}</small>
      <div class="mb big"><i style="width:${pc}%"></i></div><small class="muted">${max ? 'Evolução completa!' : `${fmt(p.data.xp)}/${fmt(p.xpNeed)} XP · o Bolt ganha XP quando você e ele coletam, abrem baús e derrotam criaturas`}</small>
      <div>Bônus de venda: <b>+${Math.round(p.sellBonus * 100)}%</b></div></div></div>
      ${max ? '' : `<button class="btn primary" data-act="train" ${g.state.credits >= cost ? '' : 'disabled'}>🔧 Treinar o Bolt <small>💰 ${fmt(cost)} · +60% do XP do nível</small></button>`}
      <h3>Habilidades</h3>` + PET_ABILITIES.map(a => `<div class="row ${lv >= a.lv ? '' : 'dim'}">${lv >= a.lv ? '✅' : '🔒'} ${a.icon} <b>${a.name}</b> <small style="display:inline">Nv ${a.lv}</small><small>${a.desc}</small></div>`).join('');
  }
  act(a) {
    if (a !== 'train') return; const g = this.g, c = this.trainCost();
    if (g.pet.level >= 10 || g.state.credits < c) return;
    g.state.credits -= c; g.pet.addXP(Math.ceil(g.pet.xpNeed * 0.6)); g.audio.play('upgrade'); g.save();
  }
};
