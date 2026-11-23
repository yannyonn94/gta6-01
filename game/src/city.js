// city.js — membangun Pulau Karang: tanah, laut, pantai, jalan, gedung,
// mercusuar, dermaga, pasar, SPBU, garasi, gudang, pohon, dan properti jalan.
// Mengembalikan data tabrakan (AABB) dan semua titik penting untuk misi.
function buildKotaKarang(scene, rng) {
  var W = KKWORLD;
  var city = {
    colliders: [],   // {x, z, hw, hd} kotak tabrakan
    buildings: [],
    stations: [W.stationNW, W.stationSE],
    garagePos: W.garage,
    pierPos: W.pier,
    warehousePos: W.warehouse,
    marketPos: W.market,
    parkBay: W.parkBay,
    lighthousePos: W.lighthouse,
    roadLines: W.roadLines,
    treeSpots: [],
    coinSpots: [],
    bagSpots: []
  };
  var colliders = city.colliders;

  function addCollider(x, z, hw, hd) {
    colliders.push({ x: x, z: z, hw: hw, hd: hd });
  }
  function box(w, h, d, color, x, y, z, parent) {
    var mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color: color })
    );
    mesh.position.set(x, y, z);
    (parent || scene).add(mesh);
    return mesh;
  }
  function cylinder(rt, rb, h, color, x, y, z, seg) {
    var mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rt, rb, h, seg || 12),
      new THREE.MeshLambertMaterial({ color: color })
    );
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  // --- Laut dan pulau ---
  var sea = new THREE.Mesh(
    new THREE.PlaneGeometry(W.seaSize, W.seaSize),
    new THREE.MeshLambertMaterial({ color: W.seaColor })
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.6;
  scene.add(sea);

  var sand = new THREE.Mesh(
    new THREE.PlaneGeometry(W.islandSize, W.islandSize),
    new THREE.MeshLambertMaterial({ color: W.sandColor })
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = -0.15;
  scene.add(sand);

  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(W.islandSize - W.beachBand * 2, W.islandSize - W.beachBand * 2),
    new THREE.MeshLambertMaterial({ color: W.grassColor })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);

  // --- Jalan: strip aspal di tiap garis jalan, plus garis tengah kuning ---
  var roadMat = new THREE.MeshLambertMaterial({ color: W.roadColor });
  var lineMat = new THREE.MeshLambertMaterial({ color: 0xe8c33a });
  W.roadLines.forEach(function (c) {
    var ns = new THREE.Mesh(new THREE.PlaneGeometry(W.roadWidth, W.islandSize - W.beachBand * 2), roadMat);
    ns.rotation.x = -Math.PI / 2;
    ns.position.set(c, 0.05, 0);
    scene.add(ns);
    var ew = new THREE.Mesh(new THREE.PlaneGeometry(W.islandSize - W.beachBand * 2, W.roadWidth), roadMat);
    ew.rotation.x = -Math.PI / 2;
    ew.position.set(0, 0.05, c);
    scene.add(ew);
    for (var k = -4; k <= 4; k++) {
      var dash = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 3), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(c, 0.08, k * 32);
      scene.add(dash);
      var dash2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.5), lineMat);
      dash2.rotation.x = -Math.PI / 2;
      dash2.position.set(k * 32, 0.08, c);
      scene.add(dash2);
    }
  });

  // --- Gedung: tiap blok 10x10, tinggi dan warna bervariasi dari seed ---
  for (var i = 0; i < W.gridBlocks; i++) {
    for (var j = 0; j < W.gridBlocks; j++) {
      var bx = -144 + i * W.pitch;
      var bz = -144 + j * W.pitch;
      // Sisakan lahan untuk pasar, garasi, dan SPBU
      if (Math.abs(bx - W.market.x) < 20 && Math.abs(bz - W.market.z) < 20) continue;
      if (Math.abs(bx - W.garage.x) < 20 && Math.abs(bz - W.garage.z) < 20) continue;
      if (Math.abs(bx - W.stationNW.x) < 20 && Math.abs(bz - W.stationNW.z) < 20) continue;
      if (Math.abs(bx - W.stationSE.x) < 20 && Math.abs(bz - W.stationSE.z) < 20) continue;
      if (rng.chance(0.18)) continue; // taman kosong
      var w = rng.range(10, 18), d = rng.range(10, 18);
      var h = rng.pick([6, 8, 10, 12, 16, 22, 30]);
      var color = rng.pick(W.palette);
      var ox = rng.range(-2, 2), oz = rng.range(-2, 2);
      var b = box(w, h, d, color, bx + ox, h / 2, bz + oz);
      // Atap datar warna berbeda
      box(w + 0.6, 0.5, d + 0.6, rng.pick(W.roofColors), bx + ox, h + 0.25, bz + oz);
      // Jendela: kotak kecil terang di sisi depan
      var winMat = new THREE.MeshLambertMaterial({ color: 0xffe9a8, emissive: 0x332200 });
      for (var f = 0; f < Math.floor(h / 3); f++) {
        var win = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.6, 1.1), winMat);
        win.position.set(bx + ox, 2.5 + f * 3, bz + oz + d / 2 + 0.06);
        scene.add(win);
      }
      city.buildings.push(b);
      addCollider(bx + ox, bz + oz, w / 2 + 0.4, d / 2 + 0.4);
    }
  }

  // --- Mercusuar di tanjung timur laut, dengan lampu putar ---
  var lh = W.lighthouse;
  cylinder(7, 9, 6, 0x8a8f96, lh.x, 3, lh.z, 10);
  var tower = cylinder(3.2, 4.4, lh.height, 0xf2ede2, lh.x, 6 + lh.height / 2, lh.z, 12);
  // Garis merah pada menara
  cylinder(3.45, 3.9, 5, 0xc23b2e, lh.x, 22, lh.z, 12);
  cylinder(3.3, 3.6, 5, 0xc23b2e, lh.x, 36, lh.z, 12);
  var lampRoom = cylinder(3.6, 3.6, 4, 0x222831, lh.x, 6 + lh.height + 2, lh.z, 12);
  var beam = new THREE.Mesh(
    new THREE.ConeGeometry(6, 42, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  beam.rotation.z = Math.PI / 2;
  beam.position.set(lh.x + 21, 6 + lh.height + 2, lh.z);
  scene.add(beam);
  var lampLight = new THREE.PointLight(0xffe9a0, 1.2, 120);
  lampLight.position.set(lh.x, 6 + lh.height + 2, lh.z);
  scene.add(lampLight);
  city.lighthouseBeam = beam;
  city.lighthouseLight = lampLight;
  addCollider(lh.x, lh.z, 8, 8);

  // --- Dermaga di selatan, papan kayu menjorok ke laut ---
  var pier = W.pier;
  var pierDeck = box(pier.width, 1.2, pier.length, 0x8a6a44, pier.x, 0.6, pier.z + pier.length / 2 - 8);
  addCollider(pier.x, pier.z + pier.length / 2 - 8, pier.width / 2, pier.length / 2);
  for (var p = 0; p < 6; p++) {
    cylinder(0.7, 0.7, 4, 0x5d4630, pier.x - 4, -0.5, pier.z + p * 10, 8);
    cylinder(0.7, 0.7, 4, 0x5d4630, pier.x + 4, -0.5, pier.z + p * 10, 8);
  }
  // Perahu kecil di samping dermaga
  var boat = new THREE.Group();
  var hull = new THREE.Mesh(new THREE.BoxGeometry(4, 1.6, 10), new THREE.MeshLambertMaterial({ color: 0xe8e2d2 }));
  hull.position.y = 0.4;
  boat.add(hull);
  var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 7), new THREE.MeshLambertMaterial({ color: 0x5d4630 }));
  mast.position.y = 4;
  boat.add(mast);
  boat.position.set(pier.x + 14, -0.2, pier.z + 30);
  scene.add(boat);
  city.boat = boat;

  // --- Pasar: deretan kios beratap warna-warni ---
  var market = W.market;
  var stallColors = [0xd94f3d, 0xe8a33a, 0x3f8f5f, 0x3a6fd8, 0xe86aa8];
  for (var s = 0; s < 8; s++) {
    var sx = market.x - 18 + (s % 4) * 12;
    var sz = market.z - 8 + Math.floor(s / 4) * 14;
    box(8, 2.6, 6, 0x6a4a2e, sx, 1.3, sz);
    var roof = new THREE.Mesh(
      new THREE.ConeGeometry(6.4, 2.6, 4),
      new THREE.MeshLambertMaterial({ color: stallColors[s % stallColors.length] })
    );
    roof.position.set(sx, 3.9, sz);
    roof.rotation.y = Math.PI / 4;
    scene.add(roof);
    // Buah di atas meja kios
    for (var f2 = 0; f2 < 4; f2++) {
      var fruit = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 6),
        new THREE.MeshLambertMaterial({ color: rng.pick([0xe84a3a, 0xf2a81d, 0x7fc94a]) })
      );
      fruit.position.set(sx - 2 + f2 * 1.3, 2.9, sz);
      scene.add(fruit);
    }
    addCollider(sx, sz, 4.4, 3.4);
  }

  // --- SPBU: kanopi, pompa, dan papan harga ---
  [W.stationNW, W.stationSE].forEach(function (st, idx) {
    box(16, 0.8, 12, 0xf2ede2, st.x, 5.4, st.z);
    box(1, 5.4, 1, 0xc23b2e, st.x - 7, 2.7, st.z - 5);
    box(1, 5.4, 1, 0xc23b2e, st.x + 7, 2.7, st.z - 5);
    box(1, 5.4, 1, 0xc23b2e, st.x - 7, 2.7, st.z + 5);
    box(1, 5.4, 1, 0xc23b2e, st.x + 7, 2.7, st.z + 5);
    for (var pp = 0; pp < 2; pp++) {
      box(1.4, 2.2, 1, 0xd94f3d, st.x - 4 + pp * 8, 1.1, st.z + 2);
    }
    var sign = box(6, 3, 0.6, 0x1d4e89, st.x, 8.2, st.z - 7);
    addCollider(st.x, st.z, 8.5, 6.5);
    city['stationSign' + idx] = sign;
  });

  // --- Garasi: bangunan rendah dengan pintu besar, rumah mobil biru misi 1 ---
  var g = W.garage;
  box(20, 7, 14, 0x9aa3ab, g.x, 3.5, g.z);
  box(12, 5, 0.5, 0x3a3d42, g.x, 2.5, g.z + 7.2);
  box(20.6, 0.6, 14.6, 0x5d6b7a, g.x, 7.3, g.z);
  addCollider(g.x, g.z, 10.4, 7.4);

  // --- Gudang di pesisir barat ---
  var wh = W.warehouse;
  box(26, 10, 18, 0xb08a4a, wh.x, 5, wh.z);
  box(26.6, 0.8, 18.6, 0x6a4a2e, wh.x, 10.4, wh.z);
  box(8, 7, 0.6, 0x3a3d42, wh.x + 6, 3.5, wh.z + 9.2);
  addCollider(wh.x, wh.z, 13.4, 9.4);

  // --- Pohon palem dan tiang lampu di sepanjang jalan ---
  for (var t = 0; t < 90; t++) {
    var tx = rng.range(-190, 190), tz = rng.range(-190, 190);
    // Jangan taruh pohon di tengah jalan atau di dalam gedung
    var onRoad = W.roadLines.some(function (c) { return Math.abs(tx - c) < 5 || Math.abs(tz - c) < 5; });
    if (onRoad) continue;
    var blocked = colliders.some(function (c) {
      return Math.abs(tx - c.x) < c.hw + 2 && Math.abs(tz - c.z) < c.hd + 2;
    });
    if (blocked) continue;
    var trunk = cylinder(0.35, 0.5, rng.range(4, 6.5), 0x7a5a38, tx, 2.5, tz, 6);
    var crown = new THREE.Mesh(
      new THREE.SphereGeometry(rng.range(1.8, 2.6), 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x3f8f4f })
    );
    crown.position.set(tx, 5.6, tz);
    scene.add(crown);
    city.treeSpots.push({ x: tx, z: tz });
  }
  // Lampu jalan
  var lampMat = new THREE.MeshLambertMaterial({ color: 0x2c2f33 });
  for (var li = -4; li <= 4; li++) {
    [ -64, 0, 64 ].forEach(function (lz) {
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 7, 6), lampMat);
      pole.position.set(li * 32 + 5, 3.5, lz + 5);
      scene.add(pole);
      var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
      bulb.position.set(li * 32 + 5, 7.1, lz + 5);
      scene.add(bulb);
    });
  }

  // --- Payung pantai di pasir selatan, dekat dermaga ---
  for (var u = 0; u < 6; u++) {
    var ux = -120 + u * 48, uz = 178 + (u % 2) * 8;
    var poleU = cylinder(0.09, 0.09, 3.2, 0x8a6a44, ux, 1.6, uz, 6);
    var umb = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 1.4, 8),
      new THREE.MeshLambertMaterial({ color: u % 2 ? 0xd94f3d : 0xe8a33a })
    );
    umb.position.set(ux, 3.8, uz);
    scene.add(umb);
    var towel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 3.2),
      new THREE.MeshLambertMaterial({ color: u % 2 ? 0x3a6fd8 : 0xe86aa8 })
    );
    towel.rotation.x = -Math.PI / 2;
    towel.position.set(ux + 3.4, 0.05, uz + 1);
    scene.add(towel);
  }

  // --- Titik kantong misi 2 dan koin misi 6, tersebar di persimpangan ---
  var cross = [];
  W.roadLines.forEach(function (x) {
    W.roadLines.forEach(function (z) {
      if (Math.abs(x) < 170 && Math.abs(z) < 170) cross.push({ x: x + 6, z: z + 6 });
    });
  });
  var shuffled = rng.shuffle(cross);
  city.bagSpots = shuffled.slice(0, 8);
  city.coinSpots = shuffled.slice(8, 13);
  return city;
}

// Tabrakan lingkaran (pemain/kendaraan) melawan kotak AABB kota.
function cityCollides(city, x, z, radius) {
  for (var i = 0; i < city.colliders.length; i++) {
    var c = city.colliders[i];
    var dx = Math.max(Math.abs(x - c.x) - c.hw, 0);
    var dz = Math.max(Math.abs(z - c.z) - c.hd, 0);
    if (dx * dx + dz * dz < radius * radius) return c;
  }
  return null;
}
