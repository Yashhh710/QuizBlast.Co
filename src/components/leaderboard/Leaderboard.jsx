import React, { memo } from 'react';
import ScoreRow from './ScoreRow';
import { useLeaderboard } from '../../hooks/useLeaderboard';

const Leaderboard = memo(function Leaderboard({ players, totalQ, showAcc }) {
  const { sorted } = useLeaderboard(players);

  return (
    <>
      {sorted.map((p, i) => (
        <ScoreRow
          key={p.id}
          player={p}
          rank={i}
          showAcc={showAcc}
          totalQ={totalQ}
          animDelay={i * 0.15}
        />
      ))}
    </>
  );
});

export default Leaderboard;
