// [RONDE 2] Polisi: cruiser yang mengejar dengan prediksi posisi pemain, jadi
// kejar-kejaran terasa seperti dikepung, bukan cuma diikuti. Lampu bar
// berkedip dan kecepatan tiap mobil berbeda-beda.
import { POLICE } from './config.js';
import { CAR_SPEED, clamp } from './world_config.js';

const T = window.THREE;

export class PoliceCar {
  constructor(scene, seed = 0) {
    this.group = new T.Group();
    const bodyMat = new T.MeshLambertMaterial({ color: 0xf2f4f6 });
    const stripeMat = new T.MeshLambertMaterial({ color: 0x14213d });
    const body = new T.Mesh(new T.BoxGeometry(1.95, 0.55, 4.3), bodyMat);
    body.position.y = 0.55;
    const stripe = new T.Mesh(new T.BoxGeometry(2.0, 0.2, 4.32), stripeMat);
    stripe.position.y = 0.72;
    const lightBar = new T.Mesh(new T.BoxGeometry(1.1, 0.18, 0.4),
      new T.MeshLambertMaterial({ color: 0x222222 }));
    lightBar.position.set(0, 1.36, -0.2);
    this.redLight = new T.Mesh(new T.SphereGeometry(0.14, 8, 6),
      new T.MeshBasicMaterial({ color: 0xff2222 }));
    this.redLight.position.set(-0.35, 1.5, -0.2);
    this.blueLight = new T.Mesh(new T.SphereGeometry(0.14, 8, 6),
      new T.MeshBasicMaterial({ color: 0x2266ff }));
    this.blueLight.position.set(0.35, 1.5, -0.2);
    const tyreMat = new T.MeshLambertMaterial({ color: 0x14161a });
    const wheelGeo = new T.CylinderGeometry(0.36, 0.36, 0.3, 10);
    this.wheels = [];
    for (const [x, z] of [[-0.98, 1.4], [0.98, 1.4], [-0.98, -1.4], [0.98, -1.4]]) {
      const w = new T.Mesh(wheelGeo, tyreMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.36, z);
      this.group.add(w);
      this.wheels.push(w);
    }
    this.group.add(body, stripe, lightBar, this.redLight, this.blueLight);
    scene.add(this.group);
    this.pos = new T.Vector3();
    this.heading = 0;
    this.speed = 0;
    this.flashing = 0;
    this.skill = 0.85 + (seed % 3) * 0.12;   // tiap cruiser punya temperamen
    this.spin = seed % 2 ? 1 : -1;
  }

  /**
   * target: posisi pemain; targetVel: kecepatan pemain (bisa null).
   * Polisi membidik titik di depan pemain, bukan posisi sekarang.
   */
  update(dt, target, active, targetVel = null) {
    if (!active) {
      this.speed *= 0.9;
      this.group.position.copy(this.pos);
      return;
    }
    const lead = POLICE.leadTime * (targetVel ? Math.hypot(targetVel.x, targetVel.z) / CAR_SPEED : 0);
    const aimX = target.x + (targetVel ? targetVel.x : 0) * lead;
    const aimZ = target.z + (targetVel ? targetVel.z : 0) * lead;
    const dx = aimX - this.pos.x, dz = aimZ - this.pos.z;
    const dist = Math.hypot(dx, dz);
    const want = Math.atan2(dx, dz);
    let diff = want - this.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.heading += clamp(diff, -2.9 * this.skill * dt, 2.9 * this.skill * dt);

    const top = CAR_SPEED * 1.25 * this.skill;
    const near = dist > 8 ? top : top * 0.4;
    this.speed += (near - this.speed) * Math.min(1, dt * 1.4);
    this.pos.x += Math.sin(this.heading) * this.speed * dt;
    this.pos.z += Math.cos(this.heading) * this.speed * dt;

    // sentuhan belok: Bergerak ke sisi target saat sudah dekat.
    if (dist < 14) {
      this.pos.x += Math.sin(this.heading + Math.PI / 2) * this.spin * dt * 2.2;
      this.pos.z += Math.cos(this.heading + Math.PI / 2) * this.spin * dt * 2.2;
    }

    this.group.position.copy(this.pos);
    this.group.rotation.y = this.heading;
    for (const w of this.wheels) w.rotation.x += this.speed * dt * 2.2;

    this.flashing += dt * 12;
    const on = Math.floor(this.flashing) % 2 === 0;
    this.redLight.material.color.setHex(on ? 0xff2222 : 0x550000);
    this.blueLight.material.color.setHex(on ? 0x112255 : 0x2266ff);
  }
}

/** Satu cruiser per bintang wanted, ditempatkan melingkar di sekitar pemain. */
export function spawnPolice(scene, count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const car = new PoliceCar(scene, i);
    const angle = (i / Math.max(1, count)) * Math.PI * 2 + 0.7;
    car.pos.set(Math.sin(angle) * 55, 0, Math.cos(angle) * 55);
    car.heading = angle + Math.PI;
    car.group.position.copy(car.pos);
    car.group.visible = false;
    list.push(car);
  }
  return list;
}
