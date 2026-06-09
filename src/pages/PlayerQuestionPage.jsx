import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { usePlayer } from '../context/PlayerContext';
import { useTimer } from '../hooks/useTimer';
import { useFirebaseListener } from '../hooks/useFirebase';
import { dbGet } from '../services/firebase';
import { submitAnswer } from '../services/gameService';
import { soundTick, soundCorrect, soundWrong } from '../utils/sounds';
import { speakText } from '../utils/helpers';
import { spawnFloating } from '../utils/animations';
import Timer from '../components/common/Timer';
import ProgressBar from '../components/common/ProgressBar';
import QuestionCard from '../components/quiz/QuestionCard';
import AnswerGrid from '../components/quiz/AnswerGrid';
import ReactionBar from '../components/quiz/ReactionBar';
import PowerUpBar from '../components/quiz/PowerUpBar';
import AnswerResultOverlay from '../components/quiz/AnswerResultOverlay';
import CountdownOverlay from '../components/quiz/CountdownOverlay';
import { useCountdown } from '../hooks/useCountdown';

export default function PlayerQuestionPage() {
  const navigate = useNavigate();
  const { roomCode, questions, timePerQ, gameMode, currentQ, setCurrentQ } = useGame();
  const { myId, setMyScore, myStreak, setMyStreak, setMyCorrect, setMyWrong, powerups, setPowerups } = usePlayer();
  const { counting, countNum } = useCountdown();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [resultInfo, setResultInfo]         = useState(null);
  const [dimmedAnswers, setDimmedAnswers]   = useState([]);
  const [disabled, setDisabled]             = useState(false);

  // All mutable values in a single ref — the interval reads from here, never from closure.
  // This is the ONLY correct pattern when mixing setInterval with React state.
  const state = useRef({
    answered: false,
    timeLeft: timePerQ,
    roomCode,
    myId,
    timePerQ,
    myStreak,
    gameMode,
    q: null,
  });

  // Sync every render — synchronous, no effects needed
  state.current.roomCode = roomCode;
  state.current.myId     = myId;
  state.current.timePerQ = timePerQ;
  state.current.myStreak = myStreak;
  state.current.gameMode = gameMode;
  state.current.q        = questions[currentQ];

  const q = questions[currentQ];

  // ── Player-side timer ─────────────────────────────────────────────────────
  // The player has their OWN visual timer for UX — it does NOT control the
  // host or question progression. When it expires, the player just submits
  // a null answer (time-out) so they don't miss scoring. The actual question
  // end is driven by the HOST timer via Firebase status changes.
  const { timeLeft, start, stop, addTime } = useTimer(
    timePerQ,
    (t) => {
      state.current.timeLeft = t;
      if (t <= 5 && t > 0) soundTick();
    },
    async () => {
      // Player's local timer expired — submit a timeout answer if not already answered
      const s = state.current;
      if (s.answered) return;
      s.answered = true;
      setDisabled(true);
      setMyStreak(0);
      setMyWrong(prev => prev + 1);
      await submitAnswer(s.roomCode, s.myId, null, s.timePerQ, null, 0);
      const qi = s.q;
      setResultInfo({ isCorrect: false, idx: null, question: qi, pts: 0, streak: 0, isTimeout: true, isSkipped: false });
      soundWrong();
      speakText("Time's Up!", false);
    }
  );

  // ── Reset on new question ─────────────────────────────────────────────────
  useEffect(() => {
    if (!q) return;
    state.current.answered = false;
    state.current.timeLeft = timePerQ;
    setSelectedAnswer(null);
    setResultInfo(null);
    setDimmedAnswers([]);
    setDisabled(false);
    speakText(q.question, false);
    start(timePerQ);
  }, [currentQ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Firebase: react to HOST-driven status changes ─────────────────────────
  // The player NEVER drives progression. They only react to what the host
  // writes to Firebase. Participant answer submission does NOT affect this.
  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/status` : null,
    (status) => {
      if (status === 'leaderboard') {
        // Host has finished scoring — go to leaderboard with fresh data
        dbGet(`rooms/${roomCode}`).then(room =>
          navigate('/leaderboard', { state: { room } })
        );
      } else if (status === 'finished') {
        dbGet(`rooms/${roomCode}/players`).then(p =>
          navigate('/final', { state: { players: p } })
        );
      }
    }
  );

  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/currentQ` : null,
    (idx) => {
      if (idx != null && idx !== currentQ) setCurrentQ(idx);
    }
  );

  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/reactions` : null,
    (data) => {
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
    }
  );

  // ── Answer selection ──────────────────────────────────────────────────────
  // Completely isolated from the host timer. Submitting an answer writes to
  // Firebase (answersCount, answerDist, submittedAnswers) — the host reads
  // those values on its own schedule. Nothing here touches the host timer.
  const handleSelectAnswer = async (idx) => {
    const s = state.current;
    if (s.answered || selectedAnswer !== null) return;
    s.answered = true;

    setSelectedAnswer(idx);
    setDisabled(true);

    const timeUsed  = s.timePerQ - s.timeLeft;
    const isCorrect = idx === s.q.correct;
    let pts      = 0;
    let newStreak = s.myStreak;

    if (isCorrect) {
      const speedBonus  = Math.round(((s.timePerQ - timeUsed) / s.timePerQ) * 500);
      const streakBonus = s.gameMode === 'streak' ? s.myStreak * 100 : 0;
      pts       = 1000 + speedBonus + streakBonus;
      newStreak = s.myStreak + 1;
      setMyStreak(newStreak);
      setMyCorrect(prev => prev + 1);
      setMyScore(prev => prev + pts);
      soundCorrect();
      speakText('Correct!', false);
    } else {
      newStreak = 0;
      setMyStreak(0);
      setMyWrong(prev => prev + 1);
      soundWrong();
      speakText('Wrong!', false);
    }

    // Read fresh room data to get current answerDist/answersCount
    const room = await dbGet(s.roomCode) || {};
    await submitAnswer(s.roomCode, s.myId, idx, timeUsed, room.answerDist, room.answersCount || 0);

    setResultInfo({
      isCorrect, idx,
      question:  s.q,
      pts, streak: newStreak,
      isTimeout: false,
      isSkipped: false,
    });
  };

  // ── Power-ups ─────────────────────────────────────────────────────────────
  const handlePowerup = (type) => {
    const s = state.current;
    if (type === '50' && powerups.fifty) {
      setPowerups(prev => ({ ...prev, fifty: false }));
      const wrong  = [0,1,2,3].filter(i => i !== s.q.correct);
      const toHide = [
        wrong.splice(Math.floor(Math.random() * wrong.length), 1)[0],
        wrong[Math.floor(Math.random() * wrong.length)]
      ];
      setDimmedAnswers(toHide);
    } else if (type === 'time' && powerups.time) {
      setPowerups(prev => ({ ...prev, time: false }));
      addTime(10);
    } else if (type === 'skip' && powerups.skip) {
      setPowerups(prev => ({ ...prev, skip: false }));
      stop();
      s.answered = true;
      setSelectedAnswer(-1);
      setDisabled(true);
      setResultInfo({ isCorrect: false, idx: -1, question: s.q, pts: 0, streak: 0, isTimeout: false, isSkipped: true });
      speakText('Skipped!', false);
    }
  };

  if (!q || !roomCode) { navigate('/'); return null; }

  const progressWidth = (currentQ / questions.length) * 100;

  return (
    <div className="screen" style={{ background: 'none', minHeight: '100vh' }}>
      {counting && <CountdownOverlay num={countNum} />}
      {resultInfo && (
        <AnswerResultOverlay
          isCorrect={resultInfo.isCorrect}
          isTimeout={resultInfo.isTimeout}
          isSkipped={resultInfo.isSkipped}
          pts={resultInfo.pts}
          streak={resultInfo.streak}
          question={resultInfo.question}
          myStreak={resultInfo.streak}
        />
      )}

      <div className="q-layout">
        <div className="q-topbar">
          <span className="q-counter-badge">Q {currentQ + 1}/{questions.length}</span>
          <ProgressBar value={progressWidth} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {myStreak >= 2 && (
              <span className="title" style={{ fontSize: '.82rem', color: '#FFC836' }}>🔥 {myStreak}x</span>
            )}
            <Timer timeLeft={timeLeft} timePerQ={timePerQ} />
          </div>
        </div>

        <QuestionCard question={q.question} isHost={false} />

        <PowerUpBar powerups={powerups} onUse={handlePowerup} gameMode={gameMode} />

        <AnswerGrid
          answers={q.answers}
          selectedAnswer={selectedAnswer}
          onSelect={handleSelectAnswer}
          disabled={disabled}
          dimmedAnswers={dimmedAnswers}
        />

        <ReactionBar roomCode={roomCode} myId={myId} />
      </div>
    </div>
  );
}
