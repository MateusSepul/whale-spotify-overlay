const configStore = require('./config-store');

class SpotifyApi {
  constructor() {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
  }

  getAuthUrl(clientId, redirectUri) {
    const scopes = encodeURIComponent('user-read-currently-playing user-read-playback-state');
    return `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  async exchangeCodeForTokens(code, clientId, clientSecret, redirectUri) {
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

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);

    // Salvar refresh token nas configurações
    configStore.save({
      spotifyRefreshToken: data.refresh_token,
      spotifyClientId: clientId,
      spotifyClientSecret: clientSecret,
      detectionMode: 'api'
    });

    return data;
  }

  async refreshAccessToken() {
    const config = configStore.get();
    if (!config.spotifyRefreshToken || !config.spotifyClientId || !config.spotifyClientSecret) {
      return null;
    }

    const authHeader = Buffer.from(`${config.spotifyClientId}:${config.spotifyClientSecret}`).toString('base64');
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: config.spotifyRefreshToken
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
        console.error('Falha ao atualizar token do Spotify:', await response.text());
        return null;
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);
      if (data.refresh_token) {
        configStore.save({ spotifyRefreshToken: data.refresh_token });
      }
      return this.accessToken;
    } catch (err) {
      console.error('Erro ao chamar refresh token Spotify:', err.message);
      return null;
    }
  }

  async getValidToken() {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }
    return await this.refreshAccessToken();
  }

  async getCurrentlyPlaying() {
    const token = await this.getValidToken();
    if (!token) return null;

    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 204 || res.status > 300) {
        return null; // Nada tocando ou erro
      }

      const data = await res.json();
      if (!data || !data.item) return null;

      const item = data.item;
      const images = item.album && item.album.images ? item.album.images : [];
      const coverUrl = images.length > 0 ? images[0].url : null;
      const artists = item.artists ? item.artists.map(a => a.name).join(', ') : 'Desconhecido';

      return {
        title: item.name,
        artist: artists,
        album: item.album ? item.album.name : '',
        coverUrl: coverUrl,
        isPlaying: data.is_playing,
        position: Math.floor((data.progress_ms || 0) / 1000),
        duration: Math.floor((item.duration_ms || 0) / 1000),
        source: 'spotify_api'
      };
    } catch (err) {
      console.error('Erro ao buscar currently playing da API Spotify:', err.message);
      return null;
    }
  }
}

module.exports = new SpotifyApi();
