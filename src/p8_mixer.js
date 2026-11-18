
/* ================= the mixer: one channel per instrument, three-band EQ, mute and fader each, and a master ================= */
var MXW = 394, MXD = 270, MXH = 1.1, MXTILT = 0.56;
function qx(u){ return (u - MXW / 2) * SC; }
function qz(u){ return (u - MXD / 2) * SC; }
var MXY = new THREE.Group(); MXY.position.set(MXPOS.x, MXH, MXPOS.z); scene.add(MXY);
var MXG = new THREE.Group(); MXG.rotation.x = MXTILT; MXY.add(MXG);
var MXN = ['DRUMS', 'SYNTH', 'BASS', 'BLIP', 'AMBI', 'TAPE', 'SHRU'], MXCOL = ['#FF2A3C', '#FF8A2A', '#4AA8FF', '#FF5A4A', '#C8C8FF', '#FFE15A', '#58C8FF'], MXX = [32, 80, 128, 176, 224, 272, 320], MXMX = 368, MXNC = 7;
var MX = { ch:MXX.map(function(){ return { hi:0.5, mid:0.5, lo:0.5, vol:0.75, mute:0 }; }), master:0.8, lv:[0, 0, 0, 0, 0, 0, 0, 0] };
(function(){ try { var s = JSON.parse(store('jambutek-studio-mix-v1') || 'null'); if (s && s.v === 1 && Array.isArray(s.ch) && s.ch.length <= 7){ s.ch.forEach(function(c, i){ if (!c) return; ['hi', 'mid', 'lo', 'vol'].forEach(function(k){ if (typeof c[k] === 'number') MX.ch[i][k] = clamp(c[k], 0, 1); }); MX.ch[i].mute = c.mute ? 1 : 0; }); if (typeof s.master === 'number') MX.master = clamp(s.master, 0, 1); } } catch (e) {} })();
var mxSaveT = null; function mxSaveSoon(){ clearTimeout(mxSaveT); mxSaveT = setTimeout(function(){ store('jambutek-studio-mix-v1', JSON.stringify({ v:1, ch:MX.ch, master:MX.master })); }, 800); }
var mxC = mk(1576, 1080), mxTex = null;
function paintMX(){
  var g = mxC.getContext('2d'); g.setTransform(4, 0, 0, 4, 0, 0);
  g.fillStyle = '#1A1C21'; g.fillRect(0, 0, MXW, MXD);
  for (var i = 0; i < 3000; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '120,130,150') + ',' + rnd(.02, .07) + ')'; g.fillRect(Math.random() * MXW, Math.random() * MXD, .5, .3); }
  function T(s, x, y, size, col, anton){ g.font = anton ? size + 'px ' + FONT : 'bold ' + size + 'px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.fillStyle = col || '#E6E6E2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
   T('MIX-7', 370, 11, 7, '#E0193C', true);
  MXX.forEach(function(x, i){
    g.fillStyle = '#23262C'; g.fillRect(x - 21, 19, 42, 244); g.fillStyle = MXCOL[i]; g.fillRect(x - 21, 19, 42, 2.5);
    g.fillStyle = '#E6E6E2'; g.fillRect(x - 17, 25, 34, 11); T(MXN[i], x, 30.8, 6.2, '#111318', true); T(String(i + 1), x - 15, 255, 7, MXCOL[i], true);
    [['HI', 52], ['MID', 88], ['LOW', 124]].forEach(function(a){ T(a[0], x, a[1] + 15, 4.2); g.fillStyle = '#B8B8B4'; g.fillRect(x - 0.3, a[1] - 13, 0.6, 2); });
    g.strokeStyle = 'rgba(216,216,216,.4)'; g.lineWidth = 0.3; for (var k = 0; k <= 10; k++){ var yy = 176 + k * 7.6; g.beginPath(); g.moveTo(x - 10, yy); g.lineTo(x - (k % 5 ? 5.5 : 4), yy); g.stroke(); }
    T('0', x - 13.5, 176 + 2.5 * 7.6, 3.4, '#B8B8B4');
  });
  g.fillStyle = '#23262C'; g.fillRect(MXMX - 19, 19, 38, 244); g.fillStyle = '#E0193C'; g.fillRect(MXMX - 19, 19, 38, 2.5); T('MASTER', MXMX, 30.8, 6.2, '#E6E6E2', true); T('OUT', MXMX, 162, 4);
  g.strokeStyle = 'rgba(216,216,216,.4)'; g.lineWidth = 0.3; for (var k2 = 0; k2 <= 10; k2++){ var y2 = 176 + k2 * 7.6; g.beginPath(); g.moveTo(MXMX - 10, y2); g.lineTo(MXMX - (k2 % 5 ? 5.5 : 4), y2); g.stroke(); }
  g.setTransform(1, 0, 0, 1, 0, 0); if (mxTex) mxTex.needsUpdate = true;
}
paintMX(); mxTex = smoothTex(mxC);
if (document.fonts && document.fonts.load) document.fonts.load('20px Anton').then(paintMX).catch(function(){});
var MXMET = [];
(function(){
  var W2 = MXW * SC, D2 = MXD * SC, TH = 0.09;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:mxTex, emissive:0xffffff, emissiveMap:mxTex, emissiveIntensity:0.5, shininess:8, specular:0x0A0A0A })); top.rotation.x = -Math.PI / 2; MXG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.012, TH, D2 + 0.012), new THREE.MeshPhongMaterial({ color:0x1B1D22, shininess:30, specular:0x222222, flatShading:true })); body.position.y = -TH / 2 - 0.0015; MXG.add(body);
  standFor(MXY, MXG, W2, D2, TH, MXH, MXTILT, 0.33); devBody(MXY, 'mx');
  BLOCKS.push([MXPOS.x - 0.52, MXPOS.x + 0.52, ROOM.z0, MXPOS.z + 0.34]);
  // level meters: a column of segments beside each fader
  var geo = new THREE.BoxGeometry(0.007, 0.002, 0.009);
  MXX.concat([MXMX]).forEach(function(x, i){ var segs = []; for (var k = 0; k < 10; k++){ var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color:0x15171C })); m.position.set(qx(x + 13), 0.0012, qz(250 - k * 7.6)); m.userData.noShadow = true; MXG.add(m); segs.push(m.material); } MXMET.push(segs); });
})();
HOST = MXG; LX = qx; LZ = qz; DEV = 'mx';
MXX.forEach(function(x, i){
  knob('mxhi' + i, x, 52, 6.2, MXN[i] + ' high', MX.ch[i].hi, { h:8 }).ch = i; knob('mxmid' + i, x, 88, 6.2, MXN[i] + ' mid', MX.ch[i].mid, { h:8 }).ch = i; knob('mxlo' + i, x, 124, 6.2, MXN[i] + ' low', MX.ch[i].lo, { h:8 }).ch = i;
  button('mxmute' + i, x, 152, 16, 9, 'MUTE', MXN[i] + ' mute', 0xFF2A3C).ch = i;
  vfader('mxvol' + i, x, 176, 252, MXN[i] + ' volume', MX.ch[i].vol, { stripe:new THREE.Color(MXCOL[i]).getHex() }).ch = i;
});
vfader('mxmaster', MXMX, 176, 252, 'Master volume', MX.master, { color:0xC8343A, stripe:0xFFFFFF });
CTLIST.forEach(function(c){ if (c.dev === 'mx' && c.kind === 'knob') c.def = 0.5; else if (c.dev === 'mx' && c.kind === 'fader') c.def = c.id === 'mxmaster' ? 0.8 : 0.75; });
HOST = TRG; LX = lx; LZ = lz; DEV = null;
function mxDb(v){ var d = Math.round((v - 0.5) * 30); return (d > 0 ? '+' : '') + d + ' dB'; }
function mxApply(){
  if (!AU.ready) return; var t = ac.currentTime;
  MX.ch.forEach(function(c, i){ var C = AU.ch[i]; C.hi.gain.setTargetAtTime((c.hi - 0.5) * 30, t, 0.02); C.mid.gain.setTargetAtTime((c.mid - 0.5) * 30, t, 0.02); C.lo.gain.setTargetAtTime((c.lo - 0.5) * 30, t, 0.02);
    C.fad.gain.setTargetAtTime(c.mute ? 0 : Math.pow(c.vol, 1.7) * 1.63, t, 0.012); });
  AU.master.gain.setTargetAtTime(Math.pow(MX.master, 1.7) * 1.46, t, 0.02);
}
function mxMute(i){ var c = MX.ch[i]; c.mute = c.mute ? 0 : 1; mxApply(); mxSaveSoon(); toast(MXN[i] + (c.mute ? ' muted' : ' on')); }
function mxCtl(c){
  var id = c.id, v = c.v;
  if (id === 'mxmaster') MX.master = v;
  else { var k = id.indexOf('mxhi') === 0 ? 'hi' : id.indexOf('mxmid') === 0 ? 'mid' : id.indexOf('mxlo') === 0 ? 'lo' : 'vol'; if (k !== 'vol' && Math.abs(v - 0.5) < 0.025){ v = 0.5; } MX.ch[c.ch][k] = v; }
  mxApply(); mxSaveSoon();
}
function mxLabel(c){
  if (c.kind === 'btn') return c.name + (MX.ch[c.ch].mute ? ' · muted' : '') + ' · key ' + (c.ch + 1);
  var id = c.id; if (id === 'mxmaster' || id.indexOf('mxvol') === 0) return c.name + ' ' + Math.round(c.v * 100) + ' · scroll or drag';
  return c.name + ' ' + mxDb(c.v) + ' · scroll or drag';
}
function mxPress(c){ if (c.ch != null) mxMute(c.ch); }
function mxUpdate(now, dt){
  var buf = mxUpdate.buf || (mxUpdate.buf = new Float32Array(256)), i, k;
  for (i = 0; i <= MXNC; i++){
    var pk = 0; if (AU.ready){ (i < MXNC ? AU.ch[i].an : AU.an).getFloatTimeDomainData(buf); for (k = 0; k < 256; k += 2){ var a = Math.abs(buf[k]); if (a > pk) pk = a; } }
    MX.lv[i] = Math.max(pk, MX.lv[i] - dt * 1.6);
    var db = MX.lv[i] > 0.0005 ? 20 * Math.log10(MX.lv[i]) : -90, n = clamp(Math.round((db + 42) / 4.2), 0, 10), segs = MXMET[i];
    for (k = 0; k < 10; k++) segs[k].color.setHex(k < n ? (k >= 9 ? 0xFF2A3C : k >= 7 ? 0xFFE15A : 0x3BFF6A) : 0x15171C);
  }
  for (i = 0; i < MXNC; i++){ var c = CT['mxmute' + i], L = MX.ch[i].mute ? 1 : 0; if (c.down) L = Math.max(L, 0.8); if (L !== c.lit){ c.lit = L; c.paintLit(); } var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty; }
}
var NOP = function(){};
var DEVH = { mf:{ label:mfLabel, press:mfPress, release:mfRelease, ctl:mfCtl, turn:mfTurn }, bs:{ label:bsLabel, press:bsPress, release:bsRelease, ctl:bsCtl, turn:bsTurn }, mx:{ label:mxLabel, press:mxPress, release:NOP, ctl:mxCtl, turn:NOP },
  am:{ label:amLabel, press:amPress, release:NOP, ctl:amCtl, turn:amTurn }, tp:{ label:tpLabel, press:tpPress, release:tpRelease, ctl:tpCtl, turn:NOP } };
// everything is plugged into the mixer, and the mixer into the monitors
(function(){
  var zb = ROOM.z0 + 0.18, mxB = [MXPOS.x, 0.86, MXPOS.z - 0.3];
  [[TRPOS.x, -0.03], [MFPOS.x, 0], [BSPOS.x, 0.03], [MBPOS.x, 0.05], [AMPOS.x, 0.07], [TPPOS.x, 0.09], [SHPOS.x, 0.11]].forEach(function(d, i){ cable([[d[0], 0.8, TRPOS.z - 0.28], [d[0], 0.3, zb + 0.05], [d[0] + 0.1, 0.012, zb + i * 0.03], [MXPOS.x - 0.3 + i * 0.05, 0.012, zb + i * 0.03], [MXPOS.x - 0.12 + i * 0.06, 0.35, zb + 0.04], [mxB[0] - 0.14 + i * 0.05, mxB[1], mxB[2]]], 0.006); });
  [-1, 1].forEach(function(s){ cable([[mxB[0] + 0.26 + s * 0.03, mxB[1], mxB[2]], [MXPOS.x + 0.2, 0.3, zb + 0.03], [MXPOS.x + (s > 0 ? 0.3 : -0.4), 0.012, zb - 0.06 + s * 0.03], [s * 4.3, 0.012, zb - 0.06 + s * 0.03], [s * 4.35, 0.012, 0.6], [s * 4.3, 0.5, 0.95], [s * 4.25, 1.05, 0.98]], 0.007); });
})();
