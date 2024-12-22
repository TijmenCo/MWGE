export interface PowerUp {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'drink' | 'all_game';
  effect: string;
  icon: string;
  target: 'single' | 'all';
  uses?: number;
}

export interface PlayerInventory {
  powerUps: {
    [key: string]: number;
  };
  points: number;
}

export interface ShopState {
  isOpen: boolean;
  inventory: PlayerInventory;
  selectedPowerUp: string | null;
}