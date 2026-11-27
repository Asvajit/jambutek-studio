#!/usr/bin/env python3
"""ECHO JELLY and BEEVERB plates from the designer's two-page PDF (page 1 echo, page 2 reverb).

  python3 tools/make_fx.py <fx_units.pdf>

Each page is 1360 x 880 pt: the 170 x 110 mm plate at 8 px per mm. Knobs, buttons and the peak light are cut out of the print
(see tools/make_trskins.py). Writes public/tr/echo-jelly.jpg and public/tr/beeverb.jpg.
"""
import sys, os, io, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_trskins as T, pypdf
T.W, T.H = 1360, 880
UNITS = [('echo-jelly', [(200.25, 357.25), (200.25, 663.25), (1174.25, 357.25), (1174.25, 663.25)], [(462.5, 736.5, 205, 68), (718.5, 736.5, 205, 68)]),
         ('beeverb', [(176.15, 357.25), (403.15, 357.25), (936.25, 357.25), (1182.25, 357.25), (176.15, 663.25), (403.15, 663.25), (936.25, 663.25), (1182.25, 663.25)], [(570.4, 230.3, 205, 68), (570.4, 328.5, 205, 68)])]
src = pypdf.PdfReader(sys.argv[1])
for i, (name, knobs, btns) in enumerate(UNITS):
    Z = []
    for x, y in knobs: Z.append((x - 72, y - 72, x + 72, y + 72, False))
    for x, y, w, h in btns: Z.append((x - 5, y - 5, x + w + 5, y + h + 5, False))
    Z.append((1155.5 - 15, 152.3 - 15, 1155.5 + 15, 152.3 + 15, False))          # the peak light
    T.Z = Z
    w = pypdf.PdfWriter(); w.add_page(src.pages[i]); tmp = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False); w.write(tmp); tmp.close()
    plate = T.render(tmp.name, False, True); os.unlink(tmp.name)
    out = os.path.join(T.ROOT, 'public', 'tr', name + '.jpg'); plate.convert('RGB').save(out, quality=88, optimize=True, progressive=True)
    print(name, os.path.getsize(out) // 1024, 'KB')
