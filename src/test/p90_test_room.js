
/* ================= TEST ROOM ONLY: strip the room down to a bench =================
   The /test build loads the whole room and then takes away everything that is not needed to try out an instrument: the other
   instruments and their Snakes, the stage lights, speakers, neon signs, video booths and roof screens. What is left is the drum
   machine (it is the clock), the echo and reverb, a four-channel mixer, the synth under test and three Snakes. Nothing here is
   in the main room's build. */
var TESTGONE = [];
(function(){
  function drop(o){ if (o && o.parent){ o.parent.remove(o); TESTGONE.push(o); } }
  var kill = [], frill = { 'p20_lights.js':1, 'p17_flow.js':1, 'p23_video.js':1 }, i, k;
  for (i = 1; i < TESTORDER.length; i++) if (frill[TESTORDER[i]]) for (k = TESTM[TESTORDER[i - 1]]; k < TESTM[TESTORDER[i]]; k++) kill.push(scene.children[k]);
  [BSY, AMY, MBY, SHY, ZKY, TPY, MCY, SCY].forEach(function(o){ kill.push(o); });
  SNAKES.forEach(function(S, n){ if (n > 2) kill.push(S.G.parent); });
  monitors.forEach(function(m){ kill.push(m.g); });
  scene.children.forEach(function(o){ var sign = false; o.traverse(function(q){ if (q.geometry && (q.geometry === logo.mesh.geometry || q.geometry === logoHalo.geometry)) sign = true; }); if (sign) kill.push(o); });
  kill.push(logoGlow); kill.forEach(drop);
  function inScene(o){ while (o){ if (o === scene) return true; o = o.parent; } return false; }
  for (i = solids.length - 1; i >= 0; i--) if (!inScene(solids[i])) solids.splice(i, 1);          // nothing that was taken away can be clicked
  BLOCKS.length = 0; BLOCKS.push(devBlock(TRPOS, 0.52)); BLOCKS.push(devBlock(MXPOS, 0.3)); BLOCKS.push(devBlock(ECPOS, 0.3)); BLOCKS.push(devBlock({ x:-RIG.R, z:RIG.z, r:-Math.PI / 2 }, TBL.L / 2 + 0.06));
  ambient.intensity = 1.5;                                      // a plain, even light now the show lighting is gone
  window.JB_TESTROOM = { inScene:inScene };
})();
