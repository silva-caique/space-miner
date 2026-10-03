// Regras de anúncios: intersticial só em pausas naturais (menu, game over) e com intervalo mínimo; recompensado só por escolha do jogador.
export class AdManager {
  constructor(game) {
    this.g = game; this.busy = false; this.minGapMs = 180000; this.minPlaySec = 120; this.lastAt = performance.now(); this.lastPlay = 0; this.simDelay = 3000; this.bannerAt = {};
  }
  // Anúncio de teste só em ambiente local, GitHub Pages ou com ?testads. No CrazyGames de verdade, sem SDK não há recompensa.
  get devMode() { const l = typeof location !== 'undefined' ? location : { hostname: '', search: '' }; return /^(localhost|127\.0\.0\.1|)$/.test(l.hostname) || /github\.io$/.test(l.hostname) || /[?&]testads/.test(l.search || ''); }
  get service() { return this.g.crazy; }
  canInterstitial() {
    if (this.busy || this.g.adActive) return false;
    return performance.now() - this.lastAt >= this.minGapMs && this.g.state.playtime - this.lastPlay >= this.minPlaySec;
  }
  async interstitial(reason) {
    if (!this.canInterstitial()) return false;
    this.service.log('intersticial:', reason); await this.run('midgame'); return true;
  }
  // Devolve true apenas se o anúncio foi concluído (e a recompensa deve ser entregue)
  async rewarded() {
    if (this.busy) return false;
    const r = await this.run('rewarded');
    if (!r.ok) this.g.ui.toast(r.reason === 'unfilled' ? '📺 Nenhum anúncio disponível agora. Tente de novo em instantes.' : '📺 Não foi possível exibir o anúncio.', 'warn');
    return r.ok;
  }
  async run(type) {
    this.busy = true; this.g.adStart();
    let r; try { r = await this.service.requestAd(type, t => this.simulate(t)); } catch (e) { r = { ok: false, reason: 'error' }; }
    this.busy = false; this.g.adEnd(); this.lastAt = performance.now(); this.lastPlay = this.g.state.playtime; return r;
  }
  // Modo local: anúncio de teste para validar o fluxo sem o SDK
  simulate(type) {
    if (type !== 'rewarded' || !this.devMode) return Promise.resolve({ ok: false, reason: 'no-sdk' });
    const el = document.getElementById('adshield'), cnt = document.getElementById('adcount'); if (el) el.classList.remove('hidden');
    let s = Math.ceil(this.simDelay / 1000); if (cnt) cnt.textContent = s;
    return new Promise(res => {
      const iv = setInterval(() => { s--; if (cnt) cnt.textContent = s; if (s <= 0) { clearInterval(iv); if (el) el.classList.add('hidden'); res({ ok: true, simulated: true }); } }, 1000);
    });
  }

  // Banners: 300x250 no menu principal e 728x90 na tela de game over. Nunca durante a partida.
  showBanner(where) {
    const cfg = where === 'menu' ? { id: 'banner-menu', w: 300, h: 250, minW: 900, other: 'banner-go' } : { id: 'banner-go', w: 728, h: 90, minW: 760, other: 'banner-menu' };
    const el = document.getElementById(cfg.id), other = document.getElementById(cfg.other); if (other) other.classList.add('hidden'); if (!el) return;
    if (window.innerWidth < cfg.minW || window.innerHeight < 640) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    if (!this.service.available) { if (this.devMode) { el.textContent = `ANÚNCIO ${cfg.w}×${cfg.h} (teste local)`; el.classList.add('dev'); } return; }
    // O portal só aceita nova requisição do mesmo banner depois de ~60 s: se ainda não deu o tempo, agenda para quando der
    const wait = Math.max(0, 61000 - (performance.now() - (this.bannerAt[cfg.id] || -1e9))); clearTimeout(this.bannerTimer);
    const go = () => { const st = this.g.fsm.state; if ((where === 'menu' && st !== 'MENU') || (where === 'gameover' && st !== 'GAME_OVER')) return; this.bannerAt[cfg.id] = performance.now(); this.service.requestBanner(cfg.id, cfg.w, cfg.h); };
    if (wait > 0) this.bannerTimer = setTimeout(go, wait); else go();
  }
  hideBanners() {
    for (const id of ['banner-menu', 'banner-go']) { const el = document.getElementById(id); if (el) el.classList.add('hidden'); }
    clearTimeout(this.bannerTimer); if (this.service.available) this.service.clearAllBanners();
  }
}
