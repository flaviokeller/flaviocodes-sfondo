// Influx: silky lit wave surfaces. Height field = 3 warped sine swells, lit with
// Lambert + Blinn specular from the top left; colour from the ramp along the height.
// Shading moves the colour along the ramp (shadows take the darker stops' hue) and scales
// OKLab lightness. Multiplying sRGB instead turns cream/orange into brown mud.
uniform vec4 uSwell[3];       // dir x, dir y, wavenumber, amplitude
uniform float uSwellPhase[3];
uniform float uWarp, uRelief, uSpec, uShadeShift;

float wx(vec2 p) { return fbm(p, 0.9, 3, 1u); }

float height(vec2 p) {
  vec2 w = p + uWarp * vec2(wx(p), fbm(p, 0.9, 3, 2u));
  float H = 0.0;
  for (int i = 0; i < 3; i++) H += uSwell[i].w * sin(uSwell[i].z * dot(w, uSwell[i].xy) + uSwellPhase[i]);
  return H;
}

vec3 scene(vec2 p) {
  const float e = 0.0015; // finite-difference step, in units
  float H = height(p);
  vec2 g = vec2(height(p + vec2(e, 0.0)) - H, height(p + vec2(0.0, e)) - H) / e;
  vec3 n = normalize(vec3(-uRelief * g, 1.0));
  vec3 L = normalize(vec3(-0.45, -0.55, 0.7));
  vec3 Hh = normalize(L + vec3(0.0, 0.0, 1.0));
  float lam = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(n, Hh), 0.0, 1.0), 40.0);
  float t = 0.5 + 0.5 * tanh(0.9 * H + 0.35 * wx(p));
  // lam is ~0.7 on flat ground, so flat areas keep their ramp colour
  vec3 lab = rampLab(t + uShadeShift * (lam - 0.7));
  lab.x *= 0.72 + 0.4 * lam;
  return oklabToRgb(lab) + spec * uSpec;
}
