// vehicles.js — kendaraan Kota Karang: mobil lalu lintas, mobil pemain,
// sepeda motor, dan van logistik. Setiap kendaraan punya tangki bahan bakar
// dan bergerak di jalan; lalu lintas mengikuti garis jalan kota.
function makeVehicleMesh(kind, color) {
  var group = new THREE.Group();
  var bodyColor = color;
  var bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
  var darkMat = new THREE.MeshLambertMaterial({ color: 0x22262b });
  var glassMat = new THREE.MeshLambertMaterial({ color: 0x9fc4d8 });
  var bodyLen = kind === 'van' ? 5.6 : (kind === 'moto' ? 2.2 : 4.4);
  var bodyWid = kind === 'moto' ? 0.9 : 2.0;
  var bodyH = kind === 'van' ? 2.2 : 0.85;
  var body = new THREE.Mesh(new THREE.BoxGeometry(bodyWid, bodyH, bodyLen), bodyMat);
  body.position.y = kind === 'van' ? 1.5 : 0.85;
  group.add(body);
  if (kind !== 'moto') {
    var cabin = new THREE.Mesh(new THREE.BoxGeometry(bodyWid - 0.3, 0.75, kind === 'van' ? 2.2 : 2.0), glassMat);
    cabin.position.set(0, bodyH + 0.75, kind === 'van' ? 0.6 : -0.2);
    group.add(cabin);
  } else {
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 1.1), darkMat);
    seat.position.y = 1.0;
    group.add(seat);
    var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9), darkMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 1.25, 0.9);
    group.add(bar);
  }
  // Roda
  var wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 10);
  wheelGeo.rotateZ(Math.PI / 2);
  var wheelPos = kind === 'moto'
    ? [[0, 0.42, 0.85], [0, 0.42, -0.85]]
    : [[-0.95, 0.42, 1.35], [0.95, 0.42, 1.35], [-0.95, 0.42, -1.35], [0.95, 0.42, -1.35]];
  wheelPos.forEach(function (p) {
    var w = new THREE.Mesh(wheelGeo, darkMat);
    w.position.set(p[0], p[1], p[2]);
    group.add(w);
  });
  // Lampu depan dan belakang
  var headMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  [-0.6, 0.6].forEach(function (x) {
    var h = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.1), headMat);
    h.position.set(x, 0.95, -bodyLen / 2 - 0.02);
    group.add(h);
  });
  var tailMat = new THREE.MeshBasicMaterial({ color: 0xd92323 });
  [-0.6, 0.6].forEach(function (x) {
    var t = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.1), tailMat);
    t.position.set(x, 0.95, bodyLen / 2 + 0.02);
    group.add(t);
  });
  return group;
}

var KKVEHICLES = {
  list: [],
  traffic: [],
  // Palet warna mobil lalu lintas kota
  trafficColors: [0xc23b2e, 0xe8e2d2, 0x3a6fd8, 0xe8a33a, 0x5d6b7a, 0x7fa88f, 0xd97b5f],

  spawnTraffic: function (scene, rng, city) {
    var colors = this.trafficColors;
    for (var i = 0; i < KKCFG.trafficCount; i++) {
      var kind = rng.chance(0.85) ? 'car' : 'van';
      var v = this.create(scene, kind, rng.pick(colors), rng);
      // Letakkan di garis jalan acak, menghadap sepanjang jalan
      var alongX = rng.chance(0.5);
      var line = rng.pick(KKWORLD.roadLines);
      var other = rng.range(-150, 150);
      v.mesh.position.set(alongX ? line + 2 : other, 0, alongX ? other : line + 2);
      v.heading = alongX ? (rng.chance(0.5) ? 0 : Math.PI) : (rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2);
      v.speed = rng.range(7, 12);
      v.isTraffic = true;
      v.driver = 'traffic';
      this.traffic.push(v);
      this.list.push(v);
    }
  },

  create: function (scene, kind, color, rng) {
    var tank = kind === 'van' ? KKCFG.vanTank : (kind === 'moto' ? KKCFG.motoTank : KKCFG.carTank);
    var v = {
      kind: kind,
      color: color,
      mesh: makeVehicleMesh(kind, color),
      heading: 0,
      speed: 0,
      fuel: tank * (0.6 + (rng ? rng.next() * 0.4 : 0.4)),
      tank: tank,
      isTraffic: false,
      driver: null,
      name: kind === 'van' ? 'Van Logistik' : (kind === 'moto' ? 'Motor Karang' : 'Mobil'),
      steer: 0
    };
    scene.add(v.mesh);
    return v;
  },

  // Kendaraan terdekat yang bisa dinaiki pemain.
  nearestDrivable: function (x, z, maxDist) {
    var best = null, bestD = maxDist;
    for (var i = 0; i < this.list.length; i++) {
      var v = this.list[i];
      if (v.driver === 'traffic') continue;
      var dx = v.mesh.position.x - x, dz = v.mesh.position.z - z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d < bestD) { bestD = d; best = v; }
    }
    return best;
  },

  update: function (G, dt) {
    var slip = G.raining ? KKCFG.rainSlipAccel : 1;
    for (var i = 0; i < this.traffic.length; i++) {
      var v = this.traffic[i];
      var mx = v.mesh.position.x, mz = v.mesh.position.z;
      // Lalu lintas melaju lurus di jalannya, berbelok di ujung kota.
      var fx = -Math.sin(v.heading), fz = -Math.cos(v.heading);
      var nx = mx + fx * v.speed * dt * slip;
      var nz = mz + fz * v.speed * dt * slip;
      if (Math.abs(nx) > 168 || Math.abs(nz) > 168) {
        v.heading += Math.PI / 2; // belok di perempatan ujung
        nx = mx; nz = mz;
      }
      // Pelan bila ada kendaraan lain tepat di depan
      for (var j = 0; j < this.traffic.length; j++) {
        if (i === j) continue;
        var o = this.traffic[j];
        var dx = o.mesh.position.x - nx, dz = o.mesh.position.z - nz;
        if (dx * dx + dz * dz < 30 && (dx * fx + dz * fz) > 0) {
          nx = mx; nz = mz;
          break;
        }
      }
      v.mesh.position.x = nx;
      v.mesh.position.z = nz;
      v.mesh.rotation.y = v.heading;
    }
    // Kendaraan pemain: geser mesh mengikuti state pemain
    if (G.player && G.player.vehicle) {
      var pv = G.player.vehicle;
      pv.mesh.position.x = G.player.pos.x;
      pv.mesh.position.z = G.player.pos.z;
      pv.mesh.rotation.y = G.player.heading;
    }
  }
};
