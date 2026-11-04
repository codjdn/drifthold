// DRIFTHOLD - sprites.js
// All art is defined here in code: hand-placed pixel strings for icons / props, and small
// generators for planets, asteroids and the drone's rotation frames. Everything is cached.
(function (DH) {
  'use strict';
  var R = DH.R, U = DH.U;
  var S = { cache: {} };

  // ---------------------------------------------------------------- icons (7x7)
  var ICONS = {
    cu: ['.......', '..f99..', '.f99994', 'f999944', '.994442', '..4422.', '.......'],
    ice: ['...7...', '..7cc..', '..7cc1.', '.7ccc1.', '.7cc11.', '..cc1..', '...1...'],
    cry: ['....7..', '.7..e..', '.e.7e2.', '.e2ee2.', 'ee2ee22', '.e22e2.', '..222..'],
    gold: ['.......', '...7...', '..7aa..', '.7aaa9.', '7aaa999', '.99994.', '.......'],
    dust: ['...7...', '...f...', '.d.7.d.', '7f777f7', '.d.7.d.', '...f...', '...7...'],
    frost: ['..777..', '.77dd6.', '7766dd6', '76dd6d6', '.6dd66.', '..666..', '.......'],
    ion: ['....b7.', '...bb..', '..bb...', '.bbbbb.', '...bb..', '..bb...', '.b3....'],
    pearl: ['.......', '..fff..', '.f77ff.', '.f7fee.', '.ffee2.', '..ee2..', '.......'],
    void: ['...8...', '..e82..', '.e8222.', '.28221.', '..2221.', '..121..', '...1...'],
    food: ['...3b..', '..b3...', '.8888e.', '8888e78', '8888888', '.88882.', '..222..'],
    alloy: ['.......', '.......', '..7776.', '.766665', '7666655', '5555555', '.......'],
    data: ['.6.6.6.', '.11111.', '61ccc16', '.1c7c1.', '61ccc16', '.11111.', '.6.6.6.'],
    fuel: ['...66..', '..9999.', '..9a99.', '..9a99.', '..9a99.', '..9999.', '..4444.'],
    cargo: ['.......', '4444444', '4999994', '4444444', '4999994', '4444444', '.......'],
    shield: ['.ccccc.', 'c77ccc1', 'c7ccc11', 'cccc11c', '.cc11c.', '..c1c..', '...c...'],
    magnet: ['66...66', '88...88', '88...88', '88...88', '888.888', '.88888.', '..222..'],
    drill: ['......7', '.....66', '....676', '...666.', '..595..', '.959...', '99.....'],
    speed: ['.......', '..c....', '.ccc...', 'ccccccc', '.ccc...', '..c....', '.......'],
    crew: ['..444..', '.4ffff.', '.f1f1f.', '.fffff.', '..fff..', '.ccccc.', 'ccccccc'],
    lock: ['..555..', '.5...5.', '.5...5.', '6666666', '666a666', '6665666', '6666666'],
    check: ['......b', '.....bb', 'b...bb.', 'bb.bb..', '.bbb...', '..b....', '.......'],
    star: ['...a...', '...a...', 'aaaaaaa', '.aaaaa.', '..aaa..', '.aa.aa.', '.a...a.'],
    heart: ['.......', '.88.88.', '8e88888', '8888888', '.88888.', '..888..', '...8...'],
    plus: ['.......', '...b...', '...b...', '.bbbbb.', '...b...', '...b...', '.......'],
    clock: ['..666..', '.67776.', '6777076', '6770776', '6777776', '.67776.', '..666..'],
    smile: ['..aaa..', '.aaaaa.', 'a0a0aaa', 'aaaaaaa', 'a0aa0aa', '.a00aa.', '..aaa..'],
    up: ['...b...', '..bbb..', '.bbbbb.', '...b...', '...b...', '.......', '.......'],
    room: ['5555555', '5111115', '51c1c15', '5111115', '5144415', '5555555', '.......'],
    planet: ['..ccc..', '.c7cc1.', 'cc7cc11', 'ccccc11', 'cccc111', '.c111..', '..111..'],
    paint: ['.....56', '....565', '...565.', '..e55..', '.eee...', 'eee....', 'ee.....'],
    decor: ['...b...', '..b3b..', '.b3b3b.', '..b3b..', '...4...', '.44444.', '..444..'],
    hull: ['.66666.', '6777776', '6766676', '6766676', '6777776', '.66666.', '.......'],
    research: ['..7c...', '..7c...', '..7c...', '.7ccc..', '7ccbcc.', '7cbbbc.', '.ccccc.'],
    zzz: ['.......', '.1111..', '...1...', '..1....', '.1111..', '.......', '.......'],
    note: ['...111.', '...1.1.', '...1...', '...1...', '.111...', '.111...', '.......'],
    bang: ['...8...', '...8...', '...8...', '...8...', '.......', '...8...', '.......'],
    dots: ['.......', '.......', '.......', '.1.1.1.', '.......', '.......', '.......'],
    anomaly: ['..e.e..', '.e2e2e.', 'e2777.e', '.e7a7e.', 'e.777.e', '.e2e2e.', '..e.e..'],
    trade: ['.b.....', 'bbbbbb.', '.b.....', '.......', '.....8.', '.888888', '.....8.'],
    sector: ['7......', '.......', '...a...', '..aaa..', '...a...', '.......', '......7']
  };
  // 9x9 bottom-bar icons
  var BIG_ICONS = {
    ship: ['.........', '...66....', '..6666...', '966cc666.', '966666667', '.5555555.', '..5..5...', '.........', '.........'],
    launch: ['......77.', '.....777.', '....7c7..', '...777...', '..677....', '.66.6....', '.9.......', '9........', '.........'],
    map: ['.........', '.7.....a.', '......aaa', '...7...a.', '..d......', '.d..c....', 'd...ccc..', '.....c...', '.........'],
    log: ['.........', '.4444444.', '.4777774.', '.4766674.', '.4777774.', '.4766674.', '.4777774.', '.4444444.', '.........'],
    gear: ['....6....', '.6.666.6.', '..66666..', '.666.666.', '6666.6666', '.666.666.', '..66666..', '.6.666.6.', '....6....'],
    close: ['.........', '.7.....7.', '..7...7..', '...7.7...', '....7....', '...7.7...', '..7...7..', '.7.....7.', '.........']
  };
  // map per icon for multi-colour remap use (not needed: hex digits are palette indices)
  S.icon = function (name) {
    var k = 'icon:' + name;
    if (S.cache[k]) return S.cache[k];
    var rows = ICONS[name] || BIG_ICONS[name] || ICONS.bang;
    return (S.cache[k] = R.sprite(rows));
  };
  S.iconSil = function (name, col) {
    var k = 'iconsil:' + name + ':' + col;
    if (S.cache[k]) return S.cache[k];
    return (S.cache[k] = R.silhouette(S.icon(name), col));
  };
  S.hasIcon = function (name) { return !!(ICONS[name] || BIG_ICONS[name]); };

  // ---------------------------------------------------------------- pickups (run)
  var PICKUPS = {
    fuel: ['..666..', '.69996.', '.9aa99.', '.9a999.', '.9a999.', '.99999.', '.44444.'],
    magnet: ['66...66', '88...88', '88...88', '88...88', '888.888', '.88888.', '..222..'],
    drill: ['......7', '.....67', '....676', '...666.', '..595..', '.959...', '99.....'],
    shieldcell: ['.ccccc.', 'c77ccc1', 'c7c7c11', 'cc777c1', 'c1c7c11', '.c111c.', '..ccc..']
  };
  S.pickup = function (name) {
    var k = 'pk:' + name;
    if (S.cache[k]) return S.cache[k];
    return (S.cache[k] = R.outlined(R.sprite(PICKUPS[name]), 0));
  };

  // ---------------------------------------------------------------- drone
  // template letters: M main, S shade, T trim, W window, D drill, O outline, F fin
  var CHASSIS = {
    standard: [
      '..OOO......',
      '.OTTSO.....',
      'OMMMMSOOO..',
      'OMWWMMSDDO.',
      'OMWWMMSDDDO',
      'OMMMMMSDDO.',
      'OMMMMSOOO..',
      '.OTTSO.....',
      '..OOO......'
    ],
    sprinter: [
      'OO.........',
      'OTO........',
      'OTMMSOO....',
      '.OMWWMSOOO.',
      '.OMWWMMSDDO',
      '.OMMMMSOOO.',
      'OTMMSOO....',
      'OTO........',
      'OO.........'
    ],
    hauler: [
      'OOOOOO.....',
      'OTTTTSO....',
      'OMMMMMSOOO.',
      'OMWWMMMSDDO',
      'OMWWMMMSDDO',
      'OMMMMMMSDDO',
      'OMMMMMSOOO.',
      'OTTTTSO....',
      'OOOOOO.....'
    ],
    driller: [
      '..OOO..O...',
      '.OTTSOODO..',
      'OMMMMSODDO.',
      'OMWWMMSDDDO',
      'OMWWMMSDDDD',
      'OMMMMMSDDDO',
      'OMMMMSODDO.',
      '.OTTSOODO..',
      '..OOO..O...'
    ],
    guardian: [
      '.OOTTOO....',
      'OTMMMMSO...',
      'OMMMMMMSOO.',
      'OMWWMMMSDDO',
      'OMWWMMMSDDD',
      'OMMMMMMSDDO',
      'OMMMMMMSOO.',
      'OTMMMMSO...',
      '.OOTTOO....'
    ],
    skiff: [
      'OOO........',
      'OTTOO......',
      '.OTMMSOOO..',
      'OMMWWMMSDO.',
      'OMMWWMMMSDO',
      'OMMMMMMSDO.',
      '.OTMMSOOO..',
      'OTTOO......',
      'OOO........'
    ]
  };
  S.droneBase = function (chassis, paint) {
    var k = 'dronebase:' + chassis + ':' + paint;
    if (S.cache[k]) return S.cache[k];
    var p = DH.D ? DH.D.PAINTS[paint] || DH.D.PAINTS.classic : { main: 7, shade: 6, trim: 9, window: 12 };
    var map = { M: p.main, S: p.shade, T: p.trim, W: p.window, D: 6, O: 0, F: p.trim };
    return (S.cache[k] = R.sprite(CHASSIS[chassis] || CHASSIS.standard, map));
  };
  var DRONE_FRAMES = 32;
  S.droneFrame = function (chassis, paint, angle) {
    var idx = Math.round(((angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * DRONE_FRAMES) % DRONE_FRAMES;
    var k = 'drone:' + chassis + ':' + paint + ':' + idx;
    if (S.cache[k]) return S.cache[k];
    return (S.cache[k] = R.rotate(S.droneBase(chassis, paint), idx / DRONE_FRAMES * Math.PI * 2));
  };

  // ---------------------------------------------------------------- decorations (room props)
  var DECOR = {
    plant: ['..b.b..', '.b3b3b.', '..bbb..', '.b3b3b.', '...3...', '.44444.', '..444..', '..444..'],
    poster: ['5555555', '5ccccc5', '5c7aac5', '5caa9c5', '5c99cc5', '5ccccc5', '5555555'],
    lamp: ['..eee..', '.e7ee2.', '.eeee2.', '..e22..', '...5...', '...5...', '..555..', '.55555.'],
    fishtank: ['6666666666', '6cccccccc6', '6cc9cccc16', '6ccccc9cc6', '6c3cccc3c6', '6b3b33b3b6', '5555555555', '.5......5.'],
    cat: ['5...5..', '55.55..', '5a5a5..', '55555..5', '.55555.5', '.555555.', '.5.5.5..'],
    disco: ['...6...', '...6...', '.67c6..', '6c67c6.', '67c67c.', '.6c67..', '..66...'],
    trophy: ['aaaaaaa', 'a9aaa9a', '.aaaaa.', '..aaa..', '...a...', '..999..', '.44444.'],
    globe: ['..ccc..', '.cb3cc.', 'cbbccbc', 'ccc3bbc', '.cccbc.', '..ccc..', '...5...', '.55555.'],
    bonsai: ['.bb.bb.', 'b3bbb3b', '.bb3bb.', '...4...', '..44...', '.88888.', '..888..'],
    arcade: ['2222222', '2000002', '20bc0e2', '20c0b02', '2000002', '2282a22', '2222222', '2222222'],
    plush: ['..........', '.cccccc...', 'c7cccccc.c', 'c0ccccccccc', 'cccccccc.c', '.c7c7c....'],
    voidcrystal: ['...e...', '..e2e..', '..e2e..', '.e822e.', '.e828e.', '..222..', '.55555.'],
    orb: ['..eee..', '.e7ede.', 'e7deede', 'edeeede', '.edeed.', '..eee..', '..555..', '.55555.'],
    rug: ['..........', '..........', '..........', '..........', '..........', '8e8e8e8e8e', 'e8e8e8e8e8'],
    snowglobe: ['..ccc..', '.c7c7c.', 'c7ccc7c', 'cc7c7cc', '.ccbcc.', '..444..', '.44444.'],
    compass: ['..aaa..', '.a777a.', 'a77877a', 'a78887a', 'a77877a', '.a777a.', '..aaa..'],
    jukebox: ['.99999.', '9a8e8a9', '9e8a8e9', '9999999', '9777779', '9707079', '9999999']
  };
  S.decor = function (name, frame) {
    var k = 'decor:' + name + ':' + (frame || 0);
    if (S.cache[k]) return S.cache[k];
    var rows = DECOR[name] || DECOR.plant;
    if (name === 'cat' && frame) rows = ['5...5..', '55.55..', '505a5..', '55555...', '.55555.5', '.555555.', '..5.5.5.'];
    return (S.cache[k] = R.sprite(rows));
  };

  // ---------------------------------------------------------------- whale (sector 5)
  var WHALE = [
    '...........111111111........',
    '........1111cccccccc111.....',
    '......11cccccccc7ccccccc1...',
    '.....1cccc7ccccccccccccccc1..',
    '....1ccccccccccccccc7cccc0c1.',
    '...1cccccccccccccccccccccccc1',
    '11.1c7cccccccc7cccccccccccccc1',
    '1c11ccccccccccccccccccccccccc1',
    '1cc1dddddddddddddddddddddddd1.',
    '1c1.1dd7ddddd6ddddd6ddddd61..',
    '11...1dddddddddddddddddd11...',
    '......11dddd1111dddddd11.....',
    '........1111....111111.......'
  ];
  S.whale = function (frame, flip) {
    var k = 'whale:' + frame + ':' + (flip ? 1 : 0);
    if (S.cache[k]) return S.cache[k];
    var rows = WHALE.slice();
    if (frame) {
      rows = rows.map(function (r, i) {
        if (i >= 5 && i <= 10) return '..' + r.substring(2);
        return r;
      });
      rows[3] = '1' + rows[3].substring(1);
      rows[4] = '1c' + rows[4].substring(2);
      rows[5] = '1cc' + rows[5].substring(3);
      rows[6] = '.1c' + rows[6].substring(3);
      rows[7] = '..11' + rows[7].substring(4);
    }
    var c = R.sprite(rows);
    if (flip) c = R.flipH(c);
    return (S.cache[k] = c);
  };

  // ---------------------------------------------------------------- noise helpers
  function valueNoise(w, h, cell, rng) {
    var gw = Math.ceil(w / cell) + 1, gh = Math.ceil(h / cell) + 1, g = [], x, y;
    for (y = 0; y < gh; y++) { g.push([]); for (x = 0; x < gw; x++) g[y].push(rng()); }
    // wrap horizontally so planet textures tile seamlessly
    for (y = 0; y < gh; y++) g[y][gw - 1] = g[y][0];
    var out = [];
    for (y = 0; y < h; y++) {
      out.push(new Float32Array(w));
      for (x = 0; x < w; x++) {
        var fx = x / cell, fy = y / cell, ix = Math.floor(fx), iy = Math.floor(fy);
        var tx = fx - ix, ty = fy - iy;
        tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
        var a = g[iy][ix], b = g[iy][ix + 1], c = g[iy + 1][ix], d = g[iy + 1][ix + 1];
        out[y][x] = U.lerp(U.lerp(a, b, tx), U.lerp(c, d, tx), ty);
      }
    }
    return out;
  }

  // ---------------------------------------------------------------- planets
  // def: { seed, cols: [dark, mid, light, accent], style, ring: colour|null, atmo: colour|null }
  S.planetTexture = function (def, r) {
    var tw = Math.max(32, Math.round(r * 4)), th = Math.max(16, Math.round(r * 2));
    var rng = U.rng(def.seed * 977 + r);
    var n1 = valueNoise(tw, th, Math.max(4, r / 1.5), rng);
    var n2 = valueNoise(tw, th, Math.max(2, r / 4), rng);
    var tex = [];
    var cols = def.cols;
    for (var y = 0; y < th; y++) {
      var row = [];
      for (var x = 0; x < tw; x++) {
        var v = n1[y][x] * 0.7 + n2[y][x] * 0.3, c;
        var lat = y / th;
        switch (def.style) {
          case 'bands':
            var b = Math.sin(lat * 18 + n1[y][x] * 4) * 0.5 + 0.5;
            c = b > 0.75 ? cols[2] : (b > 0.4 ? cols[1] : cols[0]);
            if (n2[y][x] > 0.86 && b > 0.5) c = cols[3];
            break;
          case 'continents':
            c = v > 0.55 ? (v > 0.68 ? cols[3] : cols[2]) : (v > 0.45 ? cols[1] : cols[0]);
            if (lat < 0.12 || lat > 0.88) c = 7;
            break;
          case 'ice':
            c = v > 0.6 ? 7 : (v > 0.45 ? cols[2] : (v > 0.3 ? cols[1] : cols[0]));
            break;
          case 'crystal':
            var f = (Math.abs(Math.sin(x * 0.7 + y * 0.4)) + v) / 2;
            c = f > 0.7 ? cols[3] : (f > 0.5 ? cols[2] : (f > 0.35 ? cols[1] : cols[0]));
            break;
          case 'cracks':
            c = Math.abs(v - 0.5) < 0.03 ? cols[3] : (v > 0.5 ? cols[1] : cols[0]);
            if (n2[y][x] > 0.78) c = cols[2];
            break;
          case 'desert':
            c = v > 0.62 ? cols[2] : (v > 0.42 ? cols[1] : cols[0]);
            if (n2[y][x] > 0.85) c = cols[3];
            break;
          default:
            c = v > 0.5 ? cols[1] : cols[0];
        }
        row.push(c);
      }
      tex.push(row);
    }
    return tex;
  };

  var PLANET_FRAMES = 48;
  S.planetFrame = function (def, r, t) {
    var idx = Math.floor(((t % 1) + 1) % 1 * PLANET_FRAMES);
    var k = 'planet:' + def.id + ':' + r + ':' + idx;
    if (S.cache[k]) return S.cache[k];
    var tk = 'ptex:' + def.id + ':' + r;
    var tex = S.cache[tk] || (S.cache[tk] = S.planetTexture(def, r));
    var tw = tex[0].length, th = tex.length;
    var pad = def.ring !== undefined && def.ring !== null ? Math.ceil(r * 0.8) : 1;
    var size = Math.ceil(r * 2 + 1 + pad * 2);
    var c = R.makeCanvas(size, size);
    var cx = Math.floor(size / 2), cy = Math.floor(size / 2);
    var x, y;
    var drawRing = function (front) {
      if (def.ring === undefined || def.ring === null) return;
      var rx = r * 1.65, ry = r * 0.42;
      for (var a = 0; a < 360; a += 1) {
        var rad = a * Math.PI / 180;
        var px = Math.round(cx + Math.cos(rad) * rx), py = Math.round(cy + Math.sin(rad) * ry);
        var isFront = Math.sin(rad) > 0;
        if (isFront !== front) continue;
        var dx = px - cx, dy = py - cy;
        if (!front && dx * dx + dy * dy < r * r) continue;
        R.pset(px, py, def.ring, c.x);
        if (a % 3 === 0) R.pset(Math.round(cx + Math.cos(rad) * (rx - 2)), Math.round(cy + Math.sin(rad) * (ry - 1)), DH.DARK[def.ring], c.x);
      }
    };
    drawRing(false);
    var rot = idx / PLANET_FRAMES;
    for (y = -r; y <= r; y++) for (x = -r; x <= r; x++) {
      var d2 = x * x + y * y;
      if (d2 > r * r + r * 0.6) continue;
      var nx = x / (r + 0.5), ny = y / (r + 0.5);
      var z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      var lon = Math.atan2(nx, z), lat = Math.asin(U.clamp(ny, -1, 1));
      var u = Math.floor(((lon / (Math.PI * 2) + rot) % 1 + 1) % 1 * tw) % tw;
      var v = U.clamp(Math.floor((lat / Math.PI + 0.5) * th), 0, th - 1);
      var col = tex[v][u];
      // light from upper-left
      var light = -nx * 0.55 - ny * 0.45 + z * 0.7;
      if (light < 0.05) col = DH.DARK[DH.DARK[col]];
      else if (light < 0.3) col = ((x + y) & 1) ? DH.DARK[col] : DH.DARK[DH.DARK[col]];
      else if (light < 0.45) col = ((x + y) & 1) ? col : DH.DARK[col];
      if (col === 0 && def.night !== undefined) col = def.night;
      R.pset(cx + x, cy + y, col, c.x);
    }
    if (def.atmo !== undefined && def.atmo !== null) {
      // thin lit rim on the sunny side
      for (var a2 = 0; a2 < 360; a2 += 2) {
        var rr = a2 * Math.PI / 180;
        if (Math.cos(rr) * -0.6 + Math.sin(rr) * -0.6 < 0.1) continue;
        R.pset(Math.round(cx + Math.cos(rr) * (r + 1)), Math.round(cy + Math.sin(rr) * (r + 1)), def.atmo, c.x);
      }
    }
    drawRing(true);
    return (S.cache[k] = c);
  };

  // ---------------------------------------------------------------- asteroids
  // kind: 'rock' (hazard) or 'ore'. cols: [dark, mid, light] for the rock body.
  S.asteroidBase = function (seed, r, kind, ore, cols) {
    var k = 'astb:' + seed + ':' + r + ':' + kind + ':' + ore + ':' + cols.join(',');
    if (S.cache[k]) return S.cache[k];
    var rng = U.rng(seed);
    var size = r * 2 + 3;
    var c = R.makeCanvas(size, size);
    var cx = Math.floor(size / 2), cy = Math.floor(size / 2);
    var harm = [];
    for (var i = 0; i < 4; i++) harm.push({ f: 2 + Math.floor(rng() * 4), p: rng() * 6.28, a: (kind === 'rock' ? 0.16 : 0.1) * rng() });
    var grid = [];
    for (var y = 0; y < size; y++) { grid.push([]); for (var x = 0; x < size; x++) grid[y].push(-1); }
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) {
      var dx = x - cx, dy = y - cy;
      var ang = Math.atan2(dy, dx);
      var rad = r;
      harm.forEach(function (h) { rad += Math.sin(ang * h.f + h.p) * h.a * r; });
      if (kind === 'rock') rad += (rng() - 0.5) * 0.8;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d <= rad) {
        var light = (-dx - dy) / (r * 1.4) + 0.2;
        var col = light > 0.45 ? cols[2] : (light > -0.25 ? cols[1] : cols[0]);
        if (d > rad - 1.2 && light < 0) col = cols[0];
        grid[y][x] = col;
      }
    }
    // craters
    var nCr = Math.floor(r / 3) + (rng() < 0.5 ? 1 : 0);
    for (i = 0; i < nCr; i++) {
      var ca = rng() * 6.28, cd = rng() * r * 0.55;
      var crx = Math.round(cx + Math.cos(ca) * cd), cry = Math.round(cy + Math.sin(ca) * cd);
      var crr = 1 + Math.floor(rng() * Math.max(1, r / 4));
      for (y = -crr; y <= crr; y++) for (x = -crr; x <= crr; x++) {
        if (x * x + y * y > crr * crr) continue;
        var gx = crx + x, gy = cry + y;
        if (grid[gy] && grid[gy][gx] >= 0) grid[gy][gx] = (x + y > 0) ? cols[2] : cols[0];
      }
      if (grid[cry] && grid[cry][crx] >= 0) grid[cry][crx] = cols[0];
    }
    // ore veins: bright clusters
    if (kind === 'ore' && DH.D) {
      var oc = DH.D.ORES[ore].cols;
      var clusters = 2 + Math.floor(r / 2.5);
      for (i = 0; i < clusters; i++) {
        var oa = rng() * 6.28, od = rng() * r * 0.8;
        var ox = Math.round(cx + Math.cos(oa) * od), oy = Math.round(cy + Math.sin(oa) * od);
        var pts = [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, -1]];
        var n = 4 + Math.floor(rng() * 4);
        for (var j = 0; j < n; j++) {
          var p = pts[j % pts.length];
          var gx2 = ox + p[0], gy2 = oy + p[1];
          if (grid[gy2] && grid[gy2][gx2] >= 0) grid[gy2][gx2] = j === 0 ? oc[0] : oc[1];
        }
      }
    }
    // outline
    var out = [];
    for (y = 0; y < size; y++) { out.push(grid[y].slice()); }
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) {
      if (grid[y][x] >= 0) continue;
      var nb = (grid[y - 1] && grid[y - 1][x] >= 0) || (grid[y + 1] && grid[y + 1][x] >= 0) || grid[y][x - 1] >= 0 || grid[y][x + 1] >= 0;
      if (nb) out[y][x] = kind === 'rock' ? 0 : 0;
    }
    return (S.cache[k] = R.fromGrid(out));
  };
  var AST_FRAMES = 16;
  S.asteroidFrame = function (seed, r, kind, ore, cols, ang) {
    var idx = Math.floor(((ang % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * AST_FRAMES) % AST_FRAMES;
    var k = 'ast:' + seed + ':' + r + ':' + kind + ':' + ore + ':' + cols.join(',') + ':' + idx;
    if (S.cache[k]) return S.cache[k];
    return (S.cache[k] = R.rotate(S.asteroidBase(seed, r, kind, ore, cols), idx / AST_FRAMES * Math.PI * 2));
  };

  // ---------------------------------------------------------------- star field
  // layered parallax stars. Returns an object you can draw each frame.
  S.makeStarfield = function (seed, count) {
    var rng = U.rng(seed);
    var stars = [];
    for (var i = 0; i < count; i++) {
      var layer = rng() < 0.6 ? 0 : (rng() < 0.75 ? 1 : 2);
      stars.push({
        x: rng() * 1024, y: rng() * 1024, layer: layer,
        col: layer === 2 ? 7 : (layer === 1 ? (rng() < 0.5 ? 6 : 12) : (rng() < 0.5 ? 5 : 13)),
        tw: rng() < 0.25 ? rng() * 6.28 : -1, big: layer === 2 && rng() < 0.3
      });
    }
    return {
      stars: stars,
      draw: function (ox, oy, t, ctx) {
        var W = R.W, H = R.H;
        var speeds = [0.15, 0.4, 0.8];
        for (var i = 0; i < stars.length; i++) {
          var s = stars[i];
          var sp = speeds[s.layer];
          var x = ((s.x - ox * sp) % 1024 + 1024) % 1024;
          var y = ((s.y - oy * sp) % 1024 + 1024) % 1024;
          if (x >= W || y >= H) continue;
          var col = s.col;
          if (s.tw >= 0) {
            var ph = Math.sin(t * 2.2 + s.tw);
            if (ph < -0.6) continue;
            if (ph > 0.85) col = 7;
          }
          R.pset(x, y, col, ctx);
          if (s.big && Math.sin(t * 1.3 + s.x) > 0.2) {
            R.pset(x - 1, y, 13, ctx); R.pset(x + 1, y, 13, ctx); R.pset(x, y - 1, 13, ctx); R.pset(x, y + 1, 13, ctx);
          }
        }
      }
    };
  };

  // soft dithered nebula clouds (two palette colours), tiles horizontally
  S.makeNebula = function (w, h, seed, c1, c2) {
    var k = 'neb:' + w + ':' + h + ':' + seed + ':' + c1 + ':' + c2;
    if (S.cache[k]) return S.cache[k];
    var rng = U.rng(seed);
    var n = valueNoise(w, h, 48, rng), m = valueNoise(w, h, 14, rng);
    var c = R.makeCanvas(w, h);
    c.x.fillStyle = DH.PAL[c1];
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var v = n[y][x] * 0.75 + m[y][x] * 0.25;
      var col = -1;
      if (v > 0.8) col = ((x + y) & 1) ? c1 : (((x * 3 + y * 5) % 11 === 0) ? c2 : -1);
      else if (v > 0.68) col = ((x + y) & 1) ? c1 : -1;
      else if (v > 0.6) col = ((x & 1) === 0 && (y & 1) === 0) ? c1 : -1;
      if (col >= 0) { c.x.fillStyle = DH.PAL[col]; c.x.fillRect(x, y, 1, 1); }
    }
    return (S.cache[k] = c);
  };
  // draw a tiling nebula with parallax offset
  S.drawNebula = function (neb, ox, oy, ctx) {
    var w = neb.width, h = neb.height;
    var x0 = -(((Math.round(ox) % w) + w) % w), y0 = -(((Math.round(oy) % h) + h) % h);
    for (var y = y0; y < R.H; y += h) for (var x = x0; x < R.W; x += w) (ctx || R.ctx).drawImage(neb, x, y);
  };

  DH.Spr = S;
})(window.DH = window.DH || {});

// small side-view of the player's ship (title screen, drone-run mothership, map marker)
(function (DH) {
  'use strict';
  var R = DH.R, S = DH.Spr;
  var MINI = [
    '...............OOOOOOOO.........................',
    '.............OOLLLLLLLLOO.......................',
    '..OOOO.....OOLLMMMMMMMMMMOOOOOOOOOOOOO..........',
    '.OEEEEO..OOLMMMMMMMMMMMMMMMMMMMMMMMMMMOOOO......',
    'OEEEEEEOOLMMWWMMWWMMWWMMWWMMMMMMMMMMMMMMMMOO....',
    'OEEEEEEOMMMMWWMMWWMMWWMMWWMMMMTTTTMMMMWWWWWMOO..',
    'OEEEEEEOMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWWWWWWWMO.',
    '.OEEEEOOSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSO',
    '..OOOO..OOSSSSSSTTSSSSSSSSSSSSTTSSSSSSSSSSSSOOO.',
    '..........OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO....'
  ];
  S.miniShip = function (hull) {
    var k = 'mini:' + hull;
    if (S.cache[k]) return S.cache[k];
    var h = DH.D.HULLS[hull] || DH.D.HULLS.steel;
    var map = { M: h.main, S: h.shade, L: h.light, T: h.trim, W: 12, O: 0, E: 5 };
    return (S.cache[k] = R.sprite(MINI, map));
  };
})(window.DH);
