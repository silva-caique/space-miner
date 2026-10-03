export const PauseMenu = class {
  constructor(g) { this.g = g; this.title = '⏸ PAUSADO'; }
  render() {
    return `<div class="stack"><button class="btn big primary" data-act="resume">▶ CONTINUAR</button><button class="btn big" data-act="settings">⚙️ CONFIGURAÇÕES</button><button class="btn big" data-act="menu">🏠 MENU PRINCIPAL</button></div><p class="muted">Dica: pressione Esc para continuar.</p>`;
  }
  act(a) { const g = this.g; if (a === 'resume') g.resume(); else if (a === 'settings') g.ui.open(g.settingsUI, null, this); else if (a === 'menu') g.toMenu(); }
  onClose() { this.g.resume(); }
};
