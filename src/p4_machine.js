
/* ================= the machine: patterns, variations, the step sequencer and what every button does ================= */
var KITS = [
  { name:'808 KIT', tones:[0,0,0,0,0,0,0,0,0,0,0] }, { name:'909 KIT', tones:[1,1,1,1,1,1,1,1,1,1,1] },
  { name:'606 KIT', tones:[2,2,2,2,2,2,0,2,2,2,2] }, { name:'HOUSE KIT', tones:[3,3,3,3,3,0,3,3,3,0,3] },
  { name:'808x909 KIT', tones:[1,1,0,0,0,0,1,0,0,1,1] }
];
function z16(){ return [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; }
function emptyVar(){ return { last:16, st:INST.map(z16), sb:INST.map(z16), acc:z16() }; }
function parseVar(o){
  var v = emptyVar();
  INST.forEach(function(n, i){ var s = o[n]; if (!s) return; for (var k = 0; k < 16; k++){ var ch = s[k]; if (ch === 'x') v.st[i][k] = 1; else if (ch === 'o') v.st[i][k] = 2; else if (ch === 'r'){ v.st[i][k] = 1; v.sb[i][k] = 2; } } });
  if (o.acc) for (var k = 0; k < 16; k++) v.acc[k] = o.acc[k] === 'x' ? 1 : 0;
  return v;
}
function mkPat(name, kit, vars){
  var p = { name:name, kit:kit, tones:KITS[kit].tones.slice(), vars:[] };
  for (var i = 0; i < 8; i++) p.vars.push(vars && vars[i] ? parseVar(vars[i]) : emptyVar());
  return p;
}
function presets(){
  var P = [
    mkPat('HOUSE', 1, [
      { BD:'x---x---x---x---', HC:'----x-------x---', CH:'xo-oxo-oxo-oxo-o', OH:'--x---x---x---x-', RS:'-------x------x-', acc:'x---x---x---x---' },
      { BD:'x---x---x---x---', HC:'----x-------x---', SD:'-------o-o-----o', CH:'xo-oxo-oxo-oxo-o', OH:'--x---x---x---x-', RC:'x---x---x---x---', MT:'-------------x--', acc:'x---x---x---x---' } ]),
    mkPat('TECHNO', 1, [
      { BD:'x---x---x---x---', HC:'----x-------x---', CH:'xx-xxx-xxx-xxx-x', OH:'--x---x---x---x-', RS:'--x--x--x--x--x-', acc:'--x---x---x---x-' },
      { BD:'x---x---x---x---', HC:'----x-------x---', CH:'xx-xxx-xxx-xxx-x', OH:'--x---x---x---x-', RS:'--x--x--x--x--x-', RC:'x-x-x-x-x-x-x-x-', LT:'-------------x-x', acc:'--x---x---x---x-' } ]),
    mkPat('ELECTRO', 0, [
      { BD:'x-----x---x-----', SD:'----x-------x---', CH:'x-xxx-x-x-xxx---', OH:'--------------x-', HC:'------------x---', acc:'x---x-----x-x---' },
      { BD:'x--x--x---x--x--', SD:'----x-------x---', CH:'x-xxx-x-x-xxx---', OH:'--------------x-', HC:'------------x---', LT:'---------x------', HT:'-------x--------', acc:'x---x-----x-x---' } ]),
    mkPat('ACID', 2, [
      { BD:'x---x---x---x---', SD:'----x-------x---', CH:'x-x-x-x-x-x-x-x-', OH:'-------x-------x', acc:'x---x---x---x---' },
      { BD:'x---x---x--xx---', SD:'----x-------x-o-', CH:'x-x-x-x-x-x-x-x-', OH:'-------x-------x', HT:'-----x-------x--', acc:'x---x---x---x---' } ]),
    mkPat('BREAKS', 4, [
      { BD:'x---------x-----', SD:'----x--o-o--x---', CH:'x-x-x-x-x-x-x-x-', RC:'x---x---x---x---', acc:'x---x-----x-x---' },
      { BD:'x-----x---x--x--', SD:'----x--o-o--x--o', CH:'x-x-x-x-x-x-x-x-', OH:'---------------x', RC:'x---x---x---x---', acc:'x---x-----x-x---' } ]),
    mkPat('DEMBOW', 0, [
      { BD:'x---x---x---x---', SD:'---x--x----x--x-', CH:'x-x-x-x-x-x-x-x-', RS:'------x-------x-', acc:'x--x--x-x--x--x-' },
      { BD:'x---x---x---x---', SD:'---x--x----x--x-', CH:'x-x-x-x-x-x-x-x-', RS:'------x-------x-', HC:'---x-------x----', LT:'-------------x-x', acc:'x--x--x-x--x--x-' } ]),
    mkPat('HALFTIME', 3, [
      { BD:'x------x--x-----', SD:'--------x-------', HC:'--------x-------', CH:'x-x-x---x-r-x-xr', OH:'------x---------', acc:'x-------x-------' },
      { BD:'x------x--x--x--', SD:'--------x------o', HC:'--------x-------', CH:'x-xrx---x-r-xrxr', OH:'------x---------', RS:'---x------------', acc:'x-------x-------' } ]),
    mkPat('2-STEP', 1, [
      { BD:'x------x--x-----', SD:'----x-------x---', CH:'--x---x---x---x-', RS:'-x-----x-x------', OH:'---------------x', acc:'x---x-----x-x---' },
      { BD:'x------x--x---x-', SD:'----x-------x---', CH:'--x---x---x---x-', RS:'-x-----x-x------', OH:'---------------x', HC:'------------x---', acc:'x---x-----x-x---' } ])
  ];
  while (P.length < 16) P.push(mkPat('INIT PTN', 0));
  if (DEF && Array.isArray(DEF.drums) && DEF.drums.length === 16 && DEF.drums.every(function(p){ return p && Array.isArray(p.vars) && p.vars.length === 8 && Array.isArray(p.tones) && p.vars.every(function(v){ return v && v.st && v.st.length === 11 && v.sb && v.acc; }); })) return defCopy(DEF.drums);
  return P;
}
var PAT = presets();
var M = { playing:false, bpm:DEF && DEF.bpm >= 40 && DEF.bpm <= 300 ? DEF.bpm : 124, mode:'trrec', prevMode:'trrec', sel:0, accSel:false, sub:false, shift:false, muteMode:false, clearArm:false, copyArm:false,
  mutes:[0,0,0,0,0,0,0,0,0,0,0], pat:0, nextPat:-1, varSel:[0], varIx:0, editVar:0, fillOn:false, fxOn:false, menu:null, roll:0, msg:'', msgUntil:0, taps:[] };
var SEQ = { step:0, nextT:0, bar:0, timer:null, vis:[], visStep:-1, fill:false, fillVar:null, crashNext:false, skip:{}, flash:[0,0,0,0,0,0,0,0,0,0,0], kick:0 };

/* ---- each drum's CTRL knob is a send: to the reverb (yellow) or the delay (green), picked with CTRL SELECT ----
   a: which one the knob feeds (1 reverb, 2 delay), r and d: the two send amounts (both kept, the knob shows the one it feeds),
   t: the voice's own character, which the knob used to set. A jam saved before this keeps its sound exactly: its old knob
   positions become t, and the sends stay at the fixed amounts every drum had then. */
var TRS = { a:[1,1,1,1,1,1,1,1,1,1,1], r:[0,0,0,0,0,0,0,0,0,0,0], d:[0,0,0,0,0,0,0,0,0,0,0], t:[.5,.5,.5,.5,.5,.5,.5,.5,.5,.5,.5] }, SMAX = 0.6;
function trsShow(){ for (var i = 0; i < 11; i++){ var c = CT['ctrl' + i]; c.v = TRS.a[i] === 2 ? TRS.d[i] : TRS.r[i]; c.mat.color.setHex(TRS.a[i] === 2 ? FXGRN : FXYEL); c.show(); } }
function trsLoad(s){
  var f = s && s.fx, ok = f && [f.a, f.r, f.d, f.t].every(function(x){ return Array.isArray(x) && x.length === 11; }), num = function(v, d){ return typeof v === 'number' && v === v ? clamp(v, 0, 1) : d; };
  for (var i = 0; i < 11; i++){
    if (ok){ TRS.a[i] = f.a[i] === 2 ? 2 : 1; TRS.r[i] = num(f.r[i], 0); TRS.d[i] = num(f.d[i], 0); TRS.t[i] = num(f.t[i], 0.5); }
    else { TRS.a[i] = 1; TRS.r[i] = SENDS[i][0] / SMAX; TRS.d[i] = SENDS[i][1] / SMAX; TRS.t[i] = num(s && s.kn && s.kn['ctrl' + i], 0.5); }
  }
  trsShow(); applyMix();
}
function ctlAssign(a){                                 // CTRL SELECT, then a click on the reverb or the delay level knob
  var i = M.sel; TRS.a[i] = a; M.ctlArm = false; trsShow(); CT.reverb.mat.emissive.setHex(0); CT.dlevel.mat.emissive.setHex(0);
  say(INST[i] + ' CTRL > ' + (a === 2 ? 'DELAY' : 'REVERB') + ' SEND', 2000); dispDirty = true; applyMix(); saveSoon();
}
function fillOk(f){ return !!f && typeof f.last === 'number' && Array.isArray(f.acc) && [f.st, f.sb].every(function(x){ return Array.isArray(x) && x.length === 11; }); }
/* ---- saving: the unit keeps itself in this browser, like the arcade keeps its progress ---- */
var SAVE_KEY = 'jambutek-studio-tr-v1', saveT = null;
/* which variations (A to H) are chained to play, and which one is being edited: saved with the rest, so a jam comes back playing A B and not just A */
function trVars(s){ var a = s && Array.isArray(s.vars) ? s.vars.filter(function(x, i, l){ return x === (x | 0) && x >= 0 && x < 8 && l.indexOf(x) === i; }).sort() : [];
  if (!a.length) return false; if (a.join() !== M.varSel.join()){ M.varSel = a; M.varIx = 0; } M.editVar = typeof s.ev === 'number' ? clamp(s.ev | 0, 0, 7) : a[0]; return true; }
function save(){
  var kn = {}; CTLIST.forEach(function(c){ if (!c.dev && ((c.kind === 'knob' && !c.endless) || c.kind === 'fader')) kn[c.id] = +c.v.toFixed(3); });
  store(SAVE_KEY, JSON.stringify({ v:1, bpm:M.bpm, pat:M.pat, mutes:M.mutes, fillOn:M.fillOn, fxOn:M.fxOn, vars:M.varSel, ev:M.editVar, PAT:PAT, kn:kn, fx:TRS }));
}
function saveSoon(){ clearTimeout(saveT); saveT = setTimeout(save, saveMs(1200)); }
SAVENOW.push(save);
(function load(){
  try {
    var s = JSON.parse(store(SAVE_KEY) || 'null'); if (!s || s.v !== 1 || !Array.isArray(s.PAT) || s.PAT.length !== 16) return;
    var ok = s.PAT.every(function(p){ return p && Array.isArray(p.vars) && p.vars.length === 8 && Array.isArray(p.tones) && p.vars.every(function(v){ return v && v.st && v.st.length === 11 && v.sb && v.acc; }); });
    if (!ok) return;
    PAT = s.PAT; M.bpm = clamp(+s.bpm || 124, 40, 300); M.pat = clamp(s.pat | 0, 0, 15); if (Array.isArray(s.mutes) && s.mutes.length === 11) M.mutes = s.mutes; M.fxOn = !!s.fxOn; M.fillOn = !!s.fillOn; trVars(s);
    Object.keys(s.kn || {}).forEach(function(id){ var c = CT[id]; if (c && typeof s.kn[id] === 'number'){ c.v = clamp(s.kn[id], 0, 1); c.show(); } });
    trsLoad(s);
  } catch (e) {}
})();

/* ---- helpers ---- */
function say(m, ms){ M.msg = m; M.msgUntil = performance.now() + (ms || 1400); dispDirty = true; }
function pat(){ return PAT[M.pat]; }
function editV(){ var p = pat(); if (M.fillEdit){ if (fillOk(p.fill)) return p.fill; M.fillEdit = false; } return p.vars[M.editVar]; }      // with the fill's EDIT lit, the steps show and change this pattern's own fill-in
function setEditV(v){ if (M.fillEdit) pat().fill = v; else pat().vars[M.editVar] = v; }
function playV(){ return pat().vars[M.varSel[M.varIx % M.varSel.length]]; }
function stepDur(){ return 60 / M.bpm / 4; }
function fillEvery(){ return [2, 4, 8, 12, 16, 32][Math.round(CT.fillknob.v * 5)]; }
function divIx(){ return clamp(Math.round(CT.dtime.v * (DIVS.length - 1)), 0, DIVS.length - 1); }
function valText(c){
  var id = c.id, v = c.v;
  if (id.indexOf('tune') === 0){ var s = Math.round((v - 0.5) * 2 * 64); return (s > 0 ? '+' : '') + s; }
  if (id === 'dtime') return DIVS[divIx()][1];
  if (id === 'fillknob') return 'every ' + fillEvery() + ' bars';
  if (id === 'shuffle'){ var sh = Math.round((v - 0.5) * 200); return (sh > 0 ? '+' : '') + sh; }
  if (id === 'fxctrl') return v < 0.47 ? 'LPF ' + Math.round((0.47 - v) / 0.47 * 127) : v > 0.53 ? 'HPF ' + Math.round((v - 0.53) / 0.47 * 127) : 'flat';
  return String(Math.round(v * 127));
}
function labelOf(c){
  if (c.dev) return DEVH[c.dev].label(c);
  if (c.kind === 'knob' && c.id === 'tempo') return 'Tempo ' + M.bpm.toFixed(1) + ' BPM · scroll or drag';
  if (c.kind === 'knob' && c.id === 'value') return 'Value · scroll or drag';
  if (c.kind === 'knob' || c.kind === 'fader') return c.name + ' ' + valText(c) + ' · scroll or drag';
  if (c.pi != null){
    if (M.mode === 'trrec') return 'Step ' + (c.pi + 1) + (M.accSel ? ' accent' : ' · ' + INAME[M.sel]);
    if (M.mode === 'ptn') return 'Pattern ' + (c.pi + 1) + ' · ' + PAT[c.pi].name;
    if (M.mode === 'last') return 'Last step ' + (c.pi + 1);
    return c.pi < 11 ? 'Play ' + INAME[c.pi] : c.pi === 11 ? 'Roll 16ths' : c.pi === 12 ? 'Roll 32nds' : c.pi === 13 ? 'Fill-in now' : c.pi === 15 ? 'Tap tempo' : null;
  }
  if (c.id === 'instpad') return 'Play ' + INAME[M.sel];
  return c.name;
}
function applyMix(){
  if (!AU.ready) return;
  var t = ac.currentTime;
  AU.vol.gain.setTargetAtTime(Math.pow(CT.volume.v, 1.6) * 1.1, t, 0.02);
  AU.chans.forEach(function(ch, i){ ch.g.gain.setTargetAtTime(M.mutes[i] ? 0 : Math.pow(CT['lev' + i].v, 1.7) * 1.25, t, 0.012); });
  AU.chans.forEach(function(ch, i){ if (ch.rs){ ch.rs.gain.setTargetAtTime(TRS.r[i] * SMAX, t, 0.02); ch.ds.gain.setTargetAtTime(TRS.d[i] * SMAX, t, 0.02); } });      // each drum's sends: its CTRL knob
  AU.revRet.gain.setTargetAtTime(CT.reverb.v * 1.6, t, 0.03);
  AU.dRet.gain.setTargetAtTime(CT.dlevel.v * 1.8, t, 0.03);
  AU.dfb.gain.setTargetAtTime(CT.dfb.v * 0.92, t, 0.03);
  AU.dly.delayTime.setTargetAtTime(Math.min(2.4, DIVS[divIx()][0] * 60 / M.bpm), t, 0.05);
  var c = CT.fxctrl.v, lpF = 20000, hpF = 10, q = 0.7;
  if (M.fxOn){ if (c < 0.47){ var a = (0.47 - c) / 0.47; lpF = 20000 * Math.pow(140 / 20000, a); q = 0.7 + a * 5; } else if (c > 0.53){ var b = (c - 0.53) / 0.47; hpF = 20 * Math.pow(9000 / 20, b); q = 0.7 + b * 5; } }
  AU.lp.frequency.setTargetAtTime(lpF, t, 0.03); AU.hp.frequency.setTargetAtTime(hpF, t, 0.03); AU.lp.Q.setTargetAtTime(c < 0.5 ? q : 0.7, t, 0.03); AU.hp.Q.setTargetAtTime(c > 0.5 ? q : 0.7, t, 0.03);
}
var TRIM = [1, 0.75, 1, 1, 1, 2, 2.2, 1, 1, 0.45, 1.1];              // level-matches the voices
function trig(i, t, vel){
  if (!AU.ready || M.mutes[i]) return;
  if (i === 0) mxDuck(Math.max(t, ac.currentTime));            // the kick ducks every channel that has its sidechain knob up
  try { VOICES[i](AU.chans[i].g, Math.max(t, ac.currentTime), vel * TRIM[i], { tune:CT['tune' + i].v, decay:CT['decay' + i].v, ctrl:TRS.t[i] }, TONES[pat().tones[i]] || '808'); } catch (e) {}
}
function hit(i, vel){                           // a pad played by hand
  unlock(); if (!AU.ready) return;
  trig(i, ac.currentTime + 0.002, vel || 0.95); SEQ.flash[i] = 1; if (i === 0) SEQ.kick = 1; if (i === 1 && !M.mutes[1]) SEQ.snare = vel || 0.95;
  if (M.mode === 'instrec' && M.playing){
    var v = playV(), pos = SEQ.step - (SEQ.nextT - ac.currentTime) / stepDur(), n = ((Math.round(pos) % v.last) + v.last) % v.last;
    v.st[i][n] = 1; if (n === SEQ.step) SEQ.skip[i + '_' + n] = 1; saveSoon();
  }
}

/* ---- the sequencer: a look-ahead scheduler on the audio clock ---- */
function makeFill(v){
  var f = { last:v.last, st:v.st.map(function(r){ return r.slice(); }), sb:v.sb.map(function(r){ return r.slice(); }), acc:v.acc.slice() }, L = v.last, b = Math.max(0, L - 8);
  for (var k = b; k < L; k++){ [1, 2, 3, 4, 6].forEach(function(i){ f.st[i][k] = 0; f.sb[i][k] = 0; }); if (k >= L - 4){ f.st[7][k] = 0; f.st[8][k] = 0; } }
  [[2, 1, 1], [4, 1, 1], [6, 1, 1], [7, 1, 1], [5, 2, 1], [3, 3, 1], [1, 4, 2]].forEach(function(e){ if (b + e[0] < L){ f.st[e[1]][b + e[0]] = e[2]; } });
  if (L >= 2){ f.sb[1][L - 1] = 2; f.acc[L - 1] = 1; f.acc[L - 2] = 1; }
  return f;
}
function schedStep(t){
  var sd = stepDur();
  if (SEQ.step === 0){
    if (M.nextPat >= 0){ M.pat = M.nextPat; M.nextPat = -1; M.varSel = [0]; M.varIx = 0; M.editVar = 0; M.fillEdit = false; dispDirty = true; saveSoon(); }
    if (M.fillOn && (SEQ.bar + 1) % fillEvery() === 0) SEQ.fill = true;
    if (SEQ.crashNext){ SEQ.crashNext = false; trig(9, t, 0.9); }
  }
  var cur = playV(), v = cur;
  if (SEQ.fill){ var cf = pat().fill;                              // this pattern's own fill-in if one has been written (EDIT under AUTO FILL IN), otherwise one made up from what is playing
    if (fillOk(cf) && cf.st.some(function(r){ return r.some(function(x){ return x; }); })) v = cf; else { if (!SEQ.fillVar) SEQ.fillVar = makeFill(cur); v = SEQ.fillVar; } }
  var s = SEQ.step, sw = (CT.shuffle.v - 0.5) * 0.66, tt = t + (s % 2 ? sw * sd : 0), acc = v.acc[s] ? 1 + CT.accent.v * 0.6 : 1, hits = [], sv = 0;
  for (var i = 0; i < 11; i++){
    var st = v.st[i][s]; if (!st) continue;
    if (SEQ.skip[i + '_' + s]){ delete SEQ.skip[i + '_' + s]; continue; }
    var vel = (st === 2 ? 0.4 : 0.8) * acc, n = v.sb[i][s] || 1;
    for (var k = 0; k < n; k++) trig(i, tt + k * sd / n, vel * (k ? 0.82 : 1));
    if (!M.mutes[i]){ hits.push(i); if (i === 1) sv = vel; }
  }
  SEQ.vis.push({ t:tt, step:s, hits:hits, sv:sv, n:SEQ.n16 });
  mfClock(t, SEQ.n16, sd, sw); bsClock(t, SEQ.n16, sd, sw); snClock(t, SEQ.n16, sd, sw); amClock(t, SEQ.n16, sd, sw); SEQ.n16++;
  SEQ.step++;
  if (SEQ.step >= cur.last){ SEQ.step = 0; SEQ.bar++; if (SEQ.fill){ SEQ.fill = false; SEQ.fillVar = null; SEQ.crashNext = true; } M.varIx = (M.varIx + 1) % M.varSel.length; SEQ.skip = {}; }
  SEQ.nextT += sd;
}
function pump(){ if (!M.playing || !ac) return; var guard = 0; if (SEQ.nextT < ac.currentTime - 0.3){ if (!(MPON && MPNET.regrid && MPNET.regrid())) SEQ.nextT = ac.currentTime + 0.02; } while (SEQ.nextT < ac.currentTime + 0.2 && guard++ < 64) schedStep(SEQ.nextT); }
function startSeq(at, remote, n0){
  unlock(); if (!AU.ready){ toast('No sound in this browser'); return; }
  if (!remote && MPON && MPNET.start){ MPNET.start(); return; }
  M.playing = true; SEQ.step = 0; SEQ.bar = 0; M.varIx = 0; SEQ.fill = false; SEQ.fillVar = null; SEQ.crashNext = false; SEQ.vis = []; SEQ.skip = {};
  SEQ.nextT = at != null ? at : ac.currentTime + 0.06; SEQ.n16 = n0 | 0; if (n0) SEQ.step = SEQ.n16 % Math.max(1, playV().last); mfOnStart(); bsOnStart(); amOnStart(); tpOnStart(); pump(); clearInterval(SEQ.timer); SEQ.timer = setInterval(pump, 25); dispDirty = true;
}
function stopSeq(remote){ if (!remote && MPON && MPNET.stop) MPNET.stop(); mfOnStop(); bsOnStop(); snOnStop(); amOnStop(); M.playing = false; clearInterval(SEQ.timer); SEQ.timer = null; SEQ.vis = []; SEQ.visStep = -1; dispDirty = true; }
function toggleSeq(){ if (M.playing) stopSeq(); else startSeq(); }
function setBpm(b, remote){ var was = M.bpm; M.bpm = clamp(Math.round(b * 10) / 10, 40, 300); tempoDirty = true; applyMix(); mfTempo(); bsTempo(); AM.dirty = true; tpTempo(); if (!remote){ saveSoon(); if (MPON && MPNET.tempo && was !== M.bpm) MPNET.tempo(); } }
var MPNET = {};
function tapTempo(){
  var now = performance.now(); M.taps = M.taps.filter(function(x){ return now - x < 2500; }); M.taps.push(now);
  if (M.taps.length >= 3){ var d = (M.taps[M.taps.length - 1] - M.taps[0]) / (M.taps.length - 1); setBpm(60000 / d); say('TAP  ' + M.bpm.toFixed(1)); } else say('TAP ' + '●'.repeat(M.taps.length));
}
function selectPattern(i){
  if (M.playing){ M.nextPat = i === M.pat ? -1 : i; say('NEXT  1-' + ('0' + (i + 1)).slice(-2) + ' ' + PAT[i].name, 1600); }
  else { M.pat = i; M.nextPat = -1; M.varSel = [0]; M.varIx = 0; M.editVar = 0; M.fillEdit = false; saveSoon(); }
  dispDirty = true;
}
function setKit(k){ var p = pat(); p.kit = (k + KITS.length) % KITS.length; p.tones = KITS[p.kit].tones.slice(); dispDirty = true; saveSoon(); }

/* ---- every button ---- */
var rollTimer = null;
function stopRoll(){ if (rollTimer){ clearInterval(rollTimer); rollTimer = null; } }
function pressPad(i){
  var v = editV();
  if (M.mode === 'trrec'){
    if (M.accSel){ v.acc[i] = v.acc[i] ? 0 : 1; }
    else if (M.sub){ var r = v.sb[M.sel]; if (!v.st[M.sel][i]){ v.st[M.sel][i] = 1; r[i] = 2; } else r[i] = r[i] === 0 ? 2 : r[i] === 2 ? 3 : r[i] === 3 ? 4 : 0; say('SUB  ' + (r[i] ? '1/' + r[i] : 'OFF')); }
    else if (M.shift){ v.st[M.sel][i] = v.st[M.sel][i] === 2 ? 0 : 2; v.sb[M.sel][i] = 0; say(v.st[M.sel][i] ? 'WEAK BEAT' : 'STEP OFF'); }
    else { v.st[M.sel][i] = v.st[M.sel][i] ? 0 : 1; v.sb[M.sel][i] = 0; if (v.st[M.sel][i] && !M.playing) hit(M.sel, 0.8); }
    saveSoon(); return;
  }
  if (M.mode === 'ptn'){ selectPattern(i); return; }
  if (M.mode === 'last'){ v.last = i + 1; say('LAST STEP  ' + (i + 1)); if (SEQ.step >= v.last) SEQ.step = 0; saveSoon(); return; }
  // INST PLAY / INST REC
  if (i < 11){
    hit(i);
    if (M.roll){ stopRoll(); var n = 0; rollTimer = setInterval(function(){ hit(i, n++ % 2 ? 0.6 : 0.8); }, Math.max(30, stepDur() * 1000 / (M.roll === 32 ? 2 : 1))); }
  }
  else if (i === 11){ M.roll = M.roll === 16 ? 0 : 16; say(M.roll ? 'ROLL 16th  hold a pad' : 'ROLL OFF'); }
  else if (i === 12){ M.roll = M.roll === 32 ? 0 : 32; say(M.roll ? 'ROLL 32nd  hold a pad' : 'ROLL OFF'); }
  else if (i === 13){ press(CT.filltrig); }
  else if (i === 15){ unlock(); tapTempo(); }
}
function setMode(m){
  if (M.mode === m && (m === 'ptn' || m === 'last')) M.mode = M.prevMode;
  else { if (M.mode !== 'ptn' && M.mode !== 'last') M.prevMode = M.mode; M.mode = m; }
  stopRoll(); M.menu = null; dispDirty = true;
}
function press(c){
  unlock();
  if (c.dev){ c.down = 1; DEVH[c.dev].press(c); return; }
  var id = c.id; c.down = 1; dispDirty = true;
  if (c.mi != null){ M.mutes[c.mi] = M.mutes[c.mi] ? 0 : 1; applyMix(); say(INST[c.mi] + (M.mutes[c.mi] ? '  MUTED' : '  ON')); saveSoon(); return; }
  if (c.pi != null){ pressPad(c.pi); return; }
  if (c.vi != null){
    var k = c.vi, L = 'ABCDEFGH';
    if (M.copyArm){ if (k !== M.editVar){ pat().vars[k] = JSON.parse(JSON.stringify(editV())); say('COPIED  ' + L[M.editVar] + ' > ' + L[k]); saveSoon(); } M.copyArm = false; return; }
    if (M.shift){ var ix = M.varSel.indexOf(k); if (ix >= 0){ if (M.varSel.length > 1) M.varSel.splice(ix, 1); } else { M.varSel.push(k); M.varSel.sort(); } say('CHAIN  ' + M.varSel.map(function(x){ return L[x]; }).join(' ')); }
    else { M.varSel = [k]; M.varIx = 0; }
    M.editVar = k; M.fillEdit = false; saveSoon(); return;
  }
  if (c.inst != null && id.indexOf('sel') === 0){
    var i = c.inst;
    if (M.muteMode){ M.mutes[i] = M.mutes[i] ? 0 : 1; applyMix(); say(INST[i] + (M.mutes[i] ? '  MUTED' : '  ON')); saveSoon(); return; }
    if (M.clearArm){ editV().st[i] = z16(); editV().sb[i] = z16(); M.clearArm = false; say('CLEARED  ' + INST[i]); saveSoon(); return; }
    M.sel = i; M.accSel = false; if (!M.playing) hit(i, 0.8); return;
  }
  switch (id){
    case 'start': if (M.shift && M.playing){ SEQ.step = 0; M.varIx = 0; say('FROM THE TOP'); } else toggleSeq(); return;
    case 'instpad': hit(M.sel); return;
    case 'shift': M.shift = !M.shift; return;
    case 'ptn': setMode('ptn'); return;
    case 'trrec': setMode('trrec'); return;
    case 'last': setMode('last'); return;
    case 'instplay': setMode('instplay'); return;
    case 'instrec': setMode('instrec'); if (!M.playing) say('INST REC  press START, play the pads', 2200); return;
    case 'sub': M.sub = !M.sub; if (M.sub){ M.mode = 'trrec'; M.accSel = false; say('SUB  tap a step: 1/2 1/3 1/4', 2200); } return;
    case 'accstep': M.accSel = !M.accSel; if (M.accSel){ M.mode = 'trrec'; M.sub = false; } return;
    case 'clear':
      if (M.shift && M.fillEdit){ delete pat().fill; M.fillEdit = false; M.clearArm = false; say('FILL IN  BACK TO AUTOMATIC', 2000); saveSoon(); }
      else if (M.shift){ pat().vars[M.editVar] = emptyVar(); M.clearArm = false; say('CLEARED  VARIATION ' + 'ABCDEFGH'[M.editVar]); saveSoon(); }
      else { M.clearArm = !M.clearArm; if (M.clearArm) say('CLEAR  pick BD-RC  (SHIFT: all)', 2600); }
      return;
    case 'copy': M.copyArm = !M.copyArm; if (M.copyArm) say('COPY ' + 'ABCDEFGH'[M.editVar] + '  press A-H', 2600); return;
    case 'fxon': M.fxOn = !M.fxOn; applyMix(); say('MASTER FX  ' + (M.fxOn ? 'ON  ' + valText(CT.fxctrl) : 'OFF')); saveSoon(); return;
    case 'fillon': M.fillOn = !M.fillOn; say('AUTO FILL  ' + (M.fillOn ? fillEvery() + ' BARS' : 'OFF')); saveSoon(); return;
    case 'filledit':
      if (M.fillEdit){ M.fillEdit = false; say('FILL EDIT  OFF'); return; }
      if (!fillOk(pat().fill)){ pat().fill = makeFill(pat().vars[M.editVar]); saveSoon(); }      // first time: start from the fill the machine would have made, so there is something to change
      M.fillEdit = true; M.mode = 'trrec'; M.menu = null; say('FILL EDIT  steps = this pattern\'s fill', 2600); return;
    case 'filltrig': if (M.playing){ SEQ.fill = true; SEQ.fillVar = null; say('FILL IN'); } else say('FILL IN  press START first'); return;
    case 'kit': M.menu = M.menu === 'kit' ? null : 'kit'; return;
    case 'inst': M.menu = M.menu === 'inst' ? null : 'inst'; return;
    case 'enter': if (M.shift) tapTempo(); else if (M.menu) M.menu = null; else say('SHIFT + ENTER  tap tempo', 1800); return;
    case 'write': save(); say('WRITE  saved'); return;
    case 'moton': case 'motrec': say('MOTION  not fitted yet', 1800); return;
    case 'ctrlsel': M.ctlArm = !M.ctlArm; if (M.ctlArm) say(INST[M.sel] + ' CTRL  click REVERB or DELAY level', 3200); else { CT.reverb.mat.emissive.setHex(0); CT.dlevel.mat.emissive.setHex(0); } return;
  }
}
function release(c){ if (c.dev){ c.down = 0; DEVH[c.dev].release(c); return; } c.down = 0; if (c.pi != null) stopRoll(); }
function onCtl(c){                                 // a knob or fader moved
  c.show();
  if (c.dev){ DEVH[c.dev].ctl(c); return; }
  if (c.inst != null && c.id.indexOf('ctrl') === 0){ var fa = TRS.a[c.inst]; (fa === 2 ? TRS.d : TRS.r)[c.inst] = c.v; say(INST[c.inst] + (fa === 2 ? ' DELAY' : ' REVERB') + ' SEND  ' + valText(c)); applyMix(); saveSoon(); return; }
  say((c.inst != null ? INST[c.inst] + ' ' + c.id.replace(/\d+$/, '').replace('lev', 'level').toUpperCase() : c.name.toUpperCase()) + '  ' + valText(c));
  applyMix(); saveSoon();
}
function setCtl(c, v){ v = clamp(v, 0, 1); if (v === c.v) return; c.v = v; onCtl(c); if (SNLEARN && !MPQUIET) SNLEARN(c); }
function turnCtl(c, n){                            // the two endless encoders, in clicks
  if (!n) return; c.v += n / 24; c.show();
  if (c.dev){ DEVH[c.dev].turn(c, n); return; }
  if (c.id === 'tempo'){ setBpm(M.bpm + n * (M.shift ? 0.1 : 1)); return; }
  if (M.menu === 'kit'){ setKit(pat().kit + n); return; }
  if (M.menu === 'inst'){ var p = pat(); p.tones[M.sel] = ((p.tones[M.sel] + n) % TONES.length + TONES.length) % TONES.length; dispDirty = true; saveSoon(); if (!M.playing) hit(M.sel, 0.8); return; }
  selectPattern(((M.nextPat >= 0 ? M.nextPat : M.pat) + n + 160) % 16);
}

/* ---- the screens ---- */
var dispDirty = true, tempoDirty = true;
function paintDisp(){
  var g = dispC.getContext('2d'), now = performance.now(), p = pat(), L = 'ABCDEFGH';
  g.fillStyle = '#02060A'; g.fillRect(0, 0, 512, 144);
  g.fillStyle = '#BFEFFF'; g.shadowColor = '#5BC8FF'; g.shadowBlur = 6; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.font = 'bold 44px "Courier New", monospace';
  var l1 = M.menu === 'kit' ? 'KIT ' + (p.kit + 1) : M.menu === 'inst' ? 'INST ' + INST[M.sel] : (M.playing ? '▶' : '■') + ' 1-' + ('0' + (M.pat + 1)).slice(-2) + ' ' + p.name;
  g.fillText(l1, 14, 42, 484);
  var l2;
  if (now < M.msgUntil) l2 = M.msg;
  else if (M.menu === 'kit') l2 = KITS[p.kit].name + '  turn VALUE';
  else if (M.menu === 'inst') l2 = 'TONE ' + TONES[p.tones[M.sel]] + '  turn VALUE';
  else if (M.mode === 'trrec') l2 = 'TR-REC ' + (M.accSel ? 'ACCENT' : INST[M.sel]) + (M.fillEdit ? '  FILL IN' : '  VAR ' + L[M.editVar]) + (M.sub ? '  SUB' : '');
  else if (M.mode === 'ptn') l2 = 'PTN SELECT  pads 1-16';
  else if (M.mode === 'last') l2 = 'LAST STEP ' + editV().last + '  VAR ' + L[M.editVar];
  else if (M.mode === 'instplay') l2 = 'INST PLAY' + (M.roll ? '  ROLL ' + M.roll : '');
  else l2 = 'INST REC' + (M.playing ? '  ●' : '  (stopped)');
  g.font = 'bold 34px "Courier New", monospace'; g.fillStyle = now < M.msgUntil ? '#FFE15A' : '#8FD8F2'; g.shadowColor = g.fillStyle;
  g.fillText(l2, 14, 104, 484);
  g.shadowBlur = 0; dispT.needsUpdate = true;
}
var SEG = { 0:'abcdef', 1:'bc', 2:'abged', 3:'abgcd', 4:'fgbc', 5:'afgcd', 6:'afgedc', 7:'abc', 8:'abcdefg', 9:'abfgcd' };
function seg7(g, x, y, w, h, on){
  var t = 7, m = 2;
  var S = { a:[x + m, y, w - 2 * m, t], g:[x + m, y + h / 2 - t / 2, w - 2 * m, t], d:[x + m, y + h - t, w - 2 * m, t],
    f:[x, y + m, t, h / 2 - 2 * m], b:[x + w - t, y + m, t, h / 2 - 2 * m], e:[x, y + h / 2 + m, t, h / 2 - 2 * m], c:[x + w - t, y + h / 2 + m, t, h / 2 - 2 * m] };
  Object.keys(S).forEach(function(k){ g.fillStyle = on.indexOf(k) >= 0 ? '#FF3A2A' : '#2A0A0C'; var r = S[k]; g.fillRect(r[0], r[1], r[2], r[3]); });
}
function paintTempo(){
  var g = tempoC.getContext('2d'); g.fillStyle = '#090304'; g.fillRect(0, 0, 192, 96);
  var s = M.bpm.toFixed(1).replace('.', ''); while (s.length < 4) s = ' ' + s;
  for (var i = 0; i < 4; i++) seg7(g, 12 + i * 43, 16, 32, 64, s[i] === ' ' ? '' : SEG[s[i]]);
  g.fillStyle = '#FF3A2A'; g.fillRect(12 + 3 * 43 - 8, 74, 6, 6);
  tempoT.needsUpdate = true;
}

/* ---- lights: called every frame ---- */
var VARL = 'ABCDEFGH';
function updateTR(now, dt){
  for (var hb = 0; hb < 2; hb++){ HALFBAR[hb].visible = M.mode === 'trrec'; HALFBAR[hb].material.color.setHex((M.kbHalf ? 1 : 0) === hb ? 0x3BFF6A : 0x1E2A22); }
  if (ac && M.playing){ var ct = ac.currentTime; while (SEQ.vis.length && SEQ.vis[0].t <= ct){ var e = SEQ.vis.shift(); SEQ.visStep = e.step; SEQ.visN = e.n; e.hits.forEach(function(i){ SEQ.flash[i] = 1; if (i === 0) SEQ.kick = 1; }); if (e.sv) SEQ.snare = e.sv; } }
  var blink = (now % 420) < 210, fast = (now % 200) < 100, v = editV(), pv = playV(), vs = M.playing ? SEQ.visStep : -1;
  for (var i = 0; i < 11; i++) SEQ.flash[i] = Math.max(0, SEQ.flash[i] - dt * 7);
  SEQ.kick = Math.max(0, SEQ.kick - dt * 5);
  var lit = { shift:M.shift, clear:M.clearArm && blink, ptn:M.mode === 'ptn', trrec:M.mode === 'trrec', last:M.mode === 'last', sub:M.sub, instplay:M.mode === 'instplay', instrec:M.mode === 'instrec' && (!M.playing || blink),
    accstep:M.accSel, fxon:M.fxOn, fillon:M.fillOn, filltrig:SEQ.fill && fast, kit:M.menu === 'kit', inst:M.menu === 'inst', copy:M.copyArm && blink, enter:!!M.menu && blink, filledit:!!M.fillEdit, ctrlsel:!!M.ctlArm && blink };
  if (M.ctlArm){ CT.reverb.mat.emissive.setHex(blink ? 0x6A5200 : 0x1A1400); CT.dlevel.mat.emissive.setHex(blink ? 0x0E5A2A : 0x04160A); }      // CTRL SELECT is waiting: the two level knobs glow, click one
  CTLIST.forEach(function(c){
    if (c.dev || (c.kind !== 'btn' && c.kind !== 'pad')) return;
    var L = 0;
    if (c.vi != null){ var inChain = M.varSel.indexOf(c.vi) >= 0, cur = M.playing && M.varSel[M.varIx % M.varSel.length] === c.vi; L = cur ? (blink ? 1 : 0.25) : inChain ? 1 : c.vi === M.editVar ? 0.4 : 0; c.col.setHex(M.mode === 'trrec' && c.vi === M.editVar && M.playing ? RED : GRN); }
    else if (c.inst != null && c.kind === 'btn'){ var i = c.inst; L = M.muteMode ? (M.mutes[i] ? 0 : 0.7) : (i === M.sel ? 0.85 : 0); L = Math.max(L, SEQ.flash[i]); if (M.mutes[i] && !M.muteMode) L *= 0.3; }
    else if (c.mi != null) L = M.mutes[c.mi] ? 1 : 0;
    else if (c.pi != null){
      var k = c.pi; c.col.copy(c.base);
      if (M.mode === 'trrec'){ var s = M.accSel ? v.acc[k] : v.st[M.sel][k];              // step record: white pads, beats 1 5 9 13 a touch brighter, written steps red
        if (s){ c.col.setHex(RED); L = s === 2 ? 0.4 : (v.sb[M.sel][k] && !M.accSel && fast ? 0.7 : 1); } else { c.col.setHex(0xFFFFFF); L = k >= v.last ? 0 : k % 4 === 0 ? 0.3 : 0.14; } if (k >= v.last && s) L = 0.12; }
      else if (M.mode === 'ptn'){ L = k === M.pat ? 1 : k === M.nextPat ? (fast ? 1 : 0.1) : PAT[k].name !== 'INIT PTN' ? 0.22 : 0.02; }
      else if (M.mode === 'last'){ L = k < v.last ? (k === v.last - 1 ? 1 : 0.4) : 0; }
      else { L = k < 11 ? 0.12 + SEQ.flash[k] : k === 11 ? (M.roll === 16 ? 1 : 0.1) : k === 12 ? (M.roll === 32 ? 1 : 0.1) : k === 13 ? (SEQ.fill ? 1 : 0.1) : k === 15 ? 0.1 : 0; }
      if (k === vs && (M.mode === 'trrec' || M.mode === 'last') && k < pv.last){ c.col.setHex(0xFFFFFF); L = 1.1; }
    }
    else if (c.id === 'start'){ L = M.playing ? (vs % 4 === 0 ? 1.1 : 0.55) : 0.1; c.col.setHex(M.playing ? GRN : 0xF4F4F4); }
    else if (c.id === 'instpad'){ L = 0.12 + SEQ.flash[M.sel]; c.col.set(COLCOL[M.sel]); }
    else L = lit[c.id] ? 1 : 0;
    if (c.down) L = Math.max(L, 0.8);
    if (L !== c.lit || c.pi != null || c.vi != null || c.id === 'start' || c.id === 'instpad'){ c.lit = L; c.paintLit(); }
    var ty = c.y0 - (c.down ? 0.003 : 0); if (c.m.position.y !== ty) c.m.position.y = ty;
  });
  for (var f = 0; f < 11; f++){ var fc = CT['lev' + f]; fc.glowM.color.set(COLCOL[f]).multiplyScalar(M.mutes[f] ? 0.15 : 0.45 + SEQ.flash[f] * 0.55); }
  if (CT.tempo.ring) CT.tempo.ring.material.color.setHex(M.playing && vs % 4 === 0 ? 0xB8FFC8 : 0x1E9A44);
  padGlow.intensity = 0.25 + SEQ.kick * 0.5; padGlow.color.setHex(M.playing ? 0xFF8A5A : 0xFFB48A);
  if (now > M.msgUntil && M.msg){ M.msg = ''; dispDirty = true; }
  if (dispDirty){ dispDirty = false; paintDisp(); }
  if (tempoDirty){ tempoDirty = false; paintTempo(); }
}
