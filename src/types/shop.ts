export interface PowerUp {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'drink';
  effect: 'make_drink' | 'make_shot' | 'all_drink' | 'waterfall' | 'mega_shot' | 'immunity';
  icon: string;
  target: 'single' | 'multi' | 'all' | 'self';
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

export interface GambleResult {
  username: string;
  result: string;
  newPoints: number;
  inventory: Record<string, number>;
}