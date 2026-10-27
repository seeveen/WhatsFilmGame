import express from 'express';
import { createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'node:path';
import dotenv from 'dotenv';
import { DatabaseService } from './server/src/database/db.ts';
import { TikTokService } from './server/src/integrations/tiktok.ts';
import { GameEngine } from './server/src/game/engine.ts';
import { validateJsonImport } from './src/game/import-validator.ts';

dotenv.config();

const app = express();
const server = createServer(app);

function isLocalRequest(origin: string | undefined, host: string | undefined): boolean {
  const requestHost = host?.toLowerCase();
  if (!requestHost || !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestHost)) return false;
  if (!origin) return true;
  try {
    return new URL(origin).host.toLowerCase() === requestHost;
  } catch {
    return false;
  }
}

const io = new SocketIOServer(server, {
  allowRequest: (req, callback) => {
    callback(null, isLocalRequest(req.headers.origin, req.headers.host));
  },
});


// Initialize services
const db = new DatabaseService();
const tiktok = new TikTokService();
const engine = new GameEngine(db, tiktok);

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use((req, res, next) => {
  if (isLocalRequest(req.get('origin'), req.get('host'))) return next();
  return res.status(403).json({ error: 'Origem não autorizada.' });
});

// Forward engine events to Socket.IO
engine.on('state', (state) => {
  io.emit('game:state', state);
});

engine.on('correct_guess', (data) => {
  io.emit('game:correct_guess', data);
});

engine.on('gift_received', (data) => {
  io.emit('game:gift_received', data);
});

tiktok.on('log', (msg) => {
  io.emit('tiktok:log', { message: msg, timestamp: Date.now() });
});

// Socket connection
io.on('connection', (socket) => {
  // Send initial state immediately to new client
  socket.emit('game:state', engine.getSnapshot());
});

// --- REST API Endpoints ---
app.get('/api/state', (_req, res) => {
  res.json(engine.getSnapshot());
});

app.get('/api/settings', (_req, res) => {
  res.json(engine.getSettings());
});

app.post('/api/settings', (req, res) => {
  if (!engine.updateSettings(req.body)) {
    return res.status(400).json({ error: 'Configurações inválidas.' });
  }
  res.json({ success: true, settings: engine.getSettings() });
});

// Challenges API
app.get('/api/challenges', (req, res) => {
  const category = (req.query.category as string) || 'all';
  const search = (req.query.search as string) || '';
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  const result = db.getAllChallenges({ category, search, limit, offset });
  res.json(result);
});

app.post('/api/challenges', (req, res) => {
  const { emoji, filme, aliases, category, difficulty } = req.body;
  if (!emoji || !filme) {
    return res.status(400).json({ error: 'Emoji e filme são obrigatórios.' });
  }

  const newChallenge = {
    id: `chal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    emoji: emoji.trim(),
    filme: filme.trim(),
    aliases: Array.isArray(aliases) ? aliases : [],
    category: category || 'Filmes',
    difficulty: difficulty || 'medio',
    createdAt: Date.now(),
  };

  db.addChallenge(newChallenge);
  engine.emitState();
  res.json({ success: true, challenge: newChallenge });
});

app.put('/api/challenges/:id', (req, res) => {
  const id = req.params.id;
  const { emoji, filme, aliases, category, difficulty } = req.body;
  
  db.updateChallenge({
    id,
    emoji: emoji.trim(),
    filme: filme.trim(),
    aliases: Array.isArray(aliases) ? aliases : [],
    category: category || 'Filmes',
    difficulty: difficulty || 'medio',
  });
  engine.emitState();
  res.json({ success: true });
});

app.delete('/api/challenges/:id', (req, res) => {
  db.deleteChallenge(req.params.id);
  engine.emitState();
  res.json({ success: true });
});

// Mass JSON validation and import
app.post('/api/challenges/validate-import', (req, res) => {
  const { json } = req.body;
  const { challenges } = db.getAllChallenges();
  const validation = validateJsonImport(json, challenges);
  res.json(validation);
});

app.post('/api/challenges/import', (req, res) => {
  const { json, overwriteDuplicates } = req.body;
  const { challenges: existing } = db.getAllChallenges();
  const validation = validateJsonImport(json, existing);

  if (validation.validChallenges.length === 0) {
    return res.status(400).json({ error: 'Nenhum desafio válido para importar.', validation });
  }

  const importResult = db.bulkAddChallenges(validation.validChallenges, !!overwriteDuplicates);
  engine.emitState();
  res.json({ success: true, ...importResult, validation });
});

app.get('/api/challenges/export', (_req, res) => {
  const { challenges } = db.getAllChallenges();
  const exportData = challenges.map((c) => ({
    emoji: c.emoji,
    filme: c.filme,
    aliases: c.aliases,
    category: c.category,
    difficulty: c.difficulty,
  }));

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=qual-e-o-filme-biblioteca.json');
  res.send(JSON.stringify(exportData, null, 2));
});

// Game Controls
app.post('/api/game/start', (_req, res) => {
  engine.startMatch();
  res.json({ success: true });
});

app.post('/api/game/pause', (_req, res) => {
  engine.pauseGame();
  res.json({ success: true });
});

app.post('/api/game/resume', (_req, res) => {
  engine.resumeGame();
  res.json({ success: true });
});

app.post('/api/game/skip', (_req, res) => {
  engine.skipRound();
  res.json({ success: true });
});

app.post('/api/game/reset-leaderboard', (_req, res) => {
  engine.resetLeaderboard();
  res.json({ success: true });
});

// TikTok LIVE Integration
app.post('/api/tiktok/connect', async (req, res) => {
  const { username } = req.body;
  const result = await tiktok.connect(username);
  res.json(result);
});

app.post('/api/tiktok/disconnect', async (_req, res) => {
  await tiktok.disconnect();
  res.json({ success: true });
});

// Simulation tools for local tests & admin preview
app.post('/api/tiktok/simulate-chat', (req, res) => {
  const { username, comment, profilePictureUrl } = req.body;
  tiktok.simulateChat(username || 'participante', comment || '', profilePictureUrl);
  res.json({ success: true });
});

app.post('/api/tiktok/simulate-gift', (req, res) => {
  const { username, giftName, giftId, repeatCount, profilePictureUrl } = req.body;
  tiktok.simulateGift(username || 'apoiador', giftName || 'Rosa', repeatCount || 1, giftId, profilePictureUrl);
  res.json({ success: true });
});

// History & Logs
app.get('/api/history', (_req, res) => {
  res.json({
    matches: db.getMatchHistory(20),
    recentGifts: db.getRecentGiftsLog(50),
  });
});

// Mounting Vite in Dev Mode or Serving Static Dist in Production
export interface ServerOptions {
  host?: string;
  port?: number;
  staticDirectory?: string;
}

export async function startServer(options: ServerOptions = {}): Promise<number> {
  if (process.env.NODE_ENV === 'production') {
    const staticDirectory = path.resolve(options.staticDirectory || path.join(process.cwd(), 'dist'));
    app.use(express.static(staticDirectory));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(staticDirectory, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const host = options.host || process.env.HOST || '127.0.0.1';
  const port = options.port ?? Number(process.env.PORT || 3000);
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => reject(error);
    server.once('error', onError);
    server.listen(port, host, () => {
      server.off('error', onError);
      resolve();
    });
  });

  const address = server.address();
  const listeningPort = address && typeof address === 'object' ? address.port : port;
  console.log(`[QUAL É O FILME?] Server listening on http://${host}:${listeningPort}`);
  return listeningPort;
}

export async function stopServer(): Promise<void> {
  await tiktok.disconnect();
  engine.stop();
  io.close();
  await new Promise<void>((resolve) => {
    if (!server.listening) {
      resolve();
      return;
    }
    server.close(() => resolve());
  });
}

if (process.env.START_SERVER !== 'false') {
  startServer().catch((error) => {
    console.error('[QUAL É O FILME?] Failed to start server:', error);
    process.exitCode = 1;
  });
}
