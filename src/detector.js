const { exec } = require('child_process');
const path = require('path');
const userStore = require('./user-store');
const spotifyApi = require('./spotify-api');

const PS_SCRIPT = path.join(__dirname, '..', 'scripts', 'get-media.ps1');

class MediaDetector {
  constructor() {
    this.coverCache = new Map();
    this.userMediaMap = new Map(); // userId -> lastMedia
    this.userListeners = new Map(); // userId -> Set<callback>
    this.activeUsers = new Map(); // userId -> lastActivityTimestamp
    this.timer = null;
    this.isQuerying = false;

    // Estado da Demo
    this.demoTrackIndex = 0;
    this.demoTracks = [
      {
        title: "Venus As A Boy",
        artist: "Björk",
        album: "Debut",
        coverUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/58/30/6e/58306e6c-deba-df87-423b-07c0a5fca918/075596146869.jpg/600x600bb.jpg",
        isPlaying: true,
        position: 124,
        duration: 283,
        source: "demo"
      },
      {
        title: "Blinding Lights",
        artist: "The Weeknd",
        album: "After Hours",
        coverUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/36/53/b7/3653b7c8-2b59-994c-cb14-63a233636f86/19UMGIM86146.rgb.jpg/600x600bb.jpg",
        isPlaying: true,
        position: 72,
        duration: 200,
        source: "demo"
      },
      {
        title: "Bohemian Rhapsody - 2011 Mix / Live at Wembley Stadium Edition",
        artist: "Queen",
        album: "A Night at the Opera",
        coverUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/dd/57/42/dd574213-9a3b-28f0-15cb-5e60840c9535/00602527718042.rgb.jpg/600x600bb.jpg",
        isPlaying: true,
        position: 180,
        duration: 354,
        source: "demo"
      }
    ];

    // Por padrão o usuário 'default' está sempre ativo
    this.touchUser('default');
  }

  // Compatibilidade com código legado
  get lastMedia() {
    return this.getUserMedia('default');
  }

  onUpdate(callback) {
    this.onUserUpdate('default', callback);
  }

  touchUser(userId) {
    const id = String(userId || 'default').trim();
    this.activeUsers.set(id, Date.now());
  }

  getUserMedia(userId) {
    const id = String(userId || 'default').trim();
    return this.userMediaMap.get(id) || { isPlaying: false, title: '', artist: '' };
  }

  onUserUpdate(userId, callback) {
    const id = String(userId || 'default').trim();
    if (!this.userListeners.has(id)) {
      this.userListeners.set(id, new Set());
    }
    this.userListeners.get(id).add(callback);
    this.touchUser(id);

    return () => {
      const set = this.userListeners.get(id);
      if (set) set.delete(callback);
    };
  }

  broadcastToUser(userId, mediaData) {
    const id = String(userId || 'default').trim();
    this.userMediaMap.set(id, mediaData);
    const listeners = this.userListeners.get(id);
    if (listeners) {
      listeners.forEach(cb => {
        try { cb(mediaData); } catch (e) {}
      });
    }
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 1500);
    this.tick();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  nextDemoTrack(userId = 'default') {
    this.demoTrackIndex = (this.demoTrackIndex + 1) % this.demoTracks.length;
    const track = this.demoTracks[this.demoTrackIndex];
    this.broadcastToUser(userId, track);
    return track;
  }

  async tick() {
    if (this.isQuerying) return;
    this.isQuerying = true;

    try {
      const now = Date.now();
      // Remove usuários inativos há mais de 2 minutos (exceto 'default' se houver conexão)
      for (const [uid, lastSeen] of this.activeUsers.entries()) {
        if (uid !== 'default' && (now - lastSeen > 120000)) {
          const listeners = this.userListeners.get(uid);
          if (!listeners || listeners.size === 0) {
            this.activeUsers.delete(uid);
          }
        }
      }

      // Se nenhum usuário estiver ativo, garante que pelo menos 'default' exista
      if (this.activeUsers.size === 0) {
        this.touchUser('default');
      }

      const activeIds = Array.from(this.activeUsers.keys());

      // Executa a detecção para cada usuário ativo em paralelo
      await Promise.all(activeIds.map(uid => this.checkUser(uid)));
    } catch (err) {
      console.error('Erro no ciclo de detecção:', err.message);
    } finally {
      this.isQuerying = false;
    }
  }

  async checkUser(userId) {
    try {
      const user = userStore.getUser(userId);
      const mode = user.config.detectionMode || (user.spotify ? 'api' : 'local');
      let mediaData = null;

      if (mode === 'demo') {
        mediaData = { ...this.demoTracks[this.demoTrackIndex] };
      } else if (mode === 'api' || user.spotify) {
        mediaData = await spotifyApi.getCurrentlyPlayingForUser(user);
        // Fallback para local somente se for Windows e o usuário for o default
        if ((!mediaData || !mediaData.title) && process.platform === 'win32' && userId === 'default') {
          const localMedia = await this.queryLocalMedia();
          if (localMedia) mediaData = localMedia;
        }
      } else {
        // Modo local Windows SMTC
        if (process.platform === 'win32') {
          mediaData = await this.queryLocalMedia();
        } else {
          // Em servidores Linux na nuvem, sem Spotify conectado, mostra demo
          mediaData = { ...this.demoTracks[this.demoTrackIndex] };
        }
      }

      if (mediaData) {
        this.broadcastToUser(userId, mediaData);
      } else {
        const last = this.userMediaMap.get(userId);
        if (last && last.isPlaying) {
          this.broadcastToUser(userId, { ...last, isPlaying: false });
        }
      }
    } catch (e) {
      // Falha silenciosa por usuário
    }
  }

  async queryLocalMedia() {
    return new Promise((resolve) => {
      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${PS_SCRIPT}"`;
      exec(cmd, { encoding: 'utf8', timeout: 3500 }, async (error, stdout) => {
        if (error || !stdout) {
          return resolve(null);
        }

        try {
          const trimmed = stdout.trim();
          if (!trimmed.startsWith('{')) {
            return resolve(null);
          }
          const raw = JSON.parse(trimmed);

          if (raw.Status === 'NoSession' || raw.Status === 'NoManager' || !raw.Title) {
            return resolve(null);
          }

          const isPlaying = raw.Status.toLowerCase().includes('playing');
          const cacheKey = `${raw.Artist} - ${raw.Title}`.toLowerCase();

          let coverUrl = this.coverCache.get(cacheKey);
          if (!coverUrl) {
            // 1. Tenta obter capa HD (600x600) via iTunes ou Deezer
            const hdCover = await this.fetchCoverArt(raw.Artist, raw.Title, raw.Album);
            
            // 2. Fallback garantido: Capa nativa extraída do próprio Spotify via Windows SMTC
            coverUrl = hdCover || raw.CoverUrl || null;
            if (coverUrl) {
              this.coverCache.set(cacheKey, coverUrl);
            }
          }

          resolve({
            title: raw.Title,
            artist: raw.Artist || 'Desconhecido',
            album: raw.Album || '',
            coverUrl: coverUrl || raw.CoverUrl || 'https://raw.githubusercontent.com/feathericons/feather/master/icons/music.svg',
            isPlaying: isPlaying,
            position: raw.Position || 0,
            duration: raw.Duration || 0,
            source: 'local'
          });
        } catch (e) {
          resolve(null);
        }
      });
    });
  }

  cleanQuery(text) {
    if (!text) return '';
    return text
      .replace(/\s*[\(\[](feat|ft|with|remaster|remastered|live|deluxe|version|mono|stereo|anniversary|radio edit|original mix)[\.\s\w\d]*[\)\]]/gi, '')
      .replace(/ - [^:]*(remaster|remastered|live|deluxe|version|mono|stereo).*/gi, '')
      .trim();
  }

  async fetchCoverArt(artist, title, album) {
    const cleanT = this.cleanQuery(title);
    const searchTerms = [
      `${artist} ${cleanT}`,
      album ? `${artist} ${album}` : null
    ].filter(Boolean);

    for (const term of searchTerms) {
      try {
        const q = encodeURIComponent(term);
        const res = await fetch(`https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=1`, {
          signal: AbortSignal.timeout(1200)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
            return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
          }
        }
      } catch (e) {}

      try {
        const q = encodeURIComponent(term);
        const res = await fetch(`https://api.deezer.com/search?q=${q}&limit=1`, {
          signal: AbortSignal.timeout(1200)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data.length > 0 && data.data[0].album) {
            return data.data[0].album.cover_xl || data.data[0].album.cover_big || data.data[0].album.cover_medium;
          }
        }
      } catch (e) {}
    }

    return null;
  }
}

module.exports = new MediaDetector();
