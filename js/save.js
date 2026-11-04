// DRIFTHOLD - save.js
// Versioned save data in localStorage + text export/import codes.
(function (DH) {
  'use strict';
  var Save = {};
  var KEY = 'drifthold.save';
  Save.VERSION = 2;

  Save.defaultState = function () {
    var now = Date.now();
    var res = {};
    DH.D.RES_ORDER.forEach(function (k) { res[k] = 0; });
    return {
      v: Save.VERSION,
      created: now, lastTick: now, lastSeen: now,
      res: res,
      stats: {
        runs: 0, mined: {}, bestHaul: 0, totalOre: 0, hits: 0, cells: 0, perfectRuns: 0,
        produced: { food: 0, alloy: 0, data: 0 }, playTime: 0, dailyDone: 0, recruited: 0, trades: 0,
        upgrades: 0, builds: 0, partsBuilt: 0
      },
      hull: 2,
      slots: [{ type: 'bridge', lvl: 1, decor: null }, null],
      blueprints: { bridge: true, quarters: true },
      crew: [], crewSerial: 0,
      parts: { fuel: 0, cargo: 0, drill: 0, magnet: 0, shield: 0 },
      job: null,
      research: {},
      chassis: 'standard', paint: 'classic', hullColor: 'steel',
      owned: { chassis: { standard: true }, paint: { classic: true }, hull: { steel: true }, decor: {} },
      sector: 1, revealed: 1, visited: {}, recruits: {}, bought: {},
      seen: { ores: {}, traits: {}, sectors: { 1: true } },
      goals: [], goalSerial: 0, goalsDone: 0,
      tut: { seen: {}, done: {} },
      unlocked: { ship: true, launch: true, map: false, log: false, goals: false, daily: false },
      daily: { last: null, count: 0 },
      galleyFed: false,
      settings: { sfx: true, music: true, shake: true }
    };
  };

  // fill in anything missing from older saves without clobbering what's there
  function fillDefaults(target, def) {
    for (var k in def) {
      if (!Object.prototype.hasOwnProperty.call(def, k)) continue;
      if (target[k] === undefined) target[k] = def[k];
      else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) {
        fillDefaults(target[k], def[k]);
      }
    }
    return target;
  }

  // version migrations. Each step upgrades v -> v+1.
  var MIGRATIONS = {
    1: function (s) {
      // v1 had no per-planet purchase record
      s.bought = s.bought || {};
      s.v = 2;
    }
  };

  Save.migrate = function (s) {
    if (!s || typeof s !== 'object') return null;
    var guard = 0;
    while ((s.v || 1) < Save.VERSION && guard++ < 50) {
      var fn = MIGRATIONS[s.v || 1];
      if (fn) fn(s); else s.v = (s.v || 1) + 1;
    }
    fillDefaults(s, Save.defaultState());
    // sanity
    if (!Array.isArray(s.slots)) s.slots = [{ type: 'bridge', lvl: 1, decor: null }, null];
    while (s.slots.length < s.hull) s.slots.push(null);
    DH.D.RES_ORDER.forEach(function (k) { if (typeof s.res[k] !== 'number' || isNaN(s.res[k])) s.res[k] = 0; });
    return s;
  };

  Save.load = function () {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return Save.migrate(JSON.parse(raw));
    } catch (e) {
      console.warn('save load failed', e);
      return null;
    }
  };

  Save.write = function (state) {
    if (!state) return false;
    try {
      state.lastSeen = Date.now();
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('save failed', e);
      return false;
    }
  };

  Save.wipe = function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  };

  function checksum(str) { return (DH.U.hash(str) % 46656).toString(36).toUpperCase(); }

  Save.exportCode = function (state) {
    var json = JSON.stringify(state);
    var b64 = btoa(unescape(encodeURIComponent(json)));
    return 'DH' + Save.VERSION + '-' + checksum(b64) + '-' + b64;
  };

  Save.importCode = function (code) {
    try {
      code = String(code || '').trim().replace(/\s+/g, '');
      var m = /^DH(\d+)-([0-9A-Z]+)-(.+)$/.exec(code);
      if (!m) return { ok: false, err: 'NOT A DRIFTHOLD CODE' };
      if (checksum(m[3]) !== m[2]) return { ok: false, err: 'CODE IS DAMAGED' };
      var json = decodeURIComponent(escape(atob(m[3])));
      var s = Save.migrate(JSON.parse(json));
      if (!s) return { ok: false, err: 'COULD NOT READ CODE' };
      return { ok: true, state: s };
    } catch (e) {
      return { ok: false, err: 'COULD NOT READ CODE' };
    }
  };

  DH.Save = Save;
})(typeof window !== 'undefined' ? (window.DH = window.DH || {}) : (global.DH = global.DH || {}));
