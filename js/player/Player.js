import * as THREE from '../lib/three/build/three.module.js';
import { Toon, mergeMeshes } from '../core/Toon.js';
export const Player = class {
  constructor(g) {
    this.g = g; this.pos = new THREE.Vector3(); this.yaw = 0; this.mining = false; this.target = null; this.moving = false;
    this.mesh = new THREE.Group(); this.build(); g.scene.add(this.mesh); Toon.shadows(this.mesh);
    this.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1, 6), new THREE.MeshBasicMaterial({ color: 0x7fefff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.beam.visible = false; g.scene.add(this.beam);
  }
  // Astronauta cartoon branco e laranja: capacete grande com viseira laranja, ombreiras, painel no peito, bolsos e botas laranja
  build() {
    const T = Toon, M = (c, o = {}) => T.mat(c, Object.assign({ roughness: 0.55 }, o)), CY = THREE.CylinderGeometry, SP = THREE.SphereGeometry, BX = THREE.BoxGeometry;
    const _w = M(0xf3f5fa), _o = M(0xff7a1a, { roughness: 0.42 }), _d = M(0x2b2f3a, { roughness: 0.4, metalness: 0.3 }), _g = M(0x8d95a3, { roughness: 0.4, metalness: 0.3 }), white = () => _w, orange = () => _o, dark = () => _d, grey = () => _g;
    const add = (geo, mat, x, y, z, p) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (p || this.mesh).add(m); return m; };
    add(new CY(0.5, 0.46, 0.95, 22), white(), 0, 1.85, 0);
    add(new CY(0.47, 0.5, 0.3, 22), orange(), 0, 1.4, 0);
    add(new CY(0.5, 0.52, 0.14, 22), grey(), 0, 2.32, 0);
    add(new BX(0.5, 0.34, 0.12), grey(), 0, 2.0, 0.47);
    add(new BX(0.3, 0.14, 0.05), M(0x0a2540, { emissive: 0x1a90d8, emissiveIntensity: 1.3 }), -0.06, 2.05, 0.54);
    add(new SP(0.045, 8, 6), M(0xff7a1a, { emissive: 0xff5a00, emissiveIntensity: 2.5 }), 0.14, 1.97, 0.54);
    add(new SP(0.045, 8, 6), M(0x9fe8ff, { emissive: 0x35d0ff, emissiveIntensity: 2.5 }), 0.14, 1.88, 0.54);
    for (const s of [-1, 1]) { add(new BX(0.27, 0.3, 0.16), orange(), s * 0.3, 1.5, 0.46); add(new SP(0.3, 14, 10), orange(), s * 0.64, 2.2, 0); }
    add(new BX(0.85, 1.05, 0.42), dark(), 0, 1.95, -0.6);
    for (const s of [-1, 1]) add(new CY(0.15, 0.15, 0.85, 12), orange(), s * 0.27, 1.95, -0.86);
    const la = add(new CY(0.17, 0.15, 0.7, 12), white(), -0.77, 1.85, 0); la.rotation.z = -0.25;
    add(new SP(0.2, 12, 8), white(), -0.87, 1.44, 0.02);
    this.arm = new THREE.Group(); this.arm.position.set(0.66, 2.15, 0); this.arm.rotation.x = -1.2; this.mesh.add(this.arm);
    add(new CY(0.17, 0.15, 0.7, 12), white(), 0, -0.35, 0, this.arm); add(new SP(0.2, 12, 8), white(), 0, -0.78, 0, this.arm);
    const dr = add(new THREE.ConeGeometry(0.22, 0.85, 10), M(0xffd23a, { emissive: 0xffa000, emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.3 }), 0, -1.25, 0, this.arm); dr.rotation.x = Math.PI; this.drill = dr;
    this.gun = new THREE.Group(); this.arm.add(this.gun); this.gun.visible = false;
    add(new THREE.BoxGeometry(0.22, 0.55, 0.26), M(0x2b2f3a, { roughness: 0.4, metalness: 0.6 }), 0, -0.95, 0, this.gun);
    add(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 10), M(0x8d95a3, { roughness: 0.3, metalness: 0.7 }), 0, -1.35, 0, this.gun);
    this.gunTip = add(new THREE.SphereGeometry(0.09, 8, 6), M(0xffffff, { emissive: 0x7fefff, emissiveIntensity: 3 }), 0, -1.72, 0, this.gun);
    const leg = x => {
      const g = new THREE.Group(); g.position.set(x, 1.28, 0); this.mesh.add(g);
      add(new CY(0.24, 0.21, 0.42, 14), orange(), 0, -0.2, 0, g); add(new CY(0.2, 0.19, 0.5, 14), white(), 0, -0.64, 0, g); add(new BX(0.42, 0.3, 0.64), orange(), 0, -1.12, 0.08, g);
      return g;
    };
    this.legL = leg(-0.27); this.legR = leg(0.27);
    this.head = new THREE.Group(); this.head.position.y = 2.95; this.mesh.add(this.head);
    add(new SP(0.84, 26, 20), white(), 0, 0, 0, this.head);
    add(new SP(0.7, 22, 16), dark(), 0, -0.02, 0.5, this.head).scale.set(1, 0.86, 0.55);
    add(new SP(0.6, 26, 18), M(0xff8a1a, { roughness: 0.06, metalness: 0.25, emissive: 0xff5a00, emissiveIntensity: 0.45 }), 0, -0.02, 0.56, this.head).scale.set(1, 0.84, 0.55);
    const hl = add(new SP(0.14, 10, 8), M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 2.5 }), -0.22, 0.2, 0.86, this.head); hl.scale.set(1.3, 0.8, 0.35);
    add(new SP(0.05, 8, 6), M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 2.5 }), -0.06, 0.3, 0.86, this.head).scale.z = 0.4;
    for (const s of [-1, 1]) { add(new CY(0.18, 0.18, 0.14, 16), grey(), s * 0.84, 0, 0.05, this.head).rotation.z = Math.PI / 2; add(new CY(0.1, 0.1, 0.16, 12), dark(), s * 0.86, 0, 0.05, this.head).rotation.z = Math.PI / 2; }
    mergeMeshes(this.mesh); mergeMeshes(this.head); mergeMeshes(this.legL); mergeMeshes(this.legR);
  }
  setStance(mode, color) { this.drill.visible = mode === 'drill'; this.gun.visible = mode === 'gun'; if (mode === 'gun' && color !== undefined) this.gunTip.material.emissive.setHex(color); }
  tip() {
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    return new THREE.Vector3(this.pos.x + 0.66 * c + 1.3 * s, this.pos.y + 1.7, this.pos.z - 0.66 * s + 1.3 * c);
  }
  setBeam(v) {
    if (!v) { this.beam.visible = false; return; }
    const o = this.tip(), d = o.distanceTo(v);
    this.beam.visible = true; this.beam.position.copy(o).add(v).multiplyScalar(0.5);
    this.beam.lookAt(v); this.beam.rotateX(Math.PI / 2); this.beam.scale.set(1, d, 1);
  }
  update(dt, t) {
    this.mesh.position.copy(this.pos); this.mesh.rotation.y = this.yaw;
    const sw = this.moving ? Math.sin(t * 12) * 0.6 : 0;
    this.legL.rotation.x = sw; this.legR.rotation.x = -sw;
    this.head.position.y = 2.95 + (this.moving ? Math.abs(Math.sin(t * 12)) * 0.06 : 0);
    this.arm.rotation.x = -1.2 + (this.mining ? Math.sin(t * 30) * 0.06 : 0);
  }
};
