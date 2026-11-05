# DRIFTHOLD

A cozy, all-pixel browser game about a small spaceship drifting through space.

* **The ship** (slow and calm): build and upgrade rooms in a side-view cross-section, recruit pixel crew
  who wander, chat, work and nap, assign them to rooms, and come back to find food, alloy and data
  produced while you were away (up to 8 hours).
* **The drone run** (fast and snappy): a 60–90 second flight through an asteroid field. Steer, drill ore,
  dodge rocks and sector hazards (shard swarms, ice comets, magnetic storms, space whales, gravity wells),
  grab fuel cells, magnets and drill boosts, then fly home for a jingly tally.

Better rooms make a better drone, and better runs bring back the ore that better rooms cost.

## Play

Open `index.html` in any modern browser. There is no server, no build step and no install. It also works
from any static host (GitHub Pages and the like).

| | Laptop | Phone / tablet |
|---|---|---|
| Steer the drone | hold the mouse button (the drone flies toward the cursor), or WASD / arrow keys | drag anywhere (a floating thumb-stick appears) |
| Drill | touch a coloured rock and hold still | same |
| Dash (smashes small grey rocks, knocks ore loose) | `Space` / `Shift`, or a quick click aimed where you click | a quick tap aimed where you tap |
| Pick a perk (star core) | click a card or `1`–`3` | tap a card |
| Pause a run | `P` / `Esc` or the `II` button | `II` button (pauses automatically if you leave the app) |
| Bottom bar | click, or keys `1`–`5`. `Space` / `L` launches | tap |

The game saves itself to `localStorage`. **SETUP → EXPORT** copies a save code you can paste into
**IMPORT** on another device.

## What's inside

* 10 rooms × 5 levels. Every level redraws the room's pixel art.
* 9 ores, 6 sectors, 7 planets, 12 crew traits, 5 drone parts × 10 levels, 6 drone chassis,
  13 research projects, plus drone paints, hull paints and room decorations.
* At most 3 rotating goals at a time, a logbook with silhouettes for undiscovered entries, and a daily
  anomaly (one special run per day; missing a day costs nothing).
* Run toys: a dash that smashes rocks, star cores that open a pick-1-of-3 perk draft (11 perks), FEVER mode
  on long chains (double ore, faster music), one surprise event per run (ore storm, giant geode, fuel bloom,
  double time), hit-stop and screen-flash juice. On the ship, tap your crew and they hop and talk back.
* "One more run" systems: combo chains, salvage crates with rarity rolls, haul and chain records with
  near-miss nudges, a pilot rank that levels up from everything you do, and a daily care package that
  grows across the week (one missed day is forgiven). See "Engagement loops" in [DESIGN.md](DESIGN.md).
* A custom 16-colour palette, two bitmap fonts drawn in code, and procedural planets, asteroids and crew.
  There are no image or font files anywhere.
* Chiptune sound effects and soft generative music through the Web Audio API.

## Development

The code layout and the progression tables are in [DESIGN.md](DESIGN.md).

```bash
node tools/pacing-sim.js 60            # simulate the first 60 minutes of play, print unlock timeline
```

```bash
node tools/progression-table.js        # print the cost/rate tables from js/data.js
```

The `tools/test-*.js` scripts drive the game in headless Chromium through Playwright, for example:

```bash
SP=/tmp node tools/shot.js /tmp/out.png 1280 720 1 tools/test-flow.js
```

Adding `?speed=4` to the URL runs the simulation 4× per frame. It's only used by the automated
playthroughs.
