const express = require('express');
const fs = require('fs');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const configStore = require('./src/config-store');
const detector = require('./src/detector');
const spotifyApi = require('./src/spotify-api');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota do Overlay para o OBS
app.get('/overlay', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'overlay.html'));
});

// APIs REST
app.get('/api/config', (req, res) => {
  res.json(configStore.get());
});

app.post('/api/config', (req, res) => {
  const updated = configStore.save(req.body);
  broadcastWS({ type: 'config', data: updated });
  res.json({ success: true, config: updated });
});

app.get('/api/media', (req, res) => {
  res.json(detector.lastMedia || { isPlaying: false });
});

app.post('/api/demo/next', (req, res) => {
  detector.nextDemoTrack();
  res.json({ success: true });
});

app.get('/api/visualizations', (req, res) => {
  const visDir = path.join(__dirname, 'public', 'visualizations');
  try {
    if (!fs.existsSync(visDir)) {
      fs.mkdirSync(visDir, { recursive: true });
    }
    const files = fs.readdirSync(visDir).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.mp4', '.webm', '.gif', '.mov', '.ogv', '.png', '.jpg', '.jpeg'].includes(ext);
    });
    res.json({ files });
  } catch (err) {
    res.json({ files: [] });
  }
});

// Spotify OAuth routes
app.get('/api/spotify/login', (req, res) => {
  const config = configStore.get();
  if (!config.spotifyClientId) {
    return res.status(400).send('Client ID do Spotify não configurado.');
  }
  const redirectUri = `${req.protocol}://${req.get('host')}/callback`;
  const url = spotifyApi.getAuthUrl(config.spotifyClientId, redirectUri);
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.redirect('/?error=missing_code');
  }

  const config = configStore.get();
  const redirectUri = `${req.protocol}://${req.get('host')}/callback`;

  try {
    await spotifyApi.exchangeCodeForTokens(code, config.spotifyClientId, config.spotifyClientSecret, redirectUri);
    broadcastWS({ type: 'config', data: configStore.get() });
    res.redirect('/?spotify=connected');
  } catch (err) {
    console.error('Erro no callback Spotify:', err.message);
    res.redirect(`/?error=${encodeURIComponent(err.message)}`);
  }
});

// Criar servidor HTTP e WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcastWS(msg) {
  const json = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

wss.on('connection', (ws) => {
  // Enviar estado inicial imediatamente na conexão
  ws.send(JSON.stringify({ type: 'config', data: configStore.get() }));
  if (detector.lastMedia) {
    ws.send(JSON.stringify({ type: 'media', data: detector.lastMedia }));
  }

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'update_config') {
        const updated = configStore.save(parsed.data);
        broadcastWS({ type: 'config', data: updated });
      }
    } catch (e) {}
  });
});

// Conectar atualizações do detector ao WebSocket
detector.onUpdate((mediaData) => {
  broadcastWS({ type: 'media', data: mediaData });
});

// Iniciar detector e servidor
detector.start();

server.listen(port, () => {
  console.log(`=======================================================`);
  console.log(`🎶 SPOTIFY OVERLAY OBS INICIADO COM SUCESSO!`);
  console.log(`🖥️  Painel de Configurações: http://localhost:${port}/`);
  console.log(`📺 URL do Overlay para o OBS: http://localhost:${port}/overlay`);
  console.log(`=======================================================`);
});
