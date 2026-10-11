/* The Fractured Path: the field. Walking, doors, people, chests, encounters. */
(function (FP) {
  'use strict';
  var TI = FP.TI, art = FP.art, U = FP.ui;
  var F = FP.field = { map: null, ents: [], locked: 0, tx: 0, ty: 0, px: 0, py: 0, dir: 'd', moving: null, parity: 0, cam: { x: 0, y: 0 }, time: 0, encCount: 20, shake: 0, flash: 0, active: false };
  var DV = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
  var OPP = { u: 'd', d: 'u', l: 'r', r: 'l' };
  F.DV = DV; F.OPP = OPP;
  var SPEED = 5.0;

  /* ---------- sprites that are not in the tile set ---------- */
  var chestCache = {};
  function chestSprite(open) {
    var k = open ? 1 : 0; if (chestCache[k]) return chestCache[k];
    var c = art.canvas(16, 16), x = c.getContext('2d'); art.setCtx(x);
    var R = art.R, P = art.P;
    var body = [['r', 2, 7, 12, 8, '#8a5a30'], ['kr', 2, 7, 12, 2, '#aa7a44'], ['kr', 2, 11, 12, 1, '#4a2a18'], ['kr', 7, 9, 2, 4, '#f2c14e']];
    if (!open) body.push(['r', 2, 4, 12, 4, '#a2703c'], ['kr', 3, 5, 10, 1, '#c89a60'], ['kr', 7, 6, 2, 3, '#f2c14e']);
    else body.push(['r', 2, 2, 12, 3, '#a2703c'], ['kr', 3, 7, 10, 3, '#2a1a18'], ['kp', 8, 8, '#ffe27a'], ['kp', 5, 9, '#ffe27a']);
    art.drawParts(x, body, 1);
    chestCache[k] = c; return c;
  }
  var shadow = null;
  function shadowSprite() { if (shadow) return shadow; shadow = art.canvas(12, 5); var x = shadow.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0.28)'; x.beginPath(); x.ellipse(6, 2.5, 5, 2, 0, 0, 7); x.fill(); return shadow; }

  /* ---------- helpers ---------- */
  function G() { return FP.G; }
  F.lock = function () { F.locked++; };
  F.unlock = function () { F.locked = Math.max(0, F.locked - 1); };
  F.free = function () { return F.active && F.locked === 0 && FP.topFocus() === F.handler && !F.moving && !F.busy; };

  function tileAt(x, y) { var m = F.map; if (x < 0 || y < 0 || x >= m.w || y >= m.h) return TI.VOID; return m.t[y * m.w + x]; }
  F.tileAt = tileAt;
  function chestAt(x, y) { for (var i = 0; i < F.chests.length; i++) { var c = F.chests[i]; if (c.x === x && c.y === y) return c; } return null; }
  function entAt(x, y, except) {
    for (var i = 0; i < F.ents.length; i++) { var e = F.ents[i]; if (e !== except && e.visible && !e.ghost && ((e.x === x && e.y === y) || (e.moving && e.mx === x && e.my === y))) return e; }
    return null;
  }
  F.entAt = entAt;
  function walkable(x, y, except, force) {
    if (x < 0 || y < 0 || x >= F.map.w || y >= F.map.h) return false;
    if (art.isSolid(tileAt(x, y))) return false;
    if (force) return true;
    if (entAt(x, y, except) || chestAt(x, y)) return false;
    if (except !== F.pl && F.tx === x && F.ty === y) return false;
    return true;
  }
  F.walkable = walkable;
  F.npcById = function (id) { for (var i = 0; i < F.ents.length; i++) if (F.ents[i].id === id) return F.ents[i]; return null; };

  /* ---------- entering a map ---------- */
  function makeEnts(m) {
    var g = G(), out = [];
    m.npcs.forEach(function (n) {
      var e = { id: n.id, def: n, x: n.x, y: n.y, mx: 0, my: 0, dir: n.dir || 'd', moving: null, visible: true, name: n.name, kind: n.kind, wander: n.wander || 0, wt: 1 + Math.random() * 3, hx: n.x, hy: n.y, ghost: !!n.ghost, frame: 0, parity: 0, t: Math.random() * 6 };
      out.push(e);
    });
    return out;
  }
  F.refresh = function () {
    if (!F.map) return;
    var g = G();
    F.ents.forEach(function (e) {
      var d = e.def;
      var vis = d.show ? !!d.show(g) : true;
      if (e.hidden) vis = false;
      e.visible = vis;
    });
    F.chests = (F.map.chests || []).map(function (c) { return { id: c.id, x: c.x, y: c.y, loot: c.loot, open: !!g.opened[F.map.id + ':' + c.id] }; });
  };
  var lookCache = {};
  function lookOf(e) {
    var d = e.def;
    if (d.look) return d.look;
    var k = e.id + '|' + e.kind;
    if (lookCache[k]) return lookCache[k];
    var L;
    if (d.cast && art.CAST[d.cast]) L = art.CAST[d.cast].look;
    else if (art.CAST[e.kind]) L = art.CAST[e.kind].look;
    else L = art.npcLook(e.kind, FP.hash(e.id.length * 31 + e.id.charCodeAt(0), e.id.charCodeAt(e.id.length - 1)));
    lookCache[k] = L; return L;
  }
  F.lookOf = lookOf;

  F.enter = function (mapId, x, y, dir, o) {
    o = o || {};
    var g = G(), m = FP.getMap(mapId), fromMap = F.map;
    F.map = m; g.map = mapId;
    F.ents = makeEnts(m); F.pl = { player: true };
    F.tx = x; F.ty = y; F.px = x * 16; F.py = y * 16; F.dir = dir || 'd'; F.moving = null;
    F.extra = [];
    F.refresh();
    if (!m._bake) m._bake = art.bakeMap(m);
    F.encCount = FP.ri(12, 26);
    F.snapCam();
    if (FP.music && m.music && !o.keepMusic) FP.music.play(m.music);
    g.x = x; g.y = y; g.dir = F.dir;
    if (!o.silent && m.name && (!fromMap || fromMap.name !== m.name)) U.banner(m.name);
    if (FP.story && FP.story.onEnter) FP.story.onEnter(m);
  };
  F.snapCam = function () {
    var m = F.map, cx = F.px + 8 - FP.W / 2, cy = F.py + 8 - FP.H / 2;
    var mw = m.w * 16, mh = m.h * 16;
    F.cam.x = mw <= FP.W ? -Math.floor((FP.W - mw) / 2) : FP.clamp(Math.round(cx), 0, mw - FP.W);
    F.cam.y = mh <= FP.H ? -Math.floor((FP.H - mh) / 2) : FP.clamp(Math.round(cy), 0, mh - FP.H);
  };

  F.transition = async function (mapId, x, y, dir, o) {
    o = o || {};
    F.lock();
    await U.fade(true, o.white, o.ms || 220);
    F.enter(mapId, x, y, dir, o);
    F.unlock();
    await U.fade(false, false, o.ms || 220);
    if (o.autosave !== false && FP.menus && FP.menus.autosave) FP.menus.autosave();
  };

  F.doWarp = async function (w) {
    var g = G(), m = F.map;
    if (w.need && !g.flags[w.need]) {
      if (w.ev && FP.story) await FP.story.run(w.ev, null, w);
      else if (w.deny) await U.say(null, w.deny);
      return;
    }
    if (w.cond && !w.cond(g)) { if (w.deny) await U.say(null, w.deny); return; }
    var dest = { x: w.x, y: w.y, dir: w.dir };
    if (w.to === 'over' && !w.x && !w.y) dest = FP.overReturn(m.id);
    else if (w.stairs) { var rr = FP.resolveWarp(w, w.to); if (rr) dest = rr; }
    FP.sfx[w.stairs ? 'stairs' : 'door']();
    await F.transition(w.to, dest.x, dest.y, dest.dir || w.dir || 'd');
  };

  /* ---------- player input ---------- */
  F.handler = { onKey: function (k) {
    if (!F.free()) return;
    if (k === 'a') F.interact();
    else if (k === 'menu' || k === 'b') { if (FP.menus) FP.menus.open(); }
  } };
  F.begin = function () { F.active = true; if (FP.topFocus() !== F.handler) FP.pushFocus(F.handler); };
  F.end = function () { F.active = false; FP.popFocus(F.handler); };

  function facing() { var d = DV[F.dir]; return { x: F.tx + d[0], y: F.ty + d[1] }; }
  F.interact = async function () {
    var f = facing(), g = G(), m = F.map;
    var c = chestAt(f.x, f.y);
    if (c) { if (!c.open) await F.openChest(c); else await U.say(null, 'Empty.'); return; }
    var e = entAt(f.x, f.y);
    if (!e) {
      var t = tileAt(f.x, f.y), d2 = DV[F.dir];
      if (t === TI.COUNTER || t === TI.TABLE) { var e2 = entAt(f.x + d2[0], f.y + d2[1]); if (e2 && e2.def && (e2.def.shop || e2.def.inn || e2.def.say || e2.def.smith || e2.def.kinshop)) e = e2; }
    }
    if (e) { await F.talk(e); return; }
    var key = f.x + ',' + f.y, a = m.acts[key];
    if (a) { await F.runAct(a); return; }
    var t2 = tileAt(f.x, f.y);
    if (t2 === TI.SHRINE || t2 === TI.OSHRINE) { await F.shrine(f.x, f.y); return; }
    if (t2 === TI.SIGN) { await U.say(null, 'Nothing is written on it.'); return; }
    if (t2 === TI.BED) { await U.say(null, 'A bed.'); return; }
    if (t2 === TI.POT || t2 === TI.BARREL || t2 === TI.CRATE) { await U.say(null, FP.pick(['Nothing but dust.', 'Empty.', 'Smells like old bread.', 'Just clutter.'])); return; }
    if (t2 === TI.SHELF || t2 === TI.SHELFW) { await U.say(null, FP.pick(['Old books. Some are in a language you cannot read.', 'Jars and tins. Nothing you need.', 'Dusty shelves.'])); return; }
    if (t2 === TI.HEARTH) { await U.say(null, 'A warm hearth. The fire crackles.'); return; }
    if (t2 === TI.WELL) { await U.say(null, 'You peer in. Your reflection waves.'); return; }
  };
  F.runAct = async function (a) {
    if (a.ev && FP.story) { await FP.story.run(a.ev, null, a); return; }
    if (a.text) await U.say(null, a.text);
    if (a.rest) { if (await U.confirm('Rest here', 'Not now')) await FP.menus.restHere(); }
  };

  F.talk = async function (e) {
    var d = e.def, g = G();
    F.lock();
    if (!d.cage && !d.noturn && !d.kin) { e.dir = OPP[F.dir]; }
    try {
      var who = F.speaker(e);
      if (typeof d.say === 'string' && d.say.indexOf('ev:') === 0) { await FP.story.run(d.say.slice(3), e); }
      else if (d.shop || d.inn || d.smith || d.kinshop) {
        var greet = d.greet || (d.shop ? 'Welcome. Take a look.' : d.inn ? 'Rest your feet.' : d.smith ? 'Gear temper' + 'ing, that\'s my trade.' : 'Come meet the Kin.');
        await U.say(who, greet, { keep: true });
        var opts = d.shop ? ['Buy', 'Sell', 'Leave'] : d.inn ? ['Rest (' + d.inn + 'G)', 'Leave'] : d.smith ? ['Temper gear', 'Leave'] : ['Adopt a Kin', 'Leave'];
        var i = await U.choice(opts, { cancel: opts.length - 1 });
        U.hideDlg();
        if (d.shop) { if (i === 0) await FP.menus.shop(d.shop); else if (i === 1) await FP.menus.sell(); }
        else if (d.inn) { if (i === 0) await FP.menus.inn(d.inn, who); }
        else if (d.smith) { if (i === 0) await FP.menus.smith(); }
        else if (d.kinshop) { if (i === 0) await FP.menus.kinShop(d.kinshop); }
      } else {
        var lines = typeof d.say === 'function' ? d.say(g, e) : d.say;
        if (!lines) lines = ['...'];
        if (!Array.isArray(lines)) lines = [lines];
        for (var i2 = 0; i2 < lines.length; i2++) {
          var ln = lines[i2];
          if (Array.isArray(ln)) await U.say(ln[0], ln[1]);
          else await U.say(who, ln);
        }
        if (d.kin) { FP.sfx.blip(); }
      }
    } finally { F.unlock(); }
  };
  F.speaker = function (e) {
    var d = e.def;
    if (d.kin) return { name: d.name };
    if (d.cast && art.CAST[d.cast]) return d.cast;
    var key = 'np_' + e.id;
    var L = lookOf(e);
    return { name: d.name, port: { look: L, mood: 'calm', bg: ['#2a2f5a', '#5a3a7a'], eye: '#4a5a8a', wrinkles: e.kind === 'elder' } };
  };

  /* ---------- chests and loot ---------- */
  F.giveLoot = async function (loot) {
    var g = G(), D = FP.D, msg = '';
    if (loot.gold) { g.gold += loot.gold; msg = 'Found ' + loot.gold + ' gold!'; FP.sfx.coin(); }
    else if (loot.item) { FP.addItem(loot.item, loot.n || 1); msg = 'Found ' + (loot.n > 1 ? loot.n + ' ' : 'a ') + D.ITEMS[loot.item].name + (loot.n > 1 ? 's' : '') + '!'; }
    else if (loot.gear) {
      var id = loot.id || (loot.gear === 'weapon' ? D.weaponFor(g.cls, loot.tier).id : D.armorFor(g.cls, loot.tier).id);
      FP.addGear(id); msg = 'Found ' + D.GEAR[id].name + '!';
    } else if (loot.kin) { return; }
    await U.say(null, msg);
  };
  F.openChest = async function (c) {
    var g = G();
    F.lock(); FP.sfx.chest();
    c.open = true; g.opened[F.map.id + ':' + c.id] = 1;
    await FP.sleep(250);
    await F.giveLoot(c.loot);
    F.unlock();
  };

  /* ---------- shrines ---------- */
  F.shrine = async function (x, y) {
    var g = G();
    F.lock();
    await U.say(null, 'A Lamp Shrine. Its light is steady and warm.', { keep: true });
    var i = await U.choice(['Rest and save', 'Rest only', 'Leave'], { cancel: 2 });
    U.hideDlg();
    if (i === 0 || i === 1) {
      await U.fade(true, false, 250);
      FP.healAll(true); FP.sfx.heal();
      g.shrine = { map: F.map.id, x: F.tx, y: F.ty, dir: F.dir };
      await FP.sleep(300);
      await U.fade(false, false, 250);
      if (i === 0) { var ok = FP.menus.saveGame(); FP.sfx.save(); await U.say(null, ok ? 'Your journey is saved as "' + g.name + '".' : 'The light flickers. Saving failed. Is browser storage full?'); }
      else await U.say(null, 'You feel renewed.');
    }
    F.unlock();
  };

  /* ---------- scripted movement ---------- */
  F.walk = function (id, steps, o) {
    o = o || {};
    return new Promise(function (resolve) {
      var ent = id === 'player' ? null : F.npcById(id) || (F.extra.filter(function (e) { return e.id === id; })[0]);
      var q = [];
      steps.forEach(function (s) { for (var i = 0; i < (s[1] || 1); i++) q.push(s[0]); });
      var idx = 0, sp = o.speed || 1;
      function next() {
        if (idx >= q.length) { resolve(); return; }
        var d = q[idx++], v = DV[d];
        if (id === 'player') {
          F.dir = d; F.moving = { sx: F.tx, sy: F.ty, tx: F.tx + v[0], ty: F.ty + v[1], p: 0, sp: SPEED * sp, scripted: true, cb: next };
          F.parity ^= 1;
        } else {
          ent.dir = d; ent.moving = { sx: ent.x, sy: ent.y, tx: ent.x + v[0], ty: ent.y + v[1], p: 0, sp: SPEED * sp * 0.9, cb: next }; ent.mx = ent.x + v[0]; ent.my = ent.y + v[1]; ent.parity ^= 1;
        }
      }
      next();
    });
  };
  F.face = function (id, dir) {
    if (id === 'player') { F.dir = dir; return; }
    var e = F.npcById(id) || F.extra.filter(function (e) { return e.id === id; })[0]; if (e) e.dir = dir;
  };
  F.faceToward = function (id, tx, ty) {
    var e = id === 'player' ? { x: F.tx, y: F.ty } : (F.npcById(id) || F.extra.filter(function (e) { return e.id === id; })[0]);
    if (!e) return; var dx = tx - e.x, dy = ty - e.y, d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u');
    F.face(id, d);
  };
  F.setNpc = function (id, o) {
    var e = F.npcById(id) || F.extra.filter(function (e) { return e.id === id; })[0]; if (!e) return null;
    for (var k in o) e[k] = o[k];
    if (o.x !== undefined) { e.px = undefined; e.moving = null; }
    return e;
  };
  F.addNpc = function (def) {
    var e = { id: def.id, def: def, x: def.x, y: def.y, mx: 0, my: 0, dir: def.dir || 'd', moving: null, visible: true, name: def.name, kind: def.kind, wander: 0, wt: 99, hx: def.x, hy: def.y, ghost: !!def.ghost, frame: 0, parity: 0, t: 0 };
    F.ents.push(e); F.extra.push(e); return e;
  };
  F.removeNpc = function (id) { F.ents = F.ents.filter(function (e) { return e.id !== id; }); F.extra = F.extra.filter(function (e) { return e.id !== id; }); };
  F.hideNpc = function (id) { var e = F.npcById(id); if (e) { e.hidden = true; e.visible = false; } };
  F.showNpc = function (id) { var e = F.npcById(id); if (e) { e.hidden = false; e.visible = true; } };
  F.doShake = function (ms) { F.shake = (ms || 400) / 1000; };
  F.doFlash = function () { F.flash = 0.5; };
  F.teleportPlayer = function (x, y, dir) { F.tx = x; F.ty = y; F.px = x * 16; F.py = y * 16; if (dir) F.dir = dir; F.moving = null; F.snapCam(); };

  /* ---------- stepping and triggers ---------- */
  async function onArrive() {
    var g = G(), m = F.map, key = F.tx + ',' + F.ty;
    g.x = F.tx; g.y = F.ty; g.dir = F.dir; g.steps = (g.steps || 0) + 1;
    var w = m.warps[key];
    if (w) { await F.doWarp(w); return; }
    var ev = m.steps[key];
    if (ev && FP.story) { await FP.story.run(ev, null, { x: F.tx, y: F.ty }); return; }
    if (m.zones) {
      for (var i = 0; i < m.zones.length; i++) {
        var z = m.zones[i];
        if (F.tx >= z.x && F.tx < z.x + z.w && F.ty >= z.y && F.ty < z.y + z.h) { if (FP.story && !(F.busy)) { await FP.story.run(z.ev, null, z); return; } }
      }
    }
    /* encounters */
    var t = tileAt(F.tx, F.ty);
    var zone = m.zoneAt ? m.zoneAt(F.tx, F.ty) : m.zone;
    if (zone && art.isEnc(t) && !g.flags.noEnc && !m.noEnc) {
      F.encCount--;
      if (F.encCount <= 0) { F.encCount = FP.ri(11, 26); await FP.battle.wild(zone); }
    }
    /* poison-like steps: Kin and hero regain a trickle of HP when walking? (no) */
  }

  F.update = function (dt) {
    if (!F.map) return;
    F.time += dt;
    var g = G(); if (g) g.play = (g.play || 0) + dt;
    var i, e;
    /* player movement */
    if (F.moving) {
      var mv = F.moving, run = FP.held.b && !mv.scripted ? 1.55 : 1;
      mv.p += dt * mv.sp * run;
      var p = Math.min(1, mv.p);
      F.px = (mv.sx + (mv.tx - mv.sx) * p) * 16; F.py = (mv.sy + (mv.ty - mv.sy) * p) * 16;
      if (mv.p >= 1) {
        F.tx = mv.tx; F.ty = mv.ty; F.px = F.tx * 16; F.py = F.ty * 16; F.moving = null;
        FP.sfx.step();
        if (mv.cb) { var cb = mv.cb; cb(); }
        else {
          F.busy = true;
          onArrive().then(function () { F.busy = false; }, function (er) { F.busy = false; console.error(er); });
        }
      }
    } else if (F.free()) {
      var dirs = ['up', 'down', 'left', 'right'], code = { up: 'u', down: 'd', left: 'l', right: 'r' }, d = null;
      for (i = 0; i < 4; i++) if (FP.held[dirs[i]]) { d = code[dirs[i]]; if (d === F.lastDir) break; }
      if (d) {
        F.lastDir = d;
        if (F.dir !== d) { F.dir = d; F.turnDelay = 0.075; }
        if (F.turnDelay > 0) F.turnDelay -= dt;
        else {
          var v = DV[d], nx = F.tx + v[0], ny = F.ty + v[1];
          if (walkable(nx, ny, F.pl)) { F.moving = { sx: F.tx, sy: F.ty, tx: nx, ty: ny, p: 0, sp: SPEED }; F.parity ^= 1; }
          else if (!(F.bumpT > 0)) { F.bumpT = 0.3; if (art.isSolid(tileAt(nx, ny)) || entAt(nx, ny)) FP.sfx.bump(); }
        }
      } else { F.lastDir = null; F.turnDelay = 0; }
      if (F.bumpT > 0) F.bumpT -= dt;
    }
    /* entities */
    for (i = 0; i < F.ents.length; i++) {
      e = F.ents[i]; e.t += dt;
      if (e.moving) {
        var m2 = e.moving; m2.p += dt * m2.sp;
        var pp = Math.min(1, m2.p);
        e.px = (m2.sx + (m2.tx - m2.sx) * pp) * 16; e.py = (m2.sy + (m2.ty - m2.sy) * pp) * 16;
        if (m2.p >= 1) { e.x = m2.tx; e.y = m2.ty; e.px = e.x * 16; e.py = e.y * 16; e.moving = null; if (m2.cb) m2.cb(); }
      } else {
        e.px = e.x * 16; e.py = e.y * 16;
        if (e.wander && e.visible && F.locked === 0 && !F.moving) {
          e.wt -= dt;
          if (e.wt <= 0) {
            e.wt = 1.2 + Math.random() * 3.5;
            var dd = FP.pick(['u', 'd', 'l', 'r']), vv = DV[dd], nx2 = e.x + vv[0], ny2 = e.y + vv[1];
            e.dir = dd;
            if (Math.abs(nx2 - e.hx) <= e.wander && Math.abs(ny2 - e.hy) <= e.wander && walkable(nx2, ny2, e) && !(nx2 === F.tx && ny2 === F.ty) && !art.isEnc(tileAt(nx2, ny2)) && !F.map.warps[nx2 + ',' + ny2] && !F.map.acts[nx2 + ',' + ny2]) {
              e.moving = { sx: e.x, sy: e.y, tx: nx2, ty: ny2, p: 0, sp: 2.6 }; e.mx = nx2; e.my = ny2; e.parity ^= 1;
            }
          }
        }
      }
    }
    if (F.shake > 0) F.shake -= dt;
    if (F.flash > 0) F.flash -= dt;
    /* camera follows with a little smoothing at map edges handled by clamp */
    var m = F.map, cx = F.px + 8 - FP.W / 2, cy = F.py + 8 - FP.H / 2, mw = m.w * 16, mh = m.h * 16;
    F.cam.x = mw <= FP.W ? -Math.floor((FP.W - mw) / 2) : FP.clamp(Math.round(cx), 0, mw - FP.W);
    F.cam.y = mh <= FP.H ? -Math.floor((FP.H - mh) / 2) : FP.clamp(Math.round(cy), 0, mh - FP.H);
  };

  /* ---------- drawing ---------- */
  var dark = null;
  function darkMask() {
    if (dark) return dark;
    dark = art.canvas(FP.W * 2, FP.H * 2); var x = dark.getContext('2d');
    var gr = x.createRadialGradient(FP.W, FP.H, 26, FP.W, FP.H, 78);
    gr.addColorStop(0, 'rgba(6,4,18,0)'); gr.addColorStop(0.55, 'rgba(6,4,18,0.62)'); gr.addColorStop(1, 'rgba(6,4,18,0.94)');
    x.fillStyle = gr; x.fillRect(0, 0, FP.W * 2, FP.H * 2);
    return dark;
  }
  function frameFor(moving, parity, p) {
    if (!moving) return 0;
    if (p < 0.2 || p > 0.8) return 0;
    return parity ? 1 : 3;
  }
  function drawKinSprite(g, sp, x, y, t) {
    var ic = art.creatureIcon(sp); g.drawImage(ic, Math.round(x), Math.round(y) - 2 + (Math.sin(t * 4) > 0.6 ? -1 : 0));
  }
  F.draw = function (g) {
    var m = F.map; if (!m) return;
    var cx = F.cam.x, cy = F.cam.y, sx = 0, sy = 0;
    if (F.shake > 0) { sx = Math.round((Math.random() - 0.5) * 4); sy = Math.round((Math.random() - 0.5) * 4); }
    g.fillStyle = '#0d0b1a'; g.fillRect(0, 0, FP.W, FP.H);
    g.save(); g.translate(sx, sy);
    art.drawBake(g, m._bake, cx, cy);
    var frame = Math.floor(F.time * 5) & 3;
    var x0 = Math.max(0, Math.floor(cx / 16)), x1 = Math.min(m.w - 1, Math.floor((cx + FP.W) / 16)), y0 = Math.max(0, Math.floor(cy / 16)), y1 = Math.min(m.h - 1, Math.floor((cy + FP.H) / 16));
    var x, y;
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
      var t = m.t[y * m.w + x];
      if (art.isAnim(t)) g.drawImage(art.tile(t, m.themeAt ? m.themeAt(x, y) : m.theme, FP.hash(x, y) & 7, frame), x * 16 - cx, y * 16 - cy);
    }
    /* chests */
    var list = [], i;
    (F.chests || []).forEach(function (c) { list.push({ y: c.y * 16, draw: function () { g.drawImage(chestSprite(c.open), c.x * 16 - cx, c.y * 16 - cy); } }); });
    F.ents.forEach(function (e) {
      if (!e.visible) return;
      var px = (e.px !== undefined ? e.px : e.x * 16), py = (e.py !== undefined ? e.py : e.y * 16);
      list.push({ y: py, draw: function () {
        g.drawImage(shadowSprite(), Math.round(px - cx) + 2, Math.round(py - cy) + 11);
        if (e.kind && e.kind.indexOf('kin:') === 0) {
          drawKinSprite(g, e.kind.slice(4), px - cx, py - cy, e.t + (e.x * 3));
          if (e.def.cage) { g.fillStyle = 'rgba(40,40,60,0.9)'; for (var b = 0; b < 4; b++) g.fillRect(Math.round(px - cx) + 2 + b * 4, Math.round(py - cy) + 2, 1, 13); g.fillRect(Math.round(px - cx) + 1, Math.round(py - cy) + 2, 14, 1); g.fillRect(Math.round(px - cx) + 1, Math.round(py - cy) + 14, 14, 1); }
        } else {
          var p = e.moving ? Math.min(1, e.moving.p) : 0;
          art.drawChar(g, lookOf(e), e.dir, frameFor(e.moving, e.parity, p), Math.round(px - cx), Math.round(py - cy), 0);
        }
      } });
    });
    var pp = F.moving ? Math.min(1, F.moving.p) : 0;
    list.push({ y: F.py + 0.5, draw: function () {
      g.drawImage(shadowSprite(), Math.round(F.px - cx) + 2, Math.round(F.py - cy) + 11);
      if (G().look) art.drawChar(g, FP.heroLook(), F.dir, frameFor(F.moving, F.parity, pp), Math.round(F.px - cx), Math.round(F.py - cy), 0);
    } });
    list.sort(function (a, b) { return a.y - b.y; });
    list.forEach(function (it) { it.draw(); });
    /* followers: first Kin trails the hero (drawn lightly) */
    g.restore();
    if (m.dark) { var dm = darkMask(); g.drawImage(dm, Math.round(F.px - cx + 8 - FP.W), Math.round(F.py - cy + 8 - FP.H)); }
    if (F.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + Math.min(1, F.flash * 2) + ')'; g.fillRect(0, 0, FP.W, FP.H); }
  };
})(FP);
