// Phase 2 acceptance: a flat OKLab ramp rendered through the harness (with dither) must not band.
// ?w=&h=&colors=hex,hex (defaults: 5120x2880, a very dark ramp, which bands worst).
import { renderGl } from '../src/gl/gl.ts';
import { stops } from '../src/gl/uniforms.ts';

const q = new URLSearchParams(location.search);
const w = Number(q.get('w') ?? 5120), h = Number(q.get('h') ?? 2880);
const colors = (q.get('colors') ?? '05030f,1a0f3d').split(',').map((c) => `#${c}`);
const scene = `vec3 scene(vec2 p) { return ramp(p.x * sqrt(uSize.x * uSize.y) / uSize.x); }`;
renderGl(document.getElementById('c') as HTMLCanvasElement, scene, w, h, { uSeed: 0, uGrain: 0, ...stops(colors) });
document.title = 'done';
