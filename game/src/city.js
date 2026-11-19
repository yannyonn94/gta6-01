// Builds the city of Kota Karang: ground, roads, blocks with buildings,
// streetlights and palm trees. Everything is generated from a seed.
import { GRID, BLOCK, ROAD_W, SIDEWALK, seeded, rand } from './world_config.js';

const T = window.THREE;

const PALETTE = {
  asphalt: 0x2b2f36,
  sidewalk: 0x4a4f58,
  ground: 0x243026,
  building: [0x6b7c8d, 0x8d9aa8, 0x9aa4ad, 0x7d6f63, 0x5d6b78],
  window: 0xffe08a,
  glass: 0x7fb6d9,
  palmTrunk: 0x6b4a2f,
  palmLeaf: 0x2f6b3a,
};

function box(w, h, d, color) {
  const geo = new T.BoxGeometry(w, h, d);
  const mat = new T.MeshLambertMaterial({ color });
  return new T.Mesh(geo, mat);
}

export function buildCity(scene, seed = 1) {
  const rng = seeded(seed);
  const span = GRID * BLOCK + (GRID + 1) * ROAD_W;
  const half = span / 2;

  // ground plane (grass/dirt beyond the road grid)
  const ground = new T.Mesh(
    new T.PlaneGeometry(span * 3, span * 3),
    new T.MeshLambertMaterial({ color: PALETTE.ground }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  // road grid
  const roadGeo = new T.PlaneGeometry(ROAD_W, span);
  const roadMat = new T.MeshLambertMaterial({ color: PALETTE.asphalt });
  const roads = [];
  for (let i = 0; i <= GRID; i++) {
    const c = -half + i * BLOCK + i * ROAD_W + ROAD_W / 2;
    const v = new T.Mesh(roadGeo, roadMat);
    v.rotation.x = -Math.PI / 2;
    v.position.set(c, 0, 0);
    scene.add(v);
    const h = new T.Mesh(roadGeo, roadMat);
    h.rotation.x = -Math.PI / 2;
    h.rotation.z = Math.PI / 2;
    h.position.set(0, 0, c);
    scene.add(h);
    roads.push({ vertical: true, at: c, half }, { vertical: false, at: c, half });
  }

  // centre line markings (cheap, only on a few roads)
  const lineMat = new T.MeshBasicMaterial({ color: 0xd9d9d9 });
  for (let i = 1; i < GRID; i += 2) {
    const c = -half + i * BLOCK + i * ROAD_W + ROAD_W / 2;
    for (let z = -half; z < half; z += 18) {
      const m = new T.Mesh(new T.PlaneGeometry(0.5, 6), lineMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(c, 0.02, z);
      scene.add(m);
    }
  }

  // city blocks: buildings with lit windows
  const buildings = [];
  for (let bx = 0; bx < GRID; bx++) {
    for (let bz = 0; bz < GRID; bz++) {
      if (rng() < 0.12) continue;               // occasional empty lot
      const cx = -half + ROAD_W + bx * BLOCK + bx * ROAD_W + BLOCK / 2;
      const cz = -half + ROAD_W + bz * BLOCK + bz * ROAD_W + BLOCK / 2;
      const n = 1 + Math.floor(rng() * 3);
      for (let k = 0; k < n; k++) {
        const w = 9 + rng() * 14;
        const d = 9 + rng() * 14;
        const h = 8 + rng() * (bx === Math.floor(GRID / 2) && bz === Math.floor(GRID / 2) ? 46 : 26);
        const color = PALETTE.building[Math.floor(rng() * PALETTE.building.length)];
        const b = box(w, h, d, color);
        b.position.set(cx + (rng() - 0.5) * (BLOCK - 26), h / 2, cz + (rng() - 0.5) * (BLOCK - 26));
        scene.add(b);
        buildings.push(b);
        // lit windows as thin emissive quads on the front face
        if (h > 12) {
          const rows = Math.min(8, Math.floor(h / 5));
          for (let r = 0; r < rows; r++) {
            const lit = rng() < 0.5;
            const wm = new T.Mesh(
              new T.PlaneGeometry(0.8, 1.1),
              new T.MeshBasicMaterial({ color: lit ? PALETTE.window : 0x22303c }),
            );
            wm.position.set(b.position.x + (rng() - 0.5) * (w - 3), 3 + r * 5, b.position.z + d / 2 + 0.05);
            scene.add(wm);
          }
        }
      }
    }
  }

  // streetlights along a few roads
  const lampMat = new T.MeshLambertMaterial({ color: 0x333a44 });
  const bulbMat = new T.MeshBasicMaterial({ color: 0xfff2b0 });
  for (let i = 0; i <= GRID; i += 2) {
    const c = -half + i * BLOCK + i * ROAD_W + ROAD_W / 2;
    for (let s = -half + 12; s < half; s += 40) {
      const pole = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 6, 6), lampMat);
      pole.position.set(c + ROAD_W / 2 + 1.5, 3, s);
      scene.add(pole);
      const bulb = new T.Mesh(new T.SphereGeometry(0.45, 8, 6), bulbMat);
      bulb.position.set(pole.position.x, 6.1, s);
      scene.add(bulb);
    }
  }

  // palm trees on sidewalks near the coast edge
  const trunkMat = new T.MeshLambertMaterial({ color: PALETTE.palmTrunk });
  const leafMat = new T.MeshLambertMaterial({ color: PALETTE.palmLeaf });
  const palms = [];
  for (let i = 0; i < 40; i++) {
    const side = rng() < 0.5 ? -1 : 1;
    const x = rand(-half, half);
    const z = side * (half - ROAD_W - 2);
    const g = new T.Group();
    const trunk = new T.Mesh(new T.CylinderGeometry(0.25, 0.35, 5, 6), trunkMat);
    trunk.position.y = 2.5;
    g.add(trunk);
    for (let l = 0; l < 5; l++) {
      const leaf = new T.Mesh(new T.ConeGeometry(0.9, 3, 4), leafMat);
      leaf.position.y = 5.2;
      leaf.rotation.z = Math.PI / 2.2;
      leaf.rotation.y = (l / 5) * Math.PI * 2;
      g.add(leaf);
    }
    g.position.set(x, 0, z);
    g.rotation.y = rng() * Math.PI;
    scene.add(g);
    palms.push(g);
  }

  return { span, half, roads, buildings, palms };
}
