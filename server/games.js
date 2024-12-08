import { MINIGAMES } from './constants/minigames.js';
import { VOTING_QUESTIONS } from './constants/votingQuestions.js';

export function startMinigameSequence(io, lobby, lobbyId) {
  if (!lobby.minigameState) {
    lobby.minigameState = {
      currentGameIndex: 0,
      scores: {},
      isActive: false,
      showingSplash: false,
      completedGames: 0,
      inShop: false,
      votingState: {
        currentQuestion: null,
        votes: {},
        results: null,
        showingResults: false
      }
    };
  }

  lobby.minigameState.currentGameIndex = 0;
  lobby.minigameState.isActive = true;
  lobby.minigameState.completedGames = 0;
  lobby.minigameState.inShop = false;

  startNextMinigame(io, lobby, lobbyId);
}

export function startNextMinigame(io, lobby, lobbyId) {
  if (!lobby.minigameState || !lobby.minigameState.isActive) return;

  const game = MINIGAMES[lobby.minigameState.currentGameIndex];
  
  if (lobby.timer) {
    clearInterval(lobby.timer);
  }

  lobby.minigameState.inShop = false;

  // Reset voting state for new game
  if (game.type === 'votingquestion') {
    const randomQuestion = VOTING_QUESTIONS[Math.floor(Math.random() * VOTING_QUESTIONS.length)];
    lobby.minigameState.votingState = {
      currentQuestion: randomQuestion,
      votes: {},
      results: null,
      showingResults: false
    };
  }

  // Set splash screen state
  lobby.minigameState.showingSplash = true;
  io.to(lobbyId).emit('minigame_splash_start', {
    ...game,
    currentGameIndex: lobby.minigameState.currentGameIndex,
    totalGames: MINIGAMES.length,
    votingQuestion: game.type === 'votingquestion' ? lobby.minigameState.votingState.currentQuestion : null
  });

  // Wait for splash screen duration
  setTimeout(() => {
    if (!lobby.minigameState?.isActive) return;

    lobby.minigameState.showingSplash = false;
    io.to(lobbyId).emit('minigame_splash_end');

    // Start the actual game
    io.to(lobbyId).emit('minigame_start', {
      ...game,
      currentGameIndex: lobby.minigameState.currentGameIndex,
      totalGames: MINIGAMES.length,
      votingQuestion: game.type === 'votingquestion' ? lobby.minigameState.votingState.currentQuestion : null
    });

    let timeLeft = game.duration;
    
    lobby.timer = setInterval(() => {
      if (!lobby.minigameState?.isActive || lobby.minigameState.inShop) {
        return;
      }

      if (timeLeft <= 0) {
        clearInterval(lobby.timer);
        
        if (game.type === 'votingquestion') {
          // Calculate voting results
          const voteCount = {};
          Object.values(lobby.minigameState.votingState.votes).forEach(vote => {
            voteCount[vote] = (voteCount[vote] || 0) + 1;
          });
          
          const results = Object.entries(voteCount).map(([username, count]) => ({
            username,
            votes: count
          })).sort((a, b) => b.votes - a.votes);

          lobby.minigameState.votingState.results = results;
          lobby.minigameState.votingState.showingResults = true;
          
          // Award points to the most voted player
          if (results.length > 0) {
            const winner = results[0].username;
            if (!lobby.scores[winner]) {
              lobby.scores[winner] = 0;
            }
            lobby.scores[winner] += game.maxScore;
          }

          io.to(lobbyId).emit('voting_results', {
            results: lobby.minigameState.votingState.results,
            question: lobby.minigameState.votingState.currentQuestion
          });
        } else {
          // Only increment completed games if not in shop
          if (!lobby.minigameState.inShop) {
            lobby.minigameState.completedGames++;
            
            // Check if we've completed all games
            if (lobby.minigameState.completedGames >= MINIGAMES.length) {
              lobby.minigameState.isActive = false;
              io.to(lobbyId).emit('game_over', { finalScores: lobby.scores });
              return;
            }

            lobby.minigameState.currentGameIndex = 
              (lobby.minigameState.currentGameIndex + 1) % MINIGAMES.length;
            
            lobby.minigameState.inShop = true;
            io.to(lobbyId).emit('minigame_end', {
              nextGameIndex: lobby.minigameState.currentGameIndex,
              scores: lobby.scores
            });
          }
        }
      } else {
        io.to(lobbyId).emit('minigame_tick', { 
          timeLeft,
          currentGame: game.type,
          scores: lobby.scores,
          votingState: game.type === 'votingquestion' ? {
            votes: Object.keys(lobby.minigameState.votingState.votes)
          } : null
        });
        timeLeft--;
      }
    }, 1000);
  }, 3000);
}

export function proceedToShop(io, lobby, lobbyId) {
  if (!lobby.minigameState?.votingState?.showingResults) return;

  lobby.minigameState.completedGames++;
  
  if (lobby.minigameState.completedGames >= MINIGAMES.length) {
    lobby.minigameState.isActive = false;
    io.to(lobbyId).emit('game_over', { finalScores: lobby.scores });
    return;
  }

  lobby.minigameState.currentGameIndex = 
    (lobby.minigameState.currentGameIndex + 1) % MINIGAMES.length;
  
  lobby.minigameState.inShop = true;
  lobby.minigameState.votingState.showingResults = false;
  
  io.to(lobbyId).emit('minigame_end', {
    nextGameIndex: lobby.minigameState.currentGameIndex,
    scores: lobby.scores
  });
}

export function stopMinigameSequence(lobby) {
  if (lobby.timer) {
    clearInterval(lobby.timer);
  }
  if (lobby.minigameState) {
    lobby.minigameState.isActive = false;
    lobby.minigameState.showingSplash = false;
    lobby.minigameState.completedGames = 0;
    lobby.minigameState.inShop = false;
  }
}

export function updateMinigameScore(io, lobby, lobbyId, username, score, gameType) {
  if (!lobby.scores) {
    lobby.scores = {};
  }

  if (!lobby.scores[username]) {
    lobby.scores[username] = 0;
  }
  
  lobby.scores[username] += score;
  io.to(lobbyId).emit('scores_update', lobby.scores);
}

export function handleVote(io, lobby, lobbyId, username, votedFor) {
  if (!lobby.minigameState?.votingState) return;
  
  lobby.minigameState.votingState.votes[username] = votedFor;
  
  // Emit updated voting state
  io.to(lobbyId).emit('vote_update', {
    votedUsers: Object.keys(lobby.minigameState.votingState.votes)
  });
}