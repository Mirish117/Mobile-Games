# Dawnbound: The Six Embers

An action JRPG that runs entirely in the browser (plain HTML/JS, no build step).

## Play on your phone via GitHub Pages
1. Create a repo (or use an existing one) and upload the **contents of this folder** (index.html, js/, css/, assets/, data/, icons/, sw.js, manifest.webmanifest) to the repo root.
2. Repo → Settings → Pages → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
3. After a minute open `https://<your-user>.github.io/<repo>/` on your phone.
4. iPhone: Safari → Share → *Add to Home Screen* for fullscreen. Android: Chrome menu → *Install app*. Play in landscape.

Progress is saved in the browser (localStorage) on that device. Art/audio are cached as you play so it keeps working offline.

## Map editor (`editor.html`)
Open `https://<your-user>.github.io/<repo>/Dawnbound/editor.html` (same folder as the game).

- **Collision**: paint walkable / blocked ground. Saved to `data/masks_user.js` when exported.
- **Objects**: move or remove characters, enemies, chests, exits and entrances; add chests, pickups, characters, signs, enemies, doors and trigger zones with actions (say, give, heal, warp, run scene...). Saved to `data/map_edits.js`.
- **Overlays**: paint part of the map art (arch top, canopy, post) so it is drawn in front of characters, for "walk under" effects, or copy art to a new spot.

Edits autosave in your browser. Use **Save ▾** to download `masks_user.js` and `map_edits.js`, then upload them into `Dawnbound/data/` on GitHub.
`data/editor_defs.js` is generated reference data (item, sprite and scene lists, built-in object positions); it must be regenerated if the built-in map scripts change.
