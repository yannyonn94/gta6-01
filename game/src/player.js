// The player: a small body that walks and runs on foot, and can enter a car.
import { PLAYER_HEIGHT, WALK_SPEED, RUN_SPEED, clamp } from './world_config.js';

const T = window.THREE;

export class Player {
  constructor(scene) {
    this.group = new T.Group();
    const skin = new T.MeshLambertMaterial({ color: 0xc98f6b });
    const shirt = new T.MeshLambertMaterial({ color: 0x2e6f8e });
    const pants = new T.MeshLambertMaterial({ color: 0x2a2d34 });

    const torso = new T.Mesh(new T.BoxGeometry(0.55, 0.75, 0.3), shirt);
    torso.position.y = 1.15;
    const head = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), skin);
    head.position.y = 1.72;
    const legL = new T.Mesh(new T.BoxGeometry(0.2, 0.75, 0.22), pants);
    legL.position.set(-0.14, 0.38, 0);
    const legR = legL.clone();
    legR.position.x = 0.14;
    const armL = new T.Mesh(new T.BoxGeometry(0.16, 0.6, 0.18), skin);
    armL.position.set(-0.36, 1.15, 0);
    const armR = armL.clone();
    armR.position.x = 0.36;

    this.group.add(torso, head, legL, legR, armL, armR);
    this.parts = { torso, head, legL, legR, armL, armR };
    scene.add(this.group);

    this.pos = new T.Vector3(0, 0, 0);
    this.heading = 0;          // radians, 0 = +Z
    this.speed = 0;
    this.inCar = null;
    this.health = 100;
    this.walkPhase = 0;
  }

  /** move on foot from the input's axes, relative to the camera yaw */
  update(dt, move, camYaw, bounds) {
    if (this.inCar) return;
    let mx = move.x, mz = move.y;
    const moving = mx !== 0 || mz !== 0;
    const target = moving ? (move.run ? RUN_SPEED : WALK_SPEED) : 0;
    this.speed += (target - this.speed) * Math.min(1, dt * 10);

    if (moving) {
      const len = Math.hypot(mx, mz);
      mx /= len; mz /= len;
      const cos = Math.cos(camYaw), sin = Math.sin(camYaw);
      const wx = mx * cos - mz * sin;
      const wz = mx * sin + mz * cos;
      this.pos.x = clamp(this.pos.x + wx * this.speed * dt, -bounds, bounds);
      this.pos.z = clamp(this.pos.z + wz * this.speed * dt, -bounds, bounds);
      this.heading = Math.atan2(wx, wz);
      this.walkPhase += this.speed * dt * 1.6;
    } else {
      this.walkPhase *= 0.9;
    }

    this.group.position.copy(this.pos);
    this.group.rotation.y = this.heading;
    this.animate();
  }

  animate() {
    const s = Math.sin(this.walkPhase);
    const amp = Math.min(1, this.speed / WALK_SPEED);
    this.parts.legL.rotation.x = s * 0.7 * amp;
    this.parts.legR.rotation.x = -s * 0.7 * amp;
    this.parts.armL.rotation.x = -s * 0.5 * amp;
    this.parts.armR.rotation.x = s * 0.5 * amp;
    this.parts.torso.position.y = 1.15 + Math.abs(Math.cos(this.walkPhase)) * 0.03 * amp;
  }

  enterCar(car) {
    this.inCar = car;
    this.group.visible = false;
    this.speed = 0;
  }

  exitCar() {
    if (!this.inCar) return;
    const car = this.inCar;
    this.inCar = null;
    this.group.visible = true;
    this.pos.set(car.mesh.position.x + 1.6, 0, car.mesh.position.z);
    this.group.position.copy(this.pos);
  }
}
