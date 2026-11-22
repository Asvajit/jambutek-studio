"""Splits the Jam Studio logo (vendor/logo-jam-studio.png) into two layers for the lobby: everything with the yellow script dimmed
like an unlit tube, and the yellow script alone, which the page flickers on top like neon.  python3 tools/make_logo.py"""
import base64, io, json
from PIL import Image, ImageFilter
im = Image.open('vendor/logo-jam-studio.png').convert('RGBA'); im = im.crop(im.split()[3].point(lambda v: 255 if v > 24 else 0).getbbox()); W = 900;      # trim the empty margin
im = im.resize((W, round(im.size[1] * W / im.size[0])), Image.LANCZOS)
px = im.load(); w, h = im.size
mask = Image.new('L', (w, h), 0); mp = mask.load()
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a > 20 and r > 60 and g > 50 and b < 0.6 * min(r, g): mp[x, y] = 255          # yellow, and the dark olive of its extruded edge
mask = mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
base = im.copy(); bp = base.load(); neon = Image.new('RGBA', (w, h), (0, 0, 0, 0)); npx = neon.load(); mp = mask.load()
for y in range(h):
    for x in range(w):
        m = mp[x, y] / 255.0
        if m <= 0: continue
        r, g, b, a = px[x, y]; k = 1 - 0.68 * m; bp[x, y] = (int(r * k), int(g * k * 0.92), int(b * k), a); npx[x, y] = (r, g, b, int(a * m))
def url(i):
    b = io.BytesIO(); i.save(b, 'WEBP', quality=82, method=6); return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
A = json.load(open('vendor/assets.json')); A['lobbyLogo'] = url(base); A['lobbyNeon'] = url(neon); json.dump(A, open('vendor/assets.json', 'w'))
base.save('/tmp/logo_base.png'); neon.save('/tmp/logo_neon.png'); print(w, h, len(A['lobbyLogo']) // 1024, 'KB', len(A['lobbyNeon']) // 1024, 'KB')
