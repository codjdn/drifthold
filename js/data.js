// DRIFTHOLD - data.js
// Every number that shapes pacing lives here: ores, rooms, costs, rates, sectors, planets,
// research, cosmetics, traits, goals and anomalies. tools/pacing-sim.js reads this file too.
(function (DH) {
  'use strict';
  var D = {};

  // ------------------------------------------------------------------ resources
  // cols: [highlight, main] used for ore veins, particles and pickups
  D.ORES = {
    cu: { name: 'COPPER', cols: [15, 9], dark: 4, icon: 'cu', desc: 'SOFT ORANGE METAL. THE BACKBONE OF EVERY HULL.' },
    ice: { name: 'ICE', cols: [7, 12], dark: 1, icon: 'ice', desc: 'FROZEN WATER. DRINK IT, GROW WITH IT, BUILD WITH IT.' },
    cry: { name: 'CRYSTAL', cols: [7, 14], dark: 2, icon: 'cry', desc: 'HUMMING PINK CRYSTAL. GOOD FOR SENSORS AND CIRCUITS.' },
    gold: { name: 'GOLD', cols: [7, 10], dark: 9, icon: 'gold', desc: 'SHINY AND CONDUCTIVE. EVERYBODY LIKES GOLD.' },
    dust: { name: 'STARDUST', cols: [7, 15], dark: 13, icon: 'dust', desc: 'RARE GLITTER FROM DEAD STARS. HANDLE WITH WONDER.', rare: true },
    frost: { name: 'FROSTITE', cols: [7, 13], dark: 5, icon: 'frost', desc: 'ICE THAT NEVER MELTS. FOUND ONLY IN THE FROSTLINE.' },
    ion: { name: 'IONITE', cols: [7, 11], dark: 3, icon: 'ion', desc: 'CRACKLES WITH STORED LIGHTNING. ION EXPANSE ONLY.' },
    pearl: { name: 'STARPEARL', cols: [7, 15], dark: 14, icon: 'pearl', desc: 'SHED BY SPACE WHALES. WARM TO THE TOUCH.' },
    void: { name: 'VOIDGLASS', cols: [14, 2], dark: 1, icon: 'void', desc: 'GLASS FROM THE EDGE OF NOTHING. IT HUMS AT NIGHT.' }
  };
  D.ORE_ORDER = ['cu', 'ice', 'cry', 'gold', 'frost', 'ion', 'pearl', 'void', 'dust'];
  D.MADE = {
    food: { name: 'FOOD', icon: 'food', desc: 'GROWN IN HYDROPONICS. FEEDS THE GALLEY AND NEW RECRUITS.' },
    alloy: { name: 'ALLOY', icon: 'alloy', desc: 'REFINED FROM COPPER. NEEDED FOR BIGGER BUILDS.' },
    data: { name: 'DATA', icon: 'data', desc: 'SCIENCE! PRODUCED BY THE LAB AND OBSERVATORY.' }
  };
  D.RES_ORDER = ['cu', 'ice', 'cry', 'gold', 'frost', 'ion', 'pearl', 'void', 'dust', 'food', 'alloy', 'data'];
  D.resName = function (k) { return (D.ORES[k] || D.MADE[k] || { name: k }).name; };
  D.resIcon = function (k) { return (D.ORES[k] || D.MADE[k] || { icon: 'bang' }).icon; };

  // ------------------------------------------------------------------ rooms
  // cost[L-1] = cost to reach level L (L1 = build). rate[] per minute where relevant.
  D.ROOMS = {
    bridge: {
      name: 'BRIDGE', short: 'BRIDGE', wall: 1, desc: 'COMMAND DECK. EACH LEVEL LETS THE HULL GROW BY 2 ROOMS.',
      cost: [null, { cu: 14, ice: 8 }, { cu: 36, ice: 22 }, { cu: 60, cry: 40, alloy: 18 }, { gold: 50, alloy: 56, frost: 25 }],
      crewEffect: 'CREW HERE: +2S DRONE FUEL EACH'
    },
    quarters: {
      name: 'QUARTERS', short: 'QUARTERS', wall: 2, desc: 'BUNKS FOR YOUR CREW. MORE LEVELS, MORE BEDS.',
      cost: [{ cu: 8, ice: 4 }, { cu: 24, ice: 16 }, { cu: 40, ice: 30, alloy: 8 }, { alloy: 31, cry: 30, frost: 20 }, { alloy: 63, gold: 40, pearl: 20 }],
      beds: [2, 4, 6, 8, 10], crewEffect: 'RESTING CREW: +2% MORALE EACH'
    },
    workshop: {
      name: 'WORKSHOP', short: 'WORKSHOP', wall: 5, desc: 'BUILDS DRONE PARTS. EACH LEVEL ALLOWS 2 MORE PART LEVELS.',
      cost: [{ cu: 14, ice: 6 }, { cu: 40, ice: 25, alloy: 6 }, { cu: 60, cry: 25, alloy: 18 }, { alloy: 42, frost: 25, gold: 25 }, { alloy: 84, ion: 35, gold: 50 }],
      speed: [1, 1.25, 1.5, 1.8, 2.2], crewEffect: 'CREW HERE: +25% BUILD SPEED EACH'
    },
    hydroponics: {
      name: 'HYDROPONICS', short: 'HYDRO', wall: 3, desc: 'GROWS FOOD OVER TIME, EVEN WHILE YOU ARE AWAY.',
      cost: [{ cu: 10, ice: 14 }, { cu: 25, ice: 35 }, { ice: 50, alloy: 10, cry: 12 }, { ice: 80, alloy: 28, frost: 20 }, { alloy: 56, pearl: 25, gold: 30 }],
      rate: [2, 3.5, 5.5, 8, 11], makes: 'food', crewEffect: 'CREW HERE: +25% FOOD EACH'
    },
    refinery: {
      name: 'REFINERY', short: 'REFINERY', wall: 4, desc: 'SMELTS COPPER INTO ALLOY OVER TIME.',
      cost: [{ cu: 20, ice: 12 }, { cu: 45, ice: 25, alloy: 6 }, { cu: 70, cry: 20, alloy: 14 }, { alloy: 35, gold: 30, frost: 15 }, { alloy: 63, ion: 30, gold: 40 }],
      rate: [2, 3.2, 4.8, 6.5, 9], makes: 'alloy', uses: 'cu', ratio: [2, 2, 1.5, 1.5, 1],
      crewEffect: 'CREW HERE: +25% ALLOY EACH'
    },
    observatory: {
      name: 'OBSERVATORY', short: 'OBSERV.', wall: 1, desc: 'CHARTS THE STARS. EACH LEVEL REVEALS A NEW SECTOR.',
      cost: [{ cu: 35, ice: 25, alloy: 4 }, { cu: 50, cry: 35, alloy: 21 }, { cry: 60, alloy: 35, frost: 30 }, { gold: 60, alloy: 56, ion: 30 }, { alloy: 84, pearl: 35, dust: 10 }],
      rate: [0.3, 0.6, 0.9, 1.2, 1.5], makes: 'data', crewEffect: 'CREW HERE: +25% DATA EACH'
    },
    galley: {
      name: 'GALLEY', short: 'GALLEY', wall: 4, desc: 'COOKS MEALS FROM FOOD. WELL-FED CREW WORK HARDER.',
      cost: [{ cu: 40, ice: 20, cry: 15 }, { cu: 60, cry: 30, alloy: 14 }, { cry: 50, alloy: 28, frost: 20 }, { alloy: 49, gold: 40, ion: 20 }, { alloy: 70, pearl: 30, gold: 50 }],
      morale: [10, 15, 20, 25, 30], eat: [1, 1.5, 2, 2.5, 3], crewEffect: 'CREW HERE: +3% MORALE EACH'
    },
    lab: {
      name: 'LAB', short: 'LAB', wall: 1, desc: 'PRODUCES DATA AND UNLOCKS RARE RESEARCH.',
      cost: [{ cry: 30, ice: 20, alloy: 7 }, { cry: 50, alloy: 24, cu: 40 }, { cry: 70, alloy: 35, frost: 25 }, { alloy: 56, ion: 30, gold: 40 }, { alloy: 84, void: 20, pearl: 20 }],
      rate: [1.5, 2.5, 3.5, 5, 7], makes: 'data', crewEffect: 'CREW HERE: +25% DATA EACH'
    },
    lounge: {
      name: 'LOUNGE', short: 'LOUNGE', wall: 2, desc: 'A PLACE TO UNWIND. RAISES MORALE FOR THE WHOLE SHIP.',
      cost: [{ cry: 40, ice: 40, frost: 15 }, { frost: 30, alloy: 28, cry: 40 }, { alloy: 42, gold: 40, frost: 30 }, { alloy: 56, ion: 30, pearl: 15 }, { alloy: 84, pearl: 35, void: 15 }],
      morale: [8, 12, 16, 20, 25], crewEffect: 'CREW HERE: +3% MORALE EACH'
    },
    hangar: {
      name: 'HANGAR', short: 'HANGAR', wall: 5, desc: 'DRONE BAY. NEW CHASSIS, PAINT JOBS AND +5 CARGO PER LEVEL.',
      cost: [{ gold: 40, alloy: 28, ion: 15 }, { gold: 60, alloy: 42, ion: 25 }, { alloy: 56, ion: 40, frost: 30 }, { alloy: 70, pearl: 30, gold: 60 }, { alloy: 105, void: 30, dust: 10 }],
      crewEffect: 'CREW HERE: +3 CARGO EACH'
    }
  };
  D.ROOM_ORDER = ['bridge', 'quarters', 'workshop', 'hydroponics', 'refinery', 'observatory', 'galley', 'lab', 'lounge', 'hangar'];
  D.MAX_ROOM_LVL = 5;
  D.crewSlots = function (lvl) { return lvl >= 3 ? 2 : 1; };

  // hull expansion n (index = slot number being added, starting at slot 3)
  D.HULL_COST = [null, null, { cu: 12, ice: 4 }, { cu: 20, ice: 10 }, { cu: 30, ice: 12 }, { cu: 40, ice: 22, alloy: 6 },
    { alloy: 25, cry: 25 }, { alloy: 40, cry: 35, gold: 12 }, { alloy: 80, gold: 30, frost: 30 }, { alloy: 120, ion: 25, gold: 50 }];
  D.MAX_SLOTS = 10;
  D.slotsForBridge = function (lvl) { return Math.min(D.MAX_SLOTS, lvl * 2); };

  // ------------------------------------------------------------------ crew
  D.RECRUIT_COST = [{}, { food: 10 }, { food: 25, ice: 10 }, { food: 45, cu: 25 }, { food: 70, cry: 15 },
    { food: 100, alloy: 20 }, { food: 140, gold: 20 }, { food: 190, frost: 15 }, { food: 250, pearl: 15 }, { food: 320, void: 10 }];
  D.TRAITS = {
    tinkerer: { name: 'TINKERER', desc: '+50% WORKSHOP SPEED WHEN WORKING THERE', room: 'workshop' },
    greenthumb: { name: 'GREEN THUMB', desc: '+50% FOOD WHEN IN HYDROPONICS', room: 'hydroponics' },
    smelter: { name: 'SMELTER', desc: '+50% ALLOY WHEN IN THE REFINERY', room: 'refinery' },
    stargazer: { name: 'STARGAZER', desc: '+50% DATA WHEN IN THE OBSERVATORY', room: 'observatory' },
    scholar: { name: 'SCHOLAR', desc: '+50% DATA WHEN IN THE LAB', room: 'lab' },
    cook: { name: 'COOK', desc: '+8% MORALE WHEN IN THE GALLEY', room: 'galley' },
    pilot: { name: 'PILOT', desc: '+5S DRONE FUEL WHEN ON THE BRIDGE', room: 'bridge' },
    mechanic: { name: 'MECHANIC', desc: '+1 SHIELD WHEN IN WORKSHOP OR HANGAR', room: 'hangar' },
    cheerful: { name: 'CHEERFUL', desc: '+5% MORALE, WHEREVER THEY ARE' },
    lucky: { name: 'LUCKY', desc: '+5% CHANCE OF DOUBLE ORE ON RUNS' },
    nightowl: { name: 'NIGHT OWL', desc: '+40% OFFLINE OUTPUT IN THEIR ROOM' },
    sleepyhead: { name: 'SLEEPYHEAD', desc: 'NAPS A LOT. +6% MORALE IN QUARTERS OR LOUNGE' }
  };
  D.TRAIT_KEYS = Object.keys(D.TRAITS);
  D.NAME_A = ['KA', 'MI', 'RO', 'ZU', 'PEL', 'TAN', 'VEX', 'OLI', 'NIM', 'DAR', 'SEN', 'YU', 'LO', 'BRI', 'FEN', 'JUN', 'MOR', 'QUI', 'TES', 'WIL', 'ARI', 'BO', 'CY', 'DEL', 'EZ', 'GUS', 'HAL', 'IO', 'JAX', 'KIT', 'LUM', 'NOX', 'OSS', 'PIP', 'RAE', 'SOL', 'TUP', 'UMA', 'VI', 'ZEN'];
  D.NAME_B = ['RA', 'NO', 'LI', 'TO', 'XA', 'BY', 'MO', 'KI', 'DA', 'RIS', 'VO', 'NE', 'ZY', 'LA', 'PO', 'SKI', 'TH', 'RO', 'ME', 'NA', '', '', ''];

  // ------------------------------------------------------------------ drone parts (workshop)
  D.PARTS = {
    fuel: { name: 'FUEL TANK', icon: 'fuel', desc: '+2S OF FUEL PER LEVEL', swap: true },
    cargo: { name: 'CARGO HOLD', icon: 'cargo', desc: 'CARRY MORE ORE HOME' },
    drill: { name: 'DRILL', icon: 'drill', desc: 'DRILL FASTER. EVERY 3 LEVELS: +1 ORE PER CHUNK' },
    magnet: { name: 'MAGNET', icon: 'magnet', desc: 'PULL ORE FROM FURTHER AWAY', swap: true },
    shield: { name: 'SHIELD', icon: 'shield', desc: 'MORE HITS BEFORE AUTO-RETURN' }
  };
  D.PART_ORDER = ['cargo', 'drill', 'fuel', 'magnet', 'shield'];
  D.MAX_PART_LVL = 10;
  D.PART_COST = [null,
    { cu: 8, ice: 4 }, { cu: 16, ice: 10 }, { cu: 26, ice: 16, alloy: 4 }, { cu: 40, cry: 12, alloy: 8 },
    { cry: 28, alloy: 18, gold: 10 }, { alloy: 28, gold: 22, frost: 12 }, { alloy: 42, frost: 25, ion: 15 },
    { alloy: 63, ion: 30, gold: 45 }, { alloy: 91, pearl: 30, cry: 70 }, { alloy: 126, void: 25, dust: 12 }];
  D.PART_MULT = { fuel: 1, cargo: 0.9, drill: 1.1, magnet: 0.9, shield: 1 };
  D.PART_TIME = [0, 6, 12, 25, 45, 75, 120, 180, 270, 400, 600]; // seconds of work at speed 1
  D.CARGO_TABLE = [24, 32, 44, 60, 80, 104, 132, 165, 200, 240, 285];
  D.partCost = function (part, lvl) {
    var base = D.PART_COST[lvl];
    if (!base) return null;
    var m = D.PART_MULT[part] || 1, out = {};
    for (var k in base) {
      var key = k;
      if (D.PARTS[part].swap && k === 'cu') key = 'ice';
      else if (D.PARTS[part].swap && k === 'ice') key = 'cu';
      out[key] = (out[key] || 0) + Math.max(1, Math.round(base[k] * m));
    }
    return out;
  };

  // ------------------------------------------------------------------ hangar
  D.CHASSIS = {
    standard: { name: 'STANDARD', desc: 'RELIABLE ALL-ROUNDER.', lvl: 1, mods: {} },
    sprinter: { name: 'SPRINTER', desc: '+25% SPEED, -15% CARGO.', lvl: 1, mods: { speed: 1.25, cargo: 0.85 } },
    hauler: { name: 'HAULER', desc: '+40% CARGO, -15% SPEED.', lvl: 2, mods: { cargo: 1.4, speed: 0.85 } },
    driller: { name: 'DRILLER', desc: '+35% DRILL SPEED, -1 SHIELD.', lvl: 3, mods: { drill: 1.35, shield: -1 } },
    guardian: { name: 'GUARDIAN', desc: '+2 SHIELDS, -10% SPEED.', lvl: 4, mods: { shield: 2, speed: 0.9 } },
    skiff: { name: 'STAR SKIFF', desc: '+10% TO EVERYTHING.', lvl: 5, mods: { speed: 1.1, cargo: 1.1, drill: 1.1, magnet: 1.1 } }
  };
  D.CHASSIS_ORDER = ['standard', 'sprinter', 'hauler', 'driller', 'guardian', 'skiff'];
  D.CHASSIS_COST = { standard: null, sprinter: { gold: 20, ion: 10 }, hauler: { alloy: 40, gold: 30 }, driller: { cry: 60, ion: 25 }, guardian: { alloy: 80, pearl: 20 }, skiff: { void: 25, dust: 8 } };

  // ------------------------------------------------------------------ cosmetics
  D.PAINTS = {
    classic: { name: 'CLASSIC', main: 7, shade: 6, trim: 9, window: 12 },
    midnight: { name: 'MIDNIGHT', main: 13, shade: 1, trim: 12, window: 7 },
    cherry: { name: 'CHERRY', main: 8, shade: 2, trim: 7, window: 12 },
    mint: { name: 'MINT', main: 11, shade: 3, trim: 7, window: 1 },
    goldleaf: { name: 'GOLD LEAF', main: 10, shade: 9, trim: 4, window: 1 },
    whale: { name: 'WHALESONG', main: 12, shade: 1, trim: 7, window: 15 },
    pearl: { name: 'PEARL', main: 15, shade: 14, trim: 7, window: 2 },
    void: { name: 'VOIDWALKER', main: 2, shade: 1, trim: 8, window: 14 },
    aurora: { name: 'AURORA', main: 11, shade: 12, trim: 14, window: 7 },
    ember: { name: 'EMBER', main: 9, shade: 4, trim: 10, window: 12 },
    legend: { name: 'LEGEND', main: 10, shade: 8, trim: 7, window: 2 },
    nebula: { name: 'NEBULA', main: 14, shade: 13, trim: 12, window: 7 }
  };
  D.PAINT_ORDER = ['classic', 'midnight', 'cherry', 'mint', 'goldleaf', 'whale', 'pearl', 'void', 'aurora', 'ember', 'legend', 'nebula'];
  D.HULLS = {
    steel: { name: 'STEEL', main: 6, shade: 5, light: 7, trim: 13 },
    rust: { name: 'RUST', main: 9, shade: 4, light: 15, trim: 2 },
    navy: { name: 'NAVY', main: 12, shade: 1, light: 6, trim: 13 },
    mint: { name: 'MINT', main: 11, shade: 3, light: 7, trim: 5 },
    plum: { name: 'PLUM', main: 13, shade: 2, light: 14, trim: 1 },
    cream: { name: 'CREAM', main: 15, shade: 4, light: 7, trim: 9 },
    gold: { name: 'GOLD', main: 10, shade: 9, light: 7, trim: 4 },
    void: { name: 'VOID', main: 5, shade: 0, light: 13, trim: 8 },
    aurora: { name: 'AURORA', main: 14, shade: 2, light: 7, trim: 12 },
    ember: { name: 'EMBER', main: 8, shade: 2, light: 9, trim: 10 },
    starlit: { name: 'STARLIT', main: 1, shade: 0, light: 12, trim: 10 },
    nebula: { name: 'NEBULA', main: 13, shade: 2, light: 14, trim: 7 }
  };
  D.HULL_ORDER = ['steel', 'rust', 'navy', 'mint', 'plum', 'cream', 'gold', 'void', 'aurora', 'ember', 'starlit', 'nebula'];
  D.DECOR = {
    plant: { name: 'POTTED FERN' }, poster: { name: 'SUNSET POSTER' }, rug: { name: 'COMFY RUG' },
    lamp: { name: 'LAVA LAMP' }, fishtank: { name: 'FISH TANK' }, cat: { name: 'SHIP CAT' },
    disco: { name: 'DISCO BALL' }, trophy: { name: 'GOLD TROPHY' }, globe: { name: 'STAR GLOBE' },
    bonsai: { name: 'TINY BONSAI' }, arcade: { name: 'ARCADE BOX' }, plush: { name: 'WHALE PLUSH' },
    voidcrystal: { name: 'VOID CRYSTAL' }, orb: { name: 'ANOMALY ORB' }, snowglobe: { name: 'SNOW GLOBE' },
    compass: { name: 'OLD COMPASS' }, jukebox: { name: 'MINI JUKEBOX' }
  };
  D.DECOR_ORDER = ['plant', 'poster', 'rug', 'lamp', 'bonsai', 'snowglobe', 'globe', 'arcade', 'jukebox', 'fishtank', 'plush', 'cat', 'trophy', 'disco', 'voidcrystal', 'compass', 'orb'];

  // ------------------------------------------------------------------ research (lab)
  D.RESEARCH = {
    oresense: { name: 'ORE SENSE', tier: 1, cost: { data: 20 }, desc: 'ARROWS POINT TO NEARBY ORE DURING RUNS.' },
    softhull: { name: 'SOFT HULL', tier: 1, cost: { data: 30 }, desc: 'BUMPS SPILL HALF AS MUCH CARGO.' },
    luckydrill: { name: 'LUCKY DRILL', tier: 1, cost: { data: 40 }, desc: '10% CHANCE FOR DOUBLE CHUNKS.' },
    thrusters: { name: 'TUNED THRUSTERS', tier: 2, cost: { data: 60 }, desc: '+12% DRONE SPEED.' },
    magfield: { name: 'MAGNET FIELD', tier: 2, cost: { data: 70 }, desc: '+40% MAGNET RANGE.' },
    pantry: { name: 'DEEP PANTRY', tier: 2, cost: { data: 80, ice: 30 }, desc: '+25% FOOD PRODUCTION.' },
    recycler: { name: 'FUEL RECYCLER', tier: 3, cost: { data: 100, frost: 10 }, desc: '+5S DRONE FUEL.' },
    capacitor: { name: 'SHIELD CAPACITOR', tier: 3, cost: { data: 120, cry: 30 }, desc: 'SHIELDS RECHARGE 1 PIP EVERY 20S.' },
    drift: { name: 'EFFICIENT DRIFT', tier: 3, cost: { data: 120, alloy: 40 }, desc: '+25% OFFLINE PRODUCTION.' },
    lens: { name: 'STARDUST LENS', tier: 4, cost: { data: 160, dust: 5 }, desc: 'STARDUST ROCKS APPEAR TWICE AS OFTEN.' },
    compress: { name: 'COMPRESSION', tier: 4, cost: { data: 180, ion: 20 }, desc: '+15% CARGO SPACE.' },
    motherlode: { name: 'MOTHERLODE', tier: 5, cost: { data: 250, void: 10 }, desc: 'HUGE RICH ASTEROIDS APPEAR ON RUNS.' },
    harmony: { name: 'CREW HARMONY', tier: 5, cost: { data: 300, pearl: 20 }, desc: '+15% MORALE.' }
  };
  D.RESEARCH_ORDER = ['oresense', 'softhull', 'luckydrill', 'thrusters', 'magfield', 'pantry', 'recycler', 'capacitor', 'drift', 'lens', 'compress', 'motherlode', 'harmony'];

  // ------------------------------------------------------------------ sectors and planets
  // rock: [dark, mid, light] for hazard rocks. orebody: colours of ore-asteroid stone.
  D.SECTORS = [
    { id: 1, name: 'HOME DRIFT', bg: 0, neb: 1, neb2: 2, rock: [5, 13, 6], orebody: [1, 2, 4], oreRate: 0.64,
      ores: { cu: 60, ice: 39, dust: 1 }, hazard: null, planets: ['kettle', 'moss'],
      desc: 'QUIET SPACE NEAR WHERE YOUR JOURNEY BEGAN.', mapPos: [0.12, 0.62], mapPosP: [0.3, 0.86] },
    { id: 2, name: 'GLIMMER REACH', bg: 0, neb: 2, neb2: 1, rock: [5, 13, 6], orebody: [1, 2, 13], oreRate: 0.6,
      ores: { cu: 30, ice: 20, cry: 44, gold: 5, dust: 1 }, hazard: 'shards', planets: ['prism'],
      desc: 'CRYSTAL DUST GLITTERS EVERYWHERE. WATCH FOR SHARD SWARMS.', mapPos: [0.3, 0.3], mapPosP: [0.7, 0.72] },
    { id: 3, name: 'FROSTLINE', bg: 1, neb: 0, neb2: 12, rock: [13, 6, 7], orebody: [0, 5, 13], oreRate: 0.6,
      ores: { ice: 34, cry: 25, frost: 30, gold: 10, dust: 1 }, hazard: 'comets', planets: ['rime'],
      desc: 'A FROZEN BELT. ICE COMETS STREAK THROUGH WITHOUT WARNING.', mapPos: [0.5, 0.66], mapPosP: [0.28, 0.58] },
    { id: 4, name: 'ION EXPANSE', bg: 0, neb: 3, neb2: 1, rock: [5, 6, 7], orebody: [1, 3, 5], oreRate: 0.58,
      ores: { cu: 25, gold: 34, ion: 30, cry: 10, dust: 1 }, hazard: 'storm', planets: ['zennor'],
      desc: 'CHARGED CLOUDS. MAGNETIC STORMS PUSH YOUR DRONE AROUND.', mapPos: [0.66, 0.26], mapPosP: [0.72, 0.42] },
    { id: 5, name: 'WHALE DEEP', bg: 1, neb: 0, neb2: 13, rock: [5, 13, 6], orebody: [2, 5, 13], oreRate: 0.6,
      ores: { gold: 25, cry: 20, pearl: 34, ice: 20, dust: 1 }, hazard: 'whales', planets: ['lullaby'],
      desc: 'GENTLE GIANTS SWIM HERE. GIVE THEM ROOM.', mapPos: [0.82, 0.58], mapPosP: [0.32, 0.28] },
    { id: 6, name: 'THE HOLLOW', bg: 0, neb: 2, neb2: 1, rock: [5, 13, 6], orebody: [1, 2, 5], oreRate: 0.58,
      ores: { void: 35, dust: 8, gold: 27, ion: 30 }, hazard: 'wells', planets: ['echo'],
      desc: 'WHERE SPACE GETS THIN. GRAVITY WELLS PULL AT EVERYTHING.', mapPos: [0.92, 0.22], mapPosP: [0.68, 0.12] }
  ];
  D.sector = function (id) { return D.SECTORS[id - 1]; };

  D.PLANETS = {
    kettle: { id: 'kettle', name: 'KETTLE', sector: 1, seed: 11, cols: [4, 9, 15, 2], style: 'desert', ring: 6, atmo: 15,
      desc: 'A DUSTY ROCK WITH A FRIENDLY TRADING POST.',
      trades: [{ give: { cu: 12 }, get: { ice: 7 } }, { give: { ice: 12 }, get: { cu: 7 } }, { give: { food: 20 }, get: { cu: 12 } }],
      unlocks: [{ kind: 'room', id: 'workshop', cost: { cu: 6 } }, { kind: 'room', id: 'refinery', cost: { cu: 15, ice: 10 } }, { kind: 'hull', id: 'rust', cost: { cu: 40, ice: 20 } }] },
    moss: { id: 'moss', name: 'MOSS', sector: 1, seed: 23, cols: [1, 3, 11, 12], style: 'continents', atmo: 12,
      desc: 'A SOGGY GREEN WORLD. FARMERS AND STARGAZERS LIVE HERE.',
      trades: [{ give: { ice: 12 }, get: { food: 10 } }, { give: { cu: 15 }, get: { food: 8 } }],
      unlocks: [{ kind: 'room', id: 'hydroponics', cost: { ice: 8 } }, { kind: 'room', id: 'observatory', cost: { cu: 20, ice: 15 } }, { kind: 'decor', id: 'plant', cost: { ice: 15 } }, { kind: 'paint', id: 'mint', cost: { cu: 30, ice: 30 } }] },
    prism: { id: 'prism', name: 'PRISM', sector: 2, seed: 37, cols: [2, 13, 14, 7], style: 'crystal', atmo: 14,
      desc: 'A WORLD OF SINGING CRYSTAL SPIRES.',
      trades: [{ give: { cu: 20 }, get: { cry: 6 } }, { give: { ice: 20 }, get: { cry: 5 } }, { give: { cry: 12 }, get: { gold: 4 } }],
      unlocks: [{ kind: 'room', id: 'galley', cost: { cry: 20, cu: 20 } }, { kind: 'room', id: 'lab', cost: { cry: 30, ice: 20 } }, { kind: 'paint', id: 'cherry', cost: { cry: 25 } }, { kind: 'decor', id: 'lamp', cost: { cry: 15 } }, { kind: 'hull', id: 'plum', cost: { cry: 40, alloy: 20 } }] },
    rime: { id: 'rime', name: 'RIME', sector: 3, seed: 41, cols: [1, 12, 6, 7], style: 'ice', atmo: 7, night: 1,
      desc: 'ICY AND QUIET. LOCALS KNIT VERY WARM SWEATERS.',
      trades: [{ give: { ice: 20 }, get: { frost: 5 } }, { give: { cry: 12 }, get: { frost: 5 } }, { give: { food: 30 }, get: { frost: 4 } }, { give: { frost: 10 }, get: { gold: 5 } }],
      unlocks: [{ kind: 'room', id: 'lounge', cost: { frost: 20, cry: 30 } }, { kind: 'decor', id: 'snowglobe', cost: { frost: 12 } }, { kind: 'paint', id: 'midnight', cost: { frost: 20, cry: 20 } }, { kind: 'hull', id: 'navy', cost: { frost: 30, alloy: 30 } }] },
    zennor: { id: 'zennor', name: 'ZENNOR', sector: 4, seed: 53, cols: [3, 11, 10, 7], style: 'bands', ring: 10, atmo: 11,
      desc: 'A STORMY GAS GIANT. ITS FLOATING CITY BUILDS DRONES.',
      trades: [{ give: { cu: 25 }, get: { ion: 6 } }, { give: { gold: 10 }, get: { ion: 5 } }, { give: { ion: 8 }, get: { alloy: 10 } }],
      unlocks: [{ kind: 'room', id: 'hangar', cost: { gold: 30, ion: 15, alloy: 30 } }, { kind: 'decor', id: 'arcade', cost: { ion: 15, gold: 15 } }, { kind: 'paint', id: 'goldleaf', cost: { gold: 40 } }, { kind: 'hull', id: 'gold', cost: { gold: 60, ion: 20 } }, { kind: 'decor', id: 'jukebox', cost: { ion: 20 } }] },
    lullaby: { id: 'lullaby', name: 'LULLABY', sector: 5, seed: 67, cols: [1, 12, 13, 7], style: 'continents', atmo: 12,
      desc: 'AN OCEAN WORLD. THE WHALES SING TO IT AT NIGHT.',
      trades: [{ give: { gold: 12 }, get: { pearl: 4 } }, { give: { cry: 15 }, get: { pearl: 4 } }, { give: { ice: 30 }, get: { food: 40 } }],
      unlocks: [{ kind: 'decor', id: 'fishtank', cost: { pearl: 15, ice: 30 } }, { kind: 'decor', id: 'plush', cost: { pearl: 10 } }, { kind: 'paint', id: 'whale', cost: { pearl: 25 } }, { kind: 'paint', id: 'pearl', cost: { pearl: 40, gold: 20 } }, { kind: 'hull', id: 'cream', cost: { pearl: 30, alloy: 40 } }, { kind: 'decor', id: 'cat', cost: { pearl: 20, food: 50 } }] },
    echo: { id: 'echo', name: 'ECHO', sector: 6, seed: 79, cols: [0, 2, 13, 8], style: 'cracks', atmo: 8,
      desc: 'A HOLLOW WORLD THAT REPEATS EVERYTHING YOU SAY.',
      trades: [{ give: { gold: 20 }, get: { void: 4 } }, { give: { pearl: 10 }, get: { void: 4 } }, { give: { data: 50 }, get: { dust: 4 } }],
      unlocks: [{ kind: 'decor', id: 'voidcrystal', cost: { void: 15 } }, { kind: 'paint', id: 'void', cost: { void: 30 } }, { kind: 'hull', id: 'void', cost: { void: 40, alloy: 60 } }, { kind: 'decor', id: 'compass', cost: { void: 20, dust: 5 } }, { kind: 'decor', id: 'disco', cost: { void: 10, gold: 30 } }] }
  };
  D.PLANET_ORDER = ['kettle', 'moss', 'prism', 'rime', 'zennor', 'lullaby', 'echo'];

  // ------------------------------------------------------------------ daily anomalies
  D.ANOMALIES = [
    { id: 'goldrush', name: 'GOLD RUSH', desc: 'EVERY ORE ROCK IS GOLD.', mult: 1.3 },
    { id: 'stardust', name: 'STARDUST SHOWER', desc: 'STARDUST ROCKS EVERYWHERE.', mult: 1.2 },
    { id: 'giants', name: 'GIANT FIELD', desc: 'HUGE ROCKS, HUGE VEINS.', mult: 1.4 },
    { id: 'frenzy', name: 'FUEL FRENZY', desc: 'FUEL BURNS 2X FAST. CELLS EVERYWHERE.', mult: 1.5 },
    { id: 'glass', name: 'GLASS CANNON', desc: 'ONE SHIELD. DOUBLE ORE.', mult: 2 },
    { id: 'magstorm', name: 'MAGNET STORM', desc: 'PERMANENT SUPER MAGNET.', mult: 1.3 },
    { id: 'meteors', name: 'METEOR SHOWER', desc: 'ROCKS RAIN FROM ABOVE. 1.5X ORE.', mult: 1.5 },
    { id: 'slippery', name: 'ZERO DRAG', desc: 'YOUR DRONE KEEPS ITS MOMENTUM. 1.5X ORE.', mult: 1.5 }
  ];
  // rewards for total daily anomalies completed (not a streak - missing days costs nothing)
  D.ANOMALY_MILESTONES = { 1: { kind: 'decor', id: 'orb' }, 3: { kind: 'paint', id: 'aurora' }, 5: { kind: 'decor', id: 'trophy' }, 7: { kind: 'hull', id: 'aurora' }, 10: { kind: 'decor', id: 'bonsai' } };

  // ------------------------------------------------------------------ goals
  D.GOAL_COSMETICS = [{ kind: 'decor', id: 'poster' }, { kind: 'decor', id: 'rug' }, { kind: 'hull', id: 'mint' }, { kind: 'decor', id: 'globe' }];

  // ------------------------------------------------------------------ pilot rank (XP from everything you do)
  // XP needed to go from rank r to r+1. Early ranks come every couple of runs, later ones stretch out.
  D.xpForRank = function (r) { return Math.round(30 + 22 * Math.pow(r, 1.35)); };
  D.XP = { goal: 20, build: 25, upgrade: 20, part: 10, recruit: 15, research: 20, daily: 40, perfect: 10, crate: 10, bounty: 15, flotsam: 4 };
  D.RANK_TITLES = ['CADET', 'DRIFTER', 'PROSPECTOR', 'ROCKHOPPER', 'VEINSEEKER', 'STARMINER', 'VOIDRUNNER', 'COMET RIDER', 'NEBULA ACE', 'DRIFT LEGEND'];
  D.rankTitle = function (r) { return D.RANK_TITLES[Math.min(D.RANK_TITLES.length - 1, Math.floor((r - 1) / 3))]; };
  // cosmetics that only rank-ups give out
  D.RANK_REWARDS = { 3: { kind: 'paint', id: 'ember' }, 6: { kind: 'hull', id: 'ember' }, 10: { kind: 'paint', id: 'legend' }, 15: { kind: 'hull', id: 'starlit' } };

  // ------------------------------------------------------------------ run combos
  // keep collecting ore without a long pause (drilling counts) and the chain grows.
  // every COMBO_STEP pieces in one chain pays bonus ore.
  D.COMBO = { window: 2.6, step: 10, maxBonus: 8 };

  // ------------------------------------------------------------------ salvage crates (a rare drifting crate on some runs)
  D.CRATE = { chance: 0.4, life: 26 };
  D.CRATE_RARITY = { common: 64, rare: 29, epic: 7 };
  D.CRATE_COSMETICS = [{ kind: 'paint', id: 'nebula' }, { kind: 'hull', id: 'nebula' }];

  // ------------------------------------------------------------------ daily voyage (consecutive days aboard)
  // one missed day is forgiven; the 7-day cycle repeats with day 7 the big one.
  D.STREAK = { grace: 1, cycle: 7, firstRunBonus: 0.5 };

  // ------------------------------------------------------------------ dash, fever, perks, events (drone run)
  // DASH: a short burst you aim with a quick tap/click or Space/Shift. It is invulnerable,
  // smashes small grey rocks and knocks a chunk out of ore rocks.
  D.DASH = { speed: 3.1, time: 0.26, cooldown: 2.4, grace: 0.14, smashR: 9 };
  // FEVER: a long chain switches the run into overdrive until the chain breaks
  D.FEVER = { at: 30, atOverclock: 15, magnet: 1.6 };
  // star cores open a pick-1-of-3 perk draft that lasts for the rest of the run
  D.PERKS = {
    twin: { name: 'TWIN DRILL', icon: 'drill', desc: '+1 ORE FROM EVERY CHUNK.' },
    megamag: { name: 'MEGA MAGNET', icon: 'magnet', desc: 'MAGNET RANGE X2.' },
    afterburn: { name: 'AFTERBURNER', icon: 'speed', desc: 'DASH RECHARGES TWICE AS FAST.' },
    wrecker: { name: 'WRECKING BALL', icon: 'bang', desc: 'DASH SMASHES ANY ROCK. SMASHED ROCKS DROP ORE.' },
    keeper: { name: 'CHAIN KEEPER', icon: 'clock', desc: 'CHAINS LAST 75% LONGER.' },
    sipper: { name: 'FUEL SIPPER', icon: 'fuel', desc: 'FUEL BURNS 30% SLOWER.' },
    bulwark: { name: 'BULWARK', icon: 'shield', desc: '+2 SHIELDS, RIGHT NOW.' },
    overclock: { name: 'OVERCLOCK', icon: 'star', desc: 'FEVER STARTS AT A X15 CHAIN.' },
    rich: { name: 'RICH VEINS', icon: 'gold', desc: '25% OF CHUNKS COME OUT DOUBLE.' },
    scavenger: { name: 'SCAVENGER', icon: 'plus', desc: 'PICKUPS FLOAT TO YOU. FUEL CELLS +50%.' },
    salvager: { name: 'SALVAGER', icon: 'cargo', desc: 'A SALVAGE CRATE APPEARS. RARE OR BETTER.' }
  };
  D.PERK_ORDER = ['twin', 'megamag', 'afterburn', 'wrecker', 'keeper', 'sipper', 'bulwark', 'overclock', 'rich', 'scavenger', 'salvager'];
  D.STARCORE = { first: [9, 17], dropChance: 0.05, max: 3 };
  // one surprise per run (from the 3rd run on)
  D.EVENTS = {
    orestorm: { name: 'ORE STORM!', sub: 'ORE ROCKS INCOMING - GRAB THEM', w: 3 },
    geode: { name: 'GIANT GEODE!', sub: 'A HUGE RICH ROCK HAS APPEARED', w: 3 },
    bloom: { name: 'FUEL BLOOM!', sub: 'FUEL CELLS ALL AROUND YOU', w: 2 },
    double: { name: 'DOUBLE TIME!', sub: 'EVERY CHUNK X2 FOR 10 SECONDS', w: 2 }
  };
  D.EVENT_AT = [16, 30];
  // BOUNTIES: one small challenge per run (from the 2nd run on). Finishing it tops up fuel on the
  // spot and pays bonus everyday ore in the tally, plus XP. {n} and {ore} are filled in per run.
  D.BOUNTY = { bonus: 0.25, minBonus: 3, fuel: 6 };
  D.BOUNTIES = {
    smash: { w: 3, text: 'SMASH {n} GREY ROCKS', n: [3, 5] },
    chain: { w: 3, text: 'REACH A X{n} CHAIN', n: [12, 20] },
    mine: { w: 3, text: 'MINE {n} {ore}', frac: [0.3, 0.45] },
    cells: { w: 2, text: 'GRAB {n} FUEL CELLS', n: [2, 2] },
    boosts: { w: 2, text: 'GRAB {n} POWER-UPS', n: [2, 2] },
    clean: { w: 2, text: 'NO BUMPS FOR {n}S', n: [20, 30] },
    core: { w: 2, text: 'GRAB A STAR CORE', n: [1, 1] },
    ram: { w: 2, text: 'DASH INTO {n} ORE ROCKS', n: [3, 5] }
  };
  // NOVA BOMB: a rare pickup (from the 4th run on). Grabbing it sends out a shockwave that smashes
  // every grey rock nearby, knocks ore loose and wipes out shards and comets.
  D.NOVA = { from: 3, chance: 0.5, radius: 80, time: 0.45, dropChance: 0.03, max: 2 };

  // ------------------------------------------------------------------ flotsam (drifts past the ship; tap it)
  // the idle side gets small tap-to-collect surprises. Gaps are long so it never feels like a chore.
  D.FLOTSAM = { first: [14, 26], every: [38, 70], speed: [9, 15] };
  D.FLOTSAM_KINDS = {
    pod: { w: 40, name: 'CARGO POD' },
    comet: { w: 22, name: 'WISHING COMET' },
    bottle: { w: 22, name: 'SPACE BOTTLE' },
    jelly: { w: 16, name: 'SPACE JELLY' }
  };
  D.BOTTLE_NOTES = ['"HAVE YOU TRIED TURNING THE STARS OFF AND ON?"', '"WHOEVER FINDS THIS: HI!"', '"THE COPPER IS ALWAYS SHINIER..."',
    '"I LOST MY DRONE. IT WAS BLUE."', '"DRINK MORE SPACE WATER"', '"HELP, I AM STUCK IN A BOTTLE FACTORY"', '"THE WHALES ARE SINGING AGAIN"',
    '"ROCKS ARE JUST SHY ORE"', '"GOOD JOB TODAY, CAPTAIN"', '"BRB, DRIFTING"'];

  // ------------------------------------------------------------------ tuning for the drone run
  D.RUN = {
    baseFuel: 60, fuelPerPart: 2, baseDrill: 1.1, drillMult: 0.86, baseMagnet: 10, magnetPerPart: 5,
    baseShield: 3, speed: 92, worldW: 720, worldH: 720, asteroidCount: 58,
    fuelCell: 8, boostTime: 9
  };

  DH.D = D;
})(typeof window !== 'undefined' ? (window.DH = window.DH || {}) : (global.DH = global.DH || {}));
