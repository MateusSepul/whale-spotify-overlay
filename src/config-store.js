const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '..', 'data', 'config.json');

const DEFAULT_CONFIG = {
  theme: 'glass', // 'glass', 'vinyl', 'cyberpunk', 'minimal', 'pill', 'cassette', 'card'
  
  // Cores e Estilo
  useDynamicColor: true,
  accentColor: '#1DB954',
  bgColor: '#111217',
  bgOpacity: 85, // 0-100
  textColor: '#FFFFFF',
  secondaryTextColor: '#A0A5B5',
  glowIntensity: 60, // 0-100
  blurAmount: 16, // px
  borderRadius: 18, // px
  scale: 100, // %

  // Tipografia
  fontFamily: 'Outfit', // 'Outfit', 'Inter', 'Poppins', 'Montserrat', 'JetBrains Mono', 'Space Grotesk'
  titleSize: 17, // px
  artistSize: 13, // px
  fontWeight: '600',

  // Visibilidade de Elementos
  showCover: true,
  coverShape: 'rounded', // 'square', 'rounded', 'circle'
  showProgress: true,
  showTime: true,
  showEqualizer: true,
  showPlatformBadge: true,
  textMarquee: true,

  // Comportamento
  hideWhenPaused: false,
  hideDelay: 5, // segundos antes de sumir se pausado
  animationStyle: 'slide', // 'slide', 'fade', 'zoom'
  vinylSpeed: 'normal', // 'slow', 'normal', 'fast'
  vinylFullCover: true, // Capa ocupando o círculo inteiro no disco de vinil
  enableTransitions: true, // Ativar animações temáticas de transição ao trocar de música

  // Conexão
  detectionMode: 'local', // 'local' (Windows SMTC), 'api' (Spotify Web API), 'demo'
  spotifyClientId: '',
  spotifyClientSecret: '',
  spotifyRefreshToken: ''
};

class ConfigStore {
  constructor() {
    this.config = this.load();
  }

  load() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (err) {
      console.error('Erro ao ler config.json, usando padrão:', err.message);
    }
    this.save(DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG };
  }

  save(newConfig) {
    try {
      const merged = { ...this.config, ...newConfig };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf8');
      this.config = merged;
      return this.config;
    } catch (err) {
      console.error('Erro ao salvar config.json:', err.message);
      return this.config;
    }
  }

  get() {
    return this.config;
  }
}

module.exports = new ConfigStore();
