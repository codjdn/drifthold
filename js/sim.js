// DRIFTHOLD - sim.js
// The ship simulation: production, morale, crew bonuses, drone stats and every purchase.
// Pure logic on the save state (no drawing), so it also runs headless in tools/pacing-sim.js.
(function (DH) {
  'use strict';
  var D = DH.D;
  var Sim = { listeners: [] };
  var OFFLINE_CAP = 8 * 3600;
  Sim.OFFLINE_CAP = OFFLINE_CAP;

  Sim.on = function (fn) { Sim.listeners.push(fn); };
  Sim.emit = function (type, data) {
    for (var i = 0; i < Sim.listeners.length; i++) {
      try { Sim.listeners[i](type, data || {}); } catch (e) { if (typeof console !== 'undefined') console.error(e); }
    }
  };

  // ------------------------------------------------------------------ resource helpers
  Sim.canAfford = function (s, cost) {
    if (!cost) return true;
    for (var k in cost) if ((s.res[k] || 0) < cost[k]) return false;
    return true;
  };
  Sim.pay = function (s, cost) {
    if (!Sim.canAfford(s, cost)) return false;
    for (var k in cost) s.res[k] -= cost[k];
    return true;
  };
  Sim.give = function (s, res, why) {
    for (var k in res) {
      s.res[k] = (s.res[k] || 0) + res[k];
      if (D.ORES[k]) s.seen.ores[k] = true;
    }
    Sim.emit('gain', { res: res, why: why });
  };
  // fraction of a cost we already have (0..1), handy for "nearly there" hints
  Sim.progressTo = function (s, cost) {
    var have = 0, need = 0;
    for (var k in cost) { need += cost[k]; have += Math.min(cost[k], s.res[k] || 0); }
    return need ? have / need : 1;
  };

  // ------------------------------------------------------------------ rooms
  Sim.room = function (s, slot) { return s.slots[slot] || null; };
  Sim.findSlot = function (s, type) {
    for (var i = 0; i < s.slots.length; i++) if (s.slots[i] && s.slots[i].type === type) return i;
    return -1;
  };
  Sim.level = function (s, type) {
    var i = Sim.findSlot(s, type);
    return i < 0 ? 0 : s.slots[i].lvl;
  };
  Sim.crewIn = function (s, slot) {
    return s.crew.filter(function (c) { return c.room === slot; });
  };
  Sim.crewInType = function (s, type) {
    var slot = Sim.findSlot(s, type);
    return slot < 0 ? [] : Sim.crewIn(s, slot);
  };
  Sim.bedCount = function (s) {
    var q = Sim.level(s, 'quarters');
    return q ? D.ROOMS.quarters.beds[q - 1] : 0;
  };
  Sim.freeSlotIndex = function (s) {
    for (var i = 0; i < s.hull; i++) if (!s.slots[i]) return i;
    return -1;
  };
  Sim.builtCount = function (s) { return s.slots.filter(function (r) { return !!r; }).length; };

  Sim.morale = function (s) {
    var m = 1;
    var q = Sim.level(s, 'quarters'); if (q) m += q * 0.02;
    var g = Sim.level(s, 'galley'); if (g && s.galleyFed) m += D.ROOMS.galley.morale[g - 1] / 100;
    var l = Sim.level(s, 'lounge'); if (l) m += D.ROOMS.lounge.morale[l - 1] / 100;
    s.crew.forEach(function (c) {
      var r = c.room !== null && c.room !== undefined ? s.slots[c.room] : null;
      var t = r ? r.type : null;
      if (c.trait === 'cheerful') m += 0.05;
      if (t === 'quarters') m += 0.02;
      if (t === 'galley' || t === 'lounge') m += 0.03;
      if (c.trait === 'cook' && t === 'galley') m += 0.08;
      if (c.trait === 'sleepyhead' && (t === 'quarters' || t === 'lounge')) m += 0.06;
    });
    if (s.research.harmony) m += 0.15;
    return Math.min(2, m);
  };

  function crewMult(s, slot, type, offline) {
    var m = 1;
    Sim.crewIn(s, slot).forEach(function (c) {
      var match = D.TRAITS[c.trait] && D.TRAITS[c.trait].room === type;
      m += match ? 0.5 : 0.25;
      if (offline && c.trait === 'nightowl') m += 0.4;
    });
    return m;
  }

  // production per minute of a room's output resource
  Sim.roomRate = function (s, slot, offline) {
    var r = s.slots[slot];
    if (!r) return 0;
    var def = D.ROOMS[r.type];
    if (!def.rate) return 0;
    var rate = def.rate[r.lvl - 1] * crewMult(s, slot, r.type, offline) * Sim.morale(s);
    if (r.type === 'hydroponics' && s.research.pantry) rate *= 1.25;
    if (offline && s.research.drift) rate *= 1.25;
    return rate;
  };

  Sim.workshopSpeed = function (s, offline) {
    var slot = Sim.findSlot(s, 'workshop');
    if (slot < 0) return 0;
    var r = s.slots[slot];
    var sp = D.ROOMS.workshop.speed[r.lvl - 1];
    var m = 1;
    Sim.crewIn(s, slot).forEach(function (c) {
      m += c.trait === 'tinkerer' ? 0.5 : 0.25;
      if (offline && c.trait === 'nightowl') m += 0.4;
    });
    return sp * m * Sim.morale(s) * (offline && s.research.drift ? 1.25 : 1);
  };

  // advance the ship by dt seconds. Returns what was produced.
  Sim.tick = function (s, dt, offline) {
    var out = { food: 0, alloy: 0, data: 0, cuUsed: 0, partsDone: [] };
    if (dt <= 0) return out;
    for (var i = 0; i < s.slots.length; i++) {
      var r = s.slots[i];
      if (!r) continue;
      var def = D.ROOMS[r.type];
      if (def.rate) {
        var amt = Sim.roomRate(s, i, offline) * dt / 60;
        if (def.uses) {
          var ratio = def.ratio[r.lvl - 1];
          var maxByOre = (s.res[def.uses] || 0) / ratio;
          amt = Math.max(0, Math.min(amt, maxByOre));
          s.res[def.uses] -= amt * ratio;
          out.cuUsed += amt * ratio;
          r.starved = amt <= 0.00001 && Sim.roomRate(s, i, offline) > 0;
        }
        s.res[def.makes] += amt;
        out[def.makes] += amt;
        s.stats.produced[def.makes] = (s.stats.produced[def.makes] || 0) + amt;
      }
      if (r.type === 'galley') {
        var need = def.eat[r.lvl - 1] * dt / 60;
        if (s.res.food >= need) { s.res.food -= need; s.galleyFed = true; }
        else s.galleyFed = false;
      }
    }
    // workshop job
    if (s.job) {
      var sp = Sim.workshopSpeed(s, offline);
      if (sp > 0) {
        s.job.work += dt * sp;
        if (s.job.work >= s.job.need) {
          var job = s.job;
          s.parts[job.part] = job.lvl;
          s.job = null;
          s.stats.partsBuilt++;
          out.partsDone.push(job);
          Sim.emit('part', { part: job.part, lvl: job.lvl });
          Sim.addXp(s, D.XP.part + job.lvl * 2, 'part');
        }
      }
    }
    if (out.food || out.alloy || out.data) Sim.emit('produce', out);
    return out;
  };

  // simulate time away in one-minute steps (capped at 8 hours)
  Sim.catchUp = function (s, seconds) {
    seconds = Math.min(OFFLINE_CAP, Math.max(0, seconds));
    var total = { food: 0, alloy: 0, data: 0, cuUsed: 0, partsDone: [], seconds: seconds };
    var left = seconds;
    while (left > 0) {
      var step = Math.min(60, left);
      var o = Sim.tick(s, step, true);
      total.food += o.food; total.alloy += o.alloy; total.data += o.data; total.cuUsed += o.cuUsed;
      total.partsDone = total.partsDone.concat(o.partsDone);
      left -= step;
    }
    return total;
  };

  // ------------------------------------------------------------------ drone stats
  Sim.partCap = function (s) {
    var w = Sim.level(s, 'workshop');
    return Math.min(D.MAX_PART_LVL, w * 2);
  };

  Sim.droneStats = function (s) {
    var RUN = D.RUN, p = s.parts;
    var ch = (D.CHASSIS[s.chassis] || D.CHASSIS.standard).mods;
    var bridge = Sim.level(s, 'bridge'), hangar = Sim.level(s, 'hangar');
    var st = {};
    st.fuel = RUN.baseFuel + RUN.fuelPerPart * p.fuel + Math.max(0, bridge - 1);
    Sim.crewInType(s, 'bridge').forEach(function (c) { st.fuel += c.trait === 'pilot' ? 5 : 2; });
    if (s.research.recycler) st.fuel += 5;
    st.cargo = D.CARGO_TABLE[p.cargo] + hangar * 5;
    Sim.crewInType(s, 'hangar').forEach(function () { st.cargo += 3; });
    st.cargo = Math.round(st.cargo * (ch.cargo || 1) * (s.research.compress ? 1.15 : 1));
    st.drillTime = RUN.baseDrill * Math.pow(RUN.drillMult, p.drill) / (ch.drill || 1);
    st.chunk = 1 + Math.floor(p.drill / 3);
    st.magnet = (RUN.baseMagnet + RUN.magnetPerPart * p.magnet) * (s.research.magfield ? 1.4 : 1) * (ch.magnet || 1);
    st.shields = RUN.baseShield + Math.floor((p.shield + 1) / 2) + (ch.shield || 0);
    s.crew.forEach(function (c) {
      var r = c.room !== null && c.room !== undefined ? s.slots[c.room] : null;
      if (c.trait === 'mechanic' && r && (r.type === 'workshop' || r.type === 'hangar')) st.shields += 1;
    });
    st.shields = Math.max(1, st.shields);
    st.speed = RUN.speed * (ch.speed || 1) * (s.research.thrusters ? 1.12 : 1);
    st.luck = (s.research.luckydrill ? 0.1 : 0);
    s.crew.forEach(function (c) { if (c.trait === 'lucky') st.luck += 0.05; });
    st.sense = !!s.research.oresense;
    st.spill = s.research.softhull ? 0.5 : 1;
    st.regen = !!s.research.capacitor;
    st.lens = !!s.research.lens;
    st.motherlode = !!s.research.motherlode;
    return st;
  };

  // ------------------------------------------------------------------ costs
  Sim.buildCost = function (type) { return D.ROOMS[type].cost[0]; };
  Sim.upgradeCost = function (s, slot) {
    var r = s.slots[slot];
    if (!r || r.lvl >= D.MAX_ROOM_LVL) return null;
    return D.ROOMS[r.type].cost[r.lvl];
  };
  Sim.hullCost = function (s) { return s.hull >= D.MAX_SLOTS ? null : D.HULL_COST[s.hull]; };
  Sim.hullCap = function (s) { return D.slotsForBridge(Sim.level(s, 'bridge')); };
  Sim.canExpand = function (s) { return s.hull < Sim.hullCap(s) && s.hull < D.MAX_SLOTS; };
  Sim.recruitCost = function (s) { return D.RECRUIT_COST[Math.min(s.crew.length, D.RECRUIT_COST.length - 1)]; };
  Sim.partNextCost = function (s, part) {
    var lvl = s.parts[part] + 1;
    if (lvl > D.MAX_PART_LVL) return null;
    return D.partCost(part, lvl);
  };

  // what can be built in an empty slot right now
  Sim.buildable = function (s) {
    return D.ROOM_ORDER.filter(function (t) { return s.blueprints[t] && Sim.findSlot(s, t) < 0; });
  };

  // ------------------------------------------------------------------ actions
  Sim.build = function (s, slot, type) {
    if (s.slots[slot] || slot >= s.hull) return false;
    if (!s.blueprints[type] || Sim.findSlot(s, type) >= 0) return false;
    if (!Sim.pay(s, Sim.buildCost(type))) return false;
    s.slots[slot] = { type: type, lvl: 1, decor: null, built: Date.now() };
    s.stats.builds++;
    Sim.emit('build', { type: type, slot: slot });
    Sim.addXp(s, D.XP.build, 'build');
    if (type === 'observatory') Sim.revealFromObservatory(s);
    return true;
  };

  Sim.upgrade = function (s, slot) {
    var r = s.slots[slot];
    var cost = Sim.upgradeCost(s, slot);
    if (!r || !cost || !Sim.pay(s, cost)) return false;
    r.lvl++;
    r.built = Date.now();
    s.stats.upgrades++;
    Sim.emit('upgrade', { type: r.type, slot: slot, lvl: r.lvl });
    Sim.addXp(s, D.XP.upgrade * r.lvl / 2, 'upgrade');
    if (r.type === 'observatory') Sim.revealFromObservatory(s);
    return true;
  };

  Sim.revealFromObservatory = function (s) {
    var lv = Sim.level(s, 'observatory');
    var want = Math.min(D.SECTORS.length, 1 + lv);
    if (want > s.revealed) {
      s.revealed = want;
      s.seen.sectors[want] = true;
      Sim.emit('reveal', { sector: want });
    }
  };

  Sim.expand = function (s) {
    if (!Sim.canExpand(s)) return false;
    if (!Sim.pay(s, Sim.hullCost(s))) return false;
    s.hull++;
    while (s.slots.length < s.hull) s.slots.push(null);
    Sim.emit('expand', { hull: s.hull });
    return true;
  };

  Sim.assign = function (s, crewId, slot) {
    var c = s.crew.filter(function (x) { return x.id === crewId; })[0];
    if (!c) return false;
    if (slot !== null) {
      var r = s.slots[slot];
      if (!r) return false;
      var inRoom = Sim.crewIn(s, slot).filter(function (x) { return x.id !== crewId; });
      if (inRoom.length >= D.crewSlots(r.lvl)) return false;
    }
    c.room = slot;
    Sim.emit('assign', { crew: c, slot: slot });
    return true;
  };

  Sim.startPart = function (s, part) {
    if (s.job) return false;
    var lvl = s.parts[part] + 1;
    if (lvl > Sim.partCap(s)) return false;
    var cost = D.partCost(part, lvl);
    if (!cost || !Sim.pay(s, cost)) return false;
    s.job = { part: part, lvl: lvl, work: 0, need: D.PART_TIME[lvl] };
    Sim.emit('partStart', { part: part, lvl: lvl });
    return true;
  };

  Sim.recruit = function (s, cand) {
    if (s.crew.length >= Sim.bedCount(s)) return false;
    if (!Sim.pay(s, Sim.recruitCost(s))) return false;
    var c = {
      id: cand.id, name: cand.name, look: cand.look, trait: cand.trait,
      room: null, from: cand.from, joined: Date.now()
    };
    s.crew.push(c);
    s.recruits[cand.from] = (s.recruits[cand.from] || 0) + 1;
    s.stats.recruited++;
    s.seen.traits[c.trait] = s.seen.traits[c.trait] || { name: c.name, look: c.look };
    Sim.emit('recruit', { crew: c });
    Sim.addXp(s, D.XP.recruit, 'recruit');
    return true;
  };

  Sim.trade = function (s, offer) {
    if (!Sim.pay(s, offer.give)) return false;
    Sim.give(s, offer.get, 'trade');
    s.stats.trades++;
    Sim.emit('trade', { offer: offer });
    return true;
  };

  // planet unlock offers (blueprints and cosmetics)
  Sim.ownsUnlock = function (s, u) {
    if (u.kind === 'room') return !!s.blueprints[u.id];
    if (u.kind === 'decor') return !!s.owned.decor[u.id];
    if (u.kind === 'paint') return !!s.owned.paint[u.id];
    if (u.kind === 'hull') return !!s.owned.hull[u.id];
    return false;
  };
  Sim.grantUnlock = function (s, u) {
    if (u.kind === 'room') s.blueprints[u.id] = true;
    else if (u.kind === 'decor') s.owned.decor[u.id] = true;
    else if (u.kind === 'paint') s.owned.paint[u.id] = true;
    else if (u.kind === 'hull') s.owned.hull[u.id] = true;
    Sim.emit('unlock', { u: u });
  };
  Sim.buyUnlock = function (s, u) {
    if (Sim.ownsUnlock(s, u)) return false;
    if (!Sim.pay(s, u.cost)) return false;
    Sim.grantUnlock(s, u);
    return true;
  };

  Sim.researchAvailable = function (s, id) {
    var lab = Sim.level(s, 'lab');
    return D.RESEARCH[id].tier <= lab && !s.research[id];
  };
  Sim.doResearch = function (s, id) {
    if (!Sim.researchAvailable(s, id)) return false;
    if (!Sim.pay(s, D.RESEARCH[id].cost)) return false;
    s.research[id] = true;
    Sim.emit('research', { id: id });
    Sim.addXp(s, D.XP.research * D.RESEARCH[id].tier, 'research');
    return true;
  };

  Sim.buyChassis = function (s, id) {
    var def = D.CHASSIS[id];
    if (!def || s.owned.chassis[id]) return false;
    if (Sim.level(s, 'hangar') < def.lvl) return false;
    if (!Sim.pay(s, D.CHASSIS_COST[id])) return false;
    s.owned.chassis[id] = true;
    Sim.emit('chassis', { id: id });
    return true;
  };

  Sim.travel = function (s, sector) {
    if (sector > s.revealed || sector === s.sector) return false;
    s.sector = sector;
    s.seen.sectors[sector] = true;
    Sim.emit('travel', { sector: sector });
    return true;
  };

  Sim.visit = function (s, planet) {
    var first = !s.visited[planet];
    s.visited[planet] = (s.visited[planet] || 0) + 1;
    Sim.emit('visit', { planet: planet, first: first });
  };

  // results of a drone run land here
  Sim.applyRun = function (s, haul, info) {
    var total = 0;
    for (var k in haul) {
      total += haul[k];
      s.stats.mined[k] = (s.stats.mined[k] || 0) + haul[k];
    }
    Sim.give(s, haul, 'run');
    s.stats.runs++;
    s.stats.totalOre += total;
    s.stats.bestHaul = Math.max(s.stats.bestHaul, total);
    if (info && info.hits === 0 && total > 0) s.stats.perfectRuns++;
    if (info) { s.stats.hits += info.hits || 0; s.stats.cells += info.cells || 0; }
    Sim.emit('run', { haul: haul, total: total, info: info || {} });
    // XP: one per ore delivered, plus a little for a clean run
    Sim.addXp(s, total + (info && info.hits === 0 && total > 0 ? D.XP.perfect : 0), 'run');
    return total;
  };

  // ------------------------------------------------------------------ pilot rank
  Sim.xpNeed = function (s) { return D.xpForRank(s.rank || 1); };
  // what a rank-up pays: a bundle of the current sector's ores scaled to the drone, plus extras
  Sim.rankReward = function (s, rank) {
    var st = Sim.droneStats(s);
    var amt = Math.max(8, Math.round(st.cargo * 0.35));
    var ores = Object.keys(D.sector(s.sector).ores).filter(function (k) { return k !== 'dust'; });
    var rw = {};
    rw[ores[rank % ores.length]] = amt;
    if (ores.length > 1) rw[ores[(rank + 1) % ores.length]] = Math.round(amt * 0.4);
    if (rank % 5 === 0) rw.dust = 1 + Math.floor(rank / 15);
    if (rank % 4 === 0 && Sim.findSlot(s, 'refinery') >= 0) rw.alloy = Math.round(amt * 0.3);
    if (rank % 5 === 0 && Sim.findSlot(s, 'hydroponics') >= 0) rw.food = Math.round(amt * 0.6);
    return rw;
  };
  Sim.addXp = function (s, n, why) {
    n = Math.max(0, Math.round(n || 0));
    if (!n) return 0;
    if (!s.rank) s.rank = 1;
    s.xp = (s.xp || 0) + n;
    s.stats.xpTotal = (s.stats.xpTotal || 0) + n;
    var ups = 0;
    while (s.xp >= Sim.xpNeed(s) && ups < 20) {
      s.xp -= Sim.xpNeed(s);
      s.rank++;
      ups++;
      var rw = Sim.rankReward(s, s.rank);
      Sim.give(s, rw, 'rank');
      var cos = D.RANK_REWARDS[s.rank];
      if (cos && Sim.ownsUnlock(s, cos)) cos = null;
      if (cos) Sim.grantUnlock(s, cos);
      Sim.emit('rank', { rank: s.rank, reward: rw, cosmetic: cos });
    }
    Sim.emit('xp', { n: n, why: why });
    return n;
  };

  // completion: all sectors visited, all rooms at max
  Sim.completion = function (s) {
    var parts = 0, max = 0;
    D.ROOM_ORDER.forEach(function (t) { max += D.MAX_ROOM_LVL; parts += Sim.level(s, t); });
    var sec = 0;
    for (var i = 1; i <= D.SECTORS.length; i++) if (s.seen.sectors[i]) sec++;
    return { rooms: parts / max, sectors: sec / D.SECTORS.length };
  };

  DH.Sim = Sim;
})(typeof window !== 'undefined' ? (window.DH = window.DH || {}) : (global.DH = global.DH || {}));
