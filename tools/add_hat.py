#!/usr/bin/env python3
"""Bake a .glb hat into vendor/hats.json so a skin can wear it (SKINS entry: hat:'<key>').

  python3 tools/add_hat.py <key> <model.glb> <#rrggbb> [width] [sink] [credit]

The mesh is scaled so it is <width> metres across (default 0.39; the head is a 0.27 cube), centred on the head,
brim to the front (+z), and dropped <sink> metres over the top of the head (default 0.03). Its texture is kept
only as light and shade, tinted with the given colour.  Positions are relative to the bottom of the head."""
import sys, os, json, struct, base64, io
import numpy as np
from PIL import Image
here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
key, path, col = sys.argv[1], sys.argv[2], sys.argv[3]
width = float(sys.argv[4]) if len(sys.argv) > 4 else 0.39
sink = float(sys.argv[5]) if len(sys.argv) > 5 else 0.03
credit = sys.argv[6] if len(sys.argv) > 6 else ''
b = open(path, 'rb').read(); n = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + n]); bin_ = b[20 + n + 8:]
def acc(i):
    a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]; off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    k = {'VEC3': 3, 'VEC2': 2, 'SCALAR': 1}[a['type']]; dt = np.dtype({5126: '<f4', 5125: '<u4', 5123: '<u2'}[a['componentType']]); st = bv.get('byteStride', 0) or dt.itemsize * k
    raw = np.frombuffer(bin_, dtype=np.uint8, count=st * (a['count'] - 1) + dt.itemsize * k, offset=off)
    return np.stack([raw[r * st:r * st + dt.itemsize * k].view(dt) for r in range(a['count'])])
def world(ni, M=np.eye(4)):                       # the first mesh in the scene, with its node transforms applied
    nd = j['nodes'][ni]; L = np.array(nd['matrix']).reshape(4, 4).T if 'matrix' in nd else np.eye(4); M = M @ L
    if 'mesh' in nd: return nd['mesh'], M
    for c in nd.get('children', []):
        r = world(c, M)
        if r: return r
mi, M = world(j['scenes'][j.get('scene', 0)]['nodes'][0]); pr = j['meshes'][mi]['primitives'][0]
P = acc(pr['attributes']['POSITION']).astype(float); UV = acc(pr['attributes']['TEXCOORD_0']).astype(float); I = acc(pr['indices']).reshape(-1)
W = (np.c_[P, np.ones(len(P))] @ M.T)[:, :3]
s = width / (W[:, 0].max() - W[:, 0].min()); W = W * s
W[:, 0] -= (W[:, 0].max() + W[:, 0].min()) / 2
band = W[W[:, 1] < np.percentile(W[:, 1], 35)]; W[:, 2] -= (band[:, 2].min() + np.percentile(band[:, 2], 70)) / 2 - 0.01      # centre the band, not the brim, on the head
W[:, 1] += 0.27 - sink - np.percentile(W[:, 1], 12)
assert len(W) < 65536
def q(a):
    lo, hi = a.min(0), a.max(0); return lo.round(5).tolist(), hi.round(5).tolist(), base64.b64encode(np.round((a - lo) / (hi - lo) * 65535).astype('<u2').tobytes()).decode()
lo, hi, p = q(W); ulo, uhi, uv = q(UV)
geo = {'lo': lo, 'hi': hi, 'p': p, 'ulo': ulo, 'uhi': uhi, 'uv': uv, 'i': base64.b64encode(I.astype('<u2').tobytes()).decode()}
mat = j['materials'][pr['material']]; ti = mat['pbrMetallicRoughness']['baseColorTexture']['index']; im = j['images'][j['textures'][ti]['source']]; bv = j['bufferViews'][im['bufferView']]
tex = Image.open(io.BytesIO(bin_[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']])).convert('L').resize((256, 256), Image.LANCZOS)
L = np.asarray(tex).astype(float); ref = np.percentile(L[L > 12], 80); L = np.clip(L / ref, 0.0, 1.25) ** 0.8
L[np.asarray(tex) <= 12] = 0.8                                                                                              # the empty parts of the sheet: seams sample them, so keep them cloth-coloured
rgb = np.array([int(col[1:3], 16), int(col[3:5], 16), int(col[5:7], 16)], float)
out = np.clip(L[:, :, None] * rgb[None, None, :], 0, 255).astype(np.uint8); buf = io.BytesIO(); Image.fromarray(out).save(buf, 'WEBP', quality=88)
fp = os.path.join(here, 'vendor', 'hats.json'); H = json.load(open(fp)) if os.path.exists(fp) else {}
H[key] = {'geo': geo, 'map': 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode(), 'credit': credit}
json.dump(H, open(fp, 'w'), separators=(',', ':'))
print('baked', key, len(W), 'points', len(I) // 3, 'faces', 'box', [round(x, 3) for x in lo], [round(x, 3) for x in hi], os.path.getsize(fp) // 1024, 'KB')
