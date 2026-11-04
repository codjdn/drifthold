// DRIFTHOLD - scenes/title.js : logo, drifting ship, tap to start
(function (DH) {
  'use strict';
  var R = DH.R, F = DH.Font, In = DH.In, Spr = DH.Spr;
  var stars = null, t = 0;
  var PLANET = { id: 'title', seed: 5, cols: [2, 13, 14, 7], style: 'bands', ring: 6, atmo: 14 };

  var Title = { showBar: false };
  Title.enter = function () {
    t = 0;
    if (!stars) stars = Spr.makeStarfield(7, 260);
    DH.Snd.setMusic('title');
  };
  Title.update = function (dt) {
    t += dt;
    if (t > 0.6 && (In.released || In.anyKey)) {
      if (!DH.G.state) DH.G.newGame();
      DH.G.applySettings();
      DH.Snd.play('launch');
      DH.G.setScene('ship', { fromTitle: true });
      In.consume();
    }
  };
  Title.draw = function () {
    var W = R.W, H = R.H;
    R.clear(0);
    Spr.drawNebula(Spr.makeNebula(256, 256, 9, 1, 2), t * 4, 0);
    stars.draw(t * 18, 0, t);
    var pr = Math.floor(Math.min(W, H) * (R.portrait ? 0.36 : 0.32));
    var pf = Spr.planetFrame(PLANET, pr, t * 0.02);
    if (R.portrait) R.img(pf, W - pf.width * 0.8, H - pf.height * 0.62);
    else R.img(pf, W - pf.width * 0.75, H - pf.height * 0.72);

    // logo
    var scale = W >= 300 ? 3 : 2;
    var ly = Math.floor(H * (R.portrait ? 0.2 : 0.16));
    var bob = Math.round(Math.sin(t * 1.6) * 1.5);
    F.drawScaled(R.ctx, 'DRIFTHOLD', W / 2 + scale, ly + scale * 2 + bob, 1, scale, { align: 'center' });
    F.drawScaled(R.ctx, 'DRIFTHOLD', W / 2 + scale, ly + scale + bob, 2, scale, { align: 'center' });
    F.drawScaled(R.ctx, 'DRIFTHOLD', W / 2, ly + bob, 9, scale, { align: 'center' });
    // highlight band across the top of the letters
    R.ctx.save();
    R.ctx.beginPath(); R.ctx.rect(0, ly + bob, W, scale * 3); R.ctx.clip();
    F.drawScaled(R.ctx, 'DRIFTHOLD', W / 2, ly + bob, 10, scale, { align: 'center' });
    R.ctx.restore();
    F.draw(R.ctx, 'A SHIP. A DRONE. A WHOLE LOT OF SPACE.', W / 2, ly + 7 * scale + 10, 13, { font: 'small', align: 'center' });

    // ship drifting across
    var ship = Spr.miniShip(DH.G.state ? DH.G.state.hullColor : 'steel');
    var sx = Math.floor(W * 0.5 - ship.width / 2 + Math.sin(t * 0.3) * 10);
    var sy = Math.floor(H * (R.portrait ? 0.45 : 0.58) + Math.sin(t * 1.1) * 2);
    R.img(ship, sx, sy);
    // engine flame
    var fl = Math.floor(t * 12) % 3;
    R.rect(sx - 2 - fl, sy + 4, 2 + fl, 3, fl ? 9 : 10);
    R.pset(sx - 4 - fl, sy + 5, 8);
    // blinking light
    if (Math.floor(t * 2) % 2) R.pset(sx + 22, sy, 8);

    if (Math.floor(t * 2) % 2 === 0 || t < 0.6) {
      var msg = In.hasTouch ? 'TAP TO START' : 'CLICK OR PRESS ANY KEY';
      if (DH.G.hadSave) msg = In.hasTouch ? 'TAP TO CONTINUE' : 'CLICK TO CONTINUE';
      F.drawOutlined(R.ctx, msg, W / 2, Math.floor(H * (R.portrait ? 0.62 : 0.8)), 7, 0, { align: 'center' });
    }
    F.draw(R.ctx, 'V1.0', W - 3, H - 7, 5, { font: 'small', align: 'right' });
  };
  DH.Scenes.title = Title;
})(window.DH);
