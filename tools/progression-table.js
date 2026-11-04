// Prints the progression tables (markdown) straight from js/data.js
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global;
['js/util.js', 'js/data.js'].forEach(f => vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8')));
const D = global.DH.D;
const c = o => o ? Object.keys(o).map(k => o[k] + ' ' + D.resName(k).toLowerCase()).join(', ') : '-';
const out = [];
out.push('### Rooms (cost to build = L1, then each upgrade)\n');
out.push('| Room | Unlock | L1 | L2 | L3 | L4 | L5 | Effect |');
out.push('|---|---|---|---|---|---|---|---|');
const where = {};
D.PLANET_ORDER.forEach(p => D.PLANETS[p].unlocks.forEach(u => { if (u.kind === 'room') where[u.id] = D.PLANETS[p].name + ' (S' + D.PLANETS[p].sector + ')'; }));
const eff = {
  bridge: 'hull rooms 2/4/6/8/10, +1s fuel per level', quarters: 'beds ' + D.ROOMS.quarters.beds.join('/'),
  workshop: 'part level cap 2/4/6/8/10, speed x' + D.ROOMS.workshop.speed.join('/'),
  hydroponics: 'food/min ' + D.ROOMS.hydroponics.rate.join('/'), refinery: 'alloy/min ' + D.ROOMS.refinery.rate.join('/') + ' (uses copper)',
  observatory: 'reveals sector L+1, data/min ' + D.ROOMS.observatory.rate.join('/'), galley: 'morale +' + D.ROOMS.galley.morale.join('/') + '% when fed',
  lab: 'data/min ' + D.ROOMS.lab.rate.join('/') + ', research tier L', lounge: 'morale +' + D.ROOMS.lounge.morale.join('/') + '%', hangar: 'cargo +5/level, chassis tier L'
};
D.ROOM_ORDER.forEach(t => {
  const r = D.ROOMS[t];
  out.push('| ' + r.name + ' | ' + (t === 'bridge' ? 'start' : (t === 'quarters' ? 'start' : where[t])) + ' | ' + r.cost.map(c).join(' | ') + ' | ' + eff[t] + ' |');
});
out.push('\n### Hull expansions (Bridge level caps the total)\n');
out.push('| Room # | Cost |'); out.push('|---|---|');
for (let i = 2; i < D.MAX_SLOTS; i++) out.push('| ' + (i + 1) + ' | ' + c(D.HULL_COST[i]) + ' |');
out.push('\n### Drone parts (Workshop). Build time at speed 1\n');
out.push('| Lv | Base cost | Time | Cargo | Fuel | Drill s/chunk | Magnet | Shields |'); out.push('|---|---|---|---|---|---|---|---|');
for (let l = 1; l <= D.MAX_PART_LVL; l++) out.push('| ' + l + ' | ' + c(D.PART_COST[l]) + ' | ' + D.PART_TIME[l] + 's | ' + D.CARGO_TABLE[l] + ' | ' + (D.RUN.baseFuel + D.RUN.fuelPerPart * l) + 's | ' + (D.RUN.baseDrill * Math.pow(D.RUN.drillMult, l)).toFixed(2) + ' x' + (1 + Math.floor(l / 3)) + ' | ' + (D.RUN.baseMagnet + D.RUN.magnetPerPart * l) + ' | ' + (D.RUN.baseShield + Math.floor((l + 1) / 2)) + ' |');
out.push('\n### Crew recruiting (needs a free bed)\n');
out.push('| Crew # | Cost |'); out.push('|---|---|');
D.RECRUIT_COST.forEach((r, i) => out.push('| ' + (i + 1) + ' | ' + (Object.keys(r).length ? c(r) : 'free') + ' |'));
out.push('\n### Sectors\n');
out.push('| # | Sector | Ores (weight) | Hazard | Planets | Revealed by |'); out.push('|---|---|---|---|---|---|');
D.SECTORS.forEach(s => out.push('| ' + s.id + ' | ' + s.name + ' | ' + Object.keys(s.ores).map(k => D.ORES[k].name.toLowerCase() + ' ' + s.ores[k]).join(', ') + ' | ' + (s.hazard || '-') + ' | ' + s.planets.map(p => D.PLANETS[p].name).join(', ') + ' | ' + (s.id === 1 ? 'start' : 'Observatory L' + (s.id - 1)) + ' |'));
out.push('\n### Research (Lab)\n');
out.push('| Research | Tier | Cost | Effect |'); out.push('|---|---|---|---|');
D.RESEARCH_ORDER.forEach(id => { const r = D.RESEARCH[id]; out.push('| ' + r.name + ' | ' + r.tier + ' | ' + c(r.cost) + ' | ' + r.desc.toLowerCase() + ' |'); });
console.log(out.join('\n'));
