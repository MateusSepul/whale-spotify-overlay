const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_DIR = path.join(__dirname, '..', 'data', 'users');
if (!fs.existsSync(USERS_DIR)) {
  fs.mkdirSync(USERS_DIR, { recursive: true });
}

const DEFAULT_CONFIG = {
  theme: 'glass',
  useDynamicColor: true,
  accentColor: '#1DB954',
  bgColor: '#111217',
  bgOpacity: 85,
  textColor: '#FFFFFF',
  secondaryTextColor: '#A0A5B5',
  glowIntensity: 60,
  blurAmount: 16,
  borderRadius: 18,
  scale: 100,

  fontFamily: 'Outfit',
  titleSize: 17,
  artistSize: 13,
  fontWeight: '600',

  showCover: true,
  coverShape: 'rounded',
  showProgress: true,
  showTime: true,
  showEqualizer: true,
  showPlatformBadge: true,
  textMarquee: true,

  hideWhenPaused: false,
  hideDelay: 5,
  animationStyle: 'slide',
  vinylSpeed: 'normal',
  vinylFullCover: true,
  enableTransitions: true,

  progressAnimStyle: 'shimmer',
  progressHeadEffect: 'glow_orb',
  progressAnimSpeed: 2.0,
  progressBarHeight: 5,
  progressBarRadius: 6,
  progressGlow: 65,
  progressTrackStyle: 'glass',
  progressTimeStyle: 'glow',
  progressFillColorType: 'accent',
  progressCustomColor: '#1DB954',
  progressCustomGradientEnd: '#00d2ff',

  bgVisualization: 'none',
  bgVisOpacity: 70,
  bgVisSpeed: 'normal',
  bgVisScope: 'card',
  bgVisCustomFile: '',

  detectionMode: 'api' // Padrão para Web é Spotify API oficial
};

class UserStore {
  constructor() {
    this.cache = new Map();
    this.ensureDefaultUser();
  }

  getUserFilePath(userId) {
    const safeId = String(userId || 'default').replace(/[^a-zA-Z0-9_\-]/g, '_');
    return path.join(USERS_DIR, `${safeId}.json`);
  }

  ensureDefaultUser() {
    const defaultPath = this.getUserFilePath('default');
    if (!fs.existsSync(defaultPath)) {
      // Migrar do config.json antigo se existir
      const oldConfigPath = path.join(__dirname, '..', 'data', 'config.json');
      let baseConfig = { ...DEFAULT_CONFIG };
      if (fs.existsSync(oldConfigPath)) {
        try {
          const raw = JSON.parse(fs.readFileSync(oldConfigPath, 'utf8'));
          baseConfig = { ...baseConfig, ...raw };
        } catch (e) {}
      }
      this.saveUser('default', {
        id: 'default',
        config: baseConfig,
        spotify: null,
        createdAt: Date.now()
      });
    }
  }

  getUser(userId) {
    const id = String(userId || 'default').trim();
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    const filePath = this.getUserFilePath(id);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const user = JSON.parse(raw);
        user.config = { ...DEFAULT_CONFIG, ...(user.config || {}) };
        this.cache.set(id, user);
        return user;
      } catch (err) {
        console.error(`Erro ao carregar usuário ${id}:`, err.message);
      }
    }

    // Criar novo usuário vazio
    const newUser = {
      id: id,
      config: { ...DEFAULT_CONFIG },
      spotify: null,
      createdAt: Date.now()
    };
    this.saveUser(id, newUser);
    return newUser;
  }

  saveUser(userId, data) {
    const id = String(userId || 'default').trim();
    const filePath = this.getUserFilePath(id);
    const existing = this.cache.get(id) || {};
    const updated = {
      ...existing,
      ...data,
      id,
      updatedAt: Date.now()
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
      this.cache.set(id, updated);
      return updated;
    } catch (err) {
      console.error(`Erro ao salvar usuário ${id}:`, err.message);
      return updated;
    }
  }

  getUserConfig(userId) {
    const user = this.getUser(userId);
    return user.config;
  }

  saveUserConfig(userId, patch) {
    const user = this.getUser(userId);
    user.config = { ...user.config, ...patch };
    this.saveUser(userId, user);
    return user.config;
  }

  findUserBySpotifyId(spotifyId) {
    if (!spotifyId) return null;
    try {
      const files = fs.readdirSync(USERS_DIR);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const raw = fs.readFileSync(path.join(USERS_DIR, file), 'utf8');
        const user = JSON.parse(raw);
        if (user.spotify && user.spotify.id === spotifyId) {
          this.cache.set(user.id, user);
          return user;
        }
      }
    } catch (err) {
      console.error('Erro ao buscar usuário por Spotify ID:', err.message);
    }
    return null;
  }

  createOrUpdateFromSpotify(profile, tokens, requestedUserId) {
    // 1. Verificar se esse Spotify ID já tem conta registrada
    let user = this.findUserBySpotifyId(profile.id);

    // 2. Se não existir, verificar se podemos usar o requestedUserId ou gerar novo
    if (!user) {
      let targetId = requestedUserId;
      if (!targetId || targetId === 'default' || this.getUser(targetId).spotify) {
        targetId = 'usr_' + crypto.randomBytes(6).toString('hex');
      }
      user = this.getUser(targetId);
    }

    const spotifyData = {
      id: profile.id,
      displayName: profile.display_name || profile.id,
      email: profile.email || null,
      avatar: profile.images && profile.images.length > 0 ? profile.images[0].url : null,
      product: profile.product || 'free',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || (user.spotify ? user.spotify.refreshToken : null),
      tokenExpiresAt: Date.now() + ((tokens.expires_in || 3600) * 1000),
      connectedAt: Date.now()
    };

    user.spotify = spotifyData;
    // Quando conecta via Spotify, o modo passa automaticamente a ser 'api'
    user.config.detectionMode = 'api';
    return this.saveUser(user.id, user);
  }

  disconnectSpotify(userId) {
    const user = this.getUser(userId);
    user.spotify = null;
    user.config.detectionMode = 'demo';
    return this.saveUser(userId, user);
  }

  listAllUsers() {
    try {
      const files = fs.readdirSync(USERS_DIR);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => {
          try {
            return JSON.parse(fs.readFileSync(path.join(USERS_DIR, f), 'utf8'));
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }
}

module.exports = new UserStore();
