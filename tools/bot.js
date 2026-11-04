// In-page drone pilot used by automated playtests. Steers by setting virtual keys.
module.exports = function installBot() {
  if (window.__bot) return;
  window.__bot = { on: true, runs: [] };
  setInterval(function () {
    const In = DH.In;
    ['w', 'a', 's', 'd'].forEach(k => In.keys[k] = false);
    if (!window.__bot.on || DH.G.sceneName !== 'run') return;
    const S = DH.Scenes.run.debug();
    if (!S || S.phase !== 'play') return;
    const d = S.drone;
    let tx = null, ty = null, best = 1e9;
    // fuel cells / powerups close by first
    S.pickups.forEach(p => { const dd = Math.hypot(p.x - d.x, p.y - d.y); if (dd < 60 && dd < best) { best = dd; tx = p.x; ty = p.y; } });
    if (tx === null) {
      S.ast.forEach(a => {
        if (a.kind !== 'ore') return;
        const dd = Math.hypot(a.x - d.x, a.y - d.y) - a.r;
        if (dd < best) { best = dd; tx = a.x; ty = a.y; }
      });
      if (d.contact) return; // drilling: hold still (sticky)
    }
    if (tx === null) return;
    let dx = tx - d.x, dy = ty - d.y;
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    // dodge rocks ahead
    S.ast.forEach(a => {
      if (a.kind !== 'rock') return;
      const rx = a.x - d.x, ry = a.y - d.y, rd = Math.hypot(rx, ry);
      if (rd < a.r + 16 && (rx * dx + ry * dy) > 0) { const px = -dy, py = dx; const side = (rx * px + ry * py) > 0 ? -1 : 1; dx += px * side * 1.4; dy += py * side * 1.4; }
    });
    if (dx < -0.35) In.keys.a = true; if (dx > 0.35) In.keys.d = true;
    if (dy < -0.35) In.keys.w = true; if (dy > 0.35) In.keys.s = true;
  }, 8);
};
