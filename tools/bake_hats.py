#!/usr/bin/env python3
"""The characters lost their separate hat box: the head is one solid cube and hair or headgear is drawn on it.
This paints each existing skin's old hat onto its head (the top face, and a band along the top of the four sides) so the
twelve current looks keep their hair and caps. Run once; running it again changes nothing that matters."""
import json, base64, io, re, os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'src', 'p16_mp.js'), encoding='utf-8').read()
R = json.loads(re.search(r'var SKINR = (\{.*?\]\]\})', src).group(1))
p = os.path.join(ROOT, 'vendor', 'assets.json'); A = json.load(open(p))
BAND = 0.24
for k in sorted(A):
    if not re.fullmatch(r'sk\d+', k): continue
    head, data = A[k].split(',', 1); im = Image.open(io.BytesIO(base64.b64decode(data))).convert('RGB'); S = im.size[0]
    def box(part, f): r = R[part][f]; return [int(round(r[0] * S)), int(round(r[1] * S)), int(round(r[2] * S)), int(round(r[3] * S))]
    for f in (0, 1, 4, 5):                                   # the four sides: a band along the top
        h = box('head', f); t = box('hat', f); bh = max(2, int(round((h[3] - h[1]) * BAND)))
        im.paste(im.crop(t).resize((h[2] - h[0] + 4, bh + 2), Image.BILINEAR), (h[0] - 2, h[1] - 2))
    h = box('head', 2); t = box('hat', 2); im.paste(im.crop(t).resize((h[2] - h[0] + 4, h[3] - h[1] + 4), Image.BILINEAR), (h[0] - 2, h[1] - 2))
    out = io.BytesIO(); im.save(out, 'WEBP', quality=88, method=6); A[k] = 'data:image/webp;base64,' + base64.b64encode(out.getvalue()).decode()      # webp, as the skins always were: a PNG here made the page several megabytes heavier
    print(k, len(A[k]) // 1024, 'KB')
json.dump(A, open(p, 'w'))
