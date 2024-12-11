import { MINIGAMES } from './constants/minigames.js';
import { VOTING_QUESTIONS } from './constants/votingQuestions.js';
import { startQuizQuestion } from './quiz.js';
import { generateGameSequence } from './constants/gameSequence.js';

export function startMinigameSequence(io, lobby, lobbyId) {
  if (!lobby.minigameState) {
    lobby.minigameState = {
      currentGameIndex: 0,
      scores: {},
      isActive: false,
      showingSplash: false,
      completedGames: 0,
      inShop: false,
      gameSequence: generateGameSequence(),
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
  lobby.minigameState.gameSequence = generateGameSequence();

  startNextMinigame(io, lobby, lobbyId);
}

export function startNextMinigame(io, lobby, lobbyId) {
  if (!lobby.minigameState || !lobby.minigameState.isActive) return;

  const currentGameType = lobby.minigameState.gameSequence[lobby.minigameState.currentGameIndex];
  const game = MINIGAMES.find(g => g.type === currentGameType);
  
  if (!game) return;
  
  if (lobby.timer) {
    clearInterval(lobby.timer);
  }

  lobby.minigameState.inShop = false;
  lobby.minigameState.votingState = {
    currentQuestion: null,
    votes: {},
    results: null,
    showingResults: false
  };

  // Reset voting state for new game
  if (game.type === 'votingquestion') {
    const randomQuestion = VOTING_QUESTIONS[Math.floor(Math.random() * VOTING_QUESTIONS.length)];
    lobby.minigameState.votingState.currentQuestion = randomQuestion;
  }

  // Set splash screen state
  lobby.minigameState.showingSplash = true;
  io.to(lobbyId).emit('minigame_splash_start', {
    ...game,
    currentGameIndex: lobby.minigameState.currentGameIndex,
    totalGames: lobby.minigameState.gameSequence.length,
    votingQuestion: game.type === 'votingquestion' ? lobby.minigameState.votingState.currentQuestion : null
  });

  // Wait for splash screen duration
  setTimeout(() => {
    if (!lobby.minigameState?.isActive) return;

    lobby.minigameState.showingSplash = false;
    io.to(lobbyId).emit('minigame_splash_end');

    // Start the actual game
    if (game.type === 'quiz') {
      startQuizQuestion(io, lobby, lobbyId);
    }

    io.to(lobbyId).emit('minigame_start', {
      ...game,
      currentGameIndex: lobby.minigameState.currentGameIndex,
      totalGames: lobby.minigameState.gameSequence.length,
      votingQuestion: game.type === 'votingquestion' ? lobby.minigameState.votingState.currentQuestion : null
    });

    let timeLeft = game.duration;
    
    lobby.timer = setInterval(() => {
      if (!lobby.minigameState?.isActive) {
        clearInterval(lobby.timer);
        return;
      }

      if (timeLeft <= 0) {
        clearInterval(lobby.timer);
        
        if (game.type === 'votingquestion') {
          handleVotingEnd(io, lobby, lobbyId);
        } else if (game.type === 'quiz') {
          handleQuizEnd(io, lobby, lobbyId);
        } else {
          handleRegularGameEnd(io, lobby, lobbyId);
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

function handleRegularGameEnd(io, lobby, lobbyId) {
  lobby.minigameState.completedGames++;
  
  if (lobby.minigameState.completedGames >= lobby.minigameState.gameSequence.length) {
    lobby.minigameState.isActive = false;
    io.to(lobbyId).emit('game_over', { finalScores: lobby.scores });
    return;
  }

  lobby.minigameState.currentGameIndex = 
    (lobby.minigameState.currentGameIndex + 1) % lobby.minigameState.gameSequence.length;
  
  lobby.minigameState.inShop = true;
  io.to(lobbyId).emit('minigame_end', {
    nextGameIndex: lobby.minigameState.currentGameIndex,
    scores: lobby.scores,
    nextGameType: lobby.minigameState.gameSequence[lobby.minigameState.currentGameIndex]
  });
}

function handleVotingEnd(io, lobby, lobbyId) {
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
  
  if (results.length > 0) {
    const winner = results[0].username;
    if (!lobby.scores[winner]) {
      lobby.scores[winner] = 0;
    }
    lobby.scores[winner] += MINIGAMES.find(g => g.type === 'votingquestion')?.maxScore || 10;
  }

  io.to(lobbyId).emit('voting_results', {
    results: lobby.minigameState.votingState.results,
    question: lobby.minigameState.votingState.currentQuestion
  });

  io.to(lobbyId).emit('scores_update', lobby.scores);
}

function handleQuizEnd(io, lobby, lobbyId) {
  if (lobby.quizState && lobby.quizState.currentQuestion) {
    const correctAnswer = lobby.quizState.currentQuestion.correctAnswer;
    const results = [];
    const correctUsers = [];

    Object.entries(lobby.quizState.answers).forEach(([username, userAnswer]) => {
      if (userAnswer === correctAnswer) {
        if (!lobby.scores[username]) {
          lobby.scores[username] = 0;
        }
        lobby.scores[username] += 10;
        correctUsers.push(username);
      }
      results.push({ username, answer: userAnswer });
    });

    io.to(lobbyId).emit('quiz_results', {
      results,
      correctAnswer,
      correctUsers,
      scores: lobby.scores
    });
  }
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

  // Emit vote update to all users
  io.to(lobbyId).emit('vote_update', {
    votedUsers: Object.keys(lobby.minigameState.votingState.votes),
  });

  // Check if all users have voted
  if (Object.keys(lobby.minigameState.votingState.votes).length === lobby.users.length) {
    handleVotingEnd(io, lobby, lobbyId); // End voting when all users have voted
  }
}


export function proceedToShop(io, lobby, lobbyId) {
  if (!lobby.minigameState?.isActive) return;

  lobby.minigameState.completedGames++;
  
  if (lobby.minigameState.completedGames >= lobby.minigameState.gameSequence.length) {
    lobby.minigameState.isActive = false;
    io.to(lobbyId).emit('game_over', { finalScores: lobby.scores });
    return;
  }

  lobby.minigameState.currentGameIndex = 
    (lobby.minigameState.currentGameIndex + 1) % lobby.minigameState.gameSequence.length;
  
  lobby.minigameState.inShop = true;
  lobby.minigameState.votingState.showingResults = false;
  
  io.to(lobbyId).emit('minigame_end', {
    nextGameIndex: lobby.minigameState.currentGameIndex,
    scores: lobby.scores,
    nextGameType: lobby.minigameState.gameSequence[lobby.minigameState.currentGameIndex]
  });
}