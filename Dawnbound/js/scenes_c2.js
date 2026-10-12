/* Dawnbound - Act III part 2: Lumeria (Q15-Q17, SQ14, SQ15) */
(function () {
  'use strict';
  var DB = window.DB, SC = DB.scenes, QD = DB.quests.def;
  var mqs = function (G) { return G.flags.mq || 0; };
  DB.speakers.pell = { name: 'Magister Pell', npc: 'scholar' };
  DB.speakers.apprentice = { name: 'Apprentice', npc: 'squire' };
  DB.speakers.cat = { name: 'Clockwork Cat', npc: 'clockwork_cat' };

  QD('mq16', { name: 'The Forbidden Archive', type: 'main', lv: 35, obj: function (G) { return !G.flags.thessaly_met ? 'Enter the Spire of Aster (north end of Lumeria) and reach the Sealed Archives.' : 'Find the original record of the first Dawnbound in the vault at the archive\'s far end.'; } });
  QD('mq17', { name: 'The Truth of the Marks', type: 'main', lv: 38, obj: function (G) { return G.flags.halcyon_back ? 'Go to the lighthouse. Maren is asking for you.' : 'Marisol\'s letter: sail to Port Halcyon (menu → Map).'; } });

  SC.skyroot_shore = async function (S) { var c = await S.choice('The Gull waits below the Skyroot.', ['Sail away', 'Stay']); if (c === 0) await S.sail(); else S.partyAt(770, 920, 'up'); };

  /* ---------- Q15 ---------- */
  SC.q15_guardian = async function (S) {
    S.music('boss', 1); S.partyWalk(770, 330, 40); S.shake(6); S.sfx('quake');
    await S.narr("At the summit, the great crystal vine coils into a gate. A guardian of root and living crystal unfolds from it — the Skyroot Guardian.");
    await S.say('seraphine', "...Warning: that is a defensive construct. It doesn't want to kill you. It wants to *test* you. Please don't die. I would like to meet you.", null);
    await S.boss('skyroot_guardian', { lv: 35, x: 770, y: 150, onWin: 'q15_gwin' });
  };
  SC.q15_gwin = async function (S) {
    S.flag('skyroot_done', 1); S.healAll(); S.xp(1200); S.music('lumeria', 2);
    await S.narr("The guardian bows, and the crystal gate sings open. Beyond it: Lumeria, the floating city, glass and gold in a sea of clouds.");
    S.toast('Lumeria is open.', 'quest'); S.camFollow();
  };
  SC.q15_sera = async function (S) {
    var G = S.G; S.flag('sera_met', 1); S.partyWalk(770, 620, 40); S.music('ghostly', 1);
    S.cam(770, 480, 600);
    if (S.is('seraphine')) {
      await S.narr("Lumeria's lower district — the slums beneath the glass towers. A crowd of scholars blocks the way. They know you.");
      S.spawn('scholar_a', 'scholar', 700, 480, 'down', { name: 'Scholar' }); S.spawn('scholar_b', 'scholar', 840, 480, 'down', { name: 'Scholar' });
      await S.say('scholar', "Go home, Vael. You were expelled.");
      await S.hsay({ mage: "I *told* you! The Black Sun isn't a myth! The seal was keyed to six bloodlines — and the bearers are *appearing!* Look at the lighthouses! Look at the — *notices her friends' hands* ...Look at *them*." });
      await S.hsay({ mage: "You have no idea what you are walking beside. Proof of my thesis. The most important people alive. And all of you are *covered in mud.*" });
      await S.say('vex', "I like her. She's rude.");
      S.despawn('scholar_a'); S.despawn('scholar_b'); S.flag('spire_open', 1);
    } else {
      await S.narr("Lumeria's lower district — the slums beneath the glass towers. In the plaza, a young woman is shouting at a crowd of scholars.");
      S.spawn('scholar_a', 'scholar', 700, 480, 'down', { name: 'Scholar' });
      S.spawnHero('seraphine', 770, 470, 'down');
      await S.say('seraphine', "I *told* you! The Black Sun isn't a myth! The seal was keyed to six bloodlines — and the bearers are *appearing!* Look at the lighthouses! Look at the — *she notices the party's hands* ...Look at *them*.");
      await S.say('scholar', "Go home, Vael. You were expelled.");
      await S.say('seraphine', "*to you, eyes bright* Do you have any idea what you are? You are a walking proof of my thesis. You're the most important people alive. And you're all *covered in mud.*");
      await S.say('vex', "I like her. She's rude.");
      await S.hsay({ _: "We need your help. We're looking for the first Dawnbound." });
      await S.say('seraphine', "*grinning* Oh, I know exactly where to start. Come with me. Bring a lot of snacks. And — *don't touch the books.*");
      S.despawn('seraphine'); S.despawn('scholar_a'); S.join('seraphine'); S.flag('spire_open', 1); S.ensureLevel(33);
    }
    S.done('mq15'); S.mq(16); S.quest('mq16'); S.xp(1500); S.camFollow();
    S.toast('Seraphine joined! The Spire of Aster is at the north end of Lumeria.', 'quest');
  };

  /* ---------- Q16 ---------- */
  SC.thessaly_talk = async function (S) {
    var G = S.G;
    if (S.is('seraphine') && !G.flags.corwin_met) {
      /* HOMECOMING VARIANT E */
      S.flag('corwin_met', 1);
      await S.narr("The Spire gates are barred. The guards don't even look at you.");
      await S.say('thessaly', "Vael. The doors remain closed. This is the third time I've said it.");
      await S.hsay({ mage: "*quietly* I wasn't asking to be let in. I'm *telling* you the Black Sun is awake." });
      await S.say('thessaly', "Guards.");
      S.spawn('corwin_n', 'corwin', 560, 400, 'right', { name: 'Corwin' });
      await S.say('corwin', "*hisses, from behind a pillar* Vael. The east service door. Nobody's watched it since midsummer.");
      await S.hsay({ mage: "Corwin Ashgrave. You — *you're helping me?*" });
      await S.say('corwin', "I always believed you. I just wasn't brave enough to say it. Go. I'll cover the door. And Seraphine — *prove me right.*");
      S.despawn('corwin_n'); S.flag('spire_open', 1); S.toast('Corwin opened a way in: the Spire of Aster (north).', 'quest');
      return;
    }
    await S.say('thessaly', "The Archive is closed. For good reasons.");
  };
  SC.q16_thessaly = async function (S) {
    S.flag('thessaly_met', 1); S.partyWalk(770, 420, 40); S.music('ghostly', 1);
    await S.narr("The deeper archive. The books here whisper as you pass. A silver-robed figure waits at the stair.");
    S.spawn('thessaly_f', 'thessaly', 770, 340, 'down', { name: 'Archmagister Thessaly' });
    await S.say('thessaly', "Seraphine. I expelled you to *protect* you. Those books drove the last scholar who read them mad.");
    await S.say('seraphine', "Then you should have read them with me instead of throwing me out.");
    await S.narr("A long silence. The Archmagister looks at the glowing marks on the party's hands, and something in her face gives.");
    await S.say('thessaly', "...The final vault is beyond the Reading Hall. The seal answers to you. *to you*, child — not to me. Go. And Seraphine — I am sorry.");
    S.despawn('thessaly_f'); S.flag('thessaly_gone', 1); S.camFollow();
  };
  SC.q16_vault = async function (S) {
    S.partyWalk(770, 300, 40); S.music('ghostly', 1);
    await S.narr("The vault opens. Light spills out: gold and green and violet. On the far wall, a mural — six heroes and, standing before them, a seventh, hand raised, light streaming from his palm.");
    await S.say('seraphine', "*reading the carved stone* 'Here is honored... VAELTHORN... the Dawn-King... who sealed the Black Sun within himself.' ...Within *himself.*", 'surprised');
    await S.say('liora', "...The Dark Lord was the hero.", 'sad');
    await S.say('seraphine', "He didn't seal the Black Sun away. He *became* the seal. Three hundred years alone in the dark with it. And now he's — *she can't finish*");
    await S.say('rowan', "...Grief. He's grieving.");
    await S.shake && S.shake(6); S.sfx('quake');
    await S.narr("The mural cracks. Pages rip themselves from shelves and spiral into the air, stitching together into a golem of living text.");
    await S.say('seraphine', "The Archive Guardian. Awakened by the discovery. *Don't let it close the vault!*");
    await S.boss('archive_guardian', { lv: 38, x: 770, y: 150, onWin: 'q16_win' });
  };
  SC.q16_win = async function (S) {
    S.healAll(); S.flag('boss_archive_guardian', 1); S.music('ghostly', 2);
    await S.narr("The golem unravels into loose pages that drift down like snow. Seraphine catches one and reads it, trembling.");
    await S.say('seraphine', "The first Dawnbound. Six marks, six bloodlines. And a seventh — Vaelthorn's — the *anchor.* There was a seventh Dawnmark. It should have gone to the Hollow King's heir — to *no one*. Unless — it didn't go to no one. It's... *looking for the other six.*");
    S.give('maren_page_first', 1, true); S.done('mq16'); S.mq(17); S.quest('mq17'); S.xp(3000); S.ensureLevel(38); S.camFollow();
    S.fade(1, 600); await S.map('lumeria', 'spire'); S.camFollow(); await S.fade(0, 600);
    await SC.q17_letter(S);
  };

  /* ---------- Q17 ---------- */
  SC.q17_letter = async function (S) {
    S.partyAt(770, 300, 'down'); S.music('sad', 2); S.spawn('seabird_n', 'seabird', 800, 320, 'left', { name: 'Seabird' });
    await S.narr("A seabird crashes onto the Spire's balcony, half-dead, a letter tied to its leg.");
    await S.say('marisol', "\"Ember — come home now. The Hollow King's army hit Halcyon. We drove them back, but Maren used the lighthouse to do it. She's fading. She's asking for you. — M.\"");
    S.despawn('seabird_n'); S.flag('ship', 1);
    await S.say('liora', "Maren.", 'sad');
    S.toast('Sail to Port Halcyon at once (menu → Map).', 'quest');
    S.flag('halcyon_scarred', 1); S.camFollow();
  };
  SC.q17_halcyon = async function (S) {
    S.flag('halcyon_back', 1); S.tint('#6a6a80', .18); S.music('sad', 1); S.partyAt(950, 815, 'up'); S.cam(960, 790, 0);
    await S.narr("Port Halcyon is scarred — burned houses, broken docks. Townsfolk wave weakly from the ruins.");
    S.spawn('pip_s', 'pip', 960, 700, 'down', { name: 'Pip' });
    await S.walk('pip_s', 1000, 780, 100);
    await S.narr("Pip runs to you and hugs you without a word.");
    S.despawn('pip_s'); S.camFollow();
    S.toast('Maren is in the lighthouse.', 'quest');
  };
  SC.q17_lighthouse = async function (S) {
    S.partyAt(767, 560, 'up'); S.cam(767, 520, 0); S.tint('#ff8a3c', .1);
    S.spawn('maren_d', 'elder_maren', 700, 480, 'right', { name: 'Elder Maren' }); S.spawn('hettie_d', 'hettie', 650, 500, 'right', { name: 'Hettie' });
    S.despawn('maren');
    await S.narr("At the lighthouse, Elder Maren lies beside the lamp. Hettie holds her hand.");
    await S.say('maren', "There you are. You found them. All of them?");
    await S.hsay({ _: "All but one. Highcrest." });
    await S.say('maren', "Good. That's good. *she reaches out; you take her hand* I should tell you. I'm a descendant of the first healer. Vaelthorn's healer. Her name was Maren too. She loved him. I think... I think everyone did.");
    await S.say('maren', "Don't hate him, Ember. Stop him. But don't hate him. He's just a boy who couldn't stop grieving.");
    await S.hsay({ _: "Elder..." });
    await S.say('maren', "And don't do what he did. Don't carry it alone. When it's dark — and it will be so dark — reach for them. *she looks toward the party* That's how you win. That's the only way anyone ever wins.");
    S.music(null);
    await S.narr("She smiles. Her silver eyes close. Outside, the great lamp flickers — and holds steady. It stays lit.");
    await S.wait(2500);
    await S.narr("Hettie weeps. Pip sobs into Marisol's coat. Liora kneels and quietly begins the Mistvale prayer for the dead. One by one, the others kneel too.");
    await S.wait(1200);
    S.despawn('maren_d'); S.despawn('hettie_d'); S.flag('maren_dead', 1);
    await S.fade(1, 1000); S.tint('#2a3a8a', .22); S.music('lanterns', 2);
    await S.cardText('<div class="cl">Funeral at Sea</div>', 2000);
    await S.map('port_halcyon', 'dock'); S.partyAt(1380, 575, 'left'); S.cam(1360, 575, 0); await S.fade(0, 1000);
    await S.narr("At dawn, the town releases lanterns onto the water. This time, you write a name: MAREN.");
    await S.say('liora', "*softly* So the light can find her.", 'sad');
    S.tint(null); S.give('maren_lantern', 1); S.done('mq17'); S.mq(18); S.quest('mq18'); S.xp(4000); S.healAll(); S.ensureLevel(40); S.camFollow(); S.flag('halcyon_scarred', 1);
    await S.card('END OF ACT III', 'Fire and Frost', 2800);
    S.toast("Maren's Lantern obtained. Highcrest is now on the sailing map.", 'quest');
    S.save();
  };

  /* ---------- SQ14: Lessons of the Spire ---------- */
  QD('sq14', { name: 'Lessons of the Spire', type: 'side', lv: 34, obj: 'Help Seraphine tutor the struggling apprentices (Lumeria lower plaza).' });
  SC.sq14_start = async function (S) {
    S.partyWalk(380, 700, 40); S.spawn('app1', 'squire', 330, 700, 'right', { name: 'Apprentice' });
    await S.say('apprentice', "Seraphine Vael! You're the best in the Spire — I mean, you *were*. Please — the exam's tomorrow. I can't make the sigils hold.");
    await S.say('seraphine', "...*sighs* Ordinarily I'd say you should have studied. But — fine. Sit. Watch.");
    S.quest('sq14'); S.camFollow(); S.despawn('app1'); S.flag('sq14_wait', 1);
    await S.say('seraphine', "(Talk to the apprentice again when you're ready to teach.)");
  };
  SC.apprentice_talk = async function (S) {
    var G = S.G;
    if (G.quests.sq14 === 'done') { await S.say('apprentice', "I passed! The examiners cried. I think they were relieved."); return; }
    if (G.quests.sq14 !== 'active') { await S.say('apprentice', "Please, Magister, the sigils..."); return; }
    await S.say('seraphine', "Look at the pattern. Four runes. Memorize the order, then repeat it. Don't rush.");
    var r1 = await S.mini.memory({ title: 'Sigil Lesson I', length: 4, symbols: 4 });
    await S.say('apprentice', r1.ok ? "It held! It *held!*" : "It... fizzled. Again?");
    if (!r1.ok) { await S.say('seraphine', "Patience. *Patience*, Seraphine. Again."); }
    var r2 = await S.mini.memory({ title: 'Sigil Lesson II', length: 5, symbols: 5 });
    await S.say('apprentice', "I think I understand it now!");
    await S.say('seraphine', "*quietly* ...Huh. That was less awful than I expected. You were a good student. *I* was the terrible teacher.");
    S.done('sq14'); S.xp(1800); S.affinity('seraphine', 3); S.give('starfruit_tart', 2);
  };
  DB.defNpcExtra = null;

  /* ---------- SQ15: The Clockwork Cat ---------- */
  QD('sq15', { name: 'The Clockwork Cat', type: 'side', lv: 36, obj: 'Find the lost clockwork cat in the Floating Gardens.' });
  SC.pell_talk = async function (S) {
    var G = S.G;
    if (G.quests.sq15 === 'done') { await S.say('pell', "The Archmagister's cat is home. The Archmagister is... less fierce. I'm relieved. Also terrified."); return; }
    if (G.flags.cat_found && G.quests.sq15 === 'active') {
      await S.say('pell', "Oh thank the stars — she's *purring*. Do you know whose cat this is? It's the Archmagister's. Thessaly built her. In her youth. She's been looking for her for a month and told no one.");
      S.done('sq15'); S.xp(2000); S.give('star_pin', 1); return;
    }
    if (G.quests.sq15 === 'active') { await S.say('pell', "She was last seen in the Floating Gardens' west terraces. She won't come to anyone who's afraid."); return; }
    await S.say('pell', "Have you seen a cat? Clockwork. Brass. About so big. She has a limp in the left hind leg and an attitude. I'm — it's not for me. It's for a friend.");
    var c = await S.choice('Magister Pell fidgets.', ['I\'ll look for her', 'Not now']); if (c === 0) S.quest('sq15');
  };
  SC.cat_talk = async function (S) {
    S.flag('cat_found', 1);
    await S.narr("You crouch. The clockwork cat regards you with polished brass eyes. Gears whir. She butts her head against your hand.");
    await S.say('seraphine', "*softly* ...That's Thessaly's work. Look at the signature on the left paw. She built this when she was *fifteen*.");
    await S.narr("The cat hops into your arms, purring like a clock.");
    S.toast('Bring the cat to Magister Pell.', 'quest');
  };
})();
