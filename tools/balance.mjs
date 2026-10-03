// Relatório de balanceamento: tempo para derrotar cada criatura com cada arma (acertando todos os tiros). Uso: node tools/balance.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), J = n => JSON.parse(fs.readFileSync(path.join(root, 'config', n + '.json'), 'utf8'));
const W = J('weapons').weapons, E = J('enemies').types, L = J('planets').planets[0].layers;
const dps = (w, lv) => { const l = w.levels[lv]; return l.damage * (w.pellets || 1) * l.rate; };
console.log('Tempo (s) para derrotar, acertando tudo.  Arma inicial = Blaster nível 1\n');
console.log('criatura (camada)'.padEnd(26) + 'vida'.padStart(7) + '  blaster1  blaster3  blaster5  plasma3  rail3  cannon3');
for (const [id, layer] of [['crab', 0], ['slime', 0], ['crab', 1], ['rock', 2], ['crab', 3], ['rock', 3], ['spitter', 4], ['rock', 5], ['guardian', 5]]) {
  const hp = E[id].hp * L[layer].difficulty.hp, t = (w, lv) => (hp / dps(W.find(x => x.id === w), lv)).toFixed(1).padStart(8);
  console.log(`${E[id].name} (${layer})`.padEnd(26) + String(Math.round(hp)).padStart(7) + t('blaster', 0) + t('blaster', 2) + t('blaster', 4) + t('plasma', 2) + t('rail', 2) + t('cannon', 2));
}
