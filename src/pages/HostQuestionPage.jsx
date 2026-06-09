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
  const endedRef = useRef(false);

  const q = questions[currentQ];
  const progressPct = ((timePerQ - 0) / timePerQ) * 100;

  const handleEnd = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    dbStopListen(`rooms/${roomCode}/answersCount`);
    dbStopListen(`rooms/${roomCode}/answerDist`);

    const room = await dbGet(`rooms/${roomCode}`) || {};
    const subs = room.submittedAnswers || {};
    const players = room.players || {};
    await scoreAndAdvance(roomCode, players, subs, q, timePerQ, gameMode);
    navigate('/leaderboard');
  }, [roomCode, q, timePerQ, gameMode, navigate]);

  const { timeLeft, start, stop } = useTimer(timePerQ,
    useCallback((t) => { if (t <= 5 && t > 0) soundTick(); }, []),
    handleEnd
  );

  useEffect(() => {
    if (!q) return;
    endedRef.current = false;
    setAnswerDist({ 0: 0, 1: 0, 2: 0, 3: 0 });
    setAnswersCount(0);
    setRevealedCorrect(null);
    dbSet(`rooms/${roomCode}/answersCount`, 0);
    dbSet(`rooms/${roomCode}/answerDist`, { 0: 0, 1: 0, 2: 0, 3: 0 });
    start(timePerQ);
  }, [currentQ, roomCode, timePerQ]); // eslint-disable-line

  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/answersCount` : null,
    useCallback(async (c) => {
      setAnswersCount(c || 0);
      if (c && c > 0) {
        const playersObj = await dbGet(`rooms/${roomCode}/players`);
        const pCount = playersObj ? Object.keys(playersObj).length : 0;
        if (pCount > 0 && c >= pCount) {
          stop();
          handleEnd();
        }
      }
    }, [roomCode, stop, handleEnd])
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

  const handleToggleAnswer = useCallback(() => {
    setRevealedCorrect(prev => prev === q.correct ? null : q.correct);
  }, [q]);

  const handleSkip = useCallback(() => {
    stop();
    handleEnd();
  }, [stop, handleEnd]);

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
          <button className="btn btn-yellow btn-sm" onClick={handleSkip} style={{ flex: 1, padding: '12px' }}>
            ⏩ Skip Timer
          </button>
          <button className="btn btn-red btn-sm" onClick={handleEndGame} style={{ flex: 1, padding: '12px' }}>
            ⏹ End Game
          </button>
        </div>
      </div>
    </div>
  );
}
