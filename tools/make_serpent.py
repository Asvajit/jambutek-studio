#!/usr/bin/env python3
"""SERPENT (the Snake sequencer) top plate from the designer's PDF.

  python3 tools/make_serpent.py <serpent_sequencer_.pdf>

The PDF is 2400 x 1520 pt: the 300 x 190 mm plate at 8 px per mm. Like the DRUMBU-8 (tools/make_trskins.py), every control the 3D
model builds is cut out of the print, so nothing painted is left under a knob that has turned or a button that has changed colour.
Writes public/tr/serpent.jpg (the plate) and public/tr/serpent-faces.png (the design as drawn, for the button faces).
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_trskins as T
T.W, T.H = 2400, 1520
Z = []
def box(x, y, w, h, m=4, ro=False): Z.append((x - m, y - m, x + w + m, y + h + m, ro))
def circ(cx, cy, r): Z.append((cx - r, cy - r, cx + r, cy + r, False))
KN = [(850.3, 55.3, 36)] + [(x, y, 68) for x in (1441.9, 1698.3, 1954.7, 2210.3) for y in (269.3, 604.9, 940.1, 1277.4)] + \
     [(120.7, 794, 68), (321.2, 794, 68), (525.3, 794, 68), (748.7, 793.3, 68), (950.7, 793.3, 68), (1133.3, 793.3, 68)]
for k in KN: circ(*k)
for x in (1426.0, 1682.4, 1938.7, 2193.4):
    for y in (154.6, 487.8, 825.7, 1160.1): box(x, y, 32, 32, 4)
BT = [(660.5, 21.2, 134, 68), (1460.5, 21.2, 134, 68), (1606.5, 21.2, 134, 68), (1813.5, 21.2, 134, 68), (1959.5, 21.2, 134, 68), (2226.5, 21.2, 134, 68)]
BT += [(66.5, y, 525, 107) for y in (146.3, 284.3, 426.3, 566.3)]
BT += [(x, 428.3, 88.5, 88.5) for x in (684.0, 790.2, 896.5, 1002.7, 1108.9)] + [(x, 579.9, 88.5, 88.5) for x in (686.5, 794.5, 898.5, 1004.7, 1111.0)]
BT += [(66.5, 960.5, 225, 95), (362.5, 960.5, 225, 95), (686.5, 962.5, 233, 93), (962.5, 962.5, 233, 93)]
BT += [(x, y, 163, 68) for x in (1360.4, 1616.4, 1872.4, 2128.4) for y in (369.2, 707.8, 1044.6, 1377.8)]
BT += [(x, 1385.4, 30, 30) for x in (181.0, 223.0, 263.6, 304.0, 343.0, 384.0, 423.0, 463.0, 505.3, 547.0)] + [(75.5, 1425.9, 32.2, 27.4), (114.1, 1425.9, 32.2, 27.4)]
for b in BT: box(*b, m=5)
box(684.0, 144.4, 514.0, 211.6, -3)                     # the screen's text and snake (the screen stays)
box(80.4, 1104.3, 493.1, 238.3, 2)                      # the scope's picture (its frame stays)
T.Z = Z
pdf = sys.argv[1]; out = os.path.join(T.ROOT, 'public', 'tr')
full = T.render(pdf, False, False); plate = T.render(pdf, False, True)
full.save(os.path.join(out, 'serpent-faces.png'), optimize=True)
plate.convert('RGB').save(os.path.join(out, 'serpent.jpg'), quality=88, optimize=True, progressive=True)
import json; json.dump(BT, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'serpent_buttons.json'), 'w'))
for f in ('serpent.jpg', 'serpent-faces.png'): print(f, os.path.getsize(os.path.join(out, f)) // 1024, 'KB')
