import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GeneratingPage from './pages/GeneratingPage';
import LobbyPage from './pages/LobbyPage';
import PlayerWaitPage from './pages/PlayerWaitPage';
import HostQuestionPage from './pages/HostQuestionPage';
import PlayerQuestionPage from './pages/PlayerQuestionPage';
import LeaderboardPage from './pages/LeaderboardPage';
import FinalPage from './pages/FinalPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/generating" element={<GeneratingPage />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/wait" element={<PlayerWaitPage />} />
      <Route path="/host-question" element={<HostQuestionPage />} />
      <Route path="/player-question" element={<PlayerQuestionPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/final" element={<FinalPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
