# Sunderbell: The Four Tones

A top-down, four-hero action adventure that runs in the browser (plain HTML/JS, no build step), made for phones in landscape.

Every morning for three hundred years the Sunderbell has rung over Tollbrook and driven back the grey fog called the Hollow. On the day of its anniversary a stranger cracks it, the four tones that make its song scatter across the valley, and the fog rolls in. Four apprentices set out to bring them home, and find out what the bell has been taking from everyone all along.

## Play

Open `Sunderbell/index.html` on GitHub Pages (`https://<user>.github.io/<repo>/Sunderbell/`). On iPhone use Share → Add to Home Screen; on Android, Install app. Progress saves on the device and the game works offline once loaded.

**Controls**
- Drag on the left half of the screen to move.
- **A**: talk / open / read, or use the leader's tool.
- **⇄ Swap**: change leader (or tap a face at the top).
- **Hold**: the others wait where they stand. Swap to another hero and walk them somewhere else — this is how you press several plates at once. Tap again to regroup.
- **✦ Team**: when the gauge is full and everyone is close, all four strike together.
- Keyboard: arrows/WASD, Z = A, X = Swap, C = Hold, V = Team, Esc = Menu, 1–4 pick a hero.

**The four heroes**
| Hero | Tool | Does |
|---|---|---|
| Pell | Sword | Cuts bushes, hits hardest up close |
| Isla | Bow | Hits crystal switches and flyers from afar |
| Tobin | Shield | Smashes cracked rock, flips shelled foes, blocks shots, pushes like two |
| Mira | Lantern | Burns brambles, lights torches, reveals hidden walls, lights dark caves |

## Editor (`editor.html`)

Everything in the game can be changed from the editor, on a phone or a computer:

- **Story**: every scene, line of dialogue, choice and event. Edit as cards or as plain script, preview dialogue with voices, or jump into the game at that scene.
- **Maps**: paint tiles, place and edit characters, enemies, chests, doors, triggers, puzzles and bosses; resize maps; tap "Test here" to start the game at any spot.
- **Sprites / Tiles / Colours**: a pixel editor with animation frames, the tile set, and the shared palette.
- **Characters / Heroes / Enemies / Bosses / Items / Game**: names, looks, voices, stats and settings.
- **Music / Voices / Sounds**: a chiptune tracker for every song, the synthesised character voices, and all sound effects.

Changes save on the device automatically. **▶ Playtest** opens the game using them; the title screen also offers "Play with editor changes". To publish for everyone, use **Save ▾ → Download game_data.js** and upload it to `Sunderbell/data/`, or **Publish straight to GitHub** with a personal access token.

### Story script format

```
pell: A line of dialogue (any character id, or "leader").
> Narration.
? A choice => some_label
:some_label
set flag_name        if flag_name some_label        give key
music forest         sfx chest        warp ww1 10 4 down
banner Title | Subtitle        quest Goal text        end
```

The full command list is under "Script reference" in the Story tab.

## Files

- `index.html`, `js/` (core, audio, input, world, actors, story, ui, main): the game engine.
- `editor.html`, `js/editor/`: the editor.
- `data/game_data.js`: all game content (maps, art, story, music, voices). This is the file the editor exports.
