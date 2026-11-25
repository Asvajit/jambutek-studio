#!/usr/bin/env python3
"""Add a custom look to the room from a painted sheet (the creator's layout, any square size, clear or painted background).
   usage: tools/add_skin.py <key> <sheet.png>      e.g. tools/add_skin.py csNarni narni.png
The sheet is brought to 1024 px, and the paint is spread a few pixels outwards into the clear parts so no edge of a face picks up
a rim of background. The look is stored in vendor/assets.json under <key>; list it in SKINS in src/p16_mp.js with its code."""
import sys, json, base64, io, os
import numpy as np
from PIL import Image
key, src = sys.argv[1], sys.argv[2]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
im = Image.open(src).convert('RGBA').resize((1024, 1024), Image.LANCZOS); a = np.asarray(im).astype(np.float32)
rgb, al = a[..., :3].copy(), (a[..., 3] > 128)
rgb[~al] = 0
for _ in range(24):                                         # grow the painted area outwards, one pixel a pass
    if al.all(): break
    acc = np.zeros_like(rgb); cnt = np.zeros(al.shape, np.float32)
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        acc += np.roll(rgb * al[..., None], (dy, dx), (0, 1)); cnt += np.roll(al, (dy, dx), (0, 1))
    new = (~al) & (cnt > 0); rgb[new] = acc[new] / cnt[new][:, None]; al = al | new
rgb[~al] = (40, 36, 34)
out = io.BytesIO(); Image.fromarray(rgb.clip(0, 255).astype(np.uint8), 'RGB').save(out, 'WEBP', quality=90, method=6)
p = os.path.join(ROOT, 'vendor', 'assets.json'); A = json.load(open(p)); A[key] = 'data:image/webp;base64,' + base64.b64encode(out.getvalue()).decode(); json.dump(A, open(p, 'w'))
print(key, len(A[key]) // 1024, 'KB')
