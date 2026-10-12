/* Dawnbound - story runner: cutscene API, quests, triggers, map transitions */
(function () {
  'use strict';
  var DB = window.DB, W = DB.world, UI = DB.ui, C = DB.combat;
  var ST = DB.story = { running: false, queue: [], depth: 0 };
  DB.scenes = DB.scenes || {};
  DB.questDefs = DB.questDefs || {};
  var CLASS = { caelan: 'knight', liora: 'healer', vex: 'rogue', rowan: 'hunter', brakka: 'berserker', seraphine: 'mage' };

  /* ================= scene API ================= */
  function makeS(ent) {
    var G = DB.G, S = { ent0: ent };
    S.G = G;
    S.hero = function () { return G.hero; };
    S.cls = function () { return CLASS[G.hero]; };
    S.is = function (id) { return G.hero === id; };
    S.flag = function (k, v) { if (v === undefined) return G.flags[k]; G.flags[k] = v; return v; };
    /* pick a line by the hero's class: map keys knight/healer/... or hero ids, '_' fallback */
    S.v = function (m) { if (typeof m === 'string') return m; return m[CLASS[G.hero]] || m[G.hero] || m._ || m.all || ''; };
    S.say = function (who, text, o) { return UI.say(who, text, o); };
    S.hsay = function (m, expr) { var t = S.v(m); if (!t) return Promise.resolve(); return UI.say('HERO', t, expr); };
    S.narr = function (text) { return UI.say(null, text); };
    S.lines = function (npc, lines) {
      var key = npc && (npc.def && npc.def.speaker || npc.id); if (!DB.speakers[key] && npc && npc.sprite) key = npc.sprite;
      var p = Promise.resolve();
      lines.forEach(function (l) { p = p.then(function () { if (Array.isArray(l)) return UI.say(l[0], l[1], l[2]); if (typeof l === 'function') return l(S); return UI.say(key, l); }); });
      return p;
    };
    S.choice = function (prompt, opts) { return UI.choice(prompt, opts); };
    S.wait = function (ms) { return DB.sleep(ms); };
    S.fade = function (to, ms, color) { return W.doFade(to, ms == null ? 600 : ms, color || '#000'); };
    S.flash = function (color, ms) { return W.doFlash(color, ms); };
    S.shake = function (a) { W.shakeCam(a == null ? 8 : a); };
    S.tint = function (color, a) { W.tint = a ? { color: color, a: a } : null; };
    S.music = function (n, f) { DB.audio.music(n, f); };
    S.sfx = function (n, o) { DB.audio.sfx(n, o); };
    S.cinema = function (on) { var from = W.letterbox; return DB.tween(500, function (t) { W.letterbox = from + ((on ? 1 : 0) - from) * t; }); };
    S.card = function (title, sub, ms) { return UI.card('<div class="ct">' + DB.esc(title) + '</div>' + (sub ? '<div class="cs">' + DB.esc(sub) + '</div>' : ''), ms || 2800); };
    S.cardText = function (html, ms, keep) { return UI.card(html, ms, keep); };
    S.banner = function (t, s) { return UI.banner(t, s); };
    S.toast = function (m, k) { DB.toast(m, k); };
    /* entities */
    S.ent = function (id) {
      if (id && typeof id === 'object') return id;
      if (id === 'HERO') id = G.hero;
      var e = W.find(id); if (e) return e;
      for (var i = 0; i < W.party.length; i++) if (W.party[i].hero === id) return W.party[i];
      return null;
    };
    S.spawn = function (id, sprite, x, y, dir, o) {
      o = o || {}; var old = W.find(id); if (old) W.remove(old);
      var e = DB.makeNpc({ id: id, sprite: sprite, name: o.name || (DB.speakers[id] && DB.speakers[id].name) || id, x: x, y: y, dir: dir || 'down', scale: o.scale, tint: o.tint, tintAmt: o.tintAmt, alpha: o.alpha, noInteract: true, fly: o.fly });
      e.scripted = true; e.noInteract = true; if (o.noShadow) e.noShadow = true; if (o.z) e.z = o.z; W.ents.push(e);
      DB.assets.loadChars([sprite]); return e;
    };
    S.spawnHero = function (id, x, y, dir) { var spr = id + '_' + (DB.G.members[id] ? DB.heroForm(id) : 'starter'); var e = S.spawn(id, spr, x, y, dir, { name: DB.heroes[id].short }); return e; };
    S.despawn = function (id) { var e = S.ent(id); if (e && e.type !== 'player') W.remove(e); };
    S.place = function (id, x, y, dir) { var e = S.ent(id); if (!e) return; e.x = x; e.y = y; if (dir) e.dir = dir; };
    S.face = function (id, to) { var e = S.ent(id); if (!e) return; if (typeof to === 'string') e.dir = to; else { var t = S.ent(to) || to; e.dir = DB.dirOf(t.x - e.x, t.y - e.y); } W.play(e, 'idle', true); };
    S.anim = function (id, name) { var e = S.ent(id); if (e) { W.play(e, name, true); } };
    S.alpha = function (id, a, ms) { var e = S.ent(id); if (!e) return; var f = e.alpha == null ? 1 : e.alpha; return DB.tween(ms || 500, function (t) { e.alpha = f + (a - f) * t; }); };
    S.walk = function (id, x, y, speed) {
      var e = S.ent(id); if (!e) return Promise.resolve(); speed = speed || 62;
      return new Promise(function (res) {
        var last = performance.now(); e.scripted = true; e.moving = true;
        (function step(now) {
          var dt = Math.min(.05, (now - last) / 1000); last = now; var dx = x - e.x, dy = y - e.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 2.5) { e.moving = false; W.play(e, 'idle'); res(); return; }
          if (e.type !== 'npc' || true) e.dir = DB.dirOf(dx, dy); W.play(e, 'walk');
          var s = Math.min(d, speed * dt); e.x += dx / d * s; e.y += dy / d * s; requestAnimationFrame(step);
        })(last);
      });
    };
    /* several walks at once: S.walkAll([[id,x,y],...]) */
    S.walkAll = function (list, speed) { return Promise.all(list.map(function (l) { return S.walk(l[0], l[1], l[2], l[3] || speed); })); };
    S.cam = function (x, y, ms) {
      var c = W.cam; c.follow = null; var sx = c.x, sy = c.y; ms = ms == null ? 900 : ms; c.tx = x; c.ty = y; if (!ms) { c.x = x; c.y = y; return Promise.resolve(); }
      return DB.tween(ms, function (t) { c.x = sx + (x - sx) * t; c.y = sy + (y - sy) * t; c.tx = c.x; c.ty = c.y; }, DB.easeInOut);
    };
    S.camFollow = function (id) { var e = id ? S.ent(id) : W.player; W.cam.follow = e; };
    S.partyAt = function (x, y, dir) { W.party.forEach(function (p, i) { p.x = x + (i % 3 - 1) * 20; p.y = y + Math.floor(i / 3) * 16 + (i % 2) * 6; p.dir = dir || 'up'; W.play(p, 'idle', true); }); if (W.ash) { W.ash.x = x + 34; W.ash.y = y + 10; } };
    S.partyWalk = function (x, y, speed) { return Promise.all(W.party.map(function (p, i) { return S.walk(p, x + (i % 3 - 1) * 20, y + Math.floor(i / 3) * 16 + (i % 2) * 6, speed); })); };
    S.partyRing = function (x, y, r, face) { var n = W.party.length; W.party.forEach(function (p, i) { var a = (i / n) * Math.PI * 2 + .6; p.x = x + Math.cos(a) * r; p.y = y + Math.sin(a) * r * .6; p.dir = face || DB.dirOf(x - p.x, y - p.y); W.play(p, 'idle', true); }); if (W.ash) { W.ash.x = x + r * .5; W.ash.y = y + r * .8; } };
    S.partyFace = function (dir) { W.party.forEach(function (p) { p.dir = dir; W.play(p, 'idle', true); }); };
    S.fx = function (name, x, y, o) { return W.fx(name, x, y, o); };
    /* party & items */
    S.join = function (id, o) { DB.join(id, o); UI.invalidateParty(); DB.toast(DB.heroes[id].short + ' joined the party!', 'quest'); DB.audio.sfx('quest_complete'); };
    S.leave = function (id) { DB.leave(id); UI.invalidateParty(); };
    S.setParty = function (ids) { G.partyBackup = G.partyBackup || G.party.slice(); G.party = ids.filter(function (i) { return G.members[i]; }); UI.invalidateParty(); };
    S.restoreParty = function () { if (G.partyBackup) { G.party = G.partyBackup.filter(function (i) { return G.members[i]; }); G.partyBackup = null; UI.invalidateParty(); } };
    S.give = function (id, n, quiet) { DB.addItem(id, n || 1); if (!quiet) { DB.toast('Received ' + ((n || 1) > 1 ? n + '× ' : '') + DB.itemName(id), 'item'); DB.audio.sfx('coin_pickup'); } };
    S.take = function (id, n) { DB.addItem(id, -(n || 1)); };
    S.gold = function (n) { G.gold += n; DB.toast((n >= 0 ? 'Received ' : 'Paid ') + Math.abs(n) + ' gold', 'gold'); DB.audio.sfx('coin_pickup'); };
    S.xp = function (n, silent) { n = Math.round(n * (DB.XP_SCALE || .6)); DB.gainXp(n, silent); if (!silent) DB.toast('+' + DB.fmt(n) + ' XP', 'quest'); };
    S.equipGet = function (id) { DB.addItem(id, 1); DB.toast('Received ' + DB.itemName(id), 'item'); };
    S.ensureLevel = function (lv) { DB.ensureLevel(lv); };
    S.affinity = function (id, n) { DB.addAffinity(id, n || 1); };
    S.healAll = function () { DB.healAll(); };
    /* quests */
    S.quest = function (id) { DB.quests.start(id); };
    S.done = function (id) { DB.quests.done(id); };
    S.mq = function (n) { G.flags.mq = n; };
    /* movement between maps */
    S.map = function (id, spawn, o) { return DB.go(id, spawn, o); };
    /* combat. These END the scene; onWin names the follow-up scene. */
    S.boss = function (key, o) { o = o || {}; var after = o.onWin; o.onWin = typeof after === 'string' ? after : after; ST._endForCombat = true; return DB.startBossFight(key, o); };
    S.battle = function (spec, o) { ST._endForCombat = true; return DB.startBattle(spec, o || {}); };
    S.end = function () { };
    S.sail = function () { return DB.menus.worldMap(); };
    S.qte = function (o) { return DB.mini.qte(o); };
    S.mini = DB.mini;
    S.save = function () { DB.saveAuto(); };
    S.run = function (name) { return DB.scenes[name](S, ent); };
    S.title = function () { };
    S.timerOn = function () { };
    S.noCount = function () { return G.noCount || 0; };
    S.wait2 = S.wait;
    return S;
  }
  /* ================= runner ================= */
  function begin() {
    ST.prevMode = W.mode === 'scene' || W.mode === 'cutscene' ? ST.prevMode || 'field' : W.mode; W.mode = 'scene';
    UI.hud(false); DB.input.stick = null; ST._endForCombat = false;
    W.player && (W.player.act = null);
  }
  function finish() {
    UI.hideDialogue(); DB.input.lock(220);
    if (ST._endForCombat) { W.mode = 'field'; UI.hud(true); UI.invalidateParty(); }
    else if (W.mode === 'scene' || W.mode === 'cutscene') { W.mode = ST.prevMode && ST.prevMode !== 'title' ? ST.prevMode : 'field'; if (W.mode === 'field') UI.hud(true); }
    if (W.mode === 'field' || W.mode === 'scene') { if (W.cam.follow == null && W.player) W.cam.follow = W.player; }
    W.letterbox = 0;
    UI.invalidateParty();
  }
  function exec(fn, ent) {
    var S = makeS(ent);
    return Promise.resolve().then(function () { return fn(S, ent); }).catch(function (e) { console.error('scene error', e); DB.toast('Scene error: ' + (e && e.message)); });
  }
  ST.runFn = function (fn, ent) {
    if (ST.running) { return new Promise(function (res) { ST.queue.push([fn, ent, res]); }); }
    ST.running = true; begin();
    return exec(fn, ent).then(function () { ST.running = false; return next(); }, function () { ST.running = false; return next(); }).then(finishIfIdle);
  };
  function next() {
    if (ST.queue.length) { var q = ST.queue.shift(); ST.running = true; return exec(q[0], q[1]).then(function () { ST.running = false; q[2](); return next(); }); }
  }
  function finishIfIdle() { if (!ST.running && !ST.queue.length) finish(); }
  ST.run = function (name, ent) {
    var fn = DB.scenes[name]; if (!fn) { console.warn('missing scene', name); return Promise.resolve(); }
    if (DB.debugScenes) console.log('SCENE', name, 'running=' + ST.running);
    return ST.runFn(fn, ent);
  };
  /* nested scene call used inside other scenes */
  ST.sub = function (S, name) { return DB.scenes[name](S, S.ent0); };

  /* ================= combat starters ================= */
  DB.startBossFight = function (key, o) {
    o = o || {}; var win = o.onWin;
    var opts = Object.assign({}, o, { onWin: function () { G_flag('boss_' + key, 1); if (typeof win === 'string') return ST.run(win); if (typeof win === 'function') return ST.runFn(win); } });
    W.mode = 'field'; UI.hud(true); UI.hideDialogue();
    var b = C.startBoss(key, opts);
    W.cam.follow = W.player;
    return Promise.resolve(b);
  };
  function G_flag(k, v) { DB.G.flags[k] = v; }
  /* spawn enemies and run a scene when all are defeated */
  DB.startBattle = function (spec, o) {
    o = o || {}; var list = [];
    spec.forEach(function (s) { var n = s.n || 1; for (var i = 0; i < n; i++) { var x = s.x != null ? s.x : W.player.x + DB.rand(-120, 120), y = s.y != null ? s.y : W.player.y - DB.rand(60, 140); if (n > 1 && s.x != null) { x += DB.rand(-40, 40); y += DB.rand(-30, 30); } var e = C.makeEnemy(s.type, s.lv || 1, x, y, s); e.aggroed = true; e.waveBattle = true; if (o.noXp) e.xp = 0; W.ents.push(e); list.push(e); DB.assets.loadChars([e.sprite]); W.fx('shadow', x, y - 10, { scale: .8 }); } });
    ST.wave = { list: list, onWin: o.onWin, done: false, after: o.after };
    W.mode = 'field'; UI.hud(true); UI.hideDialogue(); return Promise.resolve();
  };
  function checkWave() {
    var w = ST.wave; if (!w || w.done) return;
    if (w.list.every(function (e) { return e.dead; })) { w.done = true; ST.wave = null; setTimeout(function () { C.pauseFor(function () { var win = w.onWin; if (typeof win === 'string') return ST.run(win); if (typeof win === 'function') return ST.runFn(win); }); }, 800); }
  }

  /* ================= levels ================= */
  DB.ensureLevel = function (lv) {
    var G = DB.G; G.roster.forEach(function (id) { var m = G.members[id]; if (m.lv < lv) { m.lv = lv; m.xp = Math.max(m.xp, DB.xpFor(lv)); var st = DB.stats(id); m.hp = st.hp; m.mp = st.mp; } });
    UI.invalidateParty();
  };
  /* ================= maps ================= */
  var going = false;
  DB.go = function (id, spawn, o) {
    o = o || {}; if (going) return Promise.resolve(); going = true;
    var fadeMs = o.fade == null ? 450 : o.fade;
    var wasScene = ST.running;
    return W.doFade(1, fadeMs, o.color || '#000').then(function () {
      if (C.boss) { C.boss = null; } C.zones.length = 0; C.bolts.length = 0; C.traps.length = 0; C.freeze = false; ST.wave = null;
      return W.load(id, spawn, o);
    }).then(function () {
      var G = DB.G; G.spawn = spawn || 'start'; W.portalCool = .9; W.cam.snap = true; W.updateCam(1);
      if (!G.visited[id]) G.visited[id] = 1;
      if (W.map.region) G.region = W.map.region;
      return DB.sleep(60);
    }).then(function () {
      going = false; var p = W.doFade(0, fadeMs, o.color || '#000');
      if (!wasScene && !o.noMode) { W.mode = 'field'; UI.hud(true); }
      return p;
    }).then(function () { if (!wasScene && !o.noSave && W.map.autosave !== false) DB.saveAuto(); DB.input.lock(150); });
  };
  DB.retry = function () {
    var G = DB.G; C.gameOverPending = false; C.noMeter = false; DB.healAll(); G.party.forEach(function (id) { G.members[id].hp = Math.max(1, G.members[id].hp); });
    G.gold = Math.floor(G.gold * .9); W.fade.a = 0; ST.running = false; ST.queue.length = 0; ST.wave = null;
    DB.go(G.map, G.spawn || 'start', { noSave: true }).then(function () { DB.toast('The embers rekindle…'); });
  };

  /* ================= quests ================= */
  var Q = DB.quests = {};
  Q.def = function (id, d) { d.id = id; DB.questDefs[id] = d; };
  Q.state = function (id) { return DB.G.quests[id] || null; };
  Q.start = function (id) { var G = DB.G; if (G.quests[id]) return; G.quests[id] = 'active'; var d = DB.questDefs[id]; if (d) { DB.toast('Quest: ' + d.name, 'quest'); if (d.type === 'main' || !G.track) G.track = id; } DB.audio.sfx('ui_confirm'); };
  Q.done = function (id) {
    var G = DB.G; if (G.quests[id] === 'done') return; G.quests[id] = 'done'; var d = DB.questDefs[id];
    if (d) { DB.toast('Quest complete: ' + d.name, 'quest'); DB.audio.sfx('quest_complete'); }
    if (G.track === id) G.track = null;
  };
  Q.active = function (id) { return DB.G.quests[id] === 'active'; };
  Q.isDone = function (id) { return DB.G.quests[id] === 'done'; };
  Q.tracker = function () {
    var G = DB.G; if (!G) return ''; var out = [], seen = 0;
    var tr = G.track && DB.questDefs[G.track]; var mains = Object.keys(G.quests).filter(function (k) { return G.quests[k] === 'active' && DB.questDefs[k] && DB.questDefs[k].type === 'main'; });
    var show = [];
    if (tr && G.quests[G.track] === 'active') show.push(G.track);
    mains.forEach(function (k) { if (show.indexOf(k) < 0) show.push(k); });
    show = show.slice(0, 2);
    show.forEach(function (k) { var d = DB.questDefs[k]; out.push('<b>' + DB.esc(d.name) + '</b><br>' + DB.esc(typeof d.obj === 'function' ? d.obj(G) : d.obj || '')); });
    if (ST.timer) { var tt = Math.max(0, Math.ceil(ST.timer.t)); out.push('<b>' + ST.timer.label + '</b> ' + Math.floor(tt / 60) + ':' + ('0' + tt % 60).slice(-2)); }
    return out.join('<br>');
  };

  /* timed dungeons (e.g. the Drowned Lighthouse) */
  ST.setTimer = function (sec, failScene, label) { ST.timer = { t: sec, fail: failScene, label: label || 'Time' }; };
  ST.clearTimer = function () { ST.timer = null; };
  /* ================= per-frame story tick ================= */
  var trigCool = 0;
  ST.tick = function (dt) {
    if (W.mode !== 'field' || !W.map || ST.running) return;
    var G = DB.G, p = W.player; if (!p) return;
    W.portalCool = Math.max(0, (W.portalCool || 0) - dt);
    checkWave();
    if (ST.timer) { ST.timer.t -= dt; if (ST.timer.t <= 0) { var f = ST.timer.fail; ST.timer = null; ST.run(f); return; } }
    /* quest markers */
    for (var i = 0; i < W.ents.length; i++) { var e = W.ents[i]; if (e.type === 'npc') { var mk = null; try { if (e.q && e.q(G)) mk = 'quest'; } catch (er) { } e.marker = mk; } }
    var m = W.map, j;
    if (m.triggers) for (j = 0; j < m.triggers.length; j++) {
      var t = m.triggers[j]; if (t.disabled) continue; var key = 't_' + W.mapId + '_' + (t.id || j);
      if (t.once !== false && G.flags[key]) continue;
      if (p.x >= t.x && p.x <= t.x + t.w && p.y >= t.y && p.y <= t.y + t.h) {
        if (t.cond && !t.cond(G)) continue;
        if (t.once !== false) G.flags[key] = 1;
        if (t.scene) { var sc = t.scene; if (typeof sc === 'string') ST.run(sc); else ST.runFn(sc); return; }
        if (t.fn) { t.fn(G); return; }
      }
    }
    if (m.portals && W.portalCool <= 0) for (j = 0; j < m.portals.length; j++) {
      var pt = m.portals[j]; if (p.x >= pt.x && p.x <= pt.x + pt.w && p.y >= pt.y && p.y <= pt.y + pt.h) {
        if (pt.cond && !pt.cond(G)) { if (!pt._msg || performance.now() - pt._msg > 3000) { pt._msg = performance.now(); DB.toast(pt.msg || 'You cannot go that way yet.'); } p.x -= (p.x - (pt.x + pt.w / 2)) * .05; continue; }
        if (pt.scene) { ST.run(pt.scene); W.portalCool = 2; return; }
        DB.audio.sfx(pt.sfx || 'footstep_stone'); DB.go(pt.to, pt.spawn); return;
      }
    }
    G.time += dt;
  };
})();
