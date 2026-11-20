# Kota Karang

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/yannyonn94/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/yannyonn94/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01)

Game aksi dunia terbuka untuk bounty make.fun [`gta6-01`](https://make.fun/bounty/gta6-01). Dibangun dari nol di
sesi ini: semua file di `game/src/` ditulis baru, bukan salinan dari versi
sebelumnya. Ronde 4 menambah misi keenam (Koin Karang), motor, stamina,
klakson, zoom kamera, bintang dan bulan, dermaga, pantai, dan pom bensin kedua.

## Main

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Node menjalankan TypeScript langsung (type stripping), jadi tidak perlu langkah `tsc` terpisah.

`main.ts` menvalidasi screenshot lalu menuliskan `out/dossier.json` dan
menyalin `screenshots/1-start.jpg` … `4-drive.jpg` ke `out/`.

## Menjalankan

```bash
npx tsx serve.ts
# lalu buka http://127.0.0.1:8099/
```

## Kontrol

- `WASD` / panah: bergerak, mengemudi
- `Shift`: lari / ngebut (pakai stamina)
- `Spasi`: menembak (kaki) atau mengerem (dalam mobil)
- `E`: masuk / keluar mobil
- `H`: klakson
- Roda mouse: zoom kamera
- `Esc` / `P`: jeda
- Klik layar: kunci kursor untuk kamera

## Fitur

- Kota 10×10 blok dengan gedung, pohon palem, lampu jalan, trotoar, pantai, dan dermaga.
- Siklus siang–malam: matahari bergerak, langit berubah, lampu menyala, bintang dan bulan di malam hari.
- Enam misi: curi mobil, kumpul kantong, hilangkan wanted, sprint pantai, parkir presisi, koin Karang.
- Polisi memprediksi gerak pemain dan membagi sisi saat mengejar; makin tinggi wanted, makin cepat dan akurat.
- Pejalan kaki tiga tipe (biasa, pelari, santai): menyeberang, menghindar mobil, dan panik saat wanted.
- Motor yang bisa dicuri: lebih cepat dan lincah dari mobil.
- Bahan bakar mobil dan dua pom bensin (barat-laut dan tenggara); peringatan BBM rendah.
- Stamina untuk lari, klakson, dan zoom kamera.
- Peluru bergerak dan bisa mengenai polisi atau pejalan kaki.
- Skor, kombo dengan pengali (maks x4), nyaris-tabrak, minimap, speedometer, dan jam.
- Mode screenshot: `?shot=start|play|chase|drive|koin|end&seed=1&hour=18`.

## Mode screenshot

```text
index.html?shot=start
index.html?shot=play&seed=1
index.html?shot=chase&hour=18.5
index.html?shot=drive&hour=18.2
index.html?shot=koin&hour=10.5
index.html?shot=end&hour=22
```

## Lisensi

MIT. `game/vendor/three.min.js` milik three.js, lisensi MIT.
