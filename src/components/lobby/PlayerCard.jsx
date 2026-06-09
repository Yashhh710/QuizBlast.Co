import React, { memo } from 'react';

const PlayerCard = memo(function PlayerCard({ player, onRename, onKick }) {
  return (
    <div className="host-player-card">
      <div className="player-avatar-lg">{player.avatar || '🎮'}</div>
      <div style={{ flex: 1 }}>
        <div className="title" style={{ fontSize: '.95rem', color: '#fff' }}>{player.name}</div>
        <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.5)' }}>Score: {player.score || 0} pts</div>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button className="icon-btn icon-btn-edit" onClick={() => onRename(player.id, player.name)}>✏️</button>
        <button className="icon-btn icon-btn-kick" onClick={() => onKick(player.id, player.name)}>🚪</button>
      </div>
    </div>
  );
});

export default PlayerCard;
