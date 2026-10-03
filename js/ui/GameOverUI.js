import { RESOURCES } from '../mining/Resource.js';
import { fmt } from '../core/Util.js';
export const GameOverUI = class {
  constructor(g) { this.g = g; this.title = '💀 VOCÊ DESMAIOU'; }
  render() {
    const L = this.g.lastLoss, s = this.g.state.stats;
    const items = Object.keys(L.items).filter(k => L.items[k] > 0 && RESOURCES[k]).map(k => `${L.items[k]}× ${RESOURCES[k].name}`).join(', ');
    return `<p class="muted">Você foi resgatado pela nave. ${L.count ? `A carga que estava na mochila (<b>${items}</b>) foi perdida.` : 'Sua mochila estava vazia.'}</p>
      <p class="muted">Desmaios: ${fmt(s.deaths)} · Melhor combo: x${s.bestCombo}</p>
      <div class="stack"><button class="btn big primary" data-act="continue">▶ VOLTAR À NAVE</button>
      ${L.count ? `<button class="btn big" data-act="recover">📺 Assistir anúncio: recuperar a carga (${L.count} itens)<small>opcional</small></button>` : ''}
      <button class="btn big" data-act="menu">🏠 MENU PRINCIPAL</button></div>`;
  }
  act(a) {
    const g = this.g;
    if (a === 'continue') return g.respawn();
    if (a === 'menu') return g.toMenu();
    if (a === 'recover') return g.ads.rewarded().then(ok => { if (ok) g.recoverLoss(); });
  }
};
