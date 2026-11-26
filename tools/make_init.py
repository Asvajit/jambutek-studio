#!/usr/bin/env python3
"""Write vendor/init.json: the state every machine starts in when nothing is saved and no jam is loaded.
The wall's CLEAR button loads it before emptying the patterns, so every knob goes back to its default.
Run this again (after python3 build.py) whenever a machine gains a control or a default changes, then build again.

  python3 tools/make_init.py        needs playwright and Chrome at /usr/bin/google-chrome"""
import asyncio, json, os, subprocess, time
from playwright.async_api import async_playwright
here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8771', '-d', os.path.join(here, 'public')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-proxy-server', '--mute-audio'])
            pg = await b.new_page(viewport={'width': 1100, 'height': 700})
            async def page(route):                              # the same page, but with no starter jam: what is left is each machine's own defaults
                r = await route.fetch(); t = await r.text(); a = 'window.JB_DEFAULTS=window.JB_JAMS[0]||null;'; assert a in t
                await route.fulfill(response=r, body=t.replace(a, 'window.JB_JAMS=[];window.JB_DEFAULTS=null;'))
            await pg.route('**/index.html', page)
            await pg.route('**/mp-ping', lambda r: r.fulfill(status=200, content_type='application/json', body='{"ok":true,"max":6}'))
            await pg.goto('http://localhost:8771/index.html', wait_until='commit'); await pg.wait_for_timeout(9000)
            await pg.fill('#mpName', 'INIT'); await pg.click('#mpSolo'); await pg.wait_for_timeout(1200); await pg.click('#mpGo'); await pg.wait_for_timeout(5000)
            st = await pg.evaluate('()=>__studio.patternDump().state'); await b.close()
        assert isinstance(st, dict) and len(st) > 8, st
        fp = os.path.join(here, 'vendor', 'init.json'); json.dump(st, open(fp, 'w'), separators=(',', ':')); print('wrote', fp, len(st), 'keys', os.path.getsize(fp) // 1024, 'KB'); print(sorted(k.replace('jambutek-studio-', '') for k in st))
    finally: srv.terminate()
asyncio.run(main())
