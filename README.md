# Kota Karang

Game aksi dunia terbuka untuk bounty make.fun `gta6-01`. Dibangun dari nol di
sesi ini: semua file di `game/src/` ditulis baru, bukan salinan dari versi
sebelumnya.

## Main

```bash
npm install
npx tsc --noEmit
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` menvalidasi screenshot lalu menuliskan `out/dossier.json` dan
menyalin `screenshots/1-start.jpg` … `4-drive.jpg` ke `out/`.

## Menjalankan

```bash
npx tsx serve.ts
# lalu buka http://127.0.0.1:8099/
```

## Kontrol

- `WASD` / panah: bergerak, mengemudi
- `Shift`: lari / ngebut
- `Spasi`: menembak (kaki) atau mengerem (dalam mobil)
- `E`: masuk / keluar mobil
- `Esc` / `P`: jeda
- Klik layar: kunci kursor untuk kamera

## Fitur

- Kota 10×10 blok dengan gedung, pohon palem, lampu jalan, dan trotoar.
- Siklus siang–malam: matahari bergerak, langit berubah, lampu menyala.
- Lima misi: curi mobil, kumpul kantong, hilangkan wanted, sprint pantai, parkir presisi.
- Polisi memprediksi gerak pemain dan membagi sisi saat mengejar.
- Pejalan kaki menyeberang, menghindar mobil, dan panik saat wanted.
- Bahan bakar mobil dan pom bensin di sudut barat-laut.
- Peluru bergerak dan bisa mengenai polisi atau pejalan kaki.
- Skor, kombo, nyaris-tabrak, minimap, speedometer, dan jam.
- Mode screenshot: `?shot=start|play|chase|drive|end&seed=1&hour=18`.

## Mode screenshot

```text
index.html?shot=start
index.html?shot=play&seed=1
index.html?shot=chase&hour=18.5
index.html?shot=drive&hour=18.2
index.html?shot=end&hour=22
```

## Lisensi

MIT. `game/vendor/three.min.js` milik three.js, lisensi MIT.
