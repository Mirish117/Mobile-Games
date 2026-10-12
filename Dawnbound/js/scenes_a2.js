/* Dawnbound - Act I side quests (SQ1-SQ6) */
(function () {
  'use strict';
  var DB = window.DB, SC = DB.scenes, QD = DB.quests.def;
  DB.speakers.redd = { name: 'Captain Redd', npc: 'guild_thug' };
  DB.speakers.whiskers = { name: 'Old Whiskers', npc: 'fenn' };

  /* SQ1 Pip's Big Catch */
  QD('sq1', { name: "Pip's Big Catch", type: 'side', lv: 3, obj: function (G) { return G.flags.whiskers_caught ? 'Bring Old Whiskers\' net to Pip.' : 'Fish at the east pier spot for the legendary Old Whiskers.'; } });
  SC.sq1_start = async function (S) {
    await S.say('pip', "Psst! Hey! I need a favor. There's a fish. Old Whiskers. Biggest catfish in the harbor. Nobody's caught him in forty years. I want to catch him — unofficially — and I need someone with *skill*.");
    var c = await S.choice('Help Pip fish?', ['Sure, let\'s catch Old Whiskers', 'Maybe later']); if (c !== 0) return;
    S.quest('sq1'); await S.say('pip', "Yes! There's a good spot on the east pier. Go fish there! Tap when the float dips!");
  };
  SC.sq1_pip = async function (S) {
    var G = S.G;
    if (!G.flags.whiskers_caught) { await S.say('pip', "East pier! Float dips, you tap! It's the only rule!"); return; }
    await S.say('pip', "You CAUGHT him?! You — you actually — *he stares at the net, then bursts into tears of joy* Let him go! He's earned his freedom! He's the *real* harbor master!");
    S.done('sq1'); S.xp(150); S.gold(100); S.give('sea_biscuits', 2); S.give('lucky_hook', 1);
    await S.say('pip', "Here, take this lucky hook. For luck! And, um. Please don't tell Hettie I used her good net.");
  };
  SC.sq1_fish = async function (S) {
    await S.narr("You cast a line into the dark water of the harbor.");
    var r = await S.mini.timing({ title: 'Fishing', rounds: 3, speed: .95, zone: .16, intro: 'Tap when the float dips into the glowing zone. Land two out of three.', label: 'REEL!' });
    if (r.hits >= 2) { await S.narr("Something enormous bites. A whiskered, grumpy, ancient face breaks the surface — Old Whiskers! He blinks at you, spits out the hook, and swims off with dignity."); S.flag('whiskers_caught', 1); S.toast('Tell Pip!', 'quest'); }
    else await S.narr("The fish gets away. Perhaps try again.");
  };

  /* SQ2 Hettie's Secret Ingredient */
  QD('sq2', { name: "Hettie's Secret Ingredient", type: 'side', lv: 3, obj: 'Gather 5 Wild Blackberries on the Brightwater Coast and bring them to Hettie.' });
  SC.sq2_start = async function (S) {
    var c0 = S.G.flags.sq2_asked;
    await S.say('hettie', "Dear, I hate to ask, but... the festival pie. Blackberries. Five of them, off the brambles by the beach. The crabs have taken it into their heads they own the patch.");
    var c = await S.choice('Hettie waits.', ['I\'ll fetch them', 'Not now']); if (c !== 0) return;
    S.quest('sq2'); S.flag('sq2_asked', 1);
  };
  SC.sq2_finish = async function (S) {
    S.take('blackberries', 5);
    await S.say('hettie', "Look at these! Sun-warm! *humming, she bakes; the inn fills with the smell of heaven* ...Here. Three pies. Eat one when you're down to your last breath, and you'll be new again.");
    S.done('sq2'); S.xp(200); S.give('blackberry_pie', 3);
  };

  /* SQ3 Lost Wedding Ring */
  QD('sq3', { name: 'The Lost Wedding Ring', type: 'side', lv: 4, obj: function (G) { return DB.has('wedding_ring') ? 'Return the ring to Tomas.' : 'Dive in the harbor to find Tomas\'s ring.'; } });
  SC.sq3_start = async function (S) {
    var G = S.G;
    if (G.quests.sq3 === 'active') {
      if (DB.has('wedding_ring')) { S.take('wedding_ring', 1); S.flag('ring_given', 1); S.done('sq3'); S.xp(250); S.gold(100); await S.say('tomas', "*clutching it* You found it! Marla will say yes now — she *will* say yes, won't she? Come to the festival lanterns. Please."); return; }
      await S.say('tomas', "Off the end of the pier, I think. It was so shiny. It sank so fast."); return;
    }
    if (G.quests.sq3 === 'done') { await S.say('tomas', "I'm the happiest fool in Halcyon."); return; }
    await S.say('tomas', "I — I dropped it. The ring. Off the pier. I was going to propose at the festival! Marla's the best woman in the world and I've ruined it before I've begun!");
    var c = await S.choice('Tomas wrings his hands.', ['I\'ll dive for it', 'Not now']); if (c !== 0) return;
    S.quest('sq3');
  };
  SC.sq3_dive = async function (S) {
    await S.narr("You take a breath and dive into the cold green water.");
    var r = await S.mini.timing({ title: 'Harbor Dive', rounds: 4, speed: 1.0, zone: .2, intro: 'Tap when the glint crosses the bright zone to grab it. 2 of 4.', label: 'GRAB!' });
    if (r.hits >= 2) { S.give('wedding_ring', 1); await S.narr("Your fingers close on something small and round. A wedding ring, green with weed."); }
    else await S.narr("You surface, gasping. Nothing. Try again.");
  };

  /* SQ4 Smuggler's Cove */
  QD('sq4', { name: "Smuggler's Cove", type: 'side', lv: 6, obj: 'A path of footprints leads to the cove on the Brightwater Coast. Confront Captain Redd.' });
  SC.sq4_start = async function (S) { S.quest('sq4'); S.toast("A smuggler's trail on the beach.", 'quest'); };
  SC.sq4_redd = async function (S) {
    var G = S.G;
    await S.say('redd', "Well, well. Visitors. Nobody walks into Redd's cove and walks out with their purse.");
    var opts = ['Fight', 'Walk away']; if (S.cls() === 'rogue') opts.splice(1, 0, '[Rogue] Negotiate');
    var c = await S.choice('Captain Redd draws a cutlass.', opts);
    if (c === 2 || (c === 1 && opts.length === 2)) return;
    if (opts.length === 3 && c === 1) {
      await S.hsay({ rogue: "Easy. I know the Saltmire fences. I know who buys your cargo, who pays double, and who's on the Guild's list. Work with me and I'll keep your name off it." });
      await S.say('redd', "...Gods. You're one of ours. Fine. Take the cutlass and my blessing. Next time, wear a hat; you're too recognizable.");
      S.flag('cove_done', 1); S.give('rusty_cutlass', 1); S.done('sq4'); S.xp(400); S.despawn('cove_boss'); return;
    }
    await S.boss('smuggler_captain', { lv: 7, x: 770, y: 260, onWin: 'sq4_win' });
  };
  SC.sq4_win = async function (S) {
    S.flag('cove_done', 1); S.give('rusty_cutlass', 1); S.gold(300); S.done('sq4'); S.xp(400); S.despawn('cove_boss');
    await S.say('redd', "*on one knee* Alright, alright! Take the cutlass. And never say I didn't warn you about the tide.");
  };

  /* SQ5 Ghost of Gull Point */
  QD('sq5', { name: 'The Ghost of Gull Point', type: 'side', lv: 8, obj: function (G) { return DB.has('wife_letter') ? 'Read the letter to the ghost on the beach.' : 'Ask the Archivist about the ghost sailor on the beach.'; } });
  SC.sq5_ghost = async function (S) {
    var G = S.G;
    if (!G.quests.sq5) {
      await S.say('ghost', "...a letter. She said she would write. I have waited so long to hear the tide say her name.");
      S.quest('sq5'); S.toast('Perhaps the Archivist knows something.', 'quest'); return;
    }
    if (DB.has('wife_letter')) {
      S.take('wife_letter', 1);
      await S.narr("You read the old, salt-stained letter aloud. \"My love, if you are reading this, the sea gave you back. I never stopped lighting the lamp. —Ada.\"");
      await S.say('ghost', "...Ada. She lit the lamp. She lit it every night. *the ghost smiles, fading into the dawn* Thank you, little ember.");
      S.done('sq5'); S.xp(500); S.give('ghost_charm', 1); S.flag('sq5_done', 1); S.despawn('ghost_sailor'); return;
    }
    await S.say('ghost', "Letter... the archivist... in the old stacks...");
  };
  SC.archivist_scene = async function (S) {
    var G = S.G;
    if (G.quests.sq5 === 'active' && !DB.has('wife_letter') && !G.flags.letter_given) {
      await S.say('archivist', "A ghost sailor on the beach? Oh. Oh my. That would be Captain Hale, lost in the great storm. His wife Ada wrote him every week for fifty years. None were ever delivered. They're here, in the dead-letter chest. *hands you a yellowed envelope* This one is the last.");
      S.flag('letter_given', 1); S.give('wife_letter', 1); return;
    }
    await S.say('archivist', S.v({ _: "Archives are quiet. I like them quiet.", mage: "A fellow scholar! I'd ask your thesis, but I'd have to defend mine." }));
  };

  /* SQ6 Mayor Odell's Speech */
  QD('sq6', { name: "Mayor Odell's Speech", type: 'side', lv: 8, obj: 'Help the mayor deliver his speech.' });
  SC.sq6_start = async function (S) {
    await S.say('odell', "Ah! A hero! Excellent. I must give a speech before the lamp is relit, and I have been rehearsing since dawn, and it is *dreadful*. Listen.");
    S.quest('sq6');
    var c = await S.choice('Odell clears his throat. "People of Halcyon..."', ['"We stand on the shoulders of the sea!"', '"Friends! Tonight, eat pie!"', '"I... will keep this short."']);
    if (c === 0) { await S.say('odell', "Poetic! But will they understand it? ...No. Next."); }
    else if (c === 1) { await S.say('odell', "Pie is the heart of any speech. Good. Good!"); }
    var c2 = await S.choice('"Halcyon has weathered storms, and ghosts, and pie shortages."', ['"And we will weather more!"', '"But never the pie!"']);
    await S.say('odell', c2 === 0 ? "*writes furiously* Yes! Yes!" : "*laughs, then coughs* The pie! Yes!");
    await S.say('odell', "I shall be a legend. People will *laugh*. At the right parts, I hope. Here — for your trouble. And, er, put in a good word with the lamp.");
    S.done('sq6'); S.xp(300); S.gold(200);
  };
  DB.items.lucky_hook || DB.addItemDef && 0;
})();
