# 🎶 Spotify OBS Overlay Pro

Overlay moderno e altamente customizável para o **OBS Studio**, capaz de detectar em tempo real a música que está tocando no **Spotify** com suporte a pré-visualização ao vivo e múltiplos temas.

---

## ✨ Recursos

- ⚡ **Detecção Sem Complicações**:
  - **Modo Local Windows (Padrão)**: Detecta o Spotify aberto no PC nativamente via Windows Media API (SMTC) **sem precisar de login, conta de desenvolvedor ou credenciais**. As capas são buscadas em alta resolução (HD) automaticamente.
  - **Spotify Web API Oficial**: Permite conectar via OAuth oficial para streamers que preferem o backend do Spotify.
  - **Modo Demonstração**: Permite testar faixas e personalizar sem precisar abrir o Spotify.
- 🎨 **7 Temas Visuais Exclusivos**:
  1. **Glassmorphism Pro**: Vidro translúcido com desfoque (*backdrop-filter: blur*), aura colorida e brilho sutil.
  2. **Disco de Vinil (Vinyl Record)**: Capa do álbum em um disco de vinil giratório realista que para suavemente quando a música pausa.
  3. **Cyberpunk Neon**: Estilo futurista com bordas recortadas e iluminação neon.
  4. **Minimal Clean**: Visual refinado estilo Apple Music e widgets iOS.
  5. **Pílula Compacta (Streamer)**: Formato super compacto para cantos de tela de streams e gameplays.
  6. **Fita Cassete Retrô**: Visual nostálgico com estética lo-fi.
  7. **Spotify Card Modern**: O design escuro icônico do aplicativo Spotify.
- 🌈 **Cores & Efeitos Dinâmicos**:
  - Extração inteligente de cores dominantes da capa do álbum.
  - Seletor de cores manuais para fundo, texto, artista e destaques.
  - Controle de opacidade (para não tampar sua gameplay) e intensidade de brilho.
- 🔤 **Tipografia Personalizável**:
  - Fontes integradas: *Outfit*, *Inter*, *Poppins*, *Montserrat*, *JetBrains Mono*, *Space Grotesk*.
  - Efeito Marquee (texto que desliza automaticamente se o título for longo).
- ⚙️ **Customização Completa de Elementos**:
  - Ocultar/Exibir Capa, Barra de Progresso, Tempo Decorrido, Equalizador Dançante e Selo Spotify.
  - Opção para esconder o overlay automaticamente ao pausar a música (com tempo ajustável).
- 🔄 **Sincronização em Tempo Real (WebSocket)**: Qualquer alteração feita no painel reflete instantaneamente no OBS sem precisar recarregar o navegador!

---

## 🚀 Como Iniciar

1. Dê dois cliques no arquivo **`start.bat`** (ele abrirá o navegador automaticamente).
2. Ou abra o terminal na pasta e execute:
   ```bash
   npm start
   ```
3. O painel estará disponível em: **`http://localhost:3000`**

---

## 📺 Como Adicionar no OBS Studio

1. Abra o **OBS Studio**.
2. Na caixa **Fontes**, clique no botão **`+`** e selecione **Navegador** (Browser Source).
3. No campo **URL**, cole:
   ```
   http://localhost:3000/overlay
   ```
4. Configure as dimensões recomendadas:
   - **Largura (Width)**: `600`
   - **Altura (Height)**: `220`
5. Marque a opção: *"Desativar quando não estiver visível"* (opcional).
6. Clique em **OK** e posicione o overlay onde desejar na sua cena!
