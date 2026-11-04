const H = require('./helpers');
module.exports = async (page) => {
  const SP = process.env.SP;
  await page.waitForTimeout(800);
  await H.tapAnywhere(page);
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const s = DH.G.state; const types = DH.D.ROOM_ORDER; s.hull = 9; s.slots = types.slice(0, 9).map((t, i) => ({ type: t, lvl: 1 + i % 5, decor: null }));
    s.slots[7].lvl = 3; s.slots.push(null); s.hull = 10; s.slots[9] = { type: 'hangar', lvl: 3, decor: null };
    for (const k in s.res) s.res[k] = 150;
    s.owned.decor = { plant: true, cat: true, lamp: true }; s.owned.paint.mint = true; s.owned.hull.rust = true; s.owned.chassis.sprinter = true;
    for (let i = 0; i < 4; i++) { const c = DH.Crew.generate('pn' + i, 'kettle'); c.room = null; s.crew.push(c); }
    s.research.oresense = true;
    s.tut.done = { welcome: 1, build1: 1, map: 1, visit: 1, goals: 1, expand: 1, workshop: 1, assign: 1, log: 1, food: 1, daily: 1, refinery: 1, travel: 1, lab: 1, logOpened: 1 };
    DH.ShipView.V.hullKey = '';
  });
  await page.waitForTimeout(500);
  const shots = [['room:0', 'rtab:2', 'q1'], ['room:7', 'rtab:0', 'q2'], ['room:9', 'rtab:0', 'q3'], ['room:9', 'rtab:1', 'q4'], ['room:3', 'rtab:2', 'q5'], ['room:6', 'rtab:1', 'q6']];
  for (const [room, tab, name] of shots) {
    await H.hit(page, room); await page.waitForTimeout(300);
    await H.hit(page, tab); await page.waitForTimeout(300);
    await page.screenshot({ path: SP + '/' + name + '.png' });
    await H.hit(page, 'panelclose'); await page.waitForTimeout(200);
  }
  await H.hit(page, 'room:6'); await page.waitForTimeout(300); await H.hit(page, 'rtab:1'); await page.waitForTimeout(200); await H.hit(page, 'cslot:0'); await page.waitForTimeout(300);
  await page.screenshot({ path: SP + '/q7.png' });
  await H.hit(page, 'panelclose');
  await H.hit(page, 'ship:hold'); await page.waitForTimeout(300);
  await page.screenshot({ path: SP + '/q8.png' });
};
