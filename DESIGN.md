# DRIFTHOLD — design & architecture

DRIFTHOLD has two loops that feed each other and feel deliberately opposite:

| | THE SHIP | THE DRONE RUN |
|---|---|---|
| Feel | slow, calm, planned | fast, snappy, skill-based |
| Time | real time, keeps going offline (8 h cap) | 60–90 s, ends when fuel runs out |
| You do | build/upgrade rooms, recruit & assign crew, research, decorate | steer, dodge, drill, grab pickups |
| Produces | food, alloy, data, drone parts, better drone stats | ore (9 kinds) |
| Needs | ore from runs | fuel, cargo, drill, magnet, shields from rooms |

A run can never fail. Broken shields trigger an automatic return with whatever cargo is left.

## Engagement loops ("one more run")

These systems sit on top of the two core loops. Each one targets a well-known reason players keep going,
and none of them punish you for stopping.

| System | Where | Why it works |
|---|---|---|
| **Combo chain** | run | Collecting ore without a long pause builds a chain (drilling keeps it alive, a hit breaks it). Every 10 in a chain pays bonus ore, the pickup sound climbs in pitch and the counter flashes. This is flow and mastery: routing well is rewarded on the spot. |
| **Salvage crate** | run → tally | About 40% of runs (never the first) carry a salvage signal. A crate drifts in partway through, with an edge arrow. It rattles open in the tally: COMMON 64%, RARE 29%, EPIC 7% (EPIC can hold the NEBULA paint or hull, which only crates give). This is a variable reward with a short build-up. |
| **Records & near-miss** | tally | Every tally names the haul to beat. Within 70% of it you get "SO CLOSE! N SHORT", and beating it shows NEW RECORD. The best chain is tracked too. A near-miss is one of the strongest "one more try" cues. |
| **AGAIN button** | tally | Once goals are on (3+ runs), the tally offers SHIP and AGAIN (`L`). Getting back into the action quickly keeps the loop tight. |
| **Next goal line** | tally | The tally shows the unfinished goal that is closest to done. An open loop is hard to walk away from (the Zeigarnik effect). |
| **Pilot rank** | everywhere | XP for everything: 1 per ore brought home, plus goals, builds, upgrades, parts, recruits, research, crates and anomalies. Each rank pays an ore bundle, and ranks 3/6/10/15 unlock rank-only cosmetics (EMBER paint/hull, LEGEND paint, STARLIT hull). The ship HUD always shows a part-filled bar, and the tally fills it live. Players speed up as a goal gets close (the goal-gradient effect). Tap the bar for the rank & records panel. |
| **Daily care package** | ship | The first visit each day opens a package that grows across a 7-day cycle (day 7 is the big one, with stardust). One missed day is forgiven, so the streak holds. The first run of each day also brings home +50% ore. This gives a reason to come back without a harsh streak. |

### Run toys (the moment-to-moment fun)

| Toy | How it plays |
|---|---|
| **Dash** | `Space`/`Shift` or a quick tap (aimed at the tap). A 0.26 s invulnerable burst on a 2.4 s cooldown. It smashes grey rocks up to r9 (chunky hit-stop, "POW!"), knocks a chunk out of ore rocks, and keeps the chain alive. Dodging becomes an active verb. |
| **Star cores → perk draft** | From the 2nd run on, a core spawns 9–17 s in, and ore rocks can drop up to 2 more. Grabbing one pauses the run for a pick-1-of-3 from 11 perks (TWIN DRILL, MEGA MAGNET, AFTERBURNER, WRECKING BALL, CHAIN KEEPER, FUEL SIPPER, BULWARK, OVERCLOCK, RICH VEINS, SCAVENGER, SALVAGER). Each run builds differently. |
| **Fever** | At a x30 chain (x15 with OVERCLOCK): banner, flashing border, a 160 bpm music track with hi-hats, double ore per chunk and a 1.6x magnet until the chain breaks. |
| **Surprise events** | From the 3rd run, one per run at 16–30 s: ORE STORM (a wave of ore rocks sweeps across), GIANT GEODE (a 22-chunk rock of the sector's rarest everyday ore, with an arrow), FUEL BLOOM (a ring of fuel cells), DOUBLE TIME (x2 chunks for 10 s). |
| **Juice** | Hit-stop on breaks and smashes, dash afterimages, white flashes on fever and geodes, queued banners. |
| **Crew pokes** | Tap a crew member on the ship: they hop, chirp (pitch per person), and say a line for their trait. Poke them a lot and they get giggly. Sleepers wake up. |
| **Bounties** | From the 2nd run, each run rolls one mini-challenge (never the same kind twice in a row): SMASH N GREY ROCKS, REACH A XN CHAIN, MINE N of the sector's main ore, GRAB N FUEL CELLS / POWER-UPS, NO BUMPS FOR NS, GRAB A STAR CORE, DASH INTO N ORE ROCKS. A banner announces it, the HUD tracks it, and finishing it gives +6 s fuel right away plus +25% everyday ore (at least 3) and 15 XP in the tally. A miss shows "BOUNTY MISSED (x/n)", which works as a near-miss nudge. Each one rewards a different verb, so runs feel different. |
| **Nova bomb** | From the 4th run, about half of runs start with one somewhere in the field (edge arrow "NOVA"), and smashed rocks have a 3% chance to drop another (max 2 per run). Grabbing it sends out an 80 px shockwave that smashes every grey rock regardless of size, knocks 2 chunks out of ore rocks and wipes out shards and comets. |
| **Flotsam** | On the ship, once goals are on, something drifts across the screen every 38–70 s: CARGO POD (sector ore), WISHING COMET (ore or a stardust, double XP), SPACE BOTTLE (a silly note plus food), SPACE JELLY (data; all crew hop and chatter). Tap it to collect. Missing one costs nothing. It gives the calm side a small "something's happening" moment. |

Cargo capacity still caps every run, so these make runs more exciting without inflating the economy much.
The 15-minute bot playthrough unlocks things at the same times as before the toys were added.

All tuning lives in `data.js` (`D.BOUNTY`, `D.BOUNTIES`, `D.NOVA`, `D.FLOTSAM`, `D.DASH`, `D.FEVER`, `D.PERKS`, `D.STARCORE`, `D.EVENTS`, `D.XP`, `D.xpForRank`, `D.RANK_REWARDS`, `D.COMBO`, `D.CRATE*`, `D.STREAK`).
There is still no real-money anything, no energy timers and no lose state.

## Architecture

There are no frameworks, no build step and no ES modules: these are classic `<script>` files that share one
`window.DH` namespace, so `index.html` opens straight from `file://`.

```
index.html            canvas + CSS (pixelated scaling, no scrolling/zooming), script order
js/palette.js         the 16 colours (PICO-8 style) + dark/light shade ramps
js/util.js            seeded RNG, hashing, easing, number/time formatting, date keys
js/font.js            two bitmap fonts drawn in code: BIG 5x7 and SMALL 3x5, inline colour codes
js/render.js          low-res canvas, integer scale in device pixels, primitives, sprites,
                      nearest-neighbour rotation, silhouettes, dithering, screen shake
js/input.js           mouse / touch / pen pointer + keyboard, in logical pixels
js/sprites.js         icon/prop/drone/whale pixel strings + generators (planets, asteroids,
                      nebulae, star fields), all cached
js/audio.js           Web Audio chiptune SFX, thruster loop, tiny generative music sequencer
js/data.js            ALL tuning: ores, rooms, costs, rates, parts, sectors, planets, research,
                      cosmetics, traits, anomalies   (also loaded by tools/*.js under Node)
js/save.js            versioned save (localStorage), migrations, export/import text codes
js/sim.js             pure economy/ship simulation: production, morale, drone stats, purchases,
                      offline catch-up. Emits events. Runs headless in Node.
js/ui.js              immediate-mode pixel UI: chunky buttons with 2px press, panels, tabs,
                      scroll areas, cost rows, toasts, tutorial tooltips
js/crew.js            procedural crew (name, species, hair, colours, trait), sprites
                      (stand/walk/sit/sleep/head) and their little life aboard
js/progression.js     tutorial steps, rotating goals, daily anomaly, logbook stats, toasts
js/scenes/title.js    logo + drifting ship
js/scenes/ship.js     the cross-section: layouts, hull, per-room/per-level art, crew, badges
js/scenes/run.js      the drone run: physics, drilling, magnet, hazards, HUD, tally
js/scenes/map.js      star map, travel warp, planet visit panel (crew / trade / shop)
js/panels.js          settings, logbook, welcome-back, launch chooser
js/roompanels.js      room panel (upgrade, crew, drone parts, research, chassis, paint, decor),
                      build, expand, hold
js/main.js            boot, game loop, scene transitions, bottom bar, the one-panel rule, saving
```

### Menu rules
* One panel at a time. `Esc`, the red X, or a tap that starts and ends on the dimmed backdrop (not on the bottom
  bar) closes it. Panels rise into place over 0.14 s.
* A disabled buy button never fails silently: tapping it plays "nope" and toasts the shortfall
  (`NEED 6 COPPER, 2 ICE MORE`, via `UI.shortfall`) or the reason (`WORKSHOP BUSY`, `NO FREE BEDS`).
* `UI.tabs` takes an optional `badges` array; a tab with something affordable gets a blinking red `!`.
  Arrow keys / `Tab` switch tabs, `[` `]` flip between rooms (also `◄` `►` in the room title bar).
* Scroll areas glide after a swipe, respond to the wheel, arrows, PgUp/PgDn, Home/End, and show a `▼` while
  there's more below. Desktop users get a hand cursor over anything clickable and key hints on the bottom bar.

### Rendering rules
* Logical resolution is picked from the device-pixel size of the window. Landscape screens get at least
  320x180 and portrait screens at least 180x300. The canvas is drawn at that size and scaled up by the
  largest whole number that fits, in device pixels, with `image-rendering: pixelated`, so a typical phone
  in portrait comes out around 195x420.
* Every draw call rounds to whole pixels. Rotation is done by nearest-neighbour into cached frames
  (32 for the drone, 16 for each asteroid, 48 for each planet), so no pixel ever leaves the palette.
* There is no alpha blending. "Dimming" behind panels is a 50% checkerboard dither in black.
* All text is drawn by `font.js` from glyph bitmaps. The only exception is the browser's own `prompt()`
  dialog for pasting or copying a save code, which can't be avoided.

### Frame order
`Sim.tick` (the ship always produces) → `scene.update` → `scene.draw` (world plus world hit areas) →
the single open panel → bottom bar → tutorial overlay → toasts → scene-transition wipe.
Input is immediate-mode: a button claims a press and fires when it is released inside its own rect. While
a blocking tip is up, everything underneath it ignores input.

### Saving
* The game saves within ~1.5 s of every meaningful event (build, buy, recruit, run end…), every 15 s,
  and on `visibilitychange`/`pagehide`. Saves are versioned (`v`), migrated step by step, and anything
  missing is filled in from the default state.
* An export code looks like `DH<version>-<checksum>-<base64 json>`. Import checks the checksum and runs
  the code through the same migration.
* Offline time is replayed in 1-minute steps, capped at 8 hours, and shown in a "welcome back" summary.

## Progression

Pacing was tuned with `tools/pacing-sim.js`. It loads the real `data.js` and `sim.js` and plays a
goal-following player whose run yield is fitted to bot playtests of the actual run scene (see
"Calibration" below). The tables below are generated by `node tools/progression-table.js`.

### Unlock order (one new system at a time, each with a pixel tooltip)

| Time (sim) | New thing | How it's introduced |
|---|---|---|
| 0:00 | Bridge + empty slot, LAUNCH | welcome tip points at LAUNCH |
| ~1:00 | first run done → build QUARTERS | tip points at the empty slot |
| ~1:10 | MAP button, planet KETTLE, first crew (free) | tip → map → "tap Kettle" |
| ~1:30 | GOALS (3 rotating, each pays a reward) | blocking tip |
| ~2–3 | blueprints (Workshop @Kettle, Hydroponics @Moss) | goal "get workshop plans" |
| ~3:20 | first room upgrade (Bridge L2) → HULL EXPANSION | goal + tip on the dotted outline |
| ~4:30 | WORKSHOP → drone parts (timed builds) | tip points at the workshop |
| ~5–7 | crew assignment, HYDROPONICS (food, offline output) | tips |
| ~7–8 | LOGBOOK (after first part) | NEW badge + tip |
| ~9–12 | REFINERY blueprint, DAILY ANOMALY, recruit #2 (food) | tips |
| ~17 | REFINERY built (alloy) | tip about copper |
| ~22 | OBSERVATORY → Sector 2 GLIMMER REACH revealed | toast + travel tip |
| ~24–29 | travel, crystal ore, shard hazard, PRISM: Galley & Lab blueprints, trading | |
| ~45–55 | LAB + research | tip |
| then | relaxed: Sector 3 (~1.5 h), 4 (~2 h), 5–6 (~3 h) of play; all 10 rooms ~2.5–4 h; max levels far beyond |

During the first 30 minutes something new unlocks every 1–5 minutes. After that the gaps grow (10–30 min)
and the idle side (offline production, workshop timers) carries more of the weight.

### Calibration
A bot pilot (`tools/bot.js`) flew real runs in the browser:

| Drone | Ore | Run time | Ore/s |
|---|---|---|---|
| base (cargo 24, drill 1.1 s) | 24 (full) | ~40 s | 0.6 |
| cargo 2, drill 2 | 42 (full) | ~55 s | 0.77 |
| all parts L3–4 | 68 (full) | 32–43 s | 1.6–2.1 |

The pacing sim models a human at 75% of that. The cargo table grows quickly enough that a good player's
cargo fills at about the time fuel runs out.

### 30-minute playthrough (real game, automated)
`tools/test-playthrough.js` runs the real game at 8x simulation speed. A bot flies every run in the real
run scene, and a goal-minded "brain" makes the purchases between runs (`tools/bot.js`, `tools/brain.js`).
Timeline in game minutes:

```
0.7  quarters built, first crew recruited, workshop blueprint
1.4  goals appear
2.2  bridge LV2, hydroponics blueprint
2.9  hull expansion, workshop built, first drone part
3.6  logbook unlocked, refinery blueprint
6.1  refinery built                         8.2  observatory blueprint
9.9  first quarters upgrade                13.9  bridge LV3 + 5th room
15.0 hydroponics built                     19.7  recruit #2 (food)
21.7 observatory built -> SECTOR 2 revealed
23.7 drift to Glimmer Reach                24.7 / 25.8  galley + lab blueprints
31.8 recruit #4   (31 runs, 13 goals completed, best haul 60)
```

That matches the pacing sim: something new every 1–5 minutes, and the second sector at around 22 minutes.

With the engagement loops on (chains, crates, rank rewards and the first-run-of-the-day bonus), the same bot
reaches Sector 2 at about 14 minutes, hits rank 11 by minute 30 (a rank-up about every 3 minutes) and peaks at
a ×60 chain. Rank rewards plus crates add about 15% to income. The rest comes from better runs (chain bonuses)
and how upgrades compound. `pacing-sim.js` at 180 minutes ends in almost the same place as before, because the
late game is gated by sector ores, not by ore volume.
A human takes longer between runs than the bot does, so expect roughly 1.3–1.5x these times.

### Economy notes
* Copper and ice are the early currency. Each later sector adds the ore that its tier of upgrades needs:
  crystal (S2), frostite (S3), gold and ionite (S4), starpearl (S5), voidglass and stardust (S6).
* Alloy (refined from copper over time) is the mid-game currency. The refinery stops when copper runs
  out, and a badge on the ship shows when it does.
* Food goes to recruiting and the galley. Data goes to research.
* Planets swap ore in fixed, non-exploitable ratios, so surplus copper and ice are never wasted.
* Morale starts at 100% and only ever adds bonuses. There are no punishments, energy systems or lose states.

### Rooms (cost to build = L1, then each upgrade)

| Room | Unlock | L1 | L2 | L3 | L4 | L5 | Effect |
|---|---|---|---|---|---|---|---|
| BRIDGE | start | - | 14 copper, 8 ice | 36 copper, 22 ice | 60 copper, 40 crystal, 18 alloy | 50 gold, 56 alloy, 25 frostite | hull rooms 2/4/6/8/10, +1s fuel per level |
| QUARTERS | start | 8 copper, 4 ice | 24 copper, 16 ice | 40 copper, 30 ice, 8 alloy | 31 alloy, 30 crystal, 20 frostite | 63 alloy, 40 gold, 20 starpearl | beds 2/4/6/8/10 |
| WORKSHOP | KETTLE (S1) | 14 copper, 6 ice | 40 copper, 25 ice, 6 alloy | 60 copper, 25 crystal, 18 alloy | 42 alloy, 25 frostite, 25 gold | 84 alloy, 35 ionite, 50 gold | part level cap 2/4/6/8/10, speed x1/1.25/1.5/1.8/2.2 |
| HYDROPONICS | MOSS (S1) | 10 copper, 14 ice | 25 copper, 35 ice | 50 ice, 10 alloy, 12 crystal | 80 ice, 28 alloy, 20 frostite | 56 alloy, 25 starpearl, 30 gold | food/min 2/3.5/5.5/8/11 |
| REFINERY | KETTLE (S1) | 20 copper, 12 ice | 45 copper, 25 ice, 6 alloy | 70 copper, 20 crystal, 14 alloy | 35 alloy, 30 gold, 15 frostite | 63 alloy, 30 ionite, 40 gold | alloy/min 2/3.2/4.8/6.5/9 (uses copper) |
| OBSERVATORY | MOSS (S1) | 35 copper, 25 ice, 4 alloy | 50 copper, 35 crystal, 21 alloy | 60 crystal, 35 alloy, 30 frostite | 60 gold, 56 alloy, 30 ionite | 84 alloy, 35 starpearl, 10 stardust | reveals sector L+1, data/min 0.3/0.6/0.9/1.2/1.5 |
| GALLEY | PRISM (S2) | 40 copper, 20 ice, 15 crystal | 60 copper, 30 crystal, 14 alloy | 50 crystal, 28 alloy, 20 frostite | 49 alloy, 40 gold, 20 ionite | 70 alloy, 30 starpearl, 50 gold | morale +10/15/20/25/30% when fed |
| LAB | PRISM (S2) | 30 crystal, 20 ice, 7 alloy | 50 crystal, 24 alloy, 40 copper | 70 crystal, 35 alloy, 25 frostite | 56 alloy, 30 ionite, 40 gold | 84 alloy, 20 voidglass, 20 starpearl | data/min 1.5/2.5/3.5/5/7, research tier L |
| LOUNGE | RIME (S3) | 40 crystal, 40 ice, 15 frostite | 30 frostite, 28 alloy, 40 crystal | 42 alloy, 40 gold, 30 frostite | 56 alloy, 30 ionite, 15 starpearl | 84 alloy, 35 starpearl, 15 voidglass | morale +8/12/16/20/25% |
| HANGAR | ZENNOR (S4) | 40 gold, 28 alloy, 15 ionite | 60 gold, 42 alloy, 25 ionite | 56 alloy, 40 ionite, 30 frostite | 70 alloy, 30 starpearl, 60 gold | 105 alloy, 30 voidglass, 10 stardust | cargo +5/level, chassis tier L |

### Hull expansions (Bridge level caps the total)

| Room # | Cost |
|---|---|
| 3 | 12 copper, 4 ice |
| 4 | 20 copper, 10 ice |
| 5 | 30 copper, 12 ice |
| 6 | 40 copper, 22 ice, 6 alloy |
| 7 | 25 alloy, 25 crystal |
| 8 | 40 alloy, 35 crystal, 12 gold |
| 9 | 80 alloy, 30 gold, 30 frostite |
| 10 | 120 alloy, 25 ionite, 50 gold |

### Drone parts (Workshop). Build time at speed 1

| Lv | Base cost | Time | Cargo | Fuel | Drill s/chunk | Magnet | Shields |
|---|---|---|---|---|---|---|---|
| 1 | 8 copper, 4 ice | 6s | 32 | 62s | 0.95 x1 | 15 | 4 |
| 2 | 16 copper, 10 ice | 12s | 44 | 64s | 0.81 x1 | 20 | 4 |
| 3 | 26 copper, 16 ice, 4 alloy | 25s | 60 | 66s | 0.70 x2 | 25 | 5 |
| 4 | 40 copper, 12 crystal, 8 alloy | 45s | 80 | 68s | 0.60 x2 | 30 | 5 |
| 5 | 28 crystal, 18 alloy, 10 gold | 75s | 104 | 70s | 0.52 x2 | 35 | 6 |
| 6 | 28 alloy, 22 gold, 12 frostite | 120s | 132 | 72s | 0.45 x3 | 40 | 6 |
| 7 | 42 alloy, 25 frostite, 15 ionite | 180s | 165 | 74s | 0.38 x3 | 45 | 7 |
| 8 | 63 alloy, 30 ionite, 45 gold | 270s | 200 | 76s | 0.33 x3 | 50 | 7 |
| 9 | 91 alloy, 30 starpearl, 70 crystal | 400s | 240 | 78s | 0.28 x4 | 55 | 8 |
| 10 | 126 alloy, 25 voidglass, 12 stardust | 600s | 285 | 80s | 0.24 x4 | 60 | 8 |

### Crew recruiting (needs a free bed)

| Crew # | Cost |
|---|---|
| 1 | free |
| 2 | 10 food |
| 3 | 25 food, 10 ice |
| 4 | 45 food, 25 copper |
| 5 | 70 food, 15 crystal |
| 6 | 100 food, 20 alloy |
| 7 | 140 food, 20 gold |
| 8 | 190 food, 15 frostite |
| 9 | 250 food, 15 starpearl |
| 10 | 320 food, 10 voidglass |

### Sectors

| # | Sector | Ores (weight) | Hazard | Planets | Revealed by |
|---|---|---|---|---|---|
| 1 | HOME DRIFT | copper 60, ice 39, stardust 1 | - | KETTLE, MOSS | start |
| 2 | GLIMMER REACH | copper 30, ice 20, crystal 44, gold 5, stardust 1 | shards | PRISM | Observatory L1 |
| 3 | FROSTLINE | ice 34, crystal 25, frostite 30, gold 10, stardust 1 | comets | RIME | Observatory L2 |
| 4 | ION EXPANSE | copper 25, gold 34, ionite 30, crystal 10, stardust 1 | storm | ZENNOR | Observatory L3 |
| 5 | WHALE DEEP | gold 25, crystal 20, starpearl 34, ice 20, stardust 1 | whales | LULLABY | Observatory L4 |
| 6 | THE HOLLOW | voidglass 35, stardust 8, gold 27, ionite 30 | wells | ECHO | Observatory L5 |

### Research (Lab)

| Research | Tier | Cost | Effect |
|---|---|---|---|
| ORE SENSE | 1 | 20 data | arrows point to nearby ore during runs. |
| SOFT HULL | 1 | 30 data | bumps spill half as much cargo. |
| LUCKY DRILL | 1 | 40 data | 10% chance for double chunks. |
| TUNED THRUSTERS | 2 | 60 data | +12% drone speed. |
| MAGNET FIELD | 2 | 70 data | +40% magnet range. |
| DEEP PANTRY | 2 | 80 data, 30 ice | +25% food production. |
| FUEL RECYCLER | 3 | 100 data, 10 frostite | +5s drone fuel. |
| SHIELD CAPACITOR | 3 | 120 data, 30 crystal | shields recharge 1 pip every 20s. |
| EFFICIENT DRIFT | 3 | 120 data, 40 alloy | +25% offline production. |
| STARDUST LENS | 4 | 160 data, 5 stardust | stardust rocks appear twice as often. |
| COMPRESSION | 4 | 180 data, 20 ionite | +15% cargo space. |
| MOTHERLODE | 5 | 250 data, 10 voidglass | huge rich asteroids appear on runs. |
| CREW HARMONY | 5 | 300 data, 20 starpearl | +15% morale. |

