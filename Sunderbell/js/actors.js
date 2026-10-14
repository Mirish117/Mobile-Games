/* Sunderbell - actors: the four heroes, NPCs, enemies, bosses, puzzle objects, projectiles and effects. */
(function () {
  'use strict';
  var SB = window.SB, W = SB.W, T = 16;
  var A = function () { return SB.audio; };

  /* condition context shared with SB.cond */
  SB.ctx = {
    flag: function (k) { return SB.G && SB.G.flags[k]; },
    plates: function (g) { var ps = W.ents.filter(function (e) { return e.type === 'plate' && e.def.group === g && e.visible; }); return ps.length > 0 && ps.every(function (p) { return p.pressed; }); },
    torches: function (g) { var ts = W.ents.filter(function (e) { return e.type === 'torch' && e.def.group === g; }); return ts.length > 0 && ts.every(function (t) { return t.lit(); }); },
    clear: function () { return !W.ents.some(function (e) { return (e.type === 'enemy' || e.type === 'boss') && !e.dead && e.visible; }); },
    partySize: function () { return SB.Party.members.length; }
  };
  function visKey(id) { return '__vis.' + W.mapId + '.' + id; }
  function computeVisible(e) {
    var d = e.def, ov = SB.G.flags[visKey(d.id)];
    if (ov === 1) return true; if (ov === 0) return false;
    if (d.showIf && !SB.cond(d.showIf, SB.ctx)) return false;
    if (d.hideIf && SB.cond(d.hideIf, SB.ctx)) return false;
    return true;
  }
  function shadow(c, x, y, w) { c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x, y - 1, w || 5, 2, 0, 0, 6.3); c.fill(); }
  function rectHit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function tileBox(e) { return { x: e.x - 8, y: e.y - 16, w: 16, h: 16 }; }
  SB.rectHit = rectHit;

  /* ======================================================================= FX */
  var FX = SB.FX = {
    add: function (f) { W.fx.push(f); return f; },
    puff: function (x, y, big) { FX.add({ x: x, y: y, t: 0, life: .36, draw: function (c) { var fr = Math.min(2, Math.floor(this.t / .12)); var im = SB.gfx.frame('puff', fr); if (im) c.drawImage(im, this.x - 8 * (big ? 1.5 : 1), this.y - 8 * (big ? 1.5 : 1), 16 * (big ? 1.5 : 1), 16 * (big ? 1.5 : 1)); } }); },
    text: function (x, y, s, color) { FX.add({ x: x, y: y, t: 0, life: .9, draw: function (c) { c.font = '8px monospace'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(s, this.x + 1, this.y - this.t * 14 + 1); c.fillStyle = color || '#fff'; c.fillText(s, this.x, this.y - this.t * 14); } }); },
    ring: function (x, y, r, color, life) { FX.add({ x: x, y: y, t: 0, life: life || .3, draw: function (c) { c.strokeStyle = color || '#fff'; c.globalAlpha = 1 - this.t / this.life; c.lineWidth = 2; c.beginPath(); c.arc(this.x, this.y, r * (.4 + .6 * this.t / this.life), 0, 6.3); c.stroke(); c.globalAlpha = 1; } }); },
    sparkle: function (x, y, color) { for (var i = 0; i < 6; i++) { var a = i * 1.05; FX.add({ x: x, y: y, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30, t: 0, life: .4, update: function (dt) { this.x += this.vx * dt; this.y += this.vy * dt; }, draw: function (c) { c.fillStyle = color || '#fff6a0'; c.fillRect(this.x, this.y, 2, 2); } }); } },
    emote: function (ent, sym) { FX.add({ ent: ent, t: 0, life: 1.4, draw: function (c) { var e = this.ent, h = e.drawH || 18; var x = e.x, y = e.y - h - 10 - Math.min(4, this.t * 20); c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 1; c.beginPath(); c.roundRect ? c.roundRect(x - 8, y - 7, 16, 11, 3) : c.rect(x - 8, y - 7, 16, 11); c.fill(); c.stroke(); c.fillStyle = '#000'; c.font = 'bold 8px monospace'; c.textAlign = 'center'; c.fillText(sym, x, y + 1); } }); },
    slash: function (h, dir) {
      FX.add({ h: h, dir: dir, t: 0, life: .16, draw: function (c) {
        var v = SB.dirVec[this.dir], cx = this.h.x + v[0] * 9, cy = this.h.y - 6 + v[1] * 9, base = Math.atan2(v[1], v[0]), p = this.t / this.life;
        c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.globalAlpha = 1 - p * .6; c.beginPath(); c.arc(cx - v[0] * 6, cy - v[1] * 6, 12, base - 1.3 + p * .4, base - 1.3 + 2.6 * Math.min(1, p * 1.6)); c.stroke();
        c.strokeStyle = '#ffe9a0'; c.lineWidth = 1; c.beginPath(); c.arc(cx - v[0] * 6, cy - v[1] * 6, 14, base - 1.3, base - 1.3 + 2.6 * Math.min(1, p * 1.6)); c.stroke(); c.globalAlpha = 1;
      } });
    },
    update: function (dt) { W.fx = W.fx.filter(function (f) { f.t += dt; if (f.update) f.update(dt); return f.life == null || f.t < f.life; }); }
  };

  /* ======================================================================= COMBAT */
  var C = SB.Combat = {};
  /* opts: tool, dmg, knock, x,y (source), area {x,y,w,h}, tiles(bool), team(bool) */
  C.hit = function (o) {
    var any = false, area = o.area;
    W.ents.forEach(function (e) {
      if (!e.visible || e.dead || !e.onHit) return;
      var b = e.hitBox ? e.hitBox() : tileBox(e);
      if (rectHit(area, b)) { if (e.onHit(o) !== false) any = true; }
    });
    if (o.tiles !== false) {
      var tx0 = Math.floor(area.x / T), tx1 = Math.floor((area.x + area.w - 1) / T), ty0 = Math.floor(area.y / T), ty1 = Math.floor((area.y + area.h - 1) / T);
      for (var ty = ty0; ty <= ty1; ty++) for (var tx = tx0; tx <= tx1; tx++) if (C.tileHit(tx, ty, o.tool)) any = true;
    }
    return any;
  };
  C.tileHit = function (tx, ty, tool) {
    var ch = W.tileAt(tx, ty), d = W.tileDef(ch); if (!d.kind) return false;
    var ok = (d.kind === 'cut' && (tool === 'sword' || tool === 'shield' || tool === 'team' || tool === 'lantern')) || (d.kind === 'smash' && (tool === 'shield' || tool === 'team')) || (d.kind === 'burn' && tool === 'lantern') || (d.kind === 'veil' && tool === 'lantern');
    var x = tx * T + 8, y = ty * T + 8;
    if (!ok) { if (d.kind === 'smash' && (tool === 'sword')) { A().sfx('hit'); FX.text(x, y, 'clank', '#ccd'); } return false; }
    var to = d.to || '.';
    if (d.kind === 'cut') { W.setTile(tx, ty, to, false); A().sfx('cut'); FX.puff(x, y); C.drop(x, y + 6, .25); }
    else if (d.kind === 'smash') { W.setTile(tx, ty, to, true); A().sfx('smash'); FX.puff(x, y, true); W.shake = Math.max(W.shake, .15); C.drop(x, y + 6, .2); }
    else if (d.kind === 'burn') { W.setTile(tx, ty, to, true); A().sfx('burn'); FX.add(flameBurst(x, y + 8, .6)); }
    else if (d.kind === 'veil') { W.setTile(tx, ty, to, true); A().sfx('reveal'); FX.sparkle(x, y, '#d4a4ff'); }
    return true;
  };
  C.drop = function (x, y, p) {
    if (Math.random() > p) return;
    var G = SB.G, kind = (G.hp < G.maxHp && Math.random() < .45) ? 'heart' : 'chime';
    W.ents.push(makePickup(kind, x, y, kind === 'chime' ? (Math.random() < .15 ? 5 : 1) : 2));
  };
  C.meter = function (v) { SB.G.meter = SB.clamp((SB.G.meter || 0) + v, 0, 100); };

  /* ======================================================================= PARTY */
  var P = SB.Party = { members: [], idx: 0, hold: false, trail: [], invuln: 0, pushT: 0, pushEnt: null };
  /* before the bell splits him (and after he is whole again) the lone hero is drawn and named as plain Rook */
  P.whole = function () { var f = (SB.G && SB.G.flags) || {}; return !f.split || !!f.unsplit; };
  P.look = function (h) { var d = h.def || {}; return (d.wholeSprite && P.whole() && SB.gfx.has(d.wholeSprite + '_down')) ? d.wholeSprite : h.id; };
  P.heroName = function (h) { var d = h.def || {}; return d.wholeName && P.whole() ? d.wholeName : (d.name || h.id); };
  P.heroDef = function (id) { return SB.D.heroes.filter(function (h) { return h.id === id; })[0]; };
  P.joined = function () { return SB.D.heroes.filter(function (h, i) { return i === 0 || (!SB.G.flags.unsplit && (!h.joinFlag || SB.G.flags[h.joinFlag])); }); };
  P.sync = function () {
    var ids = P.joined().map(function (h) { return h.id; }), L = P.leader();
    var old = {}; P.members.forEach(function (m) { old[m.id] = m; });
    P.members = ids.map(function (id) { return old[id] || makeHero(id, L ? L.x : 0, L ? L.y : 0); });
    var li = ids.indexOf(SB.G.leader); P.idx = li < 0 ? 0 : li; SB.G.leader = ids[P.idx];
  };
  P.leader = function () { return P.members[P.idx]; };
  P.place = function (x, y, dir) {
    P.sync(); P.hold = false; SB.G.hold = false;
    var v = SB.dirVec[dir || 'down'];
    P.members.forEach(function (h, k) {
      var j = (k - P.idx + P.members.length) % P.members.length;
      h.x = x + (j ? [0, -5, 5, 0][j] : 0); h.y = y - (j === 3 ? 4 : 0); h.dir = dir || 'down'; h.anim = 'idle';
      if (!W.boxFree(h.x, h.y, 8, 5, h)) { h.x = x; h.y = y; }
    });
    var L = P.leader(); P.trail = []; for (var i = 0; i < 40; i++) P.trail.push({ x: L.x, y: L.y });
  };
  P.setLeader = function (i) {
    if (i === P.idx || !P.members[i]) return;
    P.idx = i; SB.G.leader = P.members[i].id; var L = P.leader();
    W.ents.forEach(function (e) { if (e.type === 'warp') e.armed = false; if (e.type === 'trigger') e.inside = true; });
    P.trail = []; for (var k = 0; k < 40; k++) P.trail.push({ x: L.x, y: L.y });
    A().sfx('swap'); A().voice(L.id, 'swap'); SB.UI.refreshHud(true);
  };
  P.toggleHold = function () {
    if (P.members.length < 2) { SB.UI.toast('Nobody to leave behind yet.'); return; }
    P.hold = !P.hold; SB.G.hold = P.hold; A().sfx(P.hold ? 'hold' : 'follow');
    SB.UI.toast(P.hold ? 'HOLD: the others will wait here. Swap to move someone else.' : 'FOLLOW: everyone regroups.');
    if (!P.hold) { var L = P.leader(); P.trail = []; for (var k = 0; k < 40; k++) P.trail.push({ x: L.x, y: L.y }); }
    SB.UI.refreshHud(true);
  };
  P.near = function (r) { var L = P.leader(); return P.members.filter(function (h) { return h !== L && !P.hold && SB.dist(h.x, h.y, L.x, L.y) < r; }); };
  P.hurt = function (dmg, fx, fy) {
    if (P.invuln > 0 || W.cutscene || SB.G.hp <= 0) return;
    var L = P.leader(); SB.G.hp = Math.max(0, SB.G.hp - dmg); P.invuln = 1.1;
    A().sfx('hurt'); A().voice(L.id, 'hurt'); W.shake = Math.max(W.shake, .2);
    if (fx != null) { var dx = L.x - fx, dy = L.y - fy, d = Math.sqrt(dx * dx + dy * dy) || 1; L.kx = dx / d * 140; L.ky = dy / d * 140; L.kt = .14; }
    SB.UI.refreshHud(true);
    if (SB.G.hp <= 0) SB.Main.gameOver();
  };
  P.heal = function (n) { SB.G.hp = Math.min(SB.G.maxHp, SB.G.hp + n); SB.UI.refreshHud(true); };

  function makeHero(id, x, y) {
    var def = P.heroDef(id);
    var h = { kind: 'hero', id: id, def: def, x: x, y: y, dir: 'down', anim: 'idle', t: 0, atk: 0, cd: 0, kx: 0, ky: 0, kt: 0, stuck: 0, visible: true, drawH: 34 };
    h.draw = function (c) {
      var isL = h === P.leader(), blink = isL && P.invuln > 0 && Math.floor(P.invuln * 14) % 2;
      shadow(c, h.x, h.y, 5);
      if (blink) return;
      var fr = SB.charFrame(SB.gfx, P.look(h), h.dir, h.atk > 0 ? 'atk' : h.anim, h.t);
      SB.gfx.draw(c, fr.id, fr.f, h.x, h.y + 1, { flip: fr.flip });
      if (h.id === 'mira') { /* lantern glow */ var v = SB.dirVec[h.dir]; c.fillStyle = 'rgba(255,220,120,.9)'; c.fillRect(Math.round(h.x + (h.dir === 'left' ? -6 : 5)), Math.round(h.y - 6), 2, 2); }
      if (h.id === 'tobin' && h.atk > 0) { var vv = SB.dirVec[h.dir]; var im = SB.gfx.frame('icon_shield', 0); if (im) c.drawImage(im, Math.round(h.x + vv[0] * 9 - 7), Math.round(h.y - 10 + vv[1] * 7 - 7)); }
      if (isL && P.members.length > 1) { c.fillStyle = '#fff6a0'; c.beginPath(); c.moveTo(h.x - 2, h.y - 38); c.lineTo(h.x + 2, h.y - 38); c.lineTo(h.x, h.y - 35); c.fill(); }
      if (P.hold && !isL) { c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '7px monospace'; c.textAlign = 'center'; c.fillText('wait', h.x, h.y - 36); }
    };
    return h;
  }
  /* ---- tools ---- */
  P.useTool = function (h, dir, auto) {
    var def = h.def; if (h.cd > 0) return; h.cd = def.cooldown || .4; h.atk = .2; h.dir = dir;
    var v = SB.dirVec[dir], isL = h === P.leader();
    if (isL && !auto) A().voice(h.id, Math.random() < .3 ? 'attack2' : 'attack');
    if (def.tool === 'sword') {
      A().sfx('sword'); FX.slash(h, dir);
      var area = { x: h.x + v[0] * 11 - (v[0] ? 9 : 12), y: h.y - 6 + v[1] * 11 - (v[1] ? 9 : 10), w: v[0] ? 18 : 24, h: v[1] ? 18 : 20 };
      C.hit({ tool: 'sword', dmg: def.damage || 2, knock: 90, x: h.x, y: h.y, area: area, auto: auto });
    } else if (def.tool === 'bow') {
      A().sfx('arrow'); W.fx.push(makeArrow(h.x + v[0] * 6, h.y - 6 + v[1] * 4, v[0] * 230, v[1] * 230, def.damage || 1, auto));
    } else if (def.tool === 'shield') {
      A().sfx('bash'); h.atk = .26;
      for (var i = 0; i < 6; i++) if (W.boxFree(h.x + v[0] * 2, h.y + v[1] * 2, 8, 5, h)) { h.x += v[0] * 2; h.y += v[1] * 2; }
      FX.ring(h.x + v[0] * 10, h.y - 6 + v[1] * 10, 12, '#ffd8a0', .2);
      C.hit({ tool: 'shield', dmg: def.damage || 1, knock: 170, x: h.x, y: h.y, area: { x: h.x + v[0] * 10 - 10, y: h.y - 6 + v[1] * 10 - 10, w: 20, h: 20 }, auto: auto });
    } else if (def.tool === 'lantern') {
      A().sfx('flame'); W.fx.push(makeFlame(h.x + v[0] * 6, h.y - 6 + v[1] * 4, v[0] * 110, v[1] * 110, def.damage || 1, auto));
    }
  };
  P.tryInteract = function () {
    var L = P.leader(), v = SB.dirVec[L.dir], px = L.x + v[0] * 12, py = L.y - 4 + v[1] * 12, best = null, bd = 1e9;
    W.ents.forEach(function (e) {
      if (!e.visible || !e.interact || e.dead) return;
      var b = e.interBox ? e.interBox() : (e.solidBox ? e.solidBox() : tileBox(e));
      var g = { x: b.x - 4, y: b.y - 4, w: b.w + 8, h: b.h + 8 };
      if (px >= g.x && px <= g.x + g.w && py >= g.y && py <= g.y + g.h) { var d = SB.dist(px, py, b.x + b.w / 2, b.y + b.h / 2); if (d < bd) { bd = d; best = e; } }
    });
    if (best) { best.interact(); return true; }
    return false;
  };
  P.canInteract = function () {
    var L = P.leader(); if (!L) return null; var v = SB.dirVec[L.dir], px = L.x + v[0] * 12, py = L.y - 4 + v[1] * 12, found = null;
    W.ents.forEach(function (e) { if (!e.visible || !e.interact || e.dead || e.silent) return; var b = e.interBox ? e.interBox() : (e.solidBox ? e.solidBox() : tileBox(e)); if (px >= b.x - 4 && px <= b.x + b.w + 4 && py >= b.y - 4 && py <= b.y + b.h + 4) found = e; });
    return found;
  };
  P.team = function () {
    var G = SB.G, L = P.leader();
    if ((G.meter || 0) < 100) { SB.UI.toast('The TEAM gauge isn\'t full yet. Land hits to fill it.'); return; }
    var near = P.near(70);
    if (P.members.length < 2) { SB.UI.toast('You need friends for a team strike!'); return; }
    if (near.length < P.members.length - 1) { SB.UI.toast(P.hold ? 'Tap FOLLOW and gather everyone first.' : 'Gather everyone close together first.'); return; }
    G.meter = 0; A().sfx('team');
    P.members.forEach(function (h, k) { if (h === L) return; var a = k / P.members.length * 6.28; h.x = L.x + Math.cos(a) * 14; h.y = L.y + Math.sin(a) * 10; h.spin = .6; setTimeout(function () { A().voice(h.id, 'attack2'); }, 80 * k); });
    L.spin = .6; A().voice(L.id, 'cheer'); W.flash.color = '#fff6d0'; W.flash.a = .6; W.tween(W.flash, 'a', 0, 400);
    FX.ring(L.x, L.y - 6, 50, '#fff6a0', .45); FX.ring(L.x, L.y - 6, 36, '#ffd84a', .35);
    C.hit({ tool: 'team', dmg: 4, knock: 200, x: L.x, y: L.y, area: { x: L.x - 46, y: L.y - 52, w: 92, h: 92 }, team: true });
    SB.UI.refreshHud(true);
  };

  P.update = function (dt) {
    var G = SB.G, I = SB.input, L = P.leader(); if (!L) return;
    P.invuln = Math.max(0, P.invuln - dt);
    P.members.forEach(function (h) { h.t += dt; h.cd = Math.max(0, h.cd - dt); h.atk = Math.max(0, h.atk - dt); if (h.spin) { h.spin = Math.max(0, h.spin - dt); h.dir = ['down', 'left', 'up', 'right'][Math.floor(h.spin * 20) % 4]; } });
    var locked = W.cutscene > 0 || SB.UI.modal;
    /* leader */
    if (L.kt > 0) { L.kt -= dt; W.move(L, L.kx * dt, 0, 8, 5); W.move(L, 0, L.ky * dt, 8, 5); }
    else if (!locked) {
      var sp = 76 * (L.atk > 0 && L.id !== 'tobin' ? .45 : 1), mx = I.x, my = I.y;
      if (mx || my) {
        if (!(L.atk > 0)) L.dir = Math.abs(mx) > Math.abs(my) * 1.05 ? (mx < 0 ? 'left' : 'right') : (my < 0 ? 'up' : 'down');
        var ox = L.x, oy = L.y;
        W.move(L, mx * sp * dt, 0, 8, 5); W.move(L, 0, my * sp * dt, 8, 5);
        L.anim = 'walk';
        var movedD = Math.abs(L.x - ox) + Math.abs(L.y - oy);
        /* pushing */
        if (movedD < sp * dt * .25) P.tryPush(L, dt); else { P.pushT = 0; }
      } else { L.anim = 'idle'; P.pushT = 0; }
      if (I.take('a')) { if (!P.tryInteract()) P.useTool(L, L.dir); }
      if (I.take('swap') && P.members.length > 1) P.setLeader((P.idx + 1) % P.members.length);
      for (var n = 1; n <= 4; n++) if (I.pressed['hero' + n] && P.members[n - 1]) { I.pressed['hero' + n] = false; P.setLeader(n - 1); }
      if (I.take('hold')) P.toggleHold();
      if (I.take('team')) P.team();
    } else { L.anim = 'idle'; }
    L = P.leader();
    /* safe ground + pits */
    var tch = W.effTile(Math.floor(L.x / T), Math.floor((L.y - 2) / T)), td = W.tileDef(tch);
    if (td.kind === 'pit' && !locked && !L.kt) { P.fall(L); }
    else if (!td.kind || td.kind !== 'pit') { P.safe = { x: L.x, y: L.y }; }
    /* trail */
    var last = P.trail[0]; if (!last || SB.dist(last.x, last.y, L.x, L.y) >= 2) { P.trail.unshift({ x: L.x, y: L.y, dir: L.dir }); if (P.trail.length > 120) P.trail.pop(); }
    /* followers */
    var order = 0;
    P.members.forEach(function (h) {
      if (h === L) return; order++;
      if (h.kt > 0) { h.kt -= dt; W.move(h, h.kx * dt, 0, 8, 5); W.move(h, 0, h.ky * dt, 8, 5); return; }
      if (P.hold && !W.cutscene) { h.anim = 'idle'; P.followerFight(h, dt); return; }
      var tp = P.trail[Math.min(P.trail.length - 1, order * 6)] || L;
      var dx = tp.x - h.x, dy = tp.y - h.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 150) { h.x = tp.x; h.y = tp.y; d = 0; }
      if (d > 3) {
        var s = Math.min(d, (d > 30 ? 110 : 80) * dt), ox = h.x, oy = h.y;
        W.move(h, dx / d * s, 0, 6, 4); W.move(h, 0, dy / d * s, 6, 4);
        if (Math.abs(h.x - ox) + Math.abs(h.y - oy) < s * .3) { h.stuck += dt; if (h.stuck > .8) { h.x = tp.x; h.y = tp.y; h.stuck = 0; } } else h.stuck = 0;
        if (!(h.atk > 0)) h.dir = SB.dirOf(dx, dy); h.anim = 'walk';
      } else { h.anim = 'idle'; h.stuck = 0; if (!locked) P.followerFight(h, dt); }
    });
  };
  /* followers help out: swing at enemies that come close */
  P.followerFight = function (h, dt) {
    if (W.cutscene || h.cd > 0) return;
    var range = h.def.tool === 'bow' ? 90 : h.def.tool === 'lantern' ? 40 : 24, best = null, bd = range;
    W.ents.forEach(function (e) { if ((e.type === 'enemy') && !e.dead && e.visible && !e.def.ghostOnly) { var d = SB.dist(h.x, h.y, e.x, e.y); if (d < bd) { bd = d; best = e; } } });
    if (!best) return;
    if (best.edef && best.edef.immune && best.edef.immune.indexOf(h.def.tool) >= 0) return;
    var dx = best.x - h.x, dy = best.y - h.y;
    if (h.def.tool === 'bow' && Math.min(Math.abs(dx), Math.abs(dy)) > 10) return;
    P.useTool(h, SB.dirOf(dx, dy), true); h.cd = (h.def.cooldown || .4) * 2.2;
  };
  P.fall = function (L) {
    A().sfx('fall'); L.visible = false; W.cutscene++;
    setTimeout(function () { L.visible = true; W.cutscene--; var s = P.safe || { x: L.x, y: L.y - 16 }; L.x = s.x; L.y = s.y; var v = SB.dirVec[L.dir]; for (var i = 0; i < 8 && W.tileDef(W.effTile(Math.floor(L.x / T), Math.floor((L.y - 2) / T))).kind === 'pit'; i++) { L.x -= v[0] * 4; L.y -= v[1] * 4; } P.invuln = 0; P.hurt(1); }, 450);
  };
  P.tryPush = function (L, dt) {
    var v = SB.dirVec[L.dir], fx = L.x + v[0] * 8, fy = L.y - 3 + v[1] * 6, blk = null;
    W.ents.forEach(function (e) { if (e.type === 'block' && e.visible && !e.moving && !e.sunk) { var b = e.solidBox(); if (fx >= b.x - 1 && fx <= b.x + b.w + 1 && fy >= b.y - 1 && fy <= b.y + b.h + 1) blk = e; } });
    if (!blk) { P.pushT = 0; return; }
    if (blk.def.lockWhen && SB.cond(blk.def.lockWhen, SB.ctx)) return;
    L.anim = 'walk'; P.pushT += dt;
    if (P.pushT < .28) return; P.pushT = 0;
    var strength = (L.id === 'tobin' ? 2 : 1);
    P.near(48).forEach(function (h) { strength += h.id === 'tobin' ? 2 : 1; });
    var need = blk.def.weight || 1;
    if (strength < need) { if (!P.pushMsgT || W.time - P.pushMsgT > 2.5) { P.pushMsgT = W.time; SB.UI.toast('Too heavy! Needs ' + need + ' pushing (you have ' + strength + '). Gather everyone close behind you. Red counts as 2.'); FX.emote(L, '!'); } return; }
    blk.push(v);
  };

  /* ======================================================================= PROJECTILES */
  function makeArrow(x, y, vx, vy, dmg, auto) {
    return { x: x, y: y, vx: vx, vy: vy, t: 0, life: .9, dmg: dmg, update: function (dt) {
      this.x += this.vx * dt; this.y += this.vy * dt;
      var tx = Math.floor(this.x / T), ty = Math.floor(this.y / T);
      var area = { x: this.x - 3, y: this.y - 3, w: 6, h: 6 };
      if (C.hit({ tool: 'bow', dmg: this.dmg, knock: 50, x: this.x - this.vx * .05, y: this.y - this.vy * .05, area: area, tiles: false, auto: auto })) { this.t = 9; return; }
      if (W.tileSolid(tx, ty, true)) { this.t = 9; FX.add({ x: this.x, y: this.y, t: 0, life: .2, draw: function (c) { c.fillStyle = '#fff'; c.fillRect(this.x - 1, this.y - 1, 2, 2); } }); }
    }, draw: function (c) { var im = SB.gfx.frame('arrow', 0); if (!im) return; c.save(); c.translate(this.x, this.y); c.rotate(Math.atan2(this.vy, this.vx)); c.drawImage(im, -8, -8); c.restore(); } };
  }
  function flameBurst(x, y, life) { return { x: x, y: y, t: 0, life: life || .4, light: 40, draw: function (c) { var im = SB.gfx.frame('flame', Math.floor(this.t * 12)); if (im) { c.globalAlpha = 1 - this.t / this.life; c.drawImage(im, this.x - 8, this.y - 16); c.globalAlpha = 1; } } }; }
  function makeFlame(x, y, vx, vy, dmg, auto) {
    return { x: x, y: y, vx: vx, vy: vy, t: 0, life: .34, light: 46, hitDone: {}, update: function (dt) {
      this.x += this.vx * dt; this.y += this.vy * dt;
      var area = { x: this.x - 6, y: this.y - 6, w: 12, h: 12 };
      C.hit({ tool: 'lantern', dmg: dmg, knock: 40, x: this.x, y: this.y, area: area, tiles: true, auto: auto, once: this.hitDone });
      if (W.tileSolid(Math.floor(this.x / T), Math.floor(this.y / T), true)) { C.tileHit(Math.floor(this.x / T), Math.floor(this.y / T), 'lantern'); this.t = 9; }
      if (this.t + dt >= this.life) FX.add(flameBurst(this.x, this.y + 6, .3));
    }, draw: function (c) { var im = SB.gfx.frame('flame', Math.floor(this.t * 14)); if (im) c.drawImage(im, this.x - 8, this.y - 11); } };
  }
  function makeShot(x, y, vx, vy, sprite, dmg) {
    return { x: x, y: y, vx: vx, vy: vy, t: 0, life: 4, enemy: true, update: function (dt) {
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (W.tileSolid(Math.floor(this.x / T), Math.floor(this.y / T), true)) { this.t = 99; FX.puff(this.x, this.y); return; }
      var L = P.leader(); if (!L || W.cutscene) return;
      if (Math.abs(this.x - L.x) < 6 && Math.abs(this.y - (L.y - 6)) < 8) {
        /* Red's shield blocks shots from the front */
        var v = SB.dirVec[L.dir];
        if (L.id === 'tobin' && (v[0] * -this.vx + v[1] * -this.vy) > 0) { A().sfx('hit'); FX.ring(this.x, this.y, 8, '#ffd8a0', .2); this.t = 99; FX.text(L.x, L.y - 20, 'block!', '#ffe9a0'); return; }
        P.hurt(dmg || 1, this.x - this.vx, this.y - this.vy); this.t = 99;
      }
    }, draw: function (c) { var im = SB.gfx.frame(sprite || 'orb_fog', 0); if (im) c.drawImage(im, Math.round(this.x - 4), Math.round(this.y - 4)); } };
  }
  SB.makeShot = makeShot;

  /* ======================================================================= ENTITY FACTORY */
  var Act = SB.Actors = {};
  Act.make = function (d) {
    var f = KINDS[d.type]; if (!f) return null;
    var e = { def: d, type: d.type, x: (d.x || 0) * T + 8, y: (d.y || 0) * T + 16, t: Math.random() * 3, visible: true, solid: false };
    f(e, d); return e;
  };
  Act.update = function (dt) {
    for (var i = 0; i < W.ents.length; i++) {
      var e = W.ents[i];
      var v = e.dead ? false : computeVisible(e);
      if (v !== e.visible) { e.visible = v; if (e.onShow && v) e.onShow(); }
      e.t += dt;
      if (e.visible && e.update && !(W.cutscene && e.freezeInScene)) e.update(dt);
    }
    W.ents = W.ents.filter(function (e) { return !e.remove; });
  };

  var KINDS = {};
  /* ---------------- NPC ---------------- */
  KINDS.npc = function (e, d) {
    var ch = SB.D.characters[d.who] || {}; e.base = ch.sprite || d.who; e.dir = d.dir || 'down'; e.anim = 'idle'; e.solid = true; e.homeX = e.x; e.homeY = e.y - 2; e.y -= 2; e.drawH = 34;
    e.solidBox = function () { return { x: e.x - 6, y: e.y - 8, w: 12, h: 8 }; };
    e.interBox = function () { return { x: e.x - 7, y: e.y - 16, w: 14, h: 16 }; };
    e.silent = !d.scene;
    e.interact = function () { if (!d.scene) return; var L = P.leader(); e.dir = SB.dirOf(L.x - e.x, L.y - e.y); SB.Story.run(d.scene, e); };
    e.wt = 2 + Math.random() * 2; e.vx = 0; e.vy = 0;
    e.update = function (dt) {
      if (e.walkTo) { var dx = e.walkTo.x - e.x, dy = e.walkTo.y - e.y, dd = Math.sqrt(dx * dx + dy * dy); if (dd < 1.5) { e.x = e.walkTo.x; e.y = e.walkTo.y; e.anim = 'idle'; var r = e.walkTo.res; e.walkTo = null; r(); } else { var s = Math.min(dd, 52 * dt); e.x += dx / dd * s; e.y += dy / dd * s; e.dir = SB.dirOf(dx, dy); e.anim = 'walk'; } return; }
      if (!d.wander || W.cutscene) { e.anim = 'idle'; return; }
      e.wt -= dt;
      if (e.wt <= 0) { if (e.vx || e.vy) { e.vx = e.vy = 0; e.wt = 1.5 + Math.random() * 2.5; } else { var a = SB.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); e.vx = a[0] * 22; e.vy = a[1] * 22; e.wt = .6 + Math.random(); } }
      if (e.vx || e.vy) {
        if (SB.dist(e.x + e.vx * dt, e.y + e.vy * dt, e.homeX, e.homeY) > 28) { e.vx = -e.vx; e.vy = -e.vy; }
        var ox = e.x, oy = e.y; W.move(e, e.vx * dt, e.vy * dt, 10, 6); if (ox === e.x && oy === e.y) e.wt = 0;
        e.dir = SB.dirOf(e.vx, e.vy); e.anim = 'walk';
      } else e.anim = 'idle';
    };
    e.draw = function (c) {
      var ghost = d.ghost || ch.ghost, grey = (d.greyIf && SB.cond(d.greyIf, SB.ctx)) || (ch.fogs && W.fogOn());
      var by = ghost ? Math.sin(e.t * 2) * 1.5 - 2 : 0;
      if (!ghost) shadow(c, e.x, e.y, 5);
      var fr = SB.charFrame(SB.gfx, e.base, e.dir, e.anim, e.t);
      SB.gfx.draw(c, fr.id, fr.f, e.x, e.y + 1 + by, { flip: fr.flip, variant: ghost ? 'ghost' : grey ? 'grey' : '', alpha: ghost ? .62 + Math.sin(e.t * 3) * .1 : null });
    };
  };
  /* ---------------- simple interactables ---------------- */
  KINDS.sign = function (e, d) { e.solid = !d.sprite || d.sprite !== 'carving'; e.flat = d.sprite === 'carving'; e.interact = function () { SB.Story.run(d.scene); }; e.draw = function (c) { var im = SB.gfx.frame(d.sprite || 'sign', 0); if (im) c.drawImage(im, e.x - 8, e.y - 16); }; };
  KINDS.carving = function (e, d) { e.flat = true; e.light = 10; e.interact = function () { SB.Story.run(d.scene); }; e.draw = function (c) { var im = SB.gfx.frame('carving', 0); if (im) { c.globalAlpha = .7 + Math.sin(e.t * 2) * .3; c.drawImage(im, e.x - 8, e.y - 16); c.globalAlpha = 1; } }; };
  KINDS.deco = function (e, d) {
    e.solid = !!d.solid; e.light = d.light || 0; e.flat = !!d.flat; var sz = SB.gfx.size(d.sprite);
    e.x += d.ox || 0; e.y += (d.oy || 0) - (d.flat ? 2 : 1);
    e.solidBox = function () { return { x: e.x - sz[0] / 2, y: e.y - Math.min(12, sz[1]), w: sz[0], h: Math.min(12, sz[1]) }; };
    e.draw = function (c) { SB.gfx.draw(c, d.sprite, Math.floor(e.t * 6), e.x, e.y); };
  };
  KINDS.building = function (e, d) {
    e.x = d.x * T + (d.w || 1) * 8; e.y = (d.y + (d.h || 1)) * T - 1;
    e.draw = function (c) { var im = SB.gfx.frame(d.sprite, 0); if (!im) return; c.drawImage(im, d.x * T - 4, (d.y + (d.h || 1)) * T - im.height); };
  };
  KINDS.heal = function (e, d) {
    e.solid = true; e.interact = function () { SB.G.hp = SB.G.maxHp; A().sfx('heart'); SB.Main.save(); SB.UI.toast('You rest for a while. Hearts restored, progress saved.'); SB.UI.refreshHud(true); };
    e.draw = function (c) { var im = SB.gfx.frame(d.sprite || 'bed', 0); if (im) c.drawImage(im, e.x - 8, e.y - 16); };
  };
  KINDS.pot = function (e, d) {
    e.solid = true; e.onHit = function (o) { if (e.dead) return false; e.dead = true; e.remove = true; A().sfx('pot'); FX.puff(e.x, e.y - 8); C.drop(e.x, e.y - 2, .7); return true; };
    e.draw = function (c) { var im = SB.gfx.frame('pot', 0); if (im) c.drawImage(im, e.x - 8, e.y - 16); };
  };
  KINDS.chest = function (e, d) {
    e.solid = true;
    e.open = function () { return !!SB.G.flags[d.flag]; };
    e.interact = function () {
      if (e.open()) { SB.UI.toast('Empty.'); return; }
      SB.G.flags[d.flag] = 1; A().sfx('chest');
      var it = d.item, n = d.n || 1; SB.Story.give(it, n, true);
      var L = P.leader(); A().voice(L.id, 'cheer');
      if (it === 'key') SB.Story.run('chest_key'); else if (it === 'heart_vessel') SB.Story.run('chest_heart');
    };
    e.draw = function (c) { var im = SB.gfx.frame('chest', e.open() ? 1 : 0); if (im) c.drawImage(im, e.x - 8, e.y - 16); };
  };
  KINDS.block = function (e, d) {
    e.solid = true; e.homeX = e.x; e.homeY = e.y;
    e.solidBox = function () { return { x: e.x - 8, y: e.y - 16, w: 16, h: 16 }; };
    e.push = function (v) {
      var nx = e.x + v[0] * T, ny = e.y + v[1] * T, tx = Math.floor(nx / T), ty = Math.floor((ny - 8) / T);
      var td = W.tileDef(W.effTile(tx, ty));
      if (td.kind !== 'pit') {
        if (td.solid) return;
        var blocked = W.ents.some(function (o) { return o !== e && o.visible && !o.dead && (o.solid || o.type === 'enemy') && o.type !== 'plate' && rectHit({ x: nx - 7, y: ny - 15, w: 14, h: 14 }, o.solidBox ? o.solidBox() : tileBox(o)); });
        if (blocked) return;
      }
      e.moving = true; A().sfx('push'); var sx = e.x, sy = e.y, t0 = 0;
      P.members.forEach(function (h) { h.x += v[0] * 0; });
      FX.add({ t: 0, life: .26, update: function (dt) { t0 += dt; var k = Math.min(1, t0 / .25); e.x = sx + v[0] * T * k; e.y = sy + v[1] * T * k; if (k >= 1 && e.moving) { e.moving = false; if (td.kind === 'pit') { e.sunk = true; e.remove = true; var fill = W.tileAt(tx - v[0], ty - v[1]); if (W.tileDef(fill).solid || W.tileDef(fill).kind) fill = 'f'; W.setTile(tx, ty, fill, true); A().sfx('fall'); FX.puff(e.x, e.y - 8, true); SB.UI.toast('The block fills the pit!'); } } } });
    };
    e.draw = function (c) { var im = SB.gfx.frame(d.skin || 'block', 0); if (im) c.drawImage(im, Math.round(e.x - 8), Math.round(e.y - 16)); if (d.weight > 1) { c.fillStyle = '#000a'; c.fillRect(Math.round(e.x + 2), Math.round(e.y - 7), 6, 7); c.fillStyle = '#fff'; c.font = '7px monospace'; c.textAlign = 'center'; c.fillText(String(d.weight), Math.round(e.x + 5), Math.round(e.y - 1)); } };
  };
  KINDS.plate = function (e, d) {
    e.flat = true; e.pressed = false;
    e.update = function () {
      var was = e.pressed, cx = e.x, cy = e.y - 8;
      e.pressed = P.members.some(function (h) { return Math.abs(h.x - cx) < 7 && Math.abs(h.y - 3 - cy) < 7; }) || W.ents.some(function (o) { return o.type === 'block' && !o.moving && Math.abs(o.x - e.x) < 3 && Math.abs(o.y - e.y) < 3; });
      if (e.pressed && !was) A().sfx('push');
    };
    e.draw = function (c) { var im = SB.gfx.frame('plate', e.pressed ? 1 : 0); if (im) c.drawImage(im, e.x - 8, e.y - 16); };
  };
  KINDS.gate = function (e, d) {
    var key = '__gs.' + W.mapId + '.' + d.id;
    e.isOpen = function () { return (d.latch && SB.G.flags[d.latch]) || SB.cond(d.when, SB.ctx); };
    e.wasOpen = e.isOpen(); e.solid = !e.wasOpen; e.flat = e.wasOpen;
    e.update = function () {
      var o = e.isOpen();
      if (o !== e.wasOpen) {
        e.wasOpen = o; e.solid = !o; e.flat = o; A().sfx('gate');
        if (!o && P.members.some(function (h) { return rectHit({ x: h.x - 4, y: h.y - 5, w: 8, h: 5 }, tileBox(e)); })) { e.solid = false; e.flat = true; e.wasOpen = true; return; }
        if (o) { if (d.latch) SB.G.flags[d.latch] = 1; if (d.scene && !SB.G.flags[key]) { SB.G.flags[key] = 1; SB.Story.run(d.scene); } }
      }
    };
    e.draw = function (c) { var im = SB.gfx.frame('gate', e.solid ? 0 : 1); if (im) c.drawImage(im, e.x - 8, e.y - 16); };
  };
  KINDS.crystal = function (e, d) {
    e.solid = true; e.on = function () { return !!SB.G.flags[d.flag]; };
    e.onHit = function (o) {
      if (e.on()) return false; SB.G.flags[d.flag] = 1; A().sfx('crystal'); FX.sparkle(e.x, e.y - 10, '#ffd84a');
      if (d.scene) SB.Story.run(d.scene); return true;
    };
    e.interact = function () { if (!e.on()) { var L = P.leader(); P.useTool(L, L.dir); return; } SB.UI.toast('The crystal hums, glowing gold.'); };
    e.draw = function (c) { var im = SB.gfx.frame('crystal', e.on() ? 1 : 0); if (im) c.drawImage(im, e.x - 8, e.y - 16 + Math.round(Math.sin(e.t * 2))); };
  };
  KINDS.torch = function (e, d) {
    var key = 'torch.' + W.mapId + '.' + d.id;
    e.solid = true; e.lit = function () { return !!(d.lit || SB.G.flags[key]); };
    e.onShow = function () { };
    e.update = function () { e.light = e.lit() ? 60 : 0; };
    e.onHit = function (o) { if (o.tool !== 'lantern' || e.lit()) return false; SB.G.flags[key] = 1; A().sfx('torch'); FX.sparkle(e.x, e.y - 12, '#ffb040'); return true; };
    e.interact = function () { var L = P.leader(); if (!e.lit() && L.def.tool === 'lantern') { P.useTool(L, L.dir); return; } SB.UI.toast(e.lit() ? 'The torch burns warmly.' : 'An unlit torch. Violet\'s lantern could light it.'); };
    e.draw = function (c) { var im = SB.gfx.frame('torch', e.lit() ? 1 + Math.floor(e.t * 6) % 2 : 0); if (im) c.drawImage(im, e.x - 8, e.y - 16); };
  };
  KINDS.lamp = function (e, d) {
    e.solid = true; e.lit = function () { return !!SB.G.flags[d.flag]; };
    e.update = function () { e.light = e.lit() ? 50 : 0; };
    e.onHit = function (o) { if (o.tool !== 'lantern' || e.lit()) return false; if (d.require && !SB.cond(d.require, SB.ctx)) return false; SB.G.flags[d.flag] = 1; A().sfx('torch'); FX.sparkle(e.x, e.y - 12, '#ffe060'); if (d.scene) SB.Story.run(d.scene); return true; };
    e.interact = function () { var L = P.leader(); if (!e.lit() && d.talk) { if (d.scene) SB.Story.run(d.scene); return; } if (!e.lit() && L.def.tool === 'lantern') { P.useTool(L, L.dir); return; } SB.UI.toast(e.lit() ? 'The well lamp glows.' : 'The well lamp has gone out.'); };
    e.draw = function (c) { var im = SB.gfx.frame('lamp', e.lit() ? 1 : 0); if (im) c.drawImage(im, e.x - 8, e.y - 16); };
  };
  KINDS.lockdoor = function (e, d) {
    e.update = function () { e.solid = !SB.G.flags[d.flag]; e.flat = !e.solid; };
    e.solid = !SB.G.flags[d.flag];
    e.interact = function () {
      if (SB.G.flags[d.flag]) return;
      if ((SB.G.keys || 0) > 0) { SB.G.keys--; SB.G.flags[d.flag] = 1; A().sfx('door'); SB.UI.toast('Unlocked!'); SB.UI.refreshHud(true); }
      else SB.Story.run('locked');
    };
    e.draw = function (c) { if (!e.solid) return; var im = SB.gfx.frame('lockdoor', 0); if (im) c.drawImage(im, e.x - 8, e.y - 16); };
  };
  KINDS.fogwall = function (e, d) {
    e.solid = true; var w = (d.w || 1) * T, h = (d.h || 1) * T; e.bumpT = 0;
    e.solidBox = function () { return { x: d.x * T, y: d.y * T, w: w, h: h }; };
    e.update = function (dt) {
      var L = P.leader(); if (!L || W.cutscene) return; var b = e.solidBox();
      if (L.x > b.x - 8 && L.x < b.x + w + 8 && L.y > b.y - 4 && L.y < b.y + h + 10 && (SB.input.x || SB.input.y)) { e.bumpT += dt; if (e.bumpT > .5 && (!e.lastRun || W.time - e.lastRun > 4)) { e.lastRun = W.time; e.bumpT = 0; if (d.scene) SB.Story.run(d.scene); } }
      else e.bumpT = 0;
    };
    e.draw = function (c) { for (var yy = 0; yy < h; yy += T) for (var xx = 0; xx < w; xx += T) { var im = SB.gfx.frame('t_fogwall', Math.floor(e.t * 2 + xx)); if (im) c.drawImage(im, d.x * T + xx, d.y * T + yy); } };
    e.flat = false; e.y = d.y * T + h;
  };
  KINDS.tileswap = function (e, d) {
    e.update = function () { if (SB.cond(d.when, SB.ctx)) for (var y = 0; y < (d.h || 1); y++) for (var x = 0; x < (d.w || 1); x++) W.overrides[(d.x + x) + ',' + (d.y + y)] = d.tile; };
    e.update();
  };
  KINDS.warp = function (e, d) {
    var zone = function () { return { x: d.x * T, y: d.y * T, w: (d.w || 1) * T, h: (d.h || 1) * T }; };
    e.update = function () {
      var L = P.leader(); if (!L || W.cutscene || SB.Main.busy) return;
      var inside = rectHit({ x: L.x - 3, y: L.y - 4, w: 6, h: 4 }, zone());
      if (!inside) { e.armed = true; return; }
      if (!e.armed) return;
      e.armed = false;
      if (d.require && !SB.cond(d.require, SB.ctx)) { var v = SB.dirVec[L.dir]; L.x -= v[0] * 10; L.y -= v[1] * 10; if (d.deny) SB.Story.run(d.deny); return; }
      SB.Main.warp(d.to, d.tx, d.ty, d.dir);
    };
  };
  KINDS.trigger = function (e, d) {
    var zone = { x: d.x * T, y: d.y * T, w: (d.w || 1) * T, h: (d.h || 1) * T };
    e.update = function () {
      var L = P.leader(); if (!L || W.cutscene || SB.Main.busy) return;
      var inside = rectHit({ x: L.x - 3, y: L.y - 4, w: 6, h: 4 }, zone);
      if (!inside) { e.inside = false; return; }
      if (e.inside) return; e.inside = true;
      if (d.require && !SB.cond(d.require, SB.ctx)) return;
      if (d.once && SB.G.flags[d.once]) return;
      if (d.once) SB.G.flags[d.once] = 1;
      SB.Story.run(d.scene);
    };
  };
  KINDS.watch = function (e, d) {
    e.update = function () { if (W.cutscene) return; if (d.once && SB.G.flags[d.once]) return; if (SB.cond(d.when, SB.ctx)) { if (d.once) SB.G.flags[d.once] = 1; SB.Story.run(d.scene); } };
  };
  KINDS.tone = function (e, d) {
    e.light = 64;
    e.update = function () { var L = P.leader(); if (!L || W.cutscene || e.taken) return; if (SB.dist(L.x, L.y - 6, e.x, e.y - 12) < 20) { e.taken = true; SB.Story.run(d.scene).then(function () { e.taken = false; }); } };
    e.draw = function (c) { var by = Math.sin(e.t * 3) * 3; c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(e.x, e.y - 14 + by, 14 + Math.sin(e.t * 5) * 2, 0, 6.3); c.fill(); SB.gfx.draw(c, d.sprite || 'tone_wood', Math.floor(e.t * 4), e.x, e.y - 4 + by); };
  };
  KINDS.bell = function (e, d) {
    e.x = d.x * T + 16; e.y = d.y * T + 32; e.solid = true;
    e.solidBox = function () { return { x: e.x - 14, y: e.y - 14, w: 28, h: 14 }; };
    e.interBox = function () { return { x: e.x - 16, y: e.y - 30, w: 32, h: 30 }; };
    e.interact = function () { if (d.scene) SB.Story.run(d.scene); };
    e.draw = function (c) {
      var G = SB.G, cracked = G.flags.prologue_done && !G.flags.ending_done;
      var im = SB.gfx.frame('bell', cracked ? 1 : 0); if (!im) return;
      c.fillStyle = '#3a2a1c'; c.fillRect(e.x - 18, e.y - 36, 36, 3);
      c.drawImage(im, e.x - 16, e.y - 32);
      if (cracked) { var cols = []; if (G.flags.tone_wood) cols.push('#8fe08f'); if (G.flags.tone_deep) cols.push('#8fc8ff'); if (G.flags.tone_stone) cols.push('#ffb070'); if (G.flags.tone_silence) cols.push('#e0d0ff'); cols.forEach(function (col, i) { c.strokeStyle = col; c.globalAlpha = .5 + Math.sin(e.t * 3 + i) * .3; c.lineWidth = 1; c.beginPath(); c.moveTo(e.x + i - 1, e.y - 26); c.lineTo(e.x - 2 + i, e.y - 20); c.lineTo(e.x + 1 + i, e.y - 14); c.lineTo(e.x - 1 + i, e.y - 7); c.stroke(); c.globalAlpha = 1; }); }
    };
  };

  /* ======================================================================= PICKUPS */
  function makePickup(kind, x, y, value) {
    var e = { def: { id: '_p' }, type: 'pickup', kind: kind, x: x, y: y, z: 0, vz: 60, t: 0, visible: true, value: value, life: 12 };
    e.update = function (dt) {
      e.vz -= 240 * dt; e.z = Math.max(0, e.z + e.vz * dt); if (e.z === 0) e.vz = 0; e.life -= dt; if (e.life <= 0) e.remove = true;
      P.members.forEach(function (h) {
        if (e.remove) return; var dd = SB.dist(h.x, h.y - 4, e.x, e.y - 4);
        if (dd < 22 && h === P.leader()) { e.x += (h.x - e.x) * .15; e.y += (h.y - e.y) * .15; }
        if (dd < 8) { e.remove = true; if (kind === 'heart') { P.heal(e.value); A().sfx('heart'); } else { SB.G.chimes += e.value; A().sfx('chime'); SB.UI.refreshHud(true); } }
      });
    };
    e.draw = function (c) { if (e.life < 3 && Math.floor(e.life * 10) % 2) return; shadow(c, e.x, e.y, 3); if (kind === 'heart') SB.gfx.draw(c, 'heart_small', 0, e.x, e.y - e.z); else SB.gfx.draw(c, 'chime', e.value >= 5 ? 1 : 0, e.x, e.y - e.z); };
    return e;
  }

  /* ======================================================================= ENEMIES */
  KINDS.enemy = function (e, d) {
    var ed = SB.D.enemies[d.kind] || { sprite: 'fogling', hp: 1, speed: 20, damage: 1, ai: 'wander' };
    e.edef = ed; e.hp = ed.hp; e.dir = 'down'; e.vx = 0; e.vy = 0; e.wt = Math.random(); e.state = 'idle'; e.flipT = 0; e.hurtT = 0; e.kx = 0; e.ky = 0; e.freezeInScene = true; e.drawH = 16;
    e.homeX = e.x; e.homeY = e.y; e.y -= 2;
    e.hitBox = function () { return { x: e.x - 9, y: e.y - 18, w: 18, h: 18 }; };
    e.onHit = function (o) {
      if (e.dead || e.hurtT > 0) return false;
      if (ed.ai === 'shell' && e.flipT <= 0) {
        if (o.tool === 'shield' || o.tool === 'team') { e.flipT = 3.5; A().sfx('stun'); FX.text(e.x, e.y - 18, 'flipped!', '#ffe9a0'); C.meter(6); if (o.tool !== 'team') return true; }
        else { A().sfx('hit'); FX.text(e.x, e.y - 18, o.auto ? '' : 'clank', '#ccd'); if (!o.auto && !e.hintT) { e.hintT = 1; SB.UI.toast('Its shell is too hard. Red\'s shield can knock it over!'); } return true; }
      }
      if (ed.immune && ed.immune.indexOf(o.tool) >= 0) { if (!o.auto) { FX.text(e.x, e.y - 18, 'no effect', '#ccd'); if (!e.hintT) { e.hintT = 1; SB.UI.toast(ed.ai === 'wisp' ? 'Weapons pass straight through. Try Violet\'s lantern!' : 'That has no effect on it.'); } } return true; }
      if (o.once) { if (o.once[d.id]) return false; o.once[d.id] = 1; }
      var dmg = o.dmg * (ed.weak && ed.weak.indexOf(o.tool) >= 0 ? 2 : 1);
      e.hp -= dmg; e.hurtT = .3; A().sfx('ehit'); C.meter(o.auto ? 3 : 8);
      var dx = e.x - o.x, dy = e.y - o.y, dl = Math.sqrt(dx * dx + dy * dy) || 1; e.kx = dx / dl * (o.knock || 80); e.ky = dy / dl * (o.knock || 80);
      if (e.hp <= 0) { e.dead = true; e.remove = true; A().sfx('edie'); FX.puff(e.x, e.y - 6, true); C.meter(10); var dr = ed.drops || {}; if (Math.random() < (dr.heart || 0) && SB.G.hp < SB.G.maxHp) W.ents.push(makePickup('heart', e.x, e.y, 2)); else if (Math.random() < (dr.chime || 0)) W.ents.push(makePickup('chime', e.x, e.y, Math.random() < .2 ? 5 : 1)); }
      return true;
    };
    e.update = function (dt) {
      var L = P.leader(); if (!L) return;
      e.hurtT = Math.max(0, e.hurtT - dt); e.flipT = Math.max(0, e.flipT - dt);
      var fly = !!ed.fly;
      if (Math.abs(e.kx) + Math.abs(e.ky) > 5) { W.move(e, e.kx * dt, 0, 10, 6, fly); W.move(e, 0, e.ky * dt, 10, 6, fly); e.kx *= .82; e.ky *= .82; return; }
      var dx = L.x - e.x, dy = L.y - e.y, dist = Math.sqrt(dx * dx + dy * dy) || 1, sp = ed.speed || 20;
      if (ed.ai === 'chase') {
        if (dist < (ed.sight || 80)) { e.vx = dx / dist * sp; e.vy = dy / dist * sp; }
        else { e.wt -= dt; if (e.wt <= 0) { e.wt = 1 + Math.random() * 1.5; var a = Math.random() * 6.28; e.vx = Math.cos(a) * sp * .6; e.vy = Math.sin(a) * sp * .6; if (Math.random() < .3) e.vx = e.vy = 0; } }
      } else if (ed.ai === 'wander' || ed.ai === 'shell') {
        if (e.flipT > 0) { e.vx = e.vy = 0; }
        else { e.wt -= dt; if (e.wt <= 0) { e.wt = 1 + Math.random() * 2; var a2 = Math.random() * 6.28; e.vx = Math.cos(a2) * sp; e.vy = Math.sin(a2) * sp; if (dist < 70 && Math.random() < .6) { e.vx = dx / dist * sp; e.vy = dy / dist * sp; } } }
      } else if (ed.ai === 'charge') {
        if (e.state === 'charge') { var ok = W.move(e, e.vx * dt, e.vy * dt, 10, 6); e.ct -= dt; if (!ok || e.ct <= 0) { e.state = 'stun'; e.st = .9; if (!ok) { W.shake = Math.max(W.shake, .1); A().sfx('hit'); } } return void (e.dir = SB.dirOf(e.vx, e.vy)); }
        if (e.state === 'stun') { e.st -= dt; if (e.st <= 0) e.state = 'idle'; return; }
        if (e.state === 'wind') { e.st -= dt; if (e.st <= 0) { e.state = 'charge'; e.ct = 1.4; } return; }
        if (dist < (ed.sight || 100) && (Math.abs(dx) < 10 || Math.abs(dy) < 10)) { e.state = 'wind'; e.st = .45; var dd = SB.dirVec[SB.dirOf(dx, dy)]; e.vx = dd[0] * (ed.chargeSpeed || 110); e.vy = dd[1] * (ed.chargeSpeed || 110); e.dir = SB.dirOf(dx, dy); FX.emote(e, '!'); return; }
        e.wt -= dt; if (e.wt <= 0) { e.wt = 1 + Math.random() * 1.5; var a3 = SB.pick([[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]]); e.vx = a3[0] * sp; e.vy = a3[1] * sp; }
      } else if (ed.ai === 'fly') {
        e.wt -= dt; if (e.wt <= 0) { e.wt = .3 + Math.random() * .5; var tx = dist < 110 ? dx / dist : 0, ty = dist < 110 ? dy / dist : 0; e.vx = (tx + (Math.random() - .5) * 1.6) * sp; e.vy = (ty + (Math.random() - .5) * 1.6) * sp; }
      } else if (ed.ai === 'turret') {
        e.vx = e.vy = 0; e.ft = (e.ft == null ? Math.random() * 2 : e.ft) - dt;
        if (dist < 130 && e.ft <= 0) { e.ft = ed.fireRate || 2; var s = ed.shotSpeed || 70; W.fx.push(makeShot(e.x, e.y - 8, dx / dist * s, dy / dist * s, ed.shot, ed.damage)); A().sfx('bubble'); }
      } else if (ed.ai === 'wisp') {
        e.vx = dx / dist * sp; e.vy = dy / dist * sp; if (dist > 140) { e.vx *= .2; e.vy *= .2; }
      }
      if (e.vx || e.vy) {
        var ok2 = W.move(e, e.vx * dt, 0, 10, 6, fly || ed.ai === 'wisp') & W.move(e, 0, e.vy * dt, 10, 6, fly || ed.ai === 'wisp');
        if (!ok2 && ed.ai !== 'wisp') e.wt = 0;
        if (ed.ai === 'wisp') { e.x += 0; }
        e.dir = SB.dirOf(e.vx, e.vy);
      }
      /* contact damage */
      if (e.flipT <= 0 && Math.abs(L.x - e.x) < 9 && Math.abs(L.y - e.y) < 9 && !(ed.ai === 'charge' && e.state === 'stun')) P.hurt(ed.damage || 1, e.x, e.y);
    };
    e.draw = function (c) {
      var spr = (ed.ai === 'shell' && e.flipT > 0 && ed.flipSprite) ? ed.flipSprite : ed.sprite;
      var fr = Math.floor(e.t * (ed.ai === 'fly' ? 8 : 4)) % 2, by = ed.fly ? Math.sin(e.t * 6) * 2 - 6 : 0;
      shadow(c, e.x, e.y, 5);
      if (e.flipT > 0 && e.flipT < 1 && Math.floor(e.flipT * 12) % 2) by -= 1;
      SB.gfx.draw(c, spr, fr, e.x, e.y + by, { flip: e.dir === 'left' || (e.vx < 0), variant: e.hurtT > 0 && Math.floor(e.hurtT * 20) % 2 ? 'white' : '', alpha: ed.ghost ? .75 : null });
    };
  };

  /* ======================================================================= BOSSES */
  KINDS.boss = function (e, d) {
    var bd = SB.D.bosses[d.kind] || {}; e.bdef = bd; e.hp = bd.hp || 8; e.maxHp = e.hp; e.state = 'idle'; e.st = 1.5; e.hurtT = 0; e.freezeInScene = true;
    e.w = bd.w || 40; e.h = bd.h || 40; e.y = d.y * T + e.h; e.x = d.x * T + 16; e.homeX = e.x; e.homeY = e.y; e.vuln = 0; e.dir = 1;
    e.hitBox = function () { return { x: e.x - e.w / 2 + 4, y: e.y - e.h + 4, w: e.w - 8, h: e.h - 8 }; };
    e.solidBox = function () { return { x: e.x - e.w / 2 + 6, y: e.y - e.h * .5, w: e.w - 12, h: e.h * .5 - 2 }; };
    e.solid = d.kind !== 'heart'; e.drawH = e.h;
    e.onShow = function () { SB.UI.bossBar(bd.name, 1); };
    var AI = BOSS_AI[d.kind] || BOSS_AI.matron; AI.init(e, bd);
    e.damage = function (n, o) {
      if (e.hurtT > 0 || e.dead) return; e.hp -= n; e.hurtT = .45; A().sfx('boss_hit'); C.meter(12); W.shake = Math.max(W.shake, .15);
      FX.text(e.x, e.y - e.h - 4, '-' + n, '#ff8a78'); SB.UI.bossBar(bd.name, Math.max(0, e.hp / e.maxHp));
      if (e.hp <= 0) e.die();
    };
    e.die = function () {
      e.dead = true; e.visible = true; W.cutscene++; A().sfx('boss_die'); SB.audio.music('none');
      var n = 0; var iv = setInterval(function () { FX.puff(e.x + SB.rand(-e.w / 2, e.w / 2), e.y - SB.rand(0, e.h), true); W.shake = .25; if (++n > 12) { clearInterval(iv); e.remove = true; W.ents.forEach(function (o) { if (o.type === 'enemy' || o.shade) { o.dead = true; o.remove = true; } }); W.fx = W.fx.filter(function (f) { return !f.enemy; }); SB.UI.bossBar(null); W.cutscene--; SB.G.flags[d.flag] = 1; if (d.outro) SB.Story.run(d.outro); } }, 140);
    };
    e.onHit = function (o) { if (e.dead) return false; return AI.hit(e, o); };
    e.update = function (dt) {
      e.hurtT = Math.max(0, e.hurtT - dt); var L = P.leader(); if (!L || e.dead) return;
      if (!SB.G.flags.boss_active) return;
      AI.update(e, dt, L);
      if (e.solid !== false && !e.noContact) { var b = e.hitBox(); if (rectHit({ x: L.x - 4, y: L.y - 6, w: 8, h: 6 }, b)) P.hurt(bd.damage || 1, e.x, e.y - e.h / 2); }
    };
    e.draw = function (c) {
      shadow(c, e.x, e.y, e.w * .4);
      var spr = AI.sprite ? AI.sprite(e, bd) : bd.sprite;
      SB.gfx.draw(c, spr, Math.floor(e.t * 3) % 2, e.x, e.y + (AI.bob ? Math.sin(e.t * 2) * 3 : 0), { variant: e.hurtT > 0 && Math.floor(e.hurtT * 20) % 2 ? 'white' : '', flip: e.flipX });
      if (AI.drawExtra) AI.drawExtra(e, c);
    };
  };
  function vulnFlash(e, c, col) { if (e.vuln > 0) { c.strokeStyle = col || '#fff6a0'; c.globalAlpha = .4 + Math.sin(e.t * 12) * .3; c.lineWidth = 1; c.beginPath(); c.arc(e.x, e.y - e.h / 2, e.w * .55, 0, 6.3); c.stroke(); c.globalAlpha = 1; } }
  var BOSS_AI = {
    /* Old Mother Briar: thorn shield. Lantern burns it away; then she's open to everything for a few seconds */
    matron: {
      init: function (e) { e.vuln = 0; e.shotT = 2; e.spawnT = 4; e.solid = true; },
      sprite: function (e, bd) { return e.vuln > 0 ? bd.bareSprite : bd.sprite; },
      hit: function (e, o) {
        if (e.vuln <= 0) {
          if (o.tool === 'lantern') { e.vuln = 5; A().sfx('burn'); FX.add({ x: e.x, y: e.y - 20, t: 0, life: .8, light: 70, draw: function (c) { var im = SB.gfx.frame('flame', Math.floor(this.t * 10)); if (im) { c.drawImage(im, this.x - 16, this.y - 16, 32, 32); } } }); SB.UI.toast('The thorns burn away! Strike now!'); A().voice('matron', 'hurt'); return true; }
          A().sfx('hit'); if (!o.auto) FX.text(e.x, e.y - 30, 'thorns!', '#d4a4ff'); if (!e.hinted) { e.hinted = 1; SB.UI.toast('Her heart is wrapped in thorns. Fire, then an edge!'); } return true;
        }
        e.damage(o.tool === 'team' ? 4 : o.tool === 'sword' ? 2 : 1, o); return true;
      },
      update: function (e, dt, L) {
        e.vuln = Math.max(0, e.vuln - dt); e.shotT -= dt; e.spawnT -= dt;
        var rage = e.hp < e.maxHp / 2 ? 1.5 : 1;
        if (e.shotT <= 0) { e.shotT = (e.vuln > 0 ? 3 : 2.2) / rage; var n = rage > 1 ? 7 : 5; for (var i = 0; i < n; i++) { var a = Math.atan2(L.y - (e.y - 20), L.x - e.x) + (i - (n - 1) / 2) * .28; W.fx.push(SB.makeShot(e.x, e.y - 20, Math.cos(a) * 62, Math.sin(a) * 62, 'orb_dark', 1)); } A().sfx('fireball'); }
        if (e.spawnT <= 0) { e.spawnT = 7; var alive = W.ents.filter(function (o) { return o.type === 'enemy' && !o.dead; }).length; if (alive < 2) { var en = SB.Actors.make({ id: '_s' + Math.random(), type: 'enemy', kind: Math.random() < .5 ? 'fogling' : 'briarboar', x: Math.floor(e.x / T) + SB.pick([-3, 3]), y: Math.floor(e.y / T) + 1 }); W.ents.push(en); FX.puff(en.x, en.y - 6, true); } }
      },
      drawExtra: function (e, c) { vulnFlash(e, c, '#a8e474'); }
    },
    /* Brinejaw: scuttles side to side, shoots bubbles. Shield bash flips him; then he's soft */
    brinejaw: {
      init: function (e) { e.vuln = 0; e.shotT = 2.5; e.lungeT = 4; e.vx = 34; },
      sprite: function (e, bd) { return e.vuln > 0 ? bd.flipSprite : bd.sprite; },
      hit: function (e, o) {
        if (e.vuln <= 0) {
          if (o.tool === 'shield' || o.tool === 'team') { e.vuln = 4; A().sfx('stun'); W.shake = .3; FX.text(e.x, e.y - 44, 'FLIPPED!', '#ffe9a0'); A().voice('brinejaw', 'hurt'); if (o.tool === 'team') e.damage(4); return true; }
          A().sfx('hit'); if (!o.auto) FX.text(e.x, e.y - 40, 'clank', '#ccd'); if (!e.hinted) { e.hinted = 1; SB.UI.toast('Too armoured! Shield-bash him over with Red.'); } return true;
        }
        e.damage(o.tool === 'team' ? 4 : o.tool === 'sword' ? 2 : 1, o); return true;
      },
      update: function (e, dt, L) {
        var rage = e.hp < e.maxHp / 2 ? 1.4 : 1;
        if (e.vuln > 0) { e.vuln -= dt; return; }
        e.lungeT -= dt; e.shotT -= dt;
        if (e.state === 'lunge') { var ok = W.move(e, e.lx * dt, e.ly * dt, e.w - 16, 10); e.lt -= dt; if (!ok || e.lt <= 0) { e.state = 'back'; } return; }
        if (e.state === 'back') { var dx = e.homeX - e.x, dy = e.homeY - e.y, d = Math.sqrt(dx * dx + dy * dy); if (d < 3) e.state = 'idle'; else W.move(e, dx / d * 60 * dt, dy / d * 60 * dt, e.w - 16, 10); return; }
        e.x += e.vx * rage * dt; if (e.x < 64 || e.x > W.map.w * T - 64) { e.vx = -e.vx; e.x = SB.clamp(e.x, 64, W.map.w * T - 64); }
        if (e.shotT <= 0) { e.shotT = 2.4 / rage; for (var i = -1; i <= 1; i++) { var a = Math.atan2(L.y - (e.y - 16), L.x - e.x) + i * .35; W.fx.push(SB.makeShot(e.x, e.y - 16, Math.cos(a) * 70, Math.sin(a) * 70, 'orb_bubble', 1)); } A().sfx('bubble'); }
        if (e.lungeT <= 0) { e.lungeT = 4.5 / rage; e.state = 'lunge'; var dx2 = L.x - e.x, dy2 = L.y - e.y, d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1; e.lx = dx2 / d2 * 130; e.ly = dy2 / d2 * 130; e.lt = .7; A().voice('brinejaw', 'attack'); }
      },
      drawExtra: function (e, c) { vulnFlash(e, c, '#80c0ff'); }
    },
    /* Cindral: eyes open and close. Arrow both open eyes; then the furnace is exposed */
    cindral: {
      init: function (e) { e.vuln = 0; e.eyes = 0; e.eyeT = 3; e.hitEyes = { l: 0, r: 0 }; e.shotT = 2; e.slamT = 0; },
      sprite: function (e, bd) { return e.eyes ? bd.eyesSprite : bd.sprite; },
      hit: function (e, o) {
        var eyeY = e.y - e.h + 9;
        if (e.vuln > 0) { if (o.tool === 'lantern') { FX.text(e.x, e.y - 30, 'it eats fire!', '#ffc444'); return true; } e.damage(o.tool === 'team' ? 4 : o.tool === 'sword' ? 2 : o.tool === 'shield' ? 2 : 1, o); return true; }
        if (e.eyes && o.tool === 'bow' && o.area.y < eyeY + 8) {
          var side = o.area.x + 3 < e.x ? 'l' : 'r'; if (!e.hitEyes[side]) { e.hitEyes[side] = 1; A().sfx('ehit'); FX.sparkle(e.x + (side === 'l' ? -5 : 5), eyeY, '#ffe060'); }
          if (e.hitEyes.l && e.hitEyes.r) { e.vuln = 5; e.eyes = 0; e.hitEyes = { l: 0, r: 0 }; A().sfx('stun'); W.shake = .3; SB.UI.toast('The furnace door swings open! Strike its chest!'); A().voice('cindral', 'hurt'); }
          return true;
        }
        A().sfx('hit'); if (!o.auto) FX.text(e.x, e.y - 30, 'clank', '#ccd'); if (!e.hinted) { e.hinted = 1; SB.UI.toast('When its eyes glow, shoot them with Blue\'s arrows!'); } return true;
      },
      update: function (e, dt, L) {
        var rage = e.hp < e.maxHp / 2 ? 1.35 : 1;
        if (e.vuln > 0) { e.vuln -= dt; return; }
        e.eyeT -= dt; if (e.eyeT <= 0) { e.eyes = e.eyes ? 0 : 1; e.eyeT = e.eyes ? 3 : 2.6 / rage; if (!e.eyes) e.hitEyes = { l: 0, r: 0 }; }
        e.shotT -= dt; if (e.shotT <= 0) { e.shotT = 1.7 / rage; var a = Math.atan2(L.y - (e.y - 20), L.x - e.x); W.fx.push(SB.makeShot(e.x, e.y - 20, Math.cos(a) * 80, Math.sin(a) * 80, 'orb_fire', 1)); A().sfx('fireball'); }
        if (e.slamT > 0) { e.slamT -= dt; if (e.slamT <= 0) { FX.ring(e.x, e.y - 6, 46, '#ff9a34', .35); W.shake = .35; A().sfx('smash'); if (SB.dist(L.x, L.y, e.x, e.y) < 48) P.hurt(1, e.x, e.y); } }
        else if (SB.dist(L.x, L.y, e.x, e.y) < 44 && Math.random() < dt * 1.5) { e.slamT = .7; FX.emote(e, '!'); }
      },
      drawExtra: function (e, c) { vulnFlash(e, c, '#ffc444'); if (e.slamT > 0) { c.strokeStyle = '#ff5a1c'; c.globalAlpha = .5; c.beginPath(); c.arc(e.x, e.y - 6, 46, 0, 6.3); c.stroke(); c.globalAlpha = 1; } }
    },
    /* The Heart: four shadows (one per hero, each only hurt by that hero's tool), then the TEAM strike */
    heart: {
      bob: true,
      init: function (e) { e.solid = false; e.phase = 'wait'; e.pt = 1.2; e.shotT = 3; e.vuln = 0; e.noContact = true; },
      sprite: function (e, bd) { return e.phase === 'core' ? bd.openSprite : bd.sprite; },
      hit: function (e, o) {
        if (e.phase === 'core' && o.tool === 'team') { e.damage(4, o); e.coreHits = (e.coreHits || 0) + 1; return true; }
        A().sfx('hit'); if (!o.auto) FX.text(e.x, e.y - 44, e.phase === 'core' ? 'TEAM strike!' : 'it isn\'t there', '#d4a4ff');
        if (e.phase === 'core' && !e.hinted) { e.hinted = 1; SB.UI.toast('Only a TEAM strike can reach the core. Gather everyone and use TEAM!'); }
        return true;
      },
      update: function (e, dt, L) {
        e.shotT -= dt;
        if (e.shotT <= 0) { e.shotT = e.phase === 'core' ? 2.6 : 3.4; var n = 10, off = Math.random(); for (var i = 0; i < n; i++) { var a = (i + off) / n * 6.28; W.fx.push(SB.makeShot(e.x, e.y - 20, Math.cos(a) * 52, Math.sin(a) * 52, 'orb_dark', 1)); } A().sfx('fireball'); }
        if (e.phase === 'wait') { e.pt -= dt; if (e.pt <= 0) { e.phase = 'shades'; SB.Story.run('heart_mid').then(function () { spawnShades(e); }); } return; }
        if (e.phase === 'shades') { if (e.spawned && !W.ents.some(function (o) { return o.shade && !o.dead; })) { e.phase = 'core'; SB.G.meter = Math.max(SB.G.meter || 0, 100); SB.UI.refreshHud(true); SB.Story.run('heart_final'); } return; }
        if (e.phase === 'core') { SB.G.meter = Math.min(100, (SB.G.meter || 0) + dt * 16); SB.UI.refreshHud(); }
      },
      drawExtra: function (e, c) { if (e.phase === 'core') { c.strokeStyle = '#fff'; c.globalAlpha = .35 + Math.sin(e.t * 8) * .25; c.beginPath(); c.arc(e.x, e.y - 20 + Math.sin(e.t * 2) * 3, 24, 0, 6.3); c.stroke(); c.globalAlpha = 1; } }
    }
  };
  function spawnShades(boss) {
    boss.spawned = true;
    P.members.forEach(function (h, i) {
      var a = i / P.members.length * 6.28;
      var s = { def: { id: '_shade' + h.id }, type: 'enemy', shade: true, heroId: h.id, tool: h.def.tool, x: boss.x + Math.cos(a) * 60, y: boss.y + 30 + Math.sin(a) * 26, t: 0, visible: true, hp: 3, hurtT: 0, dir: 'down', anim: 'walk', freezeInScene: true, drawH: 34, kx: 0, ky: 0 };
      s.edef = { name: 'Shadow of ' + h.def.name, immune: ['sword', 'bow', 'shield', 'lantern', 'team'].filter(function (t) { return t !== h.def.tool && t !== 'team'; }) };
      s.hitBox = function () { return { x: s.x - 7, y: s.y - 20, w: 14, h: 20 }; };
      s.onHit = function (o) {
        if (s.dead || s.hurtT > 0) return false;
        if (o.tool !== s.tool && o.tool !== 'team') { if (!o.auto) { FX.text(s.x, s.y - 20, 'only ' + h.def.name + '!', '#d4a4ff'); A().sfx('hit'); } return true; }
        s.hp -= o.tool === 'team' ? 3 : 1; s.hurtT = .35; A().sfx('ehit'); C.meter(8); var dx = s.x - o.x, dy = s.y - o.y, dl = Math.sqrt(dx * dx + dy * dy) || 1; s.kx = dx / dl * 120; s.ky = dy / dl * 120;
        if (s.hp <= 0) { s.dead = true; s.remove = true; A().sfx('edie'); FX.puff(s.x, s.y - 8, true); A().voice(h.id, 'cheer'); }
        return true;
      };
      s.update = function (dt) {
        var L = P.leader(); s.hurtT = Math.max(0, s.hurtT - dt);
        if (Math.abs(s.kx) + Math.abs(s.ky) > 5) { W.move(s, s.kx * dt, s.ky * dt, 8, 5); s.kx *= .8; s.ky *= .8; return; }
        var dx = L.x - s.x, dy = L.y - s.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        W.move(s, dx / d * 30 * dt, 0, 8, 5); W.move(s, 0, dy / d * 30 * dt, 8, 5); s.dir = SB.dirOf(dx, dy);
        if (d < 9) P.hurt(1, s.x, s.y);
      };
      s.draw = function (c) {
        shadow(c, s.x, s.y, 5); var fr = SB.charFrame(SB.gfx, s.heroId, s.dir, 'walk', s.t);
        SB.gfx.draw(c, fr.id, fr.f, s.x, s.y + 1, { flip: fr.flip, variant: s.hurtT > 0 ? 'white' : 'dark' });
        c.fillStyle = '#ff4060'; c.fillRect(Math.round(s.x - 3), Math.round(s.y - 20), 1, 1); c.fillRect(Math.round(s.x + 2), Math.round(s.y - 20), 1, 1);
        var ic = SB.gfx.frame(h.def.icon, 0); if (ic) { c.globalAlpha = .8; c.drawImage(ic, Math.round(s.x - 7), Math.round(s.y - 48)); c.globalAlpha = 1; }
      };
      W.ents.push(s); FX.puff(s.x, s.y - 8, true);
    });
  }
})();
