// [REVISI thinking_revised] Pedestrians: simple walkers that stroll the sidewalks and scatter
// when a wanted level is active.
import { rand } from './world_config.js';

const T = window.THREE;
const SKIN = [0xc98f6b, 0x8d5a3b, 0xe0b48f];
const SHIRT = [0x7f8c8d, 0xd35400, 0x16a085, 0x2c3e50, 0xf1c40f];

export class Pedestrian {
  constructor(scene, x, z) {
    this.group = new T.Group();
    const skin = new T.MeshLambertMaterial({ color: SKIN[Math.floor(rand(0, SKIN.length))] });
    const shirt = new T.MeshLambertMaterial({ color: SHIRT[Math.floor(rand(0, SHIRT.length))] });
    const torso = new T.Mesh(new T.BoxGeometry(0.42, 0.6, 0.26), shirt);
    torso.position.y = 1.0;
    const head = new T.Mesh(new T.SphereGeometry(0.18, 8, 6), skin);
    head.position.y = 1.5;
    const legL = new T.Mesh(new T.BoxGeometry(0.16, 0.6, 0.18),
      new T.MeshLambertMaterial({ color: 0x22262c }));
    legL.position.set(-0.1, 0.3, 0);
    const legR = legL.clone();
    legR.position.x = 0.1;
    this.group.add(torso, head, legL, legR);
    this.parts = { legL, legR };
    scene.add(this.group);
    this.pos = new T.Vector3(x, 0, z);
    this.heading = rand(0, Math.PI * 2);
    this.speed = rand(0.8, 1.6);
    this.phase = rand(0, 6);
    this.fleeing = false;
  }

  update(dt, playerPos, panic) {
    if (panic) this.fleeing = true;
    if (this.fleeing) {
      const dx = this.pos.x - playerPos.x, dz = this.pos.z - playerPos.z;
      const d = Math.hypot(dx, dz) || 1;
      this.heading = Math.atan2(dx / d, dz / d);
      this.speed = 3.4;
    }
    this.pos.x += Math.sin(this.heading) * this.speed * dt;
    this.pos.z += Math.cos(this.heading) * this.speed * dt;
    this.phase += this.speed * dt * 2;
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.heading;
    const s = Math.sin(this.phase);
    this.parts.legL.rotation.x = s * 0.6;
    this.parts.legR.rotation.x = -s * 0.6;
  }
}

/** Place walkers on the sidewalks beside random roads. */
export function spawnPedestrians(scene, half, count = 22) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const onVertical = Math.random() < 0.5;
    const roadAt = -half + Math.floor(rand(0, 10)) * 44 + 6;
    const along = rand(-half, half);
    const lane = (Math.random() < 0.5 ? -1 : 1) * (6 + rand(0, 3));
    const p = new Pedestrian(scene, onVertical ? roadAt + lane : along, onVertical ? along : roadAt + lane);
    list.push(p);
  }
  return list;
}
