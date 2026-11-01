// Gradient Blur: soft anisotropic gaussian blooms of colour dissolving into a dark bg.
// Colour = weight-averaged blob colours; coverage fades it into uBg.
uniform vec4 uBlobs[8];       // centre x, centre y, radius x, radius y
uniform float uBlobAngle[8];
uniform vec3 uBlobColor[8];   // sRGB
uniform int uBlobCount;
uniform vec3 uBg;
uniform float uWarp, uGain;

vec3 scene(vec2 p) {
  vec2 w = p + uWarp * vec2(fbm(p, 1.1, 3, 1u), fbm(p, 1.1, 3, 2u));
  float wsum = 0.0;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < uBlobCount; i++) {
    vec2 d = w - uBlobs[i].xy;
    float c = cos(uBlobAngle[i]), s = sin(uBlobAngle[i]);
    vec2 uv = vec2(d.x * c + d.y * s, -d.x * s + d.y * c) / uBlobs[i].zw;
    float wi = exp(-dot(uv, uv) * 1.3);
    wsum += wi;
    acc += wi * uBlobColor[i];
  }
  vec3 color = acc / (wsum + 1e-6);
  float cov = pow(1.0 - exp(-uGain * wsum), 1.6); // deeper blacks, punchier colour
  return uBg + cov * (color - uBg);
}
