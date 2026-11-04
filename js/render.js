// DRIFTHOLD - render.js
// One canvas at a low logical resolution, scaled up by an integer factor (device pixels)
// with nearest-neighbour. All drawing helpers snap to whole pixels.
(function (DH) {
  'use strict';
  var R = { W: 320, H: 180, scale: 1, t: 0, shake: 0, shakeX: 0, shakeY: 0, resizeId: 0 };
  var canvas, ctx;

  R.init = function (cv) {
    canvas = cv;
    ctx = canvas.getContext('2d', { alpha: false });
    R.ctx = ctx;
    R.canvas = canvas;
    R.resize();
  };

  R.resize = function () {
    var wrap = canvas.parentElement;
    var cs = getComputedStyle(wrap);
    var availW = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var availH = wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var dpr = window.devicePixelRatio || 1;
    var pw = Math.max(1, Math.floor(availW * dpr)), ph = Math.max(1, Math.floor(availH * dpr));
    var portrait = ph > pw * 1.1;
    var minW = portrait ? 180 : 320, minH = portrait ? 300 : 180;
    var scale = Math.max(1, Math.floor(Math.min(pw / minW, ph / minH)));
    var lw = Math.floor(pw / scale), lh = Math.floor(ph / scale);
    // keep the view from getting absurdly wide or tall
    lw = Math.min(lw, Math.max(minW, Math.floor(lh * 2.4)));
    lh = Math.min(lh, Math.max(minH, Math.floor(lw * 2.4)));
    if (lw !== R.W || lh !== R.H || scale !== R.scale || !R.resizeId) {
      canvas.width = lw; canvas.height = lh;
      R.W = lw; R.H = lh; R.scale = scale;
      R.resizeId++;
    }
    canvas.style.width = (lw * scale / dpr) + 'px';
    canvas.style.height = (lh * scale / dpr) + 'px';
    ctx.imageSmoothingEnabled = false;
    R.portrait = lh > lw;
    R.dpr = dpr;
  };

  R.makeCanvas = function (w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0);
    var x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    c.x = x;
    return c;
  };

  // ---------- primitives (all take palette indices) ----------
  R.rect = function (x, y, w, h, c, cx) {
    cx = cx || ctx;
    cx.fillStyle = DH.PAL[c];
    cx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  R.pset = function (x, y, c, cx) {
    cx = cx || ctx;
    cx.fillStyle = DH.PAL[c];
    cx.fillRect(Math.round(x), Math.round(y), 1, 1);
  };
  R.clear = function (c) { R.rect(0, 0, R.W, R.H, c || 0); };
  R.frame = function (x, y, w, h, c, cx) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    R.rect(x, y, w, 1, c, cx); R.rect(x, y + h - 1, w, 1, c, cx);
    R.rect(x, y, 1, h, c, cx); R.rect(x + w - 1, y, 1, h, c, cx);
  };
  // rectangle with the four corner pixels cut (chunky pixel-art box)
  R.box = function (x, y, w, h, c, cx) {
    R.rect(x + 1, y, w - 2, h, c, cx);
    R.rect(x, y + 1, 1, h - 2, c, cx);
    R.rect(x + w - 1, y + 1, 1, h - 2, c, cx);
  };
  R.line = function (x0, y0, x1, y1, c, cx) {
    cx = cx || ctx;
    cx.fillStyle = DH.PAL[c];
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy, n = 0;
    while (n++ < 2000) {
      cx.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };
  // dotted line (every other pixel), used for map routes and dashed outlines
  R.dline = function (x0, y0, x1, y1, c, phase, cx) {
    cx = cx || ctx;
    cx.fillStyle = DH.PAL[c];
    var len = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (var i = 0; i <= len; i++) {
      if (((i + (phase | 0)) & 3) > 1) continue;
      var t = len ? i / len : 0;
      cx.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), 1, 1);
    }
  };
  R.circ = function (xc, yc, r, c, cx) {
    cx = cx || ctx;
    cx.fillStyle = DH.PAL[c];
    xc = Math.round(xc); yc = Math.round(yc);
    if (r < 0.5) { cx.fillRect(xc, yc, 1, 1); return; }
    for (var y = -Math.floor(r); y <= Math.floor(r); y++) {
      var hw = Math.floor(Math.sqrt(r * r - y * y) + 0.5);
      cx.fillRect(xc - hw, yc + y, hw * 2 + 1, 1);
    }
  };
  R.ring = function (xc, yc, r, c, cx) {
    cx = cx || ctx;
    cx.fillStyle = DH.PAL[c];
    xc = Math.round(xc); yc = Math.round(yc);
    var x = Math.round(r), y = 0, err = 1 - x;
    while (x >= y) {
      var pts = [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]];
      for (var i = 0; i < 8; i++) cx.fillRect(xc + pts[i][0], yc + pts[i][1], 1, 1);
      y++;
      if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
    }
  };
  // 50% checkerboard fill - the only way we "dim" things without leaving the palette
  var ditherCache = {};
  R.dither = function (x, y, w, h, c, cx, phase) {
    cx = cx || ctx;
    var key = c + ':' + (phase ? 1 : 0);
    var pat = ditherCache[key];
    if (!pat) {
      var p = R.makeCanvas(2, 2);
      p.x.fillStyle = DH.PAL[c];
      if (phase) { p.x.fillRect(1, 0, 1, 1); p.x.fillRect(0, 1, 1, 1); }
      else { p.x.fillRect(0, 0, 1, 1); p.x.fillRect(1, 1, 1, 1); }
      pat = ditherCache[key] = ctx.createPattern(p, 'repeat');
    }
    cx.fillStyle = pat;
    cx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  // sparse 25% dither
  var sparseCache = {};
  R.dither25 = function (x, y, w, h, c, cx) {
    cx = cx || ctx;
    var pat = sparseCache[c];
    if (!pat) {
      var p = R.makeCanvas(2, 2);
      p.x.fillStyle = DH.PAL[c];
      p.x.fillRect(0, 0, 1, 1);
      pat = sparseCache[c] = ctx.createPattern(p, 'repeat');
    }
    cx.fillStyle = pat;
    cx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  R.img = function (im, x, y, cx) {
    if (!im) return;
    (cx || ctx).drawImage(im, Math.round(x), Math.round(y));
  };
  // draw centred on (x,y)
  R.imgC = function (im, x, y, cx) {
    if (!im) return;
    (cx || ctx).drawImage(im, Math.round(x - im.width / 2), Math.round(y - im.height / 2));
  };

  // ---------- sprites ----------
  // rows: array of strings. '.' or ' ' = transparent, hex digit = palette index.
  // map: optional { char: paletteIndex } to recolour template chars.
  R.sprite = function (rows, map) {
    var h = rows.length, w = 0, i;
    for (i = 0; i < h; i++) w = Math.max(w, rows[i].length);
    var c = R.makeCanvas(w, h);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        var ch = rows[y][x];
        if (ch === '.' || ch === ' ') continue;
        var col;
        if (map && map[ch] !== undefined) col = map[ch];
        else col = parseInt(ch, 16);
        if (col === undefined || col === null || col < 0 || isNaN(col)) continue;
        c.x.fillStyle = DH.PAL[col];
        c.x.fillRect(x, y, 1, 1);
      }
    }
    return c;
  };
  // grid: 2D array of palette indices (-1 = transparent)
  R.fromGrid = function (grid) {
    var h = grid.length, w = grid[0].length;
    var c = R.makeCanvas(w, h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var v = grid[y][x];
      if (v < 0) continue;
      c.x.fillStyle = DH.PAL[v];
      c.x.fillRect(x, y, 1, 1);
    }
    return c;
  };
  R.flipH = function (src) {
    var c = R.makeCanvas(src.width, src.height);
    c.x.translate(src.width, 0); c.x.scale(-1, 1);
    c.x.drawImage(src, 0, 0);
    return c;
  };
  // read pixels through one CPU-side scratch canvas so sprite canvases stay GPU-friendly
  var scratch = null;
  R.readPixels = function (src) {
    var w = src.width, h = src.height;
    if (!scratch) { scratch = document.createElement('canvas'); scratch.x = scratch.getContext('2d', { willReadFrequently: true }); }
    if (scratch.width < w || scratch.height < h) { scratch.width = Math.max(scratch.width, w); scratch.height = Math.max(scratch.height, h); }
    scratch.x.clearRect(0, 0, w, h);
    scratch.x.drawImage(src, 0, 0);
    return scratch.x.getImageData(0, 0, w, h);
  };
  // nearest-neighbour rotation: keeps every pixel a palette pixel (no smoothing)
  R.rotate = function (src, ang) {
    var w = src.width, h = src.height;
    var size = Math.ceil(Math.sqrt(w * w + h * h)) | 1;
    var sd = R.readPixels(src);
    var out = R.makeCanvas(size, size);
    var od = out.x.createImageData(size, size);
    var cs = Math.cos(-ang), sn = Math.sin(-ang);
    var cx0 = (size - 1) / 2, cy0 = (size - 1) / 2, sx0 = (w - 1) / 2, sy0 = (h - 1) / 2;
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
      var dx = x - cx0, dy = y - cy0;
      var sx = Math.round(dx * cs - dy * sn + sx0), sy = Math.round(dx * sn + dy * cs + sy0);
      if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
      var si = (sy * w + sx) * 4, oi = (y * size + x) * 4;
      if (sd.data[si + 3] < 128) continue;
      od.data[oi] = sd.data[si]; od.data[oi + 1] = sd.data[si + 1]; od.data[oi + 2] = sd.data[si + 2]; od.data[oi + 3] = 255;
    }
    out.x.putImageData(od, 0, 0);
    return out;
  };
  // a solid-colour silhouette of a sprite (for undiscovered logbook entries, flashes, outlines)
  R.silhouette = function (src, col) {
    var c = R.makeCanvas(src.width, src.height);
    c.x.drawImage(src, 0, 0);
    c.x.globalCompositeOperation = 'source-in';
    c.x.fillStyle = DH.PAL[col];
    c.x.fillRect(0, 0, src.width, src.height);
    return c;
  };
  // 1px outline around a sprite
  R.outlined = function (src, col) {
    var sil = R.silhouette(src, col);
    var c = R.makeCanvas(src.width + 2, src.height + 2);
    [[0, 1], [2, 1], [1, 0], [1, 2]].forEach(function (o) { c.x.drawImage(sil, o[0], o[1]); });
    c.x.drawImage(src, 1, 1);
    return c;
  };
  // recolour a canvas by palette mapping {from: to}
  R.recolor = function (src, map) {
    var w = src.width, h = src.height;
    var c = R.makeCanvas(w, h);
    var d = R.readPixels(src);
    var lookup = {};
    for (var k in map) { var rgb = DH.RGB[k]; lookup[(rgb[0] << 16) | (rgb[1] << 8) | rgb[2]] = DH.RGB[map[k]]; }
    for (var i = 0; i < d.data.length; i += 4) {
      if (d.data[i + 3] < 128) continue;
      var key = (d.data[i] << 16) | (d.data[i + 1] << 8) | d.data[i + 2];
      var to = lookup[key];
      if (to) { d.data[i] = to[0]; d.data[i + 1] = to[1]; d.data[i + 2] = to[2]; }
    }
    c.x.putImageData(d, 0, 0);
    return c;
  };

  // ---------- screen shake ----------
  R.addShake = function (amt) {
    if (DH.G && DH.G.state && DH.G.state.settings && DH.G.state.settings.shake === false) return;
    R.shake = Math.max(R.shake, amt);
  };
  R.updateShake = function (dt) {
    if (R.shake > 0.1) {
      R.shakeX = Math.round((Math.random() * 2 - 1) * R.shake);
      R.shakeY = Math.round((Math.random() * 2 - 1) * R.shake);
      R.shake *= Math.pow(0.0015, dt);
    } else { R.shake = 0; R.shakeX = 0; R.shakeY = 0; }
  };

  // dithered dim of the whole screen (for modal panels)
  R.dim = function () { R.dither(0, 0, R.W, R.H, 0); };

  DH.R = R;
})(window.DH = window.DH || {});
