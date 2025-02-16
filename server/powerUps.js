import { POWER_UPS } from './constants/powerUps.js';

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

  socket.on('give_points', ({ lobbyId, username }) => {
    const lobby = lobbies.get(lobbyId);

    lobby.scores[username] += 50;

    io.to(lobbyId).emit('scores_update', lobby.scores);
  })

  socket.on('use_power_up', ({ lobbyId, username, powerUpId, targetUsername }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby || !lobby.playerInventories?.[username]) return;

    const inventory = lobby.playerInventories[username];
    if (!inventory.powerUps[powerUpId] || inventory.powerUps[powerUpId] <= 0) return;

    const powerUp = POWER_UPS.find(p => p.id === powerUpId);
    if (!powerUp) return;

    console.log(powerUp)

    // Consume power-up
    inventory.powerUps[powerUpId]--;

    // Apply power-up effect
    switch (powerUp.effect) {
      case 'make_drink':
  case 'make_shot':
  case 'make_chug':
    if (targetUsername) {
      io.to(lobbyId).emit('drink_command', {
        type: powerUp.effect === 'make_drink' ? 'sip' : 
              powerUp.effect === 'make_chug' ? 'chug' : 
              'shot',
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
        case 'all_game':
          io.to(lobbyId).emit('drink_command', {
            type: 'all_game',
            fromUser: username,
            gameDescription: powerUp.description
          });
          break;
      case 'waterfall':
        io.to(lobbyId).emit('drink_command', {
          type: 'waterfall',
          fromUser: username
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