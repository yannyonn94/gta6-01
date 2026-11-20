// [RONDE 3] Pembangun kota: tanah, jalan, blok gedung, lampu, dan pohon palem.
import { KOTA, WARNA } from './config.js';
import { acakSeed, acak } from './world_config.js';

const T = window.THREE;

function kotak(w, h, d, warna) {
  return new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshLambertMaterial({ color: warna }));
}

export function bangunKota(scene, seed = 1) {
  const rng = acakSeed(seed);
  const bentang = KOTA.grid * KOTA.block + (KOTA.grid + 1) * KOTA.roadWidth;
  const setengah = bentang / 2;

  const tanah = new T.Mesh(
    new T.PlaneGeometry(bentang * 3, bentang * 3),
    new T.MeshLambertMaterial({ color: WARNA.tanah }),
  );
  tanah.rotation.x = -Math.PI / 2;
  tanah.position.y = -0.02;
  scene.add(tanah);

  const jalan = [];
  const geoJalan = new T.PlaneGeometry(KOTA.roadWidth, bentang);
  const matJalan = new T.MeshLambertMaterial({ color: WARNA.aspal });
  for (let i = 0; i <= KOTA.grid; i++) {
    const c = -setengah + i * KOTA.block + i * KOTA.roadWidth + KOTA.roadWidth / 2;
    const vert = new T.Mesh(geoJalan, matJalan);
    vert.rotation.x = -Math.PI / 2;
    vert.position.set(c, 0, 0);
    scene.add(vert);
    const horz = new T.Mesh(geoJalan, matJalan);
    horz.rotation.x = -Math.PI / 2;
    horz.rotation.z = Math.PI / 2;
    horz.position.set(0, 0, c);
    scene.add(horz);
    jalan.push({ vertikal: true, di: c, setengah }, { vertikal: false, di: c, setengah });
  }

  // Garis tengah di sebagian jalan.
  const matGaris = new T.MeshBasicMaterial({ color: 0xd9d9d9 });
  for (let i = 1; i < KOTA.grid; i += 2) {
    const c = -setengah + i * KOTA.block + i * KOTA.roadWidth + KOTA.roadWidth / 2;
    for (let z = -setengah; z < setengah; z += 18) {
      const garis = new T.Mesh(new T.PlaneGeometry(0.5, 6), matGaris);
      garis.rotation.x = -Math.PI / 2;
      garis.position.set(c, 0.02, z);
      scene.add(garis);
    }
  }

  // Gedung dengan jendela menyala.
  const gedung = [];
  const warnaGedung = [0x6b7c8d, 0x8d9aa8, 0x9aa4ad, 0x7d6f63, 0x5d6b78];
  for (let bx = 0; bx < KOTA.grid; bx++) {
    for (let bz = 0; bz < KOTA.grid; bz++) {
      if (rng() < 0.12) continue;
      const cx = -setengah + KOTA.roadWidth + bx * KOTA.block + bx * KOTA.roadWidth + KOTA.block / 2;
      const cz = -setengah + KOTA.roadWidth + bz * KOTA.block + bz * KOTA.roadWidth + KOTA.block / 2;
      const jumlah = 1 + Math.floor(rng() * 3);
      for (let k = 0; k < jumlah; k++) {
        const w = 9 + rng() * 14;
        const d = 9 + rng() * 14;
        const tengah = bx === Math.floor(KOTA.grid / 2) && bz === Math.floor(KOTA.grid / 2);
        const h = 8 + rng() * (tengah ? 46 : 26);
        const b = kotak(w, h, d, warnaGedung[Math.floor(rng() * warnaGedung.length)]);
        b.position.set(cx + (rng() - 0.5) * (KOTA.block - 26), h / 2, cz + (rng() - 0.5) * (KOTA.block - 26));
        scene.add(b);
        gedung.push(b);
        if (h > 12) {
          const baris = Math.min(8, Math.floor(h / 5));
          for (let r = 0; r < baris; r++) {
            const jendela = new T.Mesh(
              new T.PlaneGeometry(0.8, 1.1),
              new T.MeshBasicMaterial({ color: rng() < 0.5 ? 0xffe08a : 0x22303c }),
            );
            jendela.position.set(
              b.position.x + (rng() - 0.5) * (w - 3),
              3 + r * 5,
              b.position.z + d / 2 + 0.05,
            );
            scene.add(jendela);
          }
        }
      }
    }
  }

  // Lampu jalan: tiang + bola cahaya (diganti visibilitasnya saat malam).
  const lampu = [];
  const matTiang = new T.MeshLambertMaterial({ color: 0x333a44 });
  const matBohlam = new T.MeshBasicMaterial({ color: WARNA.lampu });
  for (let i = 0; i <= KOTA.grid; i += 2) {
    const c = -setengah + i * KOTA.block + i * KOTA.roadWidth + KOTA.roadWidth / 2;
    for (let s = -setengah + 12; s < setengah; s += 40) {
      const tiang = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 6, 6), matTiang);
      tiang.position.set(c + KOTA.roadWidth / 2 + 1.5, 3, s);
      scene.add(tiang);
      const bohlam = new T.Mesh(new T.SphereGeometry(0.45, 8, 6), matBohlam);
      bohlam.position.set(tiang.position.x, 6.1, s);
      bohlam.visible = false;
      scene.add(bohlam);
      lampu.push(bohlam);
    }
  }

  // Pohon palem di tepi pantai.
  const pohon = [];
  const batangMat = new T.MeshLambertMaterial({ color: 0x6b4a2f });
  const daunMat = new T.MeshLambertMaterial({ color: 0x2f6b3a });
  for (let i = 0; i < 40; i++) {
    const sisi = rng() < 0.5 ? -1 : 1;
    const g = new T.Group();
    const batang = new T.Mesh(new T.CylinderGeometry(0.25, 0.35, 5, 6), batangMat);
    batang.position.y = 2.5;
    g.add(batang);
    for (let l = 0; l < 5; l++) {
      const daun = new T.Mesh(new T.ConeGeometry(0.9, 3, 4), daunMat);
      daun.position.y = 5.2;
      daun.rotation.z = Math.PI / 2.2;
      daun.rotation.y = (l / 5) * Math.PI * 2;
      g.add(daun);
    }
    g.position.set(acak(-setengah, setengah), 0, sisi * (setengah - KOTA.roadWidth - 2));
    g.rotation.y = rng() * Math.PI;
    scene.add(g);
    pohon.push(g);
  }

  return { bentang, setengah, jalan, gedung, pohon, lampu };
}
