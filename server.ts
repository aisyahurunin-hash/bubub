import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import { createFullProjectZip, createStaticSiteZip } from './zipExport.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Role = 'p1' | 'p2';

interface ClientMeta {
  ws: WebSocket;
  roomCode: string | null;
  isHost: boolean;
  role: Role;
  micActive: boolean;
}

interface RoomState {
  code: string;
  host: ClientMeta;
  guest: ClientMeta | null;
  levelId: number;
  outfits: { girl: string; boy: string };
  createdAt: number;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_RE = /^[A-Z0-9]{4,8}$/;

function generateRoomCode(existing: Map<string, RoomState>): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    if (!existing.has(code)) return code;
  }
  return `BUB${Math.floor(100 + Math.random() * 899)}`;
}

function safeSend(ws: WebSocket | null | undefined, payload: unknown) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch {
    // Ignore transient closed socket writes
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, app: 'BUBUB' });
  });

  app.get('/api/download-zip', async (req, res) => {
    try {
      const mode = req.query.mode === 'full' ? 'full' : 'static';
      if (mode === 'static') {
        const result = await createStaticSiteZip(__dirname);
        if (!result) {
          res.status(409).json({
            error: 'Build dist/ belum tersedia. Jalankan npm run build terlebih dahulu atau pilih mode=full.',
          });
          return;
        }
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="bubub-3d-web-statis.zip"');
        res.setHeader('Content-Length', String(result.buffer.length));
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Zip-Files', String(result.fileCount));
        res.status(200).end(result.buffer);
        return;
      }

      const fullResult = await createFullProjectZip(__dirname);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="bubub-3d-full-project.zip"');
      res.setHeader('Content-Length', String(fullResult.buffer.length));
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Zip-Files', String(fullResult.fileCount));
      res.status(200).end(fullResult.buffer);
    } catch (err) {
      console.error('Failed to generate hosting zip:', err);
      res.status(500).json({ error: 'Gagal membuat file ZIP.' });
    }
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 64 * 1024,
  });

  const rooms = new Map<string, RoomState>();
  const clients = new Map<WebSocket, ClientMeta>();

  function getPeer(room: RoomState, meta: ClientMeta): ClientMeta | null {
    if (room.host === meta) return room.guest;
    if (room.guest === meta) return room.host;
    return null;
  }

  function leaveCurrentRoom(meta: ClientMeta) {
    if (!meta.roomCode) return;
    const room = rooms.get(meta.roomCode);
    meta.roomCode = null;
    if (!room) return;

    const peer = getPeer(room, meta);
    if (room.host === meta) {
      if (peer) {
        // Promote guest to host or notify partner left
        safeSend(peer.ws, { type: 'partner_left', message: 'Pasanganmu keluar dari room.' });
        peer.roomCode = null;
      }
      rooms.delete(room.code);
    } else if (room.guest === meta) {
      room.guest = null;
      if (peer) {
        safeSend(peer.ws, { type: 'partner_left', message: 'Pasanganmu terputus dari room.' });
      }
    }
  }

  wss.on('connection', (ws) => {
    const meta: ClientMeta = {
      ws,
      roomCode: null,
      isHost: false,
      role: 'p1',
      micActive: false,
    };
    clients.set(ws, meta);

    ws.on('message', (rawData) => {
      let msg: Record<string, unknown>;
      try {
        const text = typeof rawData === 'string' ? rawData : rawData.toString('utf8');
        if (text.length > 64 * 1024) return;
        msg = JSON.parse(text) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = typeof msg.type === 'string' ? msg.type : '';

      if (type === 'create_room') {
        leaveCurrentRoom(meta);
        const code = generateRoomCode(rooms);
        const levelId = typeof msg.levelId === 'number' && msg.levelId >= 1 && msg.levelId <= 15 ? msg.levelId : 1;
        const rawOutfits = (msg.outfits && typeof msg.outfits === 'object' ? msg.outfits : {}) as Record<string, unknown>;
        const girl = typeof rawOutfits.girl === 'string' ? rawOutfits.girl.slice(0, 32) : 'unnes';
        const boy = typeof rawOutfits.boy === 'string' ? rawOutfits.boy.slice(0, 32) : 'pelayaran_putih';

        meta.roomCode = code;
        meta.isHost = true;
        meta.role = 'p1';

        const room: RoomState = {
          code,
          host: meta,
          guest: null,
          levelId,
          outfits: { girl, boy },
          createdAt: Date.now(),
        };
        rooms.set(code, room);

        safeSend(ws, {
          type: 'room_created',
          code,
          isHost: true,
          role: 'p1',
          levelId,
          outfits: room.outfits,
        });
        return;
      }

      if (type === 'join_room') {
        const rawCode = typeof msg.code === 'string' ? msg.code.trim().toUpperCase() : '';
        if (!ROOM_CODE_RE.test(rawCode)) {
          safeSend(ws, { type: 'room_error', message: 'Format kode room tidak valid.' });
          return;
        }
        const room = rooms.get(rawCode);
        if (!room) {
          safeSend(ws, { type: 'room_error', message: 'Kode room tidak ditemukan. Cek lagi ya!' });
          return;
        }
        if (room.guest && room.guest !== meta) {
          safeSend(ws, { type: 'room_error', message: 'Room sudah penuh (2 pemain).' });
          return;
        }

        leaveCurrentRoom(meta);
        meta.roomCode = room.code;
        meta.isHost = false;
        meta.role = room.host.role === 'p1' ? 'p2' : 'p1';
        room.guest = meta;

        // Notify both host & guest
        safeSend(room.host.ws, {
          type: 'room_ready',
          code: room.code,
          isHost: true,
          role: room.host.role,
          partnerRole: meta.role,
          levelId: room.levelId,
          outfits: room.outfits,
        });
        safeSend(ws, {
          type: 'room_ready',
          code: room.code,
          isHost: false,
          role: meta.role,
          partnerRole: room.host.role,
          levelId: room.levelId,
          outfits: room.outfits,
        });
        return;
      }

      if (type === 'leave_room') {
        leaveCurrentRoom(meta);
        return;
      }

      if (!meta.roomCode) return;
      const room = rooms.get(meta.roomCode);
      if (!room) return;
      const peer = getPeer(room, meta);

      if (type === 'swap_roles') {
        if (!room.guest) {
          room.host.role = room.host.role === 'p1' ? 'p2' : 'p1';
          safeSend(room.host.ws, {
            type: 'roles_updated',
            role: room.host.role,
          });
          return;
        }
        const oldHostRole = room.host.role;
        room.host.role = room.guest.role;
        room.guest.role = oldHostRole;
        safeSend(room.host.ws, { type: 'roles_updated', role: room.host.role });
        safeSend(room.guest.ws, { type: 'roles_updated', role: room.guest.role });
        return;
      }

      if (type === 'outfit_update') {
        const rawOutfits = (msg.outfits && typeof msg.outfits === 'object' ? msg.outfits : {}) as Record<string, unknown>;
        if (typeof rawOutfits.girl === 'string') room.outfits.girl = rawOutfits.girl.slice(0, 32);
        if (typeof rawOutfits.boy === 'string') room.outfits.boy = rawOutfits.boy.slice(0, 32);
        safeSend(room.host.ws, { type: 'outfits_updated', outfits: room.outfits });
        if (room.guest) safeSend(room.guest.ws, { type: 'outfits_updated', outfits: room.outfits });
        return;
      }

      if (type === 'level_start') {
        if (typeof msg.levelId === 'number' && msg.levelId >= 1 && msg.levelId <= 15) {
          room.levelId = msg.levelId;
        }
        if (peer) {
          safeSend(peer.ws, { type: 'level_start', levelId: room.levelId });
        }
        return;
      }

      if (
        type === 'input' ||
        type === 'state_sync' ||
        type === 'game_event' ||
        type === 'webrtc_offer' ||
        type === 'webrtc_answer' ||
        type === 'webrtc_ice' ||
        type === 'mic_status'
      ) {
        if (peer) {
          safeSend(peer.ws, msg);
        }
      }
    });

    ws.on('close', () => {
      leaveCurrentRoom(meta);
      clients.delete(ws);
    });

    ws.on('error', () => {
      leaveCurrentRoom(meta);
      clients.delete(ws);
    });
  });

  // Vite dev middleware or static dist serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`BUBUB server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
