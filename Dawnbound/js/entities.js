/* Dawnbound - entities: heroes, NPCs, interactive props, interaction */
(function () {
  'use strict';
  var DB = window.DB, W = DB.world, A = DB.assets;
  DB.heroEnt = function (id) {
    var m = DB.G.members[id], h = DB.heroes[id];
    return { type: 'ally', id: id, hero: id, sprite: DB.heroSprite(id), name: h.short, x: 0, y: 0, dir: 'down', r: 6, sr: 10, team: 'p', cds: {}, act: null, anim: 'idle_down', at: 0, vx: 0, vy: 0, inv: 0, shield: 0, buffs: {}, m: m, scale: 1 };
  };
  DB.makeAsh = function (leader) { return { type: 'pet', id: 'ash', sprite: 'ash', name: 'Ash', x: leader.x - 18, y: leader.y + 8, dir: 'down', r: 6, sr: 8, team: 'p', cds: {}, act: null, anim: 'idle_down', at: 0, vx: 0, vy: 0, inv: 0, buffs: {}, scale: .8, hp: 999, maxhp: 999 }; };
  DB.makeNpc = function (n) {
    var e = { type: 'npc', id: n.id, sprite: n.sprite, name: n.name || n.id, x: n.x, y: n.y, hx: n.x, hy: n.y, dir: n.dir || 'down', r: 7, sr: 10, team: 'n', wander: n.wander || 0, speed: n.speed || 26, anim: 'idle_down', at: 0, def: n, talk: n.talk, scale: n.scale || 1, wt: 1 + Math.random() * 3, tint: n.tint, tintAmt: n.tintAmt, alpha: n.alpha, noInteract: n.noInteract, marker: null, q: n.q, shop: n.shop, ghost: n.ghost };
    if (n.fly) e.fly = true;
    return e;
  };
  /* wandering / idle for NPCs */
  DB.npcUpdate = function (dt) {
    if (W.mode !== 'field') { /* scene mode: just animate walking state from movement flags */ }
    for (var i = 0; i < W.ents.length; i++) {
      var e = W.ents[i];
      if (e.type === 'npc' && !e.busy && !e.scripted) {
        if (W.mode === 'field' && e.wander > 0) {
          e.wt -= dt;
          if (e.moving) {
            var dx = e.tx - e.x, dy = e.ty - e.y, d = Math.sqrt(dx * dx + dy * dy);
            if (d < 2) { e.moving = false; e.wt = 1.5 + Math.random() * 3; W.play(e, 'idle'); }
            else { e.dir = DB.dirOf(dx, dy); var sp = e.speed * dt; var ok = W.tryMove(e, dx / d * sp, dy / d * sp); if (!ok) { e.moving = false; e.wt = 1; } W.play(e, 'walk'); }
          } else if (e.wt <= 0) {
            var a = Math.random() * 6.28, r = Math.random() * e.wander; var tx = e.hx + Math.cos(a) * r, ty = e.hy + Math.sin(a) * r;
            if (W.canStand(tx, ty, 22) && W.canStand(tx, ty - 6, 22)) { e.tx = tx; e.ty = ty; e.moving = true; } else e.wt = 1;
          } else W.play(e, 'idle');
        } else if (!e.moving) W.play(e, e.walkingAnim ? 'walk' : 'idle');
      }
      if (e.type === 'prop' && e.update) e.update(dt, e);
      if (e.flashT > 0) e.flashT -= dt;
    }
  };
  /* ---------------- interactive props ---------------- */
  var PS = .5;
  DB.makeObj = function (o) {
    var G = DB.G, key = 'obj_' + W.mapId + '_' + o.id, done = !!G.flags[key];
    var e = { type: 'prop', id: o.id, kind: o.t, x: o.x, y: o.y, def: o, t: 0, state: done ? 1 : 0, z: 0, solid: false, scale: o.scale || PS, key: key, dir: 'down', r: 8 };
    var name = o.t === 'door' ? (o.kind === 'rune' ? 'rune_door' : o.kind === 'portcullis' ? 'portcullis' : 'oak_door') : o.t === 'lever' ? 'lever' : o.t === 'plate' ? 'pressure_plate' : o.t === 'valve' ? 'tide_valve' : o.t === 'cage' ? 'coral_cage' : 'chest';
    e.sprite = name;
    if (o.t === 'chest') { if (G.opened[W.mapId + ':' + o.id]) e.state = 1; }
    if (o.t === 'door') { e.state = (done || o.open) ? 1 : 0; if (e.state === 0 && o.block) W.setRect(o.block[0], o.block[1], o.block[2], o.block[3], 0); if (e.state === 1 && o.block) W.setRect(o.block[0], o.block[1], o.block[2], o.block[3], 1); }
    if (o.t === 'plate') e.state = 0;
    if (o.t === 'spot') { e.kind = 'spot'; e.hidden = false; e.interact = true; e.draw = drawSpot; e.update = null; return e; }
    if (o.t === 'torch' || o.t === 'none') e.hidden = true;
    if (o.t === 'pickup') { e.kind = 'pickup'; if (G.opened[W.mapId + ':' + o.id]) e.state = 1; e.hidden = false; e.interact = true; e.draw = drawPickup; e.update = null; return e; }
    e.anim = { f: e.state ? 3 : 0 };
    e.draw = drawProp; e.update = updateProp;
    e.interact = (o.t === 'chest' || o.t === 'lever' || o.t === 'valve' || o.t === 'cage' || (o.t === 'door' && o.needs) || o.scene || o.talk) ? true : false;
    return e;
  };
  /* editor-placed interact spot: icon 'sign' | 'glow' | 'none' (invisible) */
  function drawSpot(ctx, e) {
    var ic = e.def.icon || 'sign'; if (ic === 'none') return; var t = W.time;
    if (ic === 'glow') { var y = e.y - 8 + Math.sin(t * 3 + e.x) * 2; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .4 + .2 * Math.sin(t * 5 + e.x); var g = ctx.createRadialGradient(e.x, y, 1, e.x, y, 14); g.addColorStop(0, '#bfe9ff'); g.addColorStop(1, 'rgba(120,200,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, y, 14, 0, 6.28); ctx.fill(); ctx.restore(); return; }
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, 9, 3, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(e.x - 1.5, e.y - 14, 3, 14); ctx.fillStyle = '#c79a5a'; ctx.fillRect(e.x - 9, e.y - 24, 18, 11); ctx.strokeStyle = '#3d2a14'; ctx.lineWidth = 1.2; ctx.strokeRect(e.x - 9, e.y - 24, 18, 11);
    ctx.fillStyle = '#3d2a14'; ctx.fillRect(e.x - 6, e.y - 21, 12, 1.4); ctx.fillRect(e.x - 6, e.y - 18, 9, 1.4); ctx.restore();
  }
  function drawPickup(ctx, e) {
    if (e.state) return; var t = W.time, y = e.y - 8 + Math.sin(t * 3 + e.x) * 2;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .45 + .25 * Math.sin(t * 5 + e.x); var g = ctx.createRadialGradient(e.x, y, 1, e.x, y, 16); g.addColorStop(0, '#fff6c0'); g.addColorStop(1, 'rgba(255,200,80,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, y, 16, 0, 6.28); ctx.fill();
    ctx.globalAlpha = .9; ctx.fillStyle = '#fff'; var s = 3 + Math.sin(t * 6 + e.y) * 1.2; ctx.fillRect(e.x - s / 2, y - s / 2, s, s); ctx.restore();
  }
  function drawProp(ctx, e) {
    if (e.hidden) return;
    var s = A.atlas.sheets.effects_interactive, im = A.img['assets/fx/effects_interactive.webp']; if (!s || !im) return;
    var f = Math.round(e.anim.f), fn = e.sprite + '_' + DB.clamp(f, 0, 3), fr = s.frames[fn]; if (!fr) return;
    var sc = e.scale, w = s.w * sc, h = s.h * sc;
    ctx.save(); ctx.globalAlpha = .3; ctx.fillStyle = '#000'; if (e.kind !== 'door' && e.kind !== 'plate') { ctx.beginPath(); ctx.ellipse(e.x, e.y, w * .28, w * .1, 0, 0, 6.28); ctx.fill(); } ctx.restore();
    ctx.drawImage(im, fr[0] * s.w, fr[1] * s.h, s.w, s.h, e.x - w / 2, e.y - h * .93, w, h);
    if (e.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .25 + .15 * Math.sin(W.time * 4); ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(e.x, e.y - h * .4, 14, 0, 6.28); ctx.fill(); ctx.restore(); }
  }
  function updateProp(dt, e) {
    var target = e.state ? 3 : 0;
    if (e.anim.f !== target) { var d = target - e.anim.f; e.anim.f += Math.sign(d) * Math.min(Math.abs(d), dt * 8); }
    if (e.kind === 'plate') {
      var on = false; W.party.forEach(function (p) { if (Math.abs(p.x - e.x) < 14 && Math.abs(p.y - e.y) < 12 && p.m.hp > 0) on = true; });
      if (on && !e.state) { e.state = 1; DB.audio.sfx('lever'); if (e.def.target) DB.objActivate(e.def.target, true); }
      else if (!on && e.state && e.def.hold) { e.state = 0; if (e.def.target) DB.objActivate(e.def.target, false); }
    }
  }
  DB.objActivate = function (id, on) {
    var e = W.find(id); if (!e) return;
    if (e.kind === 'door') { e.state = on ? 1 : 0; DB.G.flags[e.key] = on ? 1 : 0; if (e.def.block) W.setRect(e.def.block[0], e.def.block[1], e.def.block[2], e.def.block[3], on ? 1 : 0); DB.audio.sfx(on ? 'door_open' : 'door_close'); }
    else if (e.kind === 'cage') { e.state = on ? 1 : 0; }
  };
  DB.pickupGet = function (e) {
    var o = e.def, G = DB.G, k = W.mapId + ':' + o.id; if (G.opened[k]) return; G.opened[k] = true; e.state = 1; DB.audio.sfx('coin_pickup');
    if (o.item) { DB.addItem(o.item, o.n || 1); DB.toast('Found: ' + ((o.n || 1) > 1 ? o.n + '× ' : '') + DB.itemName(o.item), 'item'); }
    if (o.flag) G.flags[o.flag] = (G.flags[o.flag] || 0) + 1; if (o.scene) DB.story.run(o.scene); DB.emit('pickup', o.id);
  };
  DB.chestOpen = function (e) {
    var o = e.def, G = DB.G, k = W.mapId + ':' + o.id; if (G.opened[k]) { return DB.say(null, 'The chest is empty.'); }
    G.opened[k] = true; e.state = 1; DB.audio.sfx('chest_open');
    var msg = [];
    if (o.gold) { G.gold += o.gold; msg.push(o.gold + ' gold'); DB.audio.sfx('coin_pickup'); }
    (o.items || (o.item ? [[o.item, o.n || 1]] : [])).forEach(function (it) { DB.addItem(it[0], it[1]); msg.push((it[1] > 1 ? it[1] + '× ' : '') + DB.itemName(it[0])); });
    if (o.flag) G.flags[o.flag] = true;
    DB.toast('Found: ' + msg.join(', '), 'item');
    if (o.scene) DB.story.run(o.scene);
  };
  /* ---------------- interaction ---------------- */
  DB.nearestInteractable = function () {
    var p = W.player; if (!p) return null; var best = null, bd = 40;
    for (var i = 0; i < W.ents.length; i++) {
      var e = W.ents[i]; if (e === p || e.hidden) continue;
      var can = (e.type === 'npc' && !e.noInteract && (e.talk || e.shop || e.def.lines)) || (e.type === 'prop' && e.interact && !((e.kind === 'chest' || e.kind === 'pickup') && e.state));
      if (!can) continue;
      var d = DB.dist(p.x, p.y, e.x, e.y + (e.type === 'prop' ? 0 : 0)); if (d < bd) { bd = d; best = e; }
    }
    return best;
  };
  DB.interact = function (e) {
    if (!e) return false;
    if (e.type === 'npc') { face(W.player, e); if (!e.def.fixedDir) { e.dir = DB.dirOf(W.player.x - e.x, W.player.y - e.y); W.play(e, 'idle', true); } DB.talkTo(e); return true; }
    if (e.type === 'prop') {
      var o = e.def;
      if (e.kind === 'pickup') { DB.pickupGet(e); return true; }
      if (e.kind === 'chest') { DB.chestOpen(e); return true; }
      if (e.kind === 'lever') { e.state = e.state ? 0 : 1; DB.G.flags[e.key] = e.state; DB.audio.sfx('lever'); if (o.target) [].concat(o.target).forEach(function (t) { DB.objActivate(t, !!e.state); }); return true; }
      if (e.kind === 'valve') { e.state = 1; DB.G.flags[e.key] = 1; DB.audio.sfx('water_splash'); if (o.target) [].concat(o.target).forEach(function (t) { DB.objActivate(t, true); }); DB.toast('The tide drains away.'); return true; }
      if (o.scene) { DB.story.run(o.scene); return true; }
      if (e.kind === 'door' && o.needs) { if (DB.has(o.needs)) { DB.addItem(o.needs, -1); DB.objActivate(e.id, true); } else DB.say(null, o.lockedMsg || 'It is locked.'); return true; }
      if (o.talk) { o.talk(); return true; }
    }
    return false;
  };
  function face(a, b) { a.dir = DB.dirOf(b.x - a.x, b.y - a.y); }
  DB.talkTo = function (e) {
    var n = e.def;
    if (n.shop && !n.talk) { DB.menus.shop(n.shop, n.name || e.name); return; }
    if (typeof n.talk === 'function') { DB.story.runFn(n.talk, e); return; }
    if (typeof n.talk === 'string') { DB.story.run(n.talk, e); return; }
    var lines = typeof n.lines === 'function' ? n.lines(DB.G) : n.lines;
    if (lines) DB.story.runFn(function (S) { return S.lines(e, lines); }, e);
  };
})();
