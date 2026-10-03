export const UIManager = class {
  constructor(g) {
    this.g = g; this.comp = null; this.tab = null; this.back = null; this.$ = id => document.getElementById(id);
    this.$('panel-close').onclick = () => this.close();
    this.$('panel').addEventListener('click', e => {
      if (e.target.id === 'panel') return this.close();
      const b = e.target.closest('[data-act]'); if (!b || !this.comp || b.disabled) return;
      g.audio.resume(); g.audio.play('click');
      let r; if (b.dataset.act === 'tab') this.tab = b.dataset.tab; else r = this.comp.act(b.dataset.act, b.dataset);
      this.refresh(); if (r && typeof r.then === 'function') r.then(() => this.refresh());
    });
    this.$('panel').addEventListener('input', e => { if (this.comp && this.comp.onInput) this.comp.onInput(e.target); });
  }
  get panelOpen() { return !this.$('panel').classList.contains('hidden'); }
  open(comp, tab, back) { if (this.g.input) this.g.input.unlock(); this.comp = comp; this.back = back || null; this.tab = tab || (comp.tabs && comp.tabs[0].id) || null; this.$('panel').classList.remove('hidden'); this.refresh(); }
  closeAll() { this.comp = null; this.back = null; this.$('panel').classList.add('hidden'); }
  close() {
    const c = this.comp, back = this.back; this.closeAll(); this.g.save(); this.g.menu.refresh();
    if (back) this.open(back); else if (c && c.onClose) c.onClose();
  }
  refresh() {
    const c = this.comp; if (!c) return;
    this.$('panel-title').textContent = c.title;
    this.$('panel-tabs').innerHTML = (c.tabs || []).map(t => `<button class="tab ${t.id === this.tab ? 'on' : ''}" data-act="tab" data-tab="${t.id}">${t.label}</button>`).join('');
    this.$('panel-body').innerHTML = c.render(this.tab);
  }
  toast(msg, kind = '') {
    const box = this.$('toasts'), d = document.createElement('div'); d.className = 'toast ' + kind; d.textContent = msg; box.appendChild(d);
    while (box.children.length > 5) box.removeChild(box.firstChild);
    setTimeout(() => d.remove(), 3200);
  }
  banner(text, color) {
    const b = this.$('banner'); b.textContent = text; b.style.color = color || '#fff'; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  }
};
