const H = require('./helpers');
const installBot = require('./bot');
module.exports = async (page) => {
  await page.waitForTimeout(800);
  await H.tapAnywhere(page);
  await page.waitForTimeout(600);
  const measure = () => page.evaluate(() => new Promise(res => {
    const sc = DH.G.scene; const orig = sc.draw; const origU = sc.update; let tot = 0, n = 0, max = 0, ut = 0;
    sc.update = function (dt) { const t0 = performance.now(); origU.call(sc, dt); ut += performance.now() - t0; };
    sc.draw = function (dt) { const t0 = performance.now(); orig.call(sc, dt); const d = performance.now() - t0; tot += d; n++; max = Math.max(max, d); };
    const fr = []; let last = performance.now(); let k = 0;
    function f() { const now = performance.now(); fr.push(now - last); last = now; if (++k < 180) requestAnimationFrame(f); else { sc.draw = orig; sc.update = origU; res({ drawAvg: +(tot / n).toFixed(2), drawMax: +max.toFixed(2), updAvg: +(ut / n).toFixed(2), frameAvg: +(fr.reduce((a, b) => a + b, 0) / fr.length).toFixed(2) }); } }
    requestAnimationFrame(f);
  }));
  // full ship
  await page.evaluate(() => {
    const s = DH.G.state; const types = DH.D.ROOM_ORDER; s.hull = 10; s.slots = types.map((t, i) => ({ type: t, lvl: 5, decor: ['cat', 'disco', 'fishtank', null][i % 4] }));
    for (let i = 0; i < 10; i++) { const c = DH.Crew.generate('perf' + i, 'kettle'); c.room = i; s.crew.push(c); }
    DH.ShipView.V.hullKey = '';
  });
  await page.waitForTimeout(1500);
  console.log('ship', JSON.stringify(await measure()));
  await page.evaluate(installBot);
  await page.evaluate(() => { DH.G.state.sector = 6; DH.G.launch(null); });
  await page.waitForTimeout(2500);
  console.log('run S6', JSON.stringify(await measure()));
  await page.evaluate(() => { DH.G.state.sector = 4; DH.Scenes.run.debug().drone.fuel = 0; });
  await page.waitForTimeout(6000);
  await page.evaluate(() => { DH.G.setScene('map'); });
  await page.waitForTimeout(1000);
  console.log('map', JSON.stringify(await measure()));
};
