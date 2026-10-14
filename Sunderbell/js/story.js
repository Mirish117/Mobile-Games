/* Sunderbell - story runner: executes the scene scripts written in the editor. */
(function () {
  'use strict';
  var SB = window.SB, W = SB.W, T = 16;
  var ST = SB.Story = { queue: Promise.resolve(), running: 0, parsed: {} };

  ST.parse = function (id) {
    var sc = SB.D.scenes[id]; if (!sc) return null;
    var c = ST.parsed[id]; if (c && c.src === sc.script) return c;
    c = SB.parseScript(sc.script); c.src = sc.script; ST.parsed[id] = c; return c;
  };
  ST.who = function (w) { if (w === 'leader') { var L = SB.Party.leader(); return L ? L.id : 'pell'; } return w; };
  ST.ent = function (who) {
    who = ST.who(who);
    var h = SB.Party.members.filter(function (m) { return m.id === who; })[0]; if (h) return h;
    var e = W.findEnt(who); if (e) return e;
    for (var i = 0; i < W.ents.length; i++) if (W.ents[i].type === 'npc' && W.ents[i].def.who === who && W.ents[i].visible) return W.ents[i];
    return null;
  };
  ST.itemName = function (it) { var d = SB.D.items[it]; return d ? d.name : it; };
  ST.give = function (it, n, quiet) {
    var G = SB.G; n = n == null ? 1 : n;
    if (it === 'key') { G.keys = (G.keys || 0) + n; SB.audio.sfx('key'); }
    else if (it === 'heart_vessel') { G.maxHp = Math.min((SB.D.meta.maxHearts || 8) * 2, G.maxHp + 2 * n); G.hp = G.maxHp; SB.audio.sfx('item'); }
    else if (it === 'chimes') { G.chimes += n; SB.audio.sfx('chime'); if (quiet) SB.UI.toast('You found ' + n + ' chimes!'); }
    else if (it === 'heart') { SB.Party.heal(2 * n); }
    else { G.items[it] = (G.items[it] || 0) + n; SB.audio.sfx('item'); if (!quiet) SB.UI.toast('Received: ' + ST.itemName(it)); }
    SB.UI.refreshHud(true);
  };

  /* run a scene; scenes queue so they never overlap */
  ST.run = function (id, srcEnt) {
    if (!SB.D.scenes[id]) { console.warn('missing scene', id); return Promise.resolve(); }
    ST.running++; W.cutscene++;
    var p = ST.queue.then(function () { return exec(id, srcEnt); }).catch(function (e) { console.error(e); }).then(function () {
      ST.running--; W.cutscene = Math.max(0, W.cutscene - 1); SB.UI.endScene();
    });
    ST.queue = p; return p;
  };

  function exec(id, srcEnt) {
    var sc = ST.parse(id); if (!sc) return Promise.resolve();
    var cmds = sc.cmds, pc = 0, G = SB.G;
    SB.UI.beginScene();
    function step() {
      if (pc >= cmds.length) return Promise.resolve();
      var c = cmds[pc++], a = c.args || [];
      var r = run(c, a);
      if (r === 'END') return Promise.resolve();
      return Promise.resolve(r).then(function (jump) { if (typeof jump === 'string' && jump !== 'END') { if (jump in sc.labels) pc = sc.labels[jump]; } if (jump === 'END') return; return step(); });
    }
    function run(c, a) {
      switch (c.c) {
        case 'say': return SB.UI.say(c.who ? ST.who(c.who) : null, c.text);
        case 'choice': return SB.UI.choice(c.options.map(function (o) { return o.text; })).then(function (i) { return c.options[i].label; });
        case 'goto': return c.label;
        case 'if': return G.flags[c.flag] ? c.label : null;
        case 'ifnot': return !G.flags[c.flag] ? c.label : null;
        case 'set': G.flags[a[0]] = 1; if (/^party_|^split$|^unsplit$/.test(a[0])) { SB.Party.sync(); SB.UI.refreshHud(true); } return;
        case 'unset': delete G.flags[a[0]]; return;
        case 'give': ST.give(a[0], a[1] ? +a[1] : 1); return SB.sleep(250);
        case 'take': if (a[0] === 'key') G.keys = Math.max(0, G.keys - (+a[1] || 1)); else if (a[0] === 'chimes') G.chimes = Math.max(0, G.chimes - (+a[1] || 1)); else G.items[a[0]] = Math.max(0, (G.items[a[0]] || 0) - (+a[1] || 1)); SB.UI.refreshHud(true); return;
        case 'heal': G.hp = G.maxHp; SB.UI.refreshHud(true); return;
        case 'music': W.musicLock = a[0] !== 'none' ? a[0] : null; SB.audio.music(a[0]); if (a[0] === 'none') W.musicLock = 'none'; return;
        case 'sfx': SB.audio.sfx(a[0]); return;
        case 'voice': SB.audio.voice(ST.who(a[0]), a[1] || 'huh'); return;
        case 'wait': return SB.sleep((+a[0] || .5) * 1000);
        case 'fade': return W.doFade(a[0] === 'in' ? 'in' : 'out', a[1], a[2] ? +a[2] * 1000 : 600);
        case 'flash': return W.doFlash(a[0] || '#fff', 500);
        case 'shake': W.shake = Math.max(W.shake, +a[0] || .5); return;
        case 'tint': if (a[0] === 'off' || !a[0]) W.tint = null; else W.tint = { color: a[0], a: +a[1] || .3 }; return;
        case 'warp': if (W.musicLock !== 'none') W.musicLock = null; W.load(a[0], +a[1], +a[2], a[3] || 'down'); SB.Main.arrived = W.time; SB.UI.refreshHud(true); return SB.sleep(50);
        case 'move': {
          var e = ST.ent(a[0]); if (!e) return; var tx = +a[1] * T + 8, ty = +a[2] * T + 14;
          return new Promise(function (res) { e.walkTo = { x: tx, y: ty, res: res }; if (e.kind === 'hero') walkHero(e, tx, ty, res); });
        }
        case 'face': { var f = ST.ent(a[0]); if (!f) return; var tgt = SB.dirVec[a[1]] ? null : ST.ent(a[1]); f.dir = tgt ? SB.dirOf(tgt.x - f.x, tgt.y - f.y) : a[1]; return; }
        case 'emote': { var em = ST.ent(a[0]); if (em) SB.FX.emote(em, a.slice(1).join(' ') || '!'); return SB.sleep(700); }
        case 'hide': G.flags['__vis.' + W.mapId + '.' + a[0]] = 0; return;
        case 'show': G.flags['__vis.' + W.mapId + '.' + a[0]] = 1; return;
        case 'lead': { var i = SB.Party.members.map(function (m) { return m.id; }).indexOf(a[0]); if (i >= 0) SB.Party.setLeader(i); return; }
        case 'banner': { var parts = c.rest.split('|'); return SB.UI.banner(parts[0].trim(), (parts[1] || '').trim()); }
        case 'quest': G.quest = c.rest; SB.UI.refreshHud(true); SB.UI.toast('New goal: ' + c.rest, 'quest'); return;
        case 'journal': G.journal.push({ text: c.rest, map: W.map ? W.map.name : '' }); return;
        case 'save': SB.Main.save(); return;
        case 'end': return 'END';
        case 'credits': return SB.UI.credits();
      }
    }
    return step().then(function () { if (W.musicLock && !SB.G.flags.boss_active && W.musicLock !== 'keep') { W.musicLock = null; } });
  }
  function walkHero(h, tx, ty, res) {
    var iv = setInterval(function () { var dx = tx - h.x, dy = ty - h.y, d = Math.sqrt(dx * dx + dy * dy); if (d < 1.5) { clearInterval(iv); h.anim = 'idle'; h.walkTo = null; res(); return; } var s = Math.min(d, 1.1); h.x += dx / d * s; h.y += dy / d * s; h.dir = SB.dirOf(dx, dy); h.anim = 'walk'; }, 16);
  }
})();
