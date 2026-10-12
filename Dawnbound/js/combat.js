/* Dawnbound - real-time combat: actions, damage, enemy + ally AI, boss patterns */
(function () {
  'use strict';
  var DB = window.DB, W = DB.world, A = DB.assets;
  var C = DB.combat = { zones: [], swings: [], bolts: [], traps: [], boss: null, safe: null, calm: 0, cdScale: 1, noCombat: false };
  var D2R = Math.PI / 180;
  /* ================= helpers ================= */
  function enemies() { var o = []; for (var i = 0; i < W.ents.length; i++) { var e = W.ents[i]; if (e.type === 'enemy' && !e.dead && !e.hidden) o.push(e); } return o; }
  C.enemies = enemies;
  function alive() { return W.party.filter(function (p) { return p.m.hp > 0; }); }
  C.alive = alive;
  function nearest(list, x, y, maxd) { var b = null, bd = maxd || 1e9; for (var i = 0; i < list.length; i++) { var d = DB.dist(x, y, list[i].x, list[i].y); if (d < bd) { bd = d; b = list[i]; } } return b; }
  function angTo(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }
  function angDiff(a, b) { var d = a - b; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; return Math.abs(d); }
  function dirFromAng(a) { return DB.dirOf(Math.cos(a), Math.sin(a)); }
  C.hpOf = function (e) { return e.type === 'enemy' ? e.hp : e.m.hp; };
  /* ================= enemy creation ================= */
  DB.spawnEnemies = function (def) {
    (def.enemies || []).forEach(function (g) {
      if (g.cond && !g.cond(DB.G)) return;
      var pts = g.at || [[g.x, g.y]];
      pts.forEach(function (p, i) { var e = C.makeEnemy(g.type, g.lv || 1, p[0], p[1], g); W.ents.push(e); });
    });
  };
  C.makeEnemy = function (type, lv, x, y, o) {
    o = o || {}; var d = DB.enemyTypes[type]; var st = DB.enemyStats(lv, d);
    var e = { type: 'enemy', kind: type, def: d, id: 'en' + Math.random().toString(36).slice(2, 7), sprite: d.sprite, name: d.name, x: x, y: y, hx: x, hy: y, r: d.r || 8, sr: (d.r || 8) + 3, lv: lv, hp: st.hp, maxhp: st.hp, atk: st.atk, df: st.def, xp: st.xp, gold: st.gold,
      team: 'e', dir: 'down', anim: 'idle_down', at: Math.random(), scale: (d.scale || 1), tint: d.tint, tintAmt: d.tintAmt, alpha: d.alpha, ai: { st: 'idle', t: Math.random() * 2, cd: 1 + Math.random(), target: null, wt: 0 }, fly: d.fly, vx: 0, vy: 0, stun: 0, slow: 0, burn: 0, aggroed: false };
    if (o.drop) e.drop = o.drop;
    ensureSprite(e);
    return e;
  };
  /* sprites for scene-spawned foes are not preloaded with the map: load on demand */
  function ensureSprite(e) { var A = DB.assets; if (e.sprite && A && A.loadChars && !A.charSheet(e.sprite)) A.loadChars([e.sprite]); }
  C.makeBoss = function (key, lv, x, y, o) {
    o = o || {}; var d = DB.bosses[key], st = DB.enemyStats(lv, { hpMul: d.hpMul, atkMul: d.atkMul });
    var e = { type: 'enemy', boss: true, bkey: key, kind: key, def: d, id: 'boss_' + key, sprite: d.sprite, name: d.name, x: x, y: y, hx: x, hy: y, r: d.r, sr: d.r + 6, lv: lv, hp: st.hp, maxhp: st.hp, atk: st.atk, df: st.def, xp: Math.round(st.xp * (d.xpMul || 3)), gold: st.gold * 8, team: 'e', dir: 'down', anim: 'idle_down', at: 0, scale: d.scale || 1.4, tint: o.tint, tintAmt: o.tintAmt, ai: { st: 'idle', t: 1, cd: 2, target: null, pat: 0, phase: 0 }, fly: d.fly, vx: 0, vy: 0, stun: 0, slow: 0, aggroed: true, sheet4: d.sheet4 };
    if (d.sheet4) { e.anim = 'idle'; e.noShadow = false; }
    e.drop = o.drop;
    ensureSprite(e);
    return e;
  };
  /* ================= damage ================= */
  var RF = function () { return .92 + Math.random() * .16; };
  C.heroAtk = function (e, stat) { var s = DB.stats(e.hero); return stat === 'mag' ? s.mag : s.atk; };
  C.damage = function (src, tgt, pow, o) {
    o = o || {}; if (tgt.dead || (tgt.type !== 'enemy' && tgt.m && tgt.m.hp <= 0)) return 0;
    var isHeroTgt = tgt.type === 'ally' || tgt.type === 'player' || tgt.type === 'pet';
    if (isHeroTgt && tgt.inv > 0) return 0;
    if (tgt.type === 'enemy' && tgt.invuln) { W.text('Immune', tgt.x, tgt.y - 40, '#9fb3c8'); return 0; }
    var atk, crit = false, df;
    if (src.type === 'enemy') atk = src.atk; else if (src.hero) { var st = DB.stats(src.hero); atk = (o.stat === 'mag' ? st.mag : st.atk); if (Math.random() * 100 < (st.crit + (o.critBonus || 0))) crit = true; if (o.guaranteedCrit) crit = true; } else atk = (src.atk || 20);
    if (isHeroTgt) { df = tgt.m ? DB.stats(tgt.hero).def : 20; } else df = tgt.df || 0;
    var dmg = atk * pow * 100 / (100 + df) * RF();
    if (crit) dmg *= 1.6;
    if (tgt.rearExposed) dmg *= 2.5;
    if (tgt.type === 'enemy' && tgt.boss && tgt.veilGhost) dmg *= .1;
    dmg = Math.max(1, Math.round(dmg));
    if (isHeroTgt) {
      if (tgt.buffs && tgt.buffs.guard > 0) { dmg = Math.round(dmg * (tgt.guardTake || .3)); if (src && src.type === 'enemy' && tgt.guardCounter) { C.damage(tgt, src, tgt.guardCounter, { stat: 'atk' }); tgt.guardCounter = 0; W.fx('dawnmark_burst', src.x, src.y - 12, { scale: .4 }); DB.audio.sfx('block'); } }
      if (tgt.shield > 0) { var ab = Math.min(tgt.shield, dmg); tgt.shield -= ab; dmg -= ab; W.text('Block', tgt.x, tgt.y - 34, '#9ae0ff'); }
      if (dmg <= 0) return 0;
      tgt.m.hp = Math.max(0, tgt.m.hp - dmg);
      tgt.flashT = .2; tgt.inv = .45; C.calm = 0;
      W.text(String(dmg), tgt.x, tgt.y - 30, '#ff8f8f');
      DB.audio.sfx('hurt');
      if (tgt.act && tgt.act.sk && tgt.act.sk.kind !== 'guard' && !tgt.superArmor && dmg > tgt.m.hp * .08) { tgt.act = null; tgt.hurtT = .3; W.play(tgt, 'hurt', true); }
      if (tgt.hero === 'brakka') G_rage(tgt, 6);
      C.addMeter(2.5);
      if (tgt.m.hp <= 0) C.heroDown(tgt);
      if (o.kb) C.knock(tgt, src, o.kb);
    } else {
      /* enemy */
      tgt.hp -= dmg; tgt.flashT = .12; tgt.aggroed = true; tgt.lastHit = src;
      W.text(String(dmg), tgt.x, tgt.y - tgt.scale * 38, crit ? '#ffe27a' : '#ffffff', { big: crit });
      DB.audio.sfx(crit ? 'crit' : 'hit');
      if (src.hero) { C.addMeter(crit ? 4 : 2.2); if (src.hero === 'brakka') G_rage(src, 4); }
      if (o.kb && !tgt.boss) C.knock(tgt, src, o.kb);
      if (o.stun) { tgt.stun = Math.max(tgt.stun, tgt.boss ? o.stun * .25 : o.stun); }
      if (o.slow) tgt.slow = Math.max(tgt.slow, o.slow);
      if (o.burn) tgt.burn = Math.max(tgt.burn, o.burn);
      if (tgt.decoy) { C.decoyHit(tgt, src); }
      if (src.hero && src.hero === DB.G.hero && o.steal && !tgt.boss && Math.random() < o.steal) C.steal(tgt);
      if (tgt.hp <= 0) C.enemyDown(tgt, src);
      else if (!tgt.boss && tgt.ai.st !== 'wind' && dmg > tgt.maxhp * .06 && !tgt.noStagger) { tgt.ai.st = 'hurt'; tgt.ai.t = .28; tgt.hurtT = .28; W.play(tgt, 'hurt', true); }
      else if (tgt.boss) C.bossHit(tgt);
    }
    return dmg;
  };
  function G_rage(e, n) { var G = DB.G; G.rage = Math.min(100, (G.rage || 0) + n); }
  C.knock = function (tgt, src, force) { var a = angTo(src, tgt); tgt.vx += Math.cos(a) * force * 3.2; tgt.vy += Math.sin(a) * force * 3.2; };
  C.addMeter = function (n) { var G = DB.G; if (C.noMeter || G.flags.noMeter) return; G.meter = Math.min(100, (G.meter || 0) + n); };
  C.steal = function (e) {
    var tbl = ['sea_biscuits', 'healing_potion', 'mana_tonic', 'travel_rations']; if (e.lv > 15) tbl = ['healing_potion', 'greater_potion', 'mana_draught']; if (e.lv > 35) tbl = ['greater_potion', 'elixir_dawn', 'mana_draught'];
    var it = DB.pick(tbl); DB.addItem(it, 1); DB.toast('Vex stole ' + DB.itemName(it) + '!', 'item'); DB.audio.sfx('coin_pickup');
  };
  C.heroDown = function (h) {
    h.act = null; h.dead = true; W.play(h, 'defeat', true); h.buffs = {}; h.shield = 0;
    if (h === W.player) { var nxt = alive().filter(function (p) { return p !== h; })[0]; if (nxt) { C.switchTo(nxt.hero, true); } }
    /* Maren's Lantern */
    if (!h.lanternUsed && h.m.eq.acc && DB.items[h.m.eq.acc] && DB.items[h.m.eq.acc].revive) { h.lanternUsed = true; setTimeout(function () { if (h.m.hp <= 0) { h.m.hp = Math.round(DB.stats(h.hero).hp * .5); h.dead = false; W.play(h, 'revive', true); W.fx('healing', h.x, h.y, { scale: 1 }); W.text("Maren's Lantern", h.x, h.y - 40, '#ffd86b'); } }, 900); }
    if (alive().length === 0 && !C.gameOverPending) {
      if (C.boss && C.boss.def && C.boss.def.special === 'unwinnable' && !C.boss.endedFight) { var ub = C.boss; ub.endedFight = true; setTimeout(function () { C.pauseFor(function () { return DB.story.run(ub.fight && ub.fight.onSurvive || 'act4_scattered'); }); }, 900); return; }
      C.gameOverPending = true; setTimeout(function () { DB.gameOver(); }, 1400);
    }
  };
  C.revive = function (h, pct) { if (h.m.hp > 0) return; h.m.hp = Math.max(1, Math.round(DB.stats(h.hero).hp * (pct || .3))); h.dead = false; h.inv = 1; W.play(h, 'revive', true); W.fx('healing', h.x, h.y, { scale: .9 }); };
  C.enemyDown = function (e, src) {
    if (e.dead) return; e.dead = true; e.deadT = 0; e.hp = 0; e.ai.st = 'dead'; W.play(e, e.sheet4 ? 'defeat' : 'defeat', true); DB.audio.sfx('enemydie');
    if (e.boss) { DB.audio.sfx('roar'); W.shakeCam(10); }
    if (e.decoy) return;
    DB.G.kills = (DB.G.kills || 0) + 1;
    var xp = e.xp; if (DB.G.flags.no_xp) xp = 0;
    if (xp) { DB.gainXp(xp); W.text('+' + xp + ' XP', e.x, e.y - 50, '#9ee6ff'); }
    if (e.gold) { DB.G.gold += e.gold; DB.audio.sfx('gold'); }
    if (e.drop) { DB.addItem(e.drop, 1); DB.toast('Dropped: ' + DB.itemName(e.drop), 'item'); }
    else if (!e.boss && Math.random() < .12) { var it = e.lv > 20 ? 'greater_potion' : e.lv > 8 ? 'healing_potion' : 'sea_biscuits'; DB.addItem(it, 1); DB.toast('Dropped: ' + DB.itemName(it), 'item'); }
    DB.emit('kill', e);
    if (e.onDeath) e.onDeath(e);
    if (e.boss && C.boss === e) C.bossDown(e);
  };
  /* ================= actions (skills) ================= */
  C.can = function (e, which) {
    if (e.dead || e.m.hp <= 0 || e.act || e.hurtT > 0 || e.dashT > 0) return false;
    var sk = DB.skills[e.hero][which]; if (!sk) return false;
    if (which === 's1' || which === 's2') { if ((e.cds[which] || 0) > 0) return false; if (sk.mp && e.m.mp < sk.mp) return false; }
    if (which === 'basic' && (e.cds.basic || 0) > 0) return false;
    return true;
  };
  C.aim = function (e, range) {
    /* auto-aim toward nearest enemy in front half-plane; otherwise current facing */
    var fv = DB.dirVec[e.dir], best = null, bd = range || 170;
    enemies().forEach(function (t) { var d = DB.dist(e.x, e.y, t.x, t.y); if (d < bd) { var a = Math.atan2(t.y - e.y, t.x - e.x); var fa = Math.atan2(fv[1], fv[0]); if (angDiff(a, fa) < 1.75 || d < 40) { bd = d; best = t; } } });
    if (best) return { ang: angTo(e, best), tgt: best };
    return { ang: Math.atan2(fv[1], fv[0]), tgt: null };
  };
  C.act = function (e, which, aimOverride) {
    if (!C.can(e, which)) return false;
    var sk = DB.skills[e.hero][which], H = DB.heroes[e.hero];
    var a = aimOverride || C.aim(e, which === 'basic' ? (H.rangeAtk ? 210 : 90) : 200);
    if (sk.mp) e.m.mp -= sk.mp;
    if (sk.cd) e.cds[which] = sk.cd * C.cdScale;
    var dur = sk.dur, wind = sk.wind;
    if (which === 'basic') {
      e.combo = (e.comboT > 0) ? (e.combo + 1) % 3 : 0; e.comboT = .75;
      if (sk.combo) { e.comboMul = sk.combo[e.combo]; if (e.combo === 2) { dur += .06; } }
      e.cds.basic = dur * .9;
    }
    e.act = { which: which, sk: sk, t: 0, wind: wind, dur: dur, fired: false, ang: a.ang, tgt: a.tgt };
    e.dir = dirFromAng(a.ang); e.vx = e.vx * .3; e.vy = e.vy * .3;
    /* attack animation: stretch the 3 frames over the action duration */
    var c = A.atlas.chars[e.sprite]; W.play(e, 'attack', true); e.atkRate = Math.min(1.6, Math.max(.7, .375 / dur));
    if (e === W.player || true) { if (sk.kind === 'slash') DB.audio.sfx('swing'); else if (sk.arrow) DB.audio.sfx('arrow'); else DB.audio.sfx('cast', { gap: .15 }); }
    return true;
  };
  var KIND = {};
  function fireAct(e) {
    var a = e.act, sk = a.sk, f = KIND[sk.kind]; if (f) f(e, sk, a);
  }
  /* --- per-kind effects --- */
  KIND.slash = function (e, sk, a) {
    var st = DB.stats(e.hero), H = DB.heroes[e.hero]; var mul = (a.which === 'basic' ? (e.comboMul || 1) : 1);
    var stat = H.wstat, hit = 0;
    C.swings.push({ x: e.x, y: e.y - 10, ang: a.ang, arc: sk.arc * D2R, range: sk.range + 8, t: 0, color: a.which === 'basic' ? 'rgba(255,255,255,.85)' : 'rgba(255,225,140,.9)' });
    var rb = e.buffs.berserk ? 1 : 1;
    enemies().forEach(function (t) {
      var d = DB.dist(e.x, e.y, t.x, t.y) - t.r * (t.boss ? 1.2 : 1);
      if (d <= sk.range && (angDiff(angTo(e, t), a.ang) <= sk.arc * D2R / 2 || d < 16)) {
        var n = C.damage(e, t, sk.pow * mul, { stat: stat, kb: sk.kb || (a.which === 'basic' ? 12 : 0), stun: sk.stun, steal: sk.steal, critBonus: 0 }); if (n) { hit++; if (sk.fx) W.fx(sk.fx, t.x, t.y - 10, { scale: sk.fxs || .4 }); }
      }
    });
    if (hit) { DB.audio.sfx('sword_hit', { vol: .7 }); W.shakeCam(a.which === 'basic' ? 1.5 : 3); }
    /* lunge */
    e.vx += Math.cos(a.ang) * 90; e.vy += Math.sin(a.ang) * 90;
  };
  C.makeBolt = function (e, ang, sk, o) {
    o = o || {};
    var b = { x: e.x + Math.cos(ang) * 12, y: e.y - 12 + Math.sin(ang) * 8, vx: Math.cos(ang) * sk.spd, vy: Math.sin(ang) * sk.spd, r: sk.r || 5, pow: sk.pow, src: e, team: o.team || 'p', life: sk.range / sk.spd, arrow: sk.arrow, fx: o.fx || sk.fx, fxs: sk.fxs || .4, ang: ang, stat: o.stat, pierce: sk.pierce, elem: o.elem, aoe: o.aoe, hit: {}, t: 0, color: o.color, big: o.big };
    C.bolts.push(b); return b;
  };
  KIND.bolt = function (e, sk, a) {
    var H = DB.heroes[e.hero], n = sk.count || 1, spread = (sk.spread || 0) * D2R, elem = null, fx = sk.fx;
    if (sk.cycle) { e.elemI = ((e.elemI || 0) + 1) % 3; elem = sk.cycle[e.elemI]; fx = elem; }
    for (var i = 0; i < n; i++) { var ang = a.ang + (n > 1 ? (-spread / 2 + spread * i / (n - 1)) : 0); C.makeBolt(e, ang, sk, { stat: H.wstat, elem: elem, fx: fx }); }
  };
  KIND.nova = function (e, sk, a) {
    var H = DB.heroes[e.hero]; if (sk.fx) W.fx(sk.fx, e.x, e.y - 6, { scale: sk.fxs || .6 });
    var hit = 0; enemies().forEach(function (t) { if (DB.dist(e.x, e.y, t.x, t.y) - t.r <= sk.r) { if (C.damage(e, t, sk.pow, { stat: H.wstat, kb: sk.kb, stun: sk.stun })) hit++; } });
    W.shakeCam(4); DB.audio.sfx(hit ? 'sword_hit' : 'swing');
  };
  KIND.ground = function (e, sk, a) {
    var H = DB.heroes[e.hero], t = a.tgt || nearest(enemies(), e.x, e.y, sk.range + 30);
    var px = t ? t.x : e.x + Math.cos(a.ang) * 90, py = t ? t.y : e.y + Math.sin(a.ang) * 90;
    C.zones.push({ x: px, y: py, r: sk.r, t: 0, dur: sk.delay || .4, team: 'p', color: '255,160,60', fire: function () { W.fx(sk.fx, px, py - 10, { scale: sk.fxs || 1 }); DB.audio.sfx('spell_fire'); W.shakeCam(3); enemies().forEach(function (tt) { if (DB.dist(px, py, tt.x, tt.y) - tt.r <= sk.r) C.damage(e, tt, sk.pow, { stat: H.wstat, burn: 3, kb: 40 }); }); } });
  };
  KIND.chain = function (e, sk, a) {
    var H = DB.heroes[e.hero], first = a.tgt || nearest(enemies(), e.x, e.y, sk.range + 60); if (!first) return;
    var hit = [first], cur = first, prev = e;
    for (var j = 0; j < sk.jumps; j++) {
      C.bolts.push({ line: true, x: prev.x, y: prev.y - 12, x2: cur.x, y2: cur.y - 12, t: 0, life: .22 + j * .02, color: '#bfe6ff' });
      C.damage(e, cur, sk.pow * (1 - j * .1), { stat: H.wstat, stun: .3 }); W.fx('lightning', cur.x, cur.y - 10, { scale: sk.fxs || .6 });
      var nx = nearest(enemies().filter(function (x) { return hit.indexOf(x) < 0; }), cur.x, cur.y, sk.range); if (!nx) break; hit.push(nx); prev = cur; cur = nx;
    }
    DB.audio.sfx('spell_lightning');
  };
  KIND.heal = function (e, sk, a) {
    var st = DB.stats(e.hero), amt = Math.round(st.mag * sk.mult);
    W.party.forEach(function (p) { if (p.m.hp > 0 && DB.dist(e.x, e.y, p.x, p.y) <= sk.r) { C.healEnt(p, amt); } });
    W.fx('healing', e.x, e.y - 6, { scale: sk.fxs || .8 }); DB.audio.sfx('heal_cast');
  };
  C.healEnt = function (p, amt) { var mx = DB.stats(p.hero).hp; var g = Math.min(mx - p.m.hp, amt); if (g <= 0) return; p.m.hp += g; W.text('+' + g, p.x, p.y - 34, '#8fffa8'); W.fx('healing', p.x, p.y - 6, { scale: .5 }); };
  KIND.barrier = function (e, sk, a) {
    var st = DB.stats(e.hero), amt = Math.round(st.mag * sk.mult);
    W.party.forEach(function (p) { if (p.m.hp > 0 && DB.dist(e.x, e.y, p.x, p.y) <= sk.r) { p.shield = (p.shield || 0) + amt; p.shieldT = sk.dur2; W.fx('dawnmark_burst', p.x, p.y - 6, { scale: .45 }); } });
    DB.audio.sfx('heal_cast');
  };
  KIND.guard = function (e, sk, a) { e.buffs.guard = sk.dur2; e.guardTake = sk.take; e.guardCounter = sk.counter; e.buffs.taunt = sk.dur2; e.tauntR = sk.taunt; W.fx('dawnmark_burst', e.x, e.y - 8, { scale: sk.fxs || .5 }); DB.audio.sfx('block'); };
  KIND.buff = function (e, sk, a) { e.m.buff = { atkMul: sk.atkMul, defMul: sk.defMul, spdMul: sk.spdMul }; e.buffs.berserk = sk.dur2; W.fx(sk.fx, e.x, e.y - 6, { scale: sk.fxs }); DB.audio.sfx('dawnmark_burst'); W.text('BERSERK!', e.x, e.y - 40, '#ffb36b', { big: true }); };
  KIND.dash = function (e, sk, a) {
    var H = DB.heroes[e.hero], x0 = e.x, y0 = e.y; var hit = {}; var dx = Math.cos(a.ang), dy = Math.sin(a.ang), steps = 10, per = sk.dist / steps;
    e.inv = Math.max(e.inv, sk.inv); W.fx(sk.fx, e.x, e.y - 6, { scale: sk.fxs });
    for (var i = 0; i < steps; i++) {
      var nx = e.x + dx * per, ny = e.y + dy * per; if (!W.canStand(nx, ny, 6)) break; e.x = nx; e.y = ny;
      enemies().forEach(function (t) { if (!hit[t.id] && DB.dist(e.x, e.y, t.x, t.y) < t.r + 12) { hit[t.id] = 1; C.damage(e, t, sk.pow, { stat: H.wstat, steal: .15 }); W.fx('shadow', t.x, t.y - 8, { scale: .5 }); } });
    }
    W.fx(sk.fx, e.x, e.y - 6, { scale: sk.fxs }); DB.audio.sfx('dash');
  };
  KIND.trap = function (e, sk, a) { var px = e.x + Math.cos(a.ang) * 42, py = e.y + Math.sin(a.ang) * 42; if (!W.canStand(px, py, 4)) { px = e.x; py = e.y; } C.traps.push({ x: px, y: py, r: sk.r, pow: sk.pow, stun: sk.stun, src: e, t: 0, life: 25 }); W.fx('wind_spirit', px, py, { scale: .3 }); };
  /* ultimates */
  KIND.ultnova = function (e, sk, a) {
    var H = DB.heroes[e.hero]; W.doFlash('#fff0b2', 500); W.fx('dawnmark_burst', e.x, e.y - 10, { scale: 1.8 }); W.shakeCam(10); DB.audio.sfx('dawnmark_burst');
    enemies().forEach(function (t) { if (DB.dist(e.x, e.y, t.x, t.y) <= sk.r + t.r) C.damage(e, t, sk.pow, { stat: H.wstat, kb: sk.kb, stun: 1 }); });
    W.party.forEach(function (p) { if (p.m.hp > 0) { p.shield = (p.shield || 0) + DB.stats(e.hero).def * 3; p.shieldT = sk.shield; W.fx('dawnmark_burst', p.x, p.y - 6, { scale: .5 }); } });
  };
  KIND.ultheal = function (e, sk, a) {
    W.doFlash('#fff0b2', 600); W.shakeCam(4); DB.audio.sfx('heal_cast');
    W.party.forEach(function (p) { if (p.m.hp <= 0) C.revive(p, 1); p.m.hp = DB.stats(p.hero).hp; p.m.mp = Math.max(p.m.mp, DB.stats(p.hero).mp * .5); p.regen = 10; W.fx('healing', p.x, p.y - 6, { scale: 1 }); W.fx('dawnmark_burst', p.x, p.y - 6, { scale: 1.1 }); });
  };
  KIND.ultflurry = function (e, sk, a) {
    var H = DB.heroes[e.hero], list = enemies().filter(function (t) { return DB.dist(e.x, e.y, t.x, t.y) < sk.r; });
    if (!list.length) { return; }
    W.doFlash('#e0c0ff', 250); e.inv = 1.6; e.ultT = sk.hits; var i = 0;
    var iv = setInterval(function () {
      if (i >= sk.hits || W.mode !== 'field') { clearInterval(iv); return; }
      var t = list[i % list.length]; if (t.dead) t = nearest(enemies(), e.x, e.y, sk.r); if (!t) { clearInterval(iv); return; }
      e.x = DB.clamp(t.x + (i % 2 ? 18 : -18), 6, W.map.w - 6); e.y = t.y; if (!W.canStand(e.x, e.y, 5)) { e.x = t.x; e.y = t.y + 14; } e.dir = DB.dirOf(t.x - e.x, t.y - e.y);
      C.damage(e, t, sk.pow, { stat: H.wstat, guaranteedCrit: true }); W.fx(i % 2 ? 'shadow' : 'dawnmark_burst', t.x, t.y - 10, { scale: .6 }); DB.audio.sfx('sword_hit', { gap: 0 }); i++;
    }, 100);
  };
  KIND.ultspirit = function (e, sk, a) {
    var H = DB.heroes[e.hero]; W.doFlash('#c8ffd8', 500); DB.audio.sfx('wind');
    var ax = e.x, ay = e.y; for (var k = 0; k < 6; k++) { (function (k) { setTimeout(function () { var ang = k * 1.05; W.fx('wind_spirit', ax + Math.cos(ang) * 90, ay + Math.sin(ang) * 70, { scale: 1.6 }); }, k * 120); })(k); }
    setTimeout(function () { enemies().forEach(function (t) { if (DB.dist(e.x, e.y, t.x, t.y) <= sk.r) { C.damage(e, t, sk.pow, { stat: H.wstat, stun: 1.5, kb: 60 }); } }); W.party.forEach(function (p) { C.healEnt(p, 120); }); W.shakeCam(8); }, 500);
  };
  KIND.ultstorm = function (e, sk, a) {
    var H = DB.heroes[e.hero], i = 0; W.doFlash('#ffb36b', 300); e.inv = 1.6; e.spin = 1.5;
    var iv = setInterval(function () {
      if (i >= sk.pulses || W.mode !== 'field') { clearInterval(iv); return; }
      W.fx(i % 2 ? 'lightning' : 'rage', e.x, e.y - 8, { scale: 1.3 }); W.shakeCam(5); DB.audio.sfx('spell_lightning', { gap: 0 });
      enemies().forEach(function (t) { if (DB.dist(e.x, e.y, t.x, t.y) <= sk.r + t.r) C.damage(e, t, sk.pow, { stat: H.wstat, kb: 30 }); }); i++;
    }, 230);
  };
  KIND.ultrain = function (e, sk, a) {
    var H = DB.heroes[e.hero], i = 0; W.doFlash('#cfd8ff', 350); var cx = e.x, cy = e.y;
    var iv = setInterval(function () {
      if (i >= sk.hits || W.mode !== 'field') { clearInterval(iv); return; }
      var ts = enemies(); var t = ts.length ? ts[Math.floor(Math.random() * ts.length)] : null; var px = t ? t.x + DB.rand(-20, 20) : cx + DB.rand(-sk.area, sk.area) * .6, py = t ? t.y + DB.rand(-20, 20) : cy + DB.rand(-sk.area, sk.area) * .5;
      var el = ['fire', 'ice', 'lightning'][i % 3]; W.fx(el, px, py - 8, { scale: 1.2 }); W.shakeCam(4); DB.audio.sfx(['spell_fire', 'spell_ice', 'spell_lightning'][i % 3], { gap: 0 });
      enemies().forEach(function (tt) { if (DB.dist(px, py, tt.x, tt.y) - tt.r <= sk.r) C.damage(e, tt, sk.pow, { stat: H.wstat, slow: 2 }); }); i++;
    }, 220);
  };
  /* Dawnmark Burst (shared) */
  C.doBurst = function (e) {
    var G = DB.G; if ((G.meter || 0) < 100 || e.act || e.dead || C.noMeter || G.flags.noMeter) return false;
    var ult = G.members[e.hero].ult; var sk = ult ? DB.skills[e.hero].ult : null;
    G.meter = 0; e.act = { which: 'burst', sk: sk || { kind: 'burst' }, t: 0, wind: sk ? sk.wind : .3, dur: sk ? sk.dur : .7, fired: false, ang: 0 };
    W.play(e, 'attack', true); e.atkRate = 1; e.inv = Math.max(e.inv, 1);
    if (ult) { DB.ultBanner && DB.ultBanner(sk.name, e.hero); }
    return true;
  };
  KIND.burst = function (e, sk, a) {
    var B = DB.burst, H = DB.heroes[e.hero]; W.doFlash('#fff0b2', 450); W.fx('dawnmark_burst', e.x, e.y - 10, { scale: 1.6 }); W.shakeCam(8); DB.audio.sfx('dawnmark_burst');
    enemies().forEach(function (t) { if (DB.dist(e.x, e.y, t.x, t.y) <= B.r + t.r) C.damage(e, t, B.pow, { stat: H.wstat, stun: B.stun, kb: 90 }); });
    W.party.forEach(function (p) { if (p.m.hp > 0) C.healEnt(p, Math.round(DB.stats(p.hero).hp * B.heal)); else C.revive(p, .25); });
  };
  /* ================= projectiles / zones / traps ================= */
  function updateBolts(dt) {
    for (var i = C.bolts.length - 1; i >= 0; i--) {
      var b = C.bolts[i]; b.t += dt;
      if (b.line) { if (b.t > b.life) C.bolts.splice(i, 1); continue; }
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      var dead = b.life <= 0 || b.x < 0 || b.y < 0 || b.x > W.map.w || b.y > W.map.h;
      if (!dead) {
        if (b.team === 'p') {
          for (var j = 0; j < W.ents.length; j++) {
            var t = W.ents[j]; if (t.type !== 'enemy' || t.dead || b.hit[t.id]) continue;
            if (DB.dist(b.x, b.y, t.x, t.y - 8) < t.r + b.r + 4) {
              b.hit[t.id] = 1; var o = { stat: b.stat, kb: 25 };
              if (b.elem === 'ice') o.slow = 2.5; if (b.elem === 'fire') o.burn = 3; if (b.elem === 'lightning') o.stun = .4;
              C.damage(b.src, t, b.pow, o); if (b.fx) W.fx(b.fx, t.x, t.y - 10, { scale: .45 }); if (!b.pierce) { dead = true; break; }
            }
          }
        } else {
          for (var k = 0; k < W.party.length; k++) {
            var p = W.party[k]; if (p.m.hp <= 0 || b.hit[p.id]) continue;
            if (DB.dist(b.x, b.y, p.x, p.y - 8) < 10 + b.r) { b.hit[p.id] = 1; C.damage(b.src, p, b.pow, { kb: b.kb || 30 }); dead = true; if (b.fx) W.fx(b.fx, p.x, p.y - 10, { scale: .4 }); break; }
          }
        }
      }
      if (dead) C.bolts.splice(i, 1);
    }
  }
  function updateZones(dt) {
    for (var i = C.zones.length - 1; i >= 0; i--) {
      var z = C.zones[i]; z.t += dt;
      if (z.follow) { z.x = z.follow.x; z.y = z.follow.y; if (z.ang != null && z.shape === 'cone') z.ang = z.follow.aimAng != null ? z.follow.aimAng : z.ang; }
      if (z.t >= z.dur) { C.zones.splice(i, 1); if (z.fire) z.fire(); }
    }
  }
  function inZone(z, p) {
    var d = DB.dist(z.x, z.y, p.x, p.y);
    if (z.shape === 'cone') { return d <= z.r + 8 && (angDiff(Math.atan2(p.y - z.y, p.x - z.x), z.ang) <= z.arc / 2 || d < 14); }
    if (z.shape === 'line') { var dx = Math.cos(z.ang), dy = Math.sin(z.ang); var rx = p.x - z.x, ry = p.y - z.y; var along = rx * dx + ry * dy, perp = Math.abs(-rx * dy + ry * dx); return along > -6 && along < z.len && perp < z.w / 2 + 8; }
    return d <= z.r + 6;
  }
  /* enemy zone: damages party on fire */
  C.enemyZone = function (src, o) {
    var z = { x: o.x, y: o.y, r: o.r, shape: o.shape || 'circle', ang: o.ang, arc: o.arc, len: o.len, w: o.w, t: 0, dur: o.dur, team: 'e', color: o.color || '255,60,60', follow: o.follow };
    z.fire = function () {
      if (src.dead) return; var hit = 0;
      W.party.forEach(function (p) { if (p.m.hp > 0 && inZone(z, p)) { C.damage(src, p, o.pow, { kb: o.kb || 60 }); hit++; } });
      if (o.fx) W.fx(o.fx, z.x, z.y - 4, { scale: o.fxs || (o.r / 60) });
      if (o.shake) W.shakeCam(o.shake); if (o.sfx) DB.audio.sfx(o.sfx);
      if (o.after) o.after(z, hit);
    };
    C.zones.push(z); return z;
  };
  function updateTraps(dt) {
    for (var i = C.traps.length - 1; i >= 0; i--) {
      var t = C.traps[i]; t.t += dt; if (t.t > t.life) { C.traps.splice(i, 1); continue; }
      var hit = enemies().filter(function (e) { return DB.dist(t.x, t.y, e.x, e.y) < t.r * .7 + e.r; });
      if (hit.length) { hit.forEach(function (e) { C.damage(t.src, e, t.pow, { stat: 'atk', stun: t.stun }); }); W.fx('wind_spirit', t.x, t.y, { scale: .8 }); DB.audio.sfx('lever'); C.traps.splice(i, 1); }
    }
  }
  /* ================= player + allies update ================= */
  C.switchTo = function (id, silent) {
    var h = W.party.filter(function (p) { return p.hero === id; })[0]; if (!h || h.m.hp <= 0 || h === W.player) return;
    if (W.player) W.player.type = 'ally'; h.type = 'player'; W.player = h; W.cam.follow = h;
    DB.G.party = [id].concat(DB.G.party.filter(function (x) { return x !== id; })); W.party = [h].concat(W.party.filter(function (x) { return x !== h; }));
    if (!silent) DB.audio.sfx('select'); DB.emit('leader', id);
  };
  var SPEED_K = 1.12;
  function moveEnt(e, dt, ax, ay, speed) {
    /* knockback / impulse velocity decays */
    var kx = e.vx * dt, ky = e.vy * dt; e.vx *= Math.pow(.02, dt); e.vy *= Math.pow(.02, dt);
    if (Math.abs(e.vx) < 4) e.vx = 0; if (Math.abs(e.vy) < 4) e.vy = 0;
    var mx = ax * speed * dt + kx, my = ay * speed * dt + ky;
    if (mx || my) { var steps = Math.ceil(Math.max(Math.abs(mx), Math.abs(my)) / 3); for (var s = 0; s < steps; s++) W.tryMove(e, mx / steps, my / steps); }
  }
  function updateHeroTimers(e, dt) {
    ['s1', 's2', 'basic'].forEach(function (k) { if (e.cds[k] > 0) e.cds[k] -= dt; });
    if (e.comboT > 0) e.comboT -= dt; if (e.inv > 0) e.inv -= dt; if (e.hurtT > 0) e.hurtT -= dt; if (e.dashT > 0) e.dashT -= dt; if (e.dashCd > 0) e.dashCd -= dt;
    if (e.shieldT > 0) { e.shieldT -= dt; if (e.shieldT <= 0) e.shield = 0; }
    for (var k in e.buffs) { if (e.buffs[k] > 0) { e.buffs[k] -= dt; if (e.buffs[k] <= 0) { if (k === 'berserk') e.m.buff = null; if (k === 'guard') e.guardCounter = 0; } } }
    if (e.regen > 0) { e.regen -= dt; if (e.m.hp > 0) e.m.hp = Math.min(DB.stats(e.hero).hp, e.m.hp + DB.stats(e.hero).hp * .03 * dt); }
    var st = DB.stats(e.hero); if (e.m.hp > 0) e.m.mp = Math.min(st.mp, e.m.mp + (1.3 + st.mp * .006) * dt);
    if (e.flashT > 0) e.flashT -= dt; if (e.spin > 0) e.spin -= dt;
  }
  function progressAct(e, dt) {
    var a = e.act; a.t += dt;
    if (!a.fired && a.t >= a.wind) { a.fired = true; fireAct(e); }
    if (a.t >= a.dur) { e.act = null; }
  }
  function updatePlayer(dt) {
    var p = W.player; if (!p || W.mode !== 'field') return;
    var IN = DB.input;
    updateHeroTimers(p, dt);
    if (p.dead || p.m.hp <= 0) { W.play(p, 'defeat'); return; }
    if (p.hurtT > 0) { moveEnt(p, dt, 0, 0, 0); W.play(p, 'hurt'); return; }
    if (p.act) { progressAct(p, dt); moveEnt(p, dt, 0, 0, 0); p.at += dt * (p.atkRate - 1); return; }
    if (p.dashT > 0) { moveEnt(p, dt, p.dashDir[0], p.dashDir[1], 300); W.play(p, 'walk'); return; }
    var ax = IN.ax, ay = IN.ay, st = DB.stats(p.hero), sp = st.spd * SPEED_K;
    if (DB.G.speedBoost) sp *= 1.2;
    var moving = (ax * ax + ay * ay) > .01;
    if (moving) { p.dir = DB.dirOf(ax, ay); W.play(p, 'walk'); } else W.play(p, 'idle');
    moveEnt(p, dt, ax, ay, sp);
    if (moving) { p.stepT = (p.stepT || 0) + dt; if (p.stepT > .34) { p.stepT = 0; DB.audio.sfx('footstep_stone', { vol: .35, rate: .9 + Math.random() * .2 }); } }
    /* actions */
    if (IN.hit('a')) {
      var it = DB.nearestInteractable(); if (it && !C.inCombat()) { if (DB.interact(it)) return; }
      else if (it && it.type === 'npc' && !it.hostile) { if (DB.interact(it)) return; }
      if (!C.noCombat) C.act(p, 'basic');
    } else if (IN.down('a') && !C.noCombat && C.can(p, 'basic')) { C.act(p, 'basic'); }
    if (IN.hit('s1')) C.act(p, 's1'); if (IN.hit('s2')) C.act(p, 's2');
    if (IN.hit('burst')) { if (!C.doBurst(p)) { if (DB.G.fury && DB.G.fury.ready) DB.G.fury.go = true; } }
    if (IN.hit('b') && p.dashCd <= 0) {
      var dv = moving ? [ax, ay] : DB.dirVec[p.dir]; var m = Math.sqrt(dv[0] * dv[0] + dv[1] * dv[1]); p.dashDir = [dv[0] / m, dv[1] / m]; p.dashT = .17; p.dashCd = .55; p.inv = Math.max(p.inv, .26); DB.audio.sfx('dash'); W.fx('wind_spirit', p.x, p.y - 4, { scale: .25, alpha: .6 });
    }
    if (IN.hit('cancel') || IN.hit('swap')) { var al = W.party.filter(function (q) { return q !== p && q.m.hp > 0; }); if (al.length) C.switchTo(al[0].hero); }
  }
  /* ================= ally AI ================= */
  function updateAlly(e, dt, idx) {
    updateHeroTimers(e, dt);
    var L = W.player; if (!L) return;
    if (e.dead || e.m.hp <= 0) { W.play(e, 'defeat'); return; }
    if (e.hurtT > 0) { moveEnt(e, dt, 0, 0, 0); W.play(e, 'hurt'); return; }
    if (e.act) { progressAct(e, dt); moveEnt(e, dt, 0, 0, 0); e.at += dt * (e.atkRate - 1); return; }
    var H = DB.heroes[e.hero], st = DB.stats(e.hero), sp = st.spd * SPEED_K * .98;
    var foes = enemies(), tgt = nearest(foes, e.x, e.y, 230), ld = DB.dist(e.x, e.y, L.x, L.y), moveX = 0, moveY = 0;
    if (tgt && !C.noCombat && (ld < 320)) {
      var d = DB.dist(e.x, e.y, tgt.x, tgt.y), want = H.rangeAtk ? 120 : (DB.skills[e.hero].basic.range - 6);
      var ang = angTo(e, tgt);
      if (!H.rangeAtk) { if (d > want) { moveX = Math.cos(ang); moveY = Math.sin(ang); } }
      else { if (d > want + 20) { moveX = Math.cos(ang); moveY = Math.sin(ang); } else if (d < want - 40) { moveX = -Math.cos(ang); moveY = -Math.sin(ang); } }
      e.dir = dirFromAng(ang); e.aiT = (e.aiT || 0) - dt;
      if (e.aiT <= 0) {
        e.aiT = .12; var used = allySkill(e, tgt, foes, d); if (!used && d < (H.rangeAtk ? 230 : DB.skills[e.hero].basic.range + 10)) C.act(e, 'basic', { ang: ang, tgt: tgt });
      }
    } else {
      var idxOff = idx, tx, ty; var fv = DB.dirVec[L.dir]; tx = L.x - fv[0] * (22 + idxOff * 10) + (idxOff % 2 ? 14 : -14) * (fv[1] !== 0 ? 1 : 0); ty = L.y - fv[1] * (20 + idxOff * 6) + (idxOff % 2 ? 12 : -12) * (fv[0] !== 0 ? 1 : 0);
      var dx = tx - e.x, dy = ty - e.y, dd = Math.sqrt(dx * dx + dy * dy);
      if (dd > 14 || ld > 60) { moveX = dx / dd; moveY = dy / dd; var cat = dd > 120 ? 1.5 : 1; sp *= cat; }
      if (ld > 420) { e.x = L.x - 10; e.y = L.y + 6; W.snapToWalkable(e); }
    }
    var moving = moveX * moveX + moveY * moveY > .01;
    if (moving) { if (!tgt || H.rangeAtk === false || true) e.dir = (tgt && !e.act) ? e.dir : DB.dirOf(moveX, moveY); W.play(e, 'walk'); } else W.play(e, 'idle');
    moveEnt(e, dt, moveX, moveY, sp);
  }
  function allySkill(e, tgt, foes, d) {
    var id = e.hero, near = foes.filter(function (f) { return DB.dist(e.x, e.y, f.x, f.y) < 130; }).length, hurt = W.party.filter(function (p) { return p.m.hp > 0 && p.m.hp < DB.stats(p.hero).hp * .6 && DB.dist(e.x, e.y, p.x, p.y) < 150; }).length;
    var ang = angTo(e, tgt), ai = { ang: ang, tgt: tgt };
    switch (id) {
      case 'caelan': if (d < 50 && C.can(e, 's1')) return C.act(e, 's1', ai); if (near >= 2 && C.can(e, 's2') && e.m.hp < DB.stats(id).hp * .8) return C.act(e, 's2', ai); break;
      case 'liora': if (hurt >= 1 && C.can(e, 's1')) return C.act(e, 's1', ai); if (near >= 2 && C.can(e, 's2')) return C.act(e, 's2', ai); break;
      case 'vex': if (d > 50 && d < 120 && C.can(e, 's1')) return C.act(e, 's1', ai); if (d < 130 && C.can(e, 's2')) return C.act(e, 's2', ai); break;
      case 'rowan': if (d < 140 && C.can(e, 's1')) return C.act(e, 's1', ai); if (near >= 2 && C.can(e, 's2')) return C.act(e, 's2', ai); break;
      case 'brakka': if (!e.buffs.berserk && C.can(e, 's2') && d < 140) return C.act(e, 's2', ai); if (near >= 1 && d < 66 && C.can(e, 's1')) return C.act(e, 's1', ai); break;
      case 'seraphine': if (d < 200 && C.can(e, 's1')) return C.act(e, 's1', ai); if (near >= 2 && C.can(e, 's2')) return C.act(e, 's2', ai); break;
    }
    return false;
  }
  /* Ash the wolf */
  function updatePet(e, dt) {
    var L = W.player; if (!L) return; e.inv = 0; if (e.cd > 0) e.cd -= dt; if (e.hurtT > 0) e.hurtT -= dt;
    if (e.act) { e.act.t += dt; if (!e.act.fired && e.act.t > .13) { e.act.fired = true; var t = e.act.tgt; if (t && !t.dead && DB.dist(e.x, e.y, t.x, t.y) < 40) { var rowan = DB.G.members.rowan; var atk = rowan ? DB.stats('rowan').atk * .55 : 20; var dmg = Math.max(1, Math.round(atk * 100 / (100 + t.def) * RF())); t.hp -= dmg; t.flashT = .1; W.text(String(dmg), t.x, t.y - 30, '#e6f0ff'); DB.audio.sfx('hit'); t.aggroed = true; C.addMeter(1); if (t.hp <= 0) C.enemyDown(t, e); } } if (e.act.t > .4) e.act = null; return; }
    var foes = enemies(), tgt = nearest(foes, e.x, e.y, 220), mx = 0, my = 0, sp = 118;
    if (tgt && DB.dist(e.x, e.y, L.x, L.y) < 330 && !C.noCombat) { var d = DB.dist(e.x, e.y, tgt.x, tgt.y); var ang = angTo(e, tgt); if (d > 26) { mx = Math.cos(ang); my = Math.sin(ang); } else if (e.cd <= 0) { e.cd = 1.1; e.dir = dirFromAng(ang); e.act = { t: 0, tgt: tgt, fired: false }; W.play(e, 'attack', true); } }
    else { var dx = L.x - 24 - e.x, dy = L.y + 10 - e.y, dd = Math.sqrt(dx * dx + dy * dy); if (dd > 18) { mx = dx / dd; my = dy / dd; if (dd > 120) sp *= 1.6; } if (dd > 400) { e.x = L.x - 20; e.y = L.y + 8; W.snapToWalkable(e); } }
    if (mx || my) { e.dir = DB.dirOf(mx, my); W.play(e, 'walk'); } else W.play(e, 'idle');
    moveEnt(e, dt, mx, my, sp);
  }
  /* ================= enemy AI ================= */
  function pickTarget(e) {
    var as = alive(); if (!as.length) return null;
    var best = null, bd = 1e9;
    as.forEach(function (p) { var d = DB.dist(e.x, e.y, p.x, p.y); if (p.buffs && p.buffs.taunt > 0 && d < (p.tauntR || 160)) d -= 200; if (d < bd) { bd = d; best = p; } });
    return best;
  }
  function updateEnemy(e, dt) {
    if (e.dead) { e.deadT += dt; if (e.deadT > 1.4 && !e.boss) e.alpha = Math.max(0, 1 - (e.deadT - 1.4) * 1.6); if (e.deadT > 2.2 && !e.boss && !e.keep) W.remove(e); W.play(e, 'defeat'); return; }
    var d = e.def, ai = e.ai;
    if (e.boss) return updateBoss(e, dt);
    if (e.flashT > 0) e.flashT -= dt; if (e.stun > 0) e.stun -= dt; if (e.slow > 0) e.slow -= dt;
    if (e.burn > 0) { e.burn -= dt; e.burnT = (e.burnT || 0) + dt; if (e.burnT > .5) { e.burnT = 0; e.hp -= Math.max(1, Math.round(e.maxhp * .01 + 3)); W.text('•', e.x, e.y - 30, '#ff9a4a'); if (e.hp <= 0) C.enemyDown(e, null); } }
    var spd = (d.spd || 60) * (e.slow > 0 ? .5 : 1) * (C.freeze ? 0 : 1);
    var kdx = e.vx * dt, kdy = e.vy * dt; e.vx *= Math.pow(.02, dt); e.vy *= Math.pow(.02, dt); if (Math.abs(e.vx) < 4) e.vx = 0; if (Math.abs(e.vy) < 4) e.vy = 0; if (kdx || kdy) W.tryMove(e, kdx, kdy);
    if (e.stun > 0) { W.play(e, 'hurt'); return; }
    if (e.hurtT > 0) { e.hurtT -= dt; W.play(e, 'hurt'); if (e.hurtT <= 0) ai.st = 'chase'; return; }
    var tg = pickTarget(e); if (!tg) { W.play(e, 'idle'); return; }
    var dist = DB.dist(e.x, e.y, tg.x, tg.y);
    if (C.noCombat || C.freeze) { W.play(e, 'idle'); return; }
    switch (ai.st) {
      case 'idle':
        W.play(e, 'idle');
        if (dist < d.aggro || e.aggroed) { ai.st = 'chase'; e.aggroed = true; e.aggroT = 6; }
        break;
      case 'chase': {
        ai.cd -= dt; var ang = angTo(e, tg), range = d.atkRange;
        var want = (d.role === 'melee' || d.role === 'brute') ? range - 4 : range * .8;
        if (dist > want) { var mx = Math.cos(ang), my = Math.sin(ang); e.dir = DB.dirOf(mx, my); W.tryMove(e, mx * spd * dt, my * spd * dt); W.play(e, 'walk'); }
        else if (d.role === 'flyer' && dist < range * .5) { var bx = -Math.cos(ang), by = -Math.sin(ang); W.tryMove(e, bx * spd * dt, by * spd * dt); e.dir = dirFromAng(ang); W.play(e, 'walk'); }
        else { e.dir = dirFromAng(ang); W.play(e, 'idle'); }
        if (dist <= range && ai.cd <= 0) { ai.st = 'wind'; ai.t = 0; ai.tgt = tg; ai.aim = ang; }
        if (dist > d.aggro * 2.2 && !e.aggroT) { e.aggroed = false; ai.st = 'idle'; }
        e.aggroT = (e.aggroT || 0) - dt; if (e.aggroT < 0 && dist > d.aggro * 1.6) { e.aggroed = false; e.aggroT = 0; ai.st = 'idle'; }
        break;
      }
      case 'wind': {
        ai.t += dt; var tt = ai.tgt; if (tt && tt.m && tt.m.hp > 0) ai.aim = angTo(e, tt); e.dir = dirFromAng(ai.aim);
        var w = d.wind; if (ai.t > w - .14 && e.anim.indexOf('attack') !== 0) W.play(e, 'attack', true); else if (e.anim.indexOf('attack') !== 0) W.play(e, 'idle');
        if (ai.t >= w) { C.enemyStrike(e, ai.aim); ai.st = 'chase'; ai.cd = d.cd * (.85 + Math.random() * .4); }
        break;
      }
    }
    /* soft separation from other enemies */
    for (var i = 0; i < W.ents.length; i++) { var o = W.ents[i]; if (o !== e && o.type === 'enemy' && !o.dead) { var dx = e.x - o.x, dy = e.y - o.y, dd = Math.sqrt(dx * dx + dy * dy); if (dd > 0 && dd < 14) W.tryMove(e, dx / dd * 14 * dt * 2, dy / dd * 14 * dt * 2); } }
  }
  C.enemyStrike = function (e, ang) {
    var d = e.def;
    if (d.role === 'flyer' || d.proj) {
      var p = d.proj || { count: 1, spread: 0, spd: 200, pow: 1 }, n = p.count;
      for (var i = 0; i < n; i++) { var a = ang + (n > 1 ? (-p.spread / 2 + p.spread * i / (n - 1)) * D2R : 0); C.bolts.push({ x: e.x, y: e.y - 10, vx: Math.cos(a) * p.spd, vy: Math.sin(a) * p.spd, r: 5, pow: p.pow, src: e, team: 'e', life: 1.6, fx: 'shadow', hit: {}, t: 0, ang: a, color: '#ff9bd0', orb: true }); }
      DB.audio.sfx('cast', { gap: .1 }); return;
    }
    if (d.throws && Math.random() < .35) { var th = d.throws; C.bolts.push({ x: e.x, y: e.y - 10, vx: Math.cos(ang) * th.spd, vy: Math.sin(ang) * th.spd, r: 4, pow: th.pow, src: e, team: 'e', life: th.range / th.spd, hit: {}, t: 0, ang: ang, arrow: true }); DB.audio.sfx('arrow'); return; }
    /* melee arc */
    var reach = d.atkRange + 6, hit = 0;
    W.party.forEach(function (p) { if (p.m.hp > 0 && DB.dist(e.x, e.y, p.x, p.y) <= reach + 4 && (angDiff(angTo(e, p), ang) < 1.2)) { C.damage(e, p, 1, { kb: d.kb || 30 }); hit++; } });
    DB.audio.sfx(hit ? 'hit' : 'swing', { vol: .6 });
  };
  /* ================= bosses ================= */
  C.startBoss = function (key, o) {
    o = o || {}; var lv = o.lv || 10;
    var x = o.x || W.map.w / 2, y = o.y || 260, e = C.makeBoss(key, lv, x, y, o); e.fight = o; e.hpMulTune = 1;
    if (o.hpMul) { e.maxhp = Math.round(e.maxhp * o.hpMul); e.hp = e.maxhp; }
    W.add(e); C.boss = e; e.thr = (o.thresholds || []).slice().map(function (t) { return { at: t.at, scene: t.scene, done: false }; });
    e.ai.st = 'intro'; e.ai.t = .8; C.noMeter = !!o.noMeter;
    DB.audio.music(o.music || e.def.music || 'boss');
    DB.emit('bossStart', e);
    var sp = e.def.special; if (sp === 'tide') { e.tideT = 0; }
    if (sp === 'clones') { e.cloneT = 8; }
    if (sp === 'rear') { e.rearT = 6; }
    if (sp === 'fury') { DB.G.fury = { ready: false, go: false }; DB.G.rage = DB.G.rage || 0; }
    if (sp === 'unwinnable') { e.invuln = true; e.surviveT = o.surviveT || 60; }
    return e;
  };
  C.bossHit = function (e) {
    var f = e.hp / e.maxhp;
    (e.thr || []).forEach(function (t) { if (!t.done && f <= t.at) { t.done = true; C.pauseFor(function () { return typeof t.scene === 'function' ? DB.story.runFn(t.scene, e) : DB.story.run(t.scene, e); }); } });
    var ph = e.def.phases; for (var i = ph.length - 1; i >= 0; i--) { if (f <= ph[i].at && i > e.ai.phase) { e.ai.phase = i; e.ai.pat = 0; if (e.fight && e.fight.onPhase) e.fight.onPhase(i, e); W.text('Phase ' + (i + 1), e.x, e.y - 70, '#ffd86b', { big: true }); W.shakeCam(8); if (e.def.special === 'tide' && i === 1) { e.tideOn = true; e.tideT = 0; DB.toast('The tide is rising!'); } } }
  };
  C.pauseFor = function (fn) { C.freeze = true; Promise.resolve().then(fn).then(function () { C.freeze = false; }, function (er) { console.error(er); C.freeze = false; }); };
  C.bossDown = function (e) {
    C.boss = null; var o = e.fight || {};
    W.fxs.length = 0; C.zones.length = 0; C.bolts.length = 0; C.safe = null; DB.G.fury = null;
    C.noMeter = false;
    setTimeout(function () { C.pauseFor(function () { var r = o.onWin ? (typeof o.onWin === 'string' ? DB.story.run(o.onWin) : o.onWin(e)) : null; return Promise.resolve(r).then(function () { if (W.map && W.map.music) DB.audio.music(W.map.music); }); }); }, 1400);
  };
  function aimedAng(e, tg) { return angTo(e, tg); }
  var PAT = {};
  PAT.slam = function (e, tg, done) { var r = 62 * e.scale / 1.5 + 16; e.aimAng = aimedAng(e, tg); C.enemyZone(e, { x: e.x, y: e.y, r: r, dur: .95, pow: 1.5, kb: 90, fx: 'rage', fxs: r / 55, shake: 7, sfx: 'quake', follow: e }); playAtk(e); return .95 + .35; };
  PAT.smash = function (e, tg, done) { var ang = aimedAng(e, tg); e.dir = dirFromAng(ang); e.aimAng = ang; C.enemyZone(e, { x: e.x, y: e.y, shape: 'cone', ang: ang, arc: 1.9, r: 78 * e.scale / 1.3, dur: .7, pow: 1.4, kb: 80, fx: 'dawnmark_burst', fxs: .6, shake: 4, sfx: 'sword_hit' }); playAtk(e, .4); return .75 + .3; };
  PAT.fan = function (e, tg, done) { var ang = aimedAng(e, tg); e.dir = dirFromAng(ang); playAtk(e); setTimeout(function () { if (e.dead) return; for (var i = 0; i < 7; i++) { var a = ang + (-.6 + 1.2 * i / 6); C.bolts.push({ x: e.x, y: e.y - 14, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, r: 6, pow: .65, src: e, team: 'e', life: 2.4, fx: 'shadow', hit: {}, t: 0, ang: a, orb: true, color: '#ff8aa8' }); } DB.audio.sfx('cast'); }, 450); return 1.1; };
  PAT.ring = function (e, tg, done) { playAtk(e); setTimeout(function () { if (e.dead) return; for (var i = 0; i < 16; i++) { var a = i / 16 * 6.283 + (e.ringOff = (e.ringOff || 0) + .15); C.bolts.push({ x: e.x, y: e.y - 14, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, r: 6, pow: .55, src: e, team: 'e', life: 3, fx: 'shadow', hit: {}, t: 0, ang: a, orb: true, color: '#c58aff' }); } DB.audio.sfx('cast'); W.shakeCam(3); }, 500); return 1.3; };
  PAT.rain = function (e, tg, done) { playAtk(e, .5); var as = alive(), n = 5 + e.ai.phase * 2; for (var i = 0; i < n; i++) { (function (i) { setTimeout(function () { if (e.dead || C.freeze) return; var t = i === 0 ? tg : (as.length ? as[Math.floor(Math.random() * as.length)] : tg); var px = t.x + (i ? DB.rand(-70, 70) : 0), py = t.y + (i ? DB.rand(-50, 50) : 0); C.enemyZone(e, { x: px, y: py, r: 34, dur: .9, pow: 1.1, kb: 60, fx: e.def.special === 'tide' ? 'ice' : 'fire', fxs: .8, shake: 3, sfx: 'quake' }); }, i * 220); })(i); } return n * .22 + 1.2; };
  PAT.charge = function (e, tg, done) {
    var ang = aimedAng(e, tg); e.dir = dirFromAng(ang); e.aimAng = ang;
    C.enemyZone(e, { x: e.x, y: e.y, shape: 'line', ang: ang, len: 260, w: 40 * e.scale / 1.4, dur: .8, pow: 0, color: '255,90,40', follow: null });
    setTimeout(function () { if (e.dead) return; e.chargeT = .5; e.chargeAng = ang; DB.audio.sfx('roar'); }, 800); return 1.8;
  };
  PAT.dash = function (e, tg, done) {
    var ang = aimedAng(e, tg); e.dir = dirFromAng(ang); playAtk(e, .3);
    W.fx('shadow', e.x, e.y - 10, { scale: 1 });
    setTimeout(function () { if (e.dead) return; var nx = tg.x - Math.cos(ang) * 30, ny = tg.y - Math.sin(ang) * 30; if (W.canStand(nx, ny, 6)) { e.x = nx; e.y = ny; } W.fx('shadow', e.x, e.y - 10, { scale: 1 }); var a2 = angTo(e, tg); C.enemyZone(e, { x: e.x, y: e.y, shape: 'cone', ang: a2, arc: 2.2, r: 70, dur: .5, pow: 1.3, kb: 70, fx: 'shadow', fxs: .7, sfx: 'sword_hit' }); playAtk(e, .4); }, 450); return 1.5;
  };
  PAT.dive = function (e, tg, done) {
    e.alpha = .3; e.zlift = -30; var px = tg.x, py = tg.y;
    C.enemyZone(e, { x: px, y: py, r: 56, dur: 1.2, pow: 1.6, kb: 100, fx: 'rage', fxs: 1, shake: 7, sfx: 'quake', after: function () { e.alpha = 1; e.zlift = 0; } });
    setTimeout(function () { if (e.dead) return; e.x = px; e.y = py; e.alpha = 1; e.zlift = 0; }, 1150); return 2;
  };
  PAT.gust = function (e, tg, done) { playAtk(e); DB.audio.sfx('wind'); setTimeout(function () { if (e.dead) return; W.fx('wind_spirit', e.x, e.y, { scale: 2 }); W.party.forEach(function (p) { if (p.m.hp > 0 && DB.dist(e.x, e.y, p.x, p.y) < 190) { C.damage(e, p, .5, { kb: 160 }); } }); W.shakeCam(5); }, 600); return 1.3; };
  PAT.whip = function (e, tg, done) { var ang = aimedAng(e, tg); e.dir = dirFromAng(ang); C.enemyZone(e, { x: e.x, y: e.y, shape: 'line', ang: ang, len: 230, w: 26, dur: .65, pow: 1.3, kb: 80, fx: 'ice', fxs: .5, sfx: 'water_splash', shake: 3 }); playAtk(e, .4); return 1.1; };
  PAT.beamsweep = function (e, tg, done) {
    var a0 = aimedAng(e, tg), t = 0; playAtk(e, .5);
    var iv = setInterval(function () { if (e.dead || C.freeze) { if (e.dead) clearInterval(iv); return; } t += .1; var a = a0 + t * 1.1; C.enemyZone(e, { x: e.x, y: e.y, shape: 'line', ang: a, len: 330, w: 20, dur: .12, pow: .4, kb: 20, color: '255,100,255' }); if (t > 3) clearInterval(iv); }, 100); return 3.8;
  };
  function playAtk(e, hold) { W.play(e, 'attack', true); }
  C.summon = function (e, type, n) {
    DB.audio.sfx('roar'); for (var i = 0; i < n; i++) { var a = i / n * 6.28 + Math.random(), x = e.x + Math.cos(a) * 60, y = e.y + Math.sin(a) * 40; var s = C.makeEnemy(type, Math.max(1, e.lv - 1), x, y, {}); s.x = DB.clamp(x, 10, W.map.w - 10); s.y = DB.clamp(y, 10, W.map.h - 10); if (!W.fly && !s.fly) W.snapToWalkable(s); s.aggroed = true; s.ai.st = 'chase'; s.xp = Math.round(s.xp * .3); s.summoned = true; W.add(s); W.fx('shadow', s.x, s.y - 10, { scale: .8 }); }
  };
  function updateBoss(e, dt) {
    var d = e.def, ai = e.ai, ph = d.phases[ai.phase];
    if (e.flashT > 0) e.flashT -= dt; if (e.stun > 0) e.stun -= dt; if (C.freeze) { return; }
    var tg = pickTarget(e); if (!tg) { W.play(e, e.sheet4 ? 'idle' : 'idle'); return; }
    var dist = DB.dist(e.x, e.y, tg.x, tg.y);
    if (e.chargeT > 0) { e.chargeT -= dt; var cx = Math.cos(e.chargeAng) * 360 * dt, cy = Math.sin(e.chargeAng) * 360 * dt; if (!W.tryMove(e, cx, cy)) e.chargeT = 0; W.play(e, 'walk'); W.party.forEach(function (p) { if (p.m.hp > 0 && DB.dist(e.x, e.y, p.x, p.y) < e.r + 12 && !e.chargeHit) { e.chargeHit = true; C.damage(e, p, 1.7, { kb: 140 }); } }); if (e.chargeT <= 0) { e.chargeHit = false; } return; }
    /* special mechanics */
    var sp = d.special;
    if (sp === 'rear') { e.rearT -= dt; if (e.rearT <= 0 && !e.rearing) { e.rearing = true; e.rearExposed = true; e.rearEnd = 3.4; W.text('Strike the glowing gills!', e.x, e.y - 90, '#9ae0ff', { big: true }); DB.audio.sfx('roar'); ai.st = 'rear'; ai.t = 3.4; } if (e.rearing) { e.rearEnd -= dt; if (e.rearEnd <= 0) { e.rearing = false; e.rearExposed = false; e.rearT = 9; ai.st = 'idle'; ai.t = .8; } } }
    if (sp === 'tide' && e.tideOn) { e.tideT += dt; var rad = Math.max(130, 400 - e.tideT * 7); C.safe = { x: W.map.w / 2, y: W.map.h * .55, r: rad }; W.party.forEach(function (p) { if (p.m.hp > 0 && DB.dist(p.x, p.y, C.safe.x, C.safe.y) > rad) { p.tideT = (p.tideT || 0) + dt; if (p.tideT > .6) { p.tideT = 0; var dm = Math.round(DB.stats(p.hero).hp * .035); p.m.hp = Math.max(0, p.m.hp - dm); W.text(String(dm), p.x, p.y - 30, '#7ac0ff'); if (p.m.hp <= 0) C.heroDown(p); } } }); }
    if (sp === 'clones') { e.cloneT -= dt; if (e.cloneT <= 0 && !C.decoys().length) { e.cloneT = 16; C.spawnClones(e); } e.veilGhost = false; }
    if (sp === 'fury') { var G = DB.G; if (DB.party().indexOf('brakka') >= 0) { G.rage = Math.min(100, (G.rage || 0) + dt * 3.2); if (G.rage >= 100 && G.fury && !G.fury.ready) { G.fury.ready = true; DB.toast('STORMHEWN FURY ready! Press the Burst button.', 'gold'); DB.audio.sfx('quest_complete'); } if (G.fury && G.fury.go) { G.fury.go = false; G.fury.ready = false; G.rage = 0; C.stormhewnFury(e); } } }
    if (sp === 'unwinnable') { e.surviveT -= dt; if (e.surviveT <= 0 && !e.endedFight) { e.endedFight = true; C.pauseFor(function () { return DB.story.run(e.fight.onSurvive || 'act4_scattered'); }); } }
    if (sp === 'mirror') { e.mirT = (e.mirT || 0) + dt; }
    /* phase scripted timers */
    ai.t -= dt;
    if (ai.st === 'intro') { W.play(e, 'idle'); if (ai.t <= 0) { ai.st = 'idle'; ai.t = 1; } return; }
    if (ai.st === 'rear') { W.play(e, 'idle'); }
    if (ai.st === 'pat') { if (ai.t <= 0) { ai.st = 'idle'; ai.t = .6 + Math.random() * .4; } if (!e.chargeT && !(e.anim.indexOf('attack') === 0 && !e.animDone)) W.play(e, 'idle'); return; }
    if (e.noMove) { W.play(e, 'idle'); }
    else if (ai.st === 'idle') {
      /* approach to preferred range */
      var want = d.fly ? 110 : 70 + e.scale * 10, ang = angTo(e, tg), sp2 = (d.spd || 60) * (e.slow > 0 ? .5 : 1);
      e.dir = dirFromAng(ang);
      if (dist > want) { W.tryMove(e, Math.cos(ang) * sp2 * dt, Math.sin(ang) * sp2 * dt); W.play(e, 'walk'); } else W.play(e, 'idle');
    }
    if (ai.st === 'idle' && ai.t <= 0) {
      var pats = ph.pats; var pn = pats[ai.pat % pats.length]; ai.pat++;
      var parts = pn.split(':'), name = parts[0];
      if (name === 'summon') { C.summon(e, parts[1], +parts[2]); ai.st = 'pat'; ai.t = 1.4; playAtk(e); return; }
      var fn = PAT[name]; if (!fn) { ai.t = 1; return; }
      var dur = fn(e, tg); ai.st = 'pat'; ai.t = dur;
      if (sp === 'firstsix') e.sheen = 1;
    }
  }
  C.stormhewnFury = function (boss) {
    DB.audio.sfx('dawnmark_burst'); W.doFlash('#ffb36b', 700); W.shakeCam(14);
    DB.ultBanner && DB.ultBanner('STORMHEWN FURY', 'brakka');
    var b = W.party.filter(function (p) { return p.hero === 'brakka'; })[0];
    for (var i = 0; i < 5; i++) (function (i) { setTimeout(function () { W.fx(i % 2 ? 'lightning' : 'rage', boss.x + DB.rand(-30, 30), boss.y - 10, { scale: 1.8 }); W.shakeCam(8); if (!boss.dead) C.damage(b || W.player, boss, 0, { }); boss.hp -= Math.round(boss.maxhp * .045); W.text('FURY', boss.x, boss.y - 60, '#ffb36b', { big: true }); if (boss.hp <= 0 && !boss.dead) C.enemyDown(boss, b); else C.bossHit(boss); }, i * 220); })(i);
  };
  /* ---- Nyx clones ---- */
  C.decoys = function () { return W.ents.filter(function (x) { return x.decoy && !x.dead; }); };
  C.spawnClones = function (boss) {
    DB.audio.sfx('cast'); W.text('The Veil shifts...', boss.x, boss.y - 80, '#c8a0ff', { big: true });
    var pos = [[-90, 30], [90, 30], [0, -70]];
    pos.forEach(function (p) { var c = C.makeEnemy('veil', boss.lv - 2, DB.clamp(boss.x + p[0], 20, W.map.w - 20), boss.y + p[1], {}); c.sprite = boss.sprite; c.tint = '#b29ae8'; c.tintAmt = .25; c.scale = boss.scale; c.decoy = true; c.hp = c.maxhp = 40; c.keep = false; c.noStagger = true; c.def = Object.assign({}, c.def, { sprite: boss.sprite }); c.name = boss.name; c.xp = 0; c.gold = 0; if (!W.canStand(c.x, c.y, 6)) { c.x = boss.x; c.y = boss.y + 40; W.snapToWalkable(c); } c.aggroed = true; c.ai.st = 'chase'; W.add(c); W.fx('shadow', c.x, c.y - 10, { scale: .9 }); });
    boss.alpha = .85; setTimeout(function () { boss.alpha = 1; }, 5000);
    /* party clones (derived appearance: tinted hero sprites) */
    W.party.slice(0, 2).forEach(function (p) { var c = C.makeEnemy('veil', boss.lv - 3, boss.x + DB.rand(-60, 60), boss.y + 60, {}); c.sprite = p.sprite; c.tint = '#b29ae8'; c.tintAmt = .5; c.alpha = .85; c.name = 'Veil of ' + p.name; c.xp = 0; c.gold = 0; c.aggroed = true; c.ai.st = 'chase'; c.hp = c.maxhp = Math.round(c.maxhp * .7); c.def = Object.assign({}, c.def, { sprite: p.sprite }); W.snapToWalkable(c); W.add(c); });
  };
  C.decoyHit = function (c, src) { c.dead = true; c.deadT = 0; c.hp = 0; W.fx('shadow', c.x, c.y - 10, { scale: 1.2 }); DB.audio.sfx('miss'); W.text('Illusion!', c.x, c.y - 50, '#c8a0ff'); W.remove(c); };
  /* ================= main update ================= */
  C.inCombat = function () { for (var i = 0; i < W.ents.length; i++) { var e = W.ents[i]; if (e.type === 'enemy' && !e.dead && e.aggroed) return true; } return false; };
  C.update = function (dt) {
    if (!W.player) return;
    C.cdScale = 1;
    if (!C.freeze) {
      updatePlayer(dt);
      var idx = 0; for (var i = 0; i < W.party.length; i++) { var p = W.party[i]; if (p !== W.player) { idx++; updateAlly(p, dt, idx); } }
      if (W.ash) updatePet(W.ash, dt);
    } else { W.party.forEach(function (p) { updateHeroTimers(p, 0); }); }
    for (var j = 0; j < W.ents.length; j++) { var e = W.ents[j]; if (e.type === 'enemy') updateEnemy(e, dt); }
    for (var k = 0; k < W.party.length; k++) { var hp = W.party[k]; if (hp.act && hp.act.t < 0) { } }
    if (!C.freeze) { updateBolts(dt); updateZones(dt); updateTraps(dt); }
    for (var s = C.swings.length - 1; s >= 0; s--) { C.swings[s].t += dt; if (C.swings[s].t > .22) C.swings.splice(s, 1); }
    /* animate hero heroes' sprites for tint/forms */
    W.party.forEach(function (p) { var spr = DB.heroSprite(p.hero); if (p.sprite !== spr) { p.sprite = spr; DB.assets.loadChars([spr]); } });
    /* calm: revive fallen allies when the fight is over */
    if (!C.inCombat() && !C.boss) { C.calm += dt; if (C.calm > 2.5) { W.party.forEach(function (p) { if (p.m.hp <= 0 && alive().length) C.revive(p, .3); }); } } else C.calm = 0;
    if (!C.noMeter && !C.inCombat()) { /* meter decays slowly outside combat */ DB.G.meter = Math.max(0, (DB.G.meter || 0) - dt * .5); }
    /* anim time scaling for attacks */
    /* party facing during idle on walk keep */
  };
  /* ================= drawing ================= */
  C.draw = function (ctx) {
    var i;
    /* telegraph zones */
    for (i = 0; i < C.zones.length; i++) {
      var z = C.zones[i], f = Math.min(1, z.t / z.dur), col = z.color || '255,60,60';
      ctx.save(); ctx.translate(z.x, z.y);
      ctx.fillStyle = 'rgba(' + col + ',' + (.14 + f * .25) + ')'; ctx.strokeStyle = 'rgba(' + col + ',' + (.5 + f * .4) + ')'; ctx.lineWidth = 1.5;
      if (z.shape === 'cone') { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, z.r, z.ang - z.arc / 2, z.ang + z.arc / 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(' + col + ',' + (.25 + f * .3) + ')'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, z.r * f, z.ang - z.arc / 2, z.ang + z.arc / 2); ctx.closePath(); ctx.fill(); }
      else if (z.shape === 'line') { ctx.rotate(z.ang); ctx.fillRect(0, -z.w / 2, z.len, z.w); ctx.strokeRect(0, -z.w / 2, z.len, z.w); ctx.fillStyle = 'rgba(' + col + ',' + (.25 + f * .3) + ')'; ctx.fillRect(0, -z.w / 2, z.len * f, z.w); }
      else { ctx.beginPath(); ctx.ellipse(0, 0, z.r, z.r * .72, 0, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(' + col + ',' + (.2 + f * .3) + ')'; ctx.beginPath(); ctx.ellipse(0, 0, z.r * f, z.r * f * .72, 0, 0, 6.283); ctx.fill(); }
      ctx.restore();
    }
    /* traps */
    for (i = 0; i < C.traps.length; i++) { var t = C.traps[i]; ctx.save(); ctx.translate(t.x, t.y); ctx.strokeStyle = 'rgba(150,255,170,.8)'; ctx.fillStyle = 'rgba(80,200,120,.25)'; ctx.beginPath(); ctx.ellipse(0, 0, t.r * .6, t.r * .42, 0, 0, 6.28); ctx.fill(); ctx.stroke(); ctx.restore(); }
    /* swings */
    for (i = 0; i < C.swings.length; i++) { var s = C.swings[i], k = s.t / .22; ctx.save(); ctx.translate(s.x, s.y); ctx.globalAlpha = (1 - k) * .9; ctx.strokeStyle = s.color; ctx.lineWidth = 3 + (1 - k) * 4; ctx.lineCap = 'round'; ctx.beginPath(); var a0 = s.ang - s.arc / 2, a1 = s.ang + s.arc / 2, aa = a0 + (a1 - a0) * Math.min(1, k * 1.8); ctx.arc(0, 0, s.range * (.7 + k * .3), a0, aa); ctx.stroke(); ctx.restore(); }
    /* projectiles */
    for (i = 0; i < C.bolts.length; i++) {
      var b = C.bolts[i];
      if (b.line) { ctx.save(); ctx.globalAlpha = 1 - b.t / b.life; ctx.strokeStyle = b.color; ctx.lineWidth = 3; ctx.shadowColor = '#9fd8ff'; ctx.shadowBlur = 8; ctx.beginPath(); var mx = (b.x + b.x2) / 2 + DB.rand(-6, 6), my = (b.y + b.y2) / 2 + DB.rand(-6, 6); ctx.moveTo(b.x, b.y); ctx.lineTo(mx, my); ctx.lineTo(b.x2, b.y2); ctx.stroke(); ctx.restore(); continue; }
      ctx.save(); ctx.translate(b.x, b.y - 8);
      if (b.arrow) { ctx.rotate(b.ang); ctx.strokeStyle = '#e8d8b0'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(7, 0); ctx.stroke(); ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(3, -2.5); ctx.lineTo(3, 2.5); ctx.fill(); ctx.strokeStyle = '#a0522d'; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-12, -2); ctx.moveTo(-9, 0); ctx.lineTo(-12, 2); ctx.stroke(); }
      else { var col = b.color || ({ fire: '#ff9a3a', ice: '#9fe0ff', lightning: '#e6f0ff', healing: '#fff0b0', shadow: '#d0a0ff' }[b.fx] || '#fff0b0'); var gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 9 + (b.r || 4)); gr.addColorStop(0, '#fff'); gr.addColorStop(.35, col); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 9 + (b.r || 4), 0, 6.28); ctx.fill(); }
      ctx.restore();
    }
    /* safe-zone ring (rising tide) */
    if (C.safe) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W.map.w, W.map.h); ctx.arc(C.safe.x, C.safe.y, C.safe.r, 0, 6.283, true); ctx.clip('evenodd'); ctx.fillStyle = 'rgba(30,110,200,.38)'; ctx.fillRect(0, 0, W.map.w, W.map.h); ctx.restore(); ctx.strokeStyle = 'rgba(160,220,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(C.safe.x, C.safe.y, C.safe.r, 0, 6.283); ctx.stroke(); }
    /* enemy hp bars + shield + status + decoy shadows */
    for (i = 0; i < W.ents.length; i++) {
      var e = W.ents[i];
      if (e.type === 'enemy' && !e.dead && !e.boss && e.hp < e.maxhp) { var w = 26, hh = 3, bx = e.x - w / 2, by = e.y - e.scale * 44; ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(bx - 1, by - 1, w + 2, hh + 2); ctx.fillStyle = '#e0524e'; ctx.fillRect(bx, by, w * Math.max(0, e.hp / e.maxhp), hh); }
      if (e.type === 'enemy' && e.stun > 0 && !e.dead) { ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'center'; ctx.fillText('✦', e.x, e.y - e.scale * 46); }
      if (e.type === 'enemy' && e.boss && e.rearExposed) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5 + .3 * Math.sin(W.time * 12); ctx.fillStyle = '#7affff'; ctx.beginPath(); ctx.arc(e.x, e.y - 30 * e.scale, 14, 0, 6.28); ctx.fill(); ctx.restore(); }
      if ((e.type === 'player' || e.type === 'ally') && e.shield > 0 && e.m.hp > 0) { ctx.save(); ctx.globalAlpha = .45; ctx.strokeStyle = '#9ae0ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y - 14, 15, 20, 0, 0, 6.28); ctx.stroke(); ctx.restore(); }
      if (e.type === 'player' && !e.dead) { ctx.save(); ctx.translate(e.x, e.y + 3); ctx.strokeStyle = 'rgba(255,230,140,.85)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(0, 0, 12, 4.6, 0, 0, 6.28); ctx.stroke(); ctx.restore(); }
      if (e.buffs && e.buffs.guard > 0) { ctx.save(); ctx.globalAlpha = .35; ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y - 14, 17, 22, 0, 0, 6.28); ctx.stroke(); ctx.restore(); }
    }
    /* interact hint */
    if (W.mode === 'field' && W.player && !C.freeze) { var it = DB.nearestInteractable(); if (it && !(C.inCombat() && it.type === 'prop' && it.kind !== 'chest')) { ctx.save(); ctx.translate(it.x, it.y - (it.type === 'prop' ? 40 : 56)); ctx.fillStyle = 'rgba(15,28,48,.85)'; ctx.strokeStyle = '#dcba73'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 6.28); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f4ead5'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center'; ctx.fillText('A', 0, 3.5); ctx.restore(); } }
  };
})();
