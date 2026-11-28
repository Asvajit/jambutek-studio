
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
var SCKEY = 'jambutek-studio-scenes-v1', SCSLOT = 'jambutek-studio-scene-v1-', SCBARS = [1, 2, 4], SCHOLD = 900;
var SCN = { cur:-1, next:-1, at:-1, mine:false, chain:[], anchor:0, bars:4, slots:[null, null, null, null], raw:['', '', '', ''], copy:0, src:-1, hold:null };

function scMetaSave(){ store(SCKEY, JSON.stringify({ v:1, cur:SCN.cur, chain:SCN.chain, anchor:SCN.anchor, bars:SCN.bars })); }
function scSlotSave(i){ SCN.raw[i] = SCN.slots[i] ? JSON.stringify(SCN.slots[i]) : ''; store(SCSLOT + i, SCN.raw[i]); }
function scSlotRead(i){ var r = store(SCSLOT + i) || ''; SCN.raw[i] = r; SCN.slots[i] = null; if (r){ try { var o = JSON.parse(r); if (o && typeof o === 'object') SCN.slots[i] = o; } catch (e) {} } if (!SCN.slots[i]) SCN.raw[i] = ''; }
function scMetaRead(){
  try { var s = JSON.parse(store(SCKEY) || 'null'); if (!s || s.v !== 1) return;
    SCN.cur = s.cur >= 0 && s.cur < 4 ? s.cur | 0 : -1; SCN.bars = SCBARS.indexOf(s.bars) >= 0 ? s.bars : 4;      /* (x8 is gone: an old x8 reads as x4) */ SCN.anchor = s.anchor | 0;
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
  if (c.bars){ SCN.bars = c.bars; scMetaSave(); toast('Chained scenes play ' + SCN.bars + (SCN.bars === 1 ? ' bar' : ' bars') + ' each'); return; }
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
  if (c.bars) return 'Chained scenes play ' + c.bars + (c.bars === 1 ? ' bar' : ' bars') + ' each' + (SCN.bars === c.bars ? ' · on' : ' · click');
  if (c.id === 'sccopy') return c.name + ' · click, then two scenes';
  if (c.id === 'scclear') return c.name + ' · press and hold';
  var j = c.slot; return 'Scene ' + (j + 1) + (j === SCN.cur ? ' · on' : SCN.slots[j] ? ' · stored' : ' · empty') + (SCN.chain.indexOf(j) >= 0 ? ' · in the chain' : '') + ' · click, Shift + click to chain';
}

/* ---- the box: the SCENESTER. The designer's plate, 1360 x 464 px (8 px per mm), with its buttons cut out (tools/make_scenester.py) ---- */
var scC = mk(1360, 464), scTex = null, scImg = new Image();
function paintSC(){ var g = scC.getContext('2d'); if (scImg.ok) g.drawImage(scImg, 0, 0); else { g.fillStyle = '#15B3AB'; g.fillRect(0, 0, 1360, 464); } if (scTex) scTex.needsUpdate = true; }
scImg.onload = function(){ scImg.ok = true; paintSC(); }; scImg.src = 'tr/scenester.jpg';
paintSC(); scTex = smoothTex(scC);
(function(){
  var W2 = ECW * SC, D2 = SCD * SC;
  var top = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), new THREE.MeshPhongMaterial({ color:0x404040, map:scTex, emissive:0xffffff, emissiveMap:scTex, emissiveIntensity:0.78, shininess:8, specular:0x000000 })); top.rotation.x = -Math.PI / 2; top.position.z = SCOFF; ECG.add(top);
  var body = new THREE.Mesh(new THREE.BoxGeometry(W2 + 0.012, ECTH, D2 + 0.012), new THREE.MeshPhongMaterial({ color:0x14151B, shininess:30, specular:0x222222, flatShading:true })); body.position.set(0, -ECTH / 2 - 0.0015, SCOFF); ECG.add(body);
  solid(top, 'trbody'); solid(body, 'trbody'); top.userData.dev = body.userData.dev = 'ec';
})();
HOST = ECG; LX = scx; LZ = scz; DEV = 'ec';
var KBS = KB; KB = { host:ECG, x:function(px){ return scx(px / 8); }, z:function(py){ return scz(py / 8); }, px:SC / 8, faces:TRFACES };
var SCBTN = [];
[76.5, 292.5, 513.5, 736.5].forEach(function(x, j){ var b = spButton('scslot' + j, [x, 171.5, 184, 209], 'Scene ' + (j + 1), { text:[String(j + 1)], size:166 }); b.scn = true; b.slot = j; SCBTN.push(b); });
var scCopyB = spButton('sccopy', [965.7, 174.5, 173, 91], 'Copy a scene', { bg:'#FFA83D', text:['COPY'], size:72 }); scCopyB.scn = true;
var scClearB = spButton('scclear', [965.7, 289.5, 173, 93.9], 'Clear this scene', { bg:'#FF4B3D', text:['CLEAR'], size:72, progCol:'#FFFFFF' }); scClearB.scn = true;      /* while held, white fills across it */
var scBarsBs = [[170.5, 1], [246.3, 2], [320.2, 4]].map(function(a){ var b = spButton('scbars' + a[1], [1173.5, a[0], 116, 61.3], 'Bars per chained scene: ' + a[1], { text:['x' + a[1]], size:80 }); b.scn = true; b.bars = a[1]; return b; });
KB = KBS;
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
  var PALE = '#FF6AB0', GREEN = '#69C369', ORANGE = '#FFA83D';      /* (PALE: a stored scene is pink) */
  SCBTN.forEach(function(c){ var j = c.slot, has = !!SCN.slots[j], bg = has ? PALE : '#FFFFFF';          /* empty: white. stored: pink. the one that is on: green, flashing on the beat while the sequence plays */
    if (j === SCN.cur && has) bg = beat ? GREEN : '#A9DDA9';
    if (j === SCN.next) bg = bl ? GREEN : '#FFFFFF'; else if (SCN.chain.indexOf(j) >= 0 && j !== SCN.cur) bg = sl > 0.45 ? '#FF9CCB' : PALE;      /* waiting to switch: blinks. in the chain: a slow pulse */
    if (SCN.copy === 1 && has) bg = bl ? ORANGE : '#FFFFFF'; else if (SCN.copy === 2) bg = j === SCN.src ? ORANGE : (bl ? '#FFD49E' : '#FFFFFF');
    c.setBg(bg); c.paintLit(); var y = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== y) c.m.position.y = y; });
  scCopyB.setBg(SCN.copy && !bl ? '#FFFFFF' : ORANGE);
  var hk = SCN.hold ? clamp((now - SCN.hold.t0) / SCHOLD, 0, 1) : 0; scClearB.repaintFace(null, Math.round(hk * 40) / 40);
  scBarsBs.forEach(function(c){ c.setBg(SCN.bars === c.bars ? GREEN : '#FFFFFF'); });
  [scCopyB, scClearB].concat(scBarsBs).forEach(function(c){ c.paintLit(); var y = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== y) c.m.position.y = y; });
}
function scWipe(){ SCN.cur = -1; SCN.next = -1; SCN.at = -1; SCN.chain = []; SCN.copy = 0; [0, 1, 2, 3].forEach(function(i){ if (SCN.slots[i]){ SCN.slots[i] = null; scSlotSave(i); } }); scMetaSave(); }
/* scenes travel with the room and with a jam: one small key for which is on and the chain, one key per stored scene */
RESTORE[SCKEY] = function(){ scMetaRead(); SCN.next = -1; SCN.at = -1; };
[0, 1, 2, 3].forEach(function(i){ RESTORE[SCSLOT + i] = function(){ scSlotRead(i); if (!SCN.slots[i]){ if (SCN.cur === i) SCN.cur = -1; var ix = SCN.chain.indexOf(i); if (ix >= 0) SCN.chain.splice(ix, 1); } }; });
SAVENOW.push(function(){ [0, 1, 2, 3].forEach(function(i){ store(SCSLOT + i, SCN.raw[i]); }); scMetaSave(); });
