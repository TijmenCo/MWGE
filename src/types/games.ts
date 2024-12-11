export type MinigameType = 
  | 'whackamole'
  | 'buttonmash'
  | 'colorclick'
  | 'quickmath'
  | 'typespeed'
  | 'memorymatch'
  | 'reactiontime'
  | 'wordscramble'
  | 'votingquestion'
  | 'quiz';

export interface MinigameConfig {
  type: MinigameType;
  name: string;
  description: string;
  duration: number;
  maxScore: number;
  instruction: string;
  votingQuestion?: {
    id: string;
    text: string;
  };
}

export interface MinigameState {
  currentGame: MinigameConfig | null;
  timeLeft: number;
  scores: Record<string, number>;
  gameData?: any;
  votingState?: {
    currentQuestion: {
      id: string;
      text: string;
    } | null;
    votes: Record<string, string>;
    results: Array<{
      username: string;
      votes: number;
    }> | null;
  };
}