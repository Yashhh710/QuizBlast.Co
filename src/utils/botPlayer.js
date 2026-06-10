import { AVATARS } from './constants';
import { submitAnswer } from '../services/gameService';

// Bot difficulty settings
export const BOT_DIFFICULTIES = {
  easy:   { label: '🟢 Easy',   accuracy: 0.40, minDelay: 8000,  maxDelay: 14000 },
  medium: { label: '🟡 Medium', accuracy: 0.65, minDelay: 5000,  maxDelay: 12000 },
  hard:   { label: '🔴 Hard',   accuracy: 0.85, minDelay: 2000,  maxDelay: 6000  },
};

const MIN_BOT_DELAY_MS = 2000; // bots never answer in under 2 seconds

export function createBot(difficulty = 'medium') {
  const names = ['QuizBot', 'RoboRival', 'BrainBot', 'NeuralNick', 'CyberAce'];
  const name  = names[Math.floor(Math.random() * names.length)];
  const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  const id = 'bot_' + Date.now();
  return {
    id,
    name,
    avatar,
    isBot: true,
    difficulty,
    score: 0,
    streak: 0,
    correct: 0,
    wrong: 0,
    joinedAt: Date.now(),
  };
}

// Simulate a bot answering during a question.
// Returns a cancel function — call it to abort if the question ends early.
export function simulateBotAnswer(roomCode, bot, question, timePerQ, onDone) {
  const cfg = BOT_DIFFICULTIES[bot.difficulty] || BOT_DIFFICULTIES.medium;

  // Random delay within difficulty range
  const rawDelay = cfg.minDelay + Math.random() * (cfg.maxDelay - cfg.minDelay);

  // Never faster than MIN_BOT_DELAY_MS
  const clampedDelay = Math.max(rawDelay, MIN_BOT_DELAY_MS);

  // Never later than 1.5s before time runs out
  const safeCap = (timePerQ * 1000) - 1500;
  const actualDelay = Math.min(clampedDelay, Math.max(safeCap, MIN_BOT_DELAY_MS));

  let cancelled = false;

  const tid = setTimeout(async () => {
    if (cancelled) return;

    const isCorrect = Math.random() < cfg.accuracy;
    const correct   = question.correct;
    let answerIdx;

    if (isCorrect) {
      answerIdx = correct;
    } else {
      const wrong = [0, 1, 2, 3].filter(i => i !== correct);
      answerIdx = wrong[Math.floor(Math.random() * wrong.length)];
    }

    const timeUsed = actualDelay / 1000;

    try {
      await submitAnswer(roomCode, bot.id, answerIdx, timeUsed);
    } catch (e) {
      // Game ended before bot could submit — ignore
    }

    if (onDone) onDone();
  }, actualDelay);

  return () => {
    cancelled = true;
    clearTimeout(tid);
  };
}
