/* Dawnbound - world engine: canvas, camera, collision masks, entities, rendering */
(function () {
  'use strict';
  var DB = window.DB, A = DB.assets;
  var W = DB.world = {
    canvas: null, ctx: null, vw: 800, vh: 450, Z: 2, dpr: 1, map: null, mapId: null, img: null, mask: null,
    ents: [], player: null, party: [], cam: { x: 0, y: 0, tx: 0, ty: 0, follow: null, snap: true }, time: 0, paused: false,
    fade: { a: 0, color: '#000' }, flash: { a: 0, color: '#fff' }, shake: 0, tint: null, letterbox: 0, mode: 'title', frameFn: null, zoomMul: 1
  };
  var VIEW_SHORT = 360;
  W.init = function () {
    W.canvas = DB.$('#game'); W.ctx = W.canvas.getContext('2d');
    window.addEventListener('resize', W.resize); window.addEventListener('orientationchange', function () { setTimeout(W.resize, 200); });
    W.resize();
  };
  W.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = window.innerWidth, h = window.innerHeight;
    W.dpr = dpr; W.canvas.width = Math.floor(w * dpr); W.canvas.height = Math.floor(h * dpr); W.canvas.style.width = w + 'px'; W.canvas.style.height = h + 'px';
    var short = Math.min(w, h), long = Math.max(w, h);
    W.Z = (short / VIEW_SHORT) * W.zoomMul; if (long / W.Z < 520) W.Z = long / 520;
    W.vw = w / W.Z; W.vh = h / W.Z;
  };
  /* ---------------- masks ---------------- */
  var CELL = 8;
  W.decodeMask = function (b64, gw, gh) {
    var bin = atob(b64), n = gw * gh, m = new Uint8Array(n);
    for (var i = 0; i < n; i++) m[i] = (bin.charCodeAt(i >> 3) >> (i & 7)) & 1;
    return { w: gw, h: gh, d: m };
  };
  W.walkable = function (x, y) {
    var m = W.mask; if (!m) return true;
    var cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    if (cx < 0 || cy < 0 || cx >= m.w || cy >= m.h) return false;
    return m.d[cy * m.w + cx] === 1;
  };
  W.setCell = function (x, y, v) { var m = W.mask; if (!m) return; var cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); if (cx >= 0 && cy >= 0 && cx < m.w && cy < m.h) m.d[cy * m.w + cx] = v; };
  W.setRect = function (x, y, w, h, v) { for (var yy = y; yy < y + h; yy += CELL) for (var xx = x; xx < x + w; xx += CELL) W.setCell(xx, yy, v); };
  /* can an entity of radius r stand at x,y */
  W.canStand = function (x, y, r) {
    /* forgiving "feet" probe: the mask is built from the art in 8px cells, so a wide body probe snags on lamps, arches and shrubs.
       Characters are drawn in front of / behind scenery, so only the feet point matters. */
    r = (r || 6) * .34;
    return W.walkable(x, y) && W.walkable(x - r, y) && W.walkable(x + r, y) && W.walkable(x, y + r * .5);
  };
  /* move with sub-steps, wall sliding and corner gliding. returns true if moved */
  W.tryMove = function (e, dx, dy) {
    var r = e.r || 6;
    if (e.fly) { e.x = DB.clamp(e.x + dx, 4, W.map.w - 4); e.y = DB.clamp(e.y + dy, 4, W.map.h - 4); return true; }
    var n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 2)), sx = dx / n, sy = dy / n, moved = false;
    for (var i = 0; i < n; i++) { if (step(e, sx, sy, r)) moved = true; else break; }
    return moved;
  };
  function free(e, x, y, r, stuck) { return (W.canStand(x, y, r) || (stuck && W.walkable(x, y))) && !W.blockedByProp(x, y, r, e); }
  function step(e, sx, sy, r) {
    var x = e.x, y = e.y, stuck = !W.canStand(x, y, r);               /* already inside a wall: let the entity walk out */
    if (sx && sy && free(e, x + sx, y + sy, r, stuck)) { e.x = x + sx; e.y = y + sy; return true; }
    var ax = Math.abs(sx) >= Math.abs(sy);
    for (var t = 0; t < 2; t++) {
      var horiz = (t === 0) === ax;
      if (horiz && sx && free(e, x + sx, y, r, stuck)) { e.x = x + sx; return true; }
      if (!horiz && sy && free(e, x, y + sy, r, stuck)) { e.y = y + sy; return true; }
    }
    /* glide: slip around corners / past lamp posts by nudging sideways toward the nearest gap (up to 10px) */
    var g = Math.min(1.4, Math.max(Math.abs(sx), Math.abs(sy)) || 1.4);
    if (sx) for (var k = 1; k <= 10; k++) for (var sg = -1; sg <= 1; sg += 2) { if (free(e, x + sx, y + sg * k, r, false) && free(e, x, y + sg * g, r, false)) { e.y = y + sg * g; return true; } }
    if (sy) for (var k2 = 1; k2 <= 10; k2++) for (var s2 = -1; s2 <= 1; s2 += 2) { if (free(e, x + s2 * k2, y + sy, r, false) && free(e, x + s2 * g, y, r, false)) { e.x = x + s2 * g; return true; } }
    return false;
  }
  W.blockedByProp = function (x, y, r, self) {
    for (var i = 0; i < W.ents.length; i++) { var p = W.ents[i]; if (p.type === 'prop' && p.solid && p !== self && p.block) { var b = p.block; if (x + r > b[0] && x - r < b[0] + b[2] && y + 2 > b[1] && y - 2 < b[1] + b[3]) return true; } }
    return false;
  };
  /* snap an entity to the nearest walkable cell */
  W.snapToWalkable = function (e, rr) {
    rr = rr || e.r || 6;
    if (W.canStand(e.x, e.y, rr)) return;
    for (var rad = 4; rad < 200; rad += 4) for (var a = 0; a < 6.28; a += .4) { var nx = e.x + Math.cos(a) * rad, ny = e.y + Math.sin(a) * rad; if (W.canStand(nx, ny, rr)) { e.x = nx; e.y = ny; return; } }
  };
  /* ---------------- map loading ---------------- */
  W.load = function (id, spawn, opts) {
    opts = opts || {};
    var def = DB.maps[id]; if (!def) { console.error('no map', id); return Promise.resolve(); }
    return A.loadMap(def.img || id).then(function (img) {
      W.map = def; W.mapId = id; W.img = img; def.w = def.w || (img ? img.width : 1536); def.h = def.h || (img ? img.height : 1024);
      var mk = DB.MASKS && DB.MASKS[id];
      W.mask = mk ? W.decodeMask(mk, Math.floor(def.w / CELL), Math.floor(def.h / CELL)) : null;
      if (!W.mask) { var gw = Math.floor(def.w / CELL), gh = Math.floor(def.h / CELL), d = new Uint8Array(gw * gh); d.fill(1); W.mask = { w: gw, h: gh, d: d }; }
      /* manual mask patches authored in the map definition */
      (def.open || []).forEach(function (r) { W.setRect(r[0], r[1], r[2], r[3], 1); });
      (def.block || []).forEach(function (r) { W.setRect(r[0], r[1], r[2], r[3], 0); });
      W.ents = []; W.projectiles = []; W.fxs = []; W.texts = [];
      if (def.beforeLoad) def.beforeLoad(W);
      var sp = def.spawns[spawn || 'start'] || def.spawns.start || [def.w / 2, def.h - 120, 'up'];
      DB.G.map = id;
      W.spawnParty(sp);
      DB.map = def;
      if (def.build) def.build(W);
      W.buildEntities(def);
      W.cam.follow = W.player; W.cam.snap = true;
      DB.audio.music(def.music || null);
      W.mode = 'field';
      if (def.onEnter) def.onEnter(W);
      DB.emit('mapload', id);
      return A.loadChars(W.neededSprites(def));
    });
  };
  W.neededSprites = function (def) {
    var s = {}; (def.npcs || []).forEach(function (n) { s[n.sprite] = 1; }); (def.enemies || []).forEach(function (e) { var t = DB.enemyTypes[e.type]; if (t) s[t.sprite] = 1; });
    if (def.boss) { var b = DB.bosses[def.boss.type]; if (b) s[b.sprite] = 1; }
    DB.party().forEach(function (id) { s[DB.heroSprite(id)] = 1; });
    s.ash = 1; return Object.keys(s);
  };
  W.spawnParty = function (sp) {
    var party = DB.party(); W.party = [];
    party.forEach(function (id, i) {
      var h = DB.heroEnt(id); h.x = sp[0] - i * 14 * (sp[2] === 'left' ? -1 : 1); h.y = sp[1] + (i ? 8 + i * 6 : 0); h.dir = sp[2] || 'up';
      if (i === 0) { h.type = 'player'; W.player = h; } else h.type = 'ally';
      W.party.push(h); W.ents.push(h);
    });
    W.party.forEach(function (h) { W.snapToWalkable(h); });
    if (DB.G.hasAsh && DB.party().indexOf('rowan') >= 0) { var a = DB.makeAsh(W.party[0]); W.ents.push(a); W.ash = a; } else W.ash = null;
  };
  /* reachability: flood-fill the walkable mask from every spawn point so nothing (NPCs, chests, foes) ends up on an unreachable island */
  W.computeReach = function (def) {
    var m = W.mask; if (!m) { W.reach = null; return; }
    var gw = m.w, gh = m.h, seen = new Uint8Array(gw * gh), st = [];
    var ok = function (cx, cy) { return cx >= 0 && cy >= 0 && cx < gw && cy < gh && m.d[cy * gw + cx] === 1; };
    Object.keys(def.spawns || {}).forEach(function (k) {
      var sp = def.spawns[k], cx = Math.floor(sp[0] / CELL), cy = Math.floor(sp[1] / CELL), found = false;
      for (var r = 0; r < 12 && !found; r++) for (var dy = -r; dy <= r && !found; dy++) for (var dx = -r; dx <= r && !found; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; if (ok(cx + dx, cy + dy)) { cx += dx; cy += dy; found = true; } }
      if (found && !seen[cy * gw + cx]) { seen[cy * gw + cx] = 1; st.push(cx, cy); }
    });
    while (st.length) {
      var y = st.pop(), x = st.pop();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var nx = x + d[0], ny = y + d[1]; if (ok(nx, ny) && !seen[ny * gw + nx]) { seen[ny * gw + nx] = 1; st.push(nx, ny); } });
    }
    W.reach = { d: seen, w: gw, h: gh };
  };
  W.isReach = function (x, y, tol) {
    var r = W.reach; if (!r) return true; tol = tol == null ? 2 : tol;
    var cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    for (var dy = -tol; dy <= tol; dy++) for (var dx = -tol; dx <= tol; dx++) { var nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < r.w && ny < r.h && r.d[ny * r.w + nx]) return true; }
    return false;
  };
  W.nearestReach = function (x, y, margin) {
    for (var rad = 8; rad < 500; rad += 8) for (var a = 0; a < 6.28; a += .3) { var nx = x + Math.cos(a) * rad, ny = y + Math.sin(a) * rad; if (W.isReach(nx, ny, 0) && W.canStand(nx, ny, margin || 10)) return [nx, ny]; }
    return null;
  };
  W.buildEntities = function (def) {
    W.computeReach(def);
    (def.npcs || []).forEach(function (n) {
      if (n.cond && !n.cond(DB.G)) return;
      var e = DB.makeNpc(n); W.ents.push(e);
    });
    (def.objs || []).forEach(function (o) {
      if (o.cond && !o.cond(DB.G)) return;
      var e = DB.makeObj(o); if (e) W.ents.push(e);
    });
    if (DB.spawnEnemies) DB.spawnEnemies(def);
    W.ents.forEach(function (e) { if ((e.type === 'npc' || e.type === 'enemy') && !e.fly && W.mapId && !W.canStand(e.x, e.y, 16)) { W.snapToWalkable(e, 16); if (e.hx != null) { e.hx = e.x; e.hy = e.y; } } else if (e.type === 'prop' && (e.kind === 'chest' || e.kind === 'pickup') && !W.walkable(e.x, e.y + 12)) { var ox = e.x, oy = e.y; e.y += 12; W.snapToWalkable(e); e.y -= 12; } });
    /* anything stranded on an unreachable island is moved to the nearest reachable ground */
    W.ents.forEach(function (e) {
      if (e.fly || !W.mapId) return; var chk = e.type === 'npc' || e.type === 'enemy' || (e.type === 'prop' && (e.kind === 'chest' || e.kind === 'pickup'));
      if (!chk) return; var py = e.type === 'prop' ? e.y + 12 : e.y;
      if (!W.isReach(e.x, py, 2)) { var n = W.nearestReach(e.x, py, 8); if (n) { e.x = n[0]; e.y = n[1] - (e.type === 'prop' ? 12 : 0); if (e.hx != null) { e.hx = e.x; e.hy = e.y; } } }
    });
  };
  W.find = function (id) { for (var i = 0; i < W.ents.length; i++) if (W.ents[i].id === id) return W.ents[i]; return null; };
  W.remove = function (e) { var i = W.ents.indexOf(e); if (i >= 0) W.ents.splice(i, 1); };
  W.add = function (e) { W.ents.push(e); return e; };
  /* ---------------- animation ---------------- */
  W.animKey = function (e, name) {
    var c = A.atlas.chars[e.sprite]; if (!c) return null;
    var k = name + '_' + e.dir; if (c.anims[k]) return k;
    if (c.anims[name]) return name;
    return null;
  };
  W.play = function (e, name, restart) {
    var k = W.animKey(e, name); if (!k) { k = W.animKey(e, 'idle'); }
    if (e.anim !== k || restart) { e.anim = k; e.at = 0; e.animDone = false; }
  };
  W.frameOf = function (e) {
    var c = A.atlas.chars[e.sprite]; if (!c) return null;
    var an = c.anims[e.anim]; if (!an) { an = c.anims['idle_down'] || c.anims.idle; if (!an) return [0, 0]; }
    var i = Math.floor((e.at || 0) * an.fps);
    if (i >= an.f.length) { if (an.loop) i = i % an.f.length; else { i = an.f.length - 1; e.animDone = true; } }
    return an.f[i];
  };
  W.animLen = function (e, name) { var k = W.animKey(e, name), c = A.atlas.chars[e.sprite]; if (!k || !c) return 0; var an = c.anims[k]; return an.f.length / an.fps; };
  /* ---------------- camera & fx ---------------- */
  W.camTo = function (x, y, snap) { W.cam.follow = null; W.cam.tx = x; W.cam.ty = y; if (snap) { W.cam.x = x; W.cam.y = y; } };
  W.camFollow = function (e) { W.cam.follow = e; };
  W.updateCam = function (dt) {
    var c = W.cam; if (c.follow) { c.tx = c.follow.x; c.ty = c.follow.y - 24; }
    var k = c.snap ? 1 : 1 - Math.pow(0.0008, dt); c.x += (c.tx - c.x) * k; c.y += (c.ty - c.y) * k; c.snap = false;
  };
  W.shakeCam = function (a) { W.shake = Math.max(W.shake, a); };
  W.doFade = function (to, ms, color) { W.fade.color = color || W.fade.color; var from = W.fade.a; return DB.tween(ms || 500, function (t) { W.fade.a = from + (to - from) * t; }); };
  W.doFlash = function (color, ms) { W.flash.color = color || '#fff'; W.flash.a = 1; return DB.tween(ms || 500, function (t) { W.flash.a = 1 - t; }); };
  /* ---------------- fx entities ---------------- */
  W.fx = function (name, x, y, o) {
    o = o || {}; var s = A.atlas.sheets.effects_spells; if (!s) return null; var an = s.anims[name]; if (!an) return null;
    var f = { type: 'fx', anim: an, x: x, y: y, t: 0, scale: o.scale || 1, fps: o.fps || an.fps, add: o.add !== false, alpha: o.alpha == null ? 1 : o.alpha, follow: o.follow, dy: o.dy || 0, loop: o.loop, dur: o.dur, rot: o.rot || 0, tint: o.tint };
    W.fxs.push(f); return f;
  };
  W.text = function (txt, x, y, color, o) { o = o || {}; W.texts.push({ txt: txt, x: x, y: y, t: 0, color: color || '#fff', big: o.big, life: o.life || .9, vy: o.vy || -28 }); };
  /* ---------------- update ---------------- */
  W.update = function (dt) {
    W.time += dt;
    var i;
    for (i = 0; i < W.ents.length; i++) { var e = W.ents[i]; e.at = (e.at || 0) + dt; }
    if (W.mode === 'field' || W.mode === 'scene' || W.mode === 'cutscene') {
      if (DB.combat && W.mode === 'field') DB.combat.update(dt);
      DB.npcUpdate(dt);
    }
    for (i = W.fxs.length - 1; i >= 0; i--) { var f = W.fxs[i]; f.t += dt; if (f.follow) { f.x = f.follow.x; f.y = f.follow.y; } var n = f.anim.f.length; if (f.t * f.fps >= n && !f.loop) W.fxs.splice(i, 1); else if (f.dur && f.t > f.dur) W.fxs.splice(i, 1); }
    for (i = W.texts.length - 1; i >= 0; i--) { var tx = W.texts[i]; tx.t += dt; tx.y += tx.vy * dt; tx.vy *= .94; if (tx.t > tx.life) W.texts.splice(i, 1); }
    W.shake = Math.max(0, W.shake - dt * 30);
    W.updateCam(dt);
  };
  /* ---------------- drawing ---------------- */
  var SHADOW = null;
  function drawShadow(ctx, x, y, w, a) {
    ctx.save(); ctx.globalAlpha = a == null ? .35 : a; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, y, w, w * .38, 0, 0, 6.283); ctx.fill(); ctx.restore();
  }
  W.draw = function () {
    var ctx = W.ctx, Z = W.Z * W.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, W.canvas.width, W.canvas.height);
    if (W.mode === 'title' || !W.map) return;
    var m = W.map, vw = W.vw, vh = W.vh, cx = W.cam.x, cy = W.cam.y;
    var ox = cx - vw / 2, oy = cy - vh / 2;
    if (m.w > vw) ox = DB.clamp(ox, 0, m.w - vw); else ox = -(vw - m.w) / 2;
    if (m.h > vh) oy = DB.clamp(oy, 0, m.h - vh); else oy = -(vh - m.h) / 2;
    if (W.shake > 0) { ox += (Math.random() - .5) * W.shake; oy += (Math.random() - .5) * W.shake; }
    W.ox = ox; W.oy = oy;
    ctx.setTransform(Z, 0, 0, Z, -ox * Z, -oy * Z);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (W.img) ctx.drawImage(W.img, 0, 0, m.w, m.h);
    if (W.map.drawBack) W.map.drawBack(ctx, W);
    /* depth sorted entities */
    var list = W.ents.slice().sort(function (a, b) { return (a.z || 0) - (b.z || 0) || a.y - b.y; });
    ctx.imageSmoothingEnabled = false;
    for (var i = 0; i < list.length; i++) W.drawEnt(ctx, list[i]);
    ctx.imageSmoothingEnabled = true;
    if (DB.combat) DB.combat.draw(ctx);
    /* fx */
    for (i = 0; i < W.fxs.length; i++) {
      var f = W.fxs[i], idx = Math.min(f.anim.f.length - 1, Math.floor(f.t * f.fps)); if (f.loop) idx = Math.floor(f.t * f.fps) % f.anim.f.length;
      var nm = f.anim.f[idx]; var fa = f.alpha; if (!f.loop) { var rem = f.anim.f.length - f.t * f.fps; if (rem < 1) fa *= Math.max(0, rem); }
      ctx.save(); ctx.translate(f.x, f.y + f.dy); if (f.rot) ctx.rotate(f.rot);
      A.sheetFrame(ctx, 'effects_spells', nm, 0, 0, { scale: f.scale, alpha: fa, add: f.add }); ctx.restore();
    }
    /* floating texts */
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    for (i = 0; i < W.texts.length; i++) {
      var tx = W.texts[i]; ctx.globalAlpha = Math.min(1, (tx.life - tx.t) * 3); ctx.font = (tx.big ? 'bold 15px' : 'bold 11px') + ' Georgia,serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(tx.txt, tx.x, tx.y); ctx.fillStyle = tx.color; ctx.fillText(tx.txt, tx.x, tx.y); ctx.globalAlpha = 1;
    }
    /* portal markers */
    if (W.mode === 'field' && W.map.portals && W.player) { ctx.textAlign = 'center'; W.map.portals.forEach(function (pt) { if (pt.hidden || (pt.cond && !pt.cond(DB.G))) return; var cx = pt.x + pt.w / 2, cy = pt.y + pt.h / 2, d = DB.dist(W.player.x, W.player.y, cx, cy); if (d > 190) return; var a = Math.min(1, (190 - d) / 70), bob = Math.sin(W.time * 4) * 2; ctx.globalAlpha = a * .95; ctx.fillStyle = '#ffd98a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.font = 'bold 10px Georgia,serif'; var lab = pt.label || ''; if (lab) { ctx.strokeText(lab, cx, cy - 16 + bob); ctx.fillText(lab, cx, cy - 16 + bob); } ctx.beginPath(); ctx.moveTo(cx - 6, cy - 8 + bob); ctx.lineTo(cx + 6, cy - 8 + bob); ctx.lineTo(cx, cy + 1 + bob); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }); }
    if (W.map.drawFront) W.map.drawFront(ctx, W);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    /* screen overlays */
    if (W.tint) { ctx.globalAlpha = W.tint.a; ctx.fillStyle = W.tint.color; ctx.fillRect(0, 0, W.canvas.width, W.canvas.height); ctx.globalAlpha = 1; }
    if (W.flash.a > 0) { ctx.globalAlpha = W.flash.a; ctx.fillStyle = W.flash.color; ctx.fillRect(0, 0, W.canvas.width, W.canvas.height); ctx.globalAlpha = 1; }
    if (W.letterbox > 0) { var lb = W.canvas.height * .11 * W.letterbox; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W.canvas.width, lb); ctx.fillRect(0, W.canvas.height - lb, W.canvas.width, lb); }
    if (W.fade.a > 0) { ctx.globalAlpha = W.fade.a; ctx.fillStyle = W.fade.color; ctx.fillRect(0, 0, W.canvas.width, W.canvas.height); ctx.globalAlpha = 1; }
    if (W.vignette) { var g = ctx.createRadialGradient(W.canvas.width / 2, W.canvas.height / 2, W.canvas.height * .35, W.canvas.width / 2, W.canvas.height / 2, W.canvas.height * .95); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + W.vignette + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, W.canvas.width, W.canvas.height); }
  };
  W.drawEnt = function (ctx, e) {
    if (e.hidden) return;
    if (e.type === 'prop') { if (e.draw) e.draw(ctx, e); return; }
    if (e.draw) { e.draw(ctx, e); return; }
    var c = A.atlas.chars[e.sprite]; if (!c || !A.charSheet(e.sprite)) return;
    var fr = W.frameOf(e); if (!fr) return;
    var sc = e.scale || 1;
    if (!e.noShadow) drawShadow(ctx, e.x, e.y, (e.sr || 11) * sc, e.dead ? .15 : .35);
    var o = { scale: sc, flip: false };
    if (e.alpha != null) o.alpha = e.alpha;
    if (e.tint) { o.tint = e.tint; o.tintAmt = e.tintAmt; }
    var hy = e.y + (e.zlift || 0);
    A.drawFrame(ctx, e.sprite, fr[0], fr[1], e.x, hy, o);
    if (e.flashT > 0) { /* white hit flash via overlay */
      ctx.save(); ctx.globalAlpha = Math.min(.8, e.flashT * 5); ctx.globalCompositeOperation = 'lighter';
      var w = c.w * sc, h = c.h * sc; var fx = fr[0] * c.w, fy = fr[1] * c.h;
      ctx.drawImage(A.charSheet(e.sprite), fx, fy, c.w, c.h, e.x - c.ax * w, hy - c.ay * h, w, h);
      ctx.restore();
    }
    if (e.marker) { /* quest / interact marker */
      var by = e.y - (e.markerH || 52) + Math.sin(W.time * 4) * 2; ctx.save(); ctx.translate(e.x, by);
      ctx.fillStyle = e.marker === 'quest' ? '#ffd86b' : '#9fe0ff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.font = 'bold 18px Georgia,serif'; ctx.textAlign = 'center'; ctx.strokeText(e.marker === 'quest' ? '!' : '…', 0, 0); ctx.fillText(e.marker === 'quest' ? '!' : '…', 0, 0); ctx.restore();
    }
  };
})();
