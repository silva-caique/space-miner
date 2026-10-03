import { fmt } from '../core/Util.js';
import { ACHIEVEMENTS } from '../missions/Achievements.js';
export const MainMenu = class {
  constructor(g) {
    this.g = g; this.el = document.getElementById('menu'); this.sel = 0; this.tipI = 0;
    this.tips = ['Segure X para atirar (a mira é automática), V liga o escudo e Z faz uma esquiva que te deixa invulnerável.', 'Mantenha o combo: minere sem parar para multiplicar o valor da carga.', 'Aperte Q para o scanner revelar minérios enterrados e baús.', 'Veios ricos aparecem no minimapa como uma estrela dourada.', 'O Bolt minera sozinho a partir do nível 2. Treine-o na aba Mascote.', 'Segure R para voltar à nave de qualquer camada.', 'Perto da nave você fica protegido das tempestades.', 'Baús melhores são guardados por criaturas.', 'O Guardião do Núcleo deixa um Fragmento mítico valiosíssimo.'];
    this.el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) this.run(b.dataset.act); });
    this.el.addEventListener('mouseover', e => { const b = e.target.closest('.nav-btn'); if (b) this.select(this.btns().indexOf(b)); });
    window.addEventListener('keydown', e => {
      if (!g.fsm.is('MENU') || g.ui.panelOpen) return;
      const n = this.btns().length;
      if (e.code === 'ArrowDown') { this.select((this.sel + 1) % n); e.preventDefault(); }
      else if (e.code === 'ArrowUp') { this.select((this.sel + n - 1) % n); e.preventDefault(); }
      else if (e.code === 'Enter' || e.code === 'NumpadEnter') { const b = this.btns()[this.sel]; if (b) this.run(b.dataset.act); }
      else if (/^Digit[1-5]$/.test(e.code)) { const b = this.btns()[+e.code[5]]; if (b) this.run(b.dataset.act); }
    });
    setInterval(() => { this.tipI = (this.tipI + 1) % this.tips.length; if (g.fsm.is('MENU')) this.setText('m-tip', this.tips[this.tipI]); }, 7000);
    this.refresh();
  }
  btns() { return document.querySelectorAll ? Array.from(document.querySelectorAll('.nav-btn')) : []; }
  select(i) { if (i < 0) return; this.sel = i; this.btns().forEach((b, k) => b.classList.toggle('sel', k === i)); }
  run(a) {
    const g = this.g; g.audio.resume(); g.audio.play('click');
    if (a === 'play') g.start(); else if (a === 'ship') g.ui.open(g.shopUI, 'sell'); else if (a === 'equip') g.ui.open(g.shopUI, 'equip');
    else if (a === 'pet') g.ui.open(g.petUI); else if (a === 'codex') g.ui.open(g.codexUI); else if (a === 'settings') g.ui.open(g.settingsUI);
  }
  setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }
  show() { this.el.classList.remove('hidden'); this.refresh(); }
  hide() { this.el.classList.add('hidden'); }
  refresh() {
    const g = this.g, s = g.state, st = g.stats, pc = Math.min(100, Math.floor(s.xp / st.xpNeeded() * 100));
    this.setText('play-label', s.stats.collected > 0 || s.level > 1 ? 'CONTINUAR' : 'JOGAR');
    this.setText('m-name', (g.crazy && g.crazy.user && g.crazy.user.username) || 'Minerador'); this.setText('m-lvl', s.level); this.setText('m-xp', `${fmt(s.xp)} / ${fmt(st.xpNeeded())} XP`); this.setText('m-credits', `💰 ${fmt(s.credits)}`);
    const ring = document.getElementById('m-ring'); if (ring) ring.style.background = `conic-gradient(#35d0ff ${pc}%, rgba(255,255,255,.12) 0)`;
    this.setText('m-bag', `${g.inventory.count}/${g.inventory.capacity}`); this.setText('m-depth', s.stats.maxDepth > 0 ? `${s.stats.maxDepth} · ${g.planet.layers[s.stats.maxDepth].name}` : 'Superfície');
    this.setText('m-ach', `${g.achievements.count()}/${ACHIEVEMENTS.length}`); this.setText('m-combo', `x${s.stats.bestCombo}`);
    const p = g.pet, names = ['Bolt Mk.I', 'Bolt Mk.II', 'Bolt Mk.III', 'Bolt Ômega'];
    this.setText('m-pet-ico', ['🤖', '🛸', '🚀', '👑'][p.stage]); this.setText('m-pet-name', names[p.stage]); this.setText('m-pet-sub', `Nível ${p.level} · +${Math.round(p.sellBonus * 100)}% nas vendas`);
    const px = document.getElementById('m-pet-xp'); if (px) px.style.width = (p.level >= 10 ? 100 : Math.floor(s.pet.xp / p.xpNeed * 100)) + '%';
    this.setText('m-tip', this.tips[this.tipI]);
  }
};
