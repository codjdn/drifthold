// DRIFTHOLD - palette.js
// The one and only 16-colour palette. Every pixel in the game uses one of these.
(function (DH) {
  'use strict';
  DH.PAL = [
    '#000000', // 0  black
    '#1d2b53', // 1  navy
    '#7e2553', // 2  plum
    '#008751', // 3  dark green
    '#ab5236', // 4  brown
    '#5f574f', // 5  dark grey
    '#c2c3c7', // 6  light grey
    '#fff1e8', // 7  white
    '#ff004d', // 8  red
    '#ffa300', // 9  orange
    '#ffec27', // 10 yellow
    '#00e436', // 11 green
    '#29adff', // 12 blue
    '#83769c', // 13 lavender
    '#ff77a8', // 14 pink
    '#ffccaa'  // 15 peach
  ];
  DH.C = {
    BLACK: 0, NAVY: 1, PLUM: 2, DGREEN: 3, BROWN: 4, DGREY: 5, LGREY: 6, WHITE: 7,
    RED: 8, ORANGE: 9, YELLOW: 10, GREEN: 11, BLUE: 12, LAV: 13, PINK: 14, PEACH: 15
  };
  // one step darker / lighter for shading ramps
  DH.DARK = [0, 0, 1, 1, 2, 1, 5, 6, 2, 4, 9, 3, 1, 1, 2, 4];
  DH.LIGHT = [1, 13, 14, 11, 9, 6, 7, 7, 14, 10, 7, 10, 6, 6, 15, 7];
  DH.RGB = DH.PAL.map(function (h) {
    return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
  });
})(window.DH = window.DH || {});
