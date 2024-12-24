// Game types categorization
const QUESTION_GAMES = ['quiz', 'votingquestion'];
const ACTION_GAMES = ['buttonmash', 'colorclick', 'quickmath', 'typespeed', 'memorymatch', 'reactiontime', 'wordscramble', 'fallingcatch', 'targetshoot'];
const GAMBLING_GAMES = ['roulette'];

// Sequence template: 2 question games followed by 1 action game
const SEQUENCE_TEMPLATE = ['question', 'action', 'question', 'action', 'gambling'];

export function generateGameSequence(totalRounds) {
  const sequence = [];
  let questionGameIndex = 0;
  let actionGameIndex = 0;

  // Generate exactly totalRounds number of games
  for (let i = 0; i < totalRounds; i++) {
    const sequenceType = SEQUENCE_TEMPLATE[i % SEQUENCE_TEMPLATE.length];
    let gameType;

    if (sequenceType === 'gambling') {
      gameType = GAMBLING_GAMES[questionGameIndex % GAMBLING_GAMES.length];
      questionGameIndex++;
    } else if (sequenceType === 'question') {
      gameType = QUESTION_GAMES[questionGameIndex % QUESTION_GAMES.length];
      questionGameIndex++;
    } else {
      // Randomly select an action game without immediate repetition
      do {
        gameType = ACTION_GAMES[Math.floor(Math.random() * ACTION_GAMES.length)];
      } while (sequence.length > 0 && sequence[sequence.length - 1] === gameType);
      actionGameIndex++;
    }

    sequence.push(gameType);
  }

  return sequence;
}