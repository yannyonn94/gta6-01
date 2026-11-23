// shots.js — staging screenshot dari parameter URL.
// Contoh: game/index.html?shot=chase&seed=7&hour=17
// Nama shot: start, play, chase, drive, koin, hujan, foto, end.
// Saat shot di-stage: overlay awal disembunyikan, HUD ditampilkan,
// jam diatur, pemain/kamera/kendaraan/polisi diposisikan untuk adegan itu.
var KKSHOTS = {
  params: function () {
    var q = new URLSearchParams(window.location.search);
    return {
      shot: q.get('shot') || '',
      seed: parseInt(q.get('seed'), 10) || 20261123,
      hour: parseFloat(q.get('hour')) || 11
    };
  },

  isStaging: function () {
    return !!this.params().shot;
  },

  // Posisikan pemain + kendaraan + polisi untuk adegan tertentu.
  // Dipanggil game_main setelah dunia dan misi siap.
  apply: function (G, shot) {
    var W = KKWORLD;
    var p = G.player;
    function placeVehicle(kind, color, x, z, heading) {
      var v = KKVEHICLES.create(G.scene, kind, color, null);
      v.mesh.position.set(x, 0, z);
      v.heading = heading;
      v.mesh.rotation.y = heading;
      v.fuel = v.tank;
      KKVEHICLES.list.push(v);
      return v;
    }
    function placeCop(x, z, heading) {
      var c = KKPOLICE.makeCruiser(G.scene);
      c.group.position.set(x, 0, z);
      c.group.rotation.y = heading;
      G.scene.add(c.group);
      var cop = { mesh: c.group, blue: c.blue, red: c.red, heading: heading, speed: 14, stunned: 0, flash: Math.random() * 9 };
      KKPOLICE.list.push(cop);
      return cop;
    }
    function putPlayer(x, z, heading) {
      p.pos.set(x, 0, z);
      p.heading = heading;
      p.mesh.position.copy(p.pos);
      p.mesh.rotation.y = heading;
      p.mesh.visible = true;
    }
    function putPlayerIn(v) {
      p.vehicle = v;
      p.onFoot = false;
      v.driver = 'player';
      p.pos.set(v.mesh.position.x, 0, v.mesh.position.z);
      p.heading = v.heading;
      p.mesh.visible = false;
    }

    if (shot === 'start') {
      // Pandangan udara kota di siang hari
      putPlayer(-40, 40, Math.PI * 0.75);
      G.cameraMode = 'aerial';
      G.aerialTarget = { x: 0, z: 0 };
      KKDAY.setHour(11);
      KKMISSIONS.index = 0;
      KKMISSIONS.state = 'active';
    } else if (shot === 'play') {
      // Jalan kaki di jalan utama dekat pasar, misi 1 berjalan, koin terlihat.
      // Pemain berdiri di jalan terbuka (garis x=32) menghadap barat ke arah
      // kios pasar, supaya atap kios tidak menutupi kamera di belakangnya.
      putPlayer(32, 96, Math.PI / 2);
      KKMISSIONS.index = 0;
      KKMISSIONS.state = 'active';
      KKMISSIONS.setupMission(G);
      var coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.7, 0.2, 18),
        new THREE.MeshLambertMaterial({ color: 0xf2c230, emissive: 0x664400 })
      );
      // Cakram menghadap kamera (sumbu X), supaya koin emas terbaca jelas
      coin.rotation.z = Math.PI / 2;
      coin.userData.fixedShot = true;
      coin.position.set(18, 1.2, 92);
      G.scene.add(coin);
      KKMISSIONS.coinMeshes.push(coin);
      var car = placeVehicle('car', 0xd97b5f, 28, 78, Math.PI);
      car.stolen = true;
      // Pejalan kaki di dekat pasar supaya jalan terasa hidup
      KKDAY.setHour(11);
      G.cameraMode = 'follow';
    } else if (shot === 'chase') {
      // Tiga mobil polisi mengejar di sore hari, buronan 3 bintang.
      // Polisi mengepung dari samping dan belakang mobil pemain.
      var chaseCar = placeVehicle('car', 0xc23b2e, 0, -20, Math.PI);
      putPlayerIn(chaseCar);
      G.wanted = 3;
      G.lastCrimeAt = G.elapsed;
      placeCop(7, -2, Math.PI);
      placeCop(-8, 6, Math.PI);
      placeCop(2, 16, Math.PI);
      KKDAY.setHour(17);
      KKDAY.setRain(false, 0);
      G.cameraMode = 'follow';
      KKMISSIONS.index = 2;
      KKMISSIONS.state = 'active';
    } else if (shot === 'drive') {
      // Van logistik menembus hujan deras di jalan barat, buronan 3,
      // roadblock menutup jalan tepat di depan van.
      var van = placeVehicle('van', 0xe8e2d2, -96, 64, Math.PI / 2);
      putPlayerIn(van);
      G.wanted = 3;
      G.lastCrimeAt = G.elapsed;
      KKMISSIONS.index = 6;
      KKMISSIONS.state = 'active';
      KKMISSIONS.setupMission(G);
      KKDAY.setHour(16);
      KKDAY.setRain(true, 1);
      // Roadblock di depan van, melintang di jalan z=64
      var rb1 = placeCop(-136, 58, Math.PI / 2);
      var rb2 = placeCop(-136, 70, Math.PI / 2);
      rb1.mesh.rotation.y = Math.PI;
      rb2.mesh.rotation.y = Math.PI;
      placeCop(-112, 56, Math.PI / 2);
      G.cameraMode = 'follow';
    } else if (shot === 'koin') {
      putPlayer(W.market.x + 10, W.market.z - 4, Math.PI);
      KKMISSIONS.index = 5;
      KKMISSIONS.state = 'active';
      KKMISSIONS.setupMission(G);
      KKDAY.setHour(10);
      G.cameraMode = 'follow';
    } else if (shot === 'hujan') {
      putPlayer(-32, 96, Math.PI / 2);
      KKDAY.setHour(15);
      KKDAY.setRain(true, 0.8);
      KKMISSIONS.index = 1;
      KKMISSIONS.state = 'active';
      KKMISSIONS.setupMission(G);
      G.cameraMode = 'follow';
    } else if (shot === 'foto') {
      putPlayer(120, -120, Math.PI * 0.25);
      KKDAY.setHour(18);
      G.photoMode = true;
      G.cameraMode = 'follow';
    } else if (shot === 'end') {
      putPlayer(0, 0, Math.PI);
      KKMISSIONS.index = 7;
      KKMISSIONS.state = 'done';
      G.gameWon = true;
      KKDAY.setHour(12);
      G.cameraMode = 'follow';
    } else {
      G.cameraMode = 'follow';
    }
    // Sembunyikan overlay awal dan tampilkan HUD saat staging
    var overlay = document.getElementById('startOverlay');
    if (overlay) overlay.style.display = 'none';
    var hud = document.getElementById('hud');
    if (hud) hud.style.display = 'block';
    G.started = true;
    G.paused = false;
  }
};
