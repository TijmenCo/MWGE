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
    const FIRST_12 = Array.from({ length: 12 }, (_, i) => i + 1);
    const SECOND_12 = Array.from({ length: 12 }, (_, i) => i + 13);
    const THIRD_12 = Array.from({ length: 12 }, (_, i) => i + 25);

    // Determine winners
    const winners = Object.entries(lobby.rouletteState.bets)
      .filter(([_, bet]) => {
        // Original bet types
        if (bet.type === 'number' && Number(bet.value) === result) return true;
        if (bet.type === 'red' && RED_NUMBERS.includes(result)) return true;
        if (bet.type === 'black' && !RED_NUMBERS.includes(result) && result !== 0) return true;
        if (bet.type === 'green' && result === 0) return true;

        // New bet types
        if (bet.type === 'first12' && FIRST_12.includes(result)) return true;
        if (bet.type === 'second12' && SECOND_12.includes(result)) return true;
        if (bet.type === 'third12' && THIRD_12.includes(result)) return true;
        if (bet.type === 'even' && result !== 0 && result % 2 === 0) return true;
        if (bet.type === 'odd' && result % 2 === 1) return true;
        if (bet.type === '1to18' && result >= 1 && result <= 18) return true;
        if (bet.type === '19to36' && result >= 19 && result <= 36) return true;

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