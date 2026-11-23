// onfoot.js — Raka berjalan kaki: model sederhana dari kotak, gerak WASD
// relatif terhadap kamera, lari dengan Shift, dan tabrakan AABB melawan
// gedung. Juga menangani animasi langkah (ayunan lengan dan kaki).

import { TUNE } from './tune.js';

export function createWalker(scene) {
  const group = new THREE.Group();

  const skin = new THREE.MeshLambertMaterial({ color: 0xe8b98a });
  const shirt = new THREE.MeshLambertMaterial({ color: 0x19c2b8 });
  const pants = new THREE.MeshLambertMaterial({ color: 0x2b3a55 });
  const hair = new THREE.MeshLambertMaterial({ color: 0x1d1712 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.05, 0.5), shirt);
  torso.position.y = 1.35;
  group.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), skin);
  head.position.y = 2.2;
  group.add(head);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.62), hair);
  cap.position.y = 2.52;
  group.add(cap);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.85, 0.4), pants);
  legL.position.set(-0.24, 0.42, 0);
  group.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.24;
  group.add(legR);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.34), shirt);
  armL.position.set(-0.62, 1.35, 0);
  group.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.62;
  group.add(armR);

  scene.add(group);

  const state = {
    pos: new THREE.Vector3(0, 0, 48),
    heading: 0,          // arah menghadap (radian)
    moving: false,
    speed: 0,
    stepPhase: 0,
  };

  function resolveCollision(pos, colliders, radius) {
    // Dorong keluar dari setiap AABB yang bersinggungan (lingkaran vs kotak).
    for (const c of colliders) {
      const nx = Math.max(c.minX, Math.min(pos.x, c.maxX));
      const nz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
      const dx = pos.x - nx, dz = pos.z - nz;
      const d2 = dx * dx + dz * dz;
      if (d2 < radius * radius) {
        if (d2 > 0.0001) {
          const d = Math.sqrt(d2);
          pos.x = nx + (dx / d) * radius;
          pos.z = nz + (dz / d) * radius;
        } else {
          // Tepat di dalam kotak: dorong ke sisi terdekat.
          const left = pos.x - c.minX, right = c.maxX - pos.x;
          const top = pos.z - c.minZ, bottom = c.maxZ - pos.z;
          const m = Math.min(left, right, top, bottom);
          if (m === left) pos.x = c.minX - radius;
          else if (m === right) pos.x = c.maxX + radius;
          else if (m === top) pos.z = c.minZ - radius;
          else pos.z = c.maxZ + radius;
        }
      }
    }
    // Jangan keluar pulau.
    pos.x = Math.max(-196, Math.min(196, pos.x));
    pos.z = Math.max(-196, Math.min(196, pos.z));
  }

  function update(dt, input, camYaw, colliders) {
    const ax = input.axis();
    const speed = input.running() ? TUNE.runSpeed : TUNE.walkSpeed;
    // Gerak relatif kamera: W = menjauhi kamera.
    const sin = Math.sin(camYaw), cos = Math.cos(camYaw);
    let mx = 0, mz = 0;
    if (ax.forward !== 0 || ax.steer !== 0) {
      mx = -sin * ax.forward + cos * ax.steer;
      mz = -cos * ax.forward - sin * ax.steer;
      const len = Math.hypot(mx, mz);
      mx /= len; mz /= len;
    }
    state.moving = len2(mx, mz) > 0;
    state.speed = state.moving ? speed : 0;
    if (state.moving) {
      state.pos.x += mx * speed * dt;
      state.pos.z += mz * speed * dt;
      state.heading = Math.atan2(mx, mz);
      state.stepPhase += dt * speed * 1.6;
    }
    resolveCollision(state.pos, colliders, 0.7);
    group.position.copy(state.pos);
    group.rotation.y = state.heading;
    // Ayunan langkah.
    const swing = state.moving ? Math.sin(state.stepPhase) * 0.55 : 0;
    legL.rotation.x = swing;
    legR.rotation.x = -swing;
    armL.rotation.x = -swing * 0.8;
    armR.rotation.x = swing * 0.8;
    group.position.y = state.moving ? Math.abs(Math.sin(state.stepPhase)) * 0.07 : 0;
    return state;
  }

  function len2(x, z) { return x * x + z * z; }

  return {
    group, state,
    setPosition(x, z, heading) {
      state.pos.set(x, 0, z);
      if (heading !== undefined) state.heading = heading;
      group.position.copy(state.pos);
      group.rotation.y = state.heading;
    },
    update,
  };
}
