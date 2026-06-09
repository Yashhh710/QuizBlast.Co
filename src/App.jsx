import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { PlayerProvider } from './context/PlayerContext';
import { FirebaseProvider } from './context/FirebaseContext';
import { useAudio } from './hooks/useAudio';
import AppRoutes from './routes';
import './styles/globals.css';

function AudioInit() {
  useAudio();
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <FirebaseProvider>
        <GameProvider>
          <PlayerProvider>
            <AudioInit />
            <AppRoutes />
          </PlayerProvider>
        </GameProvider>
      </FirebaseProvider>
    </BrowserRouter>
  );
}
