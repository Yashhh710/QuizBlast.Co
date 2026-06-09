import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { usePlayer } from '../context/PlayerContext';
import { deleteRoom } from '../services/gameService';
import { dbStopAll } from '../services/firebase';
import { soundWinner } from '../utils/sounds';
import { speakText } from '../utils/helpers';
import Podium from '../components/leaderboard/Podium';
import Leaderboard from '../components/leaderboard/Leaderboard';

export default function FinalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomCode, questions, isHost, reset } = useGame();
  const { myScore, myCorrect, myWrong, resetPlayer } = usePlayer();

  const [players, setPlayers] = useState(null);
  const [sorted, setSorted] = useState([]);

  useEffect(() => {
    const raw = location.state?.players;
    if (raw) {
      setPlayers(raw);
      const list = Object.values(raw).sort((a, b) => b.score - a.score);
      setSorted(list);
      soundWinner();
      if (list.length > 0) {
        speakText(`Game Over! ${list[0].name} wins!`, false);
      }
    }
  }, []); // eslint-disable-line

  const handleReset = useCallback(async () => {
    if (roomCode) await deleteRoom(roomCode);
    dbStopAll();
    reset();
    resetPlayer();
    navigate('/');
  }, [roomCode, reset, resetPlayer, navigate]);

  const acc = questions.length > 0 ? Math.round((myCorrect / questions.length) * 100) : 0;

  return (
    <div className="screen screen-final" style={{ minHeight: '100vh' }}>
      <div className="final-wrap">
        <div className="winner-banner">
          <div style={{ fontSize: '3rem', animation: 'floatBounce .7s infinite alternate' }}>🏆</div>
          <h2 className="title" style={{ fontSize: '2rem', color: '#FFC836', margin: '.4rem 0', animation: 'winnerPulse 2s infinite' }}>
            Game Over!
          </h2>
          <p className="title" style={{ fontSize: '1rem', color: 'rgba(255,255,255,.9)' }}>
            {sorted.length > 0 ? `👑 ${sorted[0].name} wins with ${sorted[0].score} pts!` : 'No players.'}
          </p>
        </div>

        {sorted.length > 0 && <Podium players={sorted} />}

        {!isHost && (
          <div style={{ background: 'rgba(255,200,54,.12)', border: '1.5px solid rgba(255,200,54,.3)', borderRadius: '20px', padding: '20px', marginBottom: '16px', textAlign: 'center' }}>
            <div className="title" style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '10px' }}>Your Stats</div>
            <div className="stat-chips">
              <div className="stat-chip">
                <div className="stat-chip-val">{myScore}</div>
                <div className="stat-chip-lbl">Points</div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-val" style={{ color: '#4caf50' }}>{myCorrect}</div>
                <div className="stat-chip-lbl">Correct</div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-val" style={{ color: '#E21B3C' }}>{myWrong}</div>
                <div className="stat-chip-lbl">Wrong</div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-val" style={{ color: '#B44BE1' }}>{acc}%</div>
                <div className="stat-chip-lbl">Accuracy</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          {players && <Leaderboard players={players} totalQ={questions.length} showAcc={true} />}
        </div>

        {isHost ? (
          <button className="btn btn-yellow btn-lg" onClick={handleReset}>
            🔄 Host New Quiz
          </button>
        ) : (
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.85rem', marginTop: '12px', textAlign: 'center' }}>
            Waiting for Host to reset…
          </p>
        )}
      </div>
    </div>
  );
}
