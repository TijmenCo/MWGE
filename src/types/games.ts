export type MinigameType = 
  | 'whackamole'
  | 'buttonmash'
  | 'colorclick'
  | 'quickmath'
  | 'typespeed'
  | 'memorymatch';

export interface MinigameConfig {
  type: MinigameType;
  name: string;
  description: string;
  duration: number;
  maxScore: number;
  instruction: string;
}

export interface MinigameState {
  currentGame: MinigameConfig | null;
  timeLeft: number;
  scores: Record<string, number>;
  gameData?: any;
}