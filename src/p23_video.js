
/* ================= video synth B: an audio-reactive shader synth, after bzzzbz =================
   bzzzbz (github.com/dvr0/bzzzbz, by Davide Rovelli, Peter Nagy and Marcell Illyes, GPL-3.0) is a Raspberry Pi video synth: fragment
   shaders driven by the audio's spectrum and three pots. The four pictures here are ports of its own shaders (cells, wavepatterns,
   spectrum, creation), see vendor/BZZZBZ-NOTICE.md. Changes from the originals: screen position comes in as a texture coordinate, the
   spectrum arrives as a texture instead of a 513-float array, the picture is snapped to the roof's 128 x 64 LED grid, and a fourth
   pot sets the speed. It listens to the room's master output. */
var BZW = 300, BZD = 190, BZTH = 0.045;
function bzx(u){ return (u - BZW / 2) * SC; }
function bzz(u){ return (u - BZD / 2) * SC; }
var BZY = new THREE.Group(); BZY.position.set(PGPOS.x, PFH, PGPOS.z); BZY.rotation.y = PGPOS.r; scene.add(BZY);
var BZG = new THREE.Group(); BZG.rotation.x = PFTILT; BZY.add(BZG);
var BZ = { p:{ a:0.9, b:0.7, c:0.6, d:0.5, mode:0, frz:0 }, t:0, an:null, bins:null, dirty:true };
var BZMODES = ['CELLS', 'WAVE PATTERNS', 'SPECTRUM', 'CREATION'], BZKN = [['A', 'a'], ['B', 'b'], ['C', 'c'], ['SPEED', 'd']];
function bzRestore(){ try { var s = JSON.parse(store('jambutek-studio-bz-v1') || 'null'); if (s && s.v === 1 && s.p){ ['a', 'b', 'c', 'd'].forEach(function(k){ if (typeof s.p[k] === 'number') BZ.p[k] = clamp(s.p[k], 0, 1); }); BZ.p.mode = clamp(s.p.mode | 0, 0, 3); BZ.p.frz = s.p.frz ? 1 : 0; } } catch (e) {} BZ.dirty = true; } bzRestore();
var bzSaveT = null; function bzSaveNow(){ store('jambutek-studio-bz-v1', JSON.stringify({ v:1, p:BZ.p })); } function bzSaveSoon(){ clearTimeout(bzSaveT); bzSaveT = setTimeout(bzSaveNow, saveMs(800)); }

/* the picture */
var bzFftData = new Uint8Array(512), bzFftTex = new THREE.DataTexture(bzFftData, 512, 1, THREE.LuminanceFormat); bzFftTex.minFilter = bzFftTex.magFilter = THREE.NearestFilter; bzFftTex.needsUpdate = true;
var bzMat = new THREE.ShaderMaterial({
  uniforms:{ A:{ value:0.9 }, B:{ value:0.7 }, C:{ value:0.6 }, time:{ value:0 }, mode:{ value:0 }, fft:{ value:bzFftTex }, env:{ value:[0, 0, 0, 0, 0] }, grid:{ value:new THREE.Vector2(128, 64) } },
  vertexShader:'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader:[
    'precision highp float; varying vec2 vUv; uniform float A; uniform float B; uniform float C; uniform float time; uniform int mode; uniform sampler2D fft; uniform float env[5]; uniform vec2 grid;',
    'const float pi = 3.1415926;',
    'vec3 cells(float X0, float Y0){',                                   // cells.glsl, Peter Nagy
    '  float X = X0 - 0.42, Y = Y0 + 0.2; float A_mod = 175.0 + 25.0 * (4.0 * A - 2.0); float C_fall = 1.0 - 0.999 * C; float EXPONENT = pow(B, 0.8);',
    '  float color = 0.0, var = 0.0, m_dist = 1.0; vec2 point[5]; point[0] = vec2(0.0, 0.2); point[1] = vec2(0.8, 0.4); point[2] = vec2(0.5, 0.8); point[3] = vec2(1.0, 1.0); point[4] = vec2(0.1, 1.0);',
    '  float env16 = env[0], env12 = env[1], env1 = env[2], env3 = env[3], env01 = env[4];',
    '  for (int i = 0; i < 5; i++){ float dist = distance(vec2(X, Y), point[i]); m_dist = min(m_dist, dist); }',
    '  color += sin(m_dist * X * (exp(C) * 20.0 - 19.0 * env3) * (cos((A_mod - env12 + pi * A_mod) / (60.0 * C_fall))) + sin(A_mod + env12));',
    '  var += 0.3 * sin(tan(env1 + m_dist * Y * X * pow(A_mod + 2.0 * env1, EXPONENT * 2.0)));',
    '  float s = var + color; float d1 = abs(s) < 0.0005 ? 0.0005 : s; float s2 = s + env01; float d2 = abs(s2) < 0.0005 ? 0.0005 : s2;',
    '  return vec3(0.0, 0.72 * (0.8 * s + 0.2 * color / d2), 1.0 * (0.8 * s2 + 0.2 * color / d2));',
    '}',
    'vec3 waves(float X, float Y){',                                      // wavepatterns.glsl, Marcell Illyes
    '  const float THICK = 0.0015; const float RES = 100.0; const float FREQ = 5.0; float color = 0.0;',
    '  if (mod((1.5 * A) * cos((0.2 * time / 24.0) + Y * (FREQ + B * 0.2) * pi - 0.2 * pi) + (1.5 * A) * sin((0.2 * time / 16.0) + X * (FREQ + B * 0.3) * pi - 0.2 * pi), 1.0 / RES) <= THICK * (4.9 * C - 0.5)) color += 1.0;',
    '  return vec3(1.0 * color, 0.5 * Y * color + (0.2 * B * Y * color), 0.1 * color);',
    '}',
    'vec3 spectrum(float X, float Y){',                                   // spectrum.glsl, Marcell Illyes and Davide Rovelli
    '  const float n_of_bins = 340.0; float bin = floor(X * n_of_bins); float level = Y <= texture2D(fft, vec2((bin + 0.5) / 512.0, 0.5)).r ? 1.0 : 0.0; return vec3(level);',
    '}',
    'vec3 creation(float X, float Y){',                                   // creation.glsl, Danilo Guanabara, ported by Peter Nagy
    '  vec2 pos = vec2(X - 0.46, Y); vec2 u, p = pos; vec3 c = vec3(0.0); float l = 1.0, z = time;',
    '  for (int i = 0; i < 3; i++){ p = pos; u = p; p -= 0.5; p.x *= 2.0; l = max(length(p), 0.0001); z += 0.07; u += p / l * (sin(z) + 1.0) * abs(sin(l * 9.0 - z * 2.0)); float v = 0.01 / max(length(fract(u) - 0.5), 0.0001); if (i == 0) c.r = v; else if (i == 1) c.g = v; else c.b = v; }',
    '  return 4.0 * c / max(l, 0.05);',
    '}',
    'void main(){ vec2 q = (floor(vUv * grid) + 0.5) / grid; vec3 c = mode == 0 ? cells(q.x, q.y) : mode == 1 ? waves(q.x, q.y) : mode == 2 ? spectrum(q.x, q.y) : creation(q.x, q.y); gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }'
  ].join('\n')
});
VID.mats[2] = bzMat;

/* the unit: a green board with four pots, a small display, four small buttons and a big one */
var bzC = mk(BZW * 5, BZD * 5), bzTex = null, bzDispC = mk(512, 128), bzDispT = canvasTex(bzDispC); bzDispT.minFilter = THREE.LinearFilter; bzDispT.magFilter = THREE.LinearFilter;
function paintBZ(){
  var g = bzC.getContext('2d'); g.setTransform(5, 0, 0, 5, 0, 0);
  g.fillStyle = '#1B4A2C'; g.fillRect(0, 0, BZW, BZD);
  for (var i = 0; i < 1400; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '120,220,150') + ',' + rnd(.02, .06) + ')'; g.fillRect(Math.random() * BZW, Math.random() * BZD, .6, .3); }
  g.strokeStyle = 'rgba(12,44,24,.9)'; g.lineWidth = 0.9; [[66, 44, 150, 44, 150, 150], [66, 104, 126, 104, 126, 160], [34, 74, 116, 74, 116, 20], [150, 96, 286, 96], [160, 150, 160, 118, 276, 118]].forEach(function(p){ g.beginPath(); g.moveTo(p[0], p[1]); for (var k = 2; k < p.length; k += 2) g.lineTo(p[k], p[k + 1]); g.stroke(); });
  function T(s, x, y, size, col, al){ g.font = 'bold ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || '#E8EFE6'; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  [[4, 4], [BZW - 4, 4], [4, BZD - 4], [BZW - 4, BZD - 4]].forEach(function(p){ g.fillStyle = '#C9B56A'; g.beginPath(); g.arc(p[0], p[1], 2.6, 0, 7); g.fill(); g.fillStyle = '#0B0C0E'; g.beginPath(); g.arc(p[0], p[1], 1.4, 0, 7); g.fill(); });
  [[40, 44, 'A'], [100, 44, 'B'], [40, 104, 'C'], [100, 104, 'SPEED']].forEach(function(a){ g.fillStyle = '#C9B56A'; g.fillRect(a[0] - 11, a[1] - 11, 22, 22); T(a[2], a[0], a[1] + 21, 4.2); });
  g.strokeStyle = '#E8EFE6'; g.lineWidth = 0.4; g.strokeRect(150, 14, 136, 62); g.fillStyle = '#040605'; g.fillRect(166, 22, 104, 30); T('128 x 32', 218, 62, 3, 'rgba(232,239,230,.7)');
  [['1', 162, 'CELLS'], ['2', 200, 'WAVES'], ['3', 238, 'SPECTRUM'], ['F', 276, 'CREATION']].forEach(function(a){ T('BTN_' + a[0], a[1], 121, 3, 'rgba(232,239,230,.75)'); T(a[2], a[1], 126.5, 3.2); });
  T('FREEZE', 218, 177, 3.6);
  T('bzzzbz', 12, 150, 9, '#E8EFE6', 'left'); T('digital video synthesizer', 12, 158.5, 3.2, 'rgba(232,239,230,.8)', 'left'); T('D. Rovelli, P. Nagy, M. Illyes · GPL-3.0', 12, 164.5, 2.6, 'rgba(232,239,230,.65)', 'left'); T('SYNTH B', 12, 176, 4.4, '#FF4FD8', 'left');
  g.setTransform(1, 0, 0, 1, 0, 0); if (bzTex) bzTex.needsUpdate = true;
}
paintBZ(); bzTex = smoothTex(bzC);
(function(){
  var W2 = BZW * SC, D2 = BZD * SC;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:bzTex, emissive:0xffffff, emissiveMap:bzTex, emissiveIntensity:0.55, shininess:14, specular:0x0A140C })); top.rotation.x = -Math.PI / 2; BZG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.006, BZTH, D2 + 0.006), new THREE.MeshPhongMaterial({ color:0x0E2A18, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -BZTH / 2 - 0.0015; BZG.add(body);
  standFor(BZY, BZG, W2, D2, BZTH, PFH, PFTILT, 0.24, true); devBody(BZY, 'bz'); BLOCKS.push(devBlock(PGPOS, 0.56)); vidBooth(PGPOS);
  var d = new THREE.Mesh(new THREE.PlaneGeometry(104 * SC, 30 * SC), new THREE.MeshBasicMaterial({ map:bzDispT })); d.rotation.x = -Math.PI / 2; d.position.set(bzx(218), 0.0012, bzz(37)); d.userData.noShadow = true; d.userData.dev = 'bz'; BZG.add(d);
  for (var j = 0; j < 3; j++){ var jack = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.022, 10), new THREE.MeshPhongMaterial({ color:0x101114 })); jack.rotation.x = Math.PI / 2; jack.position.set(bzx(186 + j * 32), 0.008, bzz(2)); BZG.add(jack); }
})();
HOST = BZG; LX = bzx; LZ = bzz; DEV = 'bz';
[[40, 44], [100, 44], [40, 104], [100, 104]].forEach(function(a, i){ knob('bzk' + i, a[0], a[1], 8.4, 'Pot ' + BZKN[i][0], BZ.p[BZKN[i][1]], { h:13, sides:16, color:0xC218B8 }).pk = BZKN[i][1]; });
FACE = { bg:'#B9BBB6', fg:'#0B0B0D' };
[162, 200, 238, 276].forEach(function(x, i){ button('bzm' + i, x, 106, 26, 20, ['1', '2', '3', 'F'][i], BZMODES[i].charAt(0) + BZMODES[i].slice(1).toLowerCase(), 0xFF4FD8).bm = i; });
button('bzfrz', 218, 156, 34, 30, '', 'Freeze the picture', 0xFFFFFF).frz = true;
FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };
vidSwitch(BZG, BZW * SC / 2 + 0.14, 0.0).forEach(function(c){ VIDSW.push(c); });
CTLIST.forEach(function(c){ if (c.dev === 'bz' && c.kind === 'knob') c.def = { a:0.9, b:0.7, c:0.6, d:0.5 }[c.pk]; });
HOST = TRG; LX = lx; LZ = lz; DEV = null;

function bzAudio(){ if (BZ.an) return true; if (!ac || !AU.ready) return false; BZ.an = ac.createAnalyser(); BZ.an.fftSize = 1024; BZ.an.smoothingTimeConstant = 0.6; BZ.an.minDecibels = -95; BZ.an.maxDecibels = -22; AU.master.connect(BZ.an); BZ.bins = new Uint8Array(512); return true; }
function bzLabel(c){
  if (c.vs != null) return c.name + ' · click';
  if (c.bm != null) return c.name + (BZ.p.mode === c.bm ? ' · showing' : '') + ' · click';
  if (c.frz) return 'Freeze ' + (BZ.p.frz ? 'on' : 'off') + ' · click';
  return c.name + ' ' + Math.round(c.v * 100) + ' · scroll or drag';
}
function bzPress(c){
  if (c.vs != null){ vidSet(c.vs); return; }
  if (c.bm != null){ BZ.p.mode = c.bm; toast('Synth B: ' + c.name); } else if (c.frz){ BZ.p.frz = BZ.p.frz ? 0 : 1; toast(BZ.p.frz ? 'Picture frozen' : 'Picture running'); }
  BZ.dirty = true; bzSaveSoon();
}
function bzCtl(c){ BZ.p[c.pk] = c.v; BZ.dirty = true; bzSaveSoon(); }
DEVH.bz = { label:bzLabel, press:bzPress, release:NOP, ctl:bzCtl, turn:NOP };
function bzPaintDisp(){
  var g = bzDispC.getContext('2d'); g.fillStyle = '#020403'; g.fillRect(0, 0, 512, 128); g.textBaseline = 'middle'; g.textAlign = 'left';
  g.font = 'bold 44px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = VID.src === 2 ? '#9CFFC0' : '#4E7A5E'; g.fillText((BZ.p.mode + 1) + ' ' + BZMODES[BZ.p.mode] + (BZ.p.frz ? '  ❚❚' : ''), 12, 38);
  g.font = 'bold 30px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = '#6FD49A'; g.fillText('A ' + Math.round(BZ.p.a * 99) + '  B ' + Math.round(BZ.p.b * 99) + '  C ' + Math.round(BZ.p.c * 99) + (VID.src === 2 ? '' : '   not on roof'), 12, 96);
  bzDispT.needsUpdate = true;
}
var BZGLOW = [[0.1, 0.55, 1.0], [1.0, 0.45, 0.1], [0.8, 0.8, 0.8], [0.8, 0.6, 1.0]];
function bzUpdate(now, dt){
  vidSwitchTick();
  if (BZ.src !== VID.src){ BZ.src = VID.src; BZ.dirty = true; }
  if (BZ.dirty){ BZ.dirty = false; bzPaintDisp(); }
  [0, 1, 2, 3].forEach(function(i){ var c = CT['bzm' + i], L = BZ.p.mode === i ? 1 : 0.1; if (c.down) L = Math.max(L, 0.8); if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
  var f = CT.bzfrz, fl = BZ.p.frz ? 1 : 0.1; if (f.down) fl = Math.max(fl, 0.8); if (fl !== f.lit){ f.lit = fl; f.paintLit(); } var fy = f.y0 - (f.down ? 0.003 : 0); if (f.m.position.y !== fy) f.m.position.y = fy;
  if (VID.src !== 2) return;                                             // off the roof it costs nothing
  var u = bzMat.uniforms, glow = FLOWS[0].glow, lvl = 0.25;
  if (!BZ.p.frz){
    BZ.t += dt * (0.1 + BZ.p.d * BZ.p.d * 3.6);
    if (bzAudio()){
      BZ.an.getByteFrequencyData(BZ.bins); var e = u.env.value, s = 0;
      for (var i = 0; i < 512; i++){ var v = BZ.bins[i] / 255; bzFftData[i] = BZ.bins[i]; if (i < 48) s += v * v; }
      bzFftTex.needsUpdate = true; [1, 4, 8, 16, 48].forEach(function(b, k){ var q = bzFftData[b] / 255; e[k] = q * q; }); lvl = clamp(0.2 + s / 48 * 1.6, 0.2, 1);
    }
    u.time.value = BZ.p.mode === 1 ? BZ.t * 60 : BZ.t;                   // wavepatterns counts frames, creation counts seconds
  }
  u.A.value = BZ.p.a; u.B.value = BZ.p.b; u.C.value = BZ.p.c; u.mode.value = BZ.p.mode;
  var gc = BZGLOW[BZ.p.mode]; glow.color.setRGB(gc[0], gc[1], gc[2]); glow.intensity = lerp(glow.intensity, 0.9 * lvl, 1 - Math.exp(-dt * 6));
}
RESTORE['jambutek-studio-bz-v1'] = function(){ bzRestore(); CTLIST.forEach(function(c){ if (c.dev === 'bz' && c.kind === 'knob'){ c.v = BZ.p[c.pk]; c.show(); } }); }; SAVENOW.push(bzSaveNow);
RESTORE['jambutek-studio-video-v1'] = function(){ try { var s = JSON.parse(store('jambutek-studio-video-v1') || 'null'); if (s && s.v === 1) vidSet(s.src | 0, true); } catch (e) {} };
try { localStorage.setItem('jambutek-studio-video-v1', JSON.stringify({ v:1, src:0 })); } catch (e) {}       // the roof is always dark when the room loads
vidApply();
