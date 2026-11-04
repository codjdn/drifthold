// shared Playwright helpers: click logical canvas coordinates / UI hit areas by id
async function toCss(page, lx, ly) {
  return page.evaluate(([lx, ly]) => {
    const r = DH.R.canvas.getBoundingClientRect();
    return { x: r.left + (lx + 0.5) / DH.R.W * r.width, y: r.top + (ly + 0.5) / DH.R.H * r.height };
  }, [lx, ly]);
}
async function clickL(page, lx, ly) {
  const p = await toCss(page, lx, ly);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.waitForTimeout(50);
  await page.mouse.up();
  await page.waitForTimeout(120);
}
async function hit(page, idPart) {
  const r = await page.evaluate((idPart) => {
    const h = DH.UI.prevHits.concat(DH.UI.hits).filter(x => x.id.indexOf(idPart) >= 0);
    return h.length ? h[h.length - 1] : null;
  }, idPart);
  if (!r) throw new Error('no hit area ' + idPart);
  await clickL(page, r.x + r.w / 2, r.y + r.h / 2);
  return r;
}
async function tapAnywhere(page) { await clickL(page, 10, 60); }
async function autoMine(page, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const dir = await page.evaluate(() => {
      const S = DH.Scenes.run.debug(); if (!S || S.phase !== 'play') return '';
      const d = S.drone; let best = null, bd = 1e9;
      S.ast.forEach(a => { if (a.kind !== 'ore') return; const dd = Math.hypot(a.x - d.x, a.y - d.y); if (dd < bd) { bd = dd; best = a; } });
      if (!best || bd < best.r + 6) return '';
      const dx = best.x - d.x, dy = best.y - d.y; let k = '';
      if (Math.abs(dx) > 5) k += dx > 0 ? 'd' : 'a';
      if (Math.abs(dy) > 5) k += dy > 0 ? 's' : 'w';
      return k;
    });
    for (const k of 'wasd') await page.keyboard.up(k);
    for (const k of dir) await page.keyboard.down(k);
    await page.waitForTimeout(120);
  }
  for (const k of 'wasd') await page.keyboard.up(k);
}
module.exports = { clickL, hit, tapAnywhere, autoMine, toCss };
