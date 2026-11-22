
/* ================= TEST ROOM ONLY: forget the machines that were taken away ================= */
(function(){
  Object.keys(DEVS).forEach(function(k){ if (!window.JB_TESTROOM.inScene(DEVS[k].g)) delete DEVS[k]; });
  var h = document.getElementById('hint'); if (h){ var t = document.createElement('span'); t.className = 'desk'; t.innerHTML = '<b>TEST ROOM</b> &middot; Plaits x 2 in the synth body &middot; saved apart from the main room'; h.insertBefore(t, h.firstChild); }
  window.__test = { MF:MF, PL:PL, AU:AU, DEVS:DEVS, SNAKES:SNAKES, MX:MX, note:function(n, v, d){ if (!mfAudio()) return false; mfNoteAt(n, v || 0.8, ac.currentTime + 0.05, d || 0.4); return true; }, sync:mfSync, ctx:function(){ return ac; } };
})();
