// DRIFTHOLD - ui.js
// Immediate-mode pixel UI: chunky buttons with a pressed state, panels, tabs, scroll lists,
// cost rows, toasts and tutorial tooltips. Drawn and hit-tested in the same pass.
(function (DH) {
  'use strict';
  var R = DH.R, F = DH.Font, In = DH.In, U = DH.U;
  var UI = {
    active: null,         // id of the button currently held down
    enabled: true,        // false = everything below a blocking overlay ignores input
    clip: null,           // current scroll clip rect {x,y,w,h}
    toasts: [],
    scroll: {},           // scroll offsets by id
    hoverId: null,
    t: 0
  };

  var STYLES = {
    normal: { face: 13, light: 6, depth: 2, text: 7, shadow: 1 },
    primary: { face: 12, light: 6, depth: 1, text: 7, shadow: 1 },
    good: { face: 11, light: 7, depth: 3, text: 1, shadow: null },
    warm: { face: 9, light: 10, depth: 4, text: 7, shadow: 4 },
    danger: { face: 8, light: 14, depth: 2, text: 7, shadow: 2 },
    dark: { face: 1, light: 13, depth: 0, text: 6, shadow: 0 },
    off: { face: 5, light: 13, depth: 0, text: 6, shadow: 0 },
    tab: { face: 1, light: 13, depth: 0, text: 13, shadow: 0 },
    tabOn: { face: 13, light: 6, depth: 2, text: 7, shadow: 1 }
  };
  UI.STYLES = STYLES;

  UI.hits = []; UI.prevHits = [];
  UI.begin = function (dt) {
    UI.t += dt;
    UI.prevHits = UI.hits; UI.hits = [];
    if (In.pressed) UI.pressConsumed = false;
  };
  UI.end = function () {
    if (In.released || (!In.down && UI.active)) UI.active = null;
  };

  function inside(x, y, rx, ry, rw, rh) {
    if (!In.inRect(x, y, rx, ry, rw, rh)) return false;
    if (UI.clip && !In.inRect(x, y, UI.clip.x, UI.clip.y, UI.clip.w, UI.clip.h)) return false;
    return true;
  }
  UI.inside = inside;

  // generic invisible hit area. returns true on click (press+release inside).
  UI.hit = function (id, x, y, w, h, opts) {
    opts = opts || {};
    if (!UI.enabled && !opts.force) return false;
    UI.hits.push({ id: id, x: x, y: y, w: w, h: h, clip: UI.clip });
    var clicked = false;
    if (In.pressed && !UI.pressConsumed && inside(In.px, In.py, x, y, w, h)) {
      UI.active = id;
      UI.pressConsumed = true;
    }
    if (UI.active === id && In.drag > 6 && UI.clip) {
      // dragging inside a scroll area cancels the press
      UI.active = null;
    }
    if (In.released && UI.active === id && inside(In.rx, In.ry, x, y, w, h)) {
      clicked = true;
      UI.active = null;
    }
    return clicked;
  };
  UI.isDown = function (id, x, y, w, h) {
    return UI.active === id && In.down && inside(In.x, In.y, x, y, w, h);
  };
  UI.hover = function (x, y, w, h) {
    return In.type === 'mouse' && !In.down && inside(In.x, In.y, x, y, w, h);
  };

  // chunky pixel button. label may include an icon via opts.icon.
  UI.button = function (x, y, w, h, label, opts) {
    opts = opts || {};
    x = Math.round(x); y = Math.round(y);
    var id = opts.id || ('b:' + x + ',' + y + ',' + w + ',' + h + ':' + label);
    var st = STYLES[opts.style || 'normal'];
    var disabled = !!opts.disabled;
    if (disabled) st = STYLES.off;
    var clicked = UI.hit(id, x, y, w, h, opts);
    var pressed = UI.isDown(id, x, y, w, h) && !disabled;
    var hov = UI.hover(x, y, w, h) && !disabled;
    var off = pressed ? 2 : 0;
    var depth = st.depth;
    // body
    R.box(x, y + off, w, h - off, 0);
    if (!pressed && depth !== undefined) R.rect(x + 1, y + h - 3, w - 2, 2, depth);
    var face = hov && !opts.selected ? DH.LIGHT[st.face] : st.face;
    if (opts.selected) face = st.light;
    R.rect(x + 1, y + 1 + off, w - 2, h - 4, face);
    R.rect(x + 2, y + 1 + off, w - 4, 1, opts.selected ? 7 : st.light);
    // content
    var cy = y + 1 + off + Math.floor((h - 4) / 2);
    var txtCol = opts.textCol !== undefined ? opts.textCol : st.text;
    if (opts.selected && opts.style === 'tab') txtCol = 1;
    var font = opts.font || (h < 13 ? 'small' : 'big');
    var fh = font === 'small' ? 5 : 7;
    if (opts.icon && !label) {
      var ic = DH.Spr.icon(opts.icon);
      R.img(disabled ? DH.Spr.iconSil(opts.icon, 13) : ic, x + Math.floor((w - ic.width) / 2), cy - Math.floor(ic.height / 2));
    } else if (opts.icon) {
      var ic2 = DH.Spr.icon(opts.icon);
      var tw = F.measure(label, font) + ic2.width + 3;
      var sx = x + Math.floor((w - tw) / 2);
      R.img(disabled ? DH.Spr.iconSil(opts.icon, 13) : ic2, sx, cy - Math.floor(ic2.height / 2));
      F.draw(R.ctx, label, sx + ic2.width + 3, cy - Math.floor(fh / 2), txtCol, { font: font, shadow: disabled ? null : st.shadow });
    } else if (label) {
      F.draw(R.ctx, label, x + Math.floor(w / 2), cy - Math.floor(fh / 2), txtCol, { font: font, align: 'center', shadow: disabled ? null : st.shadow });
    }
    if (clicked && !disabled) {
      if (DH.Snd) DH.Snd.play(opts.sound || 'click');
      return true;
    }
    if (clicked && disabled && DH.Snd) DH.Snd.play('nope');
    return false;
  };

  // small square icon button (close X etc.)
  UI.iconButton = function (x, y, size, icon, opts) {
    opts = opts || {};
    return UI.button(x, y, size, size, '', { icon: icon, style: opts.style || 'dark', id: opts.id, sound: opts.sound, force: opts.force });
  };

  // ------------------------------------------------------------------ panels
  // draws a panel frame and returns its inner content rect
  UI.panelFrame = function (x, y, w, h, title, opts) {
    opts = opts || {};
    x = Math.round(x); y = Math.round(y);
    R.box(x - 1, y - 1, w + 2, h + 2, 0);
    R.rect(x, y, w, h, 1);
    R.frame(x, y, w, h, 13);
    R.rect(x + 1, y + h - 2, w - 2, 1, 0);
    // corner rivets
    R.pset(x + 2, y + 2, 6); R.pset(x + w - 3, y + 2, 6); R.pset(x + 2, y + h - 4, 6); R.pset(x + w - 3, y + h - 4, 6);
    var top = y + 2;
    if (title) {
      R.rect(x + 1, y + 1, w - 2, 12, 2);
      R.rect(x + 1, y + 13, w - 2, 1, 13);
      if (opts.icon) {
        var ic = DH.Spr.icon(opts.icon);
        R.img(ic, x + 5, y + 3);
        F.draw(R.ctx, title, x + 15, y + 3, 7, { shadow: 0 });
      } else F.draw(R.ctx, title, x + 5, y + 3, 7, { shadow: 0 });
      top = y + 16;
    }
    var closed = false;
    if (opts.close !== false) {
      if (UI.button(x + w - 13, y + 1, 12, 12, '', { icon: 'close', style: 'danger', id: 'panelclose', sound: 'back' })) closed = true;
    }
    return { x: x + 4, y: top, w: w - 8, h: y + h - top - 4, closed: closed, px: x, py: y, pw: w, ph: h };
  };

  // standard panel geometry for the current screen
  UI.panelRect = function (maxW, maxH) {
    var bar = DH.G && DH.G.barH !== undefined ? DH.G.barH : 26;
    var w = Math.min(R.W - 8, maxW || 300), h = Math.min(R.H - bar - 10, maxH || 160);
    return { x: Math.floor((R.W - w) / 2), y: Math.max(4, Math.floor((R.H - bar - h) / 2)), w: w, h: h };
  };

  // tab strip. returns selected index.
  UI.tabs = function (id, x, y, w, labels, sel) {
    var n = labels.length;
    var tw = Math.floor(w / n);
    for (var i = 0; i < n; i++) {
      var on = i === sel;
      if (UI.button(x + i * tw, y, tw - 1, 12, labels[i], { style: 'tab', selected: on, font: 'small', id: id + ':' + i })) sel = i;
    }
    return sel;
  };

  // ------------------------------------------------------------------ scroll area
  // calls drawFn(x, y0) where y0 already includes the scroll offset. Returns nothing.
  UI.scrollArea = function (id, x, y, w, h, contentH, drawFn) {
    var maxS = Math.max(0, contentH - h);
    var s = UI.scroll[id] || 0;
    var overArea = In.inRect(In.x, In.y, x, y, w, h);
    if (overArea && In.wheel) s += In.wheel * 14;
    if (In.down && In.inRect(In.px, In.py, x, y, w, h) && UI.enabled) {
      if (UI._dragId !== id) { UI._dragId = id; UI._dragStart = s; UI._dragY = In.py; }
      if (In.drag > 6) s = UI._dragStart - (In.y - UI._dragY);
    } else if (UI._dragId === id && !In.down) UI._dragId = null;
    s = U.clamp(s, 0, maxS);
    UI.scroll[id] = s;
    var ctx = R.ctx;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    var prevClip = UI.clip;
    UI.clip = { x: x, y: y, w: w, h: h };
    drawFn(x, Math.round(y - s));
    UI.clip = prevClip;
    ctx.restore();
    // scroll bar
    if (maxS > 0) {
      var bh = Math.max(8, Math.floor(h * h / contentH));
      var by = y + Math.floor((h - bh) * (s / maxS));
      R.rect(x + w - 2, y, 2, h, 0);
      R.rect(x + w - 2, by, 2, bh, 13);
      // fade hints
      if (s < maxS) { R.dither(x, y + h - 3, w - 3, 3, 1); }
      if (s > 0) { R.dither(x, y, w - 3, 3, 1); }
    }
  };
  UI.scrollTo = function (id, v) { UI.scroll[id] = v; };

  // ------------------------------------------------------------------ cost display
  // draws "icon num icon num", red where unaffordable. returns width.
  UI.costRow = function (x, y, cost, s, opts) {
    opts = opts || {};
    var cx = x, font = opts.font || 'small';
    var keys = Object.keys(cost || {});
    if (!keys.length) { F.draw(R.ctx, 'FREE', x, y + 1, 11, { font: font }); return F.measure('FREE', font); }
    keys.forEach(function (k) {
      var have = s ? (s.res[k] || 0) >= cost[k] : true;
      var ic = DH.Spr.icon(DH.D.resIcon(k));
      R.img(ic, cx, y);
      cx += ic.width + 1;
      var txt = U.fmt(cost[k]);
      F.draw(R.ctx, txt, cx, y + (font === 'small' ? 1 : 0), have ? (opts.col || 7) : 8, { font: font });
      cx += F.measure(txt, font) + 4;
    });
    return cx - x - 4;
  };
  UI.costWidth = function (cost, font) {
    font = font || 'small';
    var keys = Object.keys(cost || {});
    if (!keys.length) return F.measure('FREE', font);
    var w = 0;
    keys.forEach(function (k) { w += 8 + F.measure(U.fmt(cost[k]), font) + 4; });
    return w - 4;
  };

  // wrapped paragraph; returns height used
  UI.para = function (text, x, y, w, col, font) {
    font = font || 'small';
    var lines = F.wrap(text, w, font);
    var lh = F.get(font).lineH;
    for (var i = 0; i < lines.length; i++) F.draw(R.ctx, lines[i], x, y + i * lh, col, { font: font });
    return lines.length * lh;
  };
  UI.paraH = function (text, w, font) {
    font = font || 'small';
    return F.wrap(text, w, font).length * F.get(font).lineH;
  };

  // simple progress bar
  UI.bar = function (x, y, w, h, frac, col, bg) {
    R.rect(x, y, w, h, 0);
    R.rect(x + 1, y + 1, w - 2, h - 2, bg !== undefined ? bg : 1);
    var fw = Math.round((w - 2) * U.clamp(frac, 0, 1));
    if (fw > 0) {
      R.rect(x + 1, y + 1, fw, h - 2, col);
      if (h > 3) R.rect(x + 1, y + 1, fw, 1, DH.LIGHT[col]);
    }
  };

  // ------------------------------------------------------------------ toasts
  UI.toast = function (text, icon, col) {
    // merge repeated toasts
    for (var i = 0; i < UI.toasts.length; i++) if (UI.toasts[i].text === text && UI.toasts[i].t < 1) return;
    UI.toasts.push({ text: text, icon: icon, col: col || 7, t: 0 });
    if (UI.toasts.length > 4) UI.toasts.shift();
  };
  UI.drawToasts = function (dt, topY) {
    var y = topY || 14;
    for (var i = 0; i < UI.toasts.length; i++) {
      var to = UI.toasts[i];
      if (i < 2) to.t += dt;
      if (to.t > 2.6) { UI.toasts.splice(i, 1); i--; continue; }
      if (i >= 2) continue;
      var slide = to.t < 0.2 ? (1 - to.t / 0.2) : (to.t > 2.3 ? (to.t - 2.3) / 0.3 : 0);
      var tw = F.measure(to.text, 'big') + (to.icon ? 12 : 0) + 10;
      var x = Math.floor((R.W - tw) / 2);
      var yy = Math.round(y - slide * 24);
      R.box(x, yy, tw, 13, 0);
      R.rect(x + 1, yy + 1, tw - 2, 10, 1);
      R.rect(x + 1, yy + 1, tw - 2, 1, 13);
      var tx = x + 5;
      if (to.icon) { R.img(DH.Spr.icon(to.icon), tx, yy + 3); tx += 11; }
      F.draw(R.ctx, to.text, tx, yy + 3, to.col, { shadow: 0 });
      y += 15;
    }
  };

  // ------------------------------------------------------------------ tooltips
  // speech-box style tooltip pointing at a target rect. returns its rect.
  UI.tooltip = function (text, target, opts) {
    opts = opts || {};
    var maxW = Math.min(R.W - 16, opts.maxW || 200);
    var lines = F.wrap(text, maxW - 10, 'big');
    var w = 0;
    lines.forEach(function (l) { w = Math.max(w, F.measure(l, 'big')); });
    w += 10;
    var footer = opts.footer || null;
    if (footer) w = Math.max(w, F.measure(footer, 'small') + 10);
    var h = lines.length * 9 + 6 + (footer ? 8 : 0);
    var x, y, arrowDir = null, ax = 0;
    if (target) {
      var tcx = target.x + target.w / 2;
      x = U.clamp(Math.round(tcx - w / 2), 4, R.W - w - 4);
      if (target.y - h - 6 > 2 && opts.prefer !== 'below') { y = target.y - h - 6; arrowDir = 'down'; }
      else { y = target.y + target.h + 6; arrowDir = 'up'; }
      if (y + h > R.H - 2) { y = R.H - h - 2; arrowDir = null; }
      ax = U.clamp(Math.round(tcx), x + 4, x + w - 5);
    } else {
      x = Math.round((R.W - w) / 2); y = Math.round(opts.y !== undefined ? opts.y : (R.H - h) / 2);
    }
    var bob = Math.round(Math.sin(UI.t * 5) * 1);
    y += arrowDir ? bob : 0;
    R.box(x - 1, y - 1, w + 2, h + 2, 0);
    R.rect(x, y, w, h, 7);
    R.rect(x, y + h - 1, w, 1, 6);
    for (var i = 0; i < lines.length; i++) F.draw(R.ctx, lines[i], x + 5, y + 4 + i * 9, 1);
    if (footer) F.draw(R.ctx, footer, x + w - 5, y + h - 8, 13, { font: 'small', align: 'right' });
    if (arrowDir === 'down') {
      for (var k = 0; k < 4; k++) R.rect(ax - 3 + k, y + h + k, 7 - k * 2, 1, k === 0 ? 7 : 7);
      R.rect(ax - 4, y + h, 1, 1, 0); R.rect(ax + 4, y + h, 1, 1, 0);
    } else if (arrowDir === 'up') {
      for (var k2 = 0; k2 < 4; k2++) R.rect(ax - 3 + k2, y - 1 - k2, 7 - k2 * 2, 1, 7);
    }
    // highlight target with a blinking frame
    if (target && opts.highlight !== false) {
      var on = Math.floor(UI.t * 4) % 2 === 0;
      R.frame(target.x - 2, target.y - 2, target.w + 4, target.h + 4, on ? 10 : 9);
    }
    return { x: x, y: y, w: w, h: h };
  };

  DH.UI = UI;
})(window.DH = window.DH || {});
