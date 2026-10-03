// Regras de anúncios: intersticial só em pausas naturais (menu, game over) e com intervalo mínimo; recompensado só por escolha do jogador.
export class AdManager {
  constructor(game) {
    this.g = game; this.busy = false; this.minGapMs = 180000; this.minPlaySec = 120; this.lastAt = performance.now(); this.lastPlay = 0; this.simDelay = 3000;
  }
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
    if (type !== 'rewarded') return Promise.resolve({ ok: false, reason: 'dev' });
    const el = document.getElementById('adshield'), cnt = document.getElementById('adcount'); if (el) el.classList.remove('hidden');
    let s = Math.ceil(this.simDelay / 1000); if (cnt) cnt.textContent = s;
    return new Promise(res => {
      const iv = setInterval(() => { s--; if (cnt) cnt.textContent = s; if (s <= 0) { clearInterval(iv); if (el) el.classList.add('hidden'); res({ ok: true, simulated: true }); } }, 1000);
    });
  }
}
