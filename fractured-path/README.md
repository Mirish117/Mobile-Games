# The Fractured Path

A pocket JRPG for the browser. Choose the **Lampbearer's Road** (hero) or the **Cinder Road** (villain), each with its own classes, story and ending. Gather Kin (creatures) by rescuing, Tethering or buying them, temper your gear and spend ability points. Chapter I is complete and playable.

Everything (art, music, story, code) is original and generated in code. No external assets are needed except the optional Press Start 2P web font, which only styles dialogue and the title.

## Play it on GitHub Pages
1. Create a new GitHub repository and upload everything in this folder (keep the folder structure; `.nojekyll` must be included).
2. Repository **Settings > Pages**, set Source to *Deploy from a branch*, Branch `main`, folder `/ (root)`, and Save.
3. After a minute the game is live at `https://<your-username>.github.io/<repo-name>/`.
4. On iPhone: open the link in **Safari**, tap Share, then **Add to Home Screen**.

You can also test locally: `python3 -m http.server` in this folder, then open http://localhost:8000.

## Saves
Saves are stored in the browser (localStorage) under the hero's name, like memory-card slots. They are only visible on that device and browser. Use **Save > Export save code** to move a save elsewhere, and **Import Save** on the title screen to load it.

## Controls
Arrow keys / on-screen D-pad to move, **A** (Z / Enter / Space) to talk and confirm, **B** (X / Esc) to cancel or run, **MENU** (M / Tab) for the field menu.

## License
No license has been chosen. Add one (for example MIT) before sharing the code publicly.
