# AMBER WORLD CLASS – V0.6 original art pass

**Visual asset update only.** The original, separately deployed game backend and gameplay remain unchanged. **Never modify 55 AMBERLANDS.**

## Added and verified on `main`
- Replaced **starter town map 01** with an independently drawn 1152×1152 original game-world landscape: town buildings, wall/gate, fountain, market stalls, animated-looking water ornamentation, fine stone pavement, trees, banners and flowers. It is not a crop from a collage or screenshot.
- Replaced **four class sprite sheets** (Sword, Archer, Mage, Fighter). Each is 192×384 RGBA with 8 directions × 4 changing walk frames (48×48 each).
- Replaced **four combat effect sheets**, each 384×384 RGBA with 16 independently rendered frames (96×96 each). The client already has a 16-frame VFX animator, so no combat rework was made.
- Updated asset cache from `?v=05` to `?v=06` in existing game and gallery.
- Checked all animation rows are nonblank and contain different frames.
- Saved reproducible source in `tools/create_art.py` and `tools/create_skill_fx.py`; run with Python + Pillow from this repo root.

## Deliberately not changed
- Maps 02–10 retain V0.5 until separately art-reviewed.
- No rewriting of player controls, game auth, Supabase schema, combat, saved characters, economy or class selection.
- Prior V0.5 assets remain recoverable using Git commit history.

## Known missing pieces
The visual target from the provided reference collage remains **higher** than the current game. 48 fully unique monster designs, 120 full skill VFX sets, character equipment layers, a full 10-map HD rework, rigged weapon attachment and full production art QA remain unfinished.

## Build
Install Pillow (`python -m pip install pillow`) then:
```sh
python tools/create_art.py
python tools/create_skill_fx.py
```
This overwrites only the V0.6 art files in `public/assets/`; test in Asset Gallery and gameplay before merging new revisions.
