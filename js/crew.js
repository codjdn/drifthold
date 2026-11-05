// DRIFTHOLD - crew.js
// Procedural crew: names, looks (species, hair, colours) and traits, their pixel sprites
// (stand / walk / sit / sleep / head) and the little life they live aboard the ship.
(function (DH) {
  'use strict';
  var R = DH.R, U = DH.U, D = DH.D;
  var Crew = { actors: {} };

  var HUMAN_SKIN = [15, 4, 14, 15, 9];
  var ALIEN_SKIN = [11, 13, 12, 3, 14];
  var HAIR_COLS = [0, 4, 9, 10, 8, 2, 7, 5, 14, 12, 1];
  var SUITS = [12, 8, 9, 3, 13, 2, 11, 14, 5, 10];
  var HUMAN_HAIR = ['short', 'long', 'spiky', 'bun', 'bald', 'cap', 'mohawk', 'bob'];

  // ------------------------------------------------------------------ generation
  Crew.generate = function (seedKey, from) {
    var r = U.rng(U.hash(seedKey));
    var name = U.pick(D.NAME_A, r) + U.pick(D.NAME_B, r);
    if (name.length < 3) name += U.pick(['O', 'A', 'I', 'Y'], r);
    var roll = r();
    var species = roll < 0.68 ? 'human' : (roll < 0.86 ? 'alien' : 'robot');
    var look = { species: species };
    if (species === 'human') {
      look.skin = U.pick(HUMAN_SKIN, r);
      look.hair = U.pick(HUMAN_HAIR, r);
      look.hairCol = U.pick(HAIR_COLS, r);
      if (look.hairCol === look.skin) look.hairCol = 0;
    } else if (species === 'alien') {
      look.skin = U.pick(ALIEN_SKIN, r);
      look.hair = U.pick(['antenna', 'antenna', 'blob', 'horns'], r);
      look.hairCol = U.pick([10, 14, 7, 8, 12], r);
    } else {
      look.skin = U.pick([6, 6, 13, 15], r);
      look.hair = U.pick(['dome', 'visor'], r);
      look.hairCol = U.pick([8, 11, 12, 10], r);
    }
    look.suit = U.pick(SUITS, r);
    if (look.suit === look.skin) look.suit = 12;
    look.acc = U.pick([10, 8, 7, 11, 12, 14, 9], r);
    look.glasses = species === 'human' && r() < 0.18;
    var trait = U.pick(D.TRAIT_KEYS, r);
    return { id: 'c' + (U.hash(seedKey) % 1e8).toString(36), name: name, look: look, trait: trait, from: from };
  };

  // candidates waiting at a planet - deterministic per planet & how many you've recruited there
  Crew.candidates = function (s, planet) {
    var n = s.recruits[planet] || 0;
    var out = [];
    for (var i = 0; i < 2; i++) {
      var c = Crew.generate(planet + ':' + (n + i) + ':' + (s.created || 0), planet);
      if (s.crew.some(function (x) { return x.id === c.id; })) c = Crew.generate(planet + ':x' + (n + i) + ':' + s.crew.length, planet);
      out.push(c);
    }
    return out;
  };

  // ------------------------------------------------------------------ sprites
  function headRows(look) {
    var h = look.hair;
    switch (h) {
      case 'bald': return ['.....', '.SSS.', 'SSSSS', '.ESE.', '.SSS.'];
      case 'long': return ['.HHH.', 'HHHHH', 'HSSSH', 'HESEH', 'HSSSH'];
      case 'spiky': return ['H.H.H', 'HHHHH', 'HSSSH', '.ESE.', '.SSS.'];
      case 'bun': return ['..H..', '.HHH.', 'HSSSH', '.ESE.', '.SSS.'];
      case 'cap': return ['.AAA.', 'AAAAA', 'HSSSH', '.ESE.', '.SSS.'];
      case 'mohawk': return ['..H..', '.SHS.', 'SSSSS', '.ESE.', '.SSS.'];
      case 'bob': return ['.HHH.', 'HHHHH', 'HHSSH', 'HESEH', '.SSS.'];
      case 'antenna': return ['A...A', '.S.S.', 'SSSSS', 'SESES', '.SSS.'];
      case 'blob': return ['.SSS.', 'SSSSS', 'SSSSS', 'SESES', '.SSS.'];
      case 'horns': return ['A...A', 'ASSSA', 'SSSSS', 'SESES', '.SSS.'];
      case 'dome': return ['..A..', '.SSS.', 'SSSSS', 'SEEES', '.SSS.'];
      case 'visor': return ['.SSS.', 'SSSSS', 'SEEES', 'SSSSS', '.SSS.'];
      default: return ['.HHH.', 'HHHHH', 'HSSSH', '.ESE.', '.SSS.'];
    }
  }
  var BODY = ['BBBBB', 'SBBBS', '.BBB.'];
  var LEGS = { stand: ['.L.L.', '.F.F.'], walkA: ['L...L', 'F...F'], walkB: ['.L.L.', '..F..'], sit: ['.LLL.', '.L.L.'] };

  function colourMap(look) {
    var eye = look.species === 'robot' ? look.hairCol : 0;
    return {
      H: look.hairCol, S: look.skin, E: eye, B: look.suit, D: DH.DARK[look.suit],
      L: look.species === 'robot' ? 5 : 1, F: 0, A: look.acc, G: 0
    };
  }
  function rowsFor(look, legs) {
    var head = headRows(look).slice();
    if (look.glasses) head[3] = head[3].replace('ESE', 'GSG');
    return head.concat(BODY).concat(LEGS[legs]);
  }

  Crew.sprites = function (c) {
    var k = 'crew:' + c.id;
    var cache = DH.Spr.cache;
    if (cache[k]) return cache[k];
    var map = colourMap(c.look);
    var out = {};
    ['stand', 'walkA', 'walkB', 'sit'].forEach(function (pose) {
      var spr = R.sprite(rowsFor(c.look, pose), map);
      out[pose] = [spr, R.flipH(spr)];
    });
    // lying down: rotate the standing sprite a quarter turn (head on the left)
    var st = rowsFor(c.look, 'stand');
    var lying = [];
    for (var x = 0; x < 5; x++) {
      var row = '';
      for (var y = 0; y < st.length; y++) row += st[y][4 - x] || '.';
      lying.push(row);
    }
    out.sleep = R.sprite(lying, map);
    out.head = R.sprite(headRows(c.look).concat(['BBBBB']), map);
    out.headBig = R.outlined(out.head, 0);
    return (cache[k] = out);
  };

  // ------------------------------------------------------------------ behaviour (visual only)
  // Each crew member gets an "actor" with a room they're shown in and a tiny state machine.
  function actorFor(c) {
    var a = Crew.actors[c.id];
    if (!a) {
      a = Crew.actors[c.id] = { slot: null, x: 10 + Math.random() * 20, dir: 1, state: 'idle', t: Math.random() * 3, tx: 20, bubble: null, fade: 0, next: null, seed: Math.random() };
    }
    return a;
  }
  Crew.actor = actorFor;

  function homeSlot(s, c) {
    if (c.room !== null && c.room !== undefined && s.slots[c.room]) return c.room;
    var q = DH.Sim.findSlot(s, 'quarters');
    if (q >= 0) return q;
    return 0;
  }
  // somewhere fun to wander to now and then
  function wanderSlot(s, c, a) {
    var opts = [];
    var types = ['galley', 'lounge', 'quarters', 'hydroponics', 'observatory', 'bridge'];
    types.forEach(function (t) { var i = DH.Sim.findSlot(s, t); if (i >= 0) opts.push(i); });
    if (!opts.length) return homeSlot(s, c);
    return opts[Math.floor(Math.random() * opts.length)];
  }

  Crew.update = function (s, dt, stationsFor, time) {
    var night = (time % 160) > 128; // short "quiet hours" in the ship's day
    s.crew.forEach(function (c, idx) {
      var a = actorFor(c);
      if (a.hop > 0) a.hop = Math.max(0, a.hop - dt);
      if (a.say) { a.say.t -= dt; if (a.say.t <= 0) a.say = null; }
      if (a.slot === null || !s.slots[a.slot]) { a.slot = homeSlot(s, c); a.x = 8 + Math.random() * 26; }
      if (a.bubble) { a.bubble.t -= dt; if (a.bubble.t <= 0) a.bubble = null; }
      a.t -= dt;
      if (a.state === 'door') {
        a.fade += dt;
        if (a.fade > 0.35) {
          a.slot = a.next; a.next = null; a.fade = 0; a.x = Math.random() < 0.5 ? 3 : 34;
          a.state = 'idle'; a.t = 0.2;
        }
        return;
      }
      if (a.state === 'walk') {
        var sp = 10 * dt;
        if (Math.abs(a.tx - a.x) <= sp) { a.x = a.tx; a.state = a.after || 'idle'; a.after = null; a.t = 2 + Math.random() * 5; }
        else { a.dir = a.tx > a.x ? 1 : -1; a.x += a.dir * sp; }
        return;
      }
      if (a.t > 0) return;
      // decide what to do next
      var room = s.slots[a.slot];
      var home = homeSlot(s, c);
      var sleepy = c.trait === 'sleepyhead' ? 0.45 : 0.18;
      var qSlot = DH.Sim.findSlot(s, 'quarters');
      if (night && qSlot >= 0 && Math.random() < (c.trait === 'nightowl' ? 0.05 : 0.6) && idx % 2 === 0) {
        if (a.slot !== qSlot) { goTo(a, qSlot); return; }
        sleepAt(a, s, qSlot, idx, stationsFor);
        return;
      }
      if (a.slot !== home && Math.random() < 0.55) { goTo(a, home); return; }
      var roll = Math.random();
      if (a.slot === home && c.room !== null && c.room !== undefined && roll < 0.55) {
        // work at a station
        var st = stationsFor(room.type, room.lvl);
        var spot = st[idx % st.length];
        a.tx = spot.x; a.after = spot.pose === 'sit' ? 'sit' : 'work'; a.state = 'walk';
        return;
      }
      if (roll < 0.68 && qSlot === a.slot && Math.random() < sleepy) { sleepAt(a, s, qSlot, idx, stationsFor); return; }
      if (roll < 0.8) { goTo(a, wanderSlot(s, c, a)); return; }
      // chat with someone in the same room, or just mill about
      var mates = s.crew.filter(function (o) { return o !== c && actorFor(o).slot === a.slot && actorFor(o).state !== 'door'; });
      if (mates.length && Math.random() < 0.6) {
        var m = actorFor(mates[0]);
        a.tx = U.clamp(m.x + (m.x > 20 ? -7 : 7), 3, 34);
        a.state = 'walk'; a.after = 'chat';
        a.bubble = { icon: U.pick(['heart', 'note', 'dots', 'star', 'bang', D.ORE_ORDER[Math.floor(Math.random() * 3)]]), t: 2.5 };
        if (Math.random() < 0.5) m.bubble = { icon: U.pick(['dots', 'heart', 'note', 'smile']), t: 2.2 };
        return;
      }
      a.tx = 3 + Math.random() * 31; a.state = 'walk'; a.after = 'idle';
    });
  };
  function goTo(a, slot) {
    if (slot === a.slot) { a.t = 1; return; }
    a.tx = Math.random() < 0.5 ? 2 : 35; a.state = 'walk'; a.after = 'leave';
    a.next = slot;
    a.leaveTo = slot;
  }
  function sleepAt(a, s, slot, idx, stationsFor) {
    var r = s.slots[slot];
    var beds = stationsFor('quarters:beds', r.lvl);
    var b = beds[idx % beds.length];
    a.bed = b; a.state = 'sleep'; a.t = 8 + Math.random() * 10; a.x = b.x;
    a.bubble = { icon: 'zzz', t: a.t };
  }
  // called each frame after update: turn "leave" into a door fade
  Crew.post = function (s) {
    s.crew.forEach(function (c) {
      var a = actorFor(c);
      if (a.state === 'leave') { a.state = 'door'; a.fade = 0; a.next = a.leaveTo; }
    });
  };

  // draw one crew member. ix/iy = interior origin of their room; floorY = feet line
  Crew.draw = function (c, ix, iy, floorY, time) {
    var a = actorFor(c);
    var sp = Crew.sprites(c);
    var x = Math.round(ix + a.x), f = a.dir < 0 ? 1 : 0;
    var img, y;
    if (a.state === 'sleep' && a.bed) {
      img = sp.sleep;
      R.img(img, ix + a.bed.x, iy + a.bed.y - 4);
      a.rect = { x: ix + a.bed.x - 1, y: iy + a.bed.y - 6, w: img.width + 2, h: img.height + 4 };
      if (Math.floor(time * 1.5 + a.seed * 4) % 3 === 0) DH.Font.draw(R.ctx, 'Z', ix + a.bed.x + 11, iy + a.bed.y - 10 - Math.floor((time * 3) % 3), 7, { font: 'small' });
      return;
    }
    if (a.state === 'door' && Math.floor(a.fade * 20) % 2) return;
    if (a.state === 'walk' || a.state === 'leave') img = sp[Math.floor(time * 6 + a.seed * 5) % 2 ? 'walkA' : 'walkB'][f];
    else if (a.state === 'sit') img = sp.sit[f];
    else img = sp.stand[f];
    y = floorY - img.height;
    if (a.state === 'sit') y += 2;
    if (a.state === 'work' && Math.floor(time * 2 + a.seed * 3) % 4 === 0) y -= 1;
    if (a.state === 'chat' && Math.floor(time * 3 + a.seed * 3) % 2 === 0) y -= 1;
    if (a.hop > 0) y -= Math.round(Math.sin(a.hop / 0.45 * Math.PI) * 5);
    R.img(img, x, y);
    a.rect = { x: x - 2, y: y - 2, w: img.width + 4, h: img.height + 4 };
    if (a.bubble && a.state !== 'door') {
      var bx = x + 3, by = y - 10;
      R.box(bx - 1, by - 1, 11, 10, 0);
      R.rect(bx, by, 9, 8, 7);
      R.pset(bx + 1, by + 8, 7); R.pset(bx, by + 9, 0);
      var ic = DH.Spr.icon(a.bubble.icon);
      R.img(ic, bx + 1, by + 1);
    }
  };

  // tapping a crew member: they hop, chirp and say something in character
  var LINES = {
    tinkerer: ['NEED A WRENCH?', 'I CAN FIX THAT!', 'ONE MORE BOLT...'],
    greenthumb: ['THE FERNS SAY HI!', 'GROW, LITTLE ONES!', 'SMELL THAT SOIL!'],
    smelter: ['HOT HOT HOT!', 'ALLOY TIME!', 'MIND THE SPARKS!'],
    stargazer: ['SO MANY STARS!', 'I SAW A COMET!', 'LOOK UP, CAPTAIN!'],
    scholar: ['FASCINATING!', 'DATA IS BEAUTIFUL', 'HYPOTHESIS: SNACKS'],
    cook: ['SOUP\'S ON!', 'TASTE THIS!', 'MORE SALT?'],
    pilot: ['LET\'S FLY FASTER!', 'BARREL ROLL?', 'I LOVE THIS SHIP!'],
    mechanic: ['SHE\'S PURRING!', 'NEEDS MORE TAPE', 'ALL SYSTEMS GO!'],
    cheerful: ['BEST DAY EVER!', 'HI HI HI!', 'YOU\'RE GREAT!'],
    lucky: ['FEELING LUCKY!', 'FOUND A PENNY!', 'GOOD VIBES!'],
    nightowl: ['IS IT NIGHT YET?', 'I LOVE THE DARK', '*YAWNS*'],
    sleepyhead: ['ZZZ... HUH? OH HI', 'FIVE MORE MINUTES', 'NAP BUDDY?']
  };
  var GENERIC = ['HI CAPTAIN!', 'HEY!', 'OH! HELLO!', 'NICE HAUL!', 'GO GO GO!'];
  var SPAM = ['OKAY OKAY!', 'THAT TICKLES!', 'HEE HEE!', 'STOP IT!', 'WHEEE!'];
  Crew.poke = function (c) {
    var a = actorFor(c), now = Date.now();
    a.pokes = (a.lastPoke && now - a.lastPoke < 1500) ? (a.pokes || 0) + 1 : 1;
    a.lastPoke = now;
    a.hop = 0.45;
    var pool = a.pokes >= 4 ? SPAM : (Math.random() < 0.65 ? (LINES[c.trait] || GENERIC) : GENERIC);
    a.say = { text: U.pick(pool), t: 1.8 };
    a.bubble = { icon: a.pokes >= 4 ? 'smile' : U.pick(['heart', 'note', 'smile', 'star']), t: 1.6 };
    if (a.state === 'sleep') { a.state = 'idle'; a.t = 1.5; a.say = { text: U.pick(['WHA-? I\'M UP!', 'HUH?! OH, HI!']), t: 1.8 }; }
    var pitch = Math.floor(a.seed * 8) + Math.min(8, a.pokes * 2);
    if (DH.Snd) DH.Snd.play('chirp', pitch);
    return a;
  };

  Crew.traitName = function (t) { return (D.TRAITS[t] || { name: t }).name; };
  DH.Crew = Crew;
})(window.DH);
