"""Validate original four-frame HD Sword idle artwork before releasing Pages.
Read only. Does not change any other character, server state or legacy game.
"""
from pathlib import Path
import xml.etree.ElementTree as ET
import base64, io, hashlib
from PIL import Image

root = Path(__file__).resolve().parents[1]
p = root / "public/assets/sprites/sword-idle-front-4f-v08.svg"
assert p.is_file(), f"Missing verified Sword atlas: {p}"
svg = ET.parse(p).getroot()
assert int(svg.attrib.get("width", 0)) == 768
assert int(svg.attrib.get("height", 0)) == 288
assert svg.attrib.get("viewBox") == "0 0 768 288"
images = svg.findall(".//{http://www.w3.org/2000/svg}image")
assert len(images) == 1, "Expected exactly one embedded source sheet"
href = images[0].attrib.get("href") or images[0].attrib.get("{http://www.w3.org/1999/xlink}href", "")
assert href.startswith("data:image/webp;base64,"), "Missing embedded original artwork"
binary = base64.b64decode(href.split(",",1)[1], validate=True)
assert binary.startswith(b"RIFF") and binary[8:12] == b"WEBP", "Corrupt WebP atlas"
with Image.open(io.BytesIO(binary)) as raw:
    assert raw.size == (768,288), f"Wrong atlas dimensions: {raw.size}"
    sheet = raw.convert("RGBA")
    cells = [sheet.crop((192*i,0,192*(i+1),288)) for i in range(4)]
    assert all(c.getchannel("A").getbbox() is not None for c in cells), "Blank frame in HD atlas"
    distinct = {hashlib.sha256(c.tobytes()).digest() for c in cells}
    assert len(distinct) >= 2, "No genuine frame difference in HD atlas"
print("PASS: embedded Sword HD idle atlas: 768x288, 4 populated RGBA frames, changing art")
