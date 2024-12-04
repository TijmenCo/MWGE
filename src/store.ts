import { create } from 'zustand';

interface Store {
  currentUser: string;
  userColor: string;
  spotifyProfile: string;
  setCurrentUser: (username: string) => void;
  setUserColor: (color: string) => void;
  setSpotifyProfile: (url: string) => void;
}

export const useStore = create<Store>((set) => ({
  currentUser: '',
  userColor: '#FF6B6B',
  spotifyProfile: '',
  setCurrentUser: (username) => set({ currentUser: username }),
  setUserColor: (color) => set({ userColor: color }),
  setSpotifyProfile: (url) => set({ spotifyProfile: url }),
}));

export default useStore;