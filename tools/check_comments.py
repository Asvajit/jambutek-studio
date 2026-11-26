#!/usr/bin/env python3
"""Catch code hidden behind a // comment: a statement written after a mid-line '//' is silently commented out
(this has broken the room more than once). Run by build.py; exits non-zero and names the lines if it finds one."""
import re, sys, os, glob
here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CODE = re.compile(r';\s*(?:var |if \(|for \(|return\b|[A-Za-z_$][\w$]*(?:\.[\w$]+|\[[^\]]*\])*\s*(?:=[^=>]|\(|\+\+|--))')
bad = []
for f in sorted(glob.glob(os.path.join(here, 'src', '*.js'))):
    for n, line in enumerate(open(f, encoding='utf-8'), 1):
        s, i, q, out = line, 0, None, -1
        while i < len(s):                                   # find a '//' that is not inside a string or a regex literal
            ch = s[i]
            if q:
                if ch == '\\': i += 2; continue
                if ch == q: q = None
            elif ch in '\'"`': q = ch
            elif s.startswith('/*', i): j = s.find('*/', i + 2); i = len(s) if j < 0 else j + 2; continue
            elif s.startswith('//', i) and not s[max(0, i - 1)] == ':': out = i; break
            elif ch == '/' and re.search(r'[(,=:!&|?{};]\s*$', s[:i]): q = '/'
            i += 1
        if out > 0 and s[:out].strip() and CODE.search(s[out + 2:]): bad.append('%s:%d  %s' % (os.path.basename(f), n, s[out:out + 110].strip()))
if bad:
    print('Code after a // comment (it will not run):\n  ' + '\n  '.join(bad)); sys.exit(1)
