// [RONDE 3] Mode shot: membaca ?shot=...&seed=N&hour=H dan menata scene.
export function bacaQueryShot() {
  const q = new URLSearchParams(window.location.search);
  const hour = q.get('hour');
  return {
    shot: q.get('shot') ?? '',
    seed: Number(q.get('seed') ?? '1') || 1,
    hour: hour === null ? null : Number(hour),
  };
}

export function tataShot(nama, ctx) {
  const { pemain, kamera, lalu, polisi, pejalan, setengahKota, hud, overlay, siklus } = ctx;
  if (overlay && nama) overlay.classList.add('hidden');

  const aturJam = (h) => { if (siklus) siklus.aturJam(h); };

  switch (nama) {
    case 'start':
      aturJam(11);
      kamera.position.set(0, 150, 230);
      kamera.lookAt(0, 0, 0);
      if (hud) hud.tampil(true);
      return 'start';
    case 'play': {
      aturJam(10);
      pemain.pos.set(6, 0, 40);
      pemain.kelompok.position.copy(pemain.pos);
      pemain.kelompok.rotation.y = Math.PI * 0.15;
      pemain.laju = 5.2;
      pemain.faseJalan = 1.2;
      pemain.animasi();
      kamera.position.set(7.6, 2.8, 34.2);
      kamera.lookAt(6.4, 1.6, 46);
      if (hud) {
        hud.tampil(true);
        hud.aturObjektif('Misi: Kereta Mati — Ambil mobil biru di garasi dan bawa ke dermaga. (42 m)');
        hud.aturJam(siklus ? siklus.teksJam() : '10:00', false);
      }
      return 'play';
    }
    case 'chase': {
      aturJam(18.5);
      const cx = 6, cz = -20;
      pemain.pos.set(cx, 0, cz);
      pemain.kelompok.position.copy(pemain.pos);
      pemain.kelompok.rotation.y = Math.PI;
      polisi.forEach((p, i) => {
        p.kelompok.visible = true;
        p.pos.set(cx + (i - 2) * 3.4, 0, cz - 9 - i * 5);
        p.kelompok.position.copy(p.pos);
        p.heading = Math.PI;
        p.laju = 8;
      });
      kamera.position.set(cx + 1.8, 3.0, cz + 7.5);
      kamera.lookAt(cx, 1.4, cz - 12);
      if (hud) {
        hud.tampil(true);
        hud.aturWanted(3);
        hud.aturObjektif('Misi: Hilang Sejenak — Polisi sudah tahu. Turunkan bintang wanted kamu.');
        hud.aturJam(siklus ? siklus.teksJam() : '18:30', false);
      }
      return 'chase';
    }
    case 'drive': {
      aturJam(18.2);
      const m = lalu[0];
      pemain.masukMobil(m);
      m.pengemudi = 'pemain';
      m.pos.set(6, 0, -60);
      m.heading = 0;
      m.laju = 12;
      m.kelompok.position.copy(m.pos);
      kamera.position.set(6, 4.0, -68);
      kamera.lookAt(6, 0.9, -50);
      if (hud) {
        hud.tampil(true);
        hud.aturObjektif('Misi: Sprint Pantai — Tempuh 420 meter sebelum waktu habis.');
        hud.aturJam(siklus ? siklus.teksJam() : '18:12', false);
        hud.aturLaju(m.laju, true);
        hud.aturMobil(m.nama);
        hud.aturBahan(m.tangki.teks, false);
      }
      return 'drive';
    }
    case 'end':
      aturJam(22);
      kamera.position.set(-40, 90, 260);
      kamera.lookAt(0, 10, 0);
      if (hud) {
        hud.tampil(true);
        hud.aturJam(siklus ? siklus.teksJam() : '22:00', true);
      }
      return 'end';
    default:
      return 'none';
  }
}
