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

async function fetchUserPlaylists(userId: string): Promise<any[]> {
  try {
    const response = await spotifyFetch(`/users/${userId}/playlists?limit=50`);
    // Filter out any null or invalid playlists
    return (response.items || []).filter(playlist => 
      playlist && 
      playlist.id && 
      playlist.tracks && 
      playlist.tracks.total > 0
    );
  } catch (error) {
    console.error(`Error fetching playlists for user ${userId}:`, error);
    return [];
  }
}

async function fetchPlaylistTracks(playlistId: string): Promise<any[]> {
  try {
    const response = await spotifyFetch(`/playlists/${playlistId}/tracks?limit=50`);
    // Filter out any null or invalid tracks
    return (response.items || []).filter(item => 
      item && 
      item.track && 
      item.track.id && 
      item.track.name && 
      item.track.artists
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

    // First, fetch the user's profile to get their display name
    const userProfile = await getSpotifyUserProfile(userId);

    // Fetch user's public playlists
    const playlists = await fetchUserPlaylists(userId);
    
    if (playlists.length === 0) {
      console.log(`No valid playlists found for user ${userId}`);
      return [];
    }

    // Get tracks from each playlist
    const playlistTracksPromises = playlists
      .slice(0, 3)
      .map(playlist => {
        if (!playlist || !playlist.id) {
          console.error('Invalid playlist object:', playlist);
          return Promise.resolve([]);
        }
        return fetchPlaylistTracks(playlist.id);
      });

    const playlistTracks = await Promise.all(playlistTracksPromises);

    // Flatten and transform tracks
    const allTracks = playlistTracks
      .flat()
      .filter(item => 
        item?.track?.id && 
        item?.track?.name && 
        item?.track?.artists?.length > 0
      )
      .map(item => ({
        id: item.track.id,
        title: item.track.name,
        artist: item.track.artists
          .filter((artist: any) => artist && artist.name)
          .map((artist: any) => artist.name)
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

    // Shuffle and select random tracks
    const shuffledTracks = allTracks
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(10, allTracks.length));

    return shuffledTracks;
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

async function fetchPlaylistTracksPage(playlistId: string, offset: number = 0): Promise<any> {
  return spotifyFetch(
    `/playlists/${playlistId}/tracks?fields=items(track(id,name,artists),added_by.id)&offset=${offset}&limit=50`
  );
}

export async function fetchSpotifyPlaylist(playlistUrl: string): Promise<Track[]> {
  try {
    const playlistId = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
    if (!playlistId) throw new Error('Invalid Spotify playlist URL');

    // Get initial tracks and total count
    const initialData = await fetchPlaylistTracksPage(playlistId);
    const totalTracks = initialData.total;
    let allTracks = initialData.items;

    // Calculate number of additional requests needed
    const remainingTracks = totalTracks - 50;
    if (remainingTracks > 0) {
      const additionalRequests = Array.from({ length: Math.ceil(remainingTracks / 50) }, (_, i) =>
        fetchPlaylistTracksPage(playlistId, (i + 1) * 50)
      );

      const additionalData = await Promise.all(additionalRequests);
      allTracks = [
        ...allTracks,
        ...additionalData.flatMap(data => data.items)
      ];
    }

    // Get unique user IDs who added tracks
    const uniqueUserIds = [...new Set(allTracks
      .filter(item => item?.added_by?.id)
      .map(item => item.added_by.id)
    )];

    // Fetch display names for all users in parallel
    const userProfiles = await Promise.all(
      uniqueUserIds.map(userId => getSpotifyUserProfile(userId))
    );

    // Create a map of user IDs to display names
    const userDisplayNames = Object.fromEntries(
      userProfiles.map(profile => [profile.id, profile.displayName])
    );

    // Map tracks with user display names
    return allTracks
      .filter(item => 
        item?.track?.id && 
        item?.track?.name && 
        item?.track?.artists?.length > 0 && 
        item?.added_by?.id
      )
      .map(item => ({
        id: item.track.id,
        title: item.track.name,
        artist: item.track.artists
          .filter((artist: any) => artist && artist.name)
          .map((artist: any) => artist.name)
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

export async function setCookieSpotifyToken(cookie: string) {
  accessToken = cookie;
}

export function isSpotifyAuthenticated(): boolean {
  return !!accessToken && !!tokenExpirationTime && Date.now() < tokenExpirationTime;
}