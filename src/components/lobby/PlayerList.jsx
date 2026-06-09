import React, { memo } from 'react';
import PlayerCard from './PlayerCard';

const PlayerList = memo(function PlayerList({ players, onRename, onKick }) {
  if (!players || players.length === 0) {
    return (
      <p style={{ color: 'rgba(255,255,255,.4)', textAlign: 'center', fontSize: '.9rem', padding: '20px 0' }}>
        Waiting for players to join…
      </p>
    );
  }
  return (
    <div style={{ marginBottom: '14px', maxHeight: '260px', overflowY: 'auto' }}>
      {players.map(p => (
        <PlayerCard key={p.id} player={p} onRename={onRename} onKick={onKick} />
      ))}
    </div>
  );
});

export default PlayerList;
