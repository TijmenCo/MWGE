export function handleRouletteBet(io, lobby, lobbyId, username, bet) {
    if (!lobby.rouletteState) {
      lobby.rouletteState = {
        bets: {},
        bettingUsers: [],
        isSpinning: false
      };
    }
  
    if (!lobby.rouletteState.bets[username]) {
      lobby.rouletteState.bets[username] = bet;
      lobby.rouletteState.bettingUsers.push(username);
  
      io.to(lobbyId).emit('roulette_bet_update', {
        bettingUsers: lobby.rouletteState.bettingUsers
      });
  
      // If all users have bet, start the spin
      if (lobby.rouletteState.bettingUsers.length === lobby.users.length) {
        startRouletteSpin(io, lobby, lobbyId);
      }
    }
  }
  
  export function startRouletteSpin(io, lobby, lobbyId) {
    lobby.rouletteState.isSpinning = true;
  
    // Simulate wheel spin
    setTimeout(() => {
      const result = Math.floor(Math.random() * 37); // 0-36
      const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  
      // Determine winners
      const winners = Object.entries(lobby.rouletteState.bets)
        .filter(([_, bet]) => {
          if (bet.type === 'number' && bet.value === result) return true;
          if (bet.type === 'red' && RED_NUMBERS.includes(result)) return true;
          if (bet.type === 'black' && !RED_NUMBERS.includes(result) && result !== 0) return true;
          if (bet.type === 'green' && result === 0) return true;
          return false;
        })
        .map(([username]) => username);
  
      io.to(lobbyId).emit('roulette_result', {
        number: result,
        winners
      });
  
      // Reset state
      lobby.rouletteState = {
        bets: {},
        bettingUsers: [],
        isSpinning: false
      };
    }, 3000); // 3 second spin animation
  }