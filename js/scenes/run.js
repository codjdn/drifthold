// DRIFTHOLD - scenes/run.js
// THE DRONE RUN: a fast 60-90 second skill loop. Steer, drill ore, dodge rocks and sector
// hazards, grab pickups, come home. It never fails: broken shields just mean an early return.
(function (DH) {
  'use strict';
  var R = DH.R, F = DH.Font, In = DH.In, UI = DH.UI, U = DH.U, D = DH.D, Sim = DH.Sim, Spr = DH.Spr, Snd = DH.Snd;
  var Run = { showBar: false };
  var S = null; // run state
  var stars = null;

  var SIZES = [{ r: 5, amt: 2 }, { r: 8, amt: 4 }, { r: 11, amt: 7 }];
  var DRONE_R = 4;

  function rnd(a, b) { return a + Math.random() * (b - a); }

  // ------------------------------------------------------------------ setup
  Run.enter = function (params) {
    var g = DH.G, s = g.state;
    var sector = D.sector(s.sector);
    var st = Sim.droneStats(s);
    var anomaly = params.anomaly || null;
    if (!stars) stars = Spr.makeStarfield(11, 320);
    var W = D.RUN.worldW, H = D.RUN.worldH;
    S = {
      s: s, sector: sector, st: st, anomaly: anomaly, aid: anomaly ? anomaly.id : null,
      w: W, h: H, cam: { x: W / 2 - R.W / 2, y: H / 2 - R.H / 2 },
      home: { x: W / 2, y: H / 2 },
      drone: {
        x: W / 2 + 10, y: H / 2 + 2, vx: 0, vy: 0, ang: 0, thrust: 0,
        shields: st.shields, maxShields: st.shields, inv: 0, regen: 0,
        fuel: st.fuel, maxFuel: st.fuel, cargo: {}, n: 0, cap: st.cargo,
        magnet: 0, drillBoost: 0, contact: null, flash: 0
      },
      ast: [], chunks: [], pickups: [], parts: [], floats: [], hazards: [], warns: [], wells: [], whales: [],
      phase: 'launch', pt: 0, t: 0, hits: 0, cells: 0, endReason: null, fullT: 0,
      joy: null, hazardT: 5, storm: null, lowBeep: 0, firstRun: s.stats.runs === 0,
      hint: 0, newOres: [], tally: null, mined: 0
    };
    if (S.aid === 'glass') { S.drone.shields = S.drone.maxShields = 1; }
    if (S.aid === 'magstorm') S.drone.magnet = 9999;
    S.neb = Spr.makeNebula(256, 256, 30 + sector.id, sector.neb, sector.neb2);
    // populate the field
    var n = D.RUN.asteroidCount;
    if (S.aid === 'giants') n = Math.round(n * 0.8);
    for (var i = 0; i < n; i++) spawnAsteroid(false);
    if (S.firstRun) {
      // a friendly cluster of copper & ice right by the ship for the very first run
      for (var j = 0; j < 7; j++) {
        var a = makeAsteroid(j % 3 === 2 ? 'ice' : 'cu', 'ore', j % 2 ? 1 : 0);
        var ang = j / 7 * Math.PI * 2 + 0.4, dd = 60 + (j % 3) * 22;
        a.x = S.home.x + Math.cos(ang) * dd; a.y = S.home.y + Math.sin(ang) * dd;
        a.vx *= 0.3; a.vy *= 0.3;
        S.ast.push(a);
      }
    }
    // power-ups scattered around
    var cells = S.aid === 'frenzy' ? 9 : 2;
    for (i = 0; i < cells; i++) spawnPickup('fuel');
    spawnPickup('magnet'); spawnPickup('drill');
    if (Math.random() < 0.5) spawnPickup('shieldcell');
    // sector hazards
    if (sector.hazard === 'wells') {
      for (i = 0; i < 3; i++) {
        var p = farPoint(140);
        S.wells.push({ x: p.x, y: p.y, r: 7, pull: 90, spin: Math.random() * 6 });
      }
    }
    if (sector.hazard === 'whales') { spawnWhale(true); spawnWhale(true); }
    Snd.setMusic('run');
    Snd.play('launch');
    Run.resize();
  };
  Run.exit = function () { Snd.thrust(0); };
  Run.resize = function () { };

  function farPoint(minHome) {
    for (var k = 0; k < 50; k++) {
      var x = rnd(30, S.w - 30), y = rnd(30, S.h - 30);
      if (U.dist(x, y, S.home.x, S.home.y) > minHome) return { x: x, y: y };
    }
    return { x: 40, y: 40 };
  }

  function pickOre() {
    if (S.aid === 'goldrush') return 'gold';
    var w = {};
    for (var k in S.sector.ores) w[k] = S.sector.ores[k];
    if (S.st.lens && w.dust) w.dust *= 2;
    if (S.aid === 'stardust') w.dust = 40;
    return U.weighted(w);
  }

  function makeAsteroid(ore, kind, sizeIdx) {
    var sz = SIZES[sizeIdx];
    var r = sz.r + (Math.random() < 0.5 ? 0 : 1);
    var amt = sz.amt;
    if (S.aid === 'giants') { amt = Math.round(amt * 1.6); }
    var huge = false;
    if (kind === 'ore' && S.st.motherlode && Math.random() < 0.06) { r = 15; amt = 14; huge = true; }
    var sp = kind === 'rock' ? rnd(5, 16) : rnd(3, 11);
    var ang = Math.random() * Math.PI * 2;
    var cols = kind === 'rock' ? S.sector.rock : S.sector.orebody;
    if (ore === 'dust' && kind === 'ore') cols = [0, 1, 13];
    return {
      x: 0, y: 0, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
      r: r, rot: Math.random() * 6.28, vr: rnd(-1, 1) * (kind === 'rock' ? 1.2 : 0.6),
      kind: kind, ore: ore, amt: amt, max: amt, drill: 0, seed: sizeIdx * 10 + Math.floor(Math.random() * 6) + (huge ? 100 : 0),
      cols: cols, wrap: true, flash: 0, wob: 0
    };
  }

  function spawnAsteroid(offscreen) {
    var kind = Math.random() < (S.sector.oreRate) ? 'ore' : 'rock';
    var sizeIdx = U.weighted({ 0: 4, 1: 4, 2: 2 });
    if (S.aid === 'giants') sizeIdx = U.weighted({ 1: 2, 2: 5 });
    var a = makeAsteroid(kind === 'ore' ? pickOre() : null, kind, +sizeIdx);
    for (var k = 0; k < 60; k++) {
      a.x = rnd(0, S.w); a.y = rnd(0, S.h);
      if (U.dist(a.x, a.y, S.home.x, S.home.y) < 70) continue;
      if (offscreen && a.x > S.cam.x - 30 && a.x < S.cam.x + R.W + 30 && a.y > S.cam.y - 30 && a.y < S.cam.y + R.H + 30) continue;
      break;
    }
    S.ast.push(a);
    return a;
  }

  function spawnPickup(type, x, y) {
    var p = x === undefined ? farPoint(60) : { x: x, y: y };
    S.pickups.push({ x: p.x, y: p.y, type: type, t: Math.random() * 6, life: x === undefined ? 9999 : 14 });
  }

  function spawnWhale(initial) {
    var dir = Math.random() < 0.5 ? 1 : -1;
    var y = rnd(60, S.h - 60);
    var x = initial ? rnd(60, S.w - 60) : (dir > 0 ? -60 : S.w + 60);
    if (initial && U.dist(x, y, S.home.x, S.home.y) < 120) y = (y + S.h / 2) % S.h;
    S.whales.push({ x: x, y: y, dir: dir, ph: Math.random() * 6, drop: 3, sang: 0 });
  }

  // ------------------------------------------------------------------ effects
  function burst(x, y, n, cols, speed, life) {
    for (var i = 0; i < n; i++) {
      if (S.parts.length > 420) S.parts.shift();
      var a = Math.random() * Math.PI * 2, sp = rnd(speed * 0.3, speed);
      S.parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rnd(life * 0.5, life), max: life, col: cols[i % cols.length] });
    }
  }
  function floatText(x, y, txt, col, icon) {
    S.floats.push({ x: x, y: y, txt: txt, col: col, icon: icon, t: 0 });
  }

  // ------------------------------------------------------------------ input -> steering vector
  var RET_BTN = function () { return { x: R.W - 61, y: 12, w: 58, h: 13 }; };
  function steer() {
    var dx = 0, dy = 0, mag = 0;
    if (In.held('a', 'ArrowLeft')) dx -= 1;
    if (In.held('d', 'ArrowRight')) dx += 1;
    if (In.held('w', 'ArrowUp')) dy -= 1;
    if (In.held('s', 'ArrowDown')) dy += 1;
    if (dx || dy) { var l = Math.sqrt(dx * dx + dy * dy); return { x: dx / l, y: dy / l, m: 1 }; }
    var rb = RET_BTN();
    if (In.down && !In.inRect(In.px, In.py, rb.x, rb.y, rb.w, rb.h)) {
      if (In.type === 'mouse') {
        S.joy = null;
        var sx = S.drone.x - S.cam.x, sy = S.drone.y - S.cam.y;
        dx = In.x - sx; dy = In.y - sy;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 3) return { x: 0, y: 0, m: 0 };
        mag = U.clamp(len / 36, 0, 1);
        return { x: dx / len, y: dy / len, m: mag };
      }
      // floating thumb-stick for touch / pen
      if (!S.joy) S.joy = { x: In.px, y: In.py };
      dx = In.x - S.joy.x; dy = In.y - S.joy.y;
      var len2 = Math.sqrt(dx * dx + dy * dy);
      if (len2 > 26) { S.joy.x = In.x - dx / len2 * 26; S.joy.y = In.y - dy / len2 * 26; }
      if (len2 < 2.5) return { x: 0, y: 0, m: 0 };
      return { x: dx / len2, y: dy / len2, m: U.clamp(len2 / 18, 0, 1) };
    }
    S.joy = null;
    return { x: 0, y: 0, m: 0 };
  }

  // ------------------------------------------------------------------ gameplay helpers
  function addCargo(ore, n) {
    var d = S.drone;
    var room = d.cap - d.n;
    var take = Math.min(room, n);
    if (take <= 0) return 0;
    d.cargo[ore] = (d.cargo[ore] || 0) + take;
    d.n += take;
    if (!S.s.seen.ores[ore] && S.newOres.indexOf(ore) < 0) S.newOres.push(ore);
    return take;
  }

  function hitDrone(nx, ny, power) {
    var d = S.drone;
    if (d.inv > 0 || S.phase !== 'play') return;
    d.shields--;
    S.hits++;
    d.inv = 1.3;
    d.flash = 0.25;
    d.vx = nx * power; d.vy = ny * power;
    R.addShake(5);
    Snd.play('hit');
    burst(d.x, d.y, 18, [7, 10, 9, 8], 70, 0.5);
    // spill some cargo as collectable chunks
    if (d.n > 0) {
      var spill = Math.max(1, Math.round(d.n * 0.2 * S.st.spill));
      var keys = Object.keys(d.cargo).filter(function (k) { return d.cargo[k] > 0; });
      var pieces = Math.min(8, spill);
      var per = Math.ceil(spill / pieces);
      for (var i = 0; i < pieces && spill > 0; i++) {
        var ore = keys[i % keys.length];
        var amt = Math.min(per, spill, d.cargo[ore]);
        if (amt <= 0) continue;
        d.cargo[ore] -= amt; d.n -= amt; spill -= amt;
        var a = Math.random() * Math.PI * 2;
        S.chunks.push({ x: d.x, y: d.y, vx: Math.cos(a) * rnd(40, 80), vy: Math.sin(a) * rnd(40, 80), ore: ore, n: amt, t: 0, life: 12, spilled: true, delay: 0.6 });
      }
      Snd.play('spill');
      floatText(d.x, d.y - 8, 'SPILLED!', 8);
    }
    if (d.shields <= 0) endRun('shields');
  }

  function endRun(reason) {
    if (S.phase !== 'play') return;
    S.phase = 'return'; S.pt = 0; S.endReason = reason;
    S.drone.contact = null;
    Snd.play('return');
    Snd.thrust(0);
  }

  function breakAsteroid(a) {
    a.dead = true;
    var oc = a.kind === 'ore' ? D.ORES[a.ore].cols : [6, 5];
    burst(a.x, a.y, 14 + a.r, [a.cols[1], a.cols[2], oc[1], oc[0]], 45 + a.r * 2, 0.7);
    R.addShake(a.r > 9 ? 3 : 1.5);
    Snd.play('crack');
    // sometimes there's a little present inside
    var roll = Math.random();
    var dropChance = S.aid === 'frenzy' ? 0.25 : 0.08;
    if (a.r >= 15 || roll < dropChance) {
      var t = a.r >= 15 ? 'fuel' : U.weighted({ fuel: 50, magnet: 25, drill: 20, shieldcell: 5 });
      spawnPickup(t, a.x, a.y);
    }
    S.respawn = (S.respawn || 0) + 1;
  }

  // ------------------------------------------------------------------ update
  Run.pause = function () { if (S && (S.phase === 'play' || S.phase === 'launch')) { S.paused = true; Snd.thrust(0); } };
  Run.update = function (dt) {
    if (!S) return;
    if (S.phase === 'tally') { updateTally(dt); return; }
    if (S.paused) {
      if (S.pauseT > 0.3 && (In.released || In.key('Escape', 'p', ' ', 'Enter'))) { S.paused = false; In.consume(); }
      S.pauseT = (S.pauseT || 0) + dt;
      return;
    }
    if (S.phase === 'play' && In.key('Escape', 'p')) { S.paused = true; S.pauseT = 0; Snd.thrust(0); return; }
    S.t += dt; S.pt += dt;
    var d = S.drone, st = S.st;

    // --- drone control
    var ctl = { x: 0, y: 0, m: 0 };
    if (S.phase === 'launch') {
      ctl = { x: 1, y: -0.2, m: S.pt < 0.5 ? 0.8 : 0 };
      if (S.pt > 0.9) { S.phase = 'play'; S.pt = 0; }
    } else if (S.phase === 'play') {
      ctl = steer();
      // RETURN button (drawn in HUD) is handled in draw via UI; keyboard shortcut R
      if (In.key('r')) endRun('manual');
    } else if (S.phase === 'return' || S.phase === 'dock') {
      var hx = S.home.x - d.x, hy = S.home.y - d.y, hl = Math.sqrt(hx * hx + hy * hy);
      if (S.phase === 'return') {
        var spd = Math.max(st.speed * 1.6, hl * 1.2);
        d.vx += (hx / (hl || 1) * spd - d.vx) * Math.min(1, 4 * dt);
        d.vy += (hy / (hl || 1) * spd - d.vy) * Math.min(1, 4 * dt);
        d.thrust = 1;
        if (hl < 8 || S.pt > 6) { S.phase = 'dock'; S.pt = 0; Snd.play('dock'); }
      } else {
        d.x += (S.home.x - d.x) * Math.min(1, 8 * dt); d.y += (S.home.y - d.y) * Math.min(1, 8 * dt);
        d.vx = d.vy = 0;
        if (S.pt > 0.6) startTally();
      }
    }
    if (S.phase === 'launch' || S.phase === 'play') {
      var resp = S.aid === 'slippery' ? 1.2 : 5.2;
      var maxV = st.speed;
      if (ctl.m > 0) {
        d.vx += (ctl.x * maxV * ctl.m - d.vx) * Math.min(1, resp * dt);
        d.vy += (ctl.y * maxV * ctl.m - d.vy) * Math.min(1, resp * dt);
      } else {
        var drag = S.aid === 'slippery' ? 0.85 : 0.12;
        var f = Math.pow(drag, dt);
        d.vx *= f; d.vy *= f;
      }
      d.thrust = ctl.m;
    }
    var vlen = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
    if (vlen > 4) d.ang += U.angleDiff(d.ang, Math.atan2(d.vy, d.vx)) * Math.min(1, 10 * dt);
    if (S.phase !== 'dock') { d.x += d.vx * dt; d.y += d.vy * dt; }
    Snd.thrust(S.phase === 'play' ? d.thrust * 0.8 : (S.phase === 'return' ? 0.5 : 0));

    // world edges push back softly
    var m = 10;
    if (d.x < m) d.vx += (m - d.x) * 30 * dt;
    if (d.x > S.w - m) d.vx -= (d.x - (S.w - m)) * 30 * dt;
    if (d.y < m) d.vy += (m - d.y) * 30 * dt;
    if (d.y > S.h - m) d.vy -= (d.y - (S.h - m)) * 30 * dt;
    d.x = U.clamp(d.x, 2, S.w - 2); d.y = U.clamp(d.y, 2, S.h - 2);

    // thruster particles
    if (d.thrust > 0.15 && Math.random() < 0.8) {
      var back = d.ang + Math.PI;
      S.parts.push({ x: d.x + Math.cos(back) * 4, y: d.y + Math.sin(back) * 4, vx: Math.cos(back + rnd(-0.4, 0.4)) * 30 + d.vx * 0.3, vy: Math.sin(back + rnd(-0.4, 0.4)) * 30 + d.vy * 0.3, life: 0.25, max: 0.25, col: Math.random() < 0.5 ? 9 : 10 });
    }

    // --- timers
    if (S.phase === 'play') {
      var burn = S.aid === 'frenzy' ? 2 : 1;
      d.fuel -= dt * burn;
      if (d.fuel <= 10 && d.fuel > 0) {
        S.lowBeep -= dt;
        if (S.lowBeep <= 0) { Snd.play('fuelLow'); S.lowBeep = 1; }
      }
      if (d.fuel <= 0) { d.fuel = 0; endRun('fuel'); floatText(d.x, d.y - 10, 'OUT OF FUEL', 9); }
      if (d.n >= d.cap) {
        S.fullT += dt;
        if (S.fullT > 1.4) endRun('full');
      } else S.fullT = 0;
      if (st.regen && d.shields < d.maxShields) {
        d.regen += dt;
        if (d.regen > 20) { d.regen = 0; d.shields++; Snd.play('shield'); floatText(d.x, d.y - 8, '+SHIELD', 12); }
      }
    }
    d.inv = Math.max(0, d.inv - dt);
    d.flash = Math.max(0, d.flash - dt);
    if (d.magnet < 9000) d.magnet = Math.max(0, d.magnet - dt);
    d.drillBoost = Math.max(0, d.drillBoost - dt);

    // --- hazards
    updateHazards(dt);

    // --- asteroids
    var contact = null, contactD = 1e9;
    for (var i = 0; i < S.ast.length; i++) {
      var a = S.ast[i];
      a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.vr * dt;
      a.flash = Math.max(0, a.flash - dt);
      a.wob = Math.max(0, a.wob - dt);
      if (a.wrap) {
        if (a.x < -a.r - 2) a.x += S.w + a.r * 2 + 4; else if (a.x > S.w + a.r + 2) a.x -= S.w + a.r * 2 + 4;
        if (a.y < -a.r - 2) a.y += S.h + a.r * 2 + 4; else if (a.y > S.h + a.r + 2) a.y -= S.h + a.r * 2 + 4;
      } else if (a.x < -80 || a.x > S.w + 80 || a.y < -80 || a.y > S.h + 80) { a.dead = true; continue; }
      if (S.phase !== 'play') continue;
      var dx = d.x - a.x, dy = d.y - a.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      var hitR = a.r * 0.85 + DRONE_R;
      if (a.kind === 'rock') {
        if (dist < hitR) {
          var nx = dx / dist, ny = dy / dist;
          d.x = a.x + nx * hitR; d.y = a.y + ny * hitR;
          if (d.inv <= 0) { hitDrone(nx, ny, 90); a.vx -= nx * 10; a.vy -= ny * 10; a.flash = 0.2; }
          else { d.vx += nx * 40; d.vy += ny * 40; }
        }
      } else {
        if (dist < hitR) {
          var nx2 = dx / dist, ny2 = dy / dist;
          d.x = a.x + nx2 * hitR; d.y = a.y + ny2 * hitR;
          var vn = d.vx * nx2 + d.vy * ny2;
          if (vn < 0) { d.vx -= vn * nx2 * 1.2; d.vy -= vn * ny2 * 1.2; }
        }
        if (dist < hitR + 3 && dist < contactD) { contact = a; contactD = dist; }
      }
    }
    // --- drilling
    if (contact && S.phase === 'play') {
      var a2 = contact;
      d.contact = a2;
      // sticky: match the rock's drift so you can just hold position
      if (d.thrust < 0.3) {
        d.vx += (a2.vx - d.vx) * Math.min(1, 6 * dt);
        d.vy += (a2.vy - d.vy) * Math.min(1, 6 * dt);
      }
      var dtime = st.drillTime / (d.drillBoost > 0 ? 2.5 : 1);
      a2.drill += dt / dtime;
      a2.wob = 0.05;
      if (Math.random() < 0.7) {
        var ca = Math.atan2(d.y - a2.y, d.x - a2.x);
        var px = a2.x + Math.cos(ca) * a2.r, py = a2.y + Math.sin(ca) * a2.r;
        var oc = D.ORES[a2.ore].cols;
        S.parts.push({ x: px, y: py, vx: rnd(-30, 30), vy: rnd(-30, 30), life: 0.3, max: 0.3, col: Math.random() < 0.5 ? oc[1] : 7 });
      }
      Snd.play('drill');
      if (a2.drill >= 1) {
        a2.drill = 0;
        a2.amt--;
        a2.flash = 0.12;
        var n = st.chunk;
        if (Math.random() < st.luck) { n *= 2; floatText(a2.x, a2.y - a2.r - 6, 'LUCKY!', 10); }
        var ang = Math.atan2(d.y - a2.y, d.x - a2.x);
        var pieces = Math.min(3, n);
        for (var k = 0; k < pieces; k++) {
          var aa = ang + rnd(-0.9, 0.9);
          S.chunks.push({
            x: a2.x + Math.cos(aa) * (a2.r + 1), y: a2.y + Math.sin(aa) * (a2.r + 1),
            vx: Math.cos(aa) * rnd(25, 45), vy: Math.sin(aa) * rnd(25, 45),
            ore: a2.ore, n: Math.ceil(n / pieces), t: 0, life: 20, delay: 0.12
          });
        }
        burst(a2.x + Math.cos(ang) * a2.r, a2.y + Math.sin(ang) * a2.r, 8, [D.ORES[a2.ore].cols[1], D.ORES[a2.ore].cols[0], 7], 50, 0.4);
        Snd.play('chunk', D.ORE_ORDER.indexOf(a2.ore));
        R.addShake(0.8);
        if (a2.amt <= 0) breakAsteroid(a2);
      }
    } else {
      if (d.contact) d.contact.drill = Math.max(0, d.contact.drill - dt * 0.5);
      d.contact = null;
    }
    // remove dead asteroids and top the field back up
    if (S.ast.some(function (x) { return x.dead; })) S.ast = S.ast.filter(function (x) { return !x.dead; });
    if (S.respawn > 0 && Math.random() < dt * 0.8) { S.respawn--; spawnAsteroid(true); }

    // --- ore chunks (magnet)
    var magR = st.magnet * (d.magnet > 0 ? 3 : 1) * (S.storm && S.storm.active ? 0.5 : 1);
    for (i = 0; i < S.chunks.length; i++) {
      var c = S.chunks[i];
      c.t += dt;
      var fr = Math.pow(0.15, dt);
      c.vx *= fr; c.vy *= fr;
      if (S.storm && S.storm.active) { c.vx += S.storm.wx * dt * 0.6; c.vy += S.storm.wy * dt * 0.6; }
      var cdx = d.x - c.x, cdy = d.y - c.y, cd = Math.sqrt(cdx * cdx + cdy * cdy) || 0.01;
      var canTake = d.n < d.cap && S.phase !== 'dock';
      if (c.t > (c.delay || 0) && canTake && (cd < magR + 4 || S.phase === 'return')) {
        var pull = 260 + (magR - cd) * 6;
        c.vx += cdx / cd * pull * dt; c.vy += cdy / cd * pull * dt;
        var mx = 140;
        var cv = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
        if (cv > mx) { c.vx *= mx / cv; c.vy *= mx / cv; }
      }
      c.x += c.vx * dt; c.y += c.vy * dt;
      if (cd < 6 && c.t > (c.delay || 0) * 0.5 && canTake) {
        var got = addCargo(c.ore, c.n);
        if (got > 0) {
          S.mined += got;
          c.n -= got;
          Snd.play('pickup', D.ORE_ORDER.indexOf(c.ore));
          floatText(d.x + rnd(-4, 4), d.y - 8, '+' + got, D.ORES[c.ore].cols[1]);
          if (c.n <= 0) c.dead = true;
        }
      }
      if (c.t > c.life) c.dead = true;
    }
    if (S.chunks.some(function (x) { return x.dead; })) S.chunks = S.chunks.filter(function (x) { return !x.dead; });

    // --- pickups
    for (i = 0; i < S.pickups.length; i++) {
      var p = S.pickups[i];
      p.t += dt;
      if (p.life < 9999) { p.life -= dt; if (p.life <= 0) { p.dead = true; continue; } }
      if (S.phase !== 'play') continue;
      if (U.dist(p.x, p.y, d.x, d.y) < 8) {
        p.dead = true;
        Snd.play('power');
        burst(p.x, p.y, 12, [7, 10, 12], 40, 0.5);
        if (p.type === 'fuel') { d.fuel = Math.min(d.fuel + D.RUN.fuelCell, d.maxFuel + 30); S.cells++; floatText(p.x, p.y - 8, '+' + D.RUN.fuelCell + 'S FUEL', 10); }
        else if (p.type === 'magnet') { if (d.magnet < 9000) d.magnet = D.RUN.boostTime; floatText(p.x, p.y - 8, 'MAGNET!', 8); }
        else if (p.type === 'drill') { d.drillBoost = D.RUN.boostTime; floatText(p.x, p.y - 8, 'DRILL BOOST!', 9); }
        else if (p.type === 'shieldcell') { d.shields = Math.min(d.maxShields, d.shields + 1); floatText(p.x, p.y - 8, '+SHIELD', 12); }
        if (DH.Sim) Sim.emit('pickup', { type: p.type });
      }
    }
    if (S.pickups.some(function (x) { return x.dead; })) S.pickups = S.pickups.filter(function (x) { return !x.dead; });

    // --- particles & floating text
    for (i = 0; i < S.parts.length; i++) {
      var q = S.parts[i];
      q.x += q.vx * dt; q.y += q.vy * dt;
      q.vx *= Math.pow(0.2, dt); q.vy *= Math.pow(0.2, dt);
      q.life -= dt;
    }
    S.parts = S.parts.filter(function (x) { return x.life > 0; });
    for (i = 0; i < S.floats.length; i++) S.floats[i].t += dt;
    S.floats = S.floats.filter(function (x) { return x.t < 0.9; });

    // --- camera
    var lx = d.vx * 0.35, ly = d.vy * 0.35;
    var tx = d.x + lx - R.W / 2, ty = d.y + ly - R.H / 2;
    S.cam.x += (tx - S.cam.x) * Math.min(1, 5 * dt);
    S.cam.y += (ty - S.cam.y) * Math.min(1, 5 * dt);
    S.cam.x = U.clamp(S.cam.x, -4, S.w - R.W + 4);
    S.cam.y = U.clamp(S.cam.y, -4, S.h - R.H + 4);
    R.updateShake(dt);
    S.hint += dt;
  };

  // ------------------------------------------------------------------ hazards
  function edgeSpawn(speed, aimAt) {
    // a point just off camera with a velocity aimed near the drone
    var side = Math.floor(Math.random() * 4);
    var cx = S.cam.x, cy = S.cam.y, x, y;
    if (side === 0) { x = cx - 30; y = cy + rnd(0, R.H); }
    else if (side === 1) { x = cx + R.W + 30; y = cy + rnd(0, R.H); }
    else if (side === 2) { x = cx + rnd(0, R.W); y = cy - 30; }
    else { x = cx + rnd(0, R.W); y = cy + R.H + 30; }
    var tx = aimAt.x + rnd(-40, 40), ty = aimAt.y + rnd(-40, 40);
    var l = U.dist(x, y, tx, ty) || 1;
    return { x: x, y: y, vx: (tx - x) / l * speed, vy: (ty - y) / l * speed, side: side };
  }
  function warnAt(sp, label, cb, delay) {
    S.warns.push({ x: sp.x, y: sp.y, vx: sp.vx, vy: sp.vy, t: 0, dur: delay, label: label, cb: cb });
    Snd.play('warn');
  }

  function updateHazards(dt) {
    var hz = S.sector.hazard, d = S.drone;
    var playing = S.phase === 'play';
    // queued warnings -> spawns
    for (var i = 0; i < S.warns.length; i++) {
      var w = S.warns[i];
      w.t += dt;
      if (w.t >= w.dur) { w.dead = true; w.cb(w); }
    }
    S.warns = S.warns.filter(function (x) { return !x.dead; });
    if (playing) S.hazardT -= dt;

    if (playing && S.hazardT <= 0) {
      if (hz === 'shards') {
        S.hazardT = rnd(6, 9);
        warnAt(edgeSpawn(105, d), 'SHARDS', function (w) {
          for (var k = 0; k < 4; k++) {
            var a = makeAsteroid(null, 'rock', 0);
            a.r = 3; a.x = w.x + rnd(-12, 12); a.y = w.y + rnd(-12, 12); a.vx = w.vx * rnd(0.9, 1.1); a.vy = w.vy * rnd(0.9, 1.1);
            a.wrap = false; a.vr = 4; a.seed = 900 + k;
            S.ast.push(a);
          }
        }, 1.1);
      } else if (hz === 'comets') {
        S.hazardT = rnd(6, 9);
        warnAt(edgeSpawn(150, d), 'COMET', function (w) {
          S.hazards.push({ type: 'comet', x: w.x, y: w.y, vx: w.vx, vy: w.vy, r: 5, t: 0 });
        }, 1.3);
      } else if (hz === 'storm') {
        S.hazardT = rnd(15, 19);
        var ang = Math.random() * Math.PI * 2;
        S.storm = { t: -2, dur: 6, wx: Math.cos(ang) * 75, wy: Math.sin(ang) * 75, active: false };
        Snd.play('warn');
      } else if (hz === 'whales') {
        S.hazardT = rnd(8, 12);
        if (S.whales.length < 3) spawnWhale(false);
      } else S.hazardT = 999;
    }
    if (S.aid === 'meteors' && playing) {
      S.meteorT = (S.meteorT || 0) - dt;
      if (S.meteorT <= 0) {
        S.meteorT = rnd(0.7, 1.3);
        var a = makeAsteroid(null, 'rock', Math.random() < 0.6 ? 0 : 1);
        a.x = S.cam.x + rnd(-20, R.W + 20); a.y = S.cam.y - 20; a.vx = rnd(-15, 15); a.vy = rnd(70, 110); a.wrap = false;
        S.ast.push(a);
      }
    }
    // comets
    for (i = 0; i < S.hazards.length; i++) {
      var h = S.hazards[i];
      h.t += dt; h.x += h.vx * dt; h.y += h.vy * dt;
      if (Math.random() < 0.9) S.parts.push({ x: h.x + rnd(-2, 2), y: h.y + rnd(-2, 2), vx: -h.vx * 0.15 + rnd(-8, 8), vy: -h.vy * 0.15 + rnd(-8, 8), life: 0.6, max: 0.6, col: U.pick([7, 12, 6, 13]) });
      if (playing && U.dist(h.x, h.y, d.x, d.y) < h.r + DRONE_R) {
        var l = U.dist(h.x, h.y, d.x, d.y) || 1;
        hitDrone((d.x - h.x) / l, (d.y - h.y) / l, 110);
      }
      if (h.t > 8) h.dead = true;
    }
    S.hazards = S.hazards.filter(function (x) { return !x.dead; });
    // storm
    if (S.storm) {
      var sm = S.storm;
      sm.t += dt;
      sm.active = sm.t > 0 && sm.t < sm.dur;
      if (sm.t > 0 && sm.t - dt <= 0) Snd.play('storm');
      if (sm.active && S.phase === 'play') { d.vx += sm.wx * dt; d.vy += sm.wy * dt; if (Math.random() < dt * 1.5) { S.flashT = 0.08; Snd.play('zap'); } }
      if (sm.t > sm.dur) S.storm = null;
    }
    S.flashT = Math.max(0, (S.flashT || 0) - dt);
    // whales
    for (i = 0; i < S.whales.length; i++) {
      var wh = S.whales[i];
      wh.ph += dt;
      wh.x += wh.dir * 16 * dt;
      wh.y += Math.sin(wh.ph * 0.7) * 6 * dt;
      wh.drop -= dt;
      if (wh.drop <= 0) {
        wh.drop = rnd(3, 5);
        S.chunks.push({ x: wh.x - wh.dir * 14, y: wh.y + 3, vx: -wh.dir * 10, vy: rnd(-6, 6), ore: 'pearl', n: 1, t: 0, life: 18, delay: 0.3 });
      }
      if (Math.abs(wh.x - (S.cam.x + R.W / 2)) < R.W && Math.abs(wh.y - (S.cam.y + R.H / 2)) < R.H && wh.sang <= 0) {
        Snd.play('whale'); wh.sang = rnd(10, 18);
      }
      wh.sang -= dt;
      if (playing) {
        for (var k = -1; k <= 1; k++) {
          var bx = wh.x + k * 9, by = wh.y + (k === 0 ? 0 : 1);
          var dd = U.dist(bx, by, d.x, d.y);
          if (dd < 7 + DRONE_R) { hitDrone((d.x - bx) / (dd || 1), (d.y - by) / (dd || 1), 80); break; }
        }
      }
      if (wh.x < -90 || wh.x > S.w + 90) wh.dead = true;
    }
    S.whales = S.whales.filter(function (x) { return !x.dead; });
    // gravity wells
    for (i = 0; i < S.wells.length; i++) {
      var g = S.wells[i];
      g.spin += dt * 3;
      var gx = g.x - d.x, gy = g.y - d.y, gd = Math.sqrt(gx * gx + gy * gy) || 1;
      if (gd < g.pull && S.phase === 'play') {
        var force = 9000 / Math.max(gd * gd, 300);
        d.vx += gx / gd * force * dt * 6; d.vy += gy / gd * force * dt * 6;
        if (gd < g.r + DRONE_R) hitDrone(-gx / gd, -gy / gd, 130);
      }
      for (var cI = 0; cI < S.chunks.length; cI++) {
        var ch = S.chunks[cI];
        var ex = g.x - ch.x, ey = g.y - ch.y, ed = Math.sqrt(ex * ex + ey * ey) || 1;
        if (ed < g.pull) { ch.vx += ex / ed * 40 * dt; ch.vy += ey / ed * 40 * dt; }
      }
      if (Math.random() < 0.6) {
        var pa = Math.random() * 6.28, pr = rnd(20, g.pull);
        S.parts.push({ x: g.x + Math.cos(pa) * pr, y: g.y + Math.sin(pa) * pr, vx: -Math.sin(pa) * 30 - Math.cos(pa) * 20, vy: Math.cos(pa) * 30 - Math.sin(pa) * 20, life: 0.8, max: 0.8, col: U.pick([2, 8, 13]) });
      }
    }
  }

  // ------------------------------------------------------------------ tally
  function startTally() {
    var s = S.s, d = S.drone;
    S.phase = 'tally'; S.pt = 0;
    Snd.thrust(0);
    var haul = {};
    for (var k in d.cargo) if (d.cargo[k] > 0) haul[k] = d.cargo[k];
    var base = 0; for (k in haul) base += haul[k];
    var bonus = {};
    var mult = 1;
    if (S.anomaly) {
      mult = S.anomaly.mult;
      for (k in haul) { var extra = Math.round(haul[k] * (mult - 1)); if (extra > 0) bonus[k] = extra; }
      bonus.dust = (bonus.dust || 0) + 3;
    }
    var finalHaul = {};
    for (k in haul) finalHaul[k] = haul[k];
    for (k in bonus) finalHaul[k] = (finalHaul[k] || 0) + bonus[k];
    var prevBest = s.stats.bestHaul;
    var newOres = S.newOres.filter(function (o) { return !s.seen.ores[o]; });
    var total = Sim.applyRun(s, finalHaul, { hits: S.hits, cells: S.cells, reason: S.endReason, daily: !!S.anomaly, base: base });
    var reward = null;
    if (S.anomaly && DH.Prog) reward = DH.Prog.completeDaily(s);
    S.tally = {
      haul: haul, bonus: bonus, mult: mult, total: total, base: base, keys: D.ORE_ORDER.filter(function (o) { return haul[o]; }),
      shown: 0, t: 0, step: 0, done: false, best: total > prevBest && s.stats.runs > 1, newOres: newOres, reward: reward
    };
    DH.G.save();
    Snd.setMusic(null);
  }
  function updateTally(dt) {
    var T = S.tally;
    T.t += dt;
    var rows = T.keys.length;
    // count up row by row
    if (!T.done) {
      T.step += dt;
      if (T.step > 0.05) {
        T.step = 0;
        if (T.shown < T.base) {
          T.shown = Math.min(T.base, T.shown + Math.max(1, Math.ceil(T.base / 40)));
          Snd.play('tick', Math.floor(T.shown / Math.max(1, T.base) * 20));
        } else { T.done = true; Snd.play('jingle'); R.addShake(2); }
      }
      if (rows === 0 && !T.done) { T.done = true; Snd.play('jingle'); }
    }
    for (var i = 0; i < S.parts.length; i++) { var q = S.parts[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
    S.parts = S.parts.filter(function (x) { return x.life > 0; });
    R.updateShake(dt);
  }

  // ------------------------------------------------------------------ drawing
  Run.draw = function (dt) {
    if (!S) return;
    var ctx = R.ctx;
    var cx = Math.round(S.cam.x) - R.shakeX, cy = Math.round(S.cam.y) - R.shakeY;
    R.clear(S.sector.bg);
    Spr.drawNebula(S.neb, cx * 0.2, cy * 0.2);
    stars.draw(cx, cy, S.t);
    // distant sector planet
    var pid = S.sector.planets[0];
    var pdef = D.PLANETS[pid];
    var pf = Spr.planetFrame(pdef, 18, S.t * 0.01);
    var ppx = Math.round(R.W * 0.72 - cx * 0.04), ppy = Math.round(R.H * 0.18 - cy * 0.04);
    R.img(pf, ppx, ppy);
    R.dither(ppx, ppy, pf.width, pf.height, S.sector.bg);

    // zone edge
    drawEdges(cx, cy);
    // gravity wells
    S.wells.forEach(function (g) {
      var x = g.x - cx, y = g.y - cy;
      if (x < -100 || y < -100 || x > R.W + 100 || y > R.H + 100) return;
      R.ring(x, y, g.pull * (0.5 + 0.5 * ((S.t * 0.3) % 1)), 2);
      R.circ(x, y, g.r + 2, 2); R.circ(x, y, g.r, 0);
      for (var k = 0; k < 6; k++) { var a = g.spin + k * 1.05; R.pset(x + Math.cos(a) * (g.r + 4), y + Math.sin(a) * (g.r + 4), 8); }
    });
    // mothership
    var ms = Spr.miniShip(S.s.hullColor);
    var mx = Math.round(S.home.x - ms.width / 2 - cx), my = Math.round(S.home.y - ms.height / 2 - cy);
    R.img(ms, mx, my);
    if (Math.floor(S.t * 2) % 2) R.pset(mx + 22, my - 1, 8);
    R.rect(mx + 30, my + 4, 4, 2, Math.floor(S.t * 4) % 2 ? 11 : 3);
    var fl = Math.floor(S.t * 12) % 3;
    R.rect(mx - 2 - fl, my + 4, 2 + fl, 3, fl ? 9 : 10);

    // pickups
    S.pickups.forEach(function (p) {
      var x = p.x - cx, y = p.y - cy + Math.round(Math.sin(p.t * 3) * 1.5);
      if (x < -10 || y < -10 || x > R.W + 10 || y > R.H + 10) return;
      if (p.life < 3 && Math.floor(p.t * 8) % 2) return;
      var sp = Spr.pickup(p.type);
      if (Math.floor(p.t * 3) % 2) R.ring(x, y, 7, p.type === 'fuel' ? 10 : (p.type === 'magnet' ? 8 : (p.type === 'drill' ? 9 : 12)));
      R.imgC(sp, x, y);
    });
    // asteroids
    for (var i = 0; i < S.ast.length; i++) {
      var a = S.ast[i];
      var ax = a.x - cx, ay = a.y - cy;
      if (ax < -20 || ay < -20 || ax > R.W + 20 || ay > R.H + 20) continue;
      if (a.wob > 0) { ax += Math.random() < 0.5 ? -1 : 1; }
      var fr = Spr.asteroidFrame(a.seed, a.r, a.kind, a.ore, a.cols, a.rot);
      if (a.flash > 0) fr = R.silhouette(fr, 7);
      R.imgC(fr, ax, ay);
      // ore sparkle so ore reads at a glance
      if (a.kind === 'ore' && Math.floor(S.t * 3 + a.seed) % 5 === 0) {
        var sa = a.rot * 2 + a.seed;
        R.pset(ax + Math.cos(sa) * a.r * 0.5, ay + Math.sin(sa) * a.r * 0.5, 7);
      }
      if (a.kind === 'ore' && a.drill > 0) {
        UI.bar(Math.round(ax - 7), Math.round(ay - a.r - 6), 14, 3, a.drill, 11, 0);
        // pips for remaining ore
        for (var k = 0; k < Math.min(a.amt, 8); k++) R.pset(Math.round(ax - 7 + k * 2), Math.round(ay - a.r - 8), D.ORES[a.ore].cols[1]);
      }
    }
    // drill beam
    var d = S.drone;
    if (d.contact && S.phase === 'play') {
      var c = d.contact;
      var ang = Math.atan2(c.y - d.y, c.x - d.x);
      var bx = d.x + Math.cos(ang) * 4 - cx, by = d.y + Math.sin(ang) * 4 - cy;
      var ex = c.x - Math.cos(ang) * (c.r - 1) - cx, ey = c.y - Math.sin(ang) * (c.r - 1) - cy;
      R.line(bx, by, ex, ey, Math.floor(S.t * 20) % 2 ? 10 : 7);
    }
    // ore chunks
    S.chunks.forEach(function (ch) {
      var x = ch.x - cx, y = ch.y - cy;
      if (x < -6 || y < -6 || x > R.W + 6 || y > R.H + 6) return;
      if (ch.life - ch.t < 2 && Math.floor(ch.t * 8) % 2) return;
      var oc = D.ORES[ch.ore].cols;
      R.rect(x - 1, y - 1, 3, 3, 0);
      R.rect(x - 1, y - 1, 2, 2, oc[1]);
      R.pset(x - 1, y - 1, oc[0]);
      if (ch.n > 1) R.pset(x + 1, y + 1, oc[1]);
    });
    // whales
    S.whales.forEach(function (wh) {
      var img = Spr.whale(Math.floor(wh.ph * 1.5) % 2, wh.dir < 0);
      R.imgC(img, wh.x - cx, wh.y - cy);
    });
    // comets
    S.hazards.forEach(function (h) {
      R.circ(h.x - cx, h.y - cy, h.r, 12); R.circ(h.x - cx - 1, h.y - cy - 1, h.r - 2, 7);
    });
    // particles
    S.parts.forEach(function (q) {
      var x = q.x - cx, y = q.y - cy;
      if (x < 0 || y < 0 || x >= R.W || y >= R.H) return;
      R.pset(x, y, q.life < q.max * 0.3 ? DH.DARK[q.col] : q.col);
    });
    // magnet field hint
    var dx = Math.round(d.x - cx), dy = Math.round(d.y - cy);
    if (S.phase === 'play' && (d.magnet > 0 || d.n < d.cap && S.chunks.length)) {
      var magR = S.st.magnet * (d.magnet > 0 ? 3 : 1);
      if (d.magnet > 0) for (var mk = 0; mk < 16; mk++) {
        var ma = mk / 16 * 6.28 + S.t;
        if ((mk + Math.floor(S.t * 8)) % 2) R.pset(dx + Math.cos(ma) * Math.min(magR, 40), dy + Math.sin(ma) * Math.min(magR, 40), 8);
      }
    }
    // the drone
    if (!(S.phase === 'dock' && S.pt > 0.3)) {
      var blink = d.inv > 0 && Math.floor(S.t * 14) % 2 === 0;
      if (!blink) {
        var img2 = Spr.droneFrame(S.s.chassis, S.s.paint, d.ang);
        if (d.flash > 0) img2 = R.silhouette(img2, 7);
        R.imgC(img2, dx, dy);
      }
      if (d.flash > 0) R.ring(dx, dy, 8, 12);
      if (d.drillBoost > 0 && Math.floor(S.t * 10) % 2) R.pset(dx + Math.cos(d.ang) * 6, dy + Math.sin(d.ang) * 6, 9);
    }
    // floating text
    S.floats.forEach(function (f) {
      var y = f.y - cy - f.t * 16;
      F.drawOutlined(ctx, f.txt, f.x - cx, y, f.col, 0, { font: 'small', align: 'center' });
    });
    // storm overlay
    if (S.storm) {
      var sm = S.storm;
      if (sm.active) {
        for (var sl = 0; sl < 10; sl++) {
          var sy = Math.floor(Math.random() * R.H), sx = Math.floor(Math.random() * R.W);
          R.rect(sx, sy, Math.floor(rnd(4, 16)), 1, Math.random() < 0.5 ? 11 : 13);
        }
        // wind streaks show which way you're being pushed
        var wl = Math.sqrt(sm.wx * sm.wx + sm.wy * sm.wy) || 1;
        for (var ws = 0; ws < 8; ws++) {
          var wx0 = (ws * 61 + Math.floor(S.t * sm.wx * 2)) % R.W, wy0 = (ws * 37 + Math.floor(S.t * sm.wy * 2)) % R.H;
          wx0 = (wx0 + R.W) % R.W; wy0 = (wy0 + R.H) % R.H;
          R.line(wx0, wy0, wx0 + sm.wx / wl * 8, wy0 + sm.wy / wl * 8, 3);
        }
      }
      if (S.flashT > 0) R.dither25(0, 0, R.W, R.H, 7);
    }
    if (S.phase !== 'tally') { drawWarnings(cx, cy); drawHUD(); }
    if (S.paused) {
      R.dim();
      F.drawOutlined(ctx, 'PAUSED', R.W / 2, R.H / 2 - 12, 10, 0, { align: 'center' });
      F.drawOutlined(ctx, In.hasTouch ? 'TAP TO KEEP DRILLING' : 'CLICK OR PRESS P TO RESUME', R.W / 2, R.H / 2, 7, 0, { align: 'center', font: 'small' });
    }
    if (S.phase === 'tally') drawTally(dt);
  };

  function drawEdges(cx, cy) {
    var c = Math.floor(S.t * 4) % 2 ? 9 : 4;
    if (cx < 10) for (var y = 0; y < R.H; y += 6) R.rect(-cx - 1, y + (Math.floor(S.t * 8) % 6), 1, 3, c);
    if (cy < 10) for (var x = 0; x < R.W; x += 6) R.rect(x + (Math.floor(S.t * 8) % 6), -cy - 1, 3, 1, c);
    if (cx + R.W > S.w - 10) for (y = 0; y < R.H; y += 6) R.rect(S.w - cx, y + (Math.floor(S.t * 8) % 6), 1, 3, c);
    if (cy + R.H > S.h - 10) for (x = 0; x < R.W; x += 6) R.rect(x + (Math.floor(S.t * 8) % 6), S.h - cy, 3, 1, c);
  }

  function edgeArrow(wx, wy, col, label, cx, cy) {
    var x = wx - cx, y = wy - cy;
    var pad = 10, top = 22;
    if (x >= 0 && y >= 0 && x < R.W && y < R.H) return false;
    var mx = R.W / 2, my = R.H / 2;
    var ang = Math.atan2(y - my, x - mx);
    var ex = U.clamp(x, pad, R.W - pad), ey = U.clamp(y, top + pad, R.H - pad);
    var tip = { x: ex + Math.cos(ang) * 4, y: ey + Math.sin(ang) * 4 };
    R.circ(ex, ey, 3, 0);
    R.line(ex, ey, tip.x, tip.y, col);
    R.pset(ex, ey, col);
    if (label) F.drawOutlined(R.ctx, label, ex, ey + 5, col, 0, { font: 'small', align: 'center' });
    return true;
  }

  function drawWarnings(cx, cy) {
    S.warns.forEach(function (w) {
      if (Math.floor(w.t * 8) % 2) return;
      var x = U.clamp(w.x - cx, 8, R.W - 8), y = U.clamp(w.y - cy, 26, R.H - 10);
      R.box(x - 5, y - 6, 11, 12, 0);
      R.box(x - 4, y - 5, 9, 10, 8);
      F.draw(R.ctx, '!', x - 2, y - 3, 7);
    });
    if (S.storm && S.storm.t < 0 && Math.floor(S.t * 6) % 2) F.drawOutlined(R.ctx, 'MAGNETIC STORM INCOMING!', R.W / 2, 40, 11, 0, { align: 'center' });
    // home arrow during return or when far away
    var d = S.drone;
    if (S.phase === 'return' || U.dist(d.x, d.y, S.home.x, S.home.y) > 200) edgeArrow(S.home.x, S.home.y, 11, 'SHIP', cx, cy);
    // ore sense research
    if (S.st.sense && S.phase === 'play') {
      var near = S.ast.filter(function (a) { return a.kind === 'ore'; }).sort(function (a, b) {
        return U.dist(a.x, a.y, d.x, d.y) - U.dist(b.x, b.y, d.x, d.y);
      });
      var shown = 0;
      for (var i = 0; i < near.length && shown < 3; i++) {
        if (edgeArrow(near[i].x, near[i].y, D.ORES[near[i].ore].cols[1], null, cx, cy)) shown++;
      }
    }
  }

  function drawHUD() {
    var d = S.drone, ctx = R.ctx;
    // top strip
    R.dither(0, 0, R.W, 19, 0);
    // fuel
    R.img(Spr.icon('fuel'), 3, 3);
    var fw = Math.min(70, Math.floor(R.W * 0.25));
    var low = d.fuel <= 10;
    UI.bar(12, 3, fw, 7, d.fuel / d.maxFuel, low ? (Math.floor(S.t * 6) % 2 ? 8 : 9) : 10, 1);
    F.draw(ctx, Math.ceil(d.fuel) + 'S', 14 + fw, 4, low ? 8 : 7, { font: 'small' });
    // shields
    for (var i = 0; i < d.maxShields; i++) {
      var on = i < d.shields;
      R.rect(12 + i * 6, 12, 5, 4, 0);
      R.rect(12 + i * 6, 12, 4, 3, on ? 12 : 1);
      if (on) R.pset(12 + i * 6, 12, 7);
    }
    R.img(Spr.icon('shield'), 3, 11);
    // cargo
    var cw = Math.min(54, Math.floor(R.W * 0.2));
    var cxp = R.W - cw - 4;
    var full = d.n >= d.cap;
    UI.bar(cxp, 3, cw, 7, d.n / d.cap, full ? (Math.floor(S.t * 6) % 2 ? 11 : 10) : 9, 1);
    R.img(Spr.icon('cargo'), cxp - 9, 3);
    F.draw(ctx, d.n + '/' + d.cap, cxp + cw / 2, 4, 7, { font: 'small', align: 'center', shadow: 0 });
    // boosts
    var bx = 12 + d.maxShields * 6 + 4;
    if (d.magnet > 0 && d.magnet < 9000) { R.img(Spr.icon('magnet'), bx, 11); F.draw(ctx, Math.ceil(d.magnet) + '', bx + 9, 12, 8, { font: 'small' }); bx += 20; }
    if (d.drillBoost > 0) { R.img(Spr.icon('drill'), bx, 11); F.draw(ctx, Math.ceil(d.drillBoost) + '', bx + 9, 12, 9, { font: 'small' }); bx += 20; }
    // per-ore counts
    var oy = 24;
    D.ORE_ORDER.forEach(function (o) {
      if (!d.cargo[o]) return;
      R.img(Spr.icon(D.ORES[o].icon), 3, oy);
      F.drawOutlined(ctx, String(d.cargo[o]), 12, oy + 1, 7, 0, { font: 'small' });
      oy += 9;
    });
    if (S.anomaly) F.drawOutlined(ctx, S.anomaly.name, R.W / 2, 12, 14, 0, { font: 'small', align: 'center' });
    // return button
    var rb = RET_BTN();
    if (S.phase === 'play') {
      var flash = full && Math.floor(S.t * 4) % 2;
      if (UI.button(rb.x + 15, 12, rb.w - 15, rb.h, 'RETURN', { style: flash ? 'good' : 'dark', font: 'small', id: 'run:return', sound: 'back' })) endRun('manual');
      if (!S.paused && UI.button(rb.x, 12, 13, rb.h, 'II', { style: 'dark', font: 'small', id: 'run:pause', sound: 'tab' })) { S.paused = true; S.pauseT = 0; Snd.thrust(0); }
    }
    if (full && S.phase === 'play') F.drawOutlined(ctx, 'CARGO FULL! HEADING HOME', R.W / 2, R.H - 24, 11, 0, { align: 'center' });
    if (S.phase === 'return' || S.phase === 'dock') {
      var msg = { fuel: 'OUT OF FUEL - RETURNING', shields: 'SHIELDS DOWN - AUTO RETURN', full: 'CARGO FULL - RETURNING', manual: 'RETURNING TO SHIP' }[S.endReason] || 'RETURNING';
      F.drawOutlined(ctx, msg, R.W / 2, R.H - 24, S.endReason === 'shields' ? 8 : 10, 0, { align: 'center' });
    }
    if (S.phase === 'launch') F.drawOutlined(ctx, 'GO!', R.W / 2, R.H / 2 - 24, 10, 0, { align: 'center' });
    if (S.t < 4 && S.sector.hazard && Math.floor(S.t * 3) % 4 !== 0) {
      var hzName = { shards: 'SHARD SWARMS', comets: 'ICE COMETS', storm: 'MAGNETIC STORMS', whales: 'SPACE WHALES - GIVE THEM ROOM', wells: 'GRAVITY WELLS' }[S.sector.hazard];
      F.drawOutlined(ctx, 'HAZARD: ' + hzName, R.W / 2, 30, 8, 0, { align: 'center', font: 'small' });
    }
    // first-run hints
    if (S.firstRun && S.phase === 'play') {
      var hint = S.hint < 6 ? (In.hasTouch ? 'DRAG ANYWHERE TO STEER' : 'HOLD MOUSE OR USE WASD TO STEER') :
        (S.hint < 13 ? 'TOUCH COLOURED ROCKS TO DRILL ORE' : (S.hint < 19 ? 'AVOID THE GREY ROCKS!' : null));
      if (hint) {
        var hw = F.measure(hint) + 10;
        R.box(R.W / 2 - hw / 2, R.H - 16, hw, 12, 0);
        R.rect(R.W / 2 - hw / 2 + 1, R.H - 15, hw - 2, 10, 7);
        F.draw(ctx, hint, R.W / 2, R.H - 14, 1, { align: 'center' });
      }
    }
    // touch stick
    if (S.joy && In.down) {
      R.ring(S.joy.x, S.joy.y, 14, 13);
      R.ring(S.joy.x, S.joy.y, 15, 1);
      var kx = U.clamp(In.x - S.joy.x, -14, 14), ky = U.clamp(In.y - S.joy.y, -14, 14);
      R.circ(S.joy.x + kx, S.joy.y + ky, 4, 6);
      R.circ(S.joy.x + kx - 1, S.joy.y + ky - 1, 2, 7);
    }
  }

  function drawTally(dt) {
    var T = S.tally, ctx = R.ctx;
    R.dim();
    var rows = Math.max(1, T.keys.length);
    var extra = (T.mult > 1 ? 1 : 0) + (T.newOres.length ? 1 : 0) + (T.best ? 1 : 0) + (T.reward ? 1 : 0);
    var h = Math.min(R.H - 8, 58 + rows * 11 + extra * 10);
    var w = Math.min(R.W - 8, 200);
    var x = Math.floor((R.W - w) / 2), y = Math.floor((R.H - h) / 2);
    var title = { fuel: 'RUN COMPLETE', full: 'FULL HOLD!', manual: 'RUN COMPLETE', shields: 'DRONE RECOVERED' }[S.endReason] || 'RUN COMPLETE';
    var c = UI.panelFrame(x, y, w, h, title, { icon: 'cargo', close: false });
    var yy = c.y + 1;
    // count-up rows: reveal the haul progressively
    var budget = T.shown;
    if (!T.keys.length) { F.draw(ctx, 'NO ORE THIS TIME. NEXT RUN!', c.x + c.w / 2, yy + 2, 13, { align: 'center', font: 'small' }); yy += 11; }
    T.keys.forEach(function (o) {
      var v = Math.min(T.haul[o], budget); budget -= v;
      R.img(Spr.icon(D.ORES[o].icon), c.x + 2, yy);
      F.draw(ctx, D.ORES[o].name, c.x + 12, yy, 6);
      F.draw(ctx, String(v), c.x + c.w - 2, yy, v === T.haul[o] ? 7 : 10, { align: 'right' });
      yy += 11;
    });
    R.rect(c.x, yy, c.w, 1, 13); yy += 3;
    if (T.mult > 1 && T.done) {
      F.draw(ctx, 'ANOMALY BONUS X' + T.mult + ' +3 DUST', c.x + 2, yy, 14, { font: 'small' }); yy += 10;
    }
    F.draw(ctx, 'TOTAL', c.x + 2, yy + 1, 6);
    var tot = T.done ? T.total : T.shown;
    F.drawScaled(ctx, String(tot), c.x + c.w - 2 - F.measure(String(tot)) * 2, yy - 2, T.done ? 10 : 7, 2);
    yy += 16;
    if (T.done) {
      if (T.newOres.length) { F.draw(ctx, '★ NEW ORE: ' + T.newOres.map(function (o) { return D.ORES[o].name; }).join(', '), c.x + 2, yy, 11, { font: 'small' }); yy += 10; }
      if (T.best) { F.draw(ctx, '★ BEST HAUL YET!', c.x + 2, yy, 10, { font: 'small' }); yy += 10; }
      if (T.reward) { F.draw(ctx, '★ ' + T.reward, c.x + 2, yy, 14, { font: 'small' }); yy += 10; }
      if (Math.random() < 0.3) burst(S.cam.x + R.W / 2 + rnd(-w / 2, w / 2), S.cam.y + y, 1, [10, 7, 9], 30, 0.6);
    }
    var by = y + h - 18;
    if (T.done) {
      if (UI.button(c.x + c.w / 2 - 40, by, 80, 15, 'CONTINUE', { style: 'good', id: 'run:continue' }) || In.key('Enter', ' ')) {
        DH.G.setScene('ship', { fromRun: { total: T.total, newOres: T.newOres, reason: S.endReason } });
      }
    } else if (In.released || In.key('Enter', ' ')) {
      T.shown = T.base; // tap to skip the count
    }
  }

  Run.debug = function () { return S; };
  DH.Scenes.run = Run;
})(window.DH);
