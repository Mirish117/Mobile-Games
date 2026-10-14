/* Sunderbell - audio: chiptune tracker player, synthesised sound effects and formant "cartoon voices".
   Everything is generated live from the data (songs / sfx / voices), so the editor can change it. */
(function () {
  'use strict';
  var SB = window.SB;
  var A = SB.audio = { ctx: null, data: null, vol: { music: .6, sfx: .8, voice: .8 }, muted: false, song: null, songId: null };
  try { var sv = JSON.parse(localStorage.getItem('sunderbell.audio') || 'null'); if (sv) { A.vol = Object.assign(A.vol, sv.vol || {}); A.muted = !!sv.muted; } } catch (e) { }
  A.save = function () { try { localStorage.setItem('sunderbell.audio', JSON.stringify({ vol: A.vol, muted: A.muted })); } catch (e) { } };
  A.use = function (data) { A.data = data; };

  var waves = {}, noiseBuf = null;
  A.unlock = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    var c = A.ctx = new C();
    var comp = c.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3; comp.connect(c.destination);
    A.master = c.createGain(); A.master.gain.value = A.muted ? 0 : 1; A.master.connect(comp);
    A.musBus = c.createGain(); A.musBus.gain.value = A.vol.music * .55; A.musBus.connect(A.master);
    A.sfxBus = c.createGain(); A.sfxBus.gain.value = A.vol.sfx; A.sfxBus.connect(A.master);
    A.voiceBus = c.createGain(); A.voiceBus.gain.value = A.vol.voice; A.voiceBus.connect(A.master);
    var len = c.sampleRate * 1; noiseBuf = c.createBuffer(1, len, c.sampleRate);
    var nd = noiseBuf.getChannelData(0); for (var i = 0; i < len; i++) nd[i] = Math.random() * 2 - 1;
    [.125, .25, .5].forEach(function (duty) {
      var n = 64, re = new Float32Array(n), im = new Float32Array(n);
      for (var k = 1; k < n; k++) { re[k] = Math.sin(2 * Math.PI * k * duty) / (k * Math.PI); im[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (k * Math.PI); }
      waves[duty] = c.createPeriodicWave(re, im);
    });
    if (A.pending) { var p = A.pending; A.pending = null; A.music(p); }
  };
  ['touchstart', 'pointerdown', 'mousedown', 'keydown'].forEach(function (e) { window.addEventListener(e, function () { A.unlock(); }, { passive: true }); });
  A.setVol = function (k, v) { A.vol[k] = v; if (A.ctx) { if (k === 'music') A.musBus.gain.value = v * .55; if (k === 'sfx') A.sfxBus.gain.value = v; if (k === 'voice') A.voiceBus.gain.value = v; } A.save(); };
  A.setMuted = function (m) { A.muted = m; if (A.master) A.master.gain.value = m ? 0 : 1; A.save(); };

  var NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  A.freq = function (n) {
    var m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(n); if (!m) return 0;
    var v = NOTE[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12;
    return 440 * Math.pow(2, (v - 69) / 12);
  };
  function osc(type, f, t) {
    var o = A.ctx.createOscillator();
    if (type === 'pulse12') o.setPeriodicWave(waves[.125]); else if (type === 'pulse25') o.setPeriodicWave(waves[.25]); else if (type === 'pulse50' || type === 'square') o.setPeriodicWave(waves[.5]);
    else o.type = type === 'saw' ? 'sawtooth' : (type || 'square');
    o.frequency.setValueAtTime(f, t); return o;
  }
  function noise(t, dur) { var s = A.ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(t, Math.random() * .5); s.stop(t + dur + .05); return s; }

  /* ================= music ================= */
  function drum(kind, t, vol, bus) {
    var c = A.ctx, g = c.createGain(); g.connect(bus);
    if (kind === 'k') {
      var o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + .12);
      g.gain.setValueAtTime(vol * 1.4, t); g.gain.exponentialRampToValueAtTime(.001, t + .16); o.connect(g); o.start(t); o.stop(t + .18);
    } else {
      var n = noise(t, .3), f = c.createBiquadFilter(), d = kind === 's' ? .14 : kind === 'o' ? .22 : .035;
      f.type = kind === 's' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 's' ? 1800 : 7000; f.Q.value = kind === 's' ? .8 : .5;
      n.connect(f); f.connect(g); g.gain.setValueAtTime(vol * (kind === 's' ? .9 : .45), t); g.gain.exponentialRampToValueAtTime(.001, t + d);
    }
  }
  function Player(song) {
    var c = A.ctx, P = this; P.song = song; P.step = 0; P.bus = c.createGain(); P.bus.gain.value = 1; P.bus.connect(A.musBus);
    P.next = c.currentTime + .08; P.voices = []; P.stopped = false;
    var bars = 0; song.channels.forEach(function (ch) { bars = Math.max(bars, ch.notes.length); }); P.total = bars * (song.steps || 16);
    P.parsed = song.channels.map(function (ch) { var all = []; ch.notes.forEach(function (b) { all = all.concat(b.trim().split(/\s+/)); }); while (all.length < P.total) all.push('.'); return all; });
  }
  Player.prototype.noteOn = function (ci, tok, t, dur) {
    var ch = this.song.channels[ci], c = A.ctx, v = this.voices[ci];
    if (v) { v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0, t, .012); v.o.stop(t + .1); this.voices[ci] = null; }
    if (ch.wave === 'noise') { drum(tok, t, ch.vol, this.bus); return; }
    var f = A.freq(tok); if (!f) return;
    var o = osc(ch.wave, f, t), g = c.createGain(), vol = ch.vol * .5;
    if (ch.wave === 'triangle') vol *= 1.6;
    var env = ch.env || 'pluck';
    g.gain.setValueAtTime(0, t);
    if (env === 'soft') { g.gain.linearRampToValueAtTime(vol, t + .06); }
    else if (env === 'bell') { g.gain.linearRampToValueAtTime(vol, t + .005); g.gain.setTargetAtTime(vol * .05, t + .01, .35); }
    else if (env === 'hold') { g.gain.linearRampToValueAtTime(vol, t + .01); }
    else { g.gain.linearRampToValueAtTime(vol, t + .005); g.gain.setTargetAtTime(vol * .6, t + .02, .08); }
    if (ch.vib) { var l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(ch.vib * 10, t + .25); l.connect(lg); lg.connect(o.detune); l.start(t); l.stop(t + 8); }
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 30);
    this.voices[ci] = { o: o, g: g };
  };
  Player.prototype.noteOff = function (ci, t) { var v = this.voices[ci]; if (!v) return; v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0, t, .02); v.o.stop(t + .2); this.voices[ci] = null; };
  Player.prototype.tick = function () {
    if (this.stopped) return; var c = A.ctx, s = this.song, stepDur = 60 / (s.bpm || 120) / 4;
    while (this.next < c.currentTime + .15) {
      var st = this.step % this.total, t = this.next;
      if (s.swing && st % 2 === 1) t += stepDur * s.swing * .5;
      for (var ci = 0; ci < this.parsed.length; ci++) {
        var tok = this.parsed[ci][st];
        if (tok === '-' || tok == null) continue;
        if (tok === '.') { if (s.channels[ci].wave !== 'noise') this.noteOff(ci, t); continue; }
        this.noteOn(ci, tok, t, stepDur);
      }
      if (this.onStep) this.onStep(st);
      this.step++; this.next += stepDur;
      if (this.step >= this.total && s.loop === false) { this.stop(.5); return; }
    }
  };
  Player.prototype.stop = function (fade) {
    if (this.stopped) return; this.stopped = true; var c = A.ctx, t = c.currentTime, self = this;
    this.bus.gain.setTargetAtTime(0, t, (fade || .2) / 3);
    setTimeout(function () { self.voices.forEach(function (v) { if (v) try { v.o.stop(); } catch (e) { } }); self.bus.disconnect(); }, (fade || .2) * 1000 + 300);
  };
  setInterval(function () { if (A.song && A.ctx) A.song.tick(); }, 25);
  /* play a song by id ('none' stops). restart=true forces replay of the same id */
  A.music = function (id, restart, songObj) {
    if (!A.ctx) { A.pending = id; A.pendingObj = songObj; return; }
    if (!id || id === 'none') { if (A.song) A.song.stop(.8); A.song = null; A.songId = null; return; }
    if (A.songId === id && A.song && !A.song.stopped && !restart) return;
    var s = songObj || (A.data && A.data.songs[id]); if (!s) return;
    if (A.song) A.song.stop(.5);
    A.song = new Player(s); A.songId = id;
    return A.song;
  };
  A.stopMusic = function () { A.music('none'); };

  /* ================= sound effects ================= */
  function playSfx(d, t, bus, mul) {
    var c = A.ctx; mul = mul || 1; t += d.delay || 0;
    if (d.kind === 'mix') { d.parts.forEach(function (p) { playSfx(p, t, bus, mul); }); return; }
    if (d.kind === 'seq') { var tt = t; d.notes.forEach(function (n) { var f = A.freq(n[0]); playSfx({ kind: 'synth', wave: d.wave, f0: f, f1: f, dur: n[1], vol: d.vol }, tt, bus, mul); tt += n[1] * .92; }); return; }
    var g = c.createGain(); g.connect(bus); var vol = (d.vol == null ? .3 : d.vol) * mul, dur = d.dur || .1;
    if (d.kind === 'bell') {
      var parts = [[.5, .5, 1.4], [1, 1, 1], [1.19, .55, .8], [1.5, .4, .7], [2, .5, .6], [2.51, .25, .45], [3.01, .18, .35], [4.17, .1, .25]];
      parts.forEach(function (p) { var o = c.createOscillator(), pg = c.createGain(); o.type = 'sine'; o.frequency.value = d.f * p[0]; pg.gain.setValueAtTime(0, t); pg.gain.linearRampToValueAtTime(vol * p[1] * .5, t + .004); pg.gain.exponentialRampToValueAtTime(.0005, t + dur * p[2]); o.connect(pg); pg.connect(g); o.start(t); o.stop(t + dur * p[2] + .1); });
      g.gain.value = 1; return;
    }
    if (d.kind === 'noise') {
      var n = noise(t, dur), f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = d.q || 1;
      f.frequency.setValueAtTime(d.f0 || 1000, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, d.f1 || d.f0 || 1000), t + dur);
      n.connect(f); f.connect(g);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      if (d.trem) { var l = c.createOscillator(), lg = c.createGain(); l.frequency.value = d.trem; lg.gain.value = vol * .5; l.connect(lg); lg.connect(g.gain); l.start(t); l.stop(t + dur); }
      return;
    }
    var o = osc(d.wave === 'square' && d.duty ? (d.duty <= .13 ? 'pulse12' : d.duty <= .26 ? 'pulse25' : 'pulse50') : d.wave, d.f0 || 440, t);
    if (d.f1 && d.f1 !== d.f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, d.f1), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * .6, t + (d.a || .004)); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); o.start(t); o.stop(t + dur + .05);
  }
  var lastSfx = {};
  A.sfx = function (id, o) {
    if (!A.ctx || !A.data) return; var d = A.data.sfx[id]; if (!d) return;
    var now = A.ctx.currentTime; if (lastSfx[id] && now - lastSfx[id] < .035) return; lastSfx[id] = now;
    playSfx(d, now + .005, A.sfxBus, o && o.vol);
  };
  A.sfxDef = function (d) { if (!A.ctx) return; playSfx(d, A.ctx.currentTime + .005, A.sfxBus); };

  /* ================= voices (formant synthesis) ================= */
  var FORM = { a: [730, 1090, 2440], e: [530, 1840, 2480], i: [300, 2200, 2950], o: [570, 840, 2410], u: [320, 870, 2240], h: [600, 1400, 2500] };
  function utter(v, vowels, len, p0, p1, hAmt, vol, t) {
    var c = A.ctx; if (!v || !v.pitch) return;
    var base = v.pitch, size = v.size || 1, out = c.createGain(); out.connect(A.voiceBus);
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(vol, t + .012); out.gain.setValueAtTime(vol, t + len * .6); out.gain.exponentialRampToValueAtTime(.001, t + len);
    var src = c.createOscillator(); src.type = v.wave === 'square' ? 'square' : 'sawtooth';
    src.frequency.setValueAtTime(base * p0, t); src.frequency.exponentialRampToValueAtTime(base * p1, t + len);
    var srcG = c.createGain(); srcG.gain.value = .6; src.connect(srcG);
    if (v.gravel) { var am = c.createOscillator(), ag = c.createGain(); am.type = 'square'; am.frequency.value = 28 + Math.random() * 20; ag.gain.value = .35 * v.gravel; am.connect(ag); ag.connect(srcG.gain); am.start(t); am.stop(t + len + .05); }
    var nz = noise(t, len), nzG = c.createGain(); nzG.gain.value = (v.breath || 0) * .5; nz.connect(nzG);
    var vs = vowels.split(''), f0 = FORM[vs[0]] || FORM.a, f1 = FORM[vs[vs.length - 1]] || f0;
    [0, 1, 2].forEach(function (k) {
      var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = k === 0 ? 6 : 9;
      bp.frequency.setValueAtTime(f0[k] * size, t); if (vs.length > 1) bp.frequency.linearRampToValueAtTime(f1[k] * size, t + len * .8);
      var gk = c.createGain(); gk.gain.value = [1, .7, .35][k] * 2.2;
      srcG.connect(bp); nzG.connect(bp); bp.connect(gk); gk.connect(out);
    });
    if (hAmt) { var hn = noise(t - .0, .06), hf = c.createBiquadFilter(), hg = c.createGain(); hf.type = 'bandpass'; hf.frequency.value = 1800 * size; hf.Q.value = .8; hg.gain.setValueAtTime(hAmt * vol * 1.4, t); hg.gain.exponentialRampToValueAtTime(.001, t + .06); hn.connect(hf); hf.connect(hg); hg.connect(A.voiceBus); }
    src.start(t); src.stop(t + len + .05);
  }
  A.voice = function (who, kind) {
    if (!A.ctx || !A.data) return; var v = A.data.voices[who]; if (!v || !v.grunts) return; var g = v.grunts[kind]; if (!g) return;
    utter(v, g.v || 'a', g.len || .15, g.p0 || 1.2, g.p1 || 1, g.h || 0, .55, A.ctx.currentTime + .005);
  };
  A.voiceDef = function (v, kind) { if (!A.ctx) return; var g = v.grunts && v.grunts[kind]; if (!g) return; utter(v, g.v || 'a', g.len || .15, g.p0 || 1.2, g.p1 || 1, g.h || 0, .55, A.ctx.currentTime + .005); };
  /* one talk blip; ch is the character just typed (used to vary pitch a little) */
  A.blip = function (who, ch, vdef) {
    if (!A.ctx || !A.data) return; var v = vdef || A.data.voices[who] || A.data.voices.narrator; if (!v) return; var tk = v.talk || {};
    if (tk.tick || !v.pitch) { playSfx({ kind: 'synth', wave: 'square', duty: .5, f0: 1100, f1: 1100, dur: .015, vol: .08 * (tk.vol || .5) * 2 }, A.ctx.currentTime, A.voiceBus); return; }
    var vs = tk.vowels || 'a', code = (ch || 'a').toLowerCase().charCodeAt(0) || 97;
    var vowel = vs[code % vs.length], semis = ((code * 7) % 5 - 2) * (tk.jitter || 2) / 2 + (ch === '?' ? 4 : ch === '!' ? 3 : 0);
    var p = Math.pow(2, semis / 12);
    utter(v, vowel, tk.len || .07, p * 1.04, p * .97, 0, (tk.vol || .5) * .55, A.ctx.currentTime + .003);
  };
})();
