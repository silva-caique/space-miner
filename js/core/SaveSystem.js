SM.SaveSystem = {
  KEY: 'spaceMiner_save_v1',
  save(state) { try { localStorage.setItem(this.KEY, JSON.stringify(state)); return true; } catch (e) { return false; } },
  load() { try { const r = localStorage.getItem(this.KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } },
  wipe() { try { localStorage.removeItem(this.KEY); } catch (e) {} }
};
