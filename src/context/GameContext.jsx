import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { dbStopAll } from '../services/firebase';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [roomCode, setRoomCode] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [timePerQ, setTimePerQ] = useState(20);
  const [gameMode, setGameMode] = useState('classic');
  const [currentQ, setCurrentQ] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, lobby, countdown, playing, leaderboard, finished

  const reset = useCallback(() => {
    dbStopAll();
    setRoomCode(null);
    setIsHost(false);
    setQuestions([]);
    setTimePerQ(20);
    setGameMode('classic');
    setCurrentQ(0);
    setStatus('idle');
  }, []);

  return (
    <GameContext.Provider value={{
      roomCode, setRoomCode,
      isHost, setIsHost,
      questions, setQuestions,
      timePerQ, setTimePerQ,
      gameMode, setGameMode,
      currentQ, setCurrentQ,
      status, setStatus,
      reset
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
