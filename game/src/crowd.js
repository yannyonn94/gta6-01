// crowd.js — pejalan kaki Kota Karang: warga yang menyusuri trotoar, turis
// yang berkerumun di pasar dan pantai, dan reaksi mereka saat pemain
// mengemudi ugal-ugalan (lari menjauh) atau menabrak (jatuh, lalu bangkit).

import { WORLD, roadLine, blockCenter } from './tune.js';
import { range, intIn, pick, chance } from './rng.js';

const SHIRTS = [0xe2703a, 0x19c2b8, 0xe0a458, 0x8a6fc0, 0xf2e6d0, 0x3f6fb5, 0xd23b2e];

function makePerson(rng, tourist) {
  const g = new THREE.Group();
  const shirt = new THREE.MeshLambertMaterial({ color: pick(rng, SHIRTS) });
  const skin = new THREE.MeshLambertMaterial({ color: pick(rng, [0xe8b98a, 0xc98d64, 0x8a5a34, 0xf2c9a0]) });
  const pants = new THREE.MeshLambertMaterial({ color: pick(rng, [0x2b3a55, 0x3a3a3a, 0x5a4632]) });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.95, 0.38), shirt);
  body.position.y = 1.15;
  g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), skin);
  head.position.y = 1.9;
  g.add(head);
  if (tourist) {
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.14, 10), new THREE.MeshLambertMaterial({ color: 0xf5d76e }));
    hat.position.y = 2.18;
    g.add(hat);
  } else {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.48), new THREE.MeshLambertMaterial({ color: 0x1d1712 }));
    hair.position.y = 2.16;
    g.add(hair);
  }
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.7, 0.28), pants);
  legL.position.set(-0.17, 0.35, 0);
  g.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.17;
  g.add(legR);
  g.userData.legs = [legL, legR];
  return g;
}

export function createCrowd(scene, rng, colliders) {
  const people = [];

  function addPerson(x, z, tourist) {
    const mesh = makePerson(rng, tourist);
    mesh.position.set(x, 0, z);
    scene.add(mesh);
    const p = {
      mesh, tourist: !!tourist,
      x, z,
      heading: range(rng, 0, Math.PI * 2),
      speed: tourist ? range(rng, 0.5, 1.1) : range(rng, 1.0, 2.0),
      phase: range(rng, 0, 6),
      scared: 0,
      down: 0,
      target: null,
    };
    people.push(p);
    return p;
  }

  // Warga di trotoar di seluruh kota.
  for (let i = 0; i < 18; i++) {
    const bx = blockCenter(intIn(rng, 0, 8));
    const bz = blockCenter(intIn(rng, 0, 8));
    addPerson(bx + range(rng, -10, 10), bz + range(rng, -10, 10), false);
  }
  // Turis di pasar dan pantai selatan.
  for (let i = 0; i < 6; i++) {
    addPerson(range(rng, -12, 12), 32 + range(rng, -8, 8), true);
  }
  for (let i = 0; i < 4; i++) {
    addPerson(range(rng, -60, 60), 168 + range(rng, -6, 6), true);
  }

  function scareNear(x, z, radius) {
    for (const p of people) {
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < radius) {
        p.scared = 2.5;
        p.heading = Math.atan2(p.x - x, p.z - z);
      }
    }
  }

  function update(dt, playerPos, playerSpeed, onHitPed) {
    for (const p of people) {
      if (p.down > 0) {
        p.down -= dt;
        p.mesh.rotation.x = p.down > 0 ? -Math.PI / 2 + 0.2 : 0;
        if (p.down <= 0) p.mesh.rotation.x = 0;
        continue;
      }
      let sp = p.speed;
      if (p.scared > 0) {
        p.scared -= dt;
        sp = 4.2;
      }
      // Jalan lurus, belok acak di persimpangan trotoar.
      p.x += Math.sin(p.heading) * sp * dt;
      p.z += Math.cos(p.heading) * sp * dt;
      if (Math.abs(p.x) > WORLD.HALF + 12 || Math.abs(p.z) > WORLD.HALF + 12) {
        p.heading += Math.PI;
      }
      if (chance(rng, 0.002)) p.heading += range(rng, -1.2, 1.2);
      // Hindari gedung: bila masuk collider, putar balik.
      for (const c of colliders) {
        if (p.x > c.minX - 0.5 && p.x < c.maxX + 0.5 && p.z > c.minZ - 0.5 && p.z < c.maxZ + 0.5) {
          p.heading += Math.PI / 2;
          p.x -= Math.sin(p.heading) * sp * dt * 2;
          p.z -= Math.cos(p.heading) * sp * dt * 2;
          break;
        }
      }
      // Tertabrak mobil pemain yang melaju.
      const d = Math.hypot(p.x - playerPos.x, p.z - playerPos.z);
      if (playerSpeed > 4 && d < 2.0) {
        p.down = 2.2;
        p.mesh.rotation.x = -Math.PI / 2 + 0.2;
        if (onHitPed) onHitPed(p);
      } else if (playerSpeed > 1 && d < 5) {
        p.scared = 1.5;
        p.heading = Math.atan2(p.x - playerPos.x, p.z - playerPos.z);
      }
      p.phase += dt * sp * 3;
      const swing = Math.sin(p.phase) * 0.5;
      p.mesh.userData.legs[0].rotation.x = swing;
      p.mesh.userData.legs[1].rotation.x = -swing;
      p.mesh.position.set(p.x, 0, p.z);
      p.mesh.rotation.y = p.heading;
      p.mesh.rotation.x = p.down > 0 ? p.mesh.rotation.x : 0;
    }
  }

  return {
    people, addPerson, scareNear, update,
    touristsNear(x, z, radius) {
      return people.filter((p) => p.tourist && p.down <= 0 && Math.hypot(p.x - x, p.z - z) < radius);
    },
  };
}
