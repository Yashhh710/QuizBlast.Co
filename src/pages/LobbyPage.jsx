import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useFirebaseListener } from '../hooks/useFirebase';
import { useCountdown } from '../hooks/useCountdown';
import { kickPlayer, renamePlayer } from '../services/playerService';
import { dbDelete, dbGet } from '../services/firebase';
import { startGame } from '../services/gameService';
import { soundPop } from '../utils/sounds';
import { spawnFloating } from '../utils/animations';
import RoomCode from '../components/lobby/RoomCode';
import QRCodeCard from '../components/lobby/QRCodeCard';
import PlayerList from '../components/lobby/PlayerList';
import RenamePlayerModal from '../components/modals/RenamePlayerModal';
import KickPlayerModal from '../components/modals/KickPlayerModal';
import CountdownOverlay from '../components/quiz/CountdownOverlay';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { roomCode, questions, timePerQ, gameMode, setCurrentQ } = useGame();
  const { counting, countNum, startCountdown } = useCountdown();

  const [players, setPlayers] = useState([]);
  const [renameTarget, setRenameTarget] = useState(null);
  const [kickTarget, setKickTarget] = useState(null);
  const lastCountRef = useRef(0);

  const joinURL = window.location.origin + '/?room=' + roomCode;

  useFirebaseListener(
    roomCode ? `rooms/${roomCode}/players` : null,
    useCallback((data) => {
      const list = data ? Object.values(data) : [];
      if (list.length > lastCountRef.current) soundPop();
      lastCountRef.current = list.length;
      setPlayers(list);
    }, [])
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

  const handleStart = useCallback(async () => {
    await startGame(roomCode);
    startCountdown(() => {
      setCurrentQ(0);
      navigate('/host-question');
    }, true);
  }, [roomCode, navigate, startCountdown, setCurrentQ]);

  const handleKickAll = useCallback(async () => {
    const ps = await dbGet(`rooms/${roomCode}/players`);
    if (!ps) return;
    await Promise.all(Object.keys(ps).map(id => dbDelete(`rooms/${roomCode}/players/${id}`)));
  }, [roomCode]);

  const handleRename = useCallback(async (newName) => {
    if (!newName.trim() || !renameTarget) return;
    await renamePlayer(roomCode, renameTarget.id, newName.trim());
    setRenameTarget(null);
  }, [roomCode, renameTarget]);

  const handleKick = useCallback(async () => {
    if (!kickTarget) return;
    await kickPlayer(roomCode, kickTarget.id);
    setKickTarget(null);
  }, [roomCode, kickTarget]);

  if (!roomCode) {
    navigate('/');
    return null;
  }

  return (
    <div className="screen screen-lobby" style={{ minHeight: '100vh' }}>
      {counting && <CountdownOverlay num={countNum} />}

      <div className="lobby-top">
        <div className="logo" style={{ fontSize: '1.6rem', marginBottom: '8px' }}>⚡ QuizBlast</div>
        <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.85rem', marginBottom: '12px' }}>
          📱 Players join at <strong style={{ color: '#FFC836' }}>quizblast.app</strong> with the code
        </p>
        <RoomCode code={roomCode} />
        <QRCodeCard url={joinURL} />
        <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>
          {questions.length} questions · {timePerQ}s each · {gameMode}
        </div>
      </div>

      <div className="lobby-players">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 className="title" style={{ fontSize: '1rem', color: '#fff' }}>
            <span className="live-dot"></span>Players{' '}
            <span className="badge">{players.length}</span>
          </h3>
        </div>

        <PlayerList
          players={players}
          onRename={(id, name) => setRenameTarget({ id, name })}
          onKick={(id, name) => setKickTarget({ id, name })}
        />

        <div className="divider" />
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-yellow btn-lg"
            onClick={handleStart}
            disabled={players.length === 0}
            style={{ flex: 2 }}
          >
            ▶ Start Game
          </button>
          <button
            className="btn btn-red btn-md"
            onClick={handleKickAll}
            disabled={players.length === 0}
            style={{ flex: 1, minWidth: '100px' }}
          >
            🚪 Kick All
          </button>
        </div>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.78rem', marginTop: '10px', textAlign: 'center' }}>
          {players.length > 0 ? `${players.length} player${players.length !== 1 ? 's' : ''} ready! 🎉` : 'Need at least 1 player to start'}
        </p>
      </div>

      <RenamePlayerModal
        show={!!renameTarget}
        playerName={renameTarget?.name}
        onConfirm={handleRename}
        onClose={() => setRenameTarget(null)}
      />
      <KickPlayerModal
        show={!!kickTarget}
        playerName={kickTarget?.name}
        onConfirm={handleKick}
        onClose={() => setKickTarget(null)}
      />
    </div>
  );
}
