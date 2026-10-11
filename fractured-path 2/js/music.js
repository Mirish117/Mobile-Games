/* The Fractured Path: original chiptune score.
   A small sequencer writes every song live with Web Audio: pulse lead, harmony,
   triangle bass, arpeggio, soft pad and noise drums. Songs are written as
   scale degrees (1-7, ' = octave up, , = octave down, # / b = accidental,
   - = hold, . = rest). Eight eighth-note slots per bar. */
(function (FP) {
  'use strict';
  var M = FP.music = {};
  var MODES = {
    major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
    mixo: [0, 2, 4, 5, 7, 9, 10], harm: [0, 2, 3, 5, 7, 8, 11], phryg: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11]
  };
  var AC = null, bus = null, cur = null, pending = null, timer = null, noiseBuf = null, waves = {};
  var duck = null;

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function degMidi(song, tok) {
    var m = /^([1-7])([#b]?)([',`]*)$/.exec(tok);
    if (!m) return null;
    var sc = MODES[song.mode || 'major'], d = +m[1] - 1, o = 0, i;
    for (i = 0; i < m[3].length; i++) o += m[3][i] === "'" ? 1 : -1;
    return song.root + sc[d] + 12 * o + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }
  function chordNotes(song, ch) {
    var m = /^([1-7])([Mmd]?)$/.exec(String(ch)), sc = MODES[song.mode || 'major'];
    var d = +m[1] - 1, r = song.root + sc[d];
    var t = sc[(d + 2) % 7] + (d + 2 > 6 ? 12 : 0) - sc[d], f = sc[(d + 4) % 7] + (d + 4 > 6 ? 12 : 0) - sc[d];
    if (m[2] === 'M') { t = 4; f = 7; } else if (m[2] === 'm') { t = 3; f = 7; } else if (m[2] === 'd') { t = 3; f = 6; }
    return [r, r + t, r + f];
  }
  function pulse(d) {
    var k = String(d);
    if (waves[k]) return waves[k];
    var n = 48, re = new Float32Array(n), im = new Float32Array(n);
    for (var i = 1; i < n; i++) { re[i] = Math.sin(2 * Math.PI * i * d) / (i * Math.PI); im[i] = (1 - Math.cos(2 * Math.PI * i * d)) / (i * Math.PI); }
    waves[k] = AC.createPeriodicWave(re, im);
    return waves[k];
  }
  function mkNoise() {
    var n = AC.sampleRate, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf = b;
  }
  function note(dest, t, f, len, type, vol, o) {
    o = o || {};
    var osc = AC.createOscillator(), g = AC.createGain();
    if (type === 'tri') osc.type = 'triangle'; else if (type === 'sine') osc.type = 'sine'; else osc.setPeriodicWave(pulse(type));
    osc.frequency.setValueAtTime(f, t);
    var a = o.a || 0.006, rel = o.r || 0.05, sus = o.s === undefined ? 0.72 : o.s;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.linearRampToValueAtTime(vol * sus, t + a + Math.min(0.18, len * 0.5));
    g.gain.setValueAtTime(vol * sus, t + Math.max(a + 0.02, len - rel));
    g.gain.linearRampToValueAtTime(0.0001, t + len);
    osc.connect(g); g.connect(dest);
    if (o.vib && len > 0.3) {
      var l = AC.createOscillator(), lg = AC.createGain();
      l.frequency.value = 5.4; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(7, t + len * 0.7);
      l.connect(lg); lg.connect(osc.detune); l.start(t); l.stop(t + len + 0.05);
    }
    osc.start(t); osc.stop(t + len + 0.05);
  }
  function drum(dest, t, kind, v) {
    if (kind === 'k') {
      var o = AC.createOscillator(), g = AC.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(0.5 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.18);
    } else {
      var s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      var f = AC.createBiquadFilter(), g2 = AC.createGain();
      if (kind === 's') { f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.7; g2.gain.setValueAtTime(0.34 * v, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.13); }
      else { f.type = 'highpass'; f.frequency.value = 7000; g2.gain.setValueAtTime(0.13 * v, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.045); }
      s.connect(f); f.connect(g2); g2.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + 0.16);
    }
  }
  var DR = {
    none: [''],
    soft: ['k...h...'], march: ['k.h.s.h.'], drive: ['k.hks.h.', 'k.h.s.hs'], gallop: ['kkhkskhk', 'k.hkskhs'],
    slow: ['k.......'], heart: ['k..k....'], sway: ['k..hs..h']
  };

  function makeBus(song) {
    var g = AC.createGain(); g.gain.value = 0.0001;
    var dl = AC.createDelay(1), fb = AC.createGain(), wet = AC.createGain();
    var beat = 60 / song.bpm;
    dl.delayTime.value = beat * 0.75; fb.gain.value = 0.3; wet.gain.value = song.echo === undefined ? 0.2 : song.echo;
    var lead = AC.createGain(); lead.gain.value = 1;
    lead.connect(g); lead.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(g);
    g.connect(FP.audio.musicGain);
    return { out: g, lead: lead };
  }

  function stepSong(st, t) {
    var s = st.song, spb = s.spb || 8, bar = st.bar, step = st.step, b = bus ? st.bus : st.bus;
    var L = (60 / s.bpm) / (spb / 4), nbars = s.chords.length;
    var swing = (s.swing || 0) * L * (step % 2 ? 1 : 0);
    var tt = t + swing;
    var ch = s.chords[bar % nbars], notes = chordNotes(s, ch);
    function tokAt(arr) {
      if (!arr) return null;
      var line = arr[bar % arr.length]; if (!line) return null;
      var toks = line.trim().split(/\s+/);
      return toks[step] === undefined ? '.' : toks[step];
    }
    function lenOf(arr) {
      var line = arr[bar % arr.length].trim().split(/\s+/), n = 1;
      while (step + n < line.length && line[step + n] === '-') n++;
      return n;
    }
    var tk = tokAt(s.mel);
    if (tk && tk !== '.' && tk !== '-') {
      var m = degMidi(s, tk);
      if (m !== null) note(b.lead, tt, mtof(m), L * lenOf(s.mel) * 0.96, s.leadDuty || 0.25, s.leadVol || 0.1, { vib: true });
    }
    var hk = tokAt(s.harm);
    if (hk && hk !== '.' && hk !== '-') {
      var hm = degMidi(s, hk);
      if (hm !== null) note(b.lead, tt, mtof(hm), L * lenOf(s.harm) * 0.96, 0.5, s.harmVol || 0.055, { s: 0.6 });
    }
    var bl = s.bass || 'pulse';
    if (bl !== 'none') {
      var r = notes[0]; while (r > s.root - 10) r -= 12; while (r < s.root - 24) r += 12;
      var bv = s.bassVol || 0.17;
      if (bl === 'pulse') { if (step === 0 || step === 4) note(b.out, tt, mtof(r), L * 3.6, 'tri', bv, { s: 0.8 }); else if (step === 6 && spb === 8) note(b.out, tt, mtof(r + 7), L * 1.8, 'tri', bv * 0.8); }
      else if (bl === 'drive') { if (step % 2 === 0) note(b.out, tt, mtof(r + (step === 6 ? 12 : 0)), L * 1.7, 'tri', bv, { s: 0.7 }); }
      else if (bl === 'walk') { var wk = [0, 0, 7, 7, 12, 7, notes[1] - notes[0], 7][step % 8]; if (step % 2 === 0) note(b.out, tt, mtof(r + wk), L * 1.8, 'tri', bv); }
      else if (bl === 'half') { if (step === 0) note(b.out, tt, mtof(r), L * 7.5, 'tri', bv, { s: 0.85, a: 0.02 }); }
      else if (bl === 'sway') { if (step === 0) note(b.out, tt, mtof(r), L * 2.6, 'tri', bv); if (step === 3) note(b.out, tt, mtof(r + 7), L * 1.6, 'tri', bv * 0.8); if (step === 6) note(b.out, tt, mtof(r + 12), L * 1.6, 'tri', bv * 0.7); }
    }
    if (s.arp) {
      var base = notes[0] + (s.arpOct === undefined ? 0 : s.arpOct * 12), pat = s.arpPat || [0, 1, 2, 1, 0, 1, 2, 1], q = pat[step % pat.length];
      if (q >= 0) { var an = q < 3 ? notes[q] : notes[q - 3] + 12; note(b.out, tt, mtof(an + (s.arpOct || 0) * 12), L * 0.9, s.arpDuty || 0.125, s.arpVol || 0.04, { s: 0.5 }); }
    }
    if (s.pad && step === 0) {
      for (var i = 0; i < 3; i++) note(b.out, tt, mtof(notes[i] - 12 + (s.padOct || 0) * 12), L * spb * 0.98, 'sine', s.padVol || 0.045, { a: 0.25, r: 0.4, s: 1 });
    }
    var dp = DR[s.drum || 'none'];
    if (dp && dp[0]) {
      var pt = dp[bar % dp.length], c = pt[step % pt.length];
      if (c && c !== '.') drum(b.out, tt, c, s.drumVol || 1);
    }
  }
  function tick() {
    if (!cur || !AC) return;
    var guard = 0;
    while (cur.next < AC.currentTime + 0.3 && guard++ < 64) {
      stepSong(cur, cur.next);
      var spb = cur.song.spb || 8, L = (60 / cur.song.bpm) / (spb / 4);
      cur.next += L; cur.step++;
      if (cur.step >= spb) {
        cur.step = 0; cur.bar++;
        if (cur.bar >= cur.song.chords.length) {
          if (cur.song.once) { var cb = cur.done; cur.finished = true; setTimeout(function () { if (cb) cb(); }, Math.max(0, (cur.next - AC.currentTime) * 1000)); clearInterval(timer); timer = null; return; }
          cur.bar = cur.song.loopFrom || 0;
        }
      }
    }
  }
  function startSong(name, o) {
    var song = M.songs[name]; if (!song) return null;
    var b = makeBus(song), t0 = AC.currentTime + 0.06;
    var st = { name: name, song: song, bus: b, bar: 0, step: 0, next: t0, done: o && o.done };
    var vol = (song.vol === undefined ? 1 : song.vol);
    b.out.gain.setValueAtTime(0.0001, t0);
    b.out.gain.linearRampToValueAtTime(vol, t0 + (song.once ? 0.01 : 0.5));
    return st;
  }
  function fadeOut(st) {
    if (!st) return;
    try {
      var t = AC.currentTime;
      st.bus.out.gain.cancelScheduledValues(t); st.bus.out.gain.setValueAtTime(Math.max(0.0001, st.bus.out.gain.value), t);
      st.bus.out.gain.linearRampToValueAtTime(0.0001, t + 0.45);
      setTimeout(function () { try { st.bus.out.disconnect(); } catch (e) {} }, 700);
    } catch (e) {}
  }
  function ensureTimer() { if (!timer) timer = setInterval(tick, 40); }

  M.name = null;
  M.play = function (name) {
    M.name = name;
    if (!AC || !FP.settings.music) { pending = name; return; }
    if (cur && cur.name === name && !cur.finished) return;
    var old = cur; fadeOut(old);
    cur = startSong(name);
    ensureTimer();
  };
  M.stop = function () { M.name = null; pending = null; if (cur) { fadeOut(cur); cur = null; } if (timer) { clearInterval(timer); timer = null; } };
  M.jingle = function (name, done) {
    if (!AC || !FP.settings.music) { if (done) setTimeout(done, 300); return; }
    var prev = M.name, was = cur;
    if (was) { try { was.bus.out.gain.cancelScheduledValues(AC.currentTime); was.bus.out.gain.setValueAtTime(was.bus.out.gain.value, AC.currentTime); was.bus.out.gain.linearRampToValueAtTime(0.0001, AC.currentTime + 0.1); } catch (e) {} clearInterval(timer); timer = null; }
    var j = startSong(name, { done: function () { if (prev) { cur = null; M.name = null; M.play(prev); } if (done) done(); } });
    cur = j; ensureTimer();
  };
  M.refresh = function () {
    if (!AC) return;
    if (!FP.settings.music) { if (cur) { fadeOut(cur); cur = null; } if (timer) { clearInterval(timer); timer = null; } pending = M.name; }
    else if (!cur && (pending || M.name)) { var n = pending || M.name; pending = null; M.play(n); }
  };
  M.onReady = function () {
    AC = FP.audio.ctx; mkNoise();
    if (pending && FP.settings.music) { var n = pending; pending = null; M.play(n); }
  };

  /* ------------------------------------------------------------------ songs */
  var S = M.songs = {};

  /* The Fractured Path: title theme. A slow, aching melody that rises and refuses to resolve. */
  S.title = { bpm: 84, root: 57, mode: 'minor', swing: 0, echo: 0.28, drum: 'heart', bass: 'half', pad: true, arp: true, arpPat: [0, 1, 2, 4, 2, 1, 2, 1], arpVol: 0.03,
    chords: ['1', '6', '3', '7', '1', '6', '4', '5M', '1', '6', '3', '7', '4', '5M', '1', '5M'],
    mel: ['5 - - - 3 - 5 -', '6 - - 5 4 - - -', '5 - 3 - 5 - 7 -', '2\' - - - 7 - - -', '5 - - 6 5 - 3 -', '1\' - - 7 6 - 4 -', '4 - 6 - 1\' - 4 -', '3 - - - 2 - 7, -',
      '5 - - - 3\' - 5 -', '4\' - 3\' 1\' 6 - - -', '5 - 1\' - 3\' - 5 -', '2\' - 3\' 2\' 7 - - -', '6 - 1\' - 4\' - 6 -', '5 - 7 - 2\' - 7 -', '1\' - - 7 6 - 5 -', '3 - - - - - 7, -'],
    harm: ['. . . . . . . .', '. . . . . . . .', '. . . . . . . .', '. . . . . . . .', '. . . . . . . .', '. . . . . . . .', '. . . . . . . .', '. . . . . . . .',
      '3 - - - 1\' - 3 -', '2 - 1 - 4 - - -', '3 - - - 5 - 3 -', '7, - - - 5 - - -', '4 - - - 2\' - 4 -', '3 - 5 - 7 - 5 -', '3 - - 5 4 - 3 -', '1 - - - - - 5, -'] };

  /* Thistledown: a village that smells of bread and woodsmoke. Warm, rolling, a little wistful. */
  S.thistledown = { bpm: 104, root: 60, mode: 'major', swing: 0.12, echo: 0.16, drum: 'sway', drumVol: 0.6, bass: 'sway', arp: false, harmVol: 0.05,
    chords: ['1', '5', '6', '4', '1', '5', '4', '5', '4', '1', '5', '6', '4', '1', '5', '1'],
    mel: ['3 - 5 - 1\' - 5 3', '7 - 5 - 2\' - 7 5', '1\' - 6 3 5 - 3 -', '6 - 1\' - 4\' - 3\' 1\'', '3 - 5 - 1\' - 3\' -', '2\' - 7 - 5 - 7 -', '6 - 1\' - 6 - 4 -', '5 - 7 - 2\' - . -',
      '6 - 4\' - 3\' - 1\' -', '1\' 3\' 5\' - 3\' - 1\' -', '2\' - 7 - 5 - 2\' -', '3\' - 1\' 6 3\' - 6 -', '4\' - 3\' - 1\' - 6 -', '5 - 3 5 1\' - 3\' 1\'', '2\' - 2\' 3\' 2\' - 7 -', '1\' - - - . . . .'],
    harm: ['1 - 3 - 5 - 3 1', '5, - 7, - 5 - 5, 7,', '3 - 1 - 3 - 1 -', '4 - 6 - 6 - 5 3', '1 - 3 - 5 - 5 -', '5, - 5, - 7, - 5, -', '4 - 6 - 4 - 2 -', '3 - 5 - 7 - . -',
      '4 - 6 - 5 - 3 -', '3 - 5 - 5 - 3 -', '5 - 5, - 7, - 5 -', '1 - 3 - 1 - 3 -', '6 - 5 - 3 - 4 -', '3 - 1 3 3 - 1 3', '7, - 7, 1 7, - 5, -', '3 - - - . . . .'] };

  /* Open Road: the overworld. A traveling tune with the horizon in it. */
  S.overworld = { bpm: 116, root: 62, mode: 'mixo', swing: 0.05, echo: 0.2, drum: 'march', drumVol: 0.7, bass: 'drive', arp: true, arpOct: 1, arpVol: 0.028,
    chords: ['1', '7', '4', '1', '1', '7', '4', '5', '6', '4', '1', '5', '6', '7', '4', '1'],
    mel: ['5 - 1\' - 3\' - 2\' 1\'', '2\' - 7 - 5 - . -', '6 - 1\' - 4\' - 3\' 1\'', '3\' - - - 5 - 3 -', '5 - 1\' - 3\' - 5\' 3\'', '2\' - 4\' - 7 - 2\' -', '1\' - 6 - 4\' - 6 1\'', '2\' - 7 - 5 - . -',
      '3\' - - 1\' 6 - 3 -', '4 - 6 - 1\' - 6 -', '5 - 3\' - 1\' - 3\' 5\'', '7 - 5 - 2\' - 7 5', '6 - 1\' - 3\' - 1\' 6', '7 - 2\' - 5\' - 3\' 2\'', '4\' - 3\' - 1\' - 6 -', '5 - 5 7 1\' - - -'],
    harm: ['3 - . - 5 - . -', '5, - . - 7, - . -', '4 - . - 6 - . -', '5 - . - 3 - . -', '3 - . - 5 - . -', '7, - . - 2 - . -', '6 - . - 4 - . -', '7, - . - 5, - . -', '1 - . - 3 - . -', '6 - . - 4 - . -', '3 - . - 5 - . -', '2 - . - 7, - . -', '4 - . - 6 - . -', '5 - . - 7 - . -', '6 - . - 3 - . -', '5 - . - . - . -'] };

  /* Cinderhold: the Ashen Court's home. Slow, proud, with a limp in the rhythm. */
  S.cinderhold = { bpm: 88, root: 62, mode: 'phryg', swing: 0, echo: 0.26, drum: 'slow', bass: 'half', pad: true, padVol: 0.05, arp: true, arpPat: [0, -1, 1, -1, 2, -1, 1, -1], arpVol: 0.03,
    chords: ['1', '1', '2', '1', '6', '5M', '1', '1', '1', '4', '2', '1', '6', '7', '5M', '1'],
    mel: ['1 - - 2 3 - - -', '5 - 4 - 3 - 2 -', '2 - 4 - 6 - 5 -', '4 - 3 - 2 - 1 -', '6 - 1\' - 3\' - 2\' -', '1\' - 7 - 5 - 7 -', '5 - . - 3 - 4 -', '1 - - - . . . .',
      '3 - 5 - 1\' - - 7', '6 - 4 - 6 - 1\' -', '4\' - 3\' - 2\' - 1\' -', '2\' - 1\' - 7 - 5 -', '6 - 1\' - 3\' - 1\' -', '7 - 2\' - 4\' - 2\' -', '1\' - 7 - 5 - 7 -', '1 - - - - - . .'] };

  /* Brinehaven: gulls, rope, lantern light on water. A sea shanty slowed to a walk. */
  S.brinehaven = { bpm: 96, root: 55, mode: 'major', swing: 0.2, echo: 0.2, drum: 'sway', drumVol: 0.55, bass: 'sway', arp: false,
    chords: ['1', '1', '4', '1', '1', '5', '1', '5', '4', '1', '4', '1', '6', '4', '5', '1'],
    mel: ['5 - 5 - 1\' - 5 -', '3 - 5 - 3 - 1 -', '4 - 6 - 1\' - 6 -', '5 - 3 - 1 - . -', '5 - 5 - 1\' - 3\' -', '2\' - 7 - 5 - 7 2\'', '1\' - 5 - 3 - 5 -', '7 - 2\' - 7 - 5 -',
      '6 - 1\' - 6 - 1\' -', '5 - 3 - 5 - 3 -', '4 - 6 - 1\' - 4\' -', '3\' - 1\' - 5 - 3 -', '6 - 3\' - 1\' - 3\' -', '6 - 1\' - 4\' - 6 -', '7 - 2\' - 7 - 5 -', '1\' - - - . . . .'],
    harm: ['3 - 3 - 3 - 3 -', '1 - 3 - 1 - 5, -', '1 - 4 - 4 - 4 -', '3 - 1 - 5, - . -', '3 - 3 - 3 - 5 -', '5 - 5 - 3 - 5 5', '3 - 3 - 1 - 3 -', '5 - 7 - 5 - 3 -', '4 - 4 - 4 - 4 -', '3 - 1 - 3 - 1 -', '2 - 4 - 4 - 6 -', '1 - 3 - 3 - 1 -', '4 - 1\' - 6 - 1\' -', '4 - 6 - 2 - 4 -', '5 - 5 - 5 - 3 -', '3 - - - . . . .'] };

  /* Whisperwood: sparse, mossy, a flute somewhere between the trunks. */
  S.forest = { bpm: 78, root: 64, mode: 'dorian', swing: 0, echo: 0.34, drum: 'none', bass: 'half', bassVol: 0.13, pad: true, padVol: 0.04, arp: true, arpPat: [0, 1, 2, 1, 3, 2, 1, 2], arpDuty: 0.25, arpVol: 0.03, leadDuty: 0.5, leadVol: 0.09,
    chords: ['1', '1', '4', '4', '1', '7', '6', '5', '1', '1', '4', '2', '6', '7', '1', '1'],
    mel: ['5 - - - 3 - . -', '2 - 3 - 5 - . -', '6 - - - 4 - 6 -', '1\' - - - . . . .', '5 - 6 - 1\' - 5 -', '7 - - - 5 - 2 -', '3 - 5 - 6 - 5 -', '3 - - - 2 - . -',
      '3 - 5 - 3\' - - -', '2\' - 1\' - 7 - 5 -', '6 - 1\' - 4\' - 6 -', '5 - 4\' - 2\' - 7 -', '6 - - - 1\' - 6 -', '5 - 7 - 2\' - 7 -', '1\' - - - 5 - 3 -', '1 - - - - - . .'] };

  /* Caves and ruins: low, close, water dripping somewhere. */
  S.cave = { bpm: 68, root: 48, mode: 'minor', swing: 0, echo: 0.4, drum: 'none', bass: 'half', bassVol: 0.14, pad: true, padVol: 0.05, arp: true, arpPat: [0, -1, -1, 2, -1, -1, 1, -1], arpOct: 1, arpDuty: 0.25, arpVol: 0.035, leadVol: 0.08,
    chords: ['1', '1', '6', '6', '4', '4', '5', '5'],
    mel: ['. . . . 5 - - -', '3 - - - . . 2 -', '. . . . 1\' - - -', '7 - - - 6 - . -', '. . 4 - - - 6 -', '5 - - - . . . .', '. . 7 - - - 2\' -', '1\' - - - . . . .'] };

  /* Highmoor: a hall of old stone and older promises. Stately, a little cold. */
  S.castle = { bpm: 84, root: 53, mode: 'major', swing: 0, echo: 0.3, drum: 'march', drumVol: 0.55, bass: 'pulse', pad: true, padVol: 0.04, arp: false, leadDuty: 0.5, harmVol: 0.06,
    chords: ['1', '5', '6', '3m', '4', '1', '4', '5', '6', '3m', '4', '1', '2', '5', '1', '1'],
    mel: ['1\' - - 7 1\' - 5 -', '5 - 7 - 2\' - 5 -', '6 - - 5 6 - 1\' -', '3\' - - 2\' 3\' - 7 -', '4\' - - 3\' 4\' - 6 -', '3\' - - 2\' 1\' - 5 -', '4\' - 6 - 1\' - 6 -', '7 - 2\' - 5 - . -',
      '6 - 1\' - 3\' - 1\' -', '7 - 3\' - 5\' - 3\' -', '4\' - 1\' - 6 - 4 -', '3 - 5 - 1\' - 5 -', '2\' - 4\' - 6 - 4\' -', '2\' - 7 - 5 - 7 -', '1\' - 3\' - 5\' - 3\' 1\'', '1\' - - - . . . .'],
    harm: ['5 - - 5 5 - 3 -', '7, - 5 - 7 - 7, -', '1 - - 1 4 - 3 -', '5 - - 5 5 - 5 -', '6 - - 6 6 - 4 -', '5 - - 5 3 - 3 -', '6 - 4 - 4 - 4 -', '5 - 7 - 7 - . -', '4 - 6 - 1\' - 6 -', '5 - 7 - 3\' - 7 -', '6 - 6 - 4 - 6 -', '1 - 3 - 3 - 3 -', '4 - 6 - 4 - 6 -', '5 - 5 - 7, - 5 -', '3 - 5 - 3\' - 5 3', '3 - - - . . . .'] };

  /* The Lamp Vaults / Archive: a hush with a heartbeat in it. */
  S.crypt = { bpm: 62, root: 54, mode: 'harm', swing: 0, echo: 0.45, drum: 'heart', drumVol: 0.5, bass: 'half', bassVol: 0.12, pad: true, padVol: 0.05, arp: true, arpPat: [0, -1, 1, -1, 2, -1, 1, -1], arpOct: 1, arpDuty: 0.5, arpVol: 0.03, leadVol: 0.075,
    chords: ['1', '1', '4', '5M', '1', '6', '4', '5M'],
    mel: ['5 - - - 4 - 3 -', '2 - - - 1 - . -', '6 - - - 1\' - 6 -', '7 - - - 5 - . -', '3 - 5 - 1\' - - 7', '6 - - - 4 - 6 -', '4 - 6 - 1\' - 6 -', '7 - - - . . . .'] };

  /* Battle: bright and urgent. The riff you hum in the shower after a hard fight. */
  S.battle = { bpm: 152, root: 57, mode: 'minor', swing: 0, echo: 0.1, drum: 'drive', drumVol: 0.85, bass: 'drive', bassVol: 0.17, arp: true, arpOct: 1, arpVol: 0.03, arpPat: [0, 1, 2, 1, 0, 1, 2, 1], leadDuty: 0.25,
    chords: ['1', '1', '6', '7', '1', '1', '4', '5M', '1', '6', '7', '1', '4', '5M', '1', '5M'],
    mel: ['5 5 1\' - 5 - 3 -', '5 5 1\' - 5 - 7 -', '6 6 3\' - 1\' - 6 -', '7 7 2\' - 7 - 5 -', '5 5 1\' - 3\' - 5\' -', '4\' 3\' 1\' - 3\' - 1\' -', '4\' - 6 - 1\' - 4\' -', '3\' - 2\' - 7 - 5 -',
      '1\' - 1\' 2\' 3\' - 1\' -', '6 - 6 7 1\' - 6 -', '7 - 7 1\' 2\' - 7 -', '1\' 7 1\' 3\' 5\' - 3\' -', '4\' 3\' 4\' 6\' 4\' - 3\' 4\'', '5\' 4\' 3\' 2\' 7 - 5 7', '1\' - 3\' - 5\' - 3\' 1\'', '7 - 7 - 5 - . -'],
    harm: ['3 - . 3 3 - 3 -', '3 - . 3 3 - 5 -', '1 - . 1 1 - 1 -', '2 - . 2 2 - 2 -', '3 - . 3 3 - 3 -', '3 - . 3 3 - 3 -', '4 - . 4 4 - 4 -', '5 - . 5 5 - 5 -', '3 - 3 - 5 - 3 -', '1 - 1 - 3 - 1 -', '2 - 2 - 4 - 2 -', '3 - 3 - 3 - 3 -', '2 - 2 - 2 - 2 -', '3 - 3 - 5, - 5, -', '3 - 3 - 3 - 3 -', '5, - 5, - 5, - . -'] };

  /* Boss: low, relentless, the leading tone leaning on you. */
  S.boss = { bpm: 164, root: 50, mode: 'harm', swing: 0, echo: 0.14, drum: 'gallop', drumVol: 0.9, bass: 'drive', bassVol: 0.18, arp: true, arpOct: 1, arpVol: 0.034, arpPat: [0, 2, 1, 2, 0, 2, 1, 2], leadDuty: 0.125, leadVol: 0.1,
    chords: ['1', '1', '6', '5M', '1', '1', '4', '5M', '1', '6', '7', '1', '6', '5M', '4', '5M'],
    mel: ['1\' - 1\' 7 1\' - 5 -', '1\' - 1\' 7 1\' - 3\' -', '6 - 6 5 6 - 4 -', '5 - 7# - 2\' - 5 -', '1\' - 3\' - 5\' - 3\' -', '4\' 3\' 2\' 1\' 7# - 5 -', '4 - 6 - 1\' - 6 -', '5 - 7# - 5 - 7# -',
      '3\' - 3\' 2\' 3\' - 1\' -', '6 - 6 5 6 - 1\' -', '7 - 7 6 7 - 2\' -', '1\' 7 6 5 3 - 5 -', '6 - 1\' - 3\' - 6 -', '5 - 7# - 2\' - 7# -', '4 - 6 - 1\' - 4\' -', '5 7# 2\' 4\' 3\' - - -'] };

  /* Sad theme: a few notes, left alone. */
  S.sorrow = { bpm: 62, root: 57, mode: 'minor', swing: 0, echo: 0.42, drum: 'none', bass: 'half', bassVol: 0.1, pad: true, padVol: 0.05, arp: true, arpPat: [0, 1, 2, 1, 2, 1, 0, 1], arpVol: 0.025, leadDuty: 0.5, leadVol: 0.085,
    chords: ['1', '6', '4', '5M', '1', '6', '3', '5M'],
    mel: ['3 - - - 5 - - -', '6 - - - 5 - 3 -', '4 - - - 6 - 1\' -', '7 - - - . . . .', '3 - 5 - 1\' - - -', '7 - 6 - 5 - 3 -', '5 - - - 3 - 2 -', '1 - - - . . . .'] };

  /* Hearth: inns and homes. Two lamps and a table. */
  S.hearth = { bpm: 80, root: 60, mode: 'major', swing: 0.1, echo: 0.2, drum: 'none', bass: 'sway', bassVol: 0.12, arp: true, arpPat: [0, 1, 2, 1, 2, 1, 0, 1], arpDuty: 0.25, arpVol: 0.04, leadDuty: 0.5, leadVol: 0.085,
    chords: ['1', '6', '4', '5', '1', '3m', '4', '1'],
    mel: ['3 - 5 - 1\' - 5 -', '6 - 1\' - 3\' - 1\' -', '4 - 6 - 1\' - 6 -', '5 - 7 - 2\' - 7 -', '1\' - 5 - 3 - 5 -', '7 - 5 - 3 - 5 -', '6 - 4 - 6 - 1\' -', '3 - - - . . . .'] };

  /* The Cinder Road: the villain-side travel theme. Same road, seen from the other side. */
  S.ashroad = { bpm: 112, root: 62, mode: 'minor', swing: 0, echo: 0.22, drum: 'march', drumVol: 0.75, bass: 'drive', arp: true, arpOct: 1, arpVol: 0.03, leadDuty: 0.125,
    chords: ['1', '1', '7', '6', '1', '1', '4', '5M', '6', '7', '1', '1', '4', '3', '5M', '1'],
    mel: ['5 - 1\' - 5 - 3 -', '5 - 1\' - 3\' - 2\' -', '7 - 2\' - 4\' - 2\' -', '6 - 1\' - 3\' - 1\' -', '1\' - 5 - 3 - 5 -', '1\' - 2\' - 3\' - 5\' -', '4\' - 3\' - 1\' - 6 -', '7# - 5 - 7# - 2\' -',
      '6 - 1\' - 3\' - 6 -', '7 - 2\' - 5\' - 2\' -', '1\' - 3\' - 5\' - 1\'\' -', '7 - 5 - 3 - 1 -', '4 - 6 - 1\' - 4\' -', '3 - 5 - 7 - 3\' -', '2\' - 7# - 5 - 7# -', '1 - - - . . . .'] };

  /* Finale: the whole title tune, lifted into the major and given a drum. */
  S.finale = { bpm: 100, root: 57, mode: 'major', swing: 0, echo: 0.26, drum: 'march', drumVol: 0.8, bass: 'drive', pad: true, padVol: 0.045, arp: true, arpOct: 1, arpVol: 0.03,
    chords: ['1', '5', '6', '4', '1', '5', '4', '5', '6', '3m', '4', '1', '2', '5', '1', '1'],
    mel: ['3 - - - 5 - 1\' -', '2\' - - - 7 - 5 -', '6 - - 5 6 - 1\' -', '4\' - - 3\' 4\' - 6 -', '5 - - - 1\' - 3\' -', '2\' - - - 7 - 5 -', '4\' - - 3\' 2\' - 1\' -', '2\' - - - 7 - . -',
      '1\' - 3\' - 6\' - 3\' -', '7 - 3\' - 5\' - 3\' -', '4\' - 6 - 1\' - 6 -', '3\' - 5 - 1\' - 5 -', '2\' - 4\' - 6 - 4\' -', '5 - 7 - 2\' - 7 -', '1\' - 3\' - 5\' - 3\' 1\'', '1\' - - - - - . .'] };

  /* Jingles */
  S.victory = { bpm: 150, root: 60, mode: 'major', once: true, drum: 'none', bass: 'pulse', echo: 0.2, spb: 8,
    chords: ['1', '4', '1', '5', '1'],
    mel: ['1 1 1 . 1 3 5 -', '4 4 4 . 6 - 1\' -', '5 5 5 . 5 7 2\' -', '7 - 2\' - 7 - 5 -', '1\' - - - - - . .'] };
  S.defeat = { bpm: 70, root: 57, mode: 'minor', once: true, drum: 'none', bass: 'half', echo: 0.3, vol: 0.9,
    chords: ['1', '4', '5M', '1'],
    mel: ['5 - 3 - 5 - 3 -', '4 - 6 - 4 - 6 -', '3 - 2 - 7, - . -', '1 - - - - - - -'] };
  S.levelup = { bpm: 170, root: 64, mode: 'major', once: true, drum: 'none', bass: 'none', echo: 0.15,
    chords: ['1', '1'], mel: ['1 3 5 1\' 3\' - - -', '5\' - - - - - . .'] };
  S.fanfare = { bpm: 108, root: 60, mode: 'major', once: true, drum: 'march', drumVol: 0.7, bass: 'drive', echo: 0.25,
    chords: ['1', '4', '5', '1'],
    mel: ['5 . 5 . 1\' - 3\' -', '4\' . 4\' . 6 - 1\' -', '5 . 7 . 2\' - 7 -', '1\' - - - - - . .'] };
})(FP);
