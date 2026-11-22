/* Jambutek Studio: serves the page, and runs one tiny live server per room.
   A room is a Durable Object named by its code. It relays where everyone is, what they play and
   every knob they turn, keeps the latest state of each machine for people who arrive later,
   and wipes itself when everyone leaves. */
const MAX_PLAYERS = 6;
const MAX_WATCHERS = 24;        // spectators: they see and hear the room, are not in it, and do not count towards the six
const SKINS = 12;                 // one of each look per room
const COLORS = ['#FF2A6A', '#30A8F0', '#90F0A8', '#F5D547', '#B05AFF', '#FF8A3A'];

export class Room {
  constructor(ctx, env) {
    this.ctx = ctx; this.env = env;
    this.told = {};         // name -> when Discord was last told about them, so reconnects don't spam
    this.world = {};        // shared room state, key -> value (one machine or one drum pattern per key)
    ctx.blockConcurrencyWhile(async () => {
      const all = await ctx.storage.list({ prefix: 'w:' });
      for (const [k, v] of all) this.world[k.slice(2)] = v;
    });
  }
  everyone(except) {                                 // every open connection: players and spectators
    return this.ctx.getWebSockets().map((ws) => {
      try { return { ws, a: ws.deserializeAttachment() }; } catch (e) { return null; }
    }).filter((p) => p && p.a && !p.a.gone && p.ws !== except);
  }
  players(except) { return this.everyone(except).filter((p) => !p.a.spec); }
  watchers(except) { return this.everyone(except).filter((p) => p.a.spec); }
  broadcast(msg, except) {
    const s = JSON.stringify(msg);
    for (const p of this.everyone(except)) { try { p.ws.send(s); } catch (e) {} }
  }
  async fetch(req) {
    if (new URL(req.url).pathname.startsWith('/room/')) {    // which looks are already being worn here
      const ps = this.players();
      return Response.json({ n: ps.length, taken: ps.map((p) => p.a.skin || 0), watching: this.watchers().length }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const url = new URL(req.url);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const others = this.players();
    if (url.searchParams.get('spec') === '1') {              // a spectator: gets everything the players send, sends nothing, takes no seat
      const w = this.watchers();
      if (w.length >= MAX_WATCHERS) { server.accept(); server.send(JSON.stringify({ t: 'full', spec: 1 })); server.close(4001, 'Room full'); return new Response(null, { status: 101, webSocket: client }); }
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ id: crypto.randomUUID().slice(0, 8), spec: 1 });
      server.send(JSON.stringify({
        t: 'welcome', spec: 1, max: MAX_PLAYERS, now: Date.now(), watching: w.length + 1,
        players: others.map((p) => ({ id: p.a.id, name: p.a.name, color: p.a.color, skin: p.a.skin || 0, s: p.a.s })),
        world: this.world,
      }));
      this.broadcast({ t: 'watch', n: w.length + 1 }, server);
      return new Response(null, { status: 101, webSocket: client });
    }
    if (others.length >= MAX_PLAYERS) {
      server.accept();
      server.send(JSON.stringify({ t: 'full' }));
      server.close(4001, 'Room full');
      return new Response(null, { status: 101, webSocket: client });
    }
    if (!others.length) { this.world = {}; await this.ctx.storage.deleteAll(); }      // first one in: a fresh room
    const name = (url.searchParams.get('name') || 'Guest').replace(/[<>]/g, '').trim().slice(0, 16) || 'Guest';
    const takenSkins = others.map((p) => p.a.skin || 0);
    let skin = Math.max(0, Math.min(SKINS - 1, parseInt(url.searchParams.get('skin') || '0', 10) || 0));
    if (takenSkins.includes(skin)) { for (let i = 0; i < SKINS; i++) if (!takenSkins.includes(i)) { skin = i; break; } }
    const used = others.map((p) => p.a.color);
    const color = COLORS.find((c) => !used.includes(c)) || COLORS[0];
    const id = crypto.randomUUID().slice(0, 8);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ id, name, color, skin, s: null });
    server.send(JSON.stringify({
      t: 'welcome', id, color, skin, max: MAX_PLAYERS, now: Date.now(), watching: this.watchers().length,
      players: others.map((p) => ({ id: p.a.id, name: p.a.name, color: p.a.color, skin: p.a.skin || 0, s: p.a.s })),
      world: this.world,
    }));
    this.broadcast({ t: 'join', id, name, color, skin }, server);
    if (url.searchParams.get('me') !== '1') this.tell(name, url, others.length + 1);
    return new Response(null, { status: 101, webSocket: client });
  }
  tell(name, url, n) {                              // a Discord message when someone comes in. Does nothing unless the DISCORD_WEBHOOK secret is set
    const hook = this.env && this.env.DISCORD_WEBHOOK;
    if (!hook || !/^https?:\/\//.test(hook)) return;
    const now = Date.now(), key = name.toLowerCase();
    if (this.told[key] && now - this.told[key] < 5 * 60 * 1000) return;
    this.told[key] = now;
    const code = url.pathname.slice(4).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const clean = name.replace(/[@`*_~|\\]/g, '');
    const content = '\uD83C\uDFB9 **' + clean + '** joined Jambutek Studio room **' + code + '** (' + n + (n === 1 ? ' player' : ' players') + ' now)\n' + url.protocol.replace('ws', 'http') + '//' + url.host + '/';
    this.ctx.waitUntil(fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, allowed_mentions: { parse: [] } }) }).catch(() => {}));
  }
  async webSocketMessage(ws, raw) {
    if (typeof raw !== 'string' || raw.length > 200000) return;
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    const a = ws.deserializeAttachment(); if (!a || a.gone) return;
    if (a.spec && m.t !== 'ping') return;                // spectators only keep time with the room
    switch (m.t) {
      case 's':                                   // where a player is and where they're looking
        if (!Array.isArray(m.s)) return;
        a.s = m.s.slice(0, 10); ws.serializeAttachment(a);
        this.broadcast({ t: 's', id: a.id, s: a.s }, ws);
        return;
      case 'chat': {
        if (typeof m.text !== 'string') return;
        const text = m.text.replace(/[<>]/g, '').trim().slice(0, 160);
        if (text) this.broadcast({ t: 'chat', id: a.id, name: a.name, color: a.color, text });
        return;
      }
      case 'set':                                 // the latest state of one machine, one pattern, or the transport
        if (typeof m.k !== 'string' || m.k.length > 40 || Object.keys(this.world).length > 80) return;
        this.world[m.k] = m.v;
        this.ctx.storage.put('w:' + m.k, m.v);
        this.broadcast({ t: 'set', k: m.k, v: m.v, id: a.id, now: Date.now() }, ws);
        return;
      case 'ev':                                  // one-off things others should hear or see: a knob moving, a note, a pad
        this.broadcast({ t: 'ev', id: a.id, e: m.e }, ws);
        return;
      case 'ping':                                // also how clients agree on one clock
        try { ws.send(JSON.stringify({ t: 'pong', at: m.at, now: Date.now() })); } catch (e) {}
        return;
    }
  }
  async webSocketClose(ws, code) { await this.leave(ws); try { ws.close(code === 1005 ? 1000 : code, 'bye'); } catch (e) {} }
  async webSocketError(ws) { await this.leave(ws); }
  async leave(ws) {
    let a; try { a = ws.deserializeAttachment(); } catch (e) {}
    if (!a || a.gone) return;
    a.gone = true; try { ws.serializeAttachment(a); } catch (e) {}
    if (a.spec) { this.broadcast({ t: 'watch', n: this.watchers(ws).length }, ws); return; }
    this.broadcast({ t: 'leave', id: a.id, name: a.name }, ws);
    if (!this.players(ws).length) { this.world = {}; await this.ctx.storage.deleteAll(); }   // last one out: the room resets
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/mp-ping') return Response.json({ ok: true, max: MAX_PLAYERS, v: 1 });
    if (url.pathname.startsWith('/room/')) {
      const code = url.pathname.slice(6).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      if (code.length < 4) return Response.json({ n: 0, taken: [] });
      return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(req);
    }
    if (url.pathname.startsWith('/ws/')) {
      const code = url.pathname.slice(4).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      if (code.length < 4) return new Response('Bad room code', { status: 400 });
      return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(req);
    }
    return env.ASSETS.fetch(req);
  },
};
