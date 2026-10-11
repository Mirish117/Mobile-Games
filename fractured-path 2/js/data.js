/* The Fractured Path: game data. Classes, skills, gear, items, Kin, foes. */
(function (FP) {
  'use strict';
  var D = FP.D = {};

  /* ---------- elements: Flame > Gale > Stone > Tide > Flame, Light <-> Gloom ---------- */
  D.ELS = { flame: 'Flame', tide: 'Tide', gale: 'Gale', stone: 'Stone', light: 'Light', gloom: 'Gloom', none: '' };
  var BEATS = { flame: 'gale', gale: 'stone', stone: 'tide', tide: 'flame', light: 'gloom', gloom: 'light' };
  D.elemMult = function (att, def) {
    if (!att || att === 'none' || !def || def === 'none') return 1;
    if (BEATS[att] === def) return 1.5;
    if (BEATS[def] === att) return 0.7;
    return 1;
  };
  D.ELCOL = { flame: '#ff7a3d', tide: '#3d9ae0', gale: '#8ad86a', stone: '#c9a24a', light: '#ffe27a', gloom: '#a070ff', none: '#fff' };

  /* ---------- stat training paths (spent with ability points) ---------- */
  D.TRAIN = [
    { id: 'might', name: 'Might', desc: '+1 attack', max: 12 },
    { id: 'focus', name: 'Focus', desc: '+1 magic', max: 12 },
    { id: 'guard', name: 'Guard', desc: '+1 defense, +1 resist', max: 12 },
    { id: 'vigor', name: 'Vigor', desc: '+6 HP, +2 MP', max: 12 },
    { id: 'swift', name: 'Swift', desc: '+1 speed', max: 12 }
  ];

  /* ---------- classes ---------- */
  D.CLASSES = {
    vanguard: { arc: 'hero', name: 'Vanguard', tag: 'Shield and sword', blurb: 'A wall of steel. Hits hard, takes hits harder, and keeps the party standing.', weapon: 'sword', armor: 'heavy',
      base: { hp: 46, mp: 8, atk: 10, def: 8, mag: 3, res: 5, spd: 5 }, grow: { hp: 9.5, mp: 1.8, atk: 2.3, def: 2, mag: 0.6, res: 1.1, spd: 0.8 },
      skills: ['rallystrike', 'shieldwall', 'cleave', 'guardianstance', 'dawnblade', 'bulwarkroar'], start: 'rallystrike' },
    spellwright: { caster: true, arc: 'hero', name: 'Spellwright', tag: 'Rune and staff', blurb: 'Fragile, brilliant. Reads the elements and burns weaknesses to the ground.', weapon: 'staff', armor: 'robe',
      base: { hp: 30, mp: 22, atk: 4, def: 4, mag: 11, res: 7, spd: 6 }, grow: { hp: 5.8, mp: 4.2, atk: 0.8, def: 0.9, mag: 2.7, res: 1.5, spd: 1 },
      skills: ['flare', 'tidelance', 'gustvolley', 'manaspring', 'rockfall', 'starfall'], start: 'flare' },
    wayfinder: { fastWeapon: true, arc: 'hero', name: 'Wayfinder', tag: 'Bow and bond', blurb: 'A scout who walks with Kin. Strong Tether skill, quick bow, calls companions to fight harder.', weapon: 'bow', armor: 'light',
      base: { hp: 36, mp: 12, atk: 9, def: 5, mag: 4, res: 5, spd: 8 }, grow: { hp: 7.2, mp: 2.5, atk: 2, def: 1.2, mag: 0.8, res: 1.1, spd: 1.5 },
      skills: ['quickshot', 'pindown', 'kincall', 'volley', 'lure', 'eagleeye'], start: 'quickshot', tether: 0.15 },
    lampbearer: { caster: true, arc: 'hero', name: 'Lampbearer', tag: 'Lantern and light', blurb: 'Keeps the dark away. Heals, mends and shines through the dull places.', weapon: 'lantern', armor: 'robe',
      base: { hp: 34, mp: 18, atk: 5, def: 6, mag: 9, res: 9, spd: 5 }, grow: { hp: 6.4, mp: 3.6, atk: 1, def: 1.4, mag: 2.2, res: 1.9, spd: 0.9 },
      skills: ['lampflare', 'mend', 'warmth', 'cleanse', 'rekindle', 'radiance'], start: 'lampflare' },
    reaver: { arc: 'villain', name: 'Reaver', tag: 'Axe and fury', blurb: 'Takes what the road owes. Pays for power in blood, his own included.', weapon: 'axe', armor: 'heavy',
      base: { hp: 48, mp: 6, atk: 11, def: 5, mag: 2, res: 3, spd: 6 }, grow: { hp: 9.8, mp: 1.5, atk: 2.7, def: 1.3, mag: 0.4, res: 0.8, spd: 1 },
      skills: ['savagecut', 'bloodrush', 'warcry', 'rend', 'recklessswing', 'carnage'], start: 'savagecut' },
    hexcaster: { caster: true, arc: 'villain', name: 'Hexcaster', tag: 'Hex and whisper', blurb: 'Curses, draining and slow rot. Wins fights before they start.', weapon: 'staff', armor: 'robe',
      base: { hp: 30, mp: 22, atk: 4, def: 4, mag: 11, res: 8, spd: 6 }, grow: { hp: 5.8, mp: 4.2, atk: 0.8, def: 0.9, mag: 2.6, res: 1.6, spd: 1.1 },
      skills: ['gloombolt', 'hex', 'siphon', 'wither', 'dread', 'soulreap'], start: 'gloombolt' },
    shade: { fastWeapon: true, arc: 'villain', name: 'Shade', tag: 'Dagger and dusk', blurb: 'Fast, mean and gone before you look. Poison, theft and finishing blows.', weapon: 'dagger', armor: 'light',
      base: { hp: 33, mp: 12, atk: 8, def: 4, mag: 5, res: 5, spd: 10 }, grow: { hp: 6.7, mp: 2.5, atk: 1.9, def: 1, mag: 0.9, res: 1.1, spd: 1.8 },
      skills: ['backstab', 'smokestep', 'pilfer', 'venomedge', 'flurry', 'nightfall'], start: 'backstab' },
    cinderbinder: { caster: true, arc: 'villain', name: 'Cinderbinder', tag: 'Ash and bond', blurb: 'Binds Kin with ember and ash. Burns hot, and makes companions fight like fury.', weapon: 'staff', armor: 'robe',
      base: { hp: 34, mp: 17, atk: 5, def: 5, mag: 9, res: 6, spd: 6 }, grow: { hp: 6.6, mp: 3.4, atk: 1.1, def: 1.2, mag: 2.2, res: 1.3, spd: 1.1 },
      skills: ['ember', 'cinderbind', 'kindlekin', 'ashfall', 'pyre', 'phoenixash'], start: 'ember', tether: 0.12 }
  };
  D.CLASS_ORDER = { hero: ['vanguard', 'spellwright', 'wayfinder', 'lampbearer'], villain: ['reaver', 'hexcaster', 'shade', 'cinderbinder'] };
  D.SKILL_LV = [1, 3, 5, 8, 12, 16];
  D.SKILL_AP = [0, 2, 3, 3, 4, 5];

  /* ---------- skills (also used by Kin; Kin moves use pp) ----------
     tgt: e1 one foe, eA all foes, a1 one ally, aA all allies, self, dead (fallen ally), rnd random foes (hits)
     type: phys | mag  pow: percent  el: element  */
  var K = D.SK = {};
  function sk(id, o) { o.id = id; K[id] = o; }
  /* basic actions */
  sk('attack', { name: 'Attack', tgt: 'e1', type: 'phys', pow: 100, el: 'none', basic: true });
  /* Vanguard */
  sk('rallystrike', { name: 'Rally Strike', mp: 3, tgt: 'e1', type: 'phys', pow: 145, desc: 'A driving blow.' });
  sk('shieldwall', { name: 'Shield Wall', mp: 5, tgt: 'aA', buff: { def: 0.4, res: 0.2, t: 3 }, desc: 'Party Defense up for 3 turns.' });
  sk('cleave', { name: 'Cleave', mp: 6, tgt: 'eA', type: 'phys', pow: 95, desc: 'Sweeps every foe.' });
  sk('guardianstance', { name: 'Guardian', mp: 5, tgt: 'self', buff: { def: 0.6, t: 3 }, taunt: 3, desc: 'Foes target you. Defense up.' });
  sk('dawnblade', { name: 'Dawnblade', mp: 12, tgt: 'e1', type: 'phys', pow: 250, el: 'light', desc: 'A blade of morning light.' });
  sk('bulwarkroar', { name: 'Bulwark Roar', mp: 10, tgt: 'aA', buff: { atk: 0.25, def: 0.25, t: 3 }, desc: 'Party Attack and Defense up.' });
  /* Spellwright */
  sk('flare', { name: 'Flare', mp: 3, tgt: 'e1', type: 'mag', pow: 140, el: 'flame', st: [{ k: 'burn', ch: 0.2, t: 3 }], desc: 'A burst of flame.' });
  sk('tidelance', { name: 'Tide Lance', mp: 4, tgt: 'e1', type: 'mag', pow: 150, el: 'tide', desc: 'A spear of water.' });
  sk('gustvolley', { name: 'Gust Volley', mp: 7, tgt: 'eA', type: 'mag', pow: 90, el: 'gale', desc: 'Cutting wind on all foes.' });
  sk('manaspring', { name: 'Mana Spring', mp: 0, tgt: 'self', mpPct: 0.25, desc: 'Restore a quarter of your MP.' });
  sk('rockfall', { name: 'Rockfall', mp: 12, tgt: 'e1', type: 'mag', pow: 240, el: 'stone', desc: 'The ceiling remembers gravity.' });
  sk('starfall', { name: 'Starfall', mp: 18, tgt: 'eA', type: 'mag', pow: 150, el: 'light', desc: 'Stars fall on every foe.' });
  /* Wayfinder */
  sk('quickshot', { name: 'Quick Shot', mp: 2, tgt: 'e1', type: 'phys', pow: 125, desc: 'Fast arrow. Hard to dodge.' });
  sk('pindown', { name: 'Pin Down', mp: 5, tgt: 'e1', type: 'phys', pow: 105, st: [{ k: 'stun', ch: 0.5, t: 1 }], desc: 'May stun the target.' });
  sk('kincall', { name: 'Kin Call', mp: 5, tgt: 'aA', buff: { atk: 0.3, mag: 0.3, t: 3 }, kinOnly: true, desc: 'Kin Attack and Magic up.' });
  sk('volley', { name: 'Volley', mp: 7, tgt: 'eA', type: 'phys', pow: 85, desc: 'Arrows rain on all foes.' });
  sk('lure', { name: 'Lure', mp: 4, tgt: 'e1', type: 'phys', pow: 80, lure: true, desc: 'Damage, and makes Tether easier.' });
  sk('eagleeye', { name: 'Eagle Eye', mp: 12, tgt: 'e1', type: 'phys', pow: 260, crit: 1, desc: 'A perfect shot. Always crits.' });
  /* Lampbearer */
  sk('lampflare', { name: 'Lamp Flare', mp: 3, tgt: 'e1', type: 'mag', pow: 135, el: 'light', desc: 'A flash of lantern light.' });
  sk('mend', { name: 'Mend', mp: 4, tgt: 'a1', heal: 150, desc: 'Heal one ally.' });
  sk('warmth', { name: 'Warmth', mp: 7, tgt: 'aA', buff: { regen: 1, t: 4 }, desc: 'Party recovers HP each turn.' });
  sk('cleanse', { name: 'Cleanse', mp: 4, tgt: 'a1', heal: 50, cleanse: true, desc: 'Cure statuses and heal a little.' });
  sk('rekindle', { name: 'Rekindle', mp: 14, tgt: 'dead', revive: 0.5, desc: 'Bring a fallen ally back.' });
  sk('radiance', { name: 'Radiance', mp: 16, tgt: 'aA', heal: 140, desc: 'Heal the whole party.' });
  /* Reaver */
  sk('savagecut', { name: 'Savage Cut', mp: 3, tgt: 'e1', type: 'phys', pow: 150, desc: 'A hungry, ugly swing.' });
  sk('bloodrush', { name: 'Bloodrush', mp: 0, tgt: 'self', buff: { atk: 0.5, t: 3 }, selfHp: 0.1, desc: 'Pay 10% HP for Attack up.' });
  sk('warcry', { name: 'War Cry', mp: 5, tgt: 'eA', debuff: { atk: -0.25, mag: -0.25, t: 3 }, desc: 'Foes lose their nerve.' });
  sk('rend', { name: 'Rend', mp: 6, tgt: 'e1', type: 'phys', pow: 125, st: [{ k: 'bleed', ch: 1, t: 3 }], desc: 'Causes bleeding.' });
  sk('recklessswing', { name: 'Reckless Swing', mp: 8, tgt: 'e1', type: 'phys', pow: 290, selfHp: 0.15, desc: 'Huge hit. Costs 15% HP.' });
  sk('carnage', { name: 'Carnage', mp: 14, tgt: 'eA', type: 'phys', pow: 150, desc: 'Cuts through the whole line.' });
  /* Hexcaster */
  sk('gloombolt', { name: 'Gloom Bolt', mp: 3, tgt: 'e1', type: 'mag', pow: 140, el: 'gloom', desc: 'A knot of dark.' });
  sk('hex', { name: 'Hex', mp: 5, tgt: 'e1', debuff: { atk: -0.3, mag: -0.3, t: 3 }, desc: 'Foe Attack and Magic down.' });
  sk('siphon', { name: 'Siphon', mp: 6, tgt: 'e1', type: 'mag', pow: 105, el: 'gloom', drain: 0.6, desc: 'Steal vitality.' });
  sk('wither', { name: 'Wither', mp: 6, tgt: 'e1', type: 'mag', pow: 85, el: 'gloom', st: [{ k: 'poison', ch: 1, t: 4 }], desc: 'Poison that bites deep.' });
  sk('dread', { name: 'Dread', mp: 12, tgt: 'eA', st: [{ k: 'stun', ch: 0.5, t: 1 }], desc: 'May freeze foes with fear.' });
  sk('soulreap', { name: 'Soul Reap', mp: 16, tgt: 'e1', type: 'mag', pow: 270, el: 'gloom', execute: 0.4, desc: 'Deals more to foes under 40% HP.' });
  /* Shade */
  sk('backstab', { name: 'Backstab', mp: 2, tgt: 'e1', type: 'phys', pow: 140, critUp: 0.3, desc: 'High crit chance.' });
  sk('smokestep', { name: 'Smoke Step', mp: 4, tgt: 'self', buff: { eva: 0.6, t: 2 }, desc: 'Evade attacks for 2 turns.' });
  sk('pilfer', { name: 'Pilfer', mp: 4, tgt: 'e1', type: 'phys', pow: 90, steal: true, desc: 'Hit and lift some gold.' });
  sk('venomedge', { name: 'Venom Edge', mp: 5, tgt: 'e1', type: 'phys', pow: 110, st: [{ k: 'poison', ch: 1, t: 4 }], desc: 'Poisoned blade.' });
  sk('flurry', { name: 'Shadow Flurry', mp: 9, tgt: 'rnd', type: 'phys', pow: 75, hits: 4, desc: 'Four quick cuts on random foes.' });
  sk('nightfall', { name: 'Nightfall', mp: 12, tgt: 'e1', type: 'phys', pow: 270, el: 'gloom', crit: 1, desc: 'A guaranteed critical strike.' });
  /* Cinderbinder */
  sk('ember', { name: 'Ember', mp: 3, tgt: 'e1', type: 'mag', pow: 140, el: 'flame', desc: 'A snap of cinder.' });
  sk('cinderbind', { name: 'Cinder Bind', mp: 5, tgt: 'e1', type: 'mag', pow: 100, el: 'flame', st: [{ k: 'burn', ch: 0.8, t: 3 }, { k: 'stun', ch: 0.3, t: 1 }], desc: 'Burn and maybe stun.' });
  sk('kindlekin', { name: 'Kindle Kin', mp: 7, tgt: 'aA', heal: 80, buff: { atk: 0.2, mag: 0.2, t: 3 }, desc: 'Heal and fire up the party.' });
  sk('ashfall', { name: 'Ashfall', mp: 8, tgt: 'eA', type: 'mag', pow: 90, el: 'flame', st: [{ k: 'burn', ch: 0.5, t: 3 }], desc: 'Burning ash on all foes.' });
  sk('pyre', { name: 'Pyre', mp: 13, tgt: 'e1', type: 'mag', pow: 255, el: 'flame', desc: 'A column of fire.' });
  sk('phoenixash', { name: 'Phoenix Ash', mp: 15, tgt: 'dead', revive: 0.6, buff: { atk: 0.2, t: 3 }, desc: 'Revive an ally with fire in them.' });

  /* Kin moves (limited uses per battle) */
  function km(id, o) { o.id = id; o.kin = true; K[id] = o; }
  km('nip', { name: 'Nip', tgt: 'e1', type: 'phys', pow: 100, pp: 99 });
  km('scratch', { name: 'Scratch', tgt: 'e1', type: 'phys', pow: 105, pp: 99 });
  km('ember_spit', { name: 'Ember Spit', tgt: 'e1', type: 'mag', pow: 125, el: 'flame', pp: 8, st: [{ k: 'burn', ch: 0.25, t: 3 }] });
  km('flame_rush', { name: 'Flame Rush', tgt: 'e1', type: 'phys', pow: 150, el: 'flame', pp: 5 });
  km('cinder_roar', { name: 'Cinder Roar', tgt: 'eA', type: 'mag', pow: 95, el: 'flame', pp: 3 });
  km('tail_flick', { name: 'Tail Flick', tgt: 'e1', type: 'phys', pow: 110, pp: 8, st: [{ k: 'stun', ch: 0.15, t: 1 }] });
  km('shell_guard', { name: 'Shell Guard', tgt: 'self', buff: { def: 0.6, res: 0.4, t: 3 }, pp: 4 });
  km('leaf_lash', { name: 'Leaf Lash', tgt: 'e1', type: 'phys', pow: 120, el: 'stone', pp: 8 });
  km('sprout_mend', { name: 'Sprout Mend', tgt: 'a1', heal: 130, pp: 4 });
  km('bramble_ring', { name: 'Bramble Ring', tgt: 'eA', type: 'mag', pow: 90, el: 'stone', pp: 4, st: [{ k: 'bleed', ch: 0.4, t: 3 }] });
  km('peck', { name: 'Peck', tgt: 'e1', type: 'phys', pow: 110, el: 'gale', pp: 10 });
  km('swoop', { name: 'Swoop', tgt: 'e1', type: 'phys', pow: 140, el: 'gale', pp: 6 });
  km('gale_cry', { name: 'Gale Cry', tgt: 'eA', type: 'mag', pow: 90, el: 'gale', pp: 4 });
  km('pinch', { name: 'Pinch', tgt: 'e1', type: 'phys', pow: 125, el: 'tide', pp: 8 });
  km('bubble_veil', { name: 'Bubble Veil', tgt: 'aA', buff: { res: 0.4, def: 0.2, t: 3 }, pp: 3 });
  km('tide_splash', { name: 'Tide Splash', tgt: 'e1', type: 'mag', pow: 130, el: 'tide', pp: 8 });
  km('rock_roll', { name: 'Rock Roll', tgt: 'e1', type: 'phys', pow: 135, el: 'stone', pp: 7 });
  km('dig_strike', { name: 'Dig Strike', tgt: 'e1', type: 'phys', pow: 165, el: 'stone', pp: 4 });
  km('quake_stomp', { name: 'Quake Stomp', tgt: 'eA', type: 'phys', pow: 95, el: 'stone', pp: 3 });
  km('gloom_bite', { name: 'Gloom Bite', tgt: 'e1', type: 'phys', pow: 130, el: 'gloom', pp: 8, drain: 0.3 });
  km('howl', { name: 'Howl', tgt: 'eA', debuff: { atk: -0.25, t: 3 }, pp: 3 });
  km('dust_cloud', { name: 'Dust Cloud', tgt: 'eA', debuff: { spd: -0.3, atk: -0.15, t: 3 }, pp: 3 });
  km('wing_dust', { name: 'Wing Dust', tgt: 'e1', type: 'mag', pow: 90, el: 'gloom', pp: 6, st: [{ k: 'stun', ch: 0.35, t: 1 }] });
  km('frost_fang', { name: 'Frost Fang', tgt: 'e1', type: 'phys', pow: 135, el: 'tide', pp: 7, st: [{ k: 'stun', ch: 0.15, t: 1 }] });
  km('rime_charge', { name: 'Rime Charge', tgt: 'e1', type: 'phys', pow: 170, el: 'tide', pp: 4 });
  km('spirit_light', { name: 'Spirit Light', tgt: 'aA', heal: 80, pp: 3 });
  km('glimmer', { name: 'Glimmer', tgt: 'e1', type: 'mag', pow: 120, el: 'light', pp: 8 });
  km('lightning_dive', { name: 'Static Dive', tgt: 'e1', type: 'phys', pow: 160, el: 'gale', pp: 4 });
  km('thunder_cry', { name: 'Thunder Cry', tgt: 'eA', type: 'mag', pow: 105, el: 'gale', pp: 3 });
  km('eel_coil', { name: 'Coil', tgt: 'e1', type: 'phys', pow: 120, el: 'tide', pp: 8, st: [{ k: 'stun', ch: 0.25, t: 1 }] });
  km('ember_nuzzle', { name: 'Ember Nuzzle', tgt: 'a1', heal: 90, buff: { atk: 0.2, t: 3 }, pp: 3 });
  /* foe-only moves */
  function fm(id, o) { o.id = id; o.foe = true; K[id] = o; }
  fm('f_slash', { name: 'Slash', tgt: 'e1', type: 'phys', pow: 110 });
  fm('f_heavy', { name: 'Heavy Blow', tgt: 'e1', type: 'phys', pow: 160 });
  fm('f_cutpurse', { name: 'Cutpurse', tgt: 'e1', type: 'phys', pow: 90, steal: true });
  fm('f_bolt', { name: 'Dark Bolt', tgt: 'e1', type: 'mag', pow: 130, el: 'gloom' });
  fm('f_curse', { name: 'Curse', tgt: 'e1', debuff: { atk: -0.3, def: -0.2, t: 3 } });
  fm('f_shout', { name: 'Rallying Shout', tgt: 'aA', buff: { atk: 0.3, t: 3 } });
  fm('f_smash', { name: 'Rust Smash', tgt: 'e1', type: 'phys', pow: 175 });
  fm('f_sweep', { name: 'Sweep', tgt: 'eA', type: 'phys', pow: 85 });
  fm('f_chill', { name: 'Grave Chill', tgt: 'eA', type: 'mag', pow: 85, el: 'gloom', st: [{ k: 'stun', ch: 0.2, t: 1 }] });
  fm('f_roots', { name: 'Grasping Roots', tgt: 'eA', type: 'mag', pow: 90, el: 'stone', st: [{ k: 'bleed', ch: 0.5, t: 3 }] });
  fm('f_heal', { name: 'Mend Self', tgt: 'self', heal: 160 });
  fm('f_toxin', { name: 'Toxic Spray', tgt: 'eA', type: 'mag', pow: 70, el: 'stone', st: [{ k: 'poison', ch: 0.7, t: 4 }] });
  fm('f_tidal', { name: 'Tidal Crash', tgt: 'eA', type: 'phys', pow: 115, el: 'tide' });
  fm('f_maul', { name: 'Maw Snap', tgt: 'e1', type: 'phys', pow: 190, el: 'tide' });
  fm('f_hush', { name: 'The Hush', tgt: 'eA', type: 'mag', pow: 110, el: 'gloom', debuff: { spd: -0.25, t: 2 } });
  fm('f_unmake', { name: 'Unmake', tgt: 'e1', type: 'mag', pow: 220, el: 'gloom' });
  fm('f_beam', { name: 'Lampstone Beam', tgt: 'e1', type: 'mag', pow: 160, el: 'light' });
  fm('f_decree', { name: 'Hollow Decree', tgt: 'eA', type: 'mag', pow: 100, el: 'gloom', st: [{ k: 'stun', ch: 0.25, t: 1 }] });
  fm('f_summonbones', { name: 'Raise Guard', tgt: 'self', buff: { def: 0.5, atk: 0.3, t: 3 } });
  fm('f_barrier', { name: 'Ward Up', tgt: 'self', buff: { def: 0.6, res: 0.6, t: 3 } });
  fm('f_gale', { name: 'Gale Slash', tgt: 'e1', type: 'phys', pow: 130, el: 'gale' });
  fm('f_spore', { name: 'Spore Cloud', tgt: 'eA', type: 'mag', pow: 75, el: 'stone', debuff: { atk: -0.2, t: 3 } });
  fm('f_ash', { name: 'Ash Breath', tgt: 'eA', type: 'mag', pow: 85, el: 'flame', st: [{ k: 'burn', ch: 0.4, t: 3 }] });

  D.STATUS = {
    poison: { name: 'Poison', tag: 'PSN', dot: 0.07 }, burn: { name: 'Burn', tag: 'BRN', dot: 0.06 }, bleed: { name: 'Bleed', tag: 'BLD', dot: 0.05 },
    stun: { name: 'Stun', tag: 'STN' }
  };

  /* ---------- items ---------- */
  var I = D.ITEMS = {};
  function it(id, o) { o.id = id; I[id] = o; }
  it('potion', { name: 'Potion', price: 25, use: 'any', heal: 45, desc: 'Restores 45 HP.' });
  it('hipotion', { name: 'Hi-Potion', price: 90, use: 'any', heal: 130, desc: 'Restores 130 HP.' });
  it('sunpotion', { name: 'Sun Draught', price: 240, use: 'any', heal: 320, desc: 'Restores 320 HP.' });
  it('ether', { name: 'Ether', price: 45, use: 'any', mp: 18, desc: 'Restores 18 MP.' });
  it('hiether', { name: 'Hi-Ether', price: 140, use: 'any', mp: 50, desc: 'Restores 50 MP.' });
  it('tonic', { name: 'Tonic', price: 30, use: 'any', cleanse: true, desc: 'Cures poison, burn, bleed.' });
  it('seed', { name: 'Rekindle Seed', price: 110, use: 'dead', revive: 0.5, desc: 'Revives a fallen ally.' });
  it('cord', { name: 'Tether Cord', price: 40, use: 'battle', tether: 1, desc: 'Binds a weakened wild Kin.' });
  it('strongcord', { name: 'Strong Cord', price: 130, use: 'battle', tether: 1.7, desc: 'A stronger Tether Cord.' });
  it('smoke', { name: 'Smoke Pebble', price: 35, use: 'battle', flee: true, desc: 'Escape any normal battle.' });
  it('bomb', { name: 'Cinder Bomb', price: 55, use: 'battle', dmg: 70, el: 'flame', all: true, desc: 'Burns every foe.' });
  it('ore', { name: 'Ember Ore', price: 60, use: 'none', desc: 'Used by smiths to temper gear.' });
  it('lodging', { name: 'Kin Treat', price: 20, use: 'kin', heal: 70, desc: 'Restores a Kin 70 HP.' });
  it('lampkey', { name: 'Lamp Key', use: 'none', key: true, desc: 'Opens the sealed vault doors.' });
  it('dawnchime', { name: 'Dawn Chime', use: 'none', key: true, desc: 'A fragment of the Hollow Bell. Warm.' });
  it('tidechime', { name: 'Tide Chime', use: 'none', key: true, desc: 'A fragment of the Hollow Bell. Wet and bright.' });
  it('hollowchime', { name: 'Hollow Chime', use: 'none', key: true, desc: 'A fragment of the Hollow Bell. Cold.' });
  it('echochime', { name: 'Echo Chime', use: 'none', key: true, desc: 'The last fragment. It hums your name.' });
  it('journal', { name: 'Choir Journal', use: 'none', key: true, desc: 'A cracked book of old songs.' });
  it('sailpass', { name: 'Harbor Pass', use: 'none', key: true, desc: 'Lets you board harbor vessels.' });
  it('wardseal', { name: 'Warden Seal', use: 'none', key: true, desc: 'Marks you as a friend of the Wardens.' });
  it('ashband', { name: 'Ash Band', use: 'none', key: true, desc: 'A sooty cord. Ashen mark of belonging.' });

  /* ---------- gear ---------- */
  var WNAMES = {
    sword: ['Tin Sword', 'Iron Longblade', 'Steelward Sword', 'Gleamsteel Blade', 'Sunsteel Greatsword'],
    staff: ['Willow Wand', 'Quartz Rod', 'Rune Staff', 'Starglass Staff', 'Archon Staff'],
    bow: ['Hunter Bow', 'Yew Shortbow', 'Ranger Bow', 'Gale Longbow', 'Skyreach Bow'],
    lantern: ['Tin Lantern', 'Brass Lantern', 'Silver Lantern', 'Dawnglass Lamp', 'Everlight Lantern'],
    axe: ['Rust Axe', 'Iron Cleaver', 'Notched Waraxe', 'Gorewing Axe', 'Skullsplitter'],
    dagger: ['Dull Dirk', 'Iron Dagger', 'Needle Blades', 'Moonfang', 'Nightglass Dirk'],
    cinder: ['Char Rod', 'Cinder Staff', 'Furnace Staff', 'Pyre Scepter', 'Emberheart Staff'],
    hex: ['Bone Wand', 'Hex Rod', 'Gloam Staff', 'Nightshade Staff', 'Void Scepter']
  };
  var WSTAT = [{ atk: 3, mag: 3 }, { atk: 9, mag: 8 }, { atk: 16, mag: 15 }, { atk: 25, mag: 23 }, { atk: 36, mag: 33 }];
  var WPRICE = [0, 90, 380, 1000, 0];
  var ANAMES = {
    heavy: ['Leather Vest', 'Chain Mail', 'Plate Cuirass', 'Bellsteel Plate', 'Dawn Plate'],
    light: ['Cloth Wrap', 'Scout Jacket', 'Ranger Coat', 'Windcloak', 'Shadowweave'],
    robe: ['Plain Robe', 'Wool Robe', 'Rune Robe', 'Starweave Robe', 'Archon Vestments']
  };
  var ASTAT = { heavy: [{ def: 3, res: 1 }, { def: 8, res: 3 }, { def: 14, res: 6 }, { def: 22, res: 10 }, { def: 31, res: 15 }],
    light: [{ def: 2, res: 2 }, { def: 6, res: 5 }, { def: 11, res: 9 }, { def: 17, res: 14 }, { def: 25, res: 20 }],
    robe: [{ def: 1, res: 3 }, { def: 4, res: 7 }, { def: 8, res: 12 }, { def: 13, res: 19 }, { def: 19, res: 27 }] };
  var APRICE = [0, 80, 340, 900, 0];
  var G = D.GEAR = {};
  function wkind(cls) { return cls === 'cinderbinder' ? 'cinder' : cls === 'hexcaster' ? 'hex' : D.CLASSES[cls].weapon; }
  D.WNAMES = WNAMES;
  D.makeGear = function (cls) {
    var wk = wkind(cls), c = D.CLASSES[cls];
    for (var t = 0; t < 5; t++) {
      var s = WSTAT[t], isCaster = !!c.caster;
      var o = { id: 'w_' + cls + '_' + t, slot: 'weapon', name: WNAMES[wk][t], tier: t, cls: cls, price: WPRICE[t], atk: isCaster ? Math.round(s.atk * 0.4) : s.atk, mag: isCaster ? s.mag : Math.round(s.mag * 0.3) };
      if (c.fastWeapon) o.spd = t;
      G[o.id] = o;
    }
  };
  Object.keys(D.CLASSES).forEach(function (cls) { D.makeGear(cls); });
  ['heavy', 'light', 'robe'].forEach(function (k) {
    for (var t = 0; t < 5; t++) {
      var s = ASTAT[k][t];
      G['a_' + k + '_' + t] = { id: 'a_' + k + '_' + t, slot: 'armor', name: ANAMES[k][t], tier: t, kind: k, price: APRICE[t], def: s.def, res: s.res };
    }
  });
  var CHARMS = [
    { n: 'Lucky Knot', crit: 0.06, d: '+6% crit' }, { n: 'Bell Charm', res: 6, d: '+6 Resist' }, { n: 'Swift Anklet', spd: 4, d: '+4 Speed' },
    { n: 'Ember Locket', atk: 5, d: '+5 Attack' }, { n: 'Tide Pearl', mag: 5, d: '+5 Magic' }, { n: 'Guard Ring', def: 5, d: '+5 Defense' },
    { n: 'Vital Seed', hp: 30, d: '+30 HP' }, { n: 'Mind Bead', mp: 14, d: '+14 MP' }, { n: 'Kin Whistle', kin: 0.15, d: 'Kin deal +15%' }, { n: 'Cord Knot', tether: 0.12, d: 'Tether +12%' }
  ];
  CHARMS.forEach(function (c, i) {
    var o = { id: 'c_' + i, slot: 'charm', name: c.n, price: 150 + (i % 3) * 60, desc: c.d, tier: 1 };
    ['crit', 'res', 'spd', 'atk', 'mag', 'def', 'hp', 'mp', 'kin', 'tether'].forEach(function (k) { if (c[k]) o[k] = c[k]; });
    G[o.id] = o;
  });
  D.fam = function (cls) { var c = D.CLASSES[cls]; return c && c.fam ? c.fam : cls; };
  D.armorKind = function (cls) { return D.CLASSES[cls].armor; };
  D.weaponFor = function (cls, tier) { return G['w_' + D.fam(cls) + '_' + tier]; };
  D.armorFor = function (cls, tier) { return G['a_' + D.CLASSES[cls].armor + '_' + tier]; };
  D.gearName = function (id, temper) { var g = G[id]; return g ? g.name + (temper ? ' +' + temper : '') : '-'; };
  D.canEquip = function (cls, g) {
    if (!g) return false;
    if (g.slot === 'weapon') return g.cls === D.fam(cls);
    if (g.slot === 'armor') return g.kind === D.CLASSES[cls].armor;
    return true;
  };
  D.temperCost = function (g, n) { return { gold: 45 * (g.tier + 1) * n, ore: n }; };

  /* ---------- levels ---------- */
  D.MAXLV = 30;
  D.xpNeed = function (lv) { return Math.round(10 + 6 * Math.pow(lv, 1.75)); };
  D.AP_PER_LEVEL = 2;

  /* player stat calc, from a game state's hero */
  D.heroStats = function (h) {
    var c = D.CLASSES[h.cls], L = h.lv, s = {}, k;
    for (k in c.base) s[k] = c.base[k] + c.grow[k] * (L - 1);
    var t = h.train || {};
    s.atk += (t.might || 0); s.mag += (t.focus || 0); s.def += (t.guard || 0); s.res += (t.guard || 0);
    s.hp += (t.vigor || 0) * 6; s.mp += (t.vigor || 0) * 2; s.spd += (t.swift || 0);
    s.crit = 0.06 + (c.crit || 0); s.kin = c.kinB || 0; s.tether = c.tether || 0;
    ['weapon', 'armor', 'charm'].forEach(function (slot) {
      var id = h.equip && h.equip[slot], g = id && G[id]; if (!g) return;
      var tm = (h.temper && h.temper[id]) || 0;
      ['atk', 'mag', 'def', 'res', 'spd', 'hp', 'mp', 'crit', 'kin', 'tether'].forEach(function (a) { if (g[a]) s[a] += g[a]; });
      if (slot === 'weapon' && tm) { s.atk += tm * (1 + g.tier * 0.8); s.mag += tm * (1 + g.tier * 0.8); }
      if (slot === 'armor' && tm) { s.def += tm * (1 + g.tier * 0.7); s.res += tm * (0.8 + g.tier * 0.6); }
    });
    if (c.mods) for (k in c.mods) if (s[k] !== undefined) s[k] *= c.mods[k];
    ['hp', 'mp', 'atk', 'def', 'mag', 'res', 'spd'].forEach(function (a) { s[a] = Math.round(s[a]); });
    return s;
  };

  /* ---------- Kin ---------- */
  var KS = D.KIN = {};
  function kin(id, o) { o.id = id; KS[id] = o; }
  kin('wick', { name: 'Wick', el: 'flame', base: { hp: 16, atk: 8, def: 5, mag: 8, spd: 9 }, moves: [[1, 'nip'], [3, 'ember_spit'], [9, 'flame_rush'], [15, 'cinder_roar']], price: 160, cap: 0.55, desc: 'An ember-tailed pup. Warm to hold.' });
  kin('soot', { name: 'Soot', el: 'gloom', base: { hp: 17, atk: 9, def: 5, mag: 7, spd: 8 }, moves: [[1, 'scratch'], [3, 'gloom_bite'], [8, 'ember_spit'], [14, 'howl']], price: 160, cap: 0.55, desc: 'A scrap of ash with eyes. Loyal to a fault.' });
  kin('mossback', { name: 'Mossback', el: 'stone', base: { hp: 22, atk: 7, def: 10, mag: 5, spd: 3 }, moves: [[1, 'nip'], [2, 'shell_guard'], [6, 'leaf_lash'], [12, 'bramble_ring']], price: 180, cap: 0.5, desc: 'A slow, patient shell with a garden on it.' });
  kin('pipsprout', { name: 'Pipsprout', el: 'stone', base: { hp: 14, atk: 5, def: 5, mag: 9, spd: 7 }, moves: [[1, 'scratch'], [3, 'sprout_mend'], [7, 'leaf_lash'], [13, 'spirit_light']], price: 140, cap: 0.65, desc: 'A leaf-eared bud. Heals friends it likes.' });
  kin('gullwing', { name: 'Gullwing', el: 'gale', base: { hp: 14, atk: 8, def: 4, mag: 6, spd: 12 }, moves: [[1, 'peck'], [4, 'swoop'], [10, 'gale_cry'], [16, 'lightning_dive']], price: 170, cap: 0.6, desc: 'A harbor gull with a bold eye.' });
  kin('brinecrab', { name: 'Brinecrab', el: 'tide', base: { hp: 20, atk: 9, def: 9, mag: 4, spd: 4 }, moves: [[1, 'pinch'], [4, 'bubble_veil'], [9, 'tide_splash'], [15, 'quake_stomp']], price: 190, cap: 0.5, desc: 'All claws and attitude.' });
  kin('cragmole', { name: 'Cragmole', el: 'stone', base: { hp: 20, atk: 10, def: 8, mag: 3, spd: 5 }, moves: [[1, 'scratch'], [4, 'rock_roll'], [10, 'dig_strike'], [17, 'quake_stomp']], price: 210, cap: 0.5, desc: 'Tunnel-proud and short of sight.' });
  kin('emberling', { name: 'Emberling', el: 'flame', base: { hp: 17, atk: 10, def: 5, mag: 9, spd: 10 }, moves: [[1, 'tail_flick'], [4, 'ember_spit'], [9, 'flame_rush'], [16, 'cinder_roar']], price: 220, cap: 0.5, desc: 'A fox of living cinder, quick as a spark.' });
  kin('gloamhound', { name: 'Gloamhound', el: 'gloom', base: { hp: 21, atk: 12, def: 6, mag: 7, spd: 9 }, moves: [[1, 'gloom_bite'], [5, 'howl'], [10, 'rime_charge'], [16, 'wing_dust']], price: 260, cap: 0.4, desc: 'A hunting hound of dusk. Wary, then devoted.' });
  kin('duskmoth', { name: 'Duskmoth', el: 'gloom', base: { hp: 15, atk: 5, def: 4, mag: 11, spd: 11 }, moves: [[1, 'wing_dust'], [4, 'gloom_bite'], [9, 'dust_cloud'], [15, 'spirit_light']], price: 240, cap: 0.55, desc: 'Powder wings and a sleepy gaze.' });
  kin('eelwyrm', { name: 'Eelwyrm', el: 'tide', base: { hp: 22, atk: 11, def: 6, mag: 9, spd: 8 }, moves: [[1, 'eel_coil'], [5, 'tide_splash'], [11, 'tail_flick'], [17, 'bubble_veil']], price: 290, cap: 0.4, desc: 'A river serpent with a crest like a wave.' });
  kin('rimestag', { name: 'Rimestag', el: 'tide', base: { hp: 26, atk: 12, def: 10, mag: 7, spd: 7 }, moves: [[1, 'frost_fang'], [6, 'rime_charge'], [12, 'bubble_veil'], [18, 'spirit_light']], price: 360, cap: 0.35, desc: 'A frost-antlered stag, calm and enormous.' });
  kin('lampwisp', { name: 'Lampwisp', el: 'light', base: { hp: 15, atk: 4, def: 5, mag: 12, spd: 9 }, moves: [[1, 'glimmer'], [4, 'spirit_light'], [10, 'ember_nuzzle'], [16, 'glimmer']], price: 320, cap: 0.4, desc: 'A small, kind flame that follows the lost.' });
  kin('stormkite', { name: 'Stormkite', el: 'gale', base: { hp: 18, atk: 11, def: 6, mag: 10, spd: 13 }, moves: [[1, 'peck'], [5, 'thunder_cry'], [11, 'lightning_dive'], [17, 'gale_cry']], price: 340, cap: 0.35, desc: 'A crackling ray of the upper sky.' });
  D.KIN_ORDER = Object.keys(KS);
  D.kinMoves = function (k) {
    var sp = KS[k.sp], out = [];
    sp.moves.forEach(function (m) { if (k.lv >= m[0] && out.indexOf(m[1]) < 0) out.push(m[1]); });
    while (out.length > 3) out.shift();
    return out;
  };
  D.kinStats = function (k) {
    var sp = KS[k.sp], b = sp.base, L = k.lv, bond = 1 + Math.min(10, (k.bond || 0)) * 0.01;
    function f(v, m) { return Math.round(v * (1 + 0.17 * (L - 1)) * bond * (m || 1)); }
    return { hp: Math.round(b.hp * (1 + 0.2 * (L - 1)) * bond + 10), mp: 0, atk: f(b.atk), def: f(b.def), mag: f(b.mag), res: f(b.def, 0.8), spd: Math.round(b.spd * (1 + 0.07 * (L - 1)) + 1), crit: 0.05 };
  };
  D.newKin = function (sp, lv, nick) { var k = { sp: sp, lv: lv || 1, xp: 0, bond: 0, nick: nick || '' }; k.hp = D.kinStats(k).hp; return k; };
  D.kinName = function (k) { return k.nick || KS[k.sp].name; };

  /* ---------- foes ---------- */
  var E = D.FOES = {};
  function foe(id, o) { o.id = id; E[id] = o; }
  /* human and monster foes. stats are level-1 bases scaled like Kin */
  foe('raider', { name: 'Raider', el: 'none', art: 'raider', base: { hp: 22, atk: 10, def: 6, mag: 3, res: 4, spd: 6 }, moves: ['f_slash', 'f_heavy'], xp: 7, gold: 9 });
  foe('cutpurse', { name: 'Cutpurse', el: 'none', art: 'raider', base: { hp: 18, atk: 9, def: 5, mag: 3, res: 4, spd: 10 }, moves: ['f_slash', 'f_cutpurse'], xp: 7, gold: 12 });
  foe('hexed', { name: 'Hexed Villager', el: 'gloom', art: 'villagerC', base: { hp: 20, atk: 8, def: 4, mag: 9, res: 6, spd: 6 }, moves: ['f_bolt', 'f_curse'], xp: 7, gold: 6 });
  foe('guard', { name: 'Crown Guard', el: 'none', art: 'guard', base: { hp: 28, atk: 11, def: 10, mag: 3, res: 6, spd: 5 }, moves: ['f_slash', 'f_summonbones'], xp: 12, gold: 18 });
  foe('warden', { name: 'Warden Recruit', el: 'light', art: 'warden', base: { hp: 26, atk: 10, def: 8, mag: 8, res: 9, spd: 6 }, moves: ['f_slash', 'f_beam'], xp: 12, gold: 16 });
  foe('ashen', { name: 'Ashen Scout', el: 'flame', art: 'ashen', base: { hp: 24, atk: 11, def: 6, mag: 7, res: 5, spd: 8 }, moves: ['f_slash', 'f_ash'], xp: 11, gold: 14 });
  foe('thornpup', { name: 'Thornling', el: 'stone', art: 'pipsprout', base: { hp: 18, atk: 8, def: 6, mag: 7, res: 5, spd: 6 }, moves: ['f_roots', 'f_slash'], xp: 6, gold: 4 });
  foe('sporecap', { name: 'Sporecap', el: 'stone', art: 'mossback', base: { hp: 24, atk: 6, def: 8, mag: 8, res: 8, spd: 3 }, moves: ['f_spore', 'f_toxin'], xp: 8, gold: 6 });
  foe('rustgolem', { name: 'Rust Golem', el: 'none', art: 'construct', base: { hp: 40, atk: 14, def: 12, mag: 2, res: 4, spd: 3 }, moves: ['f_smash', 'f_sweep'], xp: 16, gold: 20, drop: ['ore', 0.35] });
  foe('hollow', { name: 'Hollow', el: 'gloom', art: 'shade', base: { hp: 24, atk: 9, def: 5, mag: 12, res: 9, spd: 8 }, moves: ['f_bolt', 'f_chill'], xp: 11, gold: 12 });
  foe('boneknight', { name: 'Bone Knight', el: 'gloom', art: 'boneknight', base: { hp: 34, atk: 14, def: 10, mag: 4, res: 7, spd: 5 }, moves: ['f_slash', 'f_heavy', 'f_summonbones'], xp: 15, gold: 18 });
  foe('drowned', { name: 'Drowned Hand', el: 'tide', art: 'shade', base: { hp: 28, atk: 11, def: 7, mag: 8, res: 8, spd: 6 }, moves: ['f_tidal', 'f_slash'], xp: 12, gold: 14 });
  foe('sentry', { name: 'Archive Sentry', el: 'light', art: 'construct', base: { hp: 42, atk: 13, def: 13, mag: 12, res: 12, spd: 4 }, moves: ['f_beam', 'f_smash', 'f_barrier'], xp: 18, gold: 24, drop: ['ore', 0.4] });
  foe('husk', { name: 'Hush Husk', el: 'gloom', art: 'shade', base: { hp: 30, atk: 13, def: 8, mag: 13, res: 10, spd: 7 }, moves: ['f_hush', 'f_bolt'], xp: 17, gold: 20 });
  /* bosses (boss: true prevents Tether and fleeing) */
  foe('b_matron', { name: 'Briar Matron', el: 'stone', art: 'matron', boss: true, base: { hp: 135, atk: 11, def: 8, mag: 10, res: 8, spd: 5 }, moves: ['f_roots', 'f_heavy', 'f_heal', 'f_spore'], xp: 90, gold: 120 });
  foe('b_saltmaw', { name: 'Saltmaw', el: 'tide', art: 'saltmaw', boss: true, base: { hp: 200, atk: 16, def: 12, mag: 13, res: 12, spd: 6 }, moves: ['f_maul', 'f_tidal', 'f_chill', 'f_heal'], xp: 150, gold: 220 });
  foe('b_paleking', { name: 'The Pale King', el: 'gloom', art: 'paleking', boss: true, base: { hp: 290, atk: 17, def: 14, mag: 14, res: 14, spd: 6 }, moves: ['f_decree', 'f_heavy', 'f_summonbones', 'f_bolt'], xp: 210, gold: 320 });
  foe('b_sentinel', { name: 'Lamp Sentinel', el: 'light', art: 'sentinel', boss: true, base: { hp: 340, atk: 16, def: 18, mag: 14, res: 16, spd: 5 }, moves: ['f_beam', 'f_smash', 'f_barrier', 'f_sweep'], xp: 280, gold: 420 });
  foe('b_undertow', { name: 'The Undertow', el: 'gloom', art: 'undertow', boss: true, base: { hp: 430, atk: 14, def: 15, mag: 14, res: 18, spd: 8 }, moves: ['f_hush', 'f_unmake', 'f_chill', 'f_bolt'], xp: 600, gold: 800 });
  /* rivals (human fights, scripted) */
  foe('r_corvin', { name: 'Corvin', el: 'flame', art: 'corvin', rival: true, base: { hp: 120, atk: 14, def: 9, mag: 12, res: 9, spd: 10 }, moves: ['f_slash', 'f_ash', 'f_cutpurse'], xp: 60, gold: 60 });
  foe('r_odalys', { name: 'Odalys', el: 'light', art: 'odalys', rival: true, base: { hp: 130, atk: 13, def: 11, mag: 14, res: 12, spd: 8 }, moves: ['f_slash', 'f_beam', 'f_barrier'], xp: 60, gold: 60 });
  foe('r_iola', { name: 'Iola Quill', el: 'tide', art: 'iola', rival: true, base: { hp: 150, atk: 15, def: 12, mag: 11, res: 12, spd: 11 }, moves: ['f_slash', 'f_tidal', 'f_gale'], xp: 100, gold: 100 });
  foe('r_vane', { name: 'Rothgar Vane', el: 'none', art: 'vane', rival: true, base: { hp: 210, atk: 17, def: 15, mag: 5, res: 10, spd: 7 }, moves: ['f_heavy', 'f_summonbones', 'f_sweep'], xp: 140, gold: 160 });
  foe('r_corvin2', { name: 'Corvin', el: 'flame', art: 'corvin', rival: true, base: { hp: 280, atk: 16, def: 14, mag: 14, res: 14, spd: 12 }, moves: ['f_slash', 'f_ash', 'f_heavy'], xp: 200, gold: 200 });
  foe('r_odalys2', { name: 'Odalys', el: 'light', art: 'odalys', rival: true, base: { hp: 290, atk: 14, def: 16, mag: 15, res: 17, spd: 9 }, moves: ['f_slash', 'f_beam', 'f_barrier'], xp: 200, gold: 200 });
  D.foeStats = function (f, L) {
    var b = f.base, o = { hp: Math.round(b.hp * (1 + 0.2 * (L - 1)) + (f.boss || f.rival ? 0 : 6)) };
    var gr = (f.boss || f.rival) ? 0.085 : 0.15;
    ['atk', 'def', 'mag', 'res'].forEach(function (a) { o[a] = Math.round(b[a] * (1 + gr * (L - 1))); });
    o.spd = Math.round(b.spd * (1 + 0.06 * (L - 1)));
    if (f.boss || f.rival) o.hp = Math.round(b.hp * (1 + 0.08 * (L - 1)));
    o.mp = 99; o.crit = 0.05; return o;
  };

  /* ---------- encounter tables: [foeOrKin, minLv, maxLv, weight] ---------- */
  D.ZONES = {
    meadow: [['k:wick', 2, 4, 3], ['k:pipsprout', 2, 4, 3], ['k:mossback', 3, 5, 2], ['cutpurse', 3, 5, 1]],
    ashplain: [['k:soot', 2, 5, 3], ['k:emberling', 3, 6, 2], ['ashen', 4, 6, 2], ['k:gloamhound', 4, 6, 1]],
    whisperwood: [['k:pipsprout', 4, 7, 3], ['k:mossback', 4, 7, 2], ['k:duskmoth', 5, 8, 2], ['thornpup', 5, 7, 3], ['sporecap', 5, 8, 2], ['raider', 5, 7, 1]],
    coast: [['k:gullwing', 6, 9, 3], ['k:brinecrab', 6, 9, 3], ['k:eelwyrm', 8, 10, 1], ['cutpurse', 6, 8, 1]],
    beacon: [['k:stormkite', 9, 12, 2], ['k:brinecrab', 9, 12, 2], ['drowned', 9, 12, 3], ['k:eelwyrm', 10, 12, 2], ['raider', 9, 11, 1]],
    highmoor: [['k:rimestag', 10, 13, 1], ['k:cragmole', 10, 13, 3], ['k:gullwing', 10, 12, 2], ['guard', 11, 13, 1], ['raider', 10, 12, 1]],
    crypt: [['hollow', 12, 15, 3], ['boneknight', 13, 16, 2], ['k:duskmoth', 12, 15, 2], ['k:gloamhound', 13, 15, 2]],
    archive: [['sentry', 15, 18, 2], ['husk', 15, 19, 3], ['rustgolem', 15, 18, 2], ['hollow', 15, 18, 2], ['k:lampwisp', 15, 18, 1]],
    cave: [['k:cragmole', 5, 8, 3], ['rustgolem', 6, 9, 1], ['k:duskmoth', 5, 8, 2]]
  };

  /* ---------- shops ---------- */
  D.SHOPS = {
    thistle: { name: 'Mara\'s Goods', items: ['potion', 'ether', 'tonic', 'cord', 'smoke'], gear: ['t1'] },
    brine: { name: 'Gull & Anchor Supply', items: ['potion', 'hipotion', 'ether', 'tonic', 'seed', 'cord', 'smoke', 'bomb'], gear: ['t2'] },
    highmoor: { name: 'Highmoor Armory', items: ['hipotion', 'hiether', 'tonic', 'seed', 'strongcord', 'smoke', 'bomb'], gear: ['t3'] },
    cinder: { name: 'Ashmarket', items: ['potion', 'hipotion', 'ether', 'tonic', 'cord', 'smoke', 'bomb'], gear: ['t1', 't2'] }
  };
  D.TIERSHOP = function (cls, tierKey) {
    var tier = +tierKey.slice(1), out = [];
    out.push('w_' + D.fam(cls) + '_' + tier, 'a_' + D.armorKind(cls) + '_' + tier);
    return out;
  };
  D.KINSHOPS = {
    thistle: ['pipsprout', 'mossback'], brine: ['gullwing', 'brinecrab', 'cragmole'], highmoor: ['cragmole', 'emberling', 'duskmoth'], cinder: ['soot', 'emberling', 'gloamhound']
  };
  D.CHARMSHOP = { brine: ['c_0', 'c_2', 'c_6'], highmoor: ['c_3', 'c_4', 'c_5', 'c_7', 'c_9'], cinder: ['c_1', 'c_3', 'c_8'] };
})(FP);
