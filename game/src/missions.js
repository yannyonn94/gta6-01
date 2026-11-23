// missions.js — mesin misi Kota Karang: 7 misi berurutan dengan
// tujuan, penanda di dunia, timer, dan hadiah uang.
// Setiap misi menulis teks tujuannya sendiri ke HUD.
var KKMISSIONS = {
  index: 0,          // 0..6 misi aktif, 7 = semua selesai
  state: 'idle',     // idle | active | done
  timer: 0,
  progress: 0,
  collected: 0,
  sprintStart: null,
  sprintDist: 0,
  hideTimer: 0,
  markers: [],
  markerMesh: null,
  bagMeshes: [],
  coinMeshes: [],
  targetVehicle: null,

  NAMES: [
    'Kereta Mati',
    'Kantong Hilang',
    'Hilang Sejenak',
    'Sprint Pantai',
    'Parkir Presisi',
    'Koin Karang',
    'Badai Karang'
  ],

  objectiveText: function (G) {
    switch (this.index) {
      case 0: return 'Misi 1 Kereta Mati: curi mobil biru di garasi, antar ke dermaga.';
      case 1: return 'Misi 2 Kantong Hilang: kumpulkan ' + this.collected + '/' + KKCFG.missionBagCount + ' kantong di kota.';
      case 2: return 'Misi 3 Hilang Sejenak: sembunyi sampai buronan hilang (' + Math.ceil(this.hideTimer) + ' dtk).';
      case 3: return 'Misi 4 Sprint Pantai: tempuh ' + Math.floor(this.sprintDist) + '/' + KKCFG.missionSprintMeters + ' m di pantai — ' + Math.ceil(this.timer) + ' dtk.';
      case 4: return 'Misi 5 Parkir Presisi: parkir rapi di dalam kotak kuning.';
      case 5: return 'Misi 6 Koin Karang: kumpulkan ' + this.collected + '/' + KKCFG.missionCoinCount + ' koin emas.';
      case 6: return 'Misi 7 Badai Karang: antar van ke gudang barat — ' + Math.floor(this.progress) + ' m lagi, ' + Math.ceil(this.timer) + ' dtk, hujan badai!';
      default: return 'Semua misi selesai! Kota Karang milikmu.';
    }
  },

  start: function (G) {
    this.index = 0;
    this.state = 'active';
    this.setupMission(G);
    KKHUD.toast('Misi 1: Kereta Mati — curi mobil biru di garasi!');
  },

  // Penanda silinder emas melayang di titik tujuan.
  setMarker: function (G, x, z) {
    this.clearMarker(G);
    var mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.4, 20),
      new THREE.MeshBasicMaterial({ color: 0xe8c33a, transparent: true, opacity: 0.8 })
    );
    mesh.position.set(x, 0.4, z);
    G.scene.add(mesh);
    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 26, 6),
      new THREE.MeshBasicMaterial({ color: 0xe8c33a, transparent: true, opacity: 0.5 })
    );
    pole.position.set(x, 13, z);
    G.scene.add(pole);
    this.markerMesh = mesh;
    this._pole = pole;
  },
  clearMarker: function (G) {
    if (this.markerMesh) { G.scene.remove(this.markerMesh); this.markerMesh = null; }
    if (this._pole) { G.scene.remove(this._pole); this._pole = null; }
  },
  clearPickups: function (G) {
    var self = this;
    this.bagMeshes.forEach(function (m) { G.scene.remove(m); });
    this.coinMeshes.forEach(function (m) { G.scene.remove(m); });
    this.bagMeshes = [];
    this.coinMeshes = [];
  },

  setupMission: function (G) {
    this.clearPickups(G);
    this.collected = 0;
    this.progress = 0;
    var W = KKWORLD;
    if (this.index === 0) {
      // Mobil biru sudah disiapkan di garasi oleh game_main
      this.setMarker(G, W.pier.x, W.pier.z);
    } else if (this.index === 1) {
      G.city.bagSpots.forEach(function (spot) {
        var bag = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 0.8, 0.8),
          new THREE.MeshLambertMaterial({ color: 0x8a5a2e })
        );
        bag.position.set(spot.x, 0.6, spot.z);
        G.scene.add(bag);
        KKMISSIONS.bagMeshes.push(bag);
      });
      this.setMarker(G, G.city.bagSpots[0].x, G.city.bagSpots[0].z);
    } else if (this.index === 2) {
      this.hideTimer = KKCFG.missionHideTime;
      this.clearMarker(G);
    } else if (this.index === 3) {
      this.timer = KKCFG.missionSprintTime;
      this.sprintDist = 0;
      this.sprintStart = { x: G.player.pos.x, z: G.player.pos.z };
      this.setMarker(G, 150, 190);
    } else if (this.index === 4) {
      this.setMarker(G, W.parkBay.x, W.parkBay.z);
      // Kotak parkir kuning di tanah
      var bay = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 8),
        new THREE.MeshBasicMaterial({ color: 0xe8c33a, transparent: true, opacity: 0.55 })
      );
      bay.rotation.x = -Math.PI / 2;
      bay.position.set(W.parkBay.x, 0.12, W.parkBay.z);
      G.scene.add(bay);
      this._bay = bay;
    } else if (this.index === 5) {
      G.city.coinSpots.forEach(function (spot) {
        var coin = new THREE.Mesh(
          new THREE.CylinderGeometry(1.0, 1.0, 0.25, 18),
          new THREE.MeshLambertMaterial({ color: 0xf2c230, emissive: 0x664400 })
        );
        coin.rotation.x = Math.PI / 3; // miring supaya terbaca dari berbagai sudut
        coin.position.set(spot.x, 1.4, spot.z);
        G.scene.add(coin);
        KKMISSIONS.coinMeshes.push(coin);
      });
      this.setMarker(G, G.city.coinSpots[0].x, G.city.coinSpots[0].z);
    } else if (this.index === 6) {
      this.timer = 150;
      G.raining = true;
      G.rainAmount = 1;
      // Van logistik disiapkan game_main; roadblock muncul karena wanted 3
      G.wanted = Math.max(G.wanted, 3);
      this.setMarker(G, W.warehouse.x, W.warehouse.z);
      KKHUD.toast('Badai Karang: hujan deras! Antar van ke gudang barat, awas roadblock.');
    }
  },

  completeMission: function (G) {
    var reward = KKCFG.missionReward[this.index] || 500;
    G.money += reward;
    KKScore.add(G, 'mission', reward);
    G.player.health = Math.min(KKCFG.maxHealth, G.player.health + KKCFG.missionHeal);
    KKHUD.toast('Misi selesai! +$' + reward);
    KKSound.jingle();
    this.index++;
    if (this._bay) { G.scene.remove(this._bay); this._bay = null; }
    if (this.index >= 7) {
      this.state = 'done';
      this.clearMarker(G);
      this.clearPickups(G);
      KKHUD.toast('SEMUA MISI SELESAI! Kamu legenda Kota Karang.');
      G.gameWon = true;
      return;
    }
    this.setupMission(G);
    KKHUD.toast('Misi ' + (this.index + 1) + ': ' + this.NAMES[this.index]);
  },

  update: function (G, dt) {
    if (this.state !== 'active') return;
    var p = G.player;
    var W = KKWORLD;
    // Putar koin dan penanda (koin staging shot diam menghadap kamera)
    var t = G.elapsed;
    this.coinMeshes.forEach(function (c, i) {
      if (!c.userData.fixedShot) {
        c.rotation.y = t * KKCFG.coinSpinSpeed + i;
      }
      c.position.y = 1.4 + Math.sin(t * 2 + i) * 0.25;
    });
    if (this.markerMesh) {
      this.markerMesh.position.y = 0.4 + Math.sin(t * 2.4) * 0.15;
      this.markerMesh.rotation.y = t * 0.8;
    }

    if (this.index === 0) {
      // Selesai bila pemain (dengan mobil biru atau jalan kaki) sampai di dermaga
      var dx = p.pos.x - W.pier.x, dz = p.pos.z - W.pier.z;
      if (dx * dx + dz * dz < 130) this.completeMission(G);
    } else if (this.index === 1) {
      for (var i = this.bagMeshes.length - 1; i >= 0; i--) {
        var bag = this.bagMeshes[i];
        var bdx = p.pos.x - bag.position.x, bdz = p.pos.z - bag.position.z;
        if (bdx * bdx + bdz * bdz < 6) {
          G.scene.remove(bag);
          this.bagMeshes.splice(i, 1);
          this.collected++;
          KKScore.add(G, 'bag', KKCFG.scoreBag);
          KKSound.pickup();
          if (this.bagMeshes.length > 0) {
            var nb = this.bagMeshes[0];
            this.setMarker(G, nb.position.x, nb.position.z);
          }
        }
      }
      if (this.collected >= KKCFG.missionBagCount) this.completeMission(G);
    } else if (this.index === 2) {
      // Hitung mundur hanya bila benar-benar tidak ada polisi di dekatmu
      var copNear = false;
      KKPOLICE.list.forEach(function (c) {
        var dx = c.mesh.position.x - p.pos.x, dz = c.mesh.position.z - p.pos.z;
        if (dx * dx + dz * dz < 25 * 25) copNear = true;
      });
      if (G.wanted === 0 && !copNear) {
        this.hideTimer -= dt;
        if (this.hideTimer <= 0) this.completeMission(G);
      } else {
        this.hideTimer = KKCFG.missionHideTime;
      }
    } else if (this.index === 3) {
      this.timer -= dt;
      // Jarak tempuh di zona pantai (tepi pulau)
      var onBeach = Math.abs(p.pos.x) > 165 || Math.abs(p.pos.z) > 165;
      if (onBeach) {
        var step = p.vehicle ? Math.abs(p.vehicle.speed) * dt : p.speed * dt;
        this.sprintDist += step;
      }
      if (this.sprintDist >= KKCFG.missionSprintMeters) this.completeMission(G);
      else if (this.timer <= 0) {
        this.timer = KKCFG.missionSprintTime;
        this.sprintDist = 0;
        KKHUD.toast('Waktu habis! Sprint pantai diulang dari awal.');
      }
    } else if (this.index === 4) {
      var pdx = p.pos.x - W.parkBay.x, pdz = p.pos.z - W.parkBay.z;
      var inBay = (pdx * pdx + pdz * pdz) < KKCFG.missionParkRadius * KKCFG.missionParkRadius;
      var slow = p.vehicle ? Math.abs(p.vehicle.speed) < 1.5 : p.speed < 1.5;
      var angleOk = true;
      if (p.vehicle) {
        var ah = Math.abs(Math.sin(p.heading - W.parkBay.angle));
        angleOk = ah < KKCFG.missionParkAngle;
      }
      if (inBay && slow && angleOk) {
        this._parkHold = (this._parkHold || 0) + dt;
        if (this._parkHold > 1.5) { this._parkHold = 0; this.completeMission(G); }
      } else {
        this._parkHold = 0;
      }
    } else if (this.index === 5) {
      for (var j = this.coinMeshes.length - 1; j >= 0; j--) {
        var coin = this.coinMeshes[j];
        var cdx = p.pos.x - coin.position.x, cdz = p.pos.z - coin.position.z;
        if (cdx * cdx + cdz * cdz < 7) {
          G.scene.remove(coin);
          this.coinMeshes.splice(j, 1);
          this.collected++;
          KKScore.add(G, 'coin', KKCFG.scoreCoin);
          KKSound.pickup();
          if (this.coinMeshes.length > 0) {
            var nc = this.coinMeshes[0];
            this.setMarker(G, nc.position.x, nc.position.z);
          }
        }
      }
      if (this.collected >= KKCFG.missionCoinCount) this.completeMission(G);
    } else if (this.index === 6) {
      this.timer -= dt;
      var wdx = p.pos.x - W.warehouse.x, wdz = p.pos.z - W.warehouse.z;
      this.progress = Math.sqrt(wdx * wdx + wdz * wdz);
      var inVan = p.vehicle && p.vehicle.kind === 'van';
      if (this.progress < 14 && inVan) this.completeMission(G);
      else if (this.timer <= 0) {
        this.timer = 150;
        KKHUD.toast('Waktu habis! Badai Karang diulang — van tetap di tempatmu.');
      }
    }
  }
};
