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
  }
];