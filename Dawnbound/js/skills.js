/* Dawnbound - skills for each hero. kind is interpreted by combat.js */
(function () {
  'use strict';
  var DB = window.DB;
  /* pow multiplies the hero's attack (or magic) stat. cd seconds, mp cost, wind = seconds until effect, dur = action lock */
  DB.skills = {
    caelan: {
      basic: { name: 'Oath Strike', kind: 'slash', pow: 1.0, range: 36, arc: 130, wind: .12, dur: .36, combo: [1, 1, 1.5], desc: 'A disciplined three-hit sword combo.' },
      s1: { name: 'Shield Bash', kind: 'slash', pow: 1.7, range: 42, arc: 80, kb: 90, stun: .9, wind: .14, dur: .45, cd: 5, mp: 6, fx: 'dawnmark_burst', fxs: .35, desc: 'Slam your shield into foes ahead. Knocks back and stuns.' },
      s2: { name: 'Bulwark', kind: 'guard', dur2: 4.5, take: .3, taunt: 170, counter: 1.3, wind: .1, dur: .3, cd: 12, mp: 10, fx: 'dawnmark_burst', fxs: .5, desc: 'Raise your guard. Take far less damage, draw enemy attention, and counter blows.' },
      ult: { name: 'Oathkeeper', kind: 'ultnova', pow: 5, r: 110, kb: 120, shield: 7, wind: .35, dur: .8, fx: ['dawnmark_burst'], desc: 'Strike with the full weight of the Oath, shielding the whole party.' }
    },
    liora: {
      basic: { name: 'Light Bolt', kind: 'bolt', pow: .85, spd: 300, range: 170, r: 5, fx: 'healing', fxs: .35, wind: .15, dur: .4, desc: 'A bolt of gentle flame.' },
      s1: { name: 'Mend', kind: 'heal', mult: 3.4, r: 150, wind: .2, dur: .5, cd: 7, mp: 12, fx: 'healing', fxs: .8, desc: 'Heals the party around you.' },
      s2: { name: 'Barrier', kind: 'barrier', mult: 4.2, dur2: 7, r: 150, wind: .2, dur: .5, cd: 14, mp: 14, fx: 'dawnmark_burst', fxs: .5, desc: 'Wraps allies in a shield that absorbs damage.' },
      ult: { name: 'Gentle Dawn', kind: 'ultheal', r: 9999, wind: .4, dur: .9, fx: ['healing', 'dawnmark_burst'], desc: 'Fully heals and revives the entire party, and mends them over time.' }
    },
    vex: {
      basic: { name: 'Quick Fangs', kind: 'slash', pow: .62, range: 30, arc: 120, wind: .09, dur: .28, combo: [1, 1, 1.35], steal: .12, desc: 'Fast twin-dagger strikes. May steal items.' },
      s1: { name: 'Shadowstep', kind: 'dash', pow: 1.9, dist: 110, inv: .4, wind: .05, dur: .3, cd: 4.5, mp: 6, fx: 'shadow', fxs: .5, desc: 'Vanish and reappear through your foes, cutting as you pass.' },
      s2: { name: 'Fan of Knives', kind: 'bolt', pow: .75, count: 5, spread: 56, spd: 330, range: 140, r: 5, fx: 'shadow', fxs: .2, wind: .12, dur: .4, cd: 6, mp: 8, desc: 'Throw a fan of knives ahead.' },
      ult: { name: 'Last Gambit', kind: 'ultflurry', pow: 1.55, hits: 9, r: 220, wind: .25, dur: 1.4, fx: ['shadow', 'dawnmark_burst'], desc: 'Bet it all: a barrage of guaranteed critical cuts.' }
    },
    rowan: {
      basic: { name: 'Hunter\'s Shot', kind: 'bolt', pow: .95, spd: 420, range: 240, r: 4, arrow: true, wind: .14, dur: .38, desc: 'A swift arrow.' },
      s1: { name: 'Snare Trap', kind: 'trap', pow: 1.8, stun: 2.2, r: 44, wind: .15, dur: .4, cd: 8, mp: 8, fx: 'wind_spirit', fxs: .3, desc: 'Lay a trap. Enemies that step on it are hurt and held.' },
      s2: { name: 'Volley', kind: 'bolt', pow: .8, count: 7, spread: 44, spd: 400, range: 230, r: 4, arrow: true, wind: .15, dur: .5, cd: 7, mp: 10, desc: 'Loose a fan of arrows.' },
      ult: { name: 'Spirit of Greythorn', kind: 'ultspirit', pow: 5.5, r: 230, wind: .3, dur: 1.0, fx: ['wind_spirit', 'healing'], desc: 'The forest answers: spirits sweep every foe nearby.' }
    },
    brakka: {
      basic: { name: 'Axe Sweep', kind: 'slash', pow: 1.3, range: 42, arc: 160, kb: 30, wind: .16, dur: .48, combo: [1, 1, 1.5], desc: 'A heavy sweeping axe blow.' },
      s1: { name: 'Cleave', kind: 'nova', pow: 2.1, r: 66, kb: 70, wind: .2, dur: .55, cd: 5, mp: 5, fx: 'rage', fxs: .55, desc: 'Slam your axe around you.' },
      s2: { name: 'Berserk', kind: 'buff', atkMul: 1.6, defMul: .6, spdMul: 1.15, dur2: 9, wind: .1, dur: .4, cd: 18, mp: 8, fx: 'rage', fxs: .6, desc: 'Fight with abandon: more power and speed, less defense.' },
      ult: { name: 'Heart of the Storm', kind: 'ultstorm', pow: 1.7, pulses: 6, r: 78, wind: .2, dur: 1.5, fx: ['rage', 'lightning'], desc: 'A whirlwind of axe and thunder.' }
    },
    seraphine: {
      basic: { name: 'Arcane Bolt', kind: 'bolt', pow: .95, spd: 250, range: 200, r: 6, cycle: ['fire', 'ice', 'lightning'], fxs: .4, wind: .22, dur: .5, desc: 'A bolt that cycles through fire, ice and lightning.' },
      s1: { name: 'Fireball', kind: 'ground', pow: 2.8, r: 58, delay: .35, range: 200, wind: .3, dur: .6, cd: 5, mp: 14, fx: 'fire', fxs: 1.0, desc: 'A bursting ball of flame at your target.' },
      s2: { name: 'Chain Lightning', kind: 'chain', pow: 1.8, jumps: 4, range: 150, wind: .22, dur: .5, cd: 7, mp: 14, fx: 'lightning', fxs: .7, desc: 'Lightning leaps between foes.' },
      ult: { name: 'Starfall Equation', kind: 'ultrain', pow: 2.3, hits: 14, r: 60, area: 240, wind: .3, dur: 3.2, fx: ['fire', 'ice', 'lightning'], desc: 'Call down the solved equation: a rain of stars.' }
    }
  };
  DB.burst = { name: 'Dawnmark Burst', pow: 3.0, r: 135, heal: .2, stun: .8 };
})();
