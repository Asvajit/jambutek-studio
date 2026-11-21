
/* ================= video synth B: an audio-reactive visualiser, after Fosfora =================
   Fosfora (github.com/kevinraymond/fosfora, (c) 2025-2026 Kevin Raymond, MIT OR Apache-2.0) is a music visualiser whose effects are
   mostly particle simulations run on the graphics card. Ten of them are rebuilt here, by name and behaviour, as small simulations
   that run on the processor straight onto the roof as one 128 x 128 square: Reticle, Strand, Cascade, Cymatics, Morph, Panorama,
   Symbiosis, Tide, Tesla and Flux. They are this room's own code written from Fosfora's descriptions of each effect, with a few
   thousand particles where Fosfora uses hundreds of thousands (see vendor/FOSFORA-NOTICE.md). It listens to the room's master output,
   left and right, and the drum machine's kick and snare stand in for Fosfora's beat detector. The unit has its own small screen,
   live whenever you lean over it, so a picture can be shaped before it goes on the roof. */
var BZW = 300, BZD = 190, BZTH = 0.045;
function bzx(u){ return (u - BZW / 2) * SC; }
function bzz(u){ return (u - BZD / 2) * SC; }
var BZY = new THREE.Group(); BZY.position.set(PGPOS.x, PFH, PGPOS.z); BZY.rotation.y = PGPOS.r; scene.add(BZY);
var BZG = new THREE.Group(); BZG.rotation.x = PFTILT; BZY.add(BZG);
var BZ = { p:{ a:0.5, b:0.5, c:0.5, d:0.5, mode:0, frz:0 }, t:0, ph:0, an:null, bins:null, dirty:true, band:[0, 0, 0, 0, 0, 0, 0], rms:0, cent:0.4 };
var BZMODES = ['RETICLE', 'STRAND', 'CASCADE', 'CYMATICS', 'MORPH', 'PANORAMA', 'SYMBIOSIS', 'TIDE', 'TESLA', 'FLUX'], BZKN = [['A', 'a'], ['B', 'b'], ['C', 'c'], ['SPEED', 'd']],
    BZPN = [['count', 'size', 'glide'], ['strands', 'twist', 'box size'], ['speed', 'spread', 'curl'], ['figure', 'pull', 'spin'], ['spring', 'turbulence', 'scatter'], ['spread', 'scatter', 'hue'], ['species', 'force', 'friction'], ['flow', 'eddies', 'hue'], ['field', 'charge mix', 'tightness'], ['flow', 'colour', 'density']];
function bzRestore(){ try { var s = JSON.parse(store('jambutek-studio-bz-v1') || 'null'); if (s && s.v === 1 && s.p){ ['a', 'b', 'c', 'd'].forEach(function(k){ if (typeof s.p[k] === 'number') BZ.p[k] = clamp(s.p[k], 0, 1); }); BZ.p.mode = clamp(s.p.mode | 0, 0, 9); BZ.p.frz = s.p.frz ? 1 : 0; } } catch (e) {} BZ.dirty = true; } bzRestore();
var bzSaveT = null; function bzSaveNow(){ store('jambutek-studio-bz-v1', JSON.stringify({ v:1, p:BZ.p })); } function bzSaveSoon(){ clearTimeout(bzSaveT); bzSaveT = setTimeout(bzSaveNow, saveMs(800)); }


/* the picture: particles drawn into a square 128 x 128 buffer that fades, so everything leaves a trail. x and y both run -1..1 */
var FX = { W:128, H:128, N:2600, mode:-1, n:0, tau:0.2, seed:1 };
FX.buf = new Float32Array(FX.W * FX.H * 3); FX.c = mk(FX.W, FX.H); FX.ctx = FX.c.getContext('2d'); FX.img = FX.ctx.createImageData(FX.W, FX.H); for (var fxi = 3; fxi < FX.img.data.length; fxi += 4) FX.img.data[fxi] = 255;
FX.tex = new THREE.CanvasTexture(FX.c); FX.tex.magFilter = FX.tex.minFilter = THREE.NearestFilter; FX.tex.generateMipmaps = false;
['px', 'py', 'vx', 'vy', 'pa', 'pb'].forEach(function(k){ FX[k] = new Float32Array(FX.N); });
var fxMat = new THREE.MeshBasicMaterial({ map:FX.tex });
VID.sq = new THREE.Mesh(new THREE.PlaneGeometry(SCRW, SCRW), fxMat); VID.sq.position.set(RIG.x, ROOM.h - 0.071, RIG.z); VID.sq.rotation.x = Math.PI / 2; VID.sq.userData.noShadow = true; VID.sq.visible = false; scene.add(VID.sq);      // one square over the two half screens
function fxRnd(){ return Math.random(); }
function fxHash(a, b){ var h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); }
function fxPal(t, cn, ph, o){                              // the warm-to-cool cosine palette, steered by how bright the sound is
  var A = [0.5 - 0.2 * cn, 0.3 + 0.1 * cn, 0.2 + 0.4 * cn], B = [0.5 - 0.1 * cn, 0.3, 0.2 + 0.2 * cn], C = [1, 0.7 + 0.3 * cn, 0.4 + 0.8 * cn], D = [0, 0.15 + 0.18 * cn, 0.2 + 0.47 * cn];
  for (var k = 0; k < 3; k++) o[k] = Math.max(0, A[k] + B[k] * Math.cos(6.28318 * (C[k] * t + D[k] + ph))); return o;
}
function fxDot(x, y, r, g, b){
  var ix = ((x + 1) * 64) | 0, iy = ((1 - y) * 64) | 0; if (ix < 0 || ix >= 128 || iy < 0 || iy >= 128) return; var o = (iy * 128 + ix) * 3, B = FX.buf; B[o] += r; B[o + 1] += g; B[o + 2] += b;
}
function fxLine(x0, y0, x1, y1, r, g, b){ var n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 64)); for (var i = 0; i <= n; i++){ var f = i / n; fxDot(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, r, g, b); } }
function fxBox(x, y, h, r, g, b){ fxLine(x - h, y - h, x + h, y - h, r, g, b); fxLine(x + h, y - h, x + h, y + h, r, g, b); fxLine(x + h, y + h, x - h, y + h, r, g, b); fxLine(x - h, y + h, x - h, y - h, r, g, b); }
function fxFlow(x, y, t, o){                                // a swirling flow with no sources or sinks: the curl of a moving stream function
  o[0] = -2.3 * Math.sin(1.7 * x + 0.6 * t) * Math.sin(2.3 * y - 0.4 * t) - 1.32 * Math.cos(3.1 * x - 2.2 * y + 0.5 * t) - 1.72 * Math.sin(4.3 * y + 1.1 * x - 0.7 * t);
  o[1] = -(1.7 * Math.cos(1.7 * x + 0.6 * t) * Math.cos(2.3 * y - 0.4 * t) + 1.86 * Math.cos(3.1 * x - 2.2 * y + 0.5 * t) - 0.44 * Math.sin(4.3 * y + 1.1 * x - 0.7 * t)); return o;
}
var FXCH = [[2, 1], [3, 2], [4, 1], [3, 1], [5, 2], [1, 3], [4, 3], [2, 3], [5, 1]];
function fxChl(x, y, m){ var P = Math.PI; return Math.cos(m[0] * P * x) * Math.cos(m[1] * P * y) - Math.cos(m[1] * P * x) * Math.cos(m[0] * P * y); }
function fxShape(k, u, o){                                  // the outlines Morph springs between
  var a = u * 6.28318, r, s;
  if (k === 0){ o[0] = Math.cos(a) * 0.36; o[1] = Math.sin(a) * 0.36; }
  else if (k === 1 || k === 2){ var n = k === 1 ? 4 : 3, q = u * n, i = Math.floor(q), f = q - i, a0 = (i / n) * 6.28318 + (k === 1 ? 0.785 : 1.571), a1 = ((i + 1) / n) * 6.28318 + (k === 1 ? 0.785 : 1.571), R = k === 1 ? 0.46 : 0.44; o[0] = (Math.cos(a0) * (1 - f) + Math.cos(a1) * f) * R; o[1] = (Math.sin(a0) * (1 - f) + Math.sin(a1) * f) * R; }
  else if (k === 3){ var q2 = u * 10, i2 = Math.floor(q2), f2 = q2 - i2, r0 = i2 % 2 ? 0.17 : 0.42, r1 = i2 % 2 ? 0.42 : 0.17, b0 = i2 / 10 * 6.28318 + 1.571, b1 = (i2 + 1) / 10 * 6.28318 + 1.571; o[0] = Math.cos(b0) * r0 * (1 - f2) + Math.cos(b1) * r1 * f2; o[1] = Math.sin(b0) * r0 * (1 - f2) + Math.sin(b1) * r1 * f2; }
  else if (k === 4){ o[0] = Math.sin(a * 3) * 0.7; o[1] = Math.sin(a * 2) * 0.38; }
  else { r = 0.05 + u * 0.4; s = u * 6.28318 * 4; o[0] = Math.cos(s) * r * 1.5; o[1] = Math.sin(s) * r; }
  return o;
}
function fxInit(m){
  FX.mode = m; FX.buf.fill(0); FX.seed = 7 + m * 101; var i, N = FX.N;
  FX.n = [6, 0, 2600, 2600, 2400, 2400, 520, 2600, 1100, 2600][m]; FX.tau = [0.07, 0.05, 0.25, 0.14, 0.1, 0.3, 0.07, 0.2, 0.7, 0.4][m];
  for (i = 0; i < N; i++){ FX.px[i] = fxRnd() * 2 - 1; FX.py[i] = fxRnd() * 2 - 1; FX.vx[i] = FX.vy[i] = 0; FX.pa[i] = fxRnd(); FX.pb[i] = fxRnd(); }
  if (m === 5) for (i = 0; i < N; i++) FX.pa[i] = 0;                       // panorama: nothing alive yet
  if (m === 8) for (i = 0; i < N; i++){ var a = fxRnd() * 6.283; FX.vx[i] = Math.cos(a) * 0.4; FX.vy[i] = Math.sin(a) * 0.4; }
  FX.mat = []; for (i = 0; i < 36; i++) FX.mat.push(fxRnd() * 2 - 1); FX.pol = 1; FX.head = 0; FX.matBar = -1;
}
var FXT = [0, 0, 0], FXV = [0, 0];
function fxStep(dt, F){                                     // F: what the music is doing, and pots A B C
  var m = FX.mode, n = FX.n, px = FX.px, py = FX.py, vx = FX.vx, vy = FX.vy, pa = FX.pa, pb = FX.pb, A = F.A, B = F.B, C = F.C, t = F.t, i, j, c = FXT, fl = FXV, bass = (F.band[0] + F.band[1]) * 0.5, x, y;
  var dec = Math.exp(-dt / FX.tau), buf = FX.buf; for (i = 0; i < buf.length; i++) buf[i] *= dec;
  if (m === 0){                                             // Reticle: crosshairs that jump to a new target every bar and lock on with the beat
    var cnt = 1 + Math.floor(A * 5.99), size = 0.06 + B * 0.2, k = C > 0.5 ? 3 : 20, lock = Math.exp(-F.ph * 4), br = 0.5 + F.kick * 0.9;
    for (i = 0; i < cnt; i++){
      var tx = (fxHash(F.bar + 3, i * 7 + 1) * 2 - 1) * 0.82, ty = (fxHash(F.bar + 11, i * 13 + 5) * 2 - 1) * 0.8; px[i] += (tx - px[i]) * Math.min(1, dt * k); py[i] += (ty - py[i]) * Math.min(1, dt * k); x = px[i]; y = py[i];
      fxPal(i / 6 + t * 0.03, F.cent, 0, c); var r = c[0] * br, g = c[1] * br, b = c[2] * br, h = size * (0.75 + 1.1 * lock), q = h * 0.4;
      for (j = 0; j < 28; j++){ var an = j / 28 * 6.283; fxDot(x + Math.cos(an) * size * 0.5, y + Math.sin(an) * size * 0.5, r, g, b); }
      fxLine(x - size * 0.9, y, x - size * 0.25, y, r, g, b); fxLine(x + size * 0.25, y, x + size * 0.9, y, r, g, b); fxLine(x, y - size * 0.9, x, y - size * 0.25, r, g, b); fxLine(x, y + size * 0.25, x, y + size * 0.9, r, g, b);
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(s){ fxLine(x + s[0] * h, y + s[1] * h, x + s[0] * (h - q), y + s[1] * h, r * 1.3, g * 1.3, b * 1.3); fxLine(x + s[0] * h, y + s[1] * h, x + s[0] * h, y + s[1] * (h - q), r * 1.3, g * 1.3, b * 1.3); });
    }
  } else if (m === 1){                                      // Strand: helices of hollow boxes with no depth, until the drums put the depth back
    var S = 1 + Math.floor(A * 4.99), tw = (B - 0.2) * 7, bx = 0.014 + C * 0.04, cue = F.drum, R = 26;
    for (var s2 = 0; s2 < S; s2++){ var xc = S === 1 ? 0 : -0.75 + 1.5 * s2 / (S - 1); fxPal(s2 / S + t * 0.03, F.cent, 0.1, c);
      for (j = 0; j < R; j++){ var ang = t * 1.4 + j * tw * 0.16 + s2 * 2.1, dp = Math.cos(ang), bb = (0.55 + cue * 0.5 * dp) * 0.9; fxBox(xc + Math.sin(ang) * (S > 3 ? 0.15 : 0.24), -0.9 + 1.8 * j / (R - 1), bx * (1 + cue * 0.7 * dp), c[0] * bb, c[1] * bb, c[2] * bb); } }
  } else if (m === 2){                                      // Cascade: streams come in from the edges, bass from below, mids from the sides, highs from above
    var sp = 0.2 + A * 0.9, lv = [bass, (F.band[2] + F.band[3]) * 0.5, (F.band[3] + F.band[4]) * 0.5, (F.band[5] + F.band[6]) * 0.5], EC = [[1.0, 0.3, 0.1], [0.9, 0.8, 0.2], [0.2, 1.0, 0.4], [0.3, 0.4, 1.0]];
    for (i = 0; i < n; i++){ var e = i & 3; pb[i] -= dt;
      if (pb[i] <= 0){ if (fxRnd() < 0.04 + lv[e] * 0.9){ pb[i] = 1 + fxRnd() * 2.5; var u = fxRnd() * 2 - 1, w = (fxRnd() - 0.5) * B * 0.5, v0 = sp * (0.5 + lv[e]);
          if (e === 0){ px[i] = u; py[i] = -1; vx[i] = w; vy[i] = v0; } else if (e === 3){ px[i] = u; py[i] = 1; vx[i] = w; vy[i] = -v0; } else if (e === 1){ px[i] = -1; py[i] = u; vx[i] = v0; vy[i] = w; } else { px[i] = 1; py[i] = u; vx[i] = -v0; vy[i] = w; } var j0 = fxRnd() * dt; px[i] += vx[i] * j0; py[i] += vy[i] * j0; } else { pb[i] = 0.05; px[i] = 9; continue; } }
      if (px[i] > 5) continue; fxFlow(px[i] * 1.5, py[i] * 1.5, t, fl); px[i] += (vx[i] + fl[0] * C * 0.06) * dt; py[i] += (vy[i] + fl[1] * C * 0.06) * dt; var q2 = 0.11 * Math.min(1, pb[i]); fxDot(px[i], py[i], EC[e][0] * q2, EC[e][1] * q2, EC[e][2] * q2); }
  } else if (m === 3){                                      // Cymatics: sand on a vibrating plate, settling on the lines that stand still
    var md = FXCH[Math.min(8, Math.floor(clamp(A + (F.band[1] - F.band[4]) * 0.06, 0, 0.999) * 9))], pull = 0.6 + B * 5, rot = t * (C - 0.5) * 0.8, cr = Math.cos(rot), sr = Math.sin(rot), jit = 0.12 + F.rms * 1.2 + F.kick * 1.6, eps = 0.01;
    for (i = 0; i < n; i++){ x = px[i]; y = py[i]; var v = fxChl(x, y, md), gx = (fxChl(x + eps, y, md) - v) / eps, gy = (fxChl(x, y + eps, md) - v) / eps;
      var st = pull * dt * 0.09, mx2 = clamp(-v * gx * st, -0.02, 0.02), my2 = clamp(-v * gy * st, -0.02, 0.02); x += mx2 + (fxRnd() - 0.5) * jit * dt * 0.35; y += my2 + (fxRnd() - 0.5) * jit * dt * 0.35;      // slide downhill toward the still lines; the music shakes the sand loose if (x < -1 || x > 1) { x = fxRnd() * 2 - 1; } if (y < -1 || y > 1){ y = fxRnd() * 2 - 1; } px[i] = x; py[i] = y;
      fxPal(Math.sqrt(x * x + y * y) * 0.5 + t * 0.04, F.cent, 0.1, c); fxDot((x * cr - y * sr) * 0.72, (x * sr + y * cr) * 0.72, c[0] * 0.14, c[1] * 0.14, c[2] * 0.14); }
  } else if (m === 4){                                      // Morph: particles spring from one outline to the next, changing every two bars
    var shp = Math.floor(F.bar / 2) % 6, ks = 6 + A * 40, tb = B * (0.4 + F.rms * 3), o = FXV;
    for (i = 0; i < n; i++){ fxShape(shp, (i + 0.5) / n, o); var gx2 = o[0] * 1.9 + (pa[i] - 0.5) * 0.05, gy2 = o[1] * 1.9 + (pb[i] - 0.5) * 0.05;
      vx[i] += ((gx2 - px[i]) * ks + (fxRnd() - 0.5) * tb * 8) * dt; vy[i] += ((gy2 - py[i]) * ks + (fxRnd() - 0.5) * tb * 8) * dt; if (F.kickNow){ vx[i] += (fxRnd() - 0.5) * C * 1.6; vy[i] += (fxRnd() - 0.5) * C * 1.6; }
      vx[i] *= 0.9; vy[i] *= 0.9; px[i] += vx[i] * dt; py[i] += vy[i] * dt; fxPal(i / n + t * 0.05, F.cent, 0, c); fxDot(px[i], py[i], c[0] * 0.2, c[1] * 0.2, c[2] * 0.2); }
  } else if (m === 5){                                      // Panorama: left to right is where a sound sits between the speakers, bottom to top is its pitch
    if (F.L) for (var bk = 0; bk < 28; bk++){ var i0 = Math.floor(2 * Math.pow(1.19, bk)), i1 = Math.max(i0 + 1, Math.floor(2 * Math.pow(1.19, bk + 1))), l = 0, r2 = 0; for (j = i0; j < i1 && j < 512; j++){ l += F.L[j]; r2 += F.R[j]; } l /= (i1 - i0) * 255; r2 /= (i1 - i0) * 255;
      var lev = Math.max(l, r2), pan = (r2 - l) / (r2 + l + 0.02), born = Math.floor(lev * lev * 9 + fxRnd()); for (j = 0; j < born; j++){ var id = FX.head; FX.head = (FX.head + 1) % n; px[id] = clamp(pan * 2.2 * (0.3 + A * 0.9) + (fxRnd() - 0.5) * (0.03 + B * 0.5) * (0.4 + bk / 28), -0.99, 0.99); py[id] = -0.92 + 1.84 * (bk + fxRnd()) / 28; pa[id] = 1; pb[id] = bk / 28; } }
    for (i = 0; i < n; i++){ if (pa[i] <= 0) continue; pa[i] -= dt * 1.8; py[i] += dt * 0.02; fxPal(pb[i] * 0.8 + C, 0.5, 0, c); var q3 = pa[i] * 0.2; fxDot(px[i], py[i], c[0] * q3, c[1] * q3, c[2] * q3); }
  } else if (m === 6){                                      // Symbiosis: particle life. Each species is drawn to some and flees others, and little ecosystems form
    var SP = 2 + Math.floor(A * 4.99), fs = (0.4 + B * 2.2) * (1 + F.rms * 1.5), fr = Math.pow(0.5, dt / (0.02 + (1 - C) * 0.25)), rmax = 0.26, rmin = 0.035, MAT = FX.mat;
    if (Math.floor(F.bar / 16) !== FX.matBar){ FX.matBar = Math.floor(F.bar / 16); for (i = 0; i < 36; i++) MAT[i] = fxRnd() * 2 - 1; }
    for (i = 0; i < n; i++){ var si = (i % SP) * 6, ax = 0, ay = 0; x = px[i]; y = py[i];
      for (j = 0; j < n; j++){ if (j === i) continue; var dx = px[j] - x, dy = py[j] - y; if (dx > 1) dx -= 2; else if (dx < -1) dx += 2; if (dy > 1) dy -= 2; else if (dy < -1) dy += 2; var d2 = dx * dx + dy * dy; if (d2 > rmax * rmax || d2 < 1e-8) continue; var d = Math.sqrt(d2), f = d < rmin ? d / rmin - 1 : MAT[si + (j % SP)] * (1 - Math.abs(2 * d - rmax - rmin) / (rmax - rmin)); ax += dx / d * f; ay += dy / d * f; }
      vx[i] = (vx[i] + ax * fs * dt * 0.6) * fr; vy[i] = (vy[i] + ay * fs * dt * 0.6) * fr; }
    for (i = 0; i < n; i++){ px[i] += vx[i] * dt; py[i] += vy[i] * dt; if (px[i] > 1) px[i] -= 2; else if (px[i] < -1) px[i] += 2; if (py[i] > 1) py[i] -= 2; else if (py[i] < -1) py[i] += 2; fxPal((i % SP) / SP + 0.05, 0.5, 0, c); fxDot(px[i], py[i], c[0] * 0.7, c[1] * 0.7, c[2] * 0.7); }
  } else if (m === 7){                                      // Tide: a waterfall that parts round a stone; drums break it into white water
    var fall = (0.4 + A * 1.3) * (0.6 + F.rms * 0.8), ed = B * 0.16, hue = C, wh = Math.min(1, F.kick * 0.9 + F.onset * 0.6), RS = 0.26;
    for (i = 0; i < n; i++){ fxFlow(px[i] * 2, py[i] * 2, t * 0.6, fl); var tvx = fl[0] * ed + (wh > 0.2 ? (fxRnd() - 0.5) * wh * 1.2 : 0), tvy = -fall * (0.7 + pa[i] * 0.6) + fl[1] * ed * 0.5; vx[i] += (tvx - vx[i]) * Math.min(1, dt * 5); vy[i] += (tvy - vy[i]) * Math.min(1, dt * 5);
      x = px[i] + vx[i] * dt; y = py[i] + vy[i] * dt; var rr = Math.sqrt(x * x + (y - 0.02) * (y - 0.02)); if (rr < RS){ var nx = x / (rr + 1e-6), ny = (y - 0.02) / (rr + 1e-6); x = nx * RS; y = 0.02 + ny * RS; var dn = vx[i] * nx + vy[i] * ny; vx[i] -= dn * nx; vy[i] -= dn * ny; vx[i] += (nx >= 0 ? 1 : -1) * fall * 0.6 * dt * 8; }
      if (y < -1.02){ y = 1.02; x = fxRnd() * 2 - 1; vx[i] = 0; } if (x > 1) x -= 2; else if (x < -1) x += 2; px[i] = x; py[i] = y;
      c[0] = 0.1 + 0.5 * hue; c[1] = 0.55 + 0.2 * pa[i]; c[2] = 1.0 - 0.45 * hue; var w2 = wh * pb[i], q4 = 0.1; fxDot(x, y, (c[0] * (1 - w2) + w2) * q4, (c[1] * (1 - w2) + w2) * q4, (c[2] * (1 - w2) + w2) * q4); }
  } else if (m === 8){                                      // Tesla: charged particles corkscrewing round two magnets; the snare flips the poles
    if (F.snareNow) FX.pol = -FX.pol; var K = (1.5 + A * 10) * (0.6 + bass * 1.5) * FX.pol, tight = 0.4 + C * 1.6, spd = 0.3 + F.rms * 0.5, ra = t * 0.3, mx = Math.cos(ra) * 0.5, my = Math.sin(ra) * 0.5;
    for (i = 0; i < n; i++){ var qch = pa[i] < B ? -1 : 1; x = px[i]; y = py[i]; var a1 = (x - mx) * (x - mx) + (y - my) * (y - my) + 0.01, a2 = (x + mx) * (x + mx) + (y + my) * (y + my) + 0.01, Bz = (0.22 / a1 - 0.22 / a2) * K * tight * qch, cs = Math.cos(Bz * dt), sn = Math.sin(Bz * dt), ux = vx[i] * cs - vy[i] * sn, uy = vx[i] * sn + vy[i] * cs, sl = Math.sqrt(ux * ux + uy * uy) + 1e-6;
      vx[i] = ux / sl * spd; vy[i] = uy / sl * spd; x += vx[i] * dt; y += vy[i] * dt; if (x > 1) x -= 2; else if (x < -1) x += 2; if (y > 1) y -= 2; else if (y < -1) y += 2; px[i] = x; py[i] = y;
      if (qch > 0) fxDot(x, y, 0.03, 0.07, 0.13); else fxDot(x, y, 0.13, 0.06, 0.025); }
  } else {                                                  // Flux: smoke carried on a swirling current
    var act = Math.floor(n * (0.3 + 0.7 * C)), fi = (0.05 + A * 0.3) * (1 + bass * 2) + F.kick * 0.25;
    for (i = 0; i < act; i++){ fxFlow(px[i] * 1.6, py[i] * 1.6, t * 0.5, fl); vx[i] += (fl[0] * fi - vx[i]) * Math.min(1, dt * 4); vy[i] += (fl[1] * fi - vy[i]) * Math.min(1, dt * 4); x = px[i] + vx[i] * dt; y = py[i] + vy[i] * dt;
      if (x > 1) x -= 2; else if (x < -1) x += 2; if (y > 1) y -= 2; else if (y < -1) y += 2; px[i] = x; py[i] = y; fxPal(Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]) * 1.5 + B + t * 0.02, F.cent, 0, c); fxDot(x, y, c[0] * 0.05, c[1] * 0.05, c[2] * 0.05); }
  }
}
function fxShow(){ var d = FX.img.data, b = FX.buf, sr = 0, sg = 0, sb = 0; for (var i = 0, o = 0; i < b.length; i += 3, o += 4){ var r = 1 - Math.exp(-b[i] * 1.8), g = 1 - Math.exp(-b[i + 1] * 1.8), bl = 1 - Math.exp(-b[i + 2] * 1.8); d[o] = r * 255; d[o + 1] = g * 255; d[o + 2] = bl * 255; sr += r; sg += g; sb += bl; }
  FX.ctx.putImageData(FX.img, 0, 0); FX.tex.needsUpdate = true; var n = 16384; FX.avg = [sr / n, sg / n, sb / n]; }

/* the unit: four pots, its own screen, four effect buttons and a freeze button */
var bzC = mk(BZW * 5, BZD * 5), bzTex = null, bzDispC = mk(512, 64), bzDispT = canvasTex(bzDispC); bzDispT.minFilter = THREE.LinearFilter; bzDispT.magFilter = THREE.LinearFilter;
function paintBZ(){
  var g = bzC.getContext('2d'); g.setTransform(5, 0, 0, 5, 0, 0);
  g.fillStyle = '#131518'; g.fillRect(0, 0, BZW, BZD);
  for (var i = 0; i < 1400; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '120,255,170') + ',' + rnd(.02, .05) + ')'; g.fillRect(Math.random() * BZW, Math.random() * BZD, .6, .3); }
  var GR = '#6BFFA8';
  function T(s, x, y, size, col, al){ g.font = 'bold ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || '#C8D2CC'; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  g.strokeStyle = GR; g.lineWidth = 0.6; g.strokeRect(4, 4, BZW - 8, BZD - 8);
  [[40, 44, 'A'], [100, 44, 'B'], [40, 104, 'C'], [100, 104, 'SPEED']].forEach(function(a){ g.strokeStyle = 'rgba(107,255,168,.5)'; g.lineWidth = 0.5; g.beginPath(); g.arc(a[0], a[1], 12.5, 0, 7); g.stroke(); T(a[2], a[0], a[1] + 20, 4.2, GR); });
  g.fillStyle = '#000'; g.fillRect(148, 12, 140, 76); g.strokeStyle = GR; g.lineWidth = 0.7; g.strokeRect(148, 12, 140, 76); T('PREVIEW', 218, 8, 2.8, GR);
  BZMODES.forEach(function(s, k){ T(s, 160 + (k % 5) * 29, 115 + Math.floor(k / 5) * 24, 2.4); });
  T('FREEZE', 218, 176, 3.4);
  T('FOSFORA', 12, 148, 9, GR, 'left'); T('music visualiser', 12, 157, 3.2, 'rgba(200,210,204,.8)', 'left'); T('effects after Fosfora by Kevin Raymond', 12, 163.5, 2.6, 'rgba(200,210,204,.65)', 'left'); T('SYNTH B', 12, 176, 4.4, '#FF4FD8', 'left');
  g.setTransform(1, 0, 0, 1, 0, 0); if (bzTex) bzTex.needsUpdate = true;
}
paintBZ(); bzTex = smoothTex(bzC);
(function(){
  var W2 = BZW * SC, D2 = BZD * SC;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:bzTex, emissive:0xffffff, emissiveMap:bzTex, emissiveIntensity:0.55, shininess:14, specular:0x0A140C })); top.rotation.x = -Math.PI / 2; BZG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.006, BZTH, D2 + 0.006), new THREE.MeshPhongMaterial({ color:0x0C0D0F, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -BZTH / 2 - 0.0015; BZG.add(body);
  standFor(BZY, BZG, W2, D2, BZTH, PFH, PFTILT, 0.24, true); devBody(BZY, 'bz'); BLOCKS.push(devBlock(PGPOS, 0.56)); vidBooth(PGPOS);
  var scr = new THREE.Mesh(new THREE.PlaneGeometry(64 * SC, 64 * SC), fxMat); scr.rotation.x = -Math.PI / 2; scr.position.set(bzx(218), 0.0014, bzz(43.5)); scr.userData.noShadow = true; scr.userData.dev = 'bz'; BZG.add(scr);      // the built-in screen: the same picture as the roof, always live while you lean over it
  var d = new THREE.Mesh(new THREE.PlaneGeometry(124 * SC, 15.5 * SC), new THREE.MeshBasicMaterial({ map:bzDispT })); d.rotation.x = -Math.PI / 2; d.position.set(bzx(218), 0.0014, bzz(83)); d.userData.noShadow = true; d.userData.dev = 'bz'; BZG.add(d);
})();
HOST = BZG; LX = bzx; LZ = bzz; DEV = 'bz';
[[40, 44], [100, 44], [40, 104], [100, 104]].forEach(function(a, i){ knob('bzk' + i, a[0], a[1], 8.4, 'Pot ' + BZKN[i][0], BZ.p[BZKN[i][1]], { h:13, sides:16, color:0x1A1C20, tick:0x6BFFA8 }).pk = BZKN[i][1]; });
FACE = { bg:'#2A2D33', fg:'#DDE6E0' };
BZMODES.forEach(function(nm, i){ button('bzm' + i, 160 + (i % 5) * 29, 103.5 + Math.floor(i / 5) * 24, 23, 15, String((i + 1) % 10), nm.charAt(0) + nm.slice(1).toLowerCase(), 0x6BFFA8).bm = i; });
button('bzfrz', 218, 160, 34, 20, '', 'Freeze the picture', 0xFFFFFF).frz = true;
FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };
vidSwitch(BZG, BZW * SC / 2 + 0.14, 0.0).forEach(function(c){ VIDSW.push(c); });
CTLIST.forEach(function(c){ if (c.dev === 'bz' && c.kind === 'knob') c.def = 0.5; });
HOST = TRG; LX = lx; LZ = lz; DEV = null;

function bzAudio(){ if (BZ.an) return true; if (!ac || !AU.ready) return false; BZ.an = ac.createAnalyser(); BZ.an.fftSize = 1024; BZ.an.smoothingTimeConstant = 0.6; BZ.an.minDecibels = -95; BZ.an.maxDecibels = -22; AU.master.connect(BZ.an); BZ.bins = new Uint8Array(512);
  var sp = ac.createChannelSplitter(2); AU.master.connect(sp); BZ.anL = ac.createAnalyser(); BZ.anR = ac.createAnalyser(); [BZ.anL, BZ.anR].forEach(function(a, k){ a.fftSize = 1024; a.smoothingTimeConstant = 0.5; a.minDecibels = -95; a.maxDecibels = -22; sp.connect(a, k); }); BZ.L = new Uint8Array(512); BZ.R = new Uint8Array(512); return true; }
function bzLabel(c){
  if (c.vs != null) return c.name + ' · click';
  if (c.bm != null) return c.name + (BZ.p.mode === c.bm ? ' · showing' : '') + ' · click';
  if (c.frz) return 'Freeze ' + (BZ.p.frz ? 'on' : 'off') + ' · click';
  var i = ['a', 'b', 'c'].indexOf(c.pk); return (i >= 0 ? BZMODES[BZ.p.mode].charAt(0) + BZMODES[BZ.p.mode].slice(1).toLowerCase() + ' ' + BZPN[BZ.p.mode][i] : 'Speed') + ' ' + Math.round(c.v * 100) + ' · scroll or drag';
}
function bzPress(c){
  if (c.vs != null){ vidSet(c.vs); return; }
  if (c.bm != null){ BZ.p.mode = c.bm; toast('Synth B: ' + c.name); } else if (c.frz){ BZ.p.frz = BZ.p.frz ? 0 : 1; toast(BZ.p.frz ? 'Picture frozen' : 'Picture running'); }
  BZ.dirty = true; bzSaveSoon();
}
function bzCtl(c){ BZ.p[c.pk] = c.v; BZ.dirty = true; bzSaveSoon(); }
DEVH.bz = { label:bzLabel, press:bzPress, release:NOP, ctl:bzCtl, turn:NOP };
function bzPaintDisp(){
  var g = bzDispC.getContext('2d'), P = BZPN[BZ.p.mode]; g.fillStyle = '#020403'; g.fillRect(0, 0, 512, 64); g.textBaseline = 'middle'; g.textAlign = 'left';
  g.font = 'bold 30px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = '#6BFFA8'; g.fillText((BZ.p.mode + 1) + ' ' + BZMODES[BZ.p.mode] + (BZ.p.frz ? ' ❚❚' : ''), 10, 22);
  g.textAlign = 'right'; g.fillStyle = VID.src === 2 ? '#FF4FD8' : '#5E6A64'; g.fillText(VID.src === 2 ? 'ON ROOF' : 'preview only', 502, 22);
  g.textAlign = 'left'; g.font = 'bold 20px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = '#9FB3A8'; g.fillText('A ' + P[0] + '   B ' + P[1] + '   C ' + P[2], 10, 50);
  bzDispT.needsUpdate = true;
}
var BZBANDS = [[0, 2], [2, 6], [6, 11], [11, 43], [43, 85], [85, 128], [128, 420]], BZF = { band:BZ.band, L:null, R:null };
function bzUpdate(now, dt){
  vidSwitchTick();
  if (BZ.src !== VID.src){ BZ.src = VID.src; BZ.dirty = true; }
  if (BZ.dirty){ BZ.dirty = false; bzPaintDisp(); }
  BZMODES.forEach(function(nm, i){ var c = CT['bzm' + i], L = BZ.p.mode === i ? 1 : 0.1; if (c.down) L = Math.max(L, 0.8); if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
  var f = CT.bzfrz, fl = BZ.p.frz ? 1 : 0.1; if (f.down) fl = Math.max(fl, 0.8); if (fl !== f.lit){ f.lit = fl; f.paintLit(); } var fy = f.y0 - (f.down ? 0.003 : 0); if (f.m.position.y !== fy) f.m.position.y = fy;
  var onRoof = VID.src === 2, near = mode === 'tr' && LEAN.key === 'bz'; if (!onRoof && !near) return;          // off the roof and nobody at it: it costs nothing
  if (FX.mode !== BZ.p.mode) fxInit(BZ.p.mode);
  if (!BZ.p.frz){
    var sdt = Math.min(dt, 0.05) * (0.25 + BZ.p.d * BZ.p.d * 3); BZ.t += sdt;
    if (M.playing){ BZ.ph += dt * M.bpm / 60; if (BZ.ph >= 1){ BZ.ph -= Math.floor(BZ.ph); BZ.beats = (BZ.beats || 0) + 1; } }
    if (bzAudio()){
      BZ.an.getByteFrequencyData(BZ.bins); var sum = 0, wsum = 0, k, i;
      for (k = 0; k < 7; k++){ var a = 0, r = BZBANDS[k]; for (i = r[0]; i < r[1]; i++) a += BZ.bins[i]; a = Math.min(1, a / (r[1] - r[0]) / 255 * (1.2 + k * 0.25)); a *= a; BZ.band[k] += (a - BZ.band[k]) * (a > BZ.band[k] ? 0.6 : 0.12); }
      for (i = 1; i < 300; i++){ var v = BZ.bins[i] / 255; sum += v; wsum += v * i; }
      BZ.rms = Math.min(1, sum / 300 * 2.4); BZ.cent += ((sum > 0.5 ? clamp(wsum / sum / 110, 0, 1) : 0.4) - BZ.cent) * 0.05;
      if (BZ.p.mode === 5){ BZ.anL.getByteFrequencyData(BZ.L); BZ.anR.getByteFrequencyData(BZ.R); BZF.L = BZ.L; BZF.R = BZ.R; }
    }
    var kick = clamp(SEQ.kick || 0, 0, 1), sn = clamp(SEQ.snare || 0, 0, 1), F = BZF;
    F.A = BZ.p.a; F.B = BZ.p.b; F.C = BZ.p.c; F.t = BZ.t; F.ph = BZ.ph; F.bar = Math.floor((BZ.beats || 0) / 4); F.rms = BZ.rms; F.cent = BZ.cent; F.kick = kick; F.onset = sn; F.drum = Math.max(kick, sn);
    F.kickNow = kick > 0.8 && !(BZ.kPrev > 0.8); F.snareNow = sn > 0.5 && !(BZ.sPrev > 0.5); BZ.kPrev = kick; BZ.sPrev = sn;
    fxStep(sdt, F); fxShow();
  }
  if (onRoof && FX.avg){ var glow = FLOWS[0].glow, mx = Math.max(FX.avg[0], FX.avg[1], FX.avg[2], 0.001); glow.color.setRGB(FX.avg[0] / mx, FX.avg[1] / mx, FX.avg[2] / mx); glow.intensity = lerp(glow.intensity, Math.min(1.2, mx * 4), 1 - Math.exp(-dt * 6)); }
}
RESTORE['jambutek-studio-bz-v1'] = function(){ bzRestore(); CTLIST.forEach(function(c){ if (c.dev === 'bz' && c.kind === 'knob'){ c.v = BZ.p[c.pk]; c.show(); } }); }; SAVENOW.push(bzSaveNow);
RESTORE['jambutek-studio-video-v1'] = function(){ try { var s = JSON.parse(store('jambutek-studio-video-v1') || 'null'); if (s && s.v === 1) vidSet(s.src | 0, true); } catch (e) {} };
/* The roof comes up as it was left, or as the starter jam has it for a first visit. Until v1.59 every load wrote "off" here, so that
   leftover is dropped once; otherwise nobody who had visited before would ever see the starter's visuals. */
try { if (!localStorage.getItem('jambutek-studio-roof-v2')){ localStorage.removeItem('jambutek-studio-video-v1'); localStorage.setItem('jambutek-studio-roof-v2', '1'); } } catch (e) {}
RESTORE['jambutek-studio-video-v1']();
vidApply();
