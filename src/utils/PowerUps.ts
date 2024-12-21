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
    id: 'Chug',
    name: 'chug your drink!',
    description: 'Make someone chug their drink!',
    cost: 70,
    type: 'drink',
    effect: 'make_drink',
    icon: '🍺',
    target: 'single',
    uses: 1
  }
];

export const MINI_UPS: PowerUp[] = [
  {
    id: 'bussen',
    name: 'Bussen',
    description: 'Start a game of Bussen! The person who casted this game is the dealer! Players take turns guessing card colors (red/black), high/low, inside/outside, and suit. Wrong guesses mean drinks!',
    cost: 30,
    type: 'drink',
    effect: 'start_bussen',
    icon: '🚌',
    target: 'all',
    uses: 1
  },
  {
    id: 'categories',
    name: 'Categories',
    description: 'The caster of this game gets to pick a category (e.g., "Car Brands"). Go around the circle - each player names something in that category. Whoever can\'t think of one drinks! Furthermore, all the brands that the caster gets right, he can give out to other players!',
    cost: 20,
    type: 'drink',
    effect: 'start_categories',
    icon: '📝',
    target: 'all',
    uses: 1
  },
  {
    id: 'never-have-i-ever',
    name: 'Never Have I Ever',
    description: 'Everyone holds up 3 fingers. Take turns saying things you\'ve never done. Those who have done it put a finger down. First to 0 drinks!',
    cost: 25,
    type: 'drink',
    effect: 'start_never',
    icon: '🖐️',
    target: 'all',
    uses: 1
  },
  {
    id: 'waterfall',
    name: 'Waterfall',
    description: 'Everyone starts drinking at the same time. No one can stop until the person before them stops!',
    cost: 40,
    type: 'drink',
    effect: 'start_waterfall',
    icon: '🌊',
    target: 'all',
    uses: 1
  }
];

export function getPowerUpById(id: string): PowerUp | undefined {
  return [...POWER_UPS, ...MINI_UPS].find(powerUp => powerUp.id === id);
}

export function canAffordPowerUp(points: number, powerUp: PowerUp): boolean {
  return points >= powerUp.cost;
}