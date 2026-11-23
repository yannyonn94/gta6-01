// cars.js — kendaraan Kota Karang: pabrik model mobil dari kotak, fisika
// mengemudi arcade untuk pemain (akselerasi, rem tangan/drift, tabrakan),
// dan lalu lintas AI yang mengalir di grid jalan mengikuti lajur kanan.

import { WORLD, TUNE, roadLine } from './tune.js';
import { range, pick, chance } from './rng.js';

const CAR_COLORS = [0xd23b2e, 0x3f6fb5, 0xe0a458, 0x2f9e6e, 0x8a6fc0, 0xe8e4da, 0x222831];

export function makeCarMesh(kind, color) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x1d2f3d });
  const isVan = kind === 'van';
  const len = isVan ? 5.6 : 4.4;
  const bodyH = isVan ? 1.5 : 0.85;

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, bodyH, len), bodyMat);
  body.position.y = 0.75;
  g.add(body);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, isVan ? 1.1 : 0.75, isVan ? 2.6 : 2.2),
    isVan ? bodyMat : glassMat
  );
  cabin.position.set(0, bodyH + 0.55, isVan ? -0.4 : -0.2);
  g.add(cabin);

  // Roda.
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 12);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x141414 });
  const wheelPos = [
    [-1.0, 0.42, len / 2 - 0.9], [1.0, 0.42, len / 2 - 0.9],
    [-1.0, 0.42, -len / 2 + 0.9], [1.0, 0.42, -len / 2 + 0.9],
  ];
  const wheels = wheelPos.map(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    g.add(w);
    return w;
  });

  // Lampu depan (kuning) dan belakang (merah).
  const headMat = new THREE.MeshLambertMaterial({ color: 0xfff2b0, emissive: 0xffdf80, emissiveIntensity: 0.6 });
  const tailMat = new THREE.MeshLambertMaterial({ color: 0xd21f1f, emissive: 0x8f1010, emissiveIntensity: 0.5 });
  for (const sx of [-0.65, 0.65]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.12), headMat);
    h.position.set(sx, 0.8, len / 2 + 0.02);
    g.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.12), tailMat);
    t.position.set(sx, 0.8, -len / 2 - 0.02);
    g.add(t);
  }
  if (kind === 'taxi') {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.5), new THREE.MeshLambertMaterial({ color: 0xffd23e, emissive: 0xa8820a, emissiveIntensity: 0.5 }));
    sign.position.set(0, bodyH + 1.35, -0.2);
    g.add(sign);
  }
  if (kind === 'police') {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 0.5), new THREE.MeshLambertMaterial({ color: 0x222831 }));
    bar.position.set(0, bodyH + 1.3, -0.2);
    g.add(bar);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.52), new THREE.MeshLambertMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 0.9 }));
    red.position.set(-0.3, bodyH + 1.55, -0.2);
    g.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.52), new THREE.MeshLambertMaterial({ color: 0x2244ff, emissive: 0x2244ff, emissiveIntensity: 0.9 }));
    blue.position.set(0.3, bodyH + 1.55, -0.2);
    g.add(blue);
    g.userData.strobe = { red, blue };
  }
  g.userData.wheels = wheels;
  g.userData.length = len;
  return g;
}

function collideCircle(pos, colliders, radius) {
  // Mengembalikan true bila menabrak dan sudah didorong keluar.
  let hit = false;
  for (const c of colliders) {
    const nx = Math.max(c.minX, Math.min(pos.x, c.maxX));
    const nz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
    const dx = pos.x - nx, dz = pos.z - nz;
    const d2 = dx * dx + dz * dz;
    if (d2 < radius * radius && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      pos.x = nx + (dx / d) * radius;
      pos.z = nz + (dz / d) * radius;
      hit = true;
    }
  }
  pos.x = Math.max(-198, Math.min(198, pos.x));
  pos.z = Math.max(-198, Math.min(198, pos.z));
  return hit;
}

export function createDriving(scene, rng, colliders, hooks) {
  const cars = [];       // mobil lalu lintas AI
  const parked = [];     // mobil parkir yang bisa dicuri
  const player = {
    mesh: null, kind: 'sedan', color: 0xd23b2e,
    pos: new THREE.Vector3(0, 0, 60),
    heading: 0, speed: 0, inCar: false,
  };

  function spawnTraffic(count) {
    for (let i = 0; i < count; i++) {
      const horizontal = chance(rng, 0.5);
      const line = roadLine(Math.floor(rng() * WORLD.GRID));
      const along = range(rng, -WORLD.HALF + 10, WORLD.HALF - 10);
      const lane = chance(rng, 0.5) ? 2 : -2;
      const mesh = makeCarMesh(chance(rng, 0.12) ? 'taxi' : 'sedan', pick(rng, CAR_COLORS));
      scene.add(mesh);
      cars.push({
        mesh,
        horizontal,
        line,
        lane,
        along,
        dir: chance(rng, 0.5) ? 1 : -1,
        speed: range(rng, 7, 12),
        paused: 0,
      });
    }
  }

  function spawnParked(count) {
    for (let i = 0; i < count; i++) {
      const line = roadLine(Math.floor(rng() * WORLD.GRID));
      const along = range(rng, -WORLD.HALF + 12, WORLD.HALF - 12);
      const side = chance(rng, 0.5) ? 1 : -1;
      const horizontal = chance(rng, 0.5);
      const mesh = makeCarMesh('sedan', pick(rng, CAR_COLORS));
      const x = horizontal ? along : line + side * 5.4;
      const z = horizontal ? line + side * 5.4 : along;
      mesh.position.set(x, 0, z);
      mesh.rotation.y = horizontal ? (side > 0 ? Math.PI / 2 : -Math.PI / 2) : (side > 0 ? 0 : Math.PI);
      scene.add(mesh);
      parked.push({ mesh, x, z, taken: false, kind: 'sedan', color: mesh.children[0].material.color.getHex() });
    }
  }

  function placePlayerCar(x, z, heading, kind, color) {
    if (player.mesh) scene.remove(player.mesh);
    player.kind = kind || 'sedan';
    player.color = color === undefined ? 0xd23b2e : color;
    player.mesh = makeCarMesh(player.kind, player.color);
    scene.add(player.mesh);
    player.pos.set(x, 0, z);
    player.heading = heading || 0;
    player.speed = 0;
    player.mesh.position.copy(player.pos);
    player.mesh.rotation.y = player.heading;
    return player;
  }

  function nearestStealable(pos, maxDist) {
    let best = null, bestD = maxDist;
    for (const p of parked) {
      if (p.taken) continue;
      const d = Math.hypot(p.x - pos.x, p.z - pos.z);
      if (d < bestD) { best = p; bestD = d; }
    }
    return best;
  }

  function updatePlayer(dt, input) {
    if (!player.inCar || !player.mesh) return { speedKmh: 0, crashed: false };
    const ax = input.axis();
    const hand = input.handbrake();
    const prevSpeed = player.speed;
    if (ax.forward > 0) player.speed += TUNE.carAccel * dt;
    else if (ax.forward < 0) {
      player.speed += (player.speed > 0.5 ? -TUNE.carBrake : -TUNE.carAccel * 0.55) * dt;
    } else {
      player.speed -= Math.sign(player.speed) * 9 * dt;
      if (Math.abs(player.speed) < 0.4) player.speed = 0;
    }
    player.speed = Math.max(-TUNE.carMaxReverse, Math.min(TUNE.carMaxSpeed, player.speed));
    const grip = hand ? 2.2 : TUNE.carGrip;
    const steer = ax.steer * TUNE.carTurn * Math.min(1, Math.abs(player.speed) / 9) * (player.speed < 0 ? -1 : 1);
    player.heading += steer * dt * (hand ? 1.6 : 1);
    // Gesekan drift saat rem tangan: kecepatan menyamping tidak dimodelkan
    // penuh, tapi belokan lebih tajam dan kecepatan turun lebih cepat.
    if (hand) player.speed *= (1 - 0.35 * dt);
    const fx = Math.sin(player.heading), fz = Math.cos(player.heading);
    player.pos.x += fx * player.speed * dt;
    player.pos.z += fz * player.speed * dt;
    const crashed = collideCircle(player.pos, colliders, 1.7);
    if (crashed) {
      const impact = Math.abs(prevSpeed);
      player.speed = -prevSpeed * 0.25;
      if (impact > 8 && hooks.onCrash) hooks.onCrash(impact, player.pos);
    }
    // Tabrakan dengan mobil lalu lintas: dorong dan perlambat.
    for (const c of cars) {
      const d = Math.hypot(c.mesh.position.x - player.pos.x, c.mesh.position.z - player.pos.z);
      if (d < 3.4) {
        const impact = Math.abs(player.speed) + c.speed;
        player.speed *= 0.4;
        if (impact > 10 && hooks.onCrash) hooks.onCrash(impact, player.pos);
        const push = (3.4 - d);
        const px = (player.pos.x - c.mesh.position.x) / (d || 1);
        const pz = (player.pos.z - c.mesh.position.z) / (d || 1);
        player.pos.x += px * push; player.pos.z += pz * push;
      }
    }
    player.mesh.position.copy(player.pos);
    player.mesh.rotation.y = player.heading;
    // Roda berputar.
    const spin = player.speed * dt * 1.4;
    for (const w of player.mesh.userData.wheels) w.rotation.x += spin;
    void grip;
    return { speedKmh: Math.abs(player.speed) * 3.6, crashed };
  }

  function updateTraffic(dt, playerPos) {
    for (const c of cars) {
      if (c.paused > 0) { c.paused -= dt; continue; }
      // Berhenti sejenak bila pemain tepat di depan (menghindari tabrakan konyol).
      const dx = playerPos.x - c.mesh.position.x;
      const dz = playerPos.z - c.mesh.position.z;
      if (Math.hypot(dx, dz) < 6 && player.inCar) { c.paused = 0.4; continue; }
      c.along += c.dir * c.speed * dt;
      if (c.along > WORLD.HALF - 6 || c.along < -WORLD.HALF + 6) {
        c.dir *= -1;
        c.along = Math.max(-WORLD.HALF + 8, Math.min(WORLD.HALF - 8, c.along));
      }
      // Di persimpangan, kadang belok ke jalan tegak lurus.
      const nearLine = roadLine(Math.round((c.along + 144) / WORLD.PITCH));
      if (Math.abs(c.along - nearLine) < 1.2 && chance(rng, 0.006)) {
        c.horizontal = !c.horizontal;
        c.line = nearLine;
        const tmp = c.along; c.along = c.line; c.line = tmp;
        c.dir = chance(rng, 0.5) ? 1 : -1;
      }
      const x = c.horizontal ? c.along : c.line + c.lane;
      const z = c.horizontal ? c.line + c.lane : c.along;
      c.mesh.position.set(x, 0, z);
      const heading = c.horizontal ? (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (c.dir > 0 ? 0 : Math.PI);
      c.mesh.rotation.y = heading;
      const spin = c.speed * dt * 1.4;
      for (const w of c.mesh.userData.wheels) w.rotation.x += spin;
    }
  }

  spawnTraffic(10);
  spawnParked(7);

  return {
    cars, parked, player,
    placePlayerCar, nearestStealable, updatePlayer, updateTraffic,
    enterCar(p) {
      p.taken = true;
      scene.remove(p.mesh);
      placePlayerCar(p.x, p.z, 0, p.kind, p.color);
      player.inCar = true;
    },
    exitCar() {
      player.inCar = false;
      const fx = Math.sin(player.heading), fz = Math.cos(player.heading);
      return { x: player.pos.x - fx * 3, z: player.pos.z - fz * 3 };
    },
  };
}
