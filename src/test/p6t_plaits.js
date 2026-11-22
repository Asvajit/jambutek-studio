
/* ================= TEST ROOM ONLY: two Plaits-style sound engines in the synth's body =================
   This file is only in the /test build. It leaves the synth's body, filter, envelopes, LFOs, matrix, effects, arp and sequencer as they
   are and swaps what its two oscillators are: each becomes a macro-oscillator with sixteen models, after Mutable Instruments Plaits,
   with TYPE picking the model and WAVE / TIMBRE / SHAPE standing in for Plaits' HARMONICS / TIMBRE / MORPH. Two more types, Rings
   (a resonator) and Warps (a cross-modulator), take the other oscillator's sound as their input, so oscillator 2 can process oscillator 1.
   On oscillator 1, where there is nothing to process, Rings is struck by each note and Warps modulates against its own second sine.

   The models are written for this room from the published designs and panel meanings of Plaits, Rings and Warps (Emilie Gillet,
   Mutable Instruments, MIT licence: see vendor/MUTABLE-NOTICE.md). They are not a line-for-line port of that code, so they will not
   sound identical to the modules. Each voice's oscillator is one AudioWorklet node. */
var MFENG0 = MFENG.slice();                                    // the room synth's own engines, kept for the other machines that borrow them
MFTYPES.length = 0; ['Pair', 'Waveshaper', 'Two Op. FM', 'Formant', 'Harmonic', 'Wavetable', 'Chords', 'Speech', 'Swarm', 'Noise', 'Particles', 'String', 'Modal', 'Bass drum', 'Snare', 'Hi-hat', 'Rings', 'Warps'].forEach(function(n){ MFTYPES.push(n); });
MFPN.length = 0; [['Detune', 'Pulse', 'Saw'], ['Shape', 'Fold', 'Asym'], ['Ratio', 'Index', 'Feedback'], ['Ratio', 'Formant', 'Width'], ['Bumps', 'Harmonic', 'Spread'], ['Bank', 'Row', 'Column'], ['Chord', 'Inversion', 'Wave'], ['Voice', 'Species', 'Phoneme'],
  ['Scatter', 'Density', 'Grain'], ['Response', 'Clock', 'Reso'], ['Scatter', 'Density', 'Ring'], ['Inharm', 'Bright', 'Decay'], ['Material', 'Bright', 'Decay'], ['Punch', 'Tone', 'Decay'], ['Noise', 'Tone', 'Decay'], ['Noise', 'Cutoff', 'Decay'],
  ['Structure', 'Bright', 'Damping'], ['Algorithm', 'Timbre', 'Osc']].forEach(function(n){ MFPN.push(n); });
var PL = { ready:false, loading:false, src:new WeakMap(), gain:[1, 0.8, 0.8, 2, 1.2, 0.85, 0.9, 2, 1.4, 1.3, 2, 1, 1, 1, 1.1, 1.3, 1.1, 0.8] };

function plWorklet(){
  var SR = sampleRate, TAU = Math.PI * 2;
  var VOW = [[800, 1150, 2900], [400, 1600, 2700], [270, 2290, 3010], [450, 800, 2830], [325, 700, 2530]];
  var CH = [[0, 12], [0, 7], [0, 5, 7], [0, 3, 7], [0, 3, 7, 10], [0, 4, 7], [0, 4, 7, 11], [0, 4, 7, 14]];
  var FMR = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8], HAT = [1, 1.342, 1.2312, 1.6532, 1.9523, 2.1523];
  function pb(t, dt){ if (t < dt){ var x = t / dt; return x + x - x * x - 1; } if (t > 1 - dt){ var y = (t - 1) / dt; return y * y + y + y + 1; } return 0; }
  function tanh(x){ return x < -3 ? -1 : x > 3 ? 1 : x * (27 + x * x) / (27 + 9 * x * x); }
  function Svf(){ this.a = 0; this.b = 0; this.lp = 0; this.bp = 0; this.hp = 0; }
  Svf.prototype.run = function(x, g, k){ var hp = (x - (g + k) * this.a - this.b) / (1 + g * (g + k)), bp = g * hp + this.a; this.a = g * hp + bp; var lp = g * bp + this.b; this.b = g * bp + lp; this.lp = lp; this.bp = bp; this.hp = hp; };
  function gOf(f){ return Math.tan(Math.PI * Math.min(f, SR * 0.45) / SR); }
  function Mode(){ this.y1 = 0; this.y2 = 0; this.c = 0; this.r2 = 0; this.b = 0; this.g = 0; this.in = 0; }
  Mode.prototype.set = function(f, T, gain){ if (f > SR * 0.45){ this.g = 0; return; } var w = TAU * f / SR, r = Math.exp(-1 / (Math.max(0.002, T) * SR)); this.c = 2 * r * Math.cos(w); this.r2 = r * r; this.b = Math.sin(w); this.g = gain; this.in = Math.pow(1 - r, 0.7) * 1.2; };
  Mode.prototype.run = function(x){ var y = x * this.b + this.c * this.y1 - this.r2 * this.y2; this.y2 = this.y1; this.y1 = y; return y * this.g; };

  class P extends AudioWorkletProcessor {
    static get parameterDescriptors(){ return [{ name:'detune', defaultValue:0, automationRate:'k-rate' }, { name:'h', defaultValue:0.5, automationRate:'k-rate' }, { name:'t', defaultValue:0.5, automationRate:'k-rate' }, { name:'m', defaultValue:0.5, automationRate:'k-rate' }, { name:'gate', defaultValue:0, automationRate:'k-rate' }]; }
    constructor(o){
      super(); var q = (o && o.processorOptions) || {}; this.model = q.model | 0; this.f0 = q.f || 220; this.on = false; this.seen = false; this.age = 0; this.trig = false;
      this.rng = ((Math.random() * 4294967295) >>> 0) || 1; this.p = new Float64Array(16); this.z = new Float64Array(16); this.amp = new Float64Array(16);
      var i, m = this.model;
      if (m === 7 || m === 9 || m === 10) this.f = [new Svf(), new Svf(), new Svf()];
      if (m === 15) this.f = [new Svf(), new Svf()];
      if (m === 8){ this.gr = []; for (i = 0; i < 8; i++) this.gr.push({ on:false, ph:Math.random(), r:1, e:0, len:1 }); }
      if (m === 11){ this.buf = new Float32Array(8192); this.w = 0; this.exc = 0; }
      if (m === 12 || m === 16){ this.md = []; for (i = 0; i < (m === 16 ? 14 : 10); i++) this.md.push(new Mode()); this.exc = 0; }
      this.env = 0; this.pe = 0; this.e2 = 0;
    }
    rnd(){ var x = this.rng; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.rng = x >>> 0; return this.rng / 4294967296; }
    process(inputs, outputs, A){
      var out = outputs[0][0], inp = inputs[0] && inputs[0][0], n = out.length, i;
      if (A.gate[0] > 0.5){ if (!this.on){ this.on = true; this.trig = true; } this.seen = true; }
      else { if (this.seen) return false; if (++this.age > SR / 128 * 30) return false; for (i = 0; i < n; i++) out[i] = 0; return true; }      // not started yet, or the voice has ended
      var f = Math.min(SR * 0.45, Math.max(8, this.f0 * Math.pow(2, A.detune[0] / 1200)));
      this.render(out, inp, n, f, A.h[0], A.t[0], A.m[0]); this.trig = false;
      var dx = this.dx || 0, dy = this.dy || 0; for (i = 0; i < n; i++){ var v = out[i]; if (!(v > -8 && v < 8)) v = 0; dy = v - dx + 0.9993 * dy; dx = v; out[i] = dy; } this.dx = dx; this.dy = dy;      // no DC, and nothing wild, leaves an engine
      return true;
    }
    render(out, inp, n, f, h, t, m){
      var p = this.p, z = this.z, dp = f / SR, i, k, s, a, b, x, y, w;
      switch (this.model){
      case 0: {                                                  // a pair of classic waveforms
        var d = (h - 0.5) * 2, fb = f * Math.pow(2, (d < 0 ? -1 : 1) * d * d * 2), db = Math.min(0.45, fb / SR), pw = 0.5 - t * 0.46; a = p[0]; b = p[1];
        for (i = 0; i < n; i++){ a += dp; if (a >= 1) a -= 1; b += db; if (b >= 1) b -= 1; var sq = (a < pw ? 1 : -1) + pb(a, dp) - pb((a + 1 - pw) % 1, dp), saw = 2 * b - 1 - pb(b, db), tri = 1 - 4 * Math.abs(b - 0.5);
          w = m < 0.5 ? tri + (saw - tri) * m * 2 : saw + (m - 0.5) * 1.2 * (2 * ((2 * b) % 1) - 1); out[i] = (sq - (2 * pw - 1) + w) * 0.25; }
        p[0] = a; p[1] = b; break; }
      case 1: {                                                  // waveshaping oscillator
        var as = 0.5 + (m - 0.5) * 0.9, fold = Math.PI * 0.5 * (1 + t * t * 7); a = p[0];
        for (i = 0; i < n; i++){ a += dp; if (a >= 1) a -= 1; var pd = a < as ? a * 0.5 / as : 0.5 + (a - as) * 0.5 / (1 - as); s = Math.sin(TAU * pd); var tr = 1 - 4 * Math.abs(((pd + 0.25) % 1) - 0.5);
          x = h < 0.5 ? s + (tr - s) * h * 2 : tr + ((s < 0 ? -1 : 1) * Math.pow(Math.abs(s), 0.3) - tr) * (h - 0.5) * 2; out[i] = Math.sin(x * fold) * 0.5; }
        p[0] = a; break; }
      case 2: {                                                  // two-operator FM
        var r = FMR[Math.round(h * (FMR.length - 1))], ix = t * t * 6, fbk = (m - 0.5) * 2, dm = Math.min(0.45, dp * r); a = p[0]; b = p[1]; var lm = z[0], lc = z[1];
        for (i = 0; i < n; i++){ a += dp; if (a >= 1) a -= 1; b += dm; if (b >= 1) b -= 1; lm = Math.sin(TAU * b + (fbk > 0 ? fbk * lm * 1.6 : 0)); lc = Math.sin(TAU * a + ix * lm + (fbk < 0 ? -fbk * lc * 1.4 : 0)); out[i] = lc * 0.5; }
        p[0] = a; p[1] = b; z[0] = lm; z[1] = lc; break; }
      case 3: {                                                  // granular formant oscillator
        var ff = Math.min(SR * 0.4, f * Math.pow(2, t * 4.5)) / f, r2 = 1 + h * 3, we = 1 + (1 - m) * 8; a = p[0];
        for (i = 0; i < n; i++){ a += dp; if (a >= 1) a -= 1; w = Math.pow(1 - a, we); out[i] = (Math.sin(TAU * a * ff) + 0.6 * Math.sin(TAU * a * ff * r2)) * w * 0.4; }
        p[0] = a; break; }
      case 4: {                                                  // harmonic oscillator
        var c0 = 1 + t * 10, wd = 0.35 + m * 3, nb = 1 + Math.round(h * 2), am = this.amp, sum = 0;
        for (k = 1; k <= 12; k++){ var g = 0; for (var j = 0; j < nb; j++){ var cj = c0 + (j === 0 ? 0 : j === 1 ? 3.5 : -3.5), q = (k - cj) / wd, e = Math.exp(-q * q); if (e > g) g = e; } if (k * f > SR * 0.45) g = 0; am[k] = g; sum += g * g; }
        var nm = 0.3 / Math.sqrt(sum || 1); a = p[0];
        for (i = 0; i < n; i++){ a += dp; if (a >= 1) a -= 1; s = 0; for (k = 1; k <= 12; k++) if (am[k] > 0.001) s += am[k] * Math.sin(TAU * k * a); out[i] = s * nm; }
        p[0] = a; break; }
      case 5: {                                                  // wavetable
        var kk = 1 + Math.round(t * 6), aa = m * m * 4, sm = h < 0.5 ? (0.5 - h) * 1.4 : 0, lv = h > 0.5 ? 2 + (1 - (h - 0.5) * 2) * 30 : 0; a = p[0];
        for (i = 0; i < n; i++){ a += dp; if (a >= 1) a -= 1; var s1 = Math.sin(TAU * a); s = Math.sin(TAU * a + aa * Math.sin(TAU * kk * a)); s += (s1 - s) * sm; if (lv) s = Math.round(s * lv) / lv; out[i] = s * 0.45; }
        p[0] = a; break; }
      case 6: {                                                  // chords
        var iv = CH[Math.min(7, Math.round(h * 7))], inv = Math.floor(t * 3.99), ds = [];
        for (k = 0; k < 4; k++){ var st = iv[k % iv.length] + 12 * Math.floor(k / iv.length) + (k < inv ? 12 : 0); ds.push(Math.min(0.45, dp * Math.pow(2, st / 12))); }
        for (i = 0; i < n; i++){ s = 0; for (k = 0; k < 4; k++){ a = p[k] + ds[k]; if (a >= 1) a -= 1; p[k] = a; var sw = 2 * a - 1 - pb(a, ds[k]), sq2 = (a < 0.5 ? 1 : -1) + pb(a, ds[k]) - pb((a + 0.5) % 1, ds[k]);
            s += m < 0.5 ? sw + (sq2 - sw) * m * 2 : sq2 + ((Math.sin(TAU * a) + 0.5 * Math.sin(2 * TAU * a)) * 0.8 - sq2) * (m - 0.5) * 2; } out[i] = s * 0.12; }
        break; }
      case 7: {                                                  // vowel and speech
        var u = Math.min(0.9999, m) * 4, vi = Math.floor(u), vf = u - vi, sh = 0.7 + t * 0.9, F = this.f, gs = [], crush = h > 0.6 ? 3 + (1 - (h - 0.6) / 0.4) * 20 : 0; a = p[0];
        for (k = 0; k < 3; k++) gs.push(gOf((VOW[vi][k] + (VOW[vi + 1][k] - VOW[vi][k]) * vf) * sh));
        for (i = 0; i < n; i++){ a += dp; if (a >= 1) a -= 1; x = (2 * a - 1 - pb(a, dp)) * (1 - h * 0.5) + (this.rnd() * 2 - 1) * h * 0.6; F[0].run(x, gs[0], 0.09); F[1].run(x, gs[1], 0.09); F[2].run(x, gs[2], 0.09);
          s = (F[0].bp + F[1].bp * 0.6 + F[2].bp * 0.3) * 0.16; if (crush) s = Math.round(s * crush) / crush; out[i] = s; }
        p[0] = a; break; }
      case 8: {                                                  // granular cloud: a swarm of sawtooth grains
        var G = this.gr, prob = (1 + t * t * 60) / SR, len = (0.012 + m * m * 0.5) * SR, sc = h * h;
        for (i = 0; i < n; i++){ s = 0; for (k = 0; k < 8; k++){ var q2 = G[k]; if (!q2.on){ if (this.rnd() < prob || m > 0.95){ q2.on = true; q2.e = 0; q2.len = len * (0.6 + this.rnd() * 0.8); q2.r = Math.pow(2, (this.rnd() * 2 - 1) * sc); } else continue; }
            q2.ph += dp * q2.r; if (q2.ph >= 1) q2.ph -= 1; s += (2 * q2.ph - 1) * (0.5 - 0.5 * Math.cos(TAU * q2.e)); q2.e += 1 / q2.len; if (q2.e >= 1) q2.on = false; } out[i] = s * 0.2; }
        break; }
      case 9: {                                                  // clocked noise through a multimode filter
        var per = Math.max(1, SR / Math.min(SR, f * Math.pow(2, t * 7))), F9 = this.f[0], g9 = gOf(f * 2), k9 = 1 / (0.5 + m * m * 30), nv = z[1]; a = z[0];
        for (i = 0; i < n; i++){ a += 1; if (a >= per){ a -= per; nv = this.rnd() * 2 - 1; } F9.run(nv, g9, k9); out[i] = (h < 0.5 ? F9.lp + (F9.bp - F9.lp) * h * 2 : F9.bp + (F9.hp - F9.bp) * (h - 0.5) * 2) * (0.18 + k9 * 0.12); }
        z[0] = a; z[1] = nv; break; }
      case 10: {                                                 // particle noise: dust through three resonators
        var rate = (2 + t * t * t * 3000) / SR, F10 = this.f, k10 = 1 / (8 + m * m * 120), gg = this.gg || (this.gg = [gOf(f), gOf(f * 1.5), gOf(f * 2)]); var nx = z[0] | 0;
        for (i = 0; i < n; i++){ x = 0; if (this.rnd() < rate){ x = this.rnd() * 2 - 1; nx = (nx + 1) % 3; gg[nx] = gOf(f * Math.pow(2, (this.rnd() * 2 - 1) * h * 2)); }
          s = 0; for (k = 0; k < 3; k++){ F10[k].run(k === nx ? x : 0, gg[k], k10); s += F10[k].bp; } out[i] = tanh(s * 4) * 0.6; }
        z[0] = nx; break; }
      case 11: {                                                 // inharmonic string
        var B = this.buf, N = B.length, D = Math.min(N - 2, Math.max(2, SR / f - 1)), T = 0.05 * Math.pow(160, m), gl = Math.exp(-1 / (f * T)), cc = 0.2 + t * 0.75, ap = h * 0.6, wI = this.w, lp = z[0], st2 = z[1], el = z[2], dust = t > 0.6 ? (t - 0.6) * 60 / SR : 0;
        if (this.trig) this.exc = Math.ceil(D);
        for (i = 0; i < n; i++){ x = 0; if (this.exc > 0){ this.exc--; el += (0.05 + t * 0.9) * ((this.rnd() * 2 - 1) - el); x = el * 2.5; } else if (dust && this.rnd() < dust) x = (this.rnd() * 2 - 1) * 0.5;
          var rp = wI - D; if (rp < 0) rp += N; var i0 = rp | 0, fr = rp - i0; y = B[i0] + (B[(i0 + 1) % N] - B[i0]) * fr; lp += cc * (y - lp); var o2 = -ap * lp + st2; st2 = lp + ap * o2; B[wI] = x + o2 * gl; wI = (wI + 1) % N; out[i] = tanh(y * 0.8); }
        this.w = wI; z[0] = lp; z[1] = st2; z[2] = el; break; }
      case 12: case 16: {                                        // modal resonator; type 16 (Rings) is the same bank fed from the input
        var MD = this.md, nm2 = MD.length, ring = this.model === 16, Tb = ring ? 0.02 * Math.pow(400, m) : 0.03 * Math.pow(300, m), ex = ring ? 1 + Math.max(0, h - 0.25) * 1.5 : 1 + h * 1.2;
        for (k = 0; k < nm2; k++){ var kq = k + 1; MD[k].set(f * Math.pow(kq, ex), Tb / (1 + k * (1 - t) * 0.9), 1 / Math.pow(kq, 1.6 - t * 1.4)); }
        if (this.trig && !(ring && inp)) this.exc = Math.ceil(SR * 0.003);
        var el2 = z[0];
        for (i = 0; i < n; i++){ x = 0; if (this.exc > 0){ this.exc--; el2 += (0.1 + t * 0.85) * ((this.rnd() * 2 - 1) - el2); x = el2 * 0.6; } s = 0;
          if (ring && inp){ var xi = inp[i]; for (k = 0; k < nm2; k++) s += MD[k].run(xi * MD[k].in); out[i] = tanh(s * 0.5) * 0.6; }      // driven by the other oscillator: it rings up, and is held back from overloading
          else { for (k = 0; k < nm2; k++) s += MD[k].run(x); out[i] = tanh(s * 0.12) * 1.2; } }
        z[0] = el2; break; }
      case 13: {                                                 // analogue bass drum
        if (this.trig){ this.env = 1; this.pe = 1; p[0] = 0; } var Tk = 0.06 * Math.pow(40, m), ed = Math.exp(-1 / (Tk * SR)), pd2 = Math.exp(-1 / (0.012 * (1 + t) * SR)), drv = 1 + h * 6; a = p[0];
        for (i = 0; i < n; i++){ a += dp * (1 + this.pe * (1 + t * 6)); if (a >= 1) a -= 1; s = Math.sin(TAU * a) * this.env; out[i] = tanh(s * drv) * 0.8 / (1 + h * 0.4) + Math.pow(this.pe, 8) * t * 0.25; this.env *= ed; this.pe *= pd2; }
        p[0] = a; break; }
      case 14: {                                                 // analogue snare
        if (this.trig){ this.env = 1; this.e2 = 1; } var Ts = 0.04 * Math.pow(20, m), e1 = Math.exp(-1 / (Ts * SR)), e2d = Math.exp(-1 / (Ts * 1.6 * SR)), lpn = z[0]; a = p[0]; b = p[1];
        for (i = 0; i < n; i++){ a += dp; if (a >= 1) a -= 1; b += dp * 1.6; if (b >= 1) b -= 1; var nz = this.rnd() * 2 - 1; lpn += (0.2 + t * 0.6) * (nz - lpn);
          out[i] = ((Math.sin(TAU * a) * (1 - t * 0.6) + Math.sin(TAU * b) * (0.3 + t * 0.6)) * this.env * (1 - h) + (nz - lpn * 0.7) * this.e2 * (0.25 + h)) * 0.6; this.env *= e1; this.e2 *= e2d; }
        p[0] = a; p[1] = b; z[0] = lpn; break; }
      case 15: {                                                 // analogue hi-hat
        if (this.trig) this.env = 1; var Th = 0.02 * Math.pow(40, m), eh = Math.exp(-1 / (Th * SR)), fh = Math.min(SR * 0.1, f * 3), g1 = gOf(7000 + t * 5000), g2 = gOf(2500 + t * 9000), Fh = this.f;
        for (i = 0; i < n; i++){ s = 0; for (k = 0; k < 6; k++){ a = p[k] + fh * HAT[k] / SR; if (a >= 1) a -= 1; p[k] = a; s += a < 0.5 ? 1 : -1; } s = s / 6 * (1 - h * 0.8) + (this.rnd() * 2 - 1) * h;
          Fh[0].run(s, g1, 0.5); Fh[1].run(Fh[0].bp, g2, 0.8); out[i] = tanh(Fh[1].hp * 0.9) * this.env * 0.8; this.env *= eh; }
        break; }
      default: {                                                 // 17, Warps: the input against an internal oscillator
        var u2 = Math.min(0.9999, h) * 5, al = Math.floor(u2), af = u2 - al, dv = 1 + t * 3; a = p[0]; b = p[1];
        for (i = 0; i < n; i++){ a += dp; if (a >= 1) a -= 1; b += dp * 1.5; if (b >= 1) b -= 1; var sn = Math.sin(TAU * a), tr2 = 1 - 4 * Math.abs(a - 0.5), sw2 = 2 * a - 1 - pb(a, dp);
          var car = m < 0.5 ? sn + (tr2 - sn) * m * 2 : tr2 + (sw2 - tr2) * (m - 0.5) * 2, mod = inp ? inp[i] * 2 : Math.sin(TAU * b), o = [0, 0];
          for (k = 0; k < 2; k++){ var q3 = al + k;
            o[k] = q3 === 0 ? car * (1 - t) + mod * t : q3 === 1 ? Math.sin((car + mod) * (0.5 + t * 3) * Math.PI * 0.5) : q3 === 2 ? tanh(car * mod * dv * 1.5) : q3 === 3 ? Math.max(-1, Math.min(1, car * mod * dv * 2))
              : q3 === 4 ? (((car * 32767) ^ (mod * 32767 * (0.3 + t * 0.7))) / 32768) : (Math.abs(mod) * (0.4 + t) > Math.abs(car) ? mod : car); }
          out[i] = (o[0] + (o[1] - o[0]) * af) * 0.5; }
        p[0] = a; p[1] = b; }
      }
    }
  }
  registerProcessor('jb-plaits', P);
}
function plLoad(){
  if (PL.ready || PL.loading || !ac || !ac.audioWorklet) return; PL.loading = true;
  try { var u = URL.createObjectURL(new Blob(['(' + plWorklet.toString() + ')();'], { type:'application/javascript' }));
    ac.audioWorklet.addModule(u).then(function(){ PL.ready = true; URL.revokeObjectURL(u); }).catch(function(e){ PL.loading = false; PL.err = String(e); toast('The Plaits engines could not start: ' + PL.err, 6000); }); } catch (e) { PL.loading = false; }
}
setInterval(plLoad, 400);                                      // as soon as there is an audio context, load the engines so the first note has them
function plEng(model){ return function(x){
  if (!PL.ready){ plLoad(); return { out:x.G(0), set:function(){} }; }
  var n = new AudioWorkletNode(ac, 'jb-plaits', { numberOfInputs:1, numberOfOutputs:1, outputChannelCount:[1], processorOptions:{ model:model, f:x.f * Math.pow(2, x.det / 1200) } });
  var P = n.parameters, gate = x.K(1), out = x.G(PL.gain[model]); gate.connect(P.get('gate')); x.pb.connect(P.get('detune')); n.connect(out);      // the gate source stops with the voice, which ends the node
  var list = PL.src.get(x.pb); if (!list){ list = []; PL.src.set(x.pb, list); }
  if (model >= 16){ for (var i = 0; i < list.length; i++) if (list[i].det === x.det && list[i].model < 16){ list[i].out.connect(n); break; } }      // Rings and Warps listen to the other oscillator of the same voice
  list.push({ det:x.det, model:model, out:out });
  return { out:out, set:function(p, t, i){ PS(P.get('h'), p.w, t, i); PS(P.get('t'), p.ti, t, i); PS(P.get('m'), p.s, t, i); } };
}; }
MFENG.length = 0; for (var pli = 0; pli < 18; pli++) MFENG.push(plEng(pli));

function plFactory(){ return [
  mfP('Pair Keys', 'Keys', { o1:{ t:0, w:0.56, ti:0.3, s:0.8 }, o2:{ t:4, semi:12, w:0, ti:0.2, s:0.3, v:0.3 }, cut:0.55, res:0.15, fenv:0.7, a:0.01, d:0.45, s:0.4, r:0.35, fx:[{ on:1, a:0.3, b:0.4, c:0.3 }, null, { on:1, c:0.22 }] }),
  mfP('Fold Bass', 'Bass', { o1:{ t:1, semi:-12, w:0.1, ti:0.5, s:0.5 }, o2:{ t:0, semi:-12, w:0.5, ti:0, s:0.2, v:0.4 }, mode:0, glide:0.12, cut:0.45, res:0.25, fenv:0.75, a:0.005, d:0.4, s:0.3, r:0.2, fx:[null, null, { on:0 }], mod:[[1, 2, 0.35]] }),
  mfP('FM Bell', 'Keys', { o1:{ t:2, w:0.55, ti:0.45, s:0.5 }, o2:{ t:2, semi:12, w:0.9, ti:0.25, s:0.5, v:0.3 }, cut:0.9, a:0.003, d:0.6, s:0.1, r:0.6, fx:[null, { on:1, a:0.6, b:0.45, c:0.3 }, { on:1, a:0.6, c:0.35 }] }),
  mfP('Vox Lead', 'Lead', { o1:{ t:7, w:0.1, ti:0.5, s:0.1 }, o2:{ t:3, w:0.2, ti:0.5, s:0.5, v:0.25 }, mode:0, glide:0.3, cut:0.85, a:0.03, d:0.5, s:0.8, r:0.25, l1:{ rate:0.35, wave:1 }, fx:[null, { on:1, a:0.5, b:0.4, c:0.3 }, { on:1, c:0.25 }], mod:[[2, 2, 0.5]] }),
  mfP('Glass Harmonics', 'Pad', { o1:{ t:4, w:0.5, ti:0.4, s:0.3 }, o2:{ t:4, semi:7, w:0, ti:0.7, s:0.15, v:0.4 }, cut:0.9, a:0.3, d:0.6, s:0.7, r:0.65, fx:[{ on:1, a:0.2, b:0.5, c:0.4 }, null, { on:1, a:0.8, c:0.5 }], mod:[[2, 1, 0.3]] }),
  mfP('Table Sweep', 'Lead', { o1:{ t:5, w:0.4, ti:0.3, s:0.4 }, o2:{ t:5, semi:-12, w:0.7, ti:0.15, s:0.2, v:0.4 }, cut:0.7, res:0.2, fenv:0.6, a:0.01, d:0.5, s:0.6, r:0.3, fx:[null, { on:1, a:0.5, b:0.35, c:0.3 }, { on:1, c:0.2 }], mod:[[2, 2, 0.45]] }),
  mfP('Chord Stab', 'Stab', { o1:{ t:6, w:0.57, ti:0.3, s:0.1 }, o2:{ t:0, semi:-12, w:0.5, ti:0, s:0.9, v:0.35 }, cut:0.45, res:0.3, fenv:0.8, a:0.004, d:0.35, s:0.05, r:0.3, fx:[{ on:1 }, { on:1, a:0.66, b:0.5, c:0.35 }, { on:1, c:0.3 }] }),
  mfP('Swarm Pad', 'Pad', { o1:{ t:8, w:0.25, ti:0.9, s:0.85 }, o2:{ t:8, semi:-12, w:0.4, ti:0.6, s:0.6, v:0.5 }, cut:0.55, res:0.1, fenv:0.6, a:0.5, d:0.6, s:0.85, r:0.6, fx:[{ on:1, a:0.25, b:0.6, c:0.4 }, null, { on:1, a:0.7, b:0.4, c:0.45 }] }),
  mfP('Plucked String', 'Keys', { o1:{ t:11, w:0.1, ti:0.5, s:0.7 }, o2:{ t:11, semi:12, w:0.3, ti:0.3, s:0.5, v:0.3 }, cut:0.95, fenv:0.5, a:0.002, d:0.9, s:0.9, r:0.8, fx:[null, { on:1, a:0.5, b:0.4, c:0.25 }, { on:1, c:0.3 }] }),
  mfP('Mallet', 'Keys', { o1:{ t:12, w:0.35, ti:0.6, s:0.6 }, o2:{ t:12, semi:12, w:0.8, ti:0.4, s:0.4, v:0.25 }, cut:0.95, fenv:0.5, a:0.002, d:0.9, s:0.9, r:0.8, fx:[null, null, { on:1, a:0.6, c:0.35 }] }),
  mfP('Ringed Saw', 'Lead', { o1:{ t:0, w:0.5, ti:0.2, s:0.9, v:0.3 }, o2:{ t:16, semi:0, w:0.3, ti:0.6, s:0.55, v:0.85 }, cut:0.9, a:0.005, d:0.5, s:0.7, r:0.5, fx:[null, { on:1, a:0.5, b:0.35, c:0.25 }, { on:1, c:0.3 }] }),
  mfP('Warped FM', 'SFX', { o1:{ t:2, w:0.3, ti:0.4, s:0.5, v:0.2 }, o2:{ t:17, semi:-12, w:0.45, ti:0.5, s:0.2, v:0.85 }, cut:0.8, res:0.2, a:0.01, d:0.5, s:0.7, r:0.4, l1:{ rate:0.3, wave:1 }, fx:[null, { on:1, a:0.5, b:0.4, c:0.3 }, { on:1, c:0.25 }], mod:[[2, 3, 0.35]] })
]; }
mfFactory = plFactory;
if (!store(MFSAVE)){ MF.presets = plFactory(); MF.cur = 0; MF.p = JSON.parse(JSON.stringify(MF.presets[0])); }      // nothing saved in the test room yet: start on the new sounds
