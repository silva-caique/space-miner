// Tela de carregamento com progresso real, dividida em etapas.
const nextFrame = () => new Promise(r => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => setTimeout(r, 0)) : setTimeout(r, 0)));
export class Loader {
  constructor() { this.steps = []; this.$ = id => document.getElementById(id); }
  add(label, weight, fn, fatal = false) { this.steps.push({ label, weight, fn, fatal }); return this; }
  show(pct, label) {
    const f = this.$('load-fill'), p = this.$('load-pct'), l = this.$('load-step');
    if (f) f.style.width = Math.round(pct * 100) + '%'; if (p) p.textContent = Math.round(pct * 100) + '%'; if (l && label) l.textContent = label;
  }
  async run() {
    const total = this.steps.reduce((a, s) => a + s.weight, 0); let done = 0;
    for (const s of this.steps) {
      this.show(done / total, s.label + '...'); await nextFrame();
      try { await s.fn(); } catch (e) { console.error(`[Loader] ${s.label}`, e); if (s.fatal) { this.fail(s.label, e); throw e; } }
      done += s.weight; this.show(done / total, s.label);
    }
    this.show(1, 'Pronto');
  }
  fail(step, e) {
    const box = this.$('load-error'); if (!box) return;
    const local = typeof location !== 'undefined' && location.protocol === 'file:';
    box.classList.remove('hidden');
    box.innerHTML = `<b>Não foi possível iniciar (${step}).</b><p>${local ? 'Você abriu o arquivo direto do disco. Este jogo precisa de um servidor local: dê duplo clique em <code>iniciar-servidor.bat</code> (Windows) ou rode <code>./iniciar-servidor.sh</code> e abra <code>http://localhost:8000</code>. Detalhes no README.' : 'Recarregue a página. Se o erro continuar, veja o console do navegador (F12).'}</p><pre>${String(e && e.message || e)}</pre>`;
  }
  hide() { const el = this.$('loading'); if (el) el.classList.add('done'); setTimeout(() => el && el.classList.add('hidden'), 600); }
}
