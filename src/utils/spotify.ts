import { Track } from '../types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export const spotifyConfig: SpotifyConfig = {
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
  redirectUri: `http://localhost:5173/`
};

let accessToken: string | null = null;
let tokenExpirationTime: number | null = null;

export function getSpotifyLoginUrl(): string {
  const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-library-read',
  ];
  
  const params = new URLSearchParams({
    client_id: spotifyConfig.clientId,
    response_type: 'code',
    redirect_uri: spotifyConfig.redirectUri,
    scope: scopes.join(' '),
    show_dialog: 'true'
  });

  accessToken = `https://accounts.spotify.com/authorize?${params.toString()}`;

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function handleSpotifyCallback(code: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: spotifyConfig.redirectUri,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`)}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpirationTime = Date.now() + (data.expires_in * 1000);

  return accessToken;
}

async function spotifyFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      accessToken = null;
      tokenExpirationTime = null;
      window.location.href = getSpotifyLoginUrl();
      throw new Error('Authentication required');
    }
    throw new Error('Spotify API request failed');
  }

  return response.json();
}

async function fetchPlaylistTracks(playlistId: string, offset: number = 0): Promise<any> {
  return spotifyFetch(
    `/playlists/${playlistId}/tracks?fields=items(track(id,name,artists),added_by.id,added_by.display_name),total&offset=${offset}&limit=50`
  );
}

export async function fetchSpotifyPlaylist(playlistUrl: string): Promise<Track[]> {
  try {
    const playlistId = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
    if (!playlistId) throw new Error('Invalid Spotify playlist URL');

    // Get initial tracks and total count
    const initialData = await fetchPlaylistTracks(playlistId);
    const totalTracks = initialData.total;
    let allTracks = initialData.items;

    // Calculate number of additional requests needed
    const remainingTracks = totalTracks - 50;
    if (remainingTracks > 0) {
      const additionalRequests = Math.ceil(remainingTracks / 50);
      const requests = Array.from({ length: additionalRequests }, (_, i) =>
        fetchPlaylistTracks(playlistId, (i + 1) * 50)
      );

      const additionalData = await Promise.all(requests);
      allTracks = [
        ...allTracks,
        ...additionalData.flatMap(data => data.items)
      ];

      console.log(allTracks)
    }

    // Map tracks and identify users without display names
    const tracks = allTracks.map((item: any) => ({
      id: item.track.id,
      title: item.track.name,
      artist: item.track.artists.map((artist: any) => artist.name).join(', '),
      addedBy: {
        id: item.added_by.id,
        displayName: item.added_by.display_name || null
      }
    }));

    // Find unique user IDs without display names
    const missingDisplayNames = tracks
      .filter((track: { addedBy: { displayName: any; }; }) => !track.addedBy.displayName)
      .map((track: { addedBy: { id: any; }; }) => track.addedBy.id);

    const uniqueUserIds = [...new Set(missingDisplayNames)];
    const displayNamePromises = uniqueUserIds.map(async (userId) => {
      const userData = await spotifyFetch(`/users/${userId}`);
      return { id: userId, displayName: userData.display_name || userId };
    });

    const displayNames = await Promise.all(displayNamePromises);
    const displayNameMap = Object.fromEntries(displayNames.map(user => [user.id, user.displayName]));
    
    return tracks.map((track: { addedBy: { id: string | number; displayName: any; }; }) => ({
      ...track,
      addedBy: {
        id: track.addedBy.id,
        displayName: track.addedBy.displayName || displayNameMap[track.addedBy.id]
      }
    }));

  } catch (error) {
    console.error('Error fetching Spotify playlist:', error);
    throw error;
  }
}

export async function getCurrentSpotifyToken(): Promise<string | null> {
  return accessToken;
}

export async function setCookieSpotifyToken(cookie: string) {
  accessToken = cookie;
}

export function isSpotifyAuthenticated(): boolean {
  return !!accessToken && !!tokenExpirationTime && Date.now() < tokenExpirationTime;
}