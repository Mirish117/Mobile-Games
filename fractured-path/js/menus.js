/* The Fractured Path: title, character creation, field menus, shops, saving. */
(function (FP) {
  'use strict';
  var D = FP.D, art = FP.art, U = FP.ui;
  var M = FP.menus = {};

  /* ================================================================ game state helpers */
  FP.heroLook = function () {
    var G = FP.G; if (!G) return art.lookFor('vanguard', {});
    var k = G.cls + JSON.stringify(G.look);
    if (!FP._hlk || FP._hlk.k !== k) FP._hlk = { k: k, l: art.lookFor(G.cls, G.look) };
    return FP._hlk.l;
  };
  FP.addItem = function (id, n) { var G = FP.G; G.inv[id] = (G.inv[id] || 0) + (n || 1); FP.sfx.blip(); };
  FP.addGear = function (id) { var G = FP.G; G.gear.push(id); FP.sfx.chest(); };
  FP.healAll = function (full) {
    var G = FP.G, st = D.heroStats(G);
    G.hp = st.hp; G.mp = st.mp;
    G.kin.forEach(function (k) { k.hp = D.kinStats(k).hp; });
  };
  FP.newGame = function (spec) {
    var c = D.CLASSES[spec.cls];
    var G = FP.G = { v: 1, name: spec.name, arc: spec.arc, cls: spec.cls, look: spec.look, lv: 1, xp: 0, ap: 2, hp: 1, mp: 1, train: {}, skills: [c.start], equip: { weapon: 'w_' + D.fam(spec.cls) + '_0', armor: 'a_' + c.armor + '_0', charm: null }, temper: {}, inv: { potion: 3, cord: 3 }, gear: [], gold: 60, kin: [], party: [], flags: {}, opened: {}, map: null, x: 0, y: 0, dir: 'd', steps: 0, play: 0, shrine: null, objective: '', created: Date.now(), ch: 1 };
    var st = D.heroStats(G); G.hp = st.hp; G.mp = st.mp;
    return G;
  };
  M.saveGame = function () {
    var G = FP.G; if (!G) return false;
    var copy = JSON.parse(JSON.stringify(G));
    copy.x = FP.field.tx; copy.y = FP.field.ty; copy.dir = FP.field.dir; copy.map = FP.field.map ? FP.field.map.id : G.map;
    return FP.save.write(copy);
  };
  M.autosave = function (quiet) {
    var F = FP.field;
    if (!FP.G || !FP.G.flags || !FP.G.flags.started || !F || !F.map) return false;
    var ok = M.saveGame();
    if (ok && quiet !== true) U.toast('Saved', 900);
    return ok;
  };
  FP.loadSaved = function (data) {
    FP.G = data;
    var G = FP.G;
    G.flags = G.flags || {}; G.opened = G.opened || {}; G.inv = G.inv || {}; G.gear = G.gear || []; G.kin = G.kin || []; G.party = G.party || []; G.temper = G.temper || {}; G.train = G.train || {};
    return G;
  };

  /* ================================================================ generic panels */
  function textPanel(x, y, w, h, html, cls) {
    var p = U.panel(x, y, w, h, cls || ''); p.innerHTML = html; return p;
  }
  function statBar(label, v, max, col) {
    return '<div class="row small" style="margin-top:' + U.u(1) + '"><span style="width:' + U.u(22) + '">' + label + '</span><span style="flex:1;align-self:center"><div class="bar" style="height:' + U.u(3) + '"><i style="width:' + Math.round(100 * Math.min(1, v / max)) + '%;background:' + (col || 'var(--ui-hp)') + '"></i></div></span><span style="width:' + U.u(16) + ';text-align:right">' + v + '</span></div>';
  }
  function bigChar(look, scale, st) {
    var cv = art.charBig(look, 'l', scale || 2);
    return U.canvasEl(cv, cv.width / (cv.hd || 1), cv.height / (cv.hd || 1), st);
  }
  function pad(n, w) { n = String(n); while (n.length < w) n = ' ' + n; return n; }

  /* ================================================================ TITLE */
  var T = M.title = { t: 0, parts: [], bg: null };
  function titleBG() {
    var c = art.hdCanvas(FP.W, FP.H), g = c.getContext('2d'), rng = FP.mulberry32(404), i, x, y;
    var H = art.hdh;
    /* sky */
    var gr = g.createLinearGradient(0, 0, 0, 108); gr.addColorStop(0, '#05031a'); gr.addColorStop(0.35, '#1c1048'); gr.addColorStop(0.7, '#5a2a78'); gr.addColorStop(1, '#d85a78');
    g.fillStyle = gr; g.fillRect(0, 0, 160, 144);
    for (i = 0; i < 7; i++) H.blob(g, rng() * 160, 10 + rng() * 62, 20 + rng() * 26, i % 2 ? '#6a3aa8' : '#2a6aa8', 0.16);
    /* stars */
    for (i = 0; i < 110; i++) { var sx = rng() * 160, sy = rng() * 82, sr = 0.18 + rng() * 0.35; g.fillStyle = 'rgba(' + (rng() < 0.3 ? '255,226,190' : '216,208,255') + ',' + (0.4 + rng() * 0.6) + ')'; g.beginPath(); g.arc(sx, sy, sr, 0, 6.2832); g.fill(); }
    for (i = 0; i < 9; i++) { var fx = rng() * 160, fy = rng() * 60; H.blob(g, fx, fy, 3, '#ffffff', 0.5); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 0.2; g.beginPath(); g.moveTo(fx - 2, fy); g.lineTo(fx + 2, fy); g.moveTo(fx, fy - 2); g.lineTo(fx, fy + 2); g.stroke(); }
    /* the cracked moon */
    H.blob(g, 80, 46, 56, '#ffc8a0', 0.25); H.blob(g, 80, 46, 38, '#ffe6c8', 0.32);
    var mg = g.createRadialGradient(73, 38, 3, 80, 46, 24); mg.addColorStop(0, '#fffaf0'); mg.addColorStop(0.6, '#f3e6cc'); mg.addColorStop(1, '#c8b494');
    g.fillStyle = mg; g.beginPath(); g.arc(80, 46, 23, 0, 6.2832); g.fill();
    [[71, 39, 5], [88, 54, 4.4], [69, 57, 3], [90, 37, 3.2], [79, 29, 2.2], [82, 60, 2.2]].forEach(function (cr) {
      var cg = g.createRadialGradient(cr[0] + 0.8, cr[1] + 0.8, 0.2, cr[0], cr[1], cr[2]); cg.addColorStop(0, 'rgba(120,96,70,0.5)'); cg.addColorStop(0.8, 'rgba(160,136,106,0.3)'); cg.addColorStop(1, 'rgba(255,255,255,0.2)');
      g.fillStyle = cg; g.beginPath(); g.arc(cr[0], cr[1], cr[2], 0, 6.2832); g.fill();
    });
    var shade = g.createRadialGradient(72, 38, 14, 80, 46, 27); shade.addColorStop(0, 'rgba(40,20,70,0)'); shade.addColorStop(1, 'rgba(40,20,70,0.42)'); g.fillStyle = shade; g.beginPath(); g.arc(80, 46, 23, 0, 6.2832); g.fill();
    var crack = [[80, 22], [76.6, 30], [82.4, 37], [78, 45], [84.6, 51], [80, 59], [83, 69]];
    function path() { g.beginPath(); crack.forEach(function (p, k) { k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); }
    g.lineCap = 'round'; g.lineJoin = 'round';
    path(); g.strokeStyle = 'rgba(255,200,90,0.35)'; g.lineWidth = 4; g.stroke();
    path(); g.strokeStyle = '#1a0f2e'; g.lineWidth = 1.5; g.stroke();
    path(); g.strokeStyle = '#ffd97a'; g.lineWidth = 0.7; g.stroke();
    g.strokeStyle = '#ffd97a'; g.lineWidth = 0.45; g.beginPath(); g.moveTo(82.4, 37); g.lineTo(88, 34); g.moveTo(78, 45); g.lineTo(72, 48.4); g.moveTo(84.6, 51); g.lineTo(90, 55); g.stroke();
    /* far ridges with haze */
    function ridge(base, amp, col, seed, haze) {
      var r = FP.mulberry32(seed), pts = [], ph = r() * 6;
      for (x = -4; x <= 164; x += 3) pts.push([x, base + Math.sin(x / 17 + ph) * amp + Math.sin(x / 7.3 + ph * 2) * amp * 0.4 + (r() - 0.5) * amp * 0.5]);
      var rg = g.createLinearGradient(0, base - amp, 0, base + 30); rg.addColorStop(0, col[0]); rg.addColorStop(1, col[1]);
      g.fillStyle = rg; g.beginPath(); g.moveTo(-4, 150); pts.forEach(function (p) { g.lineTo(p[0], p[1]); }); g.lineTo(164, 150); g.closePath(); g.fill();
      if (haze) { var hz = g.createLinearGradient(0, base - amp - 6, 0, base + 22); hz.addColorStop(0, 'rgba(240,150,170,0)'); hz.addColorStop(0.5, 'rgba(240,150,170,' + haze * 0.6 + ')'); hz.addColorStop(1, 'rgba(240,150,170,0)'); g.fillStyle = hz; g.fillRect(0, base - amp - 6, 160, amp + 28); }
    }
    ridge(78, 5, ['#6a3a82', '#3a1c58'], 3, 0.25);
    /* tower and keep silhouettes on the far ridge */
    g.fillStyle = '#34184e'; g.fillRect(27.2, 64, 3.6, 17); g.beginPath(); g.moveTo(26, 64.4); g.lineTo(29, 59); g.lineTo(32, 64.4); g.closePath(); g.fill();
    g.fillRect(124, 70, 16, 12); g.fillRect(122, 65, 4.6, 17); g.fillRect(137.4, 65, 4.6, 17);
    [[122, 65], [137.4, 65]].forEach(function (p) { g.beginPath(); g.moveTo(p[0] - 0.6, p[1]); g.lineTo(p[0] + 2.3, p[1] - 4.6); g.lineTo(p[0] + 5.2, p[1]); g.closePath(); g.fill(); });
    [[28.6, 69], [129, 75], [123.8, 70], [139.2, 70]].forEach(function (p) { H.blob(g, p[0], p[1], 3, '#ffd97a', 0.7); g.fillStyle = '#ffe9a0'; g.fillRect(p[0] - 0.4, p[1] - 0.7, 0.9, 1.5); });
    ridge(88, 5, ['#4a2468', '#27123e'], 8, 0.18);
    ridge(99, 4, ['#2c1648', '#150a2c'], 15, 0);
    /* mist */
    for (i = 0; i < 6; i++) H.blob(g, 10 + i * 30, 96 + (i % 2) * 6, 22, '#c890c8', 0.12);
    /* ground and the Lantern Road */
    var fg = g.createLinearGradient(0, 100, 0, 144); fg.addColorStop(0, '#1a0c34'); fg.addColorStop(1, '#080414'); g.fillStyle = fg; g.fillRect(0, 100, 160, 44);
    function rc(t) { return 80 + Math.sin(t * 3.2 + 1.1) * (4 + t * 16); }
    function rw(t) { return 3 + t * 34; }
    var N = 90, L = [], R = [];
    for (i = 0; i <= N; i++) { var t = i / N, yy = 100 + t * 44; L.push([rc(t) - rw(t) / 2, yy]); R.push([rc(t) + rw(t) / 2, yy]); }
    var roadG = g.createLinearGradient(0, 100, 0, 144); roadG.addColorStop(0, 'rgba(160,150,210,0.7)'); roadG.addColorStop(1, 'rgba(236,230,255,0.98)');
    g.fillStyle = roadG; g.beginPath(); L.forEach(function (p, k) { k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); for (i = N; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath(); g.fill();
    /* cobble courses in perspective */
    for (i = 3; i < N; i += 3) { var tq = i / N; g.strokeStyle = 'rgba(70,58,120,' + (0.18 + tq * 0.3) + ')'; g.lineWidth = 0.2 + tq * 0.25; g.beginPath(); g.moveTo(L[i][0], L[i][1]); g.lineTo(R[i][0], R[i][1]); g.stroke(); }
    for (i = 0; i < 60; i++) { var tq2 = Math.pow(rng(), 0.7), yq = 100 + tq2 * 44, xq = rc(tq2) + (rng() - 0.5) * rw(tq2) * 0.9; g.fillStyle = 'rgba(255,255,255,' + (0.1 + rng() * 0.2) + ')'; g.fillRect(xq, yq, 0.3 + tq2, 0.2 + tq2 * 0.3); }
    /* the fracture: a gap in the road with glowing edges */
    var t1 = 0.34, t2 = 0.42, gy1 = 100 + t1 * 44, gy2 = 100 + t2 * 44;
    g.fillStyle = '#0a0418'; g.beginPath(); g.moveTo(rc(t1) - rw(t1) * 0.5, gy1); g.lineTo(rc(t1) + rw(t1) * 0.5, gy1 + 0.6); g.lineTo(rc(t2) + rw(t2) * 0.5, gy2); g.lineTo(rc(t2) - rw(t2) * 0.5, gy2 - 0.4); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,208,110,0.85)'; g.lineWidth = 0.35; g.beginPath(); g.moveTo(rc(t1) - rw(t1) * 0.5, gy1); g.lineTo(rc(t1) + rw(t1) * 0.5, gy1 + 0.6); g.stroke();
    g.strokeStyle = 'rgba(190,120,255,0.8)'; g.beginPath(); g.moveTo(rc(t2) - rw(t2) * 0.5, gy2 - 0.4); g.lineTo(rc(t2) + rw(t2) * 0.5, gy2); g.stroke();
    /* grass silhouettes at the road edges and trees */
    for (i = 0; i < 110; i++) { var tg = Math.pow(rng(), 0.8), side = rng() < 0.5 ? -1 : 1, gx = rc(tg) + side * (rw(tg) / 2 + 1 + rng() * 30 * (0.3 + tg)), gyy = 100 + tg * 44 + 1; var hgt = 1.5 + tg * 4 * (0.4 + rng()); g.strokeStyle = 'rgba(' + (12 + Math.floor(rng() * 20)) + ',6,' + (30 + Math.floor(rng() * 20)) + ',0.95)'; g.lineWidth = 0.35 + tg * 0.3; g.beginPath(); g.moveTo(gx, gyy); g.quadraticCurveTo(gx + (rng() - 0.5) * 2, gyy - hgt * 0.6, gx + (rng() - 0.5) * 3, gyy - hgt); g.stroke(); }
    [[8, 118, 14], [150, 112, 12], [24, 132, 18], [140, 134, 20]].forEach(function (tr) {
      g.fillStyle = '#0a0418'; g.beginPath(); g.moveTo(tr[0] - 1, tr[1] + 14); g.lineTo(tr[0] - 0.5, tr[1]); g.lineTo(tr[0] + 0.5, tr[1]); g.lineTo(tr[0] + 1, tr[1] + 14); g.fill();
      for (var k = 0; k < 5; k++) { g.beginPath(); g.arc(tr[0] + (rng() - 0.5) * tr[2] * 0.6, tr[1] - rng() * tr[2] * 0.4, tr[2] * (0.22 + rng() * 0.12), 0, 6.2832); g.fill(); }
    });
    var vg = g.createRadialGradient(80, 70, 40, 80, 70, 100); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(4,0,16,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, 160, 144);
    c.lamps = [];
    for (i = 0; i < 6; i++) { var tt = 0.05 + i * 0.17; c.lamps.push([rc(tt) - rw(tt) / 2 - 2.5, 100 + tt * 44, tt]); c.lamps.push([rc(tt) + rw(tt) / 2 + 2.5, 100 + tt * 44, tt]); }
    c.lamps.forEach(function (l) { var tt2 = l[2], hgt = 3 + tt2 * 7; g.fillStyle = '#0c0620'; g.fillRect(l[0] - 0.3 - tt2 * 0.3, l[1] - hgt, 0.6 + tt2 * 0.6, hgt); });
    return c;
  }
  T.update = function (dt) {
    T.t += dt;
    if (Math.random() < dt * 8) T.parts.push({ x: Math.random() * 160, y: 144, vx: (Math.random() - 0.5) * 6, vy: -(6 + Math.random() * 10), life: 6 + Math.random() * 4, t: 0 });
    for (var i = T.parts.length - 1; i >= 0; i--) { var p = T.parts[i]; p.t += dt; p.x += p.vx * dt + Math.sin(p.t * 2 + i) * 0.2; p.y += p.vy * dt; if (p.t > p.life || p.y < 0) T.parts.splice(i, 1); }
  };
  T.draw = function (g) {
    if (!T.bg) T.bg = titleBG();
    g.drawImage(T.bg, 0, 0);
    g.save(); g.globalCompositeOperation = 'lighter';
    T.bg.lamps.forEach(function (l, i) {
      var f = (Math.sin(T.t * 4 + i * 1.7) + 1) / 2, tt = l[2], hgt = 3 + tt * 7, r = 2.5 + tt * 5.5;
      var gr = g.createRadialGradient(l[0], l[1] - hgt, 0, l[0], l[1] - hgt, r); gr.addColorStop(0, 'rgba(255,226,122,' + (0.4 + 0.2 * f) + ')'); gr.addColorStop(1, 'rgba(255,200,90,0)');
      g.fillStyle = gr; g.fillRect(l[0] - r, l[1] - hgt - r, r * 2, r * 2);
      g.fillStyle = 'rgba(255,240,190,0.95)'; g.beginPath(); g.arc(l[0], l[1] - hgt, 0.5 + tt * 0.8, 0, 6.2832); g.fill();
    });
    T.parts.forEach(function (p) {
      var a = Math.min(1, (p.life - p.t) / 2, p.t); g.globalAlpha = a;
      var gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 1.8); gr.addColorStop(0, 'rgba(255,200,120,0.9)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gr; g.fillRect(p.x - 1.8, p.y - 1.8, 3.6, 3.6);
    });
    g.globalAlpha = 1;
    for (var i = 0; i < 8; i++) { var f2 = Math.sin(T.t * 1.6 + i * 2.3); if (f2 > 0.4) { var q = FP.hash(i, 5), sx = q % 160, sy = (q >> 8) % 70; var gr2 = g.createRadialGradient(sx, sy, 0, sx, sy, 3); gr2.addColorStop(0, 'rgba(255,255,255,' + (f2 - 0.4) + ')'); gr2.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr2; g.fillRect(sx - 3, sy - 3, 6, 6); } }
    g.restore();
  };
  M.showTitle = async function () {
    FP.scene = T; T.t = 0; FP.field.end && FP.field.end();
    U.clearAll();
    FP.G = null;
    if (FP.music) FP.music.play('title');
    var logo = U.el('title-logo', '<div class="t1">THE</div><div class="t2">FRACTURED</div><div class="t3">PATH</div>');
    var sub = U.el('coach', 'Press A', { bottom: U.u(48), color: 'var(--ui-hi)', animation: 'blink 1s steps(2) infinite' });
    await U.fade(false, false, 500);
    await U.waitKey(['a', 'menu']);
    sub.remove();
    for (;;) {
      var opts = ['New Journey', 'Continue', 'Import Save', 'Options'];
      var menu = await new Promise(function (res) {
        var L = U.list({ x: 40, y: 88, w: 80, rows: 4, items: opts.map(function (o) { return { label: o }; }), onSelect: function (i) { L.close(); res(i); } });
      });
      if (menu === 0) { if (await M.newJourney(logo)) return; }
      else if (menu === 1) { if (await M.continueJourney(logo)) return; }
      else if (menu === 2) { await M.importSave(); }
      else if (menu === 3) { await M.options(true); }
    }
  };
  M.continueJourney = async function (logo) {
    var saves = FP.save.list();
    if (!saves.length) { U.toast('No saved journeys on this device', 2200); return false; }
    logo.style.display = 'none';
    var d = await new Promise(function (res) {
      var head = textPanel(4, 3, 152, 14, '<div class="hi center">Saved journeys</div>');
      var info = U.panel(4, 84, 152, 56, 'alt');
      function show(i) {
        var s = saves[i], c = D.CLASSES[s.cls];
        info.innerHTML = '<div class="hi">' + U.esc(s.name) + '</div><div class="small dim">' + (s.arc === 'hero' ? 'Hero' : 'Villain') + ' ' + (c ? c.name : '') + '  Lv ' + s.lv + '</div>'
          + '<div class="small" style="margin-top:' + U.u(2) + '">' + U.esc(FP.mapTitle ? FP.mapTitle(s.map) : '') + '  ' + FP.timeStr(s.play || 0) + '</div>'
          + '<div class="small dim" style="margin-top:' + U.u(2) + ';line-height:' + U.u(8) + '">' + U.esc(s.objective || '') + '</div>';
      }
      var L = U.list({ x: 4, y: 18, w: 152, rows: 5, items: saves.map(function (s) { return { label: s.name, right: 'Lv ' + s.lv }; }), onMove: function (i) { show(i); },
        onSelect: function (i) { done(saves[i]); }, onCancel: function () { done(null); } });
      function done(v) { L.close(); U.remove(head); U.remove(info); res(v); }
      show(0);
    });
    logo.style.display = 'block';
    if (!d) return false;
    FP.loadSaved(d);
    await M.startField();
    return true;
  };
  M.importSave = async function () {
    var code = await U.pasteBox('Paste a save code', '', true);
    if (!code) return;
    var d = FP.save.importCode(code);
    if (!d) { U.toast('That code did not work', 1800); return; }
    var exists = FP.save.exists(d.name);
    if (exists && !(await U.confirm('Replace save', 'Cancel', { y: 100 }))) return;
    FP.save.write(d); U.toast('Imported "' + d.name + '"', 1800);
  };

  /* ================================================================ NEW JOURNEY */
  var ARCS = {
    hero: { title: "THE LAMPBEARER'S ROAD", sub: 'Hero', text: 'You are of Thistledown, a quiet village at the edge of the Whisperwood. When the Bell\'s song fails and the Kin run wild, you take up a lamp and walk the broken road to mend what was broken.' },
    villain: { title: 'THE CINDER ROAD', sub: 'Villain', text: 'You are Ashen, born in the walled valley of Cinderhold, where the Crown left your people to burn. The Bell\'s Chimes could free you, or crown you. You mean to take them.' }
  };
  M.newJourney = async function (logo) {
    logo.style.display = 'none';
    var name = await U.nameEntry({ title: 'Name your hero', sub: 'Saves are kept by this name', cancel: true });
    if (!name) { logo.style.display = 'block'; return false; }
    if (FP.save.exists(name)) {
      var d = FP.save.read(name);
      var over = await (async function () { var p = textPanel(10, 30, 140, 60, '<div class="center hi">"' + U.esc(name) + '" already has a journey.</div><div class="small dim center" style="margin-top:' + U.u(4) + '">Starting a new one will replace it.</div>'); var r = await U.choice(['Replace it', 'Go back'], { x: 40, y: 98, w: 80, cancel: 1 }); U.remove(p); return r === 0; })();
      if (!over) { logo.style.display = 'block'; return false; }
    }
    var spec = { name: name };
    for (;;) {
      var arc = await M.pickArc(); if (!arc) { logo.style.display = 'block'; return false; }
      spec.arc = arc;
      var cls = await M.pickClass(arc); if (!cls) continue;
      spec.cls = cls;
      var look = await M.pickLook(cls, name); if (!look) continue;
      spec.look = look;
      break;
    }
    FP.newGame(spec);
    await U.fade(true, false, 600);
    U.clearAll();
    await M.startFresh();
    return true;
  };
  M.pickArc = function () {
    return new Promise(function (res) {
      var panels = [];
      var head = textPanel(4, 3, 152, 14, '<div class="hi center">Choose your path</div>');
      var desc = textPanel(4, 74, 152, 66, '', '');
      var order = ['hero', 'villain'];
      var L = U.list({ x: 4, y: 20, w: 152, rows: 2, items: order.map(function (k) { return { label: ARCS[k].title }; }), onMove: function (i) { var a = ARCS[order[i]]; desc.innerHTML = '<div class="hi small">' + a.sub + '</div><div class="small" style="margin-top:' + U.u(3) + ';line-height:' + U.u(9) + '">' + U.esc(a.text) + '</div>'; },
        onSelect: function (i) { done(order[i]); }, onCancel: function () { done(null); } });
      function done(v) { L.close(); U.remove(head); U.remove(desc); res(v); }
    });
  };
  M.pickClass = function (arc) {
    return new Promise(function (res) {
      var ids = D.CLASS_ORDER[arc], pv = null;
      var head = textPanel(4, 3, 152, 14, '<div class="hi center">Choose your class</div>');
      var right = U.panel(4, 75, 152, 67, 'alt');
      function show(i) {
        var id = ids[i], c = D.CLASSES[id], look = art.lookFor(id, { skin: 1, hair: i, hs: i % 4, acc: 0 });
        right.innerHTML = '';
        var top = U.el('', '', { display: 'flex', gap: U.u(4) }, right);
        var wrap = U.el('', '', { width: U.u(48), height: U.u(54), display: 'grid', placeItems: 'center', flex: 'none' }, top);
        wrap.appendChild(U.canvasEl(art.charBig(look, 'l', 1.5)));
        var b = c.base;
        U.el('', '<div class="hi">' + c.name + '</div>'
          + '<div class="small" style="margin-top:' + U.u(1) + '">HP ' + Math.round(b.hp) + '  ATK ' + b.atk + '  MAG ' + b.mag + '<br>DEF ' + b.def + '  SPD ' + b.spd + '</div>'
          + '<div class="small dim" style="margin-top:' + U.u(2) + ';line-height:' + U.u(8) + '">' + U.esc(c.blurb) + '</div>', { flex: 1, minWidth: 0 }, top);
      }
      var L = U.list({ x: 4, y: 18, w: 152, rows: 4, items: ids.map(function (id) { return { label: D.CLASSES[id].name }; }), onMove: show, onSelect: function (i) { done(ids[i]); }, onCancel: function () { done(null); } });
      function done(v) { L.close(); U.remove(head); U.remove(right); res(v); }
    });
  };
  M.pickLook = function (cls, name) {
    return new Promise(function (res) {
      var head = textPanel(4, 3, 152, 14, '<div class="hi center">Your three forms</div>');
      var p = U.panel(4, 20, 152, 82, 'alt'); p.style.display = 'flex'; p.style.justifyContent = 'space-around'; p.style.alignItems = 'flex-end';
      var mid = (D.ASCEND[cls] || [])[0], ult = mid && (D.ULT[mid] || [])[0];
      [[cls, 'Basic'], [mid, 'Mid'], [ult, 'Ultimate']].forEach(function (f, i) {
        if (!f[0]) return;
        var col = U.el('', '', { display: 'flex', flexDirection: 'column', alignItems: 'center' }, p);
        col.appendChild(U.canvasEl(art.charBig(art.lookFor(f[0]), 'l', [1.6, 1.8, 2][i])));
        U.el('small dim', f[1], { marginTop: U.u(1) }, col);
      });
      var nm = textPanel(4, 104, 152, 12, '<div class="center small hi">' + U.esc(name) + ' the ' + D.CLASSES[cls].name + '</div>');
      var list = U.list({ x: 40, y: 119, w: 80, rows: 2, items: [{ label: 'Begin' }, { label: 'Back' }], onSelect: function (i) { done(i === 0 ? {} : null); }, onCancel: function () { done(null); } });
      function done(v) { list.close(); U.remove(head); U.remove(p); U.remove(nm); res(v); }
    });
  };
  M.startFresh = async function () {
    await FP.story.begin();
    await M.startField(true);
  };
  M.startField = async function (fresh) {
    var G = FP.G;
    FP.scene = FP.field;
    FP.field.begin();
    FP.field.enter(G.map, G.x, G.y, G.dir, { silent: false });
    G.flags.started = true;
    M.autosave(true);
    await U.fade(false, false, 500);
    if (FP.story.afterLoad) FP.story.afterLoad(fresh);
  };

  /* ================================================================ FIELD MENU */
  M.open = async function () {
    var F = FP.field, G = FP.G;
    F.lock(); FP.sfx.select();
    try {
      for (;;) {
        var res = await M.mainMenu();
        if (res === 'close') break;
        if (res === 'title') return;
      }
    } finally { F.unlock(); }
  };
  M.mainMenu = function () {
    return new Promise(function (res) {
      var G = FP.G, st = D.heroStats(G), cl = D.CLASSES[G.cls];
      var right = U.panel(76, 4, 80, 136, '');
      var mapN = FP.mapTitle(G.map);
      right.innerHTML = '<div class="hi">' + U.esc(G.name) + '</div><div class="small dim">' + (G.arc === 'hero' ? 'Hero' : 'Villain') + ' ' + cl.name + '</div>'
        + '<div class="row" style="margin-top:' + U.u(3) + '"><span>Lv ' + G.lv + '</span><span class="small dim">AP ' + (G.ap || 0) + '</span></div>'
        + '<div class="small" style="margin-top:' + U.u(3) + '">HP ' + G.hp + '/' + st.hp + '</div>' + U.bar(G.hp, st.hp) + '<div class="small" style="margin-top:' + U.u(2) + '">MP ' + G.mp + '/' + st.mp + '</div>' + U.bar(G.mp, st.mp, 'mp')
        + '<div class="small" style="margin-top:' + U.u(2) + '">XP ' + G.xp + '/' + D.xpNeed(G.lv) + '</div>' + U.bar(G.xp, D.xpNeed(G.lv), 'xp')
        + '<div class="small" style="margin-top:' + U.u(4) + '">' + G.gold + ' G</div><div class="small dim" style="margin-top:' + U.u(2) + '">' + FP.timeStr(G.play || 0) + '</div><div class="small dim" style="margin-top:' + U.u(2) + '">' + U.esc(mapN) + '</div>'
        + '<div class="small" style="margin-top:' + U.u(4) + ';line-height:' + U.u(8) + '">' + U.esc(G.objective || '') + '</div>';
      var items = ['Skills & AP', 'Gear', 'Items', 'Kin', 'Journal', 'Save', 'Options', 'Close'];
      var L = U.list({ x: 4, y: 4, w: 70, rows: 8, items: items.map(function (t) { return { label: t }; }),
        onSelect: async function (i) {
          var cur = items[i];
          L.blur();
          var r = null, back = null;
          if (cur !== 'Close') { back = U.panel(0, 0, 160, 144, ''); back.style.border = '0'; back.style.boxShadow = 'none'; }
          if (cur === 'Skills & AP') await M.skills();
          else if (cur === 'Gear') await M.gear();
          else if (cur === 'Items') await M.itemsMenu();
          else if (cur === 'Kin') await M.kinMenu();
          else if (cur === 'Journal') await M.journal();
          else if (cur === 'Save') await M.saveMenu();
          else if (cur === 'Options') { r = await M.options(false); }
          else if (cur === 'Close') { cleanup(); res('close'); return; }
          if (back) U.remove(back);
          if (r === 'title') { cleanup(); res('title'); return; }
          cleanup(); res('again');
        },
        onCancel: function () { cleanup(); res('close'); }, onMenu: function () { cleanup(); res('close'); } });
      function cleanup() { L.close(); U.remove(right); }
    });
  };
  /* ascension: pick one of two higher forms */
  M.pickAscension = function (forms, prev) {
    return new Promise(function (res) {
      var G = FP.G, head = textPanel(4, 3, 152, 14, '<div class="hi center">' + (prev ? 'Ultimate form' : 'Ascend your class') + '</div>');
      var info = U.panel(4, 46, 152, 94, 'alt');
      function show(i) {
        var id = forms[i], c = D.CLASSES[id], look = art.lookFor(id, G.look);
        info.innerHTML = '';
        var top = U.el('', '', { display: 'flex', gap: U.u(4) }, info);
        var w = U.el('', '', { width: U.u(48), height: U.u(54), display: 'grid', placeItems: 'center', flex: 'none' }, top);
        w.appendChild(U.canvasEl(art.charBig(look, 'l', 1.5)));
        var mods = Object.keys(c.mods || {}).map(function (k) { return k.toUpperCase() + ' +' + Math.round((c.mods[k] - 1) * 100) + '%'; }).join('  ');
        U.el('', '<div class="hi">' + c.name + '</div><div class="small dim">' + c.tag + '</div><div class="small" style="margin-top:' + U.u(2) + ';line-height:' + U.u(8) + '">' + U.esc(c.blurb) + '</div><div class="small hi" style="margin-top:' + U.u(2) + '">' + mods + '</div>', { flex: 1, minWidth: 0 }, top);
        var sk = c.skills.slice(prev ? D.CLASSES[prev].skills.length : 6).map(function (sid) { return D.SK[sid].name; });
        U.el('small', '<span class="hi">New skills</span><br>' + sk.join(', '), { marginTop: U.u(3), lineHeight: U.u(8) }, info);
      }
      var L = U.list({ x: 4, y: 18, w: 152, rows: 2, items: forms.map(function (id) { return { label: D.CLASSES[id].name }; }), onMove: show,
        onSelect: function (i) { done(forms[i]); }, onCancel: function () { done(null); } });
      function done(v) { L.close(); U.remove(head); U.remove(info); res(v); }
      show(0);
    });
  };

  M.journal = function () {
    return new Promise(function (res) {
      var G = FP.G, p = U.panel(4, 4, 152, 136);
      var chimes = ['dawnchime', 'tidechime', 'hollowchime', 'echochime'].map(function (id) { return (G.inv[id] ? '[x] ' : '[ ] ') + D.ITEMS[id].name; });
      var rescued = G.kin.length;
      p.innerHTML = '<div class="hi center">Journal</div><div class="small dim center" style="margin-top:' + U.u(2) + '">' + (G.arc === 'hero' ? "The Lampbearer's Road" : 'The Cinder Road') + '</div>'
        + '<div class="small hi" style="margin-top:' + U.u(5) + '">Now</div><div class="small" style="line-height:' + U.u(9) + ';margin-top:' + U.u(2) + '">' + U.esc(G.objective || 'Follow the road.') + '</div>'
        + '<div class="small hi" style="margin-top:' + U.u(6) + '">Chimes of the Hollow Bell</div><div class="small" style="line-height:' + U.u(9) + '">' + chimes.join('<br>') + '</div>'
        + '<div class="small hi" style="margin-top:' + U.u(6) + '">Kin gathered: ' + rescued + '</div>';
      var h = { onKey: function (k) { if (k === 'a' || k === 'b') { FP.popFocus(h); U.remove(p); res(); } } };
      FP.pushFocus(h);
    });
  };
  M.saveMenu = async function () {
    var G = FP.G;
    var ok = M.saveGame();
    FP.sfx.save();
    var i = await U.choice(['Saved to "' + G.name + '"', 'Export save code', 'Back'], { x: 10, y: 50, w: 140, cancel: 2 });
    if (i === 1) { var code = FP.save.exportCode(G.name); await U.pasteBox('Save code (keep it safe)', code, false); }
  };
  M.options = function (fromTitle) {
    return new Promise(function (res) {
      var S = FP.settings;
      function items() {
        var arr = [
          { label: 'Display', right: S.mode === 'green' ? 'Green' : 'Color' },
          { label: 'Music', right: S.music ? 'On' : 'Off' },
          { label: 'Sound FX', right: S.sfx ? 'On' : 'Off' },
          { label: 'Text speed', right: ['Slow', 'Normal', 'Fast'][S.textSpeed - 1] }
        ];
        if (!fromTitle) arr.push({ label: 'Quit to title' });
        arr.push({ label: 'Back' });
        return arr;
      }
      function toggle(i, d) {
        if (i === 0) { S.mode = S.mode === 'green' ? 'color' : 'green'; FP.applyMode(); }
        else if (i === 1) { S.music = !S.music; if (FP.music) FP.music.refresh(); }
        else if (i === 2) { S.sfx = !S.sfx; }
        else if (i === 3) { S.textSpeed = ((S.textSpeed - 1 + (d || 1) + 3) % 3) + 1; }
        FP.saveSettings(); L.setItems(items(), true);
      }
      var hint = U.panel(4, 112, 152, 26); hint.innerHTML = '<div class="small dim" style="line-height:' + U.u(8) + '">Green mode shows the game like an old handheld screen.</div>';
      var L = U.list({ x: 4, y: 12, w: 152, rows: 6, items: items(), onSide: function (d, it, i) { if (i <= 3) toggle(i, d); },
        onSelect: async function (i) {
          var arr = items();
          if (i <= 3) { toggle(i, 1); return; }
          if (arr[i].label === 'Quit to title') { if (await U.confirm('Save and quit', 'Cancel', { y: 100 })) { M.saveGame(); cleanup(); await FP.sleep(100); FP.field.unlock(); FP.field.end(); await U.fade(true, false, 300); await M.showTitle(); res('title'); } return; }
          cleanup(); res(null);
        }, onCancel: function () { cleanup(); res(null); } });
      function cleanup() { L.close(); U.remove(hint); }
    });
  };

  /* ---------- skills and ability points ---------- */
  M.skills = function () {
    return new Promise(function (res) {
      var G = FP.G, cl = D.CLASSES[G.cls];
      var head = U.panel(4, 4, 152, 14); var detail = U.panel(4, 112, 152, 28);
      function head2() { head.innerHTML = '<div class="row"><span class="hi">Skills & AP</span><span>AP ' + (G.ap || 0) + '</span></div>'; }
      function rowsList() {
        var rows = [];
        cl.skills.forEach(function (sid, i) {
          var s = D.SK[sid], known = G.skills.indexOf(sid) >= 0, need = D.SKILL_LV[i], cost = D.SKILL_AP[i];
          rows.push({ label: s.name, right: known ? 'Known' : (G.lv < need ? 'Lv' + need : cost + 'AP'), off: !known && (G.lv < need), sid: sid, kind: 'skill', i: i });
        });
        D.TRAIN.forEach(function (t) { var n = (G.train[t.id] || 0); rows.push({ label: t.name, right: n + '/' + t.max, kind: 'train', t: t }); });
        return rows;
      }
      function dtext(it) {
        if (!it) return '';
        if (it.kind === 'skill') { var s = D.SK[it.sid]; return '<div class="small hi">' + s.name + (s.mp ? '  ' + s.mp + ' MP' : '') + '</div><div class="small dim">' + U.esc(s.desc || '') + '</div>'; }
        return '<div class="small hi">' + it.t.name + '</div><div class="small dim">' + it.t.desc + '. Costs 1 AP.</div>';
      }
      head2();
      var L = U.list({ x: 4, y: 20, w: 152, rows: 7, items: rowsList(), allowOff: true, onMove: function (i, it) { detail.innerHTML = dtext(it); },
        onSelect: function (i, it) {
          if (it.kind === 'skill') {
            if (G.skills.indexOf(it.sid) >= 0) { U.toast('Already known'); return; }
            if (G.lv < D.SKILL_LV[it.i]) { U.toast('Reach level ' + D.SKILL_LV[it.i]); FP.sfx.nope(); return; }
            if ((G.ap || 0) < D.SKILL_AP[it.i]) { U.toast('Not enough AP'); FP.sfx.nope(); return; }
            G.ap -= D.SKILL_AP[it.i]; G.skills.push(it.sid); FP.sfx.level(); U.toast('Learned ' + D.SK[it.sid].name + '!');
          } else {
            var n = G.train[it.t.id] || 0;
            if (n >= it.t.max) { U.toast('Maxed'); return; }
            if ((G.ap || 0) < 1) { U.toast('Not enough AP'); FP.sfx.nope(); return; }
            G.ap--; G.train[it.t.id] = n + 1; FP.sfx.buff();
            var st = D.heroStats(G); if (it.t.id === 'vigor') { G.hp = Math.min(st.hp, G.hp + 6); G.mp = Math.min(st.mp, G.mp + 2); }
          }
          head2(); L.setItems(rowsList(), true); detail.innerHTML = dtext(L.item());
        }, onCancel: function () { L.close(); U.remove(head); U.remove(detail); res(); } });
      detail.innerHTML = dtext(L.item());
    });
  };

  /* ---------- gear ---------- */
  M.gear = function () {
    return new Promise(function (res) {
      var G = FP.G;
      var info = U.panel(4, 98, 152, 42);
      var slots = ['weapon', 'armor', 'charm'], L2 = null;
      function slotRows() { return slots.map(function (s) { var id = G.equip[s]; return { label: s[0].toUpperCase() + s.slice(1), right: id ? D.gearName(id, G.temper[id]) : '-' }; }); }
      function stats() {
        var st = D.heroStats(G);
        return 'HP ' + st.hp + '  MP ' + st.mp + '<br>ATK ' + st.atk + '  DEF ' + st.def + '<br>MAG ' + st.mag + '  RES ' + st.res + '  SPD ' + st.spd;
      }
      function refreshInfo() { info.innerHTML = '<div class="small" style="line-height:' + U.u(9) + '">' + stats() + '</div>'; }
      refreshInfo();
      var L = U.list({ x: 4, y: 4, w: 152, rows: 3, items: slotRows(), onCancel: function () { L.close(); U.remove(info); res(); },
        onSelect: function (i) {
          var slot = slots[i]; L.blur();
          var cand = G.gear.map(function (id, ix) { return { id: id, ix: ix }; }).filter(function (c) { var g = D.GEAR[c.id]; return g.slot === slot && D.canEquip(G.cls, g); });
          var cur = G.equip[slot];
          var rows = cand.map(function (c) { var g = D.GEAR[c.id]; return { label: D.gearName(c.id, G.temper[c.id]), right: gearBrief(g), c: c }; });
          rows.push({ label: cur ? 'Unequip' : 'Cancel', un: true });
          var preview = U.panel(4, 4, 152, 12);
          function gearBrief(g) { return (g.atk ? 'A' + g.atk : '') + (g.mag && (g.slot === 'weapon') ? ' M' + g.mag : '') + (g.def ? 'D' + g.def : '') + (g.res ? ' R' + g.res : ''); }
          var L2 = U.list({ x: 4, y: 18, w: 152, rows: 6, items: rows, onCancel: function () { close(); }, onSelect: function (ii, it) {
            if (it.un) { if (cur) { G.gear.push(cur); G.equip[slot] = null; FP.sfx.back(); } close(); return; }
            var old = G.equip[slot]; G.equip[slot] = it.c.id; G.gear.splice(it.c.ix, 1); if (old) G.gear.push(old); FP.sfx.select();
            var st = D.heroStats(G); G.hp = Math.min(G.hp, st.hp); G.mp = Math.min(G.mp, st.mp);
            close();
          } });
          function close() { L2.close(); U.remove(preview); L.focus(); L.setItems(slotRows(), true); refreshInfo(); }
          preview.innerHTML = '<div class="small dim">Equipped: ' + (cur ? U.esc(D.gearName(cur, G.temper[cur])) : 'nothing') + '</div>';
        } });
    });
  };

  /* ---------- items ---------- */
  M.itemsMenu = function () {
    return new Promise(function (res) {
      var G = FP.G;
      var desc = U.panel(4, 112, 152, 28);
      function rows() { return Object.keys(G.inv).filter(function (id) { return G.inv[id] > 0 && D.ITEMS[id]; }).map(function (id) { var it = D.ITEMS[id]; return { label: it.name, right: 'x' + G.inv[id], id: id, off: it.use === 'none' || it.use === 'battle' }; }); }
      var L = U.list({ x: 4, y: 4, w: 152, rows: 9, items: rows(), allowOff: true, onMove: function (i, it) { desc.innerHTML = it ? '<div class="small dim">' + U.esc(D.ITEMS[it.id].desc) + '</div>' : ''; },
        onCancel: function () { L.close(); U.remove(desc); res(); },
        onSelect: async function (i, it) {
          var item = D.ITEMS[it.id];
          if (item.use === 'none') { U.toast('Cannot use here'); return; }
          if (item.use === 'battle') { U.toast('Used in battle'); return; }
          L.blur();
          var tgt = await M.pickTarget(item.use === 'dead' ? 'dead' : 'any');
          if (tgt) {
            var used = M.useItemOn(it.id, tgt);
            if (used) { G.inv[it.id]--; if (G.inv[it.id] <= 0) delete G.inv[it.id]; FP.sfx.heal(); }
            else U.toast('No effect');
          }
          L.setItems(rows(), true); L.focus();
        } });
      if (!rows().length) { desc.innerHTML = '<div class="small dim">Your pack is empty.</div>'; }
      else desc.innerHTML = '<div class="small dim">' + U.esc(D.ITEMS[rows()[0].id].desc) + '</div>';
    });
  };
  M.useItemOn = function (id, tgt) {
    var G = FP.G, it = D.ITEMS[id], did = false;
    if (tgt.hero) {
      var st = D.heroStats(G);
      if (it.heal && G.hp < st.hp && G.hp > 0) { G.hp = Math.min(st.hp, G.hp + it.heal); did = true; }
      if (it.mp && G.mp < st.mp) { G.mp = Math.min(st.mp, G.mp + it.mp); did = true; }
    } else {
      var k = tgt.kin, ks = D.kinStats(k);
      if ((it.heal || it.revive) && (k.hp || 0) < ks.hp) { k.hp = Math.min(ks.hp, (k.hp || 0) + (it.heal || Math.round(ks.hp * (it.revive || 0)))); did = true; }
    }
    return did;
  };
  M.pickTarget = function (kind) {
    return new Promise(function (res) {
      var G = FP.G, rows = [{ label: G.name, right: G.hp + '/' + D.heroStats(G).hp, hero: true }];
      G.party.forEach(function (ix) { var k = G.kin[ix]; if (k) rows.push({ label: D.kinName(k), right: (k.hp || 0) + '/' + D.kinStats(k).hp, kin: k }); });
      var L = U.list({ x: 40, y: 40, w: 112, rows: rows.length, title: 'Use on', items: rows, onSelect: function (i, it) { L.close(); res(it); }, onCancel: function () { L.close(); res(null); } });
      L.el.style.zIndex = 20;
    });
  };

  /* ---------- Kin ---------- */
  M.kinMenu = function () {
    return new Promise(function (res) {
      var G = FP.G;
      var info = U.panel(4, 84, 152, 56);
      function rows() { return G.kin.map(function (k, i) { var slot = G.party.indexOf(i); return { label: D.kinName(k), right: (slot >= 0 ? '*' + (slot + 1) + ' ' : '') + 'L' + k.lv, k: k, i: i }; }); }
      function show(it) {
        if (!it) { info.innerHTML = '<div class="small dim">No Kin yet. Rescue, Tether, or adopt one.</div>'; return; }
        var k = it.k, sp = D.KIN[k.sp], st = D.kinStats(k), mv = D.kinMoves(k).map(function (m) { return D.SK[m].name; });
        info.innerHTML = '<div class="row"><span class="hi">' + U.esc(D.kinName(k)) + '</span><span class="small dim">' + (D.ELS[sp.el] || '') + '</span></div><div class="small" style="line-height:' + U.u(8) + '">HP ' + (k.hp || 0) + '/' + st.hp + '  ATK ' + st.atk + '  DEF ' + st.def + '<br>MAG ' + st.mag + '  SPD ' + st.spd + '  Bond ' + (k.bond || 0) + '<br>' + U.esc(mv.join(', ')) + '</div>';
      }
      var L = U.list({ x: 4, y: 4, w: 152, rows: 6, items: rows(), onMove: function (i, it) { show(it); }, onCancel: function () { L.close(); U.remove(info); res(); },
        onSelect: async function (i, it) {
          L.blur();
          var opts = ['Set as Slot 1', 'Set as Slot 2', 'Remove from party', 'Release', 'Back'];
          var c = await U.choice(opts, { x: 56, y: 40, w: 100, cancel: 4 });
          if (c === 0 || c === 1) {
            var idx = it.i, cur = G.party.slice();
            var ex = cur.indexOf(idx); if (ex >= 0) cur.splice(ex, 1);
            cur[c] = idx; cur = cur.filter(function (x) { return x !== undefined; });
            G.party = cur.slice(0, 2); FP.sfx.select();
          } else if (c === 2) { G.party = G.party.filter(function (x) { return x !== it.i; }); }
          else if (c === 3) {
            if (await U.confirm('Release ' + D.kinName(it.k), 'Keep', { y: 100 })) {
              var rid = it.i; G.kin.splice(rid, 1); G.party = G.party.filter(function (x) { return x !== rid; }).map(function (x) { return x > rid ? x - 1 : x; });
              FP.sfx.flee();
            }
          }
          L.setItems(rows(), true); show(L.item()); L.focus();
        } });
      show(L.item());
    });
  };

  /* ================================================================ SHOPS */
  function stockFor(key) {
    var G = FP.G, shop = D.SHOPS[key], list = [], seen = {};
    shop.items.forEach(function (id) { list.push({ kind: 'item', id: id, price: D.ITEMS[id].price }); });
    (shop.gear || []).forEach(function (tk) { D.TIERSHOP(G.cls, tk).forEach(function (id) { var g = D.GEAR[id]; if (g && g.price > 0 && !seen[id]) { seen[id] = 1; list.push({ kind: 'gear', id: id, price: g.price }); } }); });
    (D.CHARMSHOP[key] || []).forEach(function (id) { list.push({ kind: 'gear', id: id, price: D.GEAR[id].price }); });
    return list;
  }
  function gearLine(g) {
    var parts = []; ['atk', 'mag', 'def', 'res', 'spd', 'hp', 'mp'].forEach(function (k) { if (g[k]) parts.push(k.toUpperCase() + '+' + g[k]); });
    if (g.crit) parts.push('CRIT+' + Math.round(g.crit * 100) + '%'); if (g.kin) parts.push('KIN+' + Math.round(g.kin * 100) + '%'); if (g.tether) parts.push('TETHER+' + Math.round(g.tether * 100) + '%');
    return parts.join(' ');
  }
  M.shop = function (key) {
    return new Promise(function (res) {
      var G = FP.G, stock = stockFor(key), qty = 1;
      var head = U.panel(4, 3, 152, 12); var detail = U.panel(4, 106, 152, 34);
      function hd() { head.innerHTML = '<div class="row"><span class="hi">' + U.esc(D.SHOPS[key].name) + '</span><span>' + G.gold + ' G</span></div>'; }
      hd();
      function rows() { return stock.map(function (s) { var name = s.kind === 'item' ? D.ITEMS[s.id].name : D.GEAR[s.id].name; var own = s.kind === 'item' ? (G.inv[s.id] || 0) : (G.gear.indexOf(s.id) >= 0 ? 1 : 0) + (G.equip.weapon === s.id || G.equip.armor === s.id || G.equip.charm === s.id ? 1 : 0); var off = s.kind === 'gear' && !D.canEquip(G.cls, D.GEAR[s.id]); return { label: name + (own ? ' (' + own + ')' : ''), right: s.price + 'G', s: s, off: off || G.gold < s.price }; }); }
      function dt(it) {
        if (!it) return '';
        var s = it.s;
        if (s.kind === 'item') return '<div class="small dim">' + U.esc(D.ITEMS[s.id].desc) + '</div><div class="small dim" style="margin-top:' + U.u(2) + '">Left/Right: quantity ' + qty + '</div>';
        var g = D.GEAR[s.id], cur = G.equip[g.slot], cg = cur && D.GEAR[cur];
        return '<div class="small hi">' + gearLine(g) + '</div><div class="small dim" style="margin-top:' + U.u(2) + '">' + (cg ? 'Now: ' + U.esc(cg.name) + ' ' + gearLine(cg) : 'Now: nothing') + (D.canEquip(G.cls, g) ? '' : '<br>Your class cannot use this') + '</div>';
      }
      var L = U.list({ x: 4, y: 17, w: 152, rows: 7, items: rows(), allowOff: true, onMove: function (i, it) { qty = 1; detail.innerHTML = dt(it); },
        onSide: function (d, it) { if (it && it.s.kind === 'item') { qty = FP.clamp(qty + d, 1, 9); detail.innerHTML = dt(it); } },
        onSelect: function (i, it) {
          var s = it.s, n = s.kind === 'item' ? qty : 1, total = s.price * n;
          if (s.kind === 'gear' && !D.canEquip(G.cls, D.GEAR[s.id])) { U.toast('Your class cannot use it'); FP.sfx.nope(); return; }
          if (G.gold < total) { U.toast('Not enough gold'); FP.sfx.nope(); return; }
          G.gold -= total; FP.sfx.coin();
          if (s.kind === 'item') FP.addItem(s.id, n); else { G.gear.push(s.id); }
          hd(); L.setItems(rows(), true); detail.innerHTML = dt(L.item()); U.toast('Bought ' + (s.kind === 'item' ? D.ITEMS[s.id].name : D.GEAR[s.id].name));
        }, onCancel: function () { L.close(); U.remove(head); U.remove(detail); res(); } });
      detail.innerHTML = dt(L.item());
    });
  };
  M.sell = function () {
    return new Promise(function (res) {
      var G = FP.G;
      var head = U.panel(4, 3, 152, 12); var detail = U.panel(4, 112, 152, 28);
      function hd() { head.innerHTML = '<div class="row"><span class="hi">Sell</span><span>' + G.gold + ' G</span></div>'; }
      hd();
      function rows() {
        var r = [];
        Object.keys(G.inv).forEach(function (id) { var it = D.ITEMS[id]; if (it && !it.key && G.inv[id] > 0 && it.price) r.push({ label: it.name, right: 'x' + G.inv[id] + ' ' + Math.floor(it.price / 2) + 'G', kind: 'item', id: id, val: Math.floor(it.price / 2) }); });
        G.gear.forEach(function (id, ix) { var g = D.GEAR[id]; r.push({ label: g.name, right: Math.max(5, Math.floor((g.price || 40) / 2)) + 'G', kind: 'gear', id: id, ix: ix, val: Math.max(5, Math.floor((g.price || 40) / 2)) }); });
        return r;
      }
      var L = U.list({ x: 4, y: 17, w: 152, rows: 7, items: rows(), onCancel: function () { L.close(); U.remove(head); U.remove(detail); res(); },
        onSelect: function (i, it) {
          G.gold += it.val; FP.sfx.coin();
          if (it.kind === 'item') { G.inv[it.id]--; if (G.inv[it.id] <= 0) delete G.inv[it.id]; } else G.gear.splice(it.ix, 1);
          hd(); L.setItems(rows(), true);
        } });
      detail.innerHTML = '<div class="small dim">Items sell for half their price.</div>';
    });
  };
  M.inn = async function (price, who) {
    var G = FP.G;
    if (G.gold < price) { await U.say(who, 'You are a little short. Come back when you have ' + price + ' gold.'); return; }
    G.gold -= price;
    await U.fade(true, false, 300);
    FP.healAll(true); FP.sfx.heal();
    if (FP.music) FP.music.jingle('levelup');
    await FP.sleep(900);
    await U.fade(false, false, 300);
    await U.say(who, 'Sleep well? You look much better.');
    M.autosave();
  };
  M.restHere = async function () {
    await U.fade(true, false, 300); FP.healAll(true); FP.sfx.heal(); await FP.sleep(700); await U.fade(false, false, 300); U.toast('Rested.');
  };
  M.smith = function () {
    return new Promise(function (res) {
      var G = FP.G;
      var head = U.panel(4, 3, 152, 12); var detail = U.panel(4, 100, 152, 40);
      function hd() { head.innerHTML = '<div class="row"><span class="hi">Tempering</span><span>' + G.gold + 'G  Ore ' + (G.inv.ore || 0) + '</span></div>'; }
      hd();
      var MAXT = 5;
      function rows() {
        var r = [];
        ['weapon', 'armor'].forEach(function (slot) {
          var id = G.equip[slot]; if (!id) return;
          var g = D.GEAR[id], n = G.temper[id] || 0;
          r.push({ label: g.name + ' +' + n, right: n >= MAXT ? 'MAX' : (D.temperCost(g, n + 1).gold + 'G+1o'), id: id, slot: slot, n: n, off: n >= MAXT });
        });
        r.push({ label: 'Buy Ember Ore', right: '60G', ore: true, off: G.gold < 60 });
        return r;
      }
      function dt(it) { if (!it) return ''; if (it.ore) return '<div class="small dim">Ore is needed to temper. Foes of stone and steel drop it.</div>'; return '<div class="small dim" style="line-height:' + U.u(8) + '">Each +1 sharpens or toughens your ' + it.slot + '. Cost rises with each step. Max +' + MAXT + '.</div>'; }
      var L = U.list({ x: 4, y: 17, w: 152, rows: 3, items: rows(), allowOff: true, onMove: function (i, it) { detail.innerHTML = dt(it); }, onCancel: function () { L.close(); U.remove(head); U.remove(detail); res(); },
        onSelect: function (i, it) {
          if (it.ore) { if (G.gold < 60) { U.toast('Not enough gold'); FP.sfx.nope(); return; } G.gold -= 60; FP.addItem('ore', 1); FP.sfx.coin(); hd(); L.setItems(rows(), true); return; }
          var g = D.GEAR[it.id], cost = D.temperCost(g, it.n + 1);
          if (it.n >= MAXT) { U.toast('Already at max'); return; }
          if (G.gold < cost.gold || (G.inv.ore || 0) < cost.ore) { U.toast('Need ' + cost.gold + 'G and ' + cost.ore + ' ore'); FP.sfx.nope(); return; }
          G.gold -= cost.gold; G.inv.ore -= cost.ore; if (G.inv.ore <= 0) delete G.inv.ore;
          G.temper[it.id] = it.n + 1; FP.sfx.level(); U.toast(g.name + ' +' + (it.n + 1) + '!');
          hd(); L.setItems(rows(), true);
        } });
      detail.innerHTML = dt(L.item());
    });
  };
  M.kinShop = function (key) {
    return new Promise(function (res) {
      var G = FP.G, list = D.KINSHOPS[key];
      var head = U.panel(4, 3, 152, 12); var detail = U.panel(4, 94, 152, 46);
      function hd() { head.innerHTML = '<div class="row"><span class="hi">Adopt a Kin</span><span>' + G.gold + ' G</span></div>'; }
      hd();
      var lvl = Math.max(2, Math.floor(G.lv * 0.8));
      var rows = list.map(function (id) { var sp = D.KIN[id]; return { label: sp.name, right: sp.price + 'G', id: id }; });
      function dt(it) { var sp = D.KIN[it.id]; var mv = sp.moves.slice(0, 3).map(function (m) { return D.SK[m[1]].name; }).join(', '); return '<div class="small hi">' + sp.name + '  ' + (D.ELS[sp.el] || '') + '  Lv ' + lvl + '</div><div class="small dim" style="line-height:' + U.u(8) + '">' + U.esc(sp.desc) + '<br>' + U.esc(mv) + '</div>'; }
      var L = U.list({ x: 4, y: 17, w: 152, rows: Math.min(5, rows.length), items: rows, onMove: function (i, it) { detail.innerHTML = dt(it); }, onCancel: function () { L.close(); U.remove(head); U.remove(detail); res(); },
        onSelect: async function (i, it) {
          var sp = D.KIN[it.id];
          if (G.gold < sp.price) { U.toast('Not enough gold'); FP.sfx.nope(); return; }
          L.blur();
          if (await U.confirm('Adopt for ' + sp.price + 'G', 'No', { y: 70 })) {
            G.gold -= sp.price; var k = D.newKin(it.id, lvl); G.kin.push(k); if (G.party.length < 2) G.party.push(G.kin.length - 1);
            FP.sfx.capture(); hd(); U.toast(sp.name + ' joined you!');
          }
          L.focus();
        } });
      detail.innerHTML = dt(L.item());
    });
  };

  /* ================================================================ GAME OVER */
  FP.mapTitle = function (id) { try { return FP.getMap(id).name || ''; } catch (e) { return ''; } };
  FP.gameOver = async function () {
    var G = FP.G, F = FP.field;
    F.lock();
    await FP.sleep(500);
    var p = U.el('', '<div class="center hi" style="margin-top:' + U.u(50) + '">You fell.</div><div class="center small dim" style="margin-top:' + U.u(6) + '">The light finds you again.</div>', { position: 'absolute', inset: 0, background: '#000', zIndex: 40 });
    await FP.sleep(2200);
    var lost = Math.floor(G.gold * 0.1); G.gold -= lost;
    FP.healAll(true);
    var home = G.shrine || { map: G.arc === 'hero' ? 'thistle' : 'cinder', x: 23, y: 21, dir: 'u' };
    if (!FP.getMap(home.map)) home = { map: 'thistle', x: 23, y: 21, dir: 'u' };
    F.enter(home.map, home.x, home.y, home.dir || 'd', { silent: true });
    if (FP.G.map && FP.G.map !== home.map) FP.G.map = home.map;
    U.remove(p);
    F.unlock();
    await U.fade(false, false, 300);
    if (lost) U.toast('Lost ' + lost + ' G');
  };
})(FP);
