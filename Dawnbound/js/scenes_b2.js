/* Dawnbound - Act II part 2: Saltmire (Q9-Q11, SQ9-SQ11) */
(function () {
  'use strict';
  var DB = window.DB, SC = DB.scenes, QD = DB.quests.def;
  var mqs = function (G) { return G.flags.mq || 0; };
  DB.speakers.mordo = { name: 'Mordo', npc: 'guild_thug' };
  DB.speakers.wick = { name: 'Wick', npc: 'orphan' };
  DB.speakers.seabird = { name: 'Seabird', npc: 'seabird' };

  QD('mq10', { name: "The Thieves' Gambit", type: 'main', lv: 19, obj: function (G) { return G.flags.q10_open ? 'Enter the Undercity by the hatch (west end of Saltmire) and reach the vault.' : 'Talk to Vex about the vault.'; } });
  QD('mq11', { name: 'The Compass Points North', type: 'main', lv: 23, obj: 'The Compass points to Frostmark. Sail north (menu → Map).' });

  /* ---------- Q9 ---------- */
  SC.q9_ambush = async function (S) {
    var G = S.G; S.music('saltmire', 2); S.partyWalk(770, 600, 40);
    await S.narr("Saltmire at night. Floating lanterns, rope bridges, gamblers on every plank. Everyone watches you without looking.");
    if (S.is('vex')) {
      /* HOMECOMING VARIANT C */
      await S.narr("On every lamppost, a poster. Your face, drawn badly. WANTED — VEX MARLOWE — FOR ABANDONING THE FAMILY. Reward: 500 gold. Dead or alive; preferably alive.");
      await S.say('vex', "...Five hundred? That's an insult. I'm worth at least a thousand.", 'neutral');
      S.spawn('t1', 'guild_thug', 700, 520, 'down', { name: 'Thug' }); S.spawn('t2', 'guild_thug', 840, 520, 'down', { name: 'Thug' }); S.spawn('t3', 'guild_thug', 770, 480, 'down', { name: 'Thug' });
      await S.say('thug', "Marlowe. Mother Grell wants a word. She's been wanting it for a long time.");
      await S.say('vex', "Tell her the line for 'a word' starts behind the other seventeen debts.");
      S.despawn('t1'); S.despawn('t2'); S.despawn('t3');
      S.flag('vex_met', 1); S.quest('mq9');
      return S.battle([{ type: 'thug', lv: 17, n: 5, x: 770, y: 480 }], { onWin: 'q9_after' });
    }
    S.spawn('t1', 'guild_thug', 700, 510, 'down', { name: 'Thug' }); S.spawn('t2', 'guild_thug', 840, 510, 'down', { name: 'Thug' }); S.spawn('t3', 'guild_thug', 770, 480, 'down', { name: 'Thug' });
    await S.say('thug', "That's them. Glowing hands. Mother Grell will pay *well*.");
    await S.say('thug', "Seven of us, four of you. Be sensible.");
    S.shake(3); S.sfx('footstep_wood');
    await S.narr("Something drops from the rooftops with a thump.");
    S.spawnHero('vex', 770, 470, 'down');
    S.despawn('t1'); S.despawn('t2'); S.despawn('t3');
    await S.say('vex', "Seven of them, and not one checked the rooftops. Saltmire's standards are slipping.");
    S.flag('vex_met', 1); S.quest('mq9'); S.despawn('vex');
    DB.join('vex', { guest: true, force: true }); DB.ui.invalidateParty();
    return S.battle([{ type: 'thug', lv: 17, n: 5, x: 770, y: 480 }], { onWin: 'q9_after' });
  };
  SC.q9_after = async function (S) {
    var G = S.G; S.healAll(); S.music('saltmire', 1);
    if (S.is('vex')) {
      await S.narr("The last thug drops. Rooftops creak. Somewhere, a bell tolls twice.");
      await S.say('liora', "You know this city, don't you?", 'worried');
      await S.hsay({ _: "I used to run it. Or my Mother did, and I ran *from* it. Mother Grell. She has the Compass of Dawn — she made sure I'd come looking." });
      await S.say('rowan', "It points toward the others. Toward the marks.", 'neutral');
      await S.hsay({ _: "Then I break into my own childhood home. Again. Third time's the charm." });
    } else {
      await S.narr("The last thug drops. The thief wipes a dagger on a coat she did not buy.");
      await S.say('vex', "*turns, sees the marks, sighs* Oh no. Oh, no no no. You're the *other* glowing people. I was hoping you weren't real.");
      await S.say('liora', "You stole the Compass of Dawn!");
      await S.say('vex', "*Borrowed.* Somebody hired me to steal it, and it started pointing at *me*, which is deeply unsettling. Here's the problem — the person who hired me is Mother Grell. And Mother Grell doesn't like it when I don't deliver.");
      await S.hsay({ _: "Then help us. The Compass points to the others like us." });
      await S.say('vex', "...Fine. *Temporarily.* I'll get you into the Undercity. Don't touch anything. Don't *look* at anything.");
      S.toast('Vex joined temporarily.', 'quest');
    }
    S.done('mq9'); S.mq(10); S.quest('mq10'); S.flag('q10_open', 1); S.xp(900); S.ensureLevel(19); S.camFollow();
    S.toast('The Undercity hatch is at the west end of Saltmire.', 'quest');
  };
  SC.dorrin_talk = async function (S) {
    var c = await S.choice('Innkeeper Dorrin polishes a mug.', ['Rest (40 G) and save', 'Chat', 'Never mind']);
    if (c === 0) return DB.menus.inn(40);
    if (c === 1) await S.say('dorrin', S.G.flags.vex_met ? "Vex Marlowe, in my inn. If the Mother asks, I never saw you. If she asks nicely, I saw you twice." : "Rooms, stew, and a lack of questions. That's The Gilded Gull.");
  };

  /* ---------- Q10: the Undercity & Lady Nyx ---------- */
  SC.q10_vault = async function (S) {
    var G = S.G; S.partyWalk(770, 400, 40); S.music('ghostly', 2);
    await S.narr("The vault doors swing open. A great hall of black glass and candlelight. In the center, on a throne of coins, a stooped old woman waits.");
    S.spawn('grell_f', 'mother_grell', 770, 215, 'down', { name: 'Mother Grell' });
    await S.say('grell', "Vex. My little magpie. Come and kiss your mother.");
    await S.hsay({ _: "...Wait. Something's wrong." });
    await S.say('vex', "She never asks. She *tells*.", 'worried');
    await S.narr("The old woman smiles. Her face runs like wax. Cheekbones sharpen; eyes turn violet; the stoop straightens into a dancer's poise.");
    S.spawn('nyx_f', 'lady_nyx', 770, 215, 'down', { name: 'Lady Nyx' }); S.despawn('grell_f'); S.shake(5); S.sfx('quake');
    await S.say('nyx', "I've worn so many faces in this city. A mother's face is my favorite. You trust a mother. You come home to a mother.");
    await S.say('nyx', "And you always came home, didn't you, darling? No matter how many times she hurt you.");
    await S.say('vex', "...How long?", 'sad');
    await S.say('nyx', "Long enough to know exactly where to stab.");
    await S.say('nyx', "Here is my offer, little magpie. Hand me the glowing one — just *one* — and I'll give you freedom, a fortune, and a very long retirement.");
    if (S.is('vex')) {
      var c = await S.choice('Nyx waits, smiling.', ['Pretend to consider it', 'Refuse outright']);
      await S.narr("You reach for a dagger. Nyx's smile widens. You throw it — not at her. At the rope above her.");
    } else {
      await S.narr("Vex hesitates. A long, terrible silence. Then Vex's hand twitches and a dagger flies — straight at you.");
      await S.hsay({ _: "Vex?!" }, 'surprised');
      await S.narr("It misses your ear by an inch and slices the rope above Nyx. A chandelier the size of a cart drops on her.");
    }
    S.shake(10); S.sfx('quake');
    if (!S.is('vex')) { await S.say('vex', "Sorry. Had to make it convincing. You flinched — that's adorable."); }
    else await S.say('vex', "Had to make it convincing. You *flinched*, darling.");
    await S.boss('lady_nyx', { lv: 22, x: 770, y: 200, onWin: 'q10_win' });
  };
  SC.q10_win = async function (S) {
    var G = S.G; S.music('sad', 2); S.healAll(); S.flag('boss_lady_nyx', 1);
    await S.say('nyx', "*bleeding violet shadow, clinging to a cracked mirror* Charming. Truly. We'll meet again, little embers. The Hollow King has *such* plans for you.");
    await S.narr("She steps backward into the mirror. The glass shatters, and she is gone.");
    S.spawn('grell_r', 'mother_grell', 770, 215, 'down', { name: 'Mother Grell' });
    await S.narr("Behind the throne, in a locked cell, a frail old woman. The real Mother Grell.");
    await S.say('grell', "Vex. You came back for me.");
    await S.say('vex', "...Yeah. Don't make it weird.");
    await S.say('grell', "I wasn't good to you.");
    await S.say('vex', "No. You weren't.");
    await S.narr("A long beat.");
    await S.say('vex', "But you're the only mother I had. Get out of Saltmire. Start over. Someone told me recently that you can do that.");
    S.despawn('grell_r');
    if (S.is('vex')) {
      await S.narr("Mother Grell hands you a small compass of brass and glass. The needle swings north, trembling.");
    } else {
      await S.say('vex', "So. That whole 'temporary' thing...");
      await S.hsay({ _: "Stay." }, 'happy');
      await S.say('vex', "*looks away, grinning* Fine. But I'm keeping anything shiny we find.", 'happy');
      G.flags.guest_vex = false; S.toast('Vex joined the party permanently!', 'quest'); DB.ui.invalidateParty();
    }
    S.give('compass', 1); S.done('mq10'); S.mq(11); S.quest('mq11'); S.xp(2000); S.affinity('vex', 3); S.ensureLevel(22);
    S.fade(1, 700); await S.wait(800); await S.map('saltmire', 'plaza'); await SC.q11_compass(S);
  };
  SC.q11_compass = async function (S) {
    var G = S.G; S.partyAt(770, 540, 'up'); S.cam(770, 500, 0); S.tint(null); await S.fade(0, 700);
    await S.narr("Dawn over Saltmire. The lanterns gutter. A seabird lands on the rail, a tiny scroll tied to its leg.");
    S.spawn('seabird_n', 'seabird', 800, 560, 'left', { name: 'Seabird' });
    await S.say('maren', "Ember — the Compass will point you true. The Heralds are moving: Gorran the Ashbound on Frostmark, and something stirring in the Spire of Lumeria. You cannot be in two places. Choose carefully. — M.");
    S.despawn('seabird_n');
    await S.say('liora', "We can't be in two places.", 'worried');
    await S.say('vex', "Technically we can. We'd just be very sad in both of them.");
    await S.hsay({ _: "Frostmark first. Then Lumeria." });
    S.done('mq11'); S.mq(12); S.quest('mq12'); S.xp(500); S.healAll(); S.ensureLevel(24); S.camFollow(); S.flag('ship', 1);
    await S.card('END OF ACT II', 'Strangers into Friends', 2800);
    S.toast('Frostmark is now on your sailing map. Mistvale too.', 'quest');
  };

  /* ---------- SQ9: Rigged Dice ---------- */
  QD('sq9', { name: 'Rigged Dice', type: 'side', lv: 18, obj: function (G) { return G.flags.dice_rigged ? 'Confront Mordo.' : 'Play at Mordo\'s table and catch the cheat.'; } });
  SC.mordo_talk = async function (S) {
    var G = S.G;
    if (G.quests.sq9 === 'done') { await S.say('mordo', "Fine. Fine! My dice are honest now. Honest and boring."); return; }
    if (!G.quests.sq9) {
      await S.say('mordo', "Step up, step up! The fairest game in Saltmire! Three rolls. Win two, double your coin.");
      var c = await S.choice('Mordo shakes the cup.', ['Play a round (look for the trick)', 'Walk away']); if (c !== 0) return;
      S.quest('sq9');
    }
    if (!G.flags.dice_rigged) {
      await S.narr("You watch the dice bounce. Something is wrong with the rhythm.");
      var r = await S.mini.memory({ title: 'Spot the Loaded Die', length: 4, symbols: 4 });
      if (r.ok) {
        S.flag('dice_rigged', 1);
        if (G.members.vex) await S.say('vex', "Weighted dice. *Weighted.* Honestly — cheating is a craft. If you're going to do it, do it with *style*. This is just rude.");
        else await S.narr("You spot it — one die is weighted with lead in a hollow pip.");
      } else { await S.say('mordo', "Hah! Better luck next time, friend. The house always wins."); S.gold(-30); return; }
    }
    await S.say('mordo', "Another round? ...What are you looking at me like that for?");
    var c2 = await S.choice('You hold up the loaded die.', ['Expose him', 'Walk away']); if (c2 !== 0) return;
    await S.say('mordo', "That's — that die is — I've never seen it before in my life.");
    await S.narr("The crowd goes very, very quiet. Then loud.");
    S.flag('dice_done', 1); S.done('sq9'); S.xp(900); S.give('lucky_coin', 1); S.gold(250);
    await S.say('mordo', "Fine! Take the coin. It's lucky. It's the only honest thing I own.");
  };

  /* ---------- SQ10: Orphans of the Stilts ---------- */
  QD('sq10', { name: 'Orphans of the Stilts', type: 'side', lv: 20, obj: 'Help Wick and the stilt-house children (southwest Saltmire).' });
  SC.sq10_start = async function (S) {
    S.partyWalk(330, 680, 40); S.spawn('wick_s', 'orphan', 360, 700, 'left', { name: 'Wick' });
    await S.say('wick', "Vex?! VEX! You're alive! You're— you look expensive!");
    await S.say('vex', "Hello, Wick. You've grown. You've also gotten *thinner*. Why are you so thin?");
    await S.say('wick', "Mother Grell stopped paying the crew when you left. The Stilts are leaking. We haven't had real food in a week...");
    S.despawn('wick_s'); S.quest('sq10'); S.camFollow();
    await S.say('vex', "...We're helping them. Don't argue.", 'worried');
  };
  SC.wick_talk = async function (S) {
    var G = S.G;
    if (G.flags.sq10_done) { await S.say('wick', "Vex says we're a school now. A thieves' school. But the honest kind! Mostly!"); return; }
    await S.say('wick', "The roof leaks, the pantry's empty... Could you help? Vex says you're good for it.");
    var c = await S.choice('How do you help?', ['Give them 300 gold for supplies', 'Teach them an honest trade', 'Not now']); if (c === 2) return;
    if (c === 0) { if (G.gold < 300) { await S.say('wick', "That's... you don't have enough. Come back when you do."); return; } S.gold(-300); await S.say('wick', "Bread! Real bread! And a new roof! Vex, they're angels!"); }
    else { await S.say('vex', "Listen up, you menaces. Locks, ledgers, lanterns — we make an honest business of knowing everything. Bring me a map of every bridge in Saltmire by dusk."); await S.say('wick', "...That's actually a good job. We'd get paid."); }
    S.flag('sq10_done', 1); S.done('sq10'); S.xp(1000); S.affinity('vex', 2);
    await S.say('vex', "*quietly, to you* Thanks. They're the only family I got out of that place worth keeping.");
  };

  /* ---------- SQ11: The Marsh Witch's Bargain ---------- */
  QD('sq11', { name: "The Marsh Witch's Bargain", type: 'side', lv: 23, obj: 'The Marsh Witch (Saltmire Marsh, northwest) wants a memory.' });
  SC.witch_talk = async function (S) {
    var G = S.G;
    if (G.quests.sq11 === 'done') { await S.say('witch', "Your memory keeps well. Better than my own. Go in peace, little ember."); return; }
    await S.say('witch', "Ahhh. A glowing child. I can feel the light from here, like a warm stove. I can lend you a little of my marsh-power, ember. The price is a memory.");
    var c = await S.choice('Which memory do you give?', ['My first sunrise', 'A voice I\'ve half forgotten', 'The smell of home', 'No bargain']); if (c === 3) return;
    S.quest('sq11');
    var lines = ["*the witch breathes it in, eyes closing* Mmm. Sweet. You'll still know that you saw it. You just won't remember how it *felt*.", "*she smiles, tender* Oh, that's a gentle one. I'll keep it safe. I'll even hum it, some nights.", "*a long, satisfied sigh* Salt and woodsmoke and old bread. It'll sit well in the marsh."];
    await S.say('witch', lines[c]);
    await S.hsay({ _: "...It doesn't hurt." });
    await S.say('witch', "No. That's the trick of it. You never miss what you can't recall. *presses a small charm into your palm* Swamp-heart. It'll keep you warm in the dark.");
    S.done('sq11'); S.xp(1200); S.give('swamp_charm', 1);
  };
  DB.items.compass_dawn || null;
})();
