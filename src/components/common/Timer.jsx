import React, { memo } from 'react';

const Timer = memo(function Timer({ timeLeft, timePerQ }) {
  const maxDash = 138;
  const pct = (timeLeft / timePerQ) * maxDash;
  const urgent = timeLeft <= 5;
  const color = urgent ? '#E21B3C' : '#FFC836';

  return (
    <div className="timer-circle">
      <svg width="56" height="56">
        <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="4" />
        <circle
          cx="28" cy="28" r="22" fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray="138"
          strokeDashoffset={maxDash - pct}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <span className="timer-num">{Math.max(0, timeLeft)}</span>
    </div>
  );
});

export default Timer;
