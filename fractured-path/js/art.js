/* The Fractured Path: pixel art. Primitives, palettes and tile painting.
   Everything is drawn in code at 16x16 per tile, then cached. */
(function (FP) {
  'use strict';
  var art = FP.art = {};
  var OUT = '#1b1626';
  art.OUT = OUT;

  /* ---------- primitives ---------- */
  var G = null;
  function setCtx(c) { G = c; }
  function R(x, y, w, h, c) { G.fillStyle = c; G.fillRect(x, y, w, h); }
  function P(x, y, c) { G.fillStyle = c; G.fillRect(x, y, 1, 1); }
  function E(cx, cy, rx, ry, c) {
    G.fillStyle = c;
    if (G.canvas.hd) { G.beginPath(); G.ellipse(cx + 0.5, cy + 0.5, rx + 0.5, ry + 0.5, 0, 0, 6.2832); G.fill(); return; }
    for (var dy = -ry; dy <= ry; dy++) {
      var t = ry === 0 ? 0 : dy / (ry + 0.5);
      var hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t)));
      G.fillRect(Math.round(cx - hw), Math.round(cy + dy), hw * 2 + 1, 1);
    }
  }
  function TRI(x1, y1, x2, y2, x3, y3, c) {
    G.fillStyle = c;
    if (G.canvas.hd) { G.beginPath(); G.moveTo(x1 + 0.5, y1 + 0.5); G.lineTo(x2 + 0.5, y2 + 0.5); G.lineTo(x3 + 0.5, y3 + 0.5); G.closePath(); G.fill(); return; }
    var ys = [y1, y2, y3], y0 = Math.min.apply(null, ys), y9 = Math.max.apply(null, ys);
    for (var y = y0; y <= y9; y++) {
      var xs = [], pts = [[x1, y1, x2, y2], [x2, y2, x3, y3], [x3, y3, x1, y1]];
      for (var i = 0; i < 3; i++) {
        var a = pts[i];
        if ((y >= a[1] && y <= a[3]) || (y >= a[3] && y <= a[1])) {
          if (a[1] === a[3]) { xs.push(a[0], a[2]); }
          else xs.push(a[0] + (y - a[1]) * (a[2] - a[0]) / (a[3] - a[1]));
        }
      }
      if (xs.length) { var lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs); G.fillRect(Math.round(lo), y, Math.max(1, Math.round(hi) - Math.round(lo) + 1), 1); }
    }
  }
  function LN(x1, y1, x2, y2, c) {
    G.fillStyle = c;
    if (G.canvas.hd) { G.strokeStyle = c; G.lineWidth = 1; G.lineCap = 'round'; G.beginPath(); G.moveTo(x1 + 0.5, y1 + 0.5); G.lineTo(x2 + 0.5, y2 + 0.5); G.stroke(); return; }
    var dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1), sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1, err = dx - dy;
    for (var n = 0; n < 200; n++) {
      G.fillRect(x1, y1, 1, 1);
      if (x1 === x2 && y1 === y2) break;
      var e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x1 += sx; }
      if (e2 < dx) { err += dx; y1 += sy; }
    }
  }
  art.R = R; art.P = P; art.E = E; art.TRI = TRI; art.LN = LN; art.setCtx = setCtx;

  art.canvas = function (w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); x.imageSmoothingEnabled = false; return c; };
  art.ctx2 = function (c) { return c.getContext('2d'); };

  /* part-list renderer with automatic 1px outline.
     parts: ['r',x,y,w,h,col] ['e',cx,cy,rx,ry,col] ['t',x1,y1,x2,y2,x3,y3,col] ['l',x1,y1,x2,y2,col]
     detail parts (no outline, drawn last): 'kr','ke','kt','kl','kp'(x,y,col) */
  function drawPart(p, dx, dy, col, s) {
    var t = p[0].replace('k', '');
    var m = function (v) { return v * s; };
    if (t === 'r') { G.fillStyle = col || p[5]; G.fillRect(m(p[1]) + dx, m(p[2]) + dy, m(p[3]), m(p[4])); }
    else if (t === 'e') {
      if (s === 1) E(p[1] + dx, p[2] + dy, p[3], p[4], col || p[5]);
      else E(m(p[1]) + dx, m(p[2]) + dy, m(p[3]), m(p[4]), col || p[5]);
    }
    else if (t === 't') TRI(m(p[1]) + dx, m(p[2]) + dy, m(p[3]) + dx, m(p[4]) + dy, m(p[5]) + dx, m(p[6]) + dy, col || p[7]);
    else if (t === 'l') { G.fillStyle = col || p[5]; LN(m(p[1]) + dx, m(p[2]) + dy, m(p[3]) + dx, m(p[4]) + dy, col || p[5]); }
    else if (t === 'p') { G.fillStyle = col || p[3]; G.fillRect(m(p[1]) + dx, m(p[2]) + dy, s, s); }
  }
  art.drawParts = function (ctx, parts, scale, outline) {
    setCtx(ctx); scale = scale || 1; outline = outline || OUT;
    var i, p;
    for (i = 0; i < parts.length; i++) {
      p = parts[i]; if (p[0].charAt(0) === 'k') continue;
      drawPart(p, -scale, 0, outline, scale); drawPart(p, scale, 0, outline, scale);
      drawPart(p, 0, -scale, outline, scale); drawPart(p, 0, scale, outline, scale);
    }
    for (i = 0; i < parts.length; i++) { p = parts[i]; if (p[0].charAt(0) === 'k') continue; drawPart(p, 0, 0, null, scale); }
    for (i = 0; i < parts.length; i++) { p = parts[i]; if (p[0].charAt(0) !== 'k') continue; drawPart(p, 0, 0, null, scale); }
  };

  art.glow = function (ctx, x, y, r, rgb, a) {
    var gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gr;
    ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  };

  /* ---------- palettes per region ---------- */
  function mk(o, base) { var r = {}, k; for (k in base) r[k] = base[k]; for (k in o) r[k] = o[k]; return r; }
  var BASE = {
    g1: '#68b556', g2: '#4f9c46', g3: '#8bd36a', p1: '#dcc088', p2: '#b9955a', w1: '#3d8fd8', w2: '#7cc6f2', w3: '#2467b0',
    t1: '#2f7d3c', t2: '#4aa24e', t3: '#1f5c30', tr: '#6e4628', s1: '#b8b4c8', s2: '#8a859e', s3: '#5c5776',
    f1: '#c79a5c', f2: '#a67a40', wl1: '#efe3c8', wl2: '#cdbb98', wd: '#6e4628', ac: '#f2c14e', sand: '#efdca4', sand2: '#d3bd82',
    roofs: ['#c0504a', '#4a78c0', '#d8a23a', '#7a5ab0'], roofD: ['#8a3030', '#2f4f8a', '#a37820', '#523a82']
  };
  art.TH = {
    meadow: BASE,
    forest: mk({ g1: '#3d8a4a', g2: '#2d7040', g3: '#5fb065', p1: '#b89a6a', p2: '#8c7048', t1: '#1f5f38', t2: '#2f8048', t3: '#103f28', w1: '#2f78a8', w2: '#62b0c8' }, BASE),
    coast: mk({ g1: '#74bd62', g2: '#5aa456', g3: '#98d878', p1: '#e4cf9a', p2: '#c3a768', w1: '#2e8fe0', w2: '#8ad4f8', w3: '#1e5db0' }, BASE),
    ash: mk({ g1: '#7a7482', g2: '#625c6c', g3: '#979099', p1: '#a89aa0', p2: '#82757c', t1: '#4a4450', t2: '#625a68', t3: '#2f2a36', tr: '#4a3a3a', s1: '#9a929e', s2: '#6c6474', s3: '#473f50', w1: '#3a5a8a', w2: '#6a8ab8', ac: '#ff7a3d', sand: '#9a8e8e', sand2: '#7a6e70' }, BASE),
    castle: mk({ g1: '#68b556', g2: '#4f9c46', g3: '#8bd36a', s1: '#c8c8d8', s2: '#9a9ab4', s3: '#64648a', f1: '#aaa6c2', f2: '#8782a8', wl1: '#c8c8dc', wl2: '#9a9ab4', ac: '#f2c14e' }, BASE),
    interior: mk({ f1: '#c9985a', f2: '#a67840', wl1: '#e8d8b8', wl2: '#c2ac84', wd: '#6e4628', ac: '#f2c14e' }, BASE),
    lighthouse: mk({ s1: '#d0d6e4', s2: '#9aa6c0', s3: '#5c6a90', f1: '#b49a74', f2: '#8e7650', wl1: '#d8dcec', wl2: '#a4aec8', w1: '#2e82d0', w2: '#78c0f0', ac: '#ffe27a' }, BASE),
    crypt: mk({ s1: '#8a8aa6', s2: '#5e5e80', s3: '#3c3a58', f1: '#6a6a8c', f2: '#4c4a6c', wl1: '#5a5878', wl2: '#3a3858', ac: '#a77bff', w1: '#2c4a78', w2: '#4a78a8' }, BASE),
    archive: mk({ s1: '#9ad8d8', s2: '#5aa4b8', s3: '#2e6482', f1: '#7ac4cc', f2: '#4c8fa8', wl1: '#4a8ab0', wl2: '#2a5a80', ac: '#7af0ff', w1: '#2a78c8', w2: '#6ac8f0' }, BASE),
    cave: mk({ s1: '#8a7e90', s2: '#63596e', s3: '#3e364c', f1: '#7a6e80', f2: '#5a506a', wl1: '#4c4258', wl2: '#2e2638', ac: '#e8b84a' }, BASE),
    shrine: mk({ f1: '#c8c0e0', f2: '#a198c8', wl1: '#7a70a8', wl2: '#554c80', ac: '#ffe27a' }, BASE)
  };

  /* ---------- tile registry ---------- */
  var names = [];
  var defs = {};
  FP.TI = {};
  function def(name, props, draw) {
    var id = names.length; names.push(name);
    FP.TI[name] = id;
    defs[id] = { name: name, solid: !!props.solid, enc: !!props.enc, anim: !!props.anim, draw: draw, over: !!props.over };
  }
  art.defs = defs;
  var th, hh;
  function sp(c, n, seed, colors) { /* scatter specks */
    for (var i = 0; i < n; i++) {
      var q = FP.hash(seed + i, hh);
      P(q % 16, (q >> 5) % 16, colors[(q >> 9) % colors.length]);
    }
  }
  function grassBase() {
    if (G.canvas.hd && art.HDP && art.HDP.GRASS) { art.HDP.GRASS(G, th, hh); art._snap = G.getImageData(0, 0, G.canvas.width, G.canvas.height); return; }
    R(0, 0, 16, 16, th.g1);
    sp(0, 7, 1, [th.g2, th.g3]);
    if (hh % 3 === 0) { P(4, 9, th.g2); P(5, 8, th.g2); }
  }

  def('GRASS', {}, function () { grassBase(); });
  def('TALL', { enc: true }, function (t, h, fr) {
    R(0, 0, 16, 16, th.g1);
    for (var i = 0; i < 6; i++) {
      var q = FP.hash(i * 7, hh), x = 1 + (q % 13), y = 3 + ((q >> 4) % 11);
      R(x, y, 1, 4, th.t1); R(x + 1, y + 1, 1, 3, th.t2); R(x - 1, y + 1, 1, 3, th.t2); P(x, y - 1, th.g3);
    }
  });
  def('FLOWER', {}, function () {
    grassBase();
    var cols = ['#f4f0ff', '#ffd05a', '#ff8ab0', '#8ac8ff'];
    for (var i = 0; i < 3; i++) { var q = FP.hash(i * 11, hh), x = 1 + q % 13, y = 2 + (q >> 4) % 12, c = cols[(q >> 9) % 4]; P(x, y, c); P(x + 1, y, c); P(x, y + 1, c); P(x + 1, y + 1, th.ac); P(x, y + 2, th.t1); }
  });
  def('PATH', {}, function () {
    R(0, 0, 16, 16, th.p1); sp(0, 9, 3, [th.p2, th.p2, th.p1]);
    if (hh % 4 === 0) { R(3, 6, 3, 1, th.p2); }
  });
  def('COBBLE', {}, function () {
    R(0, 0, 16, 16, th.s2);
    R(0, 0, 16, 1, th.s3); R(0, 5, 16, 1, th.s3); R(0, 10, 16, 1, th.s3); R(0, 15, 16, 1, th.s3);
    R(3, 0, 1, 5, th.s3); R(11, 0, 1, 5, th.s3); R(7, 5, 1, 5, th.s3); R(0, 5, 1, 5, th.s3); R(14, 10, 1, 5, th.s3); R(5, 10, 1, 5, th.s3);
    R(1, 1, 2, 1, th.s1); R(4, 1, 6, 1, th.s1); R(12, 6, 3, 1, th.s1); R(8, 6, 4, 1, th.s1); R(1, 11, 3, 1, th.s1); R(6, 11, 8, 1, th.s1);
  });
  def('SAND', {}, function () { R(0, 0, 16, 16, th.sand); sp(0, 8, 5, [th.sand2, th.sand2, '#fff6d0']); }, 0);
  def('WATER', { solid: true, anim: true }, function (t, h, fr) {
    R(0, 0, 16, 16, th.w1);
    var o = fr ? 4 : 0;
    R((2 + o) % 14, 3, 5, 1, th.w2); R((9 + o) % 12, 8, 4, 1, th.w2); R((4 + o) % 13, 13, 5, 1, th.w2);
    P((10 + o) % 15, 4, th.w3); P((3 + o) % 15, 10, th.w3);
  });
  def('DEEP', { solid: true, anim: true }, function (t, h, fr) {
    R(0, 0, 16, 16, th.w3);
    var o = fr ? 5 : 0;
    R((1 + o) % 13, 5, 4, 1, th.w1); R((8 + o) % 12, 11, 5, 1, th.w1); P((12 + o) % 15, 2, th.w2);
  });
  def('TREE', { solid: true }, function () {
    grassBase();
    R(7, 10, 3, 5, th.tr); R(7, 10, 1, 5, '#8a5a38'); R(6, 14, 5, 1, th.tr);
    E(8, 6, 6, 5, th.t3); E(8, 5, 6, 5, th.t1); E(6, 4, 3, 3, th.t2); E(11, 7, 2, 2, th.t3);
    P(5, 3, th.g3); P(6, 2, th.g3); P(9, 4, th.t2); P(10, 8, th.t3);
  });
  def('PINE', { solid: true }, function () {
    grassBase();
    R(7, 12, 2, 3, th.tr);
    TRI(8, 0, 2, 8, 14, 8, th.t3); TRI(8, 0, 3, 7, 13, 7, th.t1);
    TRI(8, 4, 1, 13, 15, 13, th.t3); TRI(8, 4, 2, 12, 14, 12, th.t1);
    P(6, 5, th.t2); P(5, 10, th.t2); P(9, 9, th.t2); R(8, 1, 1, 2, th.t2);
  });
  def('BUSH', { solid: true }, function () {
    grassBase();
    E(8, 10, 6, 4, th.t3); E(8, 9, 6, 4, th.t1); E(6, 8, 2, 2, th.t2);
    P(11, 8, '#ff8ab0'); P(5, 11, '#ffd05a');
  });
  def('ROCK', { solid: true }, function () {
    grassBase();
    E(8, 10, 6, 4, th.s3); E(8, 9, 6, 4, th.s2); E(6, 8, 3, 2, th.s1); P(11, 11, th.s3);
  });
  def('MOUNT', { solid: true }, function () {
    R(0, 0, 16, 16, th.g2);
    TRI(8, 0, -2, 15, 18, 15, th.s3); TRI(8, 1, 0, 15, 16, 15, th.s2);
    TRI(8, 1, 6, 6, 10, 6, '#f4f4ff'); TRI(8, 1, 3, 10, 8, 8, th.s1);
    LN(8, 4, 5, 15, th.s3); LN(9, 7, 12, 15, th.s3);
    R(0, 15, 16, 1, th.s3);
  });
  def('FENCE', { solid: true }, function () {
    grassBase();
    R(0, 7, 16, 2, th.tr); R(0, 11, 16, 2, th.tr); R(2, 4, 2, 11, '#8a5a38'); R(12, 4, 2, 11, '#8a5a38'); R(2, 4, 1, 11, '#a87a52');
  });
  def('SIGN', { solid: true }, function () {
    grassBase();
    R(7, 9, 2, 6, th.tr); R(2, 3, 12, 7, th.tr); R(3, 4, 10, 5, '#d8b070'); R(4, 6, 8, 1, '#8a5a38'); R(4, 8, 5, 1, '#8a5a38');
  });
  def('BRIDGE', { anim: true }, function (t, h, fr) {
    R(0, 0, 16, 16, th.w1); R(0, 0, 16, 1, th.w3); R(0, 15, 16, 1, th.w3);
    R(0, 2, 16, 12, th.f1);
    for (var i = 0; i < 16; i += 4) R(i, 2, 1, 12, th.f2);
    R(0, 2, 16, 1, th.tr); R(0, 13, 16, 1, th.tr); P(2, 5, th.f2); P(10, 9, th.f2);
  });
  def('BRIDGEV', { anim: true }, function (t, h, fr) {
    R(0, 0, 16, 16, th.w1); R(0, 0, 1, 16, th.w3); R(15, 0, 1, 16, th.w3);
    R(2, 0, 12, 16, th.f1);
    for (var i = 0; i < 16; i += 4) R(2, i, 12, 1, th.f2);
    R(2, 0, 1, 16, th.tr); R(13, 0, 1, 16, th.tr);
  });
  /* roofs: four colors in separate tiles */
  [0, 1, 2, 3].forEach(function (ci) {
    def('ROOF' + ci, { solid: true }, function () {
      var c = th.roofs[ci], d = th.roofD[ci];
      R(0, 0, 16, 16, c);
      for (var y = 0; y < 16; y += 4) { R(0, y + 3, 16, 1, d); for (var x = (y / 4 % 2) * 4; x < 16; x += 8) R(x, y, 1, 4, d); }
      R(0, 0, 16, 1, '#ffffff22'); R(1, 1, 5, 1, 'rgba(255,255,255,0.22)'); R(9, 5, 5, 1, 'rgba(255,255,255,0.18)');
    });
    def('ROOFT' + ci, { solid: true }, function () {
      var c = th.roofs[ci], d = th.roofD[ci];
      R(0, 0, 16, 16, c);
      for (var y = 4; y < 16; y += 4) { R(0, y + 3, 16, 1, d); for (var x = ((y / 4) % 2) * 4; x < 16; x += 8) R(x, y, 1, 4, d); }
      R(0, 0, 16, 4, d); R(0, 0, 16, 2, c); R(0, 3, 16, 1, 'rgba(0,0,0,0.25)');
    });
  });
  def('WALLB', { solid: true }, function () {
    R(0, 0, 16, 16, th.wl1); R(0, 12, 16, 4, th.wl2); R(0, 0, 16, 1, th.wl2);
    R(0, 0, 2, 16, th.wd); R(14, 0, 2, 16, th.wd); R(4, 4, 8, 7, th.wd); R(5, 5, 6, 5, '#7ec0e8'); R(5, 5, 6, 2, '#bfe6ff'); R(8, 5, 1, 5, th.wd); R(5, 7, 6, 1, th.wd);
    R(3, 11, 10, 1, th.wd);
  });
  def('WALLP', { solid: true }, function () {
    R(0, 0, 16, 16, th.wl1); R(0, 12, 16, 4, th.wl2); R(0, 0, 16, 1, th.wl2);
    R(0, 0, 2, 16, th.wd); R(14, 0, 2, 16, th.wd); sp(0, 6, 9, [th.wl2]);
  });
  def('WALLS', { solid: true }, function () {
    R(0, 0, 16, 16, th.s2);
    R(0, 0, 16, 1, th.s1); R(0, 5, 16, 1, th.s3); R(0, 10, 16, 1, th.s3); R(0, 15, 16, 1, th.s3);
    R(4, 0, 1, 5, th.s3); R(12, 5, 1, 5, th.s3); R(7, 10, 1, 5, th.s3); R(0, 1, 16, 1, th.s1);
    R(1, 6, 5, 1, th.s1); R(8, 11, 5, 1, th.s1);
  });
  def('DOOR', {}, function () {
    R(0, 0, 16, 16, th.wl1); R(0, 12, 16, 4, th.wl2);
    R(0, 0, 2, 16, th.wd); R(14, 0, 2, 16, th.wd);
    R(3, 2, 10, 14, th.wd); R(4, 3, 8, 13, '#8a5a38'); R(4, 3, 8, 2, '#a87a52');
    R(7, 3, 2, 13, '#6e4628'); P(11, 10, th.ac); R(4, 8, 8, 1, '#6e4628');
    R(2, 15, 12, 1, th.s2);
  });
  def('GATE', { }, function () { /* castle gate arch */
    R(0, 0, 16, 16, th.s2); R(0, 0, 16, 1, th.s1); R(0, 5, 16, 1, th.s3); R(0, 10, 16, 1, th.s3);
    E(8, 8, 6, 8, th.s3); R(2, 8, 12, 8, th.s3); E(8, 8, 5, 7, '#171526'); R(3, 8, 10, 8, '#171526');
    R(7, 1, 2, 3, th.ac);
  });
  def('WELL', { solid: true }, function () {
    grassBase();
    E(8, 11, 6, 4, th.s3); E(8, 10, 6, 4, th.s2); E(8, 10, 4, 2, th.w3); R(3, 3, 2, 8, th.tr); R(11, 3, 2, 8, th.tr); R(2, 2, 12, 2, th.roofs[0]); P(8, 6, th.s1);
  });
  def('STATUE', { solid: true }, function () {
    R(0, 0, 16, 16, th.s2); R(0, 0, 16, 1, th.s3);
    R(3, 12, 10, 4, th.s3); R(4, 11, 8, 1, th.s1); E(8, 7, 3, 4, th.s1); R(5, 9, 6, 3, th.s1); R(6, 3, 4, 3, th.s1); R(4, 6, 2, 4, th.s1); R(10, 6, 2, 4, th.s1); P(7, 4, th.s3); P(9, 4, th.s3);
  });
  def('FOUNTAIN', { solid: true, anim: true }, function (t, h, fr) {
    R(0, 0, 16, 16, th.s2); R(0, 0, 16, 1, th.s3);
    E(8, 10, 7, 5, th.s3); E(8, 9, 7, 5, th.s1); E(8, 9, 5, 3, th.w1); P(6, 9 + fr, th.w2); P(10, 8 - fr, th.w2);
    R(7, 3, 2, 6, th.s2); R(7, 2 - fr, 2, 2, th.w2); P(6, 4, th.w2); P(9, 4, th.w2); P(7, 1, th.w2);
  });
  def('LAMP', { solid: true }, function () {
    grassBase();
    R(7, 6, 2, 9, '#3a3a48'); R(5, 14, 6, 2, '#3a3a48'); R(5, 1, 6, 6, '#2a2a38'); R(6, 2, 4, 4, '#ffe9a0'); R(7, 3, 2, 2, '#ffffff'); R(5, 0, 6, 1, '#4a4a58');
  });
  def('LAMPC', { solid: true }, function () { /* lamp on cobble */
    R(0, 0, 16, 16, th.s2); R(0, 0, 16, 1, th.s3); R(0, 8, 16, 1, th.s3);
    R(7, 6, 2, 9, '#3a3a48'); R(5, 14, 6, 2, '#3a3a48'); R(5, 1, 6, 6, '#2a2a38'); R(6, 2, 4, 4, '#ffe9a0'); R(7, 3, 2, 2, '#ffffff'); R(5, 0, 6, 1, '#4a4a58');
  });
  def('CRATE', { solid: true }, function () {
    R(0, 0, 16, 16, th.p1); R(2, 3, 12, 12, th.f2); R(2, 3, 12, 2, th.f1); R(2, 3, 2, 12, th.tr); R(12, 3, 2, 12, th.tr); R(4, 8, 8, 1, th.tr); LN(4, 5, 11, 13, th.tr);
  });
  def('BARREL', { solid: true }, function () {
    R(0, 0, 16, 16, th.p1); E(8, 8, 5, 7, th.tr); E(8, 8, 4, 6, th.f2); R(3, 5, 10, 1, '#4a4a58'); R(3, 10, 10, 1, '#4a4a58'); R(6, 3, 2, 10, th.f1);
  });
  [0, 1, 2, 3].forEach(function (ci) {
    def('STALL' + ci, { solid: true }, function () {
      R(0, 0, 16, 16, th.p1);
      var c = th.roofs[ci];
      R(0, 0, 16, 7, '#f4f0e0'); for (var x = 0; x < 16; x += 4) R(x, 0, 2, 7, c);
      R(0, 7, 16, 1, th.roofD[ci]); for (var x2 = 0; x2 < 16; x2 += 4) { P(x2, 8, c); P(x2 + 1, 8, c); }
      R(1, 8, 2, 8, th.tr); R(13, 8, 2, 8, th.tr); R(1, 11, 14, 5, th.f1); R(1, 11, 14, 1, th.f2);
      P(4, 10, '#e8503a'); P(5, 10, '#e8503a'); P(8, 10, '#f2c14e'); P(9, 10, '#f2c14e'); P(11, 10, '#7ad66e');
    });
  });
  def('DOCK', {}, function () {
    R(0, 0, 16, 16, th.f1); for (var y = 0; y < 16; y += 4) R(0, y + 3, 16, 1, th.f2);
    R(0, 0, 1, 16, th.f2); P(3, 1, th.f2); P(12, 6, th.f2); P(6, 11, th.f2);
    for (var x = 2; x < 16; x += 5) P(x, 1 + (x % 3) * 4, th.tr);
  });
  def('BOAT', { solid: true, anim: true }, function (t, h, fr) {
    R(0, 0, 16, 16, th.w1); R((2 + fr * 4) % 12, 14, 5, 1, th.w2);
    TRI(1, 7, 15, 7, 12, 13, th.tr); R(1, 7, 14, 2, th.f1); R(2, 9, 12, 1, th.f2); R(7, 0, 1, 8, th.tr); TRI(8, 1, 8, 6, 13, 6, '#f4f0e0');
  });
  def('NET', { solid: true }, function () {
    R(0, 0, 16, 16, th.f1); for (var y = 0; y < 16; y += 4) R(0, y + 3, 16, 1, th.f2);
    R(2, 3, 12, 10, '#5a8a9a'); for (var i = 2; i < 14; i += 3) { R(i, 3, 1, 10, '#3a6a7a'); } for (var j = 3; j < 13; j += 3) R(2, j, 12, 1, '#3a6a7a');
  });
  /* Lantern Road: a pale road of old light */
  def('ROAD', { anim: true }, function (t, h, fr) {
    R(0, 0, 16, 16, '#cfc9e8'); R(0, 0, 16, 1, '#e8e4ff'); R(0, 15, 16, 1, '#9a94c4');
    R(0, 0, 1, 16, '#9a94c4'); R(15, 0, 1, 16, '#9a94c4');
    R(3, 3, 10, 10, '#e6e2fa'); R(3, 3, 10, 1, '#fff'); R(3, 12, 10, 1, '#b2acd8');
    R(7, 6, 2, 4, fr ? '#fff6c0' : '#ffe9a0'); P(7, 5, '#fff'); P(8, 10, '#d8c070');
  });
  def('ROADC', { anim: true }, function (t, h, fr) { /* cracked Lantern Road */
    R(0, 0, 16, 16, '#9a94b8'); R(0, 0, 16, 1, '#b8b2d8'); R(0, 15, 16, 1, '#6a6488');
    R(3, 3, 10, 10, '#b4aed0'); R(3, 3, 10, 1, '#d0cae8');
    LN(2, 2, 7, 8, '#1b1626'); LN(7, 8, 6, 12, '#1b1626'); LN(7, 8, 13, 10, '#1b1626'); LN(13, 10, 14, 14, '#1b1626');
    P(7, 5, fr ? '#ff9ad8' : '#c070ff'); P(8, 9, fr ? '#c070ff' : '#ff9ad8');
  });
  def('ROADV', { }, function () { /* void gap in the road, a broken bridge */
    R(0, 0, 16, 16, '#0d0b1a'); sp(0, 4, 17, ['#3b2f6b', '#241d4a']);
    R(0, 0, 16, 2, '#6a6488'); R(0, 14, 16, 2, '#6a6488');
  });
  /* Lampstone crystal on a pedestal */
  ['LSTONE', 'LSTONE_B'].forEach(function (nm, i) {
    def(nm, { solid: true, anim: true }, function (t, h, fr) {
      var f1 = th.f1; R(0, 0, 16, 16, f1);
      R(2, 11, 12, 5, th.s3); R(3, 10, 10, 2, th.s2); R(4, 10, 8, 1, th.s1);
      if (i === 0) {
        TRI(8, 0, 4, 9, 12, 9, '#7af0ff'); TRI(8, 0, 6, 9, 10, 9, '#d8ffff'); R(7, 3, 2, 6, '#ffffff');
        if (fr) { P(3, 3, '#fff'); P(13, 6, '#fff'); } else { P(12, 2, '#fff'); P(2, 7, '#fff'); }
      } else {
        TRI(8, 2, 4, 9, 12, 9, '#6a6488'); TRI(8, 2, 6, 9, 10, 9, '#8a84a8'); LN(8, 2, 6, 9, '#1b1626'); LN(8, 4, 10, 9, '#1b1626');
        P(5, 11, '#6a6488'); P(11, 12, '#6a6488');
      }
    });
  });
  def('SHRINE', { solid: true, anim: true }, function (t, h, fr) { /* Lamp Shrine: heal and save */
    R(0, 0, 16, 16, th.f1);
    R(3, 11, 10, 5, th.s3); R(4, 10, 8, 2, th.s2); R(5, 10, 6, 1, th.s1);
    R(7, 4, 2, 7, '#3a3a48'); R(4, 1, 8, 5, '#2a2a38'); R(5, 2, 6, 3, fr ? '#fff0b0' : '#ffe27a'); R(7, 3, 2, 1, '#fff');
    R(3, 0, 10, 1, '#4a4a58');
  });
  /* interior tiles */
  def('FLOOR', {}, function () {
    R(0, 0, 16, 16, th.f1); for (var y = 0; y < 16; y += 4) R(0, y + 3, 16, 1, th.f2);
    R(((hh % 3) * 5 + 2), 0, 1, 3, th.f2); R(((hh % 4) * 4 + 3), 8, 1, 3, th.f2);
  });
  def('FLOORS', {}, function () {
    R(0, 0, 16, 16, th.f1); R(0, 0, 16, 1, th.f2); R(0, 8, 16, 1, th.f2); R(0, 0, 1, 8, th.f2); R(8, 8, 1, 8, th.f2);
    P(3, 3, th.f2); P(11, 12, th.f2);
  });
  def('RUG', {}, function () {
    R(0, 0, 16, 16, th.roofs[0]); R(1, 1, 14, 14, th.roofD[0]); R(2, 2, 12, 12, th.roofs[0]); R(7, 5, 2, 6, th.ac); R(5, 7, 6, 2, th.ac);
  });
  def('CARPET', {}, function () {
    R(0, 0, 16, 16, '#9a2f4a'); R(0, 0, 2, 16, '#f2c14e'); R(14, 0, 2, 16, '#f2c14e'); R(2, 0, 1, 16, '#6e1f34'); R(13, 0, 1, 16, '#6e1f34');
    if (hh % 2) { P(7, 4, '#c0506a'); P(8, 11, '#c0506a'); } else { P(8, 5, '#c0506a'); P(7, 10, '#c0506a'); }
  });
  def('WALLI', { solid: true }, function () {
    R(0, 0, 16, 16, th.wl1); R(0, 0, 16, 2, th.wl2); R(0, 10, 16, 6, th.wd); R(0, 10, 16, 1, '#8a5a38'); R(0, 13, 16, 1, '#5a3a20');
    R(5, 3, 1, 6, th.wl2); R(11, 3, 1, 6, th.wl2);
  });
  def('WALLT', { solid: true }, function () {
    R(0, 0, 16, 16, th.wl2); R(0, 0, 16, 3, th.wd); R(0, 15, 16, 1, th.wd); R(0, 7, 16, 1, th.wl1);
    R(3, 3, 1, 4, th.wd); R(11, 8, 1, 7, th.wd); sp(0, 4, 31, [th.wl1]);
  });
  def('WINDOWI', { solid: true }, function () {
    R(0, 0, 16, 16, th.wl1); R(0, 10, 16, 6, th.wd); R(0, 10, 16, 1, '#8a5a38');
    R(3, 1, 10, 9, th.wd); R(4, 2, 8, 7, '#6ab0e8'); R(4, 2, 8, 3, '#b8e0ff'); R(7, 2, 2, 7, th.wd); R(4, 5, 8, 1, th.wd);
  });
  def('BED', { solid: true }, function () {
    R(0, 0, 16, 16, th.f1); R(2, 1, 12, 15, th.tr); R(3, 2, 10, 5, '#f4f0e0'); R(3, 7, 10, 8, th.roofs[1]); R(3, 7, 10, 1, '#fff'); R(3, 3, 10, 1, '#d8d0c0');
  });
  def('TABLE', { solid: true }, function () {
    R(0, 0, 16, 16, th.f1); R(1, 3, 14, 9, th.tr); R(1, 3, 14, 7, th.f2); R(2, 4, 12, 1, th.f1); R(2, 12, 2, 3, th.tr); R(12, 12, 2, 3, th.tr);
    R(5, 5, 3, 2, '#f4f0e0'); R(10, 6, 2, 2, '#e8503a');
  });
  def('CHAIR', { }, function () {
    R(0, 0, 16, 16, th.f1); R(4, 4, 8, 3, th.tr); R(4, 7, 8, 5, th.f2); R(4, 12, 2, 3, th.tr); R(10, 12, 2, 3, th.tr);
  });
  def('SHELF', { solid: true }, function () {
    R(0, 0, 16, 16, th.wl1); R(0, 0, 16, 16, th.wl1); R(1, 1, 14, 15, th.tr); R(2, 2, 12, 6, th.wd);
    var cs = ['#c0504a', '#4a78c0', '#d8a23a', '#7a5ab0', '#4aa24e'];
    for (var i = 0; i < 6; i++) { R(2 + i * 2, 3, 2, 5, cs[(i + hh) % 5]); }
    R(1, 8, 14, 1, th.tr);
    for (var j = 0; j < 6; j++) { R(2 + j * 2, 9, 2, 6, cs[(j + hh + 2) % 5]); }
  });
  def('COUNTER', { solid: true }, function () {
    R(0, 0, 16, 16, th.f1); R(0, 3, 16, 5, th.f2); R(0, 3, 16, 1, '#e0b878'); R(0, 8, 16, 7, th.tr); R(1, 9, 14, 1, th.f2);
  });
  def('HEARTH', { solid: true, anim: true }, function (t, h, fr) {
    R(0, 0, 16, 16, th.wl2); R(0, 0, 16, 16, th.s2); R(2, 2, 12, 13, th.s3); R(3, 5, 10, 10, '#1b1626');
    TRI(8, 6, 4, 14, 12, 14, '#e8503a'); TRI(8, 8 - fr, 6, 14, 10, 14, '#ffb03a'); TRI(8, 10, 7, 14, 9, 14, '#fff2a0');
    R(1, 1, 14, 1, th.s1);
  });
  def('POT', { solid: true }, function () {
    R(0, 0, 16, 16, th.f1); E(8, 10, 5, 5, th.s3); E(8, 9, 5, 5, th.s2); R(4, 4, 8, 2, th.s1); E(8, 4, 3, 1, '#4a7a3a');
  });
  def('ANVIL', { solid: true }, function () {
    R(0, 0, 16, 16, th.f1); R(3, 5, 10, 3, '#4a4a58'); R(1, 6, 3, 2, '#4a4a58'); R(5, 8, 6, 4, '#3a3a48'); R(3, 12, 10, 3, '#2a2a38'); R(3, 5, 10, 1, '#8a8a9a');
  });
  def('FORGE', { solid: true, anim: true }, function (t, h, fr) {
    R(0, 0, 16, 16, th.s3); R(1, 1, 14, 14, th.s2); R(3, 4, 10, 8, '#1b1626'); R(4, 8, 8, 4, '#e8503a'); R(5, 9, 6, 3, fr ? '#ffd03a' : '#ffb03a'); R(6, 10, 4, 1, '#fff2a0');
    R(2, 0, 12, 3, th.s3); R(0, 15, 16, 1, '#1b1626');
  });
  def('BANNER', { solid: true }, function () {
    R(0, 0, 16, 16, th.s2); R(0, 0, 16, 1, th.s3); R(0, 8, 16, 1, th.s3);
    R(3, 0, 10, 12, '#9a2f4a'); R(3, 0, 10, 1, '#f2c14e'); TRI(3, 12, 13, 12, 8, 16, '#9a2f4a'); R(7, 3, 2, 6, '#f2c14e'); R(5, 5, 6, 2, '#f2c14e');
  });
  def('PILLAR', { solid: true }, function () {
    R(0, 0, 16, 16, th.f1); R(4, 0, 8, 16, th.s2); R(4, 0, 2, 16, th.s1); R(10, 0, 2, 16, th.s3); R(3, 0, 10, 2, th.s1); R(3, 14, 10, 2, th.s1);
  });
  def('PILLARW', { solid: true }, function () { /* pillar against a wall */
    R(0, 0, 16, 16, th.s3); R(4, 0, 8, 16, th.s2); R(4, 0, 2, 16, th.s1); R(10, 0, 2, 16, th.s3); R(3, 0, 10, 2, th.s1); R(3, 14, 10, 2, th.s1);
  });
  def('THRONE', { solid: true }, function () {
    R(0, 0, 16, 16, '#9a2f4a'); R(2, 0, 12, 16, '#c9a23a'); R(3, 1, 10, 9, '#9a2f4a'); R(2, 0, 2, 3, '#f2c14e'); R(12, 0, 2, 3, '#f2c14e'); R(3, 10, 10, 4, '#f2c14e'); R(5, 4, 6, 2, '#f2c14e');
  });
  def('TORCH', { solid: true, anim: true }, function (t, h, fr) {
    R(0, 0, 16, 16, th.wl2); R(0, 0, 16, 3, th.wd); R(0, 15, 16, 1, th.wd);
    R(7, 6, 2, 8, '#3a3a48'); R(5, 5, 6, 2, '#4a4a58'); TRI(8, 0 + fr, 5, 6, 11, 6, '#e8503a'); TRI(8, 2 + fr, 6, 6, 10, 6, '#ffd03a'); P(8, 4, '#fff');
  });
  def('STAIRU', { }, function () { /* stairs up (leads away) */
    R(0, 0, 16, 16, th.wl2); R(0, 0, 16, 16, th.s3);
    for (var i = 0; i < 5; i++) { R(2 + i, 2 + i * 3, 12 - i * 2, 3, th.s2); R(2 + i, 2 + i * 3, 12 - i * 2, 1, th.s1); }
    R(0, 0, 2, 16, th.s1); R(14, 0, 2, 16, th.s1);
  });
  def('STAIRD', { }, function () {
    R(0, 0, 16, 16, '#1b1626');
    for (var i = 0; i < 5; i++) { R(2 + i, 1 + i * 3, 12 - i * 2, 3, th.s3); R(2 + i, 1 + i * 3, 12 - i * 2, 1, th.s2); }
    R(0, 0, 2, 16, th.s2); R(14, 0, 2, 16, th.s2);
  });
  def('EXIT', { }, function () { /* door mat inside rooms */
    R(0, 0, 16, 16, th.f1); R(2, 3, 12, 10, th.roofD[0]); R(3, 4, 10, 8, th.roofs[0]); R(5, 6, 6, 1, th.ac); R(5, 9, 6, 1, th.ac);
  });
  /* dungeon tiles */
  def('SFLOOR', { enc: true }, function () {
    R(0, 0, 16, 16, th.f1); R(0, 0, 16, 1, th.f2); R(0, 8, 16, 1, th.f2); R(0, 0, 1, 8, th.f2); R(8, 8, 1, 8, th.f2);
    if (hh % 5 === 0) { P(4, 4, th.f2); P(5, 5, th.f2); } if (hh % 7 === 0) { P(11, 12, th.f2); P(12, 12, th.f2); }
  });
  def('CFLOOR', { enc: true }, function () {
    R(0, 0, 16, 16, th.f1); sp(0, 10, 41, [th.f2, th.f2, th.s1]);
    if (hh % 3 === 0) { E(5, 10, 2, 1, th.f2); }
  });
  def('FFLOOR', { enc: true }, function () {
    R(0, 0, 16, 16, th.g2); sp(0, 8, 51, [th.g1, th.g1, th.t1]);
    for (var i = 0; i < 3; i++) { var q = FP.hash(i * 13, hh); R(1 + q % 12, 2 + (q >> 4) % 12, 2, 1, th.p2); }
  });
  def('FPATH', { enc: true }, function () {
    R(0, 0, 16, 16, th.p2); sp(0, 9, 53, [th.p1, th.p2, th.g2]);
  });
  def('SWALL', { solid: true }, function () {
    R(0, 0, 16, 16, th.wl2); R(0, 0, 16, 4, th.wl1); R(0, 3, 16, 1, th.s3); R(0, 11, 16, 5, th.s3); R(0, 11, 16, 1, th.s2);
    R(5, 4, 1, 7, th.s3); R(12, 4, 1, 7, th.s3); R(2, 14, 4, 1, th.wl2); R(9, 13, 5, 1, th.wl2);
  });
  def('SWALLT', { solid: true }, function () { /* solid dark top for the interior of dungeon walls */
    R(0, 0, 16, 16, th.wl1); sp(0, 3, 61, [th.wl2]);
  });
  def('CWALL', { solid: true }, function () {
    R(0, 0, 16, 16, th.wl2); E(4, 5, 5, 4, th.wl1); E(12, 11, 5, 4, th.wl1); sp(0, 5, 63, [th.s3]); R(0, 15, 16, 1, th.wl1);
  });
  def('FWALL', { solid: true }, function () {
    R(0, 0, 16, 16, th.t3); E(4, 5, 5, 5, th.t1); E(12, 5, 5, 5, th.t1); E(8, 11, 6, 5, th.t1); E(3, 4, 2, 2, th.t2); E(11, 10, 3, 2, th.t2); P(9, 3, th.g3);
    R(7, 12, 2, 4, th.tr);
  });
  def('RUNE', { enc: true, anim: true }, function (t, h, fr) {
    R(0, 0, 16, 16, th.f1); R(0, 0, 16, 1, th.f2); R(0, 8, 16, 1, th.f2);
    R(3, 3, 10, 10, th.f2); LN(8, 4, 4, 8, th.ac); LN(4, 8, 8, 12, th.ac); LN(8, 12, 12, 8, th.ac); LN(12, 8, 8, 4, th.ac);
    if (fr) { P(8, 8, '#fff'); R(7, 7, 2, 2, th.ac); }
  });
  def('WATERI', { solid: true, anim: true }, function (t, h, fr) {
    R(0, 0, 16, 16, th.w1); var o = fr ? 5 : 0; R((2 + o) % 12, 3, 5, 1, th.w2); R((8 + o) % 11, 10, 4, 1, th.w2);
  });
  def('SHELFW', { solid: true }, function () { /* archive bookcase against wall */
    R(0, 0, 16, 16, th.wl2); R(1, 0, 14, 16, th.s3); R(2, 1, 12, 6, th.wl1);
    var cs = ['#7af0ff', '#4aa0e8', '#a77bff', '#f2c14e', '#e0e8ff'];
    for (var i = 0; i < 6; i++) { R(2 + i * 2, 2, 2, 5, cs[(i + hh) % 5]); }
    R(1, 7, 14, 1, th.s2); R(2, 8, 12, 7, th.wl1);
    for (var j = 0; j < 6; j++) { R(2 + j * 2, 9, 2, 6, cs[(j + hh + 3) % 5]); }
  });
  def('MOSS', { enc: true }, function () { R(0, 0, 16, 16, th.f1); sp(0, 12, 71, ['#4aa24e', '#2f7d3c', th.f2]); });
  /* ash lands */
  def('ASH', { }, function () { R(0, 0, 16, 16, th.g1); sp(0, 9, 81, [th.g2, th.g3, th.g2]); if (hh % 5 === 0) { P(6, 6, th.ac); } });
  def('ASHTALL', { enc: true }, function () {
    R(0, 0, 16, 16, th.g1);
    for (var i = 0; i < 5; i++) { var q = FP.hash(i * 9, hh), x = 1 + q % 13, y = 3 + (q >> 4) % 11; R(x, y, 1, 4, th.t3); R(x + 1, y + 1, 1, 3, th.t1); R(x - 1, y + 1, 1, 3, th.t1); P(x, y - 1, th.ac); }
  });
  def('DEADTREE', { solid: true }, function () {
    R(0, 0, 16, 16, th.g1); sp(0, 5, 83, [th.g2]);
    R(7, 6, 3, 9, th.t3); R(7, 6, 1, 9, th.t1); LN(8, 8, 3, 3, th.t3); LN(9, 7, 13, 2, th.t3); LN(8, 10, 12, 8, th.t3); LN(4, 4, 2, 4, th.t3); P(3, 3, th.t1); P(13, 2, th.t1); R(6, 14, 5, 1, th.t3);
  });
  def('CRACK', { enc: true, anim: true }, function (t, h, fr) {
    R(0, 0, 16, 16, th.g1); sp(0, 6, 85, [th.g2]);
    LN(0, 4, 5, 6, '#1b1626'); LN(5, 6, 9, 11, '#1b1626'); LN(9, 11, 15, 12, '#1b1626'); LN(5, 6, 8, 2, '#1b1626');
    LN(1, 4, 5, 6, fr ? '#ffb03a' : '#ff7a3d'); LN(5, 7, 9, 11, fr ? '#ff7a3d' : '#ffb03a'); LN(10, 11, 14, 12, '#ff7a3d');
  });
  def('LAVA', { solid: true, anim: true }, function (t, h, fr) {
    R(0, 0, 16, 16, '#d8452a'); var o = fr ? 4 : 0; R((1 + o) % 12, 3, 5, 2, '#ff9a3a'); R((8 + o) % 11, 9, 5, 2, '#ffd03a'); P((4 + o) % 14, 12, '#7a1a1a');
  });
  /* overworld landmarks */
  def('OTOWN', {}, function () {
    grassBase();
    R(1, 13, 14, 2, th.p2);
    R(2, 6, 6, 7, th.wl1); TRI(1, 7, 5, 2, 9, 7, th.roofs[0]); R(4, 9, 2, 4, th.wd);
    R(9, 8, 5, 5, th.wl2); TRI(8, 9, 11, 5, 15, 9, th.roofs[1]); R(11, 10, 2, 3, th.wd); P(4, 7, '#7ec0e8');
  });
  def('OTOWN2', {}, function () { /* ashen hold on the overworld */
    R(0, 0, 16, 16, th.g1); sp(0, 6, 87, [th.g2]);
    R(1, 12, 14, 3, th.s3); R(2, 5, 4, 8, th.s2); R(10, 5, 4, 8, th.s2); R(1, 3, 6, 3, th.s3); R(9, 3, 6, 3, th.s3);
    R(4, 3, 1, 2, th.s2); R(12, 3, 1, 2, th.s2); R(5, 8, 6, 5, '#1b1626'); R(6, 7, 4, 1, '#1b1626'); R(7, 5, 2, 2, th.ac); R(3, 7, 1, 2, '#ff7a3d'); R(12, 7, 1, 2, '#ff7a3d');
  });
  def('OCASTLE', {}, function () {
    R(0, 0, 16, 16, th.g1); sp(0, 6, 89, [th.g2, th.g3]);
    R(1, 4, 14, 11, th.s1); R(0, 2, 4, 13, th.s2); R(12, 2, 4, 13, th.s2); R(6, 0, 4, 6, th.s2);
    R(0, 1, 4, 2, th.s3); R(12, 1, 4, 2, th.s3); R(5, 0, 6, 1, th.s3); R(1, 4, 2, 1, th.s3); R(13, 4, 2, 1, th.s3);
    R(6, 9, 4, 6, '#1b1626'); R(7, 8, 2, 1, '#1b1626'); R(7, 2, 2, 2, th.roofs[0]); R(1, 6, 2, 3, th.s3); R(13, 6, 2, 3, th.s3);
    R(0, 0, 1, 2, th.roofs[0]); R(15, 0, 1, 2, th.roofs[0]);
  });
  def('OCAVE', {}, function () {
    grassBase();
    E(8, 9, 7, 6, th.s3); E(8, 8, 7, 6, th.s2); E(7, 6, 3, 2, th.s1); E(8, 11, 4, 4, '#1b1626'); R(4, 11, 8, 4, '#1b1626');
  });
  def('OSTEP', { }, function () { /* hidden stair marker on overworld, looks like path */
    R(0, 0, 16, 16, th.p1); sp(0, 9, 3, [th.p2, th.p2, th.p1]);
  });
  def('VOID', { solid: true }, function () { R(0, 0, 16, 16, '#0d0b1a'); });
  def('BLANK', { solid: true }, function () { R(0, 0, 16, 16, '#0d0b1a'); });


  def('OTOWER', {}, function () { /* lighthouse on the overworld */
    R(0, 0, 16, 16, th.sand); sp(0, 8, 41, [th.sand2]);
    R(1, 13, 14, 2, th.s3);
    R(5, 6, 6, 8, '#e8e4f0'); R(5, 8, 6, 2, '#c0504a'); R(5, 11, 6, 2, '#c0504a'); R(4, 5, 8, 1, th.s3);
    R(6, 2, 4, 3, '#ffe27a'); R(7, 3, 2, 1, '#fff'); R(5, 1, 6, 1, th.s3); R(7, 0, 2, 1, th.s3); R(7, 12, 2, 2, '#1b1626');
    P(3, 3, '#fff3b0'); P(12, 3, '#fff3b0');
  });
  def('OCRYPT', {}, function () { /* crypt mound */
    R(0, 0, 16, 16, th.g1); sp(0, 6, 43, [th.g2]);
    E(8, 10, 7, 6, th.s3); E(8, 9, 7, 6, th.s2); R(1, 10, 14, 5, th.s2); R(6, 9, 4, 6, '#1b1626'); R(7, 8, 2, 1, '#1b1626');
    R(1, 5, 2, 7, th.s1); R(13, 5, 2, 7, th.s1); R(1, 4, 2, 1, th.s3); R(13, 4, 2, 1, th.s3); P(7, 5, '#a77bff'); P(8, 5, '#a77bff');
  });
  def('OARCH', { anim: false }, function () { /* sunken archive door in the cliff */
    R(0, 0, 16, 16, th.w1); sp(0, 8, 47, [th.w2, th.w3]);
    R(1, 6, 14, 10, th.s2); R(0, 8, 16, 8, th.s3); R(1, 6, 14, 1, th.s1);
    R(5, 3, 6, 4, th.s2); R(6, 2, 4, 1, th.s1); R(6, 9, 4, 7, '#0f2a3a'); R(7, 8, 2, 1, '#0f2a3a'); R(7, 4, 2, 2, '#7af0ff'); P(3, 8, '#7af0ff'); P(12, 8, '#7af0ff');
  });
  def('OSHRINE', {}, function () { /* lone lamp shrine on the overworld */
    grassBase(); R(5, 10, 6, 5, th.s3); R(6, 9, 4, 2, th.s2); R(7, 3, 2, 7, '#3a3a48'); R(5, 1, 6, 4, '#2a2a38'); R(6, 2, 4, 2, '#ffe27a'); P(7, 2, '#fff');
  });
  def('FGRASS', { enc: true }, function () { R(0, 0, 16, 16, th.g1); sp(0, 9, 91, [th.g2, th.g2, th.t3]); sp(0, 3, 93, [th.f2, th.p2]); if (hh % 3 === 0) { P(3, 5, th.g3); P(11, 11, th.g3); } });
  def('CAVEF', { enc: true }, function () { R(0, 0, 16, 16, th.f1); sp(0, 10, 57, [th.f2, th.s2]); if (hh % 4 === 0) { R(4, 8, 3, 2, th.s2); } });
  def('GLOW', { anim: true }, function (t, h, fr) { R(0, 0, 16, 16, th.f1); R(3, 3, 10, 10, th.f2); E(8, 8, 3, 3, fr ? '#fff6b0' : th.ac); P(8, 8, '#fff'); });
  def('CHESTT', { solid: true }, function () { R(0, 0, 16, 16, th.f1); R(2, 6, 12, 8, '#7a4a28'); R(2, 6, 12, 3, '#9a6a3a'); R(2, 9, 12, 1, '#4a2a18'); R(7, 8, 2, 3, '#f2c14e'); R(2, 6, 1, 8, '#4a2a18'); R(13, 6, 1, 8, '#4a2a18'); });

  /* ---------- tile cache ---------- */
  var cache = {};
  art.hdCanvas = function (w, h) {
    var S = FP.SS, c = document.createElement('canvas'); c.width = w * S; c.height = h * S; c.hd = S;
    var x = c.getContext('2d'); x.scale(S, S); x.imageSmoothingEnabled = true; return c;
  };
  art.blit = function (ctx, c, x, y) { ctx.drawImage(c, x, y, c.width / (c.hd || 1), c.height / (c.hd || 1)); };
  art.tile = function (id, themeName, variant, frame) {
    var d = defs[id]; if (!d) d = defs[FP.TI.BLANK];
    var key = id + '|' + themeName + '|' + (variant | 0) + '|' + (frame | 0);
    var c = cache[key];
    if (c) return c;
    c = art.hdCanvas(16, 16);
    var x = c.getContext('2d');
    setCtx(x);
    th = art.TH[themeName] || BASE; hh = variant | 0; art.curTheme = themeName; art.curFrame = frame | 0;
    var hp = art.HDP && art.HDP[d.name];
    art._snap = null;
    if (hp) hp(x, th, hh, frame | 0);
    else d.draw(th, hh, (frame | 0) & 1);
    if (art.enhance) art.enhance(c, d.name, hh, !!hp, art._snap);
    art._snap = null;
    cache[key] = c;
    return c;
  };
  art.variantAt = function (x, y) { return (x & 1) | ((y & 1) << 1) | ((FP.hash(x, y) & 1) << 2); };
  art.names = names;
  art.isSolid = function (id) { return !!(defs[id] && defs[id].solid); };
  art.isEnc = function (id) { return !!(defs[id] && defs[id].enc); };
  art.isAnim = function (id) { return !!(defs[id] && defs[id].anim); };
  art.R = R; art.P = P; art.E = E; art.TRI = TRI; art.LN = LN;

  /* renders a whole map into chunked cached canvases (static tiles only; animated tiles drawn live) */
  var CH = 24;
  art.bakeMap = function (map) {
    var chunks = [];
    var cw = Math.ceil(map.w / CH), ch = Math.ceil(map.h / CH), cxi, cyi;
    for (cyi = 0; cyi < ch; cyi++) for (cxi = 0; cxi < cw; cxi++) {
      var tx0 = cxi * CH, ty0 = cyi * CH, tw = Math.min(CH, map.w - tx0), th2 = Math.min(CH, map.h - ty0);
      var pad = 2; /* shadow and shore passes need a little context around the chunk */
      var c = art.hdCanvas(tw * 16, th2 * 16), x = c.getContext('2d');
      x.translate(-tx0 * 16, -ty0 * 16);
      for (var y = Math.max(0, ty0 - pad); y < Math.min(map.h, ty0 + th2 + pad); y++) for (var xx = Math.max(0, tx0 - pad); xx < Math.min(map.w, tx0 + tw + pad); xx++) {
        var id = map.t[y * map.w + xx];
        if (art.isAnim(id)) { art.blit(x, art.tile(FP.TI.GRASS, map.theme, art.variantAt(xx, y), 0), xx * 16, y * 16); continue; }
        var tn = map.themeAt ? map.themeAt(xx, y) : map.theme;
        art.blit(x, art.tile(id, tn, art.variantAt(xx, y), 0), xx * 16, y * 16);
      }
      if (art.bakeLight) art.bakeLight(map, x, tx0 - pad, ty0 - pad, tx0 + tw + pad, ty0 + th2 + pad);
      chunks.push({ c: c, x: tx0 * 16, y: ty0 * 16, w: tw * 16, h: th2 * 16 });
    }
    return { chunks: chunks, w: map.w * 16, h: map.h * 16 };
  };
  art.drawBake = function (g, bake, cx, cy) {
    for (var i = 0; i < bake.chunks.length; i++) {
      var k = bake.chunks[i];
      if (k.x - cx > FP.W || k.x + k.w - cx < 0 || k.y - cy > FP.H || k.y + k.h - cy < 0) continue;
      g.drawImage(k.c, k.x - cx, k.y - cy, k.w, k.h);
    }
  };
})(FP);
