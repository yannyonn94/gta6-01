// island.js — membangun Pulau Kota Karang: laut, pasir, jalan, trotoar,
// gedung-gedung, mercusuar, pasar, pelabuhan, pom bensin, pohon palem dan
// lampu jalan. Semua geometri dibuat dari kotak dan bidang three.js dengan
// tekstur jendela yang digambar prosedural di canvas (tanpa aset luar).

import { WORLD, PALETTE, roadLine, blockCenter } from './tune.js';
import { range, intIn, pick, chance } from './rng.js';

function lambert(color, opts) {
  return new THREE.MeshLambertMaterial(Object.assign({ color }, opts || {}));
}

function box(w, h, d, mat, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function flat(w, d, mat, x, z, y, parent) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

// Tekstur jendela prosedural: dinding terang dengan jendela yang sebagian menyala.
function windowTexture(rng, base, litRatio) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 256);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 4; col++) {
      const lit = rng() < litRatio;
      g.fillStyle = lit ? '#ffe9a8' : '#274b63';
      g.fillRect(10 + col * 30, 12 + row * 30, 20, 18);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

export function buildIsland(scene, rng) {
  const colliders = [];
  const lamps = [];
  const palmTops = [];
  const group = new THREE.Group();
  scene.add(group);

  const collide = (x, z, hw, hd) => {
    colliders.push({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd });
  };

  // --- Laut, pasir, daratan ---------------------------------------------
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.SEA, WORLD.SEA),
    lambert(PALETTE.seaDeep)
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.6;
  group.add(sea);

  const sand = flat(WORLD.BEACH * 2 + 24, WORLD.BEACH * 2 + 24, lambert(PALETTE.sand), 0, 0, -0.15, group);
  sand.receiveShadow = false;

  const land = flat(WORLD.HALF * 2 + 8, WORLD.HALF * 2 + 8, lambert(PALETTE.grass), 0, 0, 0, group);

  // Garis pantai: ombak tipis berputar di tepi pasir (cincin datar).
  const shore = new THREE.Mesh(
    new THREE.RingGeometry(WORLD.BEACH - 2, WORLD.BEACH + 6, 48),
    lambert(PALETTE.seaShallow, { transparent: true, opacity: 0.55 })
  );
  shore.rotation.x = -Math.PI / 2;
  shore.position.y = -0.05;
  group.add(shore);

  // --- Jalan dan trotoar -------------------------------------------------
  const asphalt = lambert(PALETTE.asphalt);
  const walkMat = lambert(PALETTE.sidewalk);
  const dashMat = lambert(PALETTE.line);
  for (let i = 0; i < WORLD.GRID; i++) {
    const r = roadLine(i);
    flat(WORLD.ROAD, WORLD.HALF * 2 + 8, asphalt, r, 0, 0.02, group); // vertikal
    flat(WORLD.HALF * 2 + 8, WORLD.ROAD, asphalt, 0, r, 0.02, group); // horizontal
    // Garis putus-putus tengah jalan.
    for (let k = -4; k <= 4; k++) {
      const p = k * 32;
      if (Math.abs(p) > WORLD.HALF - 8) continue;
      flat(1.2, 4, dashMat, r, p, 0.05, group);
      flat(4, 1.2, dashMat, p, r, 0.05, group);
    }
  }
  // Trotoar di sekeliling tiap blok.
  for (let i = 0; i < WORLD.GRID - 1; i++) {
    for (let j = 0; j < WORLD.GRID - 1; j++) {
      const cx = blockCenter(i), cz = blockCenter(j);
      flat(WORLD.BLOCK + 2, WORLD.BLOCK + 2, walkMat, cx, cz, 0.03, group);
    }
  }

  // --- Gedung ------------------------------------------------------------
  const wallTexA = windowTexture(rng, '#f2e6d0', 0.45);
  const wallTexB = windowTexture(rng, '#d9c7a7', 0.3);
  const wallTexC = windowTexture(rng, '#b9c8d8', 0.55);
  const wallMats = [
    new THREE.MeshLambertMaterial({ map: wallTexA }),
    new THREE.MeshLambertMaterial({ map: wallTexB }),
    new THREE.MeshLambertMaterial({ map: wallTexC }),
  ];
  const roofMats = [lambert(PALETTE.roofA), lambert(PALETTE.roofB), lambert(PALETTE.roofC)];

  const marketBlock = { i: 4, j: 5 };   // blok pasar — tanpa gedung
  const depotBlock = { i: 1, j: 7 };    // blok depot logistik — tanpa gedung
  const parkBlocks = [{ i: 7, j: 2 }, { i: 2, j: 2 }]; // taman kecil

  for (let i = 0; i < WORLD.GRID - 1; i++) {
    for (let j = 0; j < WORLD.GRID - 1; j++) {
      if (i === marketBlock.i && j === marketBlock.j) continue;
      if (i === depotBlock.i && j === depotBlock.j) continue;
      if (parkBlocks.some((p) => p.i === i && p.j === j)) {
        // Taman: rumput lebih gelap + palem + bangku.
        flat(WORLD.BLOCK - 2, WORLD.BLOCK - 2, lambert(0x4c8a3e), blockCenter(i), blockCenter(j), 0.04, group);
        for (let t = 0; t < 3; t++) {
          const px = blockCenter(i) + range(rng, -8, 8);
          const pz = blockCenter(j) + range(rng, -8, 8);
          makePalm(group, px, pz, rng, palmTops);
        }
        box(6, 0.6, 1.6, lambert(0x8a6b46), blockCenter(i), 0.35, blockCenter(j) + 6, group);
        continue;
      }
      const cx = blockCenter(i), cz = blockCenter(j);
      const count = intIn(rng, 1, 3);
      for (let b = 0; b < count; b++) {
        const w = range(rng, 7, 11);
        const d = range(rng, 7, 11);
        const h = range(rng, 7, 26);
        const ox = count === 1 ? 0 : range(rng, -5, 5);
        const oz = count === 1 ? 0 : range(rng, -5, 5);
        const bx = cx + ox, bz = cz + oz;
        const wall = pick(rng, wallMats);
        const bmesh = box(w, h, d, wall, bx, h / 2 + 0.05, bz, group);
        bmesh.castShadow = false;
        box(w + 0.8, 0.7, d + 0.8, pick(rng, roofMats), bx, h + 0.4, bz, group);
        // AC / tangki di atap untuk gedung tinggi.
        if (h > 15 && chance(rng, 0.6)) {
          box(2.4, 1.4, 2.4, lambert(0x6b7280), bx + range(rng, -2, 2), h + 1.4, bz + range(rng, -2, 2), group);
        }
        collide(bx, bz, w / 2 + 0.2, d / 2 + 0.2);
      }
    }
  }

  // --- Mercusuar di tanjung timur ----------------------------------------
  const lightX = 186, lightZ = -168;
  const rock = new THREE.Mesh(new THREE.CylinderGeometry(16, 20, 6, 10), lambert(0x8d8578));
  rock.position.set(lightX, 0.4, lightZ);
  group.add(rock);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.4, 30, 12), lambert(PALETTE.lighthouse));
  tower.position.set(lightX, 18, lightZ);
  group.add(tower);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(4.7, 5.0, 6, 12), lambert(PALETTE.lighthouseTop));
  stripe.position.set(lightX, 22, lightZ);
  group.add(stripe);
  const lampRoom = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 4, 10), lambert(PALETTE.glass, { emissive: 0xffe9a8, emissiveIntensity: 0.9 }));
  lampRoom.position.set(lightX, 34.5, lightZ);
  group.add(lampRoom);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(4.2, 4, 10), lambert(PALETTE.lighthouseTop));
  cap.position.set(lightX, 38.5, lightZ);
  group.add(cap);
  collide(lightX, lightZ, 7, 7);

  // --- Pasar (kios beratap warna-warni) ----------------------------------
  const market = { x: blockCenter(marketBlock.i), z: blockCenter(marketBlock.j) };
  const stallColors = [0xe2703a, 0x19c2b8, 0xe0a458, 0xc65b4e];
  for (let s = 0; s < 6; s++) {
    const sx = market.x + (s % 3) * 8 - 8;
    const sz = market.z + Math.floor(s / 3) * 9 - 4;
    const mat = lambert(stallColors[s % stallColors.length]);
    box(5.5, 0.5, 4.5, mat, sx, 3.4, sz, group); // atap
    box(0.3, 3.2, 0.3, lambert(0x5a4632), sx - 2.4, 1.7, sz - 1.9, group);
    box(0.3, 3.2, 0.3, lambert(0x5a4632), sx + 2.4, 1.7, sz - 1.9, group);
    box(0.3, 3.2, 0.3, lambert(0x5a4632), sx - 2.4, 1.7, sz + 1.9, group);
    box(0.3, 3.2, 0.3, lambert(0x5a4632), sx + 2.4, 1.7, sz + 1.9, group);
    box(4.6, 1.0, 3.6, lambert(0x8a6b46), sx, 0.6, sz, group); // meja
    // Buah di meja: bola-bola kecil warna cerah.
    for (let f = 0; f < 5; f++) {
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), lambert(pick(rng, [0xff5a3c, 0xffd23e, 0x7ed957, 0xff8ac2])));
      fruit.position.set(sx + range(rng, -1.8, 1.8), 1.35, sz + range(rng, -1.2, 1.2));
      group.add(fruit);
    }
    collide(sx, sz, 2.8, 2.4);
  }

  // --- Pelabuhan barat (dermaga + kontainer) ------------------------------
  const port = { x: -186, z: 0 };
  box(26, 1.2, 60, lambert(0x7a5a38), port.x, 0.4, port.z, group);
  for (let c = 0; c < 5; c++) {
    const cxp = port.x + range(rng, -8, 8);
    const czp = port.z + range(rng, -22, 22);
    box(7, 3, 3, lambert(pick(rng, [0x3f6fb5, 0xc65b4e, 0x2f9e6e, 0xe0a458])), cxp, 2.2, czp, group);
    collide(cxp, czp, 3.6, 1.6);
  }
  // Derek pelabuhan sederhana.
  box(2, 18, 2, lambert(0xd8b13c), port.x + 6, 9, port.z - 24, group);
  box(14, 2, 2, lambert(0xd8b13c), port.x + 2, 17, port.z - 24, group);

  // --- Pom bensin ---------------------------------------------------------
  const gas = { x: roadLine(2) + 10, z: blockCenter(2) };
  box(16, 0.8, 10, lambert(0xd23b2e), gas.x, 5.4, gas.z, group);
  box(0.5, 5, 0.5, lambert(0xcccccc), gas.x - 7, 2.7, gas.z - 4, group);
  box(0.5, 5, 0.5, lambert(0xcccccc), gas.x + 7, 2.7, gas.z - 4, group);
  box(0.5, 5, 0.5, lambert(0xcccccc), gas.x - 7, 2.7, gas.z + 4, group);
  box(0.5, 5, 0.5, lambert(0xcccccc), gas.x + 7, 2.7, gas.z + 4, group);
  for (let p = 0; p < 3; p++) {
    const px = gas.x - 4 + p * 4;
    box(1.6, 2.4, 1.2, lambert(0xf2f2f2), px, 1.2, gas.z, group);
    collide(px, gas.z, 1, 0.8);
  }

  // --- Depot logistik (misi 2) -------------------------------------------
  const depot = { x: blockCenter(depotBlock.i), z: blockCenter(depotBlock.j) };
  box(18, 6, 12, lambert(0x3f6fb5), depot.x, 3, depot.z, group);
  box(18.6, 0.6, 12.6, lambert(0x2c4a6e), depot.x, 6.3, depot.z, group);
  collide(depot.x, depot.z, 9.2, 6.2);
  for (let c = 0; c < 4; c++) {
    box(2.2, 2.2, 2.2, lambert(0xc9a227), depot.x - 8 + c * 2.6, 1.1, depot.z + 8, group);
  }

  // --- Palem di tepi pantai + lampu jalan --------------------------------
  for (let a = 0; a < 26; a++) {
    const ang = (a / 26) * Math.PI * 2 + range(rng, -0.1, 0.1);
    const r = WORLD.BEACH - 4 + range(rng, -3, 3);
    const px = Math.cos(ang) * r;
    const pz = Math.sin(ang) * r;
    if (Math.abs(px) < WORLD.HALF + 6 && Math.abs(pz) < WORLD.HALF + 6) continue;
    makePalm(group, px, pz, rng, palmTops);
  }
  for (let i = 0; i < WORLD.GRID; i += 2) {
    for (let j = 0; j < WORLD.GRID; j += 2) {
      const lx = roadLine(i) + 5.5;
      const lz = roadLine(j) - 5.5;
      if (Math.abs(lx) > WORLD.HALF || Math.abs(lz) > WORLD.HALF) continue;
      const pole = box(0.35, 7, 0.35, lambert(0x3a3f46), lx, 3.5, lz, group);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), lambert(0xfff2b0, { emissive: 0xffdf80, emissiveIntensity: 0.7 }));
      bulb.position.set(lx, 7.2, lz);
      group.add(bulb);
      lamps.push({ mesh: bulb, x: lx, z: lz });
      void pole;
    }
  }

  return {
    group,
    colliders,
    lamps,
    palmTops,
    landmarks: { market, lighthouse: { x: lightX, z: lightZ }, port, gas, depot },
    sea,
    shore,
  };
}

function makePalm(parent, x, z, rng, tops) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 7, 7), lambert(PALETTE.trunk));
  trunk.position.set(x, 3.5, z);
  trunk.rotation.z = range(rng, -0.12, 0.12);
  parent.add(trunk);
  const top = new THREE.Group();
  top.position.set(x, 7.2, z);
  for (let f = 0; f < 6; f++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.9, 4.4, 4), lambert(PALETTE.palm));
    const ang = (f / 6) * Math.PI * 2;
    leaf.position.set(Math.cos(ang) * 1.4, 0.4, Math.sin(ang) * 1.4);
    leaf.rotation.z = Math.cos(ang) * 1.1;
    leaf.rotation.x = -Math.sin(ang) * 1.1;
    top.add(leaf);
  }
  parent.add(top);
  tops.push(top);
}
