import * as THREE from '../lib/three/build/three.module.js';
import { CRIT } from './WeaponManager.js';
// Aplica dano aos inimigos: crítico, marcação do mascote, feedback (hit marker, números, som)
export class DamageSystem {
  constructor(g) { this.g = g; this.tmp = new THREE.Vector3(); }
  roll(base) { const crit = Math.random() < CRIT.chance; return { dmg: base * (crit ? CRIT.mult : 1), crit }; }
  hit(e, base, crit, from) {
    const g = this.g; if (!g.enemies.list.includes(e)) return false;
    const dmg = Math.max(1, Math.round(base * (e.marked > 0 ? 1.15 : 1)));
    g.enemies.damage(e, dmg, from); const killed = !g.enemies.list.includes(e);
    g.state.stats.hits++; g.hud.hitmarker(killed); g.hud.damageNumber(e.center(this.tmp), dmg, crit, killed); g.audio.play(killed ? 'kill' : 'hitmark');
    return killed;
  }
}
