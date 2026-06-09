import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useTimer } from '../hooks/useTimer';
import { useFirebaseListener } from '../hooks/useFirebase';
import { dbGet, dbSet, dbStopListen, dbUpdate } from '../services/firebase';
import { scoreAndAdvance } from '../services/gameService';
import { soundTick } from '../utils/sounds';
import { spawnFloating } from '../utils/animations';
import Timer from '../components/common/Timer';
import ProgressBar from '../components/common/ProgressBar';
import QuestionCard from '../components/quiz/QuestionCard';
import HostAnswerStats from '../components/quiz/HostAnswerStats';

export default function HostQuestionPage() {
  const navigate = useNavigate();
  const { roomCode, questions, timePerQ, gameMode, currentQ } = useGame();

  const [answerDist, setAnswerDist] = useState({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [answersCount, setAnswersCount] = useState(0);
  const [revealedCorrect, setRevealedCorrect] = useState(null);
  const [isQuestionEnded, setIsQuestionEnded] = useState(false);

  // scoredRef prevents double-scoring if timer expires AND host clicks Next simultaneously
  const scoredRef = useRef(false);

  const q = questions[currentQ];

  // ── Core advance logic — in a ref so onExpire (and other callbacks) can
  //    call it without ever capturing a stale closure.
  const advanceRef = useRef(null);

  const handleNext = useCallback(async () => {
    if (scoredRef.current) return;
    scoredRef.current = true;
    stop(); // stop() is stable (useCallback in useTimer)
    dbStopListen(`rooms/${roomCode}/answersCount`);
    dbStopListen(`rooms/${roomCode}/answerDist`);
    const room = await dbGet(`rooms/${roomCode}`) || {};
    const subs = room.submittedAnswers || {};
    const players = room.players || {};
    // q is captured at call time — use the ref version to avoid stale closure
    const currentQuestion = advanceRef.current?.q;
    await scoreAndAdvance(roomCode, players, subs, currentQuestion, timePerQ, gameMode);
    navigate('/leaderboard');
  }, [roomCode, timePerQ, gameMode, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep advanceRef in sync with latest values every render
  advanceRef.current = { q, handleNext };

  // ── Timer — onExpire now auto-advances to leaderboard ──────────────────────
  const { timeLeft, start, stop } = useTimer(
    timePerQ,
    (t) => { if (t <= 5 && t > 0) soundTick(); },
    () => {
      // Time reached 0 — score and go to leaderboard automatically
      setIsQuestionEnded(true);
      advanceRef.current?.handleNext();
    }
  );

  // ── Reset on new question ─────────────────────────────────────────────────
  useEffect(() => {
    if (!q) return;
    scoredRef.current = false;
    setAnswerDist({ 0: 0, 1: 0, 2: 0, 3: 0 });
    setAnswersCount(0);
    setRevealedCorrect(null);
    setIsQuestionEnded(false);
    dbSet(`rooms/${roomCode}/answersCount`, 0);
    dbSet(`rooms/${roomCode}/answerDist`, { 0: 0, 1: 0, 2: 0, 3: 0 });
    start(timePerQ);
  }, [currentQ]); // eslint-disable-line

  // ── All players answered → stop timer and auto-advance ───────────────────
  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/answersCount` : null,
    async (c) => {
      setAnswersCount(c || 0);
      if (c && c > 0) {
        const playersObj = await dbGet(`rooms/${roomCode}/players`);
        const pCount = playersObj ? Object.keys(playersObj).length : 0;
        if (pCount > 0 && c >= pCount) {
          stop();
          setIsQuestionEnded(true);
          // All players answered — advance immediately
          advanceRef.current?.handleNext();
        }
      }
    }
  );

  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/answerDist` : null,
    (dist) => { if (dist) setAnswerDist(dist); }
  );

  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/reactions` : null,
    (data) => {
      if (!data) return;
      Object.values(data).forEach(r => {
        if (Date.now() - r.ts < 3000) {
          spawnFloating(r.emoji, Math.random() * window.innerWidth * .8 + window.innerWidth * .1, window.innerHeight * .7);
        }
      });
    }
  );

  // ── Skip timer early → advance now ───────────────────────────────────────
  const handleSkip = () => {
    stop();
    setIsQuestionEnded(true);
    advanceRef.current?.handleNext();
  };

  const handleToggleAnswer = () => {
    setRevealedCorrect(prev => prev === q.correct ? null : q.correct);
  };

  const handleEndGame = async () => {
    stop();
    await dbUpdate(`rooms/${roomCode}`, { status: 'finished' });
    const plist = await dbGet(`rooms/${roomCode}/players`);
    navigate('/final', { state: { players: plist } });
  };

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
          <button className="btn btn-purple btn-sm" onClick={handleToggleAnswer} style={{ flex: 1, padding: '12px' }}>
            {revealedCorrect !== null ? '🙈 Hide Answer' : '👁 Show Answer'}
          </button>

          {!isQuestionEnded ? (
            <button className="btn btn-yellow btn-sm" onClick={handleSkip} style={{ flex: 1, padding: '12px' }}>
              ⏩ Skip Timer
            </button>
          ) : (
            <button className="btn btn-green btn-sm" onClick={() => advanceRef.current?.handleNext()} style={{ flex: 1, padding: '12px' }}>
              ➡️ Next Question
            </button>
          )}

          <button className="btn btn-red btn-sm" onClick={handleEndGame} style={{ flex: 1, padding: '12px' }}>
            ⏹ End Game
          </button>
        </div>
      </div>
    </div>
  );
}
