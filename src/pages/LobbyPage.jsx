import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useFirebaseListener } from '../hooks/useFirebase';
import { useCountdown } from '../hooks/useCountdown';
import { kickPlayer, renamePlayer } from '../services/playerService';
import { dbDelete, dbGet, dbSet } from '../services/firebase';
import { startGame, advanceQuestion } from '../services/gameService';
import { soundPop } from '../utils/sounds';
import { spawnFloating } from '../utils/animations';
import { createBot, BOT_DIFFICULTIES } from '../utils/botPlayer';
import RoomCode from '../components/lobby/RoomCode';
import QRCodeCard from '../components/lobby/QRCodeCard';
import PlayerList from '../components/lobby/PlayerList';
import RenamePlayerModal from '../components/modals/RenamePlayerModal';
import KickPlayerModal from '../components/modals/KickPlayerModal';
import CountdownOverlay from '../components/quiz/CountdownOverlay';

const MIN_PLAYERS = 2;

export default function LobbyPage() {
  const navigate = useNavigate();
  const { roomCode, questions, timePerQ, gameMode, setCurrentQ } = useGame();
  const { counting, countNum, startCountdown } = useCountdown();

  const [players, setPlayers] = useState([]);
  const [renameTarget, setRenameTarget] = useState(null);
  const [kickTarget, setKickTarget] = useState(null);
  const [botDifficulty, setBotDifficulty] = useState('medium');
  const [showBotPanel, setShowBotPanel] = useState(false);
  const [botAdded, setBotAdded] = useState(false);
  const lastCountRef = useRef(0);

  const joinURL = window.location.origin + '/?room=' + roomCode;

  const humanPlayers = players.filter(p => !p.isBot);
  const hasBot = players.some(p => p.isBot);
  const canStart = players.length >= MIN_PLAYERS;

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
    if (!canStart) return;
    await startGame(roomCode);
    startCountdown(async () => {
      await advanceQuestion(roomCode, 0, questions.length);
      setCurrentQ(0);
      navigate('/host-question');
    }, true);
  }, [roomCode, navigate, startCountdown, setCurrentQ, questions.length, canStart]);

  const handleAddBot = useCallback(async () => {
    const bot = createBot(botDifficulty);
    await dbSet(`rooms/${roomCode}/players/${bot.id}`, bot);
    setBotAdded(true);
    setShowBotPanel(false);
  }, [roomCode, botDifficulty]);

  const handleRemoveBot = useCallback(async () => {
    const botPlayer = players.find(p => p.isBot);
    if (!botPlayer) return;
    await dbDelete(`rooms/${roomCode}/players/${botPlayer.id}`);
    setBotAdded(false);
  }, [roomCode, players]);

  const handleKickAll = useCallback(async () => {
    const ps = await dbGet(`rooms/${roomCode}/players`);
    if (!ps) return;
    await Promise.all(Object.keys(ps).map(id => dbDelete(`rooms/${roomCode}/players/${id}`)));
    setBotAdded(false);
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

  const needsMorePlayers = humanPlayers.length < MIN_PLAYERS && !hasBot;
  const statusMsg = canStart
    ? `${players.length} player${players.length !== 1 ? 's' : ''} ready! 🎉`
    : needsMorePlayers
      ? `Need at least ${MIN_PLAYERS} players to start`
      : `Waiting for more players…`;

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

        {/* ── Bot panel: show when only 1 human and no bot yet ── */}
        {humanPlayers.length < MIN_PLAYERS && !hasBot && (
          <div style={{
            background: 'rgba(255,200,54,.08)',
            border: '1.5px dashed rgba(255,200,54,.35)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginTop: '14px',
          }}>
            <p style={{ color: '#FFC836', fontWeight: 700, fontSize: '.9rem', marginBottom: '6px' }}>
              🤖 Need {MIN_PLAYERS - humanPlayers.length} more player{MIN_PLAYERS - humanPlayers.length !== 1 ? 's' : ''} to start
            </p>
            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.8rem', marginBottom: '12px' }}>
              Add an AI bot to fill the spot while you wait.
            </p>

            {showBotPanel ? (
              <div>
                <p style={{ color: '#fff', fontSize: '.82rem', fontWeight: 600, marginBottom: '8px' }}>
                  Select Bot Difficulty:
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {Object.entries(BOT_DIFFICULTIES).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setBotDifficulty(key)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: botDifficulty === key ? '2px solid #FFC836' : '2px solid rgba(255,255,255,.2)',
                        background: botDifficulty === key ? 'rgba(255,200,54,.2)' : 'rgba(255,255,255,.07)',
                        color: '#fff',
                        fontWeight: botDifficulty === key ? 700 : 400,
                        fontSize: '.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      {cfg.label}
                      <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.5)', marginTop: '2px' }}>
                        {key === 'easy' && 'Answers randomly often'}
                        {key === 'medium' && 'Balanced challenger'}
                        {key === 'hard' && 'Speedy & accurate'}
                      </div>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-yellow btn-sm" onClick={handleAddBot} style={{ flex: 1 }}>
                    ✅ Add Bot
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => setShowBotPanel(false)}
                    style={{ flex: 1, background: 'rgba(255,255,255,.1)', color: '#fff' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn btn-yellow btn-sm" onClick={() => setShowBotPanel(true)} style={{ width: '100%' }}>
                🤖 Add Bot Player
              </button>
            )}
          </div>
        )}

        {/* Remove bot option */}
        {hasBot && (
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button
              onClick={handleRemoveBot}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,.45)',
                fontSize: '.78rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Remove bot
            </button>
          </div>
        )}

        <div className="divider" />
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-yellow btn-lg"
            onClick={handleStart}
            disabled={!canStart}
            style={{ flex: 2, opacity: canStart ? 1 : 0.45 }}
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
        <p style={{ color: canStart ? 'rgba(255,255,255,.5)' : '#FFC836', fontSize: '.78rem', marginTop: '10px', textAlign: 'center' }}>
          {statusMsg}
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
