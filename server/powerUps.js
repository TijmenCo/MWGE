import { POWER_UPS, WHEEL_SEGMENTS } from './constants/powerUps.js';

export function handlePowerUpPurchase(socket, io, lobbies) {
  socket.on('purchase_power_up', ({ lobbyId, username, powerUpId, currentPoints }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;

    if (!lobby.playerInventories) {
      lobby.playerInventories = {};
    }

    if (!lobby.playerInventories[username]) {
      lobby.playerInventories[username] = {
        powerUps: {},
        points: lobby.scores?.[username] || 0
      };
    }

    if (lobby.playerInventories[username]) {
      lobby.playerInventories[username].points = currentPoints;
    }

    const inventory = lobby.playerInventories[username];
    const powerUp = POWER_UPS.find(p => p.id === powerUpId);

    if (!powerUp) {
      console.error(`Power-up ${powerUpId} not found`);
      return;
    }

    if (inventory.points >= powerUp.cost) {
      inventory.points -= powerUp.cost;
      lobby.scores[username] = inventory.points;

      inventory.powerUps[powerUpId] = (inventory.powerUps[powerUpId] || 0) + 1;

      io.to(lobbyId).emit('power_up_purchased', {
        username,
        powerUpId,
        newPoints: inventory.points,
        inventory: inventory.powerUps
      });

      io.to(lobbyId).emit('scores_update', lobby.scores);
    }
  });

  socket.on('gamble_spin', ({ lobbyId, username, betAmount, currentPoints }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;

    if (!lobby.playerInventories) {
      lobby.playerInventories = {};
    }

    if (!lobby.playerInventories[username]) {
      lobby.playerInventories[username] = {
        powerUps: {},
        points: currentPoints
      };
    }

    const inventory = lobby.playerInventories[username];

    // Validate bet amount
    if (betAmount > inventory.points || betAmount < 10) return;

    // Deduct bet amount
    inventory.points -= betAmount;
    lobby.scores[username] = inventory.points;

    // Calculate result based on probabilities
    const rand = Math.random();
    let cumulativeProbability = 0;
    let result = null;

    for (const segment of WHEEL_SEGMENTS) {
      cumulativeProbability += segment.probability;
      if (rand <= cumulativeProbability) {
        result = segment;
        break;
      }
    }

    if (!result) {
      result = WHEEL_SEGMENTS[WHEEL_SEGMENTS.length - 1];
    }

    // Apply result effects
    switch (result.effect) {
      case 'self_drink':
        io.to(lobbyId).emit('drink_command', {
          type: 'self',
          fromUser: username,
          toUser: username
        });
        break;
      case 'lose_points':
        inventory.points = Math.floor(inventory.points / 2);
        break;
      case 'double_points':
        inventory.points += betAmount * 2;
        break;
      case 'jackpot':
        inventory.points += betAmount * 5;
        break;
      default:
        if (result.id) {
          inventory.powerUps[result.id] = (inventory.powerUps[result.id] || 0) + 1;
        }
    }

    // Update scores and emit results
    lobby.scores[username] = inventory.points;

    io.to(lobbyId).emit('gamble_result', {
      username,
      result: result.label,
      newPoints: inventory.points,
      inventory: inventory.powerUps
    });

    io.to(lobbyId).emit('scores_update', lobby.scores);
  });

  socket.on('use_power_up', ({ lobbyId, username, powerUpId, targetUsername }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby || !lobby.playerInventories?.[username]) return;

    const inventory = lobby.playerInventories[username];
    if (!inventory.powerUps[powerUpId] || inventory.powerUps[powerUpId] <= 0) return;

    const powerUp = POWER_UPS.find(p => p.id === powerUpId);
    if (!powerUp) return;

    // Consume power-up
    inventory.powerUps[powerUpId]--;

    // Apply power-up effect
    switch (powerUp.effect) {
      case 'make_drink':
      case 'make_shot':
        if (targetUsername) {
          io.to(lobbyId).emit('drink_command', {
            type: powerUp.effect === 'make_drink' ? 'sip' : 'shot',
            fromUser: username,
            toUser: targetUsername
          });
        }
        break;
      case 'all_drink':
        io.to(lobbyId).emit('drink_command', {
          type: 'all',
          fromUser: username
        });
        break;
      case 'waterfall':
        io.to(lobbyId).emit('drink_command', {
          type: 'waterfall',
          fromUser: username
        });
        break;
      case 'mega_shot':
        io.to(lobbyId).emit('drink_command', {
          type: 'mega_shot',
          fromUser: username,
          toUser: targetUsername
        });
        break;
    }

    // Emit the updated inventory after using the power-up
    io.to(lobbyId).emit('power_up_used', {
      username,
      powerUpId,
      inventory: inventory.powerUps
    });
  });
}