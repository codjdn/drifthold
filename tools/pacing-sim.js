// DRIFTHOLD pacing simulator.
// Loads the real game data + economy code and plays a "typical" player greedily,
// printing when each new system / room / sector unlocks. Usage: node tools/pacing-sim.js [minutes]
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = global;
const root = path.join(__dirname, '..');
['js/util.js', 'js/data.js', 'js/save.js', 'js/sim.js'].forEach(f => {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
});
const { D, Sim, Save, U } = global.DH;

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const LIMIT_MIN = Number(args[0] || 60);
const SKILL = Number(args[1] || 0.75);   // fraction of ideal mining a player achieves
const s = Save.defaultState();
let t = 0; // seconds
const log = [];
const firsts = new Set();
function note(kind, what) { log.push({ t, kind, what }); }
function newThing(key, label) { if (!firsts.has(key)) { firsts.add(key); note('NEW', label); } }

const rng = U.rng(42);
// how much ore a run yields on average, per the drone stats
function runYield(sector) {
  const st = Sim.droneStats(s);
  const units = 4.5;
  // travel time per rock, fitted to bot playtests (magnet range shortens it)
  const perAst = (units / st.chunk) * st.drillTime + 2.6 * Math.sqrt(10 / st.magnet) * (92 / st.speed);
  const rate = units / perAst * SKILL * (1 + st.luck);
  const mineTime = Math.min(st.fuel - 4, st.cargo / rate);
  const total = Math.min(st.cargo, Math.round(rate * mineTime));
  const sec = D.sector(sector);
  const haul = {};
  let w = 0; for (const k in sec.ores) w += sec.ores[k];
  let left = total;
  for (const k in sec.ores) {
    const n = Math.round(total * sec.ores[k] / w);
    haul[k] = n; left -= n;
  }
  haul[Object.keys(sec.ores)[0]] += left;
  for (const k in haul) if (haul[k] <= 0) delete haul[k];
  return { haul, dur: mineTime + 14, total };
}

function advance(sec) {
  // the ship keeps producing while time passes
  let left = sec;
  while (left > 0) { const st = Math.min(5, left); Sim.tick(s, st, false); left -= st; }
  t += sec;
}

let candSerial = 0;
function candidate(planet) {
  return { id: 'c' + (++candSerial), name: 'CREW' + candSerial, look: {}, trait: U.pick(D.TRAIT_KEYS, rng), from: planet };
}

// all purchases currently possible, with a priority weight (lower = sooner)
function options() {
  const o = [];
  const free = Sim.freeSlotIndex(s);
  Sim.buildable(s).forEach(type => {
    if (free >= 0) o.push({ label: 'BUILD ' + type, cost: Sim.buildCost(type), w: 0.2, act: () => Sim.build(s, free, type), key: 'build:' + type });
  });
  if (Sim.canExpand(s) && Sim.buildable(s).length > 0 && free < 0) {
    o.push({ label: 'EXPAND HULL ' + (s.hull + 1), cost: Sim.hullCost(s), w: 0.25, act: () => Sim.expand(s), key: 'hull' });
  }
  for (let i = 0; i < s.slots.length; i++) {
    const r = s.slots[i]; if (!r) continue;
    const c = Sim.upgradeCost(s, i); if (!c) continue;
    let w = 1.0;
    if (r.type === 'bridge' && !Sim.canExpand(s) && Sim.buildable(s).length > 0 && free < 0) w = 0.25;
    if (r.type === 'observatory') w = 0.45;
    if (r.type === 'quarters' && s.crew.length >= Sim.bedCount(s)) w = 0.8;
    o.push({ label: 'UPGRADE ' + r.type + ' L' + (r.lvl + 1), cost: c, w, act: () => Sim.upgrade(s, i), key: 'up:' + r.type + (r.lvl + 1) });
  }
  // planet blueprints in revealed sectors
  D.PLANET_ORDER.forEach(pid => {
    const p = D.PLANETS[pid];
    if (p.sector > s.revealed) return;
    if (!s.crew.length) return; // map opens in the tutorial after the first crew member
    p.unlocks.forEach(u => {
      if (u.kind !== 'room' || Sim.ownsUnlock(s, u)) return;
      o.push({ label: 'BLUEPRINT ' + u.id + ' @' + pid, cost: u.cost, w: 0.3, act: () => Sim.buyUnlock(s, u), key: 'bp:' + u.id });
    });
  });
  if (!s.job && Sim.level(s, 'workshop') > 0) {
    D.PART_ORDER.forEach(part => {
      if (s.parts[part] + 1 > Sim.partCap(s)) return;
      const c = Sim.partNextCost(s, part); if (!c) return;
      const w = part === 'cargo' || part === 'drill' ? 0.75 : 1.0;
      o.push({ label: 'PART ' + part + ' L' + (s.parts[part] + 1), cost: c, w, act: () => Sim.startPart(s, part), key: 'part:' + part });
    });
  }
  if (s.crew.length < Sim.bedCount(s)) {
    o.push({ label: 'RECRUIT #' + (s.crew.length + 1), cost: Sim.recruitCost(s), w: 0.5, act: () => {
      const ok = Sim.recruit(s, candidate('kettle'));
      if (ok) autoAssign();
      return ok;
    }, key: 'recruit' });
  }
  if (Sim.level(s, 'lab') > 0) {
    D.RESEARCH_ORDER.forEach(id => {
      if (!Sim.researchAvailable(s, id)) return;
      o.push({ label: 'RESEARCH ' + id, cost: D.RESEARCH[id].cost, w: 0.7, act: () => Sim.doResearch(s, id), key: 'res:' + id });
    });
  }
  return o;
}

function autoAssign() {
  const prefs = ['hydroponics', 'refinery', 'workshop', 'lab', 'observatory', 'bridge', 'galley', 'lounge', 'hangar', 'quarters'];
  s.crew.forEach(c => {
    if (c.room !== null) return;
    for (const type of prefs) {
      const slot = Sim.findSlot(s, type);
      if (slot < 0) continue;
      if (Sim.assign(s, c.id, slot)) break;
    }
  });
}

function costSize(cost) { let n = 0; for (const k in cost) n += cost[k] * (k === 'food' || k === 'data' ? 0.4 : 1); return n; }
function missing(cost) { const m = {}; for (const k in cost) { const d = cost[k] - (s.res[k] || 0); if (d > 0) m[k] = d; } return m; }

function bestSector(need) {
  let best = s.sector, bestScore = -1;
  for (let id = 1; id <= s.revealed; id++) {
    const sec = D.sector(id);
    let w = 0; for (const k in sec.ores) w += sec.ores[k];
    let score = 0;
    for (const k in need) score += (sec.ores[k] || 0) / w * Math.min(need[k], 60);
    if (score > bestScore) { bestScore = score; best = id; }
  }
  return best;
}

let runs = 0;
const firstRecruitDone = () => s.crew.length > 0;
while (t < LIMIT_MIN * 60) {
  // free first recruit once quarters exist (tutorial)
  if (!firstRecruitDone() && Sim.level(s, 'quarters') > 0) {
    advance(40); // walk to map, visit planet
    Sim.recruit(s, candidate('kettle')); autoAssign();
    newThing('crew', 'FIRST CREW (MAP + PLANET)');
  }
  for (let id = 1; id <= s.revealed; id++) if (!firsts.has('sector' + id)) newThing('sector' + id, 'SECTOR ' + id + ' ' + D.sector(id).name + ' REVEALED');
  // buy everything we can afford in priority order
  let bought = true, guard = 0;
  while (bought && guard++ < 30) {
    bought = false;
    const every = options().sort((a, b) => a.w * costSize(a.cost) - b.w * costSize(b.cost));
    const goal = every[0];
    const goalMissing = goal ? missing(goal.cost) : {};
    // a goal-driven player saves up: only buy the goal, or things that don't eat into what the goal still needs
    const opts = every.filter(o => Sim.canAfford(s, o.cost) && (o === goal || Object.keys(o.cost).every(k => !goalMissing[k] && !(goal.cost[k] && o.cost[k] > (s.res[k] - goal.cost[k])))));
    if (opts.length) {
      const o = opts[0];
      if (o.act()) {
        bought = true;
        const isNew = o.key.startsWith('build') || o.key.startsWith('bp') || o.key === 'hull' && !firsts.has('hull') || o.key.startsWith('part') && !firsts.has('part') || o.key.startsWith('up') && !firsts.has('up');
        if (o.key === 'hull') newThing('hull', 'HULL EXPANSION');
        else if (o.key === 'recruit') newThing('recruit' + s.crew.length, 'RECRUIT CREW #' + s.crew.length);
        else if (o.key.startsWith('part')) newThing('part', 'FIRST DRONE PART');
        else if (o.key.startsWith('up')) newThing('up', 'FIRST ROOM UPGRADE');
        if (o.key.startsWith('build') || o.key.startsWith('bp') || o.key.startsWith('res:') && !firsts.has('research')) {
          if (o.key.startsWith('res:')) newThing('research', 'FIRST RESEARCH');
          else newThing(o.key, o.label);
        }
        if (!isNew) note('buy', o.label);
      }
    }
  }
  // choose a target to work toward, and the best sector for it
  const all = options().sort((a, b) => a.w * costSize(a.cost) - b.w * costSize(b.cost));
  const target = all[0];
  const need = target ? missing(target.cost) : {};
  const sector = bestSector(need);
  if (sector !== s.sector) { Sim.travel(s, sector); newThing('travel' + sector, 'TRAVEL TO SECTOR ' + sector); }
  const ry = runYield(s.sector);
  advance(ry.dur);
  Sim.applyRun(s, ry.haul, { hits: 1 });
  runs++;
  if (runs === 1) newThing('run1', 'FIRST RUN DONE (' + ry.total + ' ORE)');
}

function mmss(sec) { const m = Math.floor(sec / 60), ss = Math.floor(sec % 60); return String(m).padStart(3) + ':' + String(ss).padStart(2, '0'); }
console.log('time    | event');
console.log('--------+--------------------------------------------');
let last = 0;
log.forEach(e => {
  if (e.kind === 'NEW') {
    console.log(mmss(e.t) + ' | * ' + e.what + (last ? '   (+' + Math.round((e.t - last) / 60 * 10) / 10 + ' min)' : ''));
    last = e.t;
  } else if (process.argv.includes('--all')) console.log(mmss(e.t) + ' |     ' + e.what);
});
const st = Sim.droneStats(s);
console.log('\nafter', LIMIT_MIN, 'min:', runs, 'runs, crew', s.crew.length, 'rooms', Sim.builtCount(s), 'sector', s.revealed);
console.log('drone: fuel', st.fuel, 'cargo', st.cargo, 'drill', st.drillTime.toFixed(2), 'chunk', st.chunk, 'shields', st.shields);
console.log('parts', JSON.stringify(s.parts));
console.log('rooms', s.slots.filter(Boolean).map(r => r.type + ':' + r.lvl).join(' '));
console.log('res', Object.keys(s.res).filter(k => s.res[k] >= 1).map(k => k + ':' + Math.floor(s.res[k])).join(' '));
