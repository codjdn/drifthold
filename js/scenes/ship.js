// DRIFTHOLD - scenes/ship.js
// THE SHIP: a side-view cross-section. Rooms (each level redrawn), crew living their lives,
// hull that grows, production popping out of rooms, and taps that open room panels.
(function (DH) {
  'use strict';
  var R = DH.R, F = DH.Font, In = DH.In, UI = DH.UI, U = DH.U, D = DH.D, Sim = DH.Sim, Spr = DH.Spr, Crew = DH.Crew;
  var CW = 44, CH = 32, IW = 42, IH = 30, FLOOR = 26;
  var Ship = { showBar: true };
  var V = { stars: null, t: 0, floats: [], acc: {}, hullKey: '', hullCanvas: null, geom: null, building: {}, hover: -1 };
  Ship.V = V;

  // grid layouts: slot index -> [col,row]. Slot 0 is always the bridge (front).
  var LAYOUTS = {
    land: { cols: 5, rows: 2, order: [[4, 0], [3, 0], [4, 1], [3, 1], [2, 0], [2, 1], [1, 0], [1, 1], [0, 0], [0, 1]] },
    port: { cols: 3, rows: 4, order: [[2, 0], [1, 0], [2, 1], [1, 1], [0, 0], [0, 1], [2, 2], [1, 2], [0, 2], [1, 3]] }
  };
  Ship.layoutName = function () { return R.W >= 290 ? 'land' : 'port'; };

  // ================================================================== room art
  function rr(c, x, y, w, h, col) { R.rect(x, y, w, h, col, c.x); }
  function pp(c, x, y, col) { R.pset(x, y, col, c.x); }

  function base(c, type) {
    var wall = D.ROOMS[type].wall;
    var dk = DH.DARK[wall];
    rr(c, 0, 0, IW, IH, wall);
    rr(c, 0, 19, IW, 7, dk === wall ? 0 : dk);
    rr(c, 0, 19, IW, 1, DH.LIGHT[wall] === 7 ? 13 : (wall === 5 ? 13 : 5));
    for (var x = 13; x < IW; x += 14) { rr(c, x, 3, 1, 16, dk); }
    rr(c, 0, 0, IW, 2, 5); rr(c, 0, 2, IW, 1, 0);
    rr(c, 17, 2, 8, 1, 6);
    var floor = wall === 5 ? 1 : 5, line = wall === 5 ? 13 : 6;
    rr(c, 0, FLOOR, IW, 4, floor); rr(c, 0, FLOOR, IW, 1, line);
    for (x = 3; x < IW; x += 7) pp(c, x, 28, 0);
  }

  var ART = {};
  var STATIONS = {};
  var ANIM = {};
  var DECOR_SPOT = {};

  // ---------------- bridge
  ART.bridge = function (c, L) {
    rr(c, 27, 4, 14, 14, 6); rr(c, 28, 5, 12, 12, 0); rr(c, 27, 10, 14, 1, 6);
    rr(c, 12, 18, 15, 3, 13); rr(c, 12, 21, 15, 5, 5); rr(c, 13, 18, 13, 1, 6);
    rr(c, 4, 15, 2, 7, 8); rr(c, 4, 21, 6, 2, 8); rr(c, 4, 15, 2, 1, 14); rr(c, 6, 23, 2, 3, 5);
    if (L >= 2) { rr(c, 2, 4, 12, 9, 6); rr(c, 3, 5, 10, 7, 1); }
    if (L >= 3) { rr(c, 19, 14, 7, 4, 5); rr(c, 20, 15, 5, 2, 0); }
    if (L >= 4) { rr(c, 30, 20, 10, 6, 5); rr(c, 30, 19, 10, 1, 13); rr(c, 31, 21, 8, 1, 12); }
    if (L >= 5) { rr(c, 15, 6, 9, 5, 10); rr(c, 16, 7, 7, 3, 9); pp(c, 19, 8, 7); }
  };
  ANIM.bridge = function (x, y, L, t) {
    for (var i = 0; i < 6; i++) {
      var sx = x + 28 + Math.floor(((i * 7 - t * 10) % 12 + 12) % 12), sy = y + 5 + ((i * 5) % 12);
      if (sy !== y + 10) R.pset(sx, sy, i % 2 ? 7 : 6);
    }
    for (var b = 0; b < 4; b++) R.pset(x + 14 + b * 3, y + 19, Math.floor(t * 2 + b) % 3 === 0 ? 11 : (b % 2 ? 8 : 12));
    if (L >= 2) for (var k = 0; k < 10; k++) R.pset(x + 3 + k, y + 8 + Math.round(Math.sin(t * 3 + k * 0.7) * 2), 11);
    if (L >= 3) { var a = t * 3; R.pset(x + 22 + Math.round(Math.cos(a) * 2), y + 16, 11); }
    if (L >= 4 && Math.floor(t * 4) % 2) R.pset(x + 35, y + 21, 7);
  };
  STATIONS.bridge = [{ x: 4, pose: 'sit' }, { x: 16, pose: 'stand' }, { x: 30, pose: 'stand' }];
  DECOR_SPOT.bridge = { x: 1, y: 26 };

  // ---------------- quarters
  function bunk(c, x, tiers, cols) {
    var top = tiers === 3 ? 6 : 12;
    rr(c, x, top, 1, FLOOR - top, 4); rr(c, x + 12, top, 1, FLOOR - top, 4);
    for (var k = 0; k < tiers; k++) {
      var y = 22 - k * (tiers === 3 ? 7 : 8);
      rr(c, x + 1, y + 2, 11, 1, 4);
      rr(c, x + 1, y, 11, 2, 7);
      rr(c, x + 4, y, 8, 2, cols[k % cols.length]);
      rr(c, x + 4, y, 8, 1, DH.LIGHT[cols[k % cols.length]]);
    }
  }
  function bunkBeds(L) {
    var xs = L === 1 ? [3] : (L === 2 ? [3, 17] : [2, 15, 28]);
    var tiers = L >= 4 ? 3 : 2;
    var out = [];
    xs.forEach(function (x) { for (var k = 0; k < tiers; k++) out.push({ x: x + 1, y: 22 - k * (tiers === 3 ? 7 : 8) }); });
    return out;
  }
  ART.quarters = function (c, L) {
    var xs = L === 1 ? [3] : (L === 2 ? [3, 17] : [2, 15, 28]);
    var tiers = L >= 4 ? 3 : 2;
    var blankets = [[12, 8], [11, 9], [14, 12]];
    xs.forEach(function (x, i) { bunk(c, x, tiers, blankets[i]); });
    if (L <= 2) { rr(c, 32, 9, 6, 6, 6); rr(c, 33, 10, 4, 4, 1); pp(c, 34, 11, 7); }
    if (L >= 2 && L <= 2) { rr(c, 31, 22, 8, 4, 4); rr(c, 31, 21, 8, 1, 9); }
    if (L >= 5) { rr(c, 0, 3, IW, 1, 0); }
  };
  ANIM.quarters = function (x, y, L, t) {
    if (L <= 2) { if (Math.floor(t) % 4 === 0) R.pset(x + 35, y + 12, 6); }
    if (L >= 5) for (var i = 0; i < 10; i++) R.pset(x + 2 + i * 4, y + 3 + (i % 2), [8, 10, 11, 12, 14][(i + Math.floor(t * 2)) % 5]);
  };
  STATIONS.quarters = [{ x: 10, pose: 'stand' }, { x: 24, pose: 'stand' }];
  DECOR_SPOT.quarters = { x: 33, y: 26 };

  // ---------------- workshop
  ART.workshop = function (c, L) {
    rr(c, 3, 5, 17, 10, 4); rr(c, 3, 5, 17, 1, 9);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 2; j++) pp(c, 5 + i * 4, 8 + j * 4, 2);
    rr(c, 5, 7, 1, 5, 6); rr(c, 4, 7, 3, 1, 6);            // wrench
    rr(c, 10, 7, 4, 2, 5); rr(c, 11, 9, 1, 4, 9);          // hammer
    rr(c, 16, 7, 1, 6, 8); rr(c, 15, 12, 3, 1, 8);         // screwdriver
    rr(c, 2, 19, 20, 2, 4); rr(c, 2, 19, 20, 1, 9); rr(c, 3, 21, 2, 5, 4); rr(c, 19, 21, 2, 5, 4);
    rr(c, 5, 17, 3, 2, 5); rr(c, 13, 17, 5, 2, 12);
    if (L >= 2) { rr(c, 25, 22, 6, 4, 5); rr(c, 25, 22, 6, 1, 6); }
    if (L >= 3) { rr(c, 34, 20, 2, 6, 6); rr(c, 32, 19, 6, 1, 13); }
    if (L >= 4) { rr(c, 24, 7, 17, 1, 4); rr(c, 25, 4, 4, 3, 9); rr(c, 30, 4, 4, 3, 12); rr(c, 35, 4, 4, 3, 11); }
    if (L >= 5) { rr(c, 0, 3, IW, 1, 6); }
  };
  ANIM.workshop = function (x, y, L, t, room, s) {
    if (L >= 2) {
      var a = Math.sin(t * 1.6) * 0.6 - 1.2;
      var ex = x + 28 + Math.round(Math.cos(a) * 7), ey = y + 22 + Math.round(Math.sin(a) * 7);
      R.line(x + 28, y + 22, ex, ey, 6); R.line(x + 29, y + 22, ex + 1, ey, 13);
      R.pset(ex + 1, ey - 1, 9);
    }
    if (L >= 3) R.imgC(Spr.droneFrame(s.chassis, s.paint, Math.PI * 1.5 + Math.sin(t) * 0.2), x + 35, y + 15);
    if (s.job && Math.random() < 0.5) {
      R.pset(x + 14 + Math.random() * 6, y + 15 + Math.random() * 3, U.pick([10, 9, 7]));
    }
    if (L >= 5) { var hx = x + 8 + Math.round((Math.sin(t * 0.4) * 0.5 + 0.5) * 26); R.rect(hx, y + 4, 1, 4, 5); R.rect(hx - 1, y + 8, 3, 1, 10); }
  };
  STATIONS.workshop = [{ x: 9, pose: 'stand' }, { x: 21, pose: 'stand' }];
  DECOR_SPOT.workshop = { x: 22, y: 19 };

  // ---------------- hydroponics
  function tray(c, x, y, w) { rr(c, x, y, w, 3, 5); rr(c, x, y, w, 1, 6); rr(c, x + 1, y + 1, w - 2, 1, 4); }
  function trays(L) {
    var t = [{ x: 3, y: 23, w: 15 }, { x: 22, y: 23, w: 15 }];
    if (L >= 2) t.push({ x: 24, y: 14, w: 14 });
    if (L >= 3) t.push({ x: 3, y: 14, w: 14 });
    return t;
  }
  ART.hydroponics = function (c, L) {
    trays(L).forEach(function (t) { tray(c, t.x, t.y, t.w); });
    if (L >= 2) { rr(c, 4, 3, 34, 1, 13); }
    if (L >= 3) { rr(c, 19, 3, 1, 5, 6); rr(c, 17, 8, 5, 3, 4); }
    if (L >= 4) { rr(c, 37, 20, 4, 6, 4); rr(c, 38, 9, 2, 11, 4); }
    if (L >= 5) { rr(c, 39, 4, 3, 10, 12); rr(c, 39, 4, 3, 1, 7); rr(c, 20, 4, 19, 1, 12); }
  };
  ANIM.hydroponics = function (x, y, L, t) {
    trays(L).forEach(function (tr, ti) {
      for (var px = tr.x + 2; px < tr.x + tr.w - 1; px += 3) {
        var h = 2 + ((px * 7 + ti) % 3) + Math.min(3, L);
        var sway = Math.round(Math.sin(t * 1.5 + px * 0.5) * 0.6);
        R.rect(x + px, y + tr.y - h, 1, h, 3);
        R.pset(x + px - 1 + sway, y + tr.y - h, 11); R.pset(x + px + 1 + sway, y + tr.y - h + 1, 11);
        R.pset(x + px + sway, y + tr.y - h - 1, 11);
        if (L >= 5 && px % 2) R.pset(x + px + sway, y + tr.y - h + 1, 8);
      }
    });
    if (L >= 2) for (var i = 0; i < 9; i++) if ((i + Math.floor(t * 3)) % 3) R.pset(x + 5 + i * 4, y + 4, 14);
    if (L >= 3) { R.pset(x + 18, y + 7, 11); R.pset(x + 20, y + 7, 11); R.pset(x + 19, y + 6, 11); }
    if (L >= 4) { R.circ(x + 39, y + 8, 3, 3); R.pset(x + 38, y + 6, 11); R.pset(x + 40, y + 9, 11); R.pset(x + 37, y + 9, 11); }
    if (L >= 5) { var dy = Math.floor((t * 12) % 8); R.pset(x + 30, y + 5 + dy, 12); }
  };
  STATIONS.hydroponics = [{ x: 9, pose: 'stand' }, { x: 27, pose: 'stand' }];
  DECOR_SPOT.hydroponics = { x: 18, y: 26 };

  // ---------------- refinery
  ART.refinery = function (c, L) {
    rr(c, 3, 10, 14, 16, 5); rr(c, 3, 10, 14, 1, 6); rr(c, 8, 2, 4, 8, 5); rr(c, 8, 2, 1, 8, 6);
    rr(c, 6, 15, 8, 7, 0);
    rr(c, 20, 23, 6, 3, 6); rr(c, 20, 23, 6, 1, 7); rr(c, 21, 21, 4, 2, 6);
    if (L >= 2) { rr(c, 27, 7, 9, 15, 13); rr(c, 27, 7, 9, 1, 6); rr(c, 27, 11, 9, 1, 5); rr(c, 27, 17, 9, 1, 5); rr(c, 29, 22, 2, 4, 5); rr(c, 33, 22, 2, 4, 5); rr(c, 17, 9, 10, 1, 5); }
    if (L >= 3) { rr(c, 17, 25, 25, 1, 0); for (var i = 18; i < 42; i += 4) pp(c, i, 25, 6); }
    if (L >= 4) { rr(c, 36, 14, 6, 12, 5); rr(c, 37, 18, 4, 4, 0); }
    if (L >= 5) { rr(c, 18, 3, 8, 1, 6); rr(c, 20, 4, 5, 4, 5); }
  };
  ANIM.refinery = function (x, y, L, t, room) {
    var on = !room.starved;
    for (var i = 0; i < 8; i++) for (var j = 0; j < 7; j++) {
      if (!on && j < 4) continue;
      var v = Math.sin(t * 6 + i * 1.3 + j) + (6 - j) * 0.3;
      R.pset(x + 6 + i, y + 15 + j, on ? (v > 1.2 ? 10 : (v > 0.4 ? 9 : 8)) : 2);
    }
    if (on && Math.random() < 0.3) R.pset(x + 9 + Math.random() * 3, y + 1 - Math.random() * 2, 5);
    if (L >= 3) for (var k = 0; k < 3; k++) { var ix = x + 18 + Math.floor((t * 6 + k * 8) % 24); R.rect(ix, y + 23, 3, 2, 6); R.pset(ix, y + 23, 7); }
    if (L >= 4 && on) R.rect(x + 37, y + 18, 4, 4, Math.floor(t * 5) % 2 ? 9 : 8);
    if (L >= 5 && on) { var pour = Math.floor(t * 8) % 6; R.rect(x + 22, y + 8, 1, 4 + pour, 10); }
    if (L >= 2) R.pset(x + 31, y + 9, Math.floor(t * 2) % 2 ? 11 : 3);
  };
  STATIONS.refinery = [{ x: 19, pose: 'stand' }, { x: 30, pose: 'stand' }];
  DECOR_SPOT.refinery = { x: 36, y: 26 };

  // ---------------- observatory
  ART.observatory = function (c, L) {
    rr(c, 12, 3, 20, 10, 6); rr(c, 13, 3, 18, 9, 0); pp(c, 12, 3, 1); pp(c, 31, 3, 1);
    rr(c, 2, 6, 8, 10, 13); rr(c, 3, 7, 6, 8, 1);
    pp(c, 4, 9, 7); pp(c, 7, 8, 10); pp(c, 5, 12, 7); pp(c, 8, 13, 12); R.line(4, 9, 7, 8, 13, c.x); R.line(7, 8, 5, 12, 13, c.x);
    var len = 6 + L * 2;
    R.line(20, 25, 22, 19, 5, c.x); R.line(26, 25, 23, 19, 5, c.x); R.line(23, 25, 23, 19, 5, c.x);
    for (var i = 0; i < len; i++) { rr(c, 22 + Math.round(i * 0.6), 18 - Math.round(i * 0.8), 2, 2, i > len - 3 ? 7 : 6); }
    if (L >= 3) { R.circ(36, 22, 3, 12, c.x); pp(c, 35, 21, 11); pp(c, 37, 23, 3); rr(c, 36, 25, 1, 1, 5); }
    if (L >= 4) { rr(c, 2, 20, 9, 2, 4); rr(c, 3, 22, 1, 4, 4); rr(c, 9, 22, 1, 4, 4); rr(c, 3, 19, 7, 1, 12); }
    if (L >= 5) { rr(c, 33, 5, 8, 7, 5); rr(c, 34, 6, 6, 5, 1); }
  };
  ANIM.observatory = function (x, y, L, t) {
    for (var i = 0; i < 5; i++) {
      var sx = x + 13 + Math.floor(((i * 5 + t * 2) % 18 + 18) % 18), sy = y + 4 + (i * 3) % 8;
      if (Math.sin(t * 3 + i) > -0.3) R.pset(sx, sy, i % 2 ? 7 : 12);
    }
    if (L >= 5) for (var k = 0; k < 5; k++) R.pset(x + 35 + k, y + 8 + Math.round(Math.sin(t * 2 + k) * 2), 12);
    if (Math.floor(t * 1.5) % 3 === 0) R.pset(x + 7, y + 8, 7);
  };
  STATIONS.observatory = [{ x: 15, pose: 'stand' }, { x: 29, pose: 'stand' }];
  DECOR_SPOT.observatory = { x: 31, y: 26 };

  // ---------------- galley
  ART.galley = function (c, L) {
    rr(c, 1, 18, 18, 8, 5); rr(c, 1, 17, 18, 1, 6); rr(c, 9, 19, 1, 7, 0); pp(c, 7, 21, 6); pp(c, 11, 21, 6);
    rr(c, 3, 15, 7, 2, 0); rr(c, 4, 12, 5, 3, 6); rr(c, 4, 12, 5, 1, 7);
    rr(c, 25, 19, 14, 1, 4); rr(c, 25, 20, 14, 1, 2); rr(c, 26, 21, 1, 5, 4); rr(c, 37, 21, 1, 5, 4);
    rr(c, 22, 22, 3, 1, 8); rr(c, 23, 23, 1, 3, 5); rr(c, 39, 22, 3, 1, 8); rr(c, 40, 23, 1, 3, 5);
    rr(c, 28, 18, 3, 1, 7); rr(c, 33, 17, 2, 2, 9);
    if (L >= 2) { rr(c, 2, 5, 16, 1, 5); rr(c, 4, 6, 3, 3, 6); rr(c, 9, 6, 4, 2, 4); rr(c, 14, 6, 3, 3, 6); }
    if (L >= 3) { rr(c, 19, 8, 5, 18, 7); rr(c, 19, 8, 5, 1, 6); rr(c, 19, 14, 5, 1, 6); rr(c, 22, 10, 1, 2, 5); rr(c, 22, 16, 1, 3, 5); }
    if (L >= 4) { rr(c, 12, 15, 2, 2, 4); pp(c, 12, 14, 11); pp(c, 13, 13, 11); rr(c, 15, 15, 2, 2, 4); pp(c, 16, 14, 11); }
  };
  ANIM.galley = function (x, y, L, t) {
    for (var i = 0; i < 3; i++) {
      var ph = (t * 1.2 + i * 0.33) % 1;
      R.pset(x + 5 + i * 2 + Math.round(Math.sin(t * 3 + i) * 1), y + 11 - Math.floor(ph * 7), ph > 0.6 ? 5 : 6);
    }
    R.pset(x + 6, y + 16, Math.floor(t * 8) % 2 ? 8 : 9);
    if (L >= 5) {
      var on = Math.floor(t * 1.5) % 4 !== 0;
      F.draw(R.ctx, 'EAT', x + 28, y + 6, on ? 14 : 2, { font: 'small' });
    }
  };
  STATIONS.galley = [{ x: 6, pose: 'stand' }, { x: 27, pose: 'sit' }, { x: 33, pose: 'sit' }];
  DECOR_SPOT.galley = { x: 31, y: 17 };

  // ---------------- lab
  ART.lab = function (c, L) {
    rr(c, 2, 19, 22, 2, 6); rr(c, 2, 19, 22, 1, 7); rr(c, 3, 21, 1, 5, 5); rr(c, 22, 21, 1, 5, 5);
    rr(c, 30, 4, 9, 22, 13); rr(c, 31, 5, 7, 19, 1); rr(c, 29, 24, 11, 2, 5); rr(c, 29, 3, 11, 2, 5);
    if (L >= 2) { rr(c, 2, 6, 11, 8, 5); rr(c, 3, 7, 9, 6, 0); rr(c, 7, 14, 1, 5, 5); }
    if (L >= 3) { rr(c, 17, 15, 2, 4, 5); rr(c, 16, 14, 2, 1, 5); rr(c, 15, 18, 5, 1, 5); }
    if (L >= 4) { rr(c, 14, 6, 9, 1, 4); }
  };
  ANIM.lab = function (x, y, L, t) {
    var cols = [11, 14, 12];
    for (var f = 0; f < 3; f++) {
      var fx = x + 4 + f * 4;
      R.rect(fx, y + 15, 3, 4, 6); R.rect(fx + 1, y + 13, 1, 2, 6);
      R.rect(fx, y + 17, 3, 2, cols[f]);
      if ((Math.floor(t * 4) + f) % 3 === 0) R.pset(fx + 1, y + 16 - (Math.floor(t * 6) % 3), 7);
    }
    var lv = 12 + Math.round(Math.sin(t * 0.8) * 2);
    R.rect(x + 31, y + 24 - lv, 7, lv, 3); R.rect(x + 31, y + 24 - lv, 7, 1, 11);
    for (var b = 0; b < 3; b++) { var by = (t * 8 + b * 6) % lv; R.pset(x + 32 + b * 2, y + 23 - Math.floor(by), 11); }
    if (L >= 2) for (var k = 0; k < 4; k++) R.rect(x + 4, y + 8 + k, 3 + ((k * 3 + Math.floor(t * 2)) % 6), 1, k % 2 ? 11 : 12);
    if (L >= 4) for (var j = 0; j < 4; j++) R.pset(x + 15 + j * 2, y + 5, (Math.floor(t * 3) + j) % 2 ? cols[j % 3] : 5);
    if (L >= 5) { R.circ(x + 34, y + 12, 2, Math.floor(t * 6) % 2 ? 7 : 10); }
  };
  STATIONS.lab = [{ x: 10, pose: 'stand' }, { x: 25, pose: 'stand' }];
  DECOR_SPOT.lab = { x: 24, y: 26 };

  // ---------------- lounge
  ART.lounge = function (c, L) {
    rr(c, 3, 16, 18, 4, 8); rr(c, 3, 16, 18, 1, 14); rr(c, 3, 20, 18, 4, 8); rr(c, 4, 20, 8, 1, 14); rr(c, 13, 20, 7, 1, 14);
    rr(c, 2, 18, 2, 6, 2); rr(c, 20, 18, 2, 6, 2); rr(c, 4, 24, 1, 2, 0); rr(c, 19, 24, 1, 2, 0);
    rr(c, 30, 11, 9, 15, 9); rr(c, 31, 10, 7, 1, 9); rr(c, 31, 13, 7, 5, 0); rr(c, 31, 20, 7, 1, 4); rr(c, 31, 22, 7, 1, 4);
    if (L >= 2) { rr(c, 24, 21, 4, 5, 4); pp(c, 25, 18, 11); pp(c, 26, 17, 3); pp(c, 27, 19, 11); pp(c, 24, 19, 3); rr(c, 25, 20, 2, 1, 3); }
    if (L >= 3) { rr(c, 6, 4, 12, 8, 4); rr(c, 7, 5, 10, 6, 12); rr(c, 9, 7, 3, 2, 10); }
    if (L >= 4) { rr(c, 1, 25, 24, 1, 14); }
  };
  ANIM.lounge = function (x, y, L, t) {
    for (var i = 0; i < 4; i++) R.rect(x + 31 + i * 2, y + 14 + ((i + Math.floor(t * 4)) % 3), 1, 3, [8, 10, 11, 12][(i + Math.floor(t * 3)) % 4]);
    var np = (t * 0.8) % 1;
    R.img(Spr.icon('note'), x + 31 + Math.round(Math.sin(t * 2) * 2), y + 3 - Math.floor(np * 4));
    if (L >= 5) {
      R.circ(x + 21, y + 6, 2, 6); R.pset(x + 21, y + 3, 6);
      for (var k = 0; k < 6; k++) { var a = t * 2 + k; R.pset(x + 21 + Math.round(Math.cos(a) * (6 + k * 2)), y + 8 + Math.round(Math.sin(a) * 4 + k), [7, 12, 14][k % 3]); }
    }
  };
  STATIONS.lounge = [{ x: 6, pose: 'sit' }, { x: 13, pose: 'sit' }, { x: 26, pose: 'stand' }];
  DECOR_SPOT.lounge = { x: 23, y: 26 };

  // ---------------- hangar
  ART.hangar = function (c, L) {
    for (var x = 0; x < IW; x += 4) { rr(c, x, FLOOR, 2, 1, 10); rr(c, x + 2, FLOOR, 2, 1, 0); }
    rr(c, 19, 2, 1, 6, 6); rr(c, 16, 8, 7, 1, 6);
    rr(c, 2, 18, 9, 8, 8); rr(c, 2, 18, 9, 1, 14); rr(c, 2, 21, 9, 1, 2); rr(c, 2, 24, 9, 1, 2); rr(c, 5, 19, 3, 1, 7);
    if (L >= 2) { rr(c, 27, 6, 14, 1, 5); }
    if (L >= 4) { rr(c, 27, 15, 14, 1, 5); }
    rr(c, 35, 19, 6, 7, 0); rr(c, 36, 20, 4, 5, 1);
  };
  ANIM.hangar = function (x, y, L, t, room, s) {
    var sw = Math.round(Math.sin(t) * 1);
    R.rect(x + 19 + sw, y + 8, 1, 4, 5);
    R.imgC(Spr.droneFrame(s.chassis, s.paint, 0), x + 19 + sw, y + 16);
    var owned = D.PAINT_ORDER.filter(function (p) { return s.owned.paint[p] && p !== s.paint; });
    var maxShow = L >= 4 ? 4 : (L >= 2 ? 2 : 0);
    for (var i = 0; i < Math.min(maxShow, owned.length); i++) {
      R.imgC(Spr.droneFrame('standard', owned[i], Math.PI / 2), x + 30 + (i % 2) * 7, y + 10 + Math.floor(i / 2) * 9);
    }
    if (Math.floor(t * 2) % 2) R.pset(x + 38, y + 21, 11);
  };
  STATIONS.hangar = [{ x: 12, pose: 'stand' }, { x: 27, pose: 'stand' }];
  DECOR_SPOT.hangar = { x: 24, y: 26 };

  Ship.stations = function (type, lvl) {
    if (type === 'quarters:beds') return bunkBeds(lvl);
    return STATIONS[type] || [{ x: 15, pose: 'stand' }];
  };

  Ship.roomImage = function (type, lvl) {
    var k = 'room:' + type + ':' + lvl;
    if (Spr.cache[k]) return Spr.cache[k];
    var c = R.makeCanvas(IW, IH);
    base(c, type);
    ART[type](c, lvl);
    return (Spr.cache[k] = c);
  };
  Ship.drawRoomAnim = function (type, x, y, lvl, t, room, s) { if (ANIM[type]) ANIM[type](x, y, lvl, t, room, s); };

  // ================================================================== geometry
  Ship.geometry = function (s) {
    var L = LAYOUTS[Ship.layoutName()];
    var cells = [];
    var minC = 99, maxC = -1, minR = 99, maxR = -1;
    var count = Math.min(D.MAX_SLOTS, s.hull + (s.hull < D.MAX_SLOTS ? 1 : 0));
    for (var i = 0; i < count; i++) {
      var cr = L.order[i];
      cells.push({ slot: i, col: cr[0], row: cr[1], ghost: i >= s.hull });
      if (i < s.hull) { minC = Math.min(minC, cr[0]); maxC = Math.max(maxC, cr[0]); minR = Math.min(minR, cr[1]); maxR = Math.max(maxR, cr[1]); }
    }
    // include ghost in layout bounds so the ship doesn't jump around when it grows
    cells.forEach(function (c) { minC = Math.min(minC, c.col); maxC = Math.max(maxC, c.col); minR = Math.min(minR, c.row); maxR = Math.max(maxR, c.row); });
    var bw = (maxC - minC + 1) * CW + 2, bh = (maxR - minR + 1) * CH + 2;
    var noseW = 22, engW = 12;
    var totalW = engW + 3 + bw + 3 + noseW;
    var top = Ship.hudBottom || 36, bottom = R.H - DH.G.barH - 4;
    var ox = Math.floor((R.W - totalW) / 2) + engW + 3;
    var oy = Math.floor(top + (bottom - top - bh) / 2);
    if (oy < top + 6) oy = top + 6;
    cells.forEach(function (c) {
      c.x = ox + (c.col - minC) * CW; c.y = oy + (c.row - minR) * CH;
    });
    return { cells: cells, ox: ox, oy: oy, bw: bw, bh: bh, minC: minC, minR: minR, maxC: maxC, maxR: maxR, noseW: noseW, engW: engW, layout: Ship.layoutName() };
  };

  // ================================================================== hull
  function hullCanvas(s, g) {
    var key = [s.hull, s.hullColor, g.layout, g.bw, g.bh, R.W, R.H].join(':');
    if (V.hullKey === key && V.hullCanvas) return V.hullCanvas;
    var H = D.HULLS[s.hullColor] || D.HULLS.steel;
    var pad = 28;
    var w = g.bw + g.engW + g.noseW + 12 + pad * 2, h = g.bh + 12 + pad * 2;
    var c = R.makeCanvas(w, h);
    var bx = pad + g.engW + 3, by = pad;   // where the cell block starts in this canvas
    c.bx = bx; c.by = by;
    // which cells are real (unlocked)
    var unlocked = g.cells.filter(function (cc) { return !cc.ghost; });
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    unlocked.forEach(function (cc) {
      var x = cc.x - g.ox + bx, y = cc.y - g.oy + by;
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x + CW); maxY = Math.max(maxY, y + CH);
    });
    maxX += 2; maxY += 2;
    // outer plating
    var px0 = minX - 4, py0 = minY - 4, px1 = maxX + 4, py1 = maxY + 4;
    R.box(px0 - 1, py0 - 1, px1 - px0 + 2, py1 - py0 + 2, 0, c.x);
    rr(c, px0, py0, px1 - px0, py1 - py0, H.main);
    rr(c, px0 + 1, py0, px1 - px0 - 2, 1, H.light);
    rr(c, px0, py1 - 2, px1 - px0, 2, H.shade);
    for (var rx = px0 + 4; rx < px1 - 2; rx += 8) { pp(c, rx, py0 + 2, H.shade); pp(c, rx, py1 - 3, H.light); }
    // nose cone (front, to the right): a curved wedge with a cockpit window
    var nx = px1, nh = py1 - py0;
    var tip = Math.floor(nh * 0.42), span = Math.max(tip, nh - tip);
    for (var yy = 0; yy < nh; yy++) {
      var f = Math.abs(yy - tip) / span;
      var nw = Math.round(g.noseW * Math.pow(Math.max(0, 1 - f), 0.6));
      if (nw <= 0) continue;
      rr(c, nx, py0 + yy, nw, 1, yy > tip + 2 ? H.shade : H.main);
      if (yy === 0 || yy < tip - 2) pp(c, nx + nw - 1, py0 + yy, H.light);
      pp(c, nx + nw, py0 + yy, 0);
    }
    var wy = py0 + Math.max(3, tip - 9);
    for (var gy = 0; gy < 6; gy++) {
      var gx0 = nx + 1, gw = Math.max(2, Math.round(g.noseW * Math.pow(Math.max(0, 1 - Math.abs(wy + gy - py0 - tip) / span), 0.6)) - 5);
      rr(c, gx0, wy + gy, gw, 1, gy === 0 ? 0 : (gy < 2 ? 7 : 12));
      pp(c, gx0 + gw, wy + gy, 0);
    }
    rr(c, nx, py0 + tip + 3, Math.floor(g.noseW * 0.6), 1, H.trim);
    rr(c, nx, py0, 1, nh, H.shade);
    // engines (back, to the left) - one per deck
    var decks = {};
    unlocked.forEach(function (cc) { var y = cc.y - g.oy + by; if (!decks[y] || cc.x - g.ox + bx < decks[y]) decks[y] = cc.x - g.ox + bx; });
    Object.keys(decks).forEach(function (k) {
      var y = +k, ex = minX - 4 - g.engW;
      R.box(ex + 3, y + 9, g.engW - 2, 14, 0, c.x);
      rr(c, ex + 4, y + 10, g.engW - 4, 12, H.shade);
      rr(c, ex + 4, y + 10, g.engW - 4, 1, H.main);
      for (var nzz = 0; nzz < 4; nzz++) { rr(c, ex - nzz, y + 11 - nzz, 1, 10 + nzz * 2, nzz === 3 ? 0 : 5); }
      rr(c, ex - 3, y + 9, 1, 14, 0);
      rr(c, ex + 6, y + 14, 4, 2, H.trim);
    });
    // antenna on top of the bridge
    var b0 = g.cells[0];
    var ax = b0.x - g.ox + bx + 30, ay = py0;
    rr(c, ax, ay - 7, 1, 7, 6); rr(c, ax - 2, ay - 2, 5, 2, H.shade); rr(c, ax - 3, ay - 7, 7, 1, 6);
    // walls behind the rooms
    rr(c, minX, minY, maxX - minX, maxY - minY, H.shade);
    // locked cells inside the bounding box: solid plating
    for (var yy2 = minY; yy2 < maxY - 2; yy2 += CH) for (var xx = minX; xx < maxX - 2; xx += CW) {
      var isCell = unlocked.some(function (cc) { return cc.x - g.ox + bx === xx && cc.y - g.oy + by === yy2; });
      if (isCell) continue;
      rr(c, xx, yy2, CW + 2, CH + 2, H.main);
      for (var k2 = 0; k2 < 4; k2++) pp(c, xx + 4 + k2 * 12, yy2 + 4, H.shade);
      rr(c, xx + 2, yy2 + CH / 2, CW - 2, 1, H.shade);
    }
    c.hull = H;
    V.hullKey = key; V.hullCanvas = c;
    return c;
  }

  // ================================================================== scene
  Ship.enter = function (params) {
    V.t = V.t || 0;
    if (!V.stars) V.stars = Spr.makeStarfield(3, 220);
    DH.Snd.setMusic('ship');
    V.floats = [];
    if (params && params.fromRun && DH.Prog) DH.Prog.afterRun(params.fromRun);
    if (params && params.fromTitle && DH.G.pendingWelcome) {
      var w = DH.G.pendingWelcome; DH.G.pendingWelcome = null;
      setTimeout(function () { if (DH.G.sceneName === 'ship' && !DH.G.panel) DH.G.openPanel('welcome', w); }, 450);
    }
  };
  Ship.resize = function () { V.hullKey = ''; };

  Ship.build = function (slot) { V.building[slot] = 1.2; };

  Ship.update = function (dt) {
    var s = DH.G.state;
    V.t += dt;
    if (UI.enabled && !DH.G.panel && !DH.G.trans && In.key(' ', 'l')) { DH.Snd.play('click'); DH.G.requestLaunch(); }
    Crew.update(s, dt, Ship.stations, V.t);
    Crew.post(s);
    // floating "+1" production popups
    for (var i = 0; i < s.slots.length; i++) {
      var r = s.slots[i];
      if (!r) continue;
      var def = D.ROOMS[r.type];
      if (def.rate && !r.starved) {
        V.acc[i] = (V.acc[i] || 0) + Sim.roomRate(s, i) * dt / 60;
        if (V.acc[i] >= 1) { V.acc[i] -= 1; V.floats.push({ slot: i, icon: D.resIcon(def.makes), t: 0 }); }
      }
      if (V.building[i] > 0) V.building[i] -= dt;
    }
    V.floats = V.floats.filter(function (f) { f.t += dt; return f.t < 1.6; });
  };

  function sectorBackdrop(s) {
    var sec = D.sector(s.sector);
    R.clear(sec.bg);
    var neb = Spr.makeNebula(256, 256, 60 + sec.id, sec.neb, sec.neb2);
    Spr.drawNebula(neb, V.t * 2, 0);
    V.stars.draw(V.t * 7, 0, V.t);
    var pid = sec.planets[0];
    var pr = Math.max(18, Math.floor(Math.min(R.W, R.H) * 0.16));
    var pf = Spr.planetFrame(D.PLANETS[pid], pr, V.t * 0.006);
    if (R.portrait) R.img(pf, R.W - pf.width * 0.7, R.H - DH.G.barH - pf.height * 0.75);
    else R.img(pf, R.W - pf.width * 0.78, -pf.height * 0.18);
    if (sec.planets[1]) {
      var pf2 = Spr.planetFrame(D.PLANETS[sec.planets[1]], Math.floor(pr * 0.45), V.t * 0.01);
      R.img(pf2, R.portrait ? 8 : R.W * 0.08, R.portrait ? R.H * 0.62 : R.H - DH.G.barH - pf2.height - 4);
    }
  }

  // resource strip + goals; returns the y where the ship area can start
  function drawHud(s) {
    var keys = D.RES_ORDER.filter(function (k) {
      if (D.ORES[k]) return s.seen.ores[k] || s.res[k] >= 1;
      if (k === 'food') return s.res.food >= 1 || Sim.findSlot(s, 'hydroponics') >= 0;
      if (k === 'alloy') return s.res.alloy >= 1 || Sim.findSlot(s, 'refinery') >= 0;
      if (k === 'data') return s.res.data >= 1 || Sim.findSlot(s, 'lab') >= 0 || Sim.findSlot(s, 'observatory') >= 0;
      return false;
    });
    var x = 3, y = 2, rowH = 9;
    var items = [];
    keys.forEach(function (k) {
      var txt = U.fmt(s.res[k]);
      var w = 8 + F.measure(txt, 'small') + 5;
      if (x + w > R.W - 3) { x = 3; y += rowH; }
      items.push({ k: k, x: x, y: y, txt: txt });
      x += w;
    });
    var stripH = y + rowH + 1;
    R.rect(0, 0, R.W, stripH, 0);
    R.rect(0, stripH, R.W, 1, 1);
    items.forEach(function (it) {
      R.img(Spr.icon(D.resIcon(it.k)), it.x, it.y);
      F.draw(R.ctx, it.txt, it.x + 8, it.y + 1, 7, { font: 'small', shadow: 0 });
    });
    if (!items.length) F.draw(R.ctx, 'HOLD EMPTY - LAUNCH THE DRONE!', 3, 3, 13, { font: 'small' });
    Ship.stripRect = { x: 0, y: 0, w: R.W, h: stripH };
    if (UI.enabled && !DH.G.panel && UI.hit('ship:hold', 0, 0, R.W, stripH) && items.length) DH.G.openPanel('hold');
    var gy = stripH + 2;
    var sec = D.sector(s.sector);
    F.drawOutlined(R.ctx, sec.name, R.W - 3, gy, 13, 0, { font: 'small', align: 'right' });
    if (DH.Prog) gy = DH.Prog.drawGoals(3, gy);
    return gy + 2;
  }

  Ship.draw = function () {
    var s = DH.G.state, t = V.t;
    sectorBackdrop(s);
    Ship.hudBottom = Ship.hudBottomCache || 36;
    var g = Ship.geometry(s);
    V.geom = g;
    var bob = Math.floor(t * 0.8) % 2;
    var hc = hullCanvas(s, g);
    var hx = g.ox - hc.bx, hy = g.oy - hc.by + bob;
    // engine flames
    var H = hc.hull;
    R.img(hc, hx, hy);
    var canClick = UI.enabled && !DH.G.panel;
    g.cells.forEach(function (cell) {
      var x = cell.x, y = cell.y + bob;
      var ix = x + 2, iy = y + 2;
      cell.sx = ix; cell.sy = iy;
      if (cell.ghost) {
        drawGhost(s, cell, ix, iy, canClick);
        return;
      }
      var room = s.slots[cell.slot];
      if (!room) { drawEmpty(s, cell, ix, iy, canClick); return; }
      R.img(Ship.roomImage(room.type, room.lvl), ix, iy);
      Ship.drawRoomAnim(room.type, ix, iy, room.lvl, t, room, s);
      if (room.decor) {
        var sp = DECOR_SPOT[room.type] || { x: 30, y: 26 };
        var dimg = Spr.decor(room.decor, room.decor === 'cat' ? Math.floor(t * 2) % 2 : 0);
        R.img(dimg, ix + sp.x, iy + sp.y - dimg.height);
        if (room.decor === 'disco') for (var k = 0; k < 4; k++) R.pset(ix + Math.floor((t * 17 + k * 11) % IW), iy + 3 + (k * 7) % 20, [7, 12, 14, 10][k]);
        if (room.decor === 'lamp' && Math.floor(t * 2) % 2) R.pset(ix + sp.x + 3, iy + sp.y - 6, 14);
        if (room.decor === 'fishtank') { var fx = Math.floor((t * 6) % 7); R.pset(ix + sp.x + 1 + fx, iy + sp.y - 6, 9); }
        if (room.decor === 'orb') R.pset(ix + sp.x + 3, iy + sp.y - 6, Math.floor(t * 4) % 2 ? 7 : 14);
      }
      // crew in this room
      s.crew.forEach(function (c) {
        var a = Crew.actor(c);
        if (a.slot === cell.slot) Crew.draw(c, ix, iy, iy + FLOOR, t);
      });
      // build sparkle
      if (V.building[cell.slot] > 0) {
        for (var b = 0; b < 10; b++) R.pset(ix + Math.random() * IW, iy + Math.random() * IH, U.pick([7, 10, 12]));
        if (V.building[cell.slot] > 0.8) R.dither(ix, iy, IW, IH, 7);
      }
      // label + badges
      drawBadges(s, cell, room, ix, iy);
      if (canClick && UI.hit('room:' + cell.slot, ix, iy, IW, IH)) { DH.Snd.play('click'); DH.G.openPanel('room', { slot: cell.slot }); }
      if (UI.hover(ix, iy, IW, IH) && canClick) R.frame(ix - 1, iy - 1, IW + 2, IH + 2, 7);
    });
    // engine flames + lights
    var decks = {};
    g.cells.forEach(function (c) { if (!c.ghost && (!decks[c.y] || c.x < decks[c.y])) decks[c.y] = c.x; });
    var minX = Math.min.apply(null, g.cells.filter(function (c) { return !c.ghost; }).map(function (c) { return c.x; }));
    Object.keys(decks).forEach(function (k) {
      var y = +k + bob;
      var ex = minX - 4 - g.engW - 3;
      var fl = Math.floor(t * 14 + y) % 3;
      R.rect(ex - 3 - fl, y + 13, 3 + fl, 6, fl === 0 ? 10 : 9);
      R.rect(ex - 1 - fl, y + 14, 2 + fl, 4, 10);
      R.pset(ex - 5 - fl, y + 15, 8);
    });
    var b0 = g.cells[0];
    if (Math.floor(t * 1.5) % 2) R.pset(b0.x + 32, b0.y - 11 + bob, 8);
    R.pset(minX - 3, g.oy - 3 + bob, Math.floor(t * 2.3) % 2 ? 11 : 3);
    // floating production icons
    V.floats.forEach(function (f) {
      var cell = g.cells[f.slot];
      if (!cell || cell.ghost) return;
      if (f.t > 1.2 && Math.floor(f.t * 10) % 2) return;
      var fx = cell.sx + IW - 12, fy = cell.sy + 8 - Math.floor(f.t * 8);
      R.img(Spr.icon(f.icon), fx, fy);
      F.drawOutlined(R.ctx, '+1', fx + 8, fy + 1, 7, 0, { font: 'small' });
    });
    var hb = drawHud(s);
    Ship.hudBottomCache = hb;
  };

  function drawEmpty(s, cell, ix, iy, canClick) {
    R.rect(ix, iy, IW, IH, 0);
    R.dither(ix, iy, IW, IH, 1);
    var on = Math.floor(V.t * 2) % 2;
    R.dline(ix + 1, iy + 1, ix + IW - 2, iy + 1, 13, V.t * 6); R.dline(ix + 1, iy + IH - 2, ix + IW - 2, iy + IH - 2, 13, V.t * 6);
    R.dline(ix + 1, iy + 1, ix + 1, iy + IH - 2, 13, V.t * 6); R.dline(ix + IW - 2, iy + 1, ix + IW - 2, iy + IH - 2, 13, V.t * 6);
    var can = Sim.buildable(s).some(function (t) { return Sim.canAfford(s, Sim.buildCost(t)); });
    R.img(Spr.icon('plus'), ix + 17, iy + 7);
    F.draw(R.ctx, 'BUILD', ix + IW / 2, iy + 17, can && on ? 11 : 6, { font: 'small', align: 'center' });
    if (canClick && UI.hit('room:' + cell.slot, ix, iy, IW, IH)) { DH.Snd.play('click'); DH.G.openPanel('build', { slot: cell.slot }); }
    if (UI.hover(ix, iy, IW, IH) && canClick) R.frame(ix - 1, iy - 1, IW + 2, IH + 2, 7);
  }

  function drawGhost(s, cell, ix, iy, canClick) {
    var ok = Sim.canExpand(s);
    var cost = Sim.hullCost(s);
    var afford = ok && Sim.canAfford(s, cost);
    var col = afford ? 11 : 5;
    R.dline(ix - 2, iy - 2, ix + IW + 1, iy - 2, col, V.t * 5); R.dline(ix - 2, iy + IH + 1, ix + IW + 1, iy + IH + 1, col, V.t * 5);
    R.dline(ix - 2, iy - 2, ix - 2, iy + IH + 1, col, V.t * 5); R.dline(ix + IW + 1, iy - 2, ix + IW + 1, iy + IH + 1, col, V.t * 5);
    if (ok) {
      R.img(Spr.icon(afford ? 'plus' : 'hull'), ix + 17, iy + 6);
      F.drawOutlined(R.ctx, 'EXPAND', ix + IW / 2, iy + 16, afford ? 11 : 6, 0, { font: 'small', align: 'center' });
    } else {
      R.img(Spr.icon('lock'), ix + 17, iy + 6);
      F.drawOutlined(R.ctx, 'BRIDGE LV' + (Sim.level(s, 'bridge') + 1), ix + IW / 2, iy + 16, 6, 0, { font: 'small', align: 'center' });
    }
    if (canClick && UI.hit('ghost', ix - 2, iy - 2, IW + 4, IH + 4)) { DH.Snd.play('click'); DH.G.openPanel('expand', {}); }
  }

  function drawBadges(s, cell, room, ix, iy) {
    var def = D.ROOMS[room.type];
    // level pips
    for (var i = 0; i < room.lvl; i++) R.pset(ix + 2 + i * 2, iy + IH - 2, 10);
    var cost = Sim.upgradeCost(s, cell.slot);
    if (cost && Sim.canAfford(s, cost)) {
      var by = iy + 3 + (Math.floor(V.t * 3) % 2);
      R.box(ix + IW - 9, by - 1, 9, 9, 0);
      R.img(Spr.icon('up'), ix + IW - 8, by);
    }
    if (room.type === 'refinery' && room.starved) {
      if (Math.floor(V.t * 2) % 2) { R.img(Spr.icon('cu'), ix + IW - 9, iy + 12); F.drawOutlined(R.ctx, '!', ix + IW - 11, iy + 12, 8, 0, { font: 'small' }); }
    }
    if (room.type === 'workshop' && s.job) {
      UI.bar(ix + 4, iy + 3, 20, 4, s.job.work / s.job.need, 11, 0);
    }
    if (room.type === 'workshop' && !s.job && Sim.partCap(s) > 0 && D.PART_ORDER.some(function (p) {
      return s.parts[p] < Sim.partCap(s) && Sim.canAfford(s, Sim.partNextCost(s, p));
    })) {
      if (Math.floor(V.t * 2) % 2) R.img(Spr.icon('drill'), ix + 3, iy + 3);
    }
    if (UI.hover(ix, iy, IW, IH)) F.drawOutlined(R.ctx, def.short, ix + IW / 2, iy - 7, 7, 0, { font: 'small', align: 'center' });
  }

  // rect of a room on screen (used by tutorial arrows)
  Ship.slotRect = function (slot) {
    var g = V.geom;
    if (!g) return null;
    var c = g.cells[slot];
    if (!c || c.sx === undefined) return null;
    return { x: c.sx, y: c.sy, w: IW, h: IH };
  };
  Ship.ghostRect = function () {
    var g = V.geom; if (!g) return null;
    var c = g.cells.filter(function (x) { return x.ghost; })[0];
    return c && c.sx !== undefined ? { x: c.sx, y: c.sy, w: IW, h: IH } : null;
  };

  DH.Scenes.ship = Ship;
  DH.ShipView = Ship;
})(window.DH);
