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

// submitAnswer — writes the player's individual answer and updates the
// aggregated answerDist/answersCount counters.
//
// To avoid a race condition where two players submit simultaneously and both
// read the same stale count (resulting in count = N instead of N+1 for the
// second writer), we always fetch a fresh snapshot of the answer counters
// immediately before writing. Firebase REST API doesn't support transactions
// so this is the best we can do without a Cloud Function; the 1200ms poll
// cadence means the race window is small in practice.
export async function submitAnswer(roomCode, myId, answerIdx, timeUsed) {
  // Always fetch fresh counters — never trust caller-supplied stale values
  const room = await dbGet(`rooms/${roomCode}`) || {};
  const currentDist  = room.answerDist  || { 0: 0, 1: 0, 2: 0, 3: 0 };
  const currentCount = room.answersCount || 0;

  const dist = { ...currentDist };
  if (answerIdx != null && answerIdx >= 0) {
    dist[answerIdx] = (dist[answerIdx] || 0) + 1;
  }

  // Write the aggregate update and the individual answer in parallel
  await Promise.all([
    dbUpdate(`rooms/${roomCode}`, {
      answersCount: currentCount + 1,
      answerDist:   dist
    }),
    dbSet(`rooms/${roomCode}/submittedAnswers/${myId}`, {
      answer:   answerIdx,
      timeUsed: timeUsed
    })
  ]);
}

export async function scoreAndAdvance(roomCode, players, submittedAnswers, question, timePerQ, gameMode) {
  const updatedPlayers = { ...players };

  // Reset streak for anyone who timed out without submitting
  Object.keys(updatedPlayers).forEach(pId => {
    if (!submittedAnswers[pId]) {
      updatedPlayers[pId].streak = 0;
    }
  });

  // Score everyone who submitted
  Object.keys(submittedAnswers).forEach(pId => {
    if (!updatedPlayers[pId]) return;
    const ans = submittedAnswers[pId].answer;

    if (ans === question.correct) {
      const base        = 1000;
      const speedBonus  = Math.round(((timePerQ - submittedAnswers[pId].timeUsed) / timePerQ) * 500);
      updatedPlayers[pId].streak  = (updatedPlayers[pId].streak || 0) + 1;
      const streakBonus = gameMode === 'streak' ? (updatedPlayers[pId].streak - 1) * 100 : 0;
      updatedPlayers[pId].score   = (updatedPlayers[pId].score || 0) + base + speedBonus + streakBonus;
      updatedPlayers[pId].correct = (updatedPlayers[pId].correct || 0) + 1;
    } else {
      updatedPlayers[pId].streak = 0;
      if (ans !== -1 && ans !== null) {
        updatedPlayers[pId].wrong = (updatedPlayers[pId].wrong || 0) + 1;
      }
    }
  });

  // Setting status → 'leaderboard' is what triggers all players to navigate.
  // This MUST happen atomically with the player score update so players see
  // correct scores when they arrive at the leaderboard.
  await dbUpdate(`rooms/${roomCode}`, {
    players: updatedPlayers,
    status:  'leaderboard'
  });

  // Clean up submitted answers after scoring
  await dbDelete(`rooms/${roomCode}/submittedAnswers`);

  return updatedPlayers;
}

export async function deleteRoom(roomCode) {
  await dbDelete(`rooms/${roomCode}`);
}
