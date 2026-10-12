/* Dawnbound - enemy and boss definitions */
(function () {
  'use strict';
  var DB = window.DB;
  DB.enemyStats = function (L, d) {
    d = d || {};
    return { hp: Math.round((26 + 24 * L + 1.7 * L * L) * (d.hpMul || 1)), atk: (6 + 2.6 * L) * (d.atkMul || 1), def: (3 + 2.1 * L) * (d.defMul || 1), xp: Math.round((7 + 3.1 * L) * (d.xpMul || 1)), gold: Math.round((3 + 1.1 * L) * (d.goldMul || 1)) };
  };
  var T = DB.enemyTypes = {
    tidespawn: { name: 'Tidespawn', sprite: 'tidespawn', role: 'melee', hpMul: .9, atkMul: 1, spd: 64, r: 8, aggro: 160, atkRange: 26, wind: .45, cd: 1.6, scale: .95 },
    crab: { name: 'Grumpy Crab', sprite: 'grumpy_crab', role: 'melee', hpMul: 1.5, atkMul: .85, defMul: 1.5, spd: 42, r: 9, aggro: 100, atkRange: 26, wind: .5, cd: 1.9, kb: 70, scale: .9 },
    harpy: { name: 'Stormcrest Harpy', sprite: 'harpy', role: 'flyer', hpMul: .75, atkMul: .95, spd: 92, r: 8, aggro: 230, atkRange: 150, wind: .55, cd: 2.4, fly: true, proj: { count: 3, spread: 30, spd: 190, pow: .8 }, scale: .95 },
    root: { name: 'Hollow-root', sprite: 'hollow_root', role: 'melee', hpMul: 1.3, atkMul: 1, spd: 40, r: 9, aggro: 130, atkRange: 30, wind: .6, cd: 2.2, scale: 1 },
    soldier: { name: 'Hollow Soldier', sprite: 'hollow_soldier', role: 'melee', hpMul: 1.15, atkMul: 1, spd: 60, r: 8, aggro: 150, atkRange: 28, wind: .5, cd: 1.7, scale: 1 },
    thug: { name: 'Guild Thug', sprite: 'guild_thug', role: 'melee', hpMul: 1, atkMul: 1.1, spd: 76, r: 8, aggro: 170, atkRange: 26, wind: .4, cd: 1.4, throws: { pow: .7, spd: 220, range: 160 }, scale: 1 },
    /* tinted variants of the supplied enemy sprites for deeper dungeons */
    ghost: { name: 'Drowned Echo', sprite: 'hollow_soldier', tint: '#68d4ff', tintAmt: .55, alpha: .8, role: 'melee', hpMul: 1, atkMul: 1.05, spd: 62, r: 8, aggro: 160, atkRange: 28, wind: .5, cd: 1.7 },
    ember: { name: 'Cinder Thrall', sprite: 'hollow_soldier', tint: '#ff7a3a', tintAmt: .5, role: 'melee', hpMul: 1.2, atkMul: 1.15, spd: 64, r: 8, aggro: 150, atkRange: 28, wind: .45, cd: 1.6 },
    frost: { name: 'Rime Thrall', sprite: 'hollow_soldier', tint: '#a8e6ff', tintAmt: .55, role: 'melee', hpMul: 1.25, atkMul: 1, spd: 58, r: 8, aggro: 150, atkRange: 28, wind: .5, cd: 1.7 },
    wisp: { name: 'Skyroot Wisp', sprite: 'harpy', tint: '#9affd8', tintAmt: .55, role: 'flyer', hpMul: .7, atkMul: .95, spd: 96, r: 8, aggro: 220, atkRange: 150, wind: .5, cd: 2.2, fly: true, proj: { count: 1, spread: 0, spd: 200, pow: .9 } },
    page: { name: 'Living Page', sprite: 'harpy', tint: '#ffe8a0', tintAmt: .6, role: 'flyer', hpMul: .65, atkMul: 1, spd: 90, r: 8, aggro: 220, atkRange: 150, wind: .5, cd: 2, fly: true, proj: { count: 2, spread: 20, spd: 210, pow: .85 } },
    veil: { name: 'Veil Stalker', sprite: 'guild_thug', tint: '#b29ae8', tintAmt: .55, role: 'melee', hpMul: 1, atkMul: 1.2, spd: 82, r: 8, aggro: 170, atkRange: 26, wind: .35, cd: 1.3 },
    rootwraith: { name: 'Rotwood Wraith', sprite: 'hollow_root', tint: '#a77bff', tintAmt: .45, role: 'melee', hpMul: 1.4, atkMul: 1.1, spd: 44, r: 9, aggro: 140, atkRange: 30, wind: .55, cd: 2 },
    void: { name: 'Void Husk', sprite: 'hollow_soldier', tint: '#6a3aa8', tintAmt: .6, role: 'melee', hpMul: 1.35, atkMul: 1.2, spd: 66, r: 8, aggro: 170, atkRange: 28, wind: .45, cd: 1.5 },
    shade: { name: 'Black Sun Shade', sprite: 'harpy', tint: '#5a2a90', tintAmt: .6, role: 'flyer', hpMul: .8, atkMul: 1.2, spd: 100, r: 8, aggro: 240, atkRange: 160, wind: .5, cd: 2, fly: true, proj: { count: 3, spread: 36, spd: 210, pow: .85 } },
    smuggler: { name: 'Smuggler', sprite: 'guild_thug', tint: '#ffd27a', tintAmt: .3, role: 'melee', hpMul: 1, atkMul: 1, spd: 72, r: 8, aggro: 160, atkRange: 26, wind: .4, cd: 1.5, throws: { pow: .6, spd: 210, range: 150 } },
    ironcrab: { name: 'Iron Crab', sprite: 'grumpy_crab', tint: '#8898b8', tintAmt: .5, role: 'melee', hpMul: 1.7, atkMul: .9, defMul: 1.6, spd: 44, r: 9, aggro: 100, atkRange: 26, wind: .5, cd: 1.9, kb: 80 }
  };
  /* ---------------- bosses ----------------
     hpMul multiplies the normal enemy hp curve; phases switch at hp fractions; pats are attack patterns (see combat.js) */
  DB.bosses = {
    brineshrike: { name: 'Brineshrike', sprite: 'brineshrike', scale: 1.5, r: 18, hpMul: 9, atkMul: .9, spd: 52, special: 'rear', xpMul: 4, music: 'boss',
      phases: [{ at: 1, pats: ['smash', 'fan', 'slam'] }] },
    coral_matriarch: { name: 'The Coral Matriarch', sprite: 'coral_matriarch', scale: 1.5, r: 18, hpMul: 11, atkMul: 1, spd: 44, xpMul: 4, music: 'boss',
      phases: [{ at: 1, pats: ['slam', 'rain', 'fan'] }, { at: .5, pats: ['slam', 'rain', 'summon:tidespawn:2', 'fan'] }] },
    harpy_queen: { name: 'Stormcrest Harpy Queen', sprite: 'harpy_queen', scale: 1.45, r: 14, hpMul: 11, atkMul: 1, spd: 78, fly: true, xpMul: 4, music: 'boss',
      phases: [{ at: 1, pats: ['dive', 'fan', 'gust'] }, { at: .5, pats: ['dive', 'summon:harpy:2', 'fan', 'gust', 'dive'] }] },
    vashka: { name: 'Vashka the Tide-Wraith', sprite: 'vashka', scale: 1.4, r: 14, hpMul: 13, atkMul: 1.05, spd: 56, special: 'tide', xpMul: 5, music: 'boss',
      phases: [{ at: 1, pats: ['whip', 'fan', 'rain'] }, { at: .5, pats: ['whip', 'rain', 'summon:ghost:2', 'ring'] }] },
    smuggler_captain: { name: 'Captain Redd', sprite: 'guild_thug', tint: '#ffd27a', tintAmt: .25, scale: 1.4, r: 12, hpMul: 7, atkMul: 1, spd: 74, xpMul: 3, music: 'boss', phases: [{ at: 1, pats: ['dash', 'fan', 'smash'] }] },
    hollowed_stag: { name: 'The Hollowed Stag', sprite: 'hollowed_stag', scale: 1.5, r: 18, hpMul: 13, atkMul: 1.05, spd: 70, special: 'purify', xpMul: 5, music: 'boss',
      phases: [{ at: 1, pats: ['charge', 'fan', 'rain'] }, { at: .5, pats: ['charge', 'summon:rootwraith:2', 'ring', 'slam'] }] },
    lady_nyx: { name: 'Lady Nyx of the Veil', sprite: 'lady_nyx', scale: 1.2, r: 11, hpMul: 13, atkMul: 1.1, spd: 80, special: 'clones', xpMul: 5, music: 'boss',
      phases: [{ at: 1, pats: ['dash', 'fan', 'rain'] }, { at: .5, pats: ['dash', 'fan', 'ring', 'dash'] }] },
    gorran: { name: 'Gorran the Ashbound', sprite: 'gorran', scale: 1.7, r: 20, hpMul: 14, atkMul: 1.1, spd: 50, special: 'fury', xpMul: 6, music: 'boss',
      phases: [{ at: 1, pats: ['slam', 'rain', 'fan'] }, { at: .5, pats: ['slam', 'summon:ember:2', 'ring', 'rain'] }] },
    skyroot_guardian: { name: 'Skyroot Guardian', sprite: 'skyroot_guardian', scale: 1.6, r: 18, hpMul: 10, atkMul: 1, spd: 50, xpMul: 3, music: 'boss',
      phases: [{ at: 1, pats: ['slam', 'rain', 'whip'] }] },
    archive_guardian: { name: 'The Archive Guardian', sprite: 'archive_guardian', scale: 1.6, r: 18, hpMul: 14, atkMul: 1.05, spd: 52, xpMul: 6, music: 'boss',
      phases: [{ at: 1, pats: ['fan', 'rain', 'slam'] }, { at: .5, pats: ['summon:page:3', 'ring', 'whip', 'rain'] }] },
    edran: { name: 'Sir Edran the Fallen', sprite: 'edran_fallen', scale: 1.25, r: 11, hpMul: 15, atkMul: 1.2, spd: 86, special: 'mirror', xpMul: 7, music: 'boss',
      phases: [{ at: 1, pats: ['dash', 'smash', 'fan'] }, { at: .5, pats: ['dash', 'smash', 'ring', 'dash'] }] },
    vaelthorn_hl: { name: 'Vaelthorn, the Hollow King', sprite: 'vaelthorn_armored', scale: 1.5, r: 16, hpMul: 99, atkMul: 1.5, spd: 80, special: 'unwinnable', xpMul: 0, music: 'finalboss',
      phases: [{ at: 1, pats: ['slam', 'ring', 'fan', 'rain'] }] },
    vaelthorn1: { name: 'Vaelthorn, the Hollow King', sprite: 'vaelthorn_armored', scale: 1.5, r: 16, hpMul: 20, atkMul: 1.1, spd: 80, xpMul: 8, music: 'finalboss',
      phases: [{ at: 1, pats: ['slam', 'dash', 'fan', 'summon:void:2'] }] },
    vaelthorn2: { name: 'Vaelthorn, the Dawn-King', sprite: 'vaelthorn_dawnking', scale: 1.5, r: 16, hpMul: 24, atkMul: 1.2, spd: 90, special: 'firstsix', xpMul: 8, music: 'finalboss',
      phases: [{ at: 1, pats: ['dash', 'smash', 'fan', 'ring', 'rain'] }] },
    vaelthorn3: { name: 'The Black Sun', sprite: 'vaelthorn_black_sun', scale: 1.1, r: 30, hpMul: 30, atkMul: 1.3, spd: 0, special: 'blacksun', sheet4: true, xpMul: 12, music: 'finalboss', noMove: true,
      phases: [{ at: 1, pats: ['ring', 'rain', 'fan', 'slam'] }, { at: .5, pats: ['ring', 'rain', 'rain', 'beamsweep', 'fan'] }] },
    shadow_sun: { name: 'The Shadow of the Black Sun', sprite: 'shadow_black_sun', scale: 1.1, r: 30, hpMul: 40, atkMul: 1.4, spd: 0, sheet4: true, noMove: true, xpMul: 10, music: 'finalboss',
      phases: [{ at: 1, pats: ['ring', 'rain', 'fan', 'slam'] }, { at: .5, pats: ['ring', 'rain', 'rain', 'beamsweep', 'summon:void:2', 'fan'] }] },
    trench_leviathan: { name: 'The Trench Leviathan', sprite: 'brineshrike', tint: '#2a3a7a', tintAmt: .5, scale: 1.8, r: 22, hpMul: 16, atkMul: 1.1, spd: 56, special: 'rear', xpMul: 6, music: 'boss', phases: [{ at: 1, pats: ['smash', 'fan', 'slam'] }, { at: .5, pats: ['smash', 'summon:ghost:2', 'ring', 'rain'] }] },
    frost_wyrm: { name: 'Mother Frost Wyrm', sprite: 'frost_wyrm', scale: 1.5, r: 22, hpMul: 14, atkMul: 1.05, spd: 52, xpMul: 5, music: 'boss', phases: [{ at: 1, pats: ['slam', 'fan', 'charge'] }] },
    echo_hero: { name: 'Echo of the First Six', sprite: 'caelan_ultimate', scale: 1.15, r: 10, hpMul: 13, tint: '#9ad4ff', tintAmt: .35, atkMul: 1.1, spd: 74, xpMul: 3, music: 'boss', phases: [{ at: 1, pats: ['dash', 'smash', 'fan'] }, { at: .5, pats: ['dash', 'summon:ghost:2', 'ring', 'fan', 'rain'] }] }
  };
})();
