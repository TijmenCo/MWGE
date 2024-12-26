// Game types categorization
const QUESTION_GAMES = ['quiz'];
const VOTING_GAMES = ['votingquestion']
const ACTION_GAMES = ['buttonmash', 'colorclick', 'quickmath', 'typespeed', 'memorymatch', 'reactiontime', 'wordscramble', 'fallingcatch', 'targetshoot'];
const GAMBLING_GAMES = ['roulette'];

// Sequence templates
const SEQUENCE_TEMPLATES = {
  standard: {
    name: 'Standard Mix',
    description: 'A balanced mix of questions, action games, and gambling',
    pattern: ['question', 'action', 'voting', 'action', 'gambling']
  },
  gamblingParadise: {
    name: 'Gambling Paradise',
    description: 'For those feeling lucky! Alternates between action and gambling games',
    pattern: ['action', 'gambling', 'action', 'gambling', 'action']
  },
  brainTeaser: {
    name: 'Brain Teaser',
    description: 'Test your knowledge with quiz and voting questions',
    pattern: ['question', 'question', 'question', 'question', 'question']
  },
  actionPacked: {
    name: 'Action Packed',
    description: 'Fast-paced action games to test your reflexes',
    pattern: ['action', 'action', 'action', 'action', 'action']
  },
  casinoNight: {
    name: 'Casino Night',
    description: 'All gambling, all the time!',
    pattern: ['gambling', 'gambling', 'gambling', 'gambling', 'gambling']
  }
};

export function generateGameSequence(totalRounds, sequenceType) {

  console.log(sequenceType)

  if (!sequenceType) {
    sequenceType = 'standard'
  }

  const sequence = [];
  let questionGameIndex = 0;
  let votingGameIndex = 0;
  let actionGameIndex = 0;
  let gamblingGameIndex = 0;

  const template = SEQUENCE_TEMPLATES[sequenceType] || SEQUENCE_TEMPLATES.standard;
  const pattern = template.pattern;

  // Generate exactly totalRounds number of games
  for (let i = 0; i < totalRounds; i++) {
    const sequenceType = pattern[i % pattern.length];
    let gameType;

    switch (sequenceType) {
      case 'gambling':
        gameType = GAMBLING_GAMES[gamblingGameIndex % GAMBLING_GAMES.length];
        gamblingGameIndex++;
        break;
      case 'question':
        gameType = QUESTION_GAMES[questionGameIndex % QUESTION_GAMES.length];
        questionGameIndex++;
        break;
      case 'voting':
        gameType = VOTING_GAMES[votingGameIndex % VOTING_GAMES.length];
        votingGameIndex++;
        break;
      case 'action':
        // Randomly select an action game without immediate repetition
        do {
          gameType = ACTION_GAMES[Math.floor(Math.random() * ACTION_GAMES.length)];
        } while (sequence.length > 0 && sequence[sequence.length - 1] === gameType);
        actionGameIndex++;
        break;
    }

    sequence.push(gameType);
  }

  return sequence;
}

export function getSequenceTemplates() {
  return Object.entries(SEQUENCE_TEMPLATES).map(([id, template]) => ({
    id,
    ...template
  }));
}