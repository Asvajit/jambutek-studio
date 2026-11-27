#!/usr/bin/env python3
"""Build the DRUMBU-8 top plate skins from the designer's files.

  python3 tools/make_trskins.py <knobs_buttons_and_text.pdf> <bg_only_navy.png> name=skin.png [name=skin.png ...]

The PDF is the plate's print at 3072 x 2284 (one point = one pixel of the panel texture). Everything that the
3D model builds as a real control (knobs, buttons, pads, fader caps, screens, the tempo ring) is cut out of that
print, so a knob turned away from noon never leaves its painted pointer behind. Each skin PNG is the full design
in that colourway; its background is used as it is wherever the print is not cut, and under the cut-outs it is
rebuilt from the navy background-only plate, recoloured to the skin by a colour table learnt from the open areas.

Writes public/tr/<name>.jpg (the plate per skin) and public/tr/faces.png (the controls as drawn: the 3D
buttons take their faces from it).
"""
import sys, os, io, json
import numpy as np
from PIL import Image, ImageFilter
import pypdf
from pypdf.generic import ContentStream, NameObject
import pypdfium2 as pdfium

W, H = 3072, 2284
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'tr')

# ---- the zones the 3D controls occupy, in the design's own pixels (x, y from the top left) ----
Z = []          # (x0, y0, x1, y1, rect_only)
def box(x, y, w, h, m=4, ro=False): Z.append((x - m, y - m, x + w + m, y + h + m, ro))
def circ(cx, cy, r): Z.append((cx - r, cy - r, cx + r, cy + r, False))
KN = [(286, 353), (628, 350), (993, 350), (1174, 350), (1363, 350), (1543, 350), (1910, 350), (2274, 350), (2782, 595)]
COLS = [632, 813, 998, 1180, 1360, 1544, 1726, 1908, 2088, 2275, 2452]
for x in COLS:
    for y in (597, 769, 946): KN.append((x, y))
for k in KN: circ(k[0], k[1], 68)
SMX = [633, 813, 999, 1179, 1361, 1547, 1729, 1910, 2091, 2271, 2457]
for x in SMX: circ(x, 1107.5, 47); circ(x, 1237.5, 47)
circ(2778, 941, 100)                                    # SWING
circ(2783.2, 1434.2, 154)                               # TEMPO and its ring
FADX = [588.7, 767.1, 955.0, 1141.0, 1319.0, 1506.0, 1688.0, 1866.0, 2045.0, 2224.3, 2411.0]
for x in FADX: box(x, 1369.2, 82.9, 43.0, 2, True)    # fader caps (the slot and its ticks stay printed)
box(2687, 1061, 204.7, 109.4, -4)                       # the tempo digits (the window stays)
box(2585.4, 214.4, 400.1, 249.1, -6)                    # the screen's text (the screen stays)
box(447.0, 2193.1, 1199.0, 8.0, 3); box(1686.0, 2193.1, 1199.0, 8.0, 3)   # the half bars under the pads
BTN = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trbuttons.json')))
for b in BTN: box(b[0], b[1], b[2], b[3], 5)
box(141.8, 2015, 191.6, 170, 2)                         # START/STOP: its play-pause icon runs a little past the button

def inside(bb, rect_only):
    x0, y0, x1, y1 = bb
    for z in Z:
        if z[4] and not rect_only: continue
        if x0 >= z[0] and y0 >= z[1] and x1 <= z[2] and y1 <= z[3]: return True
    return False

def mul(a, b):
    return [a[0]*b[0] + a[1]*b[2], a[0]*b[1] + a[1]*b[3], a[2]*b[0] + a[3]*b[2], a[2]*b[1] + a[3]*b[3], a[4]*b[0] + a[5]*b[2] + b[4], a[4]*b[1] + a[5]*b[3] + b[5]]
def ap(m, x, y): return (m[0]*x + m[2]*y + m[4], m[1]*x + m[3]*y + m[5])
def bbox(pts):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return (min(xs), H - max(ys), max(xs), H - min(ys))

PATH = {b'm', b'l', b'c', b'v', b'y', b're', b'h'}
PAINT = {b'S', b's', b'f', b'F', b'f*', b'B', b'B*', b'b', b'b*', b'n'}
SHOW = {b'Tj', b'TJ', b"'", b'"'}

def filtered(reader, drop_bg):
    page = reader.pages[0]
    cs = ContentStream(page.get_contents(), reader)
    out = []; ctm = [1, 0, 0, 1, 0, 0]; stack = []; grp = []; pts = []; rects_only = True; clip = False
    tm = [1, 0, 0, 1, 0, 0]; tlm = [1, 0, 0, 1, 0, 0]; first_fill = True
    for operands, op in cs.operations:
        if op == b'q': stack.append(ctm[:]); out.append((operands, op)); continue
        if op == b'Q': ctm = stack.pop() if stack else ctm; out.append((operands, op)); continue
        if op == b'cm': ctm = mul([float(v) for v in operands], ctm); out.append((operands, op)); continue
        if op in PATH:
            grp.append((operands, op)); v = [float(o) for o in operands]
            if op == b're':
                x, y, w, h = v; pts += [ap(ctm, x, y), ap(ctm, x + w, y + h), ap(ctm, x + w, y), ap(ctm, x, y + h)]
            else:
                rects_only = False
                for i in range(0, len(v) - 1, 2): pts.append(ap(ctm, v[i], v[i + 1]))
            continue
        if op in (b'W', b'W*'): clip = True; grp.append((operands, op)); continue
        if op in PAINT:
            grp.append((operands, op))
            keep = True
            if pts and not clip:
                bb = bbox(pts)
                if drop_bg and first_fill and bb[2] - bb[0] >= W - 1 and bb[3] - bb[1] >= H - 1: keep = False
                elif inside(bb, rects_only): keep = False
            if bb_full(pts): first_fill = False
            if keep: out += grp
            grp = []; pts = []; rects_only = True; clip = False; continue
        if op == b'BT': tm = [1, 0, 0, 1, 0, 0]; tlm = tm[:]
        if op == b'Tm': tm = [float(v) for v in operands]; tlm = tm[:]
        if op in (b'Td', b'TD'): tlm = mul([1, 0, 0, 1, float(operands[0]), float(operands[1])], tlm); tm = tlm[:]
        if op in SHOW:
            m = mul(tm, ctm); x, y = m[4], H - m[5]
            if inside((x, y - 2, x + 2, y), False): continue
        if op == b'Do':
            p0 = ap(ctm, 0, 0); p1 = ap(ctm, 1, 1); p2 = ap(ctm, 1, 0); p3 = ap(ctm, 0, 1)
            if inside(bbox([p0, p1, p2, p3]), False): continue
        out.append((operands, op))
    cs.operations = out
    page[NameObject('/Contents')] = cs
    return page

def bb_full(pts):
    if not pts: return False
    b = bbox(pts); return b[2] - b[0] >= W - 1

def render(pdf_path, drop_bg, drop_controls):
    r = pypdf.PdfReader(pdf_path)
    if drop_controls or drop_bg:
        global Z
        keep = Z
        if not drop_controls: Z = []
        filtered(r, drop_bg)
        Z = keep
    w = pypdf.PdfWriter(); w.add_page(r.pages[0]); buf = io.BytesIO(); w.write(buf)
    doc = pdfium.PdfDocument(buf.getvalue())
    im = doc[0].render(scale=1, fill_color=(0, 0, 0, 0), may_draw_forms=True).to_pil().convert('RGBA')
    return im.resize((W, H), Image.LANCZOS) if im.size != (W, H) else im

def over(a, b):          # b over a, both float RGBA 0..1
    ab = b[..., 3:4]; return a[..., :3] * (1 - ab) + b[..., :3] * ab

def main():
    pdf_path, navy_bg = sys.argv[1], sys.argv[2]
    skins = [a.split('=', 1) for a in sys.argv[3:]]
    os.makedirs(OUT, exist_ok=True)
    full = render(pdf_path, True, False); prnt = render(pdf_path, True, True)
    full.save(os.path.join(OUT, 'faces.png'), optimize=True)
    fa = np.asarray(full).astype(np.float32) / 255; pa = np.asarray(prnt).astype(np.float32) / 255
    cut = (np.abs(fa - pa).max(axis=2) > 0.02)
    cut = np.asarray(Image.fromarray((cut * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
    openm = np.asarray(Image.fromarray(((fa[..., 3] > 0.01) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) == 0
    nb = np.asarray(Image.open(navy_bg).convert('RGB').resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
    q = np.clip((nb * 31 + 0.5).astype(np.int32), 0, 31); key = (q[..., 0] * 32 + q[..., 1]) * 32 + q[..., 2]
    for name, path in skins:
        sk = np.asarray(Image.open(path).convert('RGB').resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
        # colour table: navy background colour -> this skin's background colour, learnt where nothing is printed
        k = key[openm]; s = sk[openm]; n = 32 ** 3
        cnt = np.bincount(k, minlength=n).astype(np.float32); lut = np.zeros((n, 3), np.float32)
        for c in range(3): lut[:, c] = np.bincount(k, weights=s[:, c], minlength=n)
        have = cnt > 0; lut[have] /= cnt[have][:, None]
        if not have.all():                        # empty cells take the nearest learnt cell
            hk = np.nonzero(have)[0]; hq = np.stack([hk // 1024, (hk // 32) % 32, hk % 32], 1).astype(np.float32)
            mk = np.nonzero(~have)[0]; mq = np.stack([mk // 1024, (mk // 32) % 32, mk % 32], 1).astype(np.float32)
            for i in range(0, len(mk), 4096):
                d = ((mq[i:i + 4096, None, :] - hq[None, :, :]) ** 2).sum(2); lut[mk[i:i + 4096]] = lut[hk[d.argmin(1)]]
        rec = sk.copy() if name == 'navy' else lut[key]
        if name == 'navy': rec = nb
        plate = np.where(cut[..., None], over(rec, pa), sk)
        Image.fromarray((np.clip(plate, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, name + '.jpg'), quality=86, optimize=True, progressive=True)
        print(name, os.path.getsize(os.path.join(OUT, name + '.jpg')) // 1024, 'KB')
    print('faces', os.path.getsize(os.path.join(OUT, 'faces.png')) // 1024, 'KB')

if __name__ == '__main__':
    main()
