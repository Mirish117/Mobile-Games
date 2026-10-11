/* The Fractured Path: terrain atlas. Every ground, water, roof, cliff and canopy texture in the world is
   cropped from the Thistledown town image, mirror-tiled so it repeats seamlessly, and colour graded per region. */
(function (FP) {
  'use strict';
  var art = FP.art, HDP = art.HDP;
  /* 32x32 source crops (x, y) in the town image */
  var SRC = {
    grass: [1152, 944], canopy: [864, 624], cobble: [704, 512], dirt: [736, 864], water: [1392, 800],
    roof: [1088, 416], cliff: [80, 912]
  };
  var base = {}, graded = {};
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) { s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s, l];
  }
  function hue2(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
  function hsl2rgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    if (!s) return [l * 255, l * 255, l * 255];
    var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return [hue2(p, q, h + 1 / 3) * 255, hue2(p, q, h) * 255, hue2(p, q, h - 1 / 3) * 255];
  }
  function hexRGB(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function source() { return FP.mapImgs && FP.mapImgs.thistledown; }
  /* 32x32 patch -> 64x64 mirror quilt -> 128x128 repeat */
  function baseTex(k) {
    if (base[k]) return base[k];
    var im = source(); if (!im) return null;
    var key = k.replace(/\d$/, ''), s = SRC[key]; if (!s) return null;
    var q = document.createElement('canvas'); q.width = q.height = 64; var x = q.getContext('2d');
    var p = document.createElement('canvas'); p.width = p.height = 32; p.getContext('2d').drawImage(im, s[0], s[1], 32, 32, 0, 0, 32, 32);
    x.drawImage(p, 0, 0);
    x.save(); x.scale(-1, 1); x.drawImage(p, -64, 0); x.restore();
    x.save(); x.scale(1, -1); x.drawImage(p, 0, -64); x.restore();
    x.save(); x.scale(-1, -1); x.drawImage(p, -64, -64); x.restore();
    var t = document.createElement('canvas'); t.width = t.height = 128; var tx = t.getContext('2d');
    for (var a = 0; a < 2; a++) for (var b = 0; b < 2; b++) tx.drawImage(q, a * 64, b * 64);
    base[k] = t; return t;
  }
  /* [hueShift, satMul, lumMul, tintHex, tintAlpha] per family and region */
  var G_GRASS = {
    meadow: [0, 1, 1], forest: [-10, 1, .8], coast: [5, .95, 1.08], ash: [-62, .22, .8, '#6a5a52', .25], castle: [0, 1, 1], interior: [0, 1, .95],
    lighthouse: [0, 1, 1.05], crypt: [140, .3, .55, '#3a2f66', .3], archive: [95, .55, .8, '#2a7a90', .2], cave: [135, .25, .5, '#3a3050', .3], shrine: [75, .5, .95, '#8a80c0', .2]
  };
  var G_STONE = {
    meadow: [0, 1, 1], forest: [8, 1, .88], coast: [0, 1, 1.05], ash: [-8, .5, .66, '#4a3a3a', .3], castle: [0, 1, 1, '#8a8ab4', .3], interior: [0, 1, .95, '#c9a070', .15],
    lighthouse: [0, 1, 1.05, '#9aa6c0', .3], crypt: [0, 1, .62, '#4a3f78', .5], archive: [0, 1, .9, '#3a8ab0', .45], cave: [0, 1, .62, '#5a4a62', .4], shrine: [0, 1, 1, '#a090d0', .4]
  };
  var G_WATER = {
    meadow: [0, 1, 1], forest: [-4, .95, .9], coast: [0, 1.05, 1.05], ash: [0, .6, .75, '#3a5a8a', .25], castle: [0, 1, 1], interior: [0, 1, 1],
    lighthouse: [0, 1, 1.05], crypt: [0, .7, .6, '#2c4a78', .4], archive: [-10, .9, .95, '#2ac8e0', .2], cave: [0, .6, .6, '#2c3a78', .35], shrine: [0, .7, 1, '#7a70c0', .2]
  };
  var ROOFH = [0, 205, 34, 268];
  function gradeFor(kind, theme) {
    var th = theme || 'meadow';
    if (kind === 'grass' || kind === 'canopy' || kind === 'pine') return G_GRASS[th] || G_GRASS.meadow;
    if (kind === 'water') return G_WATER[th] || G_WATER.meadow;
    if (kind === 'deep') { var w = G_WATER[th] || G_WATER.meadow; return [w[0], w[1], w[2] * .62, w[3] || '#103a7a', Math.max(w[4] || 0, .25)]; }
    if (kind === 'sand') { var d = G_STONE[th] || G_STONE.meadow; return [0, .55 * (d[1]), 1.12 * d[2], d[3] || '#fff0c0', d[3] ? d[4] : .15]; }
    if (kind === 'dirt') { var e = G_STONE[th] || G_STONE.meadow; return e; }
    if (/^roof\d/.test(kind)) return [ROOFH[+kind.slice(4)], +kind.slice(4) === 2 ? 1.05 : 1, 1, null, 0];
    return G_STONE[th] || G_STONE.meadow;
  }
  function gradedTex(kind, theme) {
    var key = kind + '|' + theme; if (graded[key]) return graded[key];
    var b = baseTex(kind === 'deep' ? 'water' : kind === 'sand' ? 'dirt' : kind === 'pine' ? 'canopy' : kind); if (!b) return null;
    var gr = gradeFor(kind, theme), c = document.createElement('canvas'); c.width = c.height = 128;
    var x = c.getContext('2d'); x.drawImage(b, 0, 0);
    var im = x.getImageData(0, 0, 128, 128), d = im.data, i, tn = gr[3] ? hexRGB(gr[3]) : null, ta = gr[4] || 0;
    var dh = gr[0], ds = gr[1], dl = gr[2];
    if (kind === 'pine') { dh += 24; dl *= .8; }
    for (i = 0; i < d.length; i += 4) {
      var h = rgb2hsl(d[i], d[i + 1], d[i + 2]);
      var s = Math.min(1, h[1] * ds), rgb = hsl2rgb(h[0] + dh, s, h[2]);
      var r = rgb[0], g = rgb[1], bl = rgb[2];
      if (tn) { r += (tn[0] - r) * ta; g += (tn[1] - g) * ta; bl += (tn[2] - bl) * ta; }
      d[i] = Math.max(0, Math.min(255, r * dl)); d[i + 1] = Math.max(0, Math.min(255, g * dl)); d[i + 2] = Math.max(0, Math.min(255, bl * dl));
    }
    x.putImageData(im, 0, 0);
    graded[key] = c; return c;
  }
  /* paints one 16x16 tile (variant low two bits = world phase so neighbours join seamlessly) */
  art.atlasPaint = function (kind, g, hh, fr) {
    var t = gradedTex(kind, art.curTheme || 'meadow'); if (!t) return false;
    var px = (hh & 1) * 32, py = ((hh >> 1) & 1) * 32, ox = 0, oy = 0;
    if (kind === 'water' || kind === 'deep') { var f = (fr | 0) & 3; ox = [0, 3, 0, -3][f]; oy = [2, 0, -2, 0][f]; px += 32; py += 32; }
    g.imageSmoothingEnabled = true;
    g.drawImage(t, px + ox, py + oy, 32, 32, 0, 0, 16, 16);
    return true;
  };
  /* round canopy clipped over the grass base, with a trunk and a dark rim */
  art.atlasCanopy = function (g, hh, pine) {
    var t = gradedTex(pine ? 'pine' : 'canopy', art.curTheme || 'meadow'); if (!t) return false;
    g.save();
    g.fillStyle = '#4a3020'; g.fillRect(7, 11, 2.4, 4.4);
    g.beginPath();
    if (pine) { g.moveTo(8, 0.2); g.lineTo(13.6, 12); g.quadraticCurveTo(8, 13.6, 2.4, 12); g.closePath(); }
    else g.ellipse(8, 7.4, 7.4, 6.9, 0, 0, 6.2832);
    g.clip();
    g.imageSmoothingEnabled = true;
    g.drawImage(t, (hh & 1) * 32 + 32, ((hh >> 1) & 1) * 32 + 32, 32, 32, 0, 0, 16, 16);
    g.restore();
    g.strokeStyle = 'rgba(8,30,16,.55)'; g.lineWidth = .6; g.beginPath();
    if (pine) { g.moveTo(8, 0.2); g.lineTo(13.6, 12); g.quadraticCurveTo(8, 13.6, 2.4, 12); g.closePath(); }
    else g.ellipse(8, 7.4, 7.4, 6.9, 0, 0, 6.2832);
    g.stroke();
    return true;
  };
  function full(kind) { return function (g, th, hh) { if (!art.atlasPaint(kind, g, hh, 0)) { g.fillStyle = th.s2; g.fillRect(0, 0, 16, 16); } var sg = g.createLinearGradient(0, 0, 0, 16); sg.addColorStop(0, 'rgba(255,255,255,.08)'); sg.addColorStop(1, 'rgba(10,6,30,.18)'); g.fillStyle = sg; g.fillRect(0, 0, 16, 16); }; }
  HDP.MOUNT = full('cliff'); HDP.CWALL = full('cliff'); HDP.SWALL = full('cobble'); HDP.FWALL = full('canopy');
})(window.FP);
