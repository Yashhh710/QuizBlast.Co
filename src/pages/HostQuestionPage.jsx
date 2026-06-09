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

  const [answerDist, setAnswerDist]           = useState({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [answersCount, setAnswersCount]       = useState(0);
  const [revealedCorrect, setRevealedCorrect] = useState(null);
  const [isQuestionEnded, setIsQuestionEnded] = useState(false);

  // scoredRef: guarantees scoreAndAdvance fires EXACTLY ONCE per question,
  // regardless of whether the timer expired OR all players answered first.
  const scoredRef = useRef(false);

  // Keep a stable ref to the current question so async callbacks never
  // capture a stale closure value.
  const qRef = useRef(questions[currentQ]);
  qRef.current = questions[currentQ];

  const q = questions[currentQ];

  // ─────────────────────────────────────────────────────────────────────────
  // scoreAndShow — the ONE place that ends a question.
  // Called either when: (a) timer hits 0, OR (b) every player answered.
  // Protected by scoredRef so it is idempotent.
  // ─────────────────────────────────────────────────────────────────────────
  const scoreAndShow = useCallback(async () => {
    if (scoredRef.current) return;
    scoredRef.current = true;

    // Stop the timer immediately (no-op if already stopped)
    stop(); // eslint-disable-line react-hooks/exhaustive-deps

    // Stop Firebase polls that are no longer needed
    dbStopListen(`rooms/${roomCode}/answersCount`);
    dbStopListen(`rooms/${roomCode}/answerDist`);

    // Fetch the latest room snapshot — answers submitted up to this moment
    const room    = await dbGet(`rooms/${roomCode}`) || {};
    const subs    = room.submittedAnswers || {};
    const players = room.players || {};

    // Score everyone, update players in Firebase, set status → 'leaderboard'
    // (This is what players are listening to — they will navigate when they
    //  see status === 'leaderboard'.)
    await scoreAndAdvance(roomCode, players, subs, qRef.current, timePerQ, gameMode);

    // Host navigates to leaderboard
    navigate('/leaderboard');
  }, [roomCode, timePerQ, gameMode, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer ─────────────────────────────────────────────────────────────────
  // onExpire: timer hit 0 → score and show leaderboard automatically.
  // This fires independently of what players are doing. The host timer is
  // owned entirely by this component; no participant action can touch it.
  const { timeLeft, start, stop } = useTimer(
    timePerQ,
    (t) => { if (t <= 5 && t > 0) soundTick(); },
    () => {
      // Timer reached 0 — end the question
      setIsQuestionEnded(true);
      scoreAndShow();
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
    dbSet(`rooms/${roomCode}/answerDist`,   { 0: 0, 1: 0, 2: 0, 3: 0 });
    start(timePerQ);
  }, [currentQ]); // eslint-disable-line

  // ── All players answered ──────────────────────────────────────────────────
  // We update the displayed count every tick, but we only trigger scoreAndShow
  // once — when the last player submits. The timer keeps running until then
  // (or until it expires naturally — whichever comes first).
  const handleAnswersCount = useCallback(async (c) => {
    const count = c || 0;
    setAnswersCount(count);

    if (count === 0) return;

    // Fetch player count to see if everyone has answered
    const playersObj = await dbGet(`rooms/${roomCode}/players`);
    const pCount = playersObj ? Object.keys(playersObj).length : 0;

    if (pCount > 0 && count >= pCount) {
      // All players answered — end question early (timer keeps running until
      // scoreAndShow calls stop() inside it, so no visible freeze)
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
          spawnFloating(
            r.emoji,
            Math.random() * window.innerWidth * .8 + window.innerWidth * .1,
            window.innerHeight * .7
          );
        }
      });
    }, [])
  );

  // ── Manual host controls ──────────────────────────────────────────────────
  // "Skip Timer" — host decides to end the question early without waiting.
  const handleSkip = useCallback(() => {
    setIsQuestionEnded(true);
    scoreAndShow();
  }, [scoreAndShow]);

  const handleToggleAnswer = useCallback(() => {
    setRevealedCorrect(prev => prev === q?.correct ? null : q?.correct);
  }, [q]);

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
