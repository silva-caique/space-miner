import * as THREE from '../lib/three/build/three.module.js';
export const Particles = class {
  constructor(scene, max = 400) {
    this.max = max; this.density = 1; this.i = 0;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max);
    for (let k = 0; k < max; k++) this.pos[k * 3 + 1] = -999;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.7, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.pts.frustumCulled = false; scene.add(this.pts); this.geo = geo;
  }
  emit(x, y, z, vx, vy, vz, c, life) {
    const i = this.i = (this.i + 1) % this.max, k = i * 3;
    this.pos[k] = x; this.pos[k + 1] = y; this.pos[k + 2] = z;
    this.vel[k] = vx; this.vel[k + 1] = vy; this.vel[k + 2] = vz;
    this.col[k] = c.r; this.col[k + 1] = c.g; this.col[k + 2] = c.b; this.life[i] = life;
  }
  burst(p, color, n = 12, spd = 6) {
    n = Math.max(1, Math.round(n * this.density));
    const c = new THREE.Color(color);
    for (let k = 0; k < n; k++) {
      const a = Math.random() * 6.283, u = Math.random() * 2 - 1, r = Math.sqrt(1 - u * u), s = spd * (0.4 + Math.random() * 0.8);
      this.emit(p.x, p.y, p.z, Math.cos(a) * r * s, (u * 0.5 + 0.6) * s, Math.sin(a) * r * s, c, 0.5 + Math.random() * 0.6);
    }
  }
  update(dt) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt; const k = i * 3;
      this.pos[k] += this.vel[k] * dt; this.pos[k + 1] += this.vel[k + 1] * dt; this.pos[k + 2] += this.vel[k + 2] * dt;
      this.vel[k + 1] -= 9 * dt;
      if (this.life[i] <= 0) this.pos[k + 1] = -999;
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
  }
};
