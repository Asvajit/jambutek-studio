
/* ================= the mixer: one channel per instrument, three-band EQ, two sends, mute and fader each, and a master ================= */
var NTTH = 0.11;               // how far the shared table top sits below the panels of the drum machine and the mixer
var MXW = 536, MXD = 328, MXH = 1.1, MXTILT = 0.56;
function qx(u){ return (u - MXW / 2) * SC; }
function qz(u){ return (u - MXD / 2) * SC; }
var MXY = new THREE.Group(); MXY.position.set(MXPOS.x, MXH, MXPOS.z); MXY.rotation.y = MXPOS.r; scene.add(MXY);
var MXG = new THREE.Group(); MXG.rotation.x = MXTILT; MXY.add(MXG);
var MXN = ['DRUMS', 'SYNTH', 'BASS', 'BLIP', 'AMBI', 'TAPE', 'SHRU', 'CHORD', 'SCRATCH', 'KIT'], MXCOL = ['#FF2A3C', '#FF8A2A', '#4AA8FF', '#FF5A4A', '#C8C8FF', '#FFE15A', '#58C8FF', '#FF6AB0', '#35D8B8', '#F5C518'], MXX = [32, 80, 128, 176, 224, 272, 320, 368, 416, 464], MXMX = 510, MXNC = 10;
var MX = { ch:MXX.map(function(){ return { hi:0.5, mid:0.5, lo:0.5, sa:0, sb:0, sc:0, vol:0.75, mute:0, solo:0 }; }), master:0.8, lv:[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  hpf:0, lpf:1, fh:[1, 1, 1, 1, 1, 1, 1, 1, 1, 1], fl:[1, 1, 1, 1, 1, 1, 1, 1, 1, 1] };      // the two master filters and which channels each one acts on
function mxRestore(){ try { var s = JSON.parse(store('jambutek-studio-mix-v1') || 'null'); if (s && s.v === 1 && Array.isArray(s.ch)){ s.ch.forEach(function(c, i){ if (!c || !MX.ch[i]) return; ['hi', 'mid', 'lo', 'sa', 'sb', 'vol'].forEach(function(k){ if (typeof c[k] === 'number') MX.ch[i][k] = clamp(c[k], 0, 1); }); MX.ch[i].mute = c.mute ? 1 : 0; MX.ch[i].solo = c.solo ? 1 : 0; MX.ch[i].sc = i && typeof c.sc === 'number' ? clamp(c.sc, 0, 1) : 0; }); if (typeof s.master === 'number') MX.master = clamp(s.master, 0, 1);
  MX.hpf = typeof s.hpf === 'number' ? clamp(s.hpf, 0, 1) : 0; MX.lpf = typeof s.lpf === 'number' ? clamp(s.lpf, 0, 1) : 1; var fnew = s.fv === 2; for (var fi = 0; fi < 10; fi++){ MX.fh[fi] = !fnew || (s.fh && s.fh[fi]) ? 1 : 0; MX.fl[fi] = !fnew || (s.fl && s.fl[fi]) ? 1 : 0; }      /* anything saved before the filters had this layout starts with every channel switched in */ } } catch (e) {} } mxRestore();
var mxSaveT = null; function mxSaveNow(){ store('jambutek-studio-mix-v1', JSON.stringify({ v:1, ch:MX.ch, master:MX.master, hpf:MX.hpf, lpf:MX.lpf, fh:MX.fh, fl:MX.fl, fv:2 })); } function mxSaveSoon(){ clearTimeout(mxSaveT); mxSaveT = setTimeout(mxSaveNow, saveMs(800)); }
var mxC = mk(2144, 1312), mxTex = null;
function paintMX(){
  var g = mxC.getContext('2d'); g.setTransform(4, 0, 0, 4, 0, 0);
  g.fillStyle = '#1A1C21'; g.fillRect(0, 0, MXW, MXD);
  for (var i = 0; i < 3000; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '120,130,150') + ',' + rnd(.02, .07) + ')'; g.fillRect(Math.random() * MXW, Math.random() * MXD, .5, .3); }
  function T(s, x, y, size, col, anton){ g.font = anton ? size + 'px ' + FONT : 'bold ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || '#E6E6E2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
   T('MIX-10', MXMX, 11, 6, '#E0193C', true);
  MXX.forEach(function(x, i){
    g.fillStyle = '#23262C'; g.fillRect(x - 21, 19, 42, 302); g.fillStyle = MXCOL[i]; g.fillRect(x - 21, 19, 42, 2.5);
    if (i){ T('SIDE', x - 13, 7.4, 2.7, '#B8B8B4'); T('CHAIN', x - 13, 11.2, 2.7, '#B8B8B4'); g.fillStyle = '#FF2A3C'; g.fillRect(x + 2.7, 2.6, 0.6, 1.4); }
    g.fillStyle = '#E6E6E2'; g.fillRect(x - 17, 25, 34, 11); T(MXN[i], x, 30.8, 6.2, '#111318', true); T(String(i + 1), x - 15, 313, 7, MXCOL[i], true);
    [['HI', 52], ['MID', 88], ['LOW', 124]].forEach(function(a){ T(a[0], x, a[1] + 15, 4.2); g.fillStyle = '#B8B8B4'; g.fillRect(x - 0.3, a[1] - 13, 0.6, 2); });
    [['A', 157, '#F2B544'], ['B', 186, '#7FD0FF']].forEach(function(a){ T('SEND', x - 12.5, a[1] - 3, 2.9, '#B8B8B4'); T(a[0], x - 12.5, a[1] + 2.6, 5.4, a[2], true); g.fillStyle = a[2]; g.fillRect(x - 0.3, a[1] - 9.6, 0.6, 1.6); });
    g.strokeStyle = 'rgba(216,216,216,.4)'; g.lineWidth = 0.3; for (var k = 0; k <= 10; k++){ var yy = 234 + k * 7.6; g.beginPath(); g.moveTo(x - 10, yy); g.lineTo(x - (k % 5 ? 5.5 : 4), yy); g.stroke(); }
    T('0', x - 13.5, 234 + 2.5 * 7.6, 3.4, '#B8B8B4');
  });
  g.fillStyle = '#23262C'; g.fillRect(MXMX - 19, 19, 38, 302); g.fillStyle = '#E0193C'; g.fillRect(MXMX - 19, 19, 38, 2.5); T('MASTER', MXMX, 30.8, 6.2, '#E6E6E2', true); T('HPF', MXMX, 37.6, 3.4, '#FF9A5A'); T('LPF', MXMX, 89.6, 3.4, '#7FD0FF'); T('SEND A', MXMX, 147.5, 3.2, '#F2B544'); T('SEND B', MXMX, 176.5, 3.2, '#7FD0FF'); T('OUT', MXMX, 220, 4);
  g.strokeStyle = 'rgba(216,216,216,.4)'; g.lineWidth = 0.3; for (var k2 = 0; k2 <= 10; k2++){ var y2 = 234 + k2 * 7.6; g.beginPath(); g.moveTo(MXMX - 10, y2); g.lineTo(MXMX - (k2 % 5 ? 5.5 : 4), y2); g.stroke(); }
  g.setTransform(1, 0, 0, 1, 0, 0); if (mxTex) mxTex.needsUpdate = true;
}
paintMX(); mxTex = smoothTex(mxC);
if (document.fonts && document.fonts.load) document.fonts.load('20px Anton').then(paintMX).catch(function(){});
var MXMET = [];
(function(){
  var W2 = MXW * SC, D2 = MXD * SC, TH = NTTH;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:mxTex, emissive:0xffffff, emissiveMap:mxTex, emissiveIntensity:0.5, shininess:8, specular:0x0A0A0A })); top.rotation.x = -Math.PI / 2; MXG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.012, TH, D2 + 0.012), new THREE.MeshPhongMaterial({ color:0x1B1D22, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -TH / 2 - 0.0015; MXG.add(body);
  devBody(MXY, 'mx');
  BLOCKS.push(devBlock(MXPOS, 0.6)); BLOCKS.push(devBlock(ECPOS, 0.3));
  // one long table for the whole row: drum machine, echo, mixer. Same height and slant as their own stands had
  var x0 = TRPOS.x - PANEL.w * SC / 2, x1 = MXPOS.x + W2 / 2, NTY = new THREE.Group(); NTY.position.set((x0 + x1) / 2, MXH, MXPOS.z); NTY.rotation.y = MXPOS.r; scene.add(NTY);
  var NTG = new THREE.Group(); NTG.rotation.x = MXTILT; NTY.add(NTG); standFor(NTY, NTG, x1 - x0, D2, TH, MXH, MXTILT, (x1 - x0) / 2 - 0.12, true); solid(NTY, 'table');
  // level meters: a column of segments beside each fader
  var geo = new THREE.BoxGeometry(0.007, 0.002, 0.009);
  MXX.concat([MXMX]).forEach(function(x, i){ var segs = []; for (var k = 0; k < 10; k++){ var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color:0x15171C })); m.position.set(qx(x + 13), 0.0012, qz(308 - k * 7.6)); m.userData.noShadow = true; MXG.add(m); segs.push(m.material); } MXMET.push(segs); });
})();
HOST = MXG; LX = qx; LZ = qz; DEV = 'mx';
MXX.forEach(function(x, i){
  knob('mxhi' + i, x, 52, 6.2, MXN[i] + ' high', MX.ch[i].hi, { h:8 }).ch = i; knob('mxmid' + i, x, 88, 6.2, MXN[i] + ' mid', MX.ch[i].mid, { h:8 }).ch = i; knob('mxlo' + i, x, 124, 6.2, MXN[i] + ' low', MX.ch[i].lo, { h:8 }).ch = i;
  if (i) knob('mxsc' + i, x + 3, 9.6, 3.9, MXN[i] + ' sidechain (ducks to the kick)', MX.ch[i].sc, { h:6, color:0x3A1216 }).ch = i;
  knob('mxsa' + i, x + 3, 157, 5, MXN[i] + ' send A (echo)', MX.ch[i].sa, { h:7, color:0x3A2C10 }).ch = i; knob('mxsb' + i, x + 3, 186, 5, MXN[i] + ' send B (reverb)', MX.ch[i].sb, { h:7, color:0x12303F }).ch = i;
  button('mxmute' + i, x - 9.6, 213.5, 17.5, 16, 'MUTE', MXN[i] + ' mute', 0xFF2A3C).ch = i; var so = button('mxsolo' + i, x + 9.6, 213.5, 17.5, 16, 'SOLO', MXN[i] + ' solo', 0xFFE15A); so.ch = i; so.solo = true;
  vfader('mxvol' + i, x, 234, 310, MXN[i] + ' volume', MX.ch[i].vol, { stripe:new THREE.Color(MXCOL[i]).getHex() }).ch = i;
});
FACE = { bg:'#F2B544', fg:'#141005' }; button('mxclra', MXMX, 157, 26, 10, 'CLEAR', 'Clear send A on every channel', 0xF2B544).clr = 'sa';
FACE = { bg:'#7FD0FF', fg:'#06131B' }; button('mxclrb', MXMX, 186, 26, 10, 'CLEAR', 'Clear send B on every channel', 0x7FD0FF).clr = 'sb';
/* the two master filters, above the sends: a knob each, and under it two rows of five small numbered buttons that switch the filter in
   for those channels */
knob('mxhpf', MXMX - 7, 48.5, 5.6, 'Master high-pass', MX.hpf, { h:7, color:0x3A2010 }); knob('mxlpf', MXMX - 7, 100.5, 5.6, 'Master low-pass', MX.lpf, { h:7, color:0x12303F });
FACE = { bg:'#FF9A5A', fg:'#0B0B0D' }; button('mxfrh', MXMX + 9.5, 48.5, 13, 8, 'RESET', 'Reset the high-pass', 0xFF9A5A).frst = 'h';
FACE = { bg:'#7FD0FF', fg:'#06131B' }; button('mxfrl', MXMX + 9.5, 100.5, 13, 8, 'RESET', 'Reset the low-pass', 0x7FD0FF).frst = 'l';
[['fh', 61.5, 0xFF8A2A, '#FF9A5A', 'High-pass on '], ['fl', 113.5, 0x4AB8FF, '#7FD0FF', 'Low-pass on ']].forEach(function(F){
  FACE = { bg:'#6E727C', fg:'#0B0B0D' };      // a mid-grey face: dark enough to read as off, light enough for the lamp colour to show when on
  for (var fi = 0; fi < MXNC; fi++){ var fb = button('mx' + F[0] + fi, MXMX + ((fi % 5) - 2) * 7.1, F[1] + Math.floor(fi / 5) * 8.2, 6.3, 7, String(fi + 1), F[4] + MXN[fi], F[2]); fb.ch = fi; fb.flt = F[0]; }
});
FACE = { bg:'#C9C7C0', fg:'#0B0B0D' };
vfader('mxmaster', MXMX, 234, 310, 'Master volume', MX.master, { color:0xC8343A, stripe:0xFFFFFF });
CTLIST.forEach(function(c){ if (c.dev === 'mx' && c.kind === 'knob') c.def = /^mxs[ab]/.test(c.id) || c.id === 'mxhpf' ? 0 : c.id === 'mxlpf' ? 1 : 0.5; else if (c.dev === 'mx' && c.kind === 'fader') c.def = c.id === 'mxmaster' ? 0.8 : 0.75; });
HOST = TRG; LX = lx; LZ = lz; DEV = null;
function mxDb(v){ var d = Math.round((v - 0.5) * 30); return (d > 0 ? '+' : '') + d + ' dB'; }
var MON = { ch:-1, mix:1, sig:'' };                           // a Snake's SOLO: what this player alone hears, on top of the shared mix
function mxHz(w, v){ return w === 'h' ? (v < 0.01 ? 10 : 20 * Math.pow(400, v)) : (v > 0.99 ? 21000 : 80 * Math.pow(250, v)); }      // HPF 20 Hz to 8 kHz, LPF 80 Hz to 20 kHz; fully off at the ends
function mxApply(){
  if (!AU.ready) return; var t = ac.currentTime;
  var anySolo = MX.ch.some(function(c){ return c.solo; });                    // with any channel soloed, only the soloed ones are heard
  MX.ch.forEach(function(c, i){ var C = AU.ch[i]; C.hi.gain.setTargetAtTime((c.hi - 0.5) * 30, t, 0.02); C.mid.gain.setTargetAtTime((c.mid - 0.5) * 30, t, 0.02); C.lo.gain.setTargetAtTime((c.lo - 0.5) * 30, t, 0.02);
    var mo = MON.ch < 0 || MON.ch === i ? 1 : MON.mix;
    C.fad.gain.setTargetAtTime(c.mute || (anySolo && !c.solo) ? 0 : Math.pow(c.vol, 1.7) * 1.63 * mo, t, 0.012); C.sa.gain.setTargetAtTime(c.sa * c.sa * 1.3 * mo, t, 0.02); C.sb.gain.setTargetAtTime(c.sb * c.sb * 1.3 * mo, t, 0.02); });
  MX.ch.forEach(function(c, i){ if (!(c.sc > 0.01)) AU.ch[i].duck.gain.setTargetAtTime(1, t, 0.03); });       // sidechain off: make sure the channel is fully open
  AU.master.gain.setTargetAtTime(Math.pow(MX.master, 1.7) * 1.46, t, 0.02);
  var fhz = mxHz('h', MX.hpf), flz = mxHz('l', MX.lpf);                         // master filters: only on the channels switched in under each knob
  AU.ch.forEach(function(C, i){ C.hp.frequency.setTargetAtTime(MX.fh[i] ? fhz : 10, t, 0.03); C.lp.frequency.setTargetAtTime(MX.fl[i] ? flz : 21000, t, 0.03); });
}
/* Sidechain: on every kick, a channel with its knob up dips fast and swells back. The knob is how deep the dip goes. */
function mxDuck(t){
  if (!AU.ready) return; var rel = clamp(60 / M.bpm * 0.22, 0.05, 0.16);
  for (var i = 1; i < MX.ch.length; i++){ var d = MX.ch[i].sc; if (!(d > 0.01)) continue; var g = AU.ch[i].duck.gain; try { g.cancelScheduledValues(t); g.setTargetAtTime(1 - d * 0.94, t, 0.005); g.setTargetAtTime(1, t + 0.04, rel); } catch (e) {} }
}
function mxSolo(i){ var c = MX.ch[i]; c.solo = c.solo ? 0 : 1; mxApply(); mxSaveSoon(); toast(MXN[i] + (c.solo ? ' solo' : ' solo off')); }
function mxMute(i){ var c = MX.ch[i]; c.mute = c.mute ? 0 : 1; mxApply(); mxSaveSoon(); toast(MXN[i] + (c.mute ? ' muted' : ' on')); }
function mxCtl(c){
  var id = c.id, v = c.v;
  if (id === 'mxmaster') MX.master = v; else if (id === 'mxhpf') MX.hpf = v; else if (id === 'mxlpf') MX.lpf = v;
  else { var k = id.indexOf('mxhi') === 0 ? 'hi' : id.indexOf('mxmid') === 0 ? 'mid' : id.indexOf('mxlo') === 0 ? 'lo' : id.indexOf('mxsa') === 0 ? 'sa' : id.indexOf('mxsb') === 0 ? 'sb' : id.indexOf('mxsc') === 0 ? 'sc' : 'vol'; if ((k === 'hi' || k === 'mid' || k === 'lo') && Math.abs(v - 0.5) < 0.025){ v = 0.5; } MX.ch[c.ch][k] = v; }
  mxApply(); mxSaveSoon();
}
function mxLabel(c){
  if (c.clr) return c.name + ' · click';
  if (c.frst) return c.name + ' · click';
  if (c.flt) return c.name + (MX[c.flt][c.ch] ? ' · on' : ' · off') + ' · click';
  if (c.id === 'mxhpf' || c.id === 'mxlpf'){ var fz = mxHz(c.id === 'mxhpf' ? 'h' : 'l', c.v); return c.name + ' ' + (fz <= 10 || fz >= 21000 ? 'off' : fz >= 1000 ? (fz / 1000).toFixed(1) + ' kHz' : Math.round(fz) + ' Hz') + ' · scroll or drag'; }
  if (c.solo) return c.name + (MX.ch[c.ch].solo ? ' · on' : '') + ' · click';
  if (c.kind === 'btn') return c.name + (MX.ch[c.ch].mute ? ' · muted' : '') + ' · key ' + (c.ch + 1);
  var id = c.id; if (id === 'mxmaster' || id.indexOf('mxvol') === 0 || id.indexOf('mxsa') === 0 || id.indexOf('mxsb') === 0) return c.name + ' ' + Math.round(c.v * 100) + ' · scroll or drag';
  return c.name + ' ' + mxDb(c.v) + ' · scroll or drag';
}
function mxPress(c){
  if (c.clr){ for (var i = 0; i < MXNC; i++){ MX.ch[i][c.clr] = 0; var k = CT['mx' + c.clr + i]; k.v = 0; k.show(); } mxApply(); mxSaveSoon(); toast('Send ' + (c.clr === 'sa' ? 'A' : 'B') + ' cleared'); return; }
  if (c.frst){ var fk = c.frst === 'h' ? 'hpf' : 'lpf', fa = c.frst === 'h' ? 'fh' : 'fl', fc = CT['mx' + fk]; MX[fk] = c.frst === 'h' ? 0 : 1; fc.v = MX[fk]; fc.show(); for (var fi2 = 0; fi2 < 10; fi2++) MX[fa][fi2] = 1; mxApply(); mxSaveSoon(); toast((c.frst === 'h' ? 'High-pass' : 'Low-pass') + ' reset · off, every channel switched in'); return; }
  if (c.flt){ MX[c.flt][c.ch] = MX[c.flt][c.ch] ? 0 : 1; mxApply(); mxSaveSoon(); toast((c.flt === 'fh' ? 'High-pass ' : 'Low-pass ') + (MX[c.flt][c.ch] ? 'on ' : 'off ') + MXN[c.ch]); return; }
  if (c.solo){ var h = MX.ch[c.ch]; h.solo = h.solo ? 0 : 1; mxApply(); mxSaveSoon(); toast(MXN[c.ch] + (h.solo ? ' solo' : ' solo off')); return; }
  if (c.ch != null) mxMute(c.ch);
}
function mxUpdate(now, dt){
  var buf = mxUpdate.buf || (mxUpdate.buf = new Float32Array(256)), i, k;
  /* meters: a muted channel (or one silenced because others are soloed) still shows what is coming in, all red; a soloed channel shows blue */
  var anySolo = MX.ch.some(function(c){ return c.solo; });
  for (i = 0; i <= MXNC; i++){
    var h = i < MXNC ? MX.ch[i] : null, off = !!h && (h.mute || (anySolo && !h.solo)), solo = !!h && anySolo && h.solo && !h.mute, pk = 0;
    if (AU.ready){ (i < MXNC ? (off ? AU.ch[i].pre : AU.ch[i].an) : AU.an).getFloatTimeDomainData(buf); for (k = 0; k < 256; k += 2){ var a = Math.abs(buf[k]); if (a > pk) pk = a; } if (off) pk *= Math.pow(h.vol, 1.7) * 1.63; }
    MX.lv[i] = Math.max(pk, MX.lv[i] - dt * 1.6);
    var db = MX.lv[i] > 0.0005 ? 20 * Math.log10(MX.lv[i]) : -90, n = clamp(Math.round((db + 42) / 4.2), 0, 10), segs = MXMET[i];
    for (k = 0; k < 10; k++) segs[k].color.setHex(k < n ? (off ? 0xFF2A3C : solo ? 0x3A8BFF : k >= 9 ? 0xFF2A3C : k >= 7 ? 0xFFE15A : 0x3BFF6A) : 0x15171C);
  }
  ['mxclra', 'mxclrb', 'mxfrh', 'mxfrl'].forEach(function(id){ var b = CT[id], bl = b.down ? 0.9 : 0.25; if (bl !== b.lit){ b.lit = bl; b.paintLit(); } var by = b.y0 - (b.down ? 0.003 : 0); if (b.m.position.y !== by) b.m.position.y = by; });
  for (i = 0; i < MXNC; i++){ ['fh', 'fl'].forEach(function(w){ var fb = CT['mx' + w + i], FL = MX[w][i] ? 1.9 : 0; if (fb.down) FL = Math.max(FL, 0.8); if (FL !== fb.lit){ fb.lit = FL; fb.paintLit(); } var fy = fb.y0 - (fb.down ? 0.002 : 0); if (fb.m.position.y !== fy) fb.m.position.y = fy; }); }
  for (i = 0; i < MXNC; i++){ var c = CT['mxmute' + i], L = MX.ch[i].mute ? 1 : 0; if (c.down) L = Math.max(L, 0.8); if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty;
    var so = CT['mxsolo' + i], SL = MX.ch[i].solo ? 1 : 0; if (so.down) SL = Math.max(SL, 0.8); if (SL !== so.lit){ so.lit = SL; so.paintLit(); } var sy = so.y0 - (so.down ? 0.003 : 0); if (so.m.position.y !== sy) so.m.position.y = sy; }
}
var NOP = function(){};
var DEVH = { mf:{ label:mfLabel, press:mfPress, release:mfRelease, ctl:mfCtl, turn:mfTurn }, bs:{ label:bsLabel, press:bsPress, release:bsRelease, ctl:bsCtl, turn:bsTurn }, mx:{ label:mxLabel, press:mxPress, release:NOP, ctl:mxCtl, turn:NOP },
  am:{ label:amLabel, press:amPress, release:NOP, ctl:amCtl, turn:amTurn }, tp:{ label:tpLabel, press:tpPress, release:tpRelease, ctl:tpCtl, turn:NOP } };

RESTORE['jambutek-studio-mix-v1'] = function(){ mxRestore(); for (var i = 0; i < MXNC; i++){ ['hi', 'mid', 'lo', 'sa', 'sb', 'sc', 'vol'].forEach(function(k){ var c = CT['mx' + k + i]; if (!c) return; c.v = MX.ch[i][k]; c.show(); }); } CT.mxmaster.v = MX.master; CT.mxmaster.show(); CT.mxhpf.v = MX.hpf; CT.mxhpf.show(); CT.mxlpf.v = MX.lpf; CT.mxlpf.show(); mxApply(); }; SAVENOW.push(mxSaveNow);
