// police.js — polisi Kota Karang: mobil patroli, pengejaran dengan
// kemudi prediktif (mengejar titik di depan pemain), dan roadblock
// saat buronan 3 bintang atau lebih.
var KKPOLICE = {
  list: [],
  roadblocks: [],

  makeCruiser: function (scene) {
    var group = new THREE.Group();
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x1d4e89 });
    var whiteMat = new THREE.MeshLambertMaterial({ color: 0xf2ede2 });
    var darkMat = new THREE.MeshLambertMaterial({ color: 0x22262b });
    var body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 4.4), bodyMat);
    body.position.y = 0.85;
    group.add(body);
    var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 2.0), whiteMat);
    cabin.position.set(0, 1.6, -0.2);
    group.add(cabin);
    var lightBar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.5), new THREE.MeshLambertMaterial({ color: 0xd92323 }));
    lightBar.position.set(0, 2.1, -0.2);
    group.add(lightBar);
    var blue = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.5), new THREE.MeshBasicMaterial({ color: 0x2a6fd8 }));
    blue.position.set(-0.32, 2.1, -0.2);
    group.add(blue);
    var red = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.5), new THREE.MeshBasicMaterial({ color: 0xd92323 }));
    red.position.set(0.32, 2.1, -0.2);
    group.add(red);
    var wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 10);
    wheelGeo.rotateZ(Math.PI / 2);
    [[-0.95, 1.35], [0.95, 1.35], [-0.95, -1.35], [0.95, -1.35]].forEach(function (p) {
      var w = new THREE.Mesh(wheelGeo, darkMat);
      w.position.set(p[0], 0.42, p[1]);
      group.add(w);
    });
    return { group: group, blue: blue, red: red, lightBar: lightBar };
  },

  spawn: function (G, count) {
    while (this.list.length < count && this.list.length < KKCFG.policeMaxActive) {
      var c = this.makeCruiser(G.scene);
      var angle = Math.random() * Math.PI * 2;
      var px = G.player.pos.x + Math.cos(angle) * KKCFG.policeSpawnRadius;
      var pz = G.player.pos.z + Math.sin(angle) * KKCFG.policeSpawnRadius;
      px = Math.max(-170, Math.min(170, px));
      pz = Math.max(-170, Math.min(170, pz));
      c.group.position.set(px, 0, pz);
      G.scene.add(c.group);
      this.list.push({
        mesh: c.group, blue: c.blue, red: c.red,
        heading: angle, speed: 0, stunned: 0, flash: Math.random() * 10
      });
    }
  },

  despawnExtra: function (G, wantedCount) {
    while (this.list.length > wantedCount) {
      var c = this.list.pop();
      G.scene.remove(c.mesh);
    }
  },

  update: function (G, dt) {
    var wanted = G.wanted;
    var wantCount = wanted === 0 ? 0 : Math.min(KKCFG.policeMaxActive, 1 + wanted);
    if (wanted > 0) this.spawn(G, wantCount);
    else this.despawnExtra(G, 0);
    var px = G.player.pos.x, pz = G.player.pos.z;
    var pSpeed = G.player.vehicle ? Math.abs(G.player.vehicle.speed) : G.player.speed;
    for (var i = 0; i < this.list.length; i++) {
      var cop = this.list[i];
      if (cop.stunned > 0) {
        cop.stunned -= dt;
        cop.speed *= 0.9;
        continue;
      }
      // Kemudi prediktif: kejar titik di depan pemain sesuai kecepatannya
      var lookAhead = 0.9 + pSpeed * 0.12;
      var fx = -Math.sin(G.player.heading), fz = -Math.cos(G.player.heading);
      var tx = px + fx * pSpeed * lookAhead;
      var tz = pz + fz * pSpeed * lookAhead;
      var dx = tx - cop.mesh.position.x, dz = tz - cop.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz) || 1;
      var wantHeading = Math.atan2(-dx, -dz);
      var diff = wantHeading - cop.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      cop.heading += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
      var topSpeed = KKCFG.policeBaseSpeed + KKCFG.policeSpeedPerStar * wanted;
      cop.speed += (topSpeed - cop.speed) * Math.min(1, dt * 1.2);
      var nx = cop.mesh.position.x - Math.sin(cop.heading) * cop.speed * dt;
      var nz = cop.mesh.position.z - Math.cos(cop.heading) * cop.speed * dt;
      if (!cityCollides(G.city, nx, nz, 1.4)) {
        cop.mesh.position.x = nx;
        cop.mesh.position.z = nz;
      } else {
        cop.heading += 0.6; // menghindar dari gedung
      }
      cop.mesh.rotation.y = cop.heading;
      // Lampu strobo merah-biru berkedip
      cop.flash += dt * 9;
      var on = Math.sin(cop.flash) > 0;
      cop.blue.visible = on;
      cop.red.visible = !on;
      // Menangkap pemain: kesehatan berkurang, buronan tetap
      if (dist < KKCFG.policeCatchRadius && G.player.crashCooldown <= 0) {
        G.player.health = Math.max(0, G.player.health - 12);
        G.player.crashCooldown = 1.2;
        KKHUD.toast('Polisi menangkapmu! Kesehatan berkurang.');
      }
    }
    // Roadblock saat buronan 3+: dua mobil polisi melintang di depan pemain
    if (wanted >= KKCFG.roadblockAtWanted && this.roadblocks.length === 0) {
      this.buildRoadblock(G);
    }
    if (wanted < KKCFG.roadblockAtWanted && this.roadblocks.length > 0) {
      this.clearRoadblock(G);
    }
    // Pindahkan roadblock mengikuti pemain setiap beberapa detik
    if (this.roadblocks.length > 0) {
      this._rbTimer = (this._rbTimer || 0) + dt;
      if (this._rbTimer > 9) {
        this._rbTimer = 0;
        this.clearRoadblock(G);
        this.buildRoadblock(G);
      }
    }
  },

  buildRoadblock: function (G) {
    var fx = -Math.sin(G.player.heading), fz = -Math.cos(G.player.heading);
    var cx = G.player.pos.x + fx * 34, cz = G.player.pos.z + fz * 34;
    for (var k = -1; k <= 1; k++) {
      var c = this.makeCruiser(G.scene);
      var ox = -fz * k * 6, oz = fx * k * 6;
      c.group.position.set(cx + ox, 0, cz + oz);
      c.group.rotation.y = G.player.heading + Math.PI / 2;
      G.scene.add(c.group);
      this.roadblocks.push({ mesh: c.group, blue: c.blue, red: c.red, flash: k * 2 });
      G.city.colliders.push({ x: cx + ox, z: cz + oz, hw: 2.2, hd: 2.2 });
    }
    KKHUD.toast('Roadblock polisi di depan!');
  },

  clearRoadblock: function (G) {
    for (var i = 0; i < this.roadblocks.length; i++) {
      G.scene.remove(this.roadblocks[i].mesh);
    }
    // Hapus tiga collider roadblock (yang terakhir ditambahkan ke kota)
    var removeCount = this.roadblocks.length;
    if (removeCount > 0) {
      G.city.colliders.splice(G.city.colliders.length - removeCount, removeCount);
    }
    this.roadblocks = [];
  },

  nearestInLine: function (G, x, z, fx, fz, maxDist) {
    var best = null, bestD = maxDist;
    for (var i = 0; i < this.list.length; i++) {
      var c = this.list[i];
      var dx = c.mesh.position.x - x, dz = c.mesh.position.z - z;
      var along = dx * fx + dz * fz;
      if (along < 0 || along > bestD) continue;
      var side = Math.abs(dx * fz - dz * fx);
      if (side < 2.2) { bestD = along; best = c; }
    }
    return best;
  }
};
