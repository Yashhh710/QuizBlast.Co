import React, { memo } from 'react';
import { MEDALS } from '../../utils/constants';

const ScoreRow = memo(function ScoreRow({ player, rank, showAcc, totalQ, animDelay }) {
  const acc = totalQ > 0 ? Math.round(((player.correct || 0) / totalQ) * 100) : 0;

  return (
    <div
      className={`score-row${rank === 0 ? ' top' : ''}`}
      style={{ animationDelay: `${animDelay || 0}s`, animationFillMode: 'both' }}
    >
      <span className="rank-badge">{MEDALS[rank] || `#${rank + 1}`}</span>
      <div style={{ fontSize: '1.2rem' }}>{player.avatar || '🎮'}</div>
      <span className="score-name">
        {player.name}
        {(player.streak || 0) >= 2 && (
          <span style={{ color: '#FFA602', fontSize: '.75rem' }}> 🔥{player.streak}</span>
        )}
      </span>
      <div style={{ textAlign: 'right' }}>
        <div className="score-pts">{player.score} pts</div>
        {showAcc
          ? <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.5)' }}>{acc}% acc</div>
          : <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.5)' }}>{player.correct || 0}✓ {player.wrong || 0}✗</div>
        }
      </div>
    </div>
  );
});

export default ScoreRow;
