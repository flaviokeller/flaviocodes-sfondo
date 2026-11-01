// Blur: soft, swirling colour bands. A sine along a direction, domain-warped by fbm.
uniform float uWarp, uFreq, uAngle, uPhase;

vec3 scene(vec2 p) {
  vec2 w = p + uWarp * vec2(fbm(p, 0.9, 2, 1u), fbm(p, 0.9, 2, 2u));
  float proj = dot(w, vec2(cos(uAngle), sin(uAngle)));
  return ramp(0.5 + 0.5 * sin(proj * uFreq + 1.6 * fbm(p, 0.9, 2, 3u) + uPhase));
}
