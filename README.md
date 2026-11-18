# Jambutek Studio

A walk-around electronic music jam room in the browser, sister to the Jambutek Arcade. One self-contained page: `public/index.html`.

## Layout

- `public/index.html` is the built page that gets served. Do not edit it by hand.
- `src/` holds the page head and the JavaScript parts (room, each instrument, mixer, input).
- `vendor/` holds three.js r128 and the three embedded images (two speaker faces and the logo).
- `server/worker.js` is the online room server (Cloudflare Worker + Durable Object).
- `build.py` stitches `src/` and `vendor/` into `public/index.html`.

## Change and build

    python3 build.py

Commit the rebuilt `public/index.html` along with the source change.

## Deploy

`wrangler.jsonc` describes a Cloudflare Worker that serves `public/` and runs `server/worker.js`, the room server for online play: one Durable Object per room code, which relays players, notes and knob moves and keeps each machine's latest state for late arrivals.

- From Cloudflare: Workers & Pages, Create, import this repository. No build command is needed; the deploy command is `npx wrangler deploy`.
- From a terminal: `npx wrangler deploy`.

## Online rooms

Opened from the Worker's address, the page offers a lobby: pick a name and a character, make a room or join one by code (up to six players). Opened as a local file it skips the lobby and plays solo. `npx wrangler dev` runs the whole thing locally, rooms included.
