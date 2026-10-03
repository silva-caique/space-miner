export const SettingsUI = class {
  constructor(g) { this.g = g; this.title = '⚙️ Configurações'; this.confirm = false; }
  render() {
    const s = this.g.state.settings;
    const sl = (icon, label, key, min, max) => `<label class="sl"><span>${icon} ${label}</span><input type="range" min="${min}" max="${max}" value="${Math.round(s[key] * 100)}" data-set="${key}"><output>${Math.round(s[key] * 100)}%</output></label>`;
    const preset = (id, l) => `<button class="btn seg ${s.quality === id ? 'on' : ''}" data-act="preset" data-v="${id}">${l}</button>`;
    const tog = (k, l) => `<button class="btn seg ${s[k] ? 'on' : ''}" data-act="toggle" data-k="${k}">${l}: ${s[k] ? 'LIGADO' : 'DESLIGADO'}</button>`;
    return `<h3>Áudio</h3>${sl('🔈', 'Volume geral', 'volume', 0, 100)}${sl('🎵', 'Música', 'music', 0, 100)}${sl('🔊', 'Efeitos', 'sfx', 0, 100)}
      <h3>Gráficos <small class="muted">${s.quality === 'custom' ? '(personalizado)' : ''}</small></h3>
      <div class="segs">${preset('low', 'BAIXO')}${preset('medium', 'MÉDIO')}${preset('high', 'ALTO')}</div>
      <div class="segs">${tog('shadows', 'Sombras')}${tog('bloom', 'Brilho (bloom)')}</div>
      ${sl('✨', 'Partículas', 'particles', 20, 100)}${sl('🔭', 'Distância de renderização', 'drawDist', 50, 100)}
      <h3>Controles</h3>${sl('🖱️', 'Sensibilidade da câmera', 'sensitivity', 50, 200)}
      <p class="muted">O progresso é salvo automaticamente.</p>` +
      (this.confirm ? `<p class="warn">Isso apaga TODO o seu progresso. Tem certeza?</p><button class="btn danger" data-act="wipe">SIM, APAGAR TUDO</button> <button class="btn" data-act="cancel">Cancelar</button>` : `<button class="btn danger" data-act="ask">NOVO JOGO</button>`);
  }
  onInput(el) {
    const k = el.dataset && el.dataset.set; if (!k) return; const g = this.g, s = g.state.settings, v = el.value / 100;
    s[k] = v; if (el.nextElementSibling) el.nextElementSibling.textContent = el.value + '%';
    if (k === 'music') g.audio.setMusicVolume(v); else if (k === 'volume') g.audio.refresh();
    else if (k === 'particles' || k === 'drawDist') { s.quality = 'custom'; g.perf.apply(); }
    g.save();
  }
  act(a, d) {
    const g = this.g, s = g.state.settings;
    if (a === 'preset') g.perf.setPreset(d.v);
    else if (a === 'toggle') { s[d.k] = !s[d.k]; s.quality = 'custom'; g.perf.apply(); }
    else if (a === 'ask') this.confirm = true; else if (a === 'cancel') this.confirm = false;
    else if (a === 'wipe') { this.confirm = false; g.newGame(); }
    g.save();
  }
};
