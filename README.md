[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/yannyonn94/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/yannyonn94/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

# Kota Karang — open world crime (make.fun gta6-01)

An original open-world crime game for the browser: a sun-soaked coastal city you can walk and
drive, with traffic, pedestrians, car theft, a wanted level and police cruisers that respond to
it, three authored missions, on-foot combat, a HUD with a minimap, a start screen and a save.

Everything is original — city, characters, vehicles, names, story, art and audio are authored for
this entry. Nothing from any commercial game is used.

## Run it

It is static files; no build step, no network request at play time.

```bash
cd gta6-01
node serve.ts          # serves game/ on http://localhost:8080
```

Then open <http://localhost:8080/> in a desktop browser (Chrome). Or serve `game/` with any
static file server and open `index.html`.

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` / arrows | Walk / drive |
| `Shift` | Run |
| Mouse | Look (pointer lock) |
| `E` | Enter / leave a car |
| `Space` | Brake (in a car) / fire (on foot) |
| `Esc` or `P` | Pause |

## What is in the city

- **Kota Karang**: a 10×10 block grid generated from a seed — roads, centre lines, lit buildings,
  streetlights and palms along the coast.
- **Traffic**: fourteen cars looping the road grid.
- **Pedestrians**: twenty-two walkers who scatter when the wanted level rises.
- **Car theft**: eight parked cars plus any traffic car; press `E` beside one.
- **Wanted level**: stealing cars and firing raise it; five police cruisers chase and their light
  bars flash. It decays over time when you lie low.
- **Missions**: *Kereta Mati* (steal a car to the docks), *Kantong Pasir* (collect three bags
  before the timer), *Hilang Sejenak* (shake the wanted level).
- **HUD**: wanted stars, cash, health bar, objective text and a live top-down minimap.
- **Save**: progress (cash, wanted, position, mission) is kept in `localStorage`; the start screen
  offers "Lanjutkan progres".
- **Audio**: every sound is synthesized with WebAudio — gunfire, police siren, engine pitch that
  follows speed, UI blips and a small music bed. No audio files.

## Code layout

```
game/index.html        page, HUD and overlays
game/src/game_main.js   entry point: scene, loop, input, missions, wanted, save, shot mode
game/src/city.js       city generation (roads, blocks, lights, palms)
game/src/player.js     on-foot character
game/src/vehicles.js   cars and the traffic fleet
game/src/police.js     police cruisers and their chase AI
game/src/pedestrians.js  pedestrian walkers
game/src/missions.js   the three missions and their state
game/src/hud.js        HUD widgets and the minimap canvas
game/src/input.js      keyboard + pointer-lock mouse input
game/src/config.js     every tuning number and colour
game/src/world_config.js  world constants and small helpers
game/src/gta_sound.js  WebAudio synthesis for every sound
game/src/shots.js      ?shot=start|play|chase|drive|end&seed=N scenes
game/vendor/           vendored Three.js (r128)
main.ts                hands the entry in: copies game/ + screenshots/ and writes dossier.json
serve.ts               tiny static server for local play
```

## Screenshots

`screenshots/` holds four renders of the running game, taken from the `?shot=` scenes:
`1-start.jpg` (cover, the city from above), `2-play.jpg` (on foot mid-street),
`3-chase.jpg` (wanted level with cruisers closing in) and `4-drive.jpg` (behind the wheel).

Entered on [make.fun](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01).