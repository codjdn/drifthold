// drives a drone run: start game, launch, steer around, screenshot, end via low fuel, tally
module.exports = async (page) => {
  const SP = process.env.SP;
  await page.waitForTimeout(800);
  await page.mouse.click(300, 300);
  await page.waitForTimeout(600);
  await page.evaluate(() => DH.G.launch(null));
  await page.waitForTimeout(1500);
  // steer toward nearest ore asteroid using keys for a few seconds
  for (let i = 0; i < 40; i++) {
    const dir = await page.evaluate(() => {
      const S = DH.Scenes.run.debug(); const d = S.drone;
      let best = null, bd = 1e9;
      S.ast.forEach(a => { if (a.kind !== 'ore') return; const dd = Math.hypot(a.x - d.x, a.y - d.y); if (dd < bd) { bd = dd; best = a; } });
      if (!best) return '';
      const dx = best.x - d.x, dy = best.y - d.y; let k = '';
      if (Math.abs(dx) > 6) k += dx > 0 ? 'd' : 'a';
      if (Math.abs(dy) > 6) k += dy > 0 ? 's' : 'w';
      return k;
    });
    for (const k of 'wasd') await page.keyboard.up(k);
    for (const k of dir) await page.keyboard.down(k);
    await page.waitForTimeout(150);
    if (i === 20) await page.screenshot({ path: SP + '/run_mid.png' });
  }
  for (const k of 'wasd') await page.keyboard.up(k);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: SP + '/run_mid2.png' });
  console.log(JSON.stringify(await page.evaluate(() => { const S = DH.Scenes.run.debug(); return { n: S.drone.n, cargo: S.drone.cargo, fuel: S.drone.fuel, hits: S.hits, phase: S.phase, parts: S.parts.length }; })));
  await page.evaluate(() => { DH.Scenes.run.debug().drone.fuel = 0.5; });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: SP + '/run_tally_mid.png' });
  await page.waitForTimeout(2500);
};
