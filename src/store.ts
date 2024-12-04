import { create } from 'zustand';

interface Store {
  currentUser: string;
  userColor: string;
  spotifyProfile: string;
  spotifyDisplayName: string;
  setCurrentUser: (username: string) => void;
  setUserColor: (color: string) => void;
  setSpotifyProfile: (url: string) => void;
  setSpotifyDisplayName: (name: string) => void;
}

export const useStore = create<Store>((set) => ({
  currentUser: '',
  userColor: '#FF6B6B',
  spotifyProfile: '',
  spotifyDisplayName: '',
  setCurrentUser: (username) => set({ currentUser: username }),
  setUserColor: (color) => set({ userColor: color }),
  setSpotifyProfile: (url) => set({ spotifyProfile: url }),
  setSpotifyDisplayName: (name) => set({ spotifyDisplayName: name }),
}));

export default useStore;