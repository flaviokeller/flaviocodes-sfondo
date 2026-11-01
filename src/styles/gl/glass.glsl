// Glass: a sheet folded along a few long, near-parallel creases. Height = sum of signed
// soft |x| folds, so every facet is a plane with its own normal (flat-lit, like folded
// paper or a pane of glass), and the soft core of |x| anti-aliases each crease.
// Colour runs along uDir through the ramp; shading shifts it along the ramp and scales
// OKLab lightness (as in influx). Ridges catch a narrow specular line, valleys a shadow.
uniform vec4 uFolds[5];       // crease normal x, y, offset, signed slope (+ valley, - ridge)
uniform int uFoldCount;
uniform vec2 uDir;            // ramp direction (unit), uDirSpan maps it to 0..1
uniform vec2 uDirSpan;        // offset, scale
uniform float uRelief, uSpec, uShadeShift;

vec3 scene(vec2 p) {
  const float soft = 0.004; // crease softness, in units
  vec2 g = vec2(0.0);
  float ridge = 0.0, valley = 0.0;
  for (int i = 0; i < uFoldCount; i++) {
    float x = dot(p, uFolds[i].xy) - uFolds[i].z;
    g += uFolds[i].w * x / sqrt(x * x + soft * soft) * uFolds[i].xy;
    float line = exp(-abs(x) / (2.5 * soft));
    if (uFolds[i].w < 0.0) ridge = max(ridge, line); else valley = max(valley, line);
  }
  vec3 n = normalize(vec3(-uRelief * g, 1.0));
  vec3 L = normalize(vec3(-0.45, -0.55, 0.7));
  vec3 Hh = normalize(L + vec3(0.0, 0.0, 1.0));
  float lam = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(n, Hh), 0.0, 1.0), 60.0);
  float t = (dot(p, uDir) - uDirSpan.x) * uDirSpan.y + 0.06 * fbm(p, 1.1, 2, 31u);
  vec3 lab = rampLab(t + uShadeShift * (lam - 0.7));
  lab.x *= (0.72 + 0.4 * lam) * (1.0 - 0.25 * valley);
  return oklabToRgb(lab) + (spec + 0.6 * ridge) * uSpec;
}
