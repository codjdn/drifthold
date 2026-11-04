// DRIFTHOLD - progression.js
// Pacing glue: the step-by-step tutorial (one new system at a time), up to three rotating
// goals, the daily anomaly, logbook bookkeeping and the toasts that celebrate progress.
(function (DH) {
  'use strict';
  var R = DH.R, F = DH.Font, In = DH.In, UI = DH.UI, U = DH.U, D = DH.D, Sim = DH.Sim, Spr = DH.Spr;
  var Prog = { tipT: 0 };
  function S() { return DH.G.state; }

  // ================================================================== tutorial
  function barRect(id) { return DH.G.barRects[id] || null; }
  function slotRect(type) {
    var s = S(), i = typeof type === 'number' ? type : Sim.findSlot(s, type);
    return i >= 0 && DH.ShipView ? DH.ShipView.slotRect(i) : null;
  }
  function firstEmpty() { var i = Sim.freeSlotIndex(S()); return i >= 0 ? slotRect(i) : null; }

  // Each step: when(s) -> should it show now, done(s) -> finished, scene, target(), text, block (tap to dismiss)
  var STEPS = [
    { id: 'welcome', scene: 'ship', when: function (s) { return s.stats.runs === 0; }, done: function (s) { return s.stats.runs > 0; },
      target: function () { return barRect('launch'); }, text: 'WELCOME ABOARD, CAPTAIN! THE HOLD IS EMPTY. TAP LAUNCH TO SEND OUT THE MINING DRONE.' },
    { id: 'build1', scene: 'ship', when: function (s) { return s.stats.runs > 0 && Sim.builtCount(s) < 2; }, done: function (s) { return Sim.builtCount(s) >= 2; },
      target: function () { return Sim.canAfford(S(), Sim.buildCost('quarters')) ? firstEmpty() : barRect('launch'); },
      text: function () { return Sim.canAfford(S(), Sim.buildCost('quarters')) ? 'NICE HAUL! TAP THE EMPTY SLOT TO BUILD YOUR FIRST ROOM.' : 'QUARTERS NEED 8 COPPER AND 4 ICE. LAUNCH AGAIN FOR A LITTLE MORE ORE!'; } },
    { id: 'map', scene: 'ship', when: function (s) { return Sim.level(s, 'quarters') > 0 && s.crew.length === 0; }, done: function (s) { return s.crew.length > 0; },
      onShow: function () { DH.G.unlockBar('map'); },
      target: function () { return barRect('map'); }, text: 'COZY BUNKS! FOLKS ON A NEARBY PLANET ARE LOOKING FOR WORK. OPEN THE MAP.' },
    { id: 'visit', scene: 'map', when: function (s) { return s.crew.length === 0; }, done: function (s) { return s.crew.length > 0; },
      target: function () { return DH.Scenes.map.planetRect ? DH.Scenes.map.planetRect('kettle') : null; }, text: 'TAP KETTLE TO VISIT, THEN RECRUIT YOUR FIRST CREW MEMBER.' },
    { id: 'goals', scene: 'ship', block: true, when: function (s) { return s.crew.length > 0; }, done: function () { return false; },
      onShow: function () { S().unlocked.goals = true; Prog.ensureGoals(S()); },
      text: 'YOUR FIRST CREW MEMBER! THEY LIVE ABOARD NOW. GOALS (TOP LEFT) WILL GUIDE YOU - EACH ONE PAYS A REWARD.' },
    { id: 'expand', scene: 'ship', when: function (s) { return Sim.canExpand(s) && Sim.freeSlotIndex(s) < 0 && s.hull < 4; }, done: function (s) { return s.hull >= 3; },
      target: function () { return DH.ShipView.ghostRect(); }, text: 'THE BRIDGE CAN HANDLE A BIGGER HULL NOW. TAP THE DOTTED OUTLINE TO EXPAND.' },
    { id: 'workshop', scene: 'ship', when: function (s) { return Sim.level(s, 'workshop') > 0 && s.stats.partsBuilt === 0 && !s.job; }, done: function (s) { return s.stats.partsBuilt > 0 || !!s.job; },
      target: function () { return slotRect('workshop'); }, text: 'THE WORKSHOP BUILDS DRONE PARTS. TAP IT TO UPGRADE YOUR DRONE!' },
    { id: 'assign', scene: 'ship', when: function (s) { return s.crew.length > 0 && Sim.builtCount(s) >= 3 && s.crew.every(function (c) { return c.room === null || c.room === undefined; }); },
      done: function (s) { return s.crew.some(function (c) { return c.room !== null && c.room !== undefined; }); },
      target: function () { return slotRect('workshop') || slotRect('hydroponics'); }, text: 'PUT YOUR CREW TO WORK: TAP A ROOM, THEN ITS CREW TAB. MATCHING TRAITS WORK EXTRA HARD.' },
    { id: 'log', scene: 'ship', when: function (s) { return s.stats.partsBuilt > 0; }, done: function (s) { return !!s.tut.done.logOpened; },
      onShow: function () { DH.G.unlockBar('log'); },
      target: function () { return barRect('log'); }, text: 'NEW: THE LOGBOOK! IT TRACKS EVERY ORE, CREW TRAIT, PLANET AND TRINKET YOU FIND.' },
    { id: 'food', scene: 'ship', block: true, when: function (s) { return Sim.level(s, 'hydroponics') > 0; }, done: function () { return false; },
      text: 'HYDROPONICS GROWS FOOD, EVEN WHILE YOU ARE AWAY. FOOD PAYS FOR NEW RECRUITS ON PLANETS.' },
    { id: 'daily', scene: 'ship', when: function (s) { return Sim.level(s, 'hydroponics') > 0 && s.stats.runs >= 4; }, done: function (s) { return !!s.tut.done.dailySeen || s.daily.count > 0; },
      onShow: function () { S().unlocked.daily = true; },
      target: function () { return barRect('launch'); }, text: 'A DAILY ANOMALY APPEARED! ONE SPECIAL RUN A DAY WITH A BONUS. SKIPPING DAYS COSTS NOTHING.' },
    { id: 'refinery', scene: 'ship', block: true, when: function (s) { return Sim.level(s, 'refinery') > 0; }, done: function () { return false; },
      text: 'THE REFINERY SLOWLY SMELTS COPPER INTO ALLOY. KEEP SOME COPPER IN THE HOLD AND IT WILL KEEP WORKING.' },
    { id: 'travel', scene: 'ship', when: function (s) { return s.revealed >= 2 && s.sector === 1; }, done: function (s) { return !!s.tut.done.traveled; },
      target: function () { return barRect('map'); }, text: 'THE OBSERVATORY CHARTED A NEW SECTOR! OPEN THE MAP TO DRIFT THERE. NEW ORES AWAIT.' },
    { id: 'lab', scene: 'ship', block: true, when: function (s) { return Sim.level(s, 'lab') > 0; }, done: function () { return false; },
      text: 'THE LAB MAKES DATA. SPEND IT ON RESEARCH IN THE LAB PANEL FOR CLEVER DRONE PERKS.' }
  ];

  function stepDone(s, st) { return s.tut.done[st.id] || st.done(s); }

  // the one tip that should be showing right now (or null)
  Prog.currentTip = function () {
    var s = S();
    if (!s || !s.tut) return null;
    for (var i = 0; i < STEPS.length; i++) {
      var st = STEPS[i];
      if (s.tut.done[st.id]) continue;
      if (st.done(s)) {
        // make sure whatever this step unlocks is unlocked even if its tip never got shown
        s.tut.done[st.id] = true;
        if (st.onShow && st.when(s)) st.onShow();
        DH.G.markDirty();
        continue;
      }
      if (!st.when(s)) continue;
      if (st.scene !== DH.G.sceneName) continue;
      return st;
    }
    return null;
  };
  Prog.blocking = function () {
    if (!S() || DH.G.panel || DH.G.sceneName === 'title' || DH.G.trans) return false;
    var tip = Prog.currentTip();
    return !!(tip && tip.block);
  };

  Prog.drawOverlay = function (dt) {
    var s = S();
    Prog.checkGoals(s, dt);
    if (DH.G.trans) return;
    var tip = Prog.currentTip();
    if (!tip) { Prog.lastTip = null; return; }
    if (Prog.lastTip !== tip.id) {
      Prog.lastTip = tip.id; Prog.tipT = 0;
      if (tip.onShow) tip.onShow();
      if (tip.block) DH.Snd.play('toast');
    }
    Prog.tipT += dt;
    if (Prog.tipT < 0.35) return;
    var text = typeof tip.text === 'function' ? tip.text() : tip.text;
    if (tip.block) {
      if (DH.G.panel) return;
      R.dim();
      UI.tooltip(text, null, { footer: 'TAP TO CONTINUE', maxW: 220 });
      if (Prog.tipT > 0.8 && (In.released || In.key('Enter', ' ', 'Escape'))) {
        s.tut.done[tip.id] = true;
        DH.G.markDirty();
        In.consume();
        DH.Snd.play('click');
      }
      return;
    }
    if (DH.G.panel) return;
    var target = tip.target ? tip.target() : null;
    UI.tooltip(text, target, { maxW: 210 });
  };

  Prog.onPanel = function (kind) {
    var s = S();
    if (!s) return;
    if (kind === 'log') s.tut.done.logOpened = true;
    if (kind === 'launch') s.tut.done.dailySeen = true;
  };

  // ================================================================== goals
  function goalText(g) {
    switch (g.type) {
      case 'mine': return 'MINE ' + g.n + ' ' + D.ORES[g.key].name;
      case 'runs': return 'COMPLETE ' + g.n + ' RUNS';
      case 'haul': return 'BRING HOME ' + g.n + ' ORE IN ONE RUN';
      case 'upgrade': return 'UPGRADE ' + D.ROOMS[g.key].short + ' TO LV' + g.n;
      case 'build': return 'BUILD THE ' + D.ROOMS[g.key].short;
      case 'blueprint': return 'GET ' + D.ROOMS[g.key].short + ' PLANS AT ' + D.PLANETS[g.where].name;
      case 'part': return 'BUILD ' + D.PARTS[g.key].name + ' LV' + g.n;
      case 'recruit': return 'HAVE ' + g.n + ' CREW ABOARD';
      case 'visit': return 'VISIT ' + D.PLANETS[g.key].name;
      case 'travel': return 'DRIFT TO ' + D.sector(g.n).name;
      case 'cells': return 'GRAB ' + g.n + ' FUEL CELLS';
      case 'perfect': return 'FINISH A RUN WITHOUT A BUMP';
      case 'produce': return 'PRODUCE ' + g.n + ' ' + D.resName(g.key);
      case 'research': return 'RESEARCH ' + D.RESEARCH[g.key].name;
      case 'trade': return 'MAKE A TRADE ON A PLANET';
      case 'daily': return 'COMPLETE A DAILY ANOMALY';
      case 'assign': return 'ASSIGN CREW TO THE ' + D.ROOMS[g.key].short;
    }
    return '?';
  }
  Prog.goalText = goalText;

  function counter(s, g) {
    switch (g.type) {
      case 'mine': return s.stats.mined[g.key] || 0;
      case 'runs': return s.stats.runs;
      case 'cells': return s.stats.cells;
      case 'perfect': return s.stats.perfectRuns;
      case 'produce': return Math.floor(s.stats.produced[g.key] || 0);
      case 'trade': return s.stats.trades;
      case 'daily': return s.stats.dailyDone;
    }
    return 0;
  }
  // progress as [have, need]
  Prog.goalProgress = function (s, g) {
    switch (g.type) {
      case 'mine': case 'runs': case 'cells': case 'perfect': case 'produce': case 'trade': case 'daily':
        return [Math.min(g.n, counter(s, g) - g.base), g.n];
      case 'haul': return [Math.min(g.n, g.best || 0), g.n];
      case 'upgrade': return [Math.min(g.n, Sim.level(s, g.key)), g.n];
      case 'build': return [Sim.findSlot(s, g.key) >= 0 ? 1 : 0, 1];
      case 'blueprint': return [s.blueprints[g.key] ? 1 : 0, 1];
      case 'part': return [Math.min(g.n, s.parts[g.key]), g.n];
      case 'recruit': return [Math.min(g.n, s.crew.length), g.n];
      case 'visit': return [s.visited[g.key] ? 1 : 0, 1];
      case 'travel': return [s.seen.sectors[g.n] && s.sector === g.n ? 1 : 0, 1];
      case 'research': return [s.research[g.key] ? 1 : 0, 1];
      case 'assign': return [Sim.crewInType(s, g.key).length > 0 ? 1 : 0, 1];
    }
    return [0, 1];
  };

  function sectorOres(s) {
    var ores = [];
    for (var id = 1; id <= s.revealed; id++) for (var k in D.sector(id).ores) if (k !== 'dust' && ores.indexOf(k) < 0) ores.push(k);
    return ores;
  }

  function rewardFor(s, g) {
    var st = Sim.droneStats(s);
    var amt = Math.max(6, Math.round(st.cargo * 0.4));
    var sec = D.sector(s.sector);
    var ores = Object.keys(sec.ores).filter(function (k) { return k !== 'dust'; });
    var k = ores[(s.goalSerial * 7) % ores.length];
    var rw = {};
    rw[k] = amt;
    if (s.goalSerial % 3 === 2 && Sim.findSlot(s, 'hydroponics') >= 0) rw.food = Math.round(amt * 0.8);
    if (s.goalSerial % 5 === 4 && s.res.alloy !== undefined && Sim.findSlot(s, 'refinery') >= 0) rw.alloy = Math.round(amt * 0.3);
    if (s.goalSerial % 4 === 3) rw.dust = 1;
    return rw;
  }

  function candidates(s) {
    var out = [];
    var active = s.goals.map(function (g) { return g.type + ':' + (g.key || g.n); });
    function add(g, w) { if (active.indexOf(g.type + ':' + (g.key || g.n)) < 0) { g.w = w; out.push(g); } }
    var free = Sim.freeSlotIndex(s) >= 0 || Sim.canExpand(s);
    Sim.buildable(s).forEach(function (t) { if (free) add({ type: 'build', key: t }, 5); });
    D.PLANET_ORDER.forEach(function (pid) {
      var p = D.PLANETS[pid];
      if (p.sector > s.revealed) return;
      p.unlocks.forEach(function (u) { if (u.kind === 'room' && !s.blueprints[u.id]) add({ type: 'blueprint', key: u.id, where: pid }, 5); });
      if (!s.visited[pid]) add({ type: 'visit', key: pid }, 3);
    });
    for (var sec = 2; sec <= s.revealed; sec++) if (!s.seen.sectors[sec] || s.sector !== sec && !s.tut.done['went' + sec]) add({ type: 'travel', n: sec }, s.seen.sectors[sec] ? 0 : 4);
    s.slots.forEach(function (r) {
      if (!r || r.lvl >= D.MAX_ROOM_LVL) return;
      var cost = D.ROOMS[r.type].cost[r.lvl];
      // only suggest upgrades whose ores you can actually find already
      var ok = Object.keys(cost).every(function (k) { return !D.ORES[k] || sectorOres(s).indexOf(k) >= 0 || k === 'dust'; });
      if (ok) add({ type: 'upgrade', key: r.type, n: r.lvl + 1 }, r.type === 'bridge' || r.type === 'observatory' ? 4 : 2);
    });
    if (Sim.partCap(s) > 0) D.PART_ORDER.forEach(function (p) { if (s.parts[p] < Sim.partCap(s)) add({ type: 'part', key: p, n: s.parts[p] + 1 }, 2); });
    if (Sim.bedCount(s) > s.crew.length || Sim.level(s, 'quarters') < 5) add({ type: 'recruit', n: s.crew.length + 1 }, 2);
    var st = Sim.droneStats(s);
    var ores = Object.keys(D.sector(s.sector).ores).filter(function (k) { return k !== 'dust'; });
    var ore = ores[s.goalSerial % ores.length];
    add({ type: 'mine', key: ore, n: Math.max(10, Math.round(st.cargo * 1.2 * D.sector(s.sector).ores[ore] / 60 / 5) * 5) }, 3);
    add({ type: 'runs', n: 2 + (s.goalSerial % 2) }, 1);
    add({ type: 'haul', n: Math.max(15, Math.round(st.cargo * 0.85)) }, 1.5);
    add({ type: 'cells', n: 3 }, 1);
    if (s.stats.runs > 3) add({ type: 'perfect', n: 1 }, 1);
    ['hydroponics', 'refinery', 'lab'].forEach(function (t) {
      var i = Sim.findSlot(s, t);
      if (i < 0) return;
      var mk = D.ROOMS[t].makes;
      add({ type: 'produce', key: mk, n: Math.max(10, Math.round(Sim.roomRate(s, i) * 8 / 5) * 5) }, 1);
      if (s.crew.length && Sim.crewIn(s, i).length === 0) add({ type: 'assign', key: t }, 1.5);
    });
    if (Sim.level(s, 'lab') > 0) D.RESEARCH_ORDER.forEach(function (id) { if (Sim.researchAvailable(s, id)) add({ type: 'research', key: id }, 1.5); });
    if (Object.keys(s.visited).length) add({ type: 'trade', n: 1 }, 0.7);
    if (s.unlocked.daily && Prog.dailyAvailable(s)) add({ type: 'daily', n: 1 }, 1.2);
    return out.filter(function (g) { var pr = Prog.goalProgress(s, Object.assign({ base: counter(s, g) }, g)); return pr[0] < pr[1]; });
  }

  Prog.makeGoal = function (s) {
    var g;
    // the first three goals walk you through the early game
    var FIRST = [{ type: 'upgrade', key: 'bridge', n: 2 }, { type: 'blueprint', key: 'workshop', where: 'kettle' }, { type: 'mine', key: 'cu', n: 30 }];
    if (s.goalSerial < 3) {
      g = FIRST[s.goalSerial];
      var pr0 = Prog.goalProgress(s, Object.assign({ base: 0 }, g));
      if (pr0[0] >= pr0[1] || s.goals.some(function (x) { return x.type === g.type && x.key === g.key; })) g = null;
    }
    if (!g) {
      var c = candidates(s);
      if (!c.length) return null;
      var pool = {};
      c.forEach(function (x, i) { pool[i] = x.w; });
      g = c[+U.weighted(pool)];
    }
    g = Object.assign({}, g);
    delete g.w;
    g.id = 'g' + (++s.goalSerial);
    g.base = counter(s, g);
    g.reward = rewardFor(s, g);
    if ((s.goalsDone + 1) % 4 === 0) {
      var cos = D.GOAL_COSMETICS.filter(function (u) { return !Sim.ownsUnlock(s, u); })[0];
      if (cos) g.cosmetic = cos;
    }
    return g;
  };

  Prog.ensureGoals = function (s) {
    if (!s.unlocked.goals) return;
    var guard = 0;
    while (s.goals.filter(function (g) { return !g.done; }).length < 3 && guard++ < 6) {
      var g = Prog.makeGoal(s);
      if (!g) break;
      s.goals.push(g);
    }
  };

  Prog.checkGoals = function (s, dt) {
    if (!s) return;
    if (s.crew.length && !s.unlocked.map) DH.G.unlockBar('map');
    if (s.crew.length && !s.unlocked.goals && s.tut.done.goals) s.unlocked.goals = true;
    if (s.stats.partsBuilt > 0 && !s.unlocked.log && s.tut.done.log) DH.G.unlockBar('log');
    if (!s.unlocked.goals) return;
    var changed = false;
    s.goals.forEach(function (g) {
      if (g.done) { g.doneT += dt; return; }
      var pr = Prog.goalProgress(s, g);
      if (pr[0] >= pr[1]) {
        g.done = true; g.doneT = 0;
        s.goalsDone++;
        Sim.give(s, g.reward, 'goal');
        var parts = Object.keys(g.reward).map(function (k) { return '+' + g.reward[k] + ' ' + D.resName(k); });
        if (g.cosmetic) { Sim.grantUnlock(s, g.cosmetic); parts.push(cosmeticName(g.cosmetic)); }
        UI.toast('GOAL DONE! ' + parts.slice(0, 2).join(' '), 'check', 11);
        DH.Snd.play('goal');
        changed = true;
      }
    });
    var before = s.goals.length;
    s.goals = s.goals.filter(function (g) { return !g.done || g.doneT < 2.2; });
    if (s.goals.length !== before) changed = true;
    if (changed || (s.goals.length < 3 && Math.random() < 0.05)) { Prog.ensureGoals(s); DH.G.markDirty(); }
  };

  function cosmeticName(u) {
    if (u.kind === 'decor') return D.DECOR[u.id].name;
    if (u.kind === 'paint') return D.PAINTS[u.id].name + ' PAINT';
    if (u.kind === 'hull') return D.HULLS[u.id].name + ' HULL';
    if (u.kind === 'room') return D.ROOMS[u.id].name + ' PLANS';
    return u.id;
  }
  Prog.cosmeticName = cosmeticName;

  // draws the goal list on the ship screen; returns the bottom y
  Prog.drawGoals = function (x, y) {
    var s = S();
    if (!s.unlocked.goals) return y;
    var maxW = R.W - 60;
    s.goals.slice(0, 3).forEach(function (g) {
      var pr = Prog.goalProgress(s, g);
      var txt = goalText(g);
      var prog = pr[1] > 1 ? ' ' + U.fmt(pr[0]) + '/' + U.fmt(pr[1]) : '';
      while (F.measure(txt + prog, 'small') > maxW - 10 && txt.length > 6) txt = txt.slice(0, -2) + '…';
      var w = F.measure(txt + prog, 'small') + 12;
      var flash = g.done && Math.floor(g.doneT * 6) % 2;
      R.rect(x - 1, y - 1, w + 2, 8, flash ? 3 : 0);
      R.rect(x + 1, y, 5, 5, g.done ? 11 : 1);
      R.frame(x + 1, y, 5, 5, g.done ? 11 : 13);
      if (g.done) R.img(Spr.icon('check'), x, y - 2);
      F.draw(R.ctx, txt, x + 9, y, g.done ? 11 : 7, { font: 'small' });
      if (prog) F.draw(R.ctx, prog, x + 9 + F.measure(txt, 'small'), y, g.done ? 11 : 10, { font: 'small' });
      if (g.cosmetic && !g.done) R.img(Spr.icon('star'), x + w, y - 1);
      y += 8;
    });
    return y;
  };

  // ================================================================== daily anomaly
  Prog.todayAnomaly = function () {
    var n = U.dayNumber();
    return D.ANOMALIES[(n * 5 + 3) % D.ANOMALIES.length];
  };
  Prog.dailyAvailable = function (s) { return !!s.unlocked.daily && s.daily.last !== U.dayKey(); };
  Prog.completeDaily = function (s) {
    s.daily.last = U.dayKey();
    s.daily.count++;
    s.stats.dailyDone++;
    var m = D.ANOMALY_MILESTONES[s.daily.count];
    if (m && !Sim.ownsUnlock(s, m)) { Sim.grantUnlock(s, m); return 'ANOMALY REWARD: ' + cosmeticName(m); }
    return 'DAILY ANOMALY #' + s.daily.count + ' DONE';
  };

  // ================================================================== logbook helpers
  Prog.logStats = function (s) {
    var found = 0, total = 0;
    D.ORE_ORDER.forEach(function (o) { total++; if (s.seen.ores[o]) found++; });
    D.TRAIT_KEYS.forEach(function (t) { total++; if (s.seen.traits[t]) found++; });
    D.PLANET_ORDER.forEach(function (p) { total++; if (s.visited[p]) found++; });
    D.SECTORS.forEach(function (sec) { total++; if (s.seen.sectors[sec.id]) found++; });
    D.DECOR_ORDER.forEach(function (d) { total++; if (s.owned.decor[d]) found++; });
    D.PAINT_ORDER.forEach(function (d) { total++; if (s.owned.paint[d]) found++; });
    D.HULL_ORDER.forEach(function (d) { total++; if (s.owned.hull[d]) found++; });
    D.CHASSIS_ORDER.forEach(function (d) { total++; if (s.owned.chassis[d]) found++; });
    return { found: found, total: total };
  };

  // ================================================================== events
  Prog.afterRun = function (info) {
    var s = S();
    Prog.ensureGoals(s);
    s.goals.forEach(function (g) { if (g.type === 'haul' && !g.done) g.best = Math.max(g.best || 0, info.total || 0); });
  };

  Prog.init = function () {
    Sim.on(function (type, d) {
      var s = S();
      if (!s) return;
      if (type === 'part') { UI.toast(D.PARTS[d.part].name + ' LV' + d.lvl + ' READY!', D.PARTS[d.part].icon, 11); DH.Snd.play('upgrade'); }
      else if (type === 'reveal') { UI.toast('NEW SECTOR: ' + D.sector(d.sector).name, 'sector', 10); DH.G.unlockBar('map'); }
      else if (type === 'unlock') { UI.toast('GOT: ' + cosmeticName(d.u), d.u.kind === 'room' ? 'room' : 'star', 10); DH.Snd.play('upgrade'); }
      else if (type === 'recruit') { DH.Snd.play('recruit'); UI.toast(d.crew.name + ' JOINED THE CREW!', 'crew', 11); }
      else if (type === 'build') { DH.Snd.play('build'); }
      else if (type === 'travel') { s.tut.done.traveled = true; s.tut.done['went' + d.sector] = true; }
      else if (type === 'run') {
        s.goals.forEach(function (g) { if (g.type === 'haul' && !g.done) g.best = Math.max(g.best || 0, d.total); });
      }
    });
  };

  DH.Prog = Prog;
})(window.DH);
