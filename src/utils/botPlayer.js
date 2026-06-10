import { AVATARS } from './constants';
import { submitAnswer } from '../services/gameService';

// Bot difficulty settings
export const BOT_DIFFICULTIES = {
  easy:   { label: '🟢 Easy',   accuracy: 0.40, minDelay: 8000, maxDelay: 14000 },
  medium: { label: '🟡 Medium', accuracy: 0.65, minDelay: 4000, maxDelay: 10000 },
  hard:   { label: '🔴 Hard',   accuracy: 0.85, minDelay: 1500, maxDelay: 5000  },
};

// Generate a bot player object to add to Firebase players node
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
// Returns a cleanup function (call it if the question ends early).
export function simulateBotAnswer(roomCode, bot, question, timePerQ, onDone) {
  const cfg = BOT_DIFFICULTIES[bot.difficulty] || BOT_DIFFICULTIES.medium;
  const delay = cfg.minDelay + Math.random() * (cfg.maxDelay - cfg.minDelay);
  // Clamp so bot always answers before time runs out (leave 800ms margin)
  const safeCap = (timePerQ * 1000) - 800;
  const actualDelay = Math.min(delay, safeCap);

  const tid = setTimeout(async () => {
    const correct = question.correct;
    const isCorrect = Math.random() < cfg.accuracy;
    let answerIdx;
    if (isCorrect) {
      answerIdx = correct;
    } else {
      // Pick a wrong answer randomly
      const wrong = [0, 1, 2, 3].filter(i => i !== correct);
      answerIdx = wrong[Math.floor(Math.random() * wrong.length)];
    }
    const timeUsed = actualDelay / 1000;
    try {
      await submitAnswer(roomCode, bot.id, answerIdx, timeUsed);
    } catch (e) {
      // Silently ignore if game ended before bot could submit
    }
    if (onDone) onDone();
  }, actualDelay);

  // Return cancel function
  return () => clearTimeout(tid);
}
