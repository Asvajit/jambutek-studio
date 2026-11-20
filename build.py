#!/usr/bin/env python3
"""Stitch src/ and vendor/ into the single page public/index.html. Run from the repo root: python3 build.py"""
import json, os, re
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda *p: open(os.path.join(here, *p), encoding='utf-8').read()
PARTS = ['p1_room.js', 'p2_model.js', 'p3_audio.js', 'p4_machine.js', 'p6a_synth_model.js', 'p6b_synth_engine.js', 'p7_shared.js', 'p7b_bass.js',
         'p8_mixer.js', 'p11_ambika.js', 'p12_tape.js', 'p13_blip.js', 'p14_shru.js', 'p18_chord.js', 'p19_scratch.js', 'p22_echo.js', 'p26_reverb.js', 'p25_kit.js', 'p9_snake.js', 'p24_tables.js', 'p15_wall.js', 'p20_lights.js', 'p17_flow.js', 'p23_video.js', 'p16_mp.js', 'p5_input.js']
# the jams that ship with the room: every vendor/jams/*.json, in file-name order. The first one is the starter the room opens with.
jams = []
for f in sorted(os.listdir(os.path.join(here, 'vendor', 'jams'))):
    if f.endswith('.json'):
        j = json.loads(rd('vendor', 'jams', f)); j['name'] = re.sub(r'^\d+[ _-]+', '', f[:-5]); jams.append(j)
js = ''.join(rd('src', f) for f in PARTS)
out = (rd('src', 'head.html') + '\n' + rd('vendor', 'three-header.html').rstrip('\n') + '\n' + rd('vendor', 'three.min.js').rstrip('\n')
       + '\n</script>\n<script>\nwindow.JB_ASSETS=' + json.dumps(json.loads(rd('vendor', 'assets.json'))) + ';\nwindow.JB_JAMS=' + json.dumps(jams, separators=(',', ':')) + ';\nwindow.JB_DEFAULTS=window.JB_JAMS[0]||null;\nwindow.JB_SPEAKER=' + rd('vendor', 'speaker.json') + ';\nwindow.JB_STAGELIGHT=' + rd('vendor', 'stagelight.json') + ';\n' + rd('vendor', 'patternflow-patterns.js') + '</script>\n<script>\n' + js + '\n</script>\n</html>\n')
open(os.path.join(here, 'public', 'index.html'), 'w', encoding='utf-8').write(out)
print('public/index.html', len(out), 'bytes')
