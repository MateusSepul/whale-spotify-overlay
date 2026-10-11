/**
 * Windows Media Player Style Background Visualizer Engine
 * Recreates iconic visualizers: Blazing Colors, Color Cubes, Trilogy, Psychedelia, Bars & Waves, Hyperspace
 */
window.WMPVisualizer = (function() {
  let canvas = null;
  let ctx = null;
  let videoEl = null;
  let containerEl = null;
  let animId = null;
  let config = {};
  let isPlaying = true;
  let accentRgb = { r: 29, g: 185, b: 84 };
  let time = 0;
  let lastTimestamp = 0;

  // Starfield data for Hyperspace & Trilogy
  const stars = [];
  const numStars = 120;
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 800,
      z: Math.random() * 800 + 1,
      size: Math.random() * 2 + 1,
      color: Math.random() > 0.5 ? '#00e5ff' : '#ff00aa'
    });
  }

  // 3D Cubes data for Color Cubes
  const cubes = [
    { x: -110, y: -20, z: 250, size: 55, rx: 0.02, ry: 0.03, rz: 0.01, color: '#ff0055' },
    { x: 100, y: 15, z: 280, size: 65, rx: 0.015, ry: 0.025, rz: 0.02, color: '#00e5ff' },
    { x: 0, y: -10, z: 180, size: 45, rx: 0.03, ry: 0.01, rz: 0.025, color: '#ffea00' },
    { x: -70, y: 35, z: 320, size: 40, rx: 0.025, ry: 0.015, rz: 0.03, color: '#a855f7' },
    { x: 80, y: -45, z: 340, size: 50, rx: 0.01, ry: 0.035, rz: 0.015, color: '#22c55e' }
  ];
  let cubeRotAngles = cubes.map(() => ({ x: Math.random() * 6, y: Math.random() * 6, z: Math.random() * 6 }));

  function init(container, canvasElement, videoElement) {
    containerEl = container;
    canvas = canvasElement;
    videoEl = videoElement;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    startLoop();
  }

  function resize() {
    if (!canvas || !containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    const w = Math.max(rect.width, 320);
    const h = Math.max(rect.height, 120);
    canvas.width = w;
    canvas.height = h;
  }

  function updateConfig(newConfig) {
    config = { ...config, ...newConfig };
    applyVisualizerMode();
  }

  function updateMedia(media) {
    if (media) {
      isPlaying = !!media.isPlaying;
    }
  }

  function setAccentColor(rgb) {
    if (rgb) accentRgb = rgb;
  }

  function applyVisualizerMode() {
    if (!containerEl || !canvas || !videoEl) return;

    const mode = config.bgVisualization || 'none';
    const opacity = (typeof config.bgVisOpacity === 'number' ? config.bgVisOpacity : 70) / 100;
    containerEl.style.opacity = opacity.toString();

    if (mode === 'none') {
      containerEl.style.display = 'none';
      if (videoEl) {
        videoEl.pause();
        videoEl.src = '';
      }
      return;
    }

    containerEl.style.display = 'block';

    // Se for vídeo personalizado
    if (mode === 'custom_video') {
      canvas.style.display = 'none';
      videoEl.style.display = 'block';
      if (config.bgVisCustomFile) {
        const expectedSrc = `/visualizations/${encodeURIComponent(config.bgVisCustomFile)}`;
        if (!videoEl.src.includes(encodeURIComponent(config.bgVisCustomFile))) {
          videoEl.src = expectedSrc;
          videoEl.load();
        }
        if (isPlaying) {
          videoEl.play().catch(() => {});
        } else {
          videoEl.pause();
        }
      }
    } else {
      // Modo Canvas WMP
      canvas.style.display = 'block';
      videoEl.style.display = 'none';
      videoEl.pause();
      resize();
    }
  }

  function getSpeedMultiplier() {
    const spd = config.bgVisSpeed || 'normal';
    if (spd === 'slow') return 0.5;
    if (spd === 'fast') return 1.8;
    return 1.0;
  }

  function startLoop() {
    if (animId) cancelAnimationFrame(animId);

    function loop(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const speed = getSpeedMultiplier() * (isPlaying ? 1.0 : 0.25);
      time += delta * speed;

      render();
      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  function render() {
    if (!ctx || !canvas) return;
    const mode = config.bgVisualization || 'none';
    if (mode === 'none' || mode === 'custom_video') return;

    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);

    switch (mode) {
      case 'blazing_colors':
        renderBlazingColors(w, h);
        break;
      case 'color_cubes':
        renderColorCubes(w, h);
        break;
      case 'trilogy':
        renderTrilogy(w, h);
        break;
      case 'psychedelia':
        renderPsychedelia(w, h);
        break;
      case 'bars_waves':
        renderBarsAndWaves(w, h);
        break;
      case 'hyperspace':
        renderHyperspace(w, h);
        break;
      default:
        break;
    }
  }

  /* -------------------------------------------------------------
     1. BLAZING COLORS (WMP Classic Fire & Color Plasma Swirls)
     ------------------------------------------------------------- */
  function renderBlazingColors(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    
    // Fundo escuro com brilho fluido
    const gradBg = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.7);
    gradBg.addColorStop(0, `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.35)`);
    gradBg.addColorStop(0.5, 'rgba(255, 69, 0, 0.25)');
    gradBg.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = gradBg;
    ctx.fillRect(0, 0, w, h);

    // Ondas de plasma fluido flamejante
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const numLayers = 5;
    for (let l = 0; l < numLayers; l++) {
      ctx.beginPath();
      const hue = (time * 40 + l * 55) % 360;
      ctx.fillStyle = `hsla(${hue}, 95%, 55%, 0.22)`;

      const waveFreq = 0.015 + l * 0.008;
      const waveAmp = 25 + l * 12;
      const speedOffset = time * (1.2 + l * 0.4);

      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) {
        const y = cy + Math.sin(x * waveFreq + speedOffset) * waveAmp +
                  Math.cos(x * 0.008 - speedOffset * 0.8) * (waveAmp * 0.7);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }

    // Centelhas e chamas ascendentes
    const sparkCount = 18;
    for (let i = 0; i < sparkCount; i++) {
      const sx = ((Math.sin(i * 99 + time * 1.5) * 0.5 + 0.5) * w);
      const sy = h - (((time * (60 + i * 15) + i * 40) % (h * 1.2)));
      const sr = 3 + Math.sin(time * 3 + i) * 2;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(1, sr), 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 220, 100, 0.65)' : 'rgba(255, 70, 20, 0.55)';
      ctx.fill();
    }
    ctx.restore();
  }

  /* -------------------------------------------------------------
     2. COLOR CUBES (3D Rotating Neon Cubes in Perspective)
     ------------------------------------------------------------- */
  function renderColorCubes(w, h) {
    ctx.fillStyle = 'rgba(5, 7, 15, 0.9)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const fov = 300;

    cubes.forEach((cube, idx) => {
      const angles = cubeRotAngles[idx];
      angles.x += cube.rx * (isPlaying ? 1.0 : 0.2);
      angles.y += cube.ry * (isPlaying ? 1.0 : 0.2);
      angles.z += cube.rz * (isPlaying ? 1.0 : 0.2);

      // Órbita suave dos cubos
      const orbitX = cube.x + Math.sin(time * 0.8 + idx) * 35;
      const orbitY = cube.y + Math.cos(time * 0.6 + idx * 2) * 20;
      const orbitZ = cube.z + Math.sin(time * 0.5 + idx) * 40;

      // 8 Vértices do cubo 3D
      const s = cube.size / 2;
      const rawVerts = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s],  [s, -s, s],  [s, s, s],  [-s, s, s]
      ];

      // Rotação 3D dos vértices
      const rotVerts = rawVerts.map(v => {
        let [x, y, z] = v;
        // Rot X
        let y1 = y * Math.cos(angles.x) - z * Math.sin(angles.x);
        let z1 = y * Math.sin(angles.x) + z * Math.cos(angles.x);
        // Rot Y
        let x2 = x * Math.cos(angles.y) + z1 * Math.sin(angles.y);
        let z2 = -x * Math.sin(angles.y) + z1 * Math.cos(angles.y);
        // Rot Z
        let x3 = x2 * Math.cos(angles.z) - y1 * Math.sin(angles.z);
        let y3 = x2 * Math.sin(angles.z) + y1 * Math.cos(angles.z);
        return [x3 + orbitX, y3 + orbitY, z2 + orbitZ];
      });

      // Projeção em perspectiva 2D
      const proj = rotVerts.map(v => {
        const depth = v[2];
        const scale = fov / Math.max(10, depth);
        return [cx + v[0] * scale, cy + v[1] * scale];
      });

      // Arestas do cubo
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];

      ctx.save();
      ctx.shadowColor = cube.color;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = cube.color;
      ctx.lineWidth = 2;

      ctx.beginPath();
      edges.forEach(([i, j]) => {
        ctx.moveTo(proj[i][0], proj[i][1]);
        ctx.lineTo(proj[j][0], proj[j][1]);
      });
      ctx.stroke();

      // Face translúcida
      ctx.fillStyle = `${cube.color}22`;
      ctx.beginPath();
      [0, 1, 2, 3].forEach((vi, i) => {
        if (i === 0) ctx.moveTo(proj[vi][0], proj[vi][1]);
        else ctx.lineTo(proj[vi][0], proj[vi][1]);
      });
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  /* -------------------------------------------------------------
     3. TRILOGY (WMP Iconic Neon Sine Ribbons & Star Dust)
     ------------------------------------------------------------- */
  function renderTrilogy(w, h) {
    ctx.fillStyle = 'rgba(8, 10, 20, 0.88)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Fitas Neon Senoidais
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const ribbons = [
      { color: `rgb(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b})`, speed: 1.5, freq: 0.012, amp: 38, offset: 0 },
      { color: '#00e5ff', speed: 1.8, freq: 0.018, amp: 32, offset: 2 },
      { color: '#e024c3', speed: 1.2, freq: 0.009, amp: 44, offset: 4 }
    ];

    ribbons.forEach(ribbon => {
      ctx.strokeStyle = ribbon.color;
      ctx.shadowColor = ribbon.color;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3.5;

      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const wave = Math.sin(x * ribbon.freq + time * ribbon.speed + ribbon.offset);
        const wave2 = Math.cos(x * 0.006 - time * 0.8);
        const y = cy + wave * ribbon.amp + wave2 * (ribbon.amp * 0.4);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Reflexo espelhado da fita
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 10) {
        const wave = Math.sin(x * ribbon.freq * 1.5 - time * ribbon.speed * 0.7);
        const y = cy - wave * (ribbon.amp * 0.6);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Partículas estelares que flutuam
    stars.slice(0, 40).forEach(star => {
      const px = ((star.x + time * 20) % w + w) % w;
      const py = ((star.y + Math.sin(time + star.size) * 15) % h + h) % h;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(px, py, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  /* -------------------------------------------------------------
     4. PSYCHEDELIA (Retro Kaleidoscope Vortex Tunnel)
     ------------------------------------------------------------- */
  function renderPsychedelia(w, h) {
    const cx = w / 2;
    const cy = h / 2;

    ctx.fillStyle = 'rgba(10, 4, 18, 0.9)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);

    const petals = 8;
    const rings = 5;
    const baseRot = time * 0.6;

    for (let r = rings; r >= 1; r--) {
      const radius = r * 30 + Math.sin(time * 2 + r) * 12;
      const ringHue = (time * 50 + r * 60) % 360;

      ctx.save();
      ctx.rotate(baseRot * (r % 2 === 0 ? 1 : -1));

      ctx.strokeStyle = `hsla(${ringHue}, 100%, 65%, 0.8)`;
      ctx.shadowColor = `hsla(${ringHue}, 100%, 65%, 0.9)`;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      for (let i = 0; i <= petals; i++) {
        const angle = (i / petals) * Math.PI * 2;
        const dist = radius + (i % 2 === 0 ? 18 : -18);
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  /* -------------------------------------------------------------
     5. BARS & WAVES (WMP Classic Spectrum & Oscilloscope)
     ------------------------------------------------------------- */
  function renderBarsAndWaves(w, h) {
    ctx.fillStyle = 'rgba(6, 12, 18, 0.92)';
    ctx.fillRect(0, 0, w, h);

    const numBars = 32;
    const barWidth = Math.max(3, (w / numBars) - 3);
    const maxBarHeight = h * 0.65;

    ctx.save();
    // Barras de Frequência do Equalizador
    for (let i = 0; i < numBars; i++) {
      const barX = i * (barWidth + 3) + 2;
      // Simulação de espectro de áudio vivo e reativo
      const simFreq = Math.sin(time * 6 + i * 0.4) * 0.35 +
                      Math.cos(time * 4 - i * 0.6) * 0.35 + 0.3;
      const heightMultiplier = isPlaying ? Math.max(0.1, simFreq) : 0.08;
      const barHeight = heightMultiplier * maxBarHeight;

      // Gradiente clássico do WMP (Verde para Amarelo para Vermelho ou Ciano/Roxo)
      const grad = ctx.createLinearGradient(barX, h, barX, h - barHeight);
      grad.addColorStop(0, 'rgba(0, 255, 128, 0.85)');
      grad.addColorStop(0.7, 'rgba(0, 200, 255, 0.85)');
      grad.addColorStop(1, 'rgba(255, 60, 160, 0.95)');

      ctx.fillStyle = grad;
      ctx.fillRect(barX, h - barHeight, barWidth, barHeight);

      // Pico flutuante no topo de cada barra (Peak Bar)
      const peakY = h - barHeight - 4;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(barX, Math.max(2, peakY), barWidth, 2);
    }

    // Onda Osciloscópio (Oscilloscope Wave)
    const waveY = h * 0.38;
    ctx.beginPath();
    ctx.strokeStyle = '#00f6ff';
    ctx.shadowColor = '#00f6ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.5;

    for (let x = 0; x <= w; x += 4) {
      const osc = Math.sin(x * 0.03 + time * 8) * (isPlaying ? 16 : 4) +
                  Math.cos(x * 0.015 - time * 5) * (isPlaying ? 10 : 2);
      const y = waveY + osc;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* -------------------------------------------------------------
     6. HYPERSPACE (3D Starfield Warp Tunnel)
     ------------------------------------------------------------- */
  function renderHyperspace(w, h) {
    ctx.fillStyle = 'rgba(2, 4, 10, 0.85)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const fov = 200;

    ctx.save();
    stars.forEach(star => {
      star.z -= (isPlaying ? 450 : 80) * 0.016;
      if (star.z <= 0) {
        star.z = 800;
        star.x = (Math.random() - 0.5) * 800;
        star.y = (Math.random() - 0.5) * 800;
      }

      const k = fov / star.z;
      const px = cx + star.x * k;
      const py = cy + star.y * k;

      if (px >= 0 && px <= w && py >= 0 && py <= h) {
        const size = Math.max(1, (1 - star.z / 800) * 3.5);
        const alpha = Math.min(1, Math.max(0.1, (1 - star.z / 800)));

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();

        // Rastro de velocidade
        if (isPlaying) {
          const prevK = fov / (star.z + 25);
          const prevX = cx + star.x * prevK;
          const prevY = cy + star.y * prevK;
          ctx.strokeStyle = `rgba(180, 220, 255, ${alpha * 0.6})`;
          ctx.lineWidth = size * 0.8;
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      }
    });
    ctx.restore();
  }

  return {
    init,
    updateConfig,
    updateMedia,
    setAccentColor,
    resize
  };
})();
