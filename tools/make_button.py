"""Bakes the round push-button model (a .glb given on the command line) into vendor/button.json: just the two shapes, the base ring and
the cap, as 16-bit positions over a bounding box. Its flat textures are not used; the room paints its own.
  python3 -I tools/make_button.py path/to/button.glb"""
import base64, json, struct, sys
d = open(sys.argv[1], 'rb').read(); o = 12; ch = []
while o < len(d):
    cl, ct = struct.unpack('<II', d[o:o + 8]); ch.append(d[o + 8:o + 8 + cl]); o += 8 + cl
J = json.loads(ch[0]); B = ch[1]
def acc(i):
    a = J['accessors'][i]; bv = J['bufferViews'][a['bufferView']]; off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[a['type']]; fmt = {5126: 'f', 5125: 'I', 5123: 'H'}[a['componentType']]; size = struct.calcsize(fmt) * n; stride = bv.get('byteStride') or size
    return [struct.unpack_from('<' + fmt * n, B, off + k * stride) for k in range(a['count'])]
def bake(mesh):
    p = J['meshes'][mesh]['primitives'][0]; pos = acc(p['attributes']['POSITION']); idx = [v[0] for v in acc(p['indices'])]      # the scene's two root rotations cancel out, so positions are already Y-up
    lo = [min(v[k] for v in pos) for k in range(3)]; hi = [max(v[k] for v in pos) for k in range(3)]
    q = [int(round((v[k] - lo[k]) / ((hi[k] - lo[k]) or 1) * 65535)) for v in pos for k in range(3)]
    assert max(idx) < 65536
    return {'lo': [round(v, 5) for v in lo], 'hi': [round(v, 5) for v in hi], 'p': base64.b64encode(struct.pack('<%dH' % len(q), *q)).decode(), 'i': base64.b64encode(struct.pack('<%dH' % len(idx), *idx)).decode()}
out = {'base': bake(0), 'cap': bake(1), 'credit': 'Button by DrakonSlayer (sketchfab.com/DrakonSlayer), CC BY 4.0'}
json.dump(out, open('vendor/button.json', 'w'), separators=(',', ':')); print({k: (v['lo'], v['hi']) for k, v in out.items() if k != 'credit'}, len(json.dumps(out)) // 1024, 'KB')
