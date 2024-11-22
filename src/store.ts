import { create } from 'zustand';

interface Store {
  currentUser: string;
  userColor: string;
  spotifyDisplayName: string;
  setCurrentUser: (username: string) => void;
  setUserColor: (color: string) => void;
  setSpotifyDisplayName: (displayName: string) => void;
}

export const useStore = create<Store>((set) => ({
  currentUser: '',
  userColor: '#FF6B6B', // Default color
  spotifyDisplayName: '',
  setCurrentUser: (username) => set({ currentUser: username }),
  setUserColor: (color) => set({ userColor: color }),
  setSpotifyDisplayName: (displayName) => set({ spotifyDisplayName: displayName }),
}));

export default useStore;