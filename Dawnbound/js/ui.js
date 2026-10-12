/* Dawnbound - UI: HUD, dialogue, choices, toasts, banners, cards */
(function () {
  'use strict';
  var DB = window.DB, W = DB.world, A = DB.assets, $ = DB.$;
  var UI = DB.ui = { dlgActive: false, choiceActive: false, menuOpen: false };

  /* ---------------- portraits ---------------- */
  function bgHero(hero, expr, size) {
    var id = hero + '_expressions', c = A.atlas.chars[id]; if (!c) return '';
    var f = c.expr[expr] || c.expr.neutral || [0, 0], k = size / c.w;
    return 'background-image:url(assets/chars/' + id + '.webp);background-size:' + (c.w * c.c * k) + 'px ' + (c.h * c.r * k) + 'px;background-position:-' + (f[0] * c.w * k) + 'px -' + (f[1] * c.h * k) + 'px;background-repeat:no-repeat;';
  }
  /* head-and-shoulders crop of an NPC / boss sheet */
  function bgNpc(sprite, size, col, row) {
    var c = A.atlas.chars[sprite]; if (!c) return '';
    var vb = (c.vb && (c.vb.down_0 || c.vb.idle_0 || c.vb.neutral)) || [c.w * .3, c.h * .15, c.w * .4, c.h * .75];
    var s = Math.max(vb[3] * .62, vb[2] * 1.25), cx = vb[0] + vb[2] / 2, sx = cx - s / 2, sy = vb[1] - s * .06, k = size / s;
    col = col || 0; row = row || 0;
    return 'background-image:url(assets/chars/' + sprite + '.webp);background-size:' + (c.w * c.c * k) + 'px ' + (c.h * c.r * k) + 'px;background-position:-' + ((col * c.w + sx) * k) + 'px -' + ((row * c.h + sy) * k) + 'px;background-repeat:no-repeat;';
  }
  UI.bgHero = bgHero; UI.bgNpc = bgNpc;
  /* speaker registry: key -> { name, npc?:sprite, hero?:id } */
  DB.speakers = {
    marisol: { name: 'Captain Marisol', npc: 'marisol' }, pip: { name: 'Pip', npc: 'pip' }, maren: { name: 'Elder Maren', npc: 'elder_maren' }, odell: { name: 'Mayor Odell', npc: 'odell' },
    bram: { name: 'Bram', npc: 'bram' }, hettie: { name: 'Hettie', npc: 'hettie' }, fenn: { name: 'Sailor Fenn', npc: 'fenn' }, bessa: { name: 'Cook Bessa', npc: 'bessa' }, ivo: { name: 'Lookout Ivo', npc: 'ivo' },
    garrick: { name: 'Garrick', npc: 'garrick' }, anwen: { name: 'Sister Anwen', npc: 'anwen' }, brannoch: { name: 'Elder Brannoch', npc: 'brannoch' }, grell: { name: 'Mother Grell', npc: 'mother_grell' },
    hald: { name: 'Jarl Hald', npc: 'hald' }, sigrun: { name: 'Sigrun', npc: 'sigrun' }, thessaly: { name: 'Archmagister Thessaly', npc: 'thessaly' }, corwin: { name: 'Corwin Ashgrave', npc: 'corwin' },
    ilsabet: { name: 'Queen Ilsabet', npc: 'ilsabet' }, tomas: { name: 'Tomas', npc: 'tomas' }, tam: { name: 'Tam', npc: 'tam' }, squire: { name: 'Squire', npc: 'squire' }, scholar: { name: 'Scholar', npc: 'scholar' },
    vashka: { name: 'Vashka', npc: 'vashka' }, nyx: { name: 'Lady Nyx', npc: 'lady_nyx' }, gorran: { name: 'Gorran', npc: 'gorran' }, edran: { name: 'Sir Edran', npc: 'edran_fallen' },
    vaelthorn: { name: 'Vaelthorn', npc: 'vaelthorn_armored' }, stag: { name: 'The Old Stag', npc: 'old_stag' }, rowans_father: { name: "Rowan's Father", npc: 'rowans_father' }, farmer_father: { name: 'Father', npc: 'farmer_father' }, farmer_mother: { name: 'Mother', npc: 'farmer_mother' },
    ghost: { name: 'Ghost Sailor', npc: 'ghost_sailor' }, witch: { name: 'Marsh Witch', npc: 'marsh_witch' }, guard: { name: 'Guard', npc: 'guard' }, refugee: { name: 'Refugee', npc: 'refugee' }, orphan: { name: 'Orphan', npc: 'orphan' },
    clan: { name: 'Clan Warrior', npc: 'clan_warrior' }, thug: { name: 'Guild Thug', npc: 'guild_thug' }, wolf: { name: 'Ember', npc: 'ember_wolf' }, varric: { name: 'Lord Varric', npc: 'guard' }, voice: { name: '???' }, ghost_maren: { name: 'Ghost of Maren', npc: 'elder_maren', tint: '#9fd0ff' },
    sailor: { name: 'Sailor', npc: 'fenn' }, woodcarver: { name: 'Old Woodcarver', npc: 'scholar' }, bandit: { name: 'Bandit', npc: 'guild_thug' }, fisher: { name: 'Fisherman', npc: 'garrick' }
  };
  function heroDisplayName(id) { return DB.G && DB.G.hero === id && DB.G.heroName ? DB.G.heroName.split(' ')[0].toUpperCase() : DB.heroes[id].short.toUpperCase(); }
  /* resolve a speaker key to { name, style, hero } */
  UI.speaker = function (who, expr) {
    if (who == null) return { name: '', style: '' };
    if (who === 'HERO') who = DB.G.hero;
    if (DB.heroes[who]) return { name: heroDisplayName(who), style: bgHero(who, expr || 'neutral', 96), hero: who };
    var sp = DB.speakers[who];
    if (sp) { return { name: sp.name, style: sp.npc ? bgNpc(sp.npc, 96) : '' }; }
    if (A.atlas && A.atlas.chars[who]) { var cc = A.atlas.chars[who]; return { name: cc.name || who, style: bgNpc(who, 96) }; }
    return { name: String(who), style: '' };
  };
  /* ---------------- dialogue ---------------- */
  var dlg, dtext, dname, dport, typing = null, curResolve = null, fullText = '', typedAll = true;
  UI.init = function () {
    dlg = $('#dlg'); dtext = $('.dtext', dlg); dname = $('.dname', dlg); dport = $('.dportrait', dlg);
    dlg.addEventListener('touchstart', function (e) { e.preventDefault(); e.stopPropagation(); UI.advance(); }, { passive: false });
    dlg.addEventListener('mousedown', function (e) { UI.advance(); });
    DB.input.listen(function (n) { if (n === 'a' && UI.dlgActive) UI.advance(); if (UI.choiceActive) UI.choiceKey(n); });
    UI.partyEls = {};
    DB.on('toast', function () { });
  };
  function htmlText(t) {
    return DB.esc(t).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }
  UI.say = function (who, text, opts) {
    opts = opts || {};
    return new Promise(function (res) {
      var sp = UI.speaker(who, typeof opts === 'string' ? opts : opts.expr);
      dlg.classList.remove('hidden'); dlg.classList.toggle('narr', who == null && !opts.name); dlg.classList.toggle('noportrait', !sp.style);
      dname.textContent = opts.name || sp.name; dport.setAttribute('style', sp.style);
      fullText = text; typedAll = false; UI.dlgActive = true; curResolve = res;
      var i = 0, html = htmlText(text), plain = text.replace(/\*/g, '');
      dtext.innerHTML = ''; dlg.querySelector('.dnext').style.visibility = 'hidden';
      /* typewriter by characters of the rendered HTML (tags preserved) */
      var toks = html.match(/<[^>]+>|&[a-z#0-9]+;|[\s\S]/g) || [], out = '', openTag = '';
      var idx = 0; clearInterval(typing);
      typing = setInterval(function () {
        for (var k = 0; k < 2 && idx < toks.length; k++) { out += toks[idx++]; }
        var closes = ''; var opened = (out.match(/<em>/g) || []).length - (out.match(/<\/em>/g) || []).length; if (opened > 0) closes = '</em>';
        dtext.innerHTML = out + closes;
        if (idx >= toks.length) { clearInterval(typing); typedAll = true; dlg.querySelector('.dnext').style.visibility = 'visible'; if (opts.auto) setTimeout(UI.advance, opts.auto); }
      }, 16);
      UI._html = html;
    });
  };
  UI.advance = function () {
    if (!UI.dlgActive) return;
    if (!typedAll) { clearInterval(typing); dtext.innerHTML = UI._html; typedAll = true; dlg.querySelector('.dnext').style.visibility = 'visible'; return; }
    var r = curResolve; curResolve = null; UI.dlgActive = false; dlg.classList.add('hidden'); DB.input.lock(160); DB.audio.sfx('ui_confirm', { vol: .25 }); if (r) r();
  };
  UI.hideDialogue = function () { dlg.classList.add('hidden'); UI.dlgActive = false; };
  DB.say = function (who, text, o) { if (DB.story && DB.story.running) return UI.say(who, text, o); return DB.story.runFn(function (S) { return S.say(who, text, o); }); };
  /* ---------------- choices ---------------- */
  var chosen = null, chSel = 0, chCount = 0;
  UI.choice = function (prompt, opts) {
    return new Promise(function (res) {
      var box = $('#choices'); box.innerHTML = ''; box.classList.remove('hidden');
      if (prompt) { var p = DB.el('div', 'cp'); p.textContent = prompt; box.appendChild(p); }
      chCount = opts.length; chSel = 0;
      opts.forEach(function (o, i) {
        var b = DB.el('button', 'cbtn'); b.textContent = typeof o === 'string' ? o : o.t; if (i === 0) b.classList.add('sel');
        function pick(e) { e.preventDefault(); e.stopPropagation(); box.classList.add('hidden'); UI.choiceActive = false; DB.input.lock(200); DB.audio.sfx('ui_confirm'); res(i); }
        b.addEventListener('click', pick); b.addEventListener('touchend', function (e) { pick(e); }, { passive: false });
        box.appendChild(b);
      });
      UI.choiceActive = true; UI._choiceRes = function (i) { box.classList.add('hidden'); UI.choiceActive = false; DB.input.lock(200); DB.audio.sfx('ui_confirm'); res(i); };
    });
  };
  UI.choiceKey = function (n) {
    var btns = $('#choices').querySelectorAll('.cbtn');
    if (n === 'up' || n === 'down') { chSel = (chSel + (n === 'down' ? 1 : -1) + chCount) % chCount; btns.forEach(function (b, i) { b.classList.toggle('sel', i === chSel); }); }
    else if (n === 'a') UI._choiceRes(chSel);
  };
  /* ---------------- toasts & banners ---------------- */
  DB.toast = function (msg, kind) {
    var host = $('#toasts'); if (!host) return;
    var t = DB.el('div', 'toast ' + (kind || '')); t.textContent = msg; host.appendChild(t);
    while (host.children.length > 4) host.removeChild(host.firstChild);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3000);
  };
  UI.banner = function (title, sub) {
    var b = $('#banner'); b.innerHTML = '<div class="t">' + DB.esc(title) + '</div>' + (sub ? '<div class="s">' + DB.esc(sub) + '</div>' : ''); b.classList.remove('hidden');
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    return DB.sleep(2600).then(function () { b.classList.add('hidden'); });
  };
  DB.ultBanner = function (name, hero) {
    var b = $('#ultbanner'); b.innerHTML = '<div class="ubi"><div class="dportrait" style="width:64px;height:64px;margin:0;' + bgHero(hero, 'determined', 64) + '"></div><div class="un">' + DB.esc(name) + '</div></div>'; b.classList.remove('hidden');
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; setTimeout(function () { b.classList.add('hidden'); }, 1300);
  };
  /* full-screen black card with big text; resolves after ms */
  UI.card = function (html, ms, keepOn) {
    var c = $('#card'); c.innerHTML = html; c.classList.remove('hidden'); void c.offsetWidth; c.classList.add('on');
    return DB.sleep(ms || 2600).then(function () { if (!keepOn) { c.classList.remove('on'); return DB.sleep(800).then(function () { c.classList.add('hidden'); }); } });
  };
  UI.cardOff = function () { var c = $('#card'); c.classList.remove('on'); return DB.sleep(800).then(function () { c.classList.add('hidden'); }); };
  UI.hint = function (txt) { var h = $('#hintline'); if (!txt) { h.classList.add('hidden'); return; } h.textContent = txt; h.classList.remove('hidden'); };
  /* ---------------- screens ---------------- */
  UI.screen = function (node, solid) { var s = $('#screen'); s.innerHTML = ''; if (node) s.appendChild(node); s.classList.toggle('solid', !!solid); s.classList.remove('hidden'); };
  UI.closeScreen = function () { var s = $('#screen'); s.classList.add('hidden'); s.innerHTML = ''; };
  /* ---------------- HUD ---------------- */
  var partySig = '', lastTrack = 0, hudOn = false;
  UI.hud = function (on) { hudOn = on; $('#hud').classList.toggle('hidden', !on); $('#pad').classList.toggle('hidden', !on); };
  function buildParty() {
    var host = $('#party'); var meter = $('#meter'); host.innerHTML = '';
    W.party.forEach(function (p, i) {
      var d = DB.el('div', 'pm' + (i === 0 ? ' lead' : '')); d.innerHTML = '<div class="pt" style="' + bgHero(p.hero, 'neutral', i === 0 ? 42 : 34) + '"></div><div class="pi"><div class="pn"><span></span><b></b></div><div class="bar hp"><i></i></div><div class="bar mp"><i></i></div></div>';
      host.appendChild(d); p._hud = d;
      d.addEventListener('touchstart', function (e) { if (i > 0) { e.preventDefault(); e.stopPropagation(); DB.combat.switchTo(p.hero); } }, { passive: false });
      d.style.pointerEvents = i > 0 ? 'auto' : 'none';
    });
    host.appendChild(meter);
  }
  UI.updateHud = function (dt) {
    if (!hudOn || !W.player) return;
    var G = DB.G, C = DB.combat;
    var sig = W.party.map(function (p) { return p.hero; }).join(',') + '|' + W.party.map(function (p) { return DB.heroSprite(p.hero); }).join(',');
    if (sig !== partySig) { partySig = sig; buildParty(); UI.skillLabels(); }
    W.party.forEach(function (p, i) {
      var d = p._hud; if (!d) return; var st = DB.stats(p.hero), m = p.m;
      var hp = DB.clamp(m.hp / st.hp, 0, 1), mp = DB.clamp(m.mp / st.mp, 0, 1);
      d.querySelector('.hp i').style.width = (hp * 100) + '%'; d.querySelector('.mp i').style.width = (mp * 100) + '%';
      d.querySelector('.hp').classList.toggle('low', hp < .3 && hp > 0);
      d.querySelector('.pn span').textContent = DB.heroName(p.hero); d.querySelector('.pn b').textContent = 'Lv ' + m.lv; d.classList.toggle('down', m.hp <= 0);
    });
    var meter = $('#meter'); meter.classList.toggle('show', !C.noMeter && !(G.flags && G.flags.noMeter)); $('#meterfill').style.width = DB.clamp(G.meter || 0, 0, 100) + '%'; meter.classList.toggle('full', (G.meter || 0) >= 100);
    if (G.rage != null && C.boss && C.boss.def.special === 'fury' && DB.party().indexOf('brakka') >= 0) { meter.classList.add('show'); $('#meterfill').style.width = DB.clamp(G.rage, 0, 100) + '%'; meter.querySelector('span').textContent = G.fury && G.fury.ready ? 'STORMHEWN FURY!' : 'RAGE'; meter.classList.toggle('full', G.fury && G.fury.ready); }
    else meter.querySelector('span').textContent = 'BURST';
    var bb = $('#burstbtn') || document.querySelector('.ab.burst'); bb.classList.toggle('ready', (G.meter || 0) >= 100 || (G.fury && G.fury.ready));
    /* skill buttons */
    var p = W.player;
    ['s1', 's2'].forEach(function (k) {
      var b = document.querySelector('.ab.' + k), sk = DB.skills[p.hero][k]; if (!sk) return;
      var cd = p.cds[k] || 0, f = sk.cd ? DB.clamp(cd / sk.cd, 0, 1) : 0; b.querySelector('.cd').style.height = (f * 100) + '%'; b.classList.toggle('nomp', !!(sk.mp && p.m.mp < sk.mp));
    });
    $('#gold').textContent = DB.fmt(G.gold) + ' G';
    var bar = $('#bossbar');
    if (C.boss && !C.boss.dead && C.boss.maxhp) {
      bar.classList.remove('hidden'); var e = C.boss; bar.querySelector('.bn').textContent = e.invuln ? e.name + ' — SURVIVE ' + Math.max(0, Math.ceil(e.surviveT)) + 's' : e.name;
      bar.querySelector('i').style.width = (e.invuln ? 100 : DB.clamp(e.hp / e.maxhp, 0, 1) * 100) + '%';
    } else bar.classList.add('hidden');
    lastTrack -= dt; if (lastTrack <= 0) { lastTrack = .6; var tr = DB.quests && DB.quests.tracker ? DB.quests.tracker() : ''; $('#tracker').innerHTML = tr; }
  };
  UI.skillLabels = function () {
    if (!W.player) return; var h = W.player.hero;
    ['s1', 's2'].forEach(function (k) { var b = document.querySelector('.ab.' + k), sk = DB.skills[h][k]; b.querySelector('b').textContent = k === 's1' ? '❖' : '✧'; b.querySelector('small').textContent = sk.name.length > 11 ? sk.name.split(' ').pop() : sk.name; });
  };
  DB.on('leader', function () { partySig = ''; });
  UI.invalidateParty = function () { partySig = ''; };

  /* ---------------- game over ---------------- */
  DB.gameOver = function () {
    var C = DB.combat; C.gameOverPending = false; if (W.mode === 'title') return;
    W.mode = 'scene'; W.doFade(1, 900, '#000'); UI.hud(false); DB.audio.music('sad', 1);
    setTimeout(function () {
      var w = DB.el('div', 'win'); w.style.maxWidth = '420px';
      w.innerHTML = '<div class="wh">The embers dim…</div><div class="wb" style="text-align:center"><p class="dim">Your party has fallen. But a flame that is hidden is not a flame that is gone.</p><div class="menucol" style="margin:12px auto"></div></div>';
      var col = w.querySelector('.menucol');
      function b(t, f) { var x = DB.el('button', 'btn'); x.textContent = t; x.onclick = f; col.appendChild(x); }
      b('Try Again', function () { UI.closeScreen(); DB.retry(); });
      b('Load Game', function () { DB.menus.loadScreen(function () { UI.closeScreen(); }); });
      b('Title Screen', function () { UI.closeScreen(); DB.menus.title(); });
      UI.screen(w);
    }, 1200);
  };
})();
