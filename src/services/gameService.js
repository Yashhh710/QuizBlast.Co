import { dbSet, dbGet, dbUpdate, dbDelete } from './firebase';

export async function createRoom(roomCode, questions, timePerQ, gameMode) {
  await dbSet(`rooms/${roomCode}`, {
    status: 'lobby',
    questions,
    timePerQ,
    currentQ: 0,
    gameMode,
    createdAt: Date.now()
  });
}

export async function startGame(roomCode) {
  await dbUpdate(`rooms/${roomCode}`, { status: 'countdown', currentQ: 0 });
}

export async function advanceQuestion(roomCode, qIndex, total) {
  if (qIndex >= total) {
    await dbUpdate(`rooms/${roomCode}`, { status: 'finished' });
  } else {
    await dbUpdate(`rooms/${roomCode}`, { status: 'playing', currentQ: qIndex });
  }
}

export async function submitAnswer(roomCode, myId, answerIdx, timeUsed, currentDist, currentCount) {
  const dist = { ...(currentDist || { 0: 0, 1: 0, 2: 0, 3: 0 }) };
  if (answerIdx >= 0) dist[answerIdx] = (dist[answerIdx] || 0) + 1;
  await dbUpdate(`rooms/${roomCode}`, {
    answersCount: (currentCount || 0) + 1,
    answerDist: dist
  });
  await dbSet(`rooms/${roomCode}/submittedAnswers/${myId}`, { answer: answerIdx, timeUsed });
}

export async function scoreAndAdvance(roomCode, players, submittedAnswers, question, timePerQ, gameMode) {
  const updatedPlayers = { ...players };
  Object.keys(submittedAnswers).forEach(pId => {
    if (!updatedPlayers[pId]) return;
    const ans = submittedAnswers[pId].answer;
    if (ans === question.correct) {
      const base = 1000;
      const speedBonus = Math.round(((timePerQ - submittedAnswers[pId].timeUsed) / timePerQ) * 500);
      updatedPlayers[pId].streak = (updatedPlayers[pId].streak || 0) + 1;
      const streakBonus = gameMode === 'streak' ? (updatedPlayers[pId].streak - 1) * 100 : 0;
      updatedPlayers[pId].score = (updatedPlayers[pId].score || 0) + base + speedBonus + streakBonus;
      updatedPlayers[pId].correct = (updatedPlayers[pId].correct || 0) + 1;
    } else {
      updatedPlayers[pId].streak = 0;
      if (ans !== -1) updatedPlayers[pId].wrong = (updatedPlayers[pId].wrong || 0) + 1;
    }
  });
  await dbUpdate(`rooms/${roomCode}`, { players: updatedPlayers, status: 'leaderboard' });
  await dbDelete(`rooms/${roomCode}/submittedAnswers`);
  return updatedPlayers;
}

export async function deleteRoom(roomCode) {
  await dbDelete(`rooms/${roomCode}`);
}
