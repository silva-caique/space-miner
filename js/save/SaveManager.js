// Único ponto de salvamento: LocalStorage (imediato) + CrazyGames Data (com intervalo mínimo). Usa o mais recente ao carregar.
import { LocalSave } from './LocalSave.js';
import { CrazyGamesSave } from '../crazygames/CrazyGamesSave.js';
export class SaveManager {
  constructor(service) { this.cloud = new CrazyGamesSave(service); this.state = null; this.timer = null; this.lastLocal = 0; this.lastCloud = 0; this.cloudGap = 10000; }
  wrap(state) { return { v: 2, savedAt: Date.now(), data: state.toJSON ? state.toJSON() : state }; }
  unwrap(o) { return o ? (o.data && o.v ? o : { v: 1, savedAt: 0, data: o }) : null; }
  async load() {
    const a = this.unwrap(LocalSave.read()), b = this.unwrap(await this.cloud.read());
    const best = a && b ? (b.savedAt > a.savedAt ? b : a) : (a || b);
    return best ? best.data : null;
  }
  request(state) {
    this.state = state; const now = Date.now();
    if (now - this.lastLocal >= 1000) this.flush(false);
    else if (!this.timer) this.timer = setTimeout(() => { this.timer = null; this.flush(false); }, 1000);
  }
  flush(force = true) {
    if (!this.state) return; const now = Date.now(), payload = this.wrap(this.state);
    LocalSave.write(payload); this.lastLocal = now;
    if (force || now - this.lastCloud >= this.cloudGap) { this.lastCloud = now; this.cloud.write(payload); }
  }
  wipe() { this.state = null; if (this.timer) { clearTimeout(this.timer); this.timer = null; } LocalSave.wipe(); this.cloud.wipe(); }
}
