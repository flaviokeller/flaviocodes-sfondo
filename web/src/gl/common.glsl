// Shared GLSL for the smooth styles. A style supplies `vec3 scene(vec2 p)` returning
// sRGB in 0..1, with p in units of sqrt(w*h), origin top-left, y down (same as Python).
// main() then adds film grain (sized in output pixels) and a 1-LSB dither.

uniform vec2 uSize;        // output size in pixels
uniform uint uSeed;        // per-palette layout seed
uniform float uGrain;      // grain amplitude (0 = none)
uniform vec3 uStops[8];    // ramp stops, already in OKLab (see color.ts)
uniform int uStopCount;

out vec4 outColor;

// ---- hashing (integer, so results are identical on every GPU) ----
uint hash(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v.x ^ v.y ^ v.z;
}
float hash01(ivec2 c, uint salt) { return float(hash(uvec3(uvec2(c), uSeed * 7919u + salt)) >> 8) / 16777216.0; }
// Standard normal via Box-Muller.
float gauss(ivec2 c, uint salt) {
  float u1 = max(hash01(c, salt), 1e-7), u2 = hash01(c, salt + 1013u);
  return sqrt(-2.0 * log(u1)) * cos(6.28318530718 * u2);
}

// ---- smooth value noise, roughly unit variance; `salt` picks an independent field ----
float noise(vec2 p, float freq, uint salt) {
  p *= freq;
  vec2 i = floor(p), f = p - i;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); // quintic
  ivec2 c = ivec2(i);
  float a = gauss(c, salt), b = gauss(c + ivec2(1, 0), salt);
  float d = gauss(c + ivec2(0, 1), salt), e = gauss(c + ivec2(1, 1), salt);
  // bilinear blend of unit-variance values loses variance; 1.6 brings it back to ~1
  return 1.6 * mix(mix(a, b, u.x), mix(d, e, u.x), u.y);
}

float fbm(vec2 p, float freq, int octaves, uint salt) {
  float tot = 0.0, amp = 1.0, norm = 0.0;
  for (int o = 0; o < octaves; o++) {
    tot += amp * noise(p, freq * exp2(float(o)), salt + uint(o) * 101u);
    norm += amp * amp;
    amp *= 0.5;
  }
  return tot / sqrt(norm);
}

// ---- colour: OKLab -> sRGB and the ramp over uStops ----
float toSrgb(float c) {
  c = clamp(c, 0.0, 1.0);
  return c <= 0.0031308 ? c * 12.92 : 1.055 * pow(c, 1.0 / 2.4) - 0.055;
}
vec3 oklabToRgb(vec3 lab) {
  vec3 lms = vec3(
    lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z,
    lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z,
    lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z);
  lms = lms * lms * lms;
  return vec3(
    toSrgb( 4.0767416621 * lms.x - 3.3077115913 * lms.y + 0.2309699292 * lms.z),
    toSrgb(-1.2684380046 * lms.x + 2.6097574011 * lms.y - 0.3413193965 * lms.z),
    toSrgb(-0.0041960863 * lms.x - 0.7034186147 * lms.y + 1.7076147010 * lms.z));
}
vec3 rampLab(float t) {
  float x = clamp(t, 0.0, 1.0) * float(uStopCount - 1);
  int i = min(int(x), uStopCount - 2);
  return mix(uStops[i], uStops[i + 1], x - float(i));
}
vec3 ramp(float t) { return oklabToRgb(rampLab(t)); }

vec3 scene(vec2 p);

void main() {
  vec2 px = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y); // y down, pixel centres
  float unit = sqrt(uSize.x * uSize.y);
  vec3 c = scene(px / unit);
  if (uGrain > 0.0) {
    // gaussian luma grain, a bit coarser on big canvases so it survives downscaling
    float gs = max(1.0, max(uSize.x, uSize.y) / 3000.0);
    vec2 g = px / gs - 0.5;
    vec2 i = floor(g), f = g - i;
    ivec2 k = ivec2(i);
    float n = mix(mix(gauss(k, 7u), gauss(k + ivec2(1, 0), 7u), f.x),
                  mix(gauss(k + ivec2(0, 1), 7u), gauss(k + ivec2(1, 1), 7u), f.x), f.y);
    c += n * uGrain;
  }
  c += (vec3(hash01(ivec2(px), 3u), hash01(ivec2(px), 4u), hash01(ivec2(px), 5u)) - 0.5) / 255.0;
  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
