// [RONDE 5] Mode shot: membaca ?shot=...&seed=N&hour=H dan menata scene.
// Mode: start, play, chase, drive, koin, hujan, end.
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
      if (hud) {
        hud.tampil(true);
        hud.aturJam(siklus ? siklus.teksJam() : '11:00', false);
      }
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
        hud.aturObjektif('Misi 1/7 · Kereta Mati — Ambil mobil biru di garasi dan bawa ke dermaga. (42 m)');
        hud.aturJam(siklus ? siklus.teksJam() : '10:00', false);
      }
      return 'play';
    }
    case 'chase': {
      aturJam(16.0);
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
        hud.aturObjektif('Misi 3/7 · Hilang Sejenak — Polisi sudah tahu. Turunkan bintang wanted kamu.');
        hud.aturJam(siklus ? siklus.teksJam() : '17:18', false);
      }
      return 'chase';
    }
    case 'drive': {
      aturJam(16.5);
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
        hud.aturObjektif('Misi 4/7 · Sprint Pantai — Tempuh 420 meter sebelum waktu habis.');
        hud.aturJam(siklus ? siklus.teksJam() : '17:18', false);
        hud.aturLaju(m.laju, true);
        hud.aturMobil(m.nama);
        hud.aturBahan(m.tangki.teks, false);
      }
      return 'drive';
    }
    case 'koin': {
      aturJam(10.5);
      pemain.pos.set(-140, 0, -132);
      pemain.kelompok.position.copy(pemain.pos);
      pemain.kelompok.rotation.y = Math.PI * 0.3;
      pemain.laju = 5.2;
      pemain.faseJalan = 0.8;
      pemain.animasi();
      kamera.position.set(-138, 3.2, -124);
      kamera.lookAt(-142, 1.6, -142);
      if (hud) {
        hud.tampil(true);
        hud.aturObjektif('Misi 6/7 · Koin Karang — Kumpulkan 5 koin emas yang tersebar di kota. (0/5)');
        hud.aturJam(siklus ? siklus.teksJam() : '10:30', false);
      }
      return 'koin';
    }
    case 'hujan': {
      // Misi ketujuh di tengah badai: van logistik di jalan basah, roadblock di depan.
      aturJam(15.0);
      if (siklus) siklus.aturHujan(1);
      const v = lalu.find((m) => m.van) || lalu[0];
      pemain.masukMobil(v);
      v.pengemudi = 'pemain';
      v.pos.set(-60, 0, 60);
      v.heading = Math.PI * 0.75;
      v.laju = 9;
      v.kelompok.position.copy(v.pos);
      // Roadblock di depan arah laju van, terlihat dari kamera belakang.
      if (ctx.roadblock) {
        ctx.roadblock.pasang(
          v.pos.x + Math.sin(v.heading) * 26,
          v.pos.z + Math.cos(v.heading) * 26,
          v.heading + Math.PI / 2,
        );
      }
      kamera.position.set(-67, 3.8, 67);
      kamera.lookAt(-45, 1.2, 45);
      if (hud) {
        hud.tampil(true);
        hud.aturWanted(3);
        hud.aturCuaca(1, siklus ? `${siklus.teksCuaca()} · ${siklus.teksPeriode()}` : 'Hujan deras · Siang');
        hud.aturObjektif('Misi 7/7 · Badai Karang: 96 m ke gudang (0:48) — roadblock di depan!');
        hud.aturJam(siklus ? siklus.teksJam() : '15:00', false);
        hud.aturLaju(v.laju, true);
        hud.aturMobil(v.nama);
        hud.aturBahan(v.tangki.teks, false);
      }
      return 'hujan';
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
    case 'foto': {
      // Bingkai ala mode foto: HUD disembunyikan, kamera dekat pemain dan van.
      aturJam(9.5);
      const v = lalu.find((m) => m.van) || lalu[0];
      pemain.pos.set(v.pos.x + 3, 0, v.pos.z + 3);
      pemain.kelompok.position.copy(pemain.pos);
      pemain.kelompok.rotation.y = Math.PI * 0.8;
      pemain.faseJalan = 0.6;
      pemain.animasi();
      kamera.position.set(v.pos.x + 6, 2.6, v.pos.z - 4);
      kamera.lookAt(v.pos.x, 1.2, v.pos.z);
      if (hud) hud.tampil(false);
      if (overlay) overlay.classList.add('hidden');
      return 'foto';
    }
    default:
      return 'none';
  }
}
