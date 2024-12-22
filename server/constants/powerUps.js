export const POWER_UPS = [
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
    id: 'bussen',
    name: 'Bussen',
    description: 'Start a game of Bussen! The person who casted this game is the dealer, every question that the dealer gets right, he can give a sip to another player! Players take turns guessing card colors (red/black), high/low, inside/outside, and suit. Wrong guesses mean drinks!',
    cost: 100,
    type: 'drink',
    effect: 'all_game',
    icon: '🚌',
    target: 'all',
    uses: 1
  },
  {
    id: 'categories',
    name: 'Categories',
    description: 'The caster of this game gets to pick a category (e.g., "Car Brands"). Go around the circle - each player names something in that category. Whoever can\'t think of one drinks! Furthermore, all the brands that the caster gets right, he can give out to other players!',
    cost: 55,
    type: 'all_game',
    effect: 'all_game',
    icon: '📝',
    target: 'all',
    uses: 1
  },
  {
    id: 'never-have-i-ever',
    name: 'Never Have I Ever',
    description: 'Everyone holds up 3 fingers. Take turns saying things you\'ve never done. Those who have done it put a finger down. First to 0 drinks!',
    cost: 55,
    type: 'all_game',
    effect: 'all_game',
    icon: '🖐️',
    target: 'all',
    uses: 1
  },
  {
    id: 'waterfall',
    name: 'Waterfall',
    description: 'Everyone starts drinking at the same time. No one can stop until the person before them stops!',
    cost: 60,
    type: 'drink',
    effect: 'start_waterfall',
    icon: '🌊',
    target: 'all',
    uses: 1
  }
];