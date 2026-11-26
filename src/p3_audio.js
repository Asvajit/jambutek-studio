
/* ================= audio: eleven synthesised drum voices, reverb, delay and a master filter ================= */
var ac = null, muted = store('jambutek-muted') === '1';
var AU = { ready:false, chans:[], openHat:null };
var TONES = ['808', '909', '606', 'JAMBU'];
var SENDS = [[0, 0], [.22, .08], [.18, .12], [.18, .12], [.18, .12], [.3, .35], [.42, .25], [.04, .08], [.08, .12], [.28, .1], [.14, .1]];   // reverb, delay per voice
var DIVS = [[0.125, '1/32'], [1 / 6, '1/16T'], [0.25, '1/16'], [1 / 3, '1/8T'], [0.375, '1/16.'], [0.5, '1/8'], [0.75, '1/8.'], [1, '1/4'], [1.5, '1/4.'], [2, '1/2']];
// if the browser pauses the sound (the tab was hidden, a phone call, a sleeping laptop), start it again as soon as the page is back
function audioWake(){ if (ac && ac.state !== 'running' && ac.state !== 'closed'){ try { ac.resume(); } catch (e) {} } }
document.addEventListener('visibilitychange', function(){ if (!document.hidden) audioWake(); }); window.addEventListener('focus', audioWake); window.addEventListener('pointerdown', audioWake, true); window.addEventListener('keydown', audioWake, true);
function unlock(){
  if (ac){ if (ac.state === 'suspended') ac.resume(); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)({ latencyHint:'balanced' });      // a slightly deeper buffer than the smallest one: far fewer dropouts for a few thousandths of a second
    var out = ac.createGain(); out.gain.value = muted ? 0 : OPT.vol; out.connect(ac.destination); AU.out = out;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -9; comp.knee.value = 8; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.12;
    var vol = ac.createGain(); AU.vol = vol;
    AU.ch = []; AU.tap = ac.createGain(); AU.sendA = ac.createGain(); AU.sendB = ac.createGain(); for (var ci = 0; ci < 10; ci++){ var C = { sa:ac.createGain(), sb:ac.createGain(), inp:ac.createGain(), lo:ac.createBiquadFilter(), mid:ac.createBiquadFilter(), hi:ac.createBiquadFilter(), fad:ac.createGain(), duck:ac.createGain(), hp:ac.createBiquadFilter(), lp:ac.createBiquadFilter(), an:ac.createAnalyser(), pre:ac.createAnalyser() };
      C.lo.type = 'lowshelf'; C.lo.frequency.value = 110; C.mid.type = 'peaking'; C.mid.frequency.value = 1000; C.mid.Q.value = 0.8; C.hi.type = 'highshelf'; C.hi.frequency.value = 7000; C.an.fftSize = 256;
      C.inp.connect(C.lo); C.lo.connect(C.mid); C.mid.connect(C.hi); C.hi.connect(C.fad); C.pre.fftSize = 256; C.hi.connect(C.pre); /* pre: the channel before its fader and mute, so a silenced channel's meter still moves */ C.fad.connect(C.duck); C.hp.type = 'highpass'; C.hp.frequency.value = 10; C.hp.Q.value = 0.9; C.lp.type = 'lowpass'; C.lp.frequency.value = 21000; C.lp.Q.value = 0.9; C.duck.connect(C.hp); C.hp.connect(C.lp);      /* the mixer's two master filters, one pair per channel, wide open unless the channel is picked */
      C.lp.connect(C.an); C.lp.connect(comp); if (ci !== 5) C.lp.connect(AU.tap); C.sa.gain.value = C.sb.gain.value = 0; C.lp.connect(C.sa); C.sa.connect(AU.sendA); C.lp.connect(C.sb); C.sb.connect(AU.sendB); AU.ch.push(C); }       // sends are post-fader: A feeds the echo, B the reverb
    vol.connect(AU.ch[0].inp); AU.master = ac.createGain();
    var an = ac.createAnalyser(); an.fftSize = 256; an.smoothingTimeConstant = 0.5; AU.comp = comp; comp.connect(AU.master); AU.master.connect(an); an.connect(out); AU.an = an;
    // master FX: a low-pass below centre, a high-pass above it
    var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 20000; lp.Q.value = 0.7;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 10; hp.Q.value = 0.7;
    lp.connect(hp); hp.connect(vol); AU.lp = lp; AU.hp = hp;
    var bus = ac.createGain(); bus.connect(lp); AU.bus = bus;
    // reverb: a generated room
    var conv = ac.createConvolver(), len = Math.round(ac.sampleRate * 2.1), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (var ch = 0; ch < 2; ch++){ var d = ir.getChannelData(ch), lpv = 0; for (var i = 0; i < len; i++){ var t = i / len, w = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.2) * (i < 400 ? i / 400 : 1); lpv += (w - lpv) * (0.75 - t * 0.5); d[i] = lpv; } }
    conv.buffer = ir; var revIn = ac.createGain(), revRet = ac.createGain(); revIn.connect(conv); conv.connect(revRet); revRet.connect(lp); AU.revIn = revIn; AU.revRet = revRet;
    // delay: tempo-synced, with feedback through a darkening filter
    var dly = ac.createDelay(2.5), fb = ac.createGain(), dlp = ac.createBiquadFilter(), dIn = ac.createGain(), dRet = ac.createGain(); dlp.type = 'lowpass'; dlp.frequency.value = 4200;
    dIn.connect(dly); dly.connect(dlp); dlp.connect(fb); fb.connect(dly); dlp.connect(dRet); dRet.connect(lp); AU.dly = dly; AU.dfb = fb; AU.dIn = dIn; AU.dRet = dRet;
    for (var k = 0; k < 11; k++){
      var g = ac.createGain(), pan = ac.createStereoPanner ? ac.createStereoPanner() : null, rs = ac.createGain(), ds = ac.createGain();
      rs.gain.value = SENDS[k][0]; ds.gain.value = SENDS[k][1];
      if (pan){ pan.pan.value = [0, 0, -0.35, 0, 0.35, 0.2, -0.1, 0.25, 0.25, -0.3, 0.3][k]; g.connect(pan); pan.connect(bus); pan.connect(rs); pan.connect(ds); } else { g.connect(bus); g.connect(rs); g.connect(ds); }
      rs.connect(revIn); ds.connect(dIn);
      AU.chans.push({ g:g, rs:rs, ds:ds });
    }
    var nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0); for (var j = 0; j < nd.length; j++) nd[j] = Math.random() * 2 - 1;
    AU.noise = nb;
    var sh = new Float32Array(1025); for (var s = 0; s < 1025; s++){ var x = s / 512 - 1; sh[s] = Math.tanh(x * 2.2) / Math.tanh(2.2); } AU.shape = sh;      // an odd count, so silence in gives exact silence out (see vBD)
    AU.ready = true; applyMix(); mxApply();
  } catch (e) { ac = null; }
}
/* small building blocks */
function nz(t, dur){ var s = ac.createBufferSource(); s.buffer = AU.noise; s.loop = true; s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); return s; }
function envG(t, peak, dec, att){
  var g = ac.createGain(); g.gain.setValueAtTime(0.0001, t);
  if (att){ g.gain.linearRampToValueAtTime(peak, t + att); } else g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (att || 0) + dec); return g;
}
function osc(type, f, t, dur){ var o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + dur + 0.05); return o; }
function filt(type, f, q){ var b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q == null ? 0.7 : q; return b; }
function semis(v, range){ return Math.pow(2, (v - 0.5) * 2 * range / 12); }

var V808 = [205.3, 304.4, 369.6, 522.7, 540, 800], V606 = [245, 306, 365, 415, 437, 619], VJB = [263, 400, 421, 474, 587, 845];
/* The metal of the hats and cymbals is six square waves at fixed odd pitches. It used to build six oscillators for every single hit
   (hundreds of them every few bars, with a dozen or more running at once), which was the biggest single load on the sound engine.
   Now the six are added up once into a two-second loop per set of pitches, and a hit just plays that loop from a random spot,
   faster or slower for the tuning: one node per hit, the same sound. */
var METAL = {};
function metalBuf(set){
  var key = set.join(','); if (METAL[key]) return METAL[key];
  var sr = ac.sampleRate, n = Math.round(sr * 2), b = ac.createBuffer(1, n, sr), d = b.getChannelData(0);
  set.forEach(function(f){
    var dt = Math.round(f * 2) / 2 / sr, ph = Math.random();                              // whole turns in two seconds, so the loop has no seam
    for (var i = 0; i < n; i++){
      var v = ph < 0.5 ? 1 : -1, x;                                                       // a square with its two edges rounded just enough not to alias
      if (ph < dt){ x = ph / dt; v += x + x - x * x - 1; } else if (ph > 1 - dt){ x = (ph - 1) / dt; v += x * x + x + x + 1; }
      var p2 = ph + 0.5; if (p2 >= 1) p2 -= 1; if (p2 < dt){ x = p2 / dt; v -= x + x - x * x - 1; } else if (p2 > 1 - dt){ x = (p2 - 1) / dt; v -= x * x + x + x + 1; }
      d[i] += v; ph += dt; if (ph >= 1) ph -= 1;
    }
  });
  return METAL[key] = b;
}
function metal(t, dur, mul, set){
  var mix = ac.createGain(); mix.gain.value = 0.3;
  var s = ac.createBufferSource(); s.buffer = metalBuf(set); s.loop = true; s.playbackRate.value = mul; s.connect(mix); s.start(t, Math.random() * 1.9); s.stop(t + dur + 0.05);
  return mix;
}
/* the voices. p = { tune, decay, ctrl } all 0..1, vel 0..1.3, tone = one of TONES */
function vBD(dst, t, vel, p, tone){
  var f0 = ({ '808':49, '909':56, '606':66, 'JAMBU':43 })[tone] * semis(p.tune, 7);
  var sweep = ({ '808':3.2, '909':5.5, '606':2.4, 'JAMBU':6 })[tone], st = ({ '808':0.045, '909':0.06, '606':0.03, 'JAMBU':0.08 })[tone];
  var dec = ({ '808':0.18 + p.decay * p.decay * 1.9, '909':0.12 + p.decay * p.decay * 0.9, '606':0.1 + p.decay * 0.4, 'JAMBU':0.2 + p.decay * p.decay * 1.4 })[tone];
  var o = ac.createOscillator(); o.type = tone === '909' ? 'triangle' : 'sine';
  o.frequency.setValueAtTime(f0 * sweep, t); o.frequency.exponentialRampToValueAtTime(f0, t + st); o.start(t); o.stop(t + dec + 0.1);
  var drive = ac.createGain(); drive.gain.value = 0.45 + p.ctrl * 1.6;
  var ws = ac.createWaveShaper(); ws.curve = AU.shape;
  var comp = ac.createGain(); comp.gain.value = 1.15 / (0.75 + p.ctrl * 0.7);
  var e = envG(t, vel, dec, 0.0015);
  o.connect(drive); drive.connect(ws); ws.connect(comp); comp.connect(e); e.connect(dst);
  // Unhook the hit once it has rung out. The shaper's curve used to give a hair of output for silence in, so the browser never retired
  // it: every kick ever played kept running for good, and after a few minutes the sound engine choked (dropouts).
  o.onended = function(){ try { e.disconnect(); ws.disconnect(); } catch (x) {} };
  var ck = nz(t, 0.02), cf = filt(tone === '909' ? 'highpass' : 'lowpass', tone === '909' ? 1800 : 2600), ce = envG(t, vel * (tone === '909' ? 0.5 : tone === '606' ? 0.3 : 0.2) * (0.5 + p.ctrl), 0.012);
  ck.connect(cf); cf.connect(ce); ce.connect(dst);
}
function vSD(dst, t, vel, p, tone){
  var m = semis(p.tune, 6), nd = ({ '808':0.1 + p.decay * 0.4, '909':0.12 + p.decay * 0.45, '606':0.07 + p.decay * 0.2, 'JAMBU':0.12 + p.decay * 0.6 })[tone];
  var body = ac.createGain(); body.gain.value = 0.9 - p.ctrl * 0.45;
  if (tone === '909' || tone === 'JAMBU'){
    var o = ac.createOscillator(); o.type = 'triangle'; var f = (tone === '909' ? 190 : 165) * m;
    o.frequency.setValueAtTime(f * 1.9, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.035); o.start(t); o.stop(t + 0.3);
    var e = envG(t, vel * 0.9, 0.13); o.connect(e); e.connect(body);
  } else {
    [[tone === '606' ? 210 : 178, 0.14, 0.7], [tone === '606' ? 400 : 331, 0.075, 0.5]].forEach(function(b){ var o2 = osc('sine', b[0] * m, t, 0.3), e2 = envG(t, vel * b[2], b[1]); o2.connect(e2); e2.connect(body); });
  }
  body.connect(dst);
  var n = nz(t, nd), hp = filt('highpass', tone === '909' ? 1400 : tone === '606' ? 2200 : 1000), bp = filt('peaking', tone === 'JAMBU' ? 3200 : 5000, 0.8); bp.gain.value = 5;
  var ne = envG(t, vel * (0.25 + p.ctrl * 0.85), nd); n.connect(hp); hp.connect(bp); bp.connect(ne); ne.connect(dst);
}
function vTom(base){ return function(dst, t, vel, p, tone){
  var f = base * semis(p.tune, 7) * ({ '808':1, '909':1.08, '606':1.25, 'JAMBU':0.9 })[tone], dec = 0.12 + p.decay * p.decay * 0.9 * (tone === '606' ? 0.5 : 1);
  var o = ac.createOscillator(); o.type = tone === '909' ? 'triangle' : 'sine';
  o.frequency.setValueAtTime(f * (1.25 + p.ctrl * 1.6), t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05 + p.ctrl * 0.06); o.start(t); o.stop(t + dec + 0.1);
  var e = envG(t, vel * 0.9, dec, 0.001); o.connect(e); e.connect(dst);
  var n = nz(t, 0.08), lp2 = filt('lowpass', f * 6), ne = envG(t, vel * (tone === '909' ? 0.22 : 0.1), 0.05); n.connect(lp2); lp2.connect(ne); ne.connect(dst);
}; }
function vRS(dst, t, vel, p, tone){
  var m = semis(p.tune, 7), dec = 0.012 + p.decay * 0.07, e = envG(t, vel * 0.8, dec);
  var hp = filt('highpass', 300 + p.ctrl * 1200); hp.connect(e); e.connect(dst);
  (tone === '909' ? [[220, 'sine'], [500, 'sine'], [1012, 'triangle']] : tone === '606' ? [[820, 'square']] : [[455, 'triangle'], [1667, 'triangle']]).forEach(function(b){ var o = osc(b[1], b[0] * m, t, dec + 0.02); var g = ac.createGain(); g.gain.value = 0.6; o.connect(g); g.connect(hp); });
  var n = nz(t, 0.01), ne = envG(t, vel * 0.3, 0.004); n.connect(ne); ne.connect(hp);
}
function vHC(dst, t, vel, p, tone){
  var f = (tone === '909' ? 1250 : tone === 'JAMBU' ? 950 : 1100) * semis(p.tune, 7), tail = 0.07 + p.decay * 0.5;
  var n = nz(t, tail + 0.05), bp = filt('bandpass', f, 1.3 + p.ctrl * 2.2), hp = filt('highpass', 500 + p.ctrl * 500), g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  [0, 0.011, 0.022].forEach(function(o){ g.gain.setValueAtTime(vel * 1.5, t + o); g.gain.exponentialRampToValueAtTime(vel * 0.12, t + o + 0.01); });
  g.gain.setValueAtTime(vel * 1.3, t + 0.033); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.033 + tail);
  n.connect(bp); bp.connect(hp); hp.connect(g); g.connect(dst);
}
function hatSrc(t, dur, p, tone){
  var mul = semis(p.tune, 6), out = ac.createGain();
  if (tone === '909'){ var n = nz(t, dur), pk = filt('peaking', 9000 * mul, 1.2); pk.gain.value = 8; n.connect(pk); pk.connect(out); var mt = metal(t, dur, mul * 1.9, V808); mt.gain.value = 0.1; mt.connect(out); out.gain.value = 0.55; }
  else { var m2 = metal(t, dur, mul, tone === '606' ? V606 : tone === 'JAMBU' ? VJB : V808); m2.connect(out); }
  return out;
}
function vCH(dst, t, vel, p, tone){
  if (AU.openHat){ try { AU.openHat.gain.setTargetAtTime(0.0001, t, 0.006); } catch (e) {} AU.openHat = null; }      /* a closed hat cuts the open one: on the open hat's own choke gain, so its decay keeps its shape up to the cut (cancelling the envelope here used to leave it at full level until then) */
  var dec = 0.022 + p.decay * p.decay * 0.16, s = hatSrc(t, dec, p, tone), bp = filt('bandpass', tone === '606' ? 7200 : 10000, 0.7), hp = filt('highpass', 4500 + p.ctrl * 5500), e = envG(t, vel * 0.75, dec);
  s.connect(bp); bp.connect(hp); hp.connect(e); e.connect(dst);
}
function vOH(dst, t, vel, p, tone){
  var dec = 0.12 + p.decay * p.decay * 1.3, s = hatSrc(t, dec, p, tone), bp = filt('bandpass', tone === '606' ? 7200 : 10000, 0.7), hp = filt('highpass', 4500 + p.ctrl * 5500), e = envG(t, vel * 0.7, dec);
  var ck = ac.createGain(); s.connect(bp); bp.connect(hp); hp.connect(e); e.connect(ck); ck.connect(dst); AU.openHat = ck;
}
function vCC(dst, t, vel, p, tone){
  var dec = 0.5 + p.decay * p.decay * 2.6, mul = semis(p.tune, 6);
  var m = metal(t, dec, mul * (tone === '606' ? 1.1 : 1), tone === '606' ? V606 : V808), n = nz(t, dec), ng = ac.createGain(); ng.gain.value = tone === '909' ? 0.5 : 0.18;
  var hp = filt('highpass', 2500 + p.ctrl * 5000), pk = filt('peaking', 5200, 0.9); pk.gain.value = 6;
  var e = envG(t, vel * 0.6, dec), e2 = envG(t, vel * 0.5, 0.09);
  m.connect(hp); n.connect(ng); ng.connect(hp); hp.connect(pk); pk.connect(e); pk.connect(e2); e.connect(dst); e2.connect(dst);
}
function vRC(dst, t, vel, p, tone){
  var dec = 0.35 + p.decay * p.decay * 2.2, mul = semis(p.tune, 6) * 1.42;
  var m = metal(t, dec, mul, tone === '606' ? V606 : tone === 'JAMBU' ? VJB : V808), bp = filt('bandpass', 6500 + p.ctrl * 5000, 2.2), hp = filt('highpass', 3500);
  var e = envG(t, vel * 0.9, dec), ping = osc('sine', 5300 * semis(p.tune, 6), t, 0.2), pe = envG(t, vel * 0.05, 0.12);
  m.connect(bp); bp.connect(hp); hp.connect(e); e.connect(dst); ping.connect(pe); pe.connect(dst);
  if (tone === '909'){ var n = nz(t, dec), nh = filt('highpass', 8000), ne = envG(t, vel * 0.12, dec * 0.7); n.connect(nh); nh.connect(ne); ne.connect(dst); }
}
var VOICES = [vBD, vSD, vTom(88), vTom(128), vTom(176), vRS, vHC, vCH, vOH, vCC, vRC];
