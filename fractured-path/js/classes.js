/* classes.js - four more base classes, and 24 ascended forms (two per base class). */
(function (FP) {
  'use strict';
  var D = FP.D, K = D.SK;
  function S(id, name, mp, tgt, o, desc) { o = o || {}; o.id = id; o.name = name; o.mp = mp; o.tgt = tgt; o.desc = desc || ''; K[id] = o; }
  function M(pow, el, extra) { var o = { type: 'mag', pow: pow }; if (el) o.el = el; if (extra) for (var k in extra) o[k] = extra[k]; return o; }
  function Ph(pow, el, extra) { var o = { type: 'phys', pow: pow }; if (el) o.el = el; if (extra) for (var k in extra) o[k] = extra[k]; return o; }

  /* ---------------- new weapons ---------------- */
  D.WNAMES.rapier = ['Practice Foil', 'Steel Rapier', 'Wind Rapier', 'Skysilver Epee', 'Zephyr Brand'];
  D.WNAMES.bell = ['Tin Handbell', 'Brass Chime', 'Silver Carillon', 'Echo Bell', 'Dawnpeal'];
  D.WNAMES.warblade = ['Grave Blade', 'Blightsteel Sword', 'Oathbreaker', 'Hollowbrand', 'Doomedge'];
  D.WNAMES.bonestaff = ['Rib Staff', 'Marrow Rod', 'Ossuary Staff', 'Grievewood Staff', 'Crown of Bone'];

  /* ---------------- new base classes ---------------- */
  var C = D.CLASSES;
  C.duelist = { arc: 'hero', name: 'Duelist', tag: 'Rapier and nerve', blurb: 'Quick, precise and hard to hit. Lives on critical strikes and gale-edged cuts.', weapon: 'rapier', armor: 'light', fastWeapon: true, crit: 0.05,
    base: { hp: 35, mp: 12, atk: 9, def: 5, mag: 4, res: 5, spd: 10 }, grow: { hp: 6.8, mp: 2.4, atk: 2.0, def: 1.1, mag: 0.8, res: 1.1, spd: 1.9 },
    skills: ['lunge', 'feint', 'flickerjab', 'galeslash', 'duelfocus', 'tempestdance'], start: 'lunge' };
  C.bellringer = { arc: 'hero', name: 'Bellringer', tag: 'Chime and chorus', blurb: 'Plays the Bell\'s old songs. Quickens friends, soothes wounds and rattles foes.', weapon: 'bell', armor: 'robe', caster: true,
    base: { hp: 33, mp: 20, atk: 4, def: 5, mag: 9, res: 8, spd: 7 }, grow: { hp: 6.2, mp: 3.8, atk: 0.9, def: 1.2, mag: 2.2, res: 1.7, spd: 1.2 },
    skills: ['toll', 'quicken', 'hymn', 'discord', 'resonance', 'knell'], start: 'toll' };
  C.blightknight = { arc: 'villain', name: 'Blightknight', tag: 'Blade and blight', blurb: 'A fallen guardian in black plate. Drinks life from foes and shrugs off blows.', weapon: 'warblade', armor: 'heavy',
    base: { hp: 46, mp: 10, atk: 10, def: 8, mag: 4, res: 5, spd: 4 }, grow: { hp: 9.4, mp: 2, atk: 2.2, def: 2.0, mag: 0.8, res: 1.2, spd: 0.7 },
    skills: ['gravecut', 'wardingblight', 'leech', 'blightbrand', 'dreadcleave', 'oathbreaker'], start: 'gravecut' };
  C.bonewright = { arc: 'villain', name: 'Bonewright', tag: 'Bone and burial', blurb: 'Builds walls from ribs and calls the fallen back. Patient, grim and hard to finish off.', weapon: 'bonestaff', armor: 'robe', caster: true,
    base: { hp: 32, mp: 21, atk: 4, def: 4, mag: 10, res: 8, spd: 5 }, grow: { hp: 6, mp: 4, atk: 0.8, def: 1, mag: 2.5, res: 1.6, spd: 0.9 },
    skills: ['bonedart', 'bonewall', 'marrowdrain', 'grievecall', 'rattle', 'requiem'], start: 'bonedart' };
  ['duelist', 'bellringer', 'blightknight', 'bonewright'].forEach(function (c) { D.makeGear(c); });
  D.CLASS_ORDER = {
    hero: ['vanguard', 'spellwright', 'wayfinder', 'lampbearer', 'duelist', 'bellringer'],
    villain: ['reaver', 'hexcaster', 'shade', 'cinderbinder', 'blightknight', 'bonewright']
  };

  /* ---------------- base skills for the new classes ---------------- */
  S('lunge', 'Lunge', 3, 'e1', Ph(130, null, { critUp: 0.25 }), 'Fast thrust. High crit chance.');
  S('feint', 'Feint', 4, 'self', { buff: { eva: 0.5, spd: 0.3, t: 2 } }, 'Evasion and Speed up.');
  S('flickerjab', 'Flicker Jab', 6, 'rnd', Ph(70, null, { hits: 3 }), 'Three quick jabs.');
  S('galeslash', 'Gale Slash', 6, 'e1', Ph(140, 'gale', { st: [{ k: 'stun', ch: 0.25, t: 1 }] }), 'Wind-edged cut. May stun.');
  S('duelfocus', 'Duel Focus', 6, 'self', { buff: { atk: 0.4, spd: 0.2, t: 3 } }, 'Attack and Speed up.');
  S('tempestdance', 'Tempest Dance', 13, 'eA', Ph(130, 'gale'), 'A dance of cuts on every foe.');
  S('toll', 'Toll', 3, 'e1', M(125, 'light'), 'A pealing note of light.');
  S('quicken', 'Quicken', 6, 'aA', { buff: { spd: 0.3, atk: 0.15, t: 3 } }, 'Party Speed up.');
  S('hymn', 'Hymn', 7, 'aA', { heal: 90 }, 'A soothing hymn heals the party.');
  S('discord', 'Discord', 6, 'eA', M(70, null, { debuff: { atk: -0.2, spd: -0.2, t: 3 } }), 'Sour note. Foes weaken.');
  S('resonance', 'Resonance', 9, 'aA', { buff: { mag: 0.3, res: 0.3, t: 3 } }, 'Party Magic and Resist up.');
  S('knell', 'Knell', 13, 'eA', M(150, 'light', { st: [{ k: 'stun', ch: 0.3, t: 1 }] }), 'A knell shakes every foe.');
  S('gravecut', 'Grave Cut', 3, 'e1', Ph(140, 'gloom'), 'A cold, heavy cut.');
  S('wardingblight', 'Warding Blight', 5, 'self', { buff: { def: 0.5, res: 0.3, t: 3 }, taunt: 3 }, 'Foes target you. Defense up.');
  S('leech', 'Leech', 6, 'e1', Ph(110, 'gloom', { drain: 0.5 }), 'Steal life with the blade.');
  S('blightbrand', 'Blightbrand', 6, 'e1', Ph(120, 'gloom', { st: [{ k: 'poison', ch: 1, t: 4 }] }), 'Poison sears the foe.');
  S('dreadcleave', 'Dread Cleave', 10, 'eA', Ph(100, 'gloom', { st: [{ k: 'stun', ch: 0.3, t: 1 }] }), 'Sweeps all foes. May stun.');
  S('oathbreaker', 'Oathbreaker', 11, 'e1', Ph(280, 'gloom', { selfHp: 0.1 }), 'Huge strike. Costs 10% HP.');
  S('bonedart', 'Bone Dart', 3, 'e1', M(130, 'gloom'), 'A sliver of bone and dusk.');
  S('bonewall', 'Bone Wall', 6, 'aA', { buff: { def: 0.3, res: 0.3, t: 3 } }, 'Party Defense and Resist up.');
  S('marrowdrain', 'Marrow Drain', 6, 'e1', M(100, 'gloom', { drain: 0.7 }), 'Draw life through the bone.');
  S('grievecall', 'Grieve Call', 14, 'dead', { revive: 0.4 }, 'Call back a fallen ally.');
  S('rattle', 'Rattle', 8, 'eA', M(80, 'gloom', { debuff: { def: -0.2, t: 3 } }), 'Hits all foes and softens armor.');
  S('requiem', 'Requiem', 15, 'eA', M(160, 'gloom'), 'A dirge for every foe.');

  /* ---------------- ascended forms ---------------- */
  D.ASCEND = {};
  D.ASC_LV = 12;
  function asc(id, from, name, tag, blurb, mods, extra, skills) {
    var b = C[from];
    var o = { arc: b.arc, name: name, tag: tag, blurb: blurb, weapon: b.weapon, armor: b.armor, caster: b.caster, fastWeapon: b.fastWeapon, fam: b.fam || from, asc: true, from: from,
      base: b.base, grow: b.grow, mods: mods, skills: b.skills.concat(skills.map(function (s) { return s[0]; })), start: b.start, tether: b.tether, crit: b.crit, kinB: b.kinB };
    if (extra) for (var k in extra) o[k] = extra[k];
    C[id] = o;
    (D.ASCEND[from] = D.ASCEND[from] || []).push(id);
    skills.forEach(function (s) { S(s[0], s[1], s[2], s[3], s[4], s[5]); });
  }
  /* hero */
  asc('paladin', 'vanguard', 'Paladin of Dawn', 'Light and plate', 'Armored in morning. Smites with light and mends those behind the shield.', { hp: 1.1, def: 1.1, res: 1.15 }, {}, [
    ['sunbrand', 'Sunbrand', 9, 'e1', Ph(190, 'light'), 'Brand the foe with sunlight.'],
    ['laylight', 'Lay on Light', 7, 'a1', { heal: 220 }, 'Heal one ally well.'],
    ['aegisdawn', 'Aegis of Dawn', 12, 'aA', { buff: { def: 0.35, res: 0.35, regen: 1, t: 3 } }, 'Party Defense, Resist and regen.'],
    ['judgment', 'Judgment', 18, 'e1', Ph(320, 'light', { execute: 0.5 }), 'Hits hard, harder on the wounded.']]);
  asc('warlord', 'vanguard', 'Warlord', 'Banner and blade', 'Leads from the front. Turns a party into a charge.', { atk: 1.12, hp: 1.08 }, {}, [
    ['bannerup', 'Raise Banner', 8, 'aA', { buff: { atk: 0.3, spd: 0.15, t: 4 } }, 'Party Attack and Speed up.'],
    ['sunderline', 'Sunder Line', 10, 'eA', Ph(130, null, { debuff: { def: -0.25, t: 3 } }), 'Hits all foes, lowers Defense.'],
    ['titanblow', 'Titan Blow', 12, 'e1', Ph(300, null, { selfHp: 0.08 }), 'A tremendous blow.'],
    ['laststand', 'Last Stand', 14, 'self', { buff: { atk: 0.5, def: 0.4, t: 3 }, taunt: 3 }, 'Draw all attacks, hit harder.']]);
  asc('archmage', 'spellwright', 'Archmage', 'Sky and storm', 'Command of every element. Calls down ruin on whole battlefields.', { mag: 1.15, mp: 1.15 }, {}, [
    ['meteorfall', 'Meteor Fall', 22, 'eA', M(190, 'flame'), 'A meteor swarm on all foes.'],
    ['tidalcrown', 'Tidal Crown', 18, 'eA', M(140, 'tide'), 'A wave crowns the field.'],
    ['arcanesurge', 'Arcane Surge', 6, 'self', { buff: { mag: 0.5, t: 3 } }, 'Magic up sharply.'],
    ['elementbreak', 'Element Break', 24, 'e1', M(340, 'light'), 'A beam that unmakes a foe.']]);
  asc('runeblade', 'spellwright', 'Runeblade', 'Rune and steel', 'Etches runes on a blade and walks into the fight. Sturdy for a caster.', { hp: 1.15, def: 1.25, res: 1.1 }, {}, [
    ['runestrike', 'Rune Strike', 9, 'e1', M(170, 'flame', { st: [{ k: 'burn', ch: 0.5, t: 3 }] }), 'A burning rune cut.'],
    ['frostbrand', 'Frostbrand', 9, 'e1', M(170, 'tide'), 'A frozen rune cut.'],
    ['wardrune', 'Ward Rune', 8, 'self', { buff: { def: 0.6, res: 0.6, t: 3 } }, 'Rune armor.'],
    ['runestorm', 'Runestorm', 18, 'eA', M(150, 'gale'), 'A storm of cutting glyphs.']]);
  asc('beastmaster', 'wayfinder', 'Beastmaster', 'Bond and wild', 'Fights shoulder to shoulder with Kin. Tethers anything, trusts everything.', { hp: 1.06 }, { tether: 0.28, kinB: 0.18 }, [
    ['packhowl', 'Pack Howl', 8, 'aA', { buff: { atk: 0.35, mag: 0.35, spd: 0.2, t: 3 }, kinOnly: true }, 'Kin Attack, Magic and Speed up.'],
    ['savagebond', 'Savage Bond', 6, 'e1', Ph(160, null, { lure: true }), 'Damage, and eases Tether.'],
    ['stampede', 'Stampede', 11, 'eA', Ph(110), 'The whole pack charges.'],
    ['wildheart', 'Wild Heart', 12, 'aA', { heal: 160, buff: { regen: 1, t: 4 } }, 'Heal and regen the party.']]);
  asc('stormranger', 'wayfinder', 'Stormranger', 'Sky and string', 'Fires arrows that arrive with thunder. Fast, accurate and loud.', { spd: 1.1, atk: 1.06 }, { crit: 0.07 }, [
    ['thunderarrow', 'Thunder Arrow', 8, 'e1', Ph(200, 'gale', { st: [{ k: 'stun', ch: 0.35, t: 1 }] }), 'May stun.'],
    ['skystorm', 'Skystorm Volley', 12, 'eA', Ph(120, 'gale'), 'A rain of storm arrows.'],
    ['huntersmark', "Hunter's Mark", 6, 'e1', Ph(90, null, { debuff: { def: -0.3, res: -0.3, t: 4 } }), 'Mark a foe, lower defenses.'],
    ['stormeye', 'Storm Eye', 16, 'e1', Ph(330, 'gale', { crit: 1 }), 'A guaranteed critical.']]);
  asc('embersaint', 'lampbearer', 'Saint of Embers', 'Flame and grace', 'Heals with a warm fire and rises the fallen. A lamp that does not go out.', { mag: 1.1, res: 1.1, hp: 1.05 }, {}, [
    ['emberbless', 'Ember Blessing', 14, 'aA', { heal: 100, buff: { atk: 0.2, t: 3 } }, 'Heal and embolden the party.'],
    ['haloburst', 'Halo Burst', 14, 'eA', M(150, 'light'), 'Light on every foe.'],
    ['saintgrace', "Saint's Grace", 24, 'dead', { revive: 1 }, 'Return an ally at full health.'],
    ['purifyflame', 'Purifying Flame', 12, 'aA', { heal: 60, cleanse: true }, 'Cleanse and heal the party.']]);
  asc('dawnkeeper', 'lampbearer', 'Dawnkeeper', 'Ward and warm', 'A guardian of the hearth. Shields allies and keeps the party breathing.', { def: 1.2, hp: 1.12, res: 1.1 }, {}, [
    ['lightward', 'Light Ward', 10, 'aA', { buff: { def: 0.4, res: 0.4, t: 3 } }, 'Party Defense and Resist up.'],
    ['sunbarrier', 'Sun Barrier', 8, 'a1', { buff: { def: 0.8, res: 0.8, t: 2 } }, 'Nearly shield one ally.'],
    ['dawnsong', 'Dawn Song', 14, 'aA', { buff: { regen: 1, atk: 0.15, t: 5 } }, 'Long regen and Attack up.'],
    ['beaconblast', 'Beacon Blast', 18, 'e1', M(290, 'light'), 'A beam from the lantern.']]);
  asc('windblade', 'duelist', 'Windblade', 'Gale and grace', 'A blur that cuts a whole room before anyone moves.', { spd: 1.15 }, { crit: 0.1 }, [
    ['cyclonecut', 'Cyclone Cut', 9, 'eA', Ph(120, 'gale'), 'A spinning cut on all foes.'],
    ['zephyrstep', 'Zephyr Step', 5, 'self', { buff: { eva: 0.7, spd: 0.4, t: 2 } }, 'Evade and speed up.'],
    ['galedance', 'Gale Dance', 12, 'rnd', Ph(80, 'gale', { hits: 5 }), 'Five cuts at random.'],
    ['skysplitter', 'Skysplitter', 15, 'e1', Ph(330, 'gale', { crit: 1 }), 'A guaranteed critical.']]);
  asc('miragefencer', 'duelist', 'Mirage Fencer', 'Feint and finish', 'Fights an afterimage ahead. Foes strike the wrong target.', { def: 1.1, hp: 1.08 }, { crit: 0.07 }, [
    ['afterimage', 'Afterimage', 5, 'self', { buff: { eva: 0.8, t: 2 }, taunt: 2 }, 'Foes strike a phantom.'],
    ['phantomthrust', 'Phantom Thrust', 8, 'e1', Ph(200, null, { critUp: 0.4 }), 'High crit thrust.'],
    ['mirrorstrike', 'Mirror Strike', 9, 'e1', Ph(170, null, { debuff: { atk: -0.3, mag: -0.3, t: 3 } }), 'Hit and weaken.'],
    ['perfectriposte', 'Perfect Riposte', 16, 'e1', Ph(340, null, { crit: 1 }), 'The finishing counter.']]);
  asc('chimemaster', 'bellringer', 'Chimemaster', 'Tempo and peal', 'Conducts the party like an orchestra. Everyone moves a half-beat faster.', { mag: 1.1, spd: 1.1 }, {}, [
    ['tempobell', 'Tempo Bell', 9, 'aA', { buff: { spd: 0.45, t: 3 } }, 'Party Speed up sharply.'],
    ['chorusdawn', 'Chorus of Dawn', 12, 'aA', { heal: 130 }, 'A big party heal.'],
    ['crescendo', 'Crescendo', 12, 'aA', { buff: { atk: 0.35, mag: 0.35, t: 3 } }, 'Party Attack and Magic up.'],
    ['grandpeal', 'Grand Peal', 18, 'eA', M(200, 'light'), 'A thunderous peal.']]);
  asc('dirgekeeper', 'bellringer', 'Dirgekeeper', 'Silence and sorrow', 'Plays the Bell\'s grief. Takes the fight out of enemies.', { res: 1.2, mag: 1.1 }, {}, [
    ['dirge', 'Dirge', 12, 'eA', { debuff: { atk: -0.35, mag: -0.35, spd: -0.2, t: 3 } }, 'Foes lose strength and speed.'],
    ['hushnote', 'Hush Note', 9, 'e1', M(130, 'gloom', { st: [{ k: 'stun', ch: 0.6, t: 1 }] }), 'Likely stuns.'],
    ['mournchime', 'Mournful Chime', 12, 'aA', { heal: 80, cleanse: true }, 'Heal and cleanse the party.'],
    ['deathknell', 'Death Knell', 20, 'eA', M(190, 'gloom', { execute: 0.35 }), 'Stronger on weakened foes.']]);
  /* villain */
  asc('warbringer', 'reaver', 'Warbringer', 'Rage and ruin', 'Sets whole fields ablaze with fury. Slaughter spreads.', { atk: 1.12, hp: 1.1 }, {}, [
    ['ravage', 'Ravage', 12, 'eA', Ph(140, null, { st: [{ k: 'bleed', ch: 0.6, t: 3 }] }), 'Cuts all foes. Bleeds.'],
    ['howlwar', 'Howl of War', 8, 'aA', { buff: { atk: 0.35, spd: 0.2, t: 3 } }, 'Party Attack and Speed up.'],
    ['skullcrusher', 'Skullcrusher', 12, 'e1', Ph(300, null, { debuff: { def: -0.3, t: 3 } }), 'Heavy blow, lower Defense.'],
    ['massacre', 'Massacre', 20, 'eA', Ph(210, null, { selfHp: 0.1 }), 'Costs 10% HP.']]);
  asc('bloodtyrant', 'reaver', 'Blood Tyrant', 'Thirst and throne', 'Rules by taking. Every wound he gives heals his own.', { hp: 1.2, atk: 1.05 }, {}, [
    ['crimsonfeast', 'Crimson Feast', 8, 'e1', Ph(180, null, { drain: 0.8 }), 'Steal most of the damage as HP.'],
    ['sanguinerush', 'Sanguine Rush', 4, 'self', { buff: { atk: 0.4, spd: 0.2, t: 3 }, selfHp: 0.08 }, 'Attack and Speed up for blood.'],
    ['tyrantdecree', "Tyrant's Decree", 10, 'eA', { debuff: { atk: -0.3, def: -0.3, t: 3 } }, 'Foes lose Attack and Defense.'],
    ['sovereignrend', 'Sovereign Rend', 16, 'e1', Ph(330, null, { drain: 0.5, st: [{ k: 'bleed', ch: 1, t: 3 }] }), 'Drains and bleeds.']]);
  asc('plaguelord', 'hexcaster', 'Plaguelord', 'Rot and ruin', 'Spreads sickness faster than anyone can cure it.', { mag: 1.1, hp: 1.06 }, {}, [
    ['plaguecloud', 'Plague Cloud', 11, 'eA', M(80, 'gloom', { st: [{ k: 'poison', ch: 1, t: 4 }] }), 'Poisons every foe.'],
    ['rotbloom', 'Rotbloom', 9, 'e1', M(140, 'gloom', { st: [{ k: 'poison', ch: 1, t: 5 }] }), 'Heavy poison.'],
    ['virulence', 'Virulence', 8, 'e1', M(60, 'gloom', { debuff: { def: -0.3, res: -0.3, t: 4 } }), 'Weakens defenses.'],
    ['blackdeath', 'Black Death', 22, 'eA', M(200, 'gloom', { st: [{ k: 'poison', ch: 1, t: 5 }] }), 'A killing plague.']]);
  asc('voidwitch', 'hexcaster', 'Void Witch', 'Void and hush', 'Pulls pieces of the Hush into a spell. Raw, hungry and loud.', { mag: 1.18, mp: 1.1 }, {}, [
    ['voidbolt', 'Void Bolt', 11, 'e1', M(230, 'gloom'), 'A bolt of nothing.'],
    ['nullfield', 'Null Field', 10, 'eA', { debuff: { mag: -0.4, atk: -0.2, t: 3 } }, 'Foes lose Magic and Attack.'],
    ['starvelight', 'Starve the Light', 16, 'eA', M(150, 'gloom', { st: [{ k: 'stun', ch: 0.35, t: 1 }] }), 'May stun all foes.'],
    ['unmakespell', 'Unmake', 24, 'e1', M(380, 'gloom', { execute: 0.4 }), 'Erase a weakened foe.']]);
  asc('nightblade', 'shade', 'Nightblade', 'Dusk and dagger', 'Waits, then ends it. Every strike is a death sentence.', { atk: 1.08 }, { crit: 0.09 }, [
    ['throatcut', 'Throatcut', 7, 'e1', Ph(220, null, { critUp: 0.5 }), 'Very high crit chance.'],
    ['deathmark', 'Deathmark', 6, 'e1', Ph(90, null, { debuff: { def: -0.35, t: 4 } }), 'Mark a foe for death.'],
    ['moonflurry', 'Moonlit Flurry', 13, 'rnd', Ph(90, 'gloom', { hits: 5 }), 'Five cuts at random.'],
    ['eclipsecut', 'Eclipse Cut', 17, 'e1', Ph(350, 'gloom', { crit: 1, execute: 0.3 }), 'Certain crit; cruel to the weak.']]);
  asc('phantom', 'shade', 'Phantom', 'Smoke and steal', 'Barely there. Takes what it wants and leaves nothing to hit.', { spd: 1.15, hp: 1.06 }, { crit: 0.05 }, [
    ['vanish', 'Vanish', 5, 'self', { buff: { eva: 0.85, t: 2 } }, 'Nearly untouchable.'],
    ['ghostpocket', 'Ghost Pocket', 9, 'eA', Ph(80, null, { steal: true }), 'Lifts gold from every foe.'],
    ['hauntcut', 'Haunting Cut', 9, 'e1', Ph(170, 'gloom', { st: [{ k: 'stun', ch: 0.4, t: 1 }] }), 'May stun.'],
    ['phantomwaltz', 'Phantom Waltz', 14, 'rnd', Ph(100, null, { hits: 4 }), 'A waltz of four cuts.']]);
  asc('emberlord', 'cinderbinder', 'Emberlord', 'Furnace and flock', 'The valley\'s fire given a crown. Companions burn with him.', { mag: 1.1 }, { kinB: 0.25 }, [
    ['infernoveil', 'Inferno Veil', 9, 'aA', { buff: { atk: 0.3, mag: 0.3, t: 3 } }, 'Party Attack and Magic up.'],
    ['cinderstorm', 'Cinderstorm', 15, 'eA', M(150, 'flame', { st: [{ k: 'burn', ch: 0.8, t: 3 }] }), 'Burns every foe.'],
    ['emberpact', 'Ember Pact', 12, 'aA', { heal: 90, buff: { atk: 0.25, t: 3 } }, 'Heal and embolden.'],
    ['volcanicwrath', 'Volcanic Wrath', 22, 'e1', M(340, 'flame'), 'A volcano on one foe.']]);
  asc('phoenixbinder', 'cinderbinder', 'Phoenix Binder', 'Ash and rebirth', 'Burns down, burns up, burns again. A party that does not stay fallen.', { res: 1.1, hp: 1.1, mag: 1.05 }, {}, [
    ['rebirthflame', 'Rebirth Flame', 20, 'dead', { revive: 0.8, buff: { atk: 0.25, t: 3 } }, 'Return an ally, fired up.'],
    ['ashenmantle', 'Ashen Mantle', 12, 'aA', { buff: { regen: 1, def: 0.25, t: 4 } }, 'Party regen and Defense.'],
    ['firebird', 'Firebird', 13, 'eA', M(130, 'flame'), 'A bird of fire passes over.'],
    ['phoenixdive', 'Phoenix Dive', 18, 'e1', M(300, 'flame', { drain: 0.4 }), 'A burning dive that heals.']]);
  asc('deathknight', 'blightknight', 'Deathknight', 'Grave and ward', 'A wall that bleeds life from anything that touches it.', { hp: 1.15, def: 1.12 }, {}, [
    ['soulbrand', 'Soulbrand', 9, 'e1', Ph(200, 'gloom', { drain: 0.4 }), 'A branding cut that heals.'],
    ['graveward', 'Grave Ward', 8, 'self', { buff: { def: 0.7, res: 0.5, t: 3 }, taunt: 3 }, 'Draw attacks, take less.'],
    ['harvest', 'Harvest', 13, 'eA', Ph(130, 'gloom', { drain: 0.3 }), 'Reap every foe.'],
    ['reaperscharge', "Reaper's Charge", 18, 'e1', Ph(340, 'gloom', { execute: 0.4 }), 'Deadly to the wounded.']]);
  asc('doomherald', 'blightknight', 'Doom Herald', 'Omen and edict', 'Announces the end. Foes falter under the weight of it.', { atk: 1.1, hp: 1.08 }, { crit: 0.04 }, [
    ['omen', 'Omen', 10, 'eA', { debuff: { atk: -0.3, def: -0.3, t: 3 } }, 'Foes lose Attack and Defense.'],
    ['dooming', 'Dooming Gaze', 9, 'e1', Ph(150, 'gloom', { st: [{ k: 'stun', ch: 0.6, t: 1 }] }), 'Likely stuns.'],
    ['tollruin', 'Toll of Ruin', 15, 'eA', Ph(160, 'gloom'), 'A heavy toll on all foes.'],
    ['finaldecree', 'Final Decree', 20, 'e1', Ph(360, 'gloom', { execute: 0.5, selfHp: 0.1 }), 'The last word.']]);
  asc('lich', 'bonewright', 'Lich', 'Soul and flame', 'Death learned, kept and worn. Spells that cost nothing but others.', { mag: 1.18 }, {}, [
    ['soulflame', 'Soulflame', 11, 'e1', M(220, 'gloom'), 'A cold, burning bolt.'],
    ['deathcoil', 'Death Coil', 10, 'e1', M(160, 'gloom', { drain: 0.8 }), 'Steals most of the damage.'],
    ['phylactery', 'Phylactery', 10, 'self', { buff: { def: 0.5, res: 0.5, regen: 1, t: 4 } }, 'Hardens and regenerates.'],
    ['necrostorm', 'Necrotic Storm', 22, 'eA', M(190, 'gloom', { st: [{ k: 'poison', ch: 0.6, t: 4 }] }), 'A storm that poisons.']]);
  asc('ossuaryking', 'bonewright', 'Ossuary King', 'Crown and company', 'A king of the buried. The dead stand where the living fall.', { hp: 1.15, def: 1.1, res: 1.1 }, {}, [
    ['bonelegion', 'Bone Legion', 12, 'aA', { buff: { atk: 0.3, def: 0.3, t: 3 } }, 'Party Attack and Defense up.'],
    ['calldead', 'Call of the Dead', 18, 'dead', { revive: 0.7 }, 'Raise a fallen ally.'],
    ['crownbone', 'Crown of Bone', 8, 'a1', { buff: { def: 0.6, res: 0.6, t: 3 } }, 'Cover one ally in bone.'],
    ['gravemarch', 'Grave March', 16, 'eA', M(150, 'gloom', { debuff: { atk: -0.2, t: 3 } }), 'Hits all foes and weakens.']]);
  C.embersaint && (C.embersaint.name = 'Saint of Embers');

  /* ---------------- ultimate forms: the third tier, one for each ascended form ---------------- */
  D.ULT = {};
  D.ULT_LV = 24;
  var ULTS = [
    /* id, ascended form, name, tag, blurb, element, role, signature */
    ['seraphknight', 'paladin', 'Seraph Knight', 'Wings of morning', 'Plate of pure dawn. Stands in front of the world and does not move.', 'light', 't', 'Dawn Sunder'],
    ['highmarshal', 'warlord', 'High Marshal', 'Crown of the charge', 'A banner that armies follow into the dark and back out.', 'none', 'p', 'Banner of Ruin'],
    ['arcanesovereign', 'archmage', 'Arcane Sovereign', 'Stars at the fingertip', 'Holds a sky of spells in one open hand.', 'gale', 'm', 'Starfall'],
    ['runelord', 'runeblade', 'Runelord', 'Glyph and godsteel', 'Every swing carves a spell into the air that lingers.', 'tide', 'p', 'Glyph Cataclysm'],
    ['wildheart', 'beastmaster', 'Wildheart', 'One pack, one heart', 'Fights as a pack of one. Kin burn brighter at the Wildheart\'s side.', 'stone', 'p', 'Primal Roar'],
    ['tempestsentinel', 'stormranger', 'Tempest Sentinel', 'Storm on a string', 'Every arrow is the first drop of a thunderstorm.', 'gale', 'p', 'Thunder Volley'],
    ['radiantsaint', 'embersaint', 'Radiant Saint', 'A lamp for the whole world', 'Light enough to carry everyone home.', 'flame', 'h', 'Pyre of Grace'],
    ['hearthwarden', 'dawnkeeper', 'Hearthwarden', 'Walls of warm light', 'Builds a sanctuary where there was only a battlefield.', 'light', 't', 'Sanctum of Dawn'],
    ['zephyrsovereign', 'windblade', 'Zephyr Sovereign', 'A hundred winds', 'Gone before the sound arrives. Cuts before the wind moves.', 'gale', 'p', 'Hundred Winds'],
    ['phantasmduelist', 'miragefencer', 'Phantasm Duelist', 'All the other selves', 'Fights with every version of themselves at once.', 'light', 'p', 'Endless Afterimage'],
    ['grandconductor', 'chimemaster', 'Grand Conductor', 'The whole choir', 'The party becomes music and the music does not miss.', 'light', 'h', 'Crescendo'],
    ['griefsovereign', 'dirgekeeper', 'Grief Sovereign', 'Silence made king', 'Ends the song. Ends the fight. Ends the foe.', 'gloom', 'm', 'Silence Eternal'],
    ['ruintitan', 'warbringer', 'Ruin Titan', 'A walking wildfire', 'Fury so large it has its own weather.', 'flame', 'p', 'Worldburn'],
    ['crimsonemperor', 'bloodtyrant', 'Crimson Emperor', 'Throne of red', 'Takes what is owed and then some. Heals on every cut.', 'gloom', 'p', 'Sanguine Decree'],
    ['pestilencesovereign', 'plaguelord', 'Pestilence Sovereign', 'Rot in bloom', 'Garden of sickness, tended with love.', 'gloom', 'm', 'Blight Bloom'],
    ['voidempress', 'voidwitch', 'Void Empress', 'The Hush, crowned', 'Speaks the Hush aloud. Reality listens.', 'gloom', 'm', 'Hush Unbound'],
    ['eclipseblade', 'nightblade', 'Eclipse Blade', 'The last dusk', 'One cut, and the light goes out of the room.', 'gloom', 'p', 'Final Dusk'],
    ['wraithsovereign', 'phantom', 'Wraith Sovereign', 'A thousand shadows', 'Cannot be touched, cannot be counted, cannot be stopped.', 'gloom', 'p', 'Thousand Shadows'],
    ['infernosovereign', 'emberlord', 'Inferno Sovereign', 'Crown of cinders', 'The valley\'s fire, wearing a throne.', 'flame', 'm', 'Crown of Cinders'],
    ['eternalphoenix', 'phoenixbinder', 'Eternal Phoenix', 'Ash and again', 'Dies gloriously, daily, and keeps the party with it.', 'flame', 'h', 'Rebirth Pyre'],
    ['dreadmarshal', 'deathknight', 'Dread Marshal', 'Grave and gate', 'A wall that has already died once and was not impressed.', 'gloom', 't', 'Grave Reckoning'],
    ['harbinger', 'doomherald', 'Harbinger', 'The last edict', 'Reads the end aloud, in a voice the world agrees with.', 'gloom', 'm', 'Last Edict'],
    ['archlich', 'lich', 'Archlich', 'Soul without end', 'Has misplaced mortality and found it was never needed.', 'gloom', 'm', 'Soulstorm'],
    ['boneemperor', 'ossuaryking', 'Bone Emperor', 'Throne of the buried', 'An empire of the quiet, with room for everyone.', 'gloom', 't', 'Throne of Bones']
  ];
  ULTS.forEach(function (u) {
    var id = u[0], a = C[u[1]], el = u[5], role = u[6], sig = u[7], base = a.from;
    var m = {}; for (var k in a.mods) m[k] = 1 + (a.mods[k] - 1) * 1.8 + 0.04;
    ['hp', 'mp'].forEach(function (k) { m[k] = (m[k] || 1) + 0.04; });
    var sk = [];
    function add(sid, n, mp, tgt, o, d) { S(id + '_' + sid, n, mp, tgt, o, d); sk.push(id + '_' + sid); }
    if (role === 'p') {
      add('a', sig, 18, 'e1', Ph(400, el), 'The finest strike this form knows.');
      add('b', 'Sovereign Sweep', 16, 'eA', Ph(210, el, { debuff: { def: -0.2, t: 3 } }), 'Hits all foes and softens armor.');
      add('c', 'Zenith', 14, 'aA', { buff: { atk: 0.4, spd: 0.2, t: 4 } }, 'Party Attack and Speed up.');
    } else if (role === 'm') {
      add('a', sig, 20, 'e1', M(430, el), 'A spell at the limit of what the world allows.');
      add('b', 'Cataclysm', 18, 'eA', M(240, el, { debuff: { res: -0.2, t: 3 } }), 'Hits all foes and weakens Resist.');
      add('c', 'Overflow', 14, 'aA', { buff: { mag: 0.4, res: 0.3, t: 4 } }, 'Party Magic and Resist up.');
    } else if (role === 'h') {
      add('a', sig, 22, 'aA', { heal: 260 }, 'Heal the whole party.');
      add('b', 'Everlight', 16, 'aA', { buff: { def: 0.4, res: 0.4, regen: 1, t: 4 } }, 'Party Defense, Resist and regen.');
      add('c', 'Full Return', 24, 'dead', { revive: 1.0 }, 'Raise a fallen ally at full strength.');
    } else {
      add('a', sig, 18, 'e1', Ph(320, el, { drain: 0.5 }), 'A heavy strike that restores the bearer.');
      add('b', 'Bulwark Absolute', 14, 'aA', { buff: { def: 0.5, res: 0.5, t: 4 } }, 'Party Defense and Resist up.');
      add('c', 'Retribution', 16, 'eA', Ph(190, el, { debuff: { atk: -0.3, t: 3 } }), 'Hits all foes and blunts their strikes.');
    }
    C[id] = { arc: a.arc, name: u[2], tag: u[3], blurb: u[4], weapon: a.weapon, armor: a.armor, caster: a.caster, fastWeapon: a.fastWeapon, fam: a.fam, asc: true, ult: true, from: base, ascFrom: u[1],
      base: a.base, grow: a.grow, mods: m, skills: a.skills.concat(sk), start: a.start, tether: a.tether, crit: a.crit, kinB: a.kinB };
    if (a.tether) C[id].tether = a.tether * 1.2;
    (D.ULT[u[1]] = D.ULT[u[1]] || []).push(id);
  });

  D.SKILL_LV = [1, 3, 5, 8, 12, 16, 12, 14, 18, 22, 24, 26, 28];
  D.SKILL_AP = [0, 2, 3, 3, 4, 5, 0, 3, 4, 5, 0, 6, 7];
  D.baseOf = function (cls) { var c = C[cls]; return c && c.from ? c.from : cls; };

  /* the trial foe used for ascension: scales with the player's level */
  D.FOES.trial_echo = { id: 'trial_echo', name: 'Echo of Yourself', el: 'none', art: 'shade', rival: true, base: { hp: 130, atk: 14, def: 11, mag: 13, res: 11, spd: 9 }, moves: ['f_slash', 'f_bolt', 'f_heavy'], xp: 100, gold: 120 };

})(window.FP);
