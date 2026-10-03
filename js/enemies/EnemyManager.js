import * as THREE from '../lib/three/build/three.module.js';
import { Toon, lin } from '../core/Toon.js';
import { Enemy, ENEMIES } from './Enemy.js';
import { EnemySpawner } from './EnemySpawner.js';
import { RESOURCES } from '../mining/Resource.js';
export const EnemyManager = class {
  constructor(g) { this.g = g; this.list = []; this.dying = []; this.proj = []; this.boss = null; this.noise = 1; this.threat = 0; this.calling = false; this.growlAt = 0; this.tmp = new THREE.Vector3(); this.spawner = new EnemySpawner(this); }
  spawn(L, group, planet) {
    this.group = group; this.planet = planet; this.list = []; this.dying = []; this.proj = []; this.boss = null; this.threat = 0; this.spawner.reset(L); this.spawner.initial(L);
  }
  create(type, x, z) {
    const def = ENEMIES[type]; if (!def) return null;
    const en = new Enemy(def, x, z, this.planet, this); this.group.add(en.mesh); Toon.shadows(en.mesh); this.list.push(en); if (def.boss) this.boss = en; return en;
  }
  spawnNear(type, x, z) { const a = Math.random() * 6.283, d = 4 + Math.random() * 3; return this.create(type, x + Math.cos(a) * d, z + Math.sin(a) * d); }
  separation(e) {
    let sx = 0, sz = 0; const p = e.mesh.position;
    for (const o of this.list) { if (o === e) continue; const dx = p.x - o.mesh.position.x, dz = p.z - o.mesh.position.z, r = (e.size + o.size) * 1.1, d2 = dx * dx + dz * dz; if (d2 < r * r && d2 > 1e-4) { const d = Math.sqrt(d2), w = (r - d) / r; sx += dx / d * w; sz += dz / d * w; } }
    return { x: sx, z: sz };
  }
  // Um grito de alerta chama os aliados próximos (matilha)
  callAllies(src, r) {
    if (this.calling) return; this.calling = true;
    for (const o of this.list) {
      if (o === src || !o.hostile || (o.ai.state !== 'IDLE' && o.ai.state !== 'PATROL')) continue;
      if (Math.hypot(o.mesh.position.x - src.mesh.position.x, o.mesh.position.z - src.mesh.position.z) <= r) { o.ai.last.copy(src.ai.last); o.ai.set('ALERT', o.alertT + 0.15 + Math.random() * 0.3); }
    }
    this.calling = false;
  }
  growl(e) {
    const P = this.g.player.pos, p = e.mesh.position, n = performance.now(); if (n < this.growlAt || Math.hypot(P.x - p.x, P.z - p.z) > 45) return;
    this.growlAt = n + 250; this.g.audio.play('growl', e.size);
  }
  hitPlayer(e, dmg) {
    const g = this.g, P = g.player.pos, p = e.mesh.position, blocked = g.pcombat.shieldT > 0 || g.pcombat.iframes > 0;
    g.stats.hurt(dmg); g.particles.burst(new THREE.Vector3(P.x, P.y + 1.2, P.z), 0xff3355, 8, 5); g.shake = Math.max(g.shake, Math.min(0.5, 0.1 + dmg * 0.004));
    if (!blocked) { const dx = P.x - p.x, dz = P.z - p.z, l = Math.hypot(dx, dz) || 1; P.x += dx / l * 1.2; P.z += dz / l * 1.2; }
  }
  fireAt(e, ang) {
    const g = this.g, P = g.player.pos, o = e.mesh.position.clone(); o.y += (e.def.center || 1) * e.size * 1.2 + 0.4;
    const dir = new THREE.Vector3(P.x - o.x, P.y + 1.2 - o.y, P.z - o.z).normalize(), c = Math.cos(ang), s = Math.sin(ang), dx = dir.x * c - dir.z * s, dz = dir.x * s + dir.z * c; dir.x = dx; dir.z = dz;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.34 * Math.min(2, 0.5 + e.size * 0.5), 10, 8), Toon.mat(0xc8ff3a, { emissive: 0xc8ff3a, emissiveIntensity: 2 }));
    m.position.copy(o); this.group.add(m); this.proj.push({ m, v: dir.multiplyScalar(14), life: 4, dmg: e.projDamage, e }); g.audio.play('slime');
  }
  slam(e, sp) {
    const g = this.g, p = e.mesh.position, P = g.player.pos, dmg = sp.damage * (e.damage / e.def.dmg);
    for (let i = 0; i < 6; i++) { const a = i * 1.047; g.particles.burst(new THREE.Vector3(p.x + Math.cos(a) * sp.radius * 0.6, p.y + 0.5, p.z + Math.sin(a) * sp.radius * 0.6), 0xff7a2a, 8, 8); }
    g.shake = Math.max(g.shake, Math.min(1, 0.35 + e.size * 0.1)); g.audio.play('rock');
    if (Math.hypot(P.x - p.x, P.z - p.z) < sp.radius && Math.abs(P.y - p.y) < 3.5) this.hitPlayer(e, dmg);
  }
  update(dt) {
    const g = this.g, P = g.player.pos, k = g.input.keys;
    this.noise = g.combat.recent > 2.0 ? 1.5 : (g.player.moving && (k.ShiftLeft || k.ShiftRight)) ? 1.2 : g.player.mining ? 0.9 : 1;
    let threat = 0;
    for (const e of this.list) {
      const p = e.mesh.position, dx = p.x - P.x, dz = p.z - P.z, d2 = dx * dx + dz * dz, lod = (d2 < 2025 || e.ai.aware) ? 0 : d2 < 8100 ? 1 : 2;
      e.mesh.visible = lod < 2;
      if (lod === 0) e.update(dt, g); else if (lod === 1) { e.acc += dt; if (e.acc >= 0.25) { e.update(e.acc, g); e.acc = 0; } }
      if (d2 < 484 && g.codex.discoverCreature(e.def.id)) { g.ui.toast(`📖 Criatura descoberta: ${e.def.name}!`, 'discover'); g.audio.play('discover'); }
      const d = Math.sqrt(d2);
      if (e.ai.aware && e.hostile && d < 28) threat += e.size / (1 + d / 8);
      if (e.size >= 2.2 && e.moving && d < 35) g.shake = Math.max(g.shake, Math.min(0.12, 0.02 * e.size * (1 - d / 35))); // passos pesados
    }
    this.threat += (Math.min(1, threat / 3) - this.threat) * Math.min(1, dt * 3);
    for (let i = this.dying.length - 1; i >= 0; i--) {
      const e = this.dying[i]; e.dyingT += dt; const k2 = e.dyingT / 0.8;
      e.mesh.scale.setScalar(Math.max(0.001, e.size * (1 - k2))); e.mesh.rotation.z += dt * 2.5; e.mesh.position.y -= dt * 0.6;
      if (k2 >= 1) { this.group.remove(e.mesh); e.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && !o.material.map) o.material.dispose(); }); this.dying.splice(i, 1); }
    }
    for (let i = this.proj.length - 1; i >= 0; i--) {
      const q = this.proj[i]; q.life -= dt; q.m.position.addScaledVector(q.v, dt);
      const hit = q.m.position.distanceTo(this.tmp.set(P.x, P.y + 1.2, P.z)) < 1.4, gone = q.life <= 0 || q.m.position.y < this.planet.heightAt(q.m.position.x, q.m.position.z);
      if (hit) this.hitPlayer(q.e, q.dmg);
      if (hit || gone) { g.particles.burst(q.m.position, 0xc8ff3a, 8, 4); this.group.remove(q.m); q.m.geometry.dispose(); q.m.material.dispose(); this.proj.splice(i, 1); }
    }
    this.spawner.update(dt);
  }
  bossDown() {
    const g = this.g, s = g.state;
    s.inventory.corefragment = (s.inventory.corefragment || 0) + 1; s.credits += 4000; s.stats.bosses++;
    g.codex.discoverMineral('corefragment'); g.missions.notify('collect', 'corefragment', 1); g.missions.notify('boss', 'guardian', 1);
    g.ui.banner('👑 GUARDIÃO DERROTADO!', '#ffb62e'); g.ui.toast('Recompensa: Fragmento do Núcleo + 4.000 💰', 'legendary'); g.audio.play('legend'); g.shake = 1;
    this.boss = null; g.crazy.happytime(); g.save();
  }
  damage(e, dmg, from) {
    if (!this.list.includes(e)) return;
    this.g.particles.burst(e.center(this.tmp), e.def.color, 6, 4);
    if (e.takeHit(dmg, from)) this.kill(e);
  }
  kill(e) {
    const g = this.g, i = this.list.indexOf(e); if (i < 0) return; this.list.splice(i, 1);
    e.ai.state = 'DEAD'; e.hideRing(); e.dyingT = 0; this.dying.push(e);
    g.particles.burst(e.center(this.tmp), e.def.color, 30, 8); g.audio.play('growl', e.size * 1.4);
    g.state.stats.kills++; g.stats.addXP(e.def.xp); g.pet.addXP(3); g.missions.notify('kill', e.def.id, 1);
    g.ui.toast(`💥 ${e.def.name} derrotado (+${e.def.xp} XP)`, ''); this.drops(e);
    if (e.def.boss) this.bossDown(); else this.spawner.schedule(e.def.id, 40 + Math.random() * 25);
    g.save();
  }
  drops(e) {
    const g = this.g, L = this.planet.layer, at = e.center(new THREE.Vector3());
    for (const d of (e.def.loot || [])) {
      const R = RESOURCES[d.id]; if (!R || R.minDepth > L || Math.random() > Math.min(1, d.chance * (1 + 0.08 * L))) continue;
      const n = d.min + Math.floor(Math.random() * (d.max - d.min + 1)) + (e.size >= 2.5 ? 1 : 0); for (let i = 0; i < n; i++) g.pickups.spawn(d.id, at);
    }
  }
  pulse(pos, radius, dmg) {
    for (const e of this.list.slice()) { const ep = e.mesh.position; if (Math.hypot(ep.x - pos.x, ep.z - pos.z) <= radius + e.radius) this.damage(e, dmg, pos); }
  }
};
export const HazardManager = class {
  constructor(g) { this.g = g; this.zones = []; this.meteors = []; this.bolts = []; this.kinds = []; this.mt = 6; this.inRad = false; this.k = 0; this.storm = { on: false, t: 50, lt: 2 }; this.L = null; }
  spawn(L, group, planet) {
    this.group = group; this.planet = planet; this.zones = []; this.meteors = []; this.bolts = []; this.kinds = L.hazards || []; this.mt = 6; this.inRad = false; this.k = 0; this.L = L;
    this.storm = { on: false, t: 40 + Math.random() * 30, lt: 2 };
    if (this.kinds.includes('radiation')) for (let i = 0; i < 4; i++) {
      const a = Math.random() * 6.283, d = 20 + Math.random() * 45, x = Math.cos(a) * d, z = Math.sin(a) * d;
      const disc = new THREE.Mesh(new THREE.CircleGeometry(7, 24), new THREE.MeshBasicMaterial({ color: 0x66ff44, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      disc.rotation.x = -Math.PI / 2; disc.position.set(x, planet.heightAt(x, z) + 0.8, z); group.add(disc); this.zones.push({ x, z, r: 7, disc });
    }
  }
  marker(x, z, r, color) {
    const mk = new THREE.Mesh(new THREE.RingGeometry(r - 1, r, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
    mk.rotation.x = -Math.PI / 2; mk.position.set(x, this.planet.heightAt(x, z) + 0.3, z); this.group.add(mk); return mk;
  }
  updateStorm(dt, t) {
    const g = this.g, s = this.storm, P = g.player.pos;
    s.t -= dt;
    if (!s.on && s.t <= 0) { s.on = true; s.t = 28; s.lt = 2; g.ui.banner('🌪️ TEMPESTADE!', '#ffb070'); g.ui.toast('Tempestade! Abrigue-se perto da nave ou desça um portal.', 'warn'); g.audio.play('rock'); }
    else if (s.on && s.t <= 0) { s.on = false; s.t = 60 + Math.random() * 40; g.state.stats.storms++; g.ui.toast('☀️ A tempestade passou.', 'discover'); g.save(); }
    this.k += ((s.on ? 1 : 0) - this.k) * Math.min(1, dt * 0.8);
    if (s.on) {
      s.lt -= dt;
      if (s.lt <= 0) {
        s.lt = 1.6 + Math.random() * 1.6; const x = P.x + (Math.random() - 0.5) * 26, z = P.z + (Math.random() - 0.5) * 26;
        this.bolts.push({ x, z, t: 0, mk: this.marker(x, z, 3.4, 0xffee66) });
      }
    }
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i]; b.t += dt;
      if (b.t >= 1.1 && !b.beam) {
        const y = this.planet.heightAt(b.x, b.z);
        b.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 60, 6), new THREE.MeshBasicMaterial({ color: 0xffffcc, fog: false })); b.beam.position.set(b.x, y + 30, b.z); this.group.add(b.beam);
        g.particles.burst(new THREE.Vector3(b.x, y + 1, b.z), 0xffee66, 30, 9); g.shake = 0.5; g.hud.flash(); g.audio.play('pulse');
        if (g.near !== 'ship' && Math.hypot(P.x - b.x, P.z - b.z) < 3.4) g.stats.hurt(30);
      }
      if (b.t >= 1.3) { this.group.remove(b.mk); if (b.beam) this.group.remove(b.beam); this.bolts.splice(i, 1); }
    }
    const sc = this.g.scene.fog, L = this.L;
    if (sc && L) { sc.near = L.fogNear * g.fogScale * (1 - 0.75 * this.k); sc.far = L.fogFar * g.fogScale * (1 - 0.55 * this.k); sc.color.copy(lin(L.fog)).lerp(lin(0x8a5a3a), this.k * 0.85); g.scene.background = sc.color; }
  }
  update(dt, t) {
    const g = this.g, P = g.player.pos; let rad = false;
    for (const z of this.zones) {
      z.disc.material.opacity = 0.3 + 0.12 * Math.sin(t * 5);
      if (Math.hypot(P.x - z.x, P.z - z.z) < z.r) { rad = true; g.stats.hurt(6 * dt, true); }
    }
    if (rad && !this.inRad) g.ui.toast('☢️ Área radioativa! Saia daqui!', 'warn');
    this.inRad = rad;
    if (this.kinds.includes('storm')) this.updateStorm(dt, t);
    if (this.kinds.includes('meteor')) {
      this.mt -= dt;
      if (this.mt <= 0) {
        this.mt = 7 + Math.random() * 6;
        const x = P.x + (Math.random() - 0.5) * 30, z = P.z + (Math.random() - 0.5) * 30, y = this.planet.heightAt(x, z);
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4), Toon.mat(0xff7a2a, { emissive: 0xff4400, emissiveIntensity: 1 })); Toon.outline(rock, 0.1);
        this.group.add(rock); this.meteors.push({ x, z, y, mk: this.marker(x, z, 4.5, 0xff3355), rock, t: 0 });
      }
    }
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i]; m.t += dt; m.rock.position.set(m.x, m.y + 60 * Math.max(0, 1 - m.t / 2.2), m.z); m.rock.rotation.x += dt * 4;
      if (m.t >= 2.2) {
        g.particles.burst(new THREE.Vector3(m.x, m.y + 1, m.z), 0xff7a2a, 40, 10); g.shake = 0.4;
        if (Math.hypot(P.x - m.x, P.z - m.z) < 4.5) g.stats.hurt(25);
        this.group.remove(m.mk, m.rock); this.meteors.splice(i, 1);
      }
    }
  }
};
