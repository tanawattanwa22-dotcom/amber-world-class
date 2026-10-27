"""Validate committed art format; read-only, no modifications to any game assets."""
from pathlib import Path
from PIL import Image
from hashlib import sha256

base = Path(__file__).resolve().parents[1] / 'public' / 'assets'
checks = []
for i in range(1, 11):
    checks.append((base / 'maps' / f'map-{i:02d}.png', (1152, 1152), None))
for group, count in [('hero',4), ('mob',10), ('boss',10), ('wing',4)]:
    for i in range(count):
        filename = f'boss-{i:02d}.png' if group == 'boss' else f'{group}-{i}.png'
        checks.append((base / 'sprites' / filename, (192,384), 48))
for i in range(4):
    checks.append((base / 'effects' / f'skill-{i}.png', (384,384), 96))
checks.append((base / 'ui' / 'interface-icons-v05.png', (384,256), 64))

for path, dimensions, frame in checks:
    assert path.exists(), f'Missing asset: {path}'
    with Image.open(path) as im:
        assert im.size == dimensions, f'Invalid pixel dimensions: {path} {im.size}'
        assert im.format == 'PNG', f'Not PNG: {path}'
        if frame:
            assert im.mode == 'RGBA', f'No RGBA alpha: {path}'
            pixels = im.convert('RGBA')
            tiles = [pixels.crop((x*frame,y*frame,(x+1)*frame,(y+1)*frame))
                     for y in range(im.height//frame) for x in range(im.width//frame)]
            assert all(t.getchannel('A').getbbox() is not None for t in tiles), f'Empty frame: {path}'
            unique = len({sha256(t.tobytes()).hexdigest() for t in tiles})
            assert unique >= 3, f'Insufficient animated unique frames: {path} ({unique})'
print(f'V0.5 PASS: {len(checks)} PNGs, frame dimensions, RGBA coverage and non-identical animations')
