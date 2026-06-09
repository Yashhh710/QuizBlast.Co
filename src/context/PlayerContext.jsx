import { createContext, useContext, useState, useCallback } from 'react';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [myId, setMyId] = useState(null);
  const [myName, setMyName] = useState(null);
  const [myAvatar, setMyAvatar] = useState('🦁');
  const [myScore, setMyScore] = useState(0);
  const [myStreak, setMyStreak] = useState(0);
  const [myCorrect, setMyCorrect] = useState(0);
  const [myWrong, setMyWrong] = useState(0);
  const [powerups, setPowerups] = useState({ fifty: true, time: true, skip: true });

  const resetPlayer = useCallback(() => {
    setMyId(null);
    setMyName(null);
    setMyAvatar('🦁');
    setMyScore(0);
    setMyStreak(0);
    setMyCorrect(0);
    setMyWrong(0);
    setPowerups({ fifty: true, time: true, skip: true });
  }, []);

  return (
    <PlayerContext.Provider value={{
      myId, setMyId,
      myName, setMyName,
      myAvatar, setMyAvatar,
      myScore, setMyScore,
      myStreak, setMyStreak,
      myCorrect, setMyCorrect,
      myWrong, setMyWrong,
      powerups, setPowerups,
      resetPlayer
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
