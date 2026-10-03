import { fmt } from '../core/Util.js';
export const MISSIONS = [
  { id: 'm1', name: 'Primeiro minério', desc: 'Colete 10 Ferro', kind: 'collect', res: 'iron', goal: 10, reward: 100 },
  { id: 'm2', name: 'Cobre à vista', desc: 'Colete 5 Cobre', kind: 'collect', res: 'copper', goal: 5, reward: 150 },
  { id: 'm3', name: 'Minerador', desc: 'Colete 100 recursos', kind: 'collect', goal: 100, reward: 500 },
  { id: 'm4', name: 'Explorador', desc: 'Chegue à profundidade 3', kind: 'depth', goal: 3, reward: 1000 },
  { id: 'm5', name: 'Brilho vermelho', desc: 'Colete 3 Cristais Vermelhos', kind: 'collect', res: 'redcrystal', goal: 3, reward: 400 },
  { id: 'm6', name: 'Caçador', desc: 'Derrote 5 criaturas', kind: 'kill', goal: 5, reward: 300 },
  { id: 'm7', name: 'Engenheiro', desc: 'Compre 5 melhorias', kind: 'upgrade', goal: 5, reward: 800 },
  { id: 'm8', name: 'Mergulho profundo', desc: 'Chegue ao Núcleo (profundidade 5)', kind: 'depth', goal: 5, reward: 3000 },
  { id: 'm9', name: 'Milionário espacial', desc: 'Ganhe 20.000 créditos vendendo', kind: 'earn', goal: 20000, reward: 2500 },
  { id: 'm10', name: 'Estrela cadente', desc: 'Colete 1 Cristal Estelar', kind: 'collect', res: 'starcrystal', goal: 1, reward: 5000 },
  { id: 'm12', name: 'Quebra-guardião', desc: 'Derrote o Guardião do Núcleo', kind: 'boss', goal: 1, reward: 10000 },
  { id: 'm11', name: 'Coração do planeta', desc: 'Colete 1 Fragmento do Núcleo', kind: 'collect', res: 'corefragment', goal: 1, reward: 25000 }
];
export const MissionSystem = class {
  constructor(g) { this.g = g; }
  get(id) { const m = this.g.state.missions; return m[id] || (m[id] = { p: 0, done: false }); }
  notify(kind, key, amt = 1) {
    for (const m of MISSIONS) {
      if (m.kind !== kind) continue;
      const s = this.get(m.id); if (s.done) continue;
      if (kind === 'collect') { if (m.res && m.res !== key) continue; s.p += amt; }
      else if (kind === 'depth') s.p = Math.max(s.p, key);
      else s.p += amt;
      if (s.p >= m.goal) {
        s.p = m.goal; s.done = true; this.g.state.credits += m.reward;
        this.g.ui.toast(`✅ Missão: ${m.name} (+${fmt(m.reward)} 💰)`, 'mission'); this.g.audio.play('level'); this.g.save();
      }
    }
  }
  current() { return MISSIONS.filter(m => !this.get(m.id).done).slice(0, 2); }
};
