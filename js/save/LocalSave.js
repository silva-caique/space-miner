export const LocalSave = {
  KEY: 'spaceMiner_save_v2', OLD: 'spaceMiner_save_v1',
  read() { try { const r = localStorage.getItem(this.KEY) || localStorage.getItem(this.OLD); return r ? JSON.parse(r) : null; } catch (e) { return null; } },
  write(obj) { try { localStorage.setItem(this.KEY, JSON.stringify(obj)); return true; } catch (e) { return false; } },
  wipe() { try { localStorage.removeItem(this.KEY); localStorage.removeItem(this.OLD); } catch (e) { /* ignora */ } }
};
