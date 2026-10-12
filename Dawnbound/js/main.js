/* Dawnbound - boot & main loop */
(function () {
  'use strict';
  var DB = window.DB, W = DB.world, UI = DB.ui, A = DB.assets, $ = DB.$;
  DB.maps = DB.maps || {};
  DB.defMap = function (id, def) { def.id = id; DB.maps[id] = def; return def; };
  function setLoad(p, msg) { var f = $('#lfill'); if (f) f.style.width = Math.round(p * 100) + '%'; var m = $('#lmsg'); if (m && msg) m.textContent = msg; }
  DB.startNewGame = function (heroId, name) {
    UI.closeScreen(); W.mode = 'title';
    var G = DB.newState(heroId, name); DB.combat.noMeter = false;
    if (DB.meta && DB.meta.get('cleared')) { G.flags.ngplus = 1; G.gold = (G.gold || 0) + 1500; }
    var go = function () { return DB.go('wandering_gull_deck', 'start', { noSave: true, fade: 300 }).then(function () { W.mode = 'field'; if (G.flags.ngplus) DB.toast('New Game+: +1500 gold. Try a different Ember for new perspectives.', 'quest'); DB.story.run('prologue_p1'); }); };
    var p = DB.cin && DB.cin.opening ? DB.cin.opening() : Promise.resolve();
    p.then(function () { return go(); });
  };
  var last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(.05, (now - last) / 1000); last = now; if (!dt) return;
    DB.input.update();
    if (W.mode !== 'title' && !W.paused && W.map) { W.update(dt); DB.story.tick(dt); }
    W.draw(); UI.updateHud(dt);
    DB.input.flush();
  }
  DB.boot = function () {
    var pr = 0;
    setLoad(.05, 'Gathering embers…');
    return A.init().then(function () {
      setLoad(.2, 'Lighting lanterns…'); return A.loadFx();
    }).then(function () {
      setLoad(.5, 'Painting portraits…'); return Promise.all(DB.HERO_IDS.map(function (h) { return A.loadImage('assets/chars/' + h + '_expressions.webp'); }).concat([A.loadImage('assets/ui/class-select.webp')]));
    }).then(function () {
      setLoad(.9, 'Almost there…');
      try { var z = parseFloat(localStorage.getItem('dawnbound.zoom')); if (z) W.zoomMul = z; } catch (e) { }
      DB.input.initTouch(); W.init(); UI.init(); DB.audio.init && DB.audio.init();
      var onUnlock = function () { DB.audio.unlock(); }; ['touchstart', 'mousedown', 'keydown'].forEach(function (ev) { window.addEventListener(ev, onUnlock, { once: false, passive: true }); });
      document.addEventListener('visibilitychange', function () { if (document.hidden) { DB.audio.suspend && DB.audio.suspend(); } else DB.audio.resume && DB.audio.resume(); });
      var chk = function () { $('#rotate').classList.toggle('hidden', !(DB.input.touch && window.innerHeight > window.innerWidth)); }; window.addEventListener('resize', chk); chk();
      requestAnimationFrame(frame);
      setLoad(1, 'Ready');
      var ld = $('#loading'); ld.style.opacity = 0; setTimeout(function () { ld.style.display = 'none'; }, 700);
      DB.menus.title();
      if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(function () { });
    });
  };
  window.addEventListener('load', function () { DB.boot().catch(function (e) { console.error(e); setLoad(0, 'Failed to start: ' + e.message); }); });
  window.addEventListener('error', function (e) { if (window.__dberr) window.__dberr.push(e.message); });
  window.__dberr = [];
})();
/* debug helpers (used by test tooling) */
(function () {
  var DB = window.DB, W = DB.world;
  DB.debugShot = function (sc) {
    sc = sc || 1; var m = W.map, c = document.createElement('canvas'); c.width = m.w; c.height = m.h; var x = c.getContext('2d');
    if (W.img) x.drawImage(W.img, 0, 0, m.w, m.h);
    var mk = W.mask; x.fillStyle = 'rgba(255,0,0,.38)'; for (var j = 0; j < mk.h; j++) for (var i = 0; i < mk.w; i++) if (!mk.d[j * mk.w + i]) x.fillRect(i * 8, j * 8, 8, 8);
    x.font = 'bold 14px sans-serif';
    function box(r, col, lab) { x.strokeStyle = col; x.lineWidth = 3; x.strokeRect(r.x, r.y, r.w, r.h); x.fillStyle = col; x.fillText(lab || '', r.x + 2, r.y - 4); }
    (m.portals || []).forEach(function (p) { box(p, '#00e5ff', '→' + p.to); });
    (m.triggers || []).forEach(function (p, i) { box(p, '#d070ff', 'T' + (p.id || i)); });
    function dot(px, py, col, lab) { x.fillStyle = col; x.beginPath(); x.arc(px, py, 7, 0, 6.3); x.fill(); x.strokeStyle = '#000'; x.lineWidth = 2; x.stroke(); x.fillStyle = '#fff'; x.strokeText(lab, px + 9, py + 4); x.fillText(lab, px + 9, py + 4); }
    Object.keys(m.spawns).forEach(function (k) { var s = m.spawns[k]; dot(s[0], s[1], '#3f3', 'S:' + k); });
    (m.npcs || []).forEach(function (n) { dot(n.x, n.y, '#f6a', n.id); });
    (m.objs || []).forEach(function (n) { dot(n.x, n.y, '#ff0', n.t + ':' + n.id); if (n.block) { x.strokeStyle = '#f90'; x.strokeRect(n.block[0], n.block[1], n.block[2], n.block[3]); } });
    (m.enemies || []).forEach(function (g) { (g.at || [[g.x, g.y]]).forEach(function (p) { dot(p[0], p[1], '#f80', g.type); }); });
    if (m.boss) dot(m.boss.x, m.boss.y, '#f00', 'BOSS');
    if (sc !== 1) { var c2 = document.createElement('canvas'); c2.width = m.w * sc; c2.height = m.h * sc; c2.getContext('2d').drawImage(c, 0, 0, c2.width, c2.height); c = c2; } return c.toDataURL('image/jpeg', .6);
  };
})();
