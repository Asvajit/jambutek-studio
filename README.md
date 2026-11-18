# Jambutek Studio

A walk-around electronic music jam room in the browser, sister to the Jambutek Arcade. One self-contained page: `public/index.html`.

## Layout

- `public/index.html` is the built page that gets served. Do not edit it by hand.
- `src/` holds the page head and the JavaScript parts (room, each instrument, mixer, input).
- `vendor/` holds three.js r128 and the three embedded images (two speaker faces and the logo).
- `build.py` stitches `src/` and `vendor/` into `public/index.html`.

## Change and build

    python3 build.py

Commit the rebuilt `public/index.html` along with the source change.

## Deploy

`wrangler.jsonc` describes a Cloudflare Worker that serves `public/` as static assets, with no server code.

- From Cloudflare: Workers & Pages, Create, import this repository. No build command is needed; the deploy command is `npx wrangler deploy`.
- From a terminal: `npx wrangler deploy`.
