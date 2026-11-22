"""Placeholder characters 7 to 12 for the studio and arcade, painted by code in the same loose style as the first six.
Run from the repo root:  python3 tools/make_skins.py   (rewrites sk6..sk11 in vendor/assets.json; the result is the same every run)."""
import base64, io, json, random, re
from PIL import Image, ImageDraw, ImageFilter, ImageChops

S = 1024
mp = open('src/p16_mp.js', encoding='utf-8').read()
SKINR = json.loads(re.search(r'var SKINR = (\{.*?\]\]\})', mp, re.S).group(1))
PX, NX, PY, NY, PZ, NZ = range(6)          # their left side, their right side, top, bottom, front, back

def rect(part, f, pad=3):
    r = SKINR[part][f]; return [int(round(r[0] * S)) - pad, int(round(r[1] * S)) - pad, int(round(r[2] * S)) + pad, int(round(r[3] * S)) + pad]
def shade(c, k): return tuple(max(0, min(255, int(v * k))) for v in c)
def hexc(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

class Sheet:
    def __init__(self, seed):
        self.rnd = random.Random(seed); self.im = Image.new('RGB', (S, S), (0, 0, 0)); self.d = ImageDraw.Draw(self.im)
    def paint(self, box, col, grain=0.10):
        """one painted patch: flat colour, soft brush streaks, slightly darker towards the edges, a few flecks"""
        x0, y0, x1, y1 = box; w, h = max(2, x1 - x0), max(2, y1 - y0); r = self.rnd
        small = Image.new('L', (max(2, w // 7), max(2, h // 3)))
        small.putdata([int(128 + r.uniform(-1, 1) * 127 * grain * 2.2) for _ in range(small.size[0] * small.size[1])])
        tex = small.resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))
        edge = Image.new('L', (w, h), 128); ed = ImageDraw.Draw(edge)
        for i in range(4): ed.rectangle([i, i, w - 1 - i, h - 1 - i], outline=112 + i * 4)
        tex = ImageChops.add(tex, edge, 1, -128)
        patch = Image.merge('RGB', [tex.point(lambda v, c=c: max(0, min(255, int(c * v / 128)))) for c in col])
        pd = ImageDraw.Draw(patch)
        for _ in range(max(1, w * h // 900)):
            fx, fy = r.randrange(w), r.randrange(h); pd.point((fx, fy), fill=shade(col, r.choice([0.7, 1.25])))
        self.im.paste(patch, (x0, y0))
    def part(self, name, col, faces=range(6), grain=0.10):
        for f in faces: self.paint(rect(name, f), shade(col, 0.9 if f in (NZ, PX, NX) else 0.8 if f == NY else 1.0), grain)
    def band(self, name, f, a, b, col, grain=0.08):
        """a horizontal band of a face, from a to b of its height (0 = top)"""
        x0, y0, x1, y1 = rect(name, f); h = y1 - y0; self.paint([x0, y0 + int(h * a), x1, y0 + int(h * b)], col, grain)
    def stroke(self, pts, col, width=3):
        self.d.line(pts, fill=col, width=width, joint='curve')
    def soften(self): self.im = self.im.filter(ImageFilter.GaussianBlur(0.45)); self.d = ImageDraw.Draw(self.im)

def face(sh, skin, hair, eyes='#16130F', brows=None, mouth='#7A2E2A', blush=True, shades=None, beard=None, hair_drop=0.26, sides=0.55, visor=None):
    sh.part('head', skin)
    for f in (PY, NZ): sh.paint(rect('head', f), shade(hair, 0.95 if f == PY else 0.85))
    for f in (PX, NX): sh.band('head', f, 0, sides, shade(hair, 0.9))
    sh.band('head', NZ, 0.86, 1.0, shade(skin, 0.85))
    sh.band('head', PZ, 0, hair_drop, hair)
    x0, y0, x1, y1 = rect('head', PZ, 0); w, h = x1 - x0, y1 - y0; d = sh.d
    def P(u, v): return (x0 + u * w, y0 + v * h)
    if blush:
        for u in (0.2, 0.8): cx, cy = P(u, 0.66); d.ellipse([cx - 6, cy - 4, cx + 6, cy + 4], fill=shade(skin, 1.0)[:1] + (int(skin[1] * 0.78), int(skin[2] * 0.78)))
    if visor:
        a, b = P(0.08, 0.36), P(0.92, 0.62); d.rounded_rectangle([a[0], a[1], b[0], b[1]], 6, fill=hexc(visor)); d.line([P(0.16, 0.42), P(0.5, 0.4)], fill=(255, 255, 255), width=2)
    elif shades:
        for u in (0.3, 0.7): cx, cy = P(u, 0.47); d.rounded_rectangle([cx - 10, cy - 6, cx + 10, cy + 6], 3, fill=hexc(shades))
        d.line([P(0.3, 0.44), P(0.7, 0.44)], fill=hexc(shades), width=3); d.line([P(0.2, 0.42), P(0.3, 0.44)], fill=(255, 255, 255), width=1)
    else:
        for u in (0.3, 0.7):
            cx, cy = P(u, 0.47); d.ellipse([cx - 4, cy - 5, cx + 4, cy + 5], fill=hexc(eyes)); d.point((cx - 1, cy - 2), fill=(255, 255, 255))
            bx, by = P(u, 0.35); d.line([bx - 7, by + (1 if u < 0.5 else -1), bx + 7, by - (1 if u < 0.5 else -1)], fill=hexc(brows) if brows else shade(hair, 0.7), width=3)
    nx, ny = P(0.5, 0.6); d.line([nx, ny - 7, nx - 2, ny + 2, nx + 3, ny + 3], fill=shade(skin, 0.72), width=2)
    if beard:
        a, b = P(0.12, 0.7), P(0.88, 1.0); d.rounded_rectangle([a[0], a[1], b[0], b[1] + 3], 8, fill=hexc(beard)); mx, my = P(0.5, 0.82); d.line([mx - 7, my, mx + 7, my], fill=hexc(mouth), width=2)
    else:
        mx, my = P(0.5, 0.8); d.arc([mx - 9, my - 8, mx + 9, my + 4], 20, 160, fill=hexc(mouth), width=3)

def arms(sh, sleeve, skin, cut=0.72, cuff=None):
    for a in ('armL', 'armR'):
        sh.part(a, sleeve)
        for f in (PX, NX, PZ, NZ):
            if cut < 1: sh.band(a, f, cut, 1.0, shade(skin, 0.95 if f == PZ else 0.86))
            if cuff: sh.band(a, f, max(0, cut - 0.07), cut, cuff)
        sh.paint(rect(a, NY), shade(skin, 0.8))
def legs(sh, col, shoe, knee=None, stripe=None, cuff=None):
    for p in ('legL', 'legR', 'shinL', 'shinR'):
        sh.part(p, col)
        if stripe:
            f = NX if p.endswith('L') else PX; x0, y0, x1, y1 = rect(p, f); m = (x0 + x1) // 2; sh.paint([m - 4, y0, m + 4, y1], stripe, 0.05)
    if knee:
        for p in ('shinL', 'shinR'): sh.band(p, PZ, 0.02, 0.2, knee)
    if cuff:
        for p in ('shinL', 'shinR'):
            for f in (PX, NX, PZ, NZ): sh.band(p, f, 0.86, 1.0, cuff)
    for p in ('shoeL', 'shoeR'): sh.part(p, shoe, grain=0.14)

def build(seed, fn):
    sh = Sheet(seed); fn(sh); sh.soften(); return sh.im

def raver(sh):
    skin, g, pk = hexc('#C98A5E'), hexc('#3BE86A'), hexc('#FF3FA8')
    face(sh, skin, pk, shades='#141418', hair_drop=0.3, sides=0.5); sh.part('hat', pk); sh.band('hat', PZ, 0.55, 1, shade(pk, 0.75))
    sh.part('torso', g)
    for f in (PZ, NZ, PX, NX): sh.band('torso', f, 0.3, 0.38, pk); sh.band('torso', f, 0.9, 1, shade(g, 0.7))
    x0, y0, x1, y1 = rect('torso', PZ, 0); m = (x0 + x1) // 2; sh.stroke([(m, y0 + 4), (m, y1 - 14)], (240, 240, 240), 3)
    arms(sh, g, skin, 0.8, cuff=pk); legs(sh, g, hexc('#F4F1EA'), stripe=pk, cuff=shade(g, 0.7))
def sailor(sh):
    skin, navy, white, red = hexc('#EDB98F'), hexc('#1F2F6B'), hexc('#F1EEE6'), hexc('#D8322B')
    face(sh, skin, hexc('#6B3A1E'), hair_drop=0.2, sides=0.45); sh.part('hat', white); sh.band('hat', PZ, 0.5, 1, navy)
    sh.part('torso', white)
    for f in (PZ, NZ, PX, NX):
        for k in range(6): sh.band('torso', f, 0.2 + k * 0.13, 0.26 + k * 0.13, navy, 0.05)
    x0, y0, x1, y1 = rect('torso', PZ, 0); m = (x0 + x1) // 2; sh.d.polygon([(m - 14, y0), (m + 14, y0), (m, y0 + 26)], fill=red)
    arms(sh, white, skin, 0.5, cuff=navy); legs(sh, navy, hexc('#17181C'), cuff=white)
def punk(sh):
    skin, blk, pink, red = hexc('#E3C2A6'), hexc('#1B1C22'), hexc('#FF2E93'), hexc('#B5202A')
    face(sh, skin, blk, eyes='#101010', brows='#101010', mouth='#5A1E2A', hair_drop=0.12, sides=0.3)
    sh.part('hat', blk); xa, ya, xb, yb = rect('hat', PY); sh.paint([xa + (xb - xa) // 3, ya, xb - (xb - xa) // 3, yb], pink, 0.2)
    for f in (PZ, NZ): xa, ya, xb, yb = rect('hat', f); sh.paint([xa + (xb - xa) // 3, ya, xb - (xb - xa) // 3, yb], pink, 0.2)
    xa, ya, xb, yb = rect('head', PY); sh.paint([xa + (xb - xa) // 3, ya, xb - (xb - xa) // 3, yb], pink, 0.2)
    sh.part('torso', blk); x0, y0, x1, y1 = rect('torso', PZ, 0); m = (x0 + x1) // 2
    sh.paint([m - 9, y0, m + 9, y1 - 30], hexc('#E8E4DA'), 0.06); sh.stroke([(x0 + 4, y0 + 6), (m - 9, y0 + 40)], (150, 150, 158), 2); sh.stroke([(x1 - 4, y0 + 6), (m + 9, y0 + 40)], (150, 150, 158), 2)
    for k in range(3): sh.d.ellipse([x0 + 8, y0 + 60 + k * 18, x0 + 13, y0 + 65 + k * 18], fill=(190, 190, 196))
    arms(sh, blk, skin, 0.86, cuff=hexc('#8E8F98')); legs(sh, red, hexc('#101014'), cuff=blk)
    for p in ('legL', 'legR', 'shinL', 'shinR'):
        for f in (PZ, NZ, PX, NX):
            x0, y0, x1, y1 = rect(p, f, 0)
            for k in range(1, 4): sh.d.line([x0, y0 + k * (y1 - y0) // 4, x1, y0 + k * (y1 - y0) // 4], fill=shade(red, 0.55), width=2)
            sh.d.line([(x0 + x1) // 2, y0, (x0 + x1) // 2, y1], fill=(235, 200, 60), width=1)
def astro(sh):
    skin, white, orange, grey = hexc('#B97A52'), hexc('#ECEAE4'), hexc('#F26A1B'), hexc('#8D929C')
    face(sh, skin, white, visor='#20324F', hair_drop=0.22, sides=1.0); sh.part('hat', white); sh.band('hat', PZ, 0.5, 1, orange)
    sh.part('torso', white)
    for f in (PZ, NZ, PX, NX): sh.band('torso', f, 0.86, 1, grey); sh.band('torso', f, 0, 0.07, orange)
    x0, y0, x1, y1 = rect('torso', PZ, 0); sh.paint([x0 + 12, y0 + 34, x1 - 12, y0 + 70], grey, 0.05)
    for k, c in enumerate(('#E2332B', '#FFE15A', '#3BFF6A')): sh.d.rectangle([x0 + 17 + k * 9, y0 + 42, x0 + 22 + k * 9, y0 + 50], fill=hexc(c))
    arms(sh, white, grey, 0.84, cuff=orange); legs(sh, white, grey, knee=orange, cuff=grey)
def disco(sh):
    skin, purple, gold = hexc('#8A5636'), hexc('#7B2FD0'), hexc('#F2C230')
    face(sh, skin, hexc('#1A1410'), beard=None, hair_drop=0.3, sides=0.7, mouth='#E8E0D0'); sh.part('hat', hexc('#1A1410'), grain=0.2)
    sh.part('torso', purple); x0, y0, x1, y1 = rect('torso', PZ, 0); m = (x0 + x1) // 2
    sh.d.polygon([(m - 16, y0), (m + 16, y0), (m, y0 + 62)], fill=gold); sh.d.polygon([(m - 9, y0), (m + 9, y0), (m, y0 + 36)], fill=shade(skin, 0.95))
    sh.stroke([(m - 16, y0), (m - 2, y0 + 62), (m - 24, y0 + 46)], shade(purple, 1.35), 3); sh.stroke([(m + 16, y0), (m + 2, y0 + 62), (m + 24, y0 + 46)], shade(purple, 1.35), 3)
    for f in (PZ, NZ, PX, NX): sh.band('torso', f, 0.9, 1, gold)
    arms(sh, purple, skin, 0.86, cuff=gold); legs(sh, purple, hexc('#F1EEE6'), cuff=shade(purple, 1.3))
def ranger(sh):
    skin, khaki, green, brown = hexc('#D9A77C'), hexc('#B8A26A'), hexc('#3F5B32'), hexc('#5B3A1F')
    face(sh, skin, hexc('#8A5A2B'), beard='#7A4A22', hair_drop=0.18, sides=0.5); sh.part('hat', brown); sh.band('hat', PZ, 0.5, 1, shade(brown, 0.7))
    sh.part('torso', khaki); x0, y0, x1, y1 = rect('torso', PZ, 0); m = (x0 + x1) // 2
    sh.stroke([(m, y0), (m, y1 - 16)], shade(khaki, 0.65), 2)
    for u in (x0 + 8, m + 6): sh.paint([u, y0 + 34, u + 16, y0 + 54], shade(khaki, 0.82), 0.05)
    for k in range(4): sh.d.ellipse([m - 2, y0 + 16 + k * 26, m + 2, y0 + 20 + k * 26], fill=shade(khaki, 0.5))
    for f in (PZ, NZ, PX, NX): sh.band('torso', f, 0.88, 0.96, brown)
    arms(sh, khaki, skin, 0.42, cuff=shade(khaki, 0.75)); legs(sh, green, brown, cuff=shade(green, 0.7))

NAMES = [('Raver', raver), ('Sailor', sailor), ('Punk', punk), ('Astro', astro), ('Disco', disco), ('Ranger', ranger)]
if __name__ == '__main__':
    A = json.load(open('vendor/assets.json'))
    for i, (name, fn) in enumerate(NAMES):
        im = build(1000 + i, fn); b = io.BytesIO(); im.save(b, 'WEBP', quality=88, method=6)
        A['sk%d' % (6 + i)] = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode(); im.save('/tmp/sk%d.png' % (6 + i)); print(name, len(b.getvalue()) // 1024, 'KB')
    json.dump(A, open('vendor/assets.json', 'w'))
