// inject a mid-game state and look at the ship
module.exports = async (page) => {
  const SP = process.env.SP;
  await page.waitForTimeout(800);
  await page.mouse.click(300, 300);
  await page.waitForTimeout(500);
  await page.evaluate((full) => {
    const s = DH.G.state;
    const types = ['bridge', 'quarters', 'workshop', 'hydroponics', 'refinery', 'observatory', 'galley', 'lab', 'lounge', 'hangar'];
    const n = full ? 10 : 6;
    s.hull = full ? 10 : 7;
    s.slots = [];
    for (let i = 0; i < s.hull; i++) s.slots.push(i < n ? { type: types[i], lvl: 1 + (i * 3) % 5, decor: null } : null);
    s.slots[1].lvl = 5;
    s.slots[1].decor = 'cat';
    for (const k in s.res) s.res[k] = 500;
    DH.D.ROOM_ORDER.forEach(t => s.blueprints[t] = true);
    for (let i = 0; i < 7; i++) {
      const c = DH.Crew.generate('test' + i, 'kettle');
      c.room = i < 5 ? i : null;
      s.crew.push(c);
    }
    s.seen.ores = { cu: true, ice: true, cry: true, gold: true };
    s.unlocked.map = true; s.unlocked.log = true;
    DH.ShipView.V.hullKey = '';
  }, process.env.FULL === '1');
  await page.waitForTimeout(3000);
};
