export function handleHorseRaceBet(io, lobby, lobbyId, username, horseId, amount) {
    if (!lobby.horseRaceState) {
      lobby.horseRaceState = {
        bets: {},
        bettingUsers: [],
        isRacing: false
      };
    }
  
    if (!lobby.horseRaceState.bets[username]) {
      lobby.horseRaceState.bets[username] = { horseId, amount };
      lobby.horseRaceState.bettingUsers.push(username);
  
      io.to(lobbyId).emit('horse_bet_update', {
        bettingUsers: lobby.horseRaceState.bettingUsers
      });
  
      // If all users have bet, start the race
      if (lobby.horseRaceState.bettingUsers.length === lobby.users.length) {
        startHorseRace(io, lobby, lobbyId);
      }
    }
  }
  
  export function startHorseRace(io, lobby, lobbyId) {
    const horses = [
      { id: 1, name: "Lightning Bolt", position: 0, odds: 2.0 },
      { id: 2, name: "Thunder Hooves", position: 0, odds: 3.0 },
      { id: 3, name: "Wind Runner", position: 0, odds: 4.0 },
      { id: 4, name: "Lucky Star", position: 0, odds: 5.0 }
    ];
  
    // Simulate race
    const raceInterval = setInterval(() => {
      let raceComplete = false;
      horses.forEach(horse => {
        horse.position += Math.random() * 5;
        if (horse.position >= 100) {
          raceComplete = true;
        }
      });
  
      io.to(lobbyId).emit('horse_race_update', { horses });
  
      if (raceComplete) {
        clearInterval(raceInterval);
        const winner = horses.reduce((prev, current) => 
          (prev.position > current.position) ? prev : current
        );
  
        // Calculate winners
        const winners = Object.entries(lobby.horseRaceState.bets)
          .filter(([_, bet]) => bet.horseId === winner.id)
          .map(([username]) => username);
  
        io.to(lobbyId).emit('horse_race_result', {
          winningHorse: winner,
          winners
        });
  
        // Reset state
        lobby.horseRaceState = {
          bets: {},
          bettingUsers: [],
          isRacing: false
        };
      }
    }, 100);
  }