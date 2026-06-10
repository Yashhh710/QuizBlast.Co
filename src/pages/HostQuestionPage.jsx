import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useTimer } from '../hooks/useTimer';
import { useFirebaseListener } from '../hooks/useFirebase';
import { dbGet, dbSet, dbStopListen, dbUpdate } from '../services/firebase';
import { scoreAndAdvance } from '../services/gameService';
import { simulateBotAnswer } from '../utils/botPlayer';
import { soundTick } from '../utils/sounds';
import { spawnFloating } from '../utils/animations';
import Timer from '../components/common/Timer';
import ProgressBar from '../components/common/ProgressBar';
import QuestionCard from '../components/quiz/QuestionCard';
import HostAnswerStats from '../components/quiz/HostAnswerStats';

export default function HostQuestionPage() {
  const navigate = useNavigate();
  const { roomCode, questions, timePerQ, gameMode, currentQ } = useGame();

  const [answerDist, setAnswerDist]           = useState({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [answersCount, setAnswersCount]       = useState(0);
  const [revealedCorrect, setRevealedCorrect] = useState(null);
  const [isQuestionEnded, setIsQuestionEnded] = useState(false);

  const scoredRef    = useRef(false);
  const botCancels   = useRef([]); // array of cancel fns for ALL bots
  const botsRef      = useRef([]);  // cached bot list so no async race

  const qRef = useRef(questions[currentQ]);
  qRef.current = questions[currentQ];
  const q = questions[currentQ];

  // Cancel all pending bot timeouts
  const cancelAllBots = useCallback(() => {
    botCancels.current.forEach(fn => fn());
    botCancels.current = [];
  }, []);

  const scoreAndShow = useCallback(async () => {
    if (scoredRef.current) return;
    scoredRef.current = true;

    cancelAllBots();
    stop(); // eslint-disable-line react-hooks/exhaustive-deps
    dbStopListen(`rooms/${roomCode}/answersCount`);
    dbStopListen(`rooms/${roomCode}/answerDist`);

    const room    = await dbGet(`rooms/${roomCode}`) || {};
    const subs    = room.submittedAnswers || {};
    const players = room.players || {};

    await scoreAndAdvance(roomCode, players, subs, qRef.current, timePerQ, gameMode);
    navigate('/leaderboard');
  }, [roomCode, timePerQ, gameMode, navigate, cancelAllBots]); // eslint-disable-line

  const { timeLeft, start, stop } = useTimer(
    timePerQ,
    (t) => { if (t <= 5 && t > 0) soundTick(); },
    () => {
      setIsQuestionEnded(true);
      scoreAndShow();
    }
  );

  // ── Reset on new question ─────────────────────────────────────────────────
  useEffect(() => {
    if (!q) return;

    // Cancel any leftover bot timers from previous question
    cancelAllBots();

    scoredRef.current = false;
    setAnswerDist({ 0: 0, 1: 0, 2: 0, 3: 0 });
    setAnswersCount(0);
    setRevealedCorrect(null);
    setIsQuestionEnded(false);
    dbSet(`rooms/${roomCode}/answersCount`, 0);
    dbSet(`rooms/${roomCode}/answerDist`,   { 0: 0, 1: 0, 2: 0, 3: 0 });
    start(timePerQ);

    // Schedule bot answers — use already-cached bots if available,
    // otherwise fetch once and cache so we never re-fetch mid-question.
    const scheduleBots = (bots) => {
      bots.forEach(bot => {
        // Don't schedule if question already ended (very fast host skip)
        if (scoredRef.current) return;
        const cancel = simulateBotAnswer(roomCode, bot, q, timePerQ, null);
        botCancels.current.push(cancel);
      });
    };

    if (botsRef.current.length > 0) {
      scheduleBots(botsRef.current);
    } else {
      dbGet(`rooms/${roomCode}/players`).then(playersObj => {
        if (!playersObj) return;
        const bots = Object.values(playersObj).filter(p => p.isBot);
        botsRef.current = bots;
        scheduleBots(bots);
      });
    }
  }, [currentQ]); // eslint-disable-line

  // ── All players answered ──────────────────────────────────────────────────
  const handleAnswersCount = useCallback(async (c) => {
    const count = c || 0;
    setAnswersCount(count);
    if (count === 0) return;

    const playersObj = await dbGet(`rooms/${roomCode}/players`);
    const pCount = playersObj ? Object.keys(playersObj).length : 0;

    if (pCount > 0 && count >= pCount) {
      setIsQuestionEnded(true);
      scoreAndShow();
    }
  }, [roomCode, scoreAndShow]);

  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/answersCount` : null,
    handleAnswersCount
  );

  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/answerDist` : null,
    useCallback((dist) => { if (dist) setAnswerDist(dist); }, [])
  );

  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/reactions` : null,
    useCallback((data) => {
      if (!data) return;
      Object.values(data).forEach(r => {
        if (Date.now() - r.ts < 3000) {
          spawnFloating(r.emoji, Math.random() * window.innerWidth * .8 + window.innerWidth * .1, window.innerHeight * .7);
        }
      });
    }, [])
  );

  const handleSkip = useCallback(() => {
    setIsQuestionEnded(true);
    scoreAndShow();
  }, [scoreAndShow]);

  const handleToggleAnswer = useCallback(() => {
    setRevealedCorrect(prev => prev === q?.correct ? null : q?.correct);
  }, [q]);

  const handleEndGame = useCallback(async () => {
    cancelAllBots();
    stop();
    await dbUpdate(`rooms/${roomCode}`, { status: 'finished' });
    const plist = await dbGet(`rooms/${roomCode}/players`);
    navigate('/final', { state: { players: plist } });
  }, [roomCode, stop, navigate, cancelAllBots]);

  if (!q || !roomCode) { navigate('/'); return null; }

  const progressWidth = ((timePerQ - timeLeft) / timePerQ) * 100;

  return (
    <div className="screen" style={{ background: 'none', minHeight: '100vh' }}>
      <div className="q-layout">
        <div className="q-topbar">
          <span className="q-counter-badge">Q {currentQ + 1}/{questions.length}</span>
          <ProgressBar value={progressWidth} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="answers-answered">{answersCount} answered</span>
            <Timer timeLeft={timeLeft} timePerQ={timePerQ} />
          </div>
        </div>

        <QuestionCard question={q.question} isHost={true} />

        <HostAnswerStats
          answerDist={answerDist}
          answers={q.answers}
          revealedCorrect={revealedCorrect}
        />

        <div className="host-controls">
          <button
            className="btn btn-purple btn-sm"
            onClick={handleToggleAnswer}
            style={{ flex: 1, padding: '12px' }}
          >
            {revealedCorrect !== null ? '🙈 Hide Answer' : '👁 Show Answer'}
          </button>

          {!isQuestionEnded && (
            <button
              className="btn btn-yellow btn-sm"
              onClick={handleSkip}
              style={{ flex: 1, padding: '12px' }}
            >
              ⏩ Skip Timer
            </button>
          )}

          <button
            className="btn btn-red btn-sm"
            onClick={handleEndGame}
            style={{ flex: 1, padding: '12px' }}
          >
            ⏹ End Game
          </button>
        </div>
      </div>
    </div>
  );
}
