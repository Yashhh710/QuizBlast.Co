import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useFirebaseListener } from '../hooks/useFirebase';
import { dbGet } from '../services/firebase';
import { advanceQuestion } from '../services/gameService';
import Leaderboard from '../components/leaderboard/Leaderboard';

export default function LeaderboardPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { roomCode, questions, currentQ, setCurrentQ, isHost } = useGame();

  const [players, setPlayers] = useState(null);

  // ── Load player scores ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      // Prefer freshly-fetched data so scores are always up-to-date
      const room = await dbGet(`rooms/${roomCode}`);
      if (room?.players) {
        setPlayers(room.players);
      } else if (location.state?.room?.players) {
        setPlayers(location.state.room.players);
      }
    };
    load();
  }, [roomCode]); // eslint-disable-line

  // Sync currentQ from Firebase when leaderboard mounts on host side.
  // Prevents stale context causing handleNext to skip a question.
  useEffect(() => {
    if (!isHost || !roomCode) return;
    dbGet(`rooms/${roomCode}/currentQ`).then(q => {
      if (q != null) setCurrentQ(q);
    });
  }, [roomCode, isHost, setCurrentQ]);

  // ── Players listen for status changes ─────────────────────────────────────
  // Host drives progression; players just react to Firebase status.
  useFirebaseListener(
    !isHost && roomCode ? `rooms/${roomCode}/status` : null,
    useCallback((status) => {
      if (status === 'playing') {
        // PlayerQuestionPage's own currentQ listener will sync the index
        navigate('/player-question');
      } else if (status === 'finished') {
        dbGet(`rooms/${roomCode}/players`).then(p =>
          navigate('/final', { state: { players: p } })
        );
      }
    }, [roomCode, navigate])
  );

  // ── Host: advance to next question ────────────────────────────────────────
  const handleNext = useCallback(async () => {
    // Always read currentQ live from Firebase — avoids stale context
    const liveQ = await dbGet(`rooms/${roomCode}/currentQ`);
    const nextQ = (liveQ ?? currentQ) + 1;

    if (nextQ >= questions.length) {
      const plist = await dbGet(`rooms/${roomCode}/players`);
      await advanceQuestion(roomCode, nextQ, questions.length);
      navigate('/final', { state: { players: plist } });
    } else {
      setCurrentQ(nextQ);
      await advanceQuestion(roomCode, nextQ, questions.length);
      navigate('/host-question');
    }
  }, [currentQ, questions.length, roomCode, navigate, setCurrentQ]);

  return (
    <div className="screen screen-leaderboard-mid" style={{ minHeight: '100vh' }}>
      <div className="lb-header">
        <div style={{ fontSize: '2.8rem', animation: 'floatBounce .8s infinite alternate' }}>🏆</div>
        <h2 className="title" style={{ fontSize: '1.8rem', color: '#fff', margin: '.4rem 0' }}>
          Leaderboard
        </h2>
        <p style={{ color: 'rgba(255,255,255,.6)' }}>
          After Question {currentQ + 1} of {questions.length}
        </p>
      </div>

      <div className="lb-body">
        {players && (
          <Leaderboard players={players} totalQ={questions.length} showAcc={false} />
        )}

        {isHost && (
          <button
            className="btn btn-yellow btn-lg"
            onClick={handleNext}
            style={{ marginTop: '4px' }}
          >
            {currentQ + 1 >= questions.length ? '🏁 View Final Results' : 'Next Question →'}
          </button>
        )}

        {!isHost && (
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.85rem', marginTop: '14px', textAlign: 'center' }}>
            Waiting for host…
          </p>
        )}
      </div>
    </div>
  );
}
