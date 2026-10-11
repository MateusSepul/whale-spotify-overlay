document.addEventListener('DOMContentLoaded', () => {
  // Tabs Navigation
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // Theme selection cards
  const themeCards = document.querySelectorAll('.theme-card-option');
  themeCards.forEach(card => {
    card.addEventListener('click', () => {
      themeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const theme = card.getAttribute('data-theme');
      updateConfigProperty({ theme });
      setTimeout(autoFitPreview, 40);
    });
  });

  // Classic Player card selection
  const classicCards = document.querySelectorAll('.classic-player-card');
  classicCards.forEach(card => {
    card.addEventListener('click', () => {
      classicCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      // Also deselect regular theme cards (classic themes use their own naming)
      themeCards.forEach(c => c.classList.remove('active'));
      const theme = card.getAttribute('data-theme');
      updateConfigProperty({ theme });
      setTimeout(autoFitPreview, 40);
    });
  });

  // Visualizações WMP card selection
  const visCards = document.querySelectorAll('.vis-card-option');
  visCards.forEach(card => {
    card.addEventListener('click', () => {
      visCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const bgVisualization = card.getAttribute('data-vis');
      toggleCustomVisVideoBox(bgVisualization === 'custom_video');
      updateConfigProperty({ bgVisualization });
    });
  });

  function toggleCustomVisVideoBox(show) {
    const box = document.getElementById('group-custom-vis-video');
    if (box) box.style.display = show ? 'flex' : 'none';
  }

  // Carregar lista de arquivos de vídeo/gif de public/visualizations
  async function loadVisFiles(currentSelected) {
    try {
      const res = await fetch('/api/visualizations');
      const data = await res.json();
      const select = document.getElementById('cfg-bg-vis-custom-file');
      if (!select) return;
      select.innerHTML = '';
      if (!data.files || data.files.length === 0) {
        select.innerHTML = '<option value="">Nenhum arquivo na pasta public/visualizations</option>';
        return;
      }
      data.files.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = f;
        if (f === currentSelected) opt.selected = true;
        select.appendChild(opt);
      });
    } catch (e) {
      console.error('Erro ao buscar arquivos de visualização:', e);
    }
  }

  const btnRefreshVis = document.getElementById('btn-refresh-vis-files');
  if (btnRefreshVis) {
    btnRefreshVis.addEventListener('click', () => {
      const select = document.getElementById('cfg-bg-vis-custom-file');
      loadVisFiles(select ? select.value : '');
    });
  }

  // Copiar URL do OBS
  const copyBtn = document.getElementById('btn-copy-url');
  const copyBtnSecondary = document.getElementById('btn-copy-url-secondary');
  const copyBtnText = document.getElementById('copy-btn-text');
  const obsUrlDisplay = document.getElementById('obs-url-display');

  const overlayUrl = `${window.location.origin}/overlay`;
  if (obsUrlDisplay) obsUrlDisplay.textContent = overlayUrl;

  function copyObsUrl() {
    navigator.clipboard.writeText(overlayUrl).then(() => {
      const originalText = copyBtnText.textContent;
      copyBtnText.textContent = 'Copiado!';
      if (copyBtnSecondary) copyBtnSecondary.textContent = 'Copiado!';
      setTimeout(() => {
        copyBtnText.textContent = originalText;
        if (copyBtnSecondary) copyBtnSecondary.textContent = 'Copiar';
      }, 2000);
    });
  }

  if (copyBtn) copyBtn.addEventListener('click', copyObsUrl);
  if (copyBtnSecondary) copyBtnSecondary.addEventListener('click', copyObsUrl);

  // Botão Próxima Faixa Teste
  const nextDemoBtn = document.getElementById('btn-next-demo');
  if (nextDemoBtn) {
    nextDemoBtn.addEventListener('click', async () => {
      await fetch('/api/demo/next', { method: 'POST' });
    });
  }

  // Carregar Configurações Iniciais
  fetch('/api/config')
    .then(res => res.json())
    .then(config => populateInputs(config))
    .catch(err => console.error('Erro ao obter config:', err));

  function populateInputs(config) {
    // Tema (regular cards)
    const classicThemes = ['wmp', 'winamp', 'orb', 'radio', 'lcd'];
    themeCards.forEach(c => {
      if (c.getAttribute('data-theme') === config.theme && !classicThemes.includes(config.theme)) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    // Classic Player cards
    classicCards.forEach(c => {
      if (c.getAttribute('data-theme') === config.theme) {
        c.classList.add('selected');
      } else {
        c.classList.remove('selected');
      }
    });

    // Formato da capa
    setVal('cfg-cover-shape', config.coverShape);
    setCheck('cfg-vinyl-full-cover', config.vinylFullCover !== false);
    setVal('cfg-border-radius', config.borderRadius, 'val-border-radius', 'px');
    setVal('cfg-scale', config.scale, 'val-scale', '%');
    updateObsDimensions(config.scale || 100);

    // Cores
    setCheck('cfg-dynamic-color', config.useDynamicColor);
    setVal('cfg-accent-color', config.accentColor);
    setVal('cfg-bg-color', config.bgColor);
    setVal('cfg-text-color', config.textColor);
    setVal('cfg-secondary-text-color', config.secondaryTextColor);
    setVal('cfg-bg-opacity', config.bgOpacity, 'val-bg-opacity', '%');
    setVal('cfg-glow-intensity', config.glowIntensity, 'val-glow-intensity', '%');
    setVal('cfg-blur-amount', config.blurAmount, 'val-blur-amount', 'px');

    // Tipografia
    setVal('cfg-font-family', config.fontFamily);
    setVal('cfg-title-size', config.titleSize, 'val-title-size', 'px');
    setVal('cfg-artist-size', config.artistSize, 'val-artist-size', 'px');
    setCheck('cfg-text-marquee', config.textMarquee);

    // Visibilidade
    setCheck('cfg-show-cover', config.showCover);
    setCheck('cfg-show-progress', config.showProgress);
    setCheck('cfg-show-time', config.showTime);
    setCheck('cfg-show-equalizer', config.showEqualizer);
    setCheck('cfg-show-badge', config.showPlatformBadge);
    setCheck('cfg-hide-paused', config.hideWhenPaused);
    setVal('cfg-hide-delay', config.hideDelay, 'val-hide-delay', 's');
    setCheck('cfg-enable-transitions', config.enableTransitions !== false);

    // Conexão
    setVal('cfg-detection-mode', config.detectionMode);
    toggleSpotifyApiBox(config.detectionMode === 'api');
    setVal('cfg-spotify-client-id', config.spotifyClientId || '');
    setVal('cfg-spotify-client-secret', config.spotifyClientSecret || '');

    // Visualizações WMP
    const currentVis = config.bgVisualization || 'none';
    visCards.forEach(c => {
      if (c.getAttribute('data-vis') === currentVis) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
    toggleCustomVisVideoBox(currentVis === 'custom_video');
    loadVisFiles(config.bgVisCustomFile || '');
    setVal('cfg-bg-vis-opacity', config.bgVisOpacity !== undefined ? config.bgVisOpacity : 70, 'val-bg-vis-opacity', '%');
    setVal('cfg-bg-vis-speed', config.bgVisSpeed || 'normal');
    setVal('cfg-bg-vis-scope', config.bgVisScope || 'card');

    setTimeout(autoFitPreview, 60);
  }

  function setVal(id, val, labelId, suffix = '') {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = val;
    if (labelId) {
      const label = document.getElementById(labelId);
      if (label) label.textContent = `${val}${suffix}`;
    }
  }

  function setCheck(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  }

  function toggleSpotifyApiBox(show) {
    const box = document.getElementById('group-spotify-api');
    if (box) box.style.display = show ? 'flex' : 'none';
  }

  // Monitorar alterações nos inputs
  const inputBindings = [
    { id: 'cfg-cover-shape', key: 'coverShape', type: 'val' },
    { id: 'cfg-vinyl-full-cover', key: 'vinylFullCover', type: 'check' },
    { id: 'cfg-border-radius', key: 'borderRadius', type: 'val', num: true, labelId: 'val-border-radius', suffix: 'px' },
    { id: 'cfg-scale', key: 'scale', type: 'val', num: true, labelId: 'val-scale', suffix: '%' },
    { id: 'cfg-dynamic-color', key: 'useDynamicColor', type: 'check' },
    { id: 'cfg-accent-color', key: 'accentColor', type: 'val' },
    { id: 'cfg-bg-color', key: 'bgColor', type: 'val' },
    { id: 'cfg-text-color', key: 'textColor', type: 'val' },
    { id: 'cfg-secondary-text-color', key: 'secondaryTextColor', type: 'val' },
    { id: 'cfg-bg-opacity', key: 'bgOpacity', type: 'val', num: true, labelId: 'val-bg-opacity', suffix: '%' },
    { id: 'cfg-glow-intensity', key: 'glowIntensity', type: 'val', num: true, labelId: 'val-glow-intensity', suffix: '%' },
    { id: 'cfg-blur-amount', key: 'blurAmount', type: 'val', num: true, labelId: 'val-blur-amount', suffix: 'px' },
    { id: 'cfg-font-family', key: 'fontFamily', type: 'val' },
    { id: 'cfg-title-size', key: 'titleSize', type: 'val', num: true, labelId: 'val-title-size', suffix: 'px' },
    { id: 'cfg-artist-size', key: 'artistSize', type: 'val', num: true, labelId: 'val-artist-size', suffix: 'px' },
    { id: 'cfg-text-marquee', key: 'textMarquee', type: 'check' },
    { id: 'cfg-show-cover', key: 'showCover', type: 'check' },
    { id: 'cfg-show-progress', key: 'showProgress', type: 'check' },
    { id: 'cfg-show-time', key: 'showTime', type: 'check' },
    { id: 'cfg-show-equalizer', key: 'showEqualizer', type: 'check' },
    { id: 'cfg-show-badge', key: 'showPlatformBadge', type: 'check' },
    { id: 'cfg-hide-paused', key: 'hideWhenPaused', type: 'check' },
    { id: 'cfg-hide-delay', key: 'hideDelay', type: 'val', num: true, labelId: 'val-hide-delay', suffix: 's' },
    { id: 'cfg-enable-transitions', key: 'enableTransitions', type: 'check' },
    { id: 'cfg-detection-mode', key: 'detectionMode', type: 'val' },
    { id: 'cfg-bg-vis-opacity', key: 'bgVisOpacity', type: 'val', num: true, labelId: 'val-bg-vis-opacity', suffix: '%' },
    { id: 'cfg-bg-vis-speed', key: 'bgVisSpeed', type: 'val' },
    { id: 'cfg-bg-vis-scope', key: 'bgVisScope', type: 'val' },
    { id: 'cfg-bg-vis-custom-file', key: 'bgVisCustomFile', type: 'val' }
  ];

  function updateObsDimensions(scale = 100) {
    const baseW = 600;
    const baseH = 220;
    const w = Math.round(baseW * (scale / 100));
    const h = Math.round(baseH * (scale / 100));
    const wEl = document.getElementById('obs-recommended-width');
    const hEl = document.getElementById('obs-recommended-height');
    if (wEl) wEl.textContent = `${w} px`;
    if (hEl) hEl.textContent = `${h} px`;
  }

  inputBindings.forEach(binding => {
    const el = document.getElementById(binding.id);
    if (!el) return;

    const eventType = el.type === 'range' || el.type === 'color' ? 'input' : 'change';
    el.addEventListener(eventType, () => {
      let value = binding.type === 'check' ? el.checked : (binding.num ? Number(el.value) : el.value);
      if (binding.labelId) {
        const label = document.getElementById(binding.labelId);
        if (label) label.textContent = `${value}${binding.suffix || ''}`;
      }
      if (binding.key === 'scale') {
        updateObsDimensions(value);
      }
      if (binding.key === 'detectionMode') {
        toggleSpotifyApiBox(value === 'api');
      }
      updateConfigProperty({ [binding.key]: value });
      setTimeout(autoFitPreview, 30);
    });
  });

  // Salvar Credenciais Spotify
  const btnSaveCreds = document.getElementById('btn-save-credentials');
  if (btnSaveCreds) {
    btnSaveCreds.addEventListener('click', async () => {
      const clientId = document.getElementById('cfg-spotify-client-id').value.trim();
      const clientSecret = document.getElementById('cfg-spotify-client-secret').value.trim();
      await updateConfigProperty({
        spotifyClientId: clientId,
        spotifyClientSecret: clientSecret,
        detectionMode: 'api'
      });
      alert('Credenciais salvas com sucesso! Agora clique em "Fazer Login no Spotify".');
    });
  }

  let saveDebounceTimer = null;
  function updateConfigProperty(patch) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
    }, 150);
  }

  // Monitorar Estado de Reprodução para o Status no Header
  const statusDot = document.getElementById('playback-status-dot');
  const statusText = document.getElementById('playback-status-text');

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const statusWs = new WebSocket(`${protocol}//${window.location.host}`);
  statusWs.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'media' && msg.data) {
        if (msg.data.isPlaying) {
          statusDot.classList.add('active');
          statusText.textContent = `Tocando: ${msg.data.title}`;
        } else {
          statusDot.classList.remove('active');
          statusText.textContent = msg.data.title ? 'Pausado' : 'Aguardando Spotify';
        }
        setTimeout(autoFitPreview, 60);
      }
    } catch (e) {}
  };

  // Função Inteligente de Auto-Fit para a Pré-visualização
  function autoFitPreview() {
    const stage = document.querySelector('.checkerboard-stage');
    const card = document.querySelector('.checkerboard-stage #spotify-card');
    const wrapper = document.querySelector('.checkerboard-stage #overlay-wrapper');
    if (!stage || !card || !wrapper) return;

    const availableWidth = stage.clientWidth - 32;
    const availableHeight = stage.clientHeight - 32;

    const scaleInput = document.getElementById('cfg-scale');
    const userScale = scaleInput ? (Number(scaleInput.value) / 100) : 1;

    // Reseta temporariamente para medir o tamanho real do card
    wrapper.style.transform = 'scale(1)';
    const cardWidth = card.offsetWidth;
    const cardHeight = card.offsetHeight;

    if (cardWidth <= 0 || availableWidth <= 0) return;

    const neededWidth = cardWidth * userScale;
    const neededHeight = cardHeight * userScale;

    let fitFactor = 1;
    if (neededWidth > availableWidth) {
      fitFactor = Math.min(fitFactor, availableWidth / neededWidth);
    }
    if (neededHeight > availableHeight && availableHeight > 0) {
      fitFactor = Math.min(fitFactor, availableHeight / neededHeight);
    }

    const finalScale = userScale * fitFactor;
    wrapper.style.transform = `scale(${finalScale.toFixed(3)})`;
    wrapper.style.transformOrigin = 'center center';
  }

  // Monitorar redimensionamento de janela e do palco de preview
  window.addEventListener('resize', autoFitPreview);

  const previewStage = document.querySelector('.checkerboard-stage');
  if (previewStage && window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      autoFitPreview();
    });
    ro.observe(previewStage);
  }

  // Executar após renderização inicial
  setTimeout(autoFitPreview, 150);
});
