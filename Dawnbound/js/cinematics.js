/* Dawnbound - cinematics: opening, ending, credits, post-credits (still-image + Ken Burns presentation) */
(function () {
  'use strict';
  var DB = window.DB; var cin = DB.cin = DB.cin || {};

  /* ---------- meta (cross-save) ---------- */
  var MK = 'dawnbound.meta';
  function rd() { try { return JSON.parse(localStorage.getItem(MK) || '{}'); } catch (e) { return {}; } }
  DB.meta = {
    get: function (k) { return rd()[k]; },
    set: function (k, v) { try { var m = rd(); m[k] = v; localStorage.setItem(MK, JSON.stringify(m)); } catch (e) { } }
  };

  /* ---------- player ---------- */
  var root = null, skipFlag = false, skipRes = null;
  function ensure() {
    if (root) return root;
    root = document.createElement('div'); root.id = 'cin';
    root.style.cssText = 'position:fixed;inset:0;z-index:70;background:#000;display:none;overflow:hidden;font-family:Georgia,serif;color:#f2e8cf;touch-action:manipulation';
    root.innerHTML = '<div class="cl a" style="position:absolute;inset:-6%;background-size:cover;background-position:center;opacity:0;transition:opacity 1.2s"></div>' +
      '<div class="cl b" style="position:absolute;inset:-6%;background-size:cover;background-position:center;opacity:0;transition:opacity 1.2s"></div>' +
      '<div class="cv" style="position:absolute;inset:0;background:radial-gradient(ellipse at center,#0000 45%,#000b 100%)"></div>' +
      '<div class="cf" style="position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none"></div>' +
      '<div class="ct" style="position:absolute;left:0;right:0;bottom:0;text-align:center;padding:34px 9vw 6vh;background:linear-gradient(#0000,#000c 45%);font-size:min(4.6vw,23px);line-height:1.5;font-style:italic;text-shadow:0 2px 8px #000,0 0 18px #000;opacity:0;transition:opacity .9s"></div>' +
      '<div class="cm" style="position:absolute;left:0;right:0;top:36%;text-align:center;padding:0 8vw;font-size:min(8vw,46px);letter-spacing:.18em;color:#ffd98a;text-shadow:0 0 26px #e8a63acc;opacity:0;transition:opacity 1s"></div>' +
      '<div class="cr" style="position:absolute;left:0;right:0;top:100%;text-align:center;padding:0 8vw;line-height:1.7;font-size:min(4vw,19px)"></div>' +
      '<div class="cs" style="position:absolute;right:calc(14px + env(safe-area-inset-right));top:calc(10px + env(safe-area-inset-top));padding:6px 14px;border:1px solid #ffd98a88;border-radius:18px;background:#000a;font-size:13px;letter-spacing:.15em;cursor:pointer">SKIP ▸▸</div>';
    document.body.appendChild(root);
    var sk = root.querySelector('.cs');
    var go = function (e) { e.preventDefault(); e.stopPropagation(); skipFlag = true; if (skipRes) { var r = skipRes; skipRes = null; r(); } };
    sk.addEventListener('touchstart', go, { passive: false }); sk.addEventListener('mousedown', go);
    return root;
  }
  function q(s) { return root.querySelector(s); }
  function wait(ms) { return new Promise(function (res) { if (skipFlag) return res(); var t = setTimeout(function () { skipRes = null; res(); }, ms); skipRes = function () { clearTimeout(t); res(); }; }); }
  var flip = 0;
  function showImg(shot) {
    var a = q(flip ? '.b' : '.a'), b = q(flip ? '.a' : '.b'); flip ^= 1;
    a.style.transition = 'none'; a.style.transform = 'scale(' + (shot.z0 || 1.06) + ') translate(' + (shot.x0 || 0) + '%,' + (shot.y0 || 0) + '%)';
    a.style.backgroundImage = shot.img ? 'url(assets/maps/' + shot.img + '.webp)' : 'none';
    a.style.filter = shot.filter || 'none';
    void a.offsetWidth;
    a.style.transition = 'opacity ' + (shot.fade || 1.2) + 's, transform ' + (shot.ms / 1000 + 1.4) + 's linear';
    a.style.opacity = shot.img ? 1 : 0; b.style.opacity = 0;
    a.style.transform = 'scale(' + (shot.z1 || 1.2) + ') translate(' + (shot.x1 || 0) + '%,' + (shot.y1 || 0) + '%)';
  }
  function text(sel, t) { var e = q(sel); if (!t) { e.style.opacity = 0; return; } e.innerHTML = t; e.style.opacity = 1; }
  async function flash(c, ms) { var f = q('.cf'); f.style.background = c || '#fff'; f.style.transition = 'opacity ' + (ms || 400) / 1000 + 's'; f.style.opacity = 1; await wait(ms || 400); f.style.opacity = 0; }

  async function play(shots, song) {
    ensure(); skipFlag = false; flip = 0; root.style.display = 'block'; root.style.opacity = 1;
    q('.cr').style.top = '100%'; q('.cr').innerHTML = ''; text('.ct', ''); text('.cm', '');
    q('.cl.a').style.opacity = 0; q('.cl.b').style.opacity = 0;
    if (song) DB.audio.music(song, 1.5);
    for (var i = 0; i < shots.length && !skipFlag; i++) {
      var s = shots[i];
      if (s.song) DB.audio.music(s.song, s.songFade || 1.5);
      if (s.img !== undefined) showImg(s);
      if (s.flash) { await flash(s.flash === true ? '#fff' : s.flash, s.flashMs || 500); }
      if (s.shake) { root.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,4px)' }, { transform: 'translate(5px,-5px)' }, { transform: 'translate(0,0)' }], { duration: 400 }); }
      text('.cm', s.big || ''); text('.ct', s.text || '');
      await wait(s.ms || 3500);
      if (s.hold !== true) { text('.ct', ''); }
      if (s.big) text('.cm', '');
      if (s.pause) await wait(s.pause);
    }
  }
  function end() {
    return new Promise(function (res) {
      if (!root) return res();
      root.style.transition = 'opacity .9s'; root.style.opacity = 0;
      setTimeout(function () { root.style.display = 'none'; root.style.transition = ''; skipFlag = false; res(); }, 950);
    });
  }
  cin.play = play; cin.end = end;

  /* ---------- Opening: The Black Sun Dreams ---------- */
  cin.opening = async function () {
    if (DB.testMode) return;
    DB.audio.unlock && DB.audio.unlock();
    ensure(); skipFlag = false;
    await play([
      { img: null, song: 'void', ms: 2200, text: '' },
      { img: null, ms: 4600, text: '“Do you remember the first time you lost something you loved?”', pause: 500 },
      { img: 'campfire_clearing', song: 'dream_gold', ms: 5200, z0: 1.0, z1: 1.18, text: '<span style="opacity:.7;font-size:.7em;letter-spacing:.3em;display:block;margin-bottom:6px">A FIELD OF FLOWERS · THREE HUNDRED YEARS AGO</span>“I do. I remember all of them.”', filter: 'sepia(.35) saturate(1.3) brightness(1.1)' },
      { img: 'black_sun_sky', song: 'burning', ms: 5600, z0: 1.3, z1: 1.05, shake: true, flash: '#7a1a9a', flashMs: 600, text: 'The sky turns black. A black sun hangs ringed in violet fire. Six warriors fall — and one young man drives a blazing sword into the earth.', filter: 'saturate(1.1)' },
      { img: null, flash: '#fff', flashMs: 900, ms: 1800, big: '', song: 'six_embers' },
      { img: 'highcrest', ms: 3200, z0: 1.0, z1: 1.2, y1: -3, text: '<b style="letter-spacing:.3em;font-style:normal;color:#ffd98a">HIGHCREST</b><br>Banners snapping in the mountain wind. Bells ringing.' },
      { img: 'mistvale', ms: 3200, z0: 1.15, z1: 1.0, text: '<b style="letter-spacing:.3em;font-style:normal;color:#ffd98a">MISTVALE</b><br>Mist over terraced gardens. A temple flame flickers.' },
      { img: 'saltmire', ms: 3200, z0: 1.0, z1: 1.2, x1: -3, text: '<b style="letter-spacing:.3em;font-style:normal;color:#ffd98a">SALTMIRE</b><br>Lanterns swaying over marsh water. A dagger glints in shadow.' },
      { img: 'greythorn', ms: 3200, z0: 1.2, z1: 1.02, text: '<b style="letter-spacing:.3em;font-style:normal;color:#ffd98a">GREYTHORN</b><br>Sunlight through giant trees. A wolf’s eyes open in the undergrowth.' },
      { img: 'frostmark', ms: 3200, z0: 1.0, z1: 1.2, y1: 3, text: '<b style="letter-spacing:.3em;font-style:normal;color:#ffd98a">FROSTMARK</b><br>The aurora over glacier cliffs. War drums.' },
      { img: 'lumeria', ms: 3200, z0: 1.2, z1: 1.0, text: '<b style="letter-spacing:.3em;font-style:normal;color:#ffd98a">LUMERIA</b><br>Glass towers floating among clouds, glowing with runes.' },
      { img: null, flash: '#ffd98a', flashMs: 500, ms: 600 },
      { img: 'black_sun_sky', ms: 4600, z0: 1.05, z1: 1.0, text: 'In each place, at the same instant, a hand ignites with golden light.<br>“Six embers, again. How cruel the world is… to make children carry its hope.”', filter: 'brightness(.75) hue-rotate(30deg)' },
      { img: 'hollow_wastes', song: 'wastes', ms: 3800, z0: 1.0, z1: 1.18, text: 'A ruined continent of black glass.' },
      { img: 'throne_of_swords', song: 'vael', ms: 5400, z0: 1.1, z1: 1.0, text: '“Come, then, little embers. I will end your pain. I will end everyone’s.”' },
      { img: null, ms: 600 },
      { img: null, ms: 4200, big: 'DAWNBOUND', hold: false, text: '<span style="letter-spacing:.5em;font-style:normal;font-size:.7em;color:#cfe4ff">THE SIX EMBERS</span>' }
    ]);
    await end(); DB.audio.music(null, 1);
  };

  /* ---------- Ending: Where the Light Finds Us ---------- */
  cin.ending = async function (S) {
    var hero = DB.G.hero, hn = DB.heroes[hero].short;
    await play([
      { img: 'black_sun_citadel', song: 'victory', ms: 4600, z0: 1.0, z1: 1.2, shake: true, flash: '#ffe9a0', text: 'The Citadel crumbles into golden dust. The ground collapses behind them — and they leap onto the deck of the <i>Wandering Gull</i>.<br><b style="font-style:normal">MARISOL:</b> “Told you I’d keep her afloat.”' },
      { img: 'wandering_gull_deck', ms: 4200, z0: 1.1, z1: 1.0, text: 'Sunrise over the sea. The Embers collapse on the deck, laughing and crying.', filter: 'sepia(.3) saturate(1.3) brightness(1.1)' },
      { img: 'highcrest', song: 'highcrest', ms: 4400, text: '<b style="font-style:normal;color:#ffd98a;letter-spacing:.25em">HIGHCREST</b><br>Caelan kneels before Queen Ilsabet — and refuses a knighthood of the crown. He founds the Order of the Open Hand, sworn to the people.' },
      { img: 'mistvale', ms: 4400, z0: 1.15, z1: 1.0, text: '<b style="font-style:normal;color:#ffd98a;letter-spacing:.25em">MISTVALE</b><br>Liora opens a healing school. Over the door: “Not every wound is yours to close. But some are.”' },
      { img: 'saltmire', song: 'saltmire', ms: 4400, text: '<b style="font-style:normal;color:#ffd98a;letter-spacing:.25em">SALTMIRE</b><br>Vex is elected — against all odds — head of a reformed guild that protects the city’s orphans.' },
      { img: 'greythorn', song: 'forest', ms: 4400, z0: 1.2, z1: 1.0, text: '<b style="font-style:normal;color:#ffd98a;letter-spacing:.25em">GREYTHORN</b><br>Rowan becomes the forest’s warden. Ash has puppies.' },
      { img: 'frostmark_mead_hall', song: 'frostmark', ms: 4400, text: '<b style="font-style:normal;color:#ffd98a;letter-spacing:.25em">FROSTMARK</b><br>Brakka and Hald stand together at a feast. Brakka is crying. It’s Hald’s wedding.' },
      { img: 'lumeria', song: 'lumeria', ms: 4400, z0: 1.2, z1: 1.0, text: '<b style="font-style:normal;color:#ffd98a;letter-spacing:.25em">LUMERIA</b><br>Seraphine is named Archmagister. Her first act: opening every forbidden archive to the public.' },
      { img: 'port_halcyon', song: 'festival', ms: 5200, text: '<b style="font-style:normal;color:#ffd98a;letter-spacing:.25em">ONE YEAR LATER</b><br>Port Halcyon, the Festival of First Light. All six arrive on the <i>Wandering Gull</i>. Pip, a little taller, runs down the dock screaming. Hettie bakes eleven pies.', filter: 'brightness(1.1) saturate(1.2)' },
      { img: 'port_halcyon', song: 'lanterns', ms: 6600, z0: 1.0, z1: 1.2, filter: 'brightness(.55) saturate(1.4) hue-rotate(-12deg)', text: 'That night, they release lanterns into the harbor. ' + hn + ' writes one more name: <b style="color:#ffd98a;font-style:normal">VAELTHORN</b>.<br><b style="font-style:normal">LIORA:</b> “So the light can find him.”<br><b style="font-style:normal">' + hn.toUpperCase() + ':</b> “It already did.”' },
      { img: 'halcyon_lighthouse', ms: 5200, z0: 1.0, z1: 1.35, y1: 6, text: 'The lighthouse burns bright above the town. The camera rises into the stars.', filter: 'brightness(.8)' },
      { img: null, ms: 7000, text: '“And the Embers burned on — not because they were chosen, but because they chose each other.”' }
    ]);
    skipFlag = false;
  };

  /* ---------- Credits ---------- */
  cin.credits = async function (S) {
    ensure(); skipFlag = false;
    var R = q('.cr'); DB.audio.music('credits', 2);
    var sec = function (h, l) { return '<div style="margin:34px 0 8px;color:#ffd98a;letter-spacing:.3em;font-size:1.1em">' + h + '</div>' + l.map(function (x) { return '<div>' + x + '</div>'; }).join(''); };
    R.innerHTML = '<div style="font-size:min(9vw,52px);letter-spacing:.2em;color:#ffd98a;text-shadow:0 0 28px #e8a63a99;margin-top:10px">DAWNBOUND</div><div style="letter-spacing:.5em;font-size:.8em">THE SIX EMBERS</div>' +
      sec('THE EMBERS', ['Caelan Ashford — the Knight', 'Liora Wyn — the Healer', 'Vex Marlowe — the Rogue', 'Rowan Thistlewood — the Hunter', 'Brakka Stormhewn — the Berserker', 'Seraphine Vael — the Mage']) +
      sec('THE ONES WHO CARRIED THE LIGHT', ['Captain Marisol & the <i>Wandering Gull</i>', 'Elder Maren', 'Pip, Hettie & Bram of Port Halcyon', 'Sir Edran, who found his way back', 'Queen Ilsabet', 'Jarl Hald & Frostmark', 'Archmagister Thessaly', 'Ash']) +
      sec('THE FIRST SIX', ['Who never left']) +
      sec('VAELTHORN', ['Who was only ever grieving']) +
      sec('MUSIC', ['Composed in the browser, live, from a handful of notes and a lot of reverb']) +
      sec('PRODUCED WITH', ['Claude · Anthropic']) +
      '<div style="margin:60px 0 40vh;font-style:italic;font-size:1.15em;color:#e6dcc3">Thank you for playing.</div>';
    q('.cl.a').style.opacity = .0; q('.cl.b').style.opacity = 0;
    showImg({ img: 'port_halcyon', ms: 50000, z0: 1.05, z1: 1.25, filter: 'brightness(.35)' });
    var h = R.offsetHeight + window.innerHeight, dur = Math.max(26000, h * 28);
    R.style.transition = 'none'; R.style.top = '100%'; void R.offsetWidth;
    R.style.transition = 'transform ' + dur / 1000 + 's linear'; R.style.transform = 'translateY(-' + h + 'px)';
    await wait(dur);
    R.style.transition = 'none'; R.style.transform = 'none'; R.style.top = '100%'; R.innerHTML = '';
    /* post-credits */
    skipFlag = false;
    await play([
      { img: 'aurora_hillside', song: 'aurora', ms: 7800, z0: 1.0, z1: 1.2, text: 'On the shores of Frostmark, under the aurora, the six sit together on the snowy hill — keeping their promise. Brakka raises a mug.<br><b style="font-style:normal">BRAKKA:</b> “Every year! A tradition!”<br><b style="font-style:normal">ALL:</b> “Every year.”' },
      { img: null, ms: 1200 }
    ]);
    DB.audio.music(null, 2);
    await end();
  };

  /* quick test hook */
  cin.test = async function (name) { await cin[name]({}); };
})();
