"""Export wallpapers/palettes.py -> web/palettes.json (single source of truth stays in Python
until the web port replaces it)."""
import json
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))
from wallpapers.palettes import PALETTES  # noqa: E402

out = root / "web" / "palettes.json"
out.write_text(json.dumps(PALETTES, indent=2) + "\n")
print("wrote", out)
