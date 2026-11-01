// Contours: a topographic map of a mountain range. Height = ridged fbm lifted by a few
// warped gaussian peaks; isolines every 1/uLevels of height, every 5th one thicker
// (index contours). Lines are anti-aliased in screen space via fwidth, so their width
// is the same at any resolution and they bunch up on steep slopes like a real survey map.
uniform vec3 uPeaks[3];       // centre x, y (in units), radius
uniform int uPeakCount;
uniform float uLevels;        // isolines over the full height range
uniform float uLine;          // minor line half-width, in units
uniform vec3 uBg;

float terrain(vec2 p) {
  vec2 q = p + 0.1 * vec2(fbm(p, 1.5, 3, 11u), fbm(p, 1.5, 3, 12u));
  // massif: overlapping peaks, sharpened at the top so summits look pointed, not domed
  float peaks = 0.0;
  for (int i = 0; i < uPeakCount; i++) {
    float d = length(q - uPeaks[i].xy) / uPeaks[i].z;
    peaks += exp(-1.6 * d);
  }
  // ridges radiate down the slopes: soft |noise| creases, angular-ish around each peak
  float ridge = 1.0 - sqrt(pow(noise(q, 2.4, 20u), 2.0) + 0.02);
  float detail = fbm(q, 4.0, 3, 30u);
  return peaks * (0.8 + 0.25 * ridge) + 0.04 * detail;
}

vec3 scene(vec2 p) {
  float f = terrain(p) * uLevels;
  float k = floor(f + 0.5);
  float dpx = abs(f - k) / max(fwidth(f), 1e-6);            // distance to the nearest isoline, px
  bool index = mod(k, 5.0) == 0.0;
  float half_ = uLine * sqrt(uSize.x * uSize.y) * (index ? 2.0 : 1.0);
  float cov = clamp(half_ + 0.5 - dpx, 0.0, 1.0) * (index ? 1.0 : 0.65);
  return mix(uBg, ramp(k / uLevels), cov);
}
