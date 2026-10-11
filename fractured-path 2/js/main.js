/* main.js - boot and main loop */
(function (FP) {
  'use strict';
  FP.scene = null;
  var last = 0;
  function frame(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    try {
      FP.pollRepeat(dt);
      var s = FP.scene;
      if (s && s.update) s.update(dt);
      FP.beginFrame();
      if (s && s.draw) s.draw(FP.g);
      if (FP.G && FP.scene === FP.field) FP.G.play = (FP.G.play || 0) + dt;
      FP.present();
    } catch (e) { if (!FP._errShown) { FP._errShown = true; console.error(e); } }
    requestAnimationFrame(frame);
  }
  var acc = 0;
  function quietSave(force) {
    var F = FP.field;
    if (!FP.G || FP.scene !== F || !F.map) return;
    if (!force && (F.locked > 0 || F.busy || F.moving || (FP.battle && FP.battle.active))) return;
    FP.menus.autosave(true);
  }
  setInterval(function () { acc += 1; if (acc >= 12) { acc = 0; quietSave(false); } }, 1000);
  document.addEventListener('visibilitychange', function () { if (document.hidden) quietSave(false); });
  window.addEventListener('pagehide', function () { quietSave(false); });
  function boot() {
    FP.ui.init();
    FP.initPad();
    FP.applyMode();
    FP.layout();
    window.addEventListener('resize', FP.layout);
    window.addEventListener('orientationchange', function () { setTimeout(FP.layout, 200); });
    requestAnimationFrame(frame);
    FP.menus.showTitle();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.FP);
