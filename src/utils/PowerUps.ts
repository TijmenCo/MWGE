import { PowerUp } from '../types/shop';

export interface WheelSegment {
  id: string;
  label: string;
  probability: number;
  color: string;
  effect?: 'self_drink' | 'lose_points' | 'double_points' | 'jackpot';
}

export const POWER_UPS: PowerUp[] = [
  {
    id: 'take-sip',
    name: 'Take a Sip',
    description: 'Make someone take a sip of their drink',
    cost: 10,
    type: 'drink',
    effect: 'make_drink',
    icon: '🍺',
    target: 'single',
    uses: 1
  },
  {
    id: 'take-shot',
    name: 'Take a Shot',
    description: 'Make someone take a shot',
    cost: 50,
    type: 'drink',
    effect: 'make_shot',
    icon: '🥃',
    target: 'single',
    uses: 1
  },
  {
    id: 'everyone-drinks',
    name: 'Everyone Drinks',
    description: 'Everyone takes a sip!',
    cost: 20,
    type: 'drink',
    effect: 'all_drink',
    icon: '🍻',
    target: 'all',
    uses: 1
  },
  {
    id: 'Chug',
    name: 'chug your drink!',
    description: 'Make someone chug their drink!',
    cost: 70,
    type: 'drink',
    effect: 'make_drink',
    icon: '🍺🍺🍺',
    target: 'single',
    uses: 1
  },
  {
    id: 'waterfall',
    name: 'Waterfall',
    description: 'Start a waterfall! Everyone drinks until the person before them stops!',
    cost: 200,
    type: 'drink',
    effect: 'waterfall',
    icon: '🌊',
    target: 'all',
    uses: 1
  }
];

export const WHEEL_SEGMENTS: WheelSegment[] = [
  {
    id: 'mega-shot',
    label: 'Mega Shot',
    probability: 0.1,
    color: '#FF6B6B'
  },
  {
    id: 'waterfall',
    label: 'Waterfall',
    probability: 0.05,
    color: '#4ECDC4'
  },
  {
    id: 'immunity',
    label: 'Immunity',
    probability: 0.15,
    color: '#45B7D1'
  },
  {
    id: 'drink-self',
    label: 'Drink!',
    probability: 0.3,
    color: '#96CEB4',
    effect: 'self_drink'
  },
  {
    id: 'lose-half',
    label: 'Lose 50%',
    probability: 0.2,
    color: '#FFEEAD',
    effect: 'lose_points'
  },
  {
    id: 'double',
    label: 'Double Points',
    probability: 0.1,
    color: '#D4A5A5',
    effect: 'double_points'
  },
  {
    id: 'jackpot',
    label: 'Jackpot!',
    probability: 0.1,
    color: '#9B59B6',
    effect: 'jackpot'
  }
];

export function getPowerUpById(id: string): PowerUp | undefined {
  return POWER_UPS.find(powerUp => powerUp.id === id);
}

export function canAffordPowerUp(points: number, powerUp: PowerUp): boolean {
  return points >= powerUp.cost;
}