import { PowerUp } from '../types/shop';

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
    id: 'waterfall',
    name: 'Waterfall',
    description: 'Start a waterfall! Everyone drinks until the person before them stops',
    cost: 80,
    type: 'drink',
    effect: 'waterfall',
    icon: '🌊',
    target: 'all',
    uses: 1
  }
];

export function getPowerUpById(id: string): PowerUp | undefined {
  return POWER_UPS.find(powerUp => powerUp.id === id);
}

export function canAffordPowerUp(points: number, powerUp: PowerUp): boolean {
  return points >= powerUp.cost;
}