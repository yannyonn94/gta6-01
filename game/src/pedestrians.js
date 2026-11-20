// [RONDE 2] Pejalan kaki: berjalan di trotoar, menyeberang jalan di persimpangan,
// menghindar mobil yang melintas, dan panik bila ada wanted.
import { PEDS, clamp, rand } from './world_config.js';

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
    this.crossing = false;
    this.waiting = rand(0, 2);
    this.blocked = false;
  }

  /** cek mobil terdekat; pejalan kaki menunggu di tepi bila ada yang lewat. */
  update(dt, playerPos, panic, cars = []) {
    if (panic) this.fleeing = true;

    // menghindari mobil yang mendekat di depan
    this.blocked = false;
    for (const c of cars) {
      const dx = this.pos.x - c.pos.x, dz = this.pos.z - c.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 7) {
        const ahead = Math.sin(c.heading) * dx + Math.cos(c.heading) * dz;
        if (ahead > 0 && Math.abs(d) < 7) { this.blocked = true; break; }
      }
    }

    if (this.fleeing) {
      const dx = this.pos.x - playerPos.x, dz = this.pos.z - playerPos.z;
      const d = Math.hypot(dx, dz) || 1;
      this.heading = Math.atan2(dx / d, dz / d);
      this.speed = PEDS.panicSpeed;
      this.crossing = false;
    } else if (this.blocked) {
      this.speed = 0;
    } else if (this.crossing) {
      this.speed = 2.4;
      this.waiting -= dt;
      if (this.waiting <= 0) {
        this.crossing = false;
        this.heading = rand(0, Math.PI * 2);
      }
    } else {
      this.speed = rand(0.8, 1.6);
      if (Math.random() < PEDS.crossChance * dt * 0.4) {
        this.crossing = true;
        this.waiting = rand(1.2, 2.4);
        // menyeberang: tegak lurus terhadap arah sebelumnya
        this.heading += Math.PI / 2;
      }
    }

    this.pos.x = clamp(this.pos.x + Math.sin(this.heading) * this.speed * dt, -220, 220);
    this.pos.z = clamp(this.pos.z + Math.cos(this.heading) * this.speed * dt, -220, 220);
    this.phase += this.speed * dt * 2;
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.heading;
    const s = Math.sin(this.phase);
    this.parts.legL.rotation.x = s * 0.6;
    this.parts.legR.rotation.x = -s * 0.6;
  }
}

/** Sebar pejalan kaki di trotoar di sepanjang jalan. */
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
