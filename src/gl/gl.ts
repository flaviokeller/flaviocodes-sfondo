/** Minimal WebGL2 harness: one full-screen triangle, a fragment shader, typed uniforms. */
import common from './common.glsl?raw';

export type Uniforms = Record<string, number | number[]>;

const VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const programs = new WeakMap<WebGL2RenderingContext, Map<string, WebGLProgram>>();

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader compile failed');
  return s;
}

function program(gl: WebGL2RenderingContext, scene: string): WebGLProgram {
  let cache = programs.get(gl);
  if (!cache) programs.set(gl, (cache = new Map()));
  let p = cache.get(scene);
  if (p) return p;
  p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, `#version 300 es\nprecision highp float;\nprecision highp int;\n${common}\n${scene}`));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link failed');
  cache.set(scene, p);
  return p;
}

function setUniform(gl: WebGL2RenderingContext, type: number, loc: WebGLUniformLocation, v: number | number[]) {
  const a = typeof v === 'number' ? [v] : v;
  switch (type) {
    case gl.FLOAT: return gl.uniform1fv(loc, a);
    case gl.FLOAT_VEC2: return gl.uniform2fv(loc, a);
    case gl.FLOAT_VEC3: return gl.uniform3fv(loc, a);
    case gl.FLOAT_VEC4: return gl.uniform4fv(loc, a);
    case gl.INT: return gl.uniform1iv(loc, a);
    case gl.UNSIGNED_INT: return gl.uniform1uiv(loc, a);
    default: throw new Error(`unsupported uniform type 0x${type.toString(16)}`);
  }
}

/**
 * Render `scene` (GLSL defining `vec3 scene(vec2 p)`) into `canvas` at exactly w x h.
 * uSize is set here; every other uniform the shader uses must be in `uniforms`.
 */
export function renderGl(canvas: HTMLCanvasElement, scene: string, w: number, h: number, uniforms: Uniforms) {
  canvas.width = w;
  canvas.height = h;
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
  if (!gl) throw new Error('WebGL2 not available');
  const [maxW, maxH] = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
  const maxRb = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
  if (w > Math.min(maxW, maxRb) || h > Math.min(maxH, maxRb) || gl.drawingBufferWidth !== w || gl.drawingBufferHeight !== h)
    throw new Error(`canvas ${w}x${h} exceeds this GPU's limits (max ${Math.min(maxW, maxRb)}x${Math.min(maxH, maxRb)})`);

  const p = program(gl, scene);
  gl.useProgram(p);
  const all: Uniforms = { uSize: [w, h], ...uniforms };
  for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number; i < n; i++) {
    const info = gl.getActiveUniform(p, i)!;
    const name = info.name.replace(/\[0\]$/, '');
    if (!(name in all)) throw new Error(`missing uniform ${name}`);
    setUniform(gl, info.type, gl.getUniformLocation(p, info.name)!, all[name]);
  }
  gl.viewport(0, 0, w, h);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
