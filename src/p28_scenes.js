
/* ================= scenes: four snapshots of the whole room, in a box under the echo and the reverb =================
   A scene holds everything a jam holds except the drum machine's sixteen pattern memories and the tempo: every machine's sounds
   and settings, the Snakes, the mixer, the effects, the visuals, and which drum pattern and variations are playing.
     - click an empty slot: the room as it is now is stored there
     - click a stored slot: the room switches to it (on the next bar if the sequence is running). A scene is a snapshot: it stays as it
       was stored. To store it again, clear it and click it.
     - Shift + click two or more slots: they play one after the other, each for the number of bars on the BARS button
     - COPY, then a slot, then another slot: copies the first into the second
     - hold CLEAR: empties the scene you are on
   Switching only changes what is different between the two scenes, so it does not disturb machines that stay the same. */
var SCD = 58, SCOFF = 0.45;
function scx(u){ return (u - ECW / 2) * SC; }
function scz(u){ return (u - SCD / 2) * SC + SCOFF; }
var SCKEY = 'jambutek-studio-scenes-v1', SCSLOT = 'jambutek-studio-scene-v1-', SCBARS = [1, 2, 4, 8], SCHOLD = 900;
var SCN = { cur:-1, next:-1, at:-1, mine:false, chain:[], anchor:0, bars:4, slots:[null, null, null, null], raw:['', '', '', ''], copy:0, src:-1, hold:null };

function scMetaSave(){ store(SCKEY, JSON.stringify({ v:1, cur:SCN.cur, chain:SCN.chain, anchor:SCN.anchor, bars:SCN.bars })); }
function scSlotSave(i){ SCN.raw[i] = SCN.slots[i] ? JSON.stringify(SCN.slots[i]) : ''; store(SCSLOT + i, SCN.raw[i]); }
function scSlotRead(i){ var r = store(SCSLOT + i) || ''; SCN.raw[i] = r; SCN.slots[i] = null; if (r){ try { var o = JSON.parse(r); if (o && typeof o === 'object') SCN.slots[i] = o; } catch (e) {} } if (!SCN.slots[i]) SCN.raw[i] = ''; }
function scMetaRead(){
  try { var s = JSON.parse(store(SCKEY) || 'null'); if (!s || s.v !== 1) return;
    SCN.cur = s.cur >= 0 && s.cur < 4 ? s.cur | 0 : -1; SCN.bars = SCBARS.indexOf(s.bars) >= 0 ? s.bars : 4; SCN.anchor = s.anchor | 0;
    SCN.chain = Array.isArray(s.chain) ? s.chain.filter(function(x, i, l){ return x === (x | 0) && x >= 0 && x < 4 && l.indexOf(x) === i; }) : [];
  } catch (e) {}
}
[0, 1, 2, 3].forEach(scSlotRead); scMetaRead();

/* the room as it stands, in the shape a scene keeps */
function scCapture(){
  var st = roomState(), out = {};
  Object.keys(st).forEach(function(k){
    if (k.indexOf('jambutek-studio-scene') === 0) return;
    if (k === SAVE_KEY){ try { var s = JSON.parse(st[k]); delete s.PAT; delete s.bpm; out['tr:m'] = JSON.stringify(s); } catch (e) {} return; }
    out[k] = st[k];
  });
  return out;
}
function scTr(s){                                               // the drum machine's part of a scene: which pattern, the variation chain, mutes, knobs. Never the tempo.
  var pt = clamp(s.pat | 0, 0, 15); if (pt !== M.pat){ M.pat = pt; M.nextPat = -1; M.varSel = [0]; M.varIx = 0; M.editVar = 0; } var ev = M.editVar; if (trVars(s)) M.editVar = ev;
  if (Array.isArray(s.mutes) && s.mutes.length === 11) M.mutes = s.mutes.slice(); M.fxOn = !!s.fxOn; M.fillOn = !!s.fillOn;
  Object.keys(s.kn || {}).forEach(function(id){ var c = CT[id], v = s.kn[id]; if (c && !c.dev && typeof v === 'number' && Math.abs(c.v - v) > 0.0005){ c.v = clamp(v, 0, 1); try { onCtl(c); } catch (e) {} c.show(); } });
  trsLoad(s);
  applyMix(); dispDirty = true;
}
/* mine: this player asked for the switch, so what changed is also kept and passed to the room like any other change. Otherwise the
   switch is this browser following along (it has the same scenes), and the copies the asker sends afterwards are skipped. */
function scApply(sc, mine){
  if (!sc) return 0; var cur = scCapture(), n = 0, net = typeof MP !== 'undefined' && MP ? MP : null, f0 = net && net.force;
  if (net && mine) net.force = true;
  try {
    Object.keys(sc).forEach(function(k){
      if (typeof sc[k] !== 'string' || sc[k] === cur[k]) return;
      if (k === 'tr:m'){ try { scTr(JSON.parse(sc[k])); n++; if (mine) save(); else if (net) net.scSkip[k] = sc[k]; } catch (e) {} return; }
      if (!RESTORE[k] || k.indexOf('jambutek-studio-scene') === 0) return;
      REMOTE[k] = sc[k]; try { RESTORE[k](); n++; } catch (e) {} finally { delete REMOTE[k]; }
      if (mine) store(k, sc[k]); else if (net) net.scSkip[k] = sc[k];
    });
  } finally { if (net && mine) net.force = f0; }
  return n;
}
function scBar(){ if (!M.playing || !ac) return -1; var sd = stepDur(); return Math.floor((SEQ.n16 - (SEQ.nextT - ac.currentTime) / sd + 0.3 / sd) / 16); }      // the bar about to be scheduled
function scDo(j, mine){ var a = typeof MP !== 'undefined' && MP ? MP.applying : false; if (typeof MP !== 'undefined' && MP && !mine) MP.applying = true; try { scApply(SCN.slots[j], mine); } finally { if (typeof MP !== 'undefined' && MP && !mine) MP.applying = a; }
  SCN.cur = j; SCN.next = -1; SCN.at = -1; if (mine) scMetaSave(); }
function scNet(j, at){ if (typeof MP !== 'undefined' && MP && MP.scene) MP.scene(j, at); }
function scRemote(j, at){ if (!(j >= 0 && j < 4) || !SCN.slots[j]) return; SCN.chain = []; if (at >= 0 && M.playing){ SCN.next = j; SCN.at = at; SCN.mine = false; } else scDo(j, false); }
function scGo(j){                                               // this player asks for scene j
  SCN.chain = [];
  if (M.playing){ SCN.next = j; SCN.at = scBar() + 1; SCN.mine = true; scNet(j, SCN.at); toast('Scene ' + (j + 1) + ' on the next bar'); }
  else { scDo(j, true); scNet(j, -1); toast('Scene ' + (j + 1)); }
}
function scPress(c){
  if (c.id === 'scbars'){ SCN.bars = SCBARS[(SCBARS.indexOf(SCN.bars) + 1) % SCBARS.length]; c.repaintFace('x' + SCN.bars); scMetaSave(); toast('Chained scenes play ' + SCN.bars + (SCN.bars === 1 ? ' bar' : ' bars') + ' each'); return; }
  if (c.id === 'sccopy'){ SCN.copy = SCN.copy ? 0 : 1; SCN.src = -1; toast(SCN.copy ? 'Copy: click the scene to copy from' : 'Copy cancelled'); return; }
  if (c.id === 'scclear'){ if (SCN.cur < 0){ toast('No scene is selected'); return; } SCN.hold = { c:c, t0:performance.now(), done:false }; return; }
  var j = c.slot, has = !!SCN.slots[j];
  if (SCN.copy === 1){ if (!has){ toast('That scene is empty'); return; } SCN.src = j; SCN.copy = 2; toast('Copy scene ' + (j + 1) + ': now click where it should go'); return; }
  if (SCN.copy === 2){
    if (j === SCN.src){ SCN.copy = 0; SCN.src = -1; toast('Copy cancelled'); return; }
    SCN.slots[j] = JSON.parse(SCN.raw[SCN.src]); scSlotSave(j); toast('Scene ' + (SCN.src + 1) + ' copied to scene ' + (j + 1)); SCN.copy = 0; SCN.src = -1; scMetaSave(); return;
  }
  if (M.shift){                                                // Shift: in or out of the chain
    if (!has){ toast('That scene is empty'); return; } var ix = SCN.chain.indexOf(j);
    if (ix >= 0) SCN.chain.splice(ix, 1); else { if (!SCN.chain.length && SCN.cur >= 0 && SCN.cur !== j && SCN.slots[SCN.cur]) SCN.chain.push(SCN.cur); SCN.chain.push(j); }
    if (SCN.chain.length >= 2){ var b = scBar(), i0 = Math.max(0, SCN.chain.indexOf(SCN.cur)); SCN.anchor = (b < 0 ? 0 : b + 1) - i0 * SCN.bars; }
    scMetaSave(); toast(SCN.chain.length >= 2 ? 'Scenes ' + SCN.chain.map(function(x){ return x + 1; }).join(' → ') + ', ' + SCN.bars + (SCN.bars === 1 ? ' bar' : ' bars') + ' each' : SCN.chain.length ? 'Shift + click another scene to chain them' : 'Scene chain off'); return;
  }
  if (!has){ SCN.slots[j] = scCapture(); scSlotSave(j); SCN.cur = j; SCN.next = -1; SCN.chain = []; scMetaSave(); toast('Scene ' + (j + 1) + ' stored'); return; }
    scGo(j);
}
function scRelease(c){ if (SCN.hold && SCN.hold.c === c){ if (!SCN.hold.done) toast('Keep holding to clear the scene'); SCN.hold = null; } }
function scLabel(c){
  if (c.id === 'scbars') return c.name + ' · ' + SCN.bars + ' · click';
  if (c.id === 'sccopy') return c.name + ' · click, then two scenes';
  if (c.id === 'scclear') return c.name + ' · press and hold';
  var j = c.slot; return 'Scene ' + (j + 1) + (j === SCN.cur ? ' · on' : SCN.slots[j] ? ' · stored' : ' · empty') + (SCN.chain.indexOf(j) >= 0 ? ' · in the chain' : '') + ' · click, Shift + click to chain';
}

/* ---- the box ---- */
var scC = mk(ECW * 6, SCD * 6), scTex = null;
function paintSC(){
  var g = scC.getContext('2d'); g.setTransform(6, 0, 0, 6, 0, 0);
  g.fillStyle = '#1D1F27'; g.fillRect(0, 0, ECW, SCD);
  for (var i = 0; i < 500; i++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '170,180,200') + ',' + rnd(.02, .06) + ')'; g.fillRect(Math.random() * ECW, Math.random() * SCD, .5, .3); }
  g.strokeStyle = '#E6E6E2'; g.lineWidth = 0.6; g.strokeRect(4, 4, ECW - 8, SCD - 8);
  g.fillStyle = '#E6E6E2'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = '8px ' + FONT; g.fillText('SCENES', 9, 13.5);
  g.font = 'bold 3.2px "Helvetica Neue", Helvetica, Arial, sans-serif'; g.textAlign = 'right'; g.fillStyle = 'rgba(230,230,226,.6)'; g.fillText('SHIFT + CLICK TO CHAIN', 119, 13.8); g.textAlign = 'center'; g.fillText('BARS', 154, 13.8);
  g.setTransform(1, 0, 0, 1, 0, 0); if (scTex) scTex.needsUpdate = true;
}
paintSC(); scTex = smoothTex(scC);
if (document.fonts && document.fonts.load) document.fonts.load('20px Anton').then(paintSC).catch(function(){});
(function(){
  var W2 = ECW * SC, D2 = SCD * SC;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x8C8C8C, map:scTex, emissive:0xffffff, emissiveMap:scTex, emissiveIntensity:0.5, shininess:8, specular:0x0A0A0A })); top.rotation.x = -Math.PI / 2; top.position.z = SCOFF; ECG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.012, ECTH, D2 + 0.012), new THREE.MeshPhongMaterial({ color:0x14151B, shininess:30, specular:0x222222, flatShading:true })); body.position.set(0, -ECTH / 2 - 0.0015, SCOFF); ECG.add(body);
  solid(top, 'trbody'); solid(body, 'trbody'); top.userData.dev = body.userData.dev = 'ec';
})();
HOST = ECG; LX = scx; LZ = scz; DEV = 'ec';
var SCBTN = [];
FACE = { bg:'#6E727C', fg:'#0B0B0D' };                        // grey when empty; the green lamp shows through when a scene is stored
[0, 1, 2, 3].forEach(function(j){ var b = button('scslot' + j, 21 + j * 27.5, 35, 24, 28, String(j + 1), 'Scene ' + (j + 1), 0x2BE85A); b.scn = true; b.slot = j; SCBTN.push(b); });
FACE = { bg:'#F2B544', fg:'#141005' }; var scCopyB = button('sccopy', 131, 27, 20, 11, 'COPY', 'Copy a scene', 0xF2B544); scCopyB.scn = true;
FACE = { bg:'#E53A3A', fg:'#FFFFFF' }; var scClearB = button('scclear', 131, 43, 20, 11, 'CLEAR', 'Clear this scene', 0xFF2A3C); scClearB.scn = true;
/* while CLEAR is held a bright bar fills across it from the left, so you can see how long is left */
var scFill = new THREE.Mesh(new THREE.PlaneGeometry(20 * SC, 11 * SC), new THREE.MeshBasicMaterial({ color:0xFFFFFF, transparent:true, opacity:0.78, depthWrite:false })); scFill.rotation.x = -Math.PI / 2; scFill.visible = false; scFill.userData.noShadow = true; scFill.renderOrder = 5; ECG.add(scFill);
FACE = { bg:'#C9C7C0', fg:'#0B0B0D' }; var scBarsB = button('scbars', 154, 35, 16, 28, 'x' + SCN.bars, 'Bars per chained scene', 0xC9C7C0); scBarsB.scn = true;
HOST = TRG; LX = lx; LZ = lz; DEV = null;
(function(){ var E = DEVH.ec; DEVH.ec = { label:function(c){ return c.scn ? scLabel(c) : E.label(c); }, press:function(c){ return c.scn ? scPress(c) : E.press(c); }, release:function(c){ return c.scn ? scRelease(c) : E.release(c); }, ctl:E.ctl, turn:E.turn }; })();

function scUpdate(now, dt){
  var b = scBar();
  if (SCN.next >= 0 && (b < 0 || b >= SCN.at)) scDo(SCN.next, SCN.mine);                                   // a waiting switch lands on the bar (or at once if the sequence stops)
  else if (SCN.next < 0 && SCN.chain.length >= 2 && b >= SCN.anchor && b >= 0){                              // the chain: every browser works it out from the shared bar count
    var want = SCN.chain[Math.floor((b - SCN.anchor) / SCN.bars) % SCN.chain.length]; if (want !== SCN.cur && SCN.slots[want]) scDo(want, false);
  }
  if (SCN.hold && !SCN.hold.done && now - SCN.hold.t0 >= SCHOLD){ SCN.hold.done = true; var j = SCN.cur;
    if (j >= 0){ SCN.slots[j] = null; scSlotSave(j); var ix = SCN.chain.indexOf(j); if (ix >= 0) SCN.chain.splice(ix, 1); SCN.cur = -1; SCN.next = -1; scMetaSave(); toast('Scene ' + (j + 1) + ' cleared'); } }
  var bl = Math.sin(now * 0.016) > 0 ? 1 : 0, sl = 0.45 + Math.sin(now * 0.006) * 0.35;
  var beat = 1; if (M.playing && ac){ var sdb = stepDur(), ph = (((SEQ.n16 - (SEQ.nextT - ac.currentTime) / sdb) / 4) % 1 + 1) % 1; beat = ph < 0.5 ? 1 : 0; }      // on for the first half of every beat
  SCBTN.forEach(function(c){ var j = c.slot, has = !!SCN.slots[j], L = has ? 0.75 : 0;                       // empty: grey. stored: green. the one that is on: bright, flashing on the beat while the sequence plays
    if (j === SCN.cur && has) L = beat ? 2.1 : 0.75;
    if (j === SCN.next) L = bl ? 2.1 : 0.2; else if (SCN.chain.indexOf(j) >= 0 && j !== SCN.cur) L = 0.75 + sl * 0.6;
    if (SCN.copy === 1 && has) L = bl ? 1.6 : 0.2; else if (SCN.copy === 2) L = j === SCN.src ? 2.1 : (bl ? 1.6 : 0.2);
    if (c.down) L = Math.max(L, 0.8); if (L !== c.lit){ c.lit = L; c.paintLit(); } var y = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== y) c.m.position.y = y; });
  var cl = SCN.copy ? (bl ? 1.2 : 0.2) : (scCopyB.down ? 0.9 : 0.25); if (cl !== scCopyB.lit){ scCopyB.lit = cl; scCopyB.paintLit(); }
  var hk = SCN.hold ? clamp((now - SCN.hold.t0) / SCHOLD, 0, 1) : 0, hl = SCN.hold ? hk * 1.2 + 0.2 : 0.25; if (hl !== scClearB.lit){ scClearB.lit = hl; scClearB.paintLit(); }
  scFill.visible = hk > 0.001; if (scFill.visible){ var fw = 20 * SC; scFill.scale.x = Math.max(0.001, hk); scFill.position.set(scx(131) - fw / 2 + fw * hk / 2, scClearB.m.position.y + 0.0052, scz(43)); scFill.material.opacity = SCN.hold && SCN.hold.done ? 0.95 : 0.78; }
  var bb = scBarsB.down ? 0.8 : SCN.chain.length >= 2 ? 0.5 : 0; if (bb !== scBarsB.lit){ scBarsB.lit = bb; scBarsB.paintLit(); }
  [scCopyB, scClearB, scBarsB].forEach(function(c){ var y = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== y) c.m.position.y = y; });
}
function scWipe(){ SCN.cur = -1; SCN.next = -1; SCN.at = -1; SCN.chain = []; SCN.copy = 0; [0, 1, 2, 3].forEach(function(i){ if (SCN.slots[i]){ SCN.slots[i] = null; scSlotSave(i); } }); scMetaSave(); }
/* scenes travel with the room and with a jam: one small key for which is on and the chain, one key per stored scene */
RESTORE[SCKEY] = function(){ scMetaRead(); SCN.next = -1; SCN.at = -1; scBarsB.repaintFace('x' + SCN.bars); };
[0, 1, 2, 3].forEach(function(i){ RESTORE[SCSLOT + i] = function(){ scSlotRead(i); if (!SCN.slots[i]){ if (SCN.cur === i) SCN.cur = -1; var ix = SCN.chain.indexOf(i); if (ix >= 0) SCN.chain.splice(ix, 1); } }; });
SAVENOW.push(function(){ [0, 1, 2, 3].forEach(function(i){ store(SCSLOT + i, SCN.raw[i]); }); scMetaSave(); });
