import { PowerUp } from '../types/shop';

export const POWER_UPS: PowerUp[] = [
  {
    id: 'double-points',
    name: 'Double Points',
    description: 'Double your points for the next minigame',
    cost: 100,
    type: 'buff',
    effect: 'multiply_score',
    icon: '✨',
    duration: 1,
    uses: 1
  },
  {
    id: 'time-freeze',
    name: 'Time Freeze',
    description: 'Add 5 seconds to the current game timer',
    cost: 150,
    type: 'utility',
    effect: 'add_time',
    icon: '⏰',
    uses: 1
  },
  {
    id: 'confusion',
    name: 'Confusion',
    description: 'Reverse controls for all other players',
    cost: 200,
    type: 'debuff',
    effect: 'reverse_controls',
    icon: '🌀',
    duration: 1,
    uses: 1
  },
  {
    id: 'shield',
    name: 'Shield',
    description: 'Block the next debuff used against you',
    cost: 125,
    type: 'utility',
    effect: 'block_debuff',
    icon: '🛡️',
    uses: 1
  },
  {
    id: 'point-steal',
    name: 'Point Steal',
    description: 'Steal 50 points from a random player',
    cost: 300,
    type: 'debuff',
    effect: 'steal_points',
    icon: '💰',
    uses: 1
  }
];

export function getPowerUpById(id: string): PowerUp | undefined {
  return POWER_UPS.find(powerUp => powerUp.id === id);
}

export function canAffordPowerUp(points: number, powerUp: PowerUp): boolean {
  return points >= powerUp.cost;
}