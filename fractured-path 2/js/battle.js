/* The Fractured Path: turn-based battles. Hero plus two Kin on the right, foes on the left. */
(function (FP) {
  'use strict';
  var D = FP.D, art = FP.art, U = FP.ui;
  var B = FP.battle = { active: false };
  var S = null; /* current battle state */
  var fxList = [], floaters = [];

  /* ---------- sprites for foes ---------- */
  var foeCache = {};
  FP.foeSprite = function (f) {
    var key = f.art, c = foeCache[key];
    if (c) return c;
    if (art.CRE[key]) c = art.creature(key, false);
    else if (art.CAST[key]) c = art.charBig(art.CAST[key].look, 'r', 2);
    else if (art.NPC[key]) c = art.charBig(art.npcLook(key, 7), 'r', 2);
    else c = art.creature('shade', false);
    foeCache[key] = c; return c;
  };

  /* ---------- backgrounds: painted at full resolution ---------- */
  var bgCache = {};
  function bgMake(kind) {
    var c = art.hdCanvas(FP.W, 100), g = c.getContext('2d'), H = art.hdh, mix = art.mix;
    var rng = FP.mulberry32(kind.length * 977 + kind.charCodeAt(0)), i, x;
    function grad(y0, y1, stops) { var gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); g.fillStyle = gr; g.fillRect(0, y0, FP.W, y1 - y0); }
    function glow(x0, y0, r, col, a) { H.blob(g, x0, y0, r, col, a); }
    function cloud(cx, cy, s, col, a) { for (var k = 0; k < 6; k++) glow(cx + (k - 2.5) * 5 * s + (rng() - 0.5) * 3, cy + (rng() - 0.5) * 2 * s, 7 * s * (0.6 + rng() * 0.6), col, a); }
    function ridge(base, amp, c1, c2, seed, step, bottom) {
      var r = FP.mulberry32(seed), pts = [], ph = r() * 6;
      for (x = -4; x <= 164; x += step || 3) pts.push([x, base + Math.sin(x / 19 + ph) * amp + Math.sin(x / 8 + ph * 2) * amp * 0.45 + (r() - 0.5) * amp * 0.35]);
      var rg = g.createLinearGradient(0, base - amp, 0, base + 22); rg.addColorStop(0, c1); rg.addColorStop(1, c2);
      g.fillStyle = rg; g.beginPath(); g.moveTo(-4, bottom || 100); pts.forEach(function (p) { g.lineTo(p[0], p[1]); }); g.lineTo(164, bottom || 100); g.closePath(); g.fill();
    }
    function ground(y, c1, c2, tex) {
      grad(y, 100, [[0, c1], [1, c2]]);
      for (var k = 0; k < 90; k++) { var t = Math.pow(rng(), 1.3), yy = y + 1 + t * (100 - y), xx = rng() * 160, s = 0.4 + t * 1.6; g.fillStyle = 'rgba(' + tex + ',' + (0.12 + rng() * 0.25) + ')'; g.beginPath(); g.ellipse(xx, yy, s * 1.4, s * 0.45, 0, 0, 6.2832); g.fill(); }
      for (k = 0; k < 6; k++) { var yl = y + 3 + k * k * 1.2; if (yl < 100) { g.strokeStyle = 'rgba(' + tex + ',0.1)'; g.lineWidth = 0.4 + k * 0.1; g.beginPath(); g.moveTo(0, yl); g.lineTo(160, yl); g.stroke(); } }
      var hz = g.createLinearGradient(0, y - 2, 0, y + 14); hz.addColorStop(0, 'rgba(255,255,255,0.0)'); hz.addColorStop(0.2, 'rgba(255,255,255,0.18)'); hz.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hz; g.fillRect(0, y - 2, 160, 16);
    }
    function blades(y, col, n, h2) { for (var k = 0; k < n; k++) { var xx = rng() * 160, t = rng(); g.strokeStyle = col; g.lineWidth = 0.3 + t * 0.3; g.beginPath(); g.moveTo(xx, y + t * 6); g.quadraticCurveTo(xx + (rng() - 0.5) * 2, y + t * 6 - h2 * 0.6, xx + (rng() - 0.5) * 3, y + t * 6 - h2 * (0.6 + t * 0.6)); g.stroke(); } }
    function stars(n, ymax, col) { for (var k = 0; k < n; k++) { var sx = rng() * 160, sy = rng() * ymax, sr = 0.2 + rng() * 0.35; g.fillStyle = col || 'rgba(255,255,255,' + (0.4 + rng() * 0.6) + ')'; g.beginPath(); g.arc(sx, sy, sr, 0, 6.2832); g.fill(); } }
    function rays(cx, n, col, a, wid) { g.save(); g.globalCompositeOperation = 'lighter'; for (var k = 0; k < n; k++) { var x0 = cx + (k - n / 2) * wid * 1.4 + (rng() - 0.5) * 6, w0 = wid * (0.5 + rng() * 0.8); var gr = g.createLinearGradient(x0, 0, x0 - 18, 70); gr.addColorStop(0, 'rgba(' + col + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + w0, 0); g.lineTo(x0 + w0 - 22, 72); g.lineTo(x0 - 22 - w0 * 0.2, 72); g.closePath(); g.fill(); } g.restore(); }
    function vign(a) { var vg = g.createRadialGradient(80, 55, 30, 80, 55, 100); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(6,2,20,' + a + ')'); g.fillStyle = vg; g.fillRect(0, 0, 160, 100); }
    function trunkTree(tx, ty, h2, w2, tcol, ccol1, ccol2) {
      var tg = g.createLinearGradient(tx - w2, 0, tx + w2, 0); tg.addColorStop(0, mix(tcol, '#ffffff', 0.12)); tg.addColorStop(1, mix(tcol, '#000000', 0.35)); g.fillStyle = tg;
      g.beginPath(); g.moveTo(tx - w2 * 1.3, ty + h2); g.quadraticCurveTo(tx - w2 * 0.6, ty + h2 * 0.8, tx - w2, ty); g.lineTo(tx + w2, ty); g.quadraticCurveTo(tx + w2 * 0.6, ty + h2 * 0.8, tx + w2 * 1.3, ty + h2); g.closePath(); g.fill();
      for (var k = 0; k < 7; k++) { var a = rng() * 6.28, d = rng() * w2 * 4.4; var bx = tx + Math.cos(a) * d, by = ty + Math.sin(a) * d * 0.6 - 2; var gr = g.createRadialGradient(bx - 1, by - 1, 0, bx, by, w2 * 3.2); gr.addColorStop(0, ccol2); gr.addColorStop(1, ccol1); g.fillStyle = gr; g.beginPath(); g.arc(bx, by, w2 * 3.2, 0, 6.2832); g.fill(); }
    }
    if (kind === 'meadow') {
      grad(0, 60, [[0, '#4aa6ee'], [0.6, '#a8dcff'], [1, '#eaf8ff']]);
      glow(130, 14, 34, '#fff6c8', 0.5); glow(130, 14, 12, '#ffffff', 0.7);
      for (i = 0; i < 5; i++) cloud(10 + i * 36 + rng() * 14, 10 + rng() * 26, 0.7 + rng() * 0.7, '#ffffff', 0.4);
      ridge(52, 6, '#8ac0d8', '#9ccbd8', 3, 4, 70); ridge(58, 5, '#6aaa88', '#7ab890', 8, 4, 70); ridge(64, 4, '#4f9a5a', '#5aa862', 13, 3, 70);
      for (i = 0; i < 14; i++) { var tx = rng() * 160, tys = 60 + rng() * 6; g.fillStyle = '#2f7a3c'; g.beginPath(); g.arc(tx, tys, 2 + rng() * 2.4, 0, 6.2832); g.fill(); g.fillStyle = '#5a3a22'; g.fillRect(tx - 0.3, tys, 0.6, 3); }
      ground(66, '#78c85a', '#3f9a46', '24,70,30'); blades(66, 'rgba(40,110,50,0.8)', 80, 2.4);
      for (i = 0; i < 28; i++) { var fx = rng() * 160, fy = 70 + rng() * 30, fc = ['#ffffff', '#ffd05a', '#ff8ab0', '#c9a0ff'][i % 4]; g.fillStyle = fc; g.beginPath(); g.arc(fx, fy, 0.4 + (fy - 66) * 0.012, 0, 6.2832); g.fill(); }
      rays(120, 4, '255,246,200', 0.07, 5);
    } else if (kind === 'forest') {
      grad(0, 64, [[0, '#0c2a1e'], [0.5, '#1d5a3a'], [1, '#3a8a54']]);
      rays(70, 6, '210,255,170', 0.1, 4);
      for (i = 0; i < 9; i++) trunkTree(8 + i * 19 + rng() * 6, 2 + rng() * 6, 62, 1.8 + rng() * 1.4, '#2a1a12', '#143c26', '#2a7a46');
      for (i = 0; i < 6; i++) glow(rng() * 160, 40 + rng() * 20, 22, '#9ae8a8', 0.12);
      ground(62, '#3a7a46', '#173a24', '14,40,22'); blades(64, 'rgba(120,220,120,0.5)', 60, 3);
      for (i = 0; i < 26; i++) { var ffx = rng() * 160, ffy = rng() * 90 + 6; glow(ffx, ffy, 2.6, '#e8ff9a', 0.7); }
      vign(0.5);
    } else if (kind === 'coast') {
      grad(0, 52, [[0, '#4ab0f0'], [0.7, '#bce8ff'], [1, '#fff4dc']]);
      glow(40, 40, 34, '#fff0c0', 0.5); glow(40, 42, 11, '#ffffff', 0.8);
      for (i = 0; i < 4; i++) cloud(20 + i * 42 + rng() * 14, 8 + rng() * 22, 0.7 + rng() * 0.5, '#ffffff', 0.38);
      grad(50, 68, [[0, '#6ad0f8'], [0.4, '#2e98e0'], [1, '#1e6cb4']]);
      for (i = 0; i < 40; i++) { var wy = 52 + rng() * 15, wx = rng() * 160, ww = 3 + rng() * 8; g.strokeStyle = 'rgba(255,255,255,' + (0.3 + rng() * 0.4) + ')'; g.lineWidth = 0.3; g.beginPath(); g.moveTo(wx, wy); g.quadraticCurveTo(wx + ww / 2, wy - 0.8, wx + ww, wy); g.stroke(); }
      glow(40, 56, 14, '#fff6d0', 0.5);
      g.fillStyle = '#f4f0e0'; g.beginPath(); g.moveTo(110, 50); g.lineTo(122, 50); g.lineTo(116, 40); g.closePath(); g.fill(); g.fillStyle = '#8a5a38'; g.fillRect(115.5, 40, 0.6, 12);
      ground(67, '#f4e2b0', '#d2b878', '120,90,40');
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 0.9; g.beginPath(); for (x = 0; x <= 160; x += 3) g.lineTo(x, 67 + Math.sin(x / 9) * 0.8); g.stroke();
      for (i = 0; i < 10; i++) { g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(rng() * 160, 72 + rng() * 26, 1, 0.6, 0, 0, 6.2832); g.fill(); }
    } else if (kind === 'beacon') {
      grad(0, 60, [[0, '#070b24'], [0.6, '#1a2a5a'], [1, '#5878a8']]);
      stars(60, 40); glow(122, 22, 36, '#fff2b8', 0.28); g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(122, 22, 10, 0, 6.2832); g.fill();
      grad(44, 62, [[0, '#1a3a78'], [1, '#2a5a98']]);
      for (i = 0; i < 24; i++) { g.fillStyle = 'rgba(160,210,255,' + (0.2 + rng() * 0.4) + ')'; g.fillRect(rng() * 150, 46 + rng() * 14, 4 + rng() * 8, 0.4); }
      glow(122, 52, 20, '#fff2b8', 0.3);
      [[0, 14], [146, 14]].forEach(function (p) { var sg = g.createLinearGradient(p[0], 0, p[0] + 14, 0); sg.addColorStop(0, '#b4bed8'); sg.addColorStop(1, '#6a769a'); g.fillStyle = sg; g.fillRect(p[0], 0, p[1], 64); for (var k = 0; k < 7; k++) { g.fillStyle = 'rgba(30,20,70,0.3)'; g.fillRect(p[0], 6 + k * 9, p[1], 0.5); } });
      g.fillStyle = '#8892b0'; g.fillRect(0, 0, 160, 6); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(0, 0, 160, 0.8);
      ground(62, '#c4aa84', '#8a7048', '70,50,30'); glow(80, 70, 40, '#ffe6a0', 0.15);
    } else if (kind === 'highmoor') {
      grad(0, 60, [[0, '#6a78b0'], [0.7, '#b4bce0'], [1, '#e4e0f4']]);
      glow(30, 22, 30, '#fff0d0', 0.35);
      for (i = 0; i < 3; i++) cloud(30 + i * 56, 10 + rng() * 16, 0.8, '#ffffff', 0.3);
      for (i = 0; i < 10; i++) { var bx2 = i * 18 - 2; var wg = g.createLinearGradient(bx2, 0, bx2 + 12, 0); wg.addColorStop(0, '#a8aed0'); wg.addColorStop(1, '#7a80a8'); g.fillStyle = wg; g.fillRect(bx2, 22, 13, 42); for (var k = 0; k < 3; k++) g.fillRect(bx2 + k * 5, 18, 3, 5); g.fillStyle = 'rgba(40,30,80,0.3)'; g.fillRect(bx2 + 5, 36, 3, 8); }
      [[18, '#c0504a'], [118, '#c0504a']].forEach(function (p) { var bg2 = g.createLinearGradient(0, 8, 0, 50); bg2.addColorStop(0, '#d8605a'); bg2.addColorStop(1, '#8a2a30'); g.fillStyle = bg2; g.beginPath(); g.moveTo(p[0], 8); g.lineTo(p[0] + 14, 8); g.lineTo(p[0] + 14, 46); g.lineTo(p[0] + 7, 52); g.lineTo(p[0], 46); g.closePath(); g.fill(); g.fillStyle = '#f2c14e'; g.fillRect(p[0] + 5, 16, 4, 12); g.fillRect(p[0] + 3, 20, 8, 3); });
      ground(62, '#c4c0dc', '#8e8ab4', '60,50,100');
      for (i = 0; i < 6; i++) { g.strokeStyle = 'rgba(60,50,100,0.18)'; g.lineWidth = 0.3; g.beginPath(); g.moveTo(rng() * 160, 62); g.lineTo(rng() * 160 - 40 + i * 14, 100); g.stroke(); }
    } else if (kind === 'crypt') {
      grad(0, 64, [[0, '#07051a'], [1, '#2c2850']]);
      for (i = 0; i < 6; i++) { var ax = 6 + i * 28; var ag = g.createLinearGradient(ax, 0, ax + 24, 0); ag.addColorStop(0, '#4a4678'); ag.addColorStop(1, '#2a2650'); g.fillStyle = ag; g.fillRect(ax, 14, 5, 52); g.fillRect(ax + 19, 14, 5, 52); g.beginPath(); g.ellipse(ax + 12, 26, 12, 13, 0, Math.PI, 0); g.fill(); g.fillStyle = '#0a0818'; g.beginPath(); g.ellipse(ax + 12, 28, 8, 11, 0, Math.PI, 0); g.fillRect(ax + 4, 28, 16, 38); g.fill(); }
      for (i = 0; i < 4; i++) { var tx2 = 22 + i * 38; g.fillStyle = '#5a4a32'; g.fillRect(tx2, 36, 1.2, 8); glow(tx2 + 0.6, 34, 12, '#ffa84a', 0.55); g.fillStyle = '#ffd890'; g.beginPath(); g.ellipse(tx2 + 0.6, 34, 1.1, 2, 0, 0, 6.2832); g.fill(); }
      ground(62, '#4a4a78', '#262244', '170,160,230'); glow(80, 66, 46, '#8a70c8', 0.14);
      for (i = 0; i < 6; i++) glow(rng() * 160, 58 + rng() * 10, 20, '#9a90c8', 0.1);
      vign(0.55);
    } else if (kind === 'archive') {
      grad(0, 64, [[0, '#06161f'], [1, '#1d5a78']]);
      for (i = 0; i < 9; i++) { var sx = i * 18 + 2; g.fillStyle = '#0e3248'; g.fillRect(sx, 4, 15, 58); for (var r = 0; r < 6; r++) { var bc = ['#7af0ff', '#5aa4b8', '#f2c14e', '#a070ff'][(i + r) % 4]; g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(sx + 1, 8 + r * 9 + 5, 13, 0.6); for (var b2 = 0; b2 < 5; b2++) { g.fillStyle = bc; g.globalAlpha = 0.5 + rng() * 0.4; g.fillRect(sx + 1.4 + b2 * 2.6, 8 + r * 9 + rng() * 1.2, 2, 5 - rng()); } g.globalAlpha = 1; } }
      for (i = 0; i < 16; i++) glow(rng() * 160, rng() * 56, 3, '#aef6ff', 0.6);
      rays(60, 3, '120,230,255', 0.06, 6);
      ground(62, '#4c8fa8', '#143c52', '150,230,255'); glow(80, 70, 50, '#5ae0ff', 0.14);
      for (i = 0; i < 6; i++) { g.strokeStyle = 'rgba(160,240,255,0.25)'; g.lineWidth = 0.35; g.beginPath(); g.moveTo(10 + i * 28, 64); g.lineTo(-20 + i * 36, 100); g.stroke(); }
    } else if (kind === 'ash') {
      grad(0, 56, [[0, '#2a0e2e'], [0.5, '#8a2a3a'], [1, '#f0783a']]);
      glow(76, 40, 40, '#ffb060', 0.5);
      for (i = 0; i < 4; i++) cloud(20 + i * 44, 8 + rng() * 22, 0.9, '#3a1a2a', 0.5);
      g.fillStyle = '#241222'; g.beginPath(); g.moveTo(34, 62); g.lineTo(70, 18); g.lineTo(82, 18); g.lineTo(118, 62); g.closePath(); g.fill();
      g.fillStyle = '#ff9a3a'; g.beginPath(); g.moveTo(70, 18); g.lineTo(82, 18); g.lineTo(80, 14); g.lineTo(72, 14); g.closePath(); g.fill(); glow(76, 14, 14, '#ffd03a', 0.7);
      g.strokeStyle = 'rgba(255,140,50,0.8)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(74, 20); g.lineTo(66, 40); g.lineTo(60, 58); g.moveTo(78, 20); g.lineTo(84, 38); g.lineTo(92, 58); g.stroke();
      ridge(60, 4, '#3a2030', '#241420', 6, 4);
      ground(58, '#625c6c', '#2a2430', '10,6,16');
      for (i = 0; i < 7; i++) { var lx = rng() * 150, ly = 64 + rng() * 30; g.strokeStyle = 'rgba(255,120,40,0.85)'; g.lineWidth = 0.4 + rng() * 0.4; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 6 + rng() * 8, ly + (rng() - 0.5) * 3); g.lineTo(lx + 14 + rng() * 10, ly + (rng() - 0.5) * 4); g.stroke(); }
      for (i = 0; i < 40; i++) glow(rng() * 160, rng() * 90, 1.6, '#ffb860', 0.8);
      vign(0.4);
    } else if (kind === 'cave') {
      grad(0, 64, [[0, '#0a0814'], [1, '#3a3048']]);
      for (i = 0; i < 14; i++) { var sx2 = i * 12 - 4 + rng() * 6, sl = 8 + rng() * 22; var sg2 = g.createLinearGradient(sx2, 0, sx2 + 8, 0); sg2.addColorStop(0, '#4a3e5e'); sg2.addColorStop(1, '#1c1630'); g.fillStyle = sg2; g.beginPath(); g.moveTo(sx2, 0); g.lineTo(sx2 + 9, 0); g.lineTo(sx2 + 4.5, sl); g.closePath(); g.fill(); }
      [[28, 52, '#7af0ff'], [128, 48, '#c070ff'], [100, 58, '#7af0ff']].forEach(function (cr) { glow(cr[0], cr[1], 18, cr[2], 0.35); for (var k = 0; k < 3; k++) { g.fillStyle = cr[2]; g.beginPath(); g.moveTo(cr[0] + k * 2.4 - 2, cr[1] + 8); g.lineTo(cr[0] + k * 2.4 - 1.2, cr[1] - 4 - k * 1.4); g.lineTo(cr[0] + k * 2.4 + 0.2, cr[1] + 8); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(cr[0] + k * 2.4 - 1.4, cr[1] - 2 - k, 0.4, 7); } });
      ground(62, '#5a506a', '#241e32', '12,8,24');
      for (i = 0; i < 4; i++) { var px = 20 + rng() * 120, py = 70 + rng() * 22; g.fillStyle = 'rgba(80,120,170,0.55)'; g.beginPath(); g.ellipse(px, py, 8 + rng() * 6, 1.8, 0, 0, 6.2832); g.fill(); g.fillStyle = 'rgba(190,240,255,0.5)'; g.beginPath(); g.ellipse(px - 2, py - 0.4, 3, 0.4, 0, 0, 6.2832); g.fill(); }
      for (i = 0; i < 20; i++) glow(rng() * 160, rng() * 70, 1.4, '#c8b8ff', 0.7);
      vign(0.5);
    } else if (kind === 'heart') {
      grad(0, 64, [[0, '#04020c'], [0.6, '#241048'], [1, '#4a2088']]);
      for (i = 0; i < 6; i++) glow(rng() * 160, rng() * 50, 26, i % 2 ? '#8a3ad8' : '#3a5ad8', 0.22);
      stars(80, 64, 'rgba(210,190,255,0.9)'); glow(80, 40, 34, '#c8a0ff', 0.3);
      for (i = 0; i < 9; i++) { var shx = rng() * 150 + 5, shy = 8 + rng() * 44, sz = 2 + rng() * 4; g.fillStyle = 'rgba(' + (120 + Math.floor(rng() * 80)) + ',90,255,0.85)'; g.beginPath(); g.moveTo(shx, shy - sz); g.lineTo(shx + sz * 0.6, shy); g.lineTo(shx, shy + sz); g.lineTo(shx - sz * 0.6, shy); g.closePath(); g.fill(); glow(shx, shy, sz * 2.2, '#a070ff', 0.25); }
      ground(62, '#2c1c58', '#0e0820', '170,130,255');
      g.strokeStyle = 'rgba(190,140,255,0.5)'; g.lineWidth = 0.5; g.beginPath(); g.ellipse(80, 80, 40, 9, 0, 0, 6.2832); g.stroke(); g.beginPath(); g.ellipse(80, 80, 26, 5.5, 0, 0, 6.2832); g.stroke(); glow(80, 80, 40, '#a070ff', 0.25);
      vign(0.5);
    } else {
      grad(0, 60, [[0, '#2a2f5a'], [1, '#5a3a7a']]); stars(30, 50); ground(60, '#40386a', '#1c1840', '10,6,24'); vign(0.4);
    }
    return c;
  }
  FP.battleBG = function (g, kind) { var c = bgCache[kind] || (bgCache[kind] = bgMake(kind)); g.drawImage(c, 0, 0); };

  /* ---------- unit helpers ---------- */
  function mkHero() {
    var G = FP.G, st = D.heroStats(G);
    return { side: 'p', kind: 'hero', name: G.name, el: 'none', mhp: st.hp, hp: Math.min(G.hp, st.hp), mmp: st.mp, mp: Math.min(G.mp, st.mp), base: st, buf: {}, st: {}, alive: true, ref: G, cls: G.cls, kinBonus: st.kin, tetherBonus: st.tether };
  }
  function mkKin(k) {
    var st = D.kinStats(k), moves = D.kinMoves(k), pp = {};
    moves.forEach(function (m) { pp[m] = D.SK[m].pp || 99; });
    var G = FP.G;
    return { side: 'p', kind: 'kin', name: D.kinName(k), el: D.KIN[k.sp].el, mhp: st.hp, hp: Math.min(k.hp === undefined ? st.hp : k.hp, st.hp), mmp: 0, mp: 0, base: st, buf: {}, st: {}, alive: true, ref: k, moves: moves, pp: pp, sp: k.sp };
  }
  function mkFoe(spec) {
    var o;
    if (D.KIN[spec.id]) {
      var sp = D.KIN[spec.id], k = { sp: spec.id, lv: spec.lv, bond: 0 }, st = D.kinStats(k), moves = D.kinMoves(k);
      o = { side: 'f', kind: 'foe', name: sp.name, el: sp.el, mhp: st.hp, hp: st.hp, base: st, buf: {}, st: {}, alive: true, moves: moves, sp: spec.id, kinFoe: true, lv: spec.lv, xp: Math.round(5 + 2.6 * spec.lv), gold: Math.round(2 + spec.lv * 1.2), sprite: art.creature(spec.id, false), cap: sp.cap, ai: 'kin' };
    } else {
      var f = D.FOES[spec.id], st2 = D.foeStats(f, spec.lv);
      o = { side: 'f', kind: 'foe', name: spec.name || f.name, el: f.el, mhp: st2.hp, hp: st2.hp, base: st2, buf: {}, st: {}, alive: true, moves: f.moves.slice(), foeId: spec.id, lv: spec.lv, xp: Math.round(f.xp * (0.7 + 0.3 * spec.lv)), gold: Math.round(f.gold * (0.8 + 0.2 * spec.lv)), sprite: FP.foeSprite(f), boss: !!f.boss, rival: !!f.rival, drop: f.drop, ai: f.boss || f.rival ? 'boss' : 'foe' };
    }
    o.mmp = 99; o.mp = 99;
    if (spec.hpMul) { o.mhp = Math.round(o.mhp * spec.hpMul); o.hp = o.mhp; }
    return o;
  }
  function stat(u, k) {
    var v = u.base[k] || 0, b = u.buf[k]; if (b) v *= (1 + b.v);
    if (u.guard && (k === 'def' || k === 'res')) v *= 1.7;
    return Math.max(1, v);
  }
  function alive(side) { return S.units.filter(function (u) { return u.side === side && u.alive; }); }
  function foes() { return S.units.filter(function (u) { return u.side === 'f'; }); }
  function party() { return S.units.filter(function (u) { return u.side === 'p'; }); }

  /* ---------- layout: slots ---------- */
  var PSLOT = [[114, 95], [143, 82], [96, 73]];
  var FSLOT = { 1: [[48, 90]], 2: [[34, 88], [66, 78]], 3: [[24, 92], [50, 84], [74, 74]] };
  function place() {
    var fl = foes(), i, slots = FSLOT[Math.min(3, fl.length)] || FSLOT[1];
    fl.forEach(function (u, idx) { var s = slots[idx % slots.length]; u.x = s[0]; u.y = s[1]; if (u.boss) { u.x = 52; u.y = 92; } u.ox = 0; u.oy = 0; u.flash = 0; u.fade = 1; u.shake = 0; });
    party().forEach(function (u, idx) { var s = PSLOT[idx]; u.x = s[0]; u.y = s[1]; u.ox = 0; u.oy = 0; u.flash = 0; u.fade = 1; u.shake = 0; });
  }

  /* ---------- messages and effects ---------- */
  var msgEl = null, msgT = 0;
  function msg(t, ms) {
    return new Promise(function (res) {
      if (!msgEl) { msgEl = U.el('panel', '', { left: U.u(4), top: U.u(3), width: U.u(150), zIndex: 8, minHeight: U.u(16), pointerEvents: 'none' }); }
      msgEl.style.display = 'block';
      msgEl.innerHTML = U.esc(t);
      var wait = ms === undefined ? 620 : ms, done = false;
      var h = { onKey: function (k) { if ((k === 'a' || k === 'b') && !done) { finish(); } } };
      function finish() { if (done) return; done = true; clearTimeout(tm); FP.popFocus(h); res(); }
      var tm = setTimeout(finish, wait * (S && S.fast ? 0.5 : 1));
      FP.pushFocus(h);
    });
  }
  function hideMsg() { if (msgEl) msgEl.style.display = 'none'; }
  function showMsg(t) { if (!msgEl) msg(t, 1); msgEl.style.display = 'block'; msgEl.innerHTML = U.esc(t); }
  function floater(u, text, cls) {
    var d = U.el('', U.esc(String(text)), { position: 'absolute', left: U.u(u.x - 8), top: U.u(u.y - (u.side === 'p' && u.kind === 'hero' ? 56 : 40)), width: U.u(30), textAlign: 'center', fontSize: U.u(8), zIndex: 9, pointerEvents: 'none', textShadow: '1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000', color: cls === 'heal' ? '#7affb0' : cls === 'crit' ? '#ffd23a' : cls === 'mp' ? '#7ac8ff' : cls === 'miss' ? '#cfd0e8' : '#fff', transition: 'transform .7s steps(8), opacity .7s', transform: 'translateY(0)' });
    setTimeout(function () { d.style.transform = 'translateY(' + U.u(-10) + ')'; d.style.opacity = '0.2'; }, 30);
    setTimeout(function () { U.remove(d); }, 750);
  }
  var ELFX = { flame: ['#ff7a3d', '#ffd03a', '#ff4a2a'], tide: ['#3d9ae0', '#a8e0ff', '#fff'], gale: ['#cfffc0', '#8ad86a', '#fff'], stone: ['#c9a24a', '#8a6a30', '#e8d8a0'], light: ['#fff6b0', '#ffe27a', '#fff'], gloom: ['#a070ff', '#6a3ab8', '#e0c8ff'], none: ['#ffffff', '#d8d8f0', '#ffd0d0'] };
  function burst(u, el, n) {
    var cols = ELFX[el] || ELFX.none;
    for (var i = 0; i < (n || 16); i++) {
      var a = Math.random() * 6.28, sp = 20 + Math.random() * 50;
      fxList.push({ x: u.x + (Math.random() - 0.5) * 10, y: u.y - 16 + (Math.random() - 0.5) * 12, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 10, life: 0.35 + Math.random() * 0.3, t: 0, c: cols[i % cols.length], s: Math.random() < 0.3 ? 2 : 1, g: el === 'flame' ? -30 : el === 'stone' ? 90 : 0 });
    }
  }
  function slash(u) { for (var i = 0; i < 9; i++) fxList.push({ x: u.x - 12 + i * 3, y: u.y - 28 + i * 3, vx: 0, vy: 0, life: 0.2 + i * 0.01, t: 0, c: '#fff', s: 2, g: 0 }); }
  async function lunge(u, dx) {
    var dir = u.side === 'p' ? -1 : 1;
    u.ox = dir * (dx || 12); await FP.sleep(90 * (S.fast ? 0.5 : 1)); u.ox = 0;
  }
  async function flashUnit(u, ms) { u.flash = 1; u.shake = 0.25; await FP.sleep(ms || 220); u.flash = 0; }

  /* ---------- damage and effects ---------- */
  function calcDamage(a, d, sk, o) {
    o = o || {};
    var phys = sk.type === 'phys', A = phys ? stat(a, 'atk') : stat(a, 'mag'), Df = phys ? stat(d, 'def') : stat(d, 'res');
    var pow = sk.pow || 100;
    if (sk.execute && d.hp / d.mhp < sk.execute) pow *= 1.6;
    var ratio = A / (A + Df * 0.9);
    var el = sk.el && sk.el !== 'none' ? sk.el : (sk.basic ? (a.el || 'none') : 'none');
    var em = D.elemMult(sk.el, d.el);
    var cc = (a.base.crit || 0.05) + (sk.critUp || 0);
    var crit = sk.crit ? true : Math.random() < cc;
    var v = A * (pow / 100) * 1.25 * ratio * (0.9 + Math.random() * 0.2) * em * (crit ? 1.5 : 1);
    if (a.side === 'p' && a.kind === 'kin' && S.kinBonus) v *= (1 + S.kinBonus);
    if (a.side === 'f' && a.rageBonus) v *= a.rageBonus;
    if (S.mercy && a.side === 'f') v *= 0.8;
    return { dmg: Math.max(1, Math.round(v)), crit: crit, em: em };
  }
  async function hurt(t, dmg, o) {
    o = o || {};
    t.hp = Math.max(0, t.hp - dmg);
    floater(t, dmg, o.crit ? 'crit' : '');
    updatePanel();
    if (t.hp <= 0) { await faint(t); }
  }
  async function faint(t) {
    t.alive = false; t.st = {}; t.buf = {};
    FP.sfx.hurt && FP.sfx.hurt();
    for (var i = 0; i < 10; i++) { t.fade = 1 - i / 10; await FP.sleep(30); }
    t.fade = 0;
    if (t.side === 'f') { await msg(t.name + ' was defeated!', 380); }
    else await msg(t.name + ' fell!', 520);
    updatePanel();
  }
  function heal(t, amt) {
    var real = Math.min(amt, t.mhp - t.hp); t.hp += real; floater(t, '+' + real, 'heal'); updatePanel(); return real;
  }
  function applyBuff(t, b, label) {
    ['atk', 'def', 'mag', 'res', 'spd', 'eva'].forEach(function (k) { if (b[k] !== undefined) { t.buf[k] = { v: b[k], t: b.t || 3 }; } });
    if (b.regen) t.buf.regen = { v: 1, t: b.t || 3 };
  }
  function addStatus(t, k, turns) { if (!t.alive) return false; if (t.st[k] && t.st[k] >= turns) return false; t.st[k] = turns; return true; }

  /* ---------- action execution ---------- */
  function pickTargets(u, sk, chosen) {
    var side = u.side, enemies = alive(side === 'p' ? 'f' : 'p'), friends = alive(side);
    switch (sk.tgt) {
      case 'e1': return chosen && chosen.alive ? [chosen] : (enemies.length ? [FP.pick(enemies)] : []);
      case 'eA': return enemies;
      case 'a1': return chosen && chosen.alive ? [chosen] : [u];
      case 'aA': return friends.filter(function (x) { return !sk.kinOnly || x.kind === 'kin'; });
      case 'self': return [u];
      case 'dead': return chosen && !chosen.alive ? [chosen] : S.units.filter(function (x) { return x.side === side && !x.alive; }).slice(0, 1);
      case 'rnd': return enemies;
      default: return enemies.slice(0, 1);
    }
  }
  async function useSkill(u, sk, chosen) {
    var tg = pickTargets(u, sk, chosen);
    if (!tg.length) return;
    var verb = (u.kind === 'hero' || u.side === 'p') ? ' used ' : ' used ';
    await msg(u.name + verb + sk.name + '!', 500);
    if (sk.mp && u.kind === 'hero') { u.mp -= sk.mp; }
    if (u.pp && sk.kin) u.pp[sk.id]--;
    if (sk.selfHp) { var loss = Math.round(u.mhp * sk.selfHp); u.hp = Math.max(1, u.hp - loss); floater(u, loss); updatePanel(); }
    var isAtk = !!sk.type;
    if (isAtk) { await lunge(u, sk.type === 'phys' ? 14 : 6); }
    var hits = sk.hits || 1, i, t;
    if (sk.tgt === 'rnd') {
      for (i = 0; i < hits; i++) {
        var pool = alive(u.side === 'p' ? 'f' : 'p'); if (!pool.length) break;
        t = FP.pick(pool); await strike(u, t, sk);
      }
      return;
    }
    for (i = 0; i < tg.length; i++) {
      t = tg[i];
      if (isAtk) { await strike(u, t, sk); }
      else await nonDamage(u, t, sk);
      if (S.over) return;
    }
    if (sk.mpPct) { var got = Math.round(u.mmp * sk.mpPct); u.mp = Math.min(u.mmp, u.mp + got); floater(u, '+' + got, 'mp'); FP.sfx.heal(); updatePanel(); }
  }
  async function strike(u, t, sk) {
    if (!t.alive) return;
    if (t.buf.eva && Math.random() < Math.min(0.9, t.buf.eva.v) && !sk.crit) { floater(t, 'MISS', 'miss'); FP.sfx.miss(); await FP.sleep(220); return; }
    var r = calcDamage(u, t, sk), elx = sk.el || (sk.basic ? (u.el === 'none' ? 'none' : u.el) : 'none');
    (sk.type === 'phys' ? FP.sfx[r.crit ? 'crit' : 'hit'] : FP.sfx.magic)();
    if (sk.type === 'phys') slash(t);
    burst(t, sk.el || 'none', sk.type === 'mag' ? 22 : 12);
    await flashUnit(t, 200);
    await hurt(t, r.dmg, { crit: r.crit });
    if (r.em > 1) { floater({ x: t.x, y: t.y + 8, side: t.side, kind: t.kind }, 'WEAK!', 'crit'); }
    else if (r.em < 1) { floater({ x: t.x, y: t.y + 8, side: t.side, kind: t.kind }, 'resist', 'miss'); }
    if (!t.alive && u.side === 'p' && u.kind !== 'foe') { /* nothing */ }
    if (t.alive && sk.st) sk.st.forEach(function (s) { if (Math.random() < s.ch) { if (addStatus(t, s.k, s.t)) { floater({ x: t.x, y: t.y + 10, side: t.side, kind: t.kind }, D.STATUS[s.k].tag, 'miss'); } } });
    if (t.alive && sk.debuff) applyBuff(t, sk.debuff);
    if (sk.drain && r.dmg) { heal(u, Math.round(r.dmg * sk.drain)); }
    if (sk.steal && u.kind === 'hero') { var gp = Math.min(FP.G.gold, FP.G.lv * 8 + 6); FP.G.gold += 0; S.gold += gp; floater(u, '+' + gp + 'G', 'crit'); }
    if (sk.steal && u.side === 'f') { var lost = Math.min(FP.G.gold, 8 + (u.lv || 1) * 3); FP.G.gold -= lost; floater(t, '-' + lost + 'G', 'miss'); }
    if (sk.lure && t.alive) t.lured = true;
    if (t.alive && t.side === 'f' && t.boss && !t.raged && t.hp / t.mhp < 0.5) { t.raged = true; t.rageBonus = 1.2; await msg(t.name + ' is enraged!', 700); if (S.hooks && S.hooks.half) { hideMsg(); await S.hooks.half(S, t); } }
  }
  async function nonDamage(u, t, sk) {
    if (sk.heal && !sk.revive) {
      var amt = Math.round(sk.heal / 100 * (stat(u, 'mag') * 1.6 + 12));
      FP.sfx.heal(); heal(t, amt); burst(t, 'light', 10);
      if (sk.cleanse) t.st = {};
      await FP.sleep(260);
    }
    if (sk.revive) {
      if (!t.alive) { t.alive = true; t.fade = 1; t.hp = Math.max(1, Math.round(t.mhp * sk.revive)); floater(t, '+' + t.hp, 'heal'); FP.sfx.heal(); burst(t, 'light', 18); updatePanel(); await FP.sleep(300); }
    }
    if (sk.buff) { applyBuff(t, sk.buff); FP.sfx.buff(); burst(t, 'light', 6); floater(t, sk.buff.atk || sk.buff.mag ? 'UP' : (sk.buff.regen ? 'REGEN' : 'UP'), 'heal'); await FP.sleep(200); if (sk.taunt) t.buf.taunt = { v: 1, t: sk.taunt }; }
    if (sk.debuff) { if (t.side !== u.side) { applyBuff(t, sk.debuff); FP.sfx.debuff(); floater(t, 'DOWN', 'miss'); burst(t, 'gloom', 8); await FP.sleep(200); } else { applyBuff(t, sk.debuff); } }
    if (sk.st && !sk.type) {
      sk.st.forEach(function (s) { if (Math.random() < s.ch) { if (addStatus(t, s.k, s.t)) { floater(t, D.STATUS[s.k].tag, 'miss'); burst(t, 'gloom', 6); } } });
      await FP.sleep(180);
    }
    if (sk.cleanse && !sk.heal) t.st = {};
    updatePanel();
  }
  function basicAttack(u) { return { id: 'attack', name: 'Attack', tgt: 'e1', type: (u.kind === 'hero' && u.base.mag > u.base.atk) ? 'mag' : 'phys', pow: (u.kind === 'hero' && u.base.mag > u.base.atk) ? 85 : 100, basic: true, el: u.kind === 'hero' ? 'none' : u.el, hits: 1 }; }

  /* ---------- panel ---------- */
  var panelEl = null;
  function updatePanel() {
    if (!panelEl || !S) return;
    var h = '';
    party().forEach(function (u) {
      var st = Object.keys(u.st).map(function (k) { return D.STATUS[k].tag; }).join(' ');
      h += '<div style="margin-bottom:' + U.u(2) + ';' + (u.alive ? '' : 'opacity:.5') + '"><div class="row"><span>' + U.esc(u.name.slice(0, 7)) + '</span><span class="small dim">' + (u.alive ? u.hp + '/' + u.mhp : 'KO') + '</span></div>' + U.bar(u.hp, u.mhp, '', 0) + (u.kind === 'hero' ? U.bar(u.mp, u.mmp, 'mp', 0) : '') + (st ? '<div class="small dim">' + st + '</div>' : '') + '</div>';
    });
    panelEl.innerHTML = h;
  }

  /* ---------- player commands ---------- */
  function targetCursor(list, label) {
    return new Promise(function (res) {
      var i = 0, cur = U.el('cur', '', { zIndex: 9 });
      function show() {
        var t = list[i]; cur.style.left = U.u(t.x - 3); cur.style.top = U.u(t.y - (t.kind === 'hero' ? 60 : (t.boss ? 56 : 46)));
        showMsg((label ? label + ': ' : '') + t.name + (t.side === 'f' ? '  HP ' + Math.max(0, Math.round(t.hp / t.mhp * 100)) + '%' : (t.alive ? '  ' + t.hp + '/' + t.mhp : '  KO')));
      }
      var h = { repeat: true, onKey: function (k) {
        if (k === 'left' || k === 'up') { i = (i - 1 + list.length) % list.length; FP.sfx.cursor(); show(); }
        else if (k === 'right' || k === 'down') { i = (i + 1) % list.length; FP.sfx.cursor(); show(); }
        else if (k === 'a') { FP.sfx.select(); done(list[i]); }
        else if (k === 'b') { FP.sfx.back(); done(null); }
      } };
      function done(v) { FP.popFocus(h); U.remove(cur); hideMsg(); res(v); }
      FP.pushFocus(h); show();
    });
  }
  async function chooseTarget(u, tgt) {
    if (tgt === 'e1') { var f = alive('f'); if (f.length === 1) return f[0]; return targetCursor(f, 'Target'); }
    if (tgt === 'a1') return targetCursor(alive('p'), 'Ally');
    if (tgt === 'dead') { var dd = party().filter(function (x) { return !x.alive; }); if (!dd.length) { await msg('No one has fallen.', 600); return null; } return dd.length === 1 ? dd[0] : targetCursor(dd, 'Revive'); }
    return u;
  }
  function needsTarget(sk) { return sk.tgt === 'e1' || sk.tgt === 'a1' || sk.tgt === 'dead'; }

  function listPick(items, o) {
    return new Promise(function (res) {
      var L = U.list(Object.assign({ x: 4, y: 52, w: 92, rows: Math.min(5, items.length), items: items, onSelect: function (i, it) { L.close(); res({ i: i, it: it }); }, onCancel: function () { L.close(); res(null); }, onMove: function (i, it) { if (o && o.desc) showMsg(o.desc(it)); } }, o || {}));
      L.el.style.zIndex = 11;
    });
  }
  async function chooseAction(u) {
    var G = FP.G;
    for (;;) {
      var items, pick;
      var main = u.kind === 'hero' ? ['Attack', 'Skills', 'Tether', 'Items', 'Guard', 'Flee'] : ['Attack', 'Moves', 'Guard', 'Back'];
      showMsg(u.name + ': what now?');
      pick = await listPick(main.map(function (t) { return { label: t }; }), { x: 4, y: 91, w: 70, rows: Math.min(4, main.length), cancel: true });
      if (!pick) { if (S.cmdIndex > 0) return { back: true }; continue; }
      var cmd = main[pick.i];
      if (cmd === 'Back') return { back: true };
      if (cmd === 'Attack') {
        var sk = basicAttack(u), tg = await chooseTarget(u, 'e1'); if (!tg) continue;
        return { u: u, sk: sk, target: tg };
      }
      if (cmd === 'Guard') return { u: u, guard: true };
      if (cmd === 'Flee') { return { u: u, flee: true }; }
      if (cmd === 'Skills' || cmd === 'Moves') {
        var list;
        if (u.kind === 'hero') list = G.skills.map(function (id) { var s = D.SK[id]; return { label: s.name, right: s.mp ? s.mp + 'MP' : '', off: (s.mp || 0) > u.mp, sk: s }; });
        else list = u.moves.map(function (id) { var s = D.SK[id]; return { label: s.name, right: 'x' + u.pp[id], off: u.pp[id] <= 0, sk: s }; });
        var sp = await listPick(list, { x: 4, y: 52, w: 112, rows: Math.min(5, list.length), desc: function (it) { return it.sk.desc || (it.sk.type ? (it.sk.el && it.sk.el !== 'none' ? D.ELS[it.sk.el] + ' damage' : 'Damage') : it.sk.name); } });
        hideMsg(); if (!sp) continue;
        var s2 = sp.it.sk, t2 = null;
        if (needsTarget(s2)) { t2 = await chooseTarget(u, s2.tgt); if (!t2) continue; }
        return { u: u, sk: s2, target: t2 };
      }
      if (cmd === 'Items') {
        var inv = Object.keys(G.inv).filter(function (id) { var it = D.ITEMS[id]; return G.inv[id] > 0 && it && (it.use === 'any' || it.use === 'dead' || it.use === 'battle' && !it.tether || it.use === 'kin'); }).map(function (id) { return { label: D.ITEMS[id].name, right: 'x' + G.inv[id], id: id }; });
        if (!inv.length) { await msg('You have nothing usable.', 700); continue; }
        var ip = await listPick(inv, { x: 4, y: 52, w: 112, rows: Math.min(5, inv.length), desc: function (it) { return D.ITEMS[it.id].desc; } });
        hideMsg(); if (!ip) continue;
        var item = D.ITEMS[ip.it.id], tt = null;
        if (item.use === 'battle') { return { u: u, item: ip.it.id }; }
        if (item.use === 'dead') { tt = await chooseTarget(u, 'dead'); if (!tt) continue; }
        else { tt = await chooseTarget(u, 'a1'); if (!tt) continue; }
        return { u: u, item: ip.it.id, target: tt };
      }
      if (cmd === 'Tether') {
        var cords = ['cord', 'strongcord'].filter(function (id) { return G.inv[id] > 0; }).map(function (id) { return { label: D.ITEMS[id].name, right: 'x' + G.inv[id], id: id }; });
        if (S.noTether) { await msg('Nothing here can be tethered.', 700); continue; }
        if (!cords.length) { await msg('You have no Tether Cords.', 700); continue; }
        var cand = alive('f').filter(function (x) { return x.kinFoe; });
        if (!cand.length) { await msg('Nothing here can be tethered.', 700); continue; }
        var cp = await listPick(cords, { x: 4, y: 52, w: 112, rows: cords.length, desc: function (it) { return D.ITEMS[it.id].desc; } });
        hideMsg(); if (!cp) continue;
        var tt2 = cand.length === 1 ? cand[0] : await targetCursor(cand, 'Tether'); if (!tt2) continue;
        return { u: u, tether: cp.it.id, target: tt2 };
      }
    }
  }

  /* ---------- foe AI ---------- */
  function foeAction(u) {
    var pl = alive('p'); if (!pl.length) return null;
    var taunter = pl.filter(function (x) { return x.buf.taunt; });
    var pool = taunter.length && Math.random() < 0.8 ? taunter : pl;
    var tgt = FP.pick(pool);
    var mvs = u.moves.map(function (id) { return D.SK[id]; }).filter(function (s) { return s && !(s.pp !== undefined && u.pp && u.pp[s.id] <= 0); });
    var choices = [];
    mvs.forEach(function (s) {
      var w = 3;
      if (s.heal && !s.type) { w = u.hp / u.mhp < 0.5 ? 6 : 0; }
      else if (s.buff && s.tgt === 'self') { w = (u.buf.def || u.buf.atk) ? 0 : 3; }
      else if (s.buff && s.tgt === 'aA') { w = (u.buf.atk) ? 0 : 3; }
      else if (s.tgt === 'eA') { w = pl.length >= 2 ? 4 : 1; }
      else if (s.debuff && !s.type) { w = tgt.buf.atk && tgt.buf.atk.v < 0 ? 0 : 2; }
      else if (u.ai === 'kin' && s.pp < 99) { w = 3; }
      if (w > 0) choices.push([s, w]);
    });
    if (u.ai !== 'boss') choices.push([basicAttack(u), 3]);
    var sum = choices.reduce(function (a, c) { return a + c[1]; }, 0), r = Math.random() * sum, pick = choices[0][0];
    for (var i = 0; i < choices.length; i++) { r -= choices[i][1]; if (r <= 0) { pick = choices[i][0]; break; } }
    if (pick.tgt === 'a1') { var fr = alive('f'); tgt = fr.sort(function (a, b) { return a.hp / a.mhp - b.hp / b.mhp; })[0]; }
    if (pick.tgt === 'self') tgt = u;
    return { u: u, sk: pick, target: tgt };
  }

  /* ---------- round loop ---------- */
  function checkEnd() {
    if (!alive('f').length) return 'win';
    var hero = S.units[0];
    if (!hero.alive) return 'lose';
    return null;
  }
  async function useItem(a) {
    var u = a.u, G = FP.G, it = D.ITEMS[a.item];
    G.inv[a.item]--; if (G.inv[a.item] <= 0) delete G.inv[a.item];
    await msg(u.name + ' used ' + it.name + '!', 500);
    var t = a.target;
    if (it.heal) { FP.sfx.heal(); heal(t, it.heal); burst(t, 'light', 8); }
    if (it.mp && t.kind === 'hero') { var g = Math.min(t.mmp - t.mp, it.mp); t.mp += g; floater(t, '+' + g, 'mp'); FP.sfx.heal(); }
    if (it.cleanse) { t.st = {}; FP.sfx.heal(); }
    if (it.revive && !t.alive) { t.alive = true; t.fade = 1; t.hp = Math.round(t.mhp * it.revive); floater(t, '+' + t.hp, 'heal'); FP.sfx.heal(); burst(t, 'light', 14); }
    if (it.dmg) {
      await FP.sleep(100);
      var fl = alive('f');
      for (var i = 0; i < fl.length; i++) { var v = Math.round(it.dmg * (0.9 + Math.random() * 0.2) * D.elemMult(it.el, fl[i].el)); burst(fl[i], it.el, 16); FP.sfx.magic(); await flashUnit(fl[i], 150); await hurt(fl[i], v); }
    }
    updatePanel();
    await FP.sleep(150);
  }
  async function tether(a) {
    var u = a.u, G = FP.G, t = a.target, cordId = a.tether, cord = D.ITEMS[cordId];
    G.inv[cordId]--; if (G.inv[cordId] <= 0) delete G.inv[cordId];
    await msg(u.name + ' hurls a ' + cord.name + '!', 500);
    var hpf = t.hp / t.mhp;
    var p = t.cap * (1.2 - 0.9 * hpf) * cord.tether * (1 + (u.tetherBonus || 0) + 0.12 * (FP.G.tetherBonus || 0));
    if (t.lured) p *= 1.3;
    if (t.st.stun || t.st.poison || t.st.burn || t.st.bleed) p *= 1.2;
    p = FP.clamp(p, 0.04, 0.97);
    FP.sfx.tether();
    /* the cord flies, then shakes */
    var cordFx = { x: u.x, y: u.y - 20, tx: t.x, ty: t.y - 16, p: 0 };
    S.cord = cordFx;
    for (var i = 0; i < 10; i++) { cordFx.p = i / 9; await FP.sleep(28); }
    t.fade = 0.0;
    var shakes = 0, ok = true;
    for (var k = 0; k < 3; k++) {
      await FP.sleep(380); FP.sfx.shake(); cordFx.wob = (k % 2) ? 1 : -1; shakes++;
      if (Math.random() > Math.pow(p, 1 / 2.2)) { ok = false; break; }
    }
    S.cord = null;
    if (ok) {
      FP.sfx.capture(); t.alive = false; t.captured = true; t.fade = 0;
      var kin = D.newKin(t.sp, t.lv); kin.hp = D.kinStats(kin).hp;
      FP.G.kin.push(kin);
      await msg(t.name + ' was tethered!', 900);
      S.caught.push(kin);
      updatePanel();
    } else {
      t.fade = 1; FP.sfx.miss(); burst(t, 'none', 10);
      await msg(shakes <= 1 ? 'It slipped out right away!' : (shakes === 2 ? 'So close!' : 'It broke free at the last second!'), 800);
    }
  }
  async function flee(a) {
    var u = a.u;
    if (S.noFlee) { await msg('There is no escape from this!', 800); return false; }
    await msg(u.name + ' tries to run!', 500);
    var ps = alive('p'), fs = alive('f');
    var sp = Math.max.apply(null, ps.map(function (x) { return stat(x, 'spd'); })), fsp = Math.max.apply(null, fs.map(function (x) { return stat(x, 'spd'); }));
    var p = FP.clamp(0.5 + (sp - fsp) * 0.04 + (S.fleeTries * 0.12), 0.3, 0.95);
    if (Math.random() < p) { S.over = 'flee'; FP.sfx.flee(); await msg('Got away safely!', 600); return true; }
    S.fleeTries++; await msg('Couldn\'t get away!', 600); return false;
  }
  async function runAction(a) {
    var u = a.u;
    if (!u.alive || S.over) return;
    if (u.st.stun) { await msg(u.name + ' is stunned!', 550); u.st.stun = 0; delete u.st.stun; return; }
    if (a.guard) { u.guard = true; await msg(u.name + ' braces.', 450); if (u.kind === 'hero') { var g = Math.max(1, Math.round(u.mmp * 0.08)); u.mp = Math.min(u.mmp, u.mp + g); floater(u, '+' + g, 'mp'); updatePanel(); } return; }
    if (a.flee) { await flee(a); return; }
    if (a.item) {
      if (D.ITEMS[a.item].flee) { var G = FP.G; G.inv[a.item]--; if (G.inv[a.item] <= 0) delete G.inv[a.item]; if (S.noFlee) { await msg('The smoke clears. There is no escape!', 800); return; } S.over = 'flee'; FP.sfx.flee(); await msg(u.name + ' vanishes in smoke!', 700); return; }
      await useItem(a); return;
    }
    if (a.tether) { await tether(a); return; }
    var sk = a.sk;
    if (u.kind === 'hero' && sk.mp && u.mp < sk.mp) { await msg('Not enough MP!', 500); return; }
    if (sk.tgt === 'e1' && (!a.target || !a.target.alive)) { var en = alive(u.side === 'p' ? 'f' : 'p'); if (!en.length) return; a.target = FP.pick(en); }
    if (sk.tgt === 'a1' && (!a.target || !a.target.alive)) a.target = u;
    await useSkill(u, sk, a.target);
  }
  async function endOfRound() {
    var units = S.units.filter(function (u) { return u.alive; });
    for (var i = 0; i < units.length; i++) {
      var u = units[i]; if (!u.alive) continue;
      u.guard = false;
      var k, dmg;
      for (k in u.st) {
        var def = D.STATUS[k];
        if (def && def.dot) { dmg = Math.max(1, Math.round(u.mhp * def.dot)); FP.sfx.hit(); await flashUnit(u, 120); u.hp = Math.max(1, u.hp - dmg); floater(u, dmg); updatePanel(); if (u.hp <= 1 && u.side === 'f' && u.hp - dmg <= 0) { u.hp = 0; await faint(u); break; } }
        u.st[k]--; if (u.st[k] <= 0) delete u.st[k];
      }
      if (u.buf.regen) { heal(u, Math.max(2, Math.round(u.mhp * 0.07))); }
      for (k in u.buf) { u.buf[k].t--; if (u.buf[k].t <= 0) delete u.buf[k]; }
    }
    updatePanel();
  }

  /* ---------- rewards ---------- */
  FP.addXp = async function (amount, silent) {
    var G = FP.G, msgs = [];
    G.xp += amount;
    while (G.lv < D.MAXLV && G.xp >= D.xpNeed(G.lv)) {
      G.xp -= D.xpNeed(G.lv); G.lv++; G.ap = (G.ap || 0) + D.AP_PER_LEVEL;
      var st = D.heroStats(G), before = G._lastStats || null;
      G.hp = Math.min(st.hp, G.hp + Math.round(D.CLASSES[G.cls].grow.hp)); G.mp = Math.min(st.mp, G.mp + Math.round(D.CLASSES[G.cls].grow.mp));
      var line = 'Level ' + G.lv + '! +' + D.AP_PER_LEVEL + ' ability points.';
      var cl = D.CLASSES[G.cls];
      cl.skills.forEach(function (sid, i) { if (D.SKILL_LV[i] === G.lv && G.skills.indexOf(sid) < 0) line += '\nNew skill ready: ' + D.SK[sid].name + '.'; });
      msgs.push(line);
    }
    return msgs;
  };
  async function kinXp(k, amount) {
    var out = [];
    k.xp = (k.xp || 0) + amount;
    while (k.lv < D.MAXLV && k.xp >= D.xpNeed(k.lv) * 0.8) {
      k.xp -= Math.round(D.xpNeed(k.lv) * 0.8); k.lv++;
      var old = D.kinMoves({ sp: k.sp, lv: k.lv - 1 });
      var st = D.kinStats(k); k.hp = Math.min(st.hp, (k.hp || 0) + 8);
      var line = D.kinName(k) + ' grew to Lv ' + k.lv + '!';
      D.kinMoves(k).forEach(function (m) { if (old.indexOf(m) < 0) line += '\n' + D.kinName(k) + ' learned ' + D.SK[m].name + '!'; });
      out.push(line);
    }
    return out;
  }
  async function victory() {
    var G = FP.G, xp = 0, gold = S.gold || 0, drops = [];
    S.units.forEach(function (u) { if (u.side === 'f') { xp += u.xp; gold += u.gold; if (u.drop && Math.random() < u.drop[1]) drops.push(u.drop[0]); if (!u.kinFoe && Math.random() < 0.08) drops.push('potion'); } });
    if (S.xpBonus) xp += S.xpBonus;
    hideMsg();
    if (FP.music) FP.music.jingle(S.boss ? 'fanfare' : 'victory');
    await FP.sleep(400);
    G.gold += gold;
    drops.forEach(function (d) { FP.addItem(d, 1); });
    var lines = ['Victory!\n+' + xp + ' XP   +' + gold + 'G'];
    if (drops.length) lines.push('Found: ' + drops.map(function (d) { return D.ITEMS[d].name; }).join(', ') + '.');
    var lv = await FP.addXp(xp);
    lv.forEach(function (l) { lines.push(l); });
    var gotKin = [];
    /* Kin xp */
    var act = (G.party || []).map(function (i) { return G.kin[i]; }).filter(Boolean);
    for (var i = 0; i < G.kin.length; i++) {
      var k = G.kin[i], isAct = act.indexOf(k) >= 0, share = isAct ? 0.85 : 0.25;
      if (S.caught && S.caught.indexOf(k) >= 0) continue;
      var kl = await kinXp(k, Math.round(xp * share));
      if (isAct) { k.bond = Math.min(10, (k.bond || 0) + (Math.random() < 0.34 ? 1 : 0)); kl.forEach(function (l) { lines.push(l); }); }
    }
    for (var j = 0; j < lines.length; j++) { if (/Level \d+!/.test(lines[j])) FP.sfx.level(); await U.say(null, lines[j], { instant: false }); }
  }

  /* ---------- build, run ---------- */
  function restoreHeroState(hero) {
    var G = FP.G; G.hp = Math.max(1, Math.min(hero.hp, D.heroStats(G).hp)); G.mp = Math.max(0, hero.mp);
  }
  B.start = async function (spec) {
    var G = FP.G, i;
    var units = [mkHero()];
    var act = (G.party || []).map(function (ix) { return G.kin[ix]; }).filter(Boolean).slice(0, 2);
    act.forEach(function (k) { units.push(mkKin(k)); });
    spec.foes.forEach(function (f) { units.push(mkFoe(f)); });
    S = { units: units, round: 0, over: null, gold: 0, caught: [], noFlee: !!(spec.noFlee || spec.boss), noTether: !!(spec.noTether || spec.boss || spec.rival), mercy: !!spec.mercy, hooks: spec.hooks || {}, boss: !!spec.boss, bg: spec.bg || 'meadow', fleeTries: 0, kinBonus: 0, cmdIndex: 0, xpBonus: spec.xpBonus || 0 };
    units.forEach(function (u) { if (u.kind === 'hero') { /* kin bonus from charms and class */ S.kinBonus = (u.base.kin || 0) + (u.cls === 'cinderbinder' ? 0.1 : 0); } });
    B.active = true; B.scene = S;
    fxList = [];
    place();
    FP.field.lock();
    if (FP.music) FP.music.play(spec.music || (spec.boss ? 'boss' : spec.rival ? 'boss' : 'battle'));
    FP.sfx.encounter();
    await U.fade(true, true, 140);
    FP.scene = B;
    panelEl = U.el('panel', '', { right: U.u(3), top: U.u(36 + 50), width: U.u(54), zIndex: 7, display: 'none' });
    panelEl.style.top = U.u(97); panelEl.style.right = U.u(3); panelEl.style.left = 'auto'; panelEl.style.width = U.u(48); panelEl.style.display = 'block'; panelEl.style.padding = U.u(2) + ' ' + U.u(3);
    updatePanel();
    await U.fade(false, false, 160);
    if (spec.intro) await msg(spec.intro, 900);
    else if (S.boss || spec.rival) await msg(foes()[0].name + ' appears!', 900);
    else await msg(foes().map(function (f) { return f.name; }).join(' & ') + ' appear' + (foes().length === 1 ? 's' : '') + '!', 750);
    if (S.hooks.start) { hideMsg(); await S.hooks.start(S); }
    /* main loop */
    while (!S.over) {
      S.round++;
      var actions = [], pl = alive('p'), idx = 0;
      /* commands */
      var order = pl.slice();
      while (idx < order.length) {
        S.cmdIndex = idx;
        var a = await chooseAction(order[idx]);
        if (a.back) { idx = Math.max(0, idx - 1); actions.length = idx; continue; }
        actions[idx] = a; idx++;
      }
      hideMsg();
      var qa = actions.slice();
      alive('f').forEach(function (f) { var fa = foeAction(f); if (fa) qa.push(fa); });
      qa.forEach(function (a) { a.spd = stat(a.u, 'spd') * (a.guard ? 99 : 1) + Math.random() * 3 + (a.item || a.tether ? 2 : 0); });
      qa.sort(function (x, y) { return y.spd - x.spd; });
      for (i = 0; i < qa.length; i++) {
        if (S.over) break;
        await runAction(qa[i]);
        var e = checkEnd(); if (e) { S.over = e; break; }
      }
      if (S.over) break;
      await endOfRound();
      var e2 = checkEnd(); if (e2) { S.over = e2; break; }
    }
    hideMsg();
    var result = S.over;
    var hero = S.units[0];
    /* write back */
    restoreHeroState(hero);
    var partyKin = party().filter(function (u) { return u.kind === 'kin'; });
    partyKin.forEach(function (u) { u.ref.hp = u.alive ? Math.max(1, u.hp) : Math.max(1, Math.round(u.mhp * 0.25)); });
    if (result === 'win') {
      await victory();
      if (S.hooks.win) await S.hooks.win(S);
    } else if (result === 'lose') {
      if (S.mercy) { G.hp = Math.max(1, Math.round(D.heroStats(G).hp * 0.5)); }
      else {
        if (FP.music) FP.music.jingle('defeat');
        await FP.sleep(300);
      }
    }
    U.remove(panelEl); panelEl = null;
    await U.fade(true, false, 220);
    FP.scene = FP.field; B.active = false; S = null;
    FP.field.unlock();
    var caught = result === 'win' || result === 'flee' ? null : null;
    FP.field.refresh();
    if (FP.music && FP.field.map) FP.music.play(FP.field.map.music);
    await U.fade(false, false, 220);
    return result;
  };

  B.wild = async function (zone) {
    var table = D.ZONES[zone]; if (!table) return null;
    var r = Math.random(), n = r < 0.4 ? 1 : r < 0.85 ? 2 : 3, foesL = [], sum = table.reduce(function (a, e) { return a + e[3]; }, 0);
    for (var i = 0; i < n; i++) {
      var q = Math.random() * sum, ch = table[0];
      for (var j = 0; j < table.length; j++) { q -= table[j][3]; if (q <= 0) { ch = table[j]; break; } }
      var id = ch[0].indexOf('k:') === 0 ? ch[0].slice(2) : ch[0];
      foesL.push({ id: id, lv: FP.ri(ch[1], ch[2]) });
    }
    var bgMap = { meadow: 'meadow', ashplain: 'ash', whisperwood: 'forest', coast: 'coast', beacon: 'beacon', highmoor: 'highmoor', crypt: 'crypt', archive: 'archive', cave: 'cave' };
    var res = await B.start({ foes: foesL, bg: bgMap[zone] || 'meadow' });
    if (res === 'lose') await FP.gameOver();
    return res;
  };

  /* ---------- scene hooks ---------- */
  B.update = function (dt) {
    var i;
    for (i = fxList.length - 1; i >= 0; i--) { var p = fxList[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; if (p.t >= p.life) fxList.splice(i, 1); }
    if (S) S.units.forEach(function (u) { if (u.shake > 0) u.shake -= dt; });
    B.t = (B.t || 0) + dt;
  };
  B.draw = function (g) {
    if (!S) return;
    FP.battleBG(g, S.bg);
    g.fillStyle = '#0d0b1a'; g.fillRect(0, 100, FP.W, FP.H - 100);
    var list = S.units.slice().sort(function (a, b) { return a.y - b.y; }), t = B.t || 0;
    list.forEach(function (u) {
      if (u.fade <= 0.01 && !u.alive) return;
      var x = u.x + u.ox + (u.shake > 0 ? Math.round((Math.random() - 0.5) * 3) : 0), y = u.y + u.oy;
      g.globalAlpha = Math.max(0, u.fade === undefined ? 1 : u.fade);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(u.x, u.y + 1, 14, 4, 0, 0, 7); g.fill();
      var bob = u.alive ? Math.sin(t * 3 + u.x * 0.1) * 0.8 : 0;
      var spr;
      if (u.side === 'p' && u.kind === 'hero') spr = art.charBig(FP.heroLook(), 'l', 2);
      else if (u.side === 'p') spr = art.creature(u.sp, true);
      else spr = u.sprite;
      var w = spr.width / (spr.hd || 1), h = spr.height / (spr.hd || 1);
      var dx = Math.round((x - w / 2) * FP.SS) / FP.SS, dy = Math.round((y - h + 2 + bob) * FP.SS) / FP.SS;
      if (u.side === 'p' && u.kind === 'hero') dy += 1;
      if (u.flash) { g.globalCompositeOperation = 'source-over'; g.drawImage(spr, dx, dy); g.globalCompositeOperation = 'lighter'; g.drawImage(spr, dx, dy); g.globalCompositeOperation = 'source-over'; }
      else g.drawImage(spr, dx, dy);
      g.globalAlpha = 1;
      if (u.alive && u.side === 'f') {
        var bw = 20, bx = Math.round(x - bw / 2), by = Math.round(dy - 3);
        g.fillStyle = '#000'; g.fillRect(bx - 1, by - 1, bw + 2, 4); g.fillStyle = '#e0524e'; g.fillRect(bx, by, Math.round(bw * u.hp / u.mhp), 2);
        var ic = 0; for (var k in u.st) { g.fillStyle = k === 'poison' ? '#a070ff' : k === 'burn' ? '#ff7a3d' : k === 'bleed' ? '#e0524e' : '#ffd23a'; g.fillRect(bx + ic * 4, by - 4, 3, 2); ic++; }
      }
      if (u.alive && u.side === 'p') { var st2 = 0; for (var k2 in u.st) { g.fillStyle = k2 === 'poison' ? '#a070ff' : k2 === 'burn' ? '#ff7a3d' : k2 === 'bleed' ? '#e0524e' : '#ffd23a'; g.fillRect(Math.round(x - 6) + st2 * 4, Math.round(dy - 2), 3, 2); st2++; } for (var kb in u.buf) { if (kb === 'taunt' || kb === 'regen') continue; g.fillStyle = u.buf[kb].v > 0 ? '#7affb0' : '#ff8a8a'; g.fillRect(Math.round(x - 6) + st2 * 4, Math.round(dy - 2), 3, 1); st2++; } }
    });
    if (S.cord) {
      var c = S.cord, cx = c.x + (c.tx - c.x) * c.p, cy = c.y + (c.ty - c.y) * c.p - Math.sin(c.p * 3.14) * 12 + (c.wob || 0) * 2;
      g.strokeStyle = '#f2c14e'; g.lineWidth = 1; g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(cx, cy); g.stroke();
      g.fillStyle = '#e8503a'; g.fillRect(Math.round(cx) - 2, Math.round(cy) - 2, 5, 5); g.fillStyle = '#fff'; g.fillRect(Math.round(cx), Math.round(cy) - 1, 1, 3);
    }
    fxList.forEach(function (p) { g.globalAlpha = Math.max(0, 1 - p.t / p.life); g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }); g.globalAlpha = 1;
  };
  B.scene = null;
  B.units = function () { return S ? S.units : []; };
  B.state = function () { return S; };
})(FP);
