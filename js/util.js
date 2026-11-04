// DRIFTHOLD - util.js : small helpers (rng, maths, formatting, dates)
(function (DH) {
  'use strict';
  var U = {};
  U.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.rng = function (seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.hash = function (str) {
    str = String(str);
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  U.rand = function (a, b) { return a + Math.random() * (b - a); };
  U.randi = function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); };
  U.pick = function (arr, r) { return arr[Math.floor((r || Math.random)() * arr.length)]; };
  U.weighted = function (obj, r) {
    var total = 0, k;
    for (k in obj) total += obj[k];
    var x = (r || Math.random)() * total;
    for (k in obj) { x -= obj[k]; if (x <= 0) return k; }
    return k;
  };
  U.shuffle = function (arr, r) {
    r = r || Math.random;
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  };
  U.dist = function (ax, ay, bx, by) { var dx = bx - ax, dy = by - ay; return Math.sqrt(dx * dx + dy * dy); };
  U.angleDiff = function (a, b) { var d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  U.easeOutCubic = function (t) { t = 1 - t; return 1 - t * t * t; };
  U.easeOutBack = function (t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  U.easeInOut = function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; };
  U.fmt = function (n) {
    n = Math.floor(n);
    if (n < 10000) return String(n);
    if (n < 1e6) return (n / 1000).toFixed(n < 1e5 ? 1 : 0).replace('.0', '') + 'K';
    return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
  };
  U.fmtTime = function (s) {
    s = Math.max(0, Math.floor(s));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return h + 'H ' + m + 'M';
    if (m > 0) return m + 'M ' + (sec < 10 ? '0' : '') + sec + 'S';
    return sec + 'S';
  };
  U.dayKey = function (d) {
    d = d || new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  };
  U.dayNumber = function (d) {
    d = d || new Date();
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  };
  U.now = function () { return Date.now(); };
  DH.U = U;
  DH.Scenes = DH.Scenes || {};
  DH.Panels = DH.Panels || {};
})(window.DH = window.DH || {});
