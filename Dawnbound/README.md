# Dawnbound: The Six Embers

An action JRPG that runs entirely in the browser (plain HTML/JS, no build step).

## Play on your phone via GitHub Pages
1. Create a repo (or use an existing one) and upload the **contents of this folder** (index.html, js/, css/, assets/, data/, icons/, sw.js, manifest.webmanifest) to the repo root.
2. Repo → Settings → Pages → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
3. After a minute open `https://<your-user>.github.io/<repo>/` on your phone.
4. iPhone: Safari → Share → *Add to Home Screen* for fullscreen. Android: Chrome menu → *Install app*. Play in landscape.

Progress is saved in the browser (localStorage) on that device. Art/audio are cached as you play so it keeps working offline.
