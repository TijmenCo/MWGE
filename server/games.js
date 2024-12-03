import { MINIGAMES } from './constants/minigames.js';

export function startMinigameSequence(io, lobby, lobbyId) {
  if (!lobby.minigameState) {
    lobby.minigameState = {
      currentGameIndex: 0,
      scores: {},
      isActive: false,
      showingSplash: false
    };
  }

  lobby.minigameState.currentGameIndex = 0;
  lobby.minigameState.isActive = true;

  startNextMinigame(io, lobby, lobbyId);
}

export function startNextMinigame(io, lobby, lobbyId) {
  if (!lobby.minigameState.isActive) return;

  const game = MINIGAMES[lobby.minigameState.currentGameIndex];
  
  if (lobby.timer) {
    clearInterval(lobby.timer);
  }

  // Set splash screen state
  lobby.minigameState.showingSplash = true;
  io.to(lobbyId).emit('minigame_splash_start', {
    ...game,
    currentGameIndex: lobby.minigameState.currentGameIndex,
    totalGames: MINIGAMES.length
  });

  // Wait for splash screen duration
  setTimeout(() => {
    lobby.minigameState.showingSplash = false;
    io.to(lobbyId).emit('minigame_splash_end');

    // Start the actual game
    io.to(lobbyId).emit('minigame_start', {
      ...game,
      currentGameIndex: lobby.minigameState.currentGameIndex,
      totalGames: MINIGAMES.length
    });

    let timeLeft = game.duration;
    
    lobby.timer = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(lobby.timer);
        
        lobby.minigameState.currentGameIndex = (lobby.minigameState.currentGameIndex + 1) % MINIGAMES.length;
        
        io.to(lobbyId).emit('minigame_end', {
          nextGameIndex: lobby.minigameState.currentGameIndex,
          scores: lobby.scores
        });
      } else {
        io.to(lobbyId).emit('minigame_tick', { 
          timeLeft,
          currentGame: game.type,
          scores: lobby.scores
        });
        timeLeft--;
      }
    }, 1000);
  }, 3000); // Splash screen duration
}

export function stopMinigameSequence(lobby) {
  if (lobby.timer) {
    clearInterval(lobby.timer);
  }
  if (lobby.minigameState) {
    lobby.minigameState.isActive = false;
    lobby.minigameState.showingSplash = false;
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