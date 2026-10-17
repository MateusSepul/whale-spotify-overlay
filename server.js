require('dotenv').config();
const express = require('express');
const fs = require('fs');
const http = require('http');
const path = require('path');
const multer = require('multer');
const WebSocket = require('ws');

const userStore = require('./src/user-store');
const configStore = require('./src/config-store');
const detector = require('./src/detector');
const spotifyApi = require('./src/spotify-api');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Multer: upload de vídeos/GIFs para public/visualizations
const visDir = path.join(__dirname, 'public', 'visualizations');
if (!fs.existsSync(visDir)) fs.mkdirSync(visDir, { recursive: true });

const allowedExts = ['.mp4', '.webm', '.gif', '.mov', '.ogv'];
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, visDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    cb(null, `${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) return cb(null, true);
    cb(new Error(`Tipo de arquivo não suportado: ${ext}. Use: ${allowedExts.join(', ')}`));
  }
});

// Helper para extrair userId
function resolveUserId(req) {
  return (req.query && (req.query.userId || req.query.id || req.query.u)) ||
         (req.body && (req.body.userId || req.body.id)) ||
         'default';
}

function getBaseUrl(req) {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, '');
  }
  return `${req.protocol}://${req.get('host')}`;
}

// Rota do Overlay para o OBS
app.get('/overlay', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'overlay.html'));
});

// APIs REST Multi-Usuário
app.get('/api/me', (req, res) => {
  const userId = resolveUserId(req);
  const user = userStore.getUser(userId);
  res.json({
    userId: user.id,
    config: user.config,
    spotify: user.spotify ? {
      id: user.spotify.id,
      displayName: user.spotify.displayName,
      avatar: user.spotify.avatar,
      product: user.spotify.product
    } : null,
    isSpotifyConfigured: spotifyApi.isConfigured()
  });
});

app.get('/api/config', (req, res) => {
  const userId = resolveUserId(req);
  res.json(userStore.getUserConfig(userId));
});

app.post('/api/config', (req, res) => {
  const userId = resolveUserId(req);
  const patch = req.body || {};
  delete patch.userId;
  delete patch.id;

  const updated = userStore.saveUserConfig(userId, patch);
  broadcastToUser(userId, { type: 'config', data: updated });
  res.json({ success: true, config: updated });
});

app.get('/api/media', (req, res) => {
  const userId = resolveUserId(req);
  detector.touchUser(userId);
  res.json(detector.getUserMedia(userId) || { isPlaying: false, title: '', artist: '' });
});

app.post('/api/demo/next', (req, res) => {
  const userId = resolveUserId(req);
  const track = detector.nextDemoTrack(userId);
  res.json({ success: true, track });
});

app.get('/api/visualizations', (req, res) => {
  try {
    const files = fs.readdirSync(visDir).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.mp4', '.webm', '.gif', '.mov', '.ogv', '.png', '.jpg', '.jpeg'].includes(ext);
    });
    res.json({ files });
  } catch (err) {
    res.json({ files: [] });
  }
});

app.post('/api/visualizations/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  res.json({ success: true, filename: req.file.filename });
});

app.delete('/api/visualizations/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(visDir, path.basename(filename));
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Arquivo não encontrado.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Spotify OAuth Oficial Centralizado
app.get('/auth/spotify/login', (req, res) => {
  if (!spotifyApi.isConfigured()) {
    return res.redirect('/?error=spotify_not_configured');
  }

  const userId = resolveUserId(req);
  const redirectUri = `${getBaseUrl(req)}/auth/spotify/callback`;
  const url = spotifyApi.getAuthUrl(redirectUri, userId);
  res.redirect(url);
});

app.get('/auth/spotify/callback', async (req, res) => {
  const code = req.query.code;
  const stateUserId = req.query.state || 'default';

  if (!code) {
    return res.redirect('/?error=missing_code');
  }

  const redirectUri = `${getBaseUrl(req)}/auth/spotify/callback`;

  try {
    const tokens = await spotifyApi.exchangeCodeForTokens(code, redirectUri);
    const profile = await spotifyApi.getUserProfile(tokens.access_token);
    const user = userStore.createOrUpdateFromSpotify(profile, tokens, stateUserId);

    detector.touchUser(user.id);
    broadcastToUser(user.id, { type: 'config', data: user.config });

    res.redirect(`/?user=${encodeURIComponent(user.id)}&spotify=connected`);
  } catch (err) {
    console.error('Erro no callback Spotify:', err.message);
    res.redirect(`/?error=${encodeURIComponent(err.message)}`);
  }
});

app.post('/auth/spotify/disconnect', (req, res) => {
  const userId = resolveUserId(req);
  const updatedUser = userStore.disconnectSpotify(userId);
  broadcastToUser(userId, { type: 'config', data: updatedUser.config });
  res.json({ success: true });
});

// Rotas de compatibilidade com versões antigas
app.get('/api/spotify/login', (req, res) => res.redirect('/auth/spotify/login'));
app.get('/callback', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  res.redirect(`/auth/spotify/callback?${query}`);
});

// Criar servidor HTTP e WebSocket Multi-Usuário (Rooms)
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const userRooms = new Map(); // userId -> Set<WebSocket>

function broadcastToUser(userId, msg) {
  const id = String(userId || 'default').trim();
  const room = userRooms.get(id);
  if (!room || room.size === 0) return;

  const json = JSON.stringify(msg);
  room.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

wss.on('connection', (ws, req) => {
  let userId = 'default';
  try {
    const parsed = new URL(req.url, 'http://localhost');
    userId = parsed.searchParams.get('userId') || parsed.searchParams.get('id') || parsed.searchParams.get('u') || 'default';
  } catch (e) {}

  userId = String(userId).trim();

  // Adicionar à sala do usuário
  if (!userRooms.has(userId)) {
    userRooms.set(userId, new Set());
  }
  userRooms.get(userId).add(ws);
  detector.touchUser(userId);

  // Enviar estado inicial imediatamente na conexão
  ws.send(JSON.stringify({ type: 'config', data: userStore.getUserConfig(userId) }));
  const initialMedia = detector.getUserMedia(userId);
  if (initialMedia && initialMedia.title) {
    ws.send(JSON.stringify({ type: 'media', data: initialMedia }));
  }

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      detector.touchUser(userId);

      if (parsed.type === 'update_config') {
        const updated = userStore.saveUserConfig(userId, parsed.data);
        broadcastToUser(userId, { type: 'config', data: updated });
      } else if (parsed.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    const room = userRooms.get(userId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) userRooms.delete(userId);
    }
  });
});

// Conectar atualizações do detector ao WebSocket específico de cada usuário
detector.listAllUsers = () => userStore.listAllUsers();
userStore.listAllUsers().forEach(u => {
  detector.onUserUpdate(u.id, (mediaData) => {
    broadcastToUser(u.id, { type: 'media', data: mediaData });
  });
});

// Ouvinte dinâmico para novos usuários ou updates
detector.onUpdateCallback = (mediaData) => {
  // compatibilidade
};

// Monitoramento central
const activeListeners = new Set();
setInterval(() => {
  const allUsers = userStore.listAllUsers();
  allUsers.forEach(u => {
    if (!activeListeners.has(u.id)) {
      activeListeners.add(u.id);
      detector.onUserUpdate(u.id, (mediaData) => {
        broadcastToUser(u.id, { type: 'media', data: mediaData });
      });
    }
  });
}, 5000);

// Iniciar detector e servidor
detector.start();

server.listen(port, () => {
  console.log(`=======================================================`);
  console.log(`🎶 SPOTIFY OVERLAY (WHALE OBS) INICIADO COM SUCESSO!`);
  console.log(`🚀 Modo: Multi-Usuário Pronto para Produção na Web`);
  console.log(`🖥️  Painel: http://localhost:${port}/`);
  console.log(`📺 Overlay OBS: http://localhost:${port}/overlay`);
  console.log(`🔑 Spotify OAuth Configurado: ${spotifyApi.isConfigured() ? 'SIM' : 'NÃO (defina no .env)'}`);
  console.log(`=======================================================`);
});
