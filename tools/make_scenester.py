#!/usr/bin/env python3
"""The SCENESTER plate (the scene machine) from the designer's PDF.

  python3 tools/make_scenester.py <scenester.pdf>

The page is 1360 x 464 pt: the 170 x 58 mm plate at 8 px per mm. The buttons are cut out of the print (see tools/make_trskins.py)
and drawn in the game, so they can light up. Writes public/tr/scenester.jpg.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_trskins as T
T.W, T.H = 1360, 464
BTN = [(76.5, 171.5, 184, 209), (292.5, 171.5, 184, 209), (513.5, 171.5, 184, 209), (736.5, 171.5, 184, 209),     # scenes 1 to 4
       (965.7, 174.5, 173, 91), (965.7, 289.5, 173, 93.9),                                                          # COPY, CLEAR
       (1173.5, 170.5, 116, 61.3), (1173.5, 246.3, 116, 61.3), (1173.5, 320.2, 116, 61.3)]                          # x1, x2, x4
T.Z = [(x - 5, y - 5, x + w + 5, y + h + 5, False) for x, y, w, h in BTN]
plate = T.render(sys.argv[1], False, True)
out = os.path.join(T.ROOT, 'public', 'tr', 'scenester.jpg'); plate.convert('RGB').save(out, quality=88, optimize=True, progressive=True)
print('scenester', os.path.getsize(out) // 1024, 'KB')
