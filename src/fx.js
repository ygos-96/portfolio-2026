// Pós-processamento "HQ / Aranhaverso" em WebGL: desalinhamento de cor (impressão),
// meio-tom nas sombras, contorno de tinta, grão de papel, cores mais saturadas e vinheta.
// Intensidade moderada. Se o WebGL não existir, devolve null e o jogo desenha direto no 2D.

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_res;     // tamanho em px do canvas
uniform float u_unit;   // px de tela por pixel lógico do jogo
uniform float u_time;   // tempo em passos de 1/12 s ("de dois em dois")
uniform float u_motion; // 0 = sem grão animado
varying vec2 v_uv;

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 px = 1.0 / u_res;
  vec2 c = v_uv - 0.5;
  float rad = dot(c, c);

  // 1) impressão mal registrada: R e B deslocados, mais forte nas bordas da tela
  vec2 off = px * u_unit * (vec2(0.8, 0.35) + c * 2.6);
  vec3 col;
  col.r = texture2D(u_tex, v_uv + off).r;
  col.g = texture2D(u_tex, v_uv).g;
  col.b = texture2D(u_tex, v_uv - off).b;

  // 2) contorno de tinta: escurece onde a luminância muda bruscamente
  float d = max(1.0, u_unit * 0.7);
  float l0 = luma(col);
  float lr = luma(texture2D(u_tex, v_uv + vec2(d, 0.0) * px).rgb);
  float ll = luma(texture2D(u_tex, v_uv - vec2(d, 0.0) * px).rgb);
  float lu = luma(texture2D(u_tex, v_uv + vec2(0.0, d) * px).rgb);
  float ld = luma(texture2D(u_tex, v_uv - vec2(0.0, d) * px).rgb);
  float edge = max(max(abs(l0 - lr), abs(l0 - ll)), max(abs(l0 - lu), abs(l0 - ld)));
  float ink = smoothstep(0.10, 0.30, edge) * 0.8;
  col = mix(col, vec3(0.10, 0.07, 0.16), ink);

  // 3) meio-tom (pontos de HQ) nas áreas escuras
  float l = luma(col);
  float ang = 0.785398;
  mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
  vec2 g = rot * gl_FragCoord.xy / (u_unit * 1.6);
  float dist = length(fract(g) - 0.5);
  float radius = (1.0 - l) * 0.8;
  float dots = smoothstep(radius + 0.08, radius - 0.08, dist);
  float shade = smoothstep(0.85, 0.3, l);
  col = mix(col, col * vec3(0.45, 0.4, 0.68), dots * shade * 0.85);

  // 4) cor: saturação e contraste leves
  float gr = luma(col);
  col = mix(vec3(gr), col, 1.35);
  col = (col - 0.5) * 1.12 + 0.5;

  // 5) grão de papel (troca a 12 fps) + vinheta
  float n = hash(floor(gl_FragCoord.xy / max(1.0, u_unit * 0.7)) + floor(u_time * 12.0) * u_motion);
  col += (n - 0.5) * 0.09;
  col *= 1.0 - rad * 0.5;

  gl_FragColor = vec4(col, 1.0);
}`

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('fx shader:', gl.getShaderInfoLog(s))
    return null
  }
  return s
}

export function createFx(canvas, { animateGrain = true } = {}) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' })
  if (!gl) return null
  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return null
  const prog = gl.createProgram()
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW) // triângulo cobrindo a tela
  const loc = gl.getAttribLocation(prog, 'a_pos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  const u = {
    res: gl.getUniformLocation(prog, 'u_res'),
    unit: gl.getUniformLocation(prog, 'u_unit'),
    time: gl.getUniformLocation(prog, 'u_time'),
    motion: gl.getUniformLocation(prog, 'u_motion'),
  }

  return {
    render(scene, unit, time) {
      if (gl.isContextLost()) return
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene)
      gl.uniform2f(u.res, canvas.width, canvas.height)
      gl.uniform1f(u.unit, unit)
      gl.uniform1f(u.time, Math.floor(time * 12) / 12)
      gl.uniform1f(u.motion, animateGrain ? 1 : 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
  }
}
