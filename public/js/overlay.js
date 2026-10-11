(function() {
  let ws = null;
  let currentMedia = null;
  let currentConfig = null;
  let progressTimer = null;
  let hidePauseTimer = null;
  let dynamicAccentColor = null;

  // Elementos do DOM
  const wrapper = document.getElementById('overlay-wrapper');
  const card = document.getElementById('spotify-card');
  const coverImg = document.getElementById('track-cover');
  const coverContainer = document.getElementById('cover-container');
  const equalizerBadge = document.getElementById('equalizer-badge');
  const trackTitle = document.getElementById('track-title');
  const trackArtist = document.getElementById('track-artist');
  const spotifyBadge = document.getElementById('spotify-badge');
  const progressSection = document.getElementById('progress-section');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const timeRow = document.getElementById('time-row');
  const currentTimeEl = document.getElementById('current-time');
  const totalTimeEl = document.getElementById('total-time');

  function connectWS() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
      console.log('Conectado ao servidor do Overlay!');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'config') {
          applyConfig(msg.data);
        } else if (msg.type === 'media') {
          updateMedia(msg.data);
        }
      } catch (err) {
        console.error('Erro ao processar mensagem WS:', err);
      }
    };

    ws.onclose = () => {
      console.log('Conexão WS perdida, reconectando em 2s...');
      setTimeout(connectWS, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function applyConfig(config) {
    currentConfig = config;

    // Aplicar Tema
    const themes = ['theme-glass', 'theme-vinyl', 'theme-cyberpunk', 'theme-minimal', 'theme-pill', 'theme-cassette', 'theme-card'];
    themes.forEach(t => card.classList.remove(t));
    card.classList.add(`theme-${config.theme || 'glass'}`);

    // Formato da Capa
    const shapes = ['cover-shape-rounded', 'cover-shape-circle', 'cover-shape-square'];
    shapes.forEach(s => card.classList.remove(s));
    card.classList.add(`cover-shape-${config.coverShape || 'rounded'}`);

    // Modo Vinil: Capa Ocupando Círculo Inteiro
    if (config.vinylFullCover) {
      card.classList.add('vinyl-full-cover');
    } else {
      card.classList.remove('vinyl-full-cover');
    }

    // Visibilidade dos Elementos
    coverContainer.style.display = config.showCover ? 'block' : 'none';
    progressSection.style.display = config.showProgress ? 'flex' : 'none';
    timeRow.style.display = config.showTime ? 'flex' : 'none';
    spotifyBadge.style.display = config.showPlatformBadge ? 'inline-flex' : 'none';
    equalizerBadge.style.display = config.showEqualizer ? 'flex' : 'none';

    // Variáveis CSS de Estilo e Cores
    const root = document.documentElement;
    root.style.setProperty('--font-family', `'${config.fontFamily}', sans-serif`);
    root.style.setProperty('--title-size', `${config.titleSize}px`);
    root.style.setProperty('--artist-size', `${config.artistSize}px`);
    root.style.setProperty('--font-weight', config.fontWeight || '600');
    root.style.setProperty('--border-radius', `${config.borderRadius}px`);
    root.style.setProperty('--blur-amount', `${config.blurAmount}px`);
    root.style.setProperty('--glow-intensity', (config.glowIntensity / 100).toString());
    root.style.setProperty('--scale', (config.scale / 100).toString());

    // Se a cor dinâmica não estiver ativa ou não houver cor extraída, usa a cor das configurações
    if (!config.useDynamicColor || !dynamicAccentColor) {
      applyAccentColor(config.accentColor || '#1DB954');
    }

    root.style.setProperty('--bg-color', config.bgColor || '#111217');
    root.style.setProperty('--bg-opacity', (config.bgOpacity / 100).toString());
    root.style.setProperty('--text-color', config.textColor || '#FFFFFF');
    root.style.setProperty('--secondary-text-color', config.secondaryTextColor || '#A0A5B5');

    // Marquee
    checkMarquee();
  }

  function applyAccentColor(hex) {
    const root = document.documentElement;
    root.style.setProperty('--accent-color', hex);
    const rgb = hexToRgb(hex);
    if (rgb) {
      root.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
  }

  function hexToRgb(hex) {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      return {
        r: parseInt(cleanHex[0] + cleanHex[0], 16),
        g: parseInt(cleanHex[1] + cleanHex[1], 16),
        b: parseInt(cleanHex[2] + cleanHex[2], 16)
      };
    } else if (cleanHex.length === 6) {
      return {
        r: parseInt(cleanHex.substring(0, 2), 16),
        g: parseInt(cleanHex.substring(2, 4), 16),
        b: parseInt(cleanHex.substring(4, 6), 16)
      };
    }
    return null;
  }

  function extractDominantColor(img) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 40;
      canvas.height = 40;
      ctx.drawImage(img, 0, 0, 40, 40);
      const data = ctx.getImageData(0, 0, 40, 40).data;
      
      let bestR = 29, bestG = 185, bestB = 84;
      let maxScore = -1;

      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Evita tons muito escuros ou muito brancos
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness < 40 || brightness > 220) continue;

        // Mede a saturação
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        
        const score = saturation * 2 + (brightness / 255);
        if (score > maxScore) {
          maxScore = score;
          bestR = r;
          bestG = g;
          bestB = b;
        }
      }

      const toHex = (c) => c.toString(16).padStart(2, '0');
      const hex = `#${toHex(bestR)}${toHex(bestG)}${toHex(bestB)}`;
      dynamicAccentColor = hex;

      if (currentConfig && currentConfig.useDynamicColor) {
        applyAccentColor(hex);
      }
    } catch (e) {
      // Caso haja restrição de CORS na imagem, mantém a cor configurada
    }
  }

  function checkMarquee() {
    if (!currentConfig || !currentConfig.textMarquee) {
      trackTitle.classList.remove('animate-marquee');
      return;
    }
    const marqueeBox = document.getElementById('marquee-box');
    if (trackTitle.scrollWidth > marqueeBox.clientWidth) {
      trackTitle.classList.add('animate-marquee');
    } else {
      trackTitle.classList.remove('animate-marquee');
    }
  }

  let transitionTimer = null;
  function triggerThemeTransition() {
    if (!card) return;
    card.classList.remove('track-transitioning');
    void card.offsetWidth;
    card.classList.add('track-transitioning');

    if (transitionTimer) clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => {
      card.classList.remove('track-transitioning');
    }, 1100);
  }

  function updateMedia(media) {
    if (!media) return;
    const isNewTrack = currentMedia && (currentMedia.title !== media.title || currentMedia.artist !== media.artist);
    
    if (isNewTrack && (!currentConfig || currentConfig.enableTransitions !== false)) {
      triggerThemeTransition();
    }
    
    currentMedia = { ...media };

    // Atualizar Capa
    if (media.coverUrl && coverImg.src !== media.coverUrl) {
      coverImg.crossOrigin = "Anonymous";
      coverImg.onload = () => extractDominantColor(coverImg);
      coverImg.src = media.coverUrl;
    }

    // Atualizar Textos
    trackTitle.textContent = media.title || 'Sem título';
    trackArtist.textContent = media.artist || 'Artista desconhecido';
    checkMarquee();

    // Atualizar Estado de Playback
    if (media.isPlaying) {
      card.classList.remove('is-paused');
      card.classList.add('is-playing');
      equalizerBadge.classList.remove('eq-paused');
      equalizerBadge.classList.add('eq-playing');

      if (hidePauseTimer) {
        clearTimeout(hidePauseTimer);
        hidePauseTimer = null;
      }
      wrapper.classList.remove('paused-hidden');
    } else {
      card.classList.remove('is-playing');
      card.classList.add('is-paused');
      equalizerBadge.classList.remove('eq-playing');
      equalizerBadge.classList.add('eq-paused');

      if (currentConfig && currentConfig.hideWhenPaused) {
        if (!hidePauseTimer) {
          hidePauseTimer = setTimeout(() => {
            wrapper.classList.add('paused-hidden');
          }, (currentConfig.hideDelay || 5) * 1000);
        }
      }
    }

    // Progresso e Duração
    totalTimeEl.textContent = formatTime(media.duration);
    updateProgressUI();

    // Sincronizador de Progresso Local
    if (progressTimer) clearInterval(progressTimer);
    if (media.isPlaying && media.duration > 0) {
      progressTimer = setInterval(() => {
        if (currentMedia && currentMedia.isPlaying && currentMedia.position < currentMedia.duration) {
          currentMedia.position += 1;
          updateProgressUI();
        }
      }, 1000);
    }
  }

  function updateProgressUI() {
    if (!currentMedia) return;
    currentTimeEl.textContent = formatTime(currentMedia.position);
    if (currentMedia.duration > 0) {
      const pct = Math.min(100, Math.max(0, (currentMedia.position / currentMedia.duration) * 100));
      progressBarFill.style.width = `${pct}%`;
    } else {
      progressBarFill.style.width = '0%';
    }
  }

  // Inicializar conexão WS
  connectWS();
})();
