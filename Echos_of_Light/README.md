# Echos of Light first-pass 3D asset kit

This pack contains actual editable 3D geometry based on the game's script and selected art direction. It is a simplified procedural prototype kit, not a finished reference-quality art production and not a playable game. The concept illustration in `reference/` is a target, not a render of these meshes. See `previews/` for the actual exported models.

## Included

- 24 character, NPC, enemy and boss GLBs, including all four Aren echoes, four minor bosses, and three Veyr forms.
- 51 reusable equipment and prop GLBs.
- 15 real 3D environment GLBs, with corrupted and restored scenes for five main regions and five special locations.
- 12 3D effect meshes with simple pulse clips.
- 24 original synthesized WAV sound and music sketches. No voice acting.
- 10 scalable SVG interface icons.
- 21 dialogue/staging sequences with estimated timing, plus the full game script.
- Collision and spawn metadata for the main scenes, inventories, source generators, and validation results.
- A dependency-free WebGL 2 asset viewer with orbit controls, animation playback and party placement in maps.

## Review the assets

Unzip this folder. From inside it run `python3 -m http.server 8000`. Open `http://localhost:8000` on that computer. This command needs Python; it only serves static files. Choose a category and an asset. Select animation clips to review movement. Drag to orbit, scroll or pinch to zoom. Choose an environment then press Show party in map to see models occlude one another with real depth.

For your own GitHub upload, put the CONTENTS of this folder at the publishing root and enable static hosting. The included index.html is an asset viewer, not the finished game. No third-party CDN, API key, package installation, or online service is needed by the viewer. You do not need to upload `source/`, `previews/` or `reference/` to run it.

## Model conventions

GLB 2.0, meters, Y up, character forward -Z. Root pivots sit near ground level. Import GLBs individually to a compatible 3D editor or game engine. Materials use named colors and PBR factors; these files do not yet include UV texture atlases. They are original generated geometry. Shared primitive meshes are reused inside each GLB.

Character movement uses a hierarchy of rigid node parts. These are animated GLB nodes, not a skinned character with smooth joint deformation. Clips include idle, walk, run, three attacks, signature, dodge, hit, downed, revive, interact, celebrate, look, and scarf flutter on humanoids. Clips are basic motion sketches; species have smaller animation sets. The clips do not implement hitboxes, invulnerability, damage, sound triggers or movement through the level.

## Environments

Maps contain real mesh surfaces, raised platforms, stairs, walls, trees and bridges, rather than a flat map image. Characters are loaded separately. `.layout.json` files supply starter box colliders, walk surfaces and spawn points. Those metadata files do not activate physics or pathfinding by themselves. The last-shadow arena is visual geometry only and needs collision authoring. Water and lava need traversal and hazard rules in your game code. The abbey's corrupted water state needs state-dependent gameplay treatment.

A runtime must enable contact/directional shadows to achieve grounded lighting. The viewer demonstrates geometry and animation but does not include a runtime shadow pass. Preview PNGs include software-rendered shadows. Transparent Ward and beam effects require transparent/additive materials in the runtime; their base GLBs currently use opaque materials.

## Production work still required

The selected illustration is significantly more polished than these assets. Face sculpting, detailed hair, fabric/foliage art, hand-painted textures, skinned animation, cinematic acting, final score and voices remain. Levels are compact first-pass layouts, not complete authored campaign maps. Boss attacks are not full choreography. Character face and clothing variations for civilians are minimal. The same model may be reused for unnamed civilian roles.

No combat system, touch controller, save system, online multiplayer, or finished game is included. No physical iPhone performance claim is made. Individual GLBs are small, but many separate scene nodes can cause excessive draw calls; merge static meshes or instance trees/props and add LODs before shipping.

## Editing and regeneration

`source/build_assets.py` requires NumPy and generates GLBs, audio, SVGs and layout data. `source/inspect_assets.py` requires NumPy and Pillow; it validates and renders the GLBs. Run scripts from a writable extracted folder. `source/package_assets.py` is the original packaging helper and expects the original script/reference beside the kit; it is optional for using the assets. Edit shapes, colors and keyframe tracks in the builder, then regenerate. You may also edit GLBs directly in a 3D editor.

`validation_report.json` records local structural checks; it is not a Khronos validator certification. The viewer smoke test report records code and GLB loader checks with a mocked graphics context; the viewer has not been tested in a real browser or on a phone.

## Rights and dependencies

All asset mesh geometry, source, icon shapes and synthesized audio in this kit were created for Echos of Light in this task. No commercial game assets were extracted. You may use, modify and publish the generated kit in your project. The included reference is the illustration you selected. This statement is not a guarantee of copyright registration or exclusive rights.
