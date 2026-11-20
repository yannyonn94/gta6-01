# Kota Karang

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/yannyonn94/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/yannyonn94/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01)

Game aksi dunia terbuka untuk bounty make.fun [`gta6-01`](https://make.fun/bounty/gta6-01). Dibangun dari nol di
sesi ini: semua file di `game/src/` ditulis baru, bukan salinan dari versi
sebelumnya. Ronde 5 menambah misi ketujuh (Badai Karang: antar van saat hujan),
hujan yang membuat jalan licin, roadblock polisi di wanted 3+, van logistik,
mode foto (F), turis di antara pejalan kaki, lapak pasar, mercusuar dengan sorot
berputar, bar sisa kombo, menu jeda berstatistik, dan indikator cuaca di HUD.

## Perubahan ronde 5

- Misi ketujuh **Badai Karang**: antar van logistik ke gudang pantai barat di tengah hujan deras.
- Cuaca hujan bergantian: jalan licin, langit menggelap, derau hujan, pejalan kaki bergegas berteduh.
- Roadblock polisi saat wanted 3+: palang dan kerucut menutup jalan di depan pemain.
- **Mode foto (F)**: bekukan permainan, sembunyikan HUD, orbit kamera dengan seret mouse.
- Van logistik yang bisa dicuri (lambat, stabil, tangki 140), turis di antara pejalan kaki, lapak pasar, mercusuar dengan sorot berputar, zebra cross.
- Menu jeda menampilkan progres; bar sisa kombo; indikator cuaca; tombol M bisukan suara; R mereset kamera.

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
- `F`: mode foto (bekukan, sembunyikan HUD, orbit kamera dengan seret mouse)
- Roda mouse: zoom kamera
- `Esc` / `P`: jeda (menampilkan progres misi, skor, uang, dan nyawa)
- Klik layar: kunci kursor untuk kamera

## Fitur

- Kota 10×10 blok dengan gedung, pohon palem, lampu jalan, trotoar, pantai, dermaga, lapak pasar, dan mercusuar.
- Siklus siang–malam: matahari bergerak, langit berubah, lampu menyala, bintang dan bulan di malam hari, sorot mercusuar berputar saat gelap.
- Hujan bergantian: jalan licin (akselerasi dan belok berkurang), langit menggelap, pejalan kaki bergegas berteduh, derau hujan.
- Tujuh misi: curi mobil, kumpul kantong, hilangkan wanted, sprint pantai, parkir presisi, koin Karang, dan antar van saat badai.
- Polisi memprediksi gerak pemain dan membagi sisi saat mengejar; makin tinggi wanted, makin cepat dan akurat, makin lambat reda, dan wanted 3+ memunculkan roadblock di depan pemain.
- Pejalan kaki empat tipe (biasa, pelari, santai, turis yang berhenti memotret): menyeberang, menghindar mobil, dan panik saat wanted.
- Motor yang bisa dicuri: lebih cepat dan lincah dari mobil. Van logistik yang bisa dicuri: lambat, stabil, tangki besar.
- Bahan bakar mobil dan dua pom bensin (barat-laut dan tenggara); peringatan BBM rendah.
- Stamina untuk lari (diam memulihkan lebih cepat), klakson, dan zoom kamera; misi selesai memulihkan sedikit nyawa.
- Peluru bergerak dan bisa mengenai polisi atau pejalan kaki.
- Skor, kombo dengan pengali (maks x4) dan jendela yang memanjang tiap tingkat, nyaris-tabrak, minimap, speedometer, jam + periode hari, dan indikator cuaca.
- Mode foto (F): bekukan permainan, sembunyikan HUD, orbit kamera bebas.
- Mode screenshot: `?shot=start|play|chase|drive|koin|hujan|end&seed=1&hour=18`.

## Mode screenshot

```text
index.html?shot=start
index.html?shot=play&seed=1
index.html?shot=chase&hour=18.5
index.html?shot=drive&hour=18.2
index.html?shot=koin&hour=10.5
index.html?shot=hujan&hour=15
index.html?shot=end&hour=22
```

## Lisensi

MIT. `game/vendor/three.min.js` milik three.js, lisensi MIT.
