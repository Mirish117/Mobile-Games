/* Sunderbell - UI: HUD, dialogue with voices, choices, banners, toasts, menus, title, game over, credits. */
(function () {
  'use strict';
  var SB = window.SB, W = SB.W;
  var $ = function (s) { return document.querySelector(s); };
  var UI = SB.UI = { modal: false, dialog: null, textSpeed: 1 };
  try { UI.textSpeed = +localStorage.getItem('sunderbell.textSpeed') || 1; } catch (e) { }

  function spriteCanvas(id, f, scale, variant, box) {
    var im = SB.gfx.frame(id, f || 0, variant); var c = document.createElement('canvas');
    if (!im) { c.width = c.height = 1; return c; }
    var s = scale || 3; if (box) s = Math.max(1, Math.floor(Math.min(box / im.width, box / im.height)));
    c.width = im.width * s; c.height = im.height * s; var x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(im, 0, 0, c.width, c.height); c.className = 'px'; return c;
  }
  UI.spriteCanvas = spriteCanvas;
  function charPortrait(who, box) {
    var ch = SB.D.characters[who] || {}, base = ch.sprite || who, id = SB.gfx.has(base + '_down') ? base + '_down' : base;
    var im = SB.gfx.frame(id, 0, ch.ghost ? 'ghost' : ''); if (!im || im.height <= 20) return spriteCanvas(id, 0, 3, ch.ghost ? 'ghost' : '', box || 48);
    /* head-and-shoulders crop of the standing sprite */
    var top = 0; var cx0 = im.getContext('2d').getImageData(0, 0, im.width, im.height).data; for (var y = 0; y < im.height && !top; y++) for (var x = 0; x < im.width; x++) if (cx0[(y * im.width + x) * 4 + 3]) { top = y; break; }
    var hgt = Math.min(im.height - top, 17), s = Math.max(1, Math.floor((box || 48) / Math.max(im.width, hgt)));
    var c = document.createElement('canvas'); c.width = im.width * s; c.height = hgt * s; var x2 = c.getContext('2d'); x2.imageSmoothingEnabled = false; x2.drawImage(im, 0, top, im.width, hgt, 0, 0, c.width, c.height); c.className = 'px'; return c;
  }
  UI.charPortrait = charPortrait;

  /* ---------------- HUD ---------------- */
  var last = {};
  UI.refreshHud = function (force) {
    var G = SB.G; if (!G) return;
    var key = [G.hp, G.maxHp, G.chimes, G.keys, G.leader, SB.Party.hold, SB.Party.members.length, G.quest, Math.floor(G.meter || 0)].join('|');
    if (!force && key === last.key) return; last.key = key;
    var h = ''; for (var i = 0; i < G.maxHp / 2; i++) { var v = G.hp - i * 2; h += '<i class="h ' + (v >= 2 ? 'f' : v === 1 ? 'half' : 'e') + '"></i>'; }
    $('#hearts').innerHTML = h;
    $('#wallet').innerHTML = '<span class="chime"></span>' + G.chimes + (G.keys ? ' &nbsp;<span class="key"></span>' + G.keys : '');
    var pt = $('#party');
    if (force || last.party !== SB.Party.members.map(function (m) { return m.id; }).join() + G.leader + SB.Party.hold) {
      last.party = SB.Party.members.map(function (m) { return m.id; }).join() + G.leader + SB.Party.hold;
      pt.innerHTML = '';
      SB.Party.members.forEach(function (m, i) {
        var b = document.createElement('button'); b.className = 'pp' + (m.id === G.leader ? ' on' : ''); b.title = m.def.name;
        b.appendChild(charPortrait(m.id, 28)); var n = document.createElement('small'); n.textContent = m.def.name; b.appendChild(n);
        var go = function (e) { e.preventDefault(); e.stopPropagation(); SB.input.pressed['hero' + (i + 1)] = true; };
        b.addEventListener('touchstart', go, { passive: false }); b.addEventListener('mousedown', go);
        pt.appendChild(b);
      });
      var L = SB.Party.leader();
      if (L) { var ab = $('#btnA .ic'); ab.innerHTML = ''; ab.appendChild(spriteCanvas(L.def.icon, 0, 3)); $('#btnA small').textContent = L.def.toolName; }
      $('#btnHold b').textContent = SB.Party.hold ? '⚑' : '⚐'; $('#btnHold small').textContent = SB.Party.hold ? 'Follow' : 'Hold';
      $('#btnHold').classList.toggle('lit', SB.Party.hold);
      var solo = SB.Party.members.length < 2; ['#btnSwap', '#btnHold', '#btnTeam'].forEach(function (s) { $(s).classList.toggle('dim', solo); });
    }
    $('#quest').textContent = G.quest || ''; $('#quest').classList.toggle('hidden', !G.quest);
    var m = Math.floor(G.meter || 0); $('#meterfill').style.height = m + '%'; $('#btnTeam').classList.toggle('ready', m >= 100);
    document.body.classList.toggle('lowhp', G.hp <= 2 && G.hp > 0);
  };
  UI.bossBar = function (name, frac) {
    var b = $('#bossbar'); if (!name) { b.classList.add('hidden'); return; }
    b.classList.remove('hidden'); b.querySelector('.bn').textContent = name; b.querySelector('i').style.width = (frac * 100) + '%';
  };
  UI.toast = function (msg, kind) {
    var t = document.createElement('div'); t.className = 'toast' + (kind ? ' ' + kind : ''); t.textContent = msg; $('#toasts').appendChild(t);
    while ($('#toasts').children.length > 3) $('#toasts').removeChild($('#toasts').firstChild);
    setTimeout(function () { t.classList.add('out'); }, 2800); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3300);
  };
  UI.beginScene = function () { document.body.classList.add('scene'); };
  UI.endScene = function () { if (!SB.Story.running) document.body.classList.remove('scene'); };

  /* ---------------- dialogue ---------------- */
  UI.say = function (who, text) {
    return new Promise(function (resolve) {
      var D = SB.D, ch = who ? (D.characters[who] || { name: who }) : null, box = $('#dlg');
      box.classList.remove('hidden'); box.classList.toggle('narr', !who);
      var pp = box.querySelector('.dportrait'); pp.innerHTML = '';
      if (ch && ch.portrait !== false) { pp.appendChild(charPortrait(who, 54)); pp.classList.remove('hidden'); }
      else if (ch && ch.portrait === false) { pp.appendChild(spriteCanvas(ch.sprite, 0, 1, '', 54)); pp.classList.remove('hidden'); }
      else pp.classList.add('hidden');
      var nm = box.querySelector('.dname'); nm.textContent = ch ? ch.name : ''; nm.style.color = ch ? ch.color || '#fff' : '';
      var tx = box.querySelector('.dtext'), nx = box.querySelector('.dnext'); tx.textContent = ''; nx.classList.add('hidden');
      var e = SB.Story.ent && who ? SB.Story.ent(who) : null; if (e && e.kind !== 'hero' && SB.Party.leader()) { var L = SB.Party.leader(); if (e.type === 'npc' && e.def.dir !== 'up') e.dir = SB.dirOf(L.x - e.x, L.y - e.y); }
      var i = 0, done = false, cps = [35, 55, 110, 9999][UI.textSpeed] || 55, acc = 0, voiceId = ch ? (ch.voice || who) : 'narrator';
      if (who && (/!$/.test(text) || text === text.toUpperCase() && text.length > 4)) SB.audio.voice(voiceId, 'huh');
      UI.dialog = {
        advance: function () {
          if (!done) { i = text.length; tx.textContent = text; done = true; nx.classList.remove('hidden'); return; }
          UI.dialog = null; box.classList.add('hidden'); SB.audio.sfx('text'); resolve();
        }
      };
      var lastT = performance.now();
      (function type(now) {
        if (done || !UI.dialog) return;
        acc += (now - lastT) / 1000 * cps; lastT = now;
        while (acc >= 1 && i < text.length) {
          acc -= 1; var c = text[i++]; tx.textContent = text.slice(0, i);
          var tk = (D.voices[voiceId] && D.voices[voiceId].talk) || {};
          if (/[a-z0-9]/i.test(c) && i % (tk.every || 2) === 0) SB.audio.blip(voiceId, c);
          if (/[.!?,]/.test(c)) acc -= c === ',' ? 2 : 4;
        }
        if (i >= text.length) { done = true; nx.classList.remove('hidden'); return; }
        requestAnimationFrame(type);
      })(lastT);
    });
  };
  UI.choice = function (opts) {
    return new Promise(function (resolve) {
      var c = $('#choices'); c.innerHTML = ''; c.classList.remove('hidden'); UI.choosing = true;
      opts.forEach(function (o, i) { var b = document.createElement('button'); b.textContent = o; b.onclick = function () { SB.audio.sfx('menu'); c.classList.add('hidden'); UI.choosing = false; resolve(i); }; c.appendChild(b); });
    });
  };
  UI.banner = function (t, s) {
    return new Promise(function (res) {
      var b = $('#banner'); b.innerHTML = '<div class="bt">' + SB.esc(t) + '</div>' + (s ? '<div class="bs">' + SB.esc(s) + '</div>' : '');
      b.classList.remove('hidden', 'out'); void b.offsetWidth; b.classList.add('in');
      setTimeout(function () { b.classList.add('out'); }, 2300); setTimeout(function () { b.classList.add('hidden'); b.classList.remove('in', 'out'); res(); }, 2900);
    });
  };

  /* ---------------- screens ---------------- */
  function screen(html, cls) { var s = $('#screen'); s.className = cls || ''; s.innerHTML = html; s.classList.remove('hidden'); UI.modal = true; return s; }
  UI.closeScreen = function () { $('#screen').classList.add('hidden'); $('#screen').innerHTML = ''; UI.modal = false; };

  UI.title = function () {
    var hasSave = SB.Main.hasSave(false), draft = SB.draft.get();
    var s = screen('<div class="title"><canvas id="tbell"></canvas><h1>SUNDERBELL</h1><h2>THE FOUR TONES</h2><div class="menu">' +
      (hasSave ? '<button id="tContinue">Continue</button>' : '') + '<button id="tNew">New Game</button>' +
      (draft ? '<button id="tDraft" class="alt">Play with editor changes</button>' : '') +
      '<button id="tSettings" class="alt">Settings</button><a class="btn alt" href="editor.html">Open Editor</a></div><div class="foot">Landscape is best. Tap or press any key for sound.</div></div>', 'titlebg');
    var tb = s.querySelector('#tbell'), tt = 0; tb.width = 96; tb.height = 96;
    (function anim() { if (!s.querySelector('#tbell')) return; tt += .016; var x = tb.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, 96, 96); x.save(); x.translate(48, 10); x.rotate(Math.sin(tt * 1.4) * .12); var im = SB.gfx.frame('bell', 0); if (im) x.drawImage(im, -40, 0, 80, 80); x.restore(); requestAnimationFrame(anim); })();
    SB.audio.music('title');
    var go = function (fn) { return function () { SB.audio.unlock(); SB.audio.sfx('menu'); fn(); }; };
    if (hasSave) s.querySelector('#tContinue').onclick = go(function () { UI.closeScreen(); SB.Main.continueGame(); });
    s.querySelector('#tNew').onclick = go(function () {
      if (hasSave && !confirm('Start a new game? Your saved progress on this device will be replaced.')) return;
      UI.closeScreen(); SB.Main.newGame();
    });
    if (draft) s.querySelector('#tDraft').onclick = go(function () { location.href = 'index.html?draft=1'; });
    s.querySelector('#tSettings').onclick = go(function () { UI.settings(UI.title); });
  };
  UI.settings = function (back) {
    var A = SB.audio, s = screen('<div class="panel"><h3>Settings</h3>' +
      ['music', 'sfx', 'voice'].map(function (k) { return '<label>' + { music: 'Music', sfx: 'Sound effects', voice: 'Voices' }[k] + '<input type="range" min="0" max="1" step=".05" data-v="' + k + '" value="' + A.vol[k] + '"></label>'; }).join('') +
      '<label>Text speed<select id="tspeed"><option value="0">Slow</option><option value="1">Normal</option><option value="2">Fast</option><option value="3">Instant</option></select></label>' +
      '<p class="hint">Controls: drag the left side of the screen to move. <b>A</b> talks, opens and uses the leader\'s tool. <b>⇄ Swap</b> changes leader (or tap a face at the top). <b>Hold</b> makes the others wait where they stand. <b>✦ Team</b> fires a combined strike when the gauge is full and everyone is close. Keyboard: arrows/WASD, Z=A, X=Swap, C=Hold, V=Team, Esc=Menu, 1-4 pick a hero.</p>' +
      '<div class="row"><button id="sBack">Back</button></div></div>');
    s.querySelectorAll('input[data-v]').forEach(function (r) { r.oninput = function () { A.setVol(r.getAttribute('data-v'), +r.value); if (r.getAttribute('data-v') === 'voice') A.voice('pell', 'attack'); if (r.getAttribute('data-v') === 'sfx') A.sfx('chime'); }; });
    var sel = s.querySelector('#tspeed'); sel.value = String(UI.textSpeed); sel.onchange = function () { UI.textSpeed = +sel.value; try { localStorage.setItem('sunderbell.textSpeed', sel.value); } catch (e) { } };
    s.querySelector('#sBack').onclick = function () { SB.audio.sfx('cancel'); (back || UI.menu)(); };
  };
  UI.menu = function () {
    if (W.cutscene) return; SB.audio.sfx('menu');
    var G = SB.G;
    var party = SB.Party.members.map(function (m) { return '<div class="hero"><div class="hp" data-p="' + m.id + '"></div><div><b>' + SB.esc(m.def.name) + '</b> <small>' + SB.esc(m.def.toolName) + '</small><p>' + SB.esc(m.def.desc) + '</p></div></div>'; }).join('');
    var tones = ['wood', 'deep', 'stone', 'silence'].map(function (t) { return '<span class="tone ' + (G.flags['tone_' + t] ? 'got' : '') + '" data-t="tone_' + t + '"></span>'; }).join('');
    var journal = G.journal.slice().reverse().map(function (j) { return '<li><small>' + SB.esc(j.map) + '</small>' + SB.esc(j.text) + '</li>'; }).join('') || '<li>Nothing yet.</li>';
    var s = screen('<div class="panel wide"><div class="tabs"><button data-tab="p" class="on">Party</button><button data-tab="j">Journal</button><button data-tab="o">Options</button></div>' +
      '<div class="tab" data-tab="p"><div class="goal"><b>Goal:</b> ' + SB.esc(G.quest || '-') + '</div><div class="tones">Tones: ' + tones + '</div>' + party +
      '<div class="stats">Hearts ' + (G.maxHp / 2) + ' &middot; Chimes ' + G.chimes + ' &middot; Keys ' + (G.keys || 0) + (G.items.fork ? ' &middot; Tuning fork' : '') + '</div></div>' +
      '<div class="tab hidden" data-tab="j"><ul class="journal">' + journal + '</ul></div>' +
      '<div class="tab hidden" data-tab="o"><div class="col"><button id="mSave">Save game</button><button id="mSettings">Settings &amp; controls</button><button id="mTitle">Save &amp; return to title</button><a class="btn" href="editor.html">Open editor</a></div></div>' +
      '<div class="row"><button id="mClose" class="big">Resume</button></div></div>');
    s.querySelectorAll('.hp').forEach(function (h) { h.appendChild(charPortrait(h.getAttribute('data-p'), 48)); });
    s.querySelectorAll('.tone').forEach(function (t) { t.appendChild(spriteCanvas(t.getAttribute('data-t'), 0, 1, G.flags[t.getAttribute('data-t')] ? '' : 'shadow', 24)); });
    s.querySelectorAll('.tabs button').forEach(function (b) { b.onclick = function () { SB.audio.sfx('menu'); s.querySelectorAll('.tabs button').forEach(function (x) { x.classList.toggle('on', x === b); }); s.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('hidden', t.getAttribute('data-tab') !== b.getAttribute('data-tab')); }); }; });
    s.querySelector('#mClose').onclick = function () { SB.audio.sfx('cancel'); UI.closeScreen(); };
    s.querySelector('#mSave').onclick = function () { SB.Main.save(); UI.toast('Game saved.'); };
    s.querySelector('#mSettings').onclick = function () { UI.settings(UI.menu); };
    s.querySelector('#mTitle').onclick = function () { SB.Main.save(); UI.closeScreen(); SB.Main.toTitle(); };
  };
  UI.gameOver = function () {
    var s = screen('<div class="panel center"><h3>The fog closes in...</h3><p>...but somewhere, faintly, a bell remembers you.</p><div class="row"><button id="goRetry" class="big">Try again</button><button id="goTitle">Title</button></div></div>', 'over');
    s.querySelector('#goRetry').onclick = function () { UI.closeScreen(); SB.Main.continueGame(true); };
    s.querySelector('#goTitle').onclick = function () { UI.closeScreen(); SB.Main.toTitle(); };
  };
  UI.credits = function () {
    return new Promise(function (res) {
      var lines = (SB.D.meta.credits || []).map(function (l) { return '<div>' + (SB.esc(l) || '&nbsp;') + '</div>'; }).join('');
      var s = screen('<div class="credits"><div class="roll">' + lines + '</div><button id="crDone" class="alt">Continue</button></div>', 'creditsbg');
      s.querySelector('#crDone').onclick = function () { UI.closeScreen(); res(); };
    });
  };
})();
