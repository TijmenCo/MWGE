import { Track } from '../types';
import {
  SpotifyArtist,
  SpotifyPlaylist,
  SpotifyPlaylistTrack,
  SpotifyTracksResponse,
  SpotifyUserProfile,
  SpotifyPlaylistResponse
} from '../types/spotify';

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
  if (userDisplayNameCache.has(userId)) {
    return {
      id: userId,
      displayName: userDisplayNameCache.get(userId)!
    };
  }

  try {
    const userData = await spotifyFetch<SpotifyUserProfile>(`/users/${userId}`);
    const displayName = userData.display_name || userId;
    userDisplayNameCache.set(userId, displayName);
    
    return {
      id: userId,
      displayName
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      id: userId,
      displayName: userId
    };
  }
}

async function fetchUserPlaylists(userId: string): Promise<SpotifyPlaylist[]> {
  try {
    const response = await spotifyFetch<SpotifyPlaylistResponse>(`/users/${userId}/playlists?limit=50`);
    return (response.items || []).filter((playlist): playlist is SpotifyPlaylist => 
      playlist !== null &&
      typeof playlist.id === 'string' &&
      playlist.tracks?.total > 0
    );
  } catch (error) {
    console.error(`Error fetching playlists for user ${userId}:`, error);
    return [];
  }
}

async function fetchPlaylistTracks(playlistId: string): Promise<SpotifyPlaylistTrack[]> {
  try {
    const response = await spotifyFetch<SpotifyTracksResponse>(`/playlists/${playlistId}/tracks?limit=50`);
    return (response.items || []).filter((item): item is SpotifyPlaylistTrack => 
      item !== null &&
      item.track?.id !== undefined &&
      item.track?.name !== undefined &&
      Array.isArray(item.track?.artists)
    );
  } catch (error) {
    console.error(`Error fetching tracks for playlist ${playlistId}:`, error);
    return [];
  }
}

export async function fetchUserTopTracks(userProfileUrl: string): Promise<Track[]> {
  try {
    const userId = userProfileUrl.match(/user\/([a-zA-Z0-9]+)/)?.[1];
    if (!userId) {
      console.error('Invalid Spotify profile URL:', userProfileUrl);
      return [];
    }

    const userProfile = await getSpotifyUserProfile(userId);
    const playlists = await fetchUserPlaylists(userId);
    
    if (playlists.length === 0) {
      console.log(`No valid playlists found for user ${userId}`);
      return [];
    }

    const playlistTracksPromises = playlists
      .slice(0, 3)
      .map(playlist => fetchPlaylistTracks(playlist.id));

    const playlistTracks = await Promise.all(playlistTracksPromises);

    const allTracks = playlistTracks
      .flat()
      .filter((item): item is SpotifyPlaylistTrack => 
        item?.track?.id !== undefined &&
        item?.track?.name !== undefined &&
        Array.isArray(item?.track?.artists) &&
        item.track.artists.length > 0
      )
      .map(item => ({
        id: item.track.id,
        title: item.track.name,
        artist: item.track.artists
          .filter((artist): artist is SpotifyArtist => 
            artist !== null && typeof artist.name === 'string'
          )
          .map(artist => artist.name)
          .join(', '),
        addedBy: {
          id: userId,
          displayName: userProfile.displayName
        }
      }));

    if (allTracks.length === 0) {
      console.log(`No valid tracks found in playlists for user ${userId}`);
      return [];
    }

    return allTracks
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(10, allTracks.length));

  } catch (error) {
    console.error('Error fetching user tracks:', error);
    return [];
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

async function spotifyFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

export async function fetchSpotifyPlaylist(playlistUrl: string): Promise<Track[]> {
  try {
    const playlistId = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
    if (!playlistId) throw new Error('Invalid Spotify playlist URL');

    const initialData = await spotifyFetch<SpotifyTracksResponse>(
      `/playlists/${playlistId}/tracks?fields=items(track(id,name,artists),added_by.id)&limit=50`
    );
    
    const totalTracks = initialData.total;
    let allTracks = initialData.items;

    const remainingTracks = totalTracks - 50;
    if (remainingTracks > 0) {
      const additionalRequests = Array.from(
        { length: Math.ceil(remainingTracks / 50) },
        (_, i) => spotifyFetch<SpotifyTracksResponse>(
          `/playlists/${playlistId}/tracks?fields=items(track(id,name,artists),added_by.id)&offset=${(i + 1) * 50}&limit=50`
        )
      );

      const additionalData = await Promise.all(additionalRequests);
      allTracks = [
        ...allTracks,
        ...additionalData.flatMap(data => data.items)
      ];
    }

    const uniqueUserIds = [...new Set(allTracks
      .filter((item): item is SpotifyPlaylistTrack => 
        item?.added_by?.id !== undefined
      )
      .map(item => item.added_by.id)
    )];

    const userProfiles = await Promise.all(
      uniqueUserIds.map(userId => getSpotifyUserProfile(userId))
    );

    const userDisplayNames = Object.fromEntries(
      userProfiles.map(profile => [profile.id, profile.displayName])
    );

    return allTracks
      .filter((item): item is SpotifyPlaylistTrack => 
        item?.track?.id !== undefined &&
        item?.track?.name !== undefined &&
        Array.isArray(item?.track?.artists) &&
        item?.track?.artists.length > 0 &&
        item?.added_by?.id !== undefined
      )
      .map(item => ({
        id: item.track.id,
        title: item.track.name,
        artist: item.track.artists
          .filter((artist): artist is SpotifyArtist => 
            artist !== null && typeof artist.name === 'string'
          )
          .map(artist => artist.name)
          .join(', '),
        addedBy: {
          id: item.added_by.id,
          displayName: userDisplayNames[item.added_by.id] || 'Unknown User'
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

export async function setCookieSpotifyToken(cookie: string): Promise<void> {
  accessToken = cookie;
}

export function isSpotifyAuthenticated(): boolean {
  return !!accessToken && !!tokenExpirationTime && Date.now() < tokenExpirationTime;
}