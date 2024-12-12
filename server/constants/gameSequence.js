// Game types categorization
const QUESTION_GAMES = ['quiz', 'votingquestion'];
const ACTION_GAMES = ['buttonmash', 'colorclick', 'quickmath', 'typespeed', 'memorymatch', 'reactiontime', 'wordscramble', 'fallingcatch', 'targetshoot' ];

// Sequence template: 2 question games followed by 1 action game
const SEQUENCE_TEMPLATE = ['question', 'action'];

export function generateGameSequence(totalRounds) {
  const sequence = [];
  let questionGameIndex = 0;
  let actionGameIndex = 0;

  console.log(totalRounds);

  for (let i = 0; i < totalRounds; i++) {
    const sequenceType = SEQUENCE_TEMPLATE[i % SEQUENCE_TEMPLATE.length];
    
    if (sequenceType === 'question') {
      // Alternate between quiz and voting questions
      const gameType = QUESTION_GAMES[questionGameIndex % QUESTION_GAMES.length];
      questionGameIndex++;
      sequence.push(gameType);
    } else {
      // Randomly select an action game without immediate repetition
      let gameType;
      do {
        gameType = ACTION_GAMES[Math.floor(Math.random() * ACTION_GAMES.length)];
      } while (sequence.length > 0 && sequence[sequence.length - 1] === gameType);
      actionGameIndex++;
      sequence.push(gameType);
    }
  }

  return sequence;
}