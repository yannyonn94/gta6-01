// Vehicles: parked cars to steal, plus a traffic fleet that drives the roads.
import { CAR_SPEED, clamp, rand } from './world_config.js';

const T = window.THREE;
const COLORS = [0xc0392b, 0x2980b9, 0x27ae60, 0xf39c12, 0x8e44ad, 0xbdc3c7, 0x2c3e50];

export class Car {
  constructor(scene, color = 0xc0392b) {
    this.group = new T.Group();
    const bodyMat = new T.MeshLambertMaterial({ color });
    const glassMat = new T.MeshLambertMaterial({ color: 0x1d2a35 });
    const tyreMat = new T.MeshLambertMaterial({ color: 0x14161a });

    const body = new T.Mesh(new T.BoxGeometry(1.9, 0.55, 4.2), bodyMat);
    body.position.y = 0.55;
    const cabin = new T.Mesh(new T.BoxGeometry(1.7, 0.5, 2.1), glassMat);
    cabin.position.set(0, 1.05, -0.1);
    this.group.add(body, cabin);

    const wheelGeo = new T.CylinderGeometry(0.36, 0.36, 0.3, 10);
    this.wheels = [];
    for (const [x, z] of [[-0.95, 1.35], [0.95, 1.35], [-0.95, -1.35], [0.95, -1.35]]) {
      const w = new T.Mesh(wheelGeo, tyreMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.36, z);
      this.group.add(w);
      this.wheels.push(w);
    }
    scene.add(this.group);
    this.mesh = this.group;
    this.pos = new T.Vector3();
    this.heading = 0;
    this.speed = 0;
    this.driver = null;      // 'player' | 'traffic' | null
    this.color = color;
  }

  update(dt) {
    if (this.driver === 'traffic') {
      this.speed += (CAR_SPEED * 0.55 - this.speed) * Math.min(1, dt * 0.8);
      this.pos.x += Math.sin(this.heading) * this.speed * dt;
      this.pos.z += Math.cos(this.heading) * this.speed * dt;
      this.group.position.copy(this.pos);
      this.group.rotation.y = this.heading;
    }
    for (const w of this.wheels) w.rotation.x += this.speed * dt * 2.2;
  }
}

/** A small fleet that loops around the grid on the roads. */
export function spawnTraffic(scene, roads, count = 14) {
  const fleet = [];
  for (let i = 0; i < count; i++) {
    const car = new Car(scene, COLORS[i % COLORS.length]);
    const road = roads[i % roads.length];
    const along = rand(-road.half, road.half);
    const lane = (i % 2 ? 1 : -1) * 2.6;
    if (road.vertical) {
      car.pos.set(road.at + lane, 0, along);
      car.heading = i % 4 < 2 ? 0 : Math.PI;
    } else {
      car.pos.set(along, 0, road.at + lane);
      car.heading = i % 4 < 2 ? Math.PI / 2 : -Math.PI / 2;
    }
    car.driver = 'traffic';
    car.group.position.copy(car.pos);
    car.group.rotation.y = car.heading;
    fleet.push(car);
  }
  return fleet;
}
