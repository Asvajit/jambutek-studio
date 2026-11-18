#!/usr/bin/env python3
"""Stitch src/ and vendor/ into the single page public/index.html. Run from the repo root: python3 build.py"""
import json, os
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda *p: open(os.path.join(here, *p), encoding='utf-8').read()
PARTS = ['p1_room.js', 'p2_model.js', 'p3_audio.js', 'p4_machine.js', 'p6a_synth_model.js', 'p6b_synth_engine.js', 'p7_shared.js', 'p7b_bass.js',
         'p8_mixer.js', 'p11_ambika.js', 'p12_tape.js', 'p13_blip.js', 'p14_shru.js', 'p9_snake.js', 'p15_wall.js', 'p5_input.js']
js = ''.join(rd('src', f) for f in PARTS)
out = (rd('src', 'head.html') + '\n' + rd('vendor', 'three-header.html').rstrip('\n') + '\n' + rd('vendor', 'three.min.js').rstrip('\n')
       + '\n</script>\n<script>\nwindow.JB_ASSETS=' + json.dumps(json.loads(rd('vendor', 'assets.json'))) + ';\n</script>\n<script>\n' + js + '\n</script>\n</html>\n')
open(os.path.join(here, 'public', 'index.html'), 'w', encoding='utf-8').write(out)
print('public/index.html', len(out), 'bytes')
