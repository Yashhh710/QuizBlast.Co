import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { usePlayer } from '../../context/PlayerContext';
import { dbGet } from '../../services/firebase';
import { joinRoom } from '../../services/playerService';
import AvatarPicker from './AvatarPicker';

export default function JoinTab() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setRoomCode, setIsHost, setQuestions, setTimePerQ, setGameMode } = useGame();
  const { setMyId, setMyName, setMyAvatar } = usePlayer();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🦁');
  const [error, setError] = useState('');

  useEffect(() => {
    const r = searchParams.get('room');
    if (r && r.length === 4) setCode(r);
  }, [searchParams]);

  const handleJoin = useCallback(async () => {
    setError('');
    if (code.length !== 4) { setError('Enter 4-digit code'); return; }
    if (!name.trim()) { setError('Enter your nickname'); return; }
    setError('Connecting…');

    try {
      const room = await dbGet(`rooms/${code}`);
      if (!room) { setError('Room not found!'); return; }
      if (room.status !== 'lobby' && room.status !== 'countdown') {
        setError('Game already running!');
        return;
      }

      const playerId = 'p_' + Date.now();
      setRoomCode(code);
      setIsHost(false);
      setMyId(playerId);
      setMyName(name.trim());
      setMyAvatar(avatar);
      setQuestions(room.questions);
      setTimePerQ(room.timePerQ);
      setGameMode(room.gameMode || 'classic');

      await joinRoom(code, playerId, name.trim(), avatar);
      navigate('/wait');
    } catch (e) {
      setError('Error connecting.');
    }
  }, [code, name, avatar, navigate, setRoomCode, setIsHost, setMyId, setMyName, setMyAvatar, setQuestions, setTimePerQ, setGameMode]);

  return (
    <div id="tab-join">
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '2.8rem' }}>🎯</div>
        <div style={{ fontFamily: 'var(--font-d)', fontSize: '1.2rem', color: '#fff', marginTop: '6px', fontWeight: 800 }}>Enter Game PIN</div>
      </div>
      <div className="field">
        <label>Room Code</label>
        <input
          type="text"
          className="pin-input"
          placeholder="0 0 0 0"
          maxLength={4}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      <div className="field">
        <label>Nickname</label>
        <input
          type="text"
          placeholder="e.g. QuizKing99"
          maxLength={20}
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>
      <AvatarPicker selected={avatar} onSelect={setAvatar} />
      <button className="btn btn-green btn-lg" onClick={handleJoin} style={{ marginTop: '4px' }}>
        🎯 Join Game
      </button>
      {error && (
        <div className="err" style={{ color: error === 'Connecting…' ? 'rgba(255,255,255,.5)' : '#ff6b6b' }}>
          {error}
        </div>
      )}
    </div>
  );
}
