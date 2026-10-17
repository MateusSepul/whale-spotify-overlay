document.addEventListener('DOMContentLoaded', () => {
  // Resolução de Usuário Multi-Tenant
  function getActiveUserId() {
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('user') || urlParams.get('id') || urlParams.get('u');
    if (fromUrl) {
      localStorage.setItem('whale_user_id', fromUrl);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      return fromUrl;
    }
    const saved = localStorage.getItem('whale_user_id');
    if (saved) return saved;

    const newId = 'usr_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('whale_user_id', newId);
    return newId;
  }

  const currentUserId = getActiveUserId();

  // Helper: converte hex em rgb e atualiza --accent-rgb no preview
  function applyAccentRgb(hex) {
    const clean = hex.replace('#', '');
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
    }
  }

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

  // ─── Personalização da Barra de Tempo (Animações & Marcadores) ───────────

  const pbarAnimCards = document.querySelectorAll('.pbar-anim-card');
  pbarAnimCards.forEach(card => {
    card.addEventListener('click', () => {
      pbarAnimCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const animStyle = card.getAttribute('data-anim');
      
      const previewCard = document.getElementById('spotify-card');
      if (previewCard) {
        const animStyles = [
          'pbar-anim-none', 'pbar-anim-shimmer', 'pbar-anim-pulse', 'pbar-anim-wave',
          'pbar-anim-stripes', 'pbar-anim-rainbow', 'pbar-anim-laser', 'pbar-anim-audio_bounce',
          'pbar-anim-glow_head'
        ];
        animStyles.forEach(cls => previewCard.classList.remove(cls));
        if (animStyle !== 'none') previewCard.classList.add(`pbar-anim-${animStyle}`);
      }

      updateConfigProperty({ progressAnimStyle: animStyle });
    });
  });

  const pbarHeadCards = document.querySelectorAll('.pbar-head-card');
  pbarHeadCards.forEach(card => {
    card.addEventListener('click', () => {
      pbarHeadCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const headEffect = card.getAttribute('data-head');

      const previewCard = document.getElementById('spotify-card');
      if (previewCard) {
        const headEffects = [
          'pbar-head-none', 'pbar-head-glow_orb', 'pbar-head-pill', 'pbar-head-diamond',
          'pbar-head-sparkle', 'pbar-head-pulse_ring'
        ];
        headEffects.forEach(cls => previewCard.classList.remove(cls));
        previewCard.classList.add(`pbar-head-${headEffect}`);
      }

      updateConfigProperty({ progressHeadEffect: headEffect });
    });
  });

  const pbarPresets = {
    cyberpunk: {
      progressAnimStyle: 'laser',
      progressHeadEffect: 'glow_orb',
      progressBarHeight: 6,
      progressBarRadius: 0,
      progressGlow: 100,
      progressAnimSpeed: 1.2,
      progressTrackStyle: 'glow_track',
      progressTimeStyle: 'glow'
    },
    liquid: {
      progressAnimStyle: 'wave',
      progressHeadEffect: 'pill',
      progressBarHeight: 7,
      progressBarRadius: 8,
      progressGlow: 70,
      progressAnimSpeed: 2.2,
      progressTrackStyle: 'glass',
      progressTimeStyle: 'glow'
    },
    shimmer: {
      progressAnimStyle: 'shimmer',
      progressHeadEffect: 'diamond',
      progressBarHeight: 5,
      progressBarRadius: 6,
      progressGlow: 65,
      progressAnimSpeed: 2.0,
      progressTrackStyle: 'glass',
      progressTimeStyle: 'glow'
    },
    rainbow: {
      progressAnimStyle: 'rainbow',
      progressHeadEffect: 'pulse_ring',
      progressBarHeight: 6,
      progressBarRadius: 6,
      progressGlow: 85,
      progressAnimSpeed: 3.2,
      progressTrackStyle: 'dark',
      progressTimeStyle: 'badge'
    },
    stripes: {
      progressAnimStyle: 'stripes',
      progressHeadEffect: 'pill',
      progressBarHeight: 6,
      progressBarRadius: 4,
      progressGlow: 50,
      progressAnimSpeed: 1.4,
      progressTrackStyle: 'inset',
      progressTimeStyle: 'clean'
    },
    beat: {
      progressAnimStyle: 'audio_bounce',
      progressHeadEffect: 'sparkle',
      progressBarHeight: 6,
      progressBarRadius: 6,
      progressGlow: 80,
      progressAnimSpeed: 1.8,
      progressTrackStyle: 'glow_track',
      progressTimeStyle: 'glow'
    },
    minimal: {
      progressAnimStyle: 'none',
      progressHeadEffect: 'none',
      progressBarHeight: 3,
      progressBarRadius: 3,
      progressGlow: 25,
      progressAnimSpeed: 2.0,
      progressTrackStyle: 'glass',
      progressTimeStyle: 'clean'
    }
  };

  const presetBtns = document.querySelectorAll('.preset-pill-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-preset');
      const preset = pbarPresets[presetKey];
      if (!preset) return;

      applyPresetValues(preset);
      updateConfigProperty(preset);
    });
  });

  function applyPresetValues(preset) {
    if (preset.progressAnimStyle) {
      pbarAnimCards.forEach(c => {
        if (c.getAttribute('data-anim') === preset.progressAnimStyle) c.classList.add('active');
        else c.classList.remove('active');
      });
    }
    if (preset.progressHeadEffect) {
      pbarHeadCards.forEach(c => {
        if (c.getAttribute('data-head') === preset.progressHeadEffect) c.classList.add('active');
        else c.classList.remove('active');
      });
    }
    if (preset.progressBarHeight !== undefined) setVal('cfg-pbar-height', preset.progressBarHeight, 'val-pbar-height', 'px');
    if (preset.progressBarRadius !== undefined) setVal('cfg-pbar-radius', preset.progressBarRadius, 'val-pbar-radius', 'px');
    if (preset.progressGlow !== undefined) setVal('cfg-pbar-glow', preset.progressGlow, 'val-pbar-glow', '%');
    if (preset.progressAnimSpeed !== undefined) setVal('cfg-pbar-speed', preset.progressAnimSpeed, 'val-pbar-speed', 's');
    if (preset.progressTrackStyle) setVal('cfg-pbar-track-style', preset.progressTrackStyle);
    if (preset.progressTimeStyle) setVal('cfg-pbar-time-style', preset.progressTimeStyle);

    const root = document.documentElement;
    const previewCard = document.getElementById('spotify-card');

    if (preset.progressBarHeight !== undefined) root.style.setProperty('--pbar-height', `${preset.progressBarHeight}px`);
    if (preset.progressBarRadius !== undefined) root.style.setProperty('--pbar-radius', `${preset.progressBarRadius}px`);
    if (preset.progressGlow !== undefined) root.style.setProperty('--pbar-glow', (preset.progressGlow / 100).toString());
    if (preset.progressAnimSpeed !== undefined) root.style.setProperty('--pbar-speed', `${preset.progressAnimSpeed}s`);

    if (previewCard) {
      if (preset.progressAnimStyle) {
        const animStyles = [
          'pbar-anim-none', 'pbar-anim-shimmer', 'pbar-anim-pulse', 'pbar-anim-wave',
          'pbar-anim-stripes', 'pbar-anim-rainbow', 'pbar-anim-laser', 'pbar-anim-audio_bounce',
          'pbar-anim-glow_head'
        ];
        animStyles.forEach(cls => previewCard.classList.remove(cls));
        if (preset.progressAnimStyle !== 'none') previewCard.classList.add(`pbar-anim-${preset.progressAnimStyle}`);
      }

      if (preset.progressHeadEffect) {
        const headEffects = [
          'pbar-head-none', 'pbar-head-glow_orb', 'pbar-head-pill', 'pbar-head-diamond',
          'pbar-head-sparkle', 'pbar-head-pulse_ring'
        ];
        headEffects.forEach(cls => previewCard.classList.remove(cls));
        previewCard.classList.add(`pbar-head-${preset.progressHeadEffect}`);
      }

      if (preset.progressTrackStyle) {
        const trackStyles = ['pbar-track-glass', 'pbar-track-dark', 'pbar-track-glow_track', 'pbar-track-dotted', 'pbar-track-inset'];
        trackStyles.forEach(cls => previewCard.classList.remove(cls));
        previewCard.classList.add(`pbar-track-${preset.progressTrackStyle}`);
      }

      if (preset.progressTimeStyle) {
        const timeStyles = ['pbar-time-glow', 'pbar-time-badge', 'pbar-time-clean'];
        timeStyles.forEach(cls => previewCard.classList.remove(cls));
        previewCard.classList.add(`pbar-time-${preset.progressTimeStyle}`);
      }
    }
  }

  function togglePbarColorRows(type) {
    const rowCustom = document.getElementById('row-pbar-custom-color');
    const rowGradEnd = document.getElementById('row-pbar-gradient-end');
    if (rowCustom) rowCustom.style.display = (type === 'custom' || type === 'gradient') ? 'flex' : 'none';
    if (rowGradEnd) rowGradEnd.style.display = (type === 'gradient') ? 'flex' : 'none';

    const root = document.documentElement;
    if (type === 'custom') {
      const color = document.getElementById('cfg-pbar-custom-color')?.value || '#1DB954';
      root.style.setProperty('--pbar-fill-color', color);
      root.style.setProperty('--pbar-glow-color', color);
    } else if (type === 'gradient') {
      const start = document.getElementById('cfg-pbar-custom-color')?.value || '#1DB954';
      const end = document.getElementById('cfg-pbar-custom-gradient-end')?.value || '#00d2ff';
      root.style.setProperty('--pbar-fill-color', `linear-gradient(90deg, ${start}, ${end})`);
      root.style.setProperty('--pbar-glow-color', end);
    } else {
      root.style.setProperty('--pbar-fill-color', 'var(--accent-color)');
      root.style.setProperty('--pbar-glow-color', 'var(--accent-color)');
    }
  }

  // ─── Upload de Vídeo / GIF ───────────────────────────────────────────────

  const uploadZone    = document.getElementById('vis-upload-zone');
  const fileInput     = document.getElementById('vis-file-input');
  const progressWrap  = document.getElementById('vis-upload-progress-wrap');
  const progressBar   = document.getElementById('vis-upload-progress-bar');
  const progressLabel = document.getElementById('vis-upload-filename');
  const progressPct   = document.getElementById('vis-upload-percent');
  const uploadStatus  = document.getElementById('vis-upload-status');

  function showUploadStatus(msg, type = 'success') {
    if (!uploadStatus) return;
    uploadStatus.textContent = msg;
    uploadStatus.className = `vis-upload-status ${type}`;
    uploadStatus.style.display = 'block';
    setTimeout(() => { uploadStatus.style.display = 'none'; }, 5000);
  }

  function doUpload(file) {
    if (!file) return;
    if (!progressWrap) return;

    const formData = new FormData();
    formData.append('file', file);

    progressWrap.style.display = 'flex';
    if (progressLabel) progressLabel.textContent = file.name;
    if (progressBar)   progressBar.style.width = '0%';
    if (progressPct)   progressPct.textContent = '0%';

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/visualizations/upload');

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (progressPct) progressPct.textContent = `${pct}%`;
      }
    });

    xhr.addEventListener('load', () => {
      progressWrap.style.display = 'none';
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && result.success) {
          showUploadStatus(`✅ "${result.filename}" enviado com sucesso!`, 'success');
          loadVisFiles(result.filename); // auto-seleciona o arquivo enviado
        } else {
          showUploadStatus(`❌ Erro: ${result.error || 'Falha no upload.'}`, 'error');
        }
      } catch {
        showUploadStatus('❌ Resposta inválida do servidor.', 'error');
      }
    });

    xhr.addEventListener('error', () => {
      progressWrap.style.display = 'none';
      showUploadStatus('❌ Falha na conexão com o servidor.', 'error');
    });

    xhr.send(formData);
  }

  if (uploadZone) {
    // Clique para abrir seletor de arquivo
    uploadZone.addEventListener('click', () => fileInput && fileInput.click());

    // Drag & Drop
    uploadZone.addEventListener('dragover', e => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone.addEventListener('drop', e => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) doUpload(file);
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) { doUpload(file); fileInput.value = ''; }
    });
  }

  // Carregar lista de arquivos de vídeo/gif de public/visualizations
  async function loadVisFiles(currentSelected) {
    try {
      const res = await fetch('/api/visualizations');
      const data = await res.json();
      const select = document.getElementById('cfg-bg-vis-custom-file');
      const filesList = document.getElementById('vis-files-list');

      // Atualizar select
      if (select) {
        select.innerHTML = '';
        if (!data.files || data.files.length === 0) {
          select.innerHTML = '<option value="">Nenhum arquivo encontrado</option>';
        } else {
          data.files.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f;
            opt.textContent = f;
            if (f === currentSelected) opt.selected = true;
            select.appendChild(opt);
          });
          // Se acabou de fazer upload, seleciona e salva
          if (currentSelected && data.files.includes(currentSelected)) {
            select.value = currentSelected;
            updateConfigProperty({ bgVisCustomFile: currentSelected });
          }
        }
      }

      // Renderizar lista de arquivos com botão delete
      if (filesList) {
        filesList.innerHTML = '';
        if (data.files && data.files.length > 0) {
          data.files.forEach(f => {
            const ext = f.split('.').pop().toUpperCase();
            const item = document.createElement('div');
            item.className = 'vis-file-item';
            item.innerHTML = `
              <span class="vis-file-item-ext">${ext}</span>
              <span class="vis-file-item-name" title="${f}">${f}</span>
              <button class="vis-file-delete-btn" title="Apagar arquivo" data-filename="${f}">🗑️</button>
            `;
            filesList.appendChild(item);
          });

          filesList.querySelectorAll('.vis-file-delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
              const filename = btn.getAttribute('data-filename');
              if (!confirm(`Apagar "${filename}"?`)) return;
              const r = await fetch(`/api/visualizations/${encodeURIComponent(filename)}`, { method: 'DELETE' });
              const result = await r.json();
              if (result.success) {
                showUploadStatus(`🗑️ "${filename}" apagado.`, 'success');
                const currentVal = select ? select.value : '';
                loadVisFiles(currentVal === filename ? '' : currentVal);
              } else {
                showUploadStatus(`❌ Erro ao apagar: ${result.error}`, 'error');
              }
            });
          });
        }
      }
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
  const obsStepUrl = document.getElementById('obs-step-url');
  const btnOpenOverlay = document.getElementById('btn-open-overlay');

  const overlayUrl = `${window.location.origin}/overlay?id=${encodeURIComponent(currentUserId)}`;
  if (obsUrlDisplay) obsUrlDisplay.textContent = overlayUrl;
  if (obsStepUrl) obsStepUrl.textContent = overlayUrl;
  if (btnOpenOverlay) btnOpenOverlay.href = overlayUrl;

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
      await fetch(`/api/demo/next?userId=${encodeURIComponent(currentUserId)}`, { method: 'POST' });
    });
  }

  // Carregar Configurações Iniciais
  fetch(`/api/config?userId=${encodeURIComponent(currentUserId)}`)
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

    // Barra de Tempo & Animações
    const currentPbarAnim = config.progressAnimStyle || 'shimmer';
    pbarAnimCards.forEach(c => {
      if (c.getAttribute('data-anim') === currentPbarAnim) c.classList.add('active');
      else c.classList.remove('active');
    });

    const currentPbarHead = config.progressHeadEffect || 'glow_orb';
    pbarHeadCards.forEach(c => {
      if (c.getAttribute('data-head') === currentPbarHead) c.classList.add('active');
      else c.classList.remove('active');
    });

    setVal('cfg-pbar-height', config.progressBarHeight !== undefined ? config.progressBarHeight : 5, 'val-pbar-height', 'px');
    setVal('cfg-pbar-radius', config.progressBarRadius !== undefined ? config.progressBarRadius : 6, 'val-pbar-radius', 'px');
    setVal('cfg-pbar-glow', config.progressGlow !== undefined ? config.progressGlow : 65, 'val-pbar-glow', '%');
    setVal('cfg-pbar-speed', config.progressAnimSpeed || 2.0, 'val-pbar-speed', 's');
    setVal('cfg-pbar-track-style', config.progressTrackStyle || 'glass');
    setVal('cfg-pbar-time-style', config.progressTimeStyle || 'glow');
    setVal('cfg-pbar-fill-color-type', config.progressFillColorType || 'accent');
    togglePbarColorRows(config.progressFillColorType || 'accent');
    setVal('cfg-pbar-custom-color', config.progressCustomColor || '#1DB954');
    setVal('cfg-pbar-custom-gradient-end', config.progressCustomGradientEnd || '#00d2ff');
    setCheck('cfg-pbar-show-progress', config.showProgress !== false);
    setCheck('cfg-pbar-show-time', config.showTime !== false);

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
    { id: 'cfg-bg-vis-custom-file', key: 'bgVisCustomFile', type: 'val' },

    // Bindings da Barra de Tempo
    { id: 'cfg-pbar-height', key: 'progressBarHeight', type: 'val', num: true, labelId: 'val-pbar-height', suffix: 'px' },
    { id: 'cfg-pbar-radius', key: 'progressBarRadius', type: 'val', num: true, labelId: 'val-pbar-radius', suffix: 'px' },
    { id: 'cfg-pbar-glow', key: 'progressGlow', type: 'val', num: true, labelId: 'val-pbar-glow', suffix: '%' },
    { id: 'cfg-pbar-speed', key: 'progressAnimSpeed', type: 'val', num: true, labelId: 'val-pbar-speed', suffix: 's' },
    { id: 'cfg-pbar-track-style', key: 'progressTrackStyle', type: 'val' },
    { id: 'cfg-pbar-time-style', key: 'progressTimeStyle', type: 'val' },
    { id: 'cfg-pbar-fill-color-type', key: 'progressFillColorType', type: 'val' },
    { id: 'cfg-pbar-custom-color', key: 'progressCustomColor', type: 'val' },
    { id: 'cfg-pbar-custom-gradient-end', key: 'progressCustomGradientEnd', type: 'val' },
    { id: 'cfg-pbar-show-progress', key: 'showProgress', type: 'check' },
    { id: 'cfg-pbar-show-time', key: 'showTime', type: 'check' }
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

      // Aplicar imediatamente no preview local (sem esperar pelo WebSocket)
      const root = document.documentElement;
      const previewCard = document.getElementById('spotify-card');
      const immediateMap = {
        fontFamily:          () => root.style.setProperty('--font-family', `'${value}', sans-serif`),
        titleSize:           () => root.style.setProperty('--title-size', `${value}px`),
        artistSize:          () => root.style.setProperty('--artist-size', `${value}px`),
        accentColor:         () => { root.style.setProperty('--accent-color', value); applyAccentRgb(value); },
        bgColor:             () => root.style.setProperty('--bg-color', value),
        textColor:           () => root.style.setProperty('--text-color', value),
        secondaryTextColor:  () => root.style.setProperty('--secondary-text-color', value),
        bgOpacity:           () => root.style.setProperty('--bg-opacity', (value / 100).toString()),
        glowIntensity:       () => root.style.setProperty('--glow-intensity', (value / 100).toString()),
        blurAmount:          () => root.style.setProperty('--blur-amount', `${value}px`),
        borderRadius:        () => root.style.setProperty('--border-radius', `${value}px`),

        // Barra de Tempo
        progressBarHeight:   () => root.style.setProperty('--pbar-height', `${value}px`),
        progressBarRadius:   () => root.style.setProperty('--pbar-radius', `${value}px`),
        progressGlow:        () => root.style.setProperty('--pbar-glow', (value / 100).toString()),
        progressAnimSpeed:   () => root.style.setProperty('--pbar-speed', `${value}s`),
        progressTrackStyle:  () => {
          if (previewCard) {
            ['pbar-track-glass', 'pbar-track-dark', 'pbar-track-glow_track', 'pbar-track-dotted', 'pbar-track-inset']
              .forEach(cls => previewCard.classList.remove(cls));
            previewCard.classList.add(`pbar-track-${value}`);
          }
        },
        progressTimeStyle:   () => {
          if (previewCard) {
            ['pbar-time-glow', 'pbar-time-badge', 'pbar-time-clean']
              .forEach(cls => previewCard.classList.remove(cls));
            previewCard.classList.add(`pbar-time-${value}`);
          }
        },
        progressFillColorType: () => togglePbarColorRows(value),
        progressCustomColor: () => {
          root.style.setProperty('--pbar-fill-color', value);
          root.style.setProperty('--pbar-glow-color', value);
        },
        progressCustomGradientEnd: () => {
          const start = document.getElementById('cfg-pbar-custom-color')?.value || 'var(--accent-color)';
          root.style.setProperty('--pbar-fill-color', `linear-gradient(90deg, ${start}, ${value})`);
          root.style.setProperty('--pbar-glow-color', value);
        },
        showProgress: () => {
          const ps = document.getElementById('progress-section');
          if (ps) ps.style.display = value ? 'flex' : 'none';
          const m1 = document.getElementById('cfg-show-progress');
          const m2 = document.getElementById('cfg-pbar-show-progress');
          if (m1) m1.checked = !!value;
          if (m2) m2.checked = !!value;
        },
        showTime: () => {
          const tr = document.getElementById('time-row');
          if (tr) tr.style.display = value ? 'flex' : 'none';
          const t1 = document.getElementById('cfg-show-time');
          const t2 = document.getElementById('cfg-pbar-show-time');
          if (t1) t1.checked = !!value;
          if (t2) t2.checked = !!value;
        }
      };
      if (immediateMap[binding.key]) immediateMap[binding.key]();

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
      fetch(`/api/config?userId=${encodeURIComponent(currentUserId)}`, {
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
  const statusWs = new WebSocket(`${protocol}//${window.location.host}?userId=${encodeURIComponent(currentUserId)}`);
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

  // Gerenciamento da Conexão Oficial Spotify
  async function checkSpotifyStatus() {
    try {
      const res = await fetch(`/api/me?userId=${encodeURIComponent(currentUserId)}`);
      if (!res.ok) return;
      const data = await res.json();

      const btnHeaderLogin = document.getElementById('btn-header-spotify-login');
      const userBadge = document.getElementById('spotify-user-badge');
      const userName = document.getElementById('spotify-user-name');
      const userAvatar = document.getElementById('spotify-user-avatar');

      const connectCard = document.getElementById('spotify-connect-card');
      const connectedCard = document.getElementById('spotify-connected-card');
      const nameDisplay = document.getElementById('spotify-name-display');
      const avatarDisplay = document.getElementById('spotify-avatar-display');
      const adminNotice = document.getElementById('spotify-not-configured-banner');

      // Se o servidor ainda não tiver .env configurado com Spotify
      if (adminNotice) {
        adminNotice.style.display = data.isSpotifyConfigured ? 'none' : 'flex';
      }

      // Atualizar links de login para incluir o userId
      const loginUrl = `/auth/spotify/login?userId=${encodeURIComponent(currentUserId)}`;
      if (btnHeaderLogin) btnHeaderLogin.href = loginUrl;
      const btnMainLogin = document.getElementById('btn-main-spotify-login');
      if (btnMainLogin) btnMainLogin.href = loginUrl;

      if (data.spotify) {
        // Usuário está conectado
        if (btnHeaderLogin) btnHeaderLogin.style.display = 'none';
        if (userBadge) {
          userBadge.style.display = 'inline-flex';
          userName.textContent = data.spotify.displayName || 'Spotify';
          if (data.spotify.avatar) {
            userAvatar.src = data.spotify.avatar;
            userAvatar.style.display = 'block';
          } else {
            userAvatar.style.display = 'none';
          }
        }

        if (connectCard) connectCard.style.display = 'none';
        if (connectedCard) {
          connectedCard.style.display = 'flex';
          if (nameDisplay) nameDisplay.textContent = data.spotify.displayName || 'Spotify Conectado';
          if (avatarDisplay) {
            if (data.spotify.avatar) {
              avatarDisplay.src = data.spotify.avatar;
              avatarDisplay.style.display = 'block';
            } else {
              avatarDisplay.style.display = 'none';
            }
          }
        }
      } else {
        // Usuário não conectado
        if (btnHeaderLogin) btnHeaderLogin.style.display = 'inline-flex';
        if (userBadge) userBadge.style.display = 'none';

        if (connectCard) connectCard.style.display = 'flex';
        if (connectedCard) connectedCard.style.display = 'none';
      }
    } catch (e) {
      console.error('Erro ao verificar status do usuário:', e);
    }
  }

  // Handlers para Desconectar Spotify
  async function disconnectSpotify() {
    if (!confirm('Deseja realmente desconectar sua conta do Spotify deste overlay?')) return;
    try {
      await fetch(`/auth/spotify/disconnect?userId=${encodeURIComponent(currentUserId)}`, { method: 'POST' });
      checkSpotifyStatus();
    } catch (e) {}
  }

  const btnDisconnectHeader = document.getElementById('btn-disconnect-spotify');
  if (btnDisconnectHeader) btnDisconnectHeader.addEventListener('click', disconnectSpotify);

  const btnDisconnectTab = document.getElementById('btn-disconnect-spotify-tab');
  if (btnDisconnectTab) btnDisconnectTab.addEventListener('click', disconnectSpotify);

  checkSpotifyStatus();

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
