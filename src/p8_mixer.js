
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
/* the JBMX-10's panel, painted here: small labels in Merchant Copy, the channel name tags, MASTER and the name in Pixel Game */
var MXTAG = ['DRUMS', 'SYNTH', 'BASS', 'BLIP', 'AMBIKA', 'TAPE', 'SHRUTHI', 'CHORD', 'SCRATCH', 'KIT'], MXTAGC = ['#CF2736', '#FF8A2A', '#4AA8FF', '#F85849', '#C8C8FF', '#F8DB58', '#58C8FF', '#FF6AB0', '#35D8B8', '#F5C518'];
var MXPPM = 7.6, mxC = mk(Math.round(MXW * MXPPM), Math.round(MXD * MXPPM)), mxTex = null;      /* 7.6 px per mm keeps the picture under 4096 px wide */
function paintMX(){
  var g = mxC.getContext('2d'); g.setTransform(MXPPM, 0, 0, MXPPM, 0, 0);
  g.fillStyle = '#131313'; g.fillRect(0, 0, MXW, MXD);      /* the plate: the same flat black as the DRUMBU-8's black skin */
  function T(s, x, y, size, col, font){ g.font = size + 'px ' + (font === 'px' ? '"Pixel Game", monospace' : '"Merchant Copy", "Courier New", monospace'); g.fillStyle = col || '#E6E6E2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  function rr(x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  T('JBMX-10', MXMX, 11, 12, '#E6E6E2', 'px');
  MXX.forEach(function(x, i){
    g.fillStyle = '#23262C'; g.fillRect(x - 21, 19, 42, 302); g.fillStyle = MXCOL[i]; g.fillRect(x - 21, 19, 42, 2.5);
    if (i){ T('SIDE', x - 12.5, 6.8, 4.6, '#C8C8C4'); T('CHAIN', x - 12.5, 11.6, 4.6, '#C8C8C4'); }
    rr(x - 16.4, 25.2, 32.8, 10.9, 1.6); g.fillStyle = MXTAGC[i]; g.fill(); g.lineWidth = 0.62; g.strokeStyle = '#000'; g.stroke();      /* the name tag */
    T(MXTAG[i], x, 31, 9.5, '#000', 'px'); T(String(i + 1), x - 15, 313, 8.5, MXCOL[i]);
    [['HI', 52], ['MID', 88], ['LOW', 124]].forEach(function(a){ T(a[0], x, a[1] + 14.4, 6.6); g.fillStyle = '#B8B8B4'; g.fillRect(x - 0.3, a[1] - 13, 0.6, 2); });
    [['A', 157, '#57FFA8'], ['B', 186, '#FFFF5E']].forEach(function(a){ T('SEND', x - 13, a[1] - 3.4, 4.6, '#C8C8C4'); T(a[0], x - 13, a[1] + 2.8, 7, a[2]); });
    g.strokeStyle = 'rgba(216,216,216,.4)'; g.lineWidth = 0.3; for (var k = 0; k <= 10; k++){ var yy = 234 + k * 7.6; g.beginPath(); g.moveTo(x - 10, yy); g.lineTo(x - (k % 5 ? 5.5 : 4), yy); g.stroke(); }
    T('0', x - 13.5, 234 + 2.5 * 7.6, 5, '#C8C8C4');
  });
  g.fillStyle = '#23262C'; g.fillRect(MXMX - 19, 19, 38, 302); g.fillStyle = '#FFFFFF'; g.fillRect(MXMX - 19, 19, 38, 2.5); rr(MXMX - 16.4, 25.2, 32.8, 10.9, 1.6); g.fillStyle = '#FFFFFF'; g.fill(); g.lineWidth = 0.62; g.strokeStyle = '#000'; g.stroke(); T('MASTER', MXMX, 31, 9.5, '#000', 'px');      /* a white tag, like the channels' */
  T('HPF', MXMX, 42, 5.4, '#F3A15F'); T('LPF', MXMX, 90, 5.4, '#5CB3F1'); T('SEND A', MXMX, 147, 5.4, '#57FFA8'); T('SEND B', MXMX, 176, 5.4, '#FFFF5E'); T('OUT', MXMX, 220, 6.6);
  g.strokeStyle = 'rgba(216,216,216,.4)'; g.lineWidth = 0.3; for (var k2 = 0; k2 <= 10; k2++){ var y2 = 234 + k2 * 7.6; g.beginPath(); g.moveTo(MXMX - 10, y2); g.lineTo(MXMX - (k2 % 5 ? 5.5 : 4), y2); g.stroke(); }
  g.setTransform(1, 0, 0, 1, 0, 0); if (mxTex) mxTex.needsUpdate = true;
}
paintMX(); mxTex = smoothTex(mxC);
if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('20px "Pixel Game"'), document.fonts.load('20px "Merchant Copy"')]).then(paintMX).catch(function(){});
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
/* the JBMX-10's controls, from the designer's sheet (8 px per mm): textured knobs, word buttons in Pixel Game with a black edge */
var KBM = KB; KB = { host:MXG, x:function(px){ return qx(px / 8); }, z:function(py){ return qz(py / 8); }, px:SC / 8, faces:TRFACES };
var MXPTR = '#0B0B0D';
function mxBtn(id, cx, cy, w, h, text, size, name, bg){ return spButton(id, [cx * 8 - w / 2, cy * 8 - h / 2, w, h], name, { bg:bg, text:[text], size:size }); }
MXX.forEach(function(x, i){
  [['hi', 52, ' high'], ['mid', 88, ' mid'], ['lo', 124, ' low']].forEach(function(a){ trKnob('mx' + a[0] + i, x * 8, a[1] * 8, 'mxeq', MXCOL[i], MXPTR, MXN[i] + a[2], MX.ch[i][a[0]]).ch = i; });
  if (i) trKnob('mxsc' + i, (x + 3) * 8, 9.6 * 8, 'mxsc', '#FFFFFF', MXPTR, MXN[i] + ' sidechain (ducks to the kick)', MX.ch[i].sc).ch = i;
  trKnob('mxsa' + i, (x + 3) * 8, 157 * 8, 'mxsend', '#5CFFAD', MXPTR, MXN[i] + ' send A (echo)', MX.ch[i].sa).ch = i;
  trKnob('mxsb' + i, (x + 3) * 8, 186 * 8, 'mxsend', '#FFFF61', MXPTR, MXN[i] + ' send B (reverb)', MX.ch[i].sb).ch = i;
  mxBtn('mxmute' + i, x - 9.6, 213.5, 135.9, 134.7, 'MUTE', 62, MXN[i] + ' mute', '#FFFFFF').ch = i;
  var so = mxBtn('mxsolo' + i, x + 9.6, 213.5, 135.9, 134.7, 'SOLO', 62, MXN[i] + ' solo', '#FFFFFF'); so.ch = i; so.solo = true;
  vfader('mxvol' + i, x, 234, 310, MXN[i] + ' volume', MX.ch[i].vol, { color:new THREE.Color(MXCOL[i]).getHex(), stripe:0x1A1C21, w:0.0242, edge:true }).ch = i;
});
spButton('mxclra', [MXMX * 8 - 97.5, 1222.5, 202, 80], 'Clear send A on every channel', { bg:'#57FFA8', text:['CLEAR'], size:66 }).clr = 'sa';      /* send A feeds the echo */
spButton('mxclrb', [MXMX * 8 - 97.5, 1457, 202, 80], 'Clear send B on every channel', { bg:'#FFFF5E', text:['CLEAR'], size:66 }).clr = 'sb';      /* send B feeds the reverb */
/* the two master filters, above the sends: a knob each, and under it two rows of five small numbered buttons that switch the filter in
   for those channels (white when off, lit in the filter's colour when on) */
trKnob('mxhpf', (MXMX - 7) * 8, 53.05 * 8, 'mxf', '#F3A15F', MXPTR, 'Master high-pass', MX.hpf);      /* (the HPF section sits 4 mm lower, clear of the MASTER tag) */ trKnob('mxlpf', (MXMX - 7) * 8, 101 * 8, 'mxf', '#5CB3F1', MXPTR, 'Master low-pass', MX.lpf);
spButton('mxfrh', [MXMX * 8 + 24, 388.5, 105.5, 71], 'Reset the high-pass', { bg:'#F3A15F', text:['RESET'], size:41 }).frst = 'h';
spButton('mxfrl', [MXMX * 8 + 24, 778.5, 105.5, 71], 'Reset the low-pass', { bg:'#5CB3F1', text:['RESET'], size:41 }).frst = 'l';
[['fh', 65.5, 'High-pass on '], ['fl', 113.5, 'Low-pass on ']].forEach(function(F){
  for (var fi = 0; fi < MXNC; fi++){ var fb = mxBtn('mx' + F[0] + fi, MXMX + ((fi % 5) - 2) * 7.1, F[1] + Math.floor(fi / 5) * 8.2, 50.4, 56, String(fi + 1), 40, F[2] + MXN[fi], '#FFFFFF'); fb.ch = fi; fb.flt = F[0]; }
});
KB = KBM;
vfader('mxmaster', MXMX, 234, 310, 'Master volume', MX.master, { color:0xFFFFFF, stripe:0x1A1C21, w:0.0242, edge:true });
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
/* solo is one channel at a time: soloing another moves the solo there. Hold Shift to group several soloed channels (Shift + click toggles one in or out) */
var MXSHIFT = false;
function mxSolo(i, group){
  var c = MX.ch[i]; if (!c) return; if (group === undefined) group = MXSHIFT;
  if (group) c.solo = c.solo ? 0 : 1;
  else { var others = MX.ch.some(function(h, k){ return k !== i && h.solo; }); MX.ch.forEach(function(h, k){ h.solo = k === i ? (c.solo && !others ? 0 : 1) : 0; }); }
  mxApply(); mxSaveSoon(); var n = MX.ch.filter(function(h){ return h.solo; }).length;
  toast(MXN[i] + (c.solo ? (n > 1 ? ' solo · ' + n + ' grouped' : ' solo') : ' solo off'));
}
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
  if (c.solo){ mxSolo(c.ch); return; }
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
  function sink(b, d){ b.paintLit(); var by = b.y0 - (b.down ? d : 0); if (b.m.position.y !== by) b.m.position.y = by; }
  ['mxclra', 'mxclrb', 'mxfrh', 'mxfrl'].forEach(function(id){ sink(CT[id], 0.003); });
  for (i = 0; i < MXNC; i++){
    CT['mxfh' + i].setBg(MX.fh[i] ? '#F3A15F' : '#FFFFFF'); sink(CT['mxfh' + i], 0.002); CT['mxfl' + i].setBg(MX.fl[i] ? '#5CB3F1' : '#FFFFFF'); sink(CT['mxfl' + i], 0.002);
    CT['mxmute' + i].setBg(MX.ch[i].mute ? '#FF4B3D' : '#FFFFFF'); sink(CT['mxmute' + i], 0.003);      /* MUTE: white, red while the channel is muted */
    CT['mxsolo' + i].setBg(MX.ch[i].solo ? '#3270E7' : '#FFFFFF'); sink(CT['mxsolo' + i], 0.003);      /* SOLO: white, blue while soloed */
  }
}
var NOP = function(){};
var DEVH = { mf:{ label:mfLabel, press:mfPress, release:mfRelease, ctl:mfCtl, turn:mfTurn }, bs:{ label:bsLabel, press:bsPress, release:bsRelease, ctl:bsCtl, turn:bsTurn }, mx:{ label:mxLabel, press:mxPress, release:NOP, ctl:mxCtl, turn:NOP },
  am:{ label:amLabel, press:amPress, release:NOP, ctl:amCtl, turn:amTurn }, tp:{ label:tpLabel, press:tpPress, release:tpRelease, ctl:tpCtl, turn:NOP } };

RESTORE['jambutek-studio-mix-v1'] = function(){ mxRestore(); for (var i = 0; i < MXNC; i++){ ['hi', 'mid', 'lo', 'sa', 'sb', 'sc', 'vol'].forEach(function(k){ var c = CT['mx' + k + i]; if (!c) return; c.v = MX.ch[i][k]; c.show(); }); } CT.mxmaster.v = MX.master; CT.mxmaster.show(); CT.mxhpf.v = MX.hpf; CT.mxhpf.show(); CT.mxlpf.v = MX.lpf; CT.mxlpf.show(); mxApply(); }; SAVENOW.push(mxSaveNow);
