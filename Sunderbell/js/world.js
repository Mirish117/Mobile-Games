/* Sunderbell - world: maps, tiles, collision, camera, rendering, lighting. */
(function () {
  'use strict';
  var SB = window.SB, T = 16;
  var W = SB.W = {
    map: null, mapId: null, tiles: null, ents: [], fx: [], cam: { x: 0, y: 0 }, time: 0,
    shake: 0, tint: null, fade: { a: 0, color: '#000' }, flash: { a: 0, color: '#fff' },
    vw: 320, vh: 200, scale: 3, buf: null, bctx: null, canvas: null, ctx: null, cutscene: 0, paused: false
  };

  /* ---------------- canvas sizing (integer pixel scaling) ---------------- */
  W.init = function () {
    W.canvas = document.getElementById('game'); W.ctx = W.canvas.getContext('2d');
    W.buf = document.createElement('canvas'); W.bctx = W.buf.getContext('2d');
    W.dark = document.createElement('canvas'); W.dctx = W.dark.getContext('2d');
    window.addEventListener('resize', W.resize); window.addEventListener('orientationchange', function () { setTimeout(W.resize, 250); });
    W.resize();
  };
  W.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 3), w = window.innerWidth, h = window.innerHeight;
    W.canvas.width = Math.floor(w * dpr); W.canvas.height = Math.floor(h * dpr);
    W.canvas.style.width = w + 'px'; W.canvas.style.height = h + 'px';
    var target = Math.min(w, h) === h ? 168 : 260; /* landscape: ~13 tiles tall. portrait: a little more room */
    var s = Math.max(1, Math.floor(W.canvas.height / target)); if (W.canvas.height / s > 230) s++;
    W.scale = s; W.vw = Math.ceil(W.canvas.width / s); W.vh = Math.ceil(W.canvas.height / s);
    W.buf.width = W.vw; W.buf.height = W.vh; W.dark.width = W.vw; W.dark.height = W.vh;
    W.bctx.imageSmoothingEnabled = false; W.ctx.imageSmoothingEnabled = false;
  };

  /* ---------------- tiles ---------------- */
  W.tileAt = function (tx, ty) { if (!W.tiles || ty < 0 || tx < 0 || ty >= W.tiles.length || tx >= W.tiles[0].length) return ' '; return W.tiles[ty][tx]; };
  W.tileDef = function (ch) { return SB.D.tiles[ch] || SB.D.tiles['.'] || {}; };
  W.overrides = {}; /* tileswap results, key "x,y" -> char (recomputed every frame) */
  W.effTile = function (tx, ty) { var o = W.overrides[tx + ',' + ty]; return o !== undefined ? o : W.tileAt(tx, ty); };
  W.setTile = function (tx, ty, ch, persist) {
    if (!W.tiles[ty]) return; W.tiles[ty][tx] = ch; W.layerDirty = true;
    if (persist) { var G = SB.G, m = G.tileMods[W.mapId] = G.tileMods[W.mapId] || {}; m[ty * W.map.w + tx] = ch; }
  };
  W.tileSolid = function (tx, ty, fly) {
    var ch = W.effTile(tx, ty); if (ch === ' ' && (tx < 0 || ty < 0 || tx >= W.map.w || ty >= W.map.h)) return true;
    var d = W.tileDef(ch); if (!d.solid) return false;
    if (fly && (d.kind === 'water' || d.kind === 'lava')) return false;
    return true;
  };

  /* ---------------- map loading ---------------- */
  W.load = function (mapId, tx, ty, dir) {
    var D = SB.D, m = D.maps[mapId]; if (!m) { console.warn('no map', mapId); return; }
    W.map = m; W.mapId = mapId; W.fx = []; W.overrides = {}; W.layerDirty = true; W.layerSig = ''; W.parts = []; W.animTiles = [];
    W.tiles = m.tiles.map(function (r) { return r.split(''); });
    var mods = SB.G.tileMods[mapId]; if (mods) Object.keys(mods).forEach(function (i) { var x = i % m.w, y = Math.floor(i / m.w); if (W.tiles[y]) W.tiles[y][x] = mods[i]; });
    W.ents = [];
    m.ents.forEach(function (d) { var e = SB.Actors.make(d); if (e) W.ents.push(e); });
    SB.Party.place(tx * T + 8, ty * T + 12, dir || 'down');
    W.snapCam = true; W.updateCam(1);
    W.applyMusic();
    SB.G.map = mapId;
  };
  W.applyMusic = function () {
    if (W.musicLock) return; var m = W.map, id = m.music;
    (m.musicIf || []).forEach(function (p) { if (SB.cond(p[0], SB.ctx)) id = p[1]; });
    SB.audio.music(id || 'none');
  };
  W.fogOn = function () { var m = W.map; return !!(m && (m.fog || (m.fogIf && SB.cond(m.fogIf, SB.ctx)))); };

  /* ---------------- collision ---------------- */
  /* box = feet rectangle centred at (x, y-h/2) */
  W.boxFree = function (x, y, w, h, self, fly) {
    var x0 = x - w / 2, y0 = y - h, x1 = x + w / 2 - .01, y1 = y - .01;
    var tx0 = Math.floor(x0 / T), tx1 = Math.floor(x1 / T), ty0 = Math.floor(y0 / T), ty1 = Math.floor(y1 / T);
    for (var ty = ty0; ty <= ty1; ty++) for (var tx = tx0; tx <= tx1; tx++) if (W.tileSolid(tx, ty, fly)) return false;
    for (var i = 0; i < W.ents.length; i++) {
      var e = W.ents[i]; if (e === self || !e.solid || !e.visible || e.dead) continue;
      var b = e.solidBox ? e.solidBox() : { x: e.x - 8, y: e.y - 16, w: 16, h: 16 };
      if (x1 > b.x && x0 < b.x + b.w && y1 > b.y && y0 < b.y + b.h) return false;
    }
    return true;
  };
  /* move with sliding + corner nudging; returns true if fully moved */
  W.move = function (e, dx, dy, w, h, fly) {
    var moved = true;
    if (dx) {
      if (W.boxFree(e.x + dx, e.y, w, h, e, fly)) e.x += dx;
      else { moved = false; if (!dy) { for (var n = 1; n <= 5; n++) { if (W.boxFree(e.x + dx, e.y - n, w, h, e, fly)) { e.y -= Math.min(1, n); break; } if (W.boxFree(e.x + dx, e.y + n, w, h, e, fly)) { e.y += Math.min(1, n); break; } } } }
    }
    if (dy) {
      if (W.boxFree(e.x, e.y + dy, w, h, e, fly)) e.y += dy;
      else { moved = false; if (!dx) { for (var k = 1; k <= 5; k++) { if (W.boxFree(e.x - k, e.y + dy, w, h, e, fly)) { e.x -= Math.min(1, k); break; } if (W.boxFree(e.x + k, e.y + dy, w, h, e, fly)) { e.x += Math.min(1, k); break; } } } }
    }
    return moved;
  };
  W.findEnt = function (id) { for (var i = 0; i < W.ents.length; i++) if (W.ents[i].def && W.ents[i].def.id === id) return W.ents[i]; return null; };

  /* ---------------- camera ---------------- */
  W.updateCam = function (dt) {
    var L = SB.Party.leader(); if (!L) return; var m = W.map;
    var tx = (W.camTarget ? W.camTarget.x : L.x) - W.vw / 2, ty = (W.camTarget ? W.camTarget.y : L.y - 8) - W.vh / 2;
    var mw = m.w * T, mh = m.h * T;
    tx = mw <= W.vw ? (mw - W.vw) / 2 : SB.clamp(tx, 0, mw - W.vw);
    ty = mh <= W.vh - 20 ? (mh - W.vh) / 2 - 10 : SB.clamp(ty, -14, mh - W.vh);
    if (W.snapCam) { W.cam.x = tx; W.cam.y = ty; W.snapCam = false; }
    else { var k = Math.min(1, dt * 7); W.cam.x += (tx - W.cam.x) * k; W.cam.y += (ty - W.cam.y) * k; }
  };

  /* ---------------- rendering ---------------- */
  W.render = function () {
    var c = W.bctx, gfx = SB.gfx, m = W.map; if (!m) return;
    var sx = 0, sy = 0; if (W.shake > 0) { sx = (Math.random() - .5) * W.shake * 6; sy = (Math.random() - .5) * W.shake * 6; }
    var cx = Math.round(W.cam.x + sx), cy = Math.round(W.cam.y + sy);
    c.fillStyle = m.interior || m.dark ? '#000' : '#0b0a12'; c.fillRect(0, 0, W.vw, W.vh);
    c.save(); c.translate(-cx, -cy);
    var tx0 = Math.max(0, Math.floor(cx / T) - 1), ty0 = Math.max(0, Math.floor(cy / T) - 1), tx1 = Math.min(m.w - 1, Math.floor((cx + W.vw) / T) + 1), ty1 = Math.min(m.h - 1, Math.floor((cy + W.vh) / T) + 3);
    var sig = Object.keys(W.overrides).join('|'); if (sig !== W.layerSig) { W.layerSig = sig; W.layerDirty = true; }
    if (W.layerDirty || !W.layer) W.buildLayer();
    c.drawImage(W.layer, 0, 0);
    var af = Math.floor(W.time * 3);
    W.animTiles.forEach(function (a) { if (a[0] < tx0 || a[0] > tx1 || a[1] < ty0 || a[1] > ty1) return; W.drawTile(c, a[0], a[1], af, true); });
    /* tall scenery joins the y-sorted list */
    var talls = [];
    for (var ty = ty0; ty <= Math.min(m.h - 1, ty1 + 2); ty++) for (var tx = tx0; tx <= tx1; tx++) { var dt = W.tileDef(W.effTile(tx, ty)); if (dt.tall) { var tl = dt.tall.split(','); talls.push(tallDrawable(tx, ty, tl[(tx * 7 + ty * 13) % tl.length].trim())); } }
    /* entities sorted by y */
    var list = W.ents.filter(function (e) { return e.visible && e.draw; }).concat(SB.Party.members.filter(function (h) { return h.visible !== false; })).concat(talls);
    list.sort(function (a, b) { return (a.flat ? -1e6 : 0) + a.y - ((b.flat ? -1e6 : 0) + b.y); });
    list.forEach(function (e) { e.draw(c); });
    W.fx.forEach(function (f) { if (f.draw) f.draw(c); });
    W.drawParticles(c, cx, cy);
    c.restore();
    W.grade(c);
    /* fog overlay */
    if (W.fogOn()) {
      for (var i = 0; i < 7; i++) {
        var fx = ((i * 131 + W.time * (5 + i % 3 * 3) - cx * .3) % (W.vw + 160) + W.vw + 160) % (W.vw + 160) - 80, fy = ((i * 67 + Math.sin(W.time * .2 + i) * 18 - cy * .3) % (W.vh + 120) + W.vh + 120) % (W.vh + 120) - 60, fr3 = 60 + (i % 3) * 22;
        var fg = c.createRadialGradient(fx, fy, 0, fx, fy, fr3); fg.addColorStop(0, 'rgba(225,225,240,.22)'); fg.addColorStop(1, 'rgba(225,225,240,0)'); c.fillStyle = fg; c.fillRect(fx - fr3, fy - fr3, fr3 * 2, fr3 * 2);
      }
      c.fillStyle = 'rgba(190,190,215,.08)'; c.fillRect(0, 0, W.vw, W.vh);
    }
    if (m.dark) W.renderDark(cx, cy);
    if (W.tint) { c.globalAlpha = W.tint.a; c.fillStyle = W.tint.color; c.fillRect(0, 0, W.vw, W.vh); c.globalAlpha = 1; }
    if (W.flash.a > 0) { c.globalAlpha = W.flash.a; c.fillStyle = W.flash.color; c.fillRect(0, 0, W.vw, W.vh); c.globalAlpha = 1; }
    if (W.fade.a > 0) { c.globalAlpha = W.fade.a; c.fillStyle = W.fade.color; c.fillRect(0, 0, W.vw, W.vh); c.globalAlpha = 1; }
    /* upscale */
    W.ctx.imageSmoothingEnabled = false;
    W.ctx.drawImage(W.buf, 0, 0, W.vw * W.scale, W.vh * W.scale);
  };
  W.lights = function () {
    var out = [];
    SB.Party.members.forEach(function (h) { out.push([h.x, h.y - 8, h.id === 'mira' ? 78 : 30]); });
    W.ents.forEach(function (e) { if (e.visible && e.light) out.push([e.x, e.y - 8, e.light]); });
    W.fx.forEach(function (f) { if (f.light) out.push([f.x, f.y, f.light]); });
    return out;
  };
  W.renderDark = function (cx, cy) {
    var d = W.dctx; d.globalCompositeOperation = 'source-over'; d.fillStyle = 'rgba(4,3,10,.94)'; d.fillRect(0, 0, W.vw, W.vh);
    d.globalCompositeOperation = 'destination-out';
    W.lights().forEach(function (l) {
      var x = l[0] - cx, y = l[1] - cy, r = l[2] * (1 + Math.sin(W.time * 6 + x) * .02);
      var g = d.createRadialGradient(x, y, r * .2, x, y, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.7, 'rgba(0,0,0,.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = g; d.beginPath(); d.arc(x, y, r, 0, 6.3); d.fill();
    });
    d.globalCompositeOperation = 'source-over';
    W.bctx.drawImage(W.dark, 0, 0);
  };
  W.toScreen = function (x, y) { return [(x - W.cam.x) * W.scale / (window.devicePixelRatio > 3 ? 3 : (window.devicePixelRatio || 1)), (y - W.cam.y) * W.scale / (window.devicePixelRatio > 3 ? 3 : (window.devicePixelRatio || 1))]; };


  /* ---------------- terrain layer: blending, edge overlays, cast shadows ---------------- */
  var fringeCache = {};
  function fringe(sprite, side) {
    var key = sprite + '|' + side; if (fringeCache[key]) return fringeCache[key];
    var src = SB.gfx.frame(sprite, 0); if (!src) return null;
    var cv = document.createElement('canvas'); cv.width = 16; cv.height = 16; var x = cv.getContext('2d');
    var id = x.createImageData(16, 16), sx = document.createElement('canvas'); sx.width = 16; sx.height = 16; var sc = sx.getContext('2d'); sc.drawImage(src, 0, 0); var sd = sc.getImageData(0, 0, 16, 16).data;
    for (var yy = 0; yy < 16; yy++) for (var xx = 0; xx < 16; xx++) {
      var along = side === 'up' || side === 'down' ? xx : yy, depth = side === 'up' ? yy : side === 'down' ? 15 - yy : side === 'left' ? xx : 15 - xx;
      var d = 2 + ((along * 7 + 3) % 3 === 0 ? 1 : 0) + (Math.sin(along * 1.7) > .55 ? 1 : 0);
      if (depth < d || (depth === d && (xx + yy) % 2 === 0)) { var o = (yy * 16 + xx) * 4; id.data[o] = sd[o]; id.data[o + 1] = sd[o + 1]; id.data[o + 2] = sd[o + 2]; id.data[o + 3] = 255; }
    }
    x.putImageData(id, 0, 0); fringeCache[key] = cv; return cv;
  }
  SB.clearFringes = function () { fringeCache = {}; };
  var NB = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
  function sameGroup(a, b) { if (a === b) return true; var da = W.tileDef(a), db = W.tileDef(b); return !!(da.group && da.group === db.group); }
  W.drawTile = function (c, tx, ty, f, anim) {
    var ch = W.effTile(tx, ty), d = W.tileDef(ch), gfx = SB.gfx; if (!d.sprite) return;
    var im = gfx.frame(d.sprite, f); if (im) c.drawImage(im, tx * T, ty * T);
    if (d.blend) NB.forEach(function (n) { var nc = W.effTile(tx + n[1], ty + n[2]), nd = W.tileDef(nc); if (nd.blend && nd.blend > d.blend && !sameGroup(ch, nc) && nd.sprite) { var fr = fringe(nd.sprite, n[0]); if (fr) c.drawImage(fr, tx * T, ty * T); } });
    if (d.edges) NB.forEach(function (n) { var e = d.edges[n[0]]; if (!e) return; var nc = W.effTile(tx + n[1], ty + n[2]); if (nc === ' ' && (tx + n[1] < 0 || ty + n[2] < 0 || tx + n[1] >= W.map.w || ty + n[2] >= W.map.h)) return; if (sameGroup(ch, nc)) return; var ei = gfx.frame(e, f); if (ei) c.drawImage(ei, tx * T, ty * T); });
  };
  W.buildLayer = function () {
    var m = W.map, gfx = SB.gfx; W.layerDirty = false; W.animTiles = [];
    if (!W.layer) W.layer = document.createElement('canvas');
    W.layer.width = m.w * T; W.layer.height = m.h * T; var c = W.layer.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, W.layer.width, W.layer.height);
    for (var ty = 0; ty < m.h; ty++) for (var tx = 0; tx < m.w; tx++) {
      var d = W.tileDef(W.effTile(tx, ty));
      if (d.sprite && gfx.frames(d.sprite) > 1) { W.animTiles.push([tx, ty]); continue; }
      W.drawTile(c, tx, ty, 0);
    }
    /* cast shadows onto the ground below solid things */
    for (var y2 = 0; y2 < m.h - 1; y2++) for (var x2 = 0; x2 < m.w; x2++) {
      var a = W.tileDef(W.effTile(x2, y2)), b = W.tileDef(W.effTile(x2, y2 + 1));
      if (a.shadow && !b.solid && !b.shadow) { var g = c.createLinearGradient(0, (y2 + 1) * T, 0, (y2 + 1) * T + 7); g.addColorStop(0, 'rgba(10,6,30,.42)'); g.addColorStop(1, 'rgba(10,6,30,0)'); c.fillStyle = g; c.fillRect(x2 * T, (y2 + 1) * T, T, 7); }
      if (a.shadow && x2 < m.w - 1) { var r = W.tileDef(W.effTile(x2 + 1, y2)); if (!r.solid && !r.shadow) { c.fillStyle = 'rgba(10,6,30,.18)'; c.fillRect((x2 + 1) * T, y2 * T + 4, 3, T - 4); } }
    }
  };
  W.invalidateLayer = function () { W.layerDirty = true; };
  function tallDrawable(tx, ty, sprite) {
    return { y: ty * T + 15, tall: true, draw: function (c) {
      var im = SB.gfx.frame(sprite, 0); if (!im) return; var x = tx * T + 8, y = ty * T + 16;
      c.fillStyle = 'rgba(10,6,30,.28)'; c.beginPath(); c.ellipse(x, y - 2, Math.min(13, im.width / 2.4), 4, 0, 0, 6.3); c.fill();
      var sway = im.height > 30 ? Math.round(Math.sin(W.time * 1.3 + tx * .7 + ty) * .6) : 0;
      c.drawImage(im, Math.round(x - im.width / 2) + sway, y - im.height);
    } };
  }
  /* ---------------- ambient particles + colour grading ---------------- */
  W.parts = [];
  W.drawParticles = function (c, cx, cy) {
    var amb = W.map.ambience; if (!amb) { W.parts.length = 0; return; }
    var want = amb === 'leaves' ? 14 : amb === 'fireflies' ? 18 : amb === 'embers' ? 22 : amb === 'dust' ? 16 : 12;
    while (W.parts.length < want) W.parts.push({ x: cx + Math.random() * W.vw, y: cy + Math.random() * W.vh, t: Math.random() * 10, s: .5 + Math.random() });
    W.parts.forEach(function (p) {
      p.t += 1 / 60;
      if (amb === 'leaves') { p.x += Math.sin(p.t * 1.5) * .5 + .25; p.y += .35 * p.s; }
      else if (amb === 'embers') { p.y -= .45 * p.s; p.x += Math.sin(p.t * 3) * .3; }
      else if (amb === 'fireflies') { p.x += Math.sin(p.t * .9 + p.s * 9) * .35; p.y += Math.cos(p.t * .7 + p.s * 5) * .3; }
      else { p.x += Math.sin(p.t * .5) * .15 + .08; p.y += Math.sin(p.t * .3) * .1 - .03; }
      if (p.x < cx - 10 || p.x > cx + W.vw + 10 || p.y < cy - 10 || p.y > cy + W.vh + 10) { p.x = cx + Math.random() * W.vw; p.y = amb === 'embers' ? cy + W.vh + 4 : amb === 'leaves' ? cy - 4 : cy + Math.random() * W.vh; }
      var x = Math.round(p.x), y = Math.round(p.y);
      if (amb === 'leaves') { c.fillStyle = p.s > 1 ? '#6ec44a' : '#e2b62a'; c.fillRect(x, y, 2, 1); c.fillRect(x + (Math.sin(p.t * 4) > 0 ? 1 : 0), y + 1, 1, 1); }
      else if (amb === 'embers') { c.fillStyle = p.s > 1 ? '#ffd048' : '#f05a10'; c.globalAlpha = .9; c.fillRect(x, y, 1, 1); c.globalAlpha = 1; }
      else if (amb === 'fireflies') { var a = .5 + Math.sin(p.t * 3 + p.s * 7) * .5; c.globalAlpha = a; c.fillStyle = '#e8f0ff'; c.fillRect(x, y, 1, 1); c.globalAlpha = a * .35; c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3); c.globalAlpha = 1; }
      else { c.globalAlpha = .45 + Math.sin(p.t * 2 + p.s) * .25; c.fillStyle = amb === 'dust' ? '#b4a8d0' : '#fff6c8'; c.fillRect(x, y, 1, 1); c.globalAlpha = 1; }
    });
  };
  W.grade = function (c) {
    var m = W.map, gr = m.grade;
    if (gr) { c.globalCompositeOperation = 'soft-light'; var g = c.createLinearGradient(0, 0, 0, W.vh); g.addColorStop(0, gr[0]); g.addColorStop(1, gr[1]); c.fillStyle = g; c.globalAlpha = gr[2] == null ? .5 : gr[2]; c.fillRect(0, 0, W.vw, W.vh); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    if (!m.interior) { if (!W.vig || W.vig.w !== W.vw || W.vig.h !== W.vh) { var v = document.createElement('canvas'); v.width = W.vw; v.height = W.vh; var vx = v.getContext('2d'), rg = vx.createRadialGradient(W.vw / 2, W.vh / 2, Math.min(W.vw, W.vh) * .45, W.vw / 2, W.vh / 2, Math.max(W.vw, W.vh) * .72); rg.addColorStop(0, 'rgba(8,4,24,0)'); rg.addColorStop(1, 'rgba(8,4,24,.38)'); vx.fillStyle = rg; vx.fillRect(0, 0, W.vw, W.vh); W.vig = { c: v, w: W.vw, h: W.vh }; } c.drawImage(W.vig.c, 0, 0); }
  };

  /* ---------------- tweens for screen effects ---------------- */
  W.tween = function (obj, key, to, ms) {
    var from = obj[key], t0 = performance.now();
    return new Promise(function (res) { (function step() { var t = Math.min(1, (performance.now() - t0) / Math.max(1, ms)); obj[key] = from + (to - from) * t; if (t < 1) requestAnimationFrame(step); else res(); })(); });
  };
  W.doFade = function (to, color, ms) { if (color) W.fade.color = color; return W.tween(W.fade, 'a', to === 'out' ? 1 : 0, ms == null ? 500 : ms); };
  W.doFlash = function (color, ms) { W.flash.color = color || '#fff'; W.flash.a = 1; return W.tween(W.flash, 'a', 0, ms || 500); };
})();
