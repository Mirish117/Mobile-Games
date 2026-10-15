from pathlib import Path
import json,zipfile,xml.etree.ElementTree as ET,re,shutil
ROOT=Path(__file__).resolve().parents[1];workspace=ROOT.parent
# Keep the selected illustration clearly separate from actual mesh previews.
(ROOT/'reference').mkdir(exist_ok=True)
ref=workspace/'upload'/'AA05614D-964C-48C1-BB51-449E875BDF2A.jpeg'
if ref.exists():shutil.copy2(ref,ROOT/'reference'/'selected_art_direction.jpeg')
script=workspace/'Echos_of_Light_Game_Script.docx'
shutil.copy2(script,ROOT/'cinematics'/'Echos_of_Light_Game_Script.docx')
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile(script) as z:doc=ET.fromstring(z.read('word/document.xml'))
scenes=[];active=None;chapter=''
for par in doc.findall('.//w:body/w:p',ns):
 text=''.join(t.text or '' for t in par.findall('.//w:t',ns));style=par.find('w:pPr/w:pStyle',ns);style=style.get('{'+ns['w']+'}val') if style is not None else ''
 if style=='Heading1':chapter=text
 if style=='Heading2':
  if active:scenes.append(active);active=None
  match=re.search(r'\b([PCEF]\d{2})\b',text)
  if match:active={'id':match.group(1),'title':text,'chapter':chapter,'timeline':[],'status':'dialogue and staging data; engine cutscene integration required'}
 elif active and text:
  match=re.match(r'^([A-Z][A-Z ,]+)(?:[^:]*):\s*[“"](.+)[”"]$',text)
  dur=max(2,round(len(text.split())/2.4,1))
  active['timeline'].append({'type':'dialogue' if match else 'stage_direction','speaker':match.group(1).strip() if match else None,'text':match.group(2) if match else text,'estimated_duration_seconds':dur})
if active:scenes.append(active)
locations={'P01':'lumenfall_restored','P02':'lumenfall_corrupted','P03':'sun_chamber','P04':'sun_chamber','C01':'verdant_corrupted','C02':'verdant_restored','C03':'abbey_corrupted','C04':'abbey_restored','C05':'hillside_refuge','C06':'elin_memory_room','C07':'observatory_corrupted','C08':'observatory_restored','C09':'ember_corrupted','C10':'ember_restored','C11':'lumenfall_corrupted','C12':'sun_chamber','C13':'sun_chamber','F01':'hollow_sun_arena','F02':'last_shadow_arena','F03':'sun_chamber','E01':'lumenfall_restored'}
for s in scenes:
 s['environment_asset']=locations.get(s['id'],'sun_chamber');t=0
 for event in s['timeline']:event['start_seconds']=round(t,1);t+=event['estimated_duration_seconds']
 s['estimated_duration_seconds']=round(t,1)
(ROOT/'cinematics'/'scene_sequences.json').write_text(json.dumps({'title':'Echos of Light','format':'engine-neutral draft scene timing','voice_audio_included':False,'facial_animation_included':False,'scenes':scenes},indent=2))
manifest=json.loads((ROOT/'asset_manifest.json').read_text());models=manifest['models']
coverage={'main_hero':['aren_crimson','aren_azure','aren_gold','aren_violet'],'minor_bosses':['briarhorn','nereth','glasswright','ashwing'],'final_boss_stages':['veyr_keeper','veyr_hollow_sun','veyr_last_shadow'],'ordinary_enemies':['stillborn_sentry','thornling','drowned_wisp','mirror_shard','ash_moth'],'npcs':['mira','aren_child','aren_mother','elin','traveler','survivor','baker'],'regions':['lumenfall','verdant','abbey','observatory','ember'],'special_locations':['hillside_refuge','sun_chamber','elin_memory_room','hollow_sun_arena','last_shadow_arena'],'cinematic_sequences':[s['id'] for s in scenes]}
(ROOT/'script_coverage.json').write_text(json.dumps({'coverage':coverage,'coverage_meaning':'Named model and scene coverage, not finished cinematic or gameplay implementation.','remaining_art_work':['Reference-quality sculpted faces, hair, fabrics and foliage','Hand-painted UV texture art and atlas packing','Skinned flexible cloth, facial expressions and lip sync','Polished boss attacks and final cinematic motion','Final audio and recorded voice acting','Complete region level design, navigation and collision tuning','Mobile draw-call optimization, LODs and physical-device performance tests']},indent=2))
rows=['# Echos of Light asset inventory','', '| Asset | Category | Triangles | Animation clips |','|---|---|---:|---|']
for r in models:rows.append(f"| {r['id']} | {r['file'].split('/')[0]} | {r['triangles']} | {', '.join(r['animations']) or 'None'} |")
(ROOT/'INVENTORY.md').write_text('\n'.join(rows)+'\n')
counts={folder:sum(r['file'].startswith(folder+'/') for r in models) for folder in ['models','props','environments','effects']}
readme=f'''# Echos of Light first-pass 3D asset kit

This pack contains actual editable 3D geometry based on the game's script and selected art direction. It is a simplified procedural prototype kit, not a finished reference-quality art production and not a playable game. The concept illustration in `reference/` is a target, not a render of these meshes. See `previews/` for the actual exported models.

## Included

- {counts['models']} character, NPC, enemy and boss GLBs, including all four Aren echoes, four minor bosses, and three Veyr forms.
- {counts['props']} reusable equipment and prop GLBs.
- {counts['environments']} real 3D environment GLBs, with corrupted and restored scenes for five main regions and five special locations.
- {counts['effects']} 3D effect meshes with simple pulse clips.
- {len(manifest['audio'])} original synthesized WAV sound and music sketches. No voice acting.
- 10 scalable SVG interface icons.
- {len(scenes)} dialogue/staging sequences with estimated timing, plus the full game script.
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

`validation_report.json` records local structural checks; it is not a Khronos validator certification. The browser test report records desktop headless WebGL viewer checks, not Safari or phone testing.

## Rights and dependencies

All asset mesh geometry, source, icon shapes and synthesized audio in this kit were created for Echos of Light in this task. No commercial game assets were extracted. You may use, modify and publish the generated kit in your project. The included reference is the illustration you selected. This statement is not a guarantee of copyright registration or exclusive rights.
'''
(ROOT/'README.md').write_text(readme)
print('Inventory',counts,'scenes',len(scenes))
