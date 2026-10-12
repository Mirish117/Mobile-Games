/* Dawnbound - mini-games: timing, mash, rhythm, memory, hold-QTE. All return Promises. */
(function () {
  'use strict';
  var DB = window.DB, UI = DB.ui, $ = DB.$, el = DB.el;
  var MG = DB.mini = DB.mini || {};
  var layer = null;
  function open(title, hint) {
    layer = el('div', 'win'); layer.style.maxWidth = '640px'; layer.style.zIndex = 60;
    layer.innerHTML = '<div class="wh"><span>' + DB.esc(title) + '</span><span class="dim" style="font-size:11px;letter-spacing:.05em;text-transform:none">' + DB.esc(hint || '') + '</span></div><div class="wb" style="text-align:center;touch-action:none"></div>';
    UI.screen(layer); UI.hud(false); return $('.wb', layer);
  }
  function close() { UI.closeScreen(); layer = null; }
  function bigBtn(txt) { var b = el('button', 'btn'); b.style.cssText = 'font-size:22px;padding:16px 40px;margin-top:12px;min-width:200px;touch-action:none'; b.innerHTML = txt; return b; }
  function pressable(b, fn) { b.addEventListener('touchstart', function (e) { e.preventDefault(); fn(); }, { passive: false }); b.addEventListener('mousedown', function (e) { fn(); }); }
  function onKey(fn) { var off = DB.input.listen(function (n) { if (n === 'a') fn(); }); return off; }
  function intro(body, lines) { return new Promise(function (res) { body.innerHTML = '<p style="font-size:15px;line-height:1.5">' + lines + '</p>'; var b = bigBtn('Start'); b.onclick = function () { res(); }; body.appendChild(b); }); }

  /* ---- timing: stop a moving marker inside the zone. opts {title, rounds, speed, zone, hint, label} -> {hits, rounds, perfect} ---- */
  MG.timing = function (o) {
    o = o || {}; if (DB.testMode) return Promise.resolve({ hits: o.rounds || 5, rounds: o.rounds || 5, perfect: o.rounds || 5 }); var rounds = o.rounds || 5, hits = 0, perfect = 0;
    var body = open(o.title || 'Timing', o.hint || 'Tap when the marker is in the gold zone');
    return intro(body, o.intro || 'Stop the marker inside the glowing zone.').then(function () {
      return new Promise(function (res) {
        var r = 0, pos = 0, dir = 1, zoneC = .5, zoneW = o.zone || .2, speed = o.speed || 1.1, active = false, raf, last = 0, off;
        body.innerHTML = '<div class="dim" id="mt-r"></div><div id="mt-bar" style="position:relative;height:36px;margin:18px 10px;background:#0b1424;border:2px solid #3d557c;border-radius:10px;overflow:hidden"><div id="mt-z" style="position:absolute;top:0;bottom:0;background:linear-gradient(#ffe08a88,#dcba7366);border-left:2px solid #ffd98a;border-right:2px solid #ffd98a"></div><div id="mt-m" style="position:absolute;top:2px;bottom:2px;width:8px;background:#fff;border-radius:4px;box-shadow:0 0 10px #fff"></div></div><div id="mt-msg" style="min-height:26px;font-size:17px" class="gold"></div>';
        var btn = bigBtn(o.label || 'TAP!'); body.appendChild(btn);
        function setup() { zoneC = .2 + Math.random() * .6; var z = $('#mt-z', body); z.style.left = ((zoneC - zoneW / 2) * 100) + '%'; z.style.width = (zoneW * 100) + '%'; pos = Math.random() < .5 ? 0 : 1; dir = pos ? -1 : 1; active = true; $('#mt-r', body).textContent = 'Round ' + (r + 1) + ' / ' + rounds; $('#mt-msg', body).textContent = ''; }
        function tap() {
          if (!active) return; active = false; var d = Math.abs(pos - zoneC), msg;
          if (d <= zoneW / 2) { hits++; if (d < zoneW * .15) { perfect++; msg = 'PERFECT!'; } else msg = 'Hit!'; DB.audio.sfx('ui_confirm'); } else { msg = 'Missed…'; DB.audio.sfx('miss'); }
          $('#mt-msg', body).textContent = msg; r++;
          setTimeout(function () { if (r >= rounds) { cancelAnimationFrame(raf); off(); close(); res({ hits: hits, rounds: rounds, perfect: perfect }); } else { speed *= 1.08; setup(); } }, 650);
        }
        pressable(btn, tap); off = onKey(tap);
        function loop(now) { raf = requestAnimationFrame(loop); var dt = Math.min(.05, (now - last) / 1000); last = now; if (!active) return; pos += dir * speed * dt; if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; } var m = $('#mt-m', body); if (m) m.style.left = 'calc(' + (pos * 100) + '% - 4px)'; }
        setup(); raf = requestAnimationFrame(function (t) { last = t; loop(t); });
      });
    });
  };
  /* ---- mash: tap as fast as you can. opts {seconds, goal, rival (taps/sec)} -> {count, won} ---- */
  MG.mash = function (o) {
    if (DB.testMode) return Promise.resolve({ count: 99, won: true });
    o = o || {}; var secs = o.seconds || 8, goal = o.goal || 40, rivalRate = o.rival || 0;
    var body = open(o.title || 'Contest', 'Tap the button as fast as you can!');
    return intro(body, o.intro || 'Tap as fast as you can!').then(function () {
      return new Promise(function (res) {
        var n = 0, rv = 0, t0 = performance.now(), raf, done = false, off;
        body.innerHTML = '<div id="ms-t" class="gold" style="font-size:22px"></div><div style="margin:10px 6px;height:20px;background:#0b1424;border:2px solid #3d557c;border-radius:10px;overflow:hidden"><i id="ms-b" style="display:block;height:100%;width:0;background:linear-gradient(90deg,#c88a2a,#ffe08a)"></i></div>' + (rivalRate ? '<div style="margin:4px 6px;height:12px;background:#0b1424;border:2px solid #6a3b3b;border-radius:8px;overflow:hidden"><i id="ms-r" style="display:block;height:100%;width:0;background:#c64"></i></div><div class="dim" style="font-size:11px">Rival</div>' : '');
        var btn = bigBtn(o.label || 'TAP!'); btn.style.fontSize = '34px'; btn.style.padding = '30px 60px'; body.appendChild(btn);
        function tap() { if (done) return; n++; DB.audio.sfx('select', { vol: .3, gap: .03 }); }
        pressable(btn, tap); off = onKey(tap);
        function loop(now) { if (done) return; var el2 = (now - t0) / 1000, left = Math.max(0, secs - el2); rv = rivalRate * el2; $('#ms-t', body).textContent = left.toFixed(1) + 's'; $('#ms-b', body).style.width = Math.min(100, n / goal * 100) + '%'; if (rivalRate) $('#ms-r', body).style.width = Math.min(100, rv / goal * 100) + '%'; if (left <= 0 || n >= goal) { done = true; off(); var won = n >= goal || (rivalRate && n > rv); setTimeout(function () { close(); res({ count: n, won: !!(rivalRate ? (n >= goal && n >= rv) || n > rv : n >= goal) }); }, 400); return; } raf = requestAnimationFrame(loop); }
        raf = requestAnimationFrame(loop);
      });
    });
  };
  /* ---- rhythm: 3 lanes, notes fall. opts {notes:n, bpm} -> {hit, total} ---- */
  MG.rhythm = function (o) {
    if (DB.testMode) return Promise.resolve({ hit: o && o.notes || 20, total: o && o.notes || 20 });
    o = o || {}; var total = o.notes || 20, bpm = o.bpm || 110;
    var body = open(o.title || 'Dance', 'Tap the lane when a heart reaches the line');
    return intro(body, o.intro || 'Tap the matching lane as the hearts reach the golden line. Keys: A / S / D.').then(function () {
      return new Promise(function (res) {
        body.innerHTML = '<div id="rh" style="position:relative;height:250px;margin:0 auto;width:min(86vw,360px);background:#0b1424;border:2px solid #3d557c;border-radius:10px;overflow:hidden"></div><div id="rh-s" class="gold" style="margin:6px"></div><div id="rh-b" style="display:flex;gap:8px;justify-content:center"></div>';
        var field = $('#rh', body), beat = 60 / bpm, notes = [], t0 = performance.now() + 1500, hit = 0, miss = 0, done = false, raf, W3 = 3;
        for (var i = 0; i < total; i++) notes.push({ lane: Math.floor(Math.random() * W3), t: 1.5 + i * beat * (Math.random() < .3 ? 1 : 1.5), done: false, el: null });
        for (var l = 0; l < W3; l++) { var ln = el('div'); ln.style.cssText = 'position:absolute;top:0;bottom:0;width:33.3%;left:' + (l * 33.3) + '%;border-right:1px solid #1d2c47'; field.appendChild(ln); }
        var line = el('div'); line.style.cssText = 'position:absolute;left:0;right:0;top:200px;height:4px;background:#ffd98a;box-shadow:0 0 12px #ffd98a'; field.appendChild(line);
        var HEARTS = ['♥', '♥', '♥']; var cols = ['#ff7b8f', '#8fd0ff', '#ffe08a'];
        notes.forEach(function (n) { var e = el('div'); e.textContent = '♥'; e.style.cssText = 'position:absolute;width:33.3%;left:' + (n.lane * 33.3) + '%;text-align:center;font-size:30px;color:' + cols[n.lane] + ';display:none;text-shadow:0 0 8px ' + cols[n.lane]; field.appendChild(e); n.el = e; });
        var bt = $('#rh-b', body);
        function press(l) {
          if (done) return; var now = (performance.now() - t0) / 1000 + 1.5, best = null, bd = .22;
          notes.forEach(function (n) { if (!n.done && n.lane === l) { var d = Math.abs(n.t + 1.0 - now); if (d < bd) { bd = d; best = n; } } });
          if (best) { best.done = true; best.el.style.display = 'none'; hit++; DB.audio.sfx('ui_confirm', { vol: .4 }); } else DB.audio.sfx('miss', { vol: .3 });
        }
        for (var k = 0; k < W3; k++) (function (k) { var b = bigBtn(['A', 'S', 'D'][k]); b.style.cssText += ';min-width:0;padding:16px 0;width:30%;margin-top:6px;color:' + cols[k]; pressable(b, function () { press(k); }); bt.appendChild(b); })(k);
        var keyh = function (e) { var m = { a: 0, A: 0, s: 1, S: 1, d: 2, D: 2 }[e.key]; if (m != null) press(m); }; window.addEventListener('keydown', keyh);
        function loop(now) {
          if (done) return; raf = requestAnimationFrame(loop); var t = (now - t0) / 1000 + 1.5, fin = true;
          notes.forEach(function (n) { if (n.done) return; var y = (t - n.t) * 200 + 0; var yy = 200 - (n.t + 1.0 - t) * 200; n.el.style.display = 'block'; n.el.style.top = (yy - 22) + 'px'; if (yy > 250) { n.done = true; n.el.style.display = 'none'; miss++; } fin = fin && n.done; });
          $('#rh-s', body).textContent = 'Hearts caught: ' + hit + ' / ' + total;
          if (fin && t > notes[notes.length - 1].t + 2.5) { done = true; window.removeEventListener('keydown', keyh); setTimeout(function () { close(); res({ hit: hit, total: total }); }, 500); }
        }
        raf = requestAnimationFrame(function (t) { t0 = t + 1000; loop(t); });
      });
    });
  };
  /* ---- memory: repeat a growing sequence of symbols. opts {length, symbols} -> {ok, rounds} ---- */
  MG.memory = function (o) {
    if (DB.testMode) return Promise.resolve({ ok: true, fails: 0 });
    o = o || {}; var len = o.length || 5, syms = o.symbols || ['🔥', '❄', '⚡', '✦'];
    var body = open(o.title || 'Memory', 'Watch the sequence, then repeat it');
    return intro(body, o.intro || 'Watch the sequence of runes, then repeat it.').then(function () {
      return new Promise(function (res) {
        var seq = [], round = 0, input = [], lock = true, fails = 0;
        body.innerHTML = '<div id="mm-s" class="gold" style="min-height:28px;font-size:16px"></div><div id="mm-g" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;max-width:260px;margin:10px auto"></div>';
        var grid = $('#mm-g', body), tiles = [];
        syms.forEach(function (s, i) { var b = el('button', 'btn'); b.style.cssText = 'font-size:34px;padding:18px'; b.textContent = s; b.onclick = function () { if (lock) return; flash(i); input.push(i); if (input[input.length - 1] !== seq[input.length - 1]) { fail(); } else if (input.length === seq.length) { lock = true; if (seq.length >= len) { setTimeout(function () { close(); res({ ok: true, fails: fails }); }, 500); } else setTimeout(next, 600); } }; grid.appendChild(b); tiles.push(b); });
        function flash(i) { tiles[i].style.filter = 'brightness(2.2)'; tiles[i].style.borderColor = '#fff'; DB.audio.sfx('select', { vol: .4 }); setTimeout(function () { tiles[i].style.filter = ''; tiles[i].style.borderColor = ''; }, 280); }
        function play() { lock = true; $('#mm-s', body).textContent = 'Watch…'; var i = 0; (function step() { if (i >= seq.length) { lock = false; input = []; $('#mm-s', body).textContent = 'Your turn!'; return; } flash(seq[i++]); setTimeout(step, 520); })(); }
        function next() { seq.push(Math.floor(Math.random() * syms.length)); play(); }
        function fail() { fails++; lock = true; $('#mm-s', body).textContent = 'Not quite — watch again.'; DB.audio.sfx('miss'); setTimeout(function () { if (fails >= 3) { close(); res({ ok: true, fails: fails }); return; } play(); }, 900); }
        seq = [Math.floor(Math.random() * syms.length), Math.floor(Math.random() * syms.length)]; setTimeout(play, 400);
      });
    });
  };
  /* ---- hold: hold the action button (or the on-screen button) until the ring fills. opts {seconds, label} ---- */
  MG.qte = function (o) {
    if (DB.testMode) return Promise.resolve(true);
    o = o || {}; var secs = o.seconds || 5;
    return new Promise(function (res) {
      var box = el('div', 'qte'); box.innerHTML = '<div class="ring" id="qr"></div><div class="gold" style="margin-top:10px;font-size:18px;letter-spacing:.2em;text-shadow:0 2px 6px #000">' + DB.esc(o.label || 'HOLD ATTACK') + '</div><div id="qbar" style="width:240px;height:12px;margin:8px auto;background:#0b1424;border:2px solid var(--gold);border-radius:8px;overflow:hidden"><i style="display:block;height:100%;width:0;background:linear-gradient(90deg,#c88a2a,#fff3b0)"></i></div>';
      $('#app').appendChild(box); var prog = 0, raf, last = performance.now(), pad = $('#pad'); UI.hud(true); pad.classList.remove('hidden');
      var big = document.querySelector('.ab.a'); big.querySelector('small').textContent = 'HOLD'; box.style.pointerEvents = 'none';
      function loop(now) {
        var dt = Math.min(.05, (now - last) / 1000); last = now; var held = DB.input.down('a'); prog = Math.max(0, prog + (held ? dt : -dt * 1.3) / secs);
        box.querySelector('i').style.width = (prog * 100) + '%'; var r = $('#qr', box); r.style.transform = 'scale(' + (.7 + prog * .9) + ')'; r.style.opacity = .5 + prog * .5; DB.world.shake = Math.max(DB.world.shake, prog * 6);
        if (prog >= 1) { box.remove(); big.querySelector('small').textContent = 'Act'; res(true); return; }
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
    });
  };
  MG.close = close;
})();
