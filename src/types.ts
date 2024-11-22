export interface Track {
  id: string;
  title: string;
  artist: string;
  videoId?: string;
  addedBy?: {
    id: string;
    displayName: string;
  };
}