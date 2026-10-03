import * as THREE from '../lib/three/build/three.module.js';
import { glowTexture } from '../mining/Resource.js';
// Projétil reutilizável (object pooling): nada é criado ou destruído durante o combate
export class Projectile {
  constructor(scene, geo) {
    this.mesh = new THREE.Mesh(geo, null); this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    this.mesh.add(this.glow); this.vel = new THREE.Vector3(); this.alive = false; this.mesh.visible = false; scene.add(this.mesh);
  }
  launch(mat, color, size, pos, dir, speed, life, damage, weapon) {
    this.mesh.material = mat; this.glow.material.color.set(color); this.glow.scale.setScalar(7); this.mesh.scale.setScalar(size / 0.26);
    this.mesh.position.copy(pos); this.vel.copy(dir).multiplyScalar(speed); this.speed = speed; this.life = life; this.damage = damage; this.weapon = weapon; this.size = size; this.alive = true; this.mesh.visible = true;
  }
  release() { this.alive = false; this.mesh.visible = false; }
}
