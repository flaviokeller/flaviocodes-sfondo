// Grainy: dark canvas with a glowing arc (uMode 0) or a tilted radial glow (uMode 1).
// Ramp stops = colors + [bg]. Heavy grain comes from uGrain in common.glsl.
uniform int uMode;
uniform vec3 uBg, uHot;       // sRGB
uniform vec3 uArc;            // centre x, centre y, radius
uniform vec2 uArcShape;       // inner depth, halo falloff
uniform vec4 uGlow;           // centre x, centre y, radius x, radius y
uniform vec2 uGlowShape;      // tilt, gamma

vec3 scene(vec2 p) {
  if (uMode == 0) {
    float s = uArc.z - (length(p - uArc.xy) + 0.012 * fbm(p, 2.5, 2, 1u)); // > 0 inside the arc
    vec3 inside = ramp(pow(clamp(s / uArcShape.x, 0.0, 1.0), 0.85));
    vec3 outside = mix(uBg, uHot, exp(min(s, 0.0) / uArcShape.y) * 0.9);
    // Python softens this edge with a post blur; a narrow blend does the same here
    return mix(outside, inside, smoothstep(-0.002, 0.002, s));
  }
  vec2 w = p + 0.05 * vec2(fbm(p, 1.5, 2, 11u), fbm(p, 1.5, 2, 23u));
  vec2 d = w - uGlow.xy;
  float c = cos(uGlowShape.x), s = sin(uGlowShape.x);
  vec2 uv = vec2(d.x * c + d.y * s, -d.x * s + d.y * c) / uGlow.zw;
  return ramp(pow(length(uv), uGlowShape.y));
}
