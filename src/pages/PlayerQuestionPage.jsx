import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  const { myId, myName, myAvatar, myScore, setMyScore, myStreak, setMyStreak, myCorrect, setMyCorrect, myWrong, setMyWrong, powerups, setPowerups } = usePlayer();
  const { counting, countNum, startCountdown } = useCountdown();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [resultInfo, setResultInfo] = useState(null);
  const [dimmedAnswers, setDimmedAnswers] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const answeredRef = useRef(false);
  const timeLeftRef = useRef(timePerQ);

  const q = questions[currentQ];

  const showResult = useCallback((isCorrect, idx, question, pts, streak) => {
    setResultInfo({ isCorrect, idx, question, pts, streak, isTimeout: idx === null, isSkipped: idx === -1 });
    if (isCorrect) { soundCorrect(); speakText('Correct!', false); }
    else if (idx === null) { soundWrong(); speakText("Time's Up!", false); }
    else if (idx === -1) { speakText('Skipped!', false); }
    else { soundWrong(); speakText('Wrong!', false); }
  }, []);

  const handleExpire = useCallback(async () => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setDisabled(true);
    setMyStreak(0);
    setMyWrong(prev => prev + 1);
    const room = await dbGet(`rooms/${roomCode}`) || {};
    const count = (room.answersCount || 0) + 1;
    await submitAnswer(roomCode, myId, null, timePerQ, room.answerDist, room.answersCount || 0);
    showResult(false, null, q, 0, 0);
  }, [roomCode, myId, timePerQ, q, setMyStreak, setMyWrong, showResult]);

  const { timeLeft, start, stop, addTime } = useTimer(timePerQ,
    useCallback((t) => {
      timeLeftRef.current = t;
      if (t <= 5 && t > 0) soundTick();
    }, []),
    handleExpire
  );

  useEffect(() => {
    if (!q) return;
    answeredRef.current = false;
    setSelectedAnswer(null);
    setResultInfo(null);
    setDimmedAnswers([]);
    setDisabled(false);
    timeLeftRef.current = timePerQ;
    speakText(q.question, false);
    start(timePerQ);
  }, [currentQ]); // eslint-disable-line

  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/status` : null,
    useCallback((status) => {
      if (status === 'leaderboard') {
        dbGet(`rooms/${roomCode}`).then(room => {
          navigate('/leaderboard', { state: { room } });
        });
      } else if (status === 'finished') {
        dbGet(`rooms/${roomCode}/players`).then(p => navigate('/final', { state: { players: p } }));
      }
    }, [roomCode, navigate])
  );

  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/currentQ` : null,
    useCallback((idx) => {
      // Sync the question index from Firebase whenever it changes.
      // We do NOT navigate here — LeaderboardPage already navigated us to
      // this page. Navigating again here was causing a double-advance that
      // skipped every second question.
      if (idx != null && idx !== currentQ) {
        setCurrentQ(idx);
      }
    }, [roomCode, currentQ, setCurrentQ])
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

  const handleSelectAnswer = useCallback(async (idx) => {
    if (answeredRef.current || selectedAnswer !== null) return;
    answeredRef.current = true;
    stop();
    setSelectedAnswer(idx);
    setDisabled(true);

    const timeUsed = timePerQ - timeLeftRef.current;
    const isCorrect = idx === q.correct;
    let pts = 0;
    let newStreak = myStreak;

    if (isCorrect) {
      const speedBonus = Math.round(((timePerQ - timeUsed) / timePerQ) * 500);
      const streakBonus = gameMode === 'streak' ? myStreak * 100 : 0;
      pts = 1000 + speedBonus + streakBonus;
      newStreak = myStreak + 1;
      setMyStreak(newStreak);
      setMyCorrect(prev => prev + 1);
      setMyScore(prev => prev + pts);
    } else {
      newStreak = 0;
      setMyStreak(0);
      setMyWrong(prev => prev + 1);
    }

    const room = await dbGet(`rooms/${roomCode}`) || {};
    await submitAnswer(roomCode, myId, idx, timeUsed, room.answerDist, room.answersCount || 0);
    showResult(isCorrect, idx, q, pts, newStreak);
  }, [answeredRef, selectedAnswer, stop, timePerQ, q, myStreak, gameMode, roomCode, myId, setMyStreak, setMyCorrect, setMyScore, setMyWrong, showResult]);

  const handlePowerup = useCallback((type) => {
    if (type === '50' && powerups.fifty) {
      setPowerups(prev => ({ ...prev, fifty: false }));
      const wrong = [0, 1, 2, 3].filter(i => i !== q.correct);
      const toHide = [wrong.splice(Math.floor(Math.random() * wrong.length), 1)[0], wrong[Math.floor(Math.random() * wrong.length)]];
      setDimmedAnswers(toHide);
    } else if (type === 'time' && powerups.time) {
      setPowerups(prev => ({ ...prev, time: false }));
      addTime(10);
    } else if (type === 'skip' && powerups.skip) {
      setPowerups(prev => ({ ...prev, skip: false }));
      stop();
      answeredRef.current = true;
      setSelectedAnswer(-1);
      setDisabled(true);
      showResult(false, -1, q, 0, 0);
    }
  }, [powerups, q, addTime, stop, showResult, setPowerups]);

  if (!q || !roomCode) { navigate('/'); return null; }

  const progressWidth = ((currentQ) / questions.length) * 100;

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
