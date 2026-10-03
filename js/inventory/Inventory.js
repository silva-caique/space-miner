export const Inventory = class {
  constructor(g) { this.g = g; }
  get items() { return this.g.state.inventory; }
  get count() { let n = 0; for (const k in this.items) n += this.items[k]; return n; }
  get capacity() { return this.g.stats.capacity; }
  get free() { return this.capacity - this.count; }
  add(id, n = 1) { if (this.count + n > this.capacity) return false; this.items[id] = (this.items[id] || 0) + n; return true; }
  clear() { this.g.state.inventory = {}; }
};
