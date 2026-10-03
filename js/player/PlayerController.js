import * as THREE from '../lib/three/build/three.module.js';
// Movimento e câmera em terceira pessoa (sobre o ombro). A entrada vem do InputManager.
export const PlayerController = class {
  constructor(g) { this.g = g; this.mining = false; this.camYaw = 0.6; this.pitch = 0.45; this.dist = 13; this.shoulder = 1.1; this.inDir = null; this.face = undefined; this.right = new THREE.Vector3(); }
  get keys() { return this.g.input.keys; }
  update(dt) {
    const g = this.g, P = g.player, inp = g.input, k = inp.keys, s = g.state.settings.sensitivity;
    if (g.pcombat.dashT > 0) { // esquiva: impulso rápido com invulnerabilidade
      const d = g.pcombat.dashDir; P.pos.x += d.x * 26 * dt; P.pos.z += d.z * 26 * dt;
      const rr = Math.hypot(P.pos.x, P.pos.z); if (rr > 76) { P.pos.x *= 76 / rr; P.pos.z *= 76 / rr; }
      P.pos.y = g.planet.heightAt(P.pos.x, P.pos.z); return;
    }
    this.camYaw -= inp.look.x * 0.0022 * s; this.pitch = Math.min(1.2, Math.max(-0.1, this.pitch + inp.look.y * 0.0018 * s)); inp.look.x = 0; inp.look.y = 0;
    if (inp.wheel) { this.dist = Math.min(24, Math.max(6, this.dist + inp.wheel * 1.5)); inp.wheel = 0; }
    if (k.ArrowLeft) this.camYaw += 1.8 * dt; if (k.ArrowRight) this.camYaw -= 1.8 * dt;
    const mine = inp.mine, firing = inp.fire || g.combat.recent > 2.0; this.mining = mine;
    const fx = -Math.sin(this.camYaw), fz = -Math.cos(this.camYaw), rx = -fz, rz = fx;
    const f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0), r = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
    let mx = fx * f + rx * r, mz = fz * f + rz * r; const l = Math.hypot(mx, mz);
    P.moving = l > 0; this.inDir = l > 0 ? [mx / l, mz / l] : null;
    if (l > 0) {
      mx /= l; mz /= l; const sp = 9 * (k.ShiftLeft || k.ShiftRight ? 1.7 : 1) * (mine ? 0.5 : firing ? 0.8 : 1) * (1 - 0.3 * g.hazards.k);
      P.pos.x += mx * sp * dt; P.pos.z += mz * sp * dt;
      const rr = Math.hypot(P.pos.x, P.pos.z); if (rr > 76) { P.pos.x *= 76 / rr; P.pos.z *= 76 / rr; }
      this.face = Math.atan2(mx, mz);
    }
    P.pos.y = g.planet.heightAt(P.pos.x, P.pos.z);
    const tgt = mine ? g.resources.nearest(P.pos, 5) : null;
    if (tgt) this.face = Math.atan2(tgt.mesh.position.x - P.pos.x, tgt.mesh.position.z - P.pos.z);
    if (firing) this.face = Math.atan2(fx, fz); // atirando: o astronauta encara a direção da mira
    if (this.face !== undefined) { let d = this.face - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 12); }
  }
  updateCamera(dt) {
    const g = this.g, P = g.player.pos, cam = g.camera, cp = Math.cos(this.pitch), sy = Math.sin(this.camYaw), cy = Math.cos(this.camYaw), sh = this.shoulder;
    cam.position.set(P.x + sy * cp * this.dist + cy * sh, P.y + 2 + Math.sin(this.pitch) * this.dist, P.z + cy * cp * this.dist - sy * sh);
    const gh = g.planet.heightAt(cam.position.x, cam.position.z) + 1.5; if (cam.position.y < gh) cam.position.y = gh;
    if (g.shake > 0) { g.shake = Math.max(0, g.shake - dt); cam.position.x += (Math.random() - 0.5) * g.shake; cam.position.y += (Math.random() - 0.5) * g.shake; }
    cam.lookAt(P.x + cy * sh, P.y + 2.2, P.z - sy * sh);
  }
};
