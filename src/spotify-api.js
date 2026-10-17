const userStore = require('./user-store');

class SpotifyApi {
  getClientCredentials() {
    const clientId = process.env.SPOTIFY_CLIENT_ID || '';
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
    return { clientId, clientSecret };
  }

  isConfigured() {
    const { clientId, clientSecret } = this.getClientCredentials();
    return Boolean(clientId && clientSecret);
  }

  getAuthUrl(redirectUri, state = 'default') {
    const { clientId } = this.getClientCredentials();
    if (!clientId) {
      throw new Error('SPOTIFY_CLIENT_ID não está configurado nas variáveis de ambiente (.env).');
    }

    const scopes = encodeURIComponent([
      'user-read-currently-playing',
      'user-read-playback-state',
      'user-read-email',
      'user-read-private'
    ].join(' '));

    return `https://accounts.spotify.com/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
  }

  async exchangeCodeForTokens(code, redirectUri) {
    const { clientId, clientSecret } = this.getClientCredentials();
    if (!clientId || !clientSecret) {
      throw new Error('Credenciais do Spotify (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET) não configuradas no servidor.');
    }

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Falha na autorização do Spotify: ${err}`);
    }

    return await response.json();
  }

  async getUserProfile(accessToken) {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Falha ao obter perfil do Spotify: ${text}`);
    }

    return await res.json();
  }

  async getValidTokenForUser(user) {
    if (!user || !user.spotify) return null;
    const spotify = user.spotify;

    // Se o token ainda tem mais de 60 segundos de validade, reutiliza
    if (spotify.accessToken && spotify.tokenExpiresAt && Date.now() < (spotify.tokenExpiresAt - 60000)) {
      return spotify.accessToken;
    }

    if (!spotify.refreshToken) return null;

    const { clientId, clientSecret } = this.getClientCredentials();
    if (!clientId || !clientSecret) {
      console.warn('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET não configurados para renovar token.');
      return null;
    }

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: spotify.refreshToken
    });

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        console.error(`Falha ao atualizar token Spotify para usuário ${user.id}:`, await response.text());
        return null;
      }

      const data = await response.json();
      spotify.accessToken = data.access_token;
      spotify.tokenExpiresAt = Date.now() + ((data.expires_in || 3600) * 1000);
      if (data.refresh_token) {
        spotify.refreshToken = data.refresh_token;
      }

      userStore.saveUser(user.id, user);
      return spotify.accessToken;
    } catch (err) {
      console.error(`Erro ao renovar token Spotify para usuário ${user.id}:`, err.message);
      return null;
    }
  }

  async getCurrentlyPlayingForUser(user) {
    const token = await this.getValidTokenForUser(user);
    if (!token) return null;

    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 204 || res.status > 300) {
        return { isPlaying: false, title: '', artist: '' };
      }

      const data = await res.json();
      if (!data || !data.item) {
        return { isPlaying: false, title: '', artist: '' };
      }

      const item = data.item;
      const images = item.album && item.album.images ? item.album.images : [];
      // image[0] é sempre a imagem de mais alta resolução no Spotify (640x640)
      const coverUrl = images.length > 0 ? images[0].url : null;
      const artists = item.artists ? item.artists.map(a => a.name).join(', ') : 'Desconhecido';

      return {
        title: item.name,
        artist: artists,
        album: item.album ? item.album.name : '',
        coverUrl: coverUrl || 'https://raw.githubusercontent.com/feathericons/feather/master/icons/music.svg',
        isPlaying: Boolean(data.is_playing),
        position: Math.floor((data.progress_ms || 0) / 1000),
        duration: Math.floor((item.duration_ms || 0) / 1000),
        source: 'spotify_api'
      };
    } catch (err) {
      console.error(`Erro ao buscar currently playing da API Spotify para ${user.id}:`, err.message);
      return null;
    }
  }
}

module.exports = new SpotifyApi();
