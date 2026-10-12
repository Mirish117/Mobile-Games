/* Dawnbound - audio: WAV sound effects + a procedural orchestral-ish music synth */
(function () {
  'use strict';
  var DB = window.DB;
  var AU = DB.audio = { ctx: null, master: null, mus: null, sfxg: null, buffers: {}, vol: { music: .7, sfx: .8 }, cur: null, muted: false };
  var SFX_FILES = ['ui_cancel', 'heal_cast', 'quest_complete', 'chest_open', 'dawnmark_burst', 'footstep_stone', 'spell_ice', 'water_splash', 'ui_confirm', 'spell_fire', 'coin_pickup', 'sword_hit', 'door_open', 'door_close', 'spell_lightning'];
  try { var sv = JSON.parse(localStorage.getItem('dawnbound.audio') || 'null'); if (sv) { AU.vol = sv.vol || AU.vol; AU.muted = !!sv.muted; } } catch (e) { }
  AU.save = function () { try { localStorage.setItem('dawnbound.audio', JSON.stringify({ vol: AU.vol, muted: AU.muted })); } catch (e) { } };
  AU.unlock = function () {
    if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    var c = AU.ctx = new C();
    var comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(c.destination);
    AU.master = c.createGain(); AU.master.gain.value = AU.muted ? 0 : 1; AU.master.connect(comp);
    AU.mus = c.createGain(); AU.mus.gain.value = AU.vol.music; AU.mus.connect(AU.master);
    AU.sfxg = c.createGain(); AU.sfxg.gain.value = AU.vol.sfx; AU.sfxg.connect(AU.master);
    /* reverb */
    var len = c.sampleRate * 2.4, ir = c.createBuffer(2, len, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    AU.rev = c.createConvolver(); AU.rev.buffer = ir; AU.revSend = c.createGain(); AU.revSend.gain.value = .32; AU.rev.connect(AU.mus); AU.revSend.connect(AU.rev);
    SFX_FILES.forEach(function (n) {
      fetch('assets/audio/' + n + '.wav').then(function (r) { return r.arrayBuffer(); }).then(function (b) { return new Promise(function (res, rej) { c.decodeAudioData(b, res, rej); }); }).then(function (buf) { AU.buffers[n] = buf; }).catch(function () { });
    });
    if (AU.pendingSong) { var s = AU.pendingSong; AU.pendingSong = null; AU.music(s); }
  };
  ['touchstart', 'mousedown', 'keydown'].forEach(function (e) { window.addEventListener(e, function () { AU.unlock(); }, { passive: true }); });
  AU.setVol = function (k, v) { AU.vol[k] = v; if (AU.ctx) { (k === 'music' ? AU.mus : AU.sfxg).gain.value = v; } AU.save(); };
  AU.setMuted = function (m) { AU.muted = m; if (AU.master) AU.master.gain.value = m ? 0 : 1; AU.save(); };
  /* ---------- sound effects ---------- */
  var lastSfx = {};
  AU.sfx = function (name, o) {
    if (!AU.ctx) return; o = o || {};
    var now = AU.ctx.currentTime; if (lastSfx[name] && now - lastSfx[name] < (o.gap == null ? .04 : o.gap)) return; lastSfx[name] = now;
    var b = AU.buffers[name];
    if (b) { var s = AU.ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = o.rate || 1; var g = AU.ctx.createGain(); g.gain.value = o.vol == null ? 1 : o.vol; s.connect(g); g.connect(AU.sfxg); s.start(); return; }
    synthSfx(name, o);
  };
  function noiseBuf(dur) { var c = AU.ctx, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  function blip(type, f0, f1, dur, vol, dest, t0) {
    var c = AU.ctx, o = c.createOscillator(), g = c.createGain(); t0 = t0 || c.currentTime;
    o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(g); g.connect(dest || AU.sfxg); o.start(t0); o.stop(t0 + dur + .02);
  }
  function noiseHit(dur, vol, freq, q, t0) {
    var c = AU.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); t0 = t0 || c.currentTime;
    s.buffer = noiseBuf(dur); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1; g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(AU.sfxg); s.start(t0);
  }
  function synthSfx(n, o) {
    var t = AU.ctx.currentTime;
    switch (n) {
      case 'door_soft': blip('sine', 150, 62, .24, .16); blip('triangle', 300, 220, .14, .04); break;
      case 'swing': noiseHit(.14, .35, 2400, .8); blip('triangle', 500, 200, .1, .08); break;
      case 'hurt': blip('square', 240, 90, .18, .22); noiseHit(.1, .2, 900, 1); break;
      case 'hit': noiseHit(.09, .3, 1500, .9); blip('square', 180, 70, .09, .2); break;
      case 'crit': noiseHit(.14, .4, 2500, .7); blip('sawtooth', 700, 120, .2, .25); break;
      case 'arrow': noiseHit(.12, .25, 3200, 1.4); blip('triangle', 900, 300, .1, .08); break;
      case 'block': blip('square', 900, 700, .08, .2); noiseHit(.06, .3, 4000, 1); break;
      case 'dash': noiseHit(.2, .22, 1200, .5); break;
      case 'enemydie': blip('sawtooth', 300, 40, .4, .22); noiseHit(.3, .2, 600, .6); break;
      case 'levelup': [0, 4, 7, 12, 16].forEach(function (s, i) { blip('triangle', 440 * Math.pow(2, s / 12), 440 * Math.pow(2, s / 12), .35, .2, AU.sfxg, t + i * .09); }); break;
      case 'select': blip('triangle', 700, 900, .06, .12); break;
      case 'blip': blip('square', 520, 520, .03, .035); break;
      case 'roar': blip('sawtooth', 120, 50, .8, .3); noiseHit(.7, .25, 300, .6); break;
      case 'cast': blip('sine', 400, 1400, .35, .15); break;
      case 'wind': noiseHit(.8, .15, 800, .3); break;
      case 'thunder': noiseHit(1.2, .4, 150, .4); blip('sawtooth', 80, 30, 1, .3); break;
      case 'gold': blip('triangle', 1200, 1600, .12, .15); break;
      case 'step': noiseHit(.05, .08, 500, 1); break;
      case 'lever': blip('square', 200, 120, .12, .2); noiseHit(.08, .2, 700, 1); break;
      case 'quake': noiseHit(1.2, .35, 100, .4); break;
      case 'tick': blip('square', 1200, 1200, .02, .07); break;
      case 'miss': blip('triangle', 300, 200, .12, .12); break;
      default: break;
    }
  }
  /* ---------- music synth ---------- */
  var MODES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11], mixo: [0, 2, 4, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10], hminor: [0, 2, 3, 5, 7, 8, 11], pent: [0, 2, 4, 7, 9], mpent: [0, 3, 5, 7, 10] };
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function scaleNote(mode, root, deg, oct) { var s = MODES[mode]; var n = s.length; var o = Math.floor(deg / n); var d = ((deg % n) + n) % n; return root + s[d] + 12 * (o + (oct || 0)); }
  function chordDegs(d, mode) { var n = MODES[mode].length; return [d, d + 2, d + 4, d + 6]; }
  var INST = {
    piano: function (c, dest, f, t, dur, v) { var g = c.createGain(); var o1 = c.createOscillator(), o2 = c.createOscillator(), o3 = c.createOscillator(); o1.type = 'triangle'; o2.type = 'sine'; o3.type = 'sine'; o1.frequency.value = f; o2.frequency.value = f * 2.003; o3.frequency.value = f * 3.01; var g2 = c.createGain(), g3 = c.createGain(); g2.gain.value = .35; g3.gain.value = .12; o1.connect(g); o2.connect(g2); g2.connect(g); o3.connect(g3); g3.connect(g); var d = Math.min(dur + .6, 2.8); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(v * .35, t + .25); g.gain.exponentialRampToValueAtTime(.0001, t + d); g.connect(dest); o1.start(t); o2.start(t); o3.start(t); o1.stop(t + d + .05); o2.stop(t + d + .05); o3.stop(t + d + .05); },
    pluck: function (c, dest, f, t, dur, v) { var o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter(); o.type = 'triangle'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.setValueAtTime(f * 7, t); fl.frequency.exponentialRampToValueAtTime(f * 1.5, t + .3); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + Math.min(dur + .25, 1.2)); o.connect(fl); fl.connect(g); g.connect(dest); o.start(t); o.stop(t + 1.4); },
    harp: function (c, dest, f, t, dur, v) { var o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2; var g2 = c.createGain(); g2.gain.value = .25; o2.connect(g2); g2.connect(g); o.connect(g); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + 1.6); g.connect(dest); o.start(t); o2.start(t); o.stop(t + 1.7); o2.stop(t + 1.7); },
    strings: function (c, dest, f, t, dur, v) { var g = c.createGain(), fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = Math.min(4200, f * 5); [-7, 7].forEach(function (de) { var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = de; o.connect(fl); o.start(t); o.stop(t + dur + .6); }); var a = Math.min(.35, dur * .4); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .5, t + a); g.gain.setValueAtTime(v * .5, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .5); fl.connect(g); g.connect(dest); },
    brass: function (c, dest, f, t, dur, v) { var o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter(); o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = f; o2.frequency.value = f; o2.detune.value = 5; fl.type = 'lowpass'; fl.frequency.setValueAtTime(f * 1.2, t); fl.frequency.linearRampToValueAtTime(f * 4.5, t + .12); fl.frequency.linearRampToValueAtTime(f * 2.5, t + dur); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .38, t + .07); g.gain.setValueAtTime(v * .38, t + dur * .85); g.gain.linearRampToValueAtTime(0, t + dur + .15); o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(dest); o.start(t); o2.start(t); o.stop(t + dur + .2); o2.stop(t + dur + .2); },
    flute: function (c, dest, f, t, dur, v) { var o = c.createOscillator(), l = c.createOscillator(), lg = c.createGain(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f; l.frequency.value = 5.2; lg.gain.value = f * .006; l.connect(lg); lg.connect(o.frequency); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .6, t + .08); g.gain.setValueAtTime(v * .6, t + dur * .8); g.gain.linearRampToValueAtTime(0, t + dur + .12); o.connect(g); g.connect(dest); o.start(t); l.start(t); o.stop(t + dur + .2); l.stop(t + dur + .2); },
    bell: function (c, dest, f, t, dur, v) { var g = c.createGain(); [1, 2.76, 5.4, 8.9].forEach(function (m, i) { var o = c.createOscillator(), gg = c.createGain(); o.type = 'sine'; o.frequency.value = f * m; gg.gain.value = [1, .45, .2, .1][i]; o.connect(gg); gg.connect(g); o.start(t); o.stop(t + 2.6); }); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .5, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + 2.4); g.connect(dest); },
    pad: function (c, dest, f, t, dur, v) { var g = c.createGain(), fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = Math.min(2200, f * 4); [-9, 0, 9].forEach(function (de) { var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = de; o.connect(fl); o.start(t); o.stop(t + dur + 1.3); }); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .3, t + Math.min(1, dur * .5)); g.gain.setValueAtTime(v * .3, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 1.2); fl.connect(g); g.connect(dest); },
    choir: function (c, dest, f, t, dur, v) { var g = c.createGain(), f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 700; f1.Q.value = 5; f2.type = 'bandpass'; f2.frequency.value = 1150; f2.Q.value = 6; [-6, 6].forEach(function (de) { var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = de; o.connect(f1); o.connect(f2); o.start(t); o.stop(t + dur + 1); }); var m = c.createGain(); m.gain.value = 1.4; f1.connect(m); f2.connect(m); m.connect(g); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .55, t + .6); g.gain.setValueAtTime(v * .55, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .9); g.connect(dest); },
    bass: function (c, dest, f, t, dur, v) { var o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter(); o.type = 'sine'; o2.type = 'sawtooth'; o.frequency.value = f; o2.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 380; var g2 = c.createGain(); g2.gain.value = .35; o2.connect(g2); g2.connect(fl); o.connect(g); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(.25, dur)); fl.connect(g); g.connect(dest); o.start(t); o2.start(t); o.stop(t + dur + .3); o2.stop(t + dur + .3); },
    kick: function (c, dest, f, t, dur, v) { var o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + .12); g.gain.setValueAtTime(v * 1.4, t); g.gain.exponentialRampToValueAtTime(.0001, t + .28); o.connect(g); g.connect(dest); o.start(t); o.stop(t + .3); },
    tom: function (c, dest, f, t, dur, v) { var o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + .1); g.gain.setValueAtTime(v * 1.1, t); g.gain.exponentialRampToValueAtTime(.0001, t + .45); o.connect(g); g.connect(dest); o.start(t); o.stop(t + .5); },
    snare: function (c, dest, f, t, dur, v) { var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseBuf(.2); fl.type = 'highpass'; fl.frequency.value = 1500; g.gain.setValueAtTime(v * .7, t); g.gain.exponentialRampToValueAtTime(.0001, t + .16); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t); },
    hat: function (c, dest, f, t, dur, v) { var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseBuf(.06); fl.type = 'highpass'; fl.frequency.value = 7000; g.gain.setValueAtTime(v * .35, t); g.gain.exponentialRampToValueAtTime(.0001, t + .05); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t); },
    wind: function (c, dest, f, t, dur, v) { var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseBuf(dur + 1); fl.type = 'bandpass'; fl.frequency.setValueAtTime(f, t); fl.frequency.linearRampToValueAtTime(f * 1.5, t + dur); fl.Q.value = 3; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .25, t + dur * .5); g.gain.linearRampToValueAtTime(0, t + dur); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t); }
  };
  /* build the note events for one loop of a song description */
  function compose(S) {
    var ev = [], beatsPerBar = S.beats || 4, bars = S.prog.length * (S.repeat || 1);
    var rnd = DB.rng(S.seed || 1);
    var root = S.root, mode = S.mode;
    S.layers.forEach(function (L, li) {
      var r = DB.rng((S.seed || 1) * 31 + li * 977);
      var oct = L.oct == null ? 0 : L.oct, vol = L.vol == null ? .5 : L.vol, inst = L.inst;
      var lastDeg = 4 + (L.start || 0);
      for (var bar = 0; bar < bars; bar++) {
        var d = S.prog[bar % S.prog.length], b0 = bar * beatsPerBar, ch = chordDegs(d, mode);
        if (L.from != null && bar < L.from) continue; if (L.to != null && bar >= L.to) continue;
        if (L.every && bar % L.every !== (L.off || 0)) continue;
        switch (L.role) {
          case 'pad': ch.slice(0, L.n || 3).forEach(function (cd) { ev.push([b0, beatsPerBar, scaleNote(mode, root, cd, oct), vol, inst]); }); break;
          case 'chords': (L.rhythm || [0]).forEach(function (bt) { ch.slice(0, L.n || 3).forEach(function (cd) { ev.push([b0 + bt, L.len || 1, scaleNote(mode, root, cd, oct), vol, inst]); }); }); break;
          case 'arp': {
            var steps = (L.step ? beatsPerBar / L.step : beatsPerBar * 2), pat = L.pat || [0, 1, 2, 1];
            for (var s = 0; s < steps; s++) { var idx = pat[s % pat.length]; var cd = ch[idx % ch.length]; var oo = oct + Math.floor(idx / ch.length); if (L.skip && r() < L.skip) continue; ev.push([b0 + s * (L.step || .5), (L.step || .5) * 1.4, scaleNote(mode, root, cd, oo), vol * (s % 4 === 0 ? 1 : .8), inst]); }
            break;
          }
          case 'bass': {
            var rh = L.rhythm || [0, 2];
            rh.forEach(function (bt, i) { var deg = (L.fifths && i % 2) ? d + 4 : d; ev.push([b0 + bt, L.len || 1.5, scaleNote(mode, root, deg, oct), vol, inst]); }); break;
          }
          case 'melody': {
            var phrase = L.phrase || 2, pb = bar % phrase, seedBar = Math.floor(bar / phrase);
            var rr = DB.rng((S.seed || 1) * 131 + li * 17 + (L.vary ? seedBar : 0) * 7 + pb * 3 + 1);
            var pos = 0, rhy = L.rhy || [1, 1, 2, .5, .5, 1];
            var guard = 0;
            while (pos < beatsPerBar - .01 && guard++ < 20) {
              var dur = rhy[Math.floor(rr() * rhy.length)]; if (pos + dur > beatsPerBar) dur = beatsPerBar - pos;
              if (rr() < (L.rest == null ? .12 : L.rest)) { pos += dur; continue; }
              var strong = (pos % 2 === 0);
              var cand = strong ? ch.concat([ch[0] + 7]) : [lastDeg + 1, lastDeg - 1, lastDeg, lastDeg + 2, lastDeg - 2];
              var nd = cand[Math.floor(rr() * cand.length)];
              nd = DB.clamp(nd, 0 + (L.lo || 0), (L.hi == null ? 11 : L.hi)); lastDeg = nd;
              ev.push([b0 + pos, dur * (L.legato || .95), scaleNote(mode, root, nd, oct), vol, inst]);
              pos += dur;
            }
            break;
          }
          case 'drums': {
            var K = L.kit || 'march';
            var bt;
            for (bt = 0; bt < beatsPerBar; bt += .5) {
              var on = bt % 1 === 0, bi = Math.floor(bt);
              if (K === 'march') { if (on && bi % 2 === 0) ev.push([b0 + bt, .2, 40, vol, 'kick']); if (on && bi % 2 === 1) ev.push([b0 + bt, .2, 0, vol * .8, 'snare']); if (!on) ev.push([b0 + bt, .1, 0, vol * .5, 'hat']); }
              else if (K === 'soft') { if (on && bi === 0) ev.push([b0 + bt, .2, 40, vol * .8, 'kick']); if (on && bi % 2 === 1 && beatsPerBar === 4) ev.push([b0 + bt, .1, 0, vol * .35, 'hat']); }
              else if (K === 'waltz') { if (on && bi === 0) ev.push([b0 + bt, .2, 40, vol, 'kick']); if (on && bi > 0) ev.push([b0 + bt, .1, 0, vol * .4, 'hat']); }
              else if (K === 'battle') { if (on && (bi === 0 || bi === 2)) ev.push([b0 + bt, .2, 40, vol, 'kick']); if (on && (bi === 1 || bi === 3)) ev.push([b0 + bt, .2, 0, vol, 'snare']); ev.push([b0 + bt, .1, 0, vol * .4, 'hat']); if (!on && r() < .25) ev.push([b0 + bt, .2, 50, vol * .6, 'kick']); }
              else if (K === 'war') { if (on) ev.push([b0 + bt, .3, 55 + (bi % 2) * 4, vol, 'tom']); if (!on && bi === 3) ev.push([b0 + bt, .3, 60, vol * .7, 'tom']); }
              else if (K === 'pulse') { if (on) ev.push([b0 + bt, .2, 38, vol * (bi === 0 ? 1 : .5), 'kick']); }
              else if (K === 'jig') { var js = bt * 2; if (js % 3 === 0) ev.push([b0 + bt, .2, 40, vol * .8, 'kick']); if (!on) ev.push([b0 + bt, .1, 0, vol * .35, 'hat']); }
            }
            break;
          }
          case 'wind': ev.push([b0, beatsPerBar, 600 + r() * 700, vol, 'wind']); break;
          case 'bells': {
            [0, 1.5, 2.5].forEach(function (bt, i) { if (r() < (L.p == null ? .6 : L.p)) ev.push([b0 + bt, 2, scaleNote(mode, root, ch[i % 3] + 7, oct), vol, 'bell']); }); break;
          }
        }
      }
    });
    return { events: ev, beats: bars * beatsPerBar };
  }
  var NAMES_VEL = {};
  AU.songs = {};
  AU.def = function (name, S) { AU.songs[name] = S; };
  var sched = { timer: null, song: null, t0: 0, beat0: 0, idx: 0, nextLoop: 0 };
  function startSong(name, fade) {
    var S = AU.songs[name]; if (!S) { stopSong(.8); return; }
    var c = AU.ctx;
    stopSong(fade == null ? .8 : fade, true);
    var c0 = compose(S); c0.events.sort(function (a, b) { return a[0] - b[0]; });
    var bus = c.createGain(); bus.gain.value = 0; bus.connect(AU.mus); var rv = c.createGain(); rv.gain.value = S.rev == null ? .55 : S.rev; bus.connect(rv); rv.connect(AU.rev);
    bus.gain.linearRampToValueAtTime(1, c.currentTime + (fade == null ? .8 : fade) + .3);
    var spb = 60 / S.bpm;
    sched = { song: name, S: S, comp: c0, bus: bus, t0: c.currentTime + .15, spb: spb, idx: 0, loops: 0, timer: null, swing: S.swing || 0 };
    sched.timer = setInterval(tick, 30); tick();
  }
  function tick() {
    var c = AU.ctx; if (!sched.S) return;
    var look = c.currentTime + .35, ev = sched.comp.events, spb = sched.spb;
    while (true) {
      if (sched.idx >= ev.length) { sched.idx = 0; sched.t0 += sched.comp.beats * spb; sched.loops++; }
      var e = ev[sched.idx]; var t = sched.t0 + e[0] * spb; if (sched.swing && (e[0] % 1) === .5) t += sched.swing * spb;
      if (t > look) break;
      if (t >= c.currentTime - .02) { var f = INST[e[4]]; if (f) { try { f(c, sched.bus, e[4] === 'kick' || e[4] === 'snare' || e[4] === 'hat' ? 1 : (e[4] === 'tom' ? mtof(e[2]) : mtof(e[2])), Math.max(t, c.currentTime), e[1] * spb, e[3] * (sched.S.gain || 1)); } catch (er) { } } }
      sched.idx++;
    }
  }
  function stopSong(fade, keepName) {
    if (sched.timer) clearInterval(sched.timer);
    if (sched.bus && AU.ctx) { var b = sched.bus, c = AU.ctx; b.gain.cancelScheduledValues(c.currentTime); b.gain.setValueAtTime(b.gain.value, c.currentTime); b.gain.linearRampToValueAtTime(0, c.currentTime + (fade || .5)); setTimeout(function () { try { b.disconnect(); } catch (e) { } }, ((fade || .5) + .5) * 1000); }
    sched = { timer: null, S: null }; if (!keepName) AU.cur = null;
  }
  AU.music = function (name, fade) {
    if (AU.cur === name) return; AU.cur = name;
    if (!AU.ctx) { AU.pendingSong = name; return; }
    if (!name) { stopSong(fade || 1); return; }
    startSong(name, fade);
  };
  AU.stopMusic = function (fade) { AU.cur = null; AU.pendingSong = null; stopSong(fade || 1); };
  AU.duck = function (on) { if (AU.mus) AU.mus.gain.setTargetAtTime(on ? AU.vol.music * .35 : AU.vol.music, AU.ctx.currentTime, .15); };
  AU.MODES = MODES;
})();
