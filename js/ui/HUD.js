import { fmt } from '../core/Util.js';
import { RARITY } from '../mining/Resource.js';
export const HUD = class {
  constructor(g) {
    this.g = g; this.$ = id => document.getElementById(id); this.c = {}; this.dmgT = 0;
    this.el = this.$('hud');
  }
  show() { this.el.classList.remove('hidden'); } hide() { this.el.classList.add('hidden'); }
  set(id, key, val, fn) { if (this.c[id] !== val) { this.c[id] = val; fn(this.$(id), val); } }
  flash() { const d = this.$('flash'); d.classList.remove('on'); void d.offsetWidth; d.classList.add('on'); }
  recallProgress(p) { const w = this.$('recall-wrap'); if (p <= 0) { w.classList.add('hidden'); return; } w.classList.remove('hidden'); this.$('recall-fill').style.width = (p * 100).toFixed(0) + '%'; }
  damage() { const d = this.$('dmg'); d.classList.remove('hit'); void d.offsetWidth; d.classList.add('hit'); }
  mineProgress(p, def) {
    const w = this.$('mine-wrap');
    if (!p) { w.classList.add('hidden'); return; }
    w.classList.remove('hidden'); this.$('mine-fill').style.width = (p * 100).toFixed(0) + '%';
    if (def) { const n = this.$('mine-name'); n.textContent = def.name; n.style.color = RARITY[def.rarity].css; }
  }
  renderWeapons() {
    const wm = this.g.combat.weapons, cur = wm.current; if (this.wv === wm.version) return; this.wv = wm.version;
    this.$('wslots').innerHTML = wm.list.map((d, i) => `<div class="ws ${wm.owns(d.id) ? '' : 'lock'} ${cur.def.id === d.id ? 'on' : ''}"><kbd>${i + 1}</kbd><span>${d.icon}</span><small>${wm.owns(d.id) ? 'Nv' + wm.level(d.id) : '🔒'}</small></div>`).join('');
    const ab = this.$('ab-w'); if (ab.querySelector) { ab.querySelector('span').textContent = cur.def.icon; ab.querySelector('small').textContent = cur.def.name.split(' ')[0]; }
  }
  hitmarker(kill) { const h = this.$('hitmarker'); h.classList.remove('on', 'kill'); void h.offsetWidth; h.classList.add('on'); if (kill) h.classList.add('kill'); }
  damageNumber(pos, val, crit, kill) {
    const v = pos.clone().project(this.g.camera); if (v.z > 1) return;
    const box = this.$('dmgnums'), el = document.createElement('div'); el.className = 'dmgnum' + (crit ? ' crit' : '') + (kill ? ' kill' : ''); el.textContent = val;
    el.style.left = ((v.x * 0.5 + 0.5) * window.innerWidth + (Math.random() - 0.5) * 30) + 'px'; el.style.top = ((-v.y * 0.5 + 0.5) * window.innerHeight) + 'px';
    box.appendChild(el); while (box.children.length > 14) box.removeChild(box.firstChild); setTimeout(() => el.remove(), 800);
  }
  update() {
    const g = this.g, s = g.state, st = g.stats;
    const hp = Math.ceil(st.hp), en = Math.ceil(st.energy);
    this.set('hp-text', 0, `❤️ ${hp}/${st.maxHp}`, (e, v) => e.textContent = v);
    this.set('hp-fill', 0, (st.hp / st.maxHp * 100).toFixed(0), (e, v) => e.style.width = v + '%');
    this.set('en-text', 0, `⚡ ${en}/${st.maxEnergy}`, (e, v) => e.textContent = v);
    this.set('en-fill', 0, (st.energy / st.maxEnergy * 100).toFixed(0), (e, v) => e.style.width = v + '%');
    this.set('credits', 0, `💰 ${fmt(s.credits)}`, (e, v) => e.textContent = v);
    this.set('lvl', 0, `⭐ Nv ${s.level}`, (e, v) => e.textContent = v);
    this.set('xp-fill', 0, (s.xp / st.xpNeeded() * 100).toFixed(0), (e, v) => e.style.width = v + '%');
    const inv = g.inventory;
    this.set('bag', 0, `🎒 ${inv.count}/${inv.capacity}`, (e, v) => { e.textContent = v; e.classList.toggle('full', inv.free <= 0); });
    this.set('depth', 0, `📍 ${g.planet.layers[g.layer].name} · Prof. ${g.layer}`, (e, v) => e.textContent = v);
    const q = g.missions.current().map(m => { const p = g.missions.get(m.id).p; return `<div>🎯 <b>${m.name}</b>: ${m.desc} <span>(${fmt(p)}/${fmt(m.goal)})</span></div>`; }).join('');
    this.set('quest', 0, q, (e, v) => e.innerHTML = v);
    const rc = g.recallCd > 0 ? `🌀 R ${Math.ceil(g.recallCd)}s` : '🌀 R pronto';
    this.set('recall', 0, rc, (e, v) => { e.textContent = v; e.classList.toggle('cd', g.recallCd > 0); });
    const W = g.pcombat, ab = (id, frac, st2) => this.set(id, 0, frac.toFixed(2) + st2, e => { e.classList.toggle('on', st2 === 'on'); e.classList.toggle('off', st2 === 'off'); const i = e.querySelector ? e.querySelector('i') : null; if (i) i.style.height = (frac * 100) + '%'; });
    const cw = g.combat.weapon; this.renderWeapons(); ab('ab-w', Math.max(0, cw.cd / cw.interval), st.energy < cw.def.energy ? 'off' : '');
    ab('ab-v', W.shieldT > 0 ? 0 : W.shieldCd / (W.shieldDur + 9), W.shieldT > 0 ? 'on' : '');
    ab('ab-z', W.dashCd / 3, '');
    ab('ab-f', Math.max(0, g.pulseCd / 0.8), '');
    const tb = g.state.buffs.turbo; this.set('turbo', 0, tb > 0 ? `🚀 Turbo ${Math.floor(tb / 60)}:${('0' + Math.floor(tb % 60)).slice(-2)}` : '', (e, v) => { e.textContent = v; e.classList.toggle('hidden', !v); });
    const th = g.enemies.threat; this.set('threat', 0, th.toFixed(2), e => { e.style.opacity = Math.min(0.75, th * 0.6); });
    const cb = g.combo;
    this.set('combo', 0, cb.count ? cb.count + '|' + cb.mult : '', (e, v) => { e.classList.toggle('hidden', !v); if (v) { this.$('combo-n').textContent = cb.count; this.$('combo-m').textContent = 'x' + cb.mult; } });
    if (cb.count) this.set('combo-fill', 0, (cb.t / cb.max * 100).toFixed(0), (e, v) => e.style.width = v + '%');
    this.set('scan', 0, g.scanner.cd > 0 ? `📡 Q ${Math.ceil(g.scanner.cd)}s` : '📡 Q pronto', (e, v) => { e.textContent = v; e.classList.toggle('cd', g.scanner.cd > 0); });
    this.set('petchip', 0, `🤖 Bolt Nv ${g.pet.level}`, (e, v) => e.textContent = v);
    const b = g.enemies.boss, bd = b ? Math.hypot(b.mesh.position.x - g.player.pos.x, b.mesh.position.z - g.player.pos.z) : 999;
    this.set('boss', 0, b && bd < 60 ? 'on' : '', (e, v) => e.classList.toggle('hidden', !v));
    if (b && bd < 60) this.set('boss-fill', 0, (Math.max(0, b.hp) / b.maxHp * 100).toFixed(0), (e, v) => e.style.width = v + '%');
    const cc = g.combat, xh = this.$('crosshair'), sp = Math.round(8 + cc.spread * 18 + (g.player.moving ? 4 : 0)), hot = cc.target ? 1 : 0;
    if (this.xs !== sp) { this.xs = sp; xh.style.setProperty('--sp', sp + 'px'); } if (this.xh !== hot) { this.xh = hot; xh.classList.toggle('hot', !!hot); }
    this.set('lockhint', 0, g.input.lockSupported && !g.input.locked && g.canPlay() ? 'on' : '', (e, v) => e.classList.toggle('hidden', !v));
    const pr = g.prompt || '';
    this.set('prompt', 0, pr, (e, v) => { e.textContent = v; e.classList.toggle('hidden', !v); });
  }
};
