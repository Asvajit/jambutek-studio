#!/usr/bin/env python3
"""DRUMBU-8 side and front panels from the designer's PDF.

  python3 tools/make_trsides.py <drumbu_8_side_and_front_panels.pdf>

Page 1 (303 x 55 mm, dinosaur on the right) is the right-hand end, page 2 (dinosaur on the left) the left-hand end, so on both ends
the dinosaur sits at the back and the name at the front. Page 3 (407 x 55 mm) is the front. Writes public/tr/right.jpg, left.jpg, front.jpg.
"""
import sys, os
import pypdfium2 as pdfium
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(ROOT, 'public', 'tr')
doc = pdfium.PdfDocument(sys.argv[1]); PXPT = 2048 / 858.898            # the same detail on every panel: 2048 px across a 303 mm end
for i, name in enumerate(['right', 'left', 'front']):
    im = doc[i].render(scale=PXPT).to_pil().convert('RGB')
    im.save(os.path.join(OUT, name + '.jpg'), quality=88, optimize=True, progressive=True); print(name, im.size)
