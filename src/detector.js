const { exec } = require('child_process');
const path = require('path');
const configStore = require('./config-store');
const spotifyApi = require('./spotify-api');

const PS_SCRIPT = path.join(__dirname, '..', 'scripts', 'get-media.ps1');

class MediaDetector {
  constructor() {
    this.coverCache = new Map();
    this.lastMedia = null;
    this.onUpdateCallback = null;
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
  }

  onUpdate(callback) {
    this.onUpdateCallback = callback;
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

  nextDemoTrack() {
    this.demoTrackIndex = (this.demoTrackIndex + 1) % this.demoTracks.length;
    this.broadcast(this.demoTracks[this.demoTrackIndex]);
  }

  async tick() {
    if (this.isQuerying) return;
    this.isQuerying = true;

    try {
      const config = configStore.get();
      let mediaData = null;

      if (config.detectionMode === 'demo') {
        const demo = { ...this.demoTracks[this.demoTrackIndex] };
        mediaData = demo;
      } else if (config.detectionMode === 'api') {
        mediaData = await spotifyApi.getCurrentlyPlaying();
        // Fallback automático para local caso não haja conexão com a API
        if (!mediaData) {
          mediaData = await this.queryLocalMedia();
        }
      } else {
        // Padrão: Modo Local Windows SMTC
        mediaData = await this.queryLocalMedia();
      }

      if (mediaData) {
        this.lastMedia = mediaData;
        this.broadcast(mediaData);
      } else if (this.lastMedia && this.lastMedia.isPlaying) {
        // Se nada respondeu ou fechou, marca como pausado
        this.lastMedia = { ...this.lastMedia, isPlaying: false };
        this.broadcast(this.lastMedia);
      }
    } catch (err) {
      console.error('Erro no ciclo de detecção:', err.message);
    } finally {
      this.isQuerying = false;
    }
  }

  broadcast(data) {
    if (this.onUpdateCallback) {
      this.onUpdateCallback(data);
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
            coverUrl = await this.fetchCoverArt(raw.Artist, raw.Title, raw.Album);
            if (coverUrl) {
              this.coverCache.set(cacheKey, coverUrl);
            }
          }

          resolve({
            title: raw.Title,
            artist: raw.Artist || 'Desconhecido',
            album: raw.Album || '',
            coverUrl: coverUrl || 'https://raw.githubusercontent.com/feathericons/feather/master/icons/music.svg',
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

  async fetchCoverArt(artist, title, album) {
    // 1. Tentar iTunes Search API (gratuita, sem chave, rápida e capa 600x600)
    try {
      const q = encodeURIComponent(`${artist} ${title}`);
      const res = await fetch(`https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=1`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
          return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
        }
      }
    } catch (e) {
      // Ignora e tenta Deezer
    }

    // 2. Fallback: Deezer Search API
    try {
      const q = encodeURIComponent(`${artist} ${title}`);
      const res = await fetch(`https://api.deezer.com/search?q=${q}&limit=1`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0 && data.data[0].album) {
          return data.data[0].album.cover_xl || data.data[0].album.cover_big || data.data[0].album.cover_medium;
        }
      }
    } catch (e) {
      // Falha silenciosa
    }

    return null;
  }
}

module.exports = new MediaDetector();
