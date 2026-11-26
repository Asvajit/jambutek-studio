#!/usr/bin/env python3
"""Bake a .glb hat into vendor/hats.json so a look can wear it (vendor/looks.json: "hat":"<key>").

  python3 tools/add_hat.py <key> <model.glb> [--tint '#rrggbb'] [--width 0.39] [--sink 0.03] [--tilt 0] [--forward 0] [--yaw 0] [--credit '...']

All the model's parts are joined into one mesh with one small texture (its own textures and flat colours side by side).
The hat is turned --yaw degrees so its brim points to the front (+z), scaled to --width metres across (the head is a
0.27 cube), centred on the head and dropped --sink metres over the top of it. --tilt (degrees) tips the brim down over
the forehead, --forward (metres) slides the hat toward the face. With --tint the model's own colours are kept only as
light and shade and the given colour is laid over them. Positions are relative to the bottom of the head."""
import sys, os, json, struct, base64, io, argparse
import numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('key'); ap.add_argument('path'); ap.add_argument('--tint'); ap.add_argument('--width', type=float, default=0.39); ap.add_argument('--sink', type=float, default=0.03)
ap.add_argument('--tilt', type=float, default=0.0); ap.add_argument('--forward', type=float, default=0.0); ap.add_argument('--yaw', type=float, default=0.0); ap.add_argument('--credit', default='')
A = ap.parse_args(); here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
b = open(A.path, 'rb').read(); n = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + n]); bin_ = b[20 + n + 8:]
def acc(i):
    a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]; off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    k = {'VEC3': 3, 'VEC2': 2, 'SCALAR': 1}[a['type']]; dt = np.dtype({5126: '<f4', 5125: '<u4', 5123: '<u2', 5121: 'u1'}[a['componentType']]); st = bv.get('byteStride', 0) or dt.itemsize * k
    raw = np.frombuffer(bin_, dtype=np.uint8, count=st * (a['count'] - 1) + dt.itemsize * k, offset=off)
    return np.stack([raw[r * st:r * st + dt.itemsize * k].view(dt) for r in range(a['count'])])
def local(nd):
    if 'matrix' in nd: return np.array(nd['matrix']).reshape(4, 4).T
    M = np.eye(4)
    if 'scale' in nd: M = np.diag(list(nd['scale']) + [1.0])
    if 'rotation' in nd:
        x, y, z, w = nd['rotation']; R = np.eye(4); R[:3, :3] = [[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]]; M = R @ M
    if 'translation' in nd: T = np.eye(4); T[:3, 3] = nd['translation']; M = T @ M
    return M
parts = []                                         # every mesh in the scene, with its node transforms applied
def walk(ni, M):
    nd = j['nodes'][ni]; M = M @ local(nd)
    if 'mesh' in nd:
        for pr in j['meshes'][nd['mesh']]['primitives']:
            P = acc(pr['attributes']['POSITION']).astype(float); W = (np.c_[P, np.ones(len(P))] @ M.T)[:, :3]
            UV = acc(pr['attributes']['TEXCOORD_0']).astype(float) if 'TEXCOORD_0' in pr['attributes'] else np.zeros((len(P), 2))
            I = acc(pr['indices']).reshape(-1) if 'indices' in pr else np.arange(len(P)); parts.append([W, UV, I, pr.get('material')])
    for c in nd.get('children', []): walk(c, M)
for r in j['scenes'][j.get('scene', 0)]['nodes']: walk(r, np.eye(4))
def look(mi):                                      # a material's colour (as 0..255 sRGB) and its picture, if it has one
    m = j['materials'][mi] if mi is not None else {}; sg = m.get('extensions', {}).get('KHR_materials_pbrSpecularGlossiness'); mr = m.get('pbrMetallicRoughness', {})
    f = (sg or {}).get('diffuseFactor') or mr.get('baseColorFactor') or [1, 1, 1, 1]; t = (sg or {}).get('diffuseTexture') or mr.get('baseColorTexture')
    col = [255 * (12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055) for c in f[:3]]; img = None
    if t:
        im = j['images'][j['textures'][t['index']]['source']]; bv = j['bufferViews'][im['bufferView']]; img = Image.open(io.BytesIO(bin_[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]))
    return col, img
mats = []; [mats.append(p[3]) for p in parts if p[3] not in mats]
if len(mats) == 1 and look(mats[0])[1] is not None:                     # one picture: it is the whole sheet
    sheet = look(mats[0])[1].convert('RGB').resize((256, 256), Image.LANCZOS)
else:                                                                   # several: a row of 128 px squares, pictures and flat colours alike
    C = 128; cols = min(4, len(mats)); rows = (len(mats) + cols - 1) // cols; sheet = Image.new('RGB', (cols * C, rows * C))
    for k, mi in enumerate(mats):
        col, img = look(mi); cx, cy = (k % cols) * C, (k // cols) * C
        sheet.paste(img.convert('RGB').resize((C, C), Image.LANCZOS) if img is not None else Image.new('RGB', (C, C), tuple(int(round(c)) for c in col)), (cx, cy))
        for p in parts:
            if p[3] != mi: continue
            uv = np.clip(p[1], 0, 1) if img is not None else np.full_like(p[1], 0.5)
            p[1] = np.c_[(cx + 1 + uv[:, 0] * (C - 2)) / sheet.width, (cy + 1 + uv[:, 1] * (C - 2)) / sheet.height]
W = np.concatenate([p[0] for p in parts]); UV = np.concatenate([p[1] for p in parts]); off = np.cumsum([0] + [len(p[0]) for p in parts]); I = np.concatenate([p[2] + off[k] for k, p in enumerate(parts)])
yw = np.radians(A.yaw); x, z = W[:, 0].copy(), W[:, 2].copy(); W[:, 0] = x * np.cos(yw) + z * np.sin(yw); W[:, 2] = -x * np.sin(yw) + z * np.cos(yw)
s = A.width / (W[:, 0].max() - W[:, 0].min()); W = W * s
W[:, 0] -= (W[:, 0].max() + W[:, 0].min()) / 2
band = W[W[:, 1] < np.percentile(W[:, 1], 35)]; W[:, 2] -= (band[:, 2].min() + np.percentile(band[:, 2], 70)) / 2 - 0.01      # centre the band, not the brim, on the head
W[:, 1] += 0.27 - A.sink - np.percentile(W[:, 1], 12)
tilt = np.radians(A.tilt); y, z = W[:, 1] - 0.27, W[:, 2] + A.forward; W[:, 1] = 0.27 + y * np.cos(tilt) - z * np.sin(tilt); W[:, 2] = y * np.sin(tilt) + z * np.cos(tilt)      # tip it about the top of the head
assert len(W) < 65536
def q(a):
    lo, hi = a.min(0), a.max(0); return lo.round(5).tolist(), hi.round(5).tolist(), base64.b64encode(np.round((a - lo) / np.maximum(hi - lo, 1e-9) * 65535).astype('<u2').tobytes()).decode()
lo, hi, p = q(W); ulo, uhi, uv = q(UV)
geo = {'lo': lo, 'hi': hi, 'p': p, 'ulo': ulo, 'uhi': uhi, 'uv': uv, 'i': base64.b64encode(I.astype('<u2').tobytes()).decode()}
if A.tint:
    g = np.asarray(sheet.convert('L')); L = g.astype(float); ref = np.percentile(L[L > 12], 80); L = np.clip(L / ref, 0.0, 1.25) ** 0.8
    L[g <= 12] = 0.8                                                                                                        # the empty parts of the sheet: seams sample them, so keep them cloth-coloured
    rgb = np.array([int(A.tint[1:3], 16), int(A.tint[3:5], 16), int(A.tint[5:7], 16)], float); sheet = Image.fromarray(np.clip(L[:, :, None] * rgb[None, None, :], 0, 255).astype(np.uint8))
buf = io.BytesIO(); sheet.save(buf, 'WEBP', quality=88)
fp = os.path.join(here, 'vendor', 'hats.json'); H = json.load(open(fp)) if os.path.exists(fp) else {}
H[A.key] = {'geo': geo, 'map': 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode(), 'credit': A.credit}
json.dump(H, open(fp, 'w'), separators=(',', ':'))
print('baked', A.key, len(W), 'points', len(I) // 3, 'faces', len(mats), 'materials', 'box', [round(x, 3) for x in lo], [round(x, 3) for x in hi], os.path.getsize(fp) // 1024, 'KB')
