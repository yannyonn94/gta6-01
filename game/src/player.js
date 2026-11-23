// player.js — pemain berjalan kaki: bergerak, lari (stamina), menembak,
// masuk dan keluar kendaraan. Kamera orang ketiga mengikuti dari belakang.
var KKPLAYER = {
  create: function (start) {
    var group = new THREE.Group();
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x2e7d5b });
    var skinMat = new THREE.MeshLambertMaterial({ color: 0xd9a066 });
    var pantsMat = new THREE.MeshLambertMaterial({ color: 0x2c3440 });
    var torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.0, 0.45), bodyMat);
    torso.position.y = 1.15;
    group.add(torso);
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
    head.position.y = 1.95;
    group.add(head);
    var cap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.55), new THREE.MeshLambertMaterial({ color: 0xc23b2e }));
    cap.position.y = 2.25;
    group.add(cap);
    [-0.25, 0.25].forEach(function (x) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.85, 0.32), pantsMat);
      leg.position.set(x, 0.45, 0);
      group.add(leg);
    });
    return {
      mesh: group,
      pos: new THREE.Vector3(start.x, 0, start.z),
      heading: start.heading,
      speed: 0,
      health: KKCFG.maxHealth,
      stamina: 100,
      onFoot: true,
      vehicle: null,
      moving: false,
      running: false,
      shootCooldown: 0,
      crashCooldown: 0
    };
  },

  updateOnFoot: function (G, dt) {
    var p = G.player;
    var axes = KKInput.moveAxes();
    var mouse = KKInput.consumeMouse();
    p.heading -= mouse.dx * 0.0035;
    var wantRun = KKInput.down('ShiftLeft') || KKInput.down('ShiftRight');
    var moving = (axes.x !== 0 || axes.z !== 0);
    p.moving = moving;
    p.running = moving && wantRun && p.stamina > 1;
    var speed = p.running ? KKCFG.runSpeed : KKCFG.walkSpeed;
    if (p.running) {
      p.stamina = Math.max(0, p.stamina - KKCFG.runStaminaDrain * dt);
      if (p.stamina < 20 && !p._warnedTired) {
        p._warnedTired = true;
        KKHUD.toast('Stamina hampir habis! Berhenti sebentar untuk memulihkan.');
      }
      if (p.stamina > 60) p._warnedTired = false;
    } else if (!moving) {
      p.stamina = Math.min(100, p.stamina + KKCFG.staminaRecover * dt);
    } else {
      p.stamina = Math.min(100, p.stamina + KKCFG.staminaRecoverWalk * dt);
    }
    if (moving) {
      // Gerak relatif terhadap arah hadap pemain
      var sin = Math.sin(p.heading), cos = Math.cos(p.heading);
      var dx = (axes.x * cos - axes.z * sin);
      var dz = (axes.x * sin + axes.z * cos);
      var len = Math.sqrt(dx * dx + dz * dz) || 1;
      var nx = p.pos.x + (dx / len) * speed * dt;
      var nz = p.pos.z + (dz / len) * speed * dt;
      if (!cityCollides(G.city, nx, nz, 0.7)) {
        p.pos.x = nx;
        p.pos.z = nz;
      }
      p.speed = speed;
    } else {
      p.speed = 0;
    }
    // Batasi pemain di dalam pulau
    p.pos.x = Math.max(-208, Math.min(208, p.pos.x));
    p.pos.z = Math.max(-208, Math.min(208, p.pos.z));
    p.mesh.position.copy(p.pos);
    p.mesh.rotation.y = p.heading;
    // Animasi jalan sederhana: badan bergoyang saat bergerak
    p.mesh.position.y = moving ? Math.abs(Math.sin(performance.now() * 0.012)) * 0.08 : 0;
    if (p.shootCooldown > 0) p.shootCooldown -= dt;
    if (p.crashCooldown > 0) p.crashCooldown -= dt;
  },

  // Tembakan: garis lurus ke arah hadap; kena pejalan kaki / polisi terdekat.
  shoot: function (G) {
    var p = G.player;
    if (!p.onFoot || p.shootCooldown > 0) return false;
    p.shootCooldown = 0.35;
    KKSound.shot();
    var fx = -Math.sin(p.heading), fz = -Math.cos(p.heading);
    var hitPed = KKPEDESTRIANS.nearestInLine(G, p.pos.x, p.pos.z, fx, fz, 26);
    if (hitPed) {
      hitPed.fleeing = true;
      hitPed.alive = false;
      G.wanted = Math.min(KKCFG.wantedMax, G.wanted + KKCFG.wantedShootPed);
      G.lastCrimeAt = G.elapsed;
      KKScore.add(G, 'shoot', KKCFG.scoreCrash);
      KKHUD.toast('Jangan tembak warga!');
      return true;
    }
    var hitCop = KKPOLICE.nearestInLine(G, p.pos.x, p.pos.z, fx, fz, 30);
    if (hitCop) {
      G.wanted = Math.min(KKCFG.wantedMax, G.wanted + KKCFG.wantedShootPolice);
      G.lastCrimeAt = G.elapsed;
      hitCop.stunned = 1.2;
      KKHUD.toast('Polisi ditembak! Buronan naik.');
      return true;
    }
    return true;
  },

  enterVehicle: function (G, vehicle) {
    var p = G.player;
    if (!vehicle || vehicle.fuel <= 0.5) {
      if (vehicle) KKHUD.toast('Tangki kosong! Cari SPBU.');
      return false;
    }
    p.vehicle = vehicle;
    p.onFoot = false;
    vehicle.driver = 'player';
    // Hapus dari lalu lintas bila itu mobil lalu lintas yang dicuri
    var ti = KKVEHICLES.traffic.indexOf(vehicle);
    if (ti >= 0) KKVEHICLES.traffic.splice(ti, 1);
    vehicle.isTraffic = false;
    p.pos.x = vehicle.mesh.position.x;
    p.pos.z = vehicle.mesh.position.z;
    p.heading = vehicle.heading;
    p.mesh.visible = false;
    if (!vehicle.stolen) {
      vehicle.stolen = true;
      G.wanted = Math.min(KKCFG.wantedMax, G.wanted + KKCFG.wantedSteal);
      G.lastCrimeAt = G.elapsed;
      KKScore.add(G, 'steal', KKCFG.scoreSteal);
      KKHUD.toast('Kendaraan dicuri! Buronan naik.');
    }
    KKSound.horn();
    return true;
  },

  exitVehicle: function (G) {
    var p = G.player;
    if (!p.vehicle) return;
    var v = p.vehicle;
    v.driver = null;
    v.speed = 0;
    p.vehicle = null;
    p.onFoot = true;
    p.pos.x = v.mesh.position.x + Math.sin(p.heading) * 2.2;
    p.pos.z = v.mesh.position.z + Math.cos(p.heading) * 2.2;
    p.mesh.visible = true;
    p.mesh.position.copy(p.pos);
  },

  // Mengemudi: gas, rem, belok, tabrakan, dan bahan bakar.
  updateDriving: function (G, dt) {
    var p = G.player;
    var v = p.vehicle;
    if (!v) return;
    var axes = KKInput.moveAxes();
    var slip = G.raining ? KKCFG.rainSlipAccel : 1;
    var grip = G.raining ? KKCFG.rainSlipGrip : 1;
    var accel = v.kind === 'moto' ? KKCFG.motoAccel : (v.kind === 'van' ? KKCFG.vanAccel : KKCFG.carAccel);
    var maxSpeed = v.kind === 'moto' ? KKCFG.motoMaxSpeed : (v.kind === 'van' ? KKCFG.vanMaxSpeed : KKCFG.carMaxSpeed);
    if (axes.z < 0) v.speed += accel * slip * dt;          // W = gas
    if (axes.z > 0) v.speed -= accel * 0.7 * dt;           // S = mundur
    if (KKInput.down('Space')) v.speed -= KKCFG.carBrake * dt; // Space = rem
    v.speed -= v.speed * 0.55 * dt;                        // hambatan
    v.speed = Math.max(-9, Math.min(maxSpeed, v.speed));
    var turnRate = (v.kind === 'moto' ? KKCFG.motoTurn : (v.kind === 'van' ? KKCFG.vanTurn : KKCFG.carTurn)) * grip;
    if (Math.abs(v.speed) > 0.5) {
      p.heading += axes.x * turnRate * dt * (v.speed > 0 ? 1 : -1) * Math.min(1, Math.abs(v.speed) / 8);
    }
    var fx = -Math.sin(p.heading), fz = -Math.cos(p.heading);
    var nx = p.pos.x + fx * v.speed * dt;
    var nz = p.pos.z + fz * v.speed * dt;
    var hit = cityCollides(G.city, nx, nz, 1.5);
    if (hit) {
      if (Math.abs(v.speed) > 8 && p.crashCooldown <= 0) {
        p.health = Math.max(0, p.health - KKCFG.crashDamage);
        p.crashCooldown = KKCFG.crashCooldown;
        G.wanted = Math.min(KKCFG.wantedMax, G.wanted + KKCFG.wantedCrash);
        G.lastCrimeAt = G.elapsed;
        KKScore.add(G, 'crash', KKCFG.scoreCrash);
        KKHUD.toast('Tabrakan! Kesehatan berkurang.');
        KKSound.crash();
      }
      v.speed *= -0.25;
    } else {
      p.pos.x = nx;
      p.pos.z = nz;
    }
    // Tabrakan dengan mobil lalu lintas
    for (var i = 0; i < KKVEHICLES.traffic.length; i++) {
      var o = KKVEHICLES.traffic[i];
      var dx = o.mesh.position.x - p.pos.x, dz = o.mesh.position.z - p.pos.z;
      if (dx * dx + dz * dz < 9 && Math.abs(v.speed) > 6 && p.crashCooldown <= 0) {
        p.health = Math.max(0, p.health - KKCFG.crashDamage);
        p.crashCooldown = KKCFG.crashCooldown;
        o.speed = 0;
        KKHUD.toast('Menabrak mobil lain!');
        KKSound.crash();
      }
    }
    p.pos.x = Math.max(-208, Math.min(208, p.pos.x));
    p.pos.z = Math.max(-208, Math.min(208, p.pos.z));
    v.heading = p.heading;
    v.mesh.position.set(p.pos.x, 0, p.pos.z);
    v.mesh.rotation.y = p.heading;
    // Bahan bakar
    KKFUEL.drain(v, Math.abs(v.speed) / maxSpeed, dt);
    if (v.fuel <= 0) {
      v.speed = 0;
      KKHUD.toast('Bensin habis! Tekan E untuk turun, cari SPBU.');
    }
  }
};
