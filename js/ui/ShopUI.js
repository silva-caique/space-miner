import { fmt, fmtStat } from '../core/Util.js';
import { RARITY } from '../mining/Resource.js';
import { PLANET_INFO } from '../planets/PlanetManager.js';
import { UPGRADES } from '../upgrades/UpgradeSystem.js';
export const ShopUI = class {
  constructor(g) {
    this.g = g; this.title = '🚀 Nave';
    this.tabs = [{ id: 'sell', label: '💰 Vender' }, { id: 'weapons', label: '🔫 Armas' }, { id: 'equip', label: '⛏️ Equipamentos' }, { id: 'ship', label: '🚀 Nave' }];
  }
  card(id) {
    const U = this.g.upgrades, def = UPGRADES[id], lv = U.level(id), cur = def.levels[lv], nx = def.levels[lv + 1], c = U.check(id);
    return `<div class="card"><div class="ci">${def.icon}</div><div class="cb"><b>${def.name}</b> <small>${def.desc}</small>
      <div>Atual: <b>${cur[0]}</b> · ${fmtStat(def, cur[1])}</div>
      <div class="muted">${nx ? `Próximo: ${nx[0]} · ${fmtStat(def, nx[1])}` : 'NÍVEL MÁXIMO'}</div></div>
      ${nx ? `<button class="btn ${c.ok ? 'primary' : ''}" data-act="buy" data-id="${id}" ${c.ok ? '' : 'disabled'}>💰 ${fmt(nx[2])}<small>${c.ok ? 'COMPRAR' : c.msg}</small></button>` : '<span class="max">MAX</span>'}</div>`;
  }
  adBlock(sell = true) {
    return `<h3>📺 Recompensas (opcional)</h3><div class="adrow">${sell ? '<button class="btn" data-act="adsell">💰 Vender com +50%<small>assista a um anúncio</small></button>' : ''}<button class="btn" data-act="adrefill">⚡ Vida e energia cheias<small>assista a um anúncio</small></button><button class="btn" data-act="adturbo">🚀 Turbo de mineração x2 (5 min)<small>assista a um anúncio</small></button></div>`;
  }
  weaponsTab() {
    const g = this.g, wm = g.combat.weapons;
    return `<p class="muted">Créditos: <b>💰 ${fmt(g.state.credits)}</b> · Nível ${g.state.level}. Atire com o botão esquerdo do mouse; troque de arma com as teclas 1 a ${wm.list.length}.</p>` + wm.list.map(d => {
      const owned = wm.owns(d.id), lv = wm.level(d.id), L = d.levels[lv - 1], nx = d.levels[lv], cur = wm.current.def.id === d.id;
      const stats = `Dano ${L.damage}${d.pellets > 1 ? '×' + d.pellets : ''}${L.splash ? ' (área)' : ''} · ${L.rate}/s · alcance ${L.range}m · ⚡${d.energy}${d.pierce > 1 ? ' · perfura ' + d.pierce : ''}${d.auto ? '' : ' · um tiro por clique'}`;
      let btns;
      if (!owned) { const c = wm.checkBuy(d.id); btns = `<button class="btn ${c.ok ? 'primary' : ''}" data-act="wbuy" data-id="${d.id}" ${c.ok ? '' : 'disabled'}>💰 ${fmt(d.price)}<small>${c.ok ? 'COMPRAR' : c.msg}</small></button>`; }
      else { const u = wm.checkUpgrade(d.id); btns = `${cur ? '<span class="max">EQUIPADA</span>' : `<button class="btn" data-act="wequip" data-id="${d.id}">Equipar</button>`}${nx ? `<button class="btn ${u.ok ? 'primary' : ''}" data-act="wup" data-id="${d.id}" ${u.ok ? '' : 'disabled'}>💰 ${fmt(nx.cost)}<small>${u.ok ? 'MELHORAR' : u.msg}</small></button>` : '<span class="max">MAX</span>'}`; }
      return `<div class="card ${owned ? '' : 'dimcard'}"><div class="ci">${d.icon}</div><div class="cb"><b>${d.name}</b> <small>${owned ? 'Nível ' + lv + '/' + d.levels.length : 'Requer nível ' + d.requires.level}</small><div class="muted">${stats}</div><div class="muted">${d.desc}</div></div><div class="cbtns">${btns}</div></div>`;
    }).join('');
  }
  render(tab) {
    const g = this.g;
    if (tab === 'sell') {
      const lines = g.economy.lines();
      if (!lines.length) return '<p class="muted">Nada para vender. Colete recursos em Mars e volte aqui!</p>' + this.adBlock(false);
      return `<table class="tbl"><tr><th>Recurso</th><th>Qtd</th><th>Valor</th><th>Total</th></tr>${lines.map(l => `<tr><td style="color:${RARITY[l.def.rarity].css}">${l.def.name}</td><td>${l.qty}</td><td>💰 ${fmt(l.unit)}</td><td>💰 ${fmt(l.total)}</td></tr>`).join('')}</table>
        ${(() => { const b = g.economy.breakdown(); return `<p class="muted">Carga: 💰 ${fmt(b.base)} · 🔥 Combo: +${fmt(b.combo)} · 🤖 Bolt: +${fmt(b.pet)}</p><p class="total">Total: 💰 ${fmt(b.total)}</p>`; })()}<button class="btn big primary" data-act="sellall">VENDER TUDO</button>${this.adBlock()}`;
    }
    if (tab === 'weapons') return this.weaponsTab();
    if (tab === 'equip') return `<p class="muted">Créditos: <b>💰 ${fmt(g.state.credits)}</b> · Nível ${g.state.level}</p>` + ['drill', 'shield', 'suit', 'battery', 'backpack', 'scanner'].map(id => this.card(id)).join('');
    const lv = g.upgrades.level('ship');
    return `<p class="muted">Créditos: <b>💰 ${fmt(g.state.credits)}</b></p>${this.card('ship')}<h3>Destinos</h3>` +
      PLANET_INFO.map(p => {
        const ok = g.planets.playable(p.id), unlocked = lv >= p.ship;
        return `<div class="planet"><i style="background:${p.color}"></i><div><b>${p.name}</b><small>${p.desc}</small></div><span>${ok ? (g.layerPlanet === p.id ? 'Você está aqui' : 'Disponível') : unlocked ? 'Em breve' : '🔒 Nave Mk.' + (p.ship + 1)}</span></div>`;
      }).join('');
  }
  act(a, d) {
    const g = this.g;
    if (a === 'sellall') {
      const t = g.economy.sellAll();
      if (t > 0) { g.audio.play('sell'); g.ui.toast(`+${fmt(t)} créditos!`, 'discover'); g.save(); }
    } else if (a === 'adsell') {
      return g.ads.rewarded().then(ok => { if (!ok) return; const t = g.economy.sellAll(1.5); if (t > 0) { g.audio.play('sell'); g.ui.toast(`+${fmt(t)} créditos (bônus de +50%)!`, 'discover'); g.save(); } });
    } else if (a === 'adrefill') {
      return g.ads.rewarded().then(ok => { if (!ok) return; g.stats.hp = g.stats.maxHp; g.stats.energy = g.stats.maxEnergy; g.audio.play('upgrade'); g.ui.toast('⚡ Vida e energia restauradas!', 'discover'); });
    } else if (a === 'adturbo') {
      return g.ads.rewarded().then(ok => { if (!ok) return; g.state.buffs.turbo = 300; g.audio.play('upgrade'); g.ui.toast('🚀 Turbo de mineração ativo por 5 minutos!', 'discover'); g.save(); });
    } else if (a === 'wbuy' || a === 'wup' || a === 'wequip') {
      const wm = g.combat.weapons;
      if (a === 'wequip') wm.select(d.id); else { const r = a === 'wbuy' ? wm.buy(d.id) : wm.upgrade(d.id); if (r.ok) { g.audio.play('upgrade'); g.ui.toast('🔧 ' + r.msg, 'discover'); g.save(); } }
    } else if (a === 'buy') {
      const r = g.upgrades.buy(d.id);
      if (r.ok) { g.audio.play('upgrade'); g.ui.toast('🔧 ' + r.msg, 'discover'); g.save(); }
    }
  }
};
