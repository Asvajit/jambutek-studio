#!/usr/bin/env python3
"""DRUMBU-8 side and front panels from the designer's 303 x 55 mm strip.

  python3 tools/make_trsides.py <drumbu_8_side_and_front_panels.pdf>

side.jpg is the strip as drawn (both ends of the machine). front.jpg is the 407 mm front: the strip's left part (the DRUMBU-8 name)
stays at the left, its artwork at the right end, and the plain ground between is widened to fit.
"""
import sys, os
from PIL import Image
import pypdfium2 as pdfium
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(ROOT, 'public', 'tr')
doc = pdfium.PdfDocument(sys.argv[1]); pg = doc[0]; wpt = pg.get_width()
PXMM = 2048 / 303.0
im = pg.render(scale=2048 / wpt).to_pil().convert('RGB'); H = im.height
im.save(os.path.join(OUT, 'side.jpg'), quality=88, optimize=True, progressive=True)
FW = round(407.0 * PXMM); cut = round(im.width * 400 / wpt)                 # the name ends before 300 pt, the artwork starts after 540 pt
bg = im.getpixel((cut, H // 2)); fr = Image.new('RGB', (FW, H), bg)
fr.paste(im.crop((0, 0, cut, H)), (0, 0)); fr.paste(im.crop((cut, 0, im.width, H)), (FW - (im.width - cut), 0))
fr.save(os.path.join(OUT, 'front.jpg'), quality=88, optimize=True, progressive=True)
print('side', im.size, 'front', fr.size, 'ground', bg)
