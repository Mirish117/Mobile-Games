/* The Fractured Path: high-resolution ground and terrain painters, tile shading and baked lighting.
   Tiles are painted at FP.SS pixels per art pixel with real texture, soft shapes and bevel shading. */
(function (FP) {
  'use strict';
  var art = FP.art;
  var HDP = art.HDP = {};

  /* ---------- helpers ---------- */
  function rnd(seed) { var s = (seed * 2654435761) >>> 0; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; }; }
  function hex(c) { if (c.charAt(0) === 'r') { var m = c.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]]; } var h = c.charAt(0) === '#' ? c.slice(1) : c; if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, t) { var A = hex(a), B = hex(b); return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')'; }
  art.mix = mix; art.rnd = rnd; art.hex = hex;
  /* draws fn at the tile and its wrapped copies so ground texture is seamless */
  function wrap(x, y, r, fn) {
    for (var ox = -16; ox <= 16; ox += 16) for (var oy = -16; oy <= 16; oy += 16) {
      var px = x + ox, py = y + oy;
      if (px + r < 0 || px - r > 16 || py + r < 0 || py - r > 16) continue;
      fn(px, py);
    }
  }
  function blob(g, x, y, r, col, a) {
    wrap(x, y, r, function (px, py) {
      var gr = g.createRadialGradient(px, py, 0, px, py, r);
      gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = a; g.fillStyle = gr; g.fillRect(px - r, py - r, r * 2, r * 2); g.globalAlpha = 1;
    });
  }
  function rgbaOf(c, a) { var A = hex(c); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }
  function softBlob(g, x, y, r, col, a) {
    wrap(x, y, r, function (px, py) {
      var gr = g.createRadialGradient(px, py, 0, px, py, r);
      gr.addColorStop(0, rgbaOf(col, a)); gr.addColorStop(1, rgbaOf(col, 0));
      g.fillStyle = gr; g.fillRect(px - r, py - r, r * 2, r * 2);
    });
  }
  function blade(g, x, y, h, lean, col, w) {
    wrap(x, y, h + 1, function (px, py) {
      g.strokeStyle = col; g.lineWidth = w || 0.42; g.lineCap = 'round';
      g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + lean * 0.2, py - h * 0.6, px + lean, py - h); g.stroke();
    });
  }
  function dot(g, x, y, r, col) { wrap(x, y, r, function (px, py) { g.fillStyle = col; g.beginPath(); g.arc(px, py, r, 0, 6.2832); g.fill(); }); }
  art.hdh = { rnd: rnd, mix: mix, blob: softBlob, blade: blade, dot: dot, wrap: wrap, rgba: rgbaOf };

  /* ---------- ground painters ---------- */
  function grass(g, th, hh, o) {
    o = o || {};
    if (art.atlasPaint && art.atlasPaint('grass', g, hh, 0)) return;
    var r = rnd(hh * 7 + 11), n;
    g.fillStyle = th.g1; g.fillRect(0, 0, 16, 16);
    for (n = 0; n < 8; n++) softBlob(g, r() * 16, r() * 16, 2 + r() * 3, th.g3, 0.12);
    for (n = 0; n < 8; n++) softBlob(g, r() * 16, r() * 16, 2 + r() * 3, th.g2, 0.14);
    /* blades, back to front */
    var bl = [];
    for (n = 0; n < (o.dense || 34); n++) bl.push([r() * 16, r() * 16, 0.9 + r() * 1.5, (r() - 0.5) * 1.6, r()]);
    bl.sort(function (a, b) { return a[1] - b[1]; });
    bl.forEach(function (b) {
      var c = b[4] < 0.35 ? th.g2 : b[4] < 0.75 ? th.g3 : mix(th.g3, '#ffffff', 0.35);
      blade(g, b[0], b[1], b[2], b[3], c, 0.34);
      if (b[4] < 0.2) blade(g, b[0] + 0.4, b[1] + 0.2, b[2] * 0.7, b[3], th.g2, 0.3);
    });
    for (n = 0; n < 3; n++) dot(g, r() * 16, r() * 16, 0.25, rgbaOf('#ffffff', 0.35));
  }
  HDP.GRASS = function (g, th, hh) { grass(g, th, hh); };
  HDP.FGRASS = function (g, th, hh) {
    grass(g, th, hh, { dense: 40 });
    var r = rnd(hh * 5 + 3), n;
    for (n = 0; n < 5; n++) softBlob(g, r() * 16, r() * 16, 2.5 + r() * 2, th.t3, 0.4);
    for (n = 0; n < 4; n++) { var x = r() * 16, y = r() * 16; blade(g, x, y, 1.6, 0.4, th.t2, 0.4); dot(g, x + 0.4, y - 1.6, 0.35, th.f2); }
  };
  HDP.FLOWER = function (g, th, hh) {
    grass(g, th, hh);
    var r = rnd(hh * 13 + 5), cols = ['#f4f0ff', '#ffd05a', '#ff8ab0', '#8ac8ff', '#c9a0ff'], n, i;
    for (n = 0; n < 6; n++) {
      var x = 1.5 + r() * 13, y = 3 + r() * 11, c = cols[Math.floor(r() * cols.length)];
      g.strokeStyle = th.t1; g.lineWidth = 0.35; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 0.3, y + 1, x, y + 2); g.stroke();
      for (i = 0; i < 5; i++) { var a = i * 1.2566 + r(); g.fillStyle = c; g.beginPath(); g.arc(x + Math.cos(a) * 0.55, y + Math.sin(a) * 0.55, 0.42, 0, 6.2832); g.fill(); }
      g.fillStyle = '#ffd05a'; g.beginPath(); g.arc(x, y, 0.32, 0, 6.2832); g.fill();
    }
  };
  HDP.TALL = function (g, th, hh) {
    if (!(art.atlasPaint && art.atlasPaint('grass', g, hh, 0))) { g.fillStyle = th.g1; g.fillRect(0, 0, 16, 16); }
    var r = rnd(hh * 3 + 29), n;
    for (n = 0; n < 5; n++) softBlob(g, r() * 16, r() * 16, 4 + r() * 3, th.t3, 0.45);
    var bl = [];
    for (n = 0; n < 60; n++) bl.push([r() * 16, 2 + r() * 16, 2.2 + r() * 2.4, (r() - 0.5) * 2.4, r()]);
    bl.sort(function (a, b) { return a[1] - b[1]; });
    bl.forEach(function (b) {
      var c = b[4] < 0.3 ? th.t3 : b[4] < 0.7 ? th.t1 : th.t2;
      blade(g, b[0], b[1], b[2], b[3], c, 0.5);
      if (b[4] > 0.9) blade(g, b[0] + 0.3, b[1], b[2] * 0.8, b[3], th.g3, 0.35);
    });
  };
  HDP.PATH = function (g, th, hh) {
    if (art.atlasPaint && art.atlasPaint('dirt', g, hh, 0)) return;
    var r = rnd(hh * 17 + 2), n;
    g.fillStyle = th.p1; g.fillRect(0, 0, 16, 16);
    for (n = 0; n < 10; n++) softBlob(g, r() * 16, r() * 16, 2 + r() * 3, th.p2, 0.2);
    for (n = 0; n < 8; n++) softBlob(g, r() * 16, r() * 16, 2 + r() * 3, '#ffffff', 0.07);
    for (n = 0; n < 14; n++) {
      var x = r() * 16, y = r() * 16, s = 0.35 + r() * 0.7;
      wrap(x, y, 2, function (px, py) {
        g.fillStyle = rgbaOf('#000000', 0.2); g.beginPath(); g.ellipse(px + 0.15, py + 0.3, s, s * 0.6, 0, 0, 6.2832); g.fill();
        g.fillStyle = mix(th.p2, th.p1, 0.3); g.beginPath(); g.ellipse(px, py, s, s * 0.6, 0, 0, 6.2832); g.fill();
        g.fillStyle = rgbaOf('#ffffff', 0.35); g.beginPath(); g.ellipse(px - s * 0.25, py - s * 0.2, s * 0.4, s * 0.2, 0, 0, 6.2832); g.fill();
      });
    }
    for (n = 0; n < 28; n++) dot(g, r() * 16, r() * 16, 0.18, rgbaOf(th.p2, 0.9));
    if (hh % 3 === 0) { blade(g, 3, 5, 1.2, 0.5, th.g2, 0.3); }
  };
  HDP.SAND = function (g, th, hh) {
    if (art.atlasPaint && art.atlasPaint('sand', g, hh, 0)) return;
    var r = rnd(hh * 19 + 7), n;
    g.fillStyle = th.sand; g.fillRect(0, 0, 16, 16);
    for (n = 0; n < 6; n++) softBlob(g, r() * 16, r() * 16, 3 + r() * 4, th.sand2, 0.3);
    for (n = 0; n < 5; n++) {
      var y = 1 + r() * 14, x = r() * 16, w = 3 + r() * 4;
      g.strokeStyle = rgbaOf(th.sand2, 0.55); g.lineWidth = 0.3; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 0.8, x + w, y); g.stroke();
      g.strokeStyle = rgbaOf('#ffffff', 0.4); g.beginPath(); g.moveTo(x, y - 0.4); g.quadraticCurveTo(x + w / 2, y - 1.2, x + w, y - 0.4); g.stroke();
    }
    for (n = 0; n < 40; n++) dot(g, r() * 16, r() * 16, 0.16, r() < 0.5 ? rgbaOf(th.sand2, 0.9) : rgbaOf('#fff6d0', 0.8));
  };
  HDP.COBBLE = function (g, th, hh) {
    if (art.atlasPaint && art.atlasPaint('cobble', g, hh, 0)) return;
    var r = rnd(hh * 23 + 1), y, x;
    g.fillStyle = mix(th.s3, '#000', 0.25); g.fillRect(0, 0, 16, 16);
    var rows = [[0, 5], [5, 5.4], [10.4, 5.6]];
    rows.forEach(function (row, ri) {
      var x0 = ri % 2 ? -2.5 : 0, w;
      for (x = x0; x < 16; x += w) {
        w = 3.8 + r() * 2.4;
        var rr = row[1] - 0.9, sh = (r() - 0.5) * 0.12;
        var col = mix(th.s2, r() < 0.5 ? th.s1 : th.s3, 0.18 + r() * 0.25 + sh);
        var px = x + 0.45, py = row[0] + 0.45, pw = w - 0.9, ph = rr;
        g.fillStyle = col; rr = 0.9;
        g.beginPath(); g.moveTo(px + rr, py); g.lineTo(px + pw - rr, py); g.quadraticCurveTo(px + pw, py, px + pw, py + rr); g.lineTo(px + pw, py + ph - rr); g.quadraticCurveTo(px + pw, py + ph, px + pw - rr, py + ph); g.lineTo(px + rr, py + ph); g.quadraticCurveTo(px, py + ph, px, py + ph - rr); g.lineTo(px, py + rr); g.quadraticCurveTo(px, py, px + rr, py); g.fill();
        g.fillStyle = rgbaOf('#ffffff', 0.18); g.fillRect(px + 0.6, py + 0.2, pw - 1.2, 0.4);
        g.fillStyle = rgbaOf('#000000', 0.16); g.fillRect(px + 0.4, py + ph - 0.6, pw - 0.8, 0.5);
        if (r() < 0.4) dot(g, px + r() * pw, py + r() * ph, 0.3, rgbaOf('#000', 0.18));
      }
    });
  };
  /* water: periodic along x and y, so four frames loop seamlessly */
  function water(g, th, hh, fr, deep) {
    if (art.atlasPaint && art.atlasPaint(deep ? 'deep' : 'water', g, hh, fr)) return;
    var c1 = deep ? th.w3 : th.w1, c2 = deep ? th.w1 : th.w2, c0 = deep ? mix(th.w3, '#000', 0.25) : th.w3;
    var gr = g.createLinearGradient(0, 0, 0, 16); gr.addColorStop(0, c1); gr.addColorStop(1, mix(c1, c0, 0.4));
    g.fillStyle = gr; g.fillRect(0, 0, 16, 16);
    var r = rnd(hh * 3 + 41), n, ph = fr * 4;
    for (n = 0; n < 5; n++) softBlob(g, r() * 16, r() * 16, 4 + r() * 3, c0, 0.3);
    for (n = 0; n < 4; n++) softBlob(g, r() * 16, r() * 16, 4 + r() * 3, c2, 0.16);
    for (var j = 0; j < 4; j++) {
      var by = j * 4 + 1.5 + r() * 1.2, amp = 0.5 + r() * 0.3, pshift = r() * 16;
      for (var seg = 0; seg < 2; seg++) {
        g.strokeStyle = rgbaOf(seg ? '#ffffff' : c2, seg ? 0.5 : 0.7); g.lineWidth = seg ? 0.28 : 0.5; g.lineCap = 'round';
        g.beginPath(); var open = false;
        for (var x = -2; x <= 18; x += 0.5) {
          var k = Math.sin(((x + ph + pshift) / 16) * 6.2832 * 2);
          var yy = by + Math.sin(((x + ph * 0.5) / 16) * 6.2832) * amp - (seg ? 0.45 : 0);
          if (k > 0.35) { if (!open) { g.moveTo(x, yy); open = true; } else g.lineTo(x, yy); }
          else open = false;
        }
        g.stroke();
      }
    }
    for (n = 0; n < 3; n++) {
      var sx = (r() * 16 + ph * 1.5) % 16, sy = r() * 16, tw = 0.5 + 0.5 * Math.sin((fr + n) * 1.9);
      dot(g, sx, sy, 0.3 + 0.2 * tw, rgbaOf('#ffffff', 0.5 + 0.4 * tw));
    }
  }
  HDP.WATER = function (g, th, hh, fr) { water(g, th, hh, fr, false); };
  HDP.DEEP = function (g, th, hh, fr) { water(g, th, hh, fr, true); };



  /* ---------- interior / dungeon floors ---------- */
  HDP.FLOOR = function (g, th, hh) {
    var r = rnd(hh * 29 + 3), row, x, n;
    g.fillStyle = th.f2; g.fillRect(0, 0, 16, 16);
    for (row = 0; row < 4; row++) {
      var y0 = row * 4, off = r() * 6, x0 = -off;
      for (x = x0; x < 16; x += 8) {
        var w = 8, c = mix(th.f1, r() < 0.5 ? '#ffffff' : '#000000', 0.04 + r() * 0.08);
        g.fillStyle = c; g.fillRect(x + 0.12, y0 + 0.14, w - 0.24, 3.45);
        g.fillStyle = rgbaOf('#ffffff', 0.2); g.fillRect(x + 0.12, y0 + 0.14, w - 0.24, 0.35);
        g.fillStyle = rgbaOf('#000000', 0.14); g.fillRect(x + 0.12, y0 + 3.2, w - 0.24, 0.4);
        for (n = 0; n < 3; n++) {
          var gy = y0 + 0.8 + r() * 2.4, gx = x + r() * 4;
          g.strokeStyle = rgbaOf(th.f2, 0.45); g.lineWidth = 0.14; g.beginPath(); g.moveTo(gx, gy); g.quadraticCurveTo(gx + 2, gy + (r() - 0.5) * 0.6, gx + 3.5 + r() * 2, gy + (r() - 0.5) * 0.4); g.stroke();
        }
        if (r() < 0.2) { dot(g, x + 1 + r() * 6, y0 + 1.6, 0.35, rgbaOf(th.f2, 0.7)); }
        dot(g, x + 0.7, y0 + 1.8, 0.16, rgbaOf('#000', 0.35)); dot(g, x + w - 0.7, y0 + 1.8, 0.16, rgbaOf('#000', 0.35));
      }
    }
  };
  function flags(g, th, hh, n0, base, crack) {
    if (art.atlasPaint && art.atlasPaint('cobble', g, hh, 0)) return;
    var r = rnd(hh * 37 + 9), x, y, n;
    g.fillStyle = mix(base, '#000000', 0.4); g.fillRect(0, 0, 16, 16);
    var sz = 16 / n0;
    for (y = 0; y < n0; y++) for (x = 0; x < n0; x++) {
      var c = mix(base, r() < 0.5 ? '#ffffff' : '#000000', 0.03 + r() * 0.1);
      g.fillStyle = c; g.beginPath();
      var px = x * sz + 0.18, py = y * sz + 0.18, w = sz - 0.36, rr = 0.4;
      g.moveTo(px + rr, py); g.lineTo(px + w - rr, py); g.quadraticCurveTo(px + w, py, px + w, py + rr); g.lineTo(px + w, py + w - rr); g.quadraticCurveTo(px + w, py + w, px + w - rr, py + w); g.lineTo(px + rr, py + w); g.quadraticCurveTo(px, py + w, px, py + w - rr); g.lineTo(px, py + rr); g.quadraticCurveTo(px, py, px + rr, py); g.fill();
      g.fillStyle = rgbaOf('#ffffff', 0.17); g.fillRect(px + 0.4, py + 0.1, w - 0.8, 0.35);
      g.fillStyle = rgbaOf('#000000', 0.13); g.fillRect(px + 0.4, py + w - 0.5, w - 0.8, 0.4);
      for (n = 0; n < 4; n++) dot(g, px + r() * w, py + r() * w, 0.14, rgbaOf('#000', 0.18));
    }
    if (crack && hh % 3 === 0) {
      var cx = 2 + r() * 11, cy = 2 + r() * 11;
      g.strokeStyle = rgbaOf('#0d0b1a', 0.7); g.lineWidth = 0.22; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 1.4, cy + 1); g.lineTo(cx + 1.1, cy + 2.4); g.lineTo(cx + 2.4, cy + 3.2); g.moveTo(cx + 1.4, cy + 1); g.lineTo(cx + 2.8, cy + 0.6); g.stroke();
    }
  }
  HDP.FLOORS = function (g, th, hh) { flags(g, th, hh, 2, th.f1, false); };
  HDP.SFLOOR = function (g, th, hh) { flags(g, th, hh, 2, th.f1, true); };
  HDP.FPATH = function (g, th, hh) {
    if (art.atlasPaint && art.atlasPaint('dirt', g, hh, 0)) return;
    var r = rnd(hh * 41 + 1), n; g.fillStyle = th.p2; g.fillRect(0, 0, 16, 16);
    for (n = 0; n < 10; n++) softBlob(g, r() * 16, r() * 16, 2 + r() * 3, th.p1, 0.22);
    for (n = 0; n < 12; n++) { var x = r() * 16, y = r() * 16, s = 0.3 + r() * 0.6; wrap(x, y, 2, function (px, py) { g.fillStyle = rgbaOf('#000', 0.18); g.beginPath(); g.ellipse(px + 0.1, py + 0.2, s, s * 0.6, 0, 0, 6.2832); g.fill(); g.fillStyle = mix(th.p1, th.p2, 0.3); g.beginPath(); g.ellipse(px, py, s, s * 0.6, 0, 0, 6.2832); g.fill(); }); }
    for (n = 0; n < 4; n++) blade(g, r() * 16, r() * 16, 1.2, 0.3, th.g2, 0.3);
  };
  HDP.CFLOOR = function (g, th, hh) {
    if (art.atlasPaint && art.atlasPaint('dirt', g, hh, 0)) return;
    var r = rnd(hh * 43 + 5), n; g.fillStyle = th.f1; g.fillRect(0, 0, 16, 16);
    for (n = 0; n < 9; n++) softBlob(g, r() * 16, r() * 16, 2.5 + r() * 3, th.f2, 0.3);
    for (n = 0; n < 6; n++) softBlob(g, r() * 16, r() * 16, 2 + r() * 3, '#ffffff', 0.07);
    for (n = 0; n < 12; n++) { var x = r() * 16, y = r() * 16, s = 0.3 + r() * 0.8; wrap(x, y, 2, function (px, py) { g.fillStyle = rgbaOf('#000', 0.28); g.beginPath(); g.ellipse(px + 0.2, py + 0.3, s, s * 0.65, 0, 0, 6.2832); g.fill(); g.fillStyle = mix(th.f1, th.s1, 0.5); g.beginPath(); g.ellipse(px, py, s, s * 0.65, 0, 0, 6.2832); g.fill(); g.fillStyle = rgbaOf('#fff', 0.3); g.beginPath(); g.ellipse(px - s * 0.2, py - s * 0.2, s * 0.4, s * 0.2, 0, 0, 6.2832); g.fill(); }); }
    if (hh % 3 === 0) { g.strokeStyle = rgbaOf('#0d0b1a', 0.5); g.lineWidth = 0.2; g.beginPath(); g.moveTo(3, 12); g.lineTo(5, 10.8); g.lineTo(6.5, 11.5); g.stroke(); }
  };
  HDP.FFLOOR = function (g, th, hh) {
    if (art.atlasPaint && art.atlasPaint('grass', g, hh, 0)) return;
    var r = rnd(hh * 47 + 2), n; g.fillStyle = th.g2; g.fillRect(0, 0, 16, 16);
    for (n = 0; n < 10; n++) softBlob(g, r() * 16, r() * 16, 2 + r() * 3.5, r() < 0.5 ? th.t1 : th.g1, 0.28);
    for (n = 0; n < 16; n++) blade(g, r() * 16, r() * 16, 1 + r() * 1.3, (r() - 0.5) * 1.3, r() < 0.5 ? th.g1 : th.t2, 0.32);
    for (n = 0; n < 5; n++) { var x = r() * 16, y = r() * 16, a = r() * 3; wrap(x, y, 2, function (px, py) { g.fillStyle = rgbaOf(th.p2, 0.8); g.beginPath(); g.ellipse(px, py, 0.8, 0.35, a, 0, 6.2832); g.fill(); }); }
  };
  HDP.MOSS = function (g, th, hh) {
    var r = rnd(hh * 53 + 7), n; g.fillStyle = th.f1; g.fillRect(0, 0, 16, 16);
    for (n = 0; n < 12; n++) softBlob(g, r() * 16, r() * 16, 2 + r() * 3, r() < 0.5 ? '#4aa24e' : '#2f7d3c', 0.45);
    for (n = 0; n < 40; n++) dot(g, r() * 16, r() * 16, 0.2, r() < 0.5 ? rgbaOf('#7ad66e', 0.8) : rgbaOf('#1f5c30', 0.8));
  };
  HDP.ASH = function (g, th, hh) {
    if (art.atlasPaint && art.atlasPaint('grass', g, hh, 0)) return;
    var r = rnd(hh * 59 + 2), n; g.fillStyle = th.g1; g.fillRect(0, 0, 16, 16);
    for (n = 0; n < 9; n++) softBlob(g, r() * 16, r() * 16, 2 + r() * 3.5, r() < 0.5 ? th.g2 : th.g3, 0.25);
    for (n = 0; n < 30; n++) dot(g, r() * 16, r() * 16, 0.17, r() < 0.5 ? rgbaOf(th.g3, 0.9) : rgbaOf(th.g2, 0.9));
    for (n = 0; n < 4; n++) blade(g, r() * 16, r() * 16, 1.1, 0.4, th.g2, 0.28);
    if (hh % 5 === 0) dot(g, 6, 6, 0.3, rgbaOf(th.ac, 0.9));
  };


  /* ---------- nature and town props ---------- */
  function rrPath(g, x, y, w, h2, r) {
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h2 - r); g.quadraticCurveTo(x + w, y + h2, x + w - r, y + h2);
    g.lineTo(x + r, y + h2); g.quadraticCurveTo(x, y + h2, x, y + h2 - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  function ball(g, x, y, r, c, lightc, darkc) {
    var gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05);
    gr.addColorStop(0, lightc || li(c, 0.3)); gr.addColorStop(0.55, c); gr.addColorStop(1, darkc || sh(c, 0.3));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
  }
  function li(c, t) { return mix(c, '#ffffff', t); }
  function sh(c, t) { return mix(c, '#10081e', t); }
  function groundShadow(g, x, y, rx, ry, a) { g.fillStyle = rgbaOf('#10081e', a || 0.28); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.2832); g.fill(); }
  function trunk(g, x0, y0, w0, w1, y1, c) {
    var gr = g.createLinearGradient(x0 - w0, 0, x0 + w0, 0); gr.addColorStop(0, li(c, 0.2)); gr.addColorStop(0.5, c); gr.addColorStop(1, sh(c, 0.35));
    g.fillStyle = gr; g.beginPath(); g.moveTo(x0 - w1, y1); g.quadraticCurveTo(x0 - w0 * 0.5, y1 - 1, x0 - w0, y0); g.lineTo(x0 + w0, y0); g.quadraticCurveTo(x0 + w0 * 0.5, y1 - 1, x0 + w1, y1); g.closePath(); g.fill();
    g.strokeStyle = rgbaOf('#10081e', 0.4); g.lineWidth = 0.18;
    for (var i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x0 - w0 * 0.4 + i * w0 * 0.4, y0 + 0.5); g.lineTo(x0 - w1 * 0.4 + i * w1 * 0.4, y1 - 0.4); g.stroke(); }
  }
  HDP.TREE = function (g, th, hh) {
    grass(g, th, hh);
    var r = rnd(hh * 7 + 90), n;
    groundShadow(g, 9, 14.4, 5.4, 1.7, 0.3);
    if (art.atlasCanopy && art.atlasCanopy(g, hh, 0)) return;
    trunk(g, 8, 9.6, 1.1, 1.8, 14.8, th.tr);
    [[5.4, 6.3, 3.8, 0], [10.8, 6.4, 3.7, 0], [8, 5.6, 5.4, 0], [8, 7.4, 4.2, 0]].forEach(function (b2) { ball(g, b2[0], b2[1], b2[2], th.t3, th.t1, sh(th.t3, 0.4)); });
    [[5.6, 5.4, 3.3], [10.6, 5.6, 3.1], [8, 4.4, 4.7]].forEach(function (b2) { ball(g, b2[0], b2[1], b2[2], th.t1, th.t2, th.t3); });
    [[6.4, 3.7, 2.9], [10, 4.1, 2.4], [8.3, 2.7, 2.1]].forEach(function (b2) { ball(g, b2[0], b2[1], b2[2], th.t2, li(th.t2, 0.25), th.t1); });
    for (n = 0; n < 26; n++) {
      var a = r() * 6.28, d = r() * 4.8, x = 8 + Math.cos(a) * d, y = 5.2 + Math.sin(a) * d * 0.8, up = (y < 5.4) || r() < 0.3;
      g.fillStyle = rgbaOf(up ? th.g3 : th.t3, up ? 0.7 : 0.6); g.beginPath(); g.ellipse(x, y, 0.5 + r() * 0.4, 0.25 + r() * 0.2, r() * 3, 0, 6.2832); g.fill();
    }
    g.fillStyle = rgbaOf('#ffffff', 0.5); g.beginPath(); g.ellipse(6.2, 2.6, 0.9, 0.4, -0.5, 0, 6.2832); g.fill();
  };
  HDP.BUSH = function (g, th, hh) {
    grass(g, th, hh);
    var r = rnd(hh * 11 + 5), n;
    groundShadow(g, 8.6, 13.4, 6, 1.7, 0.3);
    [[5.2, 10, 3.2], [10.8, 10, 3.2], [8, 8.8, 4]].forEach(function (b2) { ball(g, b2[0], b2[1], b2[2], th.t3, th.t1, sh(th.t3, 0.4)); });
    [[5.6, 9.4, 2.6], [10.6, 9.4, 2.6], [8, 8, 3.3]].forEach(function (b2) { ball(g, b2[0], b2[1], b2[2], th.t1, th.t2, th.t3); });
    for (n = 0; n < 14; n++) { var a = r() * 6.28, d = r() * 4.2, x = 8 + Math.cos(a) * d * 1.3, y = 9 + Math.sin(a) * d * 0.6; g.fillStyle = rgbaOf(r() < 0.5 ? th.g3 : th.t3, 0.7); g.beginPath(); g.ellipse(x, y, 0.5, 0.25, r() * 3, 0, 6.2832); g.fill(); }
    var bc = ['#ff8ab0', '#ffd05a', '#c9a0ff'][hh % 3];
    for (n = 0; n < 5; n++) { var x2 = 4.4 + r() * 7, y2 = 7 + r() * 4; ball(g, x2, y2, 0.5, bc, li(bc, 0.5), sh(bc, 0.2)); }
  };
  HDP.PINE = function (g, th, hh) {
    grass(g, th, hh);
    groundShadow(g, 9, 14.6, 5, 1.6, 0.3);
    if (art.atlasCanopy && art.atlasCanopy(g, hh, 1)) return;
    trunk(g, 8, 12, 0.9, 1.3, 14.9, th.tr);
    var tiers = [[8, 6.6, 6.8, 11.6, 0], [8, 3.6, 5.6, 8.4, 1], [8, 0.4, 4.2, 5.2, 2]];
    tiers.forEach(function (t, i) {
      var cx = t[0], top = t[1], hw = t[2], bot = t[3], k = i, x, n = 7;
      var pts = [[cx, top - 1.6 + (i === 0 ? 3.4 : 0) - (i === 0 ? 3.4 : 0)]];
      var gr = g.createLinearGradient(cx - hw, 0, cx + hw, 0); gr.addColorStop(0, th.t2); gr.addColorStop(0.45, th.t1); gr.addColorStop(1, th.t3);
      g.fillStyle = gr; g.beginPath(); g.moveTo(cx, top - 1.2);
      for (x = 0; x <= n; x++) { var fx = cx + hw * (x / n), yy = bot + (x % 2 ? -0.9 : 0.3) * (1 - Math.abs(x / n - 0.0) * 0.0); g.lineTo(fx, bot + (x % 2 ? -0.8 : 0.4)); }
      for (x = n; x >= 0; x--) { var fx2 = cx - hw * (x / n); g.lineTo(fx2, bot + (x % 2 ? -0.8 : 0.4)); }
      g.closePath(); g.fill();
      g.strokeStyle = rgbaOf(th.t3, 0.7); g.lineWidth = 0.25; g.beginPath(); g.moveTo(cx - hw * 0.8, bot - 0.4); for (x = 1; x <= 6; x++) g.lineTo(cx - hw * 0.8 + hw * 1.6 * x / 6, bot + (x % 2 ? 0.2 : -0.5)); g.stroke();
      g.strokeStyle = rgbaOf(th.g3, 0.5); g.lineWidth = 0.28; g.beginPath(); g.moveTo(cx - 0.3, top - 0.6); g.lineTo(cx - hw * 0.62, bot - 1.2); g.stroke();
    });
    g.fillStyle = rgbaOf('#ffffff', 0.55); g.beginPath(); g.arc(8, -0.1, 0.5, 0, 6.2832); g.fill();
  };
  HDP.ROCK = function (g, th, hh) {
    grass(g, th, hh);
    groundShadow(g, 9, 13.4, 6, 1.8, 0.3);
    var c = th.s2, pts = [[3.2, 12.8], [2.6, 9.6], [4.4, 6.4], [7.4, 5.2], [10.6, 5.8], [13, 8.4], [13.4, 12.4], [9, 13.6]];
    g.fillStyle = sh(th.s3, 0.2); g.beginPath(); pts.forEach(function (p, i) { i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); g.fill();
    g.fillStyle = c; g.beginPath(); g.moveTo(3.4, 12.2); g.lineTo(2.9, 9.6); g.lineTo(4.6, 6.7); g.lineTo(7.4, 5.5); g.lineTo(10.4, 6); g.lineTo(9, 9.4); g.lineTo(7, 12.4); g.closePath(); g.fill();
    g.fillStyle = li(th.s1, 0.2); g.beginPath(); g.moveTo(4.6, 6.7); g.lineTo(7.4, 5.5); g.lineTo(10.4, 6); g.lineTo(8.6, 7.6); g.lineTo(5.4, 8); g.closePath(); g.fill();
    g.strokeStyle = rgbaOf('#10081e', 0.45); g.lineWidth = 0.25; g.beginPath(); g.moveTo(9, 9.4); g.lineTo(7, 12.4); g.moveTo(9, 9.4); g.lineTo(13, 8.4); g.stroke();
    g.fillStyle = rgbaOf('#5aa24e', 0.8); g.beginPath(); g.ellipse(5, 11.8, 1.6, 0.5, 0.2, 0, 6.2832); g.fill();
  };
  HDP.FENCE = function (g, th, hh) {
    grass(g, th, hh);
    groundShadow(g, 9, 14.4, 7.4, 1.2, 0.25);
    var w = th.tr, wl = '#a87a52';
    [[7, 8.2], [11.4, 12.6]].forEach(function (rl) {
      var gr = g.createLinearGradient(0, rl[0], 0, rl[0] + 1.8); gr.addColorStop(0, li(w, 0.25)); gr.addColorStop(1, sh(w, 0.2));
      g.fillStyle = gr; rrPath(g, -0.5, rl[0], 17, 1.8, 0.4); g.fill();
      g.strokeStyle = rgbaOf('#10081e', 0.45); g.lineWidth = 0.2; g.stroke();
    });
    [2.2, 11.4].forEach(function (x) {
      var gr = g.createLinearGradient(x, 0, x + 2.4, 0); gr.addColorStop(0, wl); gr.addColorStop(1, sh(w, 0.2));
      g.fillStyle = gr; g.beginPath(); g.moveTo(x, 15); g.lineTo(x, 4.6); g.lineTo(x + 1.2, 3.6); g.lineTo(x + 2.4, 4.6); g.lineTo(x + 2.4, 15); g.closePath(); g.fill();
      g.strokeStyle = rgbaOf('#10081e', 0.5); g.lineWidth = 0.22; g.stroke();
      g.strokeStyle = rgbaOf('#ffffff', 0.25); g.lineWidth = 0.2; g.beginPath(); g.moveTo(x + 0.4, 5.4); g.lineTo(x + 0.4, 14); g.stroke();
    });
  };
  HDP.SIGN = function (g, th, hh) {
    grass(g, th, hh);
    groundShadow(g, 9, 14.6, 4, 1.2, 0.28);
    trunk(g, 8, 8.5, 0.8, 0.9, 14.8, th.tr);
    var gr = g.createLinearGradient(0, 3, 0, 10); gr.addColorStop(0, '#e6c488'); gr.addColorStop(1, '#c49a58');
    g.fillStyle = gr; rrPath(g, 2.2, 3.2, 11.6, 6.6, 0.8); g.fill(); g.strokeStyle = th.tr; g.lineWidth = 0.55; g.stroke();
    g.strokeStyle = rgbaOf('#10081e', 0.5); g.lineWidth = 0.3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(4, 5.4); g.lineTo(11.6, 5.4); g.moveTo(4, 7.4); g.lineTo(9.4, 7.4); g.stroke();
    g.fillStyle = rgbaOf('#ffffff', 0.35); g.fillRect(2.8, 3.7, 10.4, 0.4);
  };
  HDP.WELL = function (g, th, hh) {
    grass(g, th, hh);
    groundShadow(g, 9, 13.6, 6.8, 2, 0.28);
    var gr = g.createLinearGradient(0, 8, 0, 14); gr.addColorStop(0, th.s1); gr.addColorStop(1, sh(th.s2, 0.3));
    g.fillStyle = gr; g.beginPath(); g.ellipse(8, 11, 6.4, 3.8, 0, 0, 6.2832); g.fill();
    g.fillStyle = sh(th.s2, 0.25); g.beginPath(); g.ellipse(8, 10.4, 5.2, 2.7, 0, 0, 6.2832); g.fill();
    var wg = g.createLinearGradient(0, 8, 0, 12); wg.addColorStop(0, th.w3); wg.addColorStop(1, th.w1);
    g.fillStyle = wg; g.beginPath(); g.ellipse(8, 10.6, 4.6, 2.2, 0, 0, 6.2832); g.fill();
    g.strokeStyle = rgbaOf('#ffffff', 0.6); g.lineWidth = 0.25; g.beginPath(); g.ellipse(7.4, 10.4, 1.6, 0.6, 0, 3.3, 5.8); g.stroke();
    g.strokeStyle = rgbaOf('#10081e', 0.4); g.lineWidth = 0.2; for (var i = 0; i < 6; i++) { g.beginPath(); g.moveTo(2.2 + i * 2.3, 9.8 + (i % 2) * 0.3); g.lineTo(2.6 + i * 2.3, 13.6); g.stroke(); }
    [3.2, 11.6].forEach(function (x) { trunk(g, x + 0.6, 2.8, 0.7, 0.8, 11.2, th.tr); });
    var rg = g.createLinearGradient(0, 1, 0, 3.6); rg.addColorStop(0, li(th.roofs[0], 0.2)); rg.addColorStop(1, th.roofD[0]);
    g.fillStyle = rg; g.beginPath(); g.moveTo(1.4, 3.6); g.lineTo(8, 0.4); g.lineTo(14.6, 3.6); g.closePath(); g.fill(); g.strokeStyle = th.roofD[0]; g.lineWidth = 0.3; g.stroke();
    g.strokeStyle = '#6a4a28'; g.lineWidth = 0.25; g.beginPath(); g.moveTo(8, 3.6); g.lineTo(8, 8.4); g.stroke();
  };
  HDP.LAMP = function (g, th, hh) {
    grass(g, th, hh);
    groundShadow(g, 9, 14.6, 4, 1.2, 0.28);
    g.fillStyle = '#3a3a48'; rrPath(g, 7.2, 6, 1.6, 8.8, 0.6); g.fill(); rrPath(g, 5.4, 14, 5.2, 1.6, 0.6); g.fill();
    softBlob(g, 8, 3.6, 7, '#ffe9a0', 0.5);
    g.fillStyle = '#2a2a38'; rrPath(g, 5.2, 1.2, 5.6, 6, 1); g.fill();
    var lg = g.createLinearGradient(0, 2, 0, 6.6); lg.addColorStop(0, '#fff8d0'); lg.addColorStop(1, '#ffc860');
    g.fillStyle = lg; rrPath(g, 6, 2, 4, 4.5, 0.8); g.fill();
    g.fillStyle = '#4a4a5a'; g.beginPath(); g.moveTo(4.8, 1.6); g.lineTo(8, 0); g.lineTo(11.2, 1.6); g.closePath(); g.fill();
    g.fillStyle = rgbaOf('#ffffff', 0.9); g.beginPath(); g.ellipse(7.3, 3, 0.5, 0.9, 0, 0, 6.2832); g.fill();
  };
  HDP.BARREL = function (g, th, hh) {
    g.fillStyle = th.p1; g.fillRect(0, 0, 16, 16); HDP.PATH(g, th, hh);
    groundShadow(g, 8.6, 14.2, 5.4, 1.5, 0.3);
    var gr = g.createLinearGradient(2, 0, 14, 0); gr.addColorStop(0, li(th.tr, 0.25)); gr.addColorStop(0.5, th.f2); gr.addColorStop(1, sh(th.tr, 0.3));
    g.fillStyle = gr; g.beginPath(); g.moveTo(3.4, 2.4); g.quadraticCurveTo(1.6, 8.4, 3.4, 14.2); g.lineTo(12.6, 14.2); g.quadraticCurveTo(14.4, 8.4, 12.6, 2.4); g.closePath(); g.fill();
    g.strokeStyle = rgbaOf('#10081e', 0.4); g.lineWidth = 0.2; for (var i = 0; i < 5; i++) { g.beginPath(); g.moveTo(4.6 + i * 1.7, 2.6); g.lineTo(4.2 + i * 1.9, 14); g.stroke(); }
    ['#4a4a58', '#4a4a58'].forEach(function (c, i) { var y = 4.4 + i * 6.4; g.fillStyle = c; g.fillRect(2.2 - i * 0.1, y, 11.6 + i * 0.2, 0.9); g.fillStyle = rgbaOf('#ffffff', 0.3); g.fillRect(2.2, y, 11.6, 0.25); });
    g.fillStyle = th.f1; g.beginPath(); g.ellipse(8, 2.6, 4.7, 1.3, 0, 0, 6.2832); g.fill(); g.strokeStyle = rgbaOf('#10081e', 0.5); g.lineWidth = 0.25; g.stroke();
  };
  HDP.CRATE = function (g, th, hh) {
    HDP.PATH(g, th, hh);
    groundShadow(g, 8.8, 14.6, 6.4, 1.5, 0.3);
    var gr = g.createLinearGradient(0, 3, 0, 15); gr.addColorStop(0, li(th.f2, 0.2)); gr.addColorStop(1, sh(th.f2, 0.2));
    g.fillStyle = gr; rrPath(g, 2, 3, 12, 11.6, 0.5); g.fill(); g.strokeStyle = th.tr; g.lineWidth = 0.55; g.stroke();
    g.strokeStyle = th.tr; g.lineWidth = 0.7; g.beginPath(); g.moveTo(2.6, 3.6); g.lineTo(13.4, 14); g.moveTo(13.4, 3.6); g.lineTo(2.6, 14); g.stroke();
    g.strokeStyle = rgbaOf('#10081e', 0.4); g.lineWidth = 0.18; for (var i = 0; i < 4; i++) { g.beginPath(); g.moveTo(3, 5.4 + i * 2.8); g.lineTo(13, 5.4 + i * 2.8); g.stroke(); }
    g.fillStyle = rgbaOf('#ffffff', 0.3); g.fillRect(2.4, 3.4, 11.2, 0.4);
  };

  /* roofs: overlapping rounded shingles with a soft eave shadow */
  [0, 1, 2, 3].forEach(function (ci) {
    function shingles(g, th, hh, y0, rowsFrom) {
      if (art.atlasPaint && art.atlasPaint('roof' + ci, g, hh, 0)) return;
      var c = th.roofs[ci], d = th.roofD[ci], r = rnd(ci * 31 + hh + 3), row, x;
      g.fillStyle = d; g.fillRect(0, 0, 16, 16);
      for (row = rowsFrom; row < 4; row++) {
        var yy = row * 4, off = (row % 2) * 2;
        for (x = -2 + off; x < 16; x += 4) {
          var cc = mix(c, r() < 0.5 ? '#ffffff' : '#000000', 0.04 + r() * 0.1);
          var gr = g.createLinearGradient(0, yy - 1, 0, yy + 4); gr.addColorStop(0, li(cc, 0.18)); gr.addColorStop(0.7, cc); gr.addColorStop(1, sh(cc, 0.22));
          g.fillStyle = gr; g.beginPath(); g.moveTo(x + 0.1, yy - 0.6); g.lineTo(x + 3.9, yy - 0.6); g.lineTo(x + 3.9, yy + 2.3); g.quadraticCurveTo(x + 3.9, yy + 4, x + 2, yy + 4); g.quadraticCurveTo(x + 0.1, yy + 4, x + 0.1, yy + 2.3); g.closePath(); g.fill();
          g.strokeStyle = rgbaOf(d, 0.9); g.lineWidth = 0.28; g.stroke();
          g.strokeStyle = rgbaOf('#ffffff', 0.22); g.lineWidth = 0.2; g.beginPath(); g.moveTo(x + 0.6, yy + 0.2); g.lineTo(x + 3.4, yy + 0.2); g.stroke();
        }
      }
    }
    HDP['ROOF' + ci] = function (g, th, hh) { shingles(g, th, hh, 0, 0); var sg = g.createLinearGradient(0, 0, 0, 16); sg.addColorStop(0, 'rgba(255,255,255,0.1)'); sg.addColorStop(1, 'rgba(10,6,30,0.12)'); g.fillStyle = sg; g.fillRect(0, 0, 16, 16); };
    HDP['ROOFT' + ci] = function (g, th, hh) {
      var c = th.roofs[ci], d = th.roofD[ci];
      shingles(g, th, hh, 0, 1);
      var gr = g.createLinearGradient(0, 0, 0, 4); gr.addColorStop(0, li(d, 0.18)); gr.addColorStop(1, sh(d, 0.3));
      g.fillStyle = gr; g.fillRect(0, 0, 16, 4);
      g.fillStyle = rgbaOf('#ffffff', 0.3); g.fillRect(0, 0.2, 16, 0.5);
      g.fillStyle = li(c, 0.1); rrPath(g, 0, 0.4, 16, 2.2, 1); g.fill(); g.strokeStyle = sh(d, 0.3); g.lineWidth = 0.3; g.stroke();
      g.fillStyle = rgbaOf('#10081e', 0.35); g.fillRect(0, 3.6, 16, 0.9);
    };
  });
  /* timber-framed walls */
  function plaster(g, th, hh) {
    var r = rnd(hh * 5 + 66), n;
    var gr = g.createLinearGradient(0, 0, 0, 16); gr.addColorStop(0, li(th.wl1, 0.05)); gr.addColorStop(1, th.wl2);
    g.fillStyle = gr; g.fillRect(0, 0, 16, 16);
    for (n = 0; n < 6; n++) softBlob(g, r() * 16, r() * 16, 3 + r() * 3, th.wl2, 0.25);
    for (n = 0; n < 18; n++) dot(g, r() * 16, r() * 16, 0.17, rgbaOf(th.wl2, 0.9));
    var sg = g.createLinearGradient(0, 0, 0, 3); sg.addColorStop(0, 'rgba(10,6,30,0.28)'); sg.addColorStop(1, 'rgba(10,6,30,0)'); g.fillStyle = sg; g.fillRect(0, 0, 16, 3);
    g.fillStyle = sh(th.wl2, 0.28); g.fillRect(0, 12.4, 16, 3.6);
    g.strokeStyle = rgbaOf('#10081e', 0.22); g.lineWidth = 0.2;
    for (n = 0; n < 4; n++) { g.beginPath(); g.moveTo(0, 12.6 + 0 * n); } 
    for (var j = 0; j < 3; j++) { g.beginPath(); g.moveTo(0, 13.4 + j * 1.2); g.lineTo(16, 13.4 + j * 1.2); g.stroke(); }
    for (var k = 0; k < 5; k++) { g.beginPath(); g.moveTo(1 + k * 3.4 + (k % 2), 12.4); g.lineTo(1 + k * 3.4 + (k % 2), 13.4); g.stroke(); }
  }
  function beam(g, x, y, w, h2, c) {
    var horiz = w > h2, gr = horiz ? g.createLinearGradient(0, y, 0, y + h2) : g.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, li(c, 0.25)); gr.addColorStop(0.5, c); gr.addColorStop(1, sh(c, 0.3));
    g.fillStyle = gr; g.fillRect(x, y, w, h2);
    g.strokeStyle = rgbaOf('#10081e', 0.35); g.lineWidth = 0.15;
    for (var i = 0; i < 3; i++) { g.beginPath(); if (horiz) { g.moveTo(x, y + h2 * (0.25 + i * 0.25)); g.lineTo(x + w, y + h2 * (0.25 + i * 0.25)); } else { g.moveTo(x + w * (0.25 + i * 0.25), y); g.lineTo(x + w * (0.25 + i * 0.25), y + h2); } g.stroke(); }
  }
  HDP.WALLP = function (g, th, hh) { plaster(g, th, hh); beam(g, 0, 0, 1.8, 16, th.wd); beam(g, 14.2, 0, 1.8, 16, th.wd); beam(g, 0, 0, 16, 0.9, sh(th.wd, 0.1)); };
  HDP.WALLB = function (g, th, hh) {
    plaster(g, th, hh); beam(g, 0, 0, 1.8, 16, th.wd); beam(g, 14.2, 0, 1.8, 16, th.wd); beam(g, 0, 0, 16, 0.9, sh(th.wd, 0.1));
    g.fillStyle = sh(th.wd, 0.3); rrPath(g, 3.6, 3.6, 8.8, 7.8, 0.5); g.fill();
    var gg = g.createLinearGradient(0, 4.4, 0, 10.6); gg.addColorStop(0, '#cfeaff'); gg.addColorStop(0.5, '#7ec0e8'); gg.addColorStop(1, '#4a8ac0');
    g.fillStyle = gg; g.fillRect(4.3, 4.3, 7.4, 6.4);
    g.fillStyle = rgbaOf('#ffffff', 0.45); g.beginPath(); g.moveTo(4.6, 10.4); g.lineTo(8.2, 4.4); g.lineTo(9.6, 4.4); g.lineTo(6, 10.4); g.closePath(); g.fill();
    g.fillStyle = th.wd; g.fillRect(7.6, 4.3, 0.8, 6.4); g.fillRect(4.3, 7.2, 7.4, 0.7);
    g.fillStyle = '#7a5230'; g.fillRect(3, 11.2, 10, 1.1); g.fillStyle = rgbaOf('#ffffff', 0.3); g.fillRect(3, 11.2, 10, 0.25);
    var fc = ['#ff8ab0', '#ffd05a', '#c9a0ff', '#f4f0ff'];
    for (var i = 0; i < 5; i++) { g.fillStyle = '#3f8a44'; g.beginPath(); g.ellipse(4.2 + i * 1.9, 11, 0.55, 0.45, 0, 0, 6.2832); g.fill(); ball(g, 4.2 + i * 1.9, 10.5, 0.5, fc[(i + hh) % 4], '#ffffff', sh(fc[(i + hh) % 4], 0.2)); }
  };
  HDP.DOOR = function (g, th, hh) {
    plaster(g, th, hh); beam(g, 0, 0, 1.8, 16, th.wd); beam(g, 14.2, 0, 1.8, 16, th.wd);
    g.fillStyle = sh(th.wd, 0.4); g.beginPath(); g.moveTo(2.6, 16); g.lineTo(2.6, 4.2); g.quadraticCurveTo(2.6, 1.6, 8, 1.6); g.quadraticCurveTo(13.4, 1.6, 13.4, 4.2); g.lineTo(13.4, 16); g.closePath(); g.fill();
    var gr = g.createLinearGradient(3.2, 0, 12.8, 0); gr.addColorStop(0, '#a87a52'); gr.addColorStop(0.5, '#8a5a38'); gr.addColorStop(1, '#6e4628');
    g.fillStyle = gr; g.beginPath(); g.moveTo(3.2, 16); g.lineTo(3.2, 4.4); g.quadraticCurveTo(3.2, 2.2, 8, 2.2); g.quadraticCurveTo(12.8, 2.2, 12.8, 4.4); g.lineTo(12.8, 16); g.closePath(); g.fill();
    g.strokeStyle = rgbaOf('#10081e', 0.5); g.lineWidth = 0.22; for (var i = 1; i < 4; i++) { g.beginPath(); g.moveTo(3.2 + i * 2.4, 2.4); g.lineTo(3.2 + i * 2.4, 16); g.stroke(); }
    g.fillStyle = '#3a3a48'; g.fillRect(3.2, 5.2, 9.6, 0.7); g.fillRect(3.2, 11.6, 9.6, 0.7);
    ball(g, 11, 9.8, 0.55, '#f2c14e', '#fff2b0', '#8a6a1a');
    g.fillStyle = th.s2; g.fillRect(2, 15.2, 12, 0.8); g.fillStyle = rgbaOf('#ffffff', 0.3); g.fillRect(2, 15.2, 12, 0.25);
  };

  /* ---------- shaded part renderer (characters, creatures, props) ----------
     Parts: legacy pixel shapes  r e t l p  (integer art pixels)  and exact shapes
       o  [x,y,rx,ry,col]            ellipse          b  [x,y,w,h,rad,col]      rounded rect
       q  [pts,col,smooth]           polygon          s  [x1,y1,cx,cy,x2,y2,w,col]  curve stroke (detail)
       g  [x,y,r,col,alpha]          glow (detail)    E  [x,y,col,sc]  eye (detail)
     A leading k means detail: drawn last, with no outline and no shading. */
  var DARK = '#1b1626';
  function isHex(c) { return typeof c === 'string' && c.charAt(0) === '#'; }
  function describe(p) {
    var t = p[0], det = t.charAt(0) === 'k', b = det ? t.slice(1) : t, d = { det: det, t: b, p: p };
    if (b === 'r') { d.col = p[5]; d.bb = [p[1], p[2], p[1] + p[3], p[2] + p[4]]; }
    else if (b === 'e') { d.col = p[5]; d.bb = [p[1] - p[3], p[2] - p[4], p[1] + p[3] + 1, p[2] + p[4] + 1]; }
    else if (b === 't') { d.col = p[7]; var xs = [p[1], p[3], p[5]], ys = [p[2], p[4], p[6]]; d.bb = [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs) + 1, Math.max.apply(null, ys) + 1]; }
    else if (b === 'l') { d.col = p[5]; d.bb = [Math.min(p[1], p[3]), Math.min(p[2], p[4]), Math.max(p[1], p[3]) + 1, Math.max(p[2], p[4]) + 1]; }
    else if (b === 'p') { d.col = p[3]; d.bb = [p[1], p[2], p[1] + 1, p[2] + 1]; }
    else if (b === 'o') { d.col = p[5]; d.bb = [p[1] - p[3], p[2] - p[4], p[1] + p[3], p[2] + p[4]]; }
    else if (b === 'b') { d.col = p[6]; d.bb = [p[1], p[2], p[1] + p[3], p[2] + p[4]]; }
    else if (b === 'q') { d.col = p[2]; var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; p[1].forEach(function (q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }); d.bb = [x0, y0, x1, y1]; }
    else if (b === 's') { d.col = p[8]; d.bb = [0, 0, 0, 0]; }
    else if (b === 'g') { d.col = p[4]; d.bb = [p[1] - p[3], p[2] - p[3], p[1] + p[3], p[2] + p[3]]; }
    else if (b === 'E') { d.col = p[3]; d.bb = [p[1] - 1, p[2] - 1, p[1] + 1, p[2] + 1]; }
    return d;
  }
  function pathOf(g, d, dx, dy) {
    var p = d.p, t = d.t;
    if (t === 'r' || t === 'b') {
      var x = p[1] + dx, y = p[2] + dy, w = p[3], h = p[4], rr = t === 'b' ? Math.min(p[5], w / 2, h / 2) : (w < 3 || h < 3 ? 0.15 * Math.min(w, h) : Math.min(0.9, Math.min(w, h) * 0.32));
      g.moveTo(x + rr, y); g.lineTo(x + w - rr, y); g.quadraticCurveTo(x + w, y, x + w, y + rr); g.lineTo(x + w, y + h - rr); g.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
      g.lineTo(x + rr, y + h); g.quadraticCurveTo(x, y + h, x, y + h - rr); g.lineTo(x, y + rr); g.quadraticCurveTo(x, y, x + rr, y); g.closePath();
    } else if (t === 'e') { g.moveTo(p[1] + dx + 0.5 + p[3] + 0.5, p[2] + dy + 0.5); g.ellipse(p[1] + dx + 0.5, p[2] + dy + 0.5, p[3] + 0.5, p[4] + 0.5, 0, 0, 6.2832); }
    else if (t === 'o') { g.moveTo(p[1] + dx + p[3], p[2] + dy); g.ellipse(p[1] + dx, p[2] + dy, p[3], p[4], 0, 0, 6.2832); }
    else if (t === 't') { g.moveTo(p[1] + 0.5 + dx, p[2] + 0.5 + dy); g.lineTo(p[3] + 0.5 + dx, p[4] + 0.5 + dy); g.lineTo(p[5] + 0.5 + dx, p[6] + 0.5 + dy); g.closePath(); }
    else if (t === 'q') {
      var pts = p[1], n = pts.length, i;
      if (p[3]) { /* closed Catmull-Rom spline */
        g.moveTo(pts[0][0] + dx, pts[0][1] + dy);
        for (i = 0; i < n; i++) {
          var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
          g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6 + dx, p1[1] + (p2[1] - p0[1]) / 6 + dy, p2[0] - (p3[0] - p1[0]) / 6 + dx, p2[1] - (p3[1] - p1[1]) / 6 + dy, p2[0] + dx, p2[1] + dy);
        }
      } else { g.moveTo(pts[0][0] + dx, pts[0][1] + dy); for (i = 1; i < n; i++) g.lineTo(pts[i][0] + dx, pts[i][1] + dy); }
      g.closePath();
    }
  }
  function lineOf(g, d) {
    var p = d.p;
    if (d.t === 'l') { g.moveTo(p[1] + 0.5, p[2] + 0.5); g.lineTo(p[3] + 0.5, p[4] + 0.5); }
    else { g.moveTo(p[1], p[2]); g.quadraticCurveTo(p[3], p[4], p[5], p[6]); }
  }
  var origDrawParts = art.drawParts;
  art.drawPartsHD = function (g, parts, scale, outline) {
    scale = scale || 1; outline = outline || DARK;
    g.save(); g.scale(scale, scale);
    var ds = parts.map(describe), i, d, ow = 0.6;
    g.lineJoin = 'round'; g.lineCap = 'round';
    /* soft glows sit behind everything */
    for (i = 0; i < ds.length; i++) {
      d = ds[i]; if (d.t !== 'g' || d.det) continue;
      var gr = g.createRadialGradient(d.p[1], d.p[2], 0, d.p[1], d.p[2], d.p[3]);
      gr.addColorStop(0, rgbaOf(d.p[4], d.p[5] === undefined ? 0.5 : d.p[5])); gr.addColorStop(1, rgbaOf(d.p[4], 0));
      g.fillStyle = gr; g.fillRect(d.p[1] - d.p[3], d.p[2] - d.p[3], d.p[3] * 2, d.p[3] * 2);
    }
    /* outline pass */
    for (i = 0; i < ds.length; i++) {
      d = ds[i]; if (d.det || d.t === 'g' || d.t === 's') continue;
      g.strokeStyle = outline; g.fillStyle = outline;
      if (d.t === 'l') { g.lineWidth = 1 + ow * 2; g.beginPath(); lineOf(g, d); g.stroke(); continue; }
      if (d.t === 'p') { g.fillRect(d.p[1] - ow, d.p[2] - ow, 1 + ow * 2, 1 + ow * 2); continue; }
      g.lineWidth = ow * 2; g.beginPath(); pathOf(g, d, 0, 0); g.fill(); g.stroke();
    }
    /* fill and shade pass */
    for (i = 0; i < ds.length; i++) {
      d = ds[i]; if (d.det || d.t === 'g' || d.t === 's') continue;
      var col = d.col, bb = d.bb, bw = bb[2] - bb[0], bh = bb[3] - bb[1];
      if (d.t === 'l') { g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); lineOf(g, d); g.stroke(); continue; }
      if (d.t === 'p') { g.fillStyle = col; g.fillRect(d.p[1], d.p[2], 1, 1); continue; }
      g.save(); g.beginPath(); pathOf(g, d, 0, 0); g.clip();
      if (isHex(col)) {
        var gr2 = g.createLinearGradient(0, bb[1], 0, bb[3] + 0.01);
        gr2.addColorStop(0, mix(col, '#ffffff', 0.2)); gr2.addColorStop(0.5, col); gr2.addColorStop(1, mix(col, '#10081e', 0.27));
        g.fillStyle = gr2; g.fillRect(bb[0] - 1, bb[1] - 1, bw + 2, bh + 2);
        if (bw >= 2.6 && bh >= 2.6) {
          var k = Math.min(0.8, Math.min(bw, bh) * 0.17);
          g.beginPath(); g.rect(bb[0] - 3, bb[1] - 3, bw + 6, bh + 6); pathOf(g, d, -k, -k * 1.1); g.fillStyle = 'rgba(14,6,40,0.3)'; g.fill('evenodd');
          g.beginPath(); g.rect(bb[0] - 3, bb[1] - 3, bw + 6, bh + 6); pathOf(g, d, k * 0.8, k * 0.9); g.fillStyle = 'rgba(255,255,255,0.27)'; g.fill('evenodd');
        }
      } else { g.fillStyle = col; g.fillRect(bb[0] - 1, bb[1] - 1, bw + 2, bh + 2); }
      g.restore();
    }
    /* detail pass: strokes, glows, eyes and flat marks */
    for (i = 0; i < ds.length; i++) {
      d = ds[i]; if (!d.det && d.t !== 's' && d.t !== 'g') continue;
      var p = d.p, c2 = d.col;
      if (d.t === 'g') {
        var gr3 = g.createRadialGradient(p[1], p[2], 0, p[1], p[2], p[3]);
        gr3.addColorStop(0, rgbaOf(c2, p[5] === undefined ? 0.5 : p[5])); gr3.addColorStop(1, rgbaOf(c2, 0));
        if (d.det) { g.save(); g.globalCompositeOperation = 'lighter'; }
        g.fillStyle = gr3; g.fillRect(p[1] - p[3], p[2] - p[3], p[3] * 2, p[3] * 2);
        if (d.det) g.restore();
        continue;
      }
      if (d.t === 'E') {
        var sc = p[4] || 1;
        g.fillStyle = c2; g.beginPath(); g.ellipse(p[1], p[2], 0.82 * sc, 1.18 * sc, 0, 0, 6.2832); g.fill();
        g.fillStyle = 'rgba(8,4,20,0.9)'; g.beginPath(); g.ellipse(p[1] + 0.05, p[2] + 0.1, 0.42 * sc, 0.74 * sc, 0, 0, 6.2832); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(p[1] - 0.28 * sc, p[2] - 0.42 * sc, 0.3 * sc, 0, 6.2832); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(p[1] + 0.3 * sc, p[2] + 0.5 * sc, 0.16 * sc, 0, 6.2832); g.fill();
        continue;
      }
      g.fillStyle = c2; g.strokeStyle = c2;
      if (d.t === 's') { g.lineWidth = p[7]; g.beginPath(); lineOf(g, d); g.stroke(); }
      else if (d.t === 'p') g.fillRect(p[1] + 0.1, p[2] + 0.1, 0.85, 0.85);
      else if (d.t === 'l') { g.lineWidth = 0.9; g.beginPath(); lineOf(g, d); g.stroke(); }
      else { g.beginPath(); if (d.t === 'r') { var rr2 = Math.min(0.3, Math.min(p[3], p[4]) / 2); pathOf(g, { t: 'b', p: [0, p[1], p[2], p[3], p[4], rr2] }, 0, 0); } else pathOf(g, d, 0, 0); g.fill(); }
    }
    g.restore();
  };
  art.drawParts = function (ctx, parts, scale, outline) {
    if (ctx.canvas.hd) return art.drawPartsHD(ctx, parts, scale, outline);
    return origDrawParts(ctx, parts, scale, outline);
  };

  /* ---------- shading pass: bevel from luminance + fine grain ---------- */
  var NOTEX = { WATER: 1, DEEP: 1 };
  art.enhance = function (c, name, hh, bespoke, snap) {
    var S = c.hd, w = c.width, h = c.height, x = c.getContext('2d');
    var id = x.getImageData(0, 0, w, h), d = id.data, i, lum = new Float32Array(w * h);
    for (i = 0; i < w * h; i++) lum[i] = 0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2];
    var k = Math.max(1, Math.round(S * 0.55)), bev = bespoke ? 0.1 : 0.34, tex = bespoke ? 3 : (NOTEX[name] ? 0 : 4);
    var r = rnd(hh * 131 + name.length * 7 + 5), grain = new Float32Array(w * h);
    for (i = 0; i < grain.length; i++) grain[i] = r() - 0.5;
    var py, px;
    for (py = 0; py < h; py++) for (px = 0; px < w; px++) {
      i = py * w + px;
      var a = d[i * 4 + 3]; if (a === 0) continue;
      if (snap && Math.abs(d[i * 4] - snap.data[i * 4]) + Math.abs(d[i * 4 + 1] - snap.data[i * 4 + 1]) + Math.abs(d[i * 4 + 2] - snap.data[i * 4 + 2]) < 6) continue;
      var l0 = lum[i];
      var ln = (px + k < w && py + k < h) ? lum[(py + k) * w + px + k] : l0;
      var lp = (px - k >= 0 && py - k >= 0) ? lum[(py - k) * w + px - k] : l0;
      var dd = (l0 - ln) * 0.5 + (lp - l0) * -0.0; /* light from the upper left: bright edges face it */
      var add = Math.max(-40, Math.min(40, dd * bev * 2)) + grain[i] * tex;
      d[i * 4] = Math.max(0, Math.min(255, d[i * 4] + add));
      d[i * 4 + 1] = Math.max(0, Math.min(255, d[i * 4 + 1] + add));
      d[i * 4 + 2] = Math.max(0, Math.min(255, d[i * 4 + 2] + add));
    }
    x.putImageData(id, 0, 0);
  };

  /* ---------- baked lighting: soft shadows cast by solid objects toward the lower right ---------- */
  var CAST = { ROOF0: 1, ROOF1: 1, ROOF2: 1, ROOF3: 1, ROOFT0: 1, ROOFT1: 1, ROOFT2: 1, ROOFT3: 1, WALLB: 1, WALLP: 1, WALLS: 1, OCASTLE: 0.8, MOUNT: 0.5 };
  art.bakeLight = function (map, x, bx0, by0, bx1, by1) {
    var nameOf = art.names, S = FP.SS;
    function cast(id) { return CAST[nameOf[id]] || 0; }
    var W = map.w, H = map.h, yy, xx, n = 0;
    /* only open ground receives shadows */
    x.save(); x.beginPath();
    for (yy = Math.max(0, by0); yy < Math.min(H, by1); yy++) for (xx = Math.max(0, bx0); xx < Math.min(W, bx1); xx++) {
      var t0 = map.t[yy * W + xx];
      if (!art.isSolid(t0) && !cast(t0)) x.rect(xx * 16, yy * 16, 16, 16);
    }
    x.clip();
    var OFF = 6000;
    x.shadowColor = 'rgba(14,8,44,0.55)'; x.shadowBlur = 4.5 * S; x.shadowOffsetX = OFF * S; x.shadowOffsetY = 0;
    x.fillStyle = '#000';
    for (yy = Math.max(0, by0); yy < Math.min(H, by1); yy++) for (xx = Math.max(0, bx0); xx < Math.min(W, bx1); xx++) {
      var id = map.t[yy * W + xx], cs = cast(id); if (!cs) continue;
      var nm = nameOf[id], px = xx * 16 - OFF, py = yy * 16;
      x.globalAlpha = Math.min(1, cs);
      x.beginPath();
      if (nm === 'TREE' || nm === 'PINE') x.ellipse(px + 11.5, py + 13.5, 7, 3.6, 0, 0, 6.2832);
      else if (nm === 'BUSH' || nm === 'ROCK') x.ellipse(px + 10, py + 13, 6, 3, 0, 0, 6.2832);
      else if (nm.indexOf('ROOF') === 0 || nm.indexOf('WALL') === 0 || nm === 'OCASTLE' || nm === 'OTOWN' || nm === 'MOUNT') x.rect(px + 3, py + 4, 16, 14);
      else x.rect(px + 5, py + 8, 9, 7);
      x.fill();
    }
    x.restore();
    /* wet shore and foam on the land side of every water edge */
    function isWater(t) { var n = nameOf[t]; return n === 'WATER' || n === 'DEEP' || n === 'BOAT' || n === 'WATERI'; }
    for (yy = Math.max(0, by0); yy < Math.min(H, by1); yy++) for (xx = Math.max(0, bx0); xx < Math.min(W, bx1); xx++) {
      var t = map.t[yy * W + xx];
      if (isWater(t)) continue;
      var nn0 = nameOf[t]; if (nn0 === 'BRIDGE' || nn0 === 'BRIDGEV' || nn0 === 'DOCK' || nn0 === 'BOAT') continue;
      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (d) {
        var nx = xx + d[0], ny = yy + d[1];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isWater(map.t[ny * W + nx])) return;
        var bx = xx * 16, by = yy * 16;
        var x0 = d[0] > 0 ? bx + 16 : d[0] < 0 ? bx : bx, y0 = d[1] > 0 ? by + 16 : d[1] < 0 ? by : by;
        var x1 = x0 - d[0] * 4, y1 = y0 - d[1] * 4;
        var gg = x.createLinearGradient(x0, y0, x1, y1);
        gg.addColorStop(0, 'rgba(30,50,60,0.38)'); gg.addColorStop(1, 'rgba(30,50,60,0)');
        x.fillStyle = gg;
        if (d[0] === 0) x.fillRect(bx, d[1] > 0 ? by + 12 : by, 16, 4); else x.fillRect(d[0] > 0 ? bx + 12 : bx, by, 4, 16);
        var fx0 = d[0] > 0 ? bx + 14.8 : d[0] < 0 ? bx : bx, fy0 = d[1] > 0 ? by + 14.8 : d[1] < 0 ? by : by;
        x.fillStyle = 'rgba(245,253,255,0.5)';
        if (d[0] === 0) x.fillRect(bx, fy0, 16, 1.2); else x.fillRect(fx0, by, 1.2, 16);
      });
    }
  };
})(FP);
