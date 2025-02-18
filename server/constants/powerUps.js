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
    id: 'take-block',
    name: 'Block',
    description: 'Send to someone to nullify their last send *drink* command',
    cost: 35,
    type: 'drink',
    effect: 'make_block',
    icon: '🛡️', // Shield emoji
    target: 'single',
    uses: 1
  },  
  {
    id: 'Chug',
    name: 'chug your drink!',
    description: 'Make someone chug their drink!',
    cost: 70,
    type: 'drink',
    effect: 'make_chug',
    icon: '🍺🍺🍺',
    target: 'single',
    uses: 1
  },
  {
    id: 'take-shot',
    name: 'Take a Shot',
    description: 'Make someone take a shot',
    cost: 70,
    type: 'drink',
    effect: 'make_shot',
    icon: '🥃',
    target: 'single',
    uses: 1
  },
  {
    id: 'bussen',
    name: 'Bussen',
    description: 'Start a game of Bussen! The person who casted this game is the dealer, every question that the dealer gets right, he can give a sip to another player! Players take turns guessing card colors (red/black), high/low, inside/outside, and suit. Wrong guesses mean drinks!',
    cost: 100,
    type: 'all_game',
    effect: 'all_game',
    icon: '🚌',
    target: 'all',
    uses: 1
  },
  {
    id: 'categories',
    name: 'Categories',
    description: 'The caster of this game gets to pick a category (e.g., "Car Brands"). Go around the circle - each player names something in that category. Whoever can\'t think of one drinks! Furthermore, all the brands that the caster gets right, he can give out to other players!',
    cost: 50,
    type: 'all_game',
    effect: 'all_game',
    icon: '📝',
    target: 'all',
    uses: 1
  },
  {
    id: 'waterfall',
    name: 'Waterfall',
    description: 'Everyone starts drinking at the same time. No one can stop until the person before them stops! The caster of this game can decide at anytime to stop drinking',
    cost: 50,
    type: 'drink',
    effect: 'all_game',
    icon: '🌊',
    target: 'all',
    uses: 1
  },
  {
    id: 'number_drinking',
    name: 'Number Drinking',
    description: 'The caster chooses a number (for example, 7). Whenever that number or its multiples come up, players must drink. Whenever the caster gets a number right, he can give out a sip!',
    cost: 50,
    type: 'all_game',
    effect: 'all_game',
    icon: '🔢',
    target: 'all',
    uses: 1
  }  
];