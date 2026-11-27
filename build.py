#!/usr/bin/env python3
"""Stitch src/ and vendor/ into the single page public/index.html. Run from the repo root: python3 build.py"""
import json, os, re
here = os.path.dirname(os.path.abspath(__file__))
import subprocess, sys
if subprocess.run([sys.executable, os.path.join(here, 'tools', 'check_comments.py')]).returncode: sys.exit('build stopped: fix the lines above first')      # code hidden behind a // comment has broken the room before
rd = lambda *p: open(os.path.join(here, *p), encoding='utf-8').read()
PARTS = ['p1_room.js', 'p2_model.js', 'p3_audio.js', 'p4_machine.js', 'p6a_synth_model.js', 'p6b_synth_engine.js', 'p7_shared.js', 'p7b_bass.js',
         'p8_mixer.js', 'p11_ambika.js', 'p12_tape.js', 'p13_blip.js', 'p14_shru.js', 'p18_chord.js', 'p19_scratch.js', 'p22_echo.js', 'p26_reverb.js', 'p28_scenes.js', 'p25_kit.js', 'p9_snake.js', 'p24_tables.js', 'p29_lounge.js', 'p27_scope.js', 'p15_wall.js', 'p20_lights.js', 'p17_flow.js', 'p23_video.js', 'p16_mp.js', 'p5_input.js']
# the jams that ship with the room: every vendor/jams/*.json, in file-name order. The first one is the starter the room opens with.
jams = []
for f in sorted(os.listdir(os.path.join(here, 'vendor', 'jams'))):
    if f.endswith('.json'):
        j = json.loads(rd('vendor', 'jams', f)); j['name'] = re.sub(r'^\d+[ _-]+', '', f[:-5]); jams.append(j)
js = ''.join(rd('src', f) for f in PARTS)
out = (rd('src', 'head.html') + '\n' + rd('vendor', 'three-header.html').rstrip('\n') + '\n' + rd('vendor', 'three.min.js').rstrip('\n')
       + '\n</script>\n<script>\nwindow.JB_ASSETS=' + json.dumps(json.loads(rd('vendor', 'assets.json'))) + ';\nwindow.JB_JAMS=' + json.dumps(jams, separators=(',', ':')) + '' + ';\nwindow.JB_STICKERS=' + rd('vendor', 'stickers.json') + ';\nwindow.JB_DEFAULTS=window.JB_JAMS[0]||null;\nwindow.JB_INIT=' + (rd('vendor', 'init.json') if os.path.exists(os.path.join(here, 'vendor', 'init.json')) else 'null') + ';\nwindow.JB_LOOKS=' + json.dumps(json.loads(rd('vendor', 'looks.json')), separators=(',', ':')) + ';\nwindow.JB_HATS=' + rd('vendor', 'hats.json') + ';\nwindow.JB_SPEAKER=' + rd('vendor', 'speaker.json') + ';\nwindow.JB_STAGELIGHT=' + rd('vendor', 'stagelight.json') + ';\nwindow.JB_BUTTON=' + rd('vendor', 'button.json') + ';\n' + rd('vendor', 'patternflow-patterns.js') + '</script>\n<script>\n' + js + '\n</script>\n</html>\n')
open(os.path.join(here, 'public', 'index.html'), 'w', encoding='utf-8').write(out)
print('public/index.html', len(out), 'bytes')


# ---- the character creator: its own page, sharing the figure's layout and emotes with the room ----
mp = rd('src', 'p16_mp.js')
skinr = re.search(r'var SKINR = (\{.*?\]\]\})', mp, re.S).group(1)
names = re.findall(r"\{ n:'([^']+)', a:'(sk\d+)' \}", mp)
assets = json.loads(rd('vendor', 'assets.json'))
a = mp.index('  function emote(P, id, t, k, now){'); b = mp.index('\n  function emoteSet(', a)
page = rd('src', 'creator.html')
for key, val in (('/*__THREE__*/', rd('vendor', 'three-header.html').rstrip('\n').replace('<script>', '', 1) + '\n' + rd('vendor', 'three.min.js').rstrip('\n')), ('/*__SKINR__*/', skinr), ('/*__SKINS__*/', json.dumps({n: assets[k] for n, k in names}, separators=(',', ':'))), ('/*__EMOTE__*/', mp[a:b].strip())):
    assert page.count(key) == 1, key
    page = page.replace(key, val)
with open(os.path.join(here, 'public', 'creator.html'), 'w', encoding='utf-8') as f:
    f.write(page)
print('built public/creator.html', len(page) // 1024, 'KB')


# ---- the test room (/test): the same code, stripped to a bench, with the instrument under test swapped in ----
# The main room's parts are not edited for this: each change below is a text replacement applied to a copy, and must match exactly once,
# so a change to the main code that would silently break the test room stops the build instead.
def patch(text, old, new, count=1):
    assert text.count(old) == count, (text.count(old), old[:80])
    return text.replace(old, new)
T = {f: rd('src', f) for f in PARTS}
T['p1_room.js'] = patch(patch(T['p1_room.js'], 'var got = localStorage.getItem(k);', "var got = localStorage.getItem('test:' + k);"), 'localStorage.setItem(k, v);', "localStorage.setItem('test:' + k, v);")      # its own saved state
T['p6a_synth_model.js'] = patch(T['p6a_synth_model.js'], "knob('mftype', 762, 135, mm(21), 'Type', 0, ORG2).detents = 7;", "knob('mftype', 762, 135, mm(21), 'Type', 0, ORG2).detents = 17;")
T['p6b_synth_engine.js'] = patch(patch(T['p6b_synth_engine.js'], 'mftype:o.t / 7,', 'mftype:o.t / 17,'), "case 'mftype': var nt = Math.round(v * 7);", "case 'mftype': var nt = Math.round(v * 17);")      # eighteen types on the TYPE knob
T['p11_ambika.js'] = patch(T['p11_ambika.js'], 'MFENG[', 'MFENG0[', 4)
m8 = T['p8_mixer.js']
m8 = patch(m8, "var MXN = ['DRUMS', 'SYNTH', 'BASS', 'BLIP',", "var MXN = ['DRUMS', 'PLAITS', 'TEST 2', 'TEST 3',")
m8 = patch(m8, 'MXX = [32, 80, 128, 176, 224, 272, 320, 368, 416, 464], MXMX = 510, MXNC = 10;', 'MXX = [32, 80, 128, 176], MXMX = 222, MXNC = 4;')
m8 = patch(m8, 'var MXW = 536,', 'var MXW = 248,'); m8 = patch(m8, 'var mxC = mk(2144, 1312)', 'var mxC = mk(992, 1312)'); m8 = patch(m8, "T('MIX-10',", "T('MIX-4',")
m8 = patch(m8, 'function mxMute(i){ var c = MX.ch[i];', 'function mxMute(i){ var c = MX.ch[i]; if (!c) return;')
T['p8_mixer.js'] = m8
t24 = T['p24_tables.js']; t24 = patch(t24, 'var TBL = { L:(MXPOS.x', 'var TBL = { L:0.62 + (MXPOS.x')
a = t24.index('  [ { P:{ x:-RIG.R, z:RIG.z, r:-Math.PI / 2 }, slots:[{ u:[[MFY, MFPOS]], sn:'); b = t24.index('  ].forEach(function(side){', a)
T['p24_tables.js'] = t24[:a] + '  [ { P:{ x:-RIG.R, z:RIG.z, r:-Math.PI / 2 }, slots:[{ u:[], sn:1 }, { u:[[MFY, MFPOS]], sn:0 }, { u:[], sn:2 }] }\n' + t24[b:]      # one table: the synth with its Snake, and a spare Snake each side
T['p9_snake.js'] = patch(T['p9_snake.js'], 'function snClock(t, N, sd, sw){ SNAKES.forEach(function(s){ s.clock(t, N, sd, sw); }); }', 'function snClock(t, N, sd, sw){ SNAKES.slice(0, 3).forEach(function(s){ s.clock(t, N, sd, sw); }); }')      # only the three Snakes on the bench run
T['p16_mp.js'] = patch(T['p16_mp.js'], "    if (!/^https?:$/.test(location.protocol)) return;\n    fetch('/mp-ping'", "    return;      // the test room is single player\n    fetch('/mp-ping'")
T['p5_input.js'] = T['p5_input.js'].replace("studio v", "studio TEST v")
# all the parts share one wrapping function that opens in the first and closes in the last, so the test pieces go inside it
T['p1_room.js'] = patch(T['p1_room.js'], '(function(){\n"use strict";\n', '(function(){\n"use strict";\nvar JB_TEST = true, TESTM = {}, TESTORDER = [];\nfunction TESTMARK(n){ TESTM[n] = scene.children.length; TESTORDER.push(n); }\n')
end = T['p5_input.js'].rindex('})();'); T['p5_input.js'] = T['p5_input.js'][:end] + rd('src', 'test', 'p91_test_after.js') + '\n})();\n'
js2 = []
for f in PARTS:
    js2.append(T[f])
    if f != 'p5_input.js': js2.append('\n;TESTMARK(' + json.dumps(f) + ');\n')
    if f == 'p6b_synth_engine.js': js2.append(rd('src', 'test', 'p6t_plaits.js'))
    if f == 'p23_video.js': js2.append(rd('src', 'test', 'p90_test_room.js'))
tj = json.loads(json.dumps(jams[:1]))                                    # the starter jam, minus what belongs to machines the test room does not have
for k in ('jambutek-studio-synth-v1', 'jambutek-studio-video-v1', 'jambutek-studio-mix-v1'): tj[0]['state'].pop(k, None)
for n in (1, 2):
    sk = 'jambutek-studio-snake-v3-%d' % n; sn = json.loads(tj[0]['state'][sk]); sn['out'] = 1; sn['act'] = [0, 0]; tj[0]['state'][sk] = json.dumps(sn, separators=(',', ':'))      # the two spare Snakes: pointed at the synth, switched off
head = patch(rd('src', 'head.html'), '<title>Jambutek Studio</title>', '<title>Jambutek Studio · Test room</title>')
test = (head + '\n' + rd('vendor', 'three-header.html').rstrip('\n') + '\n' + rd('vendor', 'three.min.js').rstrip('\n')
        + '\n</script>\n<script>\nwindow.JB_ASSETS=' + json.dumps(json.loads(rd('vendor', 'assets.json'))) + ';\nwindow.JB_JAMS=' + json.dumps(tj, separators=(',', ':')) + '' + ';\nwindow.JB_STICKERS=' + rd('vendor', 'stickers.json') + ';\nwindow.JB_DEFAULTS=window.JB_JAMS[0]||null;\nwindow.JB_INIT=' + (rd('vendor', 'init.json') if os.path.exists(os.path.join(here, 'vendor', 'init.json')) else 'null') + ';\nwindow.JB_LOOKS=' + json.dumps(json.loads(rd('vendor', 'looks.json')), separators=(',', ':')) + ';\nwindow.JB_HATS=' + rd('vendor', 'hats.json') + ';\nwindow.JB_SPEAKER=' + rd('vendor', 'speaker.json') + ';\nwindow.JB_STAGELIGHT=' + rd('vendor', 'stagelight.json') + ';\nwindow.JB_BUTTON=' + rd('vendor', 'button.json') + ';\n' + rd('vendor', 'patternflow-patterns.js') + '</script>\n<script>\n' + ''.join(js2) + '\n</script>\n</html>\n')
with open(os.path.join(here, 'public', 'test.html'), 'w', encoding='utf-8') as f:
    f.write(test)
print('built public/test.html', len(test) // 1024, 'KB')
