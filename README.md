# 🎶 Spotify OBS Overlay Pro

Overlay moderno e altamente customizável para o **OBS Studio**, capaz de detectar em tempo real a música que está tocando no **Spotify** com suporte a pré-visualização ao vivo e múltiplos temas.

---

## ✨ Recursos

- ⚡ **Detecção Sem Complicações**:
  - **Modo Local Windows (Padrão)**: Detecta o Spotify aberto no PC nativamente via Windows Media API (SMTC) **sem precisar de login, conta de desenvolvedor ou credenciais**. As capas são buscadas em alta resolução (HD) automaticamente.
  - **Spotify Web API Oficial**: Permite conectar via OAuth oficial para streamers que preferem o backend do Spotify.
  - **Modo Demonstração**: Permite testar faixas e personalizar sem precisar abrir o Spotify.
  -
- 🎨 **7 Temas Visuais Exclusivos**:
  1. **Glassmorphism Pro**: Vidro translúcido com desfoque (*backdrop-filter: blur*), aura colorida e brilho sutil.
  2. **Disco de Vinil (Vinyl Record)**: Capa do álbum em um disco de vinil giratório realista que para suavemente quando a música pausa.
  3. **Cyberpunk Neon**: Estilo futurista com bordas recortadas e iluminação neon.
  4. **Minimal Clean**: Visual refinado estilo Apple Music e widgets iOS.
  5. **Pílula Compacta (Streamer)**: Formato super compacto para cantos de tela de streams e gameplays.
  6. **Fita Cassete Retrô**: Visual nostálgico com estética lo-fi.
  7. **Spotify Card Modern**: O design escuro icônico do aplicativo Spotify.
  -
- 🌈 **Cores & Efeitos Dinâmicos**:
  - Extração inteligente de cores dominantes da capa do álbum.
  - Seletor de cores manuais para fundo, texto, artista e destaques.
  - Controle de opacidade (para não tampar sua gameplay) e intensidade de brilho.
  - 
- 🔤 **Tipografia Personalizável**:
  - Fontes integradas: *Outfit*, *Inter*, *Poppins*, *Montserrat*, *JetBrains Mono*, *Space Grotesk*.
  - Efeito Marquee (texto que desliza automaticamente se o título for longo).
  - 
- ⚙️ **Customização Completa de Elementos**:
  - Ocultar/Exibir Capa, Barra de Progresso, Tempo Decorrido, Equalizador Dançante e Selo Spotify.
  - Opção para esconder o overlay automaticamente ao pausar a música (com tempo ajustável).
  - 
- 🔄 **Sincronização em Tempo Real (WebSocket)**: Qualquer alteração feita no painel reflete instantaneamente no OBS sem precisar recarregar o navegador!

---

## 🌐 Publicação na Web & Modo Multi-Usuário (Deploy)

O sistema agora possui arquitetura **Multi-Tenant** com autenticação oficial do Spotify em 1 clique. Qualquer streamer pode acessar o seu site, conectar sua conta do Spotify e obter seu próprio link exclusivo para o OBS Studio.

### 1. Como Configurar o Spotify Developer (Apenas para o Dono do Site)
1. Acesse o [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) e faça login.
2. Clique em **Create app**:
   - **App name**: `Whale OBS Overlay` (ou o nome do seu projeto)
   - **App description**: `Overlay moderno do Spotify para OBS Studio`
   - **Redirect URIs**:
     - Para testes locais: `http://localhost:3000/auth/spotify/callback`
     - Para seu domínio público: `https://seu-dominio.com/auth/spotify/callback` (ex: no Railway ou Render)
   - Selecione a API **Web API** e salve.
3. No painel do seu app no Spotify, vá em **Settings** e copie o **Client ID** e o **Client Secret**.
4. Crie ou edite o arquivo `.env` na raiz do projeto:
   ```env
   PORT=3000
   SPOTIFY_CLIENT_ID=seu_client_id_aqui
   SPOTIFY_CLIENT_SECRET=seu_client_secret_aqui
   BASE_URL=https://seu-dominio.com
   ```

### 2. O que o Streamer / Usuário faz?
- O usuário apenas entra no site e clica no botão **"Conectar Spotify"**.
- Ele autoriza com 1 clique e recebe o link exclusivo do overlay (ex: `https://seu-site.com/overlay?id=usr_abc123`).
- **100% das capas** são entregues em alta resolução direto dos servidores do Spotify (`i.scdn.co`), funcionando com qualquer música, artista indie, podcast ou plataforma.

### 3. Opções Gratuitas de Deploy Recomendadas:
- **[Railway](https://railway.app/)** ou **[Render](https://render.com/)**: Conecte seu repositório GitHub, adicione as variáveis de ambiente `SPOTIFY_CLIENT_ID` e `SPOTIFY_CLIENT_SECRET` e o deploy é automático com HTTPS gratuito!
- **VPS (Ubuntu / Debian)**: Clone o repositório, rode `npm install`, preencha o `.env` e execute com `pm2 start server.js`.

