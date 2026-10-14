/* Sunderbell - boot, main loop, saving and loading. */
(function () {
  'use strict';
  var SB = window.SB, W = SB.W, I = SB.input;
  var M = SB.Main = { busy: false, arrived: 0 };
  var useDraft = SB.query.draft === '1';
  var SAVE_KEY = 'sunderbell.save' + (useDraft ? '.draft' : '');

  M.freshState = function () {
    var meta = SB.D.meta;
    return { map: meta.startMap, x: meta.startX, y: meta.startY, dir: meta.startDir || 'down', flags: {}, keys: 0, chimes: 0, hp: (meta.startHearts || 3) * 2, maxHp: (meta.startHearts || 3) * 2, leader: SB.D.heroes[0].id, hold: false, quest: '', journal: [], tileMods: {}, items: {}, meter: 0, time: 0 };
  };
  M.hasSave = function () { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
  M.save = function () {
    var G = SB.G, L = SB.Party.leader(); if (!G || !W.map) return;
    G.map = W.mapId; if (L) { G.x = Math.floor(L.x / 16); G.y = Math.floor((L.y - 4) / 16); G.dir = L.dir; }
    if (M.checkpoint && M.checkpoint.map === W.mapId && W.cutscene) { G.x = M.checkpoint.x; G.y = M.checkpoint.y; }
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) { }
  };
  M.load = function () { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } };

  M.start = function (G, scene) {
    SB.G = G; G.flags = G.flags || {}; G.items = G.items || {}; G.tileMods = G.tileMods || {}; G.journal = G.journal || [];
    SB.Party.members = []; W.musicLock = null; W.tint = null; W.fade.a = 1;
    W.load(G.map, G.x, G.y, G.dir); M.arrived = W.time; M.checkpoint = { map: G.map, x: G.x, y: G.y };
    document.body.classList.add('playing'); SB.UI.refreshHud(true);
    if (G.flags.prologue_done && !G.flags.ending_done && W.mapId === 'tower') { }
    W.doFade('in', null, 500);
    if (scene) SB.Story.run(scene);
  };
  M.newGame = function () { var G = M.freshState(); M.start(G, SB.D.meta.startScene); };
  M.continueGame = function (retry) {
    var G = M.load() || M.freshState();
    if (retry) G.hp = Math.max(G.hp, G.maxHp);
    if (G.hp <= 0) G.hp = G.maxHp;
    delete G.flags.boss_active;
    M.start(G, null);
  };
  M.toTitle = function () { document.body.classList.remove('playing'); SB.UI.bossBar(null); W.map = null; SB.UI.title(); };
  M.gameOver = function () {
    if (M.over) return; M.over = true; W.cutscene++;
    SB.audio.music('none'); SB.audio.sfx('gameover');
    W.doFade('out', '#c8c8d8', 900).then(function () { W.cutscene = 0; M.over = false; SB.Story.queue = Promise.resolve(); SB.Story.running = 0; SB.UI.endScene(); SB.UI.gameOver(); });
  };
  M.warp = function (to, tx, ty, dir) {
    if (M.busy) return; M.busy = true; SB.audio.sfx('warp');
    W.doFade('out', '#000', 220).then(function () {
      W.musicLock = null; SB.UI.bossBar(null);
      W.load(to, tx, ty, dir); M.arrived = W.time; M.checkpoint = { map: to, x: tx, y: ty };
      M.save(); SB.UI.refreshHud(true);
      return W.doFade('in', null, 260);
    }).then(function () { M.busy = false; });
  };

  /* ---------------- loop ---------------- */
  var lastT = 0, beepT = 0;
  function frame(now) {
    var dt = Math.min(.05, (now - (lastT || now)) / 1000); lastT = now;
    I.poll();
    if (SB.G && W.map) {
      if (I.take('menu')) { if (SB.UI.modal && !$screenLocked()) { SB.UI.closeScreen(); } else if (!W.cutscene && !SB.UI.dialog) SB.UI.menu(); }
      if (SB.UI.dialog && (I.take('a') || I.take('swap'))) SB.UI.dialog.advance();
      if (!SB.UI.modal) {
        W.time += dt; SB.G.time += dt;
        SB.Party.update(dt); SB.Actors.update(dt); SB.FX.update(dt); W.updateCam(dt);
        W.shake = Math.max(0, W.shake - dt);
        if (SB.G.hp <= 2 && SB.G.hp > 0 && !W.cutscene) { beepT -= dt; if (beepT <= 0) { beepT = 1.4; SB.audio.sfx('lowhp'); } }
        SB.UI.refreshHud();
        var near = !W.cutscene && SB.Party.canInteract(); document.getElementById('btnA').classList.toggle('talk', !!near);
      }
      W.render();
    }
    I.endFrame();
    requestAnimationFrame(frame);
  }
  function $screenLocked() { var s = document.getElementById('screen'); return s.classList.contains('over') || s.classList.contains('titlebg') || s.classList.contains('creditsbg'); }

  /* ---------------- boot ---------------- */
  M.boot = function () {
    SB.D = SB.loadData(useDraft);
    SB.gfx = new SB.Gfx(SB.D); SB.audio.use(SB.D);
    W.init(); I.bind();
    var css = '', icon = function (id, f) { var c = SB.gfx.frame(id, f); return c ? c.toDataURL() : ''; };
    css += '#hearts i.f{background-image:url(' + icon('ui_heart', 0) + ')}#hearts i.half{background-image:url(' + icon('ui_heart', 1) + ')}#hearts i.e{background-image:url(' + icon('ui_heart', 2) + ')}';
    css += '#wallet .chime{background-image:url(' + icon('chime', 0) + ')}#wallet .key{background-image:url(' + icon('ui_key', 0) + ')}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    document.getElementById('dlg').addEventListener('click', function () { if (SB.UI.dialog) SB.UI.dialog.advance(); });
    document.getElementById('dlg').addEventListener('touchstart', function (e) { e.preventDefault(); if (SB.UI.dialog) SB.UI.dialog.advance(); }, { passive: false });
    if (useDraft) document.body.classList.add('drafting');
    document.getElementById('loading').classList.add('gone');
    requestAnimationFrame(frame);
    /* playtest straight from the editor: ?draft=1&map=ID&x=..&y=..&flags=a,b */
    if (SB.query.map && SB.D.maps[SB.query.map]) {
      var G = M.freshState(); G.map = SB.query.map; G.x = +SB.query.x || 2; G.y = +SB.query.y || 2;
      (SB.query.flags || '').split(',').filter(Boolean).forEach(function (f) { G.flags[f] = 1; });
      if (SB.query.hearts) G.hp = G.maxHp = +SB.query.hearts * 2;
      M.start(G, SB.query.scene || null);
      return;
    }
    if (SB.query.scene && SB.D.scenes[SB.query.scene]) { var G2 = M.freshState(); G2.flags.intro_done = 1; (SB.query.flags || '').split(',').filter(Boolean).forEach(function (f) { G2.flags[f] = 1; }); M.start(G2, SB.query.scene); return; }
    if (SB.query['new'] === '1') { M.newGame(); return; }
    SB.UI.title();
  };
  if ('serviceWorker' in navigator && location.protocol === 'https:') { navigator.serviceWorker.register('sw.js').catch(function () { }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', M.boot); else M.boot();
  document.addEventListener('visibilitychange', function () { if (document.hidden && SB.G && W.map) M.save(); });
})();
