// Presets de qualidade, aplicação ao vivo das opções gráficas e rebaixamento automático quando o FPS cai.
import * as THREE from '../lib/three/build/three.module.js';
export const PRESETS = {
  low: { shadows: false, bloom: false, particles: 0.5, drawDist: 0.6, pixelRatio: 1 },
  medium: { shadows: true, bloom: false, particles: 0.8, drawDist: 0.8, pixelRatio: 1.25 },
  high: { shadows: true, bloom: true, particles: 1, drawDist: 1, pixelRatio: 1.5 }
};
export class PerformanceManager {
  constructor(game) { this.debug = false; this.g = game; this.fxOn = null; this.acc = 0; this.frames = 0; this.fps = 60; this.lowSecs = 0; this.cool = 0; }
  get s() { return this.g.state.settings; }
  setPreset(name) { Object.assign(this.s, PRESETS[name], { quality: name }); this.apply(); }
  refreshMaterials() { this.g.scene.traverse(o => { const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => { x.needsUpdate = true; }); }); }
  apply() {
    const g = this.g, s = this.s;
    g.renderer.setPixelRatio(Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, s.pixelRatio)); g.resize();
    if (g.renderer.shadowMap.enabled !== !!s.shadows) { g.renderer.shadowMap.enabled = !!s.shadows; g.sun.castShadow = !!s.shadows; this.refreshMaterials(); }
    const wantFx = !!g.fx && !!s.bloom;
    if (this.fxOn !== wantFx) { this.fxOn = wantFx; g.renderer.toneMapping = wantFx ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping; this.refreshMaterials(); }
    g.particles.density = Math.max(0.2, s.particles); g.fogScale = s.drawDist; g.applyFog();
  }
  toggleDebug() { this.debug = !this.debug; const el = document.getElementById('debug'); if (el) el.classList.toggle('hidden', !this.debug); this.updateDebug(); }
  updateDebug() {
    if (!this.debug) return; const g = this.g, el = document.getElementById('debug'), r = g.renderer.info; if (!el || !r) return;
    const act = g.enemies.list.filter(e => e.mesh.visible).length, mem = typeof performance !== 'undefined' && performance.memory ? ` | memória ${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB` : '';
    el.textContent = `FPS ${Math.round(this.fps)} | chamadas ${r.render.calls} | triângulos ${r.render.triangles} | geometrias ${r.memory.geometries} | texturas ${r.memory.textures} | criaturas ativas ${act}/${g.enemies.list.length} | qualidade ${this.s.quality}${mem}`;
  }
  get useFx() { return !!this.g.fx && this.fxOn; }
  tick(dt) {
    this.cool -= dt; this.acc += dt; this.frames++;
    if (this.acc < 1) return;
    this.fps = this.frames / this.acc; this.acc = 0; this.frames = 0; this.updateDebug();
    if (!this.g.fsm.is('GAMEPLAY') || this.g.adActive || (typeof document !== 'undefined' && document.hidden)) { this.lowSecs = 0; return; }
    this.lowSecs = this.fps < 28 ? this.lowSecs + 1 : 0;
    if (this.lowSecs >= 5 && this.cool <= 0 && this.s.quality !== 'low') {
      const next = this.s.quality === 'high' ? 'medium' : 'low'; this.lowSecs = 0; this.cool = 20;
      this.setPreset(next); this.g.ui.toast(`⚙️ Gráficos ajustados para ${next === 'medium' ? 'MÉDIO' : 'BAIXO'} para melhorar o desempenho.`, 'warn');
    }
  }
}
