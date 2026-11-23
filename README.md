# Kota Karang — Open World

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/yannyonn94/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/yannyonn94/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01)

[![Kota Karang](https://img.shields.io/badge/game-Kota%20Karang-ffb347)](https://make.fun/bounty/gta6-01)
[![Pulau 10×10](https://img.shields.io/badge/pulau-10%C3%9710%20blok-19c2b8)](https://make.fun/bounty/gta6-01)
[![7 Misi](https://img.shields.io/badge/misi-7%20misi-d23b2e)](https://make.fun/bounty/gta6-01)

Game open-world 3D untuk bounty **GTA 6** di [make.fun](https://make.fun/bounty/gta6-01): kota pulau orisinal yang bisa dijelajahi dengan berjalan kaki dan mengemudi, lengkap dengan lalu lintas, pejalan kaki, polisi dan bintang buronan, 7 misi bercerita, HUD dengan minimap, siklus siang-malam, badai, suara hasil sintesis, dan simpanan permainan.

## Cara bermain

```sh
node serve.ts
# buka http://localhost:8099
```

Tanpa langkah build dan tanpa jaringan: semua berkas di bawah `game/` disajikan statis, three.js sudah di-vendor di `game/vendor/three.min.js`, dan semua suara disintesis dengan WebAudio.

| Tombol | Aksi |
| --- | --- |
| W A S D | Jalan / mengemudi |
| Shift | Lari / ngebut |
| E | Masuk & keluar mobil (mencuri mobil menaikkan 1 bintang) |
| Spasi | Rem tangan / drift |
| Mouse | Putar kamera (klik untuk mengunci pointer) |
| P | Mode foto (sembunyikan HUD) |
| M | Suara hidup / mati |
| R | Ulangi misi yang sedang berjalan |
| Esc | Jeda & simpan |

## Kota dan misi

Pulau **10×10 blok** dengan jalan grid, pantai, mercusuar di tanjung timur, pasar, pelabuhan barat, pom bensin, depot logistik, taman, dan pohon palem. Kamu bermain sebagai **Raka**, pendatang baru di pulau:

1. **Koin Pertama** — kumpulkan 8 koin emas di pasar pagi.
2. **Antar Paket** — ambil van di depot, antar 3 paket sebelum waktu habis.
3. **Taksi Karang** — jemput 2 turis di pasar, antar ke mercusuar.
4. **Kejar Pencuri** — tabrak mobil pencuri yang kabur 3 kali.
5. **Balapan Senja** — lewati 5 gerbang keliling pulau saat senja.
6. **Selundup Senyap** — antar paket ke pelabuhan tanpa satu pun bintang buronan.
7. **Badai Karang** — tembus hujan, roadblock, dan badai menuju mercusuar.

Sistem buronan 0–5 bintang: menabrak pejalan kaki, mencuri mobil, dan tabrakan keras menaikkan bintang; polisi mengejar dengan sirene, memasang roadblock mulai 3 bintang, dan menangkapmu bila terlalu dekat terlalu lama. Bintang turun sendiri setelah lama tidak berulah. Uang dari misi dan koin dilipatgandakan kombo; BBM terkuras saat mengemudi dan diisi di pom bensin.

## Struktur kode

```
game/
  index.html          — cangkang halaman + seluruh HUD (DOM + minimap kanvas)
  vendor/three.min.js — three.js (vendored, bukan kode sumber entri)
  src/
    boot.js      — perakitan + lingkaran permainan + mode tangkapan layar
    island.js    — pulau: laut, jalan, gedung, mercusuar, pasar, pelabuhan
    atmos.js     — siang-malam, kabut, hujan badai + kilat
    cars.js      — model mobil, fisika mengemudi, lalu lintas AI
    crowd.js     — pejalan kaki dan turis
    police.js    — bintang buronan, kejar-kejaran, roadblock, penangkapan
    missions.js  — state machine ketujuh misi + beacon penanda
    onfoot.js    — Raka berjalan kaki + tabrakan
    keys.js      — keyboard & mouse
    sfx.js       — suara WebAudio (mesin, sirene, koin, ombak)
    hud.js       — DOM HUD + minimap
    camera.js    — kamera ikut, orbit, mode foto, mode udara
    bank.js      — uang, kombo, BBM
    rng.js       — acak ber-seed
    tune.js      — semua angka penyetel + data misi
main.ts   — menyerahkan game/ + screenshots/ + dossier.json (kit make.fun)
serve.ts  — server statis lokal
```

Tangkapan layar (`screenshots/`) diambil dari permainan yang sedang berjalan lewat `?shot=1..4` di peramban headless: 1) kota dari udara siang hari, 2) jalan kaki di pasar pagi, 3) kejar-kejaran sore 3 bintang, 4) van menembus badai dengan roadblock di depan.

## Lisensi

MIT — lihat `LICENSE`.
