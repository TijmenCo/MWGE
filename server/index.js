import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import { startMinigameSequence, stopMinigameSequence, updateMinigameScore, startNextMinigame, handleVote, proceedToShop } from './games.js';
import { handlePowerUpPurchase } from './powerUps.js';
import { handleQuizAnswer, startQuizQuestion, handleQuizStateRequest} from './quiz.js'
import { text } from 'stream/consumers';


const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);

// Enable CORS for the Express app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files from the dist directory after build
app.use(express.static(join(__dirname, '../dist')));

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 50000,
  pingInterval: 10000,
  connectTimeout: 50000
});

const lobbies = new Map();
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
];

const DEFAULT_PLAYLIST = [
  { videoId: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley' },
  { videoId: 'y6120QOlsfU', title: 'Sandstorm', artist: 'Darude' },
  { videoId: '3JWTaaS7LdU', title: 'I Will Always Love You', artist: 'Whitney Houston' },
  { videoId: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen' },
  { videoId: 'hTWKbfoikeg', title: 'Smells Like Teen Spirit', artist: 'Nirvana' }
];

io.on('connection', (socket) => {
  socket.on('request_lobby_state', ({ lobbyId }) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby) {
      socket.emit('lobby_update', lobby);
    }
  });

  socket.on('request_quiz_state', ({ lobbyId }) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby) {
      handleQuizStateRequest(socket, lobby);
    }
  });

  socket.on('quiz_answer', ({ lobbyId, answer }) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby && socket.username) {
      handleQuizAnswer(io, lobby, lobbyId, socket.username, answer);
    }
  });
  

  socket.on('start_next_minigame', ({ lobbyId }) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby) {
      const user = lobby.users.find(u => u.username === socket.username);
      if (user?.isHost) {
        if (lobby.minigameState) {
          lobby.minigameState.inShop = false;
        }
        startNextMinigame(io, lobby, lobbyId);
      }
    }
  });

  socket.on('proceed_to_shop', ({ lobbyId }) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby) {
      const user = lobby.users.find(u => u.username === socket.username);
      if (user?.isHost) {
        proceedToShop(io, lobby, lobbyId);
      }
    }
  });

  handlePowerUpPurchase(socket, io, lobbies);

  socket.on('minigame_action', ({ lobbyId, username, action, data }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby || (lobby.minigameState && lobby.minigameState.inShop)) return;

    updateMinigameScore(io, lobby, lobbyId, username, data.score, action);
  });

  socket.on('cast_vote', ({ lobbyId, votedFor }) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby && socket.username) {
      handleVote(io, lobby, lobbyId, socket.username, votedFor);
    }
  });

  socket.on('return_to_lobby', ({ lobbyId }) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby) {
      stopMinigameSequence(lobby);

      // Store final scores before resetting
      const finalScores = { ...lobby.scores };
  
      // Clear any existing timers
      if (lobby.timer) {
        clearInterval(lobby.timer);
        lobby.timer = null;
      }
  
     // First emit game over with final scores
      io.to(lobbyId).emit('game_over', { finalScores });
  
      // Wait a bit before resetting the lobby state
      setTimeout(() => {
        // Reset all game-related state
      lobby.gameState = 'waiting';
      lobby.gameMode = 'minigames';
      lobby.currentSong = null;
      lobby.scores = {};
      lobby.guesses = {};
      lobby.playlist = [];
      lobby.currentRound = 1;
      lobby.currentSongIndex = 1;
      lobby.remainingGuesses = {};
      lobby.minigameState = null;
      lobby.correctGuessOrder = { title: [], artist: [], addedBy: [] };
      lobby.quizState = null;
      lobby.gameVariant = "classic";
      lobby.timer = null;
  
        // Reset user scores
        lobby.users.forEach(user => {
          user.score = 0;
        });
  
        // Notify all clients about the lobby reset
        io.to(lobbyId).emit('lobby_update', lobby);
      }, 1000); // Wait 1 second before resetting
    }
  });
  
  socket.on('create_lobby', ({ username, accessToken, spotifyProfileUrl }, callback) => {
    const lobbyId = randomUUID().slice(0, 8);
    const userColor = COLORS[0];
    socket.username = username;
    socket.spotifyProfileUrl = spotifyProfileUrl;
    socket.lobbyId = lobbyId;
    
    // Extract Spotify display name from URL if available
    const spotifyDisplayName = spotifyProfileUrl 
      ? spotifyProfileUrl.split('/').pop() 
      : username;
    
    lobbies.set(lobbyId, { 
      users: [{
        username,
        spotifyProfileUrl,
        spotifyDisplayName, // Add Spotify display name
        isHost: true,
        score: 0,
        color: userColor
      }],
      gameState: 'waiting',
      gameMode: null,
      scores: {},
      currentSong: null,
      currentSongIndex: 1,
      currentRound: 1,
      totalRounds: 5,
      roundTime: 20,
      maxGuesses: 3,
      guesses: {},
      timer: null,
      playlist: [...DEFAULT_PLAYLIST],
      spotifyToken: accessToken,
      musicProvider: 'youtube',
      minigameState: null
    });
    
    socket.join(lobbyId);
    socket.emit('color_assigned', { color: userColor });
    callback(lobbyId);
    io.to(lobbyId).emit('lobby_update', lobbies.get(lobbyId));
  });

  socket.on('join_lobby', ({ lobbyId, username, spotifyProfileUrl }, callback) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby) {
      const userColor = COLORS[lobby.users.length % COLORS.length];
      socket.username = username;
      socket.spotifyProfileUrl = spotifyProfileUrl;
      socket.lobbyId = lobbyId;
      
      // Extract Spotify display name from URL if available
      const spotifyDisplayName = spotifyProfileUrl 
        ? spotifyProfileUrl.split('/').pop() 
        : username;
      
      lobby.users.push({
        username,
        spotifyProfileUrl,
        spotifyDisplayName, // Add Spotify display name
        isHost: false,
        score: 0,
        color: userColor
      });
      socket.join(lobbyId);
      socket.emit('color_assigned', { color: userColor });
      callback(true);
      io.to(lobbyId).emit('lobby_update', lobby);
    } else {
      callback(false);
    }
  });

  socket.on('select_game_mode', ({ lobbyId, mode, playlist, config, musicProvider, gameVariant }) => {
    const lobby = lobbies.get(lobbyId);
    console.log(lobby)
    if (lobby) {
      stopMinigameSequence(lobby);
      lobby.gameMode = mode;
      lobby.musicProvider = musicProvider;
      lobby.gameVariant = gameVariant;
      
      if (mode === 'songguess') {
        lobby.currentSongIndex = 1;
        lobby.currentRound = 1;
        
        if (config) {
          lobby.totalRounds = config.totalRounds;
          lobby.roundTime = config.roundTime;
          lobby.maxGuesses = config.maxGuesses;
        }
        
        if (playlist) {
          lobby.playlist = playlist.map(item => ({
            id: item.id,
            videoId: item.videoId,
            title: item.title,
            artist: item.artist,
            addedBy: item.addedBy
          }));
        }
      }
      io.to(lobbyId).emit('lobby_update', lobby);
    }
  });

  socket.on('start_drawing', ({ x, y, color, lobbyId }) => {
    io.to(lobbyId).emit('start_path', { x, y, color, socketId: socket.id });
  });
  
  socket.on('draw', ({ x, y, color, lobbyId }) => {
    io.to(lobbyId).emit('draw', { x, y, color, socketId: socket.id });
  });  

  socket.on('update_user_color', ({ lobbyId, username, color }) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby) {
      const user = lobby.users.find(u => u.username === username);
      if (user) {
        user.color = color;
        io.to(lobbyId).emit('lobby_update', lobby);
      }
    }
  });

  socket.on('start_game', ({ lobbyId }, numberOfRounds) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby) {
      lobby.gameState = 'countdown';
      lobby.scores = {};
      
      // Initialize scores for all users
      lobby.users.forEach(user => {
        lobby.scores[user.username] = 0;
      });
      
      io.to(lobbyId).emit('game_countdown');
      
      setTimeout(() => {
        lobby.gameState = 'playing';
        io.to(lobbyId).emit('lobby_update', lobby);
        
        if (lobby.gameMode === 'minigames') {
          startMinigameSequence(io, lobby, lobbyId, numberOfRounds);
        } else if (lobby.gameMode === 'songguess') {
          startNextSong(lobbyId);
        }
      }, 3000);
    }
  });

  socket.on('make_guess', ({ lobbyId, username, guess }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby || !lobby.currentSong) return;

    // Check if user has remaining guesses
    if (!lobby.remainingGuesses) {
      lobby.remainingGuesses = {};
    }
    
    if (lobby.remainingGuesses[username] <= 0) {
      return;
    }

    // Decrease remaining guesses
    lobby.remainingGuesses[username]--;

    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .replace(/\(feat\..*?\)/g, '') // Remove "feat." segments
        .replace(/[’']/g, "'")         // Normalize apostrophes
        .trim();
    };

    const { title, artist, addedBy } = lobby.currentSong;
    const normalizedGuess = guess.toLowerCase().trim();
    const normalizedTitle = normalizeText(text)
    const normalizedArtists = artist.toLowerCase().split(',').map(a => a.trim());

    const totalPlayers = lobby.users.length;
    let points = 0;
    let isCorrect = false;

    if (!lobby.guesses[username]) {
      lobby.guesses[username] = { 
        title: false, 
        artist: false,
        addedBy: false
      };
    }

    if (!lobby.correctGuessOrder) {
      lobby.correctGuessOrder = { title: [], artist: [], addedBy: [] };
    }

    if (lobby.gameVariant === 'classic') {
      if (!lobby.guesses[username].title && normalizedGuess.includes(normalizedTitle)) {
        isCorrect = true;
        lobby.guesses[username].title = true;

        const titleGuessOrder = lobby.correctGuessOrder.title.length;
        if (titleGuessOrder < Math.min(3, totalPlayers)) {
          points += (3 - titleGuessOrder);
          lobby.correctGuessOrder.title.push(username);
        }
      }

      if (!lobby.guesses[username].artist && normalizedArtists.some(artistName => normalizedGuess.includes(artistName))) {
        isCorrect = true;
        lobby.guesses[username].artist = true;

        const artistGuessOrder = lobby.correctGuessOrder.artist.length;
        if (artistGuessOrder < Math.min(3, totalPlayers)) {
          points += (3 - artistGuessOrder);
          lobby.correctGuessOrder.artist.push(username);
        }
      }
    } else if (lobby.gameVariant === 'whoAdded') {
      if (!lobby.guesses[username].addedBy && addedBy) {
        // Ensure `addedBy` has the expected properties
        const addedByUsername = addedBy.username?.toLowerCase();
        const addedByDisplayName = addedBy.displayName?.toLowerCase();
    
        // Find the user who added the song
        const isAdderCorrect = lobby.users.some(u => {
          const usernameLower = u.username.toLowerCase();
          const spotifyDisplayNameLower = u.spotifyDisplayName?.toLowerCase();
    
          // Log for debugging
          console.log("Checking user:", {
            usernameLower,
            spotifyDisplayNameLower,
            normalizedGuess,
            addedByUsername,
            addedByDisplayName,
          });
    
          return addedByDisplayName && addedByDisplayName === normalizedGuess;
        });
    
        if (isAdderCorrect) {
          isCorrect = true;
          lobby.guesses[username].addedBy = true;
    
          const addedByGuessOrder = lobby.correctGuessOrder.addedBy.length;
          if (addedByGuessOrder < Math.min(3, totalPlayers)) {
            points = 3 - addedByGuessOrder;
            lobby.correctGuessOrder.addedBy.push(username);
          }
        }
      }
    }
    
    if (isCorrect) {
      lobby.scores[username] = (lobby.scores[username] || 0) + points;
    }
    
    io.to(lobbyId).emit('guess_result', {
      username,
      guess,
      correct: isCorrect,
      points,
      hasGuessedAll: lobby.gameVariant === 'classic' 
        ? (lobby.guesses[username].title && lobby.guesses[username].artist)
        : lobby.guesses[username].addedBy
    });

    io.to(lobbyId).emit('scores_update', lobby.scores);
  });
  socket.on('next_song', ({ lobbyId }) => {
    const lobby = lobbies.get(lobbyId);
    lobby.currentRound++;
    if (lobby) {
      if (lobby.currentRound > lobby.totalRounds) {
        io.to(lobbyId).emit('game_over', { finalScores: lobby.scores });
        io.to(lobbyId).emit('lobby_update', lobby);
        return;
      } else {
        startNextSong(lobbyId);
      }
    }
  });

  socket.on('whack_mole', ({ lobbyId, position, username }) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby && lobby.activeMole === position) {
      lobby.scores[username] = (lobby.scores[username] || 0) + 1;
      lobby.activeMole = null;
      io.to(lobbyId).emit('mole_whacked', { position, scores: lobby.scores });
    }
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (lobbies.has(room)) {
        const lobby = lobbies.get(room);
        lobby.users = lobby.users.filter(u => u.username !== socket.username);
        if (lobby.users.length === 0) {
          if (lobby.timer) {
            clearInterval(lobby.timer);
          }
          lobbies.delete(room);
        } else {
          if (!lobby.users.some(u => u.isHost)) {
            lobby.users[0].isHost = true;
          }
          io.to(room).emit('lobby_update', lobby);
        }
      }
    }
  });
});

function startNextSong(lobbyId) {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return;

  lobby.correctGuessOrder = { title: [], artist: [], addedBy: [] };

  lobby.remainingGuesses = {}; // Reset remaining guesses for all users

  // Initialize remaining guesses for each user
  lobby.users.forEach(user => {
    lobby.remainingGuesses[user.username] = lobby.config?.maxGuesses || 3;
  });

  if (lobby.timer) {
    clearInterval(lobby.timer);
  }

  if (!lobby.playedSongs) {
    lobby.playedSongs = new Set();
  }

  let availableSongs = lobby.playlist.filter(
    song => !lobby.playedSongs.has(song.videoId)
  );

  if (availableSongs.length === 0) {
    lobby.playedSongs.clear();
    availableSongs = [...lobby.playlist];
  }

  const nextSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];

  lobby.currentSong = nextSong;
  lobby.playedSongs.add(nextSong.videoId);
  lobby.guesses = {};

  io.to(lobbyId).emit('song_start', {
    videoId: lobby.currentSong.videoId,
    spotifyId: lobby.currentSong.id,
    songInfo: {
      title: lobby.currentSong.title,
      artist: lobby.currentSong.artist,
      addedBy: lobby.currentSong.addedBy
    }
  });

  io.to(lobbyId).emit('lobby_update', lobby);

  let timeLeft = lobby.roundTime;
  lobby.timer = setInterval(() => {
    timeLeft--;
    io.to(lobbyId).emit('time_update', { timeLeft });

    if (timeLeft === 0) {
      clearInterval(lobby.timer);
      io.to(lobbyId).emit('show_answer');
    }
  }, 1000);
}

function startMoleSpawning(lobbyId) {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return;

  const spawnMole = () => {
    if (lobby.gameState !== 'playing') return;

    const position = Math.floor(Math.random() * 9);
    lobby.activeMole = position;
    io.to(lobbyId).emit('mole_spawn', { position });

    setTimeout(() => {
      if (lobby.activeMole === position) {
        lobby.activeMole = null;
        io.to(lobbyId).emit('mole_hide', { position });
      }
    }, 1000);

    setTimeout(spawnMole, Math.random() * 1000 + 500);
  };

  spawnMole();
}

// Catch all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});