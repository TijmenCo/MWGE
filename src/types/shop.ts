export interface PowerUp {
    id: string;
    name: string;
    description: string;
    cost: number;
    type: 'buff' | 'debuff' | 'utility';
    effect: string;
    icon: string;
    duration?: number;
    uses?: number;
  }
  
  export interface PlayerInventory {
    powerUps: {
      [key: string]: number; // PowerUp ID -> quantity
    };
    points: number;
  }
  
  export interface ShopState {
    isOpen: boolean;
    inventory: PlayerInventory;
    selectedPowerUp: string | null;
  }