import { useMemo } from 'react';
import { MEDALS } from '../utils/constants';

export function useLeaderboard(players) {
  const sorted = useMemo(() => {
    if (!players) return [];
    return Object.values(players).sort((a, b) => b.score - a.score);
  }, [players]);

  return { sorted, medals: MEDALS };
}
