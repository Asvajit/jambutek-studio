
/* ================= video synth B: an audio-reactive visualiser, after Fosfora =================
   Fosfora (github.com/kevinraymond/fosfora, (c) 2025-2026 Kevin Raymond, MIT OR Apache-2.0) is a music visualiser with dozens of
   effects driven by the spectrum and the beat. The four pictures here are ports of four of its single-pass effects (Aurora, Drift,
   Pulse, Prism), see vendor/FOSFORA-NOTICE.md. Changes: WGSL rewritten as GLSL, the frame-feedback trails left out, a float hash in
   place of the integer one, fewer noise octaves, and the picture snapped to the roof's 128 x 64 LED grid. It listens to the room's
   master output, and the kick and snare of the drum machine stand in for Fosfora's beat detector. The unit has its own small screen,
   live whenever you lean over it, so a picture can be shaped before it goes on the roof. */
var BZW = 300, BZD = 190, BZTH = 0.045;
function bzx(u){ return (u - BZW / 2) * SC; }
function bzz(u){ return (u - BZD / 2) * SC; }
var BZY = new THREE.Group(); BZY.position.set(PGPOS.x, PFH, PGPOS.z); BZY.rotation.y = PGPOS.r; scene.add(BZY);
var BZG = new THREE.Group(); BZG.rotation.x = PFTILT; BZY.add(BZG);
var BZ = { p:{ a:0.5, b:0.5, c:0.5, d:0.5, mode:0, frz:0 }, t:0, ph:0, an:null, bins:null, dirty:true, band:[0, 0, 0, 0, 0, 0, 0], rms:0, cent:0.4 };
var BZMODES = ['AURORA', 'DRIFT', 'PULSE', 'PRISM'], BZKN = [['A', 'a'], ['B', 'b'], ['C', 'c'], ['SPEED', 'd']],
    BZPN = [['spread', 'glow', 'shimmer'], ['warp', 'density', 'colour'], ['rings', 'reach', 'width'], ['folds', 'zoom', 'detail']];
function bzRestore(){ try { var s = JSON.parse(store('jambutek-studio-bz-v1') || 'null'); if (s && s.v === 1 && s.p){ ['a', 'b', 'c', 'd'].forEach(function(k){ if (typeof s.p[k] === 'number') BZ.p[k] = clamp(s.p[k], 0, 1); }); BZ.p.mode = clamp(s.p.mode | 0, 0, 3); BZ.p.frz = s.p.frz ? 1 : 0; } } catch (e) {} BZ.dirty = true; } bzRestore();
var bzSaveT = null; function bzSaveNow(){ store('jambutek-studio-bz-v1', JSON.stringify({ v:1, p:BZ.p })); } function bzSaveSoon(){ clearTimeout(bzSaveT); bzSaveT = setTimeout(bzSaveNow, saveMs(800)); }


/* the picture */
var bzMat = new THREE.ShaderMaterial({
  uniforms:{ A:{ value:0.5 }, B:{ value:0.5 }, C:{ value:0.5 }, time:{ value:0 }, mode:{ value:0 }, band:{ value:[0, 0, 0, 0, 0, 0, 0] }, rms:{ value:0 }, onset:{ value:0 }, kick:{ value:0 }, phase:{ value:0 }, cent:{ value:0.4 }, grid:{ value:new THREE.Vector2(128, 64) } },
  vertexShader:'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader:[
    'precision highp float; varying vec2 vUv; uniform float A; uniform float B; uniform float C; uniform float time; uniform int mode; uniform float band[7]; uniform float rms; uniform float onset; uniform float kick; uniform float phase; uniform float cent; uniform vec2 grid;',
    'vec2 grad2(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); float a = fract((p3.x + p3.y) * p3.z) * 6.2831853; return vec2(cos(a), sin(a)); }',
    'float noise2(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);',
    '  float va = dot(grad2(i), f), vb = dot(grad2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), vc = dot(grad2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), vd = dot(grad2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));',
    '  return mix(mix(va, vb, u.x), mix(vc, vd, u.x), u.y) * 0.5 + 0.5; }',
    'float fbm2(vec2 p, float gain){ float val = 0.0, amp = 0.5, freq = 1.0; for (int i = 0; i < 3; i++){ val += amp * noise2(p * freq); freq *= 2.0; amp *= gain; } return val * 1.14; }',
    'vec3 apal(float t, float cn, float ph){',                                                    // lib/palette.wgsl: warm at a low spectral centroid, cool at a high one
    '  vec3 a = mix(vec3(0.5, 0.3, 0.2), vec3(0.3, 0.4, 0.6), cn), b = mix(vec3(0.5, 0.3, 0.2), vec3(0.4, 0.3, 0.4), cn), c = mix(vec3(1.0, 0.7, 0.4), vec3(1.0, 1.0, 1.2), cn), d = mix(vec3(0.0, 0.15, 0.2), vec3(0.0, 0.33, 0.67), cn);',
    '  return a + b * cos(6.28318 * (c * t + d + ph)); }',
    'vec3 bandCol(int i){ return i == 0 ? vec3(0.8, 0.1, 0.2) : i == 1 ? vec3(1.0, 0.4, 0.1) : i == 2 ? vec3(1.0, 0.8, 0.2) : i == 3 ? vec3(0.2, 1.0, 0.3) : i == 4 ? vec3(0.1, 0.7, 1.0) : i == 5 ? vec3(0.3, 0.3, 1.0) : vec3(0.7, 0.2, 1.0); }',
    'vec3 aurora(vec2 p){',                                                                       // aurora.wgsl: seven curtains, one per frequency band
    '  float travel = time * 2.0, spread = A * 1.5 + 0.5, gw = B * 0.04 + 0.008; vec3 col = vec3(0.0);',
    '  for (int i = 0; i < 7; i++){ float fi = float(i), bv = band[i], by = (fi - 3.0) / 7.0 * spread, wf = 2.0 + fi * 0.5, wp = travel * (0.8 + fi * 0.1);',
    '    float wave = sin(p.x * wf + wp) * 0.05 + sin(p.x * wf * 2.3 + wp * 0.7) * 0.03, ripple = (noise2(vec2(p.x * 3.0 + wp * 0.5, fi * 2.0 + time * 0.1)) - 0.5) * 0.08;',
    '    float dy = p.y - by - wave - ripple, w = gw * (1.0 + bv * 1.5); col += bandCol(i) * (0.12 + bv * (1.5 + rms * 0.5)) * exp(-dy * dy / (w * w)); }',
    '  col += vec3(noise2(vec2(p.x * 10.0 + time, p.y * 30.0)) * 0.1 * C * band[5]); col *= 1.0 + onset * 0.8; col *= 1.0 + sin(phase * 6.28318) * 0.1; return col; }',
    'vec3 drift(vec2 p){',                                                                        // drift.wgsl: smoke from domain-warped noise
    '  float wi = A * 2.0 + 0.5, dens = B * 1.5 + 0.5, bw = (band[0] + band[1]) * 0.5 * wi, ft = time * 0.9;',
    '  vec2 q = vec2(fbm2(p * 2.0 + vec2(0.0, ft * 0.3), 0.5), fbm2(p * 2.0 + vec2(5.2, ft * 0.4 + 1.3), 0.5));',
    '  vec2 r = vec2(fbm2((p + q * (1.0 + bw)) * 2.0 + vec2(1.7, ft * 0.2 + 9.2), 0.5), fbm2((p + q * (1.0 + bw)) * 2.0 + vec2(8.3, ft * 0.25 + 2.8), 0.5));',
    '  float f = fbm2((p + r * (1.5 + bw * 0.5)) * dens * 1.5, 0.5); vec3 col = apal(f * 2.0 + time * 0.05, cent, C * 0.5); return col * f * f * 2.6 * (0.7 + rms * 0.8 + kick * 0.3); }',
    'vec3 pulse(vec2 p){',                                                                        // pulse.wgsl: rings leaving the centre on the beat
    '  float count = floor(A * 6.0 + 2.0), maxR = B * 1.5 + 0.5, rw = (C * 0.03 + 0.012) * (1.0 + band[1] * 1.5), r = length(p), sum = 0.0;',
    '  for (int i = 0; i < 8; i++){ if (float(i) >= count) break; float rp = fract(phase + float(i) / count), d = abs(r - rp * maxR); sum += exp(-(d * d) / (rw * rw)) * (1.0 - rp) * (1.0 - rp); }',
    '  float kd = abs(r - kick * 0.6); sum += exp(-(kd * kd) / 0.002) * kick * 1.5; float od = abs(r - onset * 0.9); sum += exp(-(od * od) / 0.0008) * onset; sum = min(sum, 2.0);',
    '  vec3 col = apal(r * 2.0 + time * 0.08 + phase * 0.5, cent, 0.0) * sum * 0.9; col += apal(time * 0.1, cent, 0.2) * exp(-r * r * 80.0) * kick * 2.0; return col; }',
    'vec3 prism(vec2 p){',                                                                        // prism.wgsl: a kaleidoscope over noise and rings
    '  float folds = floor(A * 10.0 + 3.0), zoom = B * 3.0 + 1.0, cx = C * 4.0 + 2.0, rot = time * 0.5 + phase * 6.28318 * 0.25, ca = cos(rot), sa = sin(rot);',
    '  vec2 q = vec2(p.x * ca - p.y * sa, p.x * sa + p.y * ca); float ang = 6.28318 / folds, a = mod(atan(q.y, q.x), ang); if (a > ang * 0.5) a = ang - a; vec2 zp = vec2(cos(a), sin(a)) * length(q) * zoom * (1.0 + band[1] * 0.3);',
    '  float fv = fbm2(zp * (cx + band[3] * 2.0) + vec2(time * 0.1, 0.0), 0.55), hr = length(zp), ha = atan(zp.y, zp.x), pat = fv * 0.7 + abs(sin(hr * 6.0 - time * 0.5)) * abs(sin(ha * 3.0 + time * 0.3)) * 0.3;',
    '  vec3 col = apal(pat * 2.0 + time * 0.05 + hr * 0.3, cent, 0.0) * pat * 1.5; col += vec3(pow(noise2(zp * 20.0 + vec2(time * 2.0, time * 1.7)), 8.0) * band[5] * 3.0);',
    '  col += apal(time * 0.2, cent, 0.3) * exp(-abs(hr - 0.5 - band[1] * 0.3) * 10.0) * band[1] * 0.5; col += vec3(exp(-hr * hr * 8.0) * kick * 1.2); return col; }',
    'void main(){ vec2 q = (floor(vUv * grid) + 0.5) / grid, p = (q - 0.5) * vec2(2.0, 1.0); vec3 c = mode == 0 ? aurora(p) : mode == 1 ? drift(p) : mode == 2 ? pulse(p) : prism(p); gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }'
  ].join('\n')
});
VID.mats[2] = bzMat;

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
  ['AURORA', 'DRIFT', 'PULSE', 'PRISM'].forEach(function(s, k){ T(s, 162 + k * 38, 126, 3.2); });
  T('FREEZE', 218, 177, 3.6);
  T('FOSFORA', 12, 148, 9, GR, 'left'); T('music visualiser', 12, 157, 3.2, 'rgba(200,210,204,.8)', 'left'); T('effects after Fosfora by Kevin Raymond', 12, 163.5, 2.6, 'rgba(200,210,204,.65)', 'left'); T('SYNTH B', 12, 176, 4.4, '#FF4FD8', 'left');
  g.setTransform(1, 0, 0, 1, 0, 0); if (bzTex) bzTex.needsUpdate = true;
}
paintBZ(); bzTex = smoothTex(bzC);
(function(){
  var W2 = BZW * SC, D2 = BZD * SC;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:bzTex, emissive:0xffffff, emissiveMap:bzTex, emissiveIntensity:0.55, shininess:14, specular:0x0A140C })); top.rotation.x = -Math.PI / 2; BZG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.006, BZTH, D2 + 0.006), new THREE.MeshPhongMaterial({ color:0x0C0D0F, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -BZTH / 2 - 0.0015; BZG.add(body);
  standFor(BZY, BZG, W2, D2, BZTH, PFH, PFTILT, 0.24, true); devBody(BZY, 'bz'); BLOCKS.push(devBlock(PGPOS, 0.56)); vidBooth(PGPOS);
  var scr = new THREE.Mesh(new THREE.PlaneGeometry(124 * SC, 62 * SC), bzMat); scr.rotation.x = -Math.PI / 2; scr.position.set(bzx(218), 0.0014, bzz(44)); scr.userData.noShadow = true; scr.userData.dev = 'bz'; BZG.add(scr);      // the built-in screen: the same picture as the roof, always live while you lean over it
  var d = new THREE.Mesh(new THREE.PlaneGeometry(124 * SC, 15.5 * SC), new THREE.MeshBasicMaterial({ map:bzDispT })); d.rotation.x = -Math.PI / 2; d.position.set(bzx(218), 0.0014, bzz(83)); d.userData.noShadow = true; d.userData.dev = 'bz'; BZG.add(d);
})();
HOST = BZG; LX = bzx; LZ = bzz; DEV = 'bz';
[[40, 44], [100, 44], [40, 104], [100, 104]].forEach(function(a, i){ knob('bzk' + i, a[0], a[1], 8.4, 'Pot ' + BZKN[i][0], BZ.p[BZKN[i][1]], { h:13, sides:16, color:0x1A1C20, tick:0x6BFFA8 }).pk = BZKN[i][1]; });
FACE = { bg:'#2A2D33', fg:'#DDE6E0' };
[162, 200, 238, 276].forEach(function(x, i){ button('bzm' + i, x, 109, 26, 18, String(i + 1), BZMODES[i].charAt(0) + BZMODES[i].slice(1).toLowerCase(), 0x6BFFA8).bm = i; });
button('bzfrz', 218, 156, 34, 26, '', 'Freeze the picture', 0xFFFFFF).frz = true;
FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };
vidSwitch(BZG, BZW * SC / 2 + 0.14, 0.0).forEach(function(c){ VIDSW.push(c); });
CTLIST.forEach(function(c){ if (c.dev === 'bz' && c.kind === 'knob') c.def = 0.5; });
HOST = TRG; LX = lx; LZ = lz; DEV = null;

function bzAudio(){ if (BZ.an) return true; if (!ac || !AU.ready) return false; BZ.an = ac.createAnalyser(); BZ.an.fftSize = 1024; BZ.an.smoothingTimeConstant = 0.6; BZ.an.minDecibels = -95; BZ.an.maxDecibels = -22; AU.master.connect(BZ.an); BZ.bins = new Uint8Array(512); return true; }
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
var BZGLOW = [[0.3, 0.9, 0.5], [1.0, 0.55, 0.25], [0.5, 0.6, 1.0], [0.9, 0.5, 1.0]], BZBANDS = [[0, 2], [2, 6], [6, 11], [11, 43], [43, 85], [85, 128], [128, 420]];
function bzUpdate(now, dt){
  vidSwitchTick();
  if (BZ.src !== VID.src){ BZ.src = VID.src; BZ.dirty = true; }
  if (BZ.dirty){ BZ.dirty = false; bzPaintDisp(); }
  [0, 1, 2, 3].forEach(function(i){ var c = CT['bzm' + i], L = BZ.p.mode === i ? 1 : 0.1; if (c.down) L = Math.max(L, 0.8); if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
  var f = CT.bzfrz, fl = BZ.p.frz ? 1 : 0.1; if (f.down) fl = Math.max(fl, 0.8); if (fl !== f.lit){ f.lit = fl; f.paintLit(); } var fy = f.y0 - (f.down ? 0.003 : 0); if (f.m.position.y !== fy) f.m.position.y = fy;
  var onRoof = VID.src === 2, near = mode === 'tr' && LEAN.key === 'bz'; if (!onRoof && !near) return;          // off the roof and nobody at it: it costs nothing
  var u = bzMat.uniforms, glow = FLOWS[0].glow;
  if (!BZ.p.frz){
    BZ.t += dt * (0.08 + BZ.p.d * BZ.p.d * 2.2); if (M.playing) BZ.ph = (BZ.ph + dt * M.bpm / 60) % 1;
    if (bzAudio()){
      BZ.an.getByteFrequencyData(BZ.bins); var sum = 0, wsum = 0, k, i;
      for (k = 0; k < 7; k++){ var a = 0, r = BZBANDS[k]; for (i = r[0]; i < r[1]; i++) a += BZ.bins[i]; a = Math.min(1, a / (r[1] - r[0]) / 255 * (1.2 + k * 0.25)); a *= a; BZ.band[k] += (a - BZ.band[k]) * (a > BZ.band[k] ? 0.6 : 0.12); }
      for (i = 1; i < 300; i++){ var v = BZ.bins[i] / 255; sum += v; wsum += v * i; }
      BZ.rms = Math.min(1, sum / 300 * 2.4); BZ.cent += ((sum > 0.5 ? clamp(wsum / sum / 110, 0, 1) : 0.4) - BZ.cent) * 0.05;
    }
    u.time.value = BZ.t; u.phase.value = BZ.ph; u.band.value = BZ.band; u.rms.value = BZ.rms; u.cent.value = BZ.cent; u.kick.value = clamp(SEQ.kick || 0, 0, 1); u.onset.value = clamp(SEQ.snare || 0, 0, 1);
  }
  u.A.value = BZ.p.a; u.B.value = BZ.p.b; u.C.value = BZ.p.c; u.mode.value = BZ.p.mode;
  if (onRoof){ var gc = BZGLOW[BZ.p.mode]; glow.color.setRGB(gc[0], gc[1], gc[2]); glow.intensity = lerp(glow.intensity, 0.3 + 0.7 * BZ.rms, 1 - Math.exp(-dt * 6)); }
}
RESTORE['jambutek-studio-bz-v1'] = function(){ bzRestore(); CTLIST.forEach(function(c){ if (c.dev === 'bz' && c.kind === 'knob'){ c.v = BZ.p[c.pk]; c.show(); } }); }; SAVENOW.push(bzSaveNow);
RESTORE['jambutek-studio-video-v1'] = function(){ try { var s = JSON.parse(store('jambutek-studio-video-v1') || 'null'); if (s && s.v === 1) vidSet(s.src | 0, true); } catch (e) {} };
try { localStorage.setItem('jambutek-studio-video-v1', JSON.stringify({ v:1, src:0 })); } catch (e) {}       // the roof is always dark when the room loads
vidApply();
