// Compare the JS OKLab ramp with Python's wallpapers.core.ramp for every palette.
// Usage: npm run check:ramp (needs the repo's Python venv at ../.venv).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ramp } from '../src/core/color.ts';
import { PALETTES } from '../src/core/palettes.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const N = 33;
const py = `
import json, numpy as np
from wallpapers.core import ramp
from wallpapers.palettes import PALETTES
t = np.linspace(0, 1, ${N})
print(json.dumps({f"{s}/{p}": ramp(t, v["colors"]).tolist() for s, ps in PALETTES.items() for p, v in ps.items()}))
`;
const expected: Record<string, number[][]> = JSON.parse(
  execFileSync(`${root}.venv/bin/python`, ['-c', py], { cwd: root, encoding: 'utf8' }),
);

let worst = 0;
for (const [style, pals] of Object.entries(PALETTES)) {
  for (const [name, pal] of Object.entries(pals)) {
    expected[`${style}/${name}`].forEach((exp, i) => {
      const got = ramp(i / (N - 1), pal.colors);
      for (let k = 0; k < 3; k++) worst = Math.max(worst, Math.abs(got[k] - exp[k]) * 255);
    });
  }
}
console.log(`max ramp difference vs Python: ${worst.toFixed(3)} / 255`);
if (worst > 1) process.exit(1);
