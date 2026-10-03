// Save na nuvem via módulo "data" do SDK (quando disponível). Nunca lança erro.
const KEY = 'spaceMiner_save_v2';
export class CrazyGamesSave {
  constructor(service) { this.service = service; }
  get ok() { return !!this.service.data; }
  async read() { try { if (!this.ok) return null; const v = await this.service.data.getItem(KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  async write(obj) { try { if (!this.ok) return false; await this.service.data.setItem(KEY, JSON.stringify(obj)); return true; } catch (e) { return false; } }
  async wipe() { try { if (this.ok) await this.service.data.removeItem(KEY); } catch (e) { /* ignora */ } }
}
