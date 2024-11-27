export const MINIGAMES = [
  {
    type: 'whackamole',
    name: 'Whack-a-Mole',
    description: 'Whack the moles as they appear!',
    duration: 20,
    maxScore: 30,
    instruction: 'Click the moles when they pop up!'
  },
  {
    type: 'buttonmash',
    name: 'Button Masher',
    description: 'Mash the button as fast as you can!',
    duration: 10,
    maxScore: 100,
    instruction: 'Click the button as many times as possible!'
  },
  {
    type: 'colorclick',
    name: 'Color Match',
    description: 'Click the correct color as fast as you can!',
    duration: 15,
    maxScore: 20,
    instruction: 'Click the color that matches the text!'
  },
  {
    type: 'quickmath',
    name: 'Quick Math',
    description: 'Solve math problems quickly!',
    duration: 20,
    maxScore: 15,
    instruction: 'Solve the math problems as fast as you can!'
  },
  {
    type: 'typespeed',
    name: 'Speed Typer',
    description: 'Type the words as fast as you can!',
    duration: 15,
    maxScore: 20,
    instruction: 'Type the words exactly as shown!'
  },
  {
    type: 'memorymatch',
    name: 'Memory Match',
    description: 'Match the pairs of cards!',
    duration: 30,
    maxScore: 6,
    instruction: 'Find all matching pairs before time runs out!'
  }
];

export function startMinigameSequence(io, lobby, lobbyId) {
  if (!lobby.currentGameIndex) {
    lobby.currentGameIndex = 0;
  }

  const game = MINIGAMES[lobby.currentGameIndex];
  io.to(lobbyId).emit('minigame_start', game);

  let timeLeft = game.duration;
  lobby.timer = setInterval(() => {
    timeLeft--;
    io.to(lobbyId).emit('minigame_tick', { timeLeft });

    if (timeLeft <= 0) {
      clearInterval(lobby.timer);
      lobby.currentGameIndex = (lobby.currentGameIndex + 1) % MINIGAMES.length;
      
      // Short delay before starting next game
      setTimeout(() => {
        startMinigameSequence(io, lobby, lobbyId);
      }, 3000);
    }
  }, 1000);
}