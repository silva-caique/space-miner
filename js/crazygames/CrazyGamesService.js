// Única camada que fala com o CrazyGames SDK v3. Sem o SDK (desenvolvimento local), tudo cai em um modo local seguro.
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
export class CrazyGamesService {
  constructor() { this.sdk = null; this.available = false; this.playing = false; this.loading = false; this.env = 'local'; this.debug = true; this.user = null; this.muteListeners = []; }
  log(...a) { if (this.debug) console.log('[CrazyGames]', ...a); }
  get muteAudio() {
    try { return !!(this.sdk && this.sdk.game && this.sdk.game.settings && this.sdk.game.settings.muteAudio) || (typeof location !== 'undefined' && /[?&]muteAudio=true/.test(location.search)); } catch (e) { return false; }
  }
  async init(timeoutMs = 4000) {
    const cg = typeof window !== 'undefined' ? window.CrazyGames : null;
    if (!cg || !cg.SDK) { this.log('SDK indisponível, usando modo local'); return false; }
    try {
      await withTimeout(Promise.resolve(cg.SDK.init()), timeoutMs);
      this.sdk = cg.SDK; this.available = true; this.env = cg.SDK.environment || 'crazygames';
      this.log('SDK iniciado, ambiente:', this.env);
      try { if (this.sdk.user && typeof this.sdk.user.getUser === 'function') this.user = await withTimeout(Promise.resolve(this.sdk.user.getUser()), 2500); } catch (e) { this.user = null; }
      const g = this.sdk.game; if (g && typeof g.addSettingsChangeListener === 'function') g.addSettingsChangeListener(() => this.muteListeners.forEach(f => f(this.muteAudio)));
    } catch (e) { this.log('Falha ao iniciar o SDK, usando modo local:', e && e.message); this.sdk = null; this.available = false; }
    return this.available;
  }
  safe(fn) { try { const r = fn(); if (r && typeof r.catch === 'function') r.catch(e => this.log('erro', e)); } catch (e) { this.log('erro', e && e.message); } }
  loadingStart() { if (this.loading) return; this.loading = true; this.log('loadingStart'); if (this.available) this.safe(() => this.sdk.game.loadingStart()); }
  loadingStop() { if (!this.loading) return; this.loading = false; this.log('loadingStop'); if (this.available) this.safe(() => this.sdk.game.loadingStop()); }
  // Idempotente: só chama o SDK quando o estado realmente muda
  setPlaying(want) {
    if (want === this.playing) return; this.playing = want; this.log(want ? 'gameplayStart' : 'gameplayStop');
    if (this.available) this.safe(() => (want ? this.sdk.game.gameplayStart() : this.sdk.game.gameplayStop()));
  }
  happytime() { if (this.available) this.safe(() => this.sdk.game.happytime()); }
  async hasAdblock() { try { return this.available && this.sdk.ad && typeof this.sdk.ad.hasAdblock === 'function' ? !!(await this.sdk.ad.hasAdblock()) : false; } catch (e) { return false; } }
  // Resolve { ok, reason }. Em modo local usa "simulate" (anúncio de teste) se fornecido.
  requestAd(type, simulate) {
    return new Promise(resolve => {
      let settled = false; const done = r => { if (!settled) { settled = true; clearTimeout(tm); resolve(r); } };
      const tm = setTimeout(() => done({ ok: false, reason: 'timeout' }), 180000);
      if (!this.available || !this.sdk.ad) { Promise.resolve(simulate ? simulate(type) : { ok: false, reason: 'no-sdk' }).then(done, () => done({ ok: false, reason: 'error' })); return; }
      try {
        this.sdk.ad.requestAd(type, { adStarted: () => this.log('adStarted', type), adFinished: () => done({ ok: true }), adError: e => done({ ok: false, reason: (e && (e.code || e.reason)) || 'error' }) });
      } catch (e) { done({ ok: false, reason: 'exception' }); }
    });
  }
  requestBanner(id, width, height) { if (this.available && this.sdk.banner) this.safe(() => this.sdk.banner.requestBanner({ id, width, height })); }
  clearAllBanners() { if (this.available && this.sdk.banner) this.safe(() => this.sdk.banner.clearAllBanners()); }
  get data() { return this.available && this.sdk.data ? this.sdk.data : null; }
}
