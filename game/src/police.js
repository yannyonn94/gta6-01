// police.js — sistem buronan Kota Karang: bintang 0–5, mobil polisi yang
// mengejar, roadblock di bintang tinggi, dan penangkapan bila pemain
// tertangkap basah. Polisi memakai mobil yang sama dengan lalu lintas,
// hanya dicat hitam-putih dengan strobo.

import { WORLD } from './tune.js';
import { makeCarMesh } from './cars.js';
import { range, pick } from './rng.js';

export function createPolice(scene, rng, colliders, hooks) {
  const units = [];
  const blocks = [];   // roadblock: barier + 2 mobil
  let wanted = 0;
  let quietTimer = 0;
  let bustTimer = 0;
  let sirenOn = false;

  function spawnUnit() {
    const mesh = makeCarMesh('police', 0xf2f2f2);
    scene.add(mesh);
    // Muncul di jalan agak jauh dari pemain.
    const ang = range(rng, 0, Math.PI * 2);
    const dist = range(rng, 60, 100);
    const x = Math.max(-150, Math.min(150, hooks.playerPos().x + Math.cos(ang) * dist));
    const z = Math.max(-150, Math.min(150, hooks.playerPos().z + Math.sin(ang) * dist));
    const u = { mesh, pos: new THREE.Vector3(x, 0, z), heading: 0, speed: 0, stuck: 0 };
    units.push(u);
    return u;
  }

  function setWanted(n, reason) {
    const next = Math.max(0, Math.min(5, n));
    if (next !== wanted) {
      wanted = next;
      quietTimer = 0;
      bustTimer = 0;
      if (hooks.onWanted) hooks.onWanted(wanted, reason);
      syncUnits();
    }
  }

  function addWanted(n, reason) { setWanted(wanted + n, reason); }

  function syncUnits() {
    const want = wanted === 0 ? 0 : wanted + 1;
    while (units.length < want) spawnUnit();
    while (units.length > want) {
      const u = units.pop();
      scene.remove(u.mesh);
    }
    const wantSiren = wanted > 0;
    if (wantSiren !== sirenOn) {
      sirenOn = wantSiren;
      if (hooks.onSiren) hooks.onSiren(sirenOn);
    }
    // Roadblock mulai bintang 3: barier di jalan depan pemain.
    if (wanted >= 3 && blocks.length === 0) buildRoadblock();
    if (wanted < 3 && blocks.length > 0) clearRoadblocks();
  }

  function buildRoadblock() {
    const p = hooks.playerPos();
    const ahead = hooks.playerHeading ? hooks.playerHeading() : 0;
    const bx = p.x + Math.sin(ahead) * 34;
    const bz = p.z + Math.cos(ahead) * 34;
    const g = new THREE.Group();
    const stripeMat = new THREE.MeshLambertMaterial({ color: 0xffd23e });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x222831 });
    for (let i = -1; i <= 1; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 0.5), i % 2 === 0 ? stripeMat : darkMat);
      bar.position.set(i * 3.4, 0.7, 0);
      g.add(bar);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.3), darkMat);
      leg.position.set(i * 3.4 - 1.2, 0.35, 0);
      g.add(leg);
    }
    // Tiang tinggi di kedua ujung + balok melintang + lampu kuning berkedip,
    // supaya roadblock terbaca dari jauh (dan dari balik kemudi).
    for (const sx of [-5.4, 5.4]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.2, 0.5), stripeMat);
      post.position.set(sx, 2.1, 0);
      g.add(post);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.6, 0.6), darkMat);
    beam.position.set(0, 4.2, 0);
    g.add(beam);
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xffb020, emissive: 0xff9a00, emissiveIntensity: 1.0 })
    );
    lamp.position.set(0, 4.9, 0);
    g.add(lamp);
    g.userData.beaconLamp = lamp;
    g.position.set(bx, 0, bz);
    g.rotation.y = ahead + Math.PI / 2;
    scene.add(g);
    blocks.push({ group: g, x: bx, z: bz });
    colliders.push({ minX: bx - 5, maxX: bx + 5, minZ: bz - 5, maxZ: bz + 5 });
    if (hooks.onRoadblock) hooks.onRoadblock(bx, bz);
  }

  function clearRoadblocks() {
    for (const b of blocks) scene.remove(b.group);
    // Hapus collider roadblock (selalu yang terakhir ditambahkan).
    for (let i = 0; i < blocks.length; i++) colliders.pop();
    blocks.length = 0;
  }

  function update(dt, playerPos, playerInCar, playerSpeed) {
    // Bintang turun sendiri setelah lama tidak berulah.
    if (wanted > 0) {
      quietTimer += dt;
      if (quietTimer > 9 + wanted * 4) setWanted(wanted - 1, 'tenang');
    }
    // Penangkapan: polisi sangat dekat dan pemain lambat / jalan kaki.
    if (wanted > 0) {
      let nearest = Infinity;
      for (const u of units) nearest = Math.min(nearest, Math.hypot(u.pos.x - playerPos.x, u.pos.z - playerPos.z));
      if (nearest < 4 && Math.abs(playerSpeed) < 2) {
        bustTimer += dt;
        if (bustTimer > 6 && hooks.onBusted) hooks.onBusted();
      } else {
        bustTimer = Math.max(0, bustTimer - dt * 2);
      }
    }

    for (const u of units) {
      const dx = playerPos.x - u.pos.x;      const dz = playerPos.z - u.pos.z;
      const dist = Math.hypot(dx, dz);
      const targetHeading = Math.atan2(dx, dz);
      let turn = targetHeading - u.heading;
      while (turn > Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;
      u.heading += Math.max(-2.4 * dt, Math.min(2.4 * dt, turn));
      const wantSpeed = Math.min(30, 14 + wanted * 3.5);
      u.speed += (wantSpeed - u.speed) * Math.min(1, dt * 0.8);
      u.pos.x += Math.sin(u.heading) * u.speed * dt;
      u.pos.z += Math.cos(u.heading) * u.speed * dt;
      // Polisi juga menabrak gedung: perlambat dan belok.
      for (const c of colliders) {
        const nx = Math.max(c.minX, Math.min(u.pos.x, c.maxX));
        const nz = Math.max(c.minZ, Math.min(u.pos.z, c.maxZ));
        if (Math.hypot(u.pos.x - nx, u.pos.z - nz) < 1.8) {
          u.heading += Math.PI * 0.6;
          u.speed *= 0.5;
          u.pos.x -= Math.sin(u.heading) * 2;
          u.pos.z -= Math.cos(u.heading) * 2;
          break;
        }
      }
      // Menabrak mobil pemain: dorong pemain, tambah bintang bila keras.
      if (dist < 3.6 && hooks.onRam) hooks.onRam(u, dist);
      u.mesh.position.copy(u.pos);
      u.mesh.rotation.y = u.heading;
      // Strobo berkedip.
      const strobe = u.mesh.userData.strobe;
      if (strobe) {
        const on = Math.floor(performance.now() / 180) % 2 === 0;
        strobe.red.material.emissiveIntensity = on ? 1.6 : 0.15;
        strobe.blue.material.emissiveIntensity = on ? 0.15 : 1.6;
      }
    }
    // Lampu kuning roadblock berkedip pelan.
    for (const b of blocks) {
      const lamp = b.group.userData.beaconLamp;
      if (lamp) lamp.material.emissiveIntensity = 0.4 + (Math.sin(performance.now() / 240) + 1) * 0.7;
    }
    return { wanted, bustTimer };
  }

  return {
    units, blocks,
    get wanted() { return wanted; },
    setWanted, addWanted, update, syncUnits,
    reset() {
      setWanted(0, 'reset');
      clearRoadblocks();
    },
  };
}
