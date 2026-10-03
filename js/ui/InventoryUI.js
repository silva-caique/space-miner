import { fmt } from '../core/Util.js';
import { RARITY } from '../mining/Resource.js';
export const InventoryUI = class {
  constructor(g) { this.g = g; this.title = '🎒 Mochila'; }
  render() {
    const g = this.g, lines = g.economy.lines();
    const rows = lines.map(l => `<tr><td style="color:${RARITY[l.def.rarity].css}">${l.def.name}</td><td>${l.qty}</td><td>💰 ${fmt(l.unit)}</td><td>💰 ${fmt(l.total)}</td></tr>`).join('');
    return `<p class="muted">Capacidade: <b>${g.inventory.count}/${g.inventory.capacity}</b>. Volte à nave (E) para vender.</p>` +
      (rows ? `<table class="tbl"><tr><th>Recurso</th><th>Qtd</th><th>Unid.</th><th>Total</th></tr>${rows}</table><p class="total">Valor da carga: 💰 ${fmt(g.economy.total())}</p>` : '<p class="muted">Mochila vazia. Vá minerar!</p>');
  }
  act() {}
};
