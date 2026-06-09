import React, { useState } from 'react';
import HostTab from '../components/home/HostTab';
import JoinTab from '../components/home/JoinTab';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('host');

  return (
    <div className="screen screen-home" style={{ minHeight: '100vh' }}>
      <div className="home-hero">
        <div className="logo">⚡ Quiz<em>Blast</em></div>
        <div className="tagline">Real-time multiplayer quiz · AI-powered</div>
      </div>
      <div className="home-body">
        <div className="mode-tabs">
          <button
            className={`mode-tab${activeTab === 'host' ? ' active' : ''}`}
            onClick={() => setActiveTab('host')}
          >
            🎮 Host
          </button>
          <button
            className={`mode-tab${activeTab === 'join' ? ' active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            🙋 Join
          </button>
        </div>
        {activeTab === 'host' ? <HostTab /> : <JoinTab />}
      </div>
    </div>
  );
}
