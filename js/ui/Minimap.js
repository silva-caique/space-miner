import { RARITY, RARITY_ORDER } from '../mining/Resource.js';
export const Minimap = class {
  constructor(g) { this.g = g; this.c = document.getElementById('minimap'); this.x = this.c.getContext('2d'); this.S = this.c.width; this.range = 55; }
  update(t) {
    const g = this.g, x = this.x, S = this.S, C = S / 2, R = C - 4, P = g.player.pos, yaw = g.controller.camYaw;
    const rx = Math.cos(yaw), rz = -Math.sin(yaw), fx = -Math.sin(yaw), fz = -Math.cos(yaw), sc = R / this.range;
    x.clearRect(0, 0, S, S); x.save();
    x.beginPath(); x.arc(C, C, R, 0, 6.283); x.fillStyle = 'rgba(10,8,40,0.7)'; x.fill(); x.clip();
    x.strokeStyle = 'rgba(120,200,255,0.2)'; x.lineWidth = 1;
    for (const k of [0.33, 0.66]) { x.beginPath(); x.arc(C, C, R * k, 0, 6.283); x.stroke(); }
    const proj = (wx, wz) => { const dx = wx - P.x, dz = wz - P.z; return [C + (dx * rx + dz * rz) * sc, C - (dx * fx + dz * fz) * sc]; };
    const mark = (wx, wz, col, r, edge, ring) => {
      let [sx, sy] = proj(wx, wz); const dx = sx - C, dy = sy - C, d = Math.hypot(dx, dy);
      if (d > R - 6) { if (!edge) return; sx = C + dx / d * (R - 8); sy = C + dy / d * (R - 8); r *= 0.85; }
      x.beginPath(); x.arc(sx, sy, r, 0, 6.283);
      if (ring) { x.lineWidth = 3; x.strokeStyle = col; x.stroke(); } else { x.fillStyle = col; x.fill(); x.lineWidth = 1.5; x.strokeStyle = '#120a2a'; x.stroke(); }
    };
    for (const z of g.hazards.zones) { const [sx, sy] = proj(z.x, z.z); x.beginPath(); x.arc(sx, sy, z.r * sc, 0, 6.283); x.fillStyle = 'rgba(100,255,70,0.25)'; x.fill(); }
    for (const r of g.resources.list) {
      const rank = RARITY_ORDER.indexOf(r.def.rarity); if (r.hidden && !(r.ping > 0)) continue; if (rank < 2 && !(r.ping > 0)) continue;
      const pulse = rank >= 4 ? 1 + 0.3 * Math.sin(t * 6) : 1;
      mark(r.mesh.position.x, r.mesh.position.z, RARITY[r.def.rarity].css, (rank >= 4 ? 5 : 3.5) * pulse, rank >= 4, false);
      if (r.ping > 0) mark(r.mesh.position.x, r.mesh.position.z, '#7fefff', 6.5, false, true);
    }
    for (const v of g.resources.veins) { mark(v.x, v.z, '#ffd54a', 6, true, false); mark(v.x, v.z, '#ffd54a', 10, true, true); }
    for (const c of g.chests.list) {
      if (c.opened) continue; let [sx, sy] = proj(c.group.position.x, c.group.position.z); const dx = sx - C, dy = sy - C, d = Math.hypot(dx, dy);
      if (d > R - 8) { if (!(c.ping > 0)) continue; sx = C + dx / d * (R - 9); sy = C + dy / d * (R - 9); }
      x.fillStyle = c.tier.css; x.fillRect(sx - 4, sy - 4, 8, 8); x.lineWidth = 1.5; x.strokeStyle = '#120a2a'; x.strokeRect(sx - 4, sy - 4, 8, 8);
    }
    for (const e of g.enemies.list) mark(e.mesh.position.x, e.mesh.position.z, e.def.boss ? '#ff2a2a' : e.ai.aware ? '#ff3355' : e.hostile ? '#ffb02e' : '#7dff8a', e.def.boss ? 6 : Math.min(5, 1.8 + e.size), !!e.def.boss, false);
    const pl = g.planet;
    if (g.layer === 0) mark(0, 0, '#35d0ff', 6, true, false);
    if (pl.portalDown) mark(pl.portalDown.x, pl.portalDown.z, '#35d0ff', 5, true, true);
    if (pl.portalUp) mark(pl.portalUp.x, pl.portalUp.z, '#ffb02e', 5, true, true);
    x.restore();
    x.beginPath(); x.arc(C, C, R, 0, 6.283); x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,0.7)'; x.stroke();
    const py = g.player.yaw, hx = Math.sin(py), hz = Math.cos(py), ang = Math.atan2(hx * rx + hz * rz, hx * fx + hz * fz);
    x.save(); x.translate(C, C); x.rotate(ang); x.beginPath(); x.moveTo(0, -7); x.lineTo(5, 6); x.lineTo(-5, 6); x.closePath(); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 1.5; x.strokeStyle = '#120a2a'; x.stroke(); x.restore();
    if (g.layer === 0) { const d = Math.round(Math.hypot(P.x, P.z)); x.fillStyle = '#9fe8ff'; x.font = 'bold 11px sans-serif'; x.textAlign = 'center'; x.fillText('🚀 ' + d + 'm', C, S - 8); }
  }
};
