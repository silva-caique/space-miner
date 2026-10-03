// Posiciona os grupos iniciais da camada e repõe criaturas derrotadas longe da vista do jogador.
export class EnemySpawner {
  constructor(m) { this.m = m; this.q = []; this.L = null; }
  reset(L) { this.q = []; this.L = L; }
  pos(minDist) {
    const m = this.m, P = m.g.player.pos;
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * 6.283, d = 15 + Math.random() * 58, x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (m.planet.blocked(x, z) || Math.hypot(x - P.x, z - P.z) < minDist) continue; return { x, z };
    }
    return null;
  }
  initial(L) { for (const grp of L.enemies) for (let i = 0; i < grp.n; i++) { const p = this.pos(14) || { x: 30, z: 30 }; this.m.create(grp.t, p.x, p.z); } }
  schedule(type, delay) { this.q.push({ type, t: delay }); }
  update(dt) {
    for (let i = this.q.length - 1; i >= 0; i--) {
      const s = this.q[i]; s.t -= dt; if (s.t > 0) continue;
      const p = this.pos(40); if (p) { this.m.create(s.type, p.x, p.z); this.q.splice(i, 1); } else s.t = 5;
    }
  }
}
