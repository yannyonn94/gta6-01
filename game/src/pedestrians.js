// pedestrians.js — pejalan kaki Kota Karang: warga, turis berkamera,
// dan penjual pasar. Berjalan di trotoar, menghindar dari pemain,
// dan berlari ke tempat berteduh saat hujan turun.
var KKPEDESTRIANS = {
  list: [],

  spawn: function (scene, rng, city) {
    var shirts = [0xd94f3d, 0x3a6fd8, 0xe8a33a, 0x7fa88f, 0xe86aa8, 0xf2ede2, 0x5d6b7a];
    for (var i = 0; i < KKCFG.pedCount; i++) {
      var group = new THREE.Group();
      var shirt = rng.pick(shirts);
      var isTourist = rng.chance(0.3);
      var torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.9, 0.42),
        new THREE.MeshLambertMaterial({ color: shirt })
      );
      torso.position.y = 1.1;
      group.add(torso);
      var head = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.46, 0.46),
        new THREE.MeshLambertMaterial({ color: rng.pick([0xd9a066, 0x8a5a38, 0xe8c49a]) })
      );
      head.position.y = 1.85;
      group.add(head);
      if (isTourist) {
        // Topi dan kamera turis
        var hat = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.46, 0.16, 10),
          new THREE.MeshLambertMaterial({ color: 0xe8dcc0 })
        );
        hat.position.y = 2.12;
        group.add(hat);
        var cam = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.22, 0.16),
          new THREE.MeshLambertMaterial({ color: 0x22262b })
        );
        cam.position.set(0, 1.35, 0.28);
        group.add(cam);
      }
      [-0.22, 0.22].forEach(function (x) {
        var leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.8, 0.3),
          new THREE.MeshLambertMaterial({ color: 0x2c3440 })
        );
        leg.position.set(x, 0.4, 0);
        group.add(leg);
      });
      var lx = rng.range(-150, 150), lz = rng.range(-150, 150);
      group.position.set(lx, 0, lz);
      scene.add(group);
      this.list.push({
        mesh: group,
        heading: rng.range(0, Math.PI * 2),
        speed: rng.range(1.0, 1.9),
        tourist: isTourist,
        fleeing: false,
        alive: true,
        pause: rng.range(0, 3),
        shelterX: null,
        shelterZ: null
      });
    }
  },

  update: function (G, dt) {
    var px = G.player.pos.x, pz = G.player.pos.z;
    for (var i = 0; i < this.list.length; i++) {
      var ped = this.list[i];
      if (!ped.alive) continue;
      var dx = ped.mesh.position.x - px, dz = ped.mesh.position.z - pz;
      var distP = Math.sqrt(dx * dx + dz * dz);
      // Menghindar dari pemain / kendaraan yang mendekat
      if (distP < 5) {
        ped.heading = Math.atan2(-dx, -dz) + Math.PI;
        ped.fleeing = true;
      } else if (ped.fleeing && distP > 12) {
        ped.fleeing = false;
      }
      var speed = ped.speed;
      if (G.raining) {
        // Turis dan warga berlari ke tempat berteduh saat hujan
        if (ped.shelterX === null) {
          ped.shelterX = KKWORLD.market.x + (Math.random() - 0.5) * 20;
          ped.shelterZ = KKWORLD.market.z + (Math.random() - 0.5) * 20;
        }
        var sx = ped.shelterX - ped.mesh.position.x;
        var sz = ped.shelterZ - ped.mesh.position.z;
        var sd = Math.sqrt(sx * sx + sz * sz);
        if (sd > 3) {
          ped.heading = Math.atan2(-sx, -sz);
          speed = 3.4;
        } else {
          speed = 0;
        }
      } else {
        ped.shelterX = null;
        ped.shelterZ = null;
        if (ped.fleeing) speed = 3.6;
        // Turis yang dekat dengan pemain berhenti sejenak dan memotret
        if (ped.tourist && distP < 7 && !ped.fleeing) {
          ped.pause = Math.max(ped.pause, 1.5);
          ped.heading = Math.atan2(-dx, -dz);
          speed = 0;
        }
        // Berhenti sejenak sesekali, lalu ganti arah
        ped.pause -= dt;
        if (ped.pause <= 0) {
          ped.pause = 2 + Math.random() * 4;
          if (Math.random() < 0.5) ped.heading += (Math.random() - 0.5) * 2.2;
        }
      }
      var nx = ped.mesh.position.x - Math.sin(ped.heading) * speed * dt;
      var nz = ped.mesh.position.z - Math.cos(ped.heading) * speed * dt;
      if (!cityCollides(G.city, nx, nz, 0.6) && Math.abs(nx) < 195 && Math.abs(nz) < 195) {
        ped.mesh.position.x = nx;
        ped.mesh.position.z = nz;
      } else {
        ped.heading += Math.PI / 2;
      }
      ped.mesh.rotation.y = ped.heading;
      // Goyang langkah
      ped.mesh.position.y = speed > 0.2 ? Math.abs(Math.sin(performance.now() * 0.01 + i)) * 0.05 : 0;
    }
  },

  nearestInLine: function (G, x, z, fx, fz, maxDist) {
    var best = null, bestD = maxDist;
    for (var i = 0; i < this.list.length; i++) {
      var p = this.list[i];
      if (!p.alive) continue;
      var dx = p.mesh.position.x - x, dz = p.mesh.position.z - z;
      var along = dx * fx + dz * fz;
      if (along < 0 || along > bestD) continue;
      var side = Math.abs(dx * fz - dz * fx);
      if (side < 1.6) { bestD = along; best = p; }
    }
    return best;
  }
};
