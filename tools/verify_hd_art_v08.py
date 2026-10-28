"""Validate the actual V0.8 high-detail Sword four-frame art file.
Safe read-only release check; does not alter game files or any old project.
"""
from pathlib import Path
import base64
import hashlib
import io
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sprite = ROOT / "public/assets/sprites/sword-idle-front-4f-v08.svg"
portrait = ROOT / "public/assets/portraits/sword-portrait-v08.svg"
concept = ROOT / "public/assets/portraits/sword-concept-v08.svg"

for file in (sprite, portrait, concept):
    assert file.is_file() and file.stat().st_size > 512, f"Missing HD original artwork: {file}"
    ET.parse(file)  # Must be valid standalone SVG.

root = ET.parse(sprite).getroot()
assert root.attrib.get("width") == "768", f"Wrong sprite width: {root.attrib.get('width')}"
assert root.attrib.get("height") == "288", f"Wrong sprite height: {root.attrib.get('height')}"
ns = "{http://www.w3.org/2000/svg}"
images = root.findall(f".//{ns}image")
assert len(images) == 1, "Expected exactly one genuine four-frame image sheet"
href = images[0].attrib.get("href") or images[0].attrib.get("{http://www.w3.org/1999/xlink}href", "")
prefix = "data:image/webp;base64,"
assert href.startswith(prefix), "HD sprite must contain embedded WebP artwork"
blob = base64.b64decode(href[len(prefix):], validate=True)
assert blob[:4] == b"RIFF" and blob[8:12] == b"WEBP", "Invalid WebP payload"

with Image.open(io.BytesIO(blob)) as image:
    im = image.convert("RGBA")
    assert im.size == (768, 288), f"Embedded sprite has wrong size: {im.size}"
    frames = [im.crop((192*i, 0, 192*(i+1), 288)) for i in range(4)]
    assert all(frame.getchannel("A").getbbox() for frame in frames), "Missing character in an idle frame"
    unique = {hashlib.sha256(frame.tobytes()).digest() for frame in frames}
    assert len(unique) >= 2, "Idle animation is just one still image repeated"

print(f"PASS: original Sword HD 4-frame sprite, alpha and {len(unique)} distinct frames")
