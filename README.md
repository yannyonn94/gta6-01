# Kota Karang — Dunia Terbuka Pesisir

Kota Karang adalah game aksi dunia terbuka 3D berbahasa Indonesia: jelajahi kota pulau 10 blok kali 10 blok, curi mobil, kabur dari polisi, dan selesaikan 7 misi. Kota ini punya 3 jenis kendaraan (mobil, motor, van logistik), sistem buronan 0–5 bintang dengan roadblock, lalu lintas dan pejalan kaki, siklus siang-malam, hujan yang membuat jalan licin, SPBU, stamina, kombo skor sampai x4, minimap bundar, mode foto, dan suara sintetis WebAudio.

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/yannyonn94/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/yannyonn94/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01)

## Cara bermain

Jalankan server statis dari root repo, lalu buka gamenya di browser desktop:

```
node serve.ts
```

Buka http://localhost:8099/ dan klik **MULAI BARU**. Klik layar sekali untuk mengunci pointer dan mengarahkan kamera dengan mouse.

Untuk mode screenshot (dipakai mengambil 4 gambar di folder `screenshots/`), buka dengan parameter URL, contohnya:

```
http://localhost:8099/?shot=chase&seed=7&hour=17
```

Nama shot yang didukung: `start`, `play`, `chase`, `drive`, `koin`, `hujan`, `foto`, `end`.

## Kontrol

- **WASD / panah** — jalan dan mengemudi
- **Shift** — lari atau ngebut (memakai stamina)
- **Spasi** — tembak saat jalan kaki, rem saat berkendara
- **E** — naik atau turun kendaraan
- **H** — klakson
- **F** — mode foto (permainan membeku, HUD hilang, geser mouse untuk memutar kamera)
- **M** — bisukan suara
- **R** — reset kamera
- **Roda mouse** — zoom kamera
- **Esc / P** — jeda (menu jeda menampilkan statistik progres)
- **Klik layar** — kunci pointer untuk mengarahkan kamera

## Misi (7, berurutan)

1. **Kereta Mati** — curi mobil biru dari garasi dan antar ke dermaga.
2. **Kantong Hilang** — kumpulkan 8 kantong yang tersebar di kota.
3. **Hilang Sejenak** — polisi mengenalimu; sembunyi sampai buronan hilang.
4. **Sprint Pantai** — tempuh 420 meter di sepanjang pantai sebelum waktu habis.
5. **Parkir Presisi** — parkir rapi di dalam kotak kuning yang ditandai.
6. **Koin Karang** — kumpulkan 5 koin emas yang tersebar di kota.
7. **Badai Karang** — antar van logistik ke gudang pesisir barat dalam hujan badai, melewati roadblock; jarak dan hitung mundur tampil di tujuan.

## Sistem

- **Buronan 0–5 bintang**: naik saat mencuri kendaraan, menabrak, atau menembak; turun saat bersembunyi. Semakin tinggi, polisi semakin cepat dan akurat; pada 3 bintang ke atas polisi memasang roadblock.
- **Bahan bakar**: setiap kendaraan punya tangki; isi ulang di SPBU barat laut atau tenggara. Van lambat dan stabil dengan tangki besar; motor cepat dan ringan.
- **Stamina**: lari memakai stamina; diam memulihkan stamina lebih cepat. Menyelesaikan misi memulihkan sedikit kesehatan.
- **Kombo**: tiap 3 aksi berantai menaikkan pengali sampai x4, dan jendela kombo makin panjang di tiap level.
- **Cuaca**: hujan datang dan pergi; jalan jadi licin, langit menggelap, suara hujan berbunyi, dan pejalan kaki berlari ke tempat berteduh.

## Screenshot

Empat screenshot di `screenshots/` diambil langsung dari game yang berjalan di
Chromium headless (1280×720, software WebGL) lewat mode staging `shots.js`:

1. `1-start.jpg` — pandangan udara kota di siang hari (`?shot=start&hour=11`)
2. `2-play.jpg` — jalan kaki di jalan utama dekat pasar, misi 1 berjalan (`?shot=play&hour=11`)
3. `3-chase.jpg` — tiga mobil polisi mengejar di sore hari, buronan 3 bintang (`?shot=chase&hour=17`)
4. `4-drive.jpg` — van logistik menembus hujan badai dengan roadblock di depan (`?shot=drive&hour=16`)

Tiap gambar dikonversi ke JPEG kualitas 82 dan dibatasi 256 KiB.

## Struktur kode

Semua kode game ada di `game/src/` (satu file satu tugas): `config.js`, `world_config.js`, `random.js`, `input.js`, `city.js`, `vehicles.js`, `player.js`, `police.js`, `pedestrians.js`, `missions.js`, `daynight.js`, `fuel.js`, `score.js`, `hud.js`, `gta_sound.js`, `shots.js`, dan `game_main.js`. Rendering 3D memakai three.js 0.128 (MIT) yang disertakan di `game/vendor/three.min.js`.

## Membangun dossier

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Perintah ini menyalin screenshot dan menulis `out/dossier.json`.
