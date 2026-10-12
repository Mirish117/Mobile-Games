/* Dawnbound - the score. Each song is a compact description that audio.js composes and plays. */
(function () {
  'use strict';
  var A = window.DB.audio, d = A.def;
  /* degrees: 0=I 1=ii 2=iii 3=IV 4=V 5=vi 6=vii */
  d('six_embers', { bpm: 70, root: 62, mode: 'major', seed: 11, prog: [0, 4, 5, 3, 0, 4, 3, 4], rev: .8, layers: [
    { role: 'arp', inst: 'piano', oct: 0, vol: .26, step: .5, pat: [0, 1, 2, 1, 3, 2, 1, 2] },
    { role: 'melody', inst: 'piano', oct: 1, vol: .34, phrase: 2, rhy: [1, 1, 2, 1, .5, .5], rest: .1, lo: 2, hi: 9 },
    { role: 'pad', inst: 'strings', oct: -1, vol: .3, n: 3, from: 4 },
    { role: 'bass', inst: 'bass', oct: -2, vol: .3, rhythm: [0] }] });
  d('dawnbound', { bpm: 104, root: 62, mode: 'major', seed: 21, prog: [0, 4, 5, 2, 3, 0, 3, 4], rev: .6, layers: [
    { role: 'melody', inst: 'brass', oct: 0, vol: .32, phrase: 2, rhy: [1, 1, 2, 1.5, .5], rest: .06, lo: 2, hi: 10 },
    { role: 'arp', inst: 'harp', oct: 1, vol: .24, step: .5, pat: [0, 1, 2, 3, 2, 1] },
    { role: 'pad', inst: 'strings', oct: -1, vol: .34, n: 4 },
    { role: 'bass', inst: 'bass', oct: -2, vol: .38, rhythm: [0, 1.5, 2, 3], fifths: true },
    { role: 'drums', kit: 'march', vol: .4 }, { role: 'bells', inst: 'bell', oct: 1, vol: .22 }] });
  d('void', { bpm: 44, root: 50, mode: 'phryg', seed: 3, prog: [0, 1, 0, 5], rev: 1, layers: [
    { role: 'pad', inst: 'choir', oct: -1, vol: .3, n: 3 }, { role: 'bells', inst: 'bell', oct: 0, vol: .22, p: .5 }, { role: 'bass', inst: 'bass', oct: -3, vol: .3, rhythm: [0] }] });
  d('dream_gold', { bpm: 66, root: 60, mode: 'lydian', seed: 5, prog: [0, 3, 0, 4], rev: .9, layers: [
    { role: 'arp', inst: 'harp', oct: 0, vol: .28, step: .5, pat: [0, 2, 1, 3, 2, 1] }, { role: 'pad', inst: 'strings', oct: -1, vol: .3 }, { role: 'melody', inst: 'flute', oct: 1, vol: .3, rhy: [2, 1, 1], lo: 3, hi: 9 }] });
  d('burning', { bpm: 92, root: 50, mode: 'hminor', seed: 7, prog: [0, 5, 3, 4], rev: .6, layers: [
    { role: 'pad', inst: 'strings', oct: -1, vol: .4, n: 4 }, { role: 'melody', inst: 'brass', oct: 0, vol: .3, rhy: [1, 1, 2], lo: 2, hi: 9 }, { role: 'drums', kit: 'war', vol: .5 }, { role: 'bass', inst: 'bass', oct: -2, vol: .4, rhythm: [0, 2] }] });
  d('sea', { bpm: 98, root: 57, mode: 'major', beats: 4, seed: 31, prog: [0, 3, 0, 4, 0, 5, 3, 4], rev: .55, layers: [
    { role: 'melody', inst: 'flute', oct: 1, vol: .3, phrase: 2, rhy: [1, 1, 1, .5, .5], lo: 2, hi: 9 }, { role: 'arp', inst: 'pluck', oct: 0, vol: .26, step: .5, pat: [0, 2, 1, 2] }, { role: 'pad', inst: 'strings', oct: -1, vol: .22 }, { role: 'bass', inst: 'bass', oct: -2, vol: .32, rhythm: [0, 2], fifths: true }, { role: 'drums', kit: 'soft', vol: .3 }] });
  d('halcyon', { bpm: 104, root: 60, mode: 'major', seed: 41, prog: [0, 3, 4, 0, 5, 3, 4, 0], rev: .5, swing: .04, layers: [
    { role: 'melody', inst: 'pluck', oct: 1, vol: .32, phrase: 2, rhy: [.5, .5, 1, 1, 1], rest: .1, lo: 2, hi: 10 }, { role: 'chords', inst: 'pluck', oct: 0, vol: .18, rhythm: [1, 3], len: .6 }, { role: 'bass', inst: 'bass', oct: -2, vol: .34, rhythm: [0, 1.5, 2, 3.5], fifths: true }, { role: 'drums', kit: 'soft', vol: .3 }, { role: 'bells', inst: 'bell', oct: 1, vol: .16, p: .35 }] });
  d('inn', { bpm: 84, beats: 3, root: 55, mode: 'major', seed: 51, prog: [0, 3, 0, 4, 0, 5, 3, 0], rev: .45, layers: [
    { role: 'melody', inst: 'flute', oct: 1, vol: .28, phrase: 2, rhy: [1, 1, 1, 2], lo: 2, hi: 9 }, { role: 'chords', inst: 'pluck', oct: 0, vol: .22, rhythm: [1, 2], len: .5 }, { role: 'bass', inst: 'bass', oct: -2, vol: .3, rhythm: [0] }, { role: 'drums', kit: 'waltz', vol: .2 }] });
  d('festival', { bpm: 128, beats: 3, root: 62, mode: 'major', seed: 61, prog: [0, 3, 4, 0, 0, 3, 4, 0], rev: .4, layers: [
    { role: 'melody', inst: 'pluck', oct: 1, vol: .34, phrase: 2, rhy: [.5, .5, 1, 1], rest: .05, lo: 3, hi: 10 }, { role: 'chords', inst: 'pluck', oct: 0, vol: .22, rhythm: [1, 2], len: .5 }, { role: 'bass', inst: 'bass', oct: -2, vol: .34, rhythm: [0] }, { role: 'drums', kit: 'waltz', vol: .3 }, { role: 'bells', inst: 'bell', oct: 2, vol: .16, p: .8 }] });
  d('lanterns', { bpm: 60, root: 57, mode: 'major', seed: 71, prog: [0, 5, 3, 4], rev: 1, layers: [
    { role: 'arp', inst: 'piano', oct: 0, vol: .28, step: .5, pat: [0, 1, 2, 1] }, { role: 'melody', inst: 'piano', oct: 1, vol: .3, rhy: [2, 1, 1], lo: 3, hi: 9 }, { role: 'pad', inst: 'strings', oct: -1, vol: .22 }] });
  d('grotto', { bpm: 78, root: 52, mode: 'dorian', seed: 81, prog: [0, 3, 0, 6], rev: 1, layers: [
    { role: 'arp', inst: 'harp', oct: 0, vol: .28, step: .5, pat: [0, 2, 1, 3, 2, 4] }, { role: 'pad', inst: 'choir', oct: -1, vol: .22 }, { role: 'bells', inst: 'bell', oct: 1, vol: .22, p: .5 }, { role: 'bass', inst: 'bass', oct: -3, vol: .26, rhythm: [0] }] });
  d('cliffs', { bpm: 88, root: 59, mode: 'mixo', seed: 91, prog: [0, 6, 3, 0], rev: .8, layers: [
    { role: 'melody', inst: 'flute', oct: 1, vol: .3, rhy: [1, 2, 1], lo: 2, hi: 9 }, { role: 'wind', inst: 'wind', vol: .5 }, { role: 'pad', inst: 'strings', oct: -1, vol: .28 }, { role: 'arp', inst: 'pluck', oct: 0, vol: .2, step: 1, pat: [0, 1, 2] }, { role: 'drums', kit: 'soft', vol: .26 }] });
  d('drowned', { bpm: 96, root: 45, mode: 'minor', seed: 101, prog: [0, 5, 3, 4], rev: 1, layers: [
    { role: 'pad', inst: 'choir', oct: -1, vol: .3 }, { role: 'arp', inst: 'pluck', oct: 0, vol: .24, step: .5, pat: [0, 2, 1, 2] }, { role: 'bass', inst: 'bass', oct: -2, vol: .38, rhythm: [0, 1, 2, 3] }, { role: 'drums', kit: 'pulse', vol: .4 }, { role: 'bells', inst: 'bell', oct: 1, vol: .18, p: .5 }] });
  d('forest', { bpm: 92, root: 57, mode: 'dorian', seed: 111, prog: [0, 3, 0, 6, 0, 3, 4, 0], rev: .7, layers: [
    { role: 'melody', inst: 'flute', oct: 1, vol: .3, phrase: 2, rhy: [1, 1, .5, .5, 1], lo: 2, hi: 9 }, { role: 'arp', inst: 'harp', oct: 0, vol: .22, step: .5, pat: [0, 1, 2, 1] }, { role: 'pad', inst: 'strings', oct: -1, vol: .2 }, { role: 'drums', kit: 'jig', vol: .2 }] });
  d('rotwood', { bpm: 70, root: 42, mode: 'phryg', seed: 121, prog: [0, 1, 0, 5], rev: 1, layers: [
    { role: 'pad', inst: 'choir', oct: -1, vol: .32 }, { role: 'bass', inst: 'bass', oct: -2, vol: .34, rhythm: [0, 2] }, { role: 'drums', kit: 'pulse', vol: .34 }, { role: 'bells', inst: 'bell', oct: 0, vol: .18, p: .4 }] });
  d('saltmire', { bpm: 112, root: 57, mode: 'dorian', seed: 131, prog: [0, 3, 0, 6], rev: .5, swing: .08, layers: [
    { role: 'melody', inst: 'pluck', oct: 1, vol: .3, phrase: 2, rhy: [.5, .5, 1, .5, .5], rest: .15, lo: 2, hi: 9 }, { role: 'chords', inst: 'pluck', oct: 0, vol: .2, rhythm: [1.5, 3.5], len: .4 }, { role: 'bass', inst: 'bass', oct: -2, vol: .36, rhythm: [0, 1.5, 2.5, 3] }, { role: 'drums', kit: 'soft', vol: .3 }] });
  d('undercity', { bpm: 100, root: 45, mode: 'hminor', seed: 141, prog: [0, 5, 0, 4], rev: .8, layers: [
    { role: 'arp', inst: 'pluck', oct: 0, vol: .24, step: .5, pat: [0, 2, 1, 3] }, { role: 'pad', inst: 'choir', oct: -1, vol: .22 }, { role: 'bass', inst: 'bass', oct: -2, vol: .36, rhythm: [0, 1, 2, 3] }, { role: 'drums', kit: 'pulse', vol: .36 }] });
  d('frostmark', { bpm: 90, root: 50, mode: 'dorian', seed: 151, prog: [0, 6, 0, 3, 0, 6, 4, 0], rev: .7, layers: [
    { role: 'melody', inst: 'brass', oct: 0, vol: .3, phrase: 2, rhy: [1, 1, 2], lo: 1, hi: 8 }, { role: 'pad', inst: 'strings', oct: -1, vol: .3 }, { role: 'drums', kit: 'war', vol: .5 }, { role: 'bass', inst: 'bass', oct: -2, vol: .4, rhythm: [0, 2], fifths: true }, { role: 'bells', inst: 'bell', oct: 1, vol: .16, p: .4 }] });
  d('aurora', { bpm: 58, root: 55, mode: 'lydian', seed: 161, prog: [0, 4, 0, 1], rev: 1, layers: [
    { role: 'pad', inst: 'choir', oct: -1, vol: .3 }, { role: 'arp', inst: 'harp', oct: 1, vol: .24, step: .5, pat: [0, 1, 2, 3, 2, 1] }, { role: 'melody', inst: 'flute', oct: 1, vol: .26, rhy: [2, 2, 1], lo: 3, hi: 10 }] });
  d('lumeria', { bpm: 86, root: 64, mode: 'lydian', seed: 171, prog: [0, 1, 3, 0, 4, 1, 3, 0], rev: .9, layers: [
    { role: 'arp', inst: 'harp', oct: 1, vol: .26, step: .5, pat: [0, 1, 2, 3, 2, 1, 3, 2] }, { role: 'melody', inst: 'bell', oct: 1, vol: .24, rhy: [1, 1, 2], lo: 3, hi: 10 }, { role: 'pad', inst: 'choir', oct: -1, vol: .26 }, { role: 'bass', inst: 'bass', oct: -2, vol: .24, rhythm: [0] }] });
  d('archive', { bpm: 72, root: 50, mode: 'minor', seed: 181, prog: [0, 3, 5, 4], rev: 1, layers: [
    { role: 'arp', inst: 'piano', oct: 0, vol: .24, step: .5, pat: [0, 2, 1, 3] }, { role: 'pad', inst: 'strings', oct: -1, vol: .26 }, { role: 'bells', inst: 'bell', oct: 1, vol: .2, p: .6 }] });
  d('highcrest', { bpm: 96, root: 55, mode: 'major', seed: 191, prog: [0, 4, 5, 3, 0, 4, 3, 0], rev: .7, layers: [
    { role: 'melody', inst: 'brass', oct: 0, vol: .3, phrase: 2, rhy: [1, 1, 2, 1.5, .5], lo: 2, hi: 9 }, { role: 'pad', inst: 'strings', oct: -1, vol: .32, n: 4 }, { role: 'bass', inst: 'bass', oct: -2, vol: .36, rhythm: [0, 2], fifths: true }, { role: 'drums', kit: 'march', vol: .36 }] });
  d('sad', { bpm: 52, root: 57, mode: 'minor', seed: 201, prog: [0, 5, 3, 4, 0, 5, 4, 0], rev: 1, layers: [
    { role: 'melody', inst: 'piano', oct: 1, vol: .36, phrase: 2, rhy: [2, 1, 1, 2], rest: .1, lo: 2, hi: 8 }, { role: 'arp', inst: 'piano', oct: 0, vol: .2, step: 1, pat: [0, 1, 2, 1] }, { role: 'pad', inst: 'strings', oct: -1, vol: .22, from: 4 }] });
  d('alone', { bpm: 48, root: 52, mode: 'minor', seed: 211, prog: [0, 3, 5, 4], rev: 1, layers: [
    { role: 'melody', inst: 'piano', oct: 1, vol: .3, rhy: [2, 2, 1], rest: .3, lo: 2, hi: 8 }, { role: 'bass', inst: 'bass', oct: -2, vol: .2, rhythm: [0] }] });
  d('wastes', { bpm: 64, root: 41, mode: 'phryg', seed: 221, prog: [0, 1, 0, 6], rev: 1, layers: [
    { role: 'pad', inst: 'choir', oct: -1, vol: .34 }, { role: 'bass', inst: 'bass', oct: -2, vol: .38, rhythm: [0, 2] }, { role: 'drums', kit: 'pulse', vol: .4 }, { role: 'bells', inst: 'bell', oct: 0, vol: .2, p: .5 }] });
  d('vael', { bpm: 62, root: 46, mode: 'minor', seed: 231, prog: [0, 5, 3, 6], rev: 1, layers: [
    { role: 'arp', inst: 'harp', oct: 0, vol: .24, step: .5, pat: [0, 2, 1, 2] }, { role: 'pad', inst: 'choir', oct: -1, vol: .3 }, { role: 'melody', inst: 'piano', oct: 1, vol: .24, rhy: [2, 1, 1], lo: 2, hi: 8, rest: .2 }] });
  d('citadel', { bpm: 84, root: 43, mode: 'hminor', seed: 241, prog: [0, 5, 3, 4], rev: .8, layers: [
    { role: 'pad', inst: 'strings', oct: -1, vol: .36, n: 4 }, { role: 'melody', inst: 'brass', oct: -1, vol: .28, rhy: [2, 1, 1], lo: 1, hi: 7 }, { role: 'drums', kit: 'war', vol: .5 }, { role: 'bass', inst: 'bass', oct: -2, vol: .42, rhythm: [0, 1, 2, 3] }] });
  d('battle', { bpm: 150, root: 52, mode: 'minor', seed: 251, prog: [0, 5, 3, 4, 0, 5, 6, 4], rev: .4, layers: [
    { role: 'melody', inst: 'brass', oct: 0, vol: .28, phrase: 2, rhy: [.5, .5, 1, .5, .5], rest: .06, lo: 2, hi: 9 }, { role: 'arp', inst: 'pluck', oct: 0, vol: .22, step: .25, pat: [0, 1, 2, 1] }, { role: 'bass', inst: 'bass', oct: -2, vol: .4, rhythm: [0, .5, 1.5, 2, 3], fifths: true }, { role: 'drums', kit: 'battle', vol: .5 }, { role: 'pad', inst: 'strings', oct: -1, vol: .26 }] });
  d('boss', { bpm: 138, root: 48, mode: 'hminor', seed: 261, prog: [0, 5, 3, 4, 0, 3, 6, 4], rev: .5, layers: [
    { role: 'melody', inst: 'brass', oct: 0, vol: .32, phrase: 2, rhy: [.5, .5, 1, 1], rest: .05, lo: 1, hi: 9 }, { role: 'arp', inst: 'strings', oct: 0, vol: .24, step: .5, pat: [0, 1, 2, 3] }, { role: 'pad', inst: 'choir', oct: -1, vol: .3, n: 4 }, { role: 'bass', inst: 'bass', oct: -2, vol: .44, rhythm: [0, .5, 1, 2, 2.5, 3], fifths: true }, { role: 'drums', kit: 'battle', vol: .56 }] });
  d('finalboss', { bpm: 146, root: 50, mode: 'hminor', seed: 271, prog: [0, 5, 3, 4, 0, 5, 6, 4, 0, 3, 5, 4], rev: .6, layers: [
    { role: 'melody', inst: 'brass', oct: 0, vol: .34, phrase: 2, rhy: [.5, .5, 1, 1, 1], rest: .04, lo: 1, hi: 10 }, { role: 'melody', inst: 'choir', oct: 1, vol: .28, phrase: 4, rhy: [2, 2], lo: 3, hi: 10 }, { role: 'arp', inst: 'strings', oct: 0, vol: .26, step: .25, pat: [0, 1, 2, 3, 2, 1] }, { role: 'bass', inst: 'bass', oct: -2, vol: .46, rhythm: [0, .5, 1, 1.5, 2, 3], fifths: true }, { role: 'drums', kit: 'battle', vol: .6 }, { role: 'bells', inst: 'bell', oct: 1, vol: .18, p: .8 }] });
  d('victory', { bpm: 112, root: 62, mode: 'major', seed: 281, prog: [0, 4, 5, 3, 0, 4, 0, 0], repeat: 1, rev: .6, layers: [
    { role: 'melody', inst: 'brass', oct: 0, vol: .34, phrase: 2, rhy: [1, 1, 2, 1.5, .5], rest: .04, lo: 3, hi: 11 }, { role: 'pad', inst: 'strings', oct: -1, vol: .36, n: 4 }, { role: 'arp', inst: 'harp', oct: 1, vol: .24, step: .5, pat: [0, 1, 2, 3] }, { role: 'bass', inst: 'bass', oct: -2, vol: .4, rhythm: [0, 2], fifths: true }, { role: 'drums', kit: 'march', vol: .4 }, { role: 'bells', inst: 'bell', oct: 1, vol: .2, p: .8 }] });
  d('camp', { bpm: 72, root: 55, mode: 'major', seed: 291, prog: [0, 3, 4, 0], rev: .6, layers: [
    { role: 'arp', inst: 'pluck', oct: 0, vol: .26, step: .5, pat: [0, 1, 2, 1] }, { role: 'melody', inst: 'flute', oct: 1, vol: .26, rhy: [1, 1, 2], lo: 2, hi: 9 }, { role: 'pad', inst: 'strings', oct: -1, vol: .2 }] });
  d('ghostly', { bpm: 56, root: 52, mode: 'dorian', seed: 301, prog: [0, 3, 6, 0], rev: 1, layers: [
    { role: 'pad', inst: 'choir', oct: -1, vol: .34 }, { role: 'bells', inst: 'bell', oct: 1, vol: .24, p: .7 }, { role: 'melody', inst: 'flute', oct: 1, vol: .22, rhy: [2, 2], lo: 3, hi: 9, rest: .25 }] });
  d('hall', { bpm: 118, root: 57, mode: 'lydian', seed: 311, prog: [0, 1, 3, 4], rev: .7, layers: [
    { role: 'arp', inst: 'harp', oct: 1, vol: .26, step: .25, pat: [0, 1, 2, 3, 2, 1] }, { role: 'melody', inst: 'bell', oct: 1, vol: .24, rhy: [1, 1, 2], lo: 3, hi: 10 }, { role: 'pad', inst: 'strings', oct: -1, vol: .3 }, { role: 'bass', inst: 'bass', oct: -2, vol: .34, rhythm: [0, 2] }, { role: 'drums', kit: 'battle', vol: .3 }] });
  d('credits', { bpm: 88, root: 62, mode: 'major', seed: 321, prog: [0, 5, 3, 4, 0, 5, 3, 0, 2, 5, 3, 4, 0, 4, 3, 0], rev: .8, layers: [
    { role: 'melody', inst: 'piano', oct: 1, vol: .34, phrase: 2, rhy: [1, 1, 2, 1.5, .5], rest: .08, lo: 2, hi: 10 }, { role: 'pad', inst: 'strings', oct: -1, vol: .32, n: 4 }, { role: 'arp', inst: 'harp', oct: 0, vol: .22, step: .5, pat: [0, 1, 2, 1] }, { role: 'bass', inst: 'bass', oct: -2, vol: .3, rhythm: [0, 2] }, { role: 'bells', inst: 'bell', oct: 1, vol: .16, p: .6 }] });
})();
