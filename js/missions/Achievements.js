import { fmt } from '../core/Util.js';
import { ENEMIES } from '../enemies/Enemy.js';
import { RESOURCES } from '../mining/Resource.js';
// Metas de longo prazo. Adicionar uma conquista = uma linha aqui.
export const ACHIEVEMENTS = [
  { id: 'c1', icon: '⛏️', name: 'Mãos na massa', desc: 'Colete 50 recursos', goal: 50, val: g => g.state.stats.collected, reward: 200 },
  { id: 'c2', icon: '⛏️', name: 'Minerador de carreira', desc: 'Colete 500 recursos', goal: 500, val: g => g.state.stats.collected, reward: 2000 },
  { id: 'c3', icon: '⛏️', name: 'Rei da mina', desc: 'Colete 3.000 recursos', goal: 3000, val: g => g.state.stats.collected, reward: 15000 },
  { id: 'e1', icon: '💰', name: 'Primeira fortuna', desc: 'Ganhe 5.000 créditos vendendo', goal: 5000, val: g => g.state.stats.earned, reward: 500 },
  { id: 'e2', icon: '💰', name: 'Empresário espacial', desc: 'Ganhe 100.000 créditos vendendo', goal: 100000, val: g => g.state.stats.earned, reward: 5000 },
  { id: 'e3', icon: '💎', name: 'Magnata galáctico', desc: 'Ganhe 2.000.000 de créditos vendendo', goal: 2000000, val: g => g.state.stats.earned, reward: 50000 },
  { id: 'k1', icon: '💥', name: 'Exterminador', desc: 'Derrote 25 criaturas', goal: 25, val: g => g.state.stats.kills, reward: 1000 },
  { id: 'k2', icon: '💥', name: 'Flagelo alienígena', desc: 'Derrote 200 criaturas', goal: 200, val: g => g.state.stats.kills, reward: 10000 },
  { id: 'd1', icon: '🕳️', name: 'Sem medo do escuro', desc: 'Chegue ao Núcleo', goal: 5, val: g => g.state.stats.maxDepth, reward: 2000 },
  { id: 'l1', icon: '⭐', name: 'Veterano', desc: 'Chegue ao nível 10', goal: 10, val: g => g.state.level, reward: 3000 },
  { id: 'l2', icon: '🌟', name: 'Lenda espacial', desc: 'Chegue ao nível 25', goal: 25, val: g => g.state.level, reward: 20000 },
  { id: 'u1', icon: '🔧', name: 'Equipamento de ponta', desc: 'Leve a broca ao nível máximo', goal: 6, val: g => g.state.upgrades.drill, reward: 8000 },
  { id: 'u2', icon: '🚀', name: 'Frota completa', desc: 'Leve a nave ao nível máximo', goal: 4, val: g => g.state.upgrades.ship, reward: 10000 },
  { id: 'u3', icon: '🛠️', name: 'Arsenal', desc: 'Some 20 níveis de melhorias', goal: 20, val: g => Object.values(g.state.upgrades).reduce((a, b) => a + b, 0), reward: 5000 },
  { id: 'x1', icon: '📖', name: 'Geólogo', desc: 'Descubra todos os minerais', get goal() { return Object.keys(RESOURCES).length; }, val: g => g.state.codex.minerals.length, reward: 3000 },
  { id: 'x2', icon: '🦎', name: 'Zoólogo', desc: 'Descubra todas as criaturas', get goal() { return Object.keys(ENEMIES).length; }, val: g => g.state.codex.creatures.length, reward: 5000 },
  { id: 't1', icon: '✨', name: 'Achado raro', desc: 'Colete 1 recurso lendário ou mítico', goal: 1, val: g => g.state.stats.top, reward: 1000 },
  { id: 't2', icon: '🌠', name: 'Caçador de lendas', desc: 'Colete 10 recursos lendários ou míticos', goal: 10, val: g => g.state.stats.top, reward: 15000 },
  { id: 'b1', icon: '👑', name: 'Matador de gigantes', desc: 'Derrote o Guardião do Núcleo', goal: 1, val: g => g.state.stats.bosses, reward: 10000 },
  { id: 's1', icon: '🌪️', name: 'Filho da tempestade', desc: 'Sobreviva a 3 tempestades', goal: 3, val: g => g.state.stats.storms, reward: 1500 },
  { id: 'r1', icon: '🌀', name: 'Viajante', desc: 'Use o retorno rápido 10 vezes', goal: 10, val: g => g.state.stats.recalls, reward: 800 },
  { id: 'f1', icon: '😵', name: 'Teimoso', desc: 'Desmaie 5 vezes', goal: 5, val: g => g.state.stats.deaths, reward: 300 },
  { id: 'cb1', icon: '🔥', name: 'Embalado', desc: 'Faça um combo de 10', goal: 10, val: g => g.state.stats.bestCombo, reward: 1500 },
  { id: 'cb2', icon: '🔥', name: 'Imparável', desc: 'Faça um combo de 25', goal: 25, val: g => g.state.stats.bestCombo, reward: 8000 },
  { id: 'ch1', icon: '📦', name: 'Caçador de tesouros', desc: 'Abra 10 baús', goal: 10, val: g => g.state.stats.chests, reward: 3000 },
  { id: 'ch2', icon: '📦', name: 'Saqueador de elite', desc: 'Abra 50 baús', goal: 50, val: g => g.state.stats.chests, reward: 20000 },
  { id: 'v1', icon: '💎', name: 'Filão', desc: 'Esgote 5 veios ricos', goal: 5, val: g => g.state.stats.veins, reward: 2500 },
  { id: 'sc1', icon: '📡', name: 'Ouvido de morcego', desc: 'Use o scanner 30 vezes', goal: 30, val: g => g.state.stats.scans, reward: 800 },
  { id: 'df1', icon: '🛡️', name: 'Escudo humano', desc: 'Bloqueie 25 golpes com escudo ou esquiva', goal: 25, val: g => g.state.stats.blocks, reward: 2500 },
  { id: 'df2', icon: '🎯', name: 'Atirador', desc: 'Acerte 250 disparos', goal: 250, val: g => g.state.stats.hits, reward: 4000 },
  { id: 'p1', icon: '🤖', name: 'Melhor amigo', desc: 'Leve o Bolt ao nível 5', goal: 5, val: g => g.state.pet.level, reward: 2000 },
  { id: 'p2', icon: '👑', name: 'Forma Ômega', desc: 'Leve o Bolt ao nível 10', goal: 10, val: g => g.state.pet.level, reward: 15000 }
];
export const Achievements = class {
  constructor(g) { this.g = g; this.acc = 0; }
  update(dt) {
    this.acc += dt; if (this.acc < 1) return; this.acc = 0; this.check();
  }
  check() {
    const g = this.g;
    for (const a of ACHIEVEMENTS) {
      if (g.state.achievements[a.id] || a.val(g) < a.goal) continue;
      g.state.achievements[a.id] = true; g.state.credits += a.reward;
      g.ui.toast(`🏆 Conquista: ${a.name} (+${fmt(a.reward)} 💰)`, 'discover'); g.audio.play('level'); g.save();
    }
  }
  count() { return ACHIEVEMENTS.filter(a => this.g.state.achievements[a.id]).length; }
};
