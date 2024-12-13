// Spotify API Response Types
export interface SpotifyArtist {
    id: string;
    name: string;
  }
  
  export interface SpotifyTrack {
    id: string;
    name: string;
    artists: SpotifyArtist[];
  }
  
  export interface SpotifyPlaylistTrack {
    track: SpotifyTrack;
    added_by: {
      id: string;
    };
  }
  
  export interface SpotifyPlaylist {
    id: string;
    snapshot_id: string;
    owner: {
      id: string;
    };
    tracks: {
      total: number;
    };
  }
  
  export interface SpotifyPlaylistResponse {
    items: SpotifyPlaylist[];
  }
  
  export interface SpotifyTracksResponse {
    items: SpotifyPlaylistTrack[];
    total: number;
  }
  
  export interface SpotifyUserProfile {
    id: string;
    display_name: string;
  }