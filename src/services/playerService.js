import { dbSet, dbUpdate, dbDelete } from './firebase';

export async function joinRoom(roomCode, playerId, name, avatar) {
  await dbSet(`rooms/${roomCode}/players/${playerId}`, {
    name,
    avatar,
    id: playerId,
    score: 0,
    streak: 0,
    correct: 0,
    wrong: 0,
    joinedAt: Date.now()
  });
}

export async function kickPlayer(roomCode, playerId) {
  await dbUpdate(`rooms/${roomCode}/players/${playerId}`, { kicked: true });
  setTimeout(() => dbDelete(`rooms/${roomCode}/players/${playerId}`), 2500);
}

export async function renamePlayer(roomCode, playerId, newName) {
  await dbUpdate(`rooms/${roomCode}/players/${playerId}`, { name: newName });
}

export async function sendReaction(roomCode, playerId, emoji) {
  await dbSet(`rooms/${roomCode}/reactions/${playerId}`, { emoji, ts: Date.now() });
}
