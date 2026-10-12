/* Dawnbound - Act III part 1: Frostmark (Q12-Q14, SQ12, SQ13) */
(function () {
  'use strict';
  var DB = window.DB, SC = DB.scenes, QD = DB.quests.def;
  var mqs = function (G) { return G.flags.mq || 0; };
  DB.speakers.torvi = { name: 'Skald Torvi', npc: 'clan_warrior' };
  DB.speakers.rolf = { name: 'Rolf', npc: 'clan_warrior' };

  QD('mq12', { name: 'The Exile of the North', type: 'main', lv: 26, obj: function (G) { return G.flags.brakka_met || G.hero === 'brakka' ? 'Continue north along the glacier road to Frostmark.' : 'Follow the glacier road north. Someone is singing in the storm.'; } });
  QD('mq13', { name: 'The Siege of Frostmark', type: 'main', lv: 28, obj: function (G) { return !G.flags.q13_siege ? 'Reach Frostmark\'s plaza.' : !G.flags.q13_forge ? 'Defend the hall, then speak to Jarl Hald.' : 'Enter the Glacier Forge (east side of Frostmark) and stop Gorran.'; } });
  QD('mq14', { name: 'A Feast for Heroes', type: 'main', lv: 32, obj: function (G) { return G.flags.feast_done ? 'Climb to the Aurora Hillside (northeast).' : 'Go to the Great Mead Hall — the feast is about to begin.'; } });
  QD('mq15', { name: 'The Exiled Scholar', type: 'main', lv: 33, obj: function (G) { return G.flags.skyroot_done ? 'Climb the Skyroot to Lumeria and find the shouting scholar in the lower plaza.' : 'Sail to Lumeria (menu → Map) and climb the Skyroot Ascent.'; } });

  SC.glacier_shore = async function (S) { var c = await S.choice('The Gull waits in the ice-fog.', ['Set sail', 'Stay']); if (c === 0) await S.sail(); else S.partyAt(770, 930, 'up'); };
  SC.frost_shore = async function (S) { var c = await S.choice('The Gull waits at the dock.', ['Set sail', 'Stay']); if (c === 0) await S.sail(); else S.partyAt(770, 880, 'up'); };

  /* ---------- Q12 ---------- */
  SC.q12_enter = async function (S) {
    var G = S.G; S.music('blizzard', 2); S.tint('#bcd8ff', .14); S.partyWalk(770, 720, 40);
    await S.narr("A blizzard. The party trudges through snow toward Frostmark. Wind howls — and through it, something else. Singing. Loud, off-key, joyful.");
    S.cam(770, 600, 700);
    if (S.is('brakka')) {
      /* HOMECOMING VARIANT D */
      await S.narr("The border of the Frostmark clan lands. You know this ridge. You haven't stood here in three years.");
      S.spawn('sigrun_b', 'sigrun', 770, 600, 'down', { name: 'Sigrun' });
      await S.say('sigrun', "*hand on her axe* Stop — who...? ...Brakka?", 'surprised');
      await S.hsay({ berserker: "Sigrun. You've got a new scar. It suits you." });
      await S.say('sigrun', "Frostmark is under siege. Hald is wounded — he sent me to the border to wait for you. He said: 'Tell my brother I need him. Tell him I was never angry.'");
      await S.hsay({ berserker: "...Never angry. HA. He's a worse liar than I am a singer." });
      await S.say('vex', "Is this the part where we run toward the burning? I hate that part.");
      await S.say('liora', "Yes. Yes it is.", 'worried');
      S.despawn('sigrun_b'); S.flag('brakka_met', 1);
    } else {
      S.spawn('brakka_n', 'brakka_starter', 770, 600, 'down', { name: 'Brakka' });
      await S.say('brakka', "♪ — and the mead was SWEET and the BEARD was LONG — ♪ — Oh! Travelers! Are you lost? You look lost. You also look cold. Come, come, I have a fire and three roasted goats!");
      await S.say('vex', "Three?");
      await S.say('brakka', "I was hungry and lonely. *sees the marks; gasps theatrically* GLOWING HANDS! You are my destiny-friends! I KNEW it! I knew the ancestors wouldn't give me a glowing hand for nothing!");
      await S.say('rowan', "*whispering* ...He's very loud.");
      await S.say('liora', "*whispering* I like him.", 'happy');
      await S.say('brakka', "I've been exiled three years. I live at the edge of my clan's lands — see that ridge? My brother Hald is Jarl now. A good Jarl. A good man. I hurt him once. The battle-rage took me, and I didn't see whose face I was swinging at.");
      await S.say('brakka', "*quieter* A man who can't tell his brother from his enemy shouldn't be allowed home.");
      await S.hsay({ knight: "A man who fears his own strength is exactly the man I'd trust at my back.", healer: "You're allowed home, Brakka. You're allowed anywhere you're needed.", rogue: "Well, I'm a thief who ran from my family too. Congratulations: you're not alone.", hunter: "...I won't judge. Come with us.", mage: "Statistically, your clan can use whatever it is you are. Come." });
      await S.say('brakka', "*wipes his eyes with a fist the size of a ham* HA! Then it is DECIDED. We go to Frostmark! And you, little fox — *to Rowan* — will not hide behind the wolf!");
      S.despawn('brakka_n'); S.join('brakka'); S.flag('brakka_met', 1); S.ensureLevel(26);
    }
    S.done('mq12'); S.mq(13); S.quest('mq13'); S.xp(1000); S.tint(null); S.camFollow(); S.healAll();
    S.toast('Brakka\'s Rage meter fills as he fights — when full, tap the Burst button for Stormhewn Fury.', 'quest');
  };

  /* ---------- Q13: Siege ---------- */
  SC.q13_siege = async function (S) {
    var G = S.G; S.flag('q13_siege', 1); S.flag('hall_burning', 1); S.music('boss', 1); S.tint('#ff5a20', .18);
    S.partyWalk(770, 520, 50); S.cam(770, 380, 900);
    await S.narr("Frostmark's great hall burns. Black smoke boils over the glacier walls. Clanspeople run with buckets of snow; the ice itself weeps.");
    S.spawn('gorran_f', 'gorran', 770, 250, 'down', { name: 'Gorran' }); S.shake(6); S.sfx('roar');
    await S.say('gorran', "Burn. All of it. The Hollow King wants it quiet.");
    await S.narr("A giant of cinders — Gorran the Ashbound, Herald of the Black Sun — melts the glacier wall with a sweep of one arm.");
    S.spawn('hald_f', 'hald', 770, 440, 'down', { name: 'Jarl Hald' }); S.spawn('sigrun_f', 'sigrun', 710, 450, 'right', { name: 'Sigrun' });
    await S.say('brakka', "Hald!");
    await S.say('hald', "*coughing, one hand pressed to his side* ...Brakka. You came back.");
    await S.say('brakka', "You're bleeding — I'm sorry — I'm so sorry — ");
    await S.say('hald', "Shut up, you big idiot. I forgave you before the scar even healed. *Fight.*");
    S.despawn('hald_f'); S.despawn('sigrun_f'); S.flag('hald_up', 1);
    await S.say('gorran', "Tiny. All of you. So *tiny*.");
    await S.battle([{ type: 'ember', lv: 29, n: 4, x: 770, y: 360 }, { type: 'ember', lv: 29, n: 3, x: 560, y: 420 }, { type: 'frost', lv: 29, n: 3, x: 980, y: 420 }], { onWin: 'q13_siege2' });
  };
  SC.q13_siege2 = async function (S) {
    S.healAll(); S.music('frostmark', 1); S.flag('q13_forge', 1);
    await S.narr("The last Cinder Thrall collapses. The fires die back, hissing, as clan warriors cheer. Gorran has withdrawn — down into the Glacier Forge.");
    await S.say('hald', "*limping up, bandaged* The forge. He fled to the forge. He's melting the glacier from inside. If he reaches the heart of the ice, the whole hold goes into the sea.");
    await S.say('brakka', "Then we stop him. Together. Brothers.");
    await S.say('hald', "*grins* Together.");
    S.xp(1200); S.camFollow(); S.tint(null); S.ensureLevel(30);
    S.toast('The Glacier Forge is open (east side of Frostmark).', 'quest');
  };
  SC.hald_talk = async function (S) {
    var G = S.G;
    if (mqs(G) >= 14) { await S.say('hald', S.is('brakka') ? "You're my brother and my Jarl-in-arms. The hold is yours any time." : "Brakka stays? Brakka *stays*. Then Frostmark is stronger than it's ever been."); return; }
    await S.say('hald', mqs(G) === 13 ? "The forge is east of the plaza. Gorran waits there. Go with the Ancestors." : "Frostmark stands, thanks to you.");
  };
  SC.sigrun_talk = async function (S) { await S.say('sigrun', mqs(S.G) >= 14 ? "Hall's repaired. The mead barrels survived. That's the real victory." : "If you need a wall held, call Sigrun. If you need a wall *taken*, call Brakka."); };
  SC.bera_talk = async function (S) {
    var c = await S.choice('Mead-wife Bera waves a ladle.', ['Rest (60 G) and save', 'Chat', 'Never mind']);
    if (c === 0) return DB.menus.inn(60);
    if (c === 1) await S.say('bera', "Frostmark's winter is long. Our mead is longer.");
  };
  SC.q13_boss_intro = async function (S) {
    S.music('boss', 1); S.partyWalk(770, 410, 40); S.tint('#ff7a30', .14); S.shake(5);
    await S.narr("At the forge's heart, a pool of molten glass. Gorran rises from it, cinders spilling off his shoulders like snow.");
    await S.say('gorran', "I have melted kingdoms. A *hall* is nothing. A *hold* is nothing. Burn.");
    await S.say('brakka', "Rage meter fills automatically, *kadelin*. When it's full — press the Burst button. We finish him together.");
    await S.boss('gorran', { lv: 32, x: 770, y: 200, onWin: 'q13_win' });
  };
  SC.q13_win = async function (S) {
    S.tint(null); S.music('sad', 2); S.healAll(); S.flag('q13_done', 1); S.flag('hall_burning', 0);
    await S.narr("Gorran shatters into cooling ash. Snow falls through the broken roof of the forge, and for the first time in days the glacier is quiet.");
    await S.fade(1, 700); await S.map('frostmark', 'plaza'); S.partyAt(770, 540, 'up'); await S.fade(0, 700);
    S.spawn('hald_h', 'hald', 770, 440, 'down', { name: 'Jarl Hald' });
    await S.narr("The clan cheers. Hald, bandaged, limps up to Brakka and hugs him. Brakka sobs into his shoulder.");
    await S.say('hald', "Your exile is ended. By my word as Jarl.");
    await S.say('brakka', "I don't deserve — ");
    await S.say('hald', "It's not about deserve. It's about home.");
    S.despawn('hald_h'); S.affinity('brakka', 3);
    S.done('mq13'); S.mq(14); S.quest('mq14'); S.xp(2500); S.ensureLevel(32); S.camFollow();
    S.toast('The Mead Hall is open. Go feast!', 'quest');
  };

  /* ---------- Q14: Feast & Aurora ---------- */
  SC.q14_feast = async function (S) {
    var G = S.G; S.flag('feast_done', 1); S.music('feast', 1); S.partyWalk(770, 520, 40); S.cam(770, 480, 600);
    await S.narr("Frostmark's victory feast. Long tables, roaring fires, a hundred voices singing different songs at once.");
    await S.say('brakka', "EAT! DRINK! This is the best day of my life and I have had a LOT of good days!");
    /* Vex drinking contest */
    await S.narr("First: the drinking contest. Vex steps up against a clan champion twice their size.");
    var r1 = await S.mini.mash({ title: 'Drinking Contest', seconds: 8, goal: 40, rival: 4, intro: 'Tap to drink! Vex needs your help — and perhaps a little sleight of hand.' });
    await S.say('vex', "*wins, pocketing three coins and a spoon* I didn't cheat. I *optimized*.", 'happy');
    await S.say('clan', "That's the third time the barrel has been empty by the time I look at it!");
    /* Rowan arm wrestle */
    await S.narr("Next: Rowan, red-faced, arm-wrestles a clan warrior. Ash watches with great interest.");
    var r2 = await S.mini.mash({ title: 'Arm Wrestle', seconds: 6, goal: 30, rival: 5.5, intro: 'Mash A to push Rowan\'s arm down. (Rowan will probably lose.)' });
    await S.narr("Rowan loses. Ash lunges and bites the winner's boot. The hall erupts in laughter.");
    await S.say('rowan', "...Ash. *Ash.*", 'happy');
    /* Liora dance */
    await S.narr("Then Liora is dragged into a dance by six clansmen, and leads them all.");
    var r3 = await S.mini.rhythm({ title: 'The Frostmark Reel', notes: 20, bpm: 120 });
    await S.say('liora', "I think I've been promoted to Queen of Frostmark.", 'happy');
    /* Brakka's song */
    await S.narr("Finally, Brakka climbs onto a table and sings a song about the HERO — badly — and everyone joins in.");
    await S.say('brakka', "♪ — and our friend, who is TALL, and our friend, who is BRAVE — ♪");
    await S.say(null, "The song makes no sense. The song has no tune. By the end every voice in the hall is singing it anyway.");
    S.affinity('liora', 1); S.affinity('rowan', 1); S.affinity('vex', 1); S.affinity('brakka', 2); S.give('mead_mug', 3); S.xp(500);
    S.camFollow(); S.healAll();
    await S.fade(1, 800); S.tint('#1a2a5a', .2); await S.map('aurora_hillside', 'start'); S.partyAt(770, 560, 'up'); await S.fade(0, 800); await SC.q14_aurora(S);
  };
  SC.q14_aurora = async function (S) {
    var G = S.G; if (G.flags.aurora_done) return; S.flag('aurora_done', 1); S.music('aurora', 2); S.partyRing(770, 470, 70); S.cam(770, 440, 0);
    await S.narr("Late night. The party lies on a snowy hillside under the aurora.");
    await S.say('brakka', "My grandmother said the aurora is the ancestors dancing.");
    await S.say('vex', "Your ancestors have good taste in colors.");
    await S.say('rowan', "...I hope my father can see this.");
    await S.say('liora', "He can. Tam too.", 'sad');
    await S.hsay({ _: "When this is over — let's come back here. All of us." }, 'happy');
    await S.say('brakka', "Every year! A tradition! Swear it!");
    await S.narr("One by one, they raise their glowing hands to the sky. The marks shine together like stars.");
    S.flash('#aef0ff', 900); S.sfx('dawnmark_burst');
    S.done('mq14'); S.mq(15); S.quest('mq15'); S.xp(3000); S.healAll(); S.ensureLevel(33); S.tint(null); S.camFollow(); S.flag('ship', 1);
    S.toast('The Compass points to Lumeria — sail there from the menu → Map.', 'quest');
    S.save();
  };

  /* ---------- SQ12: Brakka's Song ---------- */
  QD('sq12', { name: "Brakka's Song", type: 'side', lv: 28, obj: 'Help Brakka write a song to apologize to Hald (talk to Skald Torvi).' });
  SC.torvi_talk = async function (S) {
    var G = S.G;
    if (G.quests.sq12 === 'done') { await S.say('torvi', "The whole hold sings it now. Even the wolves howl the chorus."); return; }
    await S.say('torvi', "Brakka wants to write a song for Hald. An apology. A true one. He cannot rhyme. I am here to witness the catastrophe.");
    var c = await S.choice('Help write the song?', ['Yes, let\'s write it', 'Not now']); if (c !== 0) return;
    S.quest('sq12'); await S.say('brakka', "A song! For my brother! Torvi says it needs a *verse*, a *chorus*, and *no goats*.");
    var v1 = await S.choice('Verse one: how does it begin?', ['"Brother, I was lost in the storm."', '"Mead and snow and your stubborn face."', '"Iron and ice and the axe I swung."']);
    var v2 = await S.choice('Verse two: what do you say to him?', ['"I should have known your face."', '"I was afraid of myself, not you."', '"I\'m sorry. That\'s all. I\'m sorry."']);
    var v3 = await S.choice('The chorus:', ['"Home is where you wait for me."', '"We are two storms with one fire."', '"The axe is down. The hearth is lit."']);
    var tot = v1 + v2 + v3;
    await S.narr("Brakka sings it that night in the great hall. It has two rhymes and no tune. Hald listens, motionless, to the end.");
    await S.say('hald', tot <= 2 ? "...You wrote that? *clears his throat* Brother, I... I'd tell you it's terrible, but I'd be lying through the tears." : tot <= 4 ? "*quietly* It's the worst song I've ever heard. Sing it again." : "*laughing and crying at once* Brakka. *Brakka.* It's wonderful. It's wonderful and it's *terrible* and I will have it carved into the hall beam.");
    S.done('sq12'); S.xp(1500); S.affinity('brakka', 2); S.give('mead_mug', 2);
    await S.say('brakka', "*sniffling* I've never been so proud of anything I couldn't hit.");
  };

  /* ---------- SQ13: The Frost Wyrm's Egg ---------- */
  QD('sq13', { name: "The Frost Wyrm's Egg", type: 'side', lv: 30, obj: "Return the egg to the Frost Wyrm's nest (Wyrm's Peak, via the glacier road's northwest ledge)." });
  SC.rolf_talk = async function (S) {
    var G = S.G;
    if (G.flags.sq13_done) { await S.say('rolf', "Quiet now. No more humming. The mountain's mother is back with her child."); return; }
    if (G.quests.sq13 === 'active') { await S.say('rolf', "Take it up the glacier — northwest ledge. And, uh, be gentle. It *hums*."); return; }
    await S.say('rolf', "I found this on the ice. Big as a barrel. Warm! It hums when you say 'Brakka' too loudly. My wife says it's a wyrm egg. I say it's a very ugly stone.");
    var c = await S.choice('Rolf holds out the egg.', ['I\'ll return it to its mother', 'Not my problem']); if (c !== 0) return;
    S.give('frost_egg', 1); S.quest('sq13'); await S.say('rolf', "Thank the Ancestors. I thought I'd have to cook it.");
  };
  SC.sq13_nest = async function (S) {
    S.flag('sq13_nest', 1); S.partyWalk(770, 330, 40); S.music('boss', 1); S.shake(6); S.sfx('roar');
    await S.narr("The nest: a ring of bone and ice. In its heart, coiled around nothing, the Mother Frost Wyrm. Her eyes open.");
    var c = await S.choice('The Wyrm rises.', ['Lay the egg down slowly', 'Fight her']);
    if (c === 1) { await S.narr("She does not care for fighting words."); return S.boss('frost_wyrm', { lv: 31, x: 770, y: 150, onWin: 'sq13_win' }); }
    await S.narr("You kneel and set the egg on the ice. The Wyrm's breath slows. She lowers her great head, and you swear she bows.");
    return SC.sq13_win(S);
  };
  SC.sq13_win = async function (S) {
    S.take('frost_egg', 1); S.flag('sq13_done', 1); S.done('sq13'); S.xp(1800); S.give('wyrm_scale', 1); S.healAll();
    await S.narr("The Mother Wyrm curls around the egg. A single scale, big as a shield, falls at your feet — a gift.");
    await S.say('rowan', "...She's smiling. I think. Wyrms smile?", 'happy');
  };
  DB.items.wyrm_scale = DB.items.wyrm_scale || null;
})();
