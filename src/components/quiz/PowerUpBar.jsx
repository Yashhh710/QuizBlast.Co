import React, { memo } from 'react';

const PowerUpBar = memo(function PowerUpBar({ powerups, onUse, gameMode }) {
  if (gameMode !== 'powerup') return null;

  return (
    <div className="powerup-bar">
      <button className="powerup-btn" onClick={() => onUse('50')} disabled={!powerups.fifty}>
        <span className="pu-icon">✂️</span>50/50
      </button>
      <button className="powerup-btn" onClick={() => onUse('time')} disabled={!powerups.time}>
        <span className="pu-icon">⏱️</span>+10s
      </button>
      <button className="powerup-btn" onClick={() => onUse('skip')} disabled={!powerups.skip}>
        <span className="pu-icon">⏭️</span>Skip
      </button>
    </div>
  );
});

export default PowerUpBar;
