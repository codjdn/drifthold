(function (DH) {
  var R = DH.R, F = DH.Font;
  var stars;
  DH.Scenes.ship = { showBar: true,
    enter: function () { stars = stars || DH.Spr.makeStarfield(3, 200); DH.Snd.setMusic('ship'); },
    update: function () {},
    draw: function () { R.clear(0); stars.draw(DH.G.time * 6, 0, DH.G.time);
      F.draw(R.ctx, 'SHIP VIEW (MILESTONE C)', R.W / 2, 60, 7, { align: 'center' }); }
  };
})(window.DH);
