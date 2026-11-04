// DRIFTHOLD - font.js
// Two hand-made bitmap fonts drawn from code: BIG (5x7) and SMALL (3x5).
// Every letter on screen goes through here - there is no HTML or system text anywhere.
// Inline colour codes: a backtick followed by a hex digit switches colour, e.g. "`9COPPER`7 ORE".
(function (DH) {
  'use strict';

  var BIG = {
    'A': '.###.|#...#|#...#|#####|#...#|#...#|#...#',
    'B': '####.|#...#|#...#|####.|#...#|#...#|####.',
    'C': '.###.|#...#|#....|#....|#....|#...#|.###.',
    'D': '####.|#...#|#...#|#...#|#...#|#...#|####.',
    'E': '#####|#....|#....|####.|#....|#....|#####',
    'F': '#####|#....|#....|####.|#....|#....|#....',
    'G': '.###.|#...#|#....|#.###|#...#|#...#|.####',
    'H': '#...#|#...#|#...#|#####|#...#|#...#|#...#',
    'I': '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
    'J': '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
    'K': '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
    'L': '#....|#....|#....|#....|#....|#....|#####',
    'M': '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
    'N': '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
    'O': '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
    'P': '####.|#...#|#...#|####.|#....|#....|#....',
    'Q': '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
    'R': '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
    'S': '.####|#....|#....|.###.|....#|....#|####.',
    'T': '#####|..#..|..#..|..#..|..#..|..#..|..#..',
    'U': '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
    'V': '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
    'W': '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.',
    'X': '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
    'Y': '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
    'Z': '#####|....#|...#.|..#..|.#...|#....|#####',
    '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
    '1': '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
    '2': '.###.|#...#|....#|...#.|..#..|.#...|#####',
    '3': '#####|...#.|..#..|...#.|....#|#...#|.###.',
    '4': '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
    '5': '#####|#....|####.|....#|....#|#...#|.###.',
    '6': '..##.|.#...|#....|####.|#...#|#...#|.###.',
    '7': '#####|....#|...#.|..#..|.#...|.#...|.#...',
    '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
    '9': '.###.|#...#|#...#|.####|....#|...#.|.##..',
    '.': '.....|.....|.....|.....|.....|.....|..#..',
    ',': '.....|.....|.....|.....|.....|..#..|.#...',
    '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..',
    '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
    ':': '.....|..#..|.....|.....|.....|..#..|.....',
    ';': '.....|..#..|.....|.....|.....|..#..|.#...',
    '-': '.....|.....|.....|.###.|.....|.....|.....',
    '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
    '=': '.....|.....|#####|.....|#####|.....|.....',
    '/': '....#|....#|...#.|..#..|.#...|#....|#....',
    '(': '...#.|..#..|.#...|.#...|.#...|..#..|...#.',
    ')': '.#...|..#..|...#.|...#.|...#.|..#..|.#...',
    '[': '.###.|.#...|.#...|.#...|.#...|.#...|.###.',
    ']': '.###.|...#.|...#.|...#.|...#.|...#.|.###.',
    '%': '##..#|##..#|...#.|..#..|.#...|#..##|#..##',
    '\'': '..#..|..#..|.....|.....|.....|.....|.....',
    '"': '.#.#.|.#.#.|.....|.....|.....|.....|.....',
    '*': '.....|#.#.#|.###.|#####|.###.|#.#.#|.....',
    '#': '.#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.',
    '<': '...#.|..#..|.#...|#....|.#...|..#..|...#.',
    '>': '.#...|..#..|...#.|....#|...#.|..#..|.#...',
    '_': '.....|.....|.....|.....|.....|.....|#####',
    '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#',
    'x': '.....|.....|#...#|.#.#.|..#..|.#.#.|#...#',
    '♥': '.....|.#.#.|#####|#####|.###.|..#..|.....',
    '★': '..#..|..#..|#####|.###.|.###.|.#.#.|.....',
    '♪': '..##.|..#.#|..#..|..#..|.##..|###..|.#...',
    '▲': '.....|..#..|.###.|#####|.....|.....|.....',
    '▼': '.....|.....|#####|.###.|..#..|.....|.....',
    '◄': '...#.|..##.|.###.|####.|.###.|..##.|...#.',
    '►': '.#...|.##..|.###.|.####|.###.|.##..|.#...',
    '✓': '.....|....#|...##|#.##.|###..|.#...|.....',
    '…': '.....|.....|.....|.....|.....|.....|#.#.#'
  };

  var SMALL = {
    'A': '.#.|#.#|###|#.#|#.#', 'B': '##.|#.#|##.|#.#|##.', 'C': '.##|#..|#..|#..|.##',
    'D': '##.|#.#|#.#|#.#|##.', 'E': '###|#..|##.|#..|###', 'F': '###|#..|##.|#..|#..',
    'G': '.##|#..|#.#|#.#|.##', 'H': '#.#|#.#|###|#.#|#.#', 'I': '###|.#.|.#.|.#.|###',
    'J': '..#|..#|..#|#.#|.#.', 'K': '#.#|#.#|##.|#.#|#.#', 'L': '#..|#..|#..|#..|###',
    'M': '#.#|###|###|#.#|#.#', 'N': '##.|#.#|#.#|#.#|#.#', 'O': '.#.|#.#|#.#|#.#|.#.',
    'P': '##.|#.#|##.|#..|#..', 'Q': '.#.|#.#|#.#|##.|.##', 'R': '##.|#.#|##.|#.#|#.#',
    'S': '.##|#..|.#.|..#|##.', 'T': '###|.#.|.#.|.#.|.#.', 'U': '#.#|#.#|#.#|#.#|###',
    'V': '#.#|#.#|#.#|#.#|.#.', 'W': '#.#|#.#|###|###|#.#', 'X': '#.#|#.#|.#.|#.#|#.#',
    'Y': '#.#|#.#|.#.|.#.|.#.', 'Z': '###|..#|.#.|#..|###',
    '0': '###|#.#|#.#|#.#|###', '1': '.#.|##.|.#.|.#.|###', '2': '##.|..#|.#.|#..|###',
    '3': '##.|..#|.#.|..#|##.', '4': '#.#|#.#|###|..#|..#', '5': '###|#..|##.|..#|##.',
    '6': '.##|#..|###|#.#|###', '7': '###|..#|.#.|.#.|.#.', '8': '###|#.#|###|#.#|###',
    '9': '###|#.#|###|..#|##.',
    '.': '...|...|...|...|.#.', ',': '...|...|...|.#.|#..', ':': '...|.#.|...|.#.|...',
    '!': '.#.|.#.|.#.|...|.#.', '?': '##.|..#|.#.|...|.#.', '-': '...|...|###|...|...',
    '+': '...|.#.|###|.#.|...', '=': '...|###|...|###|...', '/': '..#|..#|.#.|#..|#..',
    '%': '#.#|..#|.#.|#..|#.#', '(': '.#.|#..|#..|#..|.#.', ')': '.#.|..#|..#|..#|.#.',
    '[': '##.|#..|#..|#..|##.', ']': '.##|..#|..#|..#|.##',
    '\'': '.#.|.#.|...|...|...', '"': '#.#|#.#|...|...|...', 'x': '...|#.#|.#.|#.#|...',
    '*': '...|#.#|.#.|#.#|...', '<': '..#|.#.|#..|.#.|..#', '>': '#..|.#.|..#|.#.|#..',
    '_': '...|...|...|...|###', '#': '#.#|###|#.#|###|#.#', '&': '.#.|#.#|.#.|#.#|.##',
    '♥': '#.#|###|###|.#.|...', '★': '.#.|###|.#.|#.#|...', '♪': '.##|.#.|.#.|##.|##.',
    '▲': '...|.#.|###|...|...', '▼': '...|###|.#.|...|...', '◄': '..#|.##|###|.##|..#',
    '►': '#..|##.|###|##.|#..', '✓': '...|..#|#.#|.#.|...', '…': '...|...|...|...|#.#'
  };

  function buildFont(defs, cw, ch, spaceW, fixedChars) {
    var keys = Object.keys(defs);
    var font = { cw: cw, ch: ch, glyphs: {}, keys: keys, spaceW: spaceW, atlases: {} };
    keys.forEach(function (k, idx) {
      var rows = defs[k].split('|');
      var minX = cw, maxX = -1;
      for (var y = 0; y < rows.length; y++) for (var x = 0; x < cw; x++) {
        if (rows[y][x] === '#') { if (x < minX) minX = x; if (x > maxX) maxX = x; }
      }
      var fixed = fixedChars.test(k);
      if (maxX < 0) { minX = 0; maxX = 0; }
      font.glyphs[k] = {
        rows: rows, idx: idx,
        ox: fixed ? 0 : minX,
        w: fixed ? cw : (maxX - minX + 1)
      };
    });
    return font;
  }

  var FIXED = /^[A-Z0-9?#&♥★♪▲▼◄►✓]$/;
  var fonts = {
    big: buildFont(BIG, 5, 7, 3, FIXED),
    small: buildFont(SMALL, 3, 5, 2, FIXED)
  };
  fonts.big.lineH = 9;
  fonts.small.lineH = 7;

  function atlas(font, color) {
    var a = font.atlases[color];
    if (a) return a;
    var c = document.createElement('canvas');
    c.width = font.keys.length * (font.cw + 1);
    c.height = font.ch;
    var x = c.getContext('2d');
    x.fillStyle = DH.PAL[color];
    font.keys.forEach(function (k, i) {
      var g = font.glyphs[k];
      for (var yy = 0; yy < font.ch; yy++) for (var xx = 0; xx < font.cw; xx++) {
        if (g.rows[yy] && g.rows[yy][xx] === '#') x.fillRect(i * (font.cw + 1) + xx, yy, 1, 1);
      }
    });
    font.atlases[color] = c;
    return c;
  }

  function isHex(ch) { return /^[0-9a-f]$/.test(ch); }

  var Font = {};
  Font.get = function (name) { return fonts[name || 'big']; };

  // width of a single line (ignores colour codes)
  Font.measure = function (text, name) {
    var font = fonts[name || 'big'];
    text = String(text);
    var w = 0, maxW = 0, any = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '`' && i + 1 < text.length && isHex(text[i + 1].toLowerCase())) { i++; continue; }
      if (ch === '\n') { maxW = Math.max(maxW, any ? w - 1 : 0); w = 0; any = false; continue; }
      if (ch !== 'x') ch = ch.toUpperCase();
      var g = font.glyphs[ch] || (ch === ' ' ? null : font.glyphs['?']);
      w += (g ? g.w : font.spaceW) + 1;
      any = true;
    }
    return Math.max(maxW, any ? w - 1 : 0);
  };

  // greedy word wrap -> array of lines
  Font.wrap = function (text, maxW, name) {
    var out = [];
    String(text).split('\n').forEach(function (para) {
      var words = para.split(' ');
      var line = '';
      words.forEach(function (wd) {
        var test = line ? line + ' ' + wd : wd;
        if (Font.measure(test, name) <= maxW || !line) line = test;
        else { out.push(line); line = wd; }
      });
      out.push(line);
    });
    return out;
  };

  // draw text. opts: {font, align:'left'|'center'|'right', shadow: colour, lineH}
  Font.draw = function (ctx, text, x, y, color, opts) {
    opts = opts || {};
    var name = opts.font || 'big';
    var font = fonts[name];
    var raw = String(text);
    if (opts.shadow !== undefined && opts.shadow !== null) {
      var o2 = {}; for (var k in opts) o2[k] = opts[k];
      o2.shadow = null; o2.plain = true;
      Font.draw(ctx, raw, x, y + 1, opts.shadow, o2);
    }
    var lines = raw.split('\n');
    var lh = opts.lineH || font.lineH;
    var col = color;
    for (var li = 0; li < lines.length; li++) {
      var line = lines[li];
      var lw = Font.measure(line, name);
      var cx = Math.round(x);
      if (opts.align === 'center') cx = Math.round(x - lw / 2);
      else if (opts.align === 'right') cx = Math.round(x - lw);
      var cy = Math.round(y + li * lh);
      for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '`' && i + 1 < line.length && isHex(line[i + 1].toLowerCase())) {
          if (!opts.plain) col = parseInt(line[i + 1], 16);
          i++; continue;
        }
        if (ch !== 'x') ch = ch.toUpperCase();
        var g = font.glyphs[ch];
        if (!g && ch === ' ') { cx += font.spaceW + 1; continue; }
        if (!g) g = font.glyphs['?'];
        var a = atlas(font, col);
        ctx.drawImage(a, g.idx * (font.cw + 1) + g.ox, 0, g.w, font.ch, cx, cy, g.w, font.ch);
        cx += g.w + 1;
      }
    }
  };

  // draws text with a 1px outline all round (for text over busy backgrounds)
  Font.drawOutlined = function (ctx, text, x, y, color, outline, opts) {
    opts = opts || {};
    var o2 = {}; for (var k in opts) o2[k] = opts[k];
    o2.plain = true; o2.shadow = null;
    var d = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
    for (var i = 0; i < d.length; i++) Font.draw(ctx, text, x + d[i][0], y + d[i][1], outline, o2);
    var o3 = {}; for (k in opts) o3[k] = opts[k];
    o3.shadow = null;
    Font.draw(ctx, text, x, y, color, o3);
  };

  // scaled text for the title logo (integer scale only)
  Font.drawScaled = function (ctx, text, x, y, color, scale, opts) {
    opts = opts || {};
    var name = opts.font || 'big';
    var font = fonts[name];
    text = String(text).toUpperCase();
    var w = Font.measure(text, name) * scale;
    var cx = Math.round(opts.align === 'center' ? x - w / 2 : x);
    for (var i = 0; i < text.length; i++) {
      var g = font.glyphs[text[i]];
      if (!g) { cx += (font.spaceW + 1) * scale; continue; }
      var a = atlas(font, color);
      ctx.drawImage(a, g.idx * (font.cw + 1) + g.ox, 0, g.w, font.ch, cx, Math.round(y), g.w * scale, font.ch * scale);
      cx += (g.w + 1) * scale;
    }
    return w;
  };

  DH.Font = Font;
})(window.DH = window.DH || {});
