
/* ================= the Ambi: a 6-voice hybrid polysynth module, after Mutable Instruments' Ambika =================
   Eight pots edit the eight parameters on the two-line display; S1-S8 pick the page (press again for a page's second half).
   It has no keyboard: the Snake, its own arpeggiator / sequencer, the encoder (click = C4) or the computer keys play it. */
var AMW = 320, AMD = 170, AMH = 1.1, AMTILT = 0.56;
function ax(u){ return (u - AMW / 2) * SC; }
function az(u){ return (u - AMD / 2) * SC; }
var AMY = new THREE.Group(); AMY.position.set(AMPOS.x, AMH, AMPOS.z); scene.add(AMY);
var AMG = new THREE.Group(); AMG.rotation.x = AMTILT; AMY.add(AMG);
var AMWAVE = ['saw', 'square', 'triang', 'sine', 'pwm', 'pad', 'fm', '8bits', 'noise', 'vowel'], AMSUB = ['sq1', 'tr1', 'pl1', 'sq2', 'tr2', 'pl2', 'click', 'glitch', 'blow', 'metal', 'pop'], AMX = ['off', 'ring', 'xor', 'fold', 'bits'];
var AMSRC = ['env1', 'env2', 'env3', 'lfo1', 'lfo2', 'lfo3', 'velo', 'note'], AMDST = ['osc1+2', 'vibr', 'prm1', 'prm2', 'mix', 'freq', 'vca'], AMLW = ['tri', 'sqr', 's&h', 'ramp', 'sine'], AMGRID = [[4, '1/4'], [2, '1/8'], [1, '1/16'], [0.5, '1/32']];
function a127(v){ return String(Math.round(v * 127)); }
function abi(r){ return function(v){ var n = Math.round((v - 0.5) * 2 * r); return (n > 0 ? '+' : '') + n; }; }
// key: [LCD name, full name, default, steps (0 = smooth), value text (function or list of options)]
var AMP = {
  o1wave:['wave', 'Osc 1 waveform', 0, 9, AMWAVE], o1para:['para', 'Osc 1 parameter', 0, 0, a127], o1rang:['rang', 'Osc 1 range', 0.5, 48, abi(24)], o1tune:['tune', 'Osc 1 tune', 0.5, 0, abi(64)],
  o2wave:['wave', 'Osc 2 waveform', 1 / 9, 9, AMWAVE], o2para:['para', 'Osc 2 parameter', 0.25, 0, a127], o2rang:['rang', 'Osc 2 range', 0.25, 48, abi(24)], o2tune:['tune', 'Osc 2 tune', 0.56, 0, abi(64)],
  mix:['mix', 'Osc mix', 0.4, 0, a127], nois:['nois', 'Noise', 0, 0, a127], sub:['sub', 'Sub / transient level', 0, 0, a127], subw:['wave', 'Sub / transient shape', 0, 10, AMSUB], xmod:['xmod', 'Crossmod type', 0, 4, AMX], xamt:['amnt', 'Crossmod amount', 0, 0, a127], fuzz:['fuzz', 'Fuzz', 0, 0, a127], crsh:['crsh', 'Crush', 0, 0, a127],
  freq:['freq', 'Filter cutoff', 0.55, 0, a127], reso:['reso', 'Resonance', 0.15, 0, a127], fmode:['mode', 'Filter mode', 0, 2, ['lp', 'bp', 'hp']], fenv2:['env2', 'Env 2 > filter', 0.5, 0, a127], flfo2:['lfo2', 'LFO 2 > filter', 0, 0, a127],
  lsel:['lf/eg', 'LFO / envelope select', 2 / 2, 2, ['1', '2', '3']], msel:['modul', 'Modulation slot', 0, 3, ['1', '2', '3', '4']],
  volu:['volu', 'Volume', 0.8, 0, a127], kmode:['mode', 'Voice mode', 0.5, 2, ['mono', 'poly', '2x uni']], lega:['lega', 'Legato', 0, 1, ['off', 'on']], port:['port', 'Portamento', 0, 0, a127], octv:['octv', 'Octave', 0.5, 4, abi(2)], ktune:['tune', 'Tune', 0.5, 0, abi(64)], sprd:['sprd', 'Spread', 0.1, 0, a127],
  aseq:['a/seq', 'Arp / sequencer', 0, 2, ['off', 'arp', 'seq']], dire:['dire', 'Arp direction', 0, 5, ['up', 'down', 'up&dn', 'rnd', 'played', 'chord']], arang:['rang', 'Arp range', 0, 3, ['1', '2', '3', '4']], patt:['patt', 'Arp rhythm', 0, 15, function(v){ return String(Math.round(v * 15) + 1); }],
  grid:['grid', 'Grid', 2 / 3, 3, AMGRID.map(function(g){ return g[1]; })], slen:['len', 'Sequence length', 1, 15, function(v){ return String(Math.round(v * 15) + 1); }], ltch:['ltch', 'Latch', 0, 1, ['off', 'on']], bpm:['bpm', 'Tempo (shared)', 0, 0, function(){ return M.bpm.toFixed(0); }]
};
[1, 2, 3].forEach(function(i){ AMP['l' + i + 'rate'] = ['rate', 'LFO ' + i + ' rate', [0.55, 0.3, 0.45][i - 1], 0, a127]; AMP['l' + i + 'wave'] = ['wave', 'LFO ' + i + ' wave', 0, 4, AMLW];
  AMP['e' + i + 'a'] = ['attk', 'Env ' + i + ' attack', 0.02, 0, a127]; AMP['e' + i + 'd'] = ['deca', 'Env ' + i + ' decay', 0.4, 0, a127]; AMP['e' + i + 's'] = ['sust', 'Env ' + i + ' sustain', [0.3, 0.3, 0.8][i - 1], 0, a127]; AMP['e' + i + 'r'] = ['rele', 'Env ' + i + ' release', 0.35, 0, a127]; });
[1, 2, 3, 4].forEach(function(i){ AMP['m' + i + 's'] = ['srce', 'Mod ' + i + ' source', [3, 0, 6, 5][i - 1] / 7, 7, AMSRC]; AMP['m' + i + 'd'] = ['dest', 'Mod ' + i + ' destination', [1, 2, 6, 4][i - 1] / 6, 6, AMDST]; AMP['m' + i + 'a'] = ['amnt', 'Mod ' + i + ' amount', 0.5, 0, abi(63)]; });
var AMPAGES = [
  [['Oscillators', ['o1wave', 'o1para', 'o1rang', 'o1tune', 'o2wave', 'o2para', 'o2rang', 'o2tune']], ['Mixer', ['mix', 'nois', 'sub', 'subw', 'xmod', 'xamt', 'fuzz', 'crsh']]],
  [['Filter', ['freq', 'reso', 'fmode', null, 'fenv2', 'flfo2', null, null]]],
  [['LFOs + envelopes', ['lsel', '@lrate', '@lwave', null, '@ea', '@ed', '@es', '@er']]],
  [['Modulations', ['msel', '@ms', '@md', '@ma', null, null, null, null]]],
  [['Keyboard', ['volu', 'kmode', 'lega', 'port', 'octv', 'ktune', 'sprd', null]], ['Arp + sequencer', ['aseq', 'dire', 'arang', 'patt', 'grid', 'slen', 'ltch', null]]],
  [['Clock', ['bpm', null, null, null, null, null, null, null]]],
  [['Performance', ['freq', 'reso', 'fenv2', 'mix', 'o1para', 'o2para', 'e3a', 'e3r']]],
  [['Library', [null, null, null, null, null, null, null, null]]]
];
function amPatch(name, o){ var p = { name:name }; Object.keys(AMP).forEach(function(k){ p[k] = AMP[k][2]; }); Object.keys(o || {}).forEach(function(k){ p[k] = o[k]; }); return p; }
function amFactory(){ return [
  amPatch('Init Poly', {}), amPatch('Brass Pad', { o1wave:5 / 9, o1para:0.4, o2wave:0, o2rang:0.5, o2tune:0.56, mix:0.5, freq:0.42, fenv2:0.6, e2a:0.3, e2d:0.5, e2s:0.6, e3a:0.25, e3r:0.55 }),
  amPatch('Digital Bell', { o1wave:6 / 9, o1para:0.45, o2wave:3 / 9, o2rang:0.75, mix:0.3, freq:0.8, e3a:0.005, e3d:0.6, e3s:0.1, e3r:0.6, e2d:0.4 }), amPatch('Vowel Choir', { o1wave:1, o1para:0.2, o2wave:1, o2para:0.6, o2rang:0.5, mix:0.5, freq:0.7, e3a:0.35, e3r:0.55, m2s:4 / 7, m2d:2 / 6, m2a:0.7, l2rate:0.25 }),
  amPatch('Crushed Lead', { kmode:0, port:0.25, o1wave:4 / 9, o1para:0.6, o2wave:1 / 9, o2rang:0.25, crsh:0.45, fuzz:0.4, freq:0.6, reso:0.4, fenv2:0.65 }), amPatch('Ring Keys', { o1wave:2 / 9, o2wave:3 / 9, o2rang:0.5 + 7 / 48, xmod:1 / 4, xamt:0.7, freq:0.7, e3a:0.005, e3d:0.45, e3s:0.2, e3r:0.4 }),
  amPatch('Sub Stab', { o1wave:0, o2wave:1 / 9, sub:0.7, subw:0, freq:0.35, reso:0.35, fenv2:0.75, e2d:0.3, e2s:0, e3d:0.35, e3s:0, e3r:0.25, subx:0 }), amPatch('8-bit Arp', { o1wave:7 / 9, o1para:0.3, o2wave:7 / 9, o2para:0.6, o2rang:0.75, freq:0.75, e3a:0.003, e3d:0.25, e3s:0.1, e3r:0.2, aseq:0.5, ltch:1, arang:1 / 3 })
]; }
var AM = { presets:amFactory(), cur:0, p:null, page:0, sub:0, last:'freq', voices:[], held:{}, latched:{}, order:[], lastNote:60, lastVel:0.8, arpI:0, vis:[], lph:[0, 0, 0], lval:[0, 0, 0], lsh:[0, 0, 0], kb:{}, kbOct:0, dirty:true, msg:'', msgUntil:0, eff:{},
  seq:[0, null, 12, 0, null, 7, 0, 10, null, 0, 12, null, 7, 3, null, 5] };
AM.p = JSON.parse(JSON.stringify(AM.presets[0]));
var amSaveT = null; function amSaveSoon(){ clearTimeout(amSaveT); amSaveT = setTimeout(function(){ AM.presets[AM.cur] = JSON.parse(JSON.stringify(AM.p)); store('jambutek-studio-ambi-v1', JSON.stringify({ v:1, presets:AM.presets, cur:AM.cur })); }, 1200); }
(function(){ try { var s = JSON.parse(store('jambutek-studio-ambi-v1') || 'null'); if (!s || s.v !== 1 || !Array.isArray(s.presets) || s.presets.length !== AM.presets.length) return;
  s.presets.forEach(function(p, i){ if (p && typeof p === 'object') Object.keys(AMP).forEach(function(k){ if (typeof p[k] === 'number') AM.presets[i][k] = clamp(p[k], 0, 1); }); }); AM.cur = clamp(s.cur | 0, 0, AM.presets.length - 1); AM.p = JSON.parse(JSON.stringify(AM.presets[AM.cur])); } catch (e) {} })();
var amC = mk(AMW * 5, AMD * 5), amTex = null, AMKX = [104, 142, 180, 218], AMKY = [50, 114], AMSX = [78, 100.6, 123.2, 145.8, 168.4, 191, 213.6, 236.2];
function paintAM(){
  var g = amC.getContext('2d'); g.setTransform(5, 0, 0, 5, 0, 0); g.fillStyle = '#E6E6E2'; g.fillRect(0, 0, AMW, AMD);
  for (var i = 0; i < 2500; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '255,255,255') + ',' + rnd(.015, .05) + ')'; g.fillRect(Math.random() * AMW, Math.random() * AMD, .5, .3); }
  var K = '#26272B';
  function T(s, x, y, size, col, al, face){ g.font = (face || 'bold') + ' ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || K; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  function tag(s, x, y, size){ g.font = 'bold ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; var w = g.measureText(s).width + 2.4; g.fillStyle = K; g.fillRect(x - w / 2, y - size * 0.7, w, size * 1.4); T(s, x, y + 0.1, size, '#F0F0EC'); }
  [[8, 22], [312, 22], [8, 150], [312, 150], [300, 86]].forEach(function(p){ g.fillStyle = '#17181B'; g.beginPath(); g.arc(p[0], p[1], 1.9, 0, 7); g.fill(); });
  T('Ambi', 14, 10, 8.5, K, 'left', '300');
  ['6', '5', '4', '3', '2', '1'].forEach(function(s, k){ T(s, 82 + k * 17, 9, 3.8); }); tag('MIX', 205, 9, 2.8); T('▲', 232, 9, 3.4); T('▼', 250, 9, 3.4);
  g.strokeStyle = 'rgba(38,39,43,.8)'; g.lineWidth = 0.45; g.setLineDash([0.6, 1.2]); g.beginPath(); g.moveTo(60, 17); g.lineTo(308, 17); g.stroke();
  AMKX.forEach(function(x){ g.beginPath(); g.moveTo(x, AMKY[0] + 10); g.lineTo(x, 70); g.moveTo(x, 95); g.lineTo(x, AMKY[1] - 10); g.stroke(); }); g.beginPath(); g.moveTo(192, 34); g.lineTo(192, 40); g.stroke(); g.setLineDash([]);
  tag('VOLUME', 192, 37, 2.6);
  g.fillStyle = '#0A0D0A'; g.fillRect(84, 70.5, 161, 24);
  T('EDIT', 285, 80, 3.6); g.strokeStyle = 'rgba(38,39,43,.5)'; g.lineWidth = 0.25; for (var r = 0; r < 28; r++){ var a = r * Math.PI / 14; g.beginPath(); g.ellipse(285 + Math.cos(a) * 9.5, 100 + Math.sin(a) * 9.5, 5.5, 2.4, a, 0, 7); g.stroke(); }
  T('CLOCK/RATE', 48, 121.5, 2.7, K, 'right'); T('VOICE/', 48, 130.5, 2.7, K, 'right'); T('PART', 48, 134.2, 2.7, K, 'right');
  ['OSC', 'FILTER', 'ENV/LFO', 'MATRIX', 'KB/TUNE', 'VOICES', 'PERF', 'LIBRARY'].forEach(function(s, k){ tag(s, AMSX[k], 154.2, 2.5); });
  ['MIXER', '', 'VOICE LFO', '', 'SEQ/ARP', 'CLOCK', 'CUSTOM', ''].forEach(function(s, k){ T(s, AMSX[k], 159.8, 2.7); });
  g.strokeStyle = K; g.lineWidth = 0.3; g.strokeRect(AMSX[4] - 7.2, 162, 14.4, 3.8); T('STEPSEQ', AMSX[4], 164.1, 2.4);
  g.setTransform(1, 0, 0, 1, 0, 0); if (amTex) amTex.needsUpdate = true;
}
paintAM(); amTex = smoothTex(amC);
var AMLED = {}, amDispC = mk(800, 96), amDispT = canvasTex(amDispC); amDispT.minFilter = THREE.LinearFilter; amDispT.magFilter = THREE.LinearFilter;
(function(){
  var W2 = AMW * SC, D2 = AMD * SC, TH = 0.08;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x9A9A9A, map:amTex, emissive:0xffffff, emissiveMap:amTex, emissiveIntensity:0.22, shininess:10, specular:0x0A0A0A })); top.rotation.x = -Math.PI / 2; AMG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.002, TH, D2 + 0.004), new THREE.MeshPhongMaterial({ color:0xBDBDB8, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -TH / 2 - 0.0015; AMG.add(body);
  [-1, 1].forEach(function(s){ var ck = new THREE.Mesh(new THREE.BoxGeometry(0.024, TH + 0.012, D2 + 0.02), woodMat); ck.position.set(s * (W2 / 2 + 0.012), -TH / 2 + 0.004, 0); ck.castShadow = true; AMG.add(ck); });   // the wooden cheeks
  standFor(AMY, AMG, W2 + 0.05, D2, TH, AMH, AMTILT, 0.3); devBody(AMY, 'am'); BLOCKS.push([AMPOS.x - 0.48, AMPOS.x + 0.48, ROOM.z0, AMPOS.z + 0.34]);
  var d = new THREE.Mesh(new THREE.PlaneGeometry(157 * SC, 20 * SC), new THREE.MeshBasicMaterial({ map:amDispT })); d.rotation.x = -Math.PI / 2; d.position.set(ax(164.5), 0.002, az(82.5)); d.userData.noShadow = true; d.userData.ia = 'trbody'; d.userData.dev = 'am'; AMG.add(d); solids.push(d);
})();
HOST = AMG; LX = ax; LZ = az; DEV = 'am'; FACE = { bg:'#101113', fg:'#101113' };
[0, 1].forEach(function(r){ AMKX.forEach(function(x, k){ knob('amp' + (r * 4 + k), x, AMKY[r], 6.6, 'P' + (r * 4 + k + 1), 0.5, { h:11, sides:16, color:0x0E0F11 }).pi2 = r * 4 + k; }); });
AMSX.forEach(function(x, k){ button('ams' + k, x, 146, 11, 7, ' ', 'S' + (k + 1) + ' · ' + AMPAGES[k].map(function(p){ return p[0]; }).join(' / '), 0xFFFFFF).sp = k; ledAt(AMLED, 'pg' + k, x, 136, 0.0032, k === 7 ? 0x3BFF6A : 0xFFE15A); });
knob('amenc', 285, 100, 6.4, 'Encoder', 0, { h:11, endless:true, sides:16, color:0x0E0F11 });
(function(){ var v = knob('amvol', 192, 26, 6.2, 'Volume', 0.8, { h:11, sides:16, color:0x0E0F11 }); v.vol = true; })();
[0, 1, 2, 3, 4, 5].forEach(function(i){ ledAt(AMLED, 'v' + i, 52 + (i % 2) * 6, 127 + ((i / 2) | 0) * 5, 0.0022, 0x3BFF6A); }); ledAt(AMLED, 'st', 55, 121.5, 0.0022, 0xFFE15A);
HOST = TRG; LX = lx; LZ = lz; DEV = null; FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };

function amKey(k){ if (!k) return null; if (k.charAt(0) !== '@') return k; var P = AM.p, ls = 1 + Math.round(P.lsel * 2), ms = 1 + Math.round(P.msel * 3); return k.charAt(1) === 'l' ? 'l' + ls + k.slice(2) : k.charAt(1) === 'e' ? 'e' + ls + k.slice(2) : 'm' + ms + k.slice(2); }
function amKeys(){ return AMPAGES[AM.page][AM.sub % AMPAGES[AM.page].length][1].map(amKey); }
function amTxt(k){ var d = AMP[k], v = AM.p[k]; return typeof d[4] === 'function' ? d[4](v) : d[4][Math.round(v * d[3])]; }
function amSnap(k, v){ var n = AMP[k][3]; v = clamp(v, 0, 1); return n ? Math.round(v * n) / n : v; }
function amSync(){ var ks = amKeys(); for (var i = 0; i < 8; i++){ var c = CT['amp' + i], k = ks[i]; c.v = k === 'bpm' ? clamp((M.bpm - 40) / 200, 0, 1) : k ? AM.p[k] : 0.5; c.detents = k && AMP[k][3] ? AMP[k][3] : 0; c.show(); } if (CT.amvol){ CT.amvol.v = AM.p.volu; CT.amvol.show(); } AM.dirty = true; }
amSync();
function amLabel(c){
  if (c.vol) return 'Volume: ' + Math.round(AM.p.volu * 127) + ' · scroll or drag';
  if (c.pi2 != null){ var k = amKeys()[c.pi2]; return k ? AMP[k][1] + ': ' + amTxt(k) + ' · scroll or drag' : 'P' + (c.pi2 + 1) + ' · not used on this page'; }
  if (c.id === 'amenc') return AM.page === 7 ? 'Encoder · scroll to browse presets, click to reload' : 'Encoder · scroll to fine-tune ' + (AMP[AM.last] ? AMP[AM.last][1].toLowerCase() : '') + ', click to play C4';
  return c.name;
}
function amPaintDisp(){
  var g = amDispC.getContext('2d'), ks = amKeys(), now = performance.now(); g.fillStyle = '#050A05'; g.fillRect(0, 0, 800, 96); g.font = 'bold 30px "Courier New", monospace'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#7CFF4A'; g.shadowColor = '#3BD01A'; g.shadowBlur = 5;
  if (now < AM.msgUntil){ g.fillText(AM.msg, 22, 48, 760); }
  else if (AM.page === 7){ g.fillText('Library   preset ' + (AM.cur + 1) + '/' + AM.presets.length, 22, 26); g.fillText(AM.p.name + '   turn encoder', 22, 70); }
  else for (var i = 0; i < 8; i++){ var k = ks[i]; if (!k) continue; var s = (AMP[k][0] + '     ').slice(0, 5) + amTxt(k); g.fillText(s.slice(0, 10), 22 + (i % 4) * 190, i < 4 ? 26 : 70); if (i % 4){ g.fillRect(22 + (i % 4) * 190 - 12, i < 4 ? 10 : 54, 2, 32); } }
  g.shadowBlur = 0; amDispT.needsUpdate = true;
}

/* ---- audio ---- */
var AMA = null;
function amAudio(){
  if (AMA) return true; unlock(); if (!AU.ready) return false; var A = {};
  function K(v){ var c = ac.createConstantSource(); c.offset.value = v; c.start(); return c; }
  A.pitch = K(0); A.cut = K(0); A.pre = ac.createGain(); A.trem = ac.createGain(); A.vol = ac.createGain(); A.pre.connect(A.trem); A.trem.connect(A.vol); A.vol.connect(AU.ch[4].inp);
  var n = 2048, th = new Float32Array(n), fo = new Float32Array(n), hc = new Float32Array(n); for (var k = 0; k < n; k++){ var x = k / (n / 2) - 1; th[k] = Math.tanh(x * 3); fo[k] = Math.sin(x * Math.PI * 2.5); hc[k] = x >= 0 ? 0.8 : -0.8; }
  A.tanh = th; A.fold = fo; A.hard = hc; A.stairs = {}; A.narrow = (function(){ var m = 40, re = new Float32Array(m), im = new Float32Array(m); for (var h = 1; h < m; h++) re[h] = 2 / (h * Math.PI) * Math.sin(h * Math.PI * 0.2); return ac.createPeriodicWave(re, im); })();
  AMA = A; amApply(); return true;
}
function amStairs(levels){ levels = Math.max(2, Math.round(levels)); var A = AMA; if (A.stairs[levels]) return A.stairs[levels]; var c = new Float32Array(2048); for (var k = 0; k < 2048; k++){ var x = k / 1024 - 1; c[k] = Math.round(x * levels / 2) / (levels / 2); } return (A.stairs[levels] = c); }
function amApply(){ if (!AMA) return; AMA.vol.gain.setTargetAtTime(Math.pow(AM.p.volu, 1.6) * 1.5, ac.currentTime, 0.02); }
function amWave(x, w){                                // one oscillator; returns { out, set(para, t, init) }
  var e, sh, o, o2, out;
  if (w === 5){ e = MFENG[1](x); return { out:e.out, set:function(p, t, i){ e.set({ w:0, ti:p, s:0.9 }, t, i); } }; }
  if (w === 6){ e = MFENG[3](x); return { out:e.out, set:function(p, t, i){ e.set({ w:3 / 7, ti:p, s:0 }, t, i); } }; }
  if (w === 8){ e = MFENG[7](x); return { out:e.out, set:function(p, t, i){ e.set({ w:p, ti:0.3, s:0 }, t, i); } }; }
  if (w === 9){ e = MFENG[5](x); return { out:e.out, set:function(p, t, i){ e.set({ w:p, ti:0.5, s:0 }, t, i); } }; }
  out = x.G(0.5);
  if (w === 4){ o = x.O('sawtooth', x.f); var dl = ac.createDelay(0.1), inv = x.G(-1); o.connect(out); o.connect(dl); dl.connect(inv); inv.connect(out); return { out:out, set:function(p, t, i){ PS(dl.delayTime, Math.min(0.09, (0.5 - p * 0.45) / x.f), t, i); } }; }
  if (w === 7){ o = x.O('triangle', x.f); sh = ac.createWaveShaper(); o.connect(sh); sh.connect(out); var lv = -1; return { out:out, set:function(p){ var n = 2 + Math.round((1 - p) * 14); if (n !== lv){ lv = n; sh.curve = amStairs(n); } } }; }
  o = x.O(['sawtooth', 'square', 'triangle', 'sine'][w], x.f); o2 = x.O(['sawtooth', 'square', 'triangle', 'sine'][w], x.f * 2); var g2 = x.G(0); o.connect(out); o2.connect(g2); g2.connect(out);
  return { out:out, set:function(p, t, i){ PS(g2.gain, p * 0.8, t, i); } };       // para blends in the octave above
}
function amEnvT(v, k){ return k === 'a' ? 0.001 + v * v * v * 6 : 0.005 + v * v * v * 10; }
function amVoice(note, vel, t, dur, from, det){
  var A = AMA, P = AM.p, v = { note:note, vel:vel, t0:t, tOff:null, srcs:[], es:[] }, oct = Math.round((P.octv - 0.5) * 4) * 12, base = note + oct + (P.ktune - 0.5) * 2;
  function G(val){ var g = ac.createGain(); g.gain.value = val; return g; }
  var pb = G(1); A.pitch.connect(pb); v.pb = pb; var gl = ac.createConstantSource(); gl.offset.value = det || 0; gl.connect(pb); gl.start(t); v.srcs.push(gl);
  var pt = P.port * P.port * 1.5; if (from != null && pt > 0.004 && from !== note){ gl.offset.setValueAtTime((from - note) * 100 + (det || 0), t); gl.offset.setTargetAtTime(det || 0, t, pt / 3); }
  function ctx(f){ return { f:f, t:t, det:0, pb:pb, G:G,
    O:function(type, fr){ var os = ac.createOscillator(); if (typeof type === 'string') os.type = type; else os.setPeriodicWave(type); os.frequency.value = fr; pb.connect(os.detune); os.start(t); v.srcs.push(os); return os; },
    K:function(val){ var c = ac.createConstantSource(); c.offset.value = val; c.start(t); v.srcs.push(c); return c; },
    N:function(){ var s = ac.createBufferSource(); s.buffer = AU.noise; s.loop = true; s.start(t, Math.random()); v.srcs.push(s); return s; } }; }
  var bus = G(1), fs = [0, 0], gs = [];
  [1, 2].forEach(function(k){ var f = mtof(base + Math.round((P['o' + k + 'rang'] - 0.5) * 48) + (P['o' + k + 'tune'] - 0.5)); fs[k - 1] = f; var e = amWave(ctx(f), Math.round(P['o' + k + 'wave'] * 9)); e.set(clamp(P['o' + k + 'para'] + (AM.eff['p' + k] || 0), 0, 1), t, true); var g = G(0); e.out.connect(g); g.connect(bus); v.es.push(e); gs.push(g); });
  v.gs = gs; v.setMix = function(tt, init){ var m = clamp(P.mix + (AM.eff.mix || 0), 0, 1), xa = Math.round(P.xmod * 4) ? P.xamt : 0; PS(gs[0].gain, (1 - m) * (1 - xa * 0.7), tt, init); PS(gs[1].gain, m * (1 - xa * 0.7), tt, init); if (v.xg) PS(v.xg.gain, xa * 1.2, tt, init); };
  var xm = Math.round(P.xmod * 4);
  if (xm){ var xg = G(0); v.xg = xg; if (xm <= 2){ var ring = G(0); v.es[0].out.connect(ring); v.es[1].out.connect(ring.gain); if (xm === 2){ var hs = ac.createWaveShaper(); hs.curve = A.hard; ring.connect(hs); hs.connect(xg); } else { var rb = G(2); ring.connect(rb); rb.connect(xg); } }
    else { var sm = G(0.9), ws = ac.createWaveShaper(); ws.curve = xm === 3 ? A.fold : amStairs(6); v.es[0].out.connect(sm); v.es[1].out.connect(sm); sm.connect(ws); ws.connect(xg); } xg.connect(bus); }
  v.setMix(t, true);
  if (P.nois > 0.01){ var nz2 = ctx(1).N(), ng = G(P.nois * P.nois * 0.8); nz2.connect(ng); ng.connect(bus); }
  if (P.sub > 0.01){ var sw = Math.round(P.subw * 10), sg = G(P.sub * P.sub * 0.9), c2 = ctx(1);
    if (sw < 6){ var so = c2.O(sw % 3 === 0 ? 'square' : sw % 3 === 1 ? 'triangle' : A.narrow, fs[0] / (sw < 3 ? 2 : 4)); so.connect(sg); }
    else { var tn = sw === 9 ? c2.O('square', 1760) : sw === 10 ? c2.O('sine', 220) : c2.N(), tf = ac.createBiquadFilter(), te = G(0), td = [0.006, 0.035, 0.16, 0.05, 0.05][sw - 6]; tf.type = sw === 8 ? 'lowpass' : sw === 7 ? 'bandpass' : 'highpass'; tf.frequency.value = [3000, 2400, 900, 800, 30][sw - 6];
      if (sw === 10){ tn.frequency.setValueAtTime(420, t); tn.frequency.exponentialRampToValueAtTime(60, t + 0.05); } te.gain.setValueAtTime(1.6, t); te.gain.exponentialRampToValueAtTime(0.0001, t + td); tn.connect(tf); tf.connect(te); te.connect(sg); }
    sg.connect(bus); }
  var last = bus; if (P.fuzz > 0.01){ var fp = G(1 + P.fuzz * 10), fw = ac.createWaveShaper(), fo2 = G(1 / (1 + P.fuzz * 1.8)); fw.curve = A.tanh; last.connect(fp); fp.connect(fw); fw.connect(fo2); last = fo2; }
  if (P.crsh > 0.02){ var cw = ac.createWaveShaper(); cw.curve = amStairs(34 - P.crsh * 31); last.connect(cw); last = cw; }
  var fm = Math.round(P.fmode * 2), f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter(), fe = G(P.fenv2 * 7200); f1.type = ['lowpass', 'bandpass', 'highpass'][fm]; f2.type = fm === 0 ? 'lowpass' : 'allpass'; v.f1 = f1; v.f2 = f2; v.fe = fe;
  v.setFilt = function(tt, init){ var hz = 30 * Math.pow(2, P.freq * 9.2); PS(f1.frequency, hz, tt, init); PS(f2.frequency, hz, tt, init); PS(f1.Q, 0.6 + P.reso * P.reso * 20, tt, init); PS(fe.gain, P.fenv2 * 7200, tt, init); }; v.setFilt(t, true); f2.Q.value = 0.6; f1.detune.value = f2.detune.value = (note - 60) * 40;
  var envs = [2, 3].map(function(i){ var c = ac.createConstantSource(); c.offset.value = 0; c.start(t); v.srcs.push(c); var a = amEnvT(P['e' + i + 'a'], 'a'), d = amEnvT(P['e' + i + 'd']); c.offset.setValueAtTime(0, t); c.offset.setTargetAtTime(1, t, Math.max(0.0008, a / 4)); if (dur == null || a < dur) c.offset.setTargetAtTime(P['e' + i + 's'], t + a, d / 3); return c; });
  v.envs = envs; v.rel = [amEnvT(P.e2r), amEnvT(P.e3r)]; v.adsr = [1, 2, 3].map(function(i){ return { a:amEnvT(P['e' + i + 'a'], 'a'), d:amEnvT(P['e' + i + 'd']), s:P['e' + i + 's'], r:amEnvT(P['e' + i + 'r']) }; });
  envs[0].connect(fe); [f1, f2].forEach(function(f){ fe.connect(f.detune); A.cut.connect(f.detune); });
  var vca = G(0), vg = G(0.42 * (0.4 + 0.6 * vel)); envs[1].connect(vg); vg.connect(vca.gain); last.connect(f1); f1.connect(f2); f2.connect(vca); vca.connect(A.pre); v.vca = vca;
  AM.voices.push(v); AM.lastNote = note; AM.lastVel = vel; AM.envV = v;
  var live = AM.voices.filter(function(q){ return !q.dead && !q.killed; }); while (live.length > 6) amKill(live.shift(), t);
  if (dur != null) amOff(v, t + dur);
  return v;
}
function amEnd(v, end){ v.srcs.forEach(function(s){ try { s.stop(end); } catch (e) {} }); clearTimeout(v.tm); v.tm = setTimeout(function(){ v.dead = true; try { v.vca.disconnect(); AMA.pitch.disconnect(v.pb); AMA.cut.disconnect(v.f1.detune); AMA.cut.disconnect(v.f2.detune); } catch (e) {} var i = AM.voices.indexOf(v); if (i >= 0) AM.voices.splice(i, 1); }, Math.max(0, (end - ac.currentTime) * 1000) + 150); }
function amOff(v, t){ if (v.tOff != null) return; v.tOff = t; v.envs.forEach(function(c, i){ c.offset.cancelScheduledValues(t); c.offset.setTargetAtTime(0, t, v.rel[i] / 3); }); amEnd(v, t + v.rel[1] * 2.2 + 0.08); }
function amKill(v, t){ if (v.killed || v.dead) return; v.killed = true; if (v.tOff == null) v.tOff = t; v.envs.forEach(function(c){ c.offset.cancelScheduledValues(t); c.offset.setTargetAtTime(0, t, 0.004); }); amEnd(v, t + 0.05); }
function amEnvAt(v, i, t){ var A = v.adsr[i], dt = t - v.t0, L = dt < 0 ? 0 : dt < A.a ? dt / A.a : A.s + (1 - A.s) * Math.exp(-(dt - A.a) / (A.d / 3)); if (v.tOff != null && t >= v.tOff) L *= Math.exp(-(t - v.tOff) / (A.r / 3)); return L; }
function amPlay(note, vel, t, dur){                   // one note, honouring mono / poly / unison
  var P = AM.p, km = Math.round(P.kmode * 2), from = P.port > 0.05 ? AM.lastNote : null, sp = P.sprd * 30, out = [];
  if (km === 0) AM.voices.forEach(function(q){ if (!q.dead && (q.tOff == null || q.tOff > t)) amKill(q, t); });
  if (km === 2){ out.push(amVoice(note, vel, t, dur, from, -6 - sp)); out.push(amVoice(note, vel, t, dur, from, 6 + sp)); } else out.push(amVoice(note, vel, t, dur, from, (Math.random() - 0.5) * sp));
  return out;
}
function amNoteAt(n, vel, t, dur){ if (!amAudio()) return; amPlay(n, vel, t, dur); AM.vis.push({ t:t, d:dur }); }
function amHeld(){ return AM.order.filter(function(n){ return AM.held[n] || AM.latched[n]; }); }
function amKeyDown(n, vel){
  if (!amAudio()) return; var P = AM.p, mode = Math.round(P.aseq * 2); AM.lastKey = n;
  if (P.ltch >= 0.5 && mode){ if (AM.latched[n]){ delete AM.latched[n]; AM.order = AM.order.filter(function(q){ return q !== n; }); return; } AM.latched[n] = 1; } else AM.held[n] = AM.held[n] || true;
  AM.order = AM.order.filter(function(q){ return q !== n; }); AM.order.push(n);
  if (mode && M.playing) return;
  AM.held[n] = amPlay(n, vel || 0.8, ac.currentTime + 0.003, null);
}
function amKeyUp(n){ var h = AM.held[n]; if (!h) return; delete AM.held[n]; if (!AM.latched[n]) AM.order = AM.order.filter(function(q){ return q !== n; }); if (Array.isArray(h) && AMA){ var t = ac.currentTime + 0.003; h.forEach(function(v){ amOff(v, t); }); } }
function amKbDown(k){
  if (k === 'z' || k === 'x'){ AM.kbOct = clamp(AM.kbOct + (k === 'x' ? 1 : -1), -2, 2); amSay('keys octave ' + (AM.kbOct > 0 ? '+' : '') + AM.kbOct); return true; }
  var i = MFKB.indexOf(k); if (i < 0 || k.length !== 1) return false; if (AM.kb[k] != null) return true; var n = 60 + i + AM.kbOct * 12; AM.kb[k] = n; amKeyDown(n, 0.85); return true;
}
function amKbUp(k){ if (AM.kb[k] != null){ amKeyUp(AM.kb[k]); delete AM.kb[k]; } }
function amSay(m, ms){ AM.msg = m; AM.msgUntil = performance.now() + (ms || 1400); AM.dirty = true; }
function amClock(t, N, sd, sw){                       // one call per 16th from the drum machine
  var P = AM.p, mode = Math.round(P.aseq * 2); if (!mode) return; var L = AMGRID[Math.round(P.grid * 3)][0], h = amHeld();
  for (var k = Math.ceil(N / L - 1e-6); k * L < N + 1 - 1e-6; k++){
    var pos = k * L, r = Math.round(pos), on = Math.abs(pos - r) < 1e-6, tt = t + (pos - N) * sd + (on && r % 2 ? sw * sd : 0), dur = sd * L * 0.6;
    if (mode === 2){ var len = 1 + Math.round(P.slen * 15), st = AM.seq[k % len]; if (st != null) amNoteAt(48 + st + (h.length ? h[h.length - 1] - 60 : 0), 0.8, tt, dur); continue; }
    if (!h.length){ AM.arpI = 0; continue; } if (BSRH[Math.round(P.patt * 15)][k % 16] !== 'x') continue;
    var d = Math.round(P.dire * 5), base = d === 4 ? h.slice() : h.slice().sort(function(a, b){ return a - b; }), all = [], oc = 1 + Math.round(P.arang * 3); for (var o = 0; o < oc; o++) base.forEach(function(q){ all.push(q + 12 * o); });
    var n = all.length, i = AM.arpI++, pick = d === 5 ? all.slice(0, 6) : [d === 1 ? all[n - 1 - (i % n)] : d === 2 ? (function(){ var per = Math.max(1, 2 * n - 2), q = i % per; return all[q < n ? q : per - q]; })() : d === 3 ? all[(Math.random() * n) | 0] : all[i % n]];
    pick.forEach(function(q){ amNoteAt(q, AM.lastVel, tt, dur); });
  }
}
function amOnStart(){ AM.arpI = 0; }
function amOnStop(){ AM.vis = []; if (AMA){ var t = ac.currentTime; AM.voices.forEach(function(v){ if (v.tOff != null && v.tOff > t) amKill(v, t); }); } }
function amLive(){ if (!AMA) return; var t = ac.currentTime; AM.voices.forEach(function(v){ if (v.dead) return; v.setFilt(t, false); v.setMix(t, false); v.es.forEach(function(e, k){ e.set(clamp(AM.p['o' + (k + 1) + 'para'] + (AM.eff['p' + (k + 1)] || 0), 0, 1), t, false); }); }); amApply(); }
function amSet(k, v){ if (k === 'bpm') return; AM.p[k] = amSnap(k, v); AM.last = k; if (k === 'aseq' || k === 'kmode' || k === 'ltch'){ AM.latched = {}; AM.order = AM.order.filter(function(n){ return AM.held[n]; }); } if (k === 'lsel' || k === 'msel') amSync(); amLive(); AM.dirty = true; amSaveSoon(); }
function amCtl(c){ if (c.vol){ amSet('volu', c.v); return; } var k = amKeys()[c.pi2]; if (!k) return; if (k === 'bpm'){ setBpm(40 + Math.round(c.v * 200)); AM.dirty = true; return; } amSet(k, c.v); }
function amLoad(i){ AM.cur = (i + AM.presets.length) % AM.presets.length; AM.p = JSON.parse(JSON.stringify(AM.presets[AM.cur])); AM.eff = {}; AM.latched = {}; amSync(); amLive(); amSaveSoon(); }
function amTurn(c, n){ if (AM.page === 7){ amLoad(AM.cur + n); return; } var k = AM.last; if (!AMP[k]) return; amSet(k, AM.p[k] + n / (AMP[k][3] || 127)); amSync(); amSay(AMP[k][1] + '  ' + amTxt(k)); }
CT.amenc.click = function(){ if (AM.page === 7){ amLoad(AM.cur); amSay('reloaded  ' + AM.p.name); return; } if (amAudio()){ amPlay(60, 0.85, ac.currentTime + 0.003, 0.45); AM.vis.push({ t:ac.currentTime, d:0.45 }); } };
function amPress(c){ if (c.sp == null) return; if (AM.page === c.sp) AM.sub = (AM.sub + 1) % AMPAGES[c.sp].length; else { AM.page = c.sp; AM.sub = 0; } amSync(); amSay(AMPAGES[AM.page][AM.sub][0], 900); }
function amLfo(i, dt){ var P = AM.p, ph = AM.lph[i] + 0.05 * Math.pow(2, P['l' + (i + 1) + 'rate'] * 8.5) * dt, wrap = ph >= 1; ph -= Math.floor(ph); AM.lph[i] = ph; if (wrap) AM.lsh[i] = Math.random() * 2 - 1; var w = Math.round(P['l' + (i + 1) + 'wave'] * 4);
  return w === 0 ? 1 - 4 * Math.abs(ph - 0.5) : w === 1 ? (ph < 0.5 ? 1 : -1) : w === 2 ? AM.lsh[i] : w === 3 ? 2 * ph - 1 : Math.sin(ph * Math.PI * 2); }
function amUpdate(now, dt){
  var P = AM.p, t = ac ? ac.currentTime : 0, i; for (i = 0; i < 3; i++) AM.lval[i] = amLfo(i, dt);
  if (AMA){
    var ev = AM.envV && !AM.envV.dead ? AM.envV : null, S = [ev ? amEnvAt(ev, 0, t) : 0, ev ? amEnvAt(ev, 1, t) : 0, ev ? amEnvAt(ev, 2, t) : 0, AM.lval[0], AM.lval[1], AM.lval[2], AM.lastVel, clamp((AM.lastNote - 60) / 24, -1, 1)], D = [0, 0, 0, 0, 0, 0, 0];
    for (i = 1; i <= 4; i++){ var a = (P['m' + i + 'a'] - 0.5) * 2; if (Math.abs(a) > 0.01) D[Math.round(P['m' + i + 'd'] * 6)] += a * S[Math.round(P['m' + i + 's'] * 7)]; }
    AMA.pitch.offset.setTargetAtTime(D[0] * 2400 + D[1] * 100, t, 0.012); AMA.cut.offset.setTargetAtTime(D[5] * 6000 + AM.lval[1] * P.flfo2 * 3600 + snCv(4) * 2400, t, 0.012); AMA.trem.gain.setTargetAtTime(clamp(1 + D[6], 0, 2), t, 0.012);
    var E = AM.eff; if (Math.abs(D[2] - (E.p1 || 0)) + Math.abs(D[3] - (E.p2 || 0)) + Math.abs(D[4] - (E.mix || 0)) > 0.006){ AM.eff = { p1:D[2], p2:D[3], mix:D[4] }; AM.voices.forEach(function(v){ if (v.dead) return; v.setMix(t, false); v.es.forEach(function(e, k){ e.set(clamp(P['o' + (k + 1) + 'para'] + (AM.eff['p' + (k + 1)] || 0), 0, 1), t, false); }); }); }
  }
  var act = AM.voices.filter(function(v){ return !v.dead && v.t0 <= t && (v.tOff == null || v.tOff + 0.15 > t); }).length;
  for (i = 0; i < 6; i++) ledOn(AMLED['v' + i], i < act ? 1 : 0.05); for (i = 0; i < 8; i++) ledOn(AMLED['pg' + i], AM.page === i ? 1 : 0); ledOn(AMLED.st, M.playing ? (SEQ.visStep % 4 === 0 ? 1 : 0.1) : 0.2 + Math.abs(AM.lval[0]) * 0.6);
  CTLIST.forEach(function(c){ if (c.dev !== 'am' || c.kind !== 'btn') return; var L = c.sp === AM.page ? 0.6 : 0; if (c.down) L = 0.9; if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; });
  if (now > AM.msgUntil && AM.msg){ AM.msg = ''; AM.dirty = true; }
  if (AM.dirty){ AM.dirty = false; amPaintDisp(); }
}
