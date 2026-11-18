/* Jambutek Studio: serves the page, and runs one tiny live server per room.
   A room is a Durable Object named by its code. It relays where everyone is, what they play and
   every knob they turn, keeps the latest state of each machine for people who arrive later,
   and wipes itself when everyone leaves. */
const MAX_PLAYERS = 6;
const COLORS = ['#FF2A6A', '#30A8F0', '#90F0A8', '#F5D547', '#B05AFF', '#FF8A3A'];

export class Room {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.world = {};        // shared room state, key -> value (one machine or one drum pattern per key)
    ctx.blockConcurrencyWhile(async () => {
      const all = await ctx.storage.list({ prefix: 'w:' });
      for (const [k, v] of all) this.world[k.slice(2)] = v;
    });
  }
  players(except) {
    return this.ctx.getWebSockets().map((ws) => {
      try { return { ws, a: ws.deserializeAttachment() }; } catch (e) { return null; }
    }).filter((p) => p && p.a && !p.a.gone && p.ws !== except);
  }
  broadcast(msg, except) {
    const s = JSON.stringify(msg);
    for (const p of this.players(except)) { try { p.ws.send(s); } catch (e) {} }
  }
  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const url = new URL(req.url);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const others = this.players();
    if (others.length >= MAX_PLAYERS) {
      server.accept();
      server.send(JSON.stringify({ t: 'full' }));
      server.close(4001, 'Room full');
      return new Response(null, { status: 101, webSocket: client });
    }
    if (!others.length) { this.world = {}; await this.ctx.storage.deleteAll(); }      // first one in: a fresh room
    const name = (url.searchParams.get('name') || 'Guest').replace(/[<>]/g, '').trim().slice(0, 16) || 'Guest';
    const skin = Math.max(0, Math.min(7, parseInt(url.searchParams.get('skin') || '0', 10) || 0));
    const used = others.map((p) => p.a.color);
    const color = COLORS.find((c) => !used.includes(c)) || COLORS[0];
    const id = crypto.randomUUID().slice(0, 8);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ id, name, color, skin, s: null });
    server.send(JSON.stringify({
      t: 'welcome', id, color, max: MAX_PLAYERS, now: Date.now(),
      players: others.map((p) => ({ id: p.a.id, name: p.a.name, color: p.a.color, skin: p.a.skin || 0, s: p.a.s })),
      world: this.world,
    }));
    this.broadcast({ t: 'join', id, name, color, skin }, server);
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, raw) {
    if (typeof raw !== 'string' || raw.length > 200000) return;
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    const a = ws.deserializeAttachment(); if (!a || a.gone) return;
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
    this.broadcast({ t: 'leave', id: a.id, name: a.name }, ws);
    if (!this.players(ws).length) { this.world = {}; await this.ctx.storage.deleteAll(); }   // last one out: the room resets
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/mp-ping') return Response.json({ ok: true, max: MAX_PLAYERS, v: 1 });
    if (url.pathname.startsWith('/ws/')) {
      const code = url.pathname.slice(4).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      if (code.length < 4) return new Response('Bad room code', { status: 400 });
      return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(req);
    }
    return env.ASSETS.fetch(req);
  },
};
