import React, { memo } from 'react';

const CountdownOverlay = memo(function CountdownOverlay({ num }) {
  return (
    <div className="countdown-burst">
      <div className="burst-num" key={num} style={{ animation: 'burstIn .4s ease' }}>
        {num}
      </div>
    </div>
  );
});

export default CountdownOverlay;
