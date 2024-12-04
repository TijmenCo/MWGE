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
  redirectUri: `http://localhost:3000/`
};

let accessToken: string | null = null;
let tokenExpirationTime: number | null = null;

// Cache for Spotify user display names
const userDisplayNameCache = new Map<string, string>();

export async function getSpotifyUserProfile(userId: string): Promise<{ id: string; displayName: string }> {
  // Check cache first
  if (userDisplayNameCache.has(userId)) {
    return {
      id: userId,
      displayName: userDisplayNameCache.get(userId)!
    };
  }

  try {
    const userData = await spotifyFetch(`/users/${userId}`);
    const displayName = userData.display_name || userId;
    
    // Cache the result
    userDisplayNameCache.set(userId, displayName);
    
    return {
      id: userId,
      displayName
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      id: userId,
      displayName: userId // Fallback to userId if we can't fetch the display name
    };
  }
}

export async function fetchUserTopTracks(userProfileUrl: string): Promise<Track[]> {
  try {
    const userId = userProfileUrl.match(/user\/([a-zA-Z0-9]+)/)?.[1];
    if (!userId) throw new Error('Invalid Spotify profile URL');

    // First, fetch the user's profile to get their display name
    const userProfile = await getSpotifyUserProfile(userId);

    // Fetch user's top tracks
    const response = await spotifyFetch('/me/top/tracks?limit=50&time_range=long_term');
    const tracks = response.items;

    // Randomly select 10 tracks
    const shuffledTracks = tracks.sort(() => Math.random() - 0.5);
    const selectedTracks = shuffledTracks.slice(0, 10);

    console.log(selectedTracks);

    return selectedTracks.map((track: any) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((artist: any) => artist.name).join(', '),
      addedBy: {
        id: userId,
        displayName: userProfile.displayName
      }
    }));
  } catch (error) {
    console.error('Error fetching user top tracks:', error);
    throw error;
  }
}

export function getSpotifyLoginUrl(): string {
  const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-library-read',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-top-read'
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
  if (!accessToken) {
    throw new Error('No access token available');
  }

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
    const errorData = await response.json();
    throw new Error(`Spotify API request failed: ${errorData.error?.message || 'Unknown error'}`);
  }

  return response.json();
}

async function fetchPlaylistTracks(playlistId: string, offset: number = 0): Promise<any> {
  return spotifyFetch(
    `/playlists/${playlistId}/tracks?fields=items(track(id,name,artists),added_by.id)&offset=${offset}&limit=50`
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
      const additionalRequests = Array.from({ length: Math.ceil(remainingTracks / 50) }, (_, i) =>
        fetchPlaylistTracks(playlistId, (i + 1) * 50)
      );

      const additionalData = await Promise.all(additionalRequests);
      allTracks = [
        ...allTracks,
        ...additionalData.flatMap(data => data.items)
      ];
    }

    // Get unique user IDs who added tracks
    const uniqueUserIds = [...new Set(allTracks.map((item: any) => item.added_by.id))];

    // Fetch display names for all users in parallel
    const userProfiles = await Promise.all(
      uniqueUserIds.map(userId => getSpotifyUserProfile(userId))
    );

    // Create a map of user IDs to display names
    const userDisplayNames = Object.fromEntries(
      userProfiles.map(profile => [profile.id, profile.displayName])
    );

    // Map tracks with user display names
    return allTracks.map((item: any) => ({
      id: item.track.id,
      title: item.track.name,
      artist: item.track.artists.map((artist: any) => artist.name).join(', '),
      addedBy: {
        id: item.added_by.id,
        displayName: userDisplayNames[item.added_by.id]
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