import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { usePlayer } from '../context/PlayerContext';
import { useCountdown } from '../hooks/useCountdown';
import { useFirebaseListener } from '../hooks/useFirebase';
import { dbGet, dbStopAll } from '../services/firebase';
import { soundKick } from '../utils/sounds';
import CountdownOverlay from '../components/quiz/CountdownOverlay';

export default function PlayerWaitPage() {
  const navigate = useNavigate();
  const { roomCode, setCurrentQ, setQuestions, setTimePerQ, setGameMode } = useGame();
  const { myId, myName, myAvatar, resetPlayer } = usePlayer();
  const { counting, countNum, startCountdown } = useCountdown();

  const [players, setPlayers] = React.useState([]);

  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/players` : null,
    useCallback((data) => {
      const list = data ? Object.values(data) : [];
      setPlayers(list);
      if (data && data[myId] && data[myId].kicked) {
        soundKick();
        showKickedAlert();
      } else if (data && !data[myId] && myId) {
        resetLocalUI();
      }
    }, [myId]) // eslint-disable-line
  );

  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/status` : null,
    useCallback((status) => {
      if (status === 'countdown') {
        startCountdown(() => {}, false);
    } else if (status === 'playing') {
  dbGet(`rooms/${roomCode}`).then(room => {
    if (!room) return;
    setQuestions(room.questions);
    setTimePerQ(room.timePerQ);
    setGameMode(room.gameMode || 'classic');
    const q = room.currentQ || 0;
    setCurrentQ(q);
    navigate('/player-question');
  });
}

      } else if (status === null || status === undefined) {
        resetLocalUI();
      }
    }, [roomCode, navigate, startCountdown, setCurrentQ]) // eslint-disable-line
  );

  function showKickedAlert() {
    const el = document.createElement('div');
    el.className = 'modal-overlay';
    el.innerHTML = `<div class="modal-box" style="text-align:center;">
      <h3 style="font-size:3rem;margin-bottom:10px;">🚪</h3>
      <h3 style="color:#ff6b6b;margin-bottom:10px;">Oops!</h3>
      <p>You were kicked by the host.</p>
      <button class="btn btn-purple btn-sm" style="margin-top:15px;" id="kicked-home-btn">Go Home</button>
    </div>`;
    document.body.appendChild(el);
    document.getElementById('kicked-home-btn').onclick = () => {
      el.remove();
      resetLocalUI();
    };
    dbStopAll();
  }

  function resetLocalUI() {
    dbStopAll();
    navigate('/');
  }

  if (!roomCode) { navigate('/'); return null; }

  return (
    <div className="screen screen-player-wait" style={{ minHeight: '100vh', justifyContent: 'center' }}>
      {counting && <CountdownOverlay num={countNum} />}
      <div style={{ textAlign: 'center', padding: '60px 24px 40px', flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '4.5rem', marginBottom: '8px', animation: 'floatBounce .9s infinite alternate' }}>{myAvatar}</div>
        <h2 className="title" style={{ fontSize: '2.2rem', color: '#FFC836', marginBottom: '4px' }}>You're in! 🎉</h2>
        <p style={{ color: 'rgba(255,255,255,.65)', marginBottom: '20px' }}>Waiting for host to start…</p>
        <div style={{ background: 'rgba(255,255,255,.1)', border: '2px solid rgba(255,255,255,.2)', borderRadius: '20px', padding: '14px 40px', marginBottom: '20px' }}>
          <span className="title" style={{ fontSize: '1.6rem', color: '#fff' }}>{myName}</span>
        </div>
        <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.5)' }}>
          <span className="live-dot"></span>
          <span>{players.length} player{players.length !== 1 ? 's' : ''} in lobby</span>
        </p>
        <div style={{ marginTop: '24px', maxWidth: '380px', width: '100%' }}>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>
            Who's here
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {players.map(p => (
              <div key={p.id} className="player-chip">{p.avatar || '🎮'} {p.name}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
