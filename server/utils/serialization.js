// Helper functions for safe object serialization
export function createSafeLobbyState(lobby) {
    if (!lobby) return null;
    
    return {
      users: lobby.users.map(user => ({
        username: user.username,
        isHost: user.isHost,
        score: user.score,
        color: user.color,
        spotifyProfileUrl: user.spotifyProfileUrl,
        spotifyDisplayName: user.spotifyDisplayName
      })),
      gameState: lobby.gameState,
      gameMode: lobby.gameMode,
      scores: { ...lobby.scores },
      currentRound: lobby.currentRound,
      totalRounds: lobby.totalRounds,
      roundTime: lobby.roundTime,
      maxGuesses: lobby.maxGuesses,
      musicProvider: lobby.musicProvider,
      gameVariant: lobby.gameVariant,
      currentSong: lobby.currentSong ? {
        id: lobby.currentSong.id,
        videoId: lobby.currentSong.videoId,
        title: lobby.currentSong.title,
        artist: lobby.currentSong.artist,
        addedBy: lobby.currentSong.addedBy
      } : null,
      minigameState: lobby.minigameState ? {
        currentGameIndex: lobby.minigameState.currentGameIndex,
        scores: { ...lobby.minigameState.scores },
        isActive: lobby.minigameState.isActive,
        showingSplash: lobby.minigameState.showingSplash,
        completedGames: lobby.minigameState.completedGames,
        inShop: lobby.minigameState.inShop,
        gameSequence: [...lobby.minigameState.gameSequence],
        votingState: lobby.minigameState.votingState ? {
          currentQuestion: lobby.minigameState.votingState.currentQuestion,
          votes: { ...lobby.minigameState.votingState.votes },
          results: lobby.minigameState.votingState.results,
          showingResults: lobby.minigameState.votingState.showingResults
        } : null
      } : null,
      spotifyToken: lobby.spotifyToken
    };
  }