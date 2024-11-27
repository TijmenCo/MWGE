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
  // Initialize minigame state if not exists
  if (!lobby.minigameState) {
    lobby.minigameState = {
      currentGameIndex: 0,
      scores: {},
      isActive: false
    };
  }

  // Reset minigame state for new sequence
  lobby.minigameState.currentGameIndex = 0;
  lobby.minigameState.isActive = true;

  // Function to start a single minigame
  const startMinigame = () => {
    if (!lobby.minigameState.isActive) return;

    const game = MINIGAMES[lobby.minigameState.currentGameIndex];
    
    // Clear any existing timer
    if (lobby.timer) {
      clearInterval(lobby.timer);
    }

    // Broadcast game start to all players
    io.to(lobbyId).emit('minigame_start', {
      ...game,
      currentGameIndex: lobby.minigameState.currentGameIndex,
      totalGames: MINIGAMES.length
    });

    let timeLeft = game.duration;
    
    // Start the game timer
    lobby.timer = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(lobby.timer);
        
        // Move to next game
        lobby.minigameState.currentGameIndex = (lobby.minigameState.currentGameIndex + 1) % MINIGAMES.length;
        
        // Broadcast round end
        io.to(lobbyId).emit('minigame_end', {
          nextGameIndex: lobby.minigameState.currentGameIndex,
          scores: lobby.scores
        });

        // Short delay before starting next game
        setTimeout(() => {
          if (lobby.minigameState.isActive) {
            startMinigame();
          }
        }, 3000);
      } else {
        // Broadcast time update to all players
        io.to(lobbyId).emit('minigame_tick', { 
          timeLeft,
          currentGame: game.type,
          scores: lobby.scores
        });
        timeLeft--;
      }
    }, 1000);
  };

  // Start the first minigame
  startMinigame();
}

export function stopMinigameSequence(lobby) {
  if (lobby.timer) {
    clearInterval(lobby.timer);
  }
  if (lobby.minigameState) {
    lobby.minigameState.isActive = false;
  }
}

export function updateMinigameScore(io, lobby, lobbyId, username, score, gameType) {
  if (!lobby.scores) {
    lobby.scores = {};
  }
  
  if (!lobby.scores[username] || score > lobby.scores[username]) {
    lobby.scores[username] = score;
    io.to(lobbyId).emit('scores_update', lobby.scores);
  }
}