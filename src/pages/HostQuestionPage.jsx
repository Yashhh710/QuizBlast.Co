import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useTimer } from '../hooks/useTimer';
import { useFirebaseListener } from '../hooks/useFirebase';
import { dbGet, dbSet, dbStopListen } from '../services/firebase';
import { scoreAndAdvance } from '../services/gameService';
import { dbUpdate } from '../services/firebase';
import { soundTick } from '../utils/sounds';
import { spawnFloating } from '../utils/animations';
import Timer from '../components/common/Timer';
import ProgressBar from '../components/common/ProgressBar';
import QuestionCard from '../components/quiz/QuestionCard';
import HostAnswerStats from '../components/quiz/HostAnswerStats';

export default function HostQuestionPage() {
  const navigate = useNavigate();
  const { roomCode, questions, timePerQ, gameMode, currentQ, setCurrentQ } = useGame();

  const [answerDist, setAnswerDist] = useState({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [answersCount, setAnswersCount] = useState(0);
  const [revealedCorrect, setRevealedCorrect] = useState(null);
  // When true: timer has ended or all answered — waiting for host to click Next
  const [isQuestionEnded, setIsQuestionEnded] = useState(false);
  const scoredRef = useRef(false);

  const q = questions[currentQ];

  // Stop timer and mark question ended — does NOT navigate
  const handleTimerEnd = useCallback(() => {
    stop(); // eslint-disable-line no-use-before-define
    setIsQuestionEnded(true);
  }, []); // stop is stable, defined below

  const { timeLeft, start, stop } = useTimer(
    timePerQ,
    useCallback((t) => { if (t <= 5 && t > 0) soundTick(); }, []),
    handleTimerEnd   // ← timer expiry just ends the question, never navigates
  );

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
  }, [currentQ, roomCode, timePerQ]); // eslint-disable-line

  // When all players have answered: stop the timer, but wait for host to click Next
  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/answersCount` : null,
    useCallback(async (c) => {
      setAnswersCount(c || 0);
      if (c && c > 0) {
        const playersObj = await dbGet(`rooms/${roomCode}/players`);
        const pCount = playersObj ? Object.keys(playersObj).length : 0;
        if (pCount > 0 && c >= pCount) {
          stop();
          setIsQuestionEnded(true);
        }
      }
    }, [roomCode, stop])
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

  // Manual Next — scores answers then navigates to leaderboard
  const handleNext = useCallback(async () => {
    if (scoredRef.current) return;
    scoredRef.current = true;
    stop();
    dbStopListen(`rooms/${roomCode}/answersCount`);
    dbStopListen(`rooms/${roomCode}/answerDist`);

    const room = await dbGet(`rooms/${roomCode}`) || {};
    const subs = room.submittedAnswers || {};
    const players = room.players || {};
    await scoreAndAdvance(roomCode, players, subs, q, timePerQ, gameMode);
    navigate('/leaderboard');
  }, [roomCode, q, timePerQ, gameMode, navigate, stop]);

  const handleToggleAnswer = useCallback(() => {
    setRevealedCorrect(prev => prev === q.correct ? null : q.correct);
  }, [q]);

  // Skip just stops the timer early and reveals the Next button
  const handleSkip = useCallback(() => {
    stop();
    setIsQuestionEnded(true);
  }, [stop]);

  const handleEndGame = useCallback(async () => {
    stop();
    await dbUpdate(`rooms/${roomCode}`, { status: 'finished' });
    const plist = await dbGet(`rooms/${roomCode}/players`);
    navigate('/final', { state: { players: plist } });
  }, [roomCode, stop, navigate]);

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
            <button className="btn btn-yellow btn-sm" onClick={handleNext} style={{ flex: 1, padding: '12px' }}>
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
