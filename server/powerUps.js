import { POWER_UPS } from './constants/powerUps.js';

export function handlePowerUpPurchase(socket, io, lobbies) {
  socket.on('purchase_power_up', ({ lobbyId, username, powerUpId }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;

    // Initialize player inventories if not exists
    if (!lobby.playerInventories) {
      lobby.playerInventories = {};
    }

    // Initialize player inventory if not exists
    if (!lobby.playerInventories[username]) {
      lobby.playerInventories[username] = {
        powerUps: {},
        points: lobby.scores?.[username] || 0
      };
    }

    const inventory = lobby.playerInventories[username];
    const powerUp = POWER_UPS.find(p => p.id === powerUpId);

    if (!powerUp) {
      console.error(`Power-up ${powerUpId} not found`);
      return;
    }

    // Check if player can afford the power-up
    if (inventory.points >= powerUp.cost) {
      // Deduct points
      inventory.points -= powerUp.cost;
      lobby.scores[username] = inventory.points;

      // Add power-up to inventory
      inventory.powerUps[powerUpId] = (inventory.powerUps[powerUpId] || 0) + 1;

      // Notify clients
      io.to(lobbyId).emit('power_up_purchased', {
        username,
        powerUpId,
        newPoints: inventory.points,
        inventory: inventory.powerUps
      });

      io.to(lobbyId).emit('scores_update', lobby.scores);
    }
  });

  socket.on('use_power_up', ({ lobbyId, username, powerUpId }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby || !lobby.playerInventories?.[username]) return;

    const inventory = lobby.playerInventories[username];
    if (!inventory.powerUps[powerUpId] || inventory.powerUps[powerUpId] <= 0) return;

    // Consume power-up
    inventory.powerUps[powerUpId]--;

    // Apply power-up effect
    applyPowerUpEffect(io, lobby, username, powerUpId);

    // Notify clients
    io.to(lobbyId).emit('power_up_used', {
      username,
      powerUpId,
      inventory: inventory.powerUps
    });
  });
}

function applyPowerUpEffect(io, lobby, username, powerUpId) {
  const powerUp = POWER_UPS.find(p => p.id === powerUpId);
  if (!powerUp?.effect) return;

  switch (powerUpId) {
    case 'double-points':
      applyDoublePoints(lobby, username);
      break;
    case 'time-freeze':
      applyTimeFreeze(lobby);
      break;
    case 'confusion':
      applyConfusion(lobby, username);
      break;
    case 'shield':
      applyShield(lobby, username);
      break;
    case 'point-steal':
      applyPointSteal(io, lobby, username);
      break;
  }
}

function applyDoublePoints(lobby, username) {
  if (!lobby.activeEffects) lobby.activeEffects = {};
  lobby.activeEffects[username] = {
    type: 'double-points',
    expiresAt: Date.now() + 60000 // 1 minute
  };
}

function applyTimeFreeze(lobby) {
  if (lobby.timer) {
    clearInterval(lobby.timer);
    lobby.timeLeft += 5;
    startTimer(lobby);
  }
}

function applyConfusion(lobby, username) {
  const otherPlayers = lobby.users
    .filter(user => user.username !== username)
    .map(user => user.username);

  otherPlayers.forEach(player => {
    if (!lobby.activeEffects) lobby.activeEffects = {};
    lobby.activeEffects[player] = {
      type: 'confused',
      expiresAt: Date.now() + 60000 // 1 minute
    };
  });
}

function applyShield(lobby, username) {
  if (!lobby.activeEffects) lobby.activeEffects = {};
  lobby.activeEffects[username] = {
    type: 'shield',
    expiresAt: Date.now() + 300000 // 5 minutes
  };
}

function applyPointSteal(io, lobby, username) {
  const otherPlayers = lobby.users
    .filter(user => user.username !== username)
    .map(user => user.username);

  if (otherPlayers.length > 0) {
    const targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
    const stolenPoints = 50;

    lobby.scores[targetPlayer] = Math.max(0, (lobby.scores[targetPlayer] || 0) - stolenPoints);
    lobby.scores[username] = (lobby.scores[username] || 0) + stolenPoints;

    io.to(lobby.id).emit('scores_update', lobby.scores);
  }
}

function startTimer(lobby) {
  lobby.timer = setInterval(() => {
    lobby.timeLeft--;
    if (lobby.timeLeft <= 0) {
      clearInterval(lobby.timer);
      // Handle game end
    }
    io.to(lobby.id).emit('time_update', { timeLeft: lobby.timeLeft });
  }, 1000);
}